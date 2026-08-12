import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import UserSettingsNav from './UserSettingsNav.vue';

const route = vi.hoisted(() => ({ name: 'user-cli-and-api' }));

vi.mock('vue-router', () => ({ useRoute: () => route }));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function mountNav(showAgents: boolean) {
  return mount(UserSettingsNav, {
    props: { showAgents },
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
}

describe('user settings navigation', () => {
  it('renders current destinations and marks the active route', () => {
    const wrapper = mountNav(true);
    expect(wrapper.findAll('a')).toHaveLength(5);
    expect(wrapper.text()).toContain('Account');
    expect(wrapper.text()).toContain('Secrets');
    expect(wrapper.text()).toContain('Registries');
    expect(wrapper.text()).toContain('CLI & API');
    expect(wrapper.text()).toContain('Agents');
    expect(wrapper.get('.user-settings-nav-item-active').attributes('data-to')).toContain('"user-cli-and-api"');
  });

  it('hides the Agent destination when user registration is disabled', () => {
    const wrapper = mountNav(false);
    expect(wrapper.findAll('a')).toHaveLength(4);
    expect(wrapper.text()).not.toContain('Agents');
  });
});
