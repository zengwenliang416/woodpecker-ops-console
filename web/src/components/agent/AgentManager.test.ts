import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import type { Ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Agent } from '~/lib/api/types';

import AgentManager from './AgentManager.vue';

const pagination = vi.hoisted(() => ({
  data: undefined as Ref<Agent[]> | undefined,
  loading: undefined as Ref<boolean> | undefined,
  loadData: undefined as ((page: number) => Promise<Agent[] | null>) | undefined,
  resetPage: vi.fn(),
}));

const notify = vi.hoisted(() => vi.fn());

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({ notify }),
}));

vi.mock('~/compositions/usePaginate', async () => {
  const { ref: vueRef } = await import('vue');
  pagination.data = vueRef<Agent[]>([]);
  pagination.loading = vueRef(false);
  return {
    usePagination: (loadData: (page: number) => Promise<Agent[] | null>) => {
      pagination.loadData = loadData;
      return {
        data: pagination.data,
        loading: pagination.loading,
        resetPage: pagination.resetPage,
      };
    },
  };
});

const AgentFormStub = defineComponent({
  emits: ['save'],
  setup(_, { emit }) {
    return () => h('button', { 'data-testid': 'agent-save', onClick: () => emit('save') }, 'Save');
  },
});

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

function mountManager(overrides: Partial<InstanceType<typeof AgentManager>['$props']> = {}, lifecycle = { value: 1 }) {
  return mount(AgentManager, {
    props: {
      description: 'Organization Agents',
      ownerKey: 1,
      ownerLifecycle: () => lifecycle.value,
      loadAgents: vi.fn().mockResolvedValue([]),
      createAgent: vi.fn(),
      updateAgent: vi.fn(),
      deleteAgent: vi.fn(),
      ...overrides,
    },
    global: {
      plugins: [i18n],
      stubs: {
        AgentForm: AgentFormStub,
        AgentList: defineComponent({
          props: ['agents'],
          emits: ['edit', 'delete'],
          setup(props, { emit }) {
            return () =>
              h('div', [
                ...(props.agents as Agent[]).map((agent) =>
                  h('div', { 'data-testid': `agent-${agent.id}` }, [
                    agent.name,
                    h(
                      'button',
                      { 'data-testid': `agent-edit-${agent.id}`, onClick: () => emit('edit', agent) },
                      'Edit',
                    ),
                    h(
                      'button',
                      { 'data-testid': `agent-delete-${agent.id}`, onClick: () => emit('delete', agent) },
                      'Delete',
                    ),
                  ]),
                ),
              ]);
          },
        }),
      },
    },
  });
}

describe('agent manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    pagination.data!.value = [];
    pagination.loading!.value = false;
    pagination.resetPage.mockImplementation(async () => {
      pagination.data!.value = (await pagination.loadData?.(1)) ?? [];
    });
  });

  it('renders and retries an active load error', async () => {
    const loadAgents = vi.fn().mockRejectedValueOnce(new Error('agents offline')).mockResolvedValueOnce([]);
    const wrapper = mountManager({ loadAgents });

    await pagination.loadData?.(1);
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('agents offline');

    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(loadAgents).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[data-feedback-state="error"]').exists()).toBe(false);
  });

  it('uses caller-owned copy for shared Agent states', async () => {
    const wrapper = mountManager({ description: 'Agents owned by this surface' });

    pagination.loading!.value = true;
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Agents owned by this surface');

    pagination.loading!.value = false;
    pagination.data!.value = [{ id: 7, name: 'agent-7' } as Agent];
    await flushPromises();
    expect(wrapper.text()).toContain('Agents owned by this surface');
    expect(wrapper.text()).not.toContain('organization-owned');

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add agent')!
      .trigger('click');
    expect(wrapper.text()).toContain('Agents owned by this surface');
    expect(wrapper.text()).not.toContain('organization-owned');
  });

  it('uses a scope-neutral fallback for non-Error load failures', async () => {
    const wrapper = mountManager({ loadAgents: vi.fn().mockRejectedValue('offline') });

    await pagination.loadData?.(1);
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('The Agent request failed.');
    expect(wrapper.text()).not.toContain('organization Agent request');
  });

  it('does not publish a create completion owned by an obsolete owner', async () => {
    const creation = deferred<Agent>();
    const createAgent = vi.fn().mockReturnValue(creation.promise);
    const lifecycle = { value: 1 };
    const wrapper = mountManager({ createAgent }, lifecycle);

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add agent')!
      .trigger('click');
    await wrapper.get('[data-testid="agent-save"]').trigger('click');
    lifecycle.value = 2;
    await wrapper.setProps({ ownerKey: 2 });
    creation.resolve({ id: 9, name: 'agent-9' } as Agent);
    await flushPromises();

    expect(createAgent).toHaveBeenCalledWith(expect.objectContaining({ name: '' }));
    expect(notify).not.toHaveBeenCalled();
  });

  it('rejects obsolete create, update, and delete completions across A to B to A', async () => {
    const creation = deferred<Agent>();
    const update = deferred<void>();
    const deletion = deferred<void>();
    const createAgent = vi.fn().mockReturnValue(creation.promise);
    const updateAgent = vi.fn().mockReturnValue(update.promise);
    const deleteAgent = vi.fn().mockReturnValue(deletion.promise);
    const lifecycle = { value: 1 };
    const wrapper = mountManager({ createAgent, updateAgent, deleteAgent }, lifecycle);

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add agent')!
      .trigger('click');
    await wrapper.get('[data-testid="agent-save"]').trigger('click');
    lifecycle.value = 2;
    await wrapper.setProps({ ownerKey: 2 });
    lifecycle.value = 3;
    await wrapper.setProps({ ownerKey: 1 });
    creation.resolve({ id: 9, name: 'obsolete-created' } as Agent);
    await flushPromises();
    expect(notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).toHaveBeenCalledTimes(2);

    pagination.data!.value = [{ id: 7, name: 'agent-7' } as Agent];
    await flushPromises();
    await wrapper.get('[data-testid="agent-edit-7"]').trigger('click');
    await wrapper.get('[data-testid="agent-save"]').trigger('click');
    lifecycle.value = 4;
    await wrapper.setProps({ ownerKey: 2 });
    lifecycle.value = 5;
    await wrapper.setProps({ ownerKey: 1 });
    update.resolve();
    await flushPromises();
    expect(notify).not.toHaveBeenCalled();

    pagination.data!.value = [{ id: 8, name: 'agent-8' } as Agent];
    await flushPromises();
    await wrapper.get('[data-testid="agent-delete-8"]').trigger('click');
    lifecycle.value = 6;
    await wrapper.setProps({ ownerKey: 2 });
    lifecycle.value = 7;
    await wrapper.setProps({ ownerKey: 1 });
    deletion.resolve();
    await flushPromises();
    expect(notify).not.toHaveBeenCalled();
  });

  it('keeps an unmounted owner mutation completion inert', async () => {
    const creation = deferred<Agent>();
    const createAgent = vi.fn().mockReturnValue(creation.promise);
    const lifecycle = { value: 1 };
    const wrapper = mountManager({ createAgent }, lifecycle);

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add agent')!
      .trigger('click');
    await wrapper.get('[data-testid="agent-save"]').trigger('click');
    const resetCalls = pagination.resetPage.mock.calls.length;
    wrapper.unmount();
    lifecycle.value = 2;
    creation.resolve({ id: 9, name: 'obsolete-created' } as Agent);
    await flushPromises();

    expect(notify).not.toHaveBeenCalled();
    expect(pagination.resetPage).toHaveBeenCalledTimes(resetCalls);
  });

  it('keeps confirmed rows and the editor when active mutations fail', async () => {
    pagination.data!.value = [{ id: 7, name: 'confirmed-agent' } as Agent];
    const updateAgent = vi.fn().mockRejectedValue(new Error('agent save failed'));
    const deleteAgent = vi.fn().mockRejectedValue(new Error('agent delete failed'));
    const wrapper = mountManager({ updateAgent, deleteAgent });
    await flushPromises();

    await wrapper.get('[data-testid="agent-edit-7"]').trigger('click');
    await wrapper.get('[data-testid="agent-save"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="agent-save"]').exists()).toBe(true);
    expect(notify).toHaveBeenCalledWith({ title: 'agent save failed', type: 'error' });

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Show agents')!
      .trigger('click');
    await wrapper.get('[data-testid="agent-delete-7"]').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('confirmed-agent');
    expect(notify).toHaveBeenCalledWith({ title: 'agent delete failed', type: 'error' });
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('keeps the create editor open when an active create fails', async () => {
    const createAgent = vi.fn().mockRejectedValue(new Error('agent create failed'));
    const wrapper = mountManager({ createAgent });

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Add agent')!
      .trigger('click');
    await wrapper.get('[data-testid="agent-save"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="agent-save"]').exists()).toBe(true);
    expect(notify).toHaveBeenCalledWith({ title: 'agent create failed', type: 'error' });
    expect(pagination.resetPage).not.toHaveBeenCalled();
  });

  it('preserves confirmed rows when a pagination refresh rejects', async () => {
    pagination.data!.value = [{ id: 7, name: 'confirmed-agent' } as Agent];
    const loadAgents = vi.fn().mockRejectedValue(new Error('refresh failed'));
    const wrapper = mountManager({ loadAgents });
    await flushPromises();

    await pagination.loadData?.(2);
    await flushPromises();

    expect(wrapper.text()).toContain('confirmed-agent');
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('refresh failed');
  });
});
