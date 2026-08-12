import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import type { Ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Registry } from '~/lib/api/types';

import UserRegistries from './UserRegistries.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as Ref<Registry[]> | undefined,
  loading: undefined as Ref<boolean> | undefined,
  loadData: undefined as ((page: number) => Promise<Registry[] | null>) | undefined,
  resetPage: vi.fn(),
}));
const api = vi.hoisted(() => ({
  getOrgRegistryList: vi.fn(),
  createOrgRegistry: vi.fn(),
  updateOrgRegistry: vi.fn(),
  deleteOrgRegistry: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({ default: () => api }));
vi.mock('~/compositions/useAuthentication', () => ({ default: () => ({ user: { id: 7, org_id: 23 } }) }));
vi.mock('~/compositions/useNotifications', () => ({ default: () => ({ notify: api.notify }) }));
vi.mock('~/compositions/usePaginate', async () => {
  const { ref } = await import('vue');
  pagination.data = ref<Registry[]>([]);
  pagination.loading = ref(false);
  return {
    usePagination: (loadData: (page: number) => Promise<Registry[] | null>) => {
      pagination.loadData = loadData;
      return { data: pagination.data, loading: pagination.loading, resetPage: pagination.resetPage };
    },
  };
});
vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));

const RegistryEditStub = defineComponent({
  emits: ['save'],
  setup(_, { emit }) {
    return () => h('button', { 'data-testid': 'registry-save', onClick: () => emit('save') }, 'Save');
  },
});
const IconButtonStub = defineComponent({
  props: ['title'],
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { title: props.title, onClick: () => emit('click') });
  },
});
const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const registry = (address: string): Registry => ({
  id: address,
  repo_id: 0,
  org_id: 23,
  address,
  username: 'alice',
  password: '',
  readonly: false,
});
function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}
function mountRegistries() {
  return mount(UserRegistries, {
    global: { plugins: [i18n], stubs: { RegistryEdit: RegistryEditStub, IconButton: IconButtonStub } },
  });
}

describe('user Registries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pagination.data!.value = [];
    pagination.loading!.value = false;
    pagination.resetPage.mockImplementation(async () => {
      pagination.data!.value = (await pagination.loadData?.(1)) ?? [];
    });
    api.getOrgRegistryList.mockResolvedValue([]);
  });

  it('uses the authenticated organization and renders explicit empty state', async () => {
    const wrapper = mountRegistries();
    await pagination.loadData?.(2);
    await flushPromises();
    expect(api.getOrgRegistryList).toHaveBeenCalledWith(23, { page: 2 });
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('There are no registry credentials yet.');
  });

  it('preserves an editor after an active update failure', async () => {
    pagination.data!.value = [registry('registry.example.test')];
    api.updateOrgRegistry.mockRejectedValueOnce(new Error('registry save failed'));
    const wrapper = mountRegistries();
    await flushPromises();
    await wrapper.get('button[title="Edit registry"]').trigger('click');
    await wrapper.get('[data-testid="registry-save"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="registry-save"]').exists()).toBe(true);
    expect(api.notify).toHaveBeenCalledWith({ title: 'registry save failed', type: 'error' });
  });

  it('allows a successor editor to submit while the prior save remains pending', async () => {
    const obsolete = deferred<unknown>();
    const current = deferred<unknown>();
    api.createOrgRegistry.mockReturnValueOnce(obsolete.promise).mockReturnValueOnce(current.promise);
    const wrapper = mountRegistries();
    const add = async () =>
      wrapper
        .findAll('button')
        .find((button) => button.text() === 'Add registry')!
        .trigger('click');
    const show = async () =>
      wrapper
        .findAll('button')
        .find((button) => button.text() === 'Show registries')!
        .trigger('click');
    await add();
    await wrapper.get('[data-testid="registry-save"]').trigger('click');
    await show();
    await add();
    await wrapper.get('[data-testid="registry-save"]').trigger('click');
    expect(api.createOrgRegistry).toHaveBeenCalledTimes(2);
    obsolete.resolve(undefined);
    await flushPromises();
    expect(api.notify).not.toHaveBeenCalled();
    current.resolve(undefined);
    await flushPromises();
    expect(api.notify).toHaveBeenCalledWith({ title: 'Registry credentials created', type: 'success' });
  });
});
