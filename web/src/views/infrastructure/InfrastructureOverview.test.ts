import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Deployment, InfrastructureOverview, Server } from '~/lib/api/types';

import InfrastructureOverviewView from './InfrastructureOverview.vue';

const state = vi.hoisted(() => ({
  api: {
    getInfrastructureOverview: vi.fn(),
  },
  applications: null as {
    environments: Map<number, { id: number; name: string; title?: string }>;
    loadEnvironments: ReturnType<typeof vi.fn>;
  } | null,
  deployments: null as {
    loadDeployments: ReturnType<typeof vi.fn>;
    runningDeployments: Deployment[];
  } | null,
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => state.api,
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

vi.mock('~/store/ops', () => ({
  useApplicationStore: () => state.applications,
  useDeploymentStore: () => state.deployments,
}));

const ScaffoldStub = defineComponent({
  setup(_, { slots }) {
    return () => h('section', [h('header', [slots.title?.(), slots.headerActions?.()]), h('main', slots.default?.())]);
  },
});

const ButtonStub = defineComponent({
  props: {
    disabled: Boolean,
    isLoading: Boolean,
    text: String,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          disabled: props.disabled || props.isLoading,
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
        h('p', props.description),
        slots.action?.(),
      ]);
  },
});

const OpsMetricCardStub = defineComponent({
  props: {
    chartValues: Array,
    label: String,
    value: String,
  },
  setup(props) {
    return () =>
      h(
        'article',
        {
          'data-chart-values': props.chartValues === undefined ? 'absent' : JSON.stringify(props.chartValues),
          'data-metric': props.label,
        },
        `${props.label}:${props.value}`,
      );
  },
});

const OpsSparklineStub = defineComponent({
  props: {
    label: String,
    values: Array,
  },
  setup(props) {
    return () => h('div', { 'data-sparkline': props.label }, JSON.stringify(props.values));
  },
});

const RouterLinkStub = defineComponent({
  props: {
    to: [String, Object],
  },
  setup(props, { slots }) {
    return () => h('a', { 'data-to': JSON.stringify(props.to) }, slots.default?.());
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function server(id: number, metrics = true): Server {
  return {
    id,
    group_id: 1,
    environment_id: 1,
    name: `server-${id}`,
    status: 'online',
    health: 'healthy',
    cpu: 30 + id,
    memory: 40 + id,
    disk: 50 + id,
    load: 1,
    maintenance: false,
    metrics: metrics
      ? {
          cpu: [20 + id, 30 + id],
          memory: [40 + id, 50 + id],
          disk: [50 + id, 60 + id],
          network: [5 + id, 10 + id],
        }
      : undefined,
  };
}

function overview(serverCount = 2, metrics = true): InfrastructureOverview {
  const servers = Array.from({ length: serverCount }, (_, index) => server(index + 1, metrics));
  return {
    server_count: serverCount,
    server_online: serverCount,
    server_maintenance: 0,
    server_offline: 0,
    avg_cpu: 32,
    avg_memory: 44,
    avg_disk: 55,
    active_alerts: 1,
    group_count: 1,
    servers,
    groups: [
      {
        id: 1,
        environment_id: 1,
        name: 'production',
        strategy: 'rolling',
        batch_size: 1,
      },
    ],
    alerts: [],
  };
}

function deferred<T>() {
  let resolveValue!: (value: T) => void;
  let rejectValue!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveValue = resolve;
    rejectValue = reject;
  });
  return { promise, reject: rejectValue, resolve: resolveValue };
}

function mountOverview() {
  return mount(InfrastructureOverviewView, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        Icon: true,
        InfrastructureNav: true,
        OpsMetricCard: OpsMetricCardStub,
        OpsSparkline: OpsSparklineStub,
        RouterLink: RouterLinkStub,
        Scaffold: ScaffoldStub,
      },
    },
  });
}

describe('infrastructure overview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    state.applications = reactive({
      environments: new Map([[1, { id: 1, name: 'production', title: 'Production' }]]),
      loadEnvironments: vi.fn().mockResolvedValue(undefined),
    });
    state.deployments = reactive({
      loadDeployments: vi.fn().mockResolvedValue(undefined),
      runningDeployments: [],
    });
    state.api.getInfrastructureOverview.mockResolvedValue(overview());
  });

  it('shows explicit initial loading, a retryable core error, and confirmed content after retry', async () => {
    const pending = deferred<InfrastructureOverview | null>();
    state.api.getInfrastructureOverview.mockReturnValueOnce(pending.promise);
    const wrapper = mountOverview();
    await nextTick();

    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Loading');
    expect(wrapper.find('[data-metric="Total servers"]').exists()).toBe(false);

    pending.reject(new Error('overview offline'));
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Infrastructure data could not be loaded');
    expect(wrapper.text()).not.toContain('overview offline');

    state.api.getInfrastructureOverview.mockResolvedValueOnce(overview(1));
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
    expect(wrapper.get('[data-metric="Total servers"]').text()).toContain('1/1');
  });

  it('keeps confirmed core data through optional and refresh failures without fabricated chart series', async () => {
    const wrapper = mountOverview();
    await flushPromises();

    expect(wrapper.get('[data-metric="Total servers"]').attributes('data-chart-values')).toBe('absent');
    expect(wrapper.get('[data-metric="Active alerts"]').attributes('data-chart-values')).toBe('absent');
    expect(wrapper.get('[data-metric="Avg CPU"]').attributes('data-chart-values')).toBe('[21.5,31.5]');
    expect(wrapper.get('[data-sparkline="CPU usage"]').text()).toBe('[21.5,31.5]');

    state.deployments!.loadDeployments.mockRejectedValueOnce(new Error('deployments offline'));
    await (wrapper.vm as unknown as { loadOverview: (refresh?: boolean) => Promise<void> }).loadOverview(true);
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Some infrastructure data is unavailable');
    expect(wrapper.get('[data-metric="Total servers"]').text()).toContain('2/2');

    state.api.getInfrastructureOverview.mockRejectedValueOnce(new Error('overview offline'));
    await (wrapper.vm as unknown as { loadOverview: (refresh?: boolean) => Promise<void> }).loadOverview(true);
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain(
      'The last confirmed infrastructure data remains available',
    );
    expect(wrapper.get('[data-metric="Total servers"]').text()).toContain('2/2');
  });

  it('omits metric trend panels when the API provides no metric samples', async () => {
    state.api.getInfrastructureOverview.mockResolvedValueOnce(overview(1, false));
    const wrapper = mountOverview();
    await flushPromises();

    expect(wrapper.find('[data-sparkline="CPU usage"]').exists()).toBe(false);
    expect(wrapper.find('[data-sparkline="Memory usage"]').exists()).toBe(false);
    expect(wrapper.find('[data-sparkline="Network throughput"]').exists()).toBe(false);
  });
});
