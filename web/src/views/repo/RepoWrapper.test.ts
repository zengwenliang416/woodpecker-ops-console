import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Forge, Repo, RepoPermissions } from '~/lib/api/types';

import RepoWrapper from './RepoWrapper.vue';

const testState = vi.hoisted(() => ({
  route: {
    name: 'repo',
    fullPath: '/repos/101',
    meta: { repoHeader: true },
  },
  replace: vi.fn(),
  notify: vi.fn(),
  isAuthenticated: true,
  repositories: new Map<number, Repo>(),
  pipelines: [] as unknown[],
  getRepoPermissions: vi.fn(),
  loadRepo: vi.fn(),
  loadRepoPipelines: vi.fn(),
  getForge: vi.fn(),
  updateLastAccess: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => testState.route,
  useRouter: () => ({
    replace: testState.replace,
  }),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getRepoPermissions: testState.getRepoPermissions,
  }),
}));

vi.mock('~/compositions/useAuthentication', () => ({
  default: () => ({
    isAuthenticated: testState.isAuthenticated,
  }),
}));

vi.mock('~/compositions/useConfig', () => ({
  default: () => ({
    rootPath: '/woodpecker',
  }),
}));

vi.mock('~/compositions/useForgeStore', () => ({
  useForgeStore: () => ({
    getForge: testState.getForge,
  }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: testState.notify,
  }),
}));

vi.mock('~/compositions/useRepos', () => ({
  default: () => ({
    updateLastAccess: testState.updateLastAccess,
  }),
}));

vi.mock('~/store/repos', () => ({
  useRepoStore: () => ({
    getRepo: (repoId: { value: number }) => computed(() => testState.repositories.get(repoId.value)),
    loadRepo: testState.loadRepo,
  }),
}));

vi.mock('~/store/pipelines', () => ({
  usePipelineStore: () => ({
    getRepoPipelines: () => computed(() => testState.pipelines),
    loadRepoPipelines: testState.loadRepoPipelines,
  }),
}));

const ScaffoldStub = defineComponent({
  setup(_, { slots }) {
    return () =>
      h('main', { 'data-testid': 'repo-scaffold' }, [
        h('header', slots.title?.()),
        h('section', { 'data-testid': 'header-actions' }, slots.headerActions?.()),
        h('section', { 'data-testid': 'tab-actions' }, slots.tabActions?.()),
        h('nav', slots.default?.()),
      ]);
  },
});

const ButtonStub = defineComponent({
  props: {
    text: String,
    to: Object,
  },
  setup(props) {
    return () =>
      h('button', {
        'data-action': props.text,
        'data-to': props.to === undefined ? undefined : JSON.stringify(props.to),
      });
  },
});

const IconButtonStub = defineComponent({
  props: {
    title: String,
    to: Object,
    href: String,
    icon: String,
  },
  setup(props) {
    return () =>
      h('a', {
        'data-action': props.title,
        'data-icon': props.icon,
        'data-to': props.to === undefined ? undefined : JSON.stringify(props.to),
        href: props.href,
      });
  },
});

const TabStub = defineComponent({
  props: {
    title: String,
    to: Object,
  },
  setup(props) {
    return () =>
      h('a', {
        'data-tab': props.title,
        'data-to': JSON.stringify(props.to),
      });
  },
});

const RouterLinkStub = defineComponent({
  props: {
    to: Object,
  },
  setup(props, { slots }) {
    return () => h('a', { 'data-to': JSON.stringify(props.to) }, slots.default?.());
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function repository(id: number, overrides: Partial<Repo> = {}): Repo {
  return {
    id,
    forge_id: 7,
    org_id: 11,
    owner: 'acme',
    name: `repo-${id}`,
    full_name: `acme/repo-${id}`,
    forge_url: `https://forge.example/acme/repo-${id}`,
    default_branch: 'main',
    pr_enabled: true,
    allow_pr: true,
    ...overrides,
  } as Repo;
}

function permissions(overrides: Partial<RepoPermissions> = {}): RepoPermissions {
  return {
    pull: true,
    push: true,
    admin: true,
    synced: 0,
    ...overrides,
  };
}

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (error: Error) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

function mountWrapper({
  repoId = '101',
  routeName = 'repo',
  routeMeta = { repoHeader: true },
  theme = 'light',
  errorHandler,
}: {
  repoId?: string;
  routeName?: string;
  routeMeta?: Record<string, unknown>;
  theme?: 'light' | 'dark';
  errorHandler?: (error: unknown) => void;
} = {}) {
  document.documentElement.dataset.theme = theme;
  testState.route.name = routeName;
  testState.route.fullPath = `/repos/${repoId}`;
  testState.route.meta = { repoHeader: false, ...routeMeta };

  return mount(RepoWrapper, {
    props: {
      repoId,
    },
    global: {
      config: {
        errorHandler,
      },
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        IconButton: IconButtonStub,
        RouterLink: RouterLinkStub,
        RouterView: { template: '<section data-testid="repo-view" />' },
        Scaffold: ScaffoldStub,
        Tab: TabStub,
      },
    },
  });
}

describe('repository wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.isAuthenticated = true;
    testState.repositories.clear();
    testState.pipelines = [];
    testState.repositories.set(101, repository(101));
    testState.repositories.set(202, repository(202));
    testState.getRepoPermissions.mockResolvedValue(permissions());
    testState.loadRepo.mockImplementation(async (repoId: number) => testState.repositories.get(repoId));
    testState.loadRepoPipelines.mockResolvedValue(false);
    testState.getForge.mockResolvedValue(ref({ type: 'github' } as Forge));
    document.documentElement.removeAttribute('data-theme');
  });

  it.each([
    {
      authenticated: false,
      destination: { name: 'login', query: { url: '/repos/101' } },
    },
    {
      authenticated: true,
      destination: { name: 'home' },
    },
  ])(
    'redirects pull-denied authenticated=$authenticated access before loading repository data',
    async ({ authenticated, destination }) => {
      testState.isAuthenticated = authenticated;
      testState.getRepoPermissions.mockResolvedValue(permissions({ pull: false, push: false, admin: false }));

      mountWrapper();
      await flushPromises();

      expect(testState.notify).toHaveBeenCalledWith({
        type: 'error',
        title: 'You are not allowed to access this repository',
      });
      expect(testState.replace).toHaveBeenCalledWith(destination);
      expect(testState.loadRepo).not.toHaveBeenCalled();
      expect(testState.loadRepoPipelines).not.toHaveBeenCalled();
    },
  );

  it.each(['light', 'dark'] as const)(
    'keeps pull, push, admin, and pull-request controls stable in %s theme',
    async (theme) => {
      const wrapper = mountWrapper({ theme });
      await flushPromises();

      expect(document.documentElement.dataset.theme).toBe(theme);
      expect(wrapper.findAll('[data-tab]').map((tab) => tab.attributes('data-tab'))).toEqual([
        'Activity',
        'Branches',
        'Pull requests',
      ]);
      expect(wrapper.get('[data-testid="tab-actions"] [data-to]').attributes('data-to')).toContain('repo-manual');
      expect(wrapper.get('[data-testid="header-actions"] [data-to]').attributes('data-to')).toContain('repo-settings');
    },
  );

  it('hides mutation/settings/PR controls without their current repository capabilities', async () => {
    testState.repositories.set(
      101,
      repository(101, {
        pr_enabled: false,
        allow_pr: false,
      }),
    );
    testState.getRepoPermissions.mockResolvedValue(permissions({ push: false, admin: false }));

    const wrapper = mountWrapper();
    await flushPromises();

    expect(wrapper.findAll('[data-tab]').map((tab) => tab.attributes('data-tab'))).toEqual(['Activity', 'Branches']);
    expect(wrapper.find('[data-testid="tab-actions"] [data-to]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="header-actions"] [data-to]').exists()).toBe(false);
  });

  it('switches the manual route action back to repository pipelines', async () => {
    const wrapper = mountWrapper({
      routeName: 'repo-manual',
    });
    await flushPromises();

    expect(wrapper.get('[data-testid="tab-actions"] [data-to]').attributes('data-to')).toContain('"name":"repo"');
  });

  it('bypasses the repository tab shell for nested settings routes', async () => {
    const wrapper = mountWrapper({
      routeName: 'repo-settings',
      routeMeta: { authentication: 'required' },
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="repo-scaffold"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="repo-view"]').exists()).toBe(true);
  });

  it('does not let an obsolete repository permission start the new repository data flow', async () => {
    const firstA = deferred<RepoPermissions>();
    const currentB = deferred<RepoPermissions>();
    testState.getRepoPermissions
      .mockImplementationOnce(async () => firstA.promise)
      .mockImplementationOnce(async () => currentB.promise);

    const wrapper = mountWrapper();
    await wrapper.setProps({ repoId: '202' });

    firstA.resolve(permissions());
    await flushPromises();

    expect(testState.loadRepo).not.toHaveBeenCalled();
    expect(testState.loadRepoPipelines).not.toHaveBeenCalled();

    currentB.resolve(permissions({ push: false, admin: false }));
    await flushPromises();

    expect(testState.loadRepo).toHaveBeenCalledWith(202);
    expect(testState.loadRepoPipelines).toHaveBeenCalledWith(202);
    expect(testState.updateLastAccess).toHaveBeenCalledWith(202);
  });

  it('ignores an obsolete permission rejection after a newer repository owns the route', async () => {
    const firstA = deferred<RepoPermissions>();
    const currentB = deferred<RepoPermissions>();
    testState.getRepoPermissions
      .mockImplementationOnce(async () => firstA.promise)
      .mockImplementationOnce(async () => currentB.promise);

    const wrapper = mountWrapper();
    await wrapper.setProps({ repoId: '202' });

    firstA.reject(new Error('obsolete permission failure'));
    await flushPromises();
    expect(testState.notify).not.toHaveBeenCalled();
    expect(testState.replace).not.toHaveBeenCalled();
    expect(testState.loadRepo).not.toHaveBeenCalled();

    currentB.resolve(permissions());
    await flushPromises();
    expect(testState.loadRepo).toHaveBeenCalledWith(202);
    expect(testState.updateLastAccess).toHaveBeenCalledWith(202);
  });

  it.each(['permission', 'repository', 'pipelines', 'forge'] as const)(
    'routes an active %s rejection through the Vue error boundary and stops later side effects',
    async (stage) => {
      const error = new Error(`active ${stage} failure`);
      const errorHandler = vi.fn();

      if (stage === 'permission') testState.getRepoPermissions.mockRejectedValueOnce(error);
      if (stage === 'repository') testState.loadRepo.mockRejectedValueOnce(error);
      if (stage === 'pipelines') testState.loadRepoPipelines.mockRejectedValueOnce(error);
      if (stage === 'forge') testState.getForge.mockRejectedValueOnce(error);

      const wrapper = mountWrapper({ errorHandler });
      await flushPromises();

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler.mock.calls[0][0]).toBe(error);
      expect(wrapper.find('[data-testid="repo-scaffold"]').exists()).toBe(false);
      expect(testState.updateLastAccess).not.toHaveBeenCalled();

      if (stage === 'permission') expect(testState.loadRepo).not.toHaveBeenCalled();
      if (stage === 'permission' || stage === 'repository') {
        expect(testState.loadRepoPipelines).not.toHaveBeenCalled();
      }
      if (stage !== 'forge') expect(testState.getForge).not.toHaveBeenCalled();
    },
  );

  it('stops an obsolete repository load before pipelines, forge, and last access', async () => {
    const firstRepository = deferred<Repo | undefined>();
    const currentB = deferred<RepoPermissions>();
    testState.getRepoPermissions
      .mockResolvedValueOnce(permissions())
      .mockImplementationOnce(async () => currentB.promise);
    testState.loadRepo
      .mockImplementationOnce(async () => firstRepository.promise)
      .mockImplementation(async (repoId: number) => testState.repositories.get(repoId));

    const wrapper = mountWrapper();
    await flushPromises();
    expect(testState.loadRepo).toHaveBeenCalledWith(101);

    await wrapper.setProps({ repoId: '202' });
    firstRepository.resolve(testState.repositories.get(101));
    await flushPromises();

    expect(testState.loadRepoPipelines).not.toHaveBeenCalled();
    expect(testState.getForge).not.toHaveBeenCalled();
    expect(testState.updateLastAccess).not.toHaveBeenCalled();

    currentB.resolve(permissions());
    await flushPromises();
    expect(testState.loadRepoPipelines).toHaveBeenCalledWith(202);
    expect(testState.updateLastAccess).toHaveBeenCalledWith(202);
  });

  it('stops an obsolete pipeline load before forge and last access', async () => {
    const firstPipelines = deferred<boolean>();
    const currentB = deferred<RepoPermissions>();
    testState.getRepoPermissions
      .mockResolvedValueOnce(permissions())
      .mockImplementationOnce(async () => currentB.promise);
    testState.loadRepoPipelines.mockImplementationOnce(async () => firstPipelines.promise).mockResolvedValue(false);

    const wrapper = mountWrapper();
    await flushPromises();
    expect(testState.loadRepoPipelines).toHaveBeenCalledWith(101);

    await wrapper.setProps({ repoId: '202' });
    firstPipelines.resolve(false);
    await flushPromises();

    expect(testState.getForge).not.toHaveBeenCalled();
    expect(testState.updateLastAccess).not.toHaveBeenCalled();

    currentB.resolve(permissions());
    await flushPromises();
    expect(testState.getForge).toHaveBeenCalled();
    expect(testState.updateLastAccess).toHaveBeenCalledWith(202);
  });

  it('stops an obsolete forge load before publishing the icon or last access', async () => {
    const firstForge = deferred<ReturnType<typeof ref<Forge>>>();
    const currentB = deferred<RepoPermissions>();
    testState.getRepoPermissions
      .mockResolvedValueOnce(permissions())
      .mockImplementationOnce(async () => currentB.promise);
    testState.getForge
      .mockImplementationOnce(async () => firstForge.promise)
      .mockResolvedValue(ref({ type: 'gitlab' } as Forge));

    const wrapper = mountWrapper();
    await flushPromises();
    expect(testState.getForge).toHaveBeenCalledWith(7);

    await wrapper.setProps({ repoId: '202' });
    firstForge.resolve(ref({ type: 'github' } as Forge));
    await flushPromises();

    expect(wrapper.find('[data-testid="repo-scaffold"]').exists()).toBe(false);
    expect(testState.updateLastAccess).not.toHaveBeenCalled();

    currentB.resolve(permissions());
    await flushPromises();
    expect(wrapper.get('.forge').attributes('data-icon')).toBe('gitlab');
    expect(testState.updateLastAccess).toHaveBeenCalledWith(202);
  });

  it('keeps the newest A lifecycle authoritative after A to B to A', async () => {
    const firstA = deferred<RepoPermissions>();
    const currentB = deferred<RepoPermissions>();
    const currentA = deferred<RepoPermissions>();
    testState.getRepoPermissions
      .mockImplementationOnce(async () => firstA.promise)
      .mockImplementationOnce(async () => currentB.promise)
      .mockImplementationOnce(async () => currentA.promise);

    const wrapper = mountWrapper();
    await wrapper.setProps({ repoId: '202' });
    currentB.resolve(permissions({ push: false, admin: false }));
    await flushPromises();

    await wrapper.setProps({ repoId: '101' });
    await nextTick();
    expect(wrapper.find('[data-testid="repo-scaffold"]').exists()).toBe(false);

    currentA.resolve(permissions());
    await flushPromises();
    expect(wrapper.get('[data-testid="tab-actions"] [data-to]').attributes('data-to')).toContain('repo-manual');
    expect(wrapper.get('[data-testid="header-actions"] [data-to]').attributes('data-to')).toContain('repo-settings');

    firstA.resolve(permissions({ pull: false, push: false, admin: false }));
    await flushPromises();

    expect(testState.replace).not.toHaveBeenCalled();
    expect(wrapper.get('[data-testid="tab-actions"] [data-to]').attributes('data-to')).toContain('repo-manual');
    expect(wrapper.get('[data-testid="header-actions"] [data-to]').attributes('data-to')).toContain('repo-settings');
  });

  it('ignores a first-A repository completion after the newest A lifecycle completes', async () => {
    const firstARepository = deferred<Repo | undefined>();
    testState.loadRepo
      .mockImplementationOnce(async () => firstARepository.promise)
      .mockImplementation(async (repoId: number) => testState.repositories.get(repoId));

    const wrapper = mountWrapper();
    await flushPromises();
    await wrapper.setProps({ repoId: '202' });
    await flushPromises();
    await wrapper.setProps({ repoId: '101' });
    await flushPromises();

    expect(testState.updateLastAccess).toHaveBeenNthCalledWith(1, 202);
    expect(testState.updateLastAccess).toHaveBeenNthCalledWith(2, 101);

    firstARepository.resolve(testState.repositories.get(101));
    await flushPromises();

    expect(testState.loadRepoPipelines).toHaveBeenCalledTimes(2);
    expect(testState.getForge).toHaveBeenCalledTimes(2);
    expect(testState.updateLastAccess).toHaveBeenCalledTimes(2);
  });

  it('ignores a first-A pipeline completion after the newest A lifecycle completes', async () => {
    const firstAPipelines = deferred<boolean>();
    testState.loadRepoPipelines.mockImplementationOnce(async () => firstAPipelines.promise).mockResolvedValue(false);

    const wrapper = mountWrapper();
    await flushPromises();
    await wrapper.setProps({ repoId: '202' });
    await flushPromises();
    await wrapper.setProps({ repoId: '101' });
    await flushPromises();

    expect(testState.updateLastAccess).toHaveBeenNthCalledWith(1, 202);
    expect(testState.updateLastAccess).toHaveBeenNthCalledWith(2, 101);

    firstAPipelines.resolve(false);
    await flushPromises();

    expect(testState.getForge).toHaveBeenCalledTimes(2);
    expect(testState.updateLastAccess).toHaveBeenCalledTimes(2);
  });

  it('ignores a first-A forge completion after the newest A lifecycle completes', async () => {
    const firstAForge = deferred<ReturnType<typeof ref<Forge>>>();
    testState.getForge
      .mockImplementationOnce(async () => firstAForge.promise)
      .mockResolvedValueOnce(ref({ type: 'gitlab' } as Forge))
      .mockResolvedValueOnce(ref({ type: 'gitea' } as Forge));

    const wrapper = mountWrapper();
    await flushPromises();
    await wrapper.setProps({ repoId: '202' });
    await flushPromises();
    await wrapper.setProps({ repoId: '101' });
    await flushPromises();

    expect(wrapper.get('.forge').attributes('data-icon')).toBe('gitea');
    expect(testState.updateLastAccess).toHaveBeenNthCalledWith(1, 202);
    expect(testState.updateLastAccess).toHaveBeenNthCalledWith(2, 101);

    firstAForge.resolve(ref({ type: 'github' } as Forge));
    await flushPromises();

    expect(wrapper.get('.forge').attributes('data-icon')).toBe('gitea');
    expect(testState.updateLastAccess).toHaveBeenCalledTimes(2);
  });
});
