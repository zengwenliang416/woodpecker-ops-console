import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Org, Registry } from '~/lib/api/types';

import OrgRegistries from './OrgRegistries.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as ReturnType<typeof ref<Registry[]>> | undefined,
  loading: undefined as ReturnType<typeof ref<boolean>> | undefined,
  loadData: undefined as ((page: number, level: 'org' | 'global') => Promise<Registry[] | null>) | undefined,
  resetPage: vi.fn(),
}));

const api = vi.hoisted(() => ({
  getOrgRegistryList: vi.fn(),
  getGlobalRegistryList: vi.fn(),
  createOrgRegistry: vi.fn(),
  updateOrgRegistry: vi.fn(),
  deleteOrgRegistry: vi.fn(),
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
    usePagination: (loadData: (page: number, level: 'org' | 'global') => Promise<Registry[] | null>) => {
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

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

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

function registry(id: string, address: string, orgId: number): Registry {
  return {
    id,
    repo_id: 0,
    org_id: orgId,
    address,
    username: `${id}-user`,
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

function mountRegistries(
  org = ref<Org | undefined>({ id: 1, name: 'acme', is_user: false } as Org),
  orgLifecycle = ref(1),
) {
  return {
    org,
    orgLifecycle,
    wrapper: mount(OrgRegistries, {
      props: { orgId: `${org.value!.id}` },
      global: {
        plugins: [i18n],
        provide: {
          org,
          'org-lifecycle': orgLifecycle,
        },
        stubs: {
          IconButton: IconButtonStub,
          PrototypeIcon: true,
          RegistryEdit: RegistryEditStub,
        },
      },
    }),
  };
}

describe('organization registries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    pagination.data!.value = [];
    pagination.loading!.value = false;
    pagination.resetPage.mockImplementation(async () => {
      const orgRows = (await pagination.loadData?.(1, 'org')) ?? [];
      const globalRows = (await pagination.loadData?.(1, 'global')) ?? [];
      pagination.data!.value = [...orgRows, ...globalRows];
    });
    api.getOrgRegistryList.mockResolvedValue([]);
    api.getGlobalRegistryList.mockResolvedValue([]);
  });

  it('prefers organization credentials and keeps inherited global rows read only', () => {
    pagination.data!.value = [
      registry('global-duplicate', 'registry.example.com', 0),
      registry('org-duplicate', 'registry.example.com', 1),
      registry('global-only', 'global.example.com', 0),
    ];

    const { wrapper } = mountRegistries();

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.text().includes('registry.example.com'))!.text()).toContain('org-duplicate-user');
    expect(rows.find((row) => row.text().includes('registry.example.com'))!.findAll('button')).toHaveLength(2);
    expect(rows.find((row) => row.text().includes('global.example.com'))!.text()).toContain('Inherited');
    expect(rows.find((row) => row.text().includes('global.example.com'))!.findAll('button')).toHaveLength(0);
  });

  it('retries active GET failures and keeps confirmed rows during rejected pagination', async () => {
    pagination.data!.value = [registry('confirmed', 'confirmed.example.com', 1)];
    const { wrapper } = mountRegistries();
    await flushPromises();

    api.getOrgRegistryList.mockRejectedValueOnce(new Error('registries offline')).mockResolvedValueOnce([]);
    await pagination.loadData?.(2, 'org');
    await flushPromises();
    expect(wrapper.text()).toContain('confirmed.example.com');
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('registries offline');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(api.getOrgRegistryList).toHaveBeenLastCalledWith(1, { page: 1 });
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('suppresses stale save and delete completions across A to B to A', async () => {
    const update = deferred<unknown>();
    const deletion = deferred<unknown>();
    api.updateOrgRegistry.mockReturnValue(update.promise);
    api.deleteOrgRegistry.mockReturnValue(deletion.promise);
    pagination.data!.value = [registry('org', 'registry.example.com', 1)];
    const { org, orgLifecycle, wrapper } = mountRegistries();
    await flushPromises();

    await wrapper.get('button[title="Edit registry"]').trigger('click');
    await wrapper.get('[data-testid="registry-save"]').trigger('click');
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
      .find((button) => button.text() === 'Show registries')!
      .trigger('click');
    pagination.data!.value = [registry('delete', 'delete.example.com', 1)];
    await flushPromises();
    await wrapper.get('button[title="Delete registry"]').trigger('click');
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
    pagination.data!.value = [registry('org', 'registry.example.com', 1)];
    api.updateOrgRegistry.mockRejectedValueOnce(new Error('registry save failed'));
    api.deleteOrgRegistry.mockRejectedValueOnce(new Error('registry delete failed'));
    const { wrapper } = mountRegistries();
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

  it('keeps the create editor open when an active create fails', async () => {
    api.createOrgRegistry.mockRejectedValueOnce(new Error('registry create failed'));
    const { wrapper } = mountRegistries();

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

  it('resets confirmed rows and ignores obsolete rejected mutations when the organization changes', async () => {
    const creation = deferred<unknown>();
    api.createOrgRegistry.mockReturnValue(creation.promise);
    pagination.data!.value = [registry('org', 'registry.example.com', 1)];
    const { org, orgLifecycle, wrapper } = mountRegistries();
    await flushPromises();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add registry')!
      .trigger('click');
    await wrapper.get('[data-testid="registry-save"]').trigger('click');
    org.value = { id: 2, name: 'other', is_user: false };
    orgLifecycle.value = 2;
    await nextTick();
    creation.reject(new Error('obsolete registry failure'));
    await flushPromises();

    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('registry.example.com');
  });

  it('keeps an unmounted rejected mutation inert after the organization is cleared', async () => {
    const creation = deferred<unknown>();
    api.createOrgRegistry.mockReturnValue(creation.promise);
    const { org, orgLifecycle, wrapper } = mountRegistries();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add registry')!
      .trigger('click');
    await wrapper.get('[data-testid="registry-save"]').trigger('click');
    const resetCalls = pagination.resetPage.mock.calls.length;
    wrapper.unmount();
    orgLifecycle.value = 2;
    org.value = undefined;
    creation.reject(new Error('obsolete registry failure'));
    await flushPromises();

    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).toHaveBeenCalledTimes(resetCalls);
  });
});
