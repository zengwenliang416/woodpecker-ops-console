import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Org } from '~/lib/api/types';

import OrgAgents from './OrgAgents.vue';

const state = vi.hoisted(() => ({
  userRegisteredAgents: false,
  getOrgAgents: vi.fn(),
}));

vi.mock('~/compositions/useConfig', () => ({
  default: () => ({ userRegisteredAgents: state.userRegisteredAgents }),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getOrgAgents: state.getOrgAgents,
    createOrgAgent: vi.fn(),
    updateOrgAgent: vi.fn(),
    deleteOrgAgent: vi.fn(),
  }),
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

describe('organization agents', () => {
  it('renders an explicit disabled state without loading Agents', () => {
    const wrapper = mount(OrgAgents, {
      props: { orgId: '17' },
      global: {
        plugins: [i18n],
        provide: {
          org: ref({ id: 17, name: 'acme', is_user: false } as Org),
          'org-lifecycle': ref(1),
        },
        stubs: {
          AgentManager: true,
          FeedbackState: {
            props: ['kind', 'title', 'description'],
            template: '<section :data-feedback-state="kind">{{ title }} {{ description }}</section>',
          },
        },
      },
    });

    expect(wrapper.get('[data-feedback-state="disabled"]').text()).toContain('Organization Agents are disabled');
    expect(state.getOrgAgents).not.toHaveBeenCalled();
  });
});
