import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import zhHans from '~/assets/locales/zh-Hans.json';
import { useDate } from '~/compositions/useDate';
import type { Application, AppRelease, Deployment, Environment } from '~/lib/api/types';

import Deployments from './Deployments.vue';

const state = vi.hoisted(() => ({
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
    pendingApprovals: Deployment[];
  } | null,
}));

vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));
vi.mock('~/store/ops', () => ({
  useApplicationStore: () => state.applications,
  useDeploymentStore: () => state.deployments,
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

function deployment(id: number, overrides: Partial<Deployment> = {}): Deployment {
  return {
    id,
    application_id: 1,
    environment_id: 1,
    release_id: 1,
    status: 'success',
    strategy: 'rolling',
    batch_size: 2,
    progress: 100,
    triggered_by: 'octocat',
    ...overrides,
  };
}

function mountDeployments(locale: 'en' | 'zh-Hans' = 'en') {
  return mount(Deployments, {
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
        IconButton: true,
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

describe('deployments', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    await useDate().setDateLocale('en');

    const applications = [
      {
        id: 1,
        name: 'api',
        image: 'example/api:1',
        runtime: 'docker-compose',
        service: 'api',
      },
      {
        id: 2,
        name: 'worker',
        image: 'example/worker:1',
        runtime: 'docker-compose',
        service: 'worker',
      },
    ];
    const environments = [
      {
        id: 1,
        name: 'production',
        title: 'Production',
        protected: true,
        approval_required: true,
        minimum_approvers: 1,
        auto_rollback: true,
      },
      {
        id: 2,
        name: 'staging',
        title: 'Staging',
        protected: false,
        approval_required: false,
        minimum_approvers: 0,
        auto_rollback: false,
      },
    ];
    const releases = [
      {
        id: 1,
        application_id: 1,
        pipeline_id: 1,
        version: 'v1.0.0',
        digest: 'sha256:one',
        status: 'deployed' as const,
      },
      {
        id: 2,
        application_id: 2,
        pipeline_id: 2,
        version: 'v2.0.0',
        digest: 'sha256:two',
        status: 'ready' as const,
      },
    ];

    state.applications = reactive({
      applications: new Map(applications.map((application) => [application.id, application])),
      applicationList: applications,
      environments: new Map(environments.map((environment) => [environment.id, environment])),
      environmentList: environments,
      loadAll: vi.fn().mockResolvedValue(undefined),
      releaseList: releases,
      releases: new Map(releases.map((release) => [release.id, release])),
    });
    state.deployments = reactive({
      deploymentList: [],
      loadDeployments: vi.fn().mockResolvedValue(undefined),
      pendingApprovals: [],
    });
  });

  it('shows initial loading, retries a first-load failure, and confirms an empty result', async () => {
    const initial = deferred<void>();
    state.deployments!.loadDeployments.mockReturnValueOnce(initial.promise).mockResolvedValueOnce(undefined);
    const wrapper = mountDeployments();

    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Loading deployments');

    initial.reject(new Error('deployments offline'));
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Unable to load deployments');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No deployments yet');
  });

  it('keeps confirmed rows when a refresh fails', async () => {
    state.deployments!.deploymentList.push(deployment(1));
    state.deployments!.loadDeployments.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('offline'));
    const wrapper = mountDeployments();
    await flushPromises();

    await wrapper.get('button[title="Refresh"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain(
      'The last confirmed deployments remain visible.',
    );
    expect(wrapper.text()).toContain('DEP-1');
  });

  it('filters confirmed rows and renders valid and invalid timestamps safely', async () => {
    const created = Date.parse('2026-08-09T08:00:00.000Z') / 1000;
    state.deployments!.deploymentList.push(
      deployment(1, { created }),
      deployment(2, {
        application_id: 2,
        environment_id: 2,
        release_id: 2,
        status: 'failed',
        triggered_by: 'hubot',
        created: 0,
      }),
    );
    const wrapper = mountDeployments();
    await flushPromises();

    const rows = wrapper.findAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].findAll('td')[8].text()).toBe(
      new Date(created * 1000).toLocaleString('en', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    );
    expect(rows[1].findAll('td')[8].text()).toBe('—');

    await wrapper.get('input[placeholder="Search deployments…"]').setValue('worker');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.text()).toContain('DEP-2');

    await wrapper.get('input[placeholder="Search deployments…"]').setValue('');
    await wrapper.findAll('select')[0].setValue('success');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.text()).toContain('DEP-1');

    await wrapper.findAll('select')[0].setValue('failed');
    await wrapper.findAll('select')[1].setValue('1');
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No matching deployments');
  });

  it('localizes status, strategy, and system actor in Simplified Chinese', async () => {
    state.deployments!.deploymentList.push(
      deployment(1, {
        status: 'pending_approval',
        strategy: 'all-at-once',
        triggered_by: 'system',
      }),
    );
    const wrapper = mountDeployments('zh-Hans');
    await flushPromises();

    expect(wrapper.text()).toContain('待审批');
    expect(wrapper.text()).toContain('全部同时');
    expect(wrapper.text()).toContain('系统');
    expect(wrapper.text()).not.toMatch(/\bpending_approval\b|\ball-at-once\b|\bsystem\b/i);
  });
});
