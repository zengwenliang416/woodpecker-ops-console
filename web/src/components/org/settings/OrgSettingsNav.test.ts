import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import OrgSettingsNav from './OrgSettingsNav.vue';

const route = vi.hoisted(() => ({
  name: 'org-settings-secrets',
  params: { orgId: '17' },
}));

vi.mock('vue-router', () => ({
  useRoute: () => route,
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

describe('organization settings navigation', () => {
  it('renders active organization destinations and hides disabled Agents', () => {
    const wrapper = mount(OrgSettingsNav, {
      props: { showAgents: false },
      global: {
        plugins: [i18n],
        stubs: {
          PrototypeIcon: true,
          RouterLink: {
            props: ['to'],
            template: '<a :data-to="JSON.stringify(to)"><slot /></a>',
          },
        },
      },
    });

    expect(wrapper.findAll('a')).toHaveLength(2);
    expect(wrapper.text()).toContain('Secrets');
    expect(wrapper.text()).toContain('Registries');
    expect(wrapper.text()).not.toContain('Agents');
    expect(wrapper.get('.org-settings-nav-item-active').text()).toContain('Secrets');
    expect(wrapper.get('a').attributes('data-to')).toContain('"orgId":"17"');
  });
});
