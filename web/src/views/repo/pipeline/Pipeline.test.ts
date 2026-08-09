import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { PipelineConfig, Pipeline as PipelineData, RepoPermissions } from '~/lib/api/types';
import { StepType, WebhookEvents } from '~/lib/api/types';

import Pipeline from './Pipeline.vue';

const testState = vi.hoisted(() => ({
  route: { params: { repoId: '101', pipelineId: '842', stepId: '' } },
  routerReplace: vi.fn(),
  notify: vi.fn(),
  api: {
    approvePipeline: vi.fn(),
    declinePipeline: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => testState.route,
  useRouter: () => ({
    replace: testState.routerReplace,
  }),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => testState.api,
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: testState.notify,
  }),
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const ContainerStub = defineComponent({
  name: 'Container',
  setup(_, { slots }) {
    return () => h('main', slots.default?.());
  },
});

const PanelStub = defineComponent({
  name: 'Panel',
  setup(_, { slots }) {
    return () => h('section', slots.default?.());
  },
});

const ButtonStub = defineComponent({
  name: 'Button',
  props: {
    text: String,
    to: Object,
    isLoading: Boolean,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-action': props.text,
          'data-to': props.to ? JSON.stringify(props.to) : undefined,
          'aria-busy': props.isLoading ? 'true' : undefined,
          onClick: () => emit('click'),
        },
        props.text,
      );
  },
});

const PipelineStepListStub = defineComponent({
  name: 'PipelineStepList',
  emits: ['update:selectedStepId'],
  setup(_, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-testid': 'step-list-select',
          onClick: () => emit('update:selectedStepId', 12),
        },
        'select step',
      );
  },
});

const PipelineLogStub = defineComponent({
  name: 'PipelineLog',
  props: {
    stepId: Number,
  },
  setup(props) {
    return () => h('section', { 'data-testid': 'pipeline-log', 'data-step-id': props.stepId });
  },
});

const PipelineStatusIconStub = defineComponent({
  name: 'PipelineStatusIcon',
  props: {
    status: String,
  },
  setup(props) {
    return () => h('span', { 'data-status-icon': props.status });
  },
});

const BadgeStub = defineComponent({
  name: 'Badge',
  props: {
    label: String,
    value: String,
  },
  setup(props) {
    return () => h('span', `${props.label}:${props.value}`);
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function pipeline(overrides: Partial<PipelineData> = {}): PipelineData {
  return {
    id: 842,
    number: 842,
    parent: 0,
    event: WebhookEvents.Push,
    event_reason: [],
    status: 'running',
    created: 100,
    updated: 220,
    started: 100,
    finished: 0,
    deploy_to: '',
    commit: 'abcdef1234567890',
    branch: 'main',
    message: 'feat: expose real execution context',
    timestamp: 100,
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
    workflows: [
      {
        id: 1,
        pipeline_id: 842,
        pid: 10,
        name: 'build',
        state: 'failure',
        environ: {
          platform: 'linux/amd64',
          region: 'us-east',
        },
        started: 100,
        finished: 160,
        agent_id: 7,
        children: [
          {
            id: 11,
            uuid: 'step-install',
            pipeline_id: 842,
            pid: 11,
            ppid: 10,
            name: 'install',
            state: 'success',
            exit_code: 0,
            started: 100,
            finished: 120,
            type: StepType.Commands,
          },
          {
            id: 12,
            uuid: 'step-test',
            pipeline_id: 842,
            pid: 12,
            ppid: 10,
            name: 'test',
            state: 'failure',
            exit_code: 1,
            started: 120,
            finished: 160,
            type: StepType.Commands,
          },
        ],
      },
      {
        id: 2,
        pipeline_id: 842,
        pid: 20,
        name: 'publish',
        state: 'running',
        started: 160,
        finished: 0,
        agent_id: 9,
        children: [
          {
            id: 21,
            uuid: 'step-publish',
            pipeline_id: 842,
            pid: 21,
            ppid: 20,
            name: 'publish image',
            state: 'pending',
            exit_code: 0,
            type: StepType.Plugin,
          },
        ],
      },
    ],
    ...overrides,
  };
}

function mountPipeline({
  currentPipeline = pipeline(),
  stepId = null,
  permissions = { pull: true, push: true, admin: false },
  configs = [{ hash: 'config-hash', name: '.woodpecker.yml', data: 'c3RlcHM6' }],
}: {
  currentPipeline?: PipelineData;
  stepId?: string | null;
  permissions?: Partial<RepoPermissions>;
  configs?: PipelineConfig[];
} = {}) {
  return mount(Pipeline, {
    props: {
      stepId,
    },
    global: {
      plugins: [i18n],
      provide: {
        pipeline: ref(currentPipeline),
        repo: ref({ id: 101, owner: 'acme', name: 'backend-api', full_name: 'acme/backend-api' }),
        'repo-permissions': ref(permissions),
        'pipeline-configs': ref(configs),
      },
      stubs: {
        Container: ContainerStub,
        Panel: PanelStub,
        Button: ButtonStub,
        PipelineStepList: PipelineStepListStub,
        PipelineLog: PipelineLogStub,
        PipelineStatusIcon: PipelineStatusIconStub,
        Badge: BadgeStub,
        Icon: true,
      },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  testState.route.params = { repoId: '101', pipelineId: '842', stepId: '' };
  testState.api.approvePipeline.mockResolvedValue(undefined);
  testState.api.declinePipeline.mockResolvedValue(undefined);
});

describe('pipeline overview', () => {
  it('opens on the execution overview instead of implicitly selecting the first desktop step', () => {
    const wrapper = mountPipeline();

    expect(wrapper.find('[data-testid="pipeline-overview"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="pipeline-log"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="workflow-count"]').text()).toContain('2');
    expect(wrapper.get('[data-testid="step-count"]').text()).toContain('3');
    expect(wrapper.get('[data-testid="step-progress"]').text()).toContain('2/3');
  });

  it('renders real workflow, status, duration, environment, and explicit image availability', () => {
    const wrapper = mountPipeline();

    const installRow = wrapper.get('[data-step-row="11"]');
    expect(installRow.text()).toContain('build');
    expect(installRow.text()).toContain('install');
    expect(installRow.text()).toContain('success');
    expect(installRow.text()).toContain('00:20');
    expect(installRow.text()).toContain('platform:linux/amd64');
    expect(installRow.text()).toContain('region:us-east');
    expect(installRow.text()).toContain('Not reported');
    expect(installRow.get('[data-action="View config"]').attributes('data-to')).toContain('repo-pipeline-config');

    const publishRow = wrapper.get('[data-step-row="21"]');
    expect(publishRow.text()).toContain('No environment');
    expect(publishRow.text()).toContain('—');
    expect(wrapper.text()).not.toContain('4.8 CPU');
  });

  it('opens the existing step log through the current route parameter', async () => {
    const wrapper = mountPipeline();

    await wrapper.get('[data-step-log="12"]').trigger('click');
    expect(testState.routerReplace).toHaveBeenCalledWith({
      params: {
        repoId: '101',
        pipelineId: '842',
        stepId: '12',
      },
    });

    await wrapper.get('[data-testid="step-list-select"]').trigger('click');
    expect(testState.routerReplace).toHaveBeenLastCalledWith({
      params: {
        repoId: '101',
        pipelineId: '842',
        stepId: '12',
      },
    });
  });

  it('renders the existing log when a valid step route parameter is present', () => {
    const wrapper = mountPipeline({ stepId: '12' });

    expect(wrapper.find('[data-testid="pipeline-overview"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="pipeline-log"]').attributes('data-step-id')).toBe('12');
  });

  it('renders an explicit no-step state without manufacturing summary rows', () => {
    const wrapper = mountPipeline({
      currentPipeline: pipeline({ workflows: [] }),
      configs: [],
    });

    expect(wrapper.get('[data-testid="pipeline-overview-empty"]').text()).toContain('No pipeline steps available');
    expect(wrapper.find('[data-step-row]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="step-list-select"]').exists()).toBe(false);
  });

  it('keeps pipeline errors ahead of the overview when current error rules require it', () => {
    const wrapper = mountPipeline({
      currentPipeline: pipeline({
        status: 'failure',
        errors: [{ type: 'compiler', message: 'invalid pipeline', is_warning: false }],
        workflows: [],
      }),
    });

    expect(wrapper.get('[data-testid="pipeline-error-panel"]').text()).toContain('Oh no, an error occurred');
    expect(wrapper.find('[data-testid="pipeline-overview"]').exists()).toBe(false);
  });

  it('preserves real approval and decline intent for a blocked pipeline', async () => {
    const wrapper = mountPipeline({
      currentPipeline: pipeline({ status: 'blocked' }),
    });

    await wrapper.get('[data-action="Approve"]').trigger('click');
    await wrapper.get('[data-action="Decline"]').trigger('click');

    expect(testState.api.approvePipeline).toHaveBeenCalledWith(101, '842');
    expect(testState.api.declinePipeline).toHaveBeenCalledWith(101, '842');
  });

  it('keeps blocked actions hidden for read-only repository permissions', () => {
    const wrapper = mountPipeline({
      currentPipeline: pipeline({ status: 'blocked' }),
      permissions: { pull: true, push: false, admin: false },
    });

    expect(wrapper.find('[data-action="Approve"]').exists()).toBe(false);
    expect(wrapper.find('[data-action="Decline"]').exists()).toBe(false);
  });
});
