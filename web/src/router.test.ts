import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

const notificationState = vi.hoisted(() => ({
  notify: vi.fn(),
}));

const i18nState = vi.hoisted(() => {
  const state = {
    locale: 'en',
    messagesReady: true,
    setI18nLanguage: vi.fn<(locale: string) => Promise<void>>(),
  };
  state.setI18nLanguage.mockImplementation(async (locale) => {
    state.locale = locale;
    state.messagesReady = true;
  });
  return state;
});

const adminWrapperState = vi.hoisted(() => ({
  mounts: 0,
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => notificationState,
}));

vi.mock('~/compositions/useI18n', () => ({
  i18n: {
    global: {
      locale: {
        get value() {
          return i18nState.locale;
        },
      },
      t: (key: string) =>
        i18nState.messagesReady
          ? i18nState.locale === 'zh-Hans'
            ? '你没有访问服务器设置的权限'
            : 'You are not allowed to access server settings'
          : key,
    },
  },
  setI18nLanguage: i18nState.setI18nLanguage,
}));

vi.mock('~/views/admin/AdminSettingsWrapper.vue', () => ({
  default: defineComponent({
    name: 'AdminSettingsWrapperStub',
    setup() {
      adminWrapperState.mounts += 1;
      return () => null;
    },
  }),
}));

vi.mock('~/views/Overview.vue', () => ({
  default: defineComponent({
    name: 'OverviewStub',
    template: '<div data-testid="overview" />',
  }),
}));

describe('router base path', () => {
  afterEach(() => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: undefined });
    Object.defineProperty(window, 'WOODPECKER_USER', { configurable: true, value: undefined });
    localStorage.clear();
    notificationState.notify.mockReset();
    i18nState.locale = 'en';
    i18nState.messagesReady = true;
    i18nState.setI18nLanguage.mockReset();
    i18nState.setI18nLanguage.mockImplementation(async (locale) => {
      i18nState.locale = locale;
      i18nState.messagesReady = true;
    });
    adminWrapperState.mounts = 0;
    vi.resetModules();
  });

  it('keeps application routes base-relative when Woodpecker uses a root path', async () => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: '/woodpecker' });
    const { default: router } = await import('./router');

    expect(router.resolve('/overview').href).toBe('/woodpecker/overview');
    expect(router.resolve('/deployments/new').href).toBe('/woodpecker/deployments/new');
    expect(router.resolve('/infrastructure/servers/7').href).toBe('/woodpecker/infrastructure/servers/7');
  }, 15_000);

  it('resolves every pipeline destination without falling through the optional step route', async () => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: '/woodpecker' });
    const { default: router } = await import('./router');

    const destinations = [
      {
        name: 'repo-pipeline',
        params: { repoId: 101, pipelineId: 842 },
        path: '/repos/101/pipeline/842',
      },
      {
        name: 'repo-pipeline',
        params: { repoId: 101, pipelineId: 842, stepId: 12 },
        path: '/repos/101/pipeline/842/12',
      },
      {
        name: 'repo-pipeline-changed-files',
        params: { repoId: 101, pipelineId: 842 },
        path: '/repos/101/pipeline/842/changed-files',
      },
      {
        name: 'repo-pipeline-config',
        params: { repoId: 101, pipelineId: 842 },
        path: '/repos/101/pipeline/842/config',
      },
      {
        name: 'repo-pipeline-errors',
        params: { repoId: 101, pipelineId: 842 },
        path: '/repos/101/pipeline/842/errors',
      },
      {
        name: 'repo-pipeline-debug',
        params: { repoId: 101, pipelineId: 842 },
        path: '/repos/101/pipeline/842/debug',
      },
    ] as const;

    for (const { name, params, path } of destinations) {
      const route = router.resolve({ name, params });
      expect(route.href).toBe(`/woodpecker${path}`);

      const incomingRoute = router.resolve(path);
      expect(incomingRoute.matched.at(-1)?.name).toBe(name);
      expect(incomingRoute.params.repoId).toBe('101');
      expect(incomingRoute.params.pipelineId).toBe('842');
      if ('stepId' in params) {
        expect(incomingRoute.params.stepId).toBe(`${params.stepId}`);
      } else {
        expect(incomingRoute.params).not.toHaveProperty('stepId');
      }
    }
  }, 15_000);

  it('resolves every non-pipeline repository destination from names and inbound paths', async () => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: '/woodpecker' });
    const { default: router } = await import('./router');

    const destinations = [
      { name: 'repos', path: '/repos', params: {}, authentication: 'required' },
      { name: 'repo-add', path: '/repos/add', params: {}, authentication: 'required' },
      { name: 'repo', path: '/repos/101', params: { repoId: 101 }, repoHeader: true },
      { name: 'repo-branches', path: '/repos/101/branches', params: { repoId: 101 }, repoHeader: true },
      {
        name: 'repo-branch',
        path: '/repos/101/branches/release%2F2026.08',
        params: { repoId: 101, branch: 'release/2026.08' },
        repoHeader: true,
      },
      {
        name: 'repo-pull-requests',
        path: '/repos/101/pull-requests',
        params: { repoId: 101 },
        repoHeader: true,
      },
      {
        name: 'repo-pull-request',
        path: '/repos/101/pull-requests/92',
        params: { repoId: 101, pullRequest: 92 },
        repoHeader: true,
      },
      {
        name: 'repo-manual',
        path: '/repos/101/manual',
        params: { repoId: 101 },
        authentication: 'required',
        repoHeader: true,
      },
      { name: 'repo-settings', path: '/repos/101/settings', params: { repoId: 101 }, authentication: 'required' },
      {
        name: 'repo-settings-secrets',
        path: '/repos/101/settings/secrets',
        params: { repoId: 101 },
        authentication: 'required',
      },
      {
        name: 'repo-settings-registries',
        path: '/repos/101/settings/registries',
        params: { repoId: 101 },
        authentication: 'required',
      },
      {
        name: 'repo-settings-crons',
        path: '/repos/101/settings/crons',
        params: { repoId: 101 },
        authentication: 'required',
      },
      {
        name: 'repo-settings-badge',
        path: '/repos/101/settings/badge',
        params: { repoId: 101 },
        authentication: 'required',
      },
      {
        name: 'repo-settings-actions',
        path: '/repos/101/settings/actions',
        params: { repoId: 101 },
        authentication: 'required',
      },
      {
        name: 'repo-settings-extensions',
        path: '/repos/101/settings/extensions',
        params: { repoId: 101 },
        authentication: 'required',
      },
    ] as const;

    for (const destination of destinations) {
      const route = router.resolve({
        name: destination.name,
        params: destination.params,
      });
      expect(route.href).toBe(`/woodpecker${destination.path}`);

      const incomingRoute = router.resolve(destination.path);
      expect(incomingRoute.matched.at(-1)?.name).toBe(destination.name);
      if ('repoId' in destination.params) {
        expect(incomingRoute.params.repoId).toBe('101');
      }
      if ('branch' in destination.params) {
        expect(incomingRoute.params.branch).toBe(destination.params.branch);
      }
      if ('pullRequest' in destination.params) {
        expect(incomingRoute.params.pullRequest).toBe(`${destination.params.pullRequest}`);
      }
      if ('authentication' in destination) {
        expect(incomingRoute.meta.authentication).toBe(destination.authentication);
      } else {
        expect(incomingRoute.meta.authentication).toBeUndefined();
      }
      if ('repoHeader' in destination) {
        expect(incomingRoute.meta.repoHeader).toBe(destination.repoHeader);
      } else {
        expect(incomingRoute.meta.repoHeader).toBeUndefined();
      }
    }
  }, 15_000);

  it('resolves every organization destination and preserves settings authentication', async () => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: '/woodpecker' });
    const { default: router } = await import('./router');

    const destinations = [
      { name: 'org', path: '/orgs/17', authentication: undefined, orgHeader: true },
      {
        name: 'org-settings-secrets',
        path: '/orgs/17/settings/secrets',
        authentication: 'required',
        orgHeader: undefined,
      },
      {
        name: 'org-settings-registries',
        path: '/orgs/17/settings/registries',
        authentication: 'required',
        orgHeader: undefined,
      },
      {
        name: 'org-settings-agents',
        path: '/orgs/17/settings/agents',
        authentication: 'required',
        orgHeader: undefined,
      },
    ] as const;

    for (const destination of destinations) {
      expect(router.resolve({ name: destination.name, params: { orgId: 17 } }).href).toBe(
        `/woodpecker${destination.path}`,
      );
      const incoming = router.resolve(destination.path);
      expect(incoming.matched.at(-1)?.name).toBe(destination.name);
      expect(incoming.params.orgId).toBe('17');
      expect(incoming.meta.authentication).toBe(destination.authentication);
      expect(incoming.meta.orgHeader).toBe(destination.orgHeader);
    }

    const settingsRoot = router.resolve('/orgs/17/settings');
    expect(settingsRoot.redirectedFrom).toBeUndefined();
    expect(settingsRoot.matched.at(-1)?.name).toBe('org-settings');
    expect(settingsRoot.meta.authentication).toBe('required');
  }, 15_000);

  it('resolves every administration destination from names and inbound paths', async () => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: '/woodpecker' });
    const { default: router } = await import('./router');

    const destinations = [
      { name: 'admin-settings', path: '/admin', params: {} },
      { name: 'admin-settings-secrets', path: '/admin/secrets', params: {} },
      { name: 'admin-settings-registries', path: '/admin/registries', params: {} },
      { name: 'admin-settings-repos', path: '/admin/repos', params: {} },
      { name: 'admin-settings-users', path: '/admin/users', params: {} },
      { name: 'admin-settings-orgs', path: '/admin/orgs', params: {} },
      { name: 'admin-settings-agents', path: '/admin/agents', params: {} },
      { name: 'admin-settings-queue', path: '/admin/queue', params: {} },
      { name: 'admin-settings-forges', path: '/admin/forges', params: {} },
      { name: 'admin-settings-forge', path: '/admin/forges/7', params: { forgeId: 7 } },
      { name: 'admin-settings-forge-create', path: '/admin/forges/create', params: {} },
    ] as const;

    for (const destination of destinations) {
      expect(router.resolve({ name: destination.name, params: destination.params }).href).toBe(
        `/woodpecker${destination.path}`,
      );

      const incoming = router.resolve(destination.path);
      expect(incoming.matched.at(-1)?.name).toBe(destination.name);
      expect(incoming.meta.authentication).toBe('required');
      expect(incoming.meta.authorization).toBe('system-admin');
      if ('forgeId' in destination.params) {
        expect(incoming.params.forgeId).toBe(`${destination.params.forgeId}`);
      }
    }
  }, 15_000);

  it('resolves user, login, CLI authorization, and not-found destinations with current authentication metadata', async () => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: '/woodpecker' });
    const { default: router } = await import('./router');

    const userDestinations = [
      { name: 'user', path: '/user' },
      { name: 'user-secrets', path: '/user/secrets' },
      { name: 'user-registries', path: '/user/registries' },
      { name: 'user-cli-and-api', path: '/user/cli-and-api' },
      { name: 'user-agents', path: '/user/agents' },
    ] as const;

    for (const destination of userDestinations) {
      expect(router.resolve({ name: destination.name }).href).toBe(`/woodpecker${destination.path}`);
      const incoming = router.resolve(destination.path);
      expect(incoming.matched.at(-1)?.name).toBe(destination.name);
      expect(incoming.meta.authentication).toBe('required');
    }

    const login = router.resolve('/login');
    expect(router.resolve({ name: 'login' }).href).toBe('/woodpecker/login');
    expect(login.matched.at(-1)?.name).toBe('login');
    expect(login.meta.authentication).toBe('guest-only');
    expect(login.meta.layout).toBe('blank');

    const cliAuth = router.resolve('/cli/auth?port=49152');
    expect(cliAuth.path).toBe('/cli/auth');
    expect(cliAuth.query.port).toBe('49152');
    expect(cliAuth.meta.authentication).toBe('required');

    const missing = router.resolve('/definitely-not-a-route');
    expect(missing.matched.at(-1)?.name).toBe('not-found');
    expect(router.resolve('/definitely/not/a/route').matched.at(-1)?.name).toBe('not-found');
  }, 15_000);

  it.each([
    {
      actor: 'guest',
      user: undefined,
      destination: '/admin/users',
      expectedName: 'login',
      expectedNotification: false,
    },
    {
      actor: 'regular user',
      user: { id: 2, login: 'member', admin: false },
      destination: '/admin/users',
      expectedName: 'overview',
      expectedNotification: true,
    },
    {
      actor: 'system administrator',
      user: { id: 1, login: 'admin', admin: true },
      destination: '/admin/users',
      expectedName: 'admin-settings-users',
      expectedNotification: false,
    },
  ])(
    'enforces direct administration access for $actor before rendering child routes',
    async ({ user, destination, expectedName, expectedNotification }) => {
      Object.defineProperty(window, 'WOODPECKER_USER', { configurable: true, value: user });
      const { default: router } = await import('./router');

      await router.push(destination);
      await router.isReady();

      expect(router.currentRoute.value.name).toBe(expectedName);
      expect(notificationState.notify).toHaveBeenCalledTimes(expectedNotification ? 1 : 0);
      if (user === undefined) {
        expect(localStorage.getItem('woodpecker:user-config')).toContain('"redirectUrl":"/admin/users"');
      }
      if (expectedNotification) {
        expect(notificationState.notify).toHaveBeenCalledWith({
          type: 'error',
          title: 'You are not allowed to access server settings',
        });
      }
    },
    15_000,
  );

  it('rejects a saved administration redirect without an intermediate protected navigation', async () => {
    Object.defineProperty(window, 'WOODPECKER_USER', {
      configurable: true,
      value: { id: 2, login: 'member', admin: false },
    });
    localStorage.setItem(
      'woodpecker:user-config',
      JSON.stringify({
        isPipelineFeedOpen: false,
        redirectUrl: '/admin/users',
        collapseLogGroupsByDefault: true,
      }),
    );
    const { default: router } = await import('./router');

    await router.push('/overview');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('overview');
    expect(notificationState.notify).toHaveBeenCalledTimes(1);
    expect(notificationState.notify).toHaveBeenCalledWith({
      type: 'error',
      title: 'You are not allowed to access server settings',
    });
    expect(localStorage.getItem('woodpecker:user-config')).toContain('"redirectUrl":""');
  }, 15_000);

  it('loads the active locale before the first administration denial notification', async () => {
    Object.defineProperty(window, 'WOODPECKER_USER', {
      configurable: true,
      value: { id: 2, login: 'member', admin: false },
    });
    i18nState.locale = 'zh-Hans';
    i18nState.messagesReady = false;
    let finishLoading: (() => void) | undefined;
    i18nState.setI18nLanguage.mockImplementationOnce(
      async (locale) =>
        new Promise((resolve) => {
          finishLoading = () => {
            i18nState.locale = locale;
            i18nState.messagesReady = true;
            resolve();
          };
        }),
    );
    const { default: router } = await import('./router');

    const navigation = router.push('/admin/users');
    await vi.waitFor(() => expect(i18nState.setI18nLanguage).toHaveBeenCalledWith('zh-Hans'));
    expect(notificationState.notify).not.toHaveBeenCalled();
    finishLoading?.();
    await navigation;
    await router.isReady();

    expect(notificationState.notify).toHaveBeenCalledTimes(1);
    expect(notificationState.notify).toHaveBeenCalledWith({
      type: 'error',
      title: '你没有访问服务器设置的权限',
    });
  }, 15_000);

  it('rejects administration before the wrapper mounts and emits one denial', async () => {
    Object.defineProperty(window, 'WOODPECKER_USER', {
      configurable: true,
      value: { id: 2, login: 'member', admin: false },
    });
    const { default: router } = await import('./router');
    const wrapper = mount(defineComponent({ template: '<RouterView />' }), {
      global: {
        plugins: [router],
      },
    });

    await router.push('/admin/users');
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('overview');
    expect(adminWrapperState.mounts).toBe(0);
    expect(notificationState.notify).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  }, 15_000);

  it('keeps direct administration denial reliable when locale loading fails', async () => {
    Object.defineProperty(window, 'WOODPECKER_USER', {
      configurable: true,
      value: { id: 2, login: 'member', admin: false },
    });
    i18nState.messagesReady = false;
    i18nState.setI18nLanguage.mockRejectedValueOnce(new Error('locale unavailable'));
    const { default: router } = await import('./router');
    const wrapper = mount(defineComponent({ template: '<RouterView />' }), {
      global: {
        plugins: [router],
      },
    });

    await expect(router.push('/admin/users')).resolves.toBeUndefined();
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('overview');
    expect(adminWrapperState.mounts).toBe(0);
    expect(notificationState.notify).toHaveBeenCalledTimes(1);
    expect(notificationState.notify).toHaveBeenCalledWith({
      type: 'error',
      title: 'You are not allowed to access server settings',
    });
    wrapper.unmount();
  }, 15_000);

  it('clears a saved administration redirect when locale loading fails', async () => {
    Object.defineProperty(window, 'WOODPECKER_USER', {
      configurable: true,
      value: { id: 2, login: 'member', admin: false },
    });
    localStorage.setItem(
      'woodpecker:user-config',
      JSON.stringify({
        isPipelineFeedOpen: false,
        redirectUrl: '/admin/users',
        collapseLogGroupsByDefault: true,
      }),
    );
    i18nState.messagesReady = false;
    i18nState.setI18nLanguage.mockRejectedValueOnce(new Error('locale unavailable'));
    const { default: router } = await import('./router');

    await expect(router.push('/overview')).resolves.toBeUndefined();
    await router.isReady();

    expect(router.currentRoute.value.name).toBe('overview');
    expect(localStorage.getItem('woodpecker:user-config')).toContain('"redirectUrl":""');
    expect(notificationState.notify).toHaveBeenCalledTimes(1);
    expect(notificationState.notify).toHaveBeenCalledWith({
      type: 'error',
      title: 'You are not allowed to access server settings',
    });
  }, 15_000);
});
