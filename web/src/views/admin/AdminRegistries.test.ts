import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import type { Ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Registry } from '~/lib/api/types';

import AdminRegistries from './AdminRegistries.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as Ref<Registry[]> | undefined,
  loading: undefined as Ref<boolean> | undefined,
  loadData: undefined as ((page: number) => Promise<Registry[] | null>) | undefined,
  resetPage: vi.fn(),
}));

const api = vi.hoisted(() => ({
  getGlobalRegistryList: vi.fn(),
  createGlobalRegistry: vi.fn(),
  updateGlobalRegistry: vi.fn(),
  deleteGlobalRegistry: vi.fn(),
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
  pagination.data = vueRef<Registry[]>([]);
  pagination.loading = vueRef(false);
  return {
    usePagination: (loadData: (page: number) => Promise<Registry[] | null>) => {
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

function registry(address: string): Registry {
  return {
    id: address,
    repo_id: 0,
    org_id: 0,
    address,
    username: `${address}-user`,
    password: '',
    readonly: false,
  };
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

function mountRegistries() {
  return mount(AdminRegistries, {
    global: {
      plugins: [i18n],
      stubs: {
        IconButton: IconButtonStub,
        PrototypeIcon: true,
        RegistryEdit: RegistryEditStub,
      },
    },
  });
}

describe('administrator registries', () => {
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
    api.getGlobalRegistryList.mockResolvedValue([]);
  });

  it('renders loading and empty states', async () => {
    pagination.loading!.value = true;
    const wrapper = mountRegistries();
    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(true);

    pagination.loading!.value = false;
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('There are no registry credentials yet.');
  });

  it('retries active list failures and preserves confirmed rows', async () => {
    pagination.data!.value = [registry('confirmed.example.com')];
    api.getGlobalRegistryList.mockRejectedValueOnce(new Error('registries offline')).mockResolvedValueOnce([]);
    const wrapper = mountRegistries();
    await flushPromises();

    await pagination.loadData?.(2);
    await flushPromises();
    expect(wrapper.text()).toContain('confirmed.example.com');
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('registries offline');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(api.getGlobalRegistryList).toHaveBeenLastCalledWith({ page: 1 });
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('preserves editors and rows when mutations fail', async () => {
    pagination.data!.value = [registry('registry.example.com')];
    api.updateGlobalRegistry.mockRejectedValueOnce(new Error('registry save failed'));
    api.deleteGlobalRegistry.mockRejectedValueOnce(new Error('registry delete failed'));
    const wrapper = mountRegistries();
    await flushPromises();

    await wrapper.get('button[title="Edit registry"]').trigger('click');
    await wrapper.get('[data-testid="registry-save"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="registry-save"]').exists()).toBe(true);
    expect(api.notify).toHaveBeenCalledWith({ title: 'registry save failed', type: 'error' });

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show registries')!
      .trigger('click');
    await wrapper.get('button[title="Delete registry"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('registry.example.com');
    expect(api.notify).toHaveBeenCalledWith({ title: 'registry delete failed', type: 'error' });
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps the create editor open when creation fails', async () => {
    api.createGlobalRegistry.mockRejectedValueOnce(new Error('registry create failed'));
    const wrapper = mountRegistries();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add registry')!
      .trigger('click');
    await wrapper.get('[data-testid="registry-save"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="registry-save"]').exists()).toBe(true);
    expect(api.notify).toHaveBeenCalledWith({ title: 'registry create failed', type: 'error' });
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps unmounted list and mutation completions inert', async () => {
    const creation = deferred<unknown>();
    const list = deferred<Registry[]>();
    api.createGlobalRegistry.mockReturnValue(creation.promise);
    api.getGlobalRegistryList.mockReturnValueOnce(list.promise);
    const wrapper = mountRegistries();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add registry')!
      .trigger('click');
    await wrapper.get('[data-testid="registry-save"]').trigger('click');
    const listPromise = pagination.loadData?.(1);
    wrapper.unmount();
    creation.reject(new Error('obsolete mutation failure'));
    list.reject(new Error('obsolete list failure'));
    await listPromise;
    await flushPromises();

    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps an obsolete save from closing a newer editor', async () => {
    const creation = deferred<unknown>();
    api.createGlobalRegistry.mockReturnValue(creation.promise);
    const wrapper = mountRegistries();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add registry')!
      .trigger('click');
    await wrapper.get('[data-testid="registry-save"]').trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show registries')!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add registry')!
      .trigger('click');
    creation.resolve(undefined);
    await flushPromises();

    expect(wrapper.find('[data-testid="registry-save"]').exists()).toBe(true);
    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('allows a new editor to save while an obsolete save is still pending', async () => {
    const obsolete = deferred<unknown>();
    const current = deferred<unknown>();
    api.createGlobalRegistry.mockReturnValueOnce(obsolete.promise).mockReturnValueOnce(current.promise);
    const wrapper = mountRegistries();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add registry')!
      .trigger('click');
    await wrapper.get('[data-testid="registry-save"]').trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show registries')!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add registry')!
      .trigger('click');
    await wrapper.get('[data-testid="registry-save"]').trigger('click');

    expect(api.createGlobalRegistry).toHaveBeenCalledTimes(2);

    obsolete.resolve(undefined);
    await flushPromises();
    expect(api.notify).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="registry-save"]').exists()).toBe(true);

    current.resolve(undefined);
    await flushPromises();
    expect(api.notify).toHaveBeenCalledWith({ title: 'Registry credentials created', type: 'success' });
  });

  it('rejects an obsolete list failure after a newer retry owns the page', async () => {
    const oldRequest = deferred<Registry[]>();
    api.getGlobalRegistryList.mockRejectedValueOnce(new Error('initial failure'));
    const wrapper = mountRegistries();

    await pagination.loadData?.(1);
    await flushPromises();
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(true);

    api.getGlobalRegistryList.mockReturnValueOnce(oldRequest.promise).mockResolvedValueOnce([]);
    const oldPromise = pagination.loadData?.(2);
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    oldRequest.reject(new Error('obsolete page failure'));
    await oldPromise;
    await flushPromises();

    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });
});
