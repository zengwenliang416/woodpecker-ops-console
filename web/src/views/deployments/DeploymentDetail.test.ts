import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import zhHans from '~/assets/locales/zh-Hans.json';
import type {
  Application,
  AppRelease,
  Deployment,
  DeploymentDetail,
  Environment,
  Server,
  ServerGroup,
} from '~/lib/api/types';

import DeploymentDetailView from './DeploymentDetail.vue';

const state = vi.hoisted(() => ({
  api: {
    advanceDeployment: vi.fn(),
    approveDeployment: vi.fn(),
    cancelDeployment: vi.fn(),
    pauseDeployment: vi.fn(),
    rejectDeployment: vi.fn(),
    resumeDeployment: vi.fn(),
    retryDeployment: vi.fn(),
    rollbackDeployment: vi.fn(),
  },
  applications: null as {
    applications: Map<number, Application>;
    applicationList: Application[];
    environments: Map<number, Environment>;
    environmentList: Environment[];
    loadAll: ReturnType<typeof vi.fn>;
    releaseList: AppRelease[];
    releases: Map<number, AppRelease>;
  } | null,
  deployments: null as {
    deploymentList: Deployment[];
    loadDeployments: ReturnType<typeof vi.fn>;
    loadDetail: ReturnType<typeof vi.fn>;
    pendingApprovals: Deployment[];
  } | null,
  route: { params: { deploymentId: '1' } },
  router: { push: vi.fn() },
  servers: null as {
    groups: Map<number, ServerGroup>;
    loadAll: ReturnType<typeof vi.fn>;
    servers: Map<number, Server>;
  } | null,
}));

vi.mock('vue-router', () => ({
  useRoute: () => state.route,
  useRouter: () => state.router,
}));
vi.mock('~/compositions/useApiClient', () => ({ default: () => state.api }));
vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));
vi.mock('~/store/ops', () => ({
  useApplicationStore: () => state.applications,
  useDeploymentStore: () => state.deployments,
  useServerStore: () => state.servers,
}));

const ButtonStub = defineComponent({
  inheritAttrs: false,
  props: {
    disabled: Boolean,
    isLoading: Boolean,
    text: String,
    title: String,
  },
  emits: ['click'],
  setup(props, { attrs, emit }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          disabled: props.disabled || props.isLoading,
          title: props.title ?? props.text,
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
        h('span', props.description),
        slots.action?.(),
      ]);
  },
});

function deferred<T>() {
  let rejectValue!: (reason?: unknown) => void;
  let resolveValue!: (value: T) => void;
  const promise = new Promise<T>((resolve, reject) => {
    rejectValue = reject;
    resolveValue = resolve;
  });
  return { promise, reject: rejectValue, resolve: resolveValue };
}

function deployment(id: number, status: Deployment['status'] = 'running'): Deployment {
  return {
    id,
    application_id: 1,
    environment_id: 1,
    release_id: 1,
    group_id: 1,
    status,
    strategy: 'rolling',
    batch_size: 1,
    progress: status === 'success' ? 100 : 50,
    triggered_by: 'octocat',
    created: Date.parse('2026-08-13T12:00:00.000Z') / 1000,
  };
}

function detail(id: number, status: Deployment['status'] = 'running'): DeploymentDetail {
  return {
    deployment: deployment(id, status),
    approvals: [],
    targets: [
      {
        deployment_id: id,
        server_id: 1,
        status: status === 'failed' ? 'failed' : 'healthy',
        phase: status === 'failed' ? 'health_check' : 'healthy',
      },
    ],
  };
}

function mountDetail(locale: 'en' | 'zh-Hans' = 'en') {
  return mount(DeploymentDetailView, {
    global: {
      plugins: [
        createI18n({
          legacy: false,
          locale,
          messages: { en, 'zh-Hans': zhHans },
        }),
      ],
      stubs: {
        Button: ButtonStub,
        DeploymentNav: true,
        FeedbackState: FeedbackStateStub,
        Icon: true,
        RouterLink: {
          props: ['to'],
          template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
        },
        Scaffold: {
          template: '<section><header><slot name="title" /><slot name="headerActions" /></header><slot /></section>',
        },
      },
    },
  });
}

describe('deployment detail', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    state.route = reactive({ params: { deploymentId: '1' } });
    state.applications = reactive({
      applications: new Map<number, Application>([
        [1, { id: 1, name: 'api', image: 'example/api:1', runtime: 'docker-compose', service: 'api' }],
      ]),
      applicationList: [] as Application[],
      environments: new Map<number, Environment>([
        [
          1,
          {
            id: 1,
            name: 'production',
            title: 'Production',
            protected: true,
            approval_required: true,
            minimum_approvers: 1,
            auto_rollback: true,
          },
        ],
      ]),
      environmentList: [] as Environment[],
      loadAll: vi.fn().mockResolvedValue(undefined),
      releaseList: [] as AppRelease[],
      releases: new Map<number, AppRelease>([
        [
          1,
          {
            id: 1,
            application_id: 1,
            pipeline_id: 1,
            version: 'v1.0.0',
            digest: 'sha256:one',
            status: 'ready',
          },
        ],
      ]),
    });
    state.deployments = reactive({
      deploymentList: [],
      loadDeployments: vi.fn().mockResolvedValue(undefined),
      loadDetail: vi.fn().mockResolvedValue(detail(1)),
      pendingApprovals: [],
    });
    state.servers = reactive({
      groups: new Map<number, ServerGroup>([
        [1, { id: 1, environment_id: 1, name: 'prod-api', strategy: 'rolling', batch_size: 1 }],
      ]),
      loadAll: vi.fn().mockResolvedValue(undefined),
      servers: new Map<number, Server>([
        [
          1,
          {
            id: 1,
            group_id: 1,
            environment_id: 1,
            name: 'prod-1',
            status: 'online',
            health: 'healthy',
            cpu: 10,
            memory: 20,
            disk: 30,
            load: 1,
            maintenance: false,
          },
        ],
      ]),
    });
    for (const mutation of Object.values(state.api)) mutation.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('retries an initial failure and distinguishes a missing deployment', async () => {
    state.deployments!.loadDetail.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(null);
    const wrapper = mountDetail();
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Unable to load deployment');
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('Deployment not found');
  });

  it('ignores an obsolete detail response after the route changes', async () => {
    const first = deferred<DeploymentDetail | null>();
    const second = deferred<DeploymentDetail | null>();
    state.deployments!.loadDetail.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const wrapper = mountDetail();

    state.route.params.deploymentId = '2';
    await flushPromises();
    second.resolve(detail(2, 'success'));
    await flushPromises();
    expect(wrapper.text()).toContain('DEP-2');

    first.resolve(detail(1, 'failed'));
    await flushPromises();
    expect(wrapper.text()).toContain('DEP-2');
    expect(wrapper.text()).not.toContain('DEP-1');
  });

  it('prevents duplicate mutations and preserves confirmed data after failure', async () => {
    const action = deferred<unknown>();
    state.api.pauseDeployment.mockReturnValueOnce(action.promise);
    const wrapper = mountDetail();
    await flushPromises();

    const pauseButton = wrapper.findAll('header button').find((button) => button.text() === 'Pause');
    expect(pauseButton).toBeDefined();
    await pauseButton!.trigger('click');
    await pauseButton!.trigger('click');
    expect(state.api.pauseDeployment).toHaveBeenCalledTimes(1);
    expect(wrapper.findAll('header button').every((button) => button.attributes('disabled') !== undefined)).toBe(true);

    action.reject(new Error('offline'));
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Deployment action failed');
    expect(wrapper.text()).toContain('v1.0.0');
  });

  it('keeps mutation ownership through the confirming reload', async () => {
    vi.useFakeTimers();
    const action = deferred<unknown>();
    const confirmation = deferred<DeploymentDetail | null>();
    state.api.pauseDeployment.mockReturnValueOnce(action.promise);
    state.deployments!.loadDetail.mockResolvedValueOnce(detail(1)).mockReturnValueOnce(confirmation.promise);
    const wrapper = mountDetail();
    await flushPromises();
    expect(state.deployments!.loadDetail).toHaveBeenCalledTimes(1);

    const pauseButton = wrapper.findAll('header button').find((button) => button.text() === 'Pause')!;
    await pauseButton.trigger('click');
    action.resolve(undefined);
    await flushPromises();

    expect(state.deployments!.loadDetail).toHaveBeenCalledTimes(2);
    expect(pauseButton.attributes('disabled')).toBeDefined();
    await pauseButton.trigger('click');
    expect(state.api.pauseDeployment).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(6_000);
    expect(state.deployments!.loadDetail).toHaveBeenCalledTimes(2);

    confirmation.resolve(detail(1, 'paused'));
    await flushPromises();
    expect(state.deployments!.loadDetail).toHaveBeenCalledTimes(2);
    expect(wrapper.findAll('header button').some((button) => button.text() === 'Resume')).toBe(true);
    wrapper.unmount();
  });

  it('unlocks after a confirming reload failure while retaining confirmed data', async () => {
    const action = deferred<unknown>();
    const confirmation = deferred<DeploymentDetail | null>();
    state.api.pauseDeployment.mockReturnValueOnce(action.promise);
    state.deployments!.loadDetail.mockResolvedValueOnce(detail(1)).mockReturnValueOnce(confirmation.promise);
    const wrapper = mountDetail();
    await flushPromises();

    const pauseButton = wrapper.findAll('header button').find((button) => button.text() === 'Pause')!;
    await pauseButton.trigger('click');
    action.resolve(undefined);
    await flushPromises();
    confirmation.reject(new Error('confirmation offline'));
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain(
      'The last confirmed deployment remains visible.',
    );
    expect(wrapper.text()).toContain('v1.0.0');
    expect(pauseButton.attributes('disabled')).toBeUndefined();

    await pauseButton.trigger('click');
    expect(state.api.pauseDeployment).toHaveBeenCalledTimes(2);
  });

  it('renders deployment API vocabulary through Simplified Chinese labels', async () => {
    state.deployments!.loadDetail.mockResolvedValueOnce({
      ...detail(1, 'running'),
      deployment: {
        ...deployment(1, 'running'),
        triggered_by: 'system',
      },
      targets: [
        {
          deployment_id: 1,
          server_id: 1,
          status: 'deploying',
          phase: 'pulling',
        },
      ],
    });
    const wrapper = mountDetail('zh-Hans');
    await flushPromises();

    expect(wrapper.text()).toContain('运行中');
    expect(wrapper.text()).toContain('滚动部署');
    expect(wrapper.text()).toContain('正在拉取不可变镜像');
    expect(wrapper.text()).toContain('系统');
    expect(wrapper.text()).not.toMatch(/\brunning\b|\brolling\b|\bpulling\b|\bsystem\b/i);
  });
});
