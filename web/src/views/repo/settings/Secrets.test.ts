import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Repo, Secret } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types/webhook';

import Secrets from './Secrets.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as ReturnType<typeof ref<Secret[]>> | undefined,
  loading: undefined as ReturnType<typeof ref<boolean>> | undefined,
  loadData: undefined as ((page: number, level: 'repo' | 'org' | 'global') => Promise<Secret[] | null>) | undefined,
  resetPage: vi.fn(),
}));

const api = vi.hoisted(() => ({
  getSecretList: vi.fn(),
  getOrgSecretList: vi.fn(),
  getGlobalSecretList: vi.fn(),
  createSecret: vi.fn(),
  updateSecret: vi.fn(),
  deleteSecret: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getSecretList: api.getSecretList,
    getOrgSecretList: api.getOrgSecretList,
    getGlobalSecretList: api.getGlobalSecretList,
    createSecret: api.createSecret,
    updateSecret: api.updateSecret,
    deleteSecret: api.deleteSecret,
  }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: api.notify,
  }),
}));

vi.mock('~/compositions/usePaginate', async () => {
  const { ref: vueRef } = await import('vue');
  pagination.data = vueRef<Secret[]>([]);
  pagination.loading = vueRef(false);
  return {
    usePagination: (loadData: (page: number, level: 'repo' | 'org' | 'global') => Promise<Secret[] | null>) => {
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

const SecretEditStub = defineComponent({
  setup() {
    return () => h('div', { 'data-testid': 'secret-editor' });
  },
});

function secret(id: string, name: string, repoId: number, orgId: number): Secret {
  return {
    id,
    repo_id: repoId,
    org_id: orgId,
    name,
    value: '',
    events: [WebhookEvents.Push],
    images: [],
    note: `${name} note`,
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

function mountSecrets(repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo)) {
  return mount(Secrets, {
    global: {
      plugins: [i18n],
      provide: {
        repo: repository,
      },
      stubs: {
        PrototypeIcon: true,
        SecretEdit: SecretEditStub,
      },
    },
  });
}

describe('repository secrets settings', () => {
  beforeEach(() => {
    pagination.data!.value = [];
    pagination.loading!.value = false;
    pagination.resetPage.mockReset();
    api.getSecretList.mockReset();
    api.getOrgSecretList.mockReset();
    api.getGlobalSecretList.mockReset();
    api.createSecret.mockReset();
    api.updateSecret.mockReset();
    api.deleteSecret.mockReset();
    api.notify.mockReset();

    let resetGeneration = 0;
    pagination.resetPage.mockImplementation(async () => {
      const requestGeneration = ++resetGeneration;
      pagination.data!.value = [];
      pagination.loading!.value = true;
      const rows: Secret[] = [];
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

  it('shows repository entries as editable and inherited entries as read only', () => {
    pagination.data!.value = [
      secret('repo', 'DEPLOY_TOKEN', 101, 0),
      secret('org', 'SHARED_TOKEN', 0, 1),
      secret('global', 'GLOBAL_TOKEN', 0, 0),
    ];

    const wrapper = mount(Secrets, {
      global: {
        plugins: [i18n],
        provide: {
          repo: ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo),
        },
        stubs: {
          PrototypeIcon: true,
          SecretEdit: SecretEditStub,
        },
      },
    });

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0].text()).toContain('DEPLOY_TOKEN');
    expect(rows[0].text()).toContain('Repository');
    expect(rows[0].findAll('button')).toHaveLength(2);
    expect(rows[1].text()).toContain('Inherited');
    expect(rows[1].findAll('button')).toHaveLength(0);
    expect(rows[2].text()).toContain('Global');
  });

  it('renders an explicit empty state instead of an empty table', () => {
    const wrapper = mount(Secrets, {
      global: {
        plugins: [i18n],
        provide: {
          repo: ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo),
        },
        stubs: {
          PrototypeIcon: true,
          SecretEdit: SecretEditStub,
        },
      },
    });

    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('There are no secrets');
    expect(wrapper.find('table').exists()).toBe(false);
  });

  it('renders a retryable GET error and reloads through the pagination owner', async () => {
    api.getSecretList.mockRejectedValueOnce(new Error('secrets offline')).mockResolvedValueOnce([]);
    pagination.resetPage.mockImplementation(async () => {
      await pagination.loadData?.(1, 'repo');
    });

    const wrapper = mount(Secrets, {
      global: {
        plugins: [i18n],
        provide: {
          repo: ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo),
        },
        stubs: {
          PrototypeIcon: true,
          SecretEdit: SecretEditStub,
        },
      },
    });

    await pagination.loadData?.(1, 'repo');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('secrets offline');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(pagination.resetPage).toHaveBeenCalledTimes(1);
    expect(api.getSecretList).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('preserves confirmed rows when a page-two reset starts a rejected page-one load asynchronously', async () => {
    const replacement = deferred<Secret[]>();
    pagination.data!.value = [secret('repo', 'DEPLOY_TOKEN', 101, 0)];
    api.getSecretList.mockReturnValue(replacement.promise);
    api.getOrgSecretList.mockResolvedValue([]);
    api.getGlobalSecretList.mockResolvedValue([]);
    pagination.resetPage.mockImplementation(async () => {
      pagination.data!.value = [];
      void nextTick(async () => {
        pagination.loading!.value = true;
        const rows: Secret[] = [];
        for (const level of ['repo', 'org', 'global'] as const) {
          rows.push(...((await pagination.loadData?.(1, level)) ?? []));
        }
        pagination.data!.value = rows;
        pagination.loading!.value = false;
      });
    });
    const wrapper = mountSecrets();

    const reload = (wrapper.vm as unknown as { reloadSecrets: () => Promise<void> }).reloadSecrets();
    await nextTick();
    expect(pagination.loading!.value).toBe(true);
    expect(wrapper.get('tbody tr').text()).toContain('DEPLOY_TOKEN');

    replacement.reject(new Error('secrets offline'));
    await reload;
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('secrets offline');
    expect(wrapper.get('tbody tr').text()).toContain('DEPLOY_TOKEN');
  });

  it('discards an obsolete fulfilled refresh after the repository changes', async () => {
    const oldRows = deferred<Secret[]>();
    const newRows = deferred<Secret[]>();
    pagination.data!.value = [secret('confirmed', 'CONFIRMED_TOKEN', 101, 0)];
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    api.getSecretList.mockImplementation(async (repoId: number) =>
      repoId === 101 ? oldRows.promise : newRows.promise,
    );
    api.getOrgSecretList.mockResolvedValue([]);
    api.getGlobalSecretList.mockResolvedValue([]);
    const wrapper = mountSecrets(repository);
    const reload = (wrapper.vm as unknown as { reloadSecrets: () => Promise<void> }).reloadSecrets;

    const obsoleteReload = reload();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    newRows.resolve([secret('new', 'NEW_TOKEN', 202, 0)]);
    await flushPromises();
    oldRows.resolve([secret('old', 'OBSOLETE_TOKEN', 101, 0)]);
    await obsoleteReload;
    await flushPromises();

    expect(wrapper.get('tbody tr').text()).toContain('NEW_TOKEN');
    expect(wrapper.text()).not.toContain('OBSOLETE_TOKEN');
  });

  it('ignores an obsolete rejected refresh after the repository changes', async () => {
    const oldRows = deferred<Secret[]>();
    const newRows = deferred<Secret[]>();
    pagination.data!.value = [secret('confirmed', 'CONFIRMED_TOKEN', 101, 0)];
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    api.getSecretList.mockImplementation(async (repoId: number) =>
      repoId === 101 ? oldRows.promise : newRows.promise,
    );
    api.getOrgSecretList.mockResolvedValue([]);
    api.getGlobalSecretList.mockResolvedValue([]);
    const wrapper = mountSecrets(repository);
    const reload = (wrapper.vm as unknown as { reloadSecrets: () => Promise<void> }).reloadSecrets;

    const obsoleteReload = reload();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    newRows.resolve([secret('new', 'NEW_TOKEN', 202, 0)]);
    await flushPromises();
    oldRows.reject(new Error('obsolete secrets failure'));
    await obsoleteReload;
    await flushPromises();

    expect(wrapper.get('tbody tr').text()).toContain('NEW_TOKEN');
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('ignores an obsolete rejection after returning to the same repository', async () => {
    const oldRows = deferred<Secret[]>();
    let repoACalls = 0;
    pagination.data!.value = [secret('confirmed', 'CONFIRMED_TOKEN', 101, 0)];
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    api.getSecretList.mockImplementation(async (repoId: number) => {
      if (repoId === 202) {
        return [secret('repo-b', 'REPO_B_TOKEN', 202, 0)];
      }
      repoACalls += 1;
      return repoACalls === 1 ? oldRows.promise : [secret('current-a', 'CURRENT_A_TOKEN', 101, 0)];
    });
    api.getOrgSecretList.mockResolvedValue([]);
    api.getGlobalSecretList.mockResolvedValue([]);
    const wrapper = mountSecrets(repository);
    const reload = (wrapper.vm as unknown as { reloadSecrets: () => Promise<void> }).reloadSecrets;

    const obsoleteReload = reload();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    oldRows.reject(new Error('obsolete first repository failure'));
    await obsoleteReload;
    await flushPromises();

    expect(wrapper.get('tbody tr').text()).toContain('CURRENT_A_TOKEN');
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);

    pagination.data!.value = [secret('live-a', 'LIVE_A_TOKEN', 101, 0)];
    await nextTick();
    expect(wrapper.get('tbody tr').text()).toContain('LIVE_A_TOKEN');
  });

  it('does not close or reload the current editor when an obsolete save succeeds after returning to the same repository', async () => {
    const pending = deferred<unknown>();
    pagination.data!.value = [secret('repo', 'DEPLOY_TOKEN', 101, 0)];
    api.updateSecret.mockReturnValue(pending.promise);
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    const wrapper = mountSecrets(repository);

    await wrapper.get('[title="Edit secret"]').trigger('click');
    const obsoleteSave = (wrapper.vm as unknown as { createSecret: () => Promise<void> }).createSecret();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add secret')!
      .trigger('click');
    pending.resolve(undefined);
    await obsoleteSave;
    await flushPromises();

    expect(wrapper.find('[data-testid="secret-editor"]').exists()).toBe(true);
    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).toHaveBeenCalledTimes(2);
  });

  it('does not close or reload the current editor when an obsolete save rejects after returning to the same repository', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const pending = deferred<unknown>();
    pagination.data!.value = [secret('repo', 'DEPLOY_TOKEN', 101, 0)];
    api.updateSecret.mockReturnValue(pending.promise);
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    const wrapper = mountSecrets(repository);

    await wrapper.get('[title="Edit secret"]').trigger('click');
    const obsoleteSave = (wrapper.vm as unknown as { createSecret: () => Promise<void> }).createSecret();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add secret')!
      .trigger('click');
    pending.reject(new Error('obsolete secret save failure'));
    await obsoleteSave;
    await flushPromises();

    expect(wrapper.find('[data-testid="secret-editor"]').exists()).toBe(true);
    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });

  it('does not announce or reload when an obsolete deletion completes after returning to the same repository', async () => {
    const pending = deferred<unknown>();
    const row = secret('repo', 'DEPLOY_TOKEN', 101, 0);
    pagination.data!.value = [row];
    api.deleteSecret.mockReturnValue(pending.promise);
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    const wrapper = mountSecrets(repository);

    const obsoleteDelete = (wrapper.vm as unknown as { deleteSecret: (secret: Secret) => Promise<void> }).deleteSecret(
      row,
    );
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
    pagination.data!.value = [secret('repo', 'DEPLOY_TOKEN', 101, 0)];
    const repository = ref({ id: 101, org_id: 1, full_name: 'acme/backend' } as Repo);
    const wrapper = mount(Secrets, {
      global: {
        plugins: [i18n],
        provide: {
          repo: repository,
        },
        stubs: {
          PrototypeIcon: true,
          SecretEdit: SecretEditStub,
        },
      },
    });

    await wrapper.get('[title="Edit secret"]').trigger('click');
    expect(wrapper.find('[data-testid="secret-editor"]').exists()).toBe(true);
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();

    expect(pagination.resetPage).toHaveBeenCalledTimes(1);
    expect(wrapper.find('[data-testid="secret-editor"]').exists()).toBe(false);
  });
});
