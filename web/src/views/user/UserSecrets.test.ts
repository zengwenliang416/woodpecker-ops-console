import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import type { Ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Secret } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types';

import UserSecrets from './UserSecrets.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as Ref<Secret[]> | undefined,
  loading: undefined as Ref<boolean> | undefined,
  loadData: undefined as ((page: number) => Promise<Secret[] | null>) | undefined,
  resetPage: vi.fn(),
}));
const api = vi.hoisted(() => ({
  getOrgSecretList: vi.fn(),
  createOrgSecret: vi.fn(),
  updateOrgSecret: vi.fn(),
  deleteOrgSecret: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({ default: () => api }));
vi.mock('~/compositions/useAuthentication', () => ({ default: () => ({ user: { id: 7, org_id: 23 } }) }));
vi.mock('~/compositions/useNotifications', () => ({ default: () => ({ notify: api.notify }) }));
vi.mock('~/compositions/usePaginate', async () => {
  const { ref } = await import('vue');
  pagination.data = ref<Secret[]>([]);
  pagination.loading = ref(false);
  return {
    usePagination: (loadData: (page: number) => Promise<Secret[] | null>) => {
      pagination.loadData = loadData;
      return { data: pagination.data, loading: pagination.loading, resetPage: pagination.resetPage };
    },
  };
});
vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));

const SecretEditStub = defineComponent({
  emits: ['save'],
  setup(_, { emit }) {
    return () => h('button', { 'data-testid': 'secret-save', onClick: () => emit('save') }, 'Save');
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

function secret(name: string): Secret {
  return {
    id: name,
    repo_id: 0,
    org_id: 23,
    name,
    value: '',
    events: [WebhookEvents.Push],
    images: [],
    note: '',
  };
}
function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}
function mountSecrets() {
  return mount(UserSecrets, {
    global: { plugins: [i18n], stubs: { SecretEdit: SecretEditStub, IconButton: IconButtonStub } },
  });
}

describe('user Secrets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    pagination.data!.value = [];
    pagination.loading!.value = false;
    pagination.resetPage.mockImplementation(async () => {
      pagination.data!.value = (await pagination.loadData?.(1)) ?? [];
    });
    api.getOrgSecretList.mockResolvedValue([]);
  });

  it('uses the authenticated organization and renders explicit empty state', async () => {
    const wrapper = mountSecrets();
    await pagination.loadData?.(2);
    await flushPromises();
    expect(api.getOrgSecretList).toHaveBeenCalledWith(23, { page: 2 });
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('There are no secrets yet.');
  });

  it('keeps confirmed rows and the active editor when mutations fail', async () => {
    pagination.data!.value = [secret('DEPLOY_TOKEN')];
    api.updateOrgSecret.mockRejectedValueOnce(new Error('save failed'));
    const wrapper = mountSecrets();
    await flushPromises();
    await wrapper.get('button[title="Edit secret"]').trigger('click');
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="secret-save"]').exists()).toBe(true);
    expect(api.notify).toHaveBeenCalledWith({ title: 'save failed', type: 'error' });
  });

  it('allows a successor editor to save while an obsolete save is pending', async () => {
    const obsolete = deferred<unknown>();
    const current = deferred<unknown>();
    api.createOrgSecret.mockReturnValueOnce(obsolete.promise).mockReturnValueOnce(current.promise);
    const wrapper = mountSecrets();
    const add = async () =>
      wrapper
        .findAll('button')
        .find((button) => button.text() === 'Add secret')!
        .trigger('click');
    const show = async () =>
      wrapper
        .findAll('button')
        .find((button) => button.text() === 'Show secrets')!
        .trigger('click');

    await add();
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    await show();
    await add();
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    expect(api.createOrgSecret).toHaveBeenCalledTimes(2);

    obsolete.resolve(undefined);
    await flushPromises();
    expect(wrapper.find('[data-testid="secret-save"]').exists()).toBe(true);
    expect(api.notify).not.toHaveBeenCalled();

    current.resolve(undefined);
    await flushPromises();
    expect(api.notify).toHaveBeenCalledWith({ title: 'Secret created', type: 'success' });
  });
});
