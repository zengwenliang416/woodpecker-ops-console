import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Pipeline, PipelineStatus, Repo, RepoPermissions } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types';

import PipelineWrapper from './PipelineWrapper.vue';

const testState = vi.hoisted(() => ({
  pipeline: undefined as Pipeline | undefined,
  releases: [] as Array<{ id: number; application_id: number; pipeline_id: number }>,
  route: { name: 'repo-pipeline' },
  routerPush: vi.fn(),
  loadPipeline: vi.fn(),
  loadApplications: vi.fn(),
  updateFavicon: vi.fn(),
  notify: vi.fn(),
  api: {
    getPipelineConfig: vi.fn(),
    cancelPipeline: vi.fn(),
    restartPipeline: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => testState.route,
  useRouter: () => ({
    push: testState.routerPush,
  }),
}));

vi.mock('~/store/pipelines', async () => {
  const { computed } = await import('vue');
  return {
    usePipelineStore: () => ({
      getPipeline: () => computed(() => testState.pipeline),
      loadPipeline: testState.loadPipeline,
    }),
  };
});

vi.mock('~/store/ops', () => ({
  useApplicationStore: () => ({
    get releaseList() {
      return testState.releases;
    },
    loadAll: testState.loadApplications,
  }),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => testState.api,
}));

vi.mock('~/compositions/useFavicon', () => ({
  useFavicon: () => ({
    updateStatus: testState.updateFavicon,
  }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: testState.notify,
  }),
}));

vi.mock('~/compositions/useRouteBack', () => ({
  useRouteBack: () => vi.fn(),
}));

const ScaffoldStub = defineComponent({
  name: 'Scaffold',
  setup(_, { slots }) {
    return () =>
      h('main', [
        h('section', { 'data-slot': 'title' }, slots.title?.()),
        h('section', { 'data-slot': 'header-actions' }, slots.headerActions?.()),
        h('section', { 'data-slot': 'tab-actions' }, slots.tabActions?.()),
        h('section', { 'data-slot': 'content' }, slots.default?.()),
      ]);
  },
});

const ButtonStub = defineComponent({
  name: 'Button',
  props: {
    text: String,
    to: [String, Object],
    isLoading: Boolean,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-action': props.text,
          'data-to': props.to !== undefined ? JSON.stringify(props.to) : undefined,
          'aria-busy': props.isLoading ? 'true' : undefined,
          onClick: () => emit('click'),
        },
        props.text,
      );
  },
});

const TabStub = defineComponent({
  name: 'Tab',
  props: {
    title: String,
    to: Object,
    count: Number,
  },
  setup(props) {
    return () =>
      h('a', {
        'data-tab': props.title,
        'data-to': JSON.stringify(props.to),
        'data-count': props.count,
      });
  },
});

const PipelineStatusIconStub = defineComponent({
  name: 'PipelineStatusIcon',
  props: { status: String },
  setup(props) {
    return () => h('span', { 'data-status-icon': props.status });
  },
});

const RenderMarkdownStub = defineComponent({
  name: 'RenderMarkdown',
  props: { content: String },
  setup(props) {
    return () => h('span', props.content);
  },
});

const DeployPipelinePopupStub = defineComponent({
  name: 'DeployPipelinePopup',
  props: {
    pipelineNumber: String,
    open: Boolean,
  },
  setup(props) {
    return () =>
      h('div', {
        'data-testid': 'deploy-pipeline-popup',
        'data-pipeline-number': props.pipelineNumber,
        'data-open': props.open ? 'true' : 'false',
      });
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function pipeline(overrides: Partial<Pipeline> = {}): Pipeline {
  return {
    id: 842,
    number: 842,
    parent: 0,
    event: WebhookEvents.Push,
    event_reason: [],
    status: 'running',
    created: 1_754_386_363,
    updated: 1_754_386_480,
    started: 1_754_386_381,
    finished: 0,
    deploy_to: '',
    commit: 'abcdef1234567890',
    branch: 'main',
    message: 'fix: preserve pipeline contracts',
    timestamp: 1_754_386_360,
    ref: 'refs/heads/main',
    refspec: '',
    clone_url: '',
    title: '',
    sender: 'alice',
    author: 'alice',
    author_avatar: '',
    author_email: 'alice@example.com',
    forge_url: '',
    reviewed_by: '',
    reviewed: 0,
    changed_files: [],
    cancel_info: {
      canceled_by_user: '',
      canceled_by_step: '',
      superseded_by: 0,
    },
    version: '3.0.0',
    workflows: [],
    ...overrides,
  };
}

function mountWrapper({
  currentPipeline = pipeline(),
  permissions = { pull: true, push: true, admin: false },
  repo = { id: 101, org_id: 7, owner: 'acme', name: 'backend-api', allow_deploy: true },
}: {
  currentPipeline?: Pipeline;
  permissions?: Partial<RepoPermissions>;
  repo?: Partial<Repo>;
} = {}) {
  testState.pipeline = currentPipeline;

  return mount(PipelineWrapper, {
    props: {
      repoId: '101',
      pipelineId: '842',
    },
    global: {
      plugins: [i18n],
      provide: {
        repo: ref(repo),
        'repo-permissions': ref(permissions),
      },
      stubs: {
        Scaffold: ScaffoldStub,
        Button: ButtonStub,
        Tab: TabStub,
        PipelineStatusIcon: PipelineStatusIconStub,
        RenderMarkdown: RenderMarkdownStub,
        DeployPipelinePopup: DeployPipelinePopupStub,
        Icon: true,
        RouterLink: defineComponent({
          props: {
            to: [String, Object],
          },
          setup(props, { slots }) {
            return () =>
              h(
                'a',
                {
                  'data-router-to': props.to !== undefined ? JSON.stringify(props.to) : undefined,
                },
                slots.default?.(),
              );
          },
        }),
        RouterView: true,
      },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  testState.releases = [];
  testState.api.getPipelineConfig.mockResolvedValue([]);
  testState.api.cancelPipeline.mockResolvedValue(undefined);
  testState.api.restartPipeline.mockResolvedValue(pipeline({ id: 843, number: 843 }));
  testState.loadPipeline.mockResolvedValue(undefined);
  testState.loadApplications.mockResolvedValue(undefined);
});

describe('pipeline detail header', () => {
  it('renders translated status and real pipeline metadata in the approved hierarchy', async () => {
    const wrapper = mountWrapper();
    await flushPromises();

    expect(wrapper.get('[data-testid="pipeline-detail-eyebrow"]').text()).toBe('backend-api/Pipeline');
    expect(wrapper.get('[data-testid="pipeline-detail-eyebrow"]').text()).not.toContain('acme');
    expect(wrapper.get('[data-testid="pipeline-detail-heading"]').text()).toContain('Pipeline #842');
    expect(wrapper.get('[data-testid="pipeline-status"]').text()).toContain('running');
    expect(wrapper.get('[data-testid="pipeline-message"]').text()).toContain('fix: preserve pipeline contracts');

    const metadata = wrapper.get('[data-testid="pipeline-metadata"]').text();
    expect(metadata).toContain('main');
    expect(metadata).toContain('Push');
    expect(metadata).toContain('alice');
    expect(metadata).toContain('abcdef1234');
  });

  it.each([
    ['blocked', 'blocked'],
    ['declined', 'declined'],
    ['error', 'error'],
    ['failure', 'failure'],
    ['killed', 'killed'],
    ['pending', 'pending'],
    ['running', 'running'],
    ['skipped', 'skipped'],
    ['started', 'started'],
    ['success', 'success'],
    ['canceled', 'canceled'],
  ] satisfies Array<[PipelineStatus, string]>)('renders the translated %s status', async (status, expected) => {
    const wrapper = mountWrapper({ currentPipeline: pipeline({ status }) });
    await flushPromises();

    expect(wrapper.get('[data-testid="pipeline-status"]').text()).toContain(expected);
  });

  it.each([
    [WebhookEvents.Push, 'Push'],
    [WebhookEvents.Tag, 'Tag'],
    [WebhookEvents.Release, 'Release'],
    [WebhookEvents.PullRequest, 'Pull Request'],
    [WebhookEvents.PullRequestClosed, 'Pull Request merged/closed'],
    [WebhookEvents.PullRequestMetadata, 'Pull Request metadata changed'],
    [WebhookEvents.Deploy, 'Deploy'],
    [WebhookEvents.Cron, 'Cron'],
    [WebhookEvents.Manual, 'Manual'],
  ])('renders the translated %s trigger event', async (event, expected) => {
    const wrapper = mountWrapper({ currentPipeline: pipeline({ event }) });
    await flushPromises();

    expect(wrapper.get('[data-testid="pipeline-metadata"]').text()).toContain(expected);
  });

  it('preserves cancel and retry API intent and routes to the returned pipeline', async () => {
    const wrapper = mountWrapper();
    await flushPromises();

    await wrapper.get('[data-action="Cancel"]').trigger('click');
    await wrapper.get('[data-action="Retry"]').trigger('click');
    await flushPromises();

    expect(testState.api.cancelPipeline).toHaveBeenCalledWith(101, 842);
    expect(testState.api.restartPipeline).toHaveBeenCalledWith(101, '842', { fork: true });
    expect(testState.routerPush).toHaveBeenCalledWith({
      name: 'repo-pipeline',
      params: { pipelineId: 843 },
    });
  });

  it('shows cancel for a pending pipeline and retry for a terminal non-blocked pipeline', async () => {
    const pendingWrapper = mountWrapper({ currentPipeline: pipeline({ status: 'pending' }) });
    await flushPromises();

    expect(pendingWrapper.find('[data-action="Cancel"]').exists()).toBe(true);
    expect(pendingWrapper.find('[data-action="Retry"]').exists()).toBe(true);

    pendingWrapper.unmount();
    const failureWrapper = mountWrapper({ currentPipeline: pipeline({ status: 'failure' }) });
    await flushPromises();

    expect(failureWrapper.find('[data-action="Cancel"]').exists()).toBe(false);
    expect(failureWrapper.find('[data-action="Retry"]').exists()).toBe(true);
    expect(failureWrapper.find('[data-action="Deploy"]').exists()).toBe(false);
  });

  it('hides deploy when the repository disables deployment', async () => {
    const wrapper = mountWrapper({
      currentPipeline: pipeline({ status: 'success', finished: 1_754_386_500 }),
      repo: { id: 101, org_id: 7, owner: 'acme', name: 'backend-api', allow_deploy: false },
    });
    await flushPromises();

    expect(wrapper.find('[data-action="Retry"]').exists()).toBe(true);
    expect(wrapper.find('[data-action="Deploy"]').exists()).toBe(false);
  });

  it('exposes shared busy semantics while retry is pending', async () => {
    let resolveRestart: ((value: Pipeline) => void) | undefined;
    testState.api.restartPipeline.mockImplementation(
      async () =>
        new Promise<Pipeline>((resolve) => {
          resolveRestart = resolve;
        }),
    );
    const wrapper = mountWrapper({ currentPipeline: pipeline({ status: 'failure' }) });
    await flushPromises();

    await wrapper.get('[data-action="Retry"]').trigger('click');

    expect(wrapper.get('[data-action="Retry"]').attributes('aria-busy')).toBe('true');

    resolveRestart?.(pipeline({ id: 843, number: 843 }));
    await flushPromises();

    expect(wrapper.get('[data-action="Retry"]').attributes('aria-busy')).toBeUndefined();
  });

  it('uses the real release mapping for a successful deploy action', async () => {
    testState.releases = [{ id: 55, application_id: 9, pipeline_id: 842 }];
    const wrapper = mountWrapper({
      currentPipeline: pipeline({ status: 'success', finished: 1_754_386_500 }),
    });
    await flushPromises();

    expect(wrapper.find('[data-action="Cancel"]').exists()).toBe(false);
    expect(wrapper.find('[data-action="Retry"]').exists()).toBe(true);
    expect(wrapper.get('[data-action="Deploy"]').attributes('data-to')).toBe(
      JSON.stringify({
        path: '/deployments/new',
        query: { applicationId: 9, releaseId: 55 },
      }),
    );
  });

  it('keeps read-only routes reachable while hiding mutation and debug controls without push permission', async () => {
    const wrapper = mountWrapper({
      currentPipeline: pipeline({
        status: 'success',
        changed_files: [],
        errors: [],
      }),
      permissions: { pull: true, push: false, admin: false },
    });
    await flushPromises();

    expect(wrapper.find('[data-action="Cancel"]').exists()).toBe(false);
    expect(wrapper.find('[data-action="Retry"]').exists()).toBe(false);
    expect(wrapper.find('[data-action="Deploy"]').exists()).toBe(false);

    expect(wrapper.findAll('[data-tab]').map((tab) => tab.attributes('data-tab'))).toEqual([
      'Overview',
      'Changed files',
      'Config',
      'Errors',
    ]);
  });

  it('binds tabs to the existing named routes and reports real changed-file and error counts', async () => {
    const wrapper = mountWrapper({
      currentPipeline: pipeline({
        changed_files: ['src/main.ts', 'README.md'],
        errors: [{ type: 'linter', message: 'missing image', is_warning: false }],
        workflows: [
          {
            id: 1,
            pipeline_id: 842,
            pid: 10,
            name: 'build',
            state: 'failure',
            error: 'container failed',
            children: [],
          },
        ],
      }),
    });
    await flushPromises();

    expect(
      wrapper.findAll('[data-tab]').map((tab) => ({
        title: tab.attributes('data-tab'),
        to: tab.attributes('data-to'),
        count: tab.attributes('data-count'),
      })),
    ).toEqual([
      { title: 'Overview', to: JSON.stringify({ name: 'repo-pipeline' }), count: undefined },
      {
        title: 'Changed files',
        to: JSON.stringify({ name: 'repo-pipeline-changed-files' }),
        count: '2',
      },
      { title: 'Config', to: JSON.stringify({ name: 'repo-pipeline-config' }), count: undefined },
      { title: 'Errors', to: JSON.stringify({ name: 'repo-pipeline-errors' }), count: '2' },
      { title: 'Debug', to: JSON.stringify({ name: 'repo-pipeline-debug' }), count: undefined },
    ]);
  });

  it.each([
    [
      { canceled_by_user: '', canceled_by_step: '', superseded_by: 843 },
      'Superseded by #843',
      { name: 'repo-pipeline', params: { pipelineId: 843 } },
    ],
    [{ canceled_by_user: 'alice', canceled_by_step: '', superseded_by: 0 }, 'Canceled by alice', undefined],
    [{ canceled_by_user: '', canceled_by_step: 'build', superseded_by: 0 }, 'Canceled due to build', undefined],
  ])(
    'renders killed pipeline cancellation context from the current pipeline data',
    async (cancelInfo, text, target) => {
      const wrapper = mountWrapper({
        currentPipeline: pipeline({
          status: 'killed',
          cancel_info: cancelInfo,
        }),
      });
      await flushPromises();

      const cancellation = wrapper.get('[data-slot="tab-actions"]');
      expect(cancellation.text()).toContain(text);
      if (target) {
        expect(cancellation.get('[data-router-to]').attributes('data-router-to')).toBe(JSON.stringify(target));
      } else {
        expect(cancellation.find('[data-router-to]').exists()).toBe(false);
      }
    },
  );

  it('keeps the completed pipeline header and action groups wrap-safe for narrow viewports', async () => {
    const wrapper = mountWrapper();
    await flushPromises();

    expect(wrapper.get('[data-testid="pipeline-detail-heading"]').classes()).toContain('min-w-0');
    expect(wrapper.get('[data-testid="pipeline-detail-eyebrow"]').classes()).toContain('flex-wrap');
    expect(wrapper.get('[data-testid="pipeline-metadata"]').classes()).toContain('flex-wrap');
    expect(wrapper.get('[data-slot="header-actions"] > div').classes()).toContain('flex-wrap');
    expect(wrapper.get('[data-slot="tab-actions"] > div').classes()).toContain('flex-wrap');
  });

  it('keeps blocked pipelines mutation-free while retaining permission-gated debug access', async () => {
    const wrapper = mountWrapper({
      currentPipeline: pipeline({ status: 'blocked' }),
    });
    await flushPromises();

    expect(wrapper.get('[data-testid="pipeline-status"]').text()).toContain('blocked');
    expect(wrapper.find('[data-action="Cancel"]').exists()).toBe(false);
    expect(wrapper.find('[data-action="Retry"]').exists()).toBe(false);
    expect(wrapper.find('[data-action="Deploy"]').exists()).toBe(false);
    expect(wrapper.findAll('[data-tab]').map((tab) => tab.attributes('data-tab'))).toContain('Debug');
  });

  it('opens the existing deploy popup when a successful pipeline has no release mapping', async () => {
    const wrapper = mountWrapper({
      currentPipeline: pipeline({ status: 'success', finished: 1_754_386_500 }),
    });
    await flushPromises();

    expect(wrapper.get('[data-action="Deploy"]').attributes('data-to')).toBeUndefined();
    expect(wrapper.get('[data-testid="deploy-pipeline-popup"]').attributes('data-open')).toBe('false');

    await wrapper.get('[data-action="Deploy"]').trigger('click');

    expect(wrapper.get('[data-testid="deploy-pipeline-popup"]').attributes('data-open')).toBe('true');
    expect(wrapper.get('[data-testid="deploy-pipeline-popup"]').attributes('data-pipeline-number')).toBe('842');
  });
});
