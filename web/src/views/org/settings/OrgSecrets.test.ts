import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Org, Secret } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types/webhook';

import OrgSecrets from './OrgSecrets.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as ReturnType<typeof ref<Secret[]>> | undefined,
  loading: undefined as ReturnType<typeof ref<boolean>> | undefined,
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
  props: ['modelValue'],
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

function secret(name: string, orgId = 1): Secret {
  return {
    id: name,
    repo_id: 0,
    org_id: orgId,
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

function mountSecrets(
  org = ref<Org | undefined>({ id: 1, name: 'acme', is_user: false } as Org),
  orgLifecycle = ref(1),
) {
  return {
    org,
    orgLifecycle,
    wrapper: mount(OrgSecrets, {
      props: { orgId: `${org.value!.id}` },
      global: {
        plugins: [i18n],
        provide: { org, 'org-lifecycle': orgLifecycle },
        stubs: {
          IconButton: IconButtonStub,
          PrototypeIcon: true,
          SecretEdit: SecretEditStub,
        },
      },
    }),
  };
}

describe('organization secrets', () => {
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

  it('renders organization secrets and retries active GET failures', async () => {
    pagination.data!.value = [secret('DEPLOY_TOKEN')];
    const { wrapper } = mountSecrets();
    expect(wrapper.text()).toContain('DEPLOY_TOKEN');

    api.getOrgSecretList.mockRejectedValueOnce(new Error('secrets offline')).mockResolvedValueOnce([]);
    await pagination.loadData?.(1);
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('secrets offline');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(api.getOrgSecretList).toHaveBeenLastCalledWith(1, { page: 1 });
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('suppresses obsolete create completion after the organization changes', async () => {
    const creation = deferred<unknown>();
    api.createOrgSecret.mockReturnValue(creation.promise);
    const { org, wrapper } = mountSecrets();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add secret')!
      .trigger('click');
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    org.value = { id: 2, name: 'other', is_user: false };
    await nextTick();
    creation.resolve(undefined);
    await flushPromises();

    expect(api.createOrgSecret).toHaveBeenCalledWith(1, expect.objectContaining({ name: '' }));
    expect(api.notify).not.toHaveBeenCalled();
  });

  it('suppresses stale update and delete completions across A to B to A', async () => {
    const update = deferred<unknown>();
    const deletion = deferred<unknown>();
    api.updateOrgSecret.mockReturnValue(update.promise);
    api.deleteOrgSecret.mockReturnValue(deletion.promise);
    pagination.data!.value = [secret('DEPLOY_TOKEN')];
    const { org, orgLifecycle, wrapper } = mountSecrets();
    await flushPromises();

    await wrapper.get('button[title="Edit secret"]').trigger('click');
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    org.value = { id: 2, name: 'other', is_user: false };
    orgLifecycle.value = 2;
    await nextTick();
    org.value = { id: 1, name: 'acme', is_user: false };
    orgLifecycle.value = 3;
    await nextTick();
    update.resolve(undefined);
    await flushPromises();
    expect(api.notify).not.toHaveBeenCalled();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show secrets')!
      .trigger('click');
    pagination.data!.value = [secret('DELETE_TOKEN')];
    await flushPromises();
    await wrapper.get('button[title="Delete secret"]').trigger('click');
    org.value = { id: 2, name: 'other', is_user: false };
    orgLifecycle.value = 4;
    await nextTick();
    org.value = { id: 1, name: 'acme', is_user: false };
    orgLifecycle.value = 5;
    await nextTick();
    deletion.resolve(undefined);
    await flushPromises();
    expect(api.notify).not.toHaveBeenCalled();
  });

  it('shows active mutation failures while preserving the editor and confirmed rows', async () => {
    pagination.data!.value = [secret('DEPLOY_TOKEN')];
    api.updateOrgSecret.mockRejectedValueOnce(new Error('secret save failed'));
    api.deleteOrgSecret.mockRejectedValueOnce(new Error('secret delete failed'));
    const { wrapper } = mountSecrets();
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

  it('keeps the create editor open when an active create fails', async () => {
    api.createOrgSecret.mockRejectedValueOnce(new Error('secret create failed'));
    const { wrapper } = mountSecrets();

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

  it('keeps confirmed rows through a rejected pagination refresh', async () => {
    pagination.data!.value = [secret('CONFIRMED_TOKEN')];
    const { wrapper } = mountSecrets();
    await flushPromises();

    api.getOrgSecretList.mockRejectedValueOnce(new Error('page failed'));
    await pagination.loadData?.(2);
    await flushPromises();

    expect(wrapper.text()).toContain('CONFIRMED_TOKEN');
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('page failed');
  });

  it('ignores an obsolete rejected save after the organization lifecycle changes', async () => {
    const creation = deferred<unknown>();
    api.createOrgSecret.mockReturnValue(creation.promise);
    const { org, orgLifecycle, wrapper } = mountSecrets();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add secret')!
      .trigger('click');
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    org.value = { id: 2, name: 'other', is_user: false };
    orgLifecycle.value = 2;
    await nextTick();
    creation.reject(new Error('obsolete failure'));
    await flushPromises();

    expect(api.notify).not.toHaveBeenCalled();
  });

  it('keeps an unmounted mutation completion inert after the organization is cleared', async () => {
    const creation = deferred<unknown>();
    api.createOrgSecret.mockReturnValue(creation.promise);
    const { org, orgLifecycle, wrapper } = mountSecrets();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add secret')!
      .trigger('click');
    await wrapper.get('[data-testid="secret-save"]').trigger('click');
    const resetCalls = pagination.resetPage.mock.calls.length;
    wrapper.unmount();
    orgLifecycle.value = 2;
    org.value = undefined;
    creation.resolve(undefined);
    await flushPromises();

    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).toHaveBeenCalledTimes(resetCalls);
  });
});
