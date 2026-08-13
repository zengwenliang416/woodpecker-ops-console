import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Alert } from '~/lib/api/types';

import InfrastructureAlerts from './InfrastructureAlerts.vue';

const state = vi.hoisted(() => ({
  api: {
    acknowledgeAlert: vi.fn(),
    resolveAlert: vi.fn(),
  },
  notifications: {
    notify: vi.fn(),
  },
  serverStore: null as {
    activeAlerts: Alert[];
    alerts: Map<number, Alert>;
    alertsList: Alert[];
    loadAll: ReturnType<typeof vi.fn>;
    loadAlerts: ReturnType<typeof vi.fn>;
    loadServers: ReturnType<typeof vi.fn>;
    serverList: unknown[];
  } | null,
}));

vi.mock('~/compositions/useApiClient', () => ({ default: () => state.api }));
vi.mock('~/compositions/useNotifications', () => ({ default: () => state.notifications }));
vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));
vi.mock('~/store/ops', () => ({ useServerStore: () => state.serverStore }));

const messages = structuredClone(en);
Object.assign(messages.ops.alerts, {
  all_severities: 'All severities',
  error_description: 'Alerts could not be loaded.',
  error_title: 'Unable to load alerts',
  filtered_none: 'No matching alerts',
  loading_description: 'Fetching current alerts.',
  loading_title: 'Loading alerts',
  mutation_error: 'Alert update failed',
  refresh_error_description: 'The last confirmed alerts remain visible.',
  refresh_error_title: 'Refresh failed',
  refresh: 'Refresh',
  retry: 'Retry',
  view_deployment: 'View deployment',
  view_server: 'View server',
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

const ButtonStub = defineComponent({
  props: {
    disabled: Boolean,
    isLoading: Boolean,
    text: String,
    title: String,
    to: [String, Object],
  },
  emits: ['click'],
  setup(props, { emit }) {
    const hasTarget = () => props.to !== undefined && props.to !== null;
    return () =>
      h(
        hasTarget() ? 'a' : 'button',
        {
          'data-to': hasTarget() ? JSON.stringify(props.to) : undefined,
          disabled: props.disabled || props.isLoading,
          title: props.title ?? props.text,
          onClick: () => emit('click'),
        },
        props.text,
      );
  },
});

function alert(id: number, overrides: Partial<Alert> = {}): Alert {
  return {
    id,
    type: 'server-health',
    severity: 'critical',
    status: 'active',
    server_id: id + 10,
    message: `alert-${id}`,
    created: 1_700_000_000,
    ...overrides,
  };
}

function deferred<T>() {
  let rejectValue!: (reason?: unknown) => void;
  let resolveValue!: (value: T) => void;
  const promise = new Promise<T>((resolve, reject) => {
    rejectValue = reject;
    resolveValue = resolve;
  });
  return { promise, reject: rejectValue, resolve: resolveValue };
}

function mountAlerts() {
  return mount(InfrastructureAlerts, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        InfrastructureNav: true,
        Scaffold: {
          template: '<section><header><slot name="title" /><slot name="headerActions" /></header><slot /></section>',
        },
      },
    },
  });
}

describe('infrastructure alerts', () => {
  beforeEach(() => {
    state.api.acknowledgeAlert.mockReset();
    state.api.resolveAlert.mockReset();
    state.notifications.notify.mockReset();
    const alerts = reactive(new Map<number, Alert>());
    state.serverStore = reactive({
      activeAlerts: computed(() => [...alerts.values()].filter((item) => item.status === 'active')),
      alerts,
      alertsList: computed(() => [...alerts.values()].sort((left, right) => right.id - left.id)),
      loadAll: vi.fn().mockResolvedValue(undefined),
      loadAlerts: vi.fn().mockResolvedValue(undefined),
      loadServers: vi.fn().mockResolvedValue(undefined),
      serverList: [],
    });
  });

  it('shows initial loading, retries an active error, and distinguishes empty states', async () => {
    state.serverStore!.loadAlerts.mockRejectedValueOnce(new Error('alerts offline')).mockResolvedValueOnce(undefined);
    const wrapper = mountAlerts();

    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Loading alerts');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Unable to load alerts');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No alerts');
  });

  it('filters severity and exposes current server and deployment relationships', async () => {
    state.serverStore!.alerts.set(1, alert(1));
    state.serverStore!.alerts.set(2, alert(2, { severity: 'warning', deployment_id: 42, server_id: undefined }));
    const wrapper = mountAlerts();
    await flushPromises();

    expect(wrapper.find('a[data-to*="infrastructure-server"]').exists()).toBe(true);
    expect(wrapper.find('a[data-to*="deployment"]').exists()).toBe(true);

    const selects = wrapper.findAll('select');
    await selects[1].setValue('info');
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No matching alerts');
  });

  it('preserves confirmed alerts after refresh failure', async () => {
    state.serverStore!.alerts.set(1, alert(1));
    const wrapper = mountAlerts();
    await flushPromises();

    state.serverStore!.loadAlerts.mockRejectedValueOnce(new Error('refresh offline'));
    await wrapper.get('button[title="Refresh"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('The last confirmed alerts remain visible.');
    expect(wrapper.text()).toContain('alert-1');
  });

  it('prevents duplicate mutations and adopts the API-confirmed alert', async () => {
    state.serverStore!.alerts.set(1, alert(1));
    const mutation = deferred<Alert | null>();
    state.api.acknowledgeAlert.mockReturnValue(mutation.promise);
    const wrapper = mountAlerts();
    await flushPromises();
    state.serverStore!.loadAlerts.mockClear();

    const acknowledge = wrapper.get('button[title="Acknowledge"]');
    await acknowledge.trigger('click');
    await acknowledge.trigger('click');
    expect(state.api.acknowledgeAlert).toHaveBeenCalledTimes(1);
    expect(wrapper.get('button[title="Acknowledge"]').attributes('disabled')).toBeDefined();

    mutation.resolve(alert(1, { status: 'acknowledged' }));
    await flushPromises();
    expect(wrapper.text()).toContain('acknowledged');
    expect(wrapper.find('button[title="Acknowledge"]').exists()).toBe(false);
    expect(state.serverStore!.loadAlerts).not.toHaveBeenCalled();
  });

  it('reports mutation errors, keeps current data, and unlocks retry', async () => {
    state.serverStore!.alerts.set(1, alert(1));
    state.api.resolveAlert.mockRejectedValueOnce(new Error('resolve rejected'));
    const wrapper = mountAlerts();
    await flushPromises();

    await wrapper.get('button[title="Resolve"]').trigger('click');
    await flushPromises();

    expect(state.notifications.notify).toHaveBeenCalledWith({ title: 'Alert update failed', type: 'error' });
    expect(wrapper.text()).not.toContain('resolve rejected');
    expect(wrapper.text()).toContain('alert-1');
    expect(wrapper.get('button[title="Resolve"]').attributes('disabled')).toBeUndefined();
  });
});
