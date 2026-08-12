import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import AdminAgents from './AdminAgents.vue';

const api = vi.hoisted(() => ({
  getAgents: vi.fn(),
  createAgent: vi.fn(),
  updateAgent: vi.fn(),
  deleteAgent: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => api,
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const AgentManagerStub = defineComponent({
  name: 'AgentManager',
  props: ['description', 'loadAgents', 'createAgent', 'updateAgent', 'deleteAgent', 'isAdmin', 'ownerKey'],
  template: '<section data-testid="agent-manager" />',
});

describe('administration Agents', () => {
  it('connects the shared Agent manager to global endpoints with a stable administration owner', () => {
    const wrapper = mount(AdminAgents, {
      global: {
        plugins: [i18n],
        stubs: {
          AgentManager: AgentManagerStub,
        },
      },
    });

    const manager = wrapper.getComponent({ name: 'AgentManager' });
    expect(manager.props('ownerKey')).toBe('admin');
    expect(manager.props('isAdmin')).toBe(true);

    const loadAgents = manager.props('loadAgents') as (page: number) => Promise<unknown>;
    void loadAgents(2);
    expect(api.getAgents).toHaveBeenCalledWith({ page: 2 });
  });
});
