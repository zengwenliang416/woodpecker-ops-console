import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import UserGeneral from './UserGeneral.vue';

const state = vi.hoisted(() => ({
  theme: 'auto',
  collapse: false,
  setUserConfig: vi.fn(),
}));

vi.mock('~/compositions/useAuthentication', () => ({
  default: () => ({
    user: {
      id: 7,
      forge_id: 3,
      login: 'alice',
      email: 'alice@example.test',
      avatar_url: '',
      org_id: 23,
    },
  }),
}));
vi.mock('~/compositions/useTheme', async () => {
  const { ref } = await import('vue');
  return { useTheme: () => ({ storeTheme: ref(state.theme) }) };
});
vi.mock('~/compositions/useUserConfig', async () => {
  const { ref } = await import('vue');
  return {
    default: () => ({
      userConfig: ref({ collapseLogGroupsByDefault: state.collapse }),
      setUserConfig: state.setUserConfig,
    }),
  };
});
vi.mock('~/compositions/useI18n', () => ({ setI18nLanguage: vi.fn() }));
vi.mock('~/compositions/useWPTitle', () => ({ useWPTitle: vi.fn() }));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

describe('user account preferences', () => {
  it('renders real identity fields as read-only presentation and existing preferences only', () => {
    const wrapper = mount(UserGeneral, {
      global: {
        plugins: [i18n],
        stubs: {
          SelectField: { props: ['modelValue'], template: '<select />' },
          Checkbox: { props: ['modelValue', 'label'], template: '<label>{{ label }}</label>' },
        },
      },
    });

    expect(wrapper.text()).toContain('alice');
    expect(wrapper.text()).toContain('alice@example.test');
    expect(wrapper.text()).toContain('Forge ID');
    expect(wrapper.text()).toContain('Language');
    expect(wrapper.text()).toContain('Theme');
    expect(wrapper.text()).toContain('Pipeline logs');
    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.find('input[type="email"]').exists()).toBe(false);
  });
});
