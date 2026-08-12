import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import type { Ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Org } from '~/lib/api/types';

import AdminOrgs from './AdminOrgs.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as Ref<Org[]> | undefined,
  loading: undefined as Ref<boolean> | undefined,
  loadData: undefined as ((page: number) => Promise<Org[] | null>) | undefined,
  resetPage: vi.fn(),
}));

const api = vi.hoisted(() => ({
  getOrgs: vi.fn(),
  deleteOrg: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => api,
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({ notify: api.notify }),
}));

vi.mock('~/compositions/usePaginate', async () => {
  const { ref: vueRef } = await import('vue');
  pagination.data = vueRef<Org[]>([]);
  pagination.loading = vueRef(false);
  return {
    usePagination: (loadData: (page: number) => Promise<Org[] | null>) => {
      pagination.loadData = loadData;
      return {
        data: pagination.data,
        loading: pagination.loading,
        resetPage: pagination.resetPage,
      };
    },
  };
});

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const IconButtonStub = defineComponent({
  props: ['title', 'to'],
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { title: props.title, onClick: () => emit('click') });
  },
});

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function org(id: number, name: string): Org {
  return { id, name, is_user: false };
}

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

function mountOrgs() {
  return mount(AdminOrgs, {
    global: {
      plugins: [i18n],
      stubs: {
        IconButton: IconButtonStub,
        PrototypeIcon: true,
      },
    },
  });
}

describe('administration organizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    pagination.data!.value = [];
    pagination.loading!.value = false;
    pagination.resetPage.mockImplementation(async () => {
      pagination.data!.value = [];
      pagination.data!.value = (await pagination.loadData?.(1)) ?? [];
    });
    api.getOrgs.mockResolvedValue([]);
    api.deleteOrg.mockResolvedValue(undefined);
  });

  it('renders confirmed organizations in a contained settings table', async () => {
    pagination.data!.value = [org(1, 'acme')];
    const wrapper = mountOrgs();
    await flushPromises();

    expect(wrapper.find('.admin-resource-page').classes()).toContain('min-w-0');
    expect(wrapper.getComponent({ name: 'SettingsTable' }).props('minWidth')).toBe('560px');
    expect(wrapper.text()).toContain('acme');
  });

  it('shows loading and empty states', async () => {
    pagination.loading!.value = true;
    const wrapper = mountOrgs();
    wrapper.get('[data-feedback-state="loading"]');

    pagination.loading!.value = false;
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('There are no organizations yet.');
  });

  it('retries active failures while preserving confirmed rows', async () => {
    pagination.data!.value = [org(1, 'confirmed')];
    const wrapper = mountOrgs();
    await flushPromises();

    pagination.data!.value = [];
    api.getOrgs.mockRejectedValueOnce(new Error('organizations offline')).mockResolvedValueOnce([]);
    await pagination.loadData?.(1);
    await flushPromises();

    expect(wrapper.text()).toContain('confirmed');
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('organizations offline');
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(api.getOrgs).toHaveBeenLastCalledWith({ page: 1 });
  });

  it('reports an active delete failure without clearing confirmed rows', async () => {
    pagination.data!.value = [org(1, 'acme')];
    api.deleteOrg.mockRejectedValueOnce(new Error('organization delete failed'));
    const wrapper = mountOrgs();
    await flushPromises();

    await wrapper.get('button[title="Delete organization"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('acme');
    expect(api.notify).toHaveBeenCalledWith({ title: 'organization delete failed', type: 'error' });
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps an unmounted delete completion inert', async () => {
    const deletion = deferred<unknown>();
    api.deleteOrg.mockReturnValue(deletion.promise);
    pagination.data!.value = [org(1, 'acme')];
    const wrapper = mountOrgs();
    await flushPromises();

    await wrapper.get('button[title="Delete organization"]').trigger('click');
    wrapper.unmount();
    deletion.resolve(undefined);
    await flushPromises();

    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });
});
