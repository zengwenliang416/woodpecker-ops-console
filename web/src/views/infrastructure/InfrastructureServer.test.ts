import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Server, User } from '~/lib/api/types';

import InfrastructureServer from './InfrastructureServer.vue';

const state = vi.hoisted(() => ({
  api: {
    deleteServer: vi.fn(),
    getOpsServices: vi.fn(),
    getServer: vi.fn(),
    getServerDeployments: vi.fn(),
    restartServer: vi.fn(),
    setServerMaintenance: vi.fn(),
  },
  appStore: {
    environments: new Map(),
    loadEnvironments: vi.fn(),
  },
  auth: {
    user: null as User | null,
  },
  router: {
    push: vi.fn(),
  },
  serverStore: {
    alertsList: [] as Array<{ id: number; server_id: number; status: string; message: string }>,
    groups: new Map(),
    loadAlerts: vi.fn(),
    loadGroups: vi.fn(),
  },
}));

const route = reactive({
  params: { serverId: '1' },
  path: '/infrastructure/servers/1',
  query: {},
});

vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => state.router,
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => state.api,
}));

vi.mock('~/compositions/useAuthentication', () => ({
  default: () => state.auth,
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

vi.mock('~/store/ops', () => ({
  useApplicationStore: () => state.appStore,
  useServerStore: () => state.serverStore,
}));

const ScaffoldStub = defineComponent({
  setup(_, { slots }) {
    return () => h('section', [h('header', [slots.title?.(), slots.headerActions?.()]), h('main', slots.default?.())]);
  },
});

const ButtonStub = defineComponent({
  props: {
    disabled: Boolean,
    isLoading: Boolean,
    text: String,
    title: String,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'aria-busy': props.isLoading || undefined,
          disabled: props.disabled || props.isLoading,
          title: props.title ?? props.text ?? '',
          onClick: () => emit('click'),
        },
        props.text,
      );
  },
});

const FeedbackStateStub = defineComponent({
  props: {
    description: String,
    kind: String,
    title: String,
  },
  setup(props, { slots }) {
    return () =>
      h('section', { 'data-feedback-state': props.kind }, [
        h('strong', props.title),
        h('p', props.description),
        slots.action?.(),
      ]);
  },
});

const RouterLinkStub = defineComponent({
  props: {
    to: [String, Object],
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

function user(admin: boolean): User {
  return {
    id: 1,
    forge_id: 1,
    forge_remote_id: 'user-1',
    login: admin ? 'admin' : 'operator',
    email: 'operator@example.test',
    avatar_url: '',
    admin,
    admin_env: false,
    active: true,
    org_id: 1,
  };
}

function server(id: number, name = `server-${id}`): Server {
  return {
    id,
    group_id: 1,
    environment_id: 1,
    name,
    status: 'online',
    health: 'healthy',
    cpu: 20,
    memory: 30,
    disk: 40,
    load: 0.5,
    maintenance: false,
    metrics: {
      cpu: [20],
      memory: [30],
      disk: [40],
      network: [10],
    },
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

function mountServer() {
  return mount(InfrastructureServer, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        Icon: true,
        OpsMetricCard: true,
        OpsMetricPanel: true,
        RouterLink: RouterLinkStub,
        Scaffold: ScaffoldStub,
      },
    },
  });
}

function action(wrapper: ReturnType<typeof mountServer>, name: string) {
  return wrapper.get(`button[data-action="${name}"]`);
}

describe('infrastructure server', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    state.auth.user = user(true);
    route.params.serverId = '1';
    route.path = '/infrastructure/servers/1';
    route.query = {};
    state.appStore.environments = new Map([[1, { id: 1, name: 'production' }]]);
    state.serverStore.groups = new Map([[1, { id: 1, name: 'default' }]]);
    state.serverStore.alertsList = [];
    state.api.getServerDeployments.mockResolvedValue([]);
    state.api.getOpsServices.mockResolvedValue([]);
    state.appStore.loadEnvironments.mockResolvedValue(undefined);
    state.serverStore.loadGroups.mockResolvedValue(undefined);
    state.serverStore.loadAlerts.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial loading, retryable failure, and the confirmed server after retry', async () => {
    const request = deferred<Server | null>();
    state.api.getServer.mockReturnValueOnce(request.promise).mockResolvedValueOnce(server(1, 'recovered'));
    const wrapper = mountServer();

    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(true);

    request.reject(new Error('server load failed'));
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('An unknown error occurred');
    expect(wrapper.text()).not.toContain('server load failed');

    await action(wrapper, 'server-retry').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('recovered');
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('renders a terminal missing state instead of an endless spinner', async () => {
    state.api.getServer.mockResolvedValue(null);
    const wrapper = mountServer();
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('Page not found');
    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('ignores an obsolete route response when the server ID changes', async () => {
    const obsolete = deferred<Server | null>();
    state.api.getServer.mockReturnValueOnce(obsolete.promise).mockResolvedValueOnce(server(2, 'current-server'));
    const wrapper = mountServer();

    route.params.serverId = '2';
    route.path = '/infrastructure/servers/2';
    await nextTick();
    await flushPromises();
    expect(wrapper.text()).toContain('current-server');

    obsolete.resolve(server(1, 'obsolete-server'));
    await flushPromises();
    expect(wrapper.text()).toContain('current-server');
    expect(wrapper.text()).not.toContain('obsolete-server');
    wrapper.unmount();
  });

  it('publishes only the latest overlapping refresh for the same server ID', async () => {
    const obsolete = deferred<Server | null>();
    const current = deferred<Server | null>();
    state.api.getServer
      .mockResolvedValueOnce(server(1, 'confirmed'))
      .mockReturnValueOnce(obsolete.promise)
      .mockReturnValueOnce(current.promise);
    route.query = { tab: 'monitoring' };
    const wrapper = mountServer();
    await flushPromises();

    await action(wrapper, 'server-refresh').trigger('click');
    await action(wrapper, 'server-refresh').trigger('click');
    current.resolve(server(1, 'current-refresh'));
    await flushPromises();
    obsolete.resolve(server(1, 'obsolete-refresh'));
    await flushPromises();

    expect(state.api.getServer).toHaveBeenCalledTimes(3);
    expect(wrapper.text()).toContain('current-refresh');
    expect(wrapper.text()).not.toContain('obsolete-refresh');
    wrapper.unmount();
  });

  it('locks maintenance while pending and ignores its completion after a route change', async () => {
    const mutation = deferred<Server | null>();
    state.api.getServer.mockResolvedValueOnce(server(1)).mockResolvedValueOnce(server(2, 'route-two'));
    state.api.setServerMaintenance.mockReturnValue(mutation.promise);
    const wrapper = mountServer();
    await flushPromises();

    await action(wrapper, 'server-maintenance').trigger('click');
    await action(wrapper, 'server-maintenance').trigger('click');
    expect(state.api.setServerMaintenance).toHaveBeenCalledTimes(1);
    expect(action(wrapper, 'server-maintenance').attributes('disabled')).toBeDefined();

    route.params.serverId = '2';
    route.path = '/infrastructure/servers/2';
    await nextTick();
    await flushPromises();
    expect(state.api.getServer).toHaveBeenCalledTimes(2);
    mutation.resolve({ ...server(1, 'obsolete-maintenance'), maintenance: true });
    await flushPromises();

    expect(wrapper.text()).toContain('route-two');
    expect(wrapper.text()).not.toContain('obsolete-maintenance');
    wrapper.unmount();
  });

  it('preserves confirmed data, reports a stable error, and unlocks maintenance after rejection', async () => {
    state.api.getServer.mockResolvedValue(server(1, 'confirmed-server'));
    state.api.setServerMaintenance.mockRejectedValue(new Error('internal maintenance failure'));
    const wrapper = mountServer();
    await flushPromises();

    await action(wrapper, 'server-maintenance').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('confirmed-server');
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('An unknown error occurred');
    expect(wrapper.text()).not.toContain('internal maintenance failure');
    expect(action(wrapper, 'server-maintenance').attributes('disabled')).toBeUndefined();
    wrapper.unmount();
  });

  it('locks node restart through its confirmed refresh and suppresses polling while a mutation owns the page', async () => {
    const restart = deferred<unknown>();
    const refreshed = deferred<Server | null>();
    state.api.getServer.mockResolvedValueOnce(server(1)).mockReturnValueOnce(refreshed.promise);
    state.api.restartServer.mockReturnValue(restart.promise);
    route.query = { tab: 'settings' };
    const wrapper = mountServer();
    await flushPromises();

    await action(wrapper, 'server-restart').trigger('click');
    await action(wrapper, 'server-restart').trigger('click');
    expect(state.api.restartServer).toHaveBeenCalledTimes(1);
    expect(action(wrapper, 'server-restart').attributes('disabled')).toBeDefined();
    expect(action(wrapper, 'server-maintenance').attributes('disabled')).toBeDefined();

    await vi.advanceTimersByTimeAsync(10_000);
    expect(state.api.getServer).toHaveBeenCalledTimes(1);

    restart.resolve(undefined);
    await flushPromises();
    expect(state.api.getServer).toHaveBeenCalledTimes(2);
    expect(action(wrapper, 'server-restart').attributes('disabled')).toBeDefined();

    refreshed.resolve(server(1, 'restarted'));
    await flushPromises();
    expect(wrapper.text()).toContain('restarted');
    expect(action(wrapper, 'server-restart').attributes('disabled')).toBeUndefined();
    wrapper.unmount();
  });

  it('does not present server restart as a workload action', async () => {
    state.api.getServer.mockResolvedValue(server(1));
    state.api.getOpsServices.mockResolvedValue([
      {
        server_id: 1,
        server_name: 'api-service',
        runtime: 'docker',
        status: 'healthy',
        containers: 2,
        cpu: 10,
        memory: 20,
      },
    ]);
    route.query = { tab: 'workloads' };
    const wrapper = mountServer();
    await flushPromises();

    const unsupported = action(wrapper, 'workload-restart-unsupported');
    expect(unsupported.attributes('disabled')).toBeDefined();
    expect(unsupported.text()).toBe('Unsupported');
    expect(wrapper.text()).toContain('Services & containers');
    expect(wrapper.text()).toContain('Events');
    expect(wrapper.text()).toContain('Settings');
    expect(wrapper.text()).not.toMatch(/[\u3400-\u9FFF]/);
    await unsupported.trigger('click');
    expect(state.api.restartServer).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('marks static monitoring range and export controls as unavailable', async () => {
    state.api.getServer.mockResolvedValue(server(1));
    route.query = { tab: 'monitoring' };
    const wrapper = mountServer();
    await flushPromises();

    for (const range of wrapper.findAll('button[data-action="metrics-range"]')) {
      expect(range.attributes('disabled')).toBeDefined();
    }
    expect(wrapper.findAll('button[data-action="metrics-range"]')).toHaveLength(4);
    expect(action(wrapper, 'metrics-export').attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('hides administrator-only deletion from normal users', async () => {
    state.auth.user = user(false);
    state.api.getServer.mockResolvedValue(server(1));
    route.query = { tab: 'settings' };
    const wrapper = mountServer();
    await flushPromises();

    expect(wrapper.text()).not.toContain('移除服务器');
    expect(state.api.deleteServer).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});
