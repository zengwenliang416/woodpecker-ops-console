import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import UserWrapper from './UserWrapper.vue';

const state = vi.hoisted(() => ({ userRegisteredAgents: true }));

vi.mock('~/compositions/useConfig', () => ({
  default: () => ({ rootPath: '/woodpecker', userRegisteredAgents: state.userRegisteredAgents }),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

describe('user settings wrapper', () => {
  it('renders the responsive personal hierarchy and root-aware logout', () => {
    const wrapper = mount(UserWrapper, {
      global: {
        plugins: [i18n],
        stubs: {
          Button: {
            props: ['text', 'to'],
            template: '<a data-testid="logout" :href="to">{{ text }}</a>',
          },
          UserSettingsNav: {
            props: ['showAgents'],
            template: '<nav data-testid="user-settings-nav" :data-agents="showAgents" />',
          },
          RouterView: { template: '<div data-testid="user-settings-view" />' },
          Scaffold: { template: '<main><slot name="title" /><slot name="headerActions" /><slot /></main>' },
        },
      },
    });

    expect(wrapper.get('[data-testid="user-settings-nav"]').attributes('data-agents')).toBe('true');
    expect(wrapper.find('.user-settings-layout').exists()).toBe(true);
    expect(wrapper.find('.user-settings-content').exists()).toBe(true);
    expect(wrapper.get('[data-testid="user-settings-view"]')).toBeTruthy();
    expect(wrapper.get('[data-testid="logout"]').attributes('href')).toBe('http://localhost:3000/woodpecker/logout');
  });
});
