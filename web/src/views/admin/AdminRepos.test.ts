import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Repo } from '~/lib/api/types';

import AdminRepos from './AdminRepos.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as Ref<Repo[]> | undefined,
  loading: undefined as Ref<boolean> | undefined,
  loadData: undefined as ((page: number) => Promise<Repo[] | null>) | undefined,
  resetPage: vi.fn(),
}));

const api = vi.hoisted(() => ({
  getAllRepos: vi.fn(),
  repairAllRepos: vi.fn(),
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
  pagination.data = vueRef<Repo[]>([]);
  pagination.loading = vueRef(false);
  return {
    usePagination: (loadData: (page: number) => Promise<Repo[] | null>) => {
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

function repo(id: number, fullName: string, active = true): Repo {
  return {
    id,
    full_name: fullName,
    owner: fullName.split('/')[0],
    name: fullName.split('/')[1],
    active,
  } as Repo;
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

function mountRepos() {
  return mount(AdminRepos, {
    global: {
      plugins: [i18n],
      stubs: {
        PrototypeIcon: true,
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  });
}

describe('administration repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pagination.data!.value = [];
    pagination.loading!.value = false;
    pagination.resetPage.mockImplementation(async () => {
      pagination.data!.value = [];
      pagination.data!.value = (await pagination.loadData?.(1)) ?? [];
    });
    api.getAllRepos.mockResolvedValue([]);
    api.repairAllRepos.mockResolvedValue(undefined);
  });

  it('renders confirmed repository rows in a contained settings table', async () => {
    pagination.data!.value = [repo(1, 'acme/api'), repo(2, 'acme/disabled', false)];
    const wrapper = mountRepos();
    await flushPromises();

    expect(wrapper.find('.admin-resource-page').classes()).toContain('min-w-0');
    expect(wrapper.getComponent({ name: 'SettingsTable' }).props('minWidth')).toBe('640px');
    expect(wrapper.text()).toContain('acme/api');
    expect(wrapper.text()).toContain('acme/disabled');
    expect(wrapper.text()).toContain('Disabled');
  });

  it('shows loading, empty, and retryable request states', async () => {
    pagination.loading!.value = true;
    const wrapper = mountRepos();
    wrapper.get('[data-feedback-state="loading"]');

    pagination.loading!.value = false;
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('There are no repositories yet.');

    api.getAllRepos.mockRejectedValueOnce(new Error('repositories offline')).mockResolvedValueOnce([]);
    await pagination.loadData?.(1);
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('repositories offline');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(api.getAllRepos).toHaveBeenLastCalledWith({ page: 1 });
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('keeps confirmed rows through a rejected pagination refresh', async () => {
    pagination.data!.value = [repo(1, 'acme/confirmed')];
    const wrapper = mountRepos();
    await flushPromises();

    pagination.data!.value = [];
    api.getAllRepos.mockRejectedValueOnce(new Error('refresh failed'));
    await pagination.loadData?.(1);
    await flushPromises();

    expect(wrapper.text()).toContain('acme/confirmed');
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('refresh failed');
  });

  it('ignores an obsolete list failure after a retry owns the page', async () => {
    const obsolete = deferred<Repo[] | null>();
    api.getAllRepos
      .mockReturnValueOnce(obsolete.promise)
      .mockRejectedValueOnce(new Error('active failure'))
      .mockResolvedValueOnce([repo(2, 'acme/current')]);
    const wrapper = mountRepos();

    const oldRequest = pagination.loadData?.(1);
    await pagination.loadData?.(1);
    await flushPromises();
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    obsolete.reject(new Error('obsolete failure'));
    await oldRequest;
    await flushPromises();

    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('acme/current');
  });

  it('reports an active repair failure without clearing confirmed rows', async () => {
    pagination.data!.value = [repo(1, 'acme/confirmed')];
    api.repairAllRepos.mockRejectedValueOnce(new Error('repair failed'));
    const wrapper = mountRepos();

    await wrapper.get('button[title="Repair all"]').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('acme/confirmed');
    expect(api.notify).toHaveBeenCalledWith({ title: 'repair failed', type: 'error' });
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps an unmounted repair completion inert', async () => {
    const repair = deferred<unknown>();
    api.repairAllRepos.mockReturnValue(repair.promise);
    const wrapper = mountRepos();

    await wrapper.get('button[title="Repair all"]').trigger('click');
    wrapper.unmount();
    repair.resolve(undefined);
    await flushPromises();

    expect(api.notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });
});
