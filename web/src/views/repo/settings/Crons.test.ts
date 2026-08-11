import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Cron, Repo } from '~/lib/api/types';

import Crons from './Crons.vue';

const mocks = vi.hoisted(() => ({
  data: undefined as ReturnType<typeof ref<Cron[]>> | undefined,
  loading: undefined as ReturnType<typeof ref<boolean>> | undefined,
  loadData: undefined as ((page: number) => Promise<Cron[] | null>) | undefined,
  resetPage: vi.fn(),
  getCronList: vi.fn(),
  createCron: vi.fn(),
  updateCron: vi.fn(),
  deleteCron: vi.fn(),
  runCron: vi.fn(),
  notify: vi.fn(),
  push: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getCronList: mocks.getCronList,
    createCron: mocks.createCron,
    updateCron: mocks.updateCron,
    deleteCron: mocks.deleteCron,
    runCron: mocks.runCron,
  }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: mocks.notify,
  }),
}));

vi.mock('~/compositions/usePaginate', async () => {
  const { ref: vueRef } = await import('vue');
  mocks.data = vueRef<Cron[]>([]);
  mocks.loading = vueRef(false);
  return {
    usePagination: (loadData: (page: number) => Promise<Cron[] | null>) => {
      mocks.loadData = loadData;
      return {
        data: mocks.data,
        loading: mocks.loading,
        resetPage: mocks.resetPage,
      };
    },
  };
});

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

vi.mock('~/router', () => ({
  default: {
    push: mocks.push,
  },
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function cron(id: number, name: string): Cron {
  return {
    id,
    name,
    branch: 'main',
    schedule: '0 2 * * *',
    timezone: 'UTC',
    enabled: true,
    next_exec: 1_754_386_000,
    variables: {},
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

function mountCrons(repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo)) {
  return mount(Crons, {
    global: {
      plugins: [i18n],
      provide: {
        repo: repository,
      },
      stubs: {
        PrototypeIcon: true,
      },
    },
  });
}

describe('repository cron settings', () => {
  beforeEach(() => {
    mocks.data!.value = [];
    mocks.loading!.value = false;
    mocks.resetPage.mockReset();
    mocks.getCronList.mockReset();
    mocks.createCron.mockReset();
    mocks.updateCron.mockReset();
    mocks.deleteCron.mockReset();
    mocks.runCron.mockReset();
    mocks.notify.mockReset();
    mocks.push.mockReset();

    let resetGeneration = 0;
    mocks.resetPage.mockImplementation(async () => {
      const requestGeneration = ++resetGeneration;
      mocks.data!.value = [];
      mocks.loading!.value = true;
      const rows = (await mocks.loadData?.(1)) ?? [];
      if (requestGeneration !== resetGeneration) {
        return;
      }
      mocks.data!.value = rows;
      mocks.loading!.value = false;
    });
  });

  it('renders real cron fields and navigates after a server-confirmed run', async () => {
    mocks.data!.value = [
      {
        id: 7,
        name: 'nightly',
        branch: 'main',
        schedule: '0 2 * * *',
        timezone: 'UTC',
        enabled: true,
        next_exec: 1_754_386_000,
        variables: {},
      },
    ];
    mocks.runCron.mockResolvedValue({ number: 88 });

    const wrapper = mount(Crons, {
      global: {
        plugins: [i18n],
        provide: {
          repo: ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo),
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });

    const row = wrapper.get('tbody tr');
    expect(row.text()).toContain('nightly');
    expect(row.text()).toContain('0 2 * * *');
    expect(row.text()).toContain('UTC');

    await row.get('[title="Run now"]').trigger('click');
    await flushPromises();

    expect(mocks.runCron).toHaveBeenCalledWith(101, 7);
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'repo-pipeline',
      params: {
        repoId: 101,
        pipelineId: 88,
      },
    });
  });

  it('preserves direct execution for an inactive cron', async () => {
    mocks.data!.value = [
      {
        id: 8,
        name: 'paused',
        branch: '',
        schedule: '0 6 * * 1',
        timezone: 'UTC',
        enabled: false,
        next_exec: 0,
        variables: {},
      },
    ];

    mocks.runCron.mockResolvedValue({ number: 89 });
    const wrapper = mount(Crons, {
      global: {
        plugins: [i18n],
        provide: {
          repo: ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo),
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });

    await wrapper.get('[title="Run now"]').trigger('click');
    await flushPromises();

    expect(mocks.runCron).toHaveBeenCalledWith(101, 8);
    expect(mocks.push).toHaveBeenCalledWith({
      name: 'repo-pipeline',
      params: {
        repoId: 101,
        pipelineId: 89,
      },
    });
    expect(wrapper.get('tbody tr').text()).toContain('Disabled');
  });

  it('renders a retryable GET error and reloads through the pagination owner', async () => {
    mocks.getCronList.mockRejectedValueOnce(new Error('crons offline')).mockResolvedValueOnce([]);
    mocks.resetPage.mockImplementation(async () => {
      await mocks.loadData?.(1);
    });

    const wrapper = mount(Crons, {
      global: {
        plugins: [i18n],
        provide: {
          repo: ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo),
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });

    await mocks.loadData?.(1);
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('crons offline');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(mocks.resetPage).toHaveBeenCalledTimes(1);
    expect(mocks.getCronList).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('preserves confirmed rows when a page-two reset starts a rejected page-one load asynchronously', async () => {
    const replacement = deferred<Cron[]>();
    mocks.data!.value = [cron(7, 'nightly')];
    mocks.getCronList.mockReturnValue(replacement.promise);
    mocks.resetPage.mockImplementation(async () => {
      mocks.data!.value = [];
      void nextTick(async () => {
        mocks.loading!.value = true;
        mocks.data!.value = (await mocks.loadData?.(1)) ?? [];
        mocks.loading!.value = false;
      });
    });
    const wrapper = mountCrons();

    const reload = (wrapper.vm as unknown as { reloadCrons: () => Promise<void> }).reloadCrons();
    await nextTick();
    expect(mocks.loading!.value).toBe(true);
    expect(wrapper.get('tbody tr').text()).toContain('nightly');

    replacement.reject(new Error('crons offline'));
    await reload;
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('crons offline');
    expect(wrapper.get('tbody tr').text()).toContain('nightly');
  });

  it('discards an obsolete fulfilled refresh after the repository changes', async () => {
    const oldRows = deferred<Cron[]>();
    const newRows = deferred<Cron[]>();
    mocks.data!.value = [cron(7, 'confirmed')];
    const repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo);
    mocks.getCronList.mockImplementation(async (repoId: number) =>
      repoId === 101 ? oldRows.promise : newRows.promise,
    );
    const wrapper = mountCrons(repository);
    const reload = (wrapper.vm as unknown as { reloadCrons: () => Promise<void> }).reloadCrons;

    const obsoleteReload = reload();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    newRows.resolve([cron(8, 'current')]);
    await flushPromises();
    oldRows.resolve([cron(9, 'obsolete')]);
    await obsoleteReload;
    await flushPromises();

    expect(wrapper.get('tbody tr').text()).toContain('current');
    expect(wrapper.text()).not.toContain('obsolete');
  });

  it('ignores an obsolete rejected refresh after the repository changes', async () => {
    const oldRows = deferred<Cron[]>();
    const newRows = deferred<Cron[]>();
    mocks.data!.value = [cron(7, 'confirmed')];
    const repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo);
    mocks.getCronList.mockImplementation(async (repoId: number) =>
      repoId === 101 ? oldRows.promise : newRows.promise,
    );
    const wrapper = mountCrons(repository);
    const reload = (wrapper.vm as unknown as { reloadCrons: () => Promise<void> }).reloadCrons;

    const obsoleteReload = reload();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    newRows.resolve([cron(8, 'current')]);
    await flushPromises();
    oldRows.reject(new Error('obsolete cron refresh failure'));
    await obsoleteReload;
    await flushPromises();

    expect(wrapper.get('tbody tr').text()).toContain('current');
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('ignores an obsolete rejection after returning to the same repository', async () => {
    const oldRows = deferred<Cron[]>();
    let repoACalls = 0;
    mocks.data!.value = [cron(7, 'confirmed')];
    const repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo);
    mocks.getCronList.mockImplementation(async (repoId: number) => {
      if (repoId === 202) {
        return [cron(8, 'repo-b')];
      }
      repoACalls += 1;
      return repoACalls === 1 ? oldRows.promise : [cron(9, 'current-a')];
    });
    const wrapper = mountCrons(repository);
    const reload = (wrapper.vm as unknown as { reloadCrons: () => Promise<void> }).reloadCrons;

    const obsoleteReload = reload();
    await flushPromises();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    oldRows.reject(new Error('obsolete first repository failure'));
    await obsoleteReload;
    await flushPromises();

    expect(wrapper.get('tbody tr').text()).toContain('current-a');
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);

    mocks.data!.value = [cron(10, 'live-a')];
    await nextTick();
    expect(wrapper.get('tbody tr').text()).toContain('live-a');
  });

  it('keeps confirmed cron rows unchanged after canceling or failing an edit', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.data!.value = [
      {
        id: 7,
        name: 'nightly',
        branch: 'main',
        schedule: '0 2 * * *',
        timezone: 'UTC',
        enabled: true,
        next_exec: 1_754_386_000,
        variables: {},
      },
    ];
    mocks.updateCron.mockRejectedValue(new Error('update failed'));

    const wrapper = mount(Crons, {
      global: {
        plugins: [i18n],
        provide: {
          repo: ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo),
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });

    await wrapper.get('[title="Edit cron"]').trigger('click');
    await wrapper.get('input').setValue('changed');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Cancel')!
      .trigger('click');

    expect(wrapper.get('tbody tr').text()).toContain('nightly');
    expect(wrapper.get('tbody tr').text()).not.toContain('changed');
    consoleError.mockRestore();
  });

  it('clears editor state and reloads when the repository changes', async () => {
    mocks.data!.value = [
      {
        id: 7,
        name: 'nightly',
        branch: 'main',
        schedule: '0 2 * * *',
        timezone: 'UTC',
        enabled: true,
        next_exec: 1_754_386_000,
        variables: {},
      },
    ];
    const repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo);
    const wrapper = mount(Crons, {
      global: {
        plugins: [i18n],
        provide: {
          repo: repository,
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });

    await wrapper.get('[title="Edit cron"]').trigger('click');
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();

    expect(mocks.resetPage).toHaveBeenCalledTimes(1);
    expect(wrapper.find('form').exists()).toBe(false);
  });

  it('does not navigate when an obsolete cron run completes after returning to the same repository', async () => {
    let resolveRun!: (pipeline: { number: number }) => void;
    mocks.runCron.mockReturnValue(
      new Promise((resolve) => {
        resolveRun = resolve;
      }),
    );
    mocks.data!.value = [
      {
        id: 7,
        name: 'nightly',
        branch: 'main',
        schedule: '0 2 * * *',
        timezone: 'UTC',
        enabled: true,
        next_exec: 1_754_386_000,
        variables: {},
      },
    ];
    const repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo);
    const wrapper = mount(Crons, {
      global: {
        plugins: [i18n],
        provide: {
          repo: repository,
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });

    await wrapper.get('[title="Run now"]').trigger('click');
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    resolveRun({ number: 88 });
    await flushPromises();

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('does not navigate when an obsolete cron rejection completes after returning to the same repository', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let rejectRun!: (error: Error) => void;
    mocks.runCron.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectRun = reject;
      }),
    );
    mocks.data!.value = [
      {
        id: 7,
        name: 'nightly',
        branch: 'main',
        schedule: '0 2 * * *',
        timezone: 'UTC',
        enabled: true,
        next_exec: 1_754_386_000,
        variables: {},
      },
    ];
    const repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo);
    const wrapper = mount(Crons, {
      global: {
        plugins: [i18n],
        provide: {
          repo: repository,
        },
        stubs: {
          PrototypeIcon: true,
        },
      },
    });

    await wrapper.get('[title="Run now"]').trigger('click');
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    rejectRun(new Error('obsolete cron failure'));
    await flushPromises();

    expect(mocks.push).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('does not close, announce, or reload when an obsolete cron save completes after returning to the same repository', async () => {
    const pending = deferred<unknown>();
    mocks.data!.value = [cron(7, 'nightly')];
    mocks.updateCron.mockReturnValue(pending.promise);
    const repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo);
    const wrapper = mountCrons(repository);

    await wrapper.get('[title="Edit cron"]').trigger('click');
    const obsoleteSave = (wrapper.vm as unknown as { createCron: () => Promise<void> }).createCron();
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add cron')!
      .trigger('click');
    pending.resolve(undefined);
    await obsoleteSave;
    await flushPromises();

    expect(wrapper.find('form').exists()).toBe(true);
    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.resetPage).toHaveBeenCalledTimes(2);
  });

  it('does not announce or reload when an obsolete cron deletion completes after returning to the same repository', async () => {
    const pending = deferred<unknown>();
    const row = cron(7, 'nightly');
    mocks.data!.value = [row];
    mocks.deleteCron.mockReturnValue(pending.promise);
    const repository = ref({ id: 101, default_branch: 'main', full_name: 'acme/backend' } as Repo);
    const wrapper = mountCrons(repository);

    const obsoleteDelete = (wrapper.vm as unknown as { deleteCron: (cron: Cron) => Promise<void> }).deleteCron(row);
    repository.value = { ...repository.value, id: 202, full_name: 'acme/frontend' };
    await flushPromises();
    repository.value = { ...repository.value, id: 101, full_name: 'acme/backend' };
    await flushPromises();
    pending.resolve(undefined);
    await obsoleteDelete;
    await flushPromises();

    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.resetPage).toHaveBeenCalledTimes(2);
  });
});
