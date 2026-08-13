import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import InfrastructureServices from './InfrastructureServices.vue';

const state = vi.hoisted(() => ({
  api: {
    getOpsServices: vi.fn(),
  },
  serverStore: null as {
    activeAlerts: unknown[];
    loadAll: ReturnType<typeof vi.fn>;
    serverList: unknown[];
  } | null,
}));

vi.mock('~/compositions/useApiClient', () => ({ default: () => state.api }));
vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));
vi.mock('~/store/ops', () => ({ useServerStore: () => state.serverStore }));

const messages = structuredClone(en);
Object.assign(messages.ops.services, {
  all_statuses: 'All statuses',
  containers: 'Containers',
  degraded_nodes: 'Degraded nodes',
  error_description: 'Services could not be loaded.',
  error_title: 'Unable to load services',
  filtered_none: 'No matching services',
  healthy_nodes: 'Healthy nodes',
  loading_description: 'Fetching current services.',
  loading_title: 'Loading services',
  monitored_nodes: 'Monitored nodes',
  refresh_error_description: 'The last confirmed services remain visible.',
  refresh_error_title: 'Refresh failed',
  refresh: 'Refresh',
  retry: 'Retry',
  search_placeholder: 'Search servers or runtimes…',
});

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: messages } });

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

const OpsMetricCardStub = defineComponent({
  props: {
    label: String,
    value: String,
  },
  template: '<article data-metric-card><span>{{ label }}</span><strong>{{ value }}</strong></article>',
});

const ButtonStub = defineComponent({
  props: {
    disabled: Boolean,
    isLoading: Boolean,
    text: String,
    title: String,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          disabled: props.disabled || props.isLoading,
          title: props.title ?? props.text,
          onClick: () => emit('click'),
        },
        props.text,
      );
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

function service(id: number, status = 'healthy') {
  return {
    server_id: id,
    server_name: `server-${id}`,
    runtime: id === 1 ? 'Docker 27' : id === 2 ? 'containerd 2' : 'CRI-O 1',
    status,
    containers: id + 2,
    cpu: id * 10,
    memory: id * 20,
  };
}

function mountServices() {
  return mount(InfrastructureServices, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        InfrastructureNav: true,
        OpsMetricCard: OpsMetricCardStub,
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

describe('infrastructure services', () => {
  beforeEach(() => {
    state.api.getOpsServices.mockReset().mockResolvedValue([]);
    state.serverStore = reactive({
      activeAlerts: [],
      loadAll: vi.fn().mockResolvedValue(undefined),
      serverList: [],
    });
  });

  it('shows loading, retries an initial error, and treats a null response as an empty list', async () => {
    const initial = deferred<unknown[] | null>();
    state.api.getOpsServices.mockReturnValueOnce(initial.promise).mockResolvedValueOnce(null);
    const wrapper = mountServices();

    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Loading services');
    initial.reject(new Error('services offline'));
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Unable to load services');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No services found');
  });

  it('calculates real aggregate KPIs and filters by search and status', async () => {
    state.api.getOpsServices.mockResolvedValue([service(1), service(2, 'degraded'), service(3, 'unreachable')]);
    const wrapper = mountServices();
    await flushPromises();

    const metrics = wrapper.findAll('[data-metric-card]').map((card) => card.text());
    expect(metrics).toEqual(['Monitored nodes3', 'Healthy nodes1', 'Degraded nodes2', 'Containers12']);
    expect(wrapper.findAll('tbody tr')).toHaveLength(3);

    await wrapper.get('input[placeholder="Search servers or runtimes…"]').setValue('containerd');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.text()).toContain('server-2');

    await wrapper.get('input[placeholder="Search servers or runtimes…"]').setValue('');
    await wrapper.get('select').setValue('healthy');
    expect(wrapper.findAll('tbody tr')).toHaveLength(1);
    expect(wrapper.text()).toContain('server-1');

    await wrapper.get('select').setValue('stopped');
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No matching services');
    expect(wrapper.text()).not.toMatch(/restart|logs/i);
  });

  it('keeps confirmed rows when refresh fails', async () => {
    state.api.getOpsServices.mockResolvedValueOnce([service(1)]).mockRejectedValueOnce(new Error('refresh offline'));
    const wrapper = mountServices();
    await flushPromises();

    await wrapper.get('button[title="Refresh"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain(
      'The last confirmed services remain visible.',
    );
    expect(wrapper.text()).toContain('server-1');
  });
});
