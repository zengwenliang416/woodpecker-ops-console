import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Pipeline, PullRequest } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types/webhook';

import RepoPullRequests from './RepoPullRequests.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as ReturnType<typeof ref<PullRequest[]>> | undefined,
  loading: undefined as ReturnType<typeof ref<boolean>> | undefined,
  hasMore: undefined as ReturnType<typeof ref<boolean>> | undefined,
  resetPage: vi.fn<() => Promise<void>>(),
  nextPage: vi.fn<() => void>(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getRepoPullRequests: vi.fn(),
  }),
}));

vi.mock('~/compositions/usePaginate', async () => {
  const { ref: vueRef } = await import('vue');
  pagination.data = vueRef<PullRequest[]>([]);
  pagination.loading = vueRef(true);
  pagination.hasMore = vueRef(false);

  return {
    usePagination: () => ({
      data: pagination.data,
      loading: pagination.loading,
      hasMore: pagination.hasMore,
      resetPage: pagination.resetPage,
      nextPage: pagination.nextPage,
    }),
  };
});

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const FeedbackStateStub = defineComponent({
  props: {
    kind: String,
    title: String,
    description: String,
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

const ButtonStub = defineComponent({
  props: {
    text: String,
    isLoading: Boolean,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { disabled: props.isLoading, onClick: () => emit('click') }, props.text);
  },
});

const RouterLinkStub = defineComponent({
  props: {
    to: Object,
  },
  setup(props, { slots, attrs }) {
    return () => h('a', { ...attrs, 'data-to': JSON.stringify(props.to) }, slots.default?.());
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function deferred<T>() {
  let resolveValue!: (value: T) => void;
  let rejectValue!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveValue = resolve;
    rejectValue = reject;
  });
  return { promise, resolve: resolveValue, reject: rejectValue };
}

function pipeline(number: number, overrides: Partial<Pipeline> = {}): Pipeline {
  return {
    id: number,
    number,
    parent: 0,
    event: WebhookEvents.PullRequest,
    event_reason: [],
    status: 'success',
    created: 1_754_386_000,
    updated: 1_754_386_010,
    started: 1_754_386_001,
    finished: 1_754_386_009,
    deploy_to: '',
    commit: `abcdef${number}123456789`,
    branch: 'feature',
    message: `pipeline ${number}`,
    timestamp: 1_754_386_000,
    ref: 'refs/pull/42/merge',
    refspec: '',
    clone_url: '',
    title: 'Improve diagnostics',
    sender: '',
    author: 'alice',
    author_avatar: '',
    author_email: '',
    forge_url: '',
    reviewed_by: '',
    reviewed: 0,
    cancel_info: {
      canceled_by_user: '',
      canceled_by_step: '',
      superseded_by: 0,
    },
    version: 'next',
    ...overrides,
  };
}

function mountPullRequests(
  pipelines: Pipeline[] = [],
  repo = ref({
    id: 1,
    full_name: 'acme/repo',
    pr_enabled: true,
    allow_pr: true,
  }),
) {
  return mount(RepoPullRequests, {
    global: {
      plugins: [i18n],
      provide: {
        repo,
        pipelines: ref(pipelines),
      },
      stubs: {
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        PipelineStatusIcon: true,
        PrototypeIcon: true,
        RouterLink: RouterLinkStub,
      },
    },
  });
}

describe('repository pull requests', () => {
  beforeEach(() => {
    pagination.data!.value = [];
    pagination.loading!.value = true;
    pagination.hasMore!.value = false;
    pagination.resetPage.mockReset();
    pagination.nextPage.mockReset();
  });

  it('distinguishes loading, empty, and no-match states', async () => {
    const wrapper = mountPullRequests();
    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(true);

    pagination.loading!.value = false;
    await nextTick();
    expect(wrapper.find('[data-feedback-state="empty"]').text()).toContain('No pull requests');

    pagination.data!.value = [{ index: '42', title: 'Improve diagnostics' }];
    await nextTick();
    await wrapper.get('input[type="search"]').setValue('missing');
    expect(wrapper.find('[data-feedback-state="empty"]').text()).toContain('No matching pull requests');
  });

  it('searches real index/title fields and correlates the newest exact PR pipeline', async () => {
    pagination.data!.value = [
      { index: '42', title: 'Improve diagnostics' },
      { index: '7', title: 'Update docs' },
    ];
    pagination.loading!.value = false;
    const wrapper = mountPullRequests([
      pipeline(12, { message: 'newest PR run' }),
      pipeline(3, { message: 'older PR run' }),
      pipeline(99, {
        event: WebhookEvents.Push,
        ref: 'refs/pull/42/merge',
        message: 'push with PR-looking ref',
      }),
      pipeline(8, { ref: 'refs/pull/7/head', message: 'docs run' }),
    ]);
    await nextTick();

    const rows = wrapper.findAll('[data-testid="pull-request-row"]');
    expect(rows[0].text()).toContain('newest PR run');
    expect(rows[0].text()).not.toContain('push with PR-looking ref');
    expect(rows[1].text()).toContain('docs run');

    await wrapper.get('input[type="search"]').setValue('42');
    expect(wrapper.findAll('[data-testid="pull-request-row"]')).toHaveLength(1);
    await wrapper.get('input[type="search"]').setValue('docs');
    expect(wrapper.findAll('[data-testid="pull-request-row"]')).toHaveLength(1);
  });

  it('preserves confirmed rows while reset clears data and replaces them after refresh', async () => {
    const refreshed = deferred<PullRequest[]>();
    pagination.data!.value = [{ index: '42', title: 'Improve diagnostics' }];
    pagination.loading!.value = false;
    pagination.hasMore!.value = true;
    pagination.resetPage.mockImplementationOnce(async () => {
      pagination.data!.value = [];
      pagination.loading!.value = true;
      pagination.data!.value = await refreshed.promise;
      pagination.loading!.value = false;
    });
    const wrapper = mountPullRequests();
    await nextTick();

    const buttons = wrapper.findAll('button');
    await buttons[1].trigger('click');
    await buttons[0].trigger('click');

    expect(wrapper.get('[data-testid="pull-request-row"]').attributes('data-pull-request')).toBe('42');
    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(false);
    expect(buttons[0].attributes('disabled')).toBeDefined();
    expect(buttons[1].attributes('disabled')).toBeDefined();
    expect(pagination.resetPage).toHaveBeenCalledOnce();
    expect(pagination.nextPage).toHaveBeenCalledOnce();

    refreshed.resolve([{ index: '7', title: 'Update docs' }]);
    await flushPromises();

    expect(wrapper.get('[data-testid="pull-request-row"]').attributes('data-pull-request')).toBe('7');
  });

  it('discards an obsolete refresh result after the repository changes', async () => {
    const oldRefresh = deferred<PullRequest[]>();
    const newRepository = deferred<PullRequest[]>();
    const currentRefresh = deferred<PullRequest[]>();
    const repo = ref({
      id: 1,
      full_name: 'acme/repo',
      pr_enabled: true,
      allow_pr: true,
    });
    let generation = 0;
    pagination.data!.value = [{ index: '42', title: 'Improve diagnostics' }];
    pagination.loading!.value = false;
    pagination.resetPage.mockImplementation(async () => {
      const requestGeneration = ++generation;
      pagination.data!.value = [];
      pagination.loading!.value = true;
      const rows = await (requestGeneration === 1
        ? oldRefresh.promise
        : requestGeneration === 2
          ? newRepository.promise
          : currentRefresh.promise);
      if (requestGeneration !== generation) return;
      pagination.data!.value = rows;
      pagination.loading!.value = false;
    });
    const wrapper = mountPullRequests([], repo);
    await nextTick();

    await wrapper.findAll('button')[0].trigger('click');
    repo.value = {
      id: 2,
      full_name: 'acme/next',
      pr_enabled: true,
      allow_pr: true,
    };
    await nextTick();

    newRepository.resolve([{ index: '7', title: 'Current repository PR' }]);
    await flushPromises();
    expect(wrapper.get('[data-testid="pull-request-row"]').attributes('data-pull-request')).toBe('7');

    await wrapper.findAll('button')[0].trigger('click');
    oldRefresh.resolve([{ index: '99', title: 'Obsolete PR' }]);
    await flushPromises();
    expect(wrapper.get('[data-testid="pull-request-row"]').attributes('data-pull-request')).toBe('7');

    currentRefresh.resolve([{ index: '8', title: 'Next PR' }]);
    await flushPromises();
    expect(wrapper.get('[data-testid="pull-request-row"]').attributes('data-pull-request')).toBe('8');
  });

  it('ignores an obsolete refresh rejection while a newer repository refresh owns the snapshot', async () => {
    const oldRefresh = deferred<PullRequest[]>();
    const newRepository = deferred<PullRequest[]>();
    const currentRefresh = deferred<PullRequest[]>();
    const repo = ref({
      id: 1,
      full_name: 'acme/repo',
      pr_enabled: true,
      allow_pr: true,
    });
    let generation = 0;
    pagination.data!.value = [{ index: '42', title: 'Improve diagnostics' }];
    pagination.loading!.value = false;
    pagination.resetPage.mockImplementation(async () => {
      const requestGeneration = ++generation;
      pagination.data!.value = [];
      pagination.loading!.value = true;
      const rows = await (requestGeneration === 1
        ? oldRefresh.promise
        : requestGeneration === 2
          ? newRepository.promise
          : currentRefresh.promise);
      if (requestGeneration !== generation) return;
      pagination.data!.value = rows;
      pagination.loading!.value = false;
    });
    const wrapper = mountPullRequests([], repo);
    await nextTick();

    const refresh = (wrapper.vm as unknown as { refresh: () => Promise<void> }).refresh;
    const obsoleteRefresh = refresh();
    repo.value = {
      id: 2,
      full_name: 'acme/next',
      pr_enabled: true,
      allow_pr: true,
    };
    await nextTick();
    newRepository.resolve([{ index: '7', title: 'Current repository PR' }]);
    await flushPromises();

    const activeRefresh = refresh();
    oldRefresh.reject(new Error('obsolete refresh failed'));
    await expect(obsoleteRefresh).resolves.toBeUndefined();
    expect(wrapper.get('[data-testid="pull-request-row"]').attributes('data-pull-request')).toBe('7');

    currentRefresh.resolve([{ index: '8', title: 'Next PR' }]);
    await activeRefresh;
    await nextTick();
    expect(wrapper.get('[data-testid="pull-request-row"]').attributes('data-pull-request')).toBe('8');
  });

  it('keeps the last confirmed rows when refresh rejects and propagates the error', async () => {
    pagination.data!.value = [{ index: '42', title: 'Improve diagnostics' }];
    pagination.loading!.value = false;
    pagination.resetPage.mockImplementationOnce(async () => {
      pagination.data!.value = [];
      pagination.loading!.value = true;
      throw new Error('pull request refresh failed');
    });
    const wrapper = mountPullRequests();
    await nextTick();

    const refresh = (wrapper.vm as unknown as { refresh: () => Promise<void> }).refresh;
    await expect(refresh()).rejects.toThrow('pull request refresh failed');
    await nextTick();

    expect(wrapper.get('[data-testid="pull-request-row"]').attributes('data-pull-request')).toBe('42');
    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(false);
  });
});
