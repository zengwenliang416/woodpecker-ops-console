import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Environment, Server, ServerGroup } from '~/lib/api/types';

import InfrastructureGroup from './InfrastructureGroup.vue';

const state = vi.hoisted(() => ({
  appStore: null as {
    environments: Map<number, Environment>;
    loadEnvironments: ReturnType<typeof vi.fn>;
  } | null,
  route: { params: { groupId: '1' } },
  serverStore: null as {
    activeAlerts: unknown[];
    groups: Map<number, ServerGroup>;
    loadAlerts: ReturnType<typeof vi.fn>;
    loadGroups: ReturnType<typeof vi.fn>;
    loadServers: ReturnType<typeof vi.fn>;
    serverList: Server[];
  } | null,
}));

vi.mock('vue-router', () => ({
  useRoute: () => state.route,
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));
vi.mock('~/store/ops', () => ({
  useApplicationStore: () => state.appStore,
  useServerStore: () => state.serverStore,
}));

const messages = structuredClone(en);
Object.assign(messages.ops.groups, {
  empty_servers: 'No servers in this group',
  error_description: 'The server group could not be loaded.',
  error_title: 'Unable to load server group',
  health_check: 'Health check',
  loading_description: 'Fetching the server group.',
  loading_title: 'Loading server group',
  missing_description: 'This server group does not exist or is no longer available.',
  missing_title: 'Server group not found',
  refresh_error_description: 'The last confirmed server group remains visible.',
  refresh_error_title: 'Refresh failed',
  refresh: 'Refresh',
  retry: 'Retry',
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

function group(id: number): ServerGroup {
  return {
    id,
    environment_id: 1,
    name: `group-${id}`,
    description: 'Production API nodes',
    strategy: 'rolling',
    batch_size: 2,
    health_path: '/healthz',
    port: 8080,
  };
}

function mountGroup() {
  return mount(InfrastructureGroup, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        InfrastructureNav: true,
        RouterLink: true,
        Scaffold: {
          template: '<section><header><slot name="title" /><slot name="headerActions" /></header><slot /></section>',
        },
      },
    },
  });
}

describe('infrastructure group detail', () => {
  beforeEach(() => {
    state.route = reactive({ params: { groupId: '1' } });
    state.serverStore = reactive({
      activeAlerts: [],
      groups: new Map<number, ServerGroup>(),
      loadAlerts: vi.fn().mockResolvedValue(undefined),
      loadGroups: vi.fn().mockResolvedValue(undefined),
      loadServers: vi.fn().mockResolvedValue(undefined),
      serverList: [] as Server[],
    });
    state.appStore = reactive({
      environments: new Map([[1, { id: 1, name: 'prod', title: 'Production' } as Environment]]),
      loadEnvironments: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('ends in a missing state after a successful load without the requested group', async () => {
    const wrapper = mountGroup();
    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Loading server group');

    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('Server group not found');
    expect(wrapper.text()).not.toContain('...');
  });

  it('retries an initial failure and renders only current group contracts', async () => {
    state.serverStore!.loadGroups.mockRejectedValueOnce(new Error('offline')).mockImplementationOnce(() => {
      state.serverStore!.groups.set(1, group(1));
    });
    const wrapper = mountGroup();
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Unable to load server group');
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('group-1');
    expect(wrapper.text()).toContain('Production API nodes');
    expect(wrapper.text()).toContain('Production');
    expect(wrapper.text()).toContain('rolling');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain(':8080/healthz');
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No servers in this group');
    expect(wrapper.text()).not.toContain('98.6%');
  });

  it('keeps the confirmed detail visible through a failed refresh', async () => {
    state.serverStore!.groups.set(1, group(1));
    const wrapper = mountGroup();
    await flushPromises();

    state.serverStore!.loadGroups.mockRejectedValueOnce(new Error('refresh offline'));
    await wrapper.get('button[title="Refresh"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain(
      'The last confirmed server group remains visible.',
    );
    expect(wrapper.text()).toContain('group-1');
  });

  it('reloads the current group when the route parameter changes', async () => {
    state.serverStore!.groups.set(1, group(1));
    state.serverStore!.groups.set(2, { ...group(2), name: 'group-2' });
    const wrapper = mountGroup();
    await flushPromises();
    expect(wrapper.text()).toContain('group-1');

    state.route.params.groupId = '2';
    await flushPromises();

    expect(state.serverStore!.loadGroups).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('group-2');
    expect(wrapper.text()).not.toContain('group-1');
  });
});
