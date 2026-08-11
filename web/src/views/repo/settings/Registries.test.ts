import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Registry, Repo } from '~/lib/api/types';

import Registries from './Registries.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as ReturnType<typeof ref<Registry[]>> | undefined,
  loading: undefined as ReturnType<typeof ref<boolean>> | undefined,
  loadData: undefined as ((page: number, level: 'repo' | 'org' | 'global') => Promise<Registry[] | null>) | undefined,
  resetPage: vi.fn(),
}));

const api = vi.hoisted(() => ({
  getRegistryList: vi.fn(),
  getOrgRegistryList: vi.fn(),
  getGlobalRegistryList: vi.fn(),
  createRegistry: vi.fn(),
  updateRegistry: vi.fn(),
  deleteRegistry: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getRegistryList: api.getRegistryList,
    getOrgRegistryList: api.getOrgRegistryList,
    getGlobalRegistryList: api.getGlobalRegistryList,
    createRegistry: api.createRegistry,
    updateRegistry: api.updateRegistry,
    deleteRegistry: api.deleteRegistry,
  }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: api.notify,
  }),
}));

vi.mock('~/compositions/usePaginate', async () => {
  const { ref: vueRef } = await import('vue');
  pagination.data = vueRef<Registry[]>([]);
  pagination.loading = vueRef(false);
  return {
    usePagination: (loadData: (page: number, level: 'repo' | 'org' | 'global') => Promise<Registry[] | null>) => {
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

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

const RegistryEditStub = defineComponent({
  setup() {
    return () => h('div', { 'data-testid': 'registry-editor' });
  },
});

function registry(id: string, address: string, repoId: number, orgId: number, readonly = false): Registry {
  return {
    id,
    repo_id: repoId,
    org_id: orgId,
    address,
    username: 'robot',
    password: '',
    readonly,
  };
}

function deferred<T>() {
  let resolveValue!: (value: T) => void;
  let rejectValue!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveValue = resolve;
    rejectValue = reject;
  });
  return { promise, reject: rejectValue, resolve: resolveValue };
}

function mountRegistries(repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo)) {
  return mount(Registries, {
    global: {
      plugins: [i18n],
      provide: {
        repo: repository,
      },
      stubs: {
        PrototypeIcon: true,
        RegistryEdit: RegistryEditStub,
      },
    },
  });
}

describe('repository registries settings', () => {
  beforeEach(() => {
    pagination.data!.value = [];
    pagination.loading!.value = false;
    pagination.resetPage.mockReset();
    api.getRegistryList.mockReset();
    api.getOrgRegistryList.mockReset();
    api.getGlobalRegistryList.mockReset();
    api.createRegistry.mockReset();
    api.updateRegistry.mockReset();
    api.deleteRegistry.mockReset();
    api.notify.mockReset();

    let resetGeneration = 0;
    pagination.resetPage.mockImplementation(async () => {
      const requestGeneration = ++resetGeneration;
      pagination.data!.value = [];
      pagination.loading!.value = true;
      const rows: Registry[] = [];
      for (const level of ['repo', 'org', 'global'] as const) {
        rows.push(...((await pagination.loadData?.(1, level)) ?? []));
      }
      if (requestGeneration !== resetGeneration) {
        return;
      }
      pagination.data!.value = rows;
      pagination.loading!.value = false;
    });
  });

  it('preserves repository precedence, readonly state, and inherited boundaries', () => {
    pagination.data!.value = [
      registry('repo', 'ghcr.io', 101, 0),
      registry('org', 'registry.example.com', 0, 1),
      registry('readonly', 'mirror.example.com', 101, 0, true),
    ];

    const wrapper = mount(Registries, {
      global: {
        plugins: [i18n],
        provide: {
          repo: ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo),
        },
        stubs: {
          PrototypeIcon: true,
          RegistryEdit: RegistryEditStub,
        },
      },
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0].text()).toContain('ghcr.io');
    expect(rows[0].findAll('button')).toHaveLength(2);
    expect(rows[1].text()).toContain('mirror.example.com');
    expect(rows[1].text()).toContain('Read only');
    expect(rows[1].findAll('button')).toHaveLength(1);
    expect(rows[2].text()).toContain('Inherited');
    expect(rows[2].findAll('button')).toHaveLength(0);
  });

  it('renders a retryable GET error and reloads through the pagination owner', async () => {
    api.getRegistryList.mockRejectedValueOnce(new Error('registries offline')).mockResolvedValueOnce([]);
    pagination.resetPage.mockImplementation(async () => {
      await pagination.loadData?.(1, 'repo');
    });

    const wrapper = mount(Registries, {
      global: {
        plugins: [i18n],
        provide: {
          repo: ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo),
        },
        stubs: {
          PrototypeIcon: true,
          RegistryEdit: RegistryEditStub,
        },
      },
    });

    await pagination.loadData?.(1, 'repo');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('registries offline');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(pagination.resetPage).toHaveBeenCalledTimes(1);
    expect(api.getRegistryList).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('preserves confirmed rows when a page-two reset starts a rejected page-one load asynchronously', async () => {
    const replacement = deferred<Registry[]>();
    pagination.data!.value = [registry('repo', 'ghcr.io', 101, 0)];
    api.getRegistryList.mockReturnValue(replacement.promise);
    api.getOrgRegistryList.mockResolvedValue([]);
    api.getGlobalRegistryList.mockResolvedValue([]);
    pagination.resetPage.mockImplementation(async () => {
      pagination.data!.value = [];
      void nextTick(async () => {
        pagination.loading!.value = true;
        const rows: Registry[] = [];
        for (const level of ['repo', 'org', 'global'] as const) {
          rows.push(...((await pagination.loadData?.(1, level)) ?? []));
        }
        pagination.data!.value = rows;
        pagination.loading!.value = false;
      });
    });
    const wrapper = mountRegistries();

    const reload = (wrapper.vm as unknown as { reloadRegistries: () => Promise<void> }).reloadRegistries();
    await nextTick();
    expect(pagination.loading!.value).toBe(true);
    expect(wrapper.get('tbody tr').text()).toContain('ghcr.io');

    replacement.reject(new Error('registries offline'));
    await reload;
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('registries offline');
    expect(wrapper.get('tbody tr').text()).toContain('ghcr.io');
  });

  it('discards an obsolete fulfilled refresh after the repository changes', async () => {
    const oldRows = deferred<Registry[]>();
    const newRows = deferred<Registry[]>();
    pagination.data!.value = [registry('confirmed', 'confirmed.example.com', 101, 0)];
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    api.getRegistryList.mockImplementation(async (repoId: number) =>
      repoId === 101 ? oldRows.promise : newRows.promise,
    );
    api.getOrgRegistryList.mockResolvedValue([]);
    api.getGlobalRegistryList.mockResolvedValue([]);
    const wrapper = mountRegistries(repository);
    const reload = (wrapper.vm as unknown as { reloadRegistries: () => Promise<void> }).reloadRegistries;

    const obsoleteReload = reload();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    newRows.resolve([registry('new', 'new.example.com', 202, 0)]);
    await flushPromises();
    oldRows.resolve([registry('old', 'obsolete.example.com', 101, 0)]);
    await obsoleteReload;
    await flushPromises();

    expect(wrapper.get('tbody tr').text()).toContain('new.example.com');
    expect(wrapper.text()).not.toContain('obsolete.example.com');
  });

  it('ignores an obsolete rejected refresh after the repository changes', async () => {
    const oldRows = deferred<Registry[]>();
    const newRows = deferred<Registry[]>();
    pagination.data!.value = [registry('confirmed', 'confirmed.example.com', 101, 0)];
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    api.getRegistryList.mockImplementation(async (repoId: number) =>
      repoId === 101 ? oldRows.promise : newRows.promise,
    );
    api.getOrgRegistryList.mockResolvedValue([]);
    api.getGlobalRegistryList.mockResolvedValue([]);
    const wrapper = mountRegistries(repository);
    const reload = (wrapper.vm as unknown as { reloadRegistries: () => Promise<void> }).reloadRegistries;

    const obsoleteReload = reload();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    newRows.resolve([registry('new', 'new.example.com', 202, 0)]);
    await flushPromises();
    oldRows.reject(new Error('obsolete registries failure'));
    await obsoleteReload;
    await flushPromises();

    expect(wrapper.get('tbody tr').text()).toContain('new.example.com');
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('ignores an obsolete rejection after returning to the same repository', async () => {
    const oldRows = deferred<Registry[]>();
    let repoACalls = 0;
    pagination.data!.value = [registry('confirmed', 'confirmed.example.com', 101, 0)];
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    api.getRegistryList.mockImplementation(async (repoId: number) => {
      if (repoId === 202) {
        return [registry('repo-b', 'repo-b.example.com', 202, 0)];
      }
      repoACalls += 1;
      return repoACalls === 1 ? oldRows.promise : [registry('current-a', 'current-a.example.com', 101, 0)];
    });
    api.getOrgRegistryList.mockResolvedValue([]);
    api.getGlobalRegistryList.mockResolvedValue([]);
    const wrapper = mountRegistries(repository);
    const reload = (wrapper.vm as unknown as { reloadRegistries: () => Promise<void> }).reloadRegistries;

    const obsoleteReload = reload();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    oldRows.reject(new Error('obsolete first repository failure'));
    await obsoleteReload;
    await flushPromises();

    expect(wrapper.get('tbody tr').text()).toContain('current-a.example.com');
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);

    pagination.data!.value = [registry('live-a', 'live-a.example.com', 101, 0)];
    await nextTick();
    expect(wrapper.get('tbody tr').text()).toContain('live-a.example.com');
  });

  it('does not close or reload the current editor when an obsolete save succeeds after returning to the same repository', async () => {
    const pending = deferred<unknown>();
    pagination.data!.value = [registry('repo', 'ghcr.io', 101, 0)];
    api.updateRegistry.mockReturnValue(pending.promise);
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    const wrapper = mountRegistries(repository);

    await wrapper.get('[title="Edit registry"]').trigger('click');
    const obsoleteSave = (wrapper.vm as unknown as { createRegistry: () => Promise<void> }).createRegistry();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add registry')!
      .trigger('click');
    pending.resolve(undefined);
    await obsoleteSave;
    await flushPromises();

    expect(wrapper.find('[data-testid="registry-editor"]').exists()).toBe(true);
    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).toHaveBeenCalledTimes(2);
  });

  it('does not close or reload the current editor when an obsolete save rejects after returning to the same repository', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const pending = deferred<unknown>();
    pagination.data!.value = [registry('repo', 'ghcr.io', 101, 0)];
    api.updateRegistry.mockReturnValue(pending.promise);
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    const wrapper = mountRegistries(repository);

    await wrapper.get('[title="Edit registry"]').trigger('click');
    const obsoleteSave = (wrapper.vm as unknown as { createRegistry: () => Promise<void> }).createRegistry();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add registry')!
      .trigger('click');
    pending.reject(new Error('obsolete registry save failure'));
    await obsoleteSave;
    await flushPromises();

    expect(wrapper.find('[data-testid="registry-editor"]').exists()).toBe(true);
    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });

  it('does not announce or reload when an obsolete deletion completes after returning to the same repository', async () => {
    const pending = deferred<unknown>();
    const row = registry('repo', 'ghcr.io', 101, 0);
    pagination.data!.value = [row];
    api.deleteRegistry.mockReturnValue(pending.promise);
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    const wrapper = mountRegistries(repository);

    const obsoleteDelete = (
      wrapper.vm as unknown as { deleteRegistry: (registry: Registry) => Promise<void> }
    ).deleteRegistry(row);
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    pending.resolve(undefined);
    await obsoleteDelete;
    await flushPromises();

    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).toHaveBeenCalledTimes(2);
  });

  it('clears editor state and reloads when the repository changes', async () => {
    pagination.data!.value = [registry('repo', 'ghcr.io', 101, 0)];
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    const wrapper = mount(Registries, {
      global: {
        plugins: [i18n],
        provide: {
          repo: repository,
        },
        stubs: {
          PrototypeIcon: true,
          RegistryEdit: RegistryEditStub,
        },
      },
    });

    await wrapper.get('[title="Edit registry"]').trigger('click');
    expect(wrapper.find('[data-testid="registry-editor"]').exists()).toBe(true);
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();

    expect(pagination.resetPage).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="registry-editor"]').exists()).toBe(false);
  });
});
