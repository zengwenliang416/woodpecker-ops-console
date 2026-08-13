import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Alert, Environment, Server, ServerGroup } from '~/lib/api/types';

import InfrastructureServers from './InfrastructureServers.vue';

const state = vi.hoisted(() => ({
  api: {
    createServer: vi.fn(),
  },
  applications: null as {
    environments: Map<number, Environment>;
    loadEnvironments: ReturnType<typeof vi.fn>;
  } | null,
  servers: null as {
    activeAlerts: Alert[];
    groupList: ServerGroup[];
    loadAlerts: ReturnType<typeof vi.fn>;
    loadGroups: ReturnType<typeof vi.fn>;
    loadServers: ReturnType<typeof vi.fn>;
    serverList: Server[];
    setServer: (server: Server) => void;
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
  useServerStore: () => state.servers,
}));

const ScaffoldStub = defineComponent({
  props: {
    search: String,
  },
  emits: ['update:search'],
  setup(props, { emit, slots }) {
    return () =>
      h('section', [
        h('header', [slots.title?.(), slots.headerActions?.()]),
        h('input', {
          'aria-label': 'Search servers',
          value: props.search,
          onInput: (event: Event) => emit('update:search', (event.target as HTMLInputElement).value),
        }),
        h('main', slots.default?.()),
      ]);
  },
});

const ButtonStub = defineComponent({
  inheritAttrs: false,
  props: {
    disabled: Boolean,
    isLoading: Boolean,
    text: String,
  },
  emits: ['click'],
  setup(props, { attrs, emit }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          disabled: props.disabled || props.isLoading,
          onClick: () => emit('click'),
        },
        props.isLoading ? `loading:${props.text}` : props.text,
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

function server(id: number, overrides: Partial<Server> = {}): Server {
  return {
    id,
    group_id: 1,
    environment_id: 1,
    region: 'us-east',
    private_ip: `10.0.0.${id}`,
    public_ip: `203.0.113.${id}`,
    status: 'online',
    health: 'healthy',
    cpu: 20,
    memory: 30,
    disk: 40,
    load: 1,
    maintenance: false,
    labels: { role: 'api' },
    ...overrides,
    name: overrides.name ?? `server-${id}`,
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

function mountServers() {
  return mount(InfrastructureServers, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        IconButton: true,
        InfrastructureNav: true,
        RouterLink: RouterLinkStub,
        Scaffold: ScaffoldStub,
      },
    },
  });
}

function rowNames(wrapper: ReturnType<typeof mountServers>): string[] {
  return wrapper.findAll('tbody tr').map((row) => row.text());
}

describe('infrastructure servers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    const groups: ServerGroup[] = [
      {
        id: 1,
        environment_id: 1,
        name: 'edge',
        strategy: 'rolling',
        batch_size: 1,
      },
      {
        id: 2,
        environment_id: 1,
        name: 'core',
        strategy: 'rolling',
        batch_size: 1,
      },
    ];
    state.servers = reactive({
      activeAlerts: [],
      groupList: groups,
      loadAlerts: vi.fn().mockResolvedValue(undefined),
      loadGroups: vi.fn().mockResolvedValue(undefined),
      loadServers: vi.fn().mockResolvedValue(undefined),
      serverList: [
        server(1, { name: 'alpha', labels: { role: 'api', tier: 'edge' } }),
        server(2, {
          name: 'bravo',
          group_id: 2,
          health: 'warning',
          labels: { role: 'worker' },
          public_ip: '198.51.100.20',
          region: 'eu-west',
        }),
        server(3, { name: 'charlie', health: 'critical', private_ip: '172.16.0.30', region: 'ap-south' }),
      ],
      setServer(created: Server) {
        const index = this.serverList.findIndex((item) => item.id === created.id);
        if (index === -1) this.serverList.push(created);
        else this.serverList[index] = created;
      },
    });
    state.applications = reactive({
      environments: new Map([
        [
          1,
          {
            id: 1,
            name: 'production',
            title: 'Production',
            protected: false,
            approval_required: false,
            minimum_approvers: 0,
            auto_rollback: false,
          },
        ],
      ]),
      loadEnvironments: vi.fn().mockResolvedValue(undefined),
    });
    state.api.createServer.mockResolvedValue(server(4, { name: 'delta' }));
  });

  it('searches all supported server fields and applies health, group, and region filters', async () => {
    const wrapper = mountServers();
    await flushPromises();

    const search = wrapper.get('input[aria-label="Search servers"]');
    await search.setValue('198.51.100.20');
    expect(rowNames(wrapper)).toEqual([expect.stringContaining('bravo')]);

    await search.setValue('172.16.0.30');
    expect(rowNames(wrapper)).toEqual([expect.stringContaining('charlie')]);

    await search.setValue('tier edge');
    expect(rowNames(wrapper)).toEqual([expect.stringContaining('alpha')]);

    await search.setValue('');
    await wrapper.get('select[aria-label="Server status"]').setValue('warning');
    expect(rowNames(wrapper)).toEqual([expect.stringContaining('bravo')]);
    expect(wrapper.get('tbody .badge').text()).toBe('warning');

    await wrapper.get('select[aria-label="Server status"]').setValue('all');
    await wrapper.get('select[aria-label="Server group"]').setValue('2');
    expect(rowNames(wrapper)).toEqual([expect.stringContaining('bravo')]);

    await wrapper.get('select[aria-label="Server group"]').setValue('all');
    await wrapper.get('select[aria-label="Server region"]').setValue('ap-south');
    expect(rowNames(wrapper)).toEqual([expect.stringContaining('charlie')]);
  });

  it('distinguishes initial loading, list error, empty inventory, and filtered-empty results', async () => {
    const pending = deferred<void>();
    state.servers!.serverList.splice(0);
    state.servers!.loadServers.mockReturnValueOnce(pending.promise);
    const wrapper = mountServers();
    await nextTick();
    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Loading');

    pending.reject(new Error('servers offline'));
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Servers could not be loaded');

    state.servers!.loadServers.mockResolvedValueOnce(undefined);
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No servers found');

    state.servers!.serverList.push(server(1, { name: 'alpha' }));
    const filteredWrapper = mountServers();
    await flushPromises();
    await filteredWrapper.get('input[aria-label="Search servers"]').setValue('missing');
    expect(filteredWrapper.get('.wp-empty-state').text()).toContain('No servers match the current filters');
  });

  it('preserves confirmed rows when a refresh fails', async () => {
    const wrapper = mountServers();
    await flushPromises();
    expect(wrapper.text()).toContain('alpha');

    state.servers!.loadServers.mockRejectedValueOnce(new Error('servers offline'));
    await (wrapper.vm as unknown as { loadServers: (refresh?: boolean) => Promise<void> }).loadServers(true);
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain(
      'The last confirmed server data remains available',
    );
    expect(wrapper.text()).toContain('alpha');
  });

  it('guards registration while pending and keeps the form open with a retryable mutation error', async () => {
    const create = deferred<Server | null>();
    state.api.createServer.mockReturnValueOnce(create.promise);
    const wrapper = mountServers();
    await flushPromises();

    const registerButton = wrapper.findAll('header button').find((button) => button.text() === 'Register server');
    expect(registerButton).toBeDefined();
    await registerButton!.trigger('click');
    await wrapper.get('form input').setValue('delta');
    await wrapper.get('form').trigger('submit');
    await wrapper.get('form').trigger('submit');
    await nextTick();

    expect(state.api.createServer).toHaveBeenCalledTimes(1);
    expect(wrapper.get('form button[type="submit"]').attributes('disabled')).toBeDefined();

    create.reject(new Error('registration offline'));
    await flushPromises();
    expect(wrapper.get('form [data-feedback-state="error"]').text()).toContain('Server registration failed');
    expect(wrapper.find('form').exists()).toBe(true);

    state.api.createServer.mockResolvedValueOnce(server(4, { name: 'delta' }));
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(state.api.createServer).toHaveBeenCalledTimes(2);
    expect(wrapper.find('form').exists()).toBe(false);
    expect(state.servers!.loadServers).toHaveBeenCalledTimes(2);
  });
});
