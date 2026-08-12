import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { QueueInfo, Task } from '~/lib/api/types';

import AdminQueue from './AdminQueue.vue';

const mocks = vi.hoisted(() => ({
  getQueueInfo: vi.fn(),
  intervalFn: undefined as (() => void | Promise<void>) | undefined,
  intervalMs: 0,
  notify: vi.fn(),
  pauseQueue: vi.fn(),
  resumeQueue: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getQueueInfo: mocks.getQueueInfo,
    pauseQueue: mocks.pauseQueue,
    resumeQueue: mocks.resumeQueue,
  }),
}));

vi.mock('~/compositions/useInterval', () => ({
  useInterval: (fn: () => void | Promise<void>, ms: number) => {
    mocks.intervalFn = fn;
    mocks.intervalMs = ms;
  },
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({ notify: mocks.notify }),
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const messages = structuredClone(en);
Object.assign(messages.admin.settings.queue, {
  empty: 'No queued tasks.',
  error_fallback: 'The queue request failed.',
  mutation_error_fallback: 'The queue change failed.',
  retry: 'Retry',
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en: messages },
});

const IconButtonStub = defineComponent({
  props: ['to', 'title'],
  setup(props) {
    return () =>
      h('a', {
        'data-testid': 'pipeline-link',
        'data-to': JSON.stringify(props.to),
        title: props.title,
      });
  },
});

function deferred<T>() {
  let resolveValue!: (value: T) => void;
  let rejectValue!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveValue = resolve;
    rejectValue = reject;
  });
  return { promise, reject: rejectValue, resolve: resolveValue };
}

function task(id: number, name: string): Task {
  return {
    id,
    pid: id + 100,
    name,
    labels: {
      'org-id': 'internal',
      platform: 'linux/amd64',
    },
    dependencies: [],
    dep_status: {},
    run_on: [],
    agent_id: id + 200,
    agent_name: `agent-${id}`,
    pipeline_id: id + 300,
    pipeline_number: id + 400,
    repo_id: id + 500,
  };
}

function queueInfo(overrides: Partial<QueueInfo> = {}): QueueInfo {
  return {
    paused: false,
    pending: [],
    running: [],
    waiting_on_deps: [],
    stats: {
      worker_count: 2,
      running_count: 0,
      pending_count: 0,
      waiting_on_deps_count: 0,
      completed_count: 12,
    },
    ...overrides,
  };
}

function mountQueue() {
  return mount(AdminQueue, {
    global: {
      plugins: [i18n],
      stubs: {
        AdminQueueStats: {
          props: ['stats'],
          template: '<div data-testid="queue-stats">{{ stats?.completed_count }}</div>',
        },
        Badge: {
          props: ['label', 'value'],
          template: '<span class="badge">{{ label }}:{{ value }}</span>',
        },
        Icon: true,
        IconButton: IconButtonStub,
        Panel: {
          template: '<div><slot /></div>',
        },
        PrototypeIcon: true,
      },
    },
  });
}

describe('administrator queue', () => {
  beforeEach(() => {
    mocks.getQueueInfo.mockReset();
    mocks.pauseQueue.mockReset();
    mocks.resumeQueue.mockReset();
    mocks.notify.mockReset();
    mocks.intervalFn = undefined;
    mocks.intervalMs = 0;
  });

  it('uses the interval owner and distinguishes first loading from a confirmed empty queue', async () => {
    mocks.getQueueInfo.mockResolvedValue(queueInfo());
    const wrapper = mountQueue();

    expect(mocks.intervalMs).toBe(5_000);
    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-feedback-state="empty"]').exists()).toBe(false);

    await mocks.intervalFn?.();
    await flushPromises();

    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(false);
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No queued tasks.');
    expect(wrapper.get('[data-testid="queue-stats"]').text()).toBe('12');
  });

  it('renders an active first-load error and retries it explicitly', async () => {
    mocks.getQueueInfo.mockRejectedValueOnce(new Error('queue offline')).mockResolvedValueOnce(queueInfo());
    const wrapper = mountQueue();

    await mocks.intervalFn?.();
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('queue offline');
    expect(wrapper.find('[data-feedback-state="empty"]').exists()).toBe(false);

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();

    expect(mocks.getQueueInfo).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
    expect(wrapper.find('[data-feedback-state="empty"]').exists()).toBe(true);
  });

  it('preserves confirmed QueueInfo and pipeline navigation when an active refresh fails', async () => {
    mocks.getQueueInfo
      .mockResolvedValueOnce(queueInfo({ running: [task(7, 'confirmed-task')] }))
      .mockRejectedValueOnce(new Error('refresh failed'));
    const wrapper = mountQueue();

    await mocks.intervalFn?.();
    await flushPromises();
    expect(wrapper.text()).toContain('confirmed-task');

    await mocks.intervalFn?.();
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('refresh failed');
    expect(wrapper.text()).toContain('confirmed-task');
    expect(wrapper.text()).toContain('platform:linux/amd64');
    expect(wrapper.text()).not.toContain('internal');
    const pipelineLink = wrapper.get('[data-testid="pipeline-link"]').attributes('data-to');
    expect(pipelineLink).toBeDefined();
    expect(JSON.parse(pipelineLink!)).toEqual({
      name: 'repo-pipeline',
      params: {
        repoId: 507,
        pipelineId: 407,
        stepId: 107,
      },
    });
  });

  it('publishes only the latest overlapping poll completion', async () => {
    const obsolete = deferred<QueueInfo>();
    const current = deferred<QueueInfo>();
    mocks.getQueueInfo.mockReturnValueOnce(obsolete.promise).mockReturnValueOnce(current.promise);
    const wrapper = mountQueue();

    const firstLoad = mocks.intervalFn?.();
    const secondLoad = mocks.intervalFn?.();
    current.resolve(queueInfo({ pending: [task(2, 'current-task')] }));
    await secondLoad;
    await flushPromises();
    obsolete.resolve(queueInfo({ pending: [task(1, 'obsolete-task')] }));
    await firstLoad;
    await flushPromises();

    expect(wrapper.text()).toContain('current-task');
    expect(wrapper.text()).not.toContain('obsolete-task');
  });

  it('keeps confirmed data and reports pause and resume rejection without success', async () => {
    mocks.getQueueInfo.mockResolvedValueOnce(queueInfo({ pending: [task(3, 'pending-task')] }));
    mocks.pauseQueue.mockRejectedValue(new Error('pause rejected'));
    const wrapper = mountQueue();
    await mocks.intervalFn?.();
    await flushPromises();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Pause')!
      .trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('pending-task');
    expect(mocks.notify).toHaveBeenCalledWith({ title: 'pause rejected', type: 'error' });
    expect(mocks.notify).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));

    mocks.getQueueInfo.mockResolvedValueOnce(queueInfo({ paused: true, running: [task(4, 'running-task')] }));
    await mocks.intervalFn?.();
    await flushPromises();
    mocks.resumeQueue.mockRejectedValue(new Error('resume rejected'));

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Resume')!
      .trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('running-task');
    expect(mocks.notify).toHaveBeenCalledWith({ title: 'resume rejected', type: 'error' });
    expect(mocks.getQueueInfo).toHaveBeenCalledTimes(2);
  });

  it('keeps pause and resume locked until the server-confirmed refresh finishes', async () => {
    const refresh = deferred<QueueInfo>();
    mocks.getQueueInfo.mockResolvedValueOnce(queueInfo()).mockReturnValueOnce(refresh.promise);
    mocks.pauseQueue.mockResolvedValue(undefined);
    const wrapper = mountQueue();
    await mocks.intervalFn?.();
    await flushPromises();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Pause')!
      .trigger('click');
    await flushPromises();

    const action = wrapper.findAll('button').find((button) => button.attributes('aria-busy') === 'true');
    expect(action?.attributes('disabled')).toBeDefined();
    expect(mocks.notify).not.toHaveBeenCalled();

    refresh.resolve(queueInfo({ paused: true }));
    await flushPromises();

    expect(mocks.notify).toHaveBeenCalledWith({ title: 'Queue is paused', type: 'success' });
    expect(wrapper.findAll('button').some((button) => button.text() === 'Resume')).toBe(true);
  });

  it('keeps poll and mutation completions obsolete after unmount', async () => {
    const poll = deferred<QueueInfo>();
    const pause = deferred<unknown>();
    mocks.getQueueInfo.mockReturnValueOnce(queueInfo()).mockReturnValueOnce(poll.promise);
    mocks.pauseQueue.mockReturnValue(pause.promise);
    const wrapper = mountQueue();
    await mocks.intervalFn?.();
    await flushPromises();

    const pendingPoll = mocks.intervalFn?.();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Pause')!
      .trigger('click');
    wrapper.unmount();
    pause.resolve(undefined);
    poll.resolve(queueInfo({ pending: [task(9, 'obsolete-task')] }));
    await pendingPoll;
    await flushPromises();

    expect(mocks.notify).not.toHaveBeenCalled();
    expect(mocks.getQueueInfo).toHaveBeenCalledTimes(2);
  });

  it('keeps the page and dense task table contained at 390px', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/views/admin/AdminQueue.vue'), 'utf8');

    expect(source).toContain('class="admin-queue-page"');
    expect(source).toContain('<SettingsSection');
    expect(source).toContain('<SettingsTable');
    expect(source).toContain('@apply min-w-0');
    expect(source).toContain('max-w-full');
    expect(source).not.toMatch(/priority|promote|cancel|average wait|throughput/i);
  });
});
