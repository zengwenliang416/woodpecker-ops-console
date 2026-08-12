import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import UserAgents from './UserAgents.vue';

const state = vi.hoisted(() => ({
  enabled: false,
  getOrgAgents: vi.fn(),
  createOrgAgent: vi.fn(),
  updateOrgAgent: vi.fn(),
  deleteOrgAgent: vi.fn(),
}));

vi.mock('~/compositions/useConfig', () => ({ default: () => ({ userRegisteredAgents: state.enabled }) }));
vi.mock('~/compositions/useAuthentication', () => ({
  default: () => ({ user: { id: 7, org_id: 23, login: 'alice' } }),
}));
vi.mock('~/compositions/useApiClient', () => ({ default: () => state }));
vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });
const AgentManagerStub = defineComponent({
  name: 'AgentManager',
  props: ['ownerKey', 'loadAgents'],
  template: '<section data-testid="agent-manager" />',
});

function mountAgents() {
  return mount(UserAgents, {
    global: {
      plugins: [i18n],
      stubs: {
        AgentManager: AgentManagerStub,
        FeedbackState: {
          props: ['kind', 'title', 'description'],
          template: '<section :data-feedback-state="kind">{{ title }} {{ description }}</section>',
        },
      },
    },
  });
}

describe('user Agents', () => {
  it('renders an explicit disabled state without loading Agents', () => {
    state.enabled = false;
    const wrapper = mountAgents();
    expect(wrapper.get('[data-feedback-state="disabled"]').text()).toContain('Personal Agents are disabled');
    expect(state.getOrgAgents).not.toHaveBeenCalled();
  });

  it('binds the shared manager to the authenticated organization', () => {
    state.enabled = true;
    const wrapper = mountAgents();
    const manager = wrapper.getComponent({ name: 'AgentManager' });
    expect(manager.props('ownerKey')).toBe(23);
    const loadAgents = manager.props('loadAgents') as (page: number) => Promise<unknown>;
    void loadAgents(2);
    expect(state.getOrgAgents).toHaveBeenCalledWith(23, { page: 2 });
  });
});
