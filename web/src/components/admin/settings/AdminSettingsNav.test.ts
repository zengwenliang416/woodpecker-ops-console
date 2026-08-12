import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import AdminSettingsNav from './AdminSettingsNav.vue';

const route = vi.hoisted(() => ({
  name: 'admin-settings-forge',
}));

vi.mock('vue-router', () => ({
  useRoute: () => route,
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

describe('administration settings navigation', () => {
  it('renders all nine destinations and groups Forge child routes under Forges', () => {
    const wrapper = mount(AdminSettingsNav, {
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

    expect(wrapper.findAll('a')).toHaveLength(9);
    expect(wrapper.text()).toContain('Info');
    expect(wrapper.text()).toContain('Secrets');
    expect(wrapper.text()).toContain('Registries');
    expect(wrapper.text()).toContain('Repositories');
    expect(wrapper.text()).toContain('Users');
    expect(wrapper.text()).toContain('Organizations');
    expect(wrapper.text()).toContain('Agents');
    expect(wrapper.text()).toContain('Queue');
    expect(wrapper.text()).toContain('Forges');
    expect(wrapper.get('.admin-settings-nav-item-active').attributes('data-to')).toContain('"admin-settings-forges"');
  });
});
