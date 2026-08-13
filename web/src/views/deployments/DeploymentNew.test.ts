import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Application, AppRelease, Deployment, Environment, Server, ServerGroup } from '~/lib/api/types';

import DeploymentNew from './DeploymentNew.vue';

const state = vi.hoisted(() => ({
  api: {
    createDeployment: vi.fn(),
  },
  applications: null as {
    applications: Map<number, Application>;
    applicationList: Application[];
    environments: Map<number, Environment>;
    environmentList: Environment[];
    loadAll: ReturnType<typeof vi.fn>;
    releaseList: AppRelease[];
    releases: Map<number, AppRelease>;
    releasesOf: (applicationId: number) => { value: AppRelease[] };
  } | null,
  route: {
    query: {},
  },
  router: {
    push: vi.fn(),
  },
  servers: null as {
    groupList: ServerGroup[];
    groups: Map<number, ServerGroup>;
    loadAll: ReturnType<typeof vi.fn>;
    serverList: Server[];
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
  useServerStore: () => state.servers,
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

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

function mountWizard() {
  return mount(DeploymentNew, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        DeploymentNav: true,
        FeedbackState: FeedbackStateStub,
        Icon: true,
        Scaffold: {
          template: '<section><header><slot name="title" /><slot name="headerActions" /></header><slot /></section>',
        },
      },
    },
  });
}

describe('deployment wizard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const applications: Application[] = [
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
    const environments: Environment[] = [
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
    const releases: AppRelease[] = [
      {
        id: 1,
        application_id: 1,
        pipeline_id: 1,
        version: 'v1.0.0',
        digest: 'sha256:one',
        status: 'ready',
      },
      {
        id: 2,
        application_id: 2,
        pipeline_id: 2,
        version: 'v2.0.0',
        digest: 'sha256:two',
        status: 'ready',
      },
    ];
    const groups: ServerGroup[] = [
      { id: 1, environment_id: 1, name: 'prod-api', strategy: 'rolling', batch_size: 1 },
      { id: 2, environment_id: 2, name: 'stage-api', strategy: 'rolling', batch_size: 1 },
    ];
    const servers: Server[] = [
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
      {
        id: 2,
        group_id: 2,
        environment_id: 2,
        name: 'stage-1',
        status: 'online',
        health: 'healthy',
        cpu: 10,
        memory: 20,
        disk: 30,
        load: 1,
        maintenance: false,
      },
    ];

    state.route = { query: {} };
    state.applications = reactive({
      applications: new Map(applications.map((item) => [item.id, item])),
      applicationList: applications,
      environments: new Map(environments.map((item) => [item.id, item])),
      environmentList: environments,
      loadAll: vi.fn().mockResolvedValue(undefined),
      releaseList: releases,
      releases: new Map(releases.map((item) => [item.id, item])),
      releasesOf: (applicationId: number) =>
        computed(() => releases.filter((item) => item.application_id === applicationId)),
    });
    state.servers = reactive({
      groupList: groups,
      groups: new Map(groups.map((item) => [item.id, item])),
      loadAll: vi.fn().mockResolvedValue(undefined),
      serverList: servers,
      servers: new Map(servers.map((item) => [item.id, item])),
    });
    state.api.createDeployment.mockResolvedValue({
      id: 10,
      application_id: 1,
      environment_id: 1,
      release_id: 1,
      group_id: 1,
      status: 'running',
      strategy: 'rolling',
      batch_size: 1,
      progress: 0,
    } satisfies Deployment);
  });

  it('shows an initial error and retries option loading', async () => {
    state.applications!.loadAll.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    const wrapper = mountWizard();
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Unable to prepare deployment');
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Application & Release');
  });

  it('initializes valid application, release, and environment query parameters', async () => {
    state.route = { query: { applicationId: '2', releaseId: '2', environmentId: '2' } };
    const wrapper = mountWizard();
    await flushPromises();

    const vm = wrapper.vm as unknown as {
      draft: { applicationId: number; environmentId: number; groupId: number; releaseId: number };
    };
    expect(vm.draft).toMatchObject({ applicationId: 2, releaseId: 2, environmentId: 2, groupId: 2 });
  });

  it('prevents duplicate submissions and preserves the confirmed draft after failure', async () => {
    const create = deferred<Deployment | null>();
    state.api.createDeployment.mockReturnValueOnce(create.promise);
    const wrapper = mountWizard();
    await flushPromises();
    const vm = wrapper.vm as unknown as {
      confirmed: boolean;
      currentStep: number;
      submit: () => Promise<void>;
    };
    vm.currentStep = 5;
    vm.confirmed = true;

    void vm.submit();
    void vm.submit();
    await flushPromises();
    expect(state.api.createDeployment).toHaveBeenCalledTimes(1);

    create.reject(new Error('offline'));
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Deployment submission failed');
    expect(vm.confirmed).toBe(true);
    expect(state.router.push).not.toHaveBeenCalled();
  });
});
