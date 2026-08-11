import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';

import en from '~/assets/locales/en.json';

import RepoSettingsNav from './RepoSettingsNav.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

const routeNames = [
  'repo-settings',
  'repo-settings-secrets',
  'repo-settings-registries',
  'repo-settings-crons',
  'repo-settings-badge',
  'repo-settings-extensions',
  'repo-settings-actions',
];

describe('repository settings navigation', () => {
  it('links every existing child route and marks the active destination', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: routeNames.map((name, index) => ({
        path: index === 0 ? '/settings' : `/settings/${index}`,
        name,
        component: { template: '<div />' },
      })),
    });
    await router.push({ name: 'repo-settings-crons' });
    await router.isReady();

    const wrapper = mount(RepoSettingsNav, {
      global: {
        plugins: [i18n, router],
        stubs: {
          PrototypeIcon: true,
        },
      },
    });

    expect(wrapper.findAll('a')).toHaveLength(7);
    expect(
      wrapper.findAll('a').map((link) => {
        const to = link.attributes('href');
        return to;
      }),
    ).toEqual(['/settings', '/settings/1', '/settings/2', '/settings/3', '/settings/4', '/settings/5', '/settings/6']);
    expect(wrapper.findAll('a')[3].classes()).toContain('repo-settings-nav-item-active');
  });
});
