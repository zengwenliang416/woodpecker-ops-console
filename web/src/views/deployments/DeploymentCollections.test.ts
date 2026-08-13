import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import { useDate } from '~/compositions/useDate';
import type { Application, AppRelease, Deployment, DeploymentPolicies, Environment } from '~/lib/api/types';

import Applications from './Applications.vue';
import DeploymentApprovals from './DeploymentApprovals.vue';
import DeploymentPoliciesView from './DeploymentPolicies.vue';
import Environments from './Environments.vue';
import Releases from './Releases.vue';

const state = vi.hoisted(() => ({
  api: {
    createApplication: vi.fn(),
    getOpsPolicies: vi.fn(),
  },
  applications: null as {
    applications: Map<number, Application>;
    applicationList: Application[];
    environmentList: Environment[];
    loadAll: ReturnType<typeof vi.fn>;
    loadApplications: ReturnType<typeof vi.fn>;
    loadEnvironments: ReturnType<typeof vi.fn>;
    loadReleases: ReturnType<typeof vi.fn>;
    releaseList: AppRelease[];
    setApplication: (application: Application) => void;
  } | null,
  deployments: null as {
    deploymentList: Deployment[];
    loadDeployments: ReturnType<typeof vi.fn>;
  } | null,
}));

vi.mock('~/compositions/useApiClient', () => ({ default: () => state.api }));
vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));
vi.mock('~/store/ops', () => ({
  useApplicationStore: () => state.applications,
  useDeploymentStore: () => state.deployments,
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

function application(id: number, name = `app-${id}`): Application {
  return {
    id,
    name,
    image: `example/${name}:1`,
    runtime: 'docker-compose',
    service: name,
  };
}

function environment(id: number, protectedEnvironment = false): Environment {
  return {
    id,
    name: id === 1 ? 'production' : 'staging',
    title: id === 1 ? 'Production' : 'Staging',
    protected: protectedEnvironment,
    approval_required: protectedEnvironment,
    minimum_approvers: protectedEnvironment ? 1 : 0,
    auto_rollback: protectedEnvironment,
  };
}

function release(id: number, applicationId = 1, overrides: Partial<AppRelease> = {}): AppRelease {
  return {
    id,
    application_id: applicationId,
    pipeline_id: id,
    version: `v${id}.0.0`,
    digest: `sha256:${id}`,
    status: 'ready',
    ...overrides,
  };
}

function deployment(id: number, overrides: Partial<Deployment> = {}): Deployment {
  return {
    id,
    application_id: 1,
    environment_id: 1,
    release_id: 1,
    status: 'pending_approval',
    strategy: 'rolling',
    batch_size: 1,
    progress: 0,
    triggered_by: 'octocat',
    ...overrides,
  };
}

const mountOptions = {
  global: {
    plugins: [i18n],
    stubs: {
      Button: ButtonStub,
      DeploymentNav: true,
      FeedbackState: FeedbackStateStub,
      IconButton: true,
      PrototypeIcon: true,
      RouterLink: {
        props: ['to'],
        template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
      },
      Scaffold: {
        template: '<section><header><slot name="title" /><slot name="headerActions" /></header><slot /></section>',
      },
    },
  },
};

function mountApplications() {
  return mount(Applications, mountOptions);
}

function mountEnvironments() {
  return mount(Environments, mountOptions);
}

function mountReleases() {
  return mount(Releases, mountOptions);
}

function mountApprovals() {
  return mount(DeploymentApprovals, mountOptions);
}

function mountPolicies() {
  return mount(DeploymentPoliciesView, mountOptions);
}

describe('deployment collection routes', () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    await useDate().setDateLocale('en');
    const applications = [application(1, 'api'), application(2, 'worker')];
    const environments = [environment(1, true), environment(2)];
    const releases = [release(1), release(2, 2)];

    state.applications = reactive({
      applications: new Map(applications.map((item) => [item.id, item])),
      applicationList: applications,
      environmentList: environments,
      loadAll: vi.fn().mockResolvedValue(undefined),
      loadApplications: vi.fn().mockResolvedValue(undefined),
      loadEnvironments: vi.fn().mockResolvedValue(undefined),
      loadReleases: vi.fn().mockResolvedValue(undefined),
      releaseList: releases,
      setApplication(created: Application) {
        this.applications.set(created.id, created);
        const index = this.applicationList.findIndex((item) => item.id === created.id);
        if (index === -1) this.applicationList.push(created);
        else this.applicationList[index] = created;
      },
    });
    state.deployments = reactive({
      deploymentList: [deployment(1)],
      loadDeployments: vi.fn().mockResolvedValue(undefined),
    });
    state.api.createApplication.mockResolvedValue(application(3, 'new-app'));
    state.api.getOpsPolicies.mockResolvedValue({
      health_check_retries: 3,
      health_check_interval: 10,
      batch_size_default: 2,
      auto_rollback: true,
    } satisfies DeploymentPolicies);
  });

  it('retries application loading and prevents duplicate creation submissions', async () => {
    const firstLoad = deferred<void>();
    state.applications!.loadApplications.mockReturnValueOnce(firstLoad.promise).mockResolvedValueOnce(undefined);
    const wrapper = mountApplications();

    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Loading applications');
    firstLoad.reject(new Error('offline'));
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Unable to load applications');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    await wrapper
      .findAll('header button')
      .find((button) => button.text() === 'New application')!
      .trigger('click');

    const create = deferred<Application | null>();
    state.api.createApplication.mockReturnValueOnce(create.promise);
    await wrapper.get('form input').setValue('new-app');
    await wrapper.get('form').trigger('submit');
    await wrapper.get('form').trigger('submit');
    expect(state.api.createApplication).toHaveBeenCalledTimes(1);

    create.reject(new Error('create offline'));
    await flushPromises();
    expect(wrapper.get('form [data-feedback-state="error"]').text()).toContain('Application creation failed');
    expect(wrapper.find('form').exists()).toBe(true);
  });

  it('filters environments by search and protection state', async () => {
    const wrapper = mountEnvironments();
    await flushPromises();

    expect(wrapper.findAll('.environment-card')).toHaveLength(2);
    await wrapper.get('input[placeholder="Search environments…"]').setValue('staging');
    expect(wrapper.findAll('.environment-card')).toHaveLength(1);
    expect(wrapper.text()).toContain('Staging');

    await wrapper.get('input[placeholder="Search environments…"]').setValue('');
    await wrapper.get('select').setValue('protected');
    expect(wrapper.findAll('.environment-card')).toHaveLength(1);
    expect(wrapper.text()).toContain('Production');
  });

  it('keeps releases on refresh failure and renders safe timestamps', async () => {
    const created = Date.parse('2026-08-09T08:00:00.000Z') / 1000;
    state.applications!.releaseList[0] = release(1, 1, { created });
    state.applications!.loadReleases.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('offline'));
    const wrapper = mountReleases();
    await flushPromises();

    expect(wrapper.text()).toContain(
      new Date(created * 1000).toLocaleString('en', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    );
    await wrapper.get('button[title="Refresh"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain(
      'The last confirmed releases remain visible.',
    );
    expect(wrapper.text()).toContain('v1.0.0');
  });

  it('shows confirmed empty and filtered-empty approval states', async () => {
    const wrapper = mountApprovals();
    await flushPromises();
    expect(wrapper.text()).toContain('DEP-1');

    await wrapper.get('input[placeholder="Search approval requests…"]').setValue('missing');
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No matching approval requests');

    state.deployments!.deploymentList.splice(0);
    const emptyWrapper = mountApprovals();
    await flushPromises();
    expect(emptyWrapper.get('[data-feedback-state="empty"]').text()).toContain('No deployments awaiting approval');
  });

  it('treats policies as one default object and preserves it after refresh failure', async () => {
    state.api.getOpsPolicies.mockResolvedValueOnce({
      health_check_retries: 3,
      health_check_interval: 10,
      batch_size_default: 2,
      auto_rollback: true,
    } satisfies DeploymentPolicies);
    const wrapper = mountPolicies();
    await flushPromises();

    expect(wrapper.text()).toContain('Current defaults returned by the deployment policies API.');
    expect(wrapper.text()).toContain('This endpoint exposes one default policy object.');

    state.api.getOpsPolicies.mockRejectedValueOnce(new Error('offline'));
    await wrapper.get('button[title="Refresh"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain(
      'The last confirmed default policy remains visible.',
    );
    expect(wrapper.text()).toContain('3');
  });
});
