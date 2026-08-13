import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Application, AppRelease, Environment, ServerGroup } from '~/lib/api/types';

import ApplicationDetail from './ApplicationDetail.vue';
import EnvironmentDetail from './EnvironmentDetail.vue';

const state = vi.hoisted(() => ({
  api: {
    getApplication: vi.fn(),
  },
  applications: null as {
    applications: Map<number, Application>;
    applicationList: Application[];
    environments: Map<number, Environment>;
    environmentList: Environment[];
    loadApplications: ReturnType<typeof vi.fn>;
    loadEnvironments: ReturnType<typeof vi.fn>;
    loadReleases: ReturnType<typeof vi.fn>;
    releaseList: AppRelease[];
    setApplication: (application: Application) => void;
    setRelease: (release: AppRelease) => void;
  } | null,
  route: { params: { appId: '1', envId: '1' } },
  servers: null as {
    groupList: ServerGroup[];
    loadGroups: ReturnType<typeof vi.fn>;
  } | null,
}));

vi.mock('vue-router', () => ({
  useRoute: () => state.route,
  useRouter: () => ({ push: vi.fn() }),
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

function application(id: number, name = `app-${id}`): Application {
  return {
    id,
    name,
    image: `example/${name}:1`,
    runtime: 'docker-compose',
    service: name,
    health_path: '/healthz',
    port: 8080,
  };
}

function environment(id: number): Environment {
  return {
    id,
    name: id === 1 ? 'production' : 'staging',
    title: id === 1 ? 'Production' : 'Staging',
    protected: id === 1,
    approval_required: id === 1,
    minimum_approvers: id === 1 ? 1 : 0,
    auto_rollback: id === 1,
  };
}

function release(id: number, applicationId: number): AppRelease {
  return {
    id,
    application_id: applicationId,
    pipeline_id: id,
    version: `v${id}.0.0`,
    digest: `sha256:${id}`,
    status: 'ready',
  };
}

const mountOptions = {
  global: {
    plugins: [i18n],
    stubs: {
      Button: ButtonStub,
      DeploymentNav: true,
      FeedbackState: FeedbackStateStub,
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

function mountApplicationDetail() {
  return mount(ApplicationDetail, mountOptions);
}

function mountEnvironmentDetail() {
  return mount(EnvironmentDetail, mountOptions);
}

describe('deployment detail routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    state.route = reactive({ params: { appId: '1', envId: '1' } });
    state.applications = reactive({
      applications: new Map<number, Application>(),
      applicationList: [] as Application[],
      environments: new Map<number, Environment>(),
      environmentList: [] as Environment[],
      loadApplications: vi.fn().mockResolvedValue(undefined),
      loadEnvironments: vi.fn().mockResolvedValue(undefined),
      loadReleases: vi.fn().mockResolvedValue(undefined),
      releaseList: [] as AppRelease[],
      setApplication(created: Application) {
        this.applications.set(created.id, created);
        this.applicationList.splice(0, this.applicationList.length, ...this.applications.values());
      },
      setRelease(created: AppRelease) {
        const index = this.releaseList.findIndex((item) => item.id === created.id);
        if (index === -1) this.releaseList.push(created);
        else this.releaseList[index] = created;
      },
    });
    state.servers = reactive({
      groupList: [],
      loadGroups: vi.fn().mockResolvedValue(undefined),
    });
    state.api.getApplication.mockResolvedValue(null);
  });

  it('distinguishes missing application from loading and retries an initial failure', async () => {
    state.api.getApplication.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(null);
    const wrapper = mountApplicationDetail();
    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Loading application');

    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Unable to load application');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('Application not found');
  });

  it('keeps the latest application when route requests resolve out of order', async () => {
    const first = deferred<{ application: Application; releases: AppRelease[] } | null>();
    const second = deferred<{ application: Application; releases: AppRelease[] } | null>();
    state.api.getApplication.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const wrapper = mountApplicationDetail();

    state.route.params.appId = '2';
    await flushPromises();
    second.resolve({ application: application(2, 'worker'), releases: [release(2, 2)] });
    await flushPromises();
    expect(wrapper.text()).toContain('worker');
    expect(wrapper.text()).toContain('v2.0.0');

    first.resolve({ application: application(1, 'api'), releases: [release(1, 1)] });
    await flushPromises();
    expect(wrapper.text()).toContain('worker');
    expect(wrapper.text()).not.toContain('api');
  });

  it('preserves confirmed application detail after a failed refresh', async () => {
    state.api.getApplication
      .mockResolvedValueOnce({ application: application(1, 'api'), releases: [release(1, 1)] })
      .mockRejectedValueOnce(new Error('offline'));
    const wrapper = mountApplicationDetail();
    await flushPromises();

    await wrapper.get('button[title="Refresh"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain(
      'The last confirmed application remains visible.',
    );
    expect(wrapper.text()).toContain('api');
  });

  it('shows missing environment and reloads when the route changes', async () => {
    state.applications!.loadEnvironments.mockImplementation(() => {
      state.applications!.environments.clear();
      if (state.route.params.envId === '2') state.applications!.environments.set(2, environment(2));
    });
    const wrapper = mountEnvironmentDetail();
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('Environment not found');

    state.route.params.envId = '2';
    await flushPromises();
    expect(state.applications!.loadEnvironments).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('Staging');
  });

  it('keeps confirmed environment data when an auxiliary refresh fails', async () => {
    state.applications!.environments.set(1, environment(1));
    state.servers!.groupList.push({
      id: 1,
      environment_id: 1,
      name: 'production-api',
      strategy: 'rolling',
      batch_size: 2,
    });
    state.servers!.loadGroups.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('offline'));
    const wrapper = mountEnvironmentDetail();
    await flushPromises();

    await wrapper.get('button[title="Refresh"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain(
      'The last confirmed environment remains visible.',
    );
    expect(wrapper.text()).toContain('Production');
    expect(wrapper.text()).toContain('production-api');
  });
});
