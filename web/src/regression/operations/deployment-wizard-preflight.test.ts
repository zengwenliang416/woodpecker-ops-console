import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Application, AppRelease, Deployment, Environment, Server, ServerGroup } from '~/lib/api/types';
import DeploymentNew from '~/views/deployments/DeploymentNew.vue';

/**
 * Operations regression: deployment wizard preflight (repaired by task 022,
 * baseline task 6.3/6.4).
 *
 * Repaired behavior under test: "Wizard preflight reports only
 * client-confirmable release, target capacity, disk, and environment approval
 * inputs. The unsupported deployment-lock assertion was removed rather than
 * copied from the prototype."
 */
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

interface WizardVm {
  currentStep: number;
  draft: {
    applicationId: number;
    releaseId: number;
    environmentId: number;
    groupId: number;
    strategy: string;
    batchSize: number;
  };
  preflight: Array<{ label: string; detail: string; ok: boolean; blocking: boolean }>;
  preflightPassed: boolean;
}

describe('operations regression: deployment wizard preflight', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const applications: Application[] = [
      { id: 1, name: 'api', image: 'example/api:1', runtime: 'docker-compose', service: 'api' },
      { id: 2, name: 'worker', image: 'example/worker:1', runtime: 'docker-compose', service: 'worker' },
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
      { id: 1, application_id: 1, pipeline_id: 1, version: 'v1.0.0', digest: 'sha256:one', status: 'ready' },
      { id: 2, application_id: 2, pipeline_id: 2, version: 'v2.0.0', digest: 'sha256:two', status: 'ready' },
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

  it('renders exactly the four client-confirmable preflight checks and never a deployment-lock assertion', async () => {
    const wrapper = mountWizard();
    await flushPromises();
    const vm = wrapper.vm as unknown as WizardVm;
    vm.currentStep = 4;
    await flushPromises();

    const labels = wrapper.findAll('.preflight-list article strong').map((node) => node.text());
    expect(labels).toEqual(['Release artifact', 'Target capacity', 'Disk space', 'Environment protection settings']);

    // The unsupported deployment-lock assertion must not exist anywhere in the
    // wizard surface (labels, details, or checks).
    expect(wrapper.text()).not.toMatch(/deployment lock/i);
    expect(wrapper.text()).not.toMatch(/lock (is|must|required|active|acquired)/i);
  });

  it('blocks preflight without a release and passes once every client-confirmable input is present', async () => {
    const wrapper = mountWizard();
    await flushPromises();
    const vm = wrapper.vm as unknown as WizardVm;
    vm.currentStep = 4;

    // The wizard auto-initializes the draft to the first available options;
    // clear the release to prove the blocking release check fails closed.
    vm.draft.releaseId = 0;
    await flushPromises();
    expect(vm.preflight[0]).toMatchObject({ label: 'Release artifact', ok: false, blocking: true });
    expect(vm.preflightPassed).toBe(false);
    expect(wrapper.text()).toContain('No release selected');
    expect(wrapper.text()).toContain('Client-side preflight has blocking items');

    // Restore the release: every client-confirmable input is now present.
    vm.draft.releaseId = 1;
    await flushPromises();

    expect(vm.preflight.map((item) => item.ok)).toEqual([true, true, true, true]);
    expect(vm.preflightPassed).toBe(true);
    expect(wrapper.text()).toContain('Client-side preflight passed');
    expect(wrapper.text()).toContain('Requires 1 approver before execution.');
    expect(wrapper.text()).toContain('All nodes have enough free disk');
  });
});
