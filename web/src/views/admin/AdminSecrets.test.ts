import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import type { Ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Secret } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types/webhook';

import AdminSecrets from './AdminSecrets.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as Ref<Secret[]> | undefined,
  loading: undefined as Ref<boolean> | undefined,
  loadData: undefined as ((page: number) => Promise<Secret[] | null>) | undefined,
  resetPage: vi.fn(),
}));

const api = vi.hoisted(() => ({
  getGlobalSecretList: vi.fn(),
  createGlobalSecret: vi.fn(),
  updateGlobalSecret: vi.fn(),
  deleteGlobalSecret: vi.fn(),
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
  pagination.data = vueRef<Secret[]>([]);
  pagination.loading = vueRef(false);
  return {
    usePagination: (loadData: (page: number) => Promise<Secret[] | null>) => {
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
    org_id: 0,
    name,
    value: '',
    events: [WebhookEvents.Push],
    images: [],
    note: `${name} note`,
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

function mountSecrets() {
  return mount(AdminSecrets, {
    global: {
      plugins: [i18n],
      stubs: {
        IconButton: IconButtonStub,
        PrototypeIcon: true,
        SecretEdit: SecretEditStub,
      },
    },
  });
}

describe('administrator secrets', () => {
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
    api.getGlobalSecretList.mockResolvedValue([]);
  });

  it('renders loading and empty states', async () => {
    pagination.loading!.value = true;
    const wrapper = mountSecrets();
    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(true);

    pagination.loading!.value = false;
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('There are no secrets yet.');
  });

  it('retries active list failures', async () => {
    api.getGlobalSecretList.mockRejectedValueOnce(new Error('secrets offline')).mockResolvedValueOnce([]);
    const wrapper = mountSecrets();

    await pagination.loadData?.(1);
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('secrets offline');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(api.getGlobalSecretList).toHaveBeenLastCalledWith({ page: 1 });
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('keeps confirmed rows through a rejected pagination refresh', async () => {
    pagination.data!.value = [secret('CONFIRMED_TOKEN')];
    const wrapper = mountSecrets();
    await flushPromises();

    api.getGlobalSecretList.mockRejectedValueOnce(new Error('page failed'));
    await pagination.loadData?.(2);
    await flushPromises();

    expect(wrapper.text()).toContain('CONFIRMED_TOKEN');
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('page failed');
  });

  it('preserves editors and rows when mutations fail', async () => {
    pagination.data!.value = [secret('DEPLOY_TOKEN')];
    api.updateGlobalSecret.mockRejectedValueOnce(new Error('secret save failed'));
    api.deleteGlobalSecret.mockRejectedValueOnce(new Error('secret delete failed'));
    const wrapper = mountSecrets();
    await flushPromises();

    await wrapper.get('button[title="Edit secret"]').trigger('click');
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="secret-save"]').exists()).toBe(true);
    expect(api.notify).toHaveBeenCalledWith({ title: 'secret save failed', type: 'error' });

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show secrets')!
      .trigger('click');
    await wrapper.get('button[title="Delete secret"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('DEPLOY_TOKEN');
    expect(api.notify).toHaveBeenCalledWith({ title: 'secret delete failed', type: 'error' });
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps the create editor open when creation fails', async () => {
    api.createGlobalSecret.mockRejectedValueOnce(new Error('secret create failed'));
    const wrapper = mountSecrets();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add secret')!
      .trigger('click');
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="secret-save"]').exists()).toBe(true);
    expect(api.notify).toHaveBeenCalledWith({ title: 'secret create failed', type: 'error' });
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps unmounted save and list completions inert', async () => {
    const creation = deferred<unknown>();
    const list = deferred<Secret[]>();
    api.createGlobalSecret.mockReturnValue(creation.promise);
    api.getGlobalSecretList.mockReturnValueOnce(list.promise);
    const wrapper = mountSecrets();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add secret')!
      .trigger('click');
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    const listPromise = pagination.loadData?.(1);
    wrapper.unmount();
    creation.resolve(undefined);
    list.reject(new Error('obsolete list failure'));
    await listPromise;
    await flushPromises();

    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps an obsolete save from closing a newer editor', async () => {
    const creation = deferred<unknown>();
    api.createGlobalSecret.mockReturnValue(creation.promise);
    const wrapper = mountSecrets();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add secret')!
      .trigger('click');
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show secrets')!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add secret')!
      .trigger('click');
    creation.resolve(undefined);
    await flushPromises();

    expect(wrapper.find('[data-testid="secret-save"]').exists()).toBe(true);
    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('allows a new editor to save while an obsolete save is still pending', async () => {
    const obsolete = deferred<unknown>();
    const current = deferred<unknown>();
    api.createGlobalSecret.mockReturnValueOnce(obsolete.promise).mockReturnValueOnce(current.promise);
    const wrapper = mountSecrets();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add secret')!
      .trigger('click');
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show secrets')!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add secret')!
      .trigger('click');
    await wrapper.get('[data-testid="secret-save"]').trigger('click');

    expect(api.createGlobalSecret).toHaveBeenCalledTimes(2);

    obsolete.resolve(undefined);
    await flushPromises();
    expect(api.notify).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="secret-save"]').exists()).toBe(true);

    current.resolve(undefined);
    await flushPromises();
    expect(api.notify).toHaveBeenCalledWith({ title: 'Secret created', type: 'success' });
  });

  it('rejects an obsolete list failure after a newer retry owns the page', async () => {
    const oldRequest = deferred<Secret[]>();
    api.getGlobalSecretList.mockRejectedValueOnce(new Error('initial failure'));
    const wrapper = mountSecrets();

    await pagination.loadData?.(1);
    await flushPromises();
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(true);

    api.getGlobalSecretList.mockReturnValueOnce(oldRequest.promise).mockResolvedValueOnce([]);
    const oldPromise = pagination.loadData?.(2);
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    oldRequest.reject(new Error('obsolete page failure'));
    await oldPromise;
    await flushPromises();

    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });
});
