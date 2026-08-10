import { flushPromises, mount } from '@vue/test-utils';
import { encode } from 'js-base64';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Pipeline, RepoPermissions } from '~/lib/api/types';
import { StepType, WebhookEvents } from '~/lib/api/types';

import PipelineLog from './PipelineLog.vue';

const testState = vi.hoisted(() => ({
  route: { hash: '' },
  notifyError: vi.fn(),
  api: {
    getLogs: vi.fn(),
    deleteLogs: vi.fn(),
    streamLogs: vi.fn(),
  },
}));

vi.mock('vue-router', () => ({
  useRoute: () => testState.route,
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => testState.api,
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notifyError: testState.notifyError,
  }),
}));

vi.mock('~/compositions/useConfig', () => ({
  default: () => ({
    maxPipelineLogLineCount: 5000,
  }),
}));

vi.mock('~/compositions/useUserConfig', () => ({
  default: () => ({
    userConfig: ref({ collapseLogGroupsByDefault: false }),
  }),
}));

const ButtonStub = defineComponent({
  name: 'Button',
  props: {
    text: String,
    color: String,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-action': props.text,
          'data-color': props.color,
          onClick: () => emit('click'),
        },
        props.text,
      );
  },
});

const IconButtonStub = defineComponent({
  name: 'IconButton',
  props: {
    title: String,
    icon: String,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h('button', { 'aria-label': props.title, 'data-icon': props.icon, onClick: () => emit('click') }, props.title);
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function pipeline(): Pipeline {
  return {
    id: 842,
    number: 842,
    parent: 0,
    event: WebhookEvents.Push,
    event_reason: [],
    status: 'failure',
    created: 100,
    updated: 200,
    started: 100,
    finished: 200,
    deploy_to: '',
    commit: 'abcdef1234567890',
    branch: 'main',
    message: 'test diagnostics',
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
        children: [
          {
            id: 101,
            uuid: 'step-test',
            pipeline_id: 842,
            pid: 11,
            ppid: 10,
            name: 'test',
            state: 'failure',
            exit_code: 1,
            started: 100,
            finished: 200,
            type: StepType.Commands,
          },
          {
            id: 102,
            uuid: 'step-build',
            pipeline_id: 842,
            pid: 12,
            ppid: 10,
            name: 'build',
            state: 'failure',
            exit_code: 1,
            started: 100,
            finished: 200,
            type: StepType.Commands,
          },
        ],
      },
    ],
  };
}

function mountLog(permissions: Partial<RepoPermissions> = { pull: true, push: true, admin: false }) {
  return mount(PipelineLog, {
    props: {
      pipeline: pipeline(),
      stepId: 11,
    },
    global: {
      plugins: [i18n],
      provide: {
        repo: ref({ id: 101, owner: 'acme', name: 'backend-api', full_name: 'acme/backend-api' }),
        'repo-permissions': ref(permissions),
        'pipeline-configs': ref([]),
      },
      stubs: {
        Button: ButtonStub,
        IconButton: IconButtonStub,
        Icon: true,
        PipelineStatusIcon: true,
      },
    },
  });
}

async function finishLogLoad() {
  await flushPromises();
  await vi.advanceTimersByTimeAsync(600);
  await nextTick();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  testState.route.hash = '';
  testState.api.getLogs.mockResolvedValue([
    { id: 1, step_id: 101, time: 1, line: 0, data: encode('install complete'), type: 0 },
    { id: 2, step_id: 101, time: 2, line: 1, data: encode('failed test'), type: 1 },
    { id: 3, step_id: 101, time: 3, line: 2, data: encode('summary ready'), type: 0 },
  ]);
  testState.api.deleteLogs.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('pipeline log diagnostics', () => {
  it('filters already loaded real log lines by text and stderr type without reloading', async () => {
    const wrapper = mountLog();
    await finishLogLoad();

    expect(wrapper.findAll('[data-log-line]')).toHaveLength(3);
    expect(testState.api.getLogs).toHaveBeenCalledTimes(1);

    await wrapper.get('[data-testid="log-search"]').setValue('summary');
    expect(wrapper.findAll('[data-log-line]')).toHaveLength(1);
    expect(wrapper.text()).toContain('summary ready');

    await wrapper.get('[data-testid="log-clear-filters"]').trigger('click');
    await wrapper.get('[data-testid="log-errors-only"]').trigger('click');
    expect(wrapper.findAll('[data-log-line]')).toHaveLength(1);
    expect(wrapper.text()).toContain('failed test');
    expect(testState.api.getLogs).toHaveBeenCalledTimes(1);
  });

  it('ignores a stale completed-step response after switching to another step', async () => {
    let resolveStaleLogs!: (
      logs: Array<{ id: number; step_id: number; time: number; line: number; data: string; type: number }>,
    ) => void;
    let resolveCurrentLogs!: (
      logs: Array<{
        id: number;
        step_id: number;
        time: number;
        line: number;
        data: string;
        type: number;
      }>,
    ) => void;
    const staleLogs = new Promise<Parameters<typeof resolveStaleLogs>[0]>((resolve) => {
      resolveStaleLogs = resolve;
    });
    const currentLogs = new Promise<Parameters<typeof resolveCurrentLogs>[0]>((resolve) => {
      resolveCurrentLogs = resolve;
    });
    testState.api.getLogs.mockImplementation(async (_repoId, _pipelineNumber, stepId) =>
      stepId === 101 ? staleLogs : currentLogs,
    );

    const wrapper = mountLog();
    await flushPromises();
    await wrapper.setProps({ stepId: 12 });
    await flushPromises();

    resolveCurrentLogs([{ id: 2, step_id: 102, time: 2, line: 0, data: encode('current build log'), type: 0 }]);
    await finishLogLoad();
    expect(wrapper.text()).toContain('current build log');

    resolveStaleLogs([{ id: 1, step_id: 101, time: 1, line: 0, data: encode('stale test log'), type: 0 }]);
    await finishLogLoad();
    expect(wrapper.text()).toContain('current build log');
    expect(wrapper.text()).not.toContain('stale test log');
  });

  it('shows a no-match state and toggles contained line wrapping', async () => {
    const wrapper = mountLog();
    await finishLogLoad();

    await wrapper.get('[data-testid="log-search"]').setValue('not-present');
    expect(wrapper.get('[data-testid="log-filter-empty"]').text()).toContain('No matching log lines');

    expect(wrapper.get('[data-testid="log-console"]').attributes('data-wrap')).toBe('true');
    await wrapper.get('[data-testid="log-wrap"]').trigger('click');
    expect(wrapper.get('[data-testid="log-console"]').attributes('data-wrap')).toBe('false');
  });

  it('keeps log controls wrap-safe and scrolls dense output inside the console', async () => {
    const wrapper = mountLog();
    await finishLogLoad();

    const search = wrapper.get('[data-testid="log-search"]');
    const controls = wrapper.get('[data-testid="log-errors-only"]').element.parentElement;
    const consoleElement = wrapper.get('[data-testid="log-console"]');

    expect(search.element.parentElement?.classList.contains('min-w-0')).toBe(true);
    expect(controls?.classList.contains('flex-wrap')).toBe(true);
    expect(consoleElement.classes()).toEqual(expect.arrayContaining(['max-w-full', 'overflow-auto']));
  });

  it('keeps destructive log deletion hidden without repository push permission', async () => {
    const wrapper = mountLog({ pull: true, push: false, admin: false });
    await finishLogLoad();

    expect(wrapper.find('[aria-label="Delete"]').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Download"]').exists()).toBe(true);
  });
});
