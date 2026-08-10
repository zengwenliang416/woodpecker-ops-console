import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Pipeline, Repo, RepoPermissions } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types/webhook';

import RepoPipelines from './RepoPipelines.vue';

const pipelineStore = vi.hoisted(() => {
  const actionSubscribers = new Set<
    (context: { name: string; args: unknown[]; after: (callback: (result: boolean) => void) => void }) => void
  >();

  return {
    loading: false,
    hasMore: false,
    loadRepoPipelines: vi.fn(),
    actionSubscribers,
    $onAction: vi.fn(
      (
        subscriber: (context: {
          name: string;
          args: unknown[];
          after: (callback: (result: boolean) => void) => void;
        }) => void,
      ) => {
        actionSubscribers.add(subscriber);
        return () => actionSubscribers.delete(subscriber);
      },
    ),
  };
});

vi.mock('~/store/pipelines', () => ({
  usePipelineStore: () => pipelineStore,
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const OpsMetricCardStub = defineComponent({
  inheritAttrs: false,
  props: {
    label: String,
    value: String,
    hint: String,
  },
  setup(props, { attrs }) {
    return () =>
      h('article', { ...attrs, 'data-label': props.label, 'data-value': props.value, 'data-hint': props.hint });
  },
});

const FeedbackStateStub = defineComponent({
  inheritAttrs: false,
  props: {
    kind: String,
    title: String,
    description: String,
  },
  setup(props, { attrs, slots }) {
    return () =>
      h('section', { ...attrs, 'data-feedback-state': props.kind }, [
        h('strong', props.title),
        h('p', props.description),
        slots.action?.(),
      ]);
  },
});

const ButtonStub = defineComponent({
  inheritAttrs: false,
  props: {
    text: String,
    disabled: Boolean,
  },
  emits: ['click'],
  setup(props, { attrs, emit }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          disabled: props.disabled,
          onClick: () => emit('click'),
        },
        props.text,
      );
  },
});

const IconButtonStub = defineComponent({
  inheritAttrs: false,
  props: {
    title: String,
    to: [String, Object],
  },
  emits: ['click'],
  setup(props, { attrs, emit }) {
    return () =>
      h('button', {
        ...attrs,
        title: props.title,
        'aria-label': props.title,
        'data-to': props.to === undefined ? undefined : JSON.stringify(props.to),
        onClick: () => emit('click'),
      });
  },
});

const DeployPipelinePopupStub = defineComponent({
  inheritAttrs: false,
  props: {
    pipelineNumber: String,
    open: Boolean,
  },
  setup(props, { attrs }) {
    return () =>
      h('div', {
        ...attrs,
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

function pipeline(number: number, overrides: Partial<Pipeline> = {}): Pipeline {
  const created = 1_754_386_000 + number * 100;
  return {
    id: number,
    number,
    parent: 0,
    event: WebhookEvents.Push,
    event_reason: [],
    status: 'success',
    created,
    updated: created + 120,
    started: created + 10,
    finished: created + 130,
    deploy_to: '',
    commit: `abcdef${number.toString().padStart(4, '0')}123456`,
    branch: 'main',
    message: `pipeline ${number}`,
    timestamp: created,
    ref: 'refs/heads/main',
    refspec: '',
    clone_url: '',
    title: '',
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

function mountPipelines(
  items: Pipeline[],
  {
    allowDeploy = true,
    canPush = true,
    repoId = 101,
  }: {
    allowDeploy?: boolean;
    canPush?: boolean;
    repoId?: number;
  } = {},
) {
  const pipelines = ref(items);
  const repo = ref({
    id: repoId,
    full_name: 'acme/backend-api',
    allow_deploy: allowDeploy,
  } as Repo);
  const permissions = ref({
    pull: true,
    push: canPush,
    admin: false,
    synced: 0,
  } as RepoPermissions);

  const wrapper = mount(RepoPipelines, {
    global: {
      plugins: [i18n],
      provide: {
        repo,
        pipelines,
        'repo-permissions': permissions,
      },
      stubs: {
        OpsMetricCard: OpsMetricCardStub,
        FeedbackState: FeedbackStateStub,
        Button: ButtonStub,
        IconButton: IconButtonStub,
        DeployPipelinePopup: DeployPipelinePopupStub,
        PipelineStatusIcon: true,
        PrototypeIcon: true,
        RouterLink: true,
      },
    },
  });

  return { wrapper, pipelines, repo };
}

function renderedPipelineNumbers(wrapper: ReturnType<typeof mountPipelines>['wrapper']): string[] {
  return wrapper.findAll('[data-testid="pipeline-row"]').map((row) => row.attributes('data-pipeline-number') ?? '');
}

/* eslint-disable promise/prefer-await-to-callbacks -- Pinia action hooks expose completion callbacks. */
async function completeRepoPipelineAction(repoId: number, page?: number, repoHasMore = pipelineStore.hasMore) {
  const afterCallbacks: ((result: boolean) => void)[] = [];
  const args = page === undefined ? [repoId] : [repoId, page];
  pipelineStore.actionSubscribers.forEach((subscriber) => {
    subscriber({
      name: 'loadRepoPipelines',
      args,
      after: (callback) => afterCallbacks.push(callback),
    });
  });
  afterCallbacks.forEach((callback) => callback(repoHasMore));
  await nextTick();
}
/* eslint-enable promise/prefer-await-to-callbacks */

describe('repository pipeline list', () => {
  beforeEach(() => {
    pipelineStore.loading = false;
    pipelineStore.hasMore = false;
    pipelineStore.loadRepoPipelines.mockReset();
    pipelineStore.actionSubscribers.clear();
    pipelineStore.$onAction.mockClear();
  });

  it('derives metrics and filters the loaded real pipeline collection', async () => {
    const { wrapper } = mountPipelines([
      pipeline(3, {
        status: 'running',
        event: WebhookEvents.Manual,
        message: 'run verification',
        author: 'carol',
        finished: 0,
      }),
      pipeline(2, {
        status: 'failure',
        event: WebhookEvents.PullRequest,
        branch: 'feature/release',
        message: 'release validation failed',
        author: 'bob',
        started: 1_754_386_210,
        finished: 1_754_386_270,
      }),
      pipeline(1, {
        message: 'ship release',
        started: 1_754_386_110,
        finished: 1_754_386_230,
      }),
    ]);

    expect(wrapper.get('[data-testid="pipeline-metric-latest"]').attributes('data-value')).toBe('running');
    expect(wrapper.get('[data-testid="pipeline-metric-success"]').attributes('data-value')).toBe('50.0%');
    expect(wrapper.get('[data-testid="pipeline-metric-duration"]').attributes('data-value')).toBe('01:30');
    expect(renderedPipelineNumbers(wrapper)).toEqual(['3', '2', '1']);
    expect(wrapper.get('[data-testid="pipeline-search"]').attributes('aria-label')).toBe('Search repository pipelines');
    expect(wrapper.get('[data-testid="pipeline-status-filter"]').attributes('aria-label')).toBe(
      'Filter pipelines by status',
    );
    expect(wrapper.get('[data-testid="pipeline-branch-filter"]').attributes('aria-label')).toBe(
      'Filter pipelines by branch',
    );
    expect(wrapper.get('[data-testid="pipeline-event-filter"]').attributes('aria-label')).toBe(
      'Filter pipelines by trigger',
    );

    await wrapper.get('[data-testid="pipeline-search"]').setValue('release');
    expect(renderedPipelineNumbers(wrapper)).toEqual(['2', '1']);

    await wrapper.get('[data-testid="pipeline-search"]').setValue('');
    await wrapper.get('[data-testid="pipeline-status-filter"]').setValue('failure');
    expect(renderedPipelineNumbers(wrapper)).toEqual(['2']);

    await wrapper.get('[data-testid="pipeline-status-filter"]').setValue('all');
    await wrapper.get('[data-testid="pipeline-branch-filter"]').setValue('main');
    expect(renderedPipelineNumbers(wrapper)).toEqual(['3', '1']);

    await wrapper.get('[data-testid="pipeline-branch-filter"]').setValue('all');
    await wrapper.get('[data-testid="pipeline-event-filter"]').setValue('manual');
    expect(renderedPipelineNumbers(wrapper)).toEqual(['3']);
  });

  it('pages loaded rows and requests the next authoritative API page at the boundary', async () => {
    pipelineStore.hasMore = true;
    const firstPage = Array.from({ length: 10 }, (_, index) => pipeline(20 - index));
    const { wrapper, pipelines } = mountPipelines(firstPage, { repoId: 201 });
    await completeRepoPipelineAction(201);
    pipelineStore.loadRepoPipelines.mockImplementation(async () => {
      pipelines.value = [...pipelines.value, pipeline(10)];
      pipelineStore.hasMore = false;
      return false;
    });

    expect(renderedPipelineNumbers(wrapper)).toHaveLength(10);

    await wrapper.get('[data-testid="pipeline-next"]').trigger('click');

    expect(pipelineStore.loadRepoPipelines).toHaveBeenCalledWith(201, 2);
    expect(renderedPipelineNumbers(wrapper)).toEqual(['10']);

    await wrapper.get('[data-testid="pipeline-previous"]').trigger('click');
    expect(renderedPipelineNumbers(wrapper)).toHaveLength(10);
  });

  it('continues after fully cached API pages instead of requesting page two again', async () => {
    pipelineStore.hasMore = true;
    const initial = mountPipelines(
      Array.from({ length: 10 }, (_, index) => pipeline(210 - index)),
      {
        repoId: 301,
      },
    );
    await completeRepoPipelineAction(301);
    pipelineStore.loadRepoPipelines.mockResolvedValueOnce(true);

    await initial.wrapper.get('[data-testid="pipeline-next"]').trigger('click');
    expect(pipelineStore.loadRepoPipelines).toHaveBeenCalledWith(301, 2);
    initial.wrapper.unmount();
    pipelineStore.loadRepoPipelines.mockClear();

    const { wrapper } = mountPipelines(
      Array.from({ length: 100 }, (_, index) => pipeline(200 - index)),
      {
        repoId: 301,
      },
    );

    for (let page = 1; page < 10; page += 1) {
      await wrapper.get('[data-testid="pipeline-next"]').trigger('click');
    }
    expect(renderedPipelineNumbers(wrapper)).toEqual([
      '110',
      '109',
      '108',
      '107',
      '106',
      '105',
      '104',
      '103',
      '102',
      '101',
    ]);

    await wrapper.get('[data-testid="pipeline-next"]').trigger('click');
    expect(pipelineStore.loadRepoPipelines).toHaveBeenCalledWith(301, 3);
  });

  it('records same-length initial-page pagination from the repository action', async () => {
    const { wrapper, pipelines } = mountPipelines(
      Array.from({ length: 50 }, (_, index) => pipeline(850 - index)),
      { repoId: 801 },
    );
    pipelineStore.hasMore = true;
    pipelines.value = Array.from({ length: 50 }, (_, index) => pipeline(750 - index));
    await completeRepoPipelineAction(801);
    pipelineStore.loadRepoPipelines.mockClear();
    pipelineStore.loadRepoPipelines.mockImplementation(async () => {
      pipelineStore.hasMore = false;
      return false;
    });

    for (let page = 1; page < 5; page += 1) {
      await wrapper.get('[data-testid="pipeline-next"]').trigger('click');
    }
    await wrapper.get('[data-testid="pipeline-next"]').trigger('click');

    expect(pipelineStore.loadRepoPipelines).toHaveBeenCalledWith(801, 2);
  });

  it('does not let an old repository action pollute hasMore after a live insertion', async () => {
    const { wrapper, pipelines } = mountPipelines(
      Array.from({ length: 10 }, (_, index) => pipeline(950 - index)),
      { repoId: 901 },
    );
    pipelineStore.hasMore = true;
    await completeRepoPipelineAction(901);

    pipelineStore.hasMore = false;
    await completeRepoPipelineAction(999);
    pipelines.value = [...pipelines.value, pipeline(940)];
    await nextTick();
    pipelineStore.loadRepoPipelines.mockClear();
    pipelineStore.loadRepoPipelines.mockImplementation(async () => {
      pipelineStore.hasMore = false;
      return false;
    });

    await wrapper.get('[data-testid="pipeline-next"]').trigger('click');
    await wrapper.get('[data-testid="pipeline-next"]').trigger('click');

    expect(pipelineStore.loadRepoPipelines).toHaveBeenCalledWith(901, 2);
  });

  it('distinguishes empty/filter states and gates deploy entry by repository permission', async () => {
    pipelineStore.loading = true;
    const loading = mountPipelines([]).wrapper;
    expect(loading.get('[data-feedback-state="loading"]').text()).toContain('Loading');
    expect(loading.find('[data-testid^="pipeline-metric-"]').exists()).toBe(false);
    pipelineStore.loading = false;

    const empty = mountPipelines([]).wrapper;
    expect(empty.get('[data-feedback-state="empty"]').text()).toContain('No pipelines');

    const { wrapper } = mountPipelines([pipeline(842), pipeline(841, { status: 'failure' })]);
    expect(wrapper.find('[data-testid="pipeline-deploy-842"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="pipeline-deploy-841"]').exists()).toBe(false);
    expect(wrapper.get('[title="View pipeline #842"]').attributes('data-to')).toContain('"pipelineId":842');

    await wrapper.get('[data-testid="pipeline-deploy-842"]').trigger('click');
    expect(wrapper.get('[data-testid="deploy-pipeline-popup"]').attributes('data-open')).toBe('true');
    expect(wrapper.get('[data-testid="deploy-pipeline-popup"]').attributes('data-pipeline-number')).toBe('842');

    await wrapper.get('[data-testid="pipeline-search"]').setValue('does-not-exist');
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No matching pipelines');

    await wrapper.get('[data-testid="pipeline-clear-filters"]').trigger('click');
    expect(renderedPipelineNumbers(wrapper)).toEqual(['842', '841']);

    const readOnly = mountPipelines([pipeline(842)], { canPush: false }).wrapper;
    expect(readOnly.find('[data-testid="pipeline-deploy-842"]').exists()).toBe(false);

    const deployDisabled = mountPipelines([pipeline(842)], { allowDeploy: false }).wrapper;
    expect(deployDisabled.find('[data-testid="pipeline-deploy-842"]').exists()).toBe(false);
  });

  it('resets local pagination and filters when the repository changes', async () => {
    const { wrapper, repo } = mountPipelines(Array.from({ length: 11 }, (_, index) => pipeline(20 - index)));

    await wrapper.get('[data-testid="pipeline-next"]').trigger('click');
    expect(renderedPipelineNumbers(wrapper)).toEqual(['10']);

    await wrapper.get('[data-testid="pipeline-search"]').setValue('pipeline');
    repo.value = { ...repo.value, id: 202, full_name: 'acme/frontend' };
    await nextTick();

    expect(renderedPipelineNumbers(wrapper)).toHaveLength(10);
    expect(wrapper.get('[data-testid="pipeline-search"]').element).toHaveProperty('value', '');
  });

  it('ignores an obsolete additional-page completion after the repository changes', async () => {
    let resolveOldRequest: (() => void) | undefined;
    const oldRequest = new Promise<void>((resolve) => {
      resolveOldRequest = resolve;
    });
    pipelineStore.hasMore = true;

    const oldPipelines = Array.from({ length: 10 }, (_, index) => pipeline(200 - index));
    const { wrapper, pipelines, repo } = mountPipelines(oldPipelines, { repoId: 601 });
    await completeRepoPipelineAction(601);
    pipelineStore.loadRepoPipelines
      .mockImplementationOnce(async () => {
        await oldRequest;
        pipelineStore.hasMore = false;
        return false;
      })
      .mockImplementationOnce(async () => {
        pipelines.value = [...pipelines.value, pipeline(100)];
        pipelineStore.hasMore = false;
        return false;
      });

    await wrapper.get('[data-testid="pipeline-deploy-200"]').trigger('click');
    expect(wrapper.find('[data-testid="deploy-pipeline-popup"]').exists()).toBe(true);
    await wrapper.get('[data-testid="pipeline-search"]').setValue('pipeline');
    await wrapper.get('[data-testid="pipeline-next"]').trigger('click');
    expect(pipelineStore.loadRepoPipelines).toHaveBeenCalledWith(601, 2);

    repo.value = { ...repo.value, id: 602, full_name: 'acme/frontend' };
    pipelines.value = [];
    await nextTick();

    pipelineStore.hasMore = true;
    pipelines.value = Array.from({ length: 10 }, (_, index) => pipeline(110 - index));
    await completeRepoPipelineAction(602);
    await nextTick();

    expect(wrapper.find('[data-testid="deploy-pipeline-popup"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="pipeline-search"]').element).toHaveProperty('value', '');
    expect(renderedPipelineNumbers(wrapper)).toEqual([
      '110',
      '109',
      '108',
      '107',
      '106',
      '105',
      '104',
      '103',
      '102',
      '101',
    ]);

    resolveOldRequest?.();
    await oldRequest;
    await nextTick();

    expect(renderedPipelineNumbers(wrapper)).toEqual([
      '110',
      '109',
      '108',
      '107',
      '106',
      '105',
      '104',
      '103',
      '102',
      '101',
    ]);

    await wrapper.get('[data-testid="pipeline-next"]').trigger('click');
    expect(pipelineStore.loadRepoPipelines).toHaveBeenLastCalledWith(602, 2);
    expect(renderedPipelineNumbers(wrapper)).toEqual(['100']);
  });

  it('does not surface an obsolete page rejection after the repository changes', async () => {
    let rejectOldRequest: ((error: Error) => void) | undefined;
    const oldRequest = new Promise<void>((_resolve, reject) => {
      rejectOldRequest = reject;
    });
    pipelineStore.hasMore = true;

    const { wrapper, pipelines, repo } = mountPipelines(
      Array.from({ length: 10 }, (_, index) => pipeline(300 - index)),
      { repoId: 701 },
    );
    await completeRepoPipelineAction(701);
    pipelineStore.loadRepoPipelines.mockImplementationOnce(async () => oldRequest);

    await wrapper.get('[data-testid="pipeline-next"]').trigger('click');
    repo.value = { ...repo.value, id: 702, full_name: 'acme/docs' };
    pipelineStore.hasMore = false;
    pipelines.value = [pipeline(1)];
    await nextTick();

    rejectOldRequest?.(new Error('obsolete page failed'));
    await expect(oldRequest).rejects.toThrow('obsolete page failed');
    await nextTick();

    expect(renderedPipelineNumbers(wrapper)).toEqual(['1']);
    expect(wrapper.get('[data-testid="pipeline-next"]').attributes('disabled')).toBeDefined();
  });
});
