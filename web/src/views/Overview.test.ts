import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Agent, PipelineFeed, QueueInfo, Repo, User } from '~/lib/api/types';

import Overview from './Overview.vue';

const state = vi.hoisted(() => ({
  api: {
    getAgents: vi.fn(),
    getPipeline: vi.fn(),
    getPipelineFeed: vi.fn(),
    getQueueInfo: vi.fn(),
  },
  auth: {
    user: null as User | null,
  },
  notifications: {
    notify: vi.fn(),
  },
  repoStore: null as {
    loadRepos: ReturnType<typeof vi.fn>;
    ownedRepos: Repo[];
    repos: Map<number, Repo>;
  } | null,
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => state.api,
}));

vi.mock('~/compositions/useAuthentication', () => ({
  default: () => state.auth,
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => state.notifications,
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

vi.mock('~/store/repos', () => ({
  useRepoStore: () => state.repoStore,
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

const OpsMetricCardStub = defineComponent({
  props: {
    hint: String,
    label: String,
    value: String,
  },
  setup(props) {
    return () => h('article', { 'data-metric': props.label }, `${props.label}:${props.value}:${props.hint}`);
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

function pipeline(
  repoId: number,
  number: number,
  status: PipelineFeed['status'],
  started = 100,
  finished = 160,
): PipelineFeed {
  return {
    id: number,
    repo_id: repoId,
    number,
    status,
    event: 'push',
    message: `pipeline-${number}`,
    branch: 'main',
    author: 'alice',
    created: 100,
    started,
    finished,
  } as PipelineFeed;
}

function repository(id: number, name: string, lastPipeline?: PipelineFeed): Repo {
  return {
    id,
    active: true,
    owner: 'acme',
    name,
    full_name: `acme/${name}`,
    forge_id: 1,
    forge_remote_id: `repo-${id}`,
    config_file: '.woodpecker.yml',
    default_branch: 'main',
    visibility: 'private',
    last_pipeline: lastPipeline,
  } as Repo;
}

function queue(pending = 0, blocked = 0, running = 0): QueueInfo {
  return {
    pending: [],
    waiting_on_deps: [],
    running: [],
    paused: false,
    stats: {
      worker_count: 2,
      pending_count: pending,
      waiting_on_deps_count: blocked,
      running_count: running,
      completed_count: 10,
    },
  };
}

function agent(id: number, noSchedule = false): Agent {
  return {
    id,
    name: `agent-${id}`,
    capacity: 2,
    no_schedule: noSchedule,
  } as Agent;
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

function mountOverview() {
  return mount(Overview, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        OpsMetricCard: OpsMetricCardStub,
        PrototypeIcon: true,
        RouterLink: RouterLinkStub,
        Scaffold: ScaffoldStub,
      },
    },
  });
}

function metric(wrapper: ReturnType<typeof mountOverview>, label: string) {
  return wrapper.get(`[data-metric="${label}"]`).text();
}

describe('operations overview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.auth.user = user(true);
    const feed = [
      pipeline(1, 3, 'running', 100, 0),
      pipeline(1, 2, 'success', 100, 220),
      pipeline(2, 1, 'failure', 100, 160),
    ];
    const repos = [repository(1, 'api', feed[0]), repository(2, 'web', feed[2])];
    state.repoStore = reactive({
      loadRepos: vi.fn().mockResolvedValue(undefined),
      ownedRepos: repos,
      repos: new Map(repos.map((repo) => [repo.id, repo])),
    });
    state.api.getPipelineFeed.mockResolvedValue(feed);
    state.api.getPipeline.mockResolvedValue(feed[0]);
    state.api.getAgents.mockResolvedValue([agent(1), agent(2, true)]);
    state.api.getQueueInfo.mockResolvedValue(queue(1, 1, 1));
  });

  it('renders real administrator metrics and requests administrator-only resources', async () => {
    const wrapper = mountOverview();
    await flushPromises();

    expect(metric(wrapper, 'Active pipelines')).toContain('1');
    expect(metric(wrapper, 'Success rate')).toContain('50.0%');
    expect(metric(wrapper, 'Average duration')).toContain('1m 30s');
    expect(metric(wrapper, 'Queue health')).toContain('86%');
    expect(wrapper.text()).toContain('Agent capacity');
    expect(state.api.getAgents).toHaveBeenCalledWith({ page: 1, perPage: 50 });
    expect(state.api.getQueueInfo).toHaveBeenCalledTimes(1);
  });

  it('keeps administrator APIs and controls absent for a normal user', async () => {
    state.auth.user = user(false);
    const wrapper = mountOverview();
    await flushPromises();

    expect(metric(wrapper, 'Repositories')).toContain('2');
    expect(wrapper.text()).not.toContain('Agent capacity');
    expect(state.api.getAgents).not.toHaveBeenCalled();
    expect(state.api.getQueueInfo).not.toHaveBeenCalled();
  });

  it('shows truthful initial loading and a retryable core failure instead of fake zero metrics', async () => {
    const repos = deferred<void>();
    const feed = deferred<PipelineFeed[]>();
    state.repoStore!.ownedRepos.splice(0);
    state.repoStore!.repos.clear();
    state.repoStore!.loadRepos.mockReturnValueOnce(repos.promise);
    state.api.getPipelineFeed.mockReturnValueOnce(feed.promise);
    const wrapper = mountOverview();
    await nextTick();

    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Loading overview');
    expect(wrapper.find('[data-metric="Success rate"]').exists()).toBe(false);

    repos.reject(new Error('repositories offline'));
    feed.reject(new Error('feed offline'));
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Overview data could not be loaded');

    state.repoStore!.loadRepos.mockResolvedValueOnce(undefined);
    state.api.getPipelineFeed.mockResolvedValueOnce([]);
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
    expect(wrapper.get('[data-metric="Success rate"]').text()).toContain('—');
  });

  it('preserves confirmed core data and reports an administrator-only partial failure', async () => {
    state.api.getAgents.mockRejectedValueOnce(new Error('agents offline'));
    const wrapper = mountOverview();
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Some overview data is unavailable');
    expect(metric(wrapper, 'Success rate')).toContain('50.0%');
    expect(wrapper.text()).toContain('Queue health');
    expect(wrapper.get('.agent-card').text()).toContain('Agent capacity is unavailable');
    expect(wrapper.get('.agent-card').text()).not.toMatch(/Capacity0|Online0|Busy0|Disabled0/);
  });

  it('does not present an unconfirmed repository count as zero for a normal user', async () => {
    state.auth.user = user(false);
    state.repoStore!.ownedRepos.splice(0);
    state.repoStore!.repos.clear();
    state.repoStore!.loadRepos.mockRejectedValueOnce(new Error('repositories offline'));
    const wrapper = mountOverview();
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Some overview data is unavailable');
    expect(metric(wrapper, 'Repositories')).toContain('—');
    expect(metric(wrapper, 'Repositories')).toContain('Repository count is unavailable');
    expect(wrapper.text()).toContain('Repository health is unavailable');
  });

  it('preserves confirmed repository data when a normal-user refresh loses the repository request', async () => {
    state.auth.user = user(false);
    const wrapper = mountOverview();
    await flushPromises();
    expect(metric(wrapper, 'Repositories')).toContain('2');

    state.repoStore!.loadRepos.mockRejectedValueOnce(new Error('repositories offline'));
    await (wrapper.vm as unknown as { loadDashboard: (notify: boolean) => Promise<void> }).loadDashboard(true);
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Some overview data is unavailable');
    expect(metric(wrapper, 'Repositories')).toContain('2');
    expect(wrapper.text()).not.toContain('Repository count is unavailable');
  });

  it('preserves confirmed administrator metrics when optional refresh requests fail', async () => {
    const wrapper = mountOverview();
    await flushPromises();
    expect(wrapper.get('.capacity-donut strong').text()).toBe('4');
    expect(metric(wrapper, 'Queue health')).toContain('86%');

    state.api.getAgents.mockRejectedValueOnce(new Error('agents offline'));
    state.api.getQueueInfo.mockRejectedValueOnce(new Error('queue offline'));
    await (wrapper.vm as unknown as { loadDashboard: (notify: boolean) => Promise<void> }).loadDashboard(true);
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Some overview data is unavailable');
    expect(wrapper.get('.capacity-donut strong').text()).toBe('4');
    expect(wrapper.get('.agent-card').text()).not.toContain('Agent capacity is unavailable');
    expect(metric(wrapper, 'Queue health')).toContain('86%');
  });

  it('allows only the newest overlapping refresh to replace confirmed feed data', async () => {
    const wrapper = mountOverview();
    await flushPromises();

    const obsolete = deferred<PipelineFeed[]>();
    const current = deferred<PipelineFeed[]>();
    state.api.getPipelineFeed.mockReturnValueOnce(obsolete.promise).mockReturnValueOnce(current.promise);

    const firstRefresh = (wrapper.vm as unknown as { loadDashboard: (notify: boolean) => Promise<void> }).loadDashboard(
      true,
    );
    const secondRefresh = (
      wrapper.vm as unknown as { loadDashboard: (notify: boolean) => Promise<void> }
    ).loadDashboard(true);
    current.resolve([pipeline(1, 8, 'success')]);
    await secondRefresh;
    obsolete.resolve([pipeline(1, 7, 'failure')]);
    await firstRefresh;
    await flushPromises();

    expect(metric(wrapper, 'Success rate')).toContain('100.0%');
    expect(state.notifications.notify).toHaveBeenCalledTimes(1);
  });
});
