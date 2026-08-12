import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import AdminSettingsWrapper from './AdminSettingsWrapper.vue';

const state = vi.hoisted(() => ({
  replace: vi.fn(),
  notify: vi.fn(),
  user: { id: 1, login: 'admin', admin: true },
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: state.replace }),
}));

vi.mock('~/compositions/useAuthentication', () => ({
  default: () => ({ user: state.user }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({ notify: state.notify }),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function mountWrapper() {
  return mount(AdminSettingsWrapper, {
    global: {
      plugins: [i18n],
      stubs: {
        AdminSettingsNav: { template: '<nav data-testid="admin-settings-nav" />' },
        RouterView: { template: '<div data-testid="admin-settings-view" />' },
        Scaffold: {
          template: '<main><slot name="title" /><slot /></main>',
        },
      },
    },
  });
}

describe('administration settings wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.user = { id: 1, login: 'admin', admin: true };
  });

  it('renders the responsive administration hierarchy for administrators', async () => {
    const wrapper = mountWrapper();
    await flushPromises();

    expect(wrapper.find('[data-testid="admin-settings-nav"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-settings-view"]').exists()).toBe(true);
    expect(wrapper.find('.admin-settings-layout').exists()).toBe(true);
    expect(wrapper.find('.admin-settings-content').exists()).toBe(true);
    expect(state.replace).not.toHaveBeenCalled();
  });

  it('notifies and redirects non-administrators without rendering route content', async () => {
    state.user = { id: 2, login: 'member', admin: false };
    const wrapper = mountWrapper();
    await flushPromises();

    expect(state.notify).toHaveBeenCalledWith({
      type: 'error',
      title: 'You are not allowed to access server settings',
    });
    expect(state.replace).toHaveBeenCalledWith({ name: 'home' });
    expect(wrapper.find('[data-testid="admin-settings-view"]').exists()).toBe(false);
  });
});
