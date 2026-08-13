import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Environment, Server, ServerGroup } from '~/lib/api/types';

import InfrastructureGroups from './InfrastructureGroups.vue';

const state = vi.hoisted(() => ({
  appStore: null as {
    environments: Map<number, Environment>;
    loadEnvironments: ReturnType<typeof vi.fn>;
  } | null,
  serverStore: null as {
    activeAlerts: unknown[];
    groupList: ServerGroup[];
    loadAlerts: ReturnType<typeof vi.fn>;
    loadGroups: ReturnType<typeof vi.fn>;
    loadServers: ReturnType<typeof vi.fn>;
    serverList: Server[];
  } | null,
}));

vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));
vi.mock('~/store/ops', () => ({
  useApplicationStore: () => state.appStore,
  useServerStore: () => state.serverStore,
}));

const messages = structuredClone(en);
Object.assign(messages.ops.groups, {
  all_environments: 'All environments',
  all_strategies: 'All strategies',
  empty: 'No server groups yet',
  error_description: 'Server groups could not be loaded.',
  error_title: 'Unable to load server groups',
  filtered_empty: 'No matching server groups',
  health_check: 'Health check',
  loading_description: 'Fetching current server groups.',
  loading_title: 'Loading server groups',
  refresh_error_description: 'The last confirmed server groups remain visible.',
  refresh_error_title: 'Refresh failed',
  refresh: 'Refresh',
  retry: 'Retry',
  search_placeholder: 'Search groups…',
});

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en: messages } });

const ScaffoldStub = defineComponent({
  setup(_, { slots }) {
    return () => h('section', [h('header', [slots.title?.(), slots.headerActions?.()]), slots.default?.()]);
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

function group(id: number, overrides: Partial<ServerGroup> = {}): ServerGroup {
  return {
    id,
    environment_id: 1,
    name: `group-${id}`,
    description: `description-${id}`,
    strategy: 'rolling',
    batch_size: 2,
    health_path: '/healthz',
    port: 8080,
    ...overrides,
  };
}

function server(id: number, groupId: number): Server {
  return {
    id,
    group_id: groupId,
    environment_id: 1,
    name: `server-${id}`,
    status: 'online',
    health: 'healthy',
    cpu: 10,
    memory: 20,
    disk: 30,
    load: 1,
    maintenance: false,
  };
}

function mountGroups() {
  return mount(InfrastructureGroups, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        IconButton: true,
        InfrastructureNav: true,
        RouterLink: {
          props: ['to'],
          template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
        },
        Scaffold: ScaffoldStub,
      },
    },
  });
}

describe('infrastructure groups', () => {
  beforeEach(() => {
    state.serverStore = reactive({
      activeAlerts: [],
      groupList: [] as ServerGroup[],
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

  it('shows initial loading, an active failure, and retries explicitly', async () => {
    const initial = deferred<void>();
    state.serverStore!.loadGroups.mockReturnValueOnce(initial.promise).mockImplementationOnce(() => {
      state.serverStore!.groupList.push(group(1));
    });
    const wrapper = mountGroups();

    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Loading server groups');

    initial.reject(new Error('groups offline'));
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Unable to load server groups');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('group-1');
  });

  it('renders current group fields and preserves confirmed rows when refresh fails', async () => {
    state.serverStore!.groupList.push(group(1));
    state.serverStore!.serverList.push(server(1, 1), server(2, 1));
    const wrapper = mountGroups();
    await flushPromises();

    const row = wrapper.get('tbody tr');
    expect(row.text()).toContain('group-1');
    expect(row.text()).toContain('description-1');
    expect(row.text()).toContain('Production');
    expect(row.text()).toContain('rolling');
    expect(row.text()).toContain('2');
    expect(row.text()).toContain(':8080/healthz');

    state.serverStore!.loadGroups.mockRejectedValueOnce(new Error('refresh offline'));
    await wrapper.get('button[title="Refresh"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain(
      'The last confirmed server groups remain visible.',
    );
    expect(wrapper.text()).toContain('group-1');
  });

  it('distinguishes confirmed empty data from filters with no matches', async () => {
    const emptyWrapper = mountGroups();
    await flushPromises();
    expect(emptyWrapper.get('[data-feedback-state="empty"]').text()).toContain('No server groups yet');

    state.serverStore!.groupList.push(group(1));
    const filteredWrapper = mountGroups();
    await flushPromises();
    await filteredWrapper.get('input[placeholder="Search groups…"]').setValue('missing');
    expect(filteredWrapper.get('[data-feedback-state="empty"]').text()).toContain('No matching server groups');
  });
});
