import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import AdminInfo from './AdminInfo.vue';

const state = vi.hoisted(() => ({
  version: {
    current: '3.9.0',
    currentShort: '3.9.0',
    latest: '3.10.0',
    needsUpdate: true,
    usesNext: false,
  },
}));

vi.mock('~/compositions/useVersion', async () => {
  const { ref } = await import('vue');
  return {
    useVersion: () => ref(state.version),
  };
});

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

describe('administration overview', () => {
  it('shows truthful version data and links to existing administration destinations', () => {
    const wrapper = mount(AdminInfo, {
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

    expect(wrapper.text()).toContain('3.9.0');
    expect(wrapper.text()).toContain('3.10.0');
    expect(wrapper.text()).toContain('Repositories');
    expect(wrapper.text()).toContain('Users');
    expect(wrapper.text()).toContain('Organizations');
    expect(wrapper.text()).toContain('Agents');
    expect(wrapper.text()).toContain('Queue');
    expect(wrapper.text()).toContain('Forges');
    expect(wrapper.text()).not.toContain('%');
    expect(wrapper.findAll('[data-testid="admin-overview-link"]')).toHaveLength(6);
  });
});
