import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Repo, RepoPermissions } from '~/lib/api/types';

import RepoSettings from './RepoSettings.vue';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({
      replace: mocks.replace,
    }),
  };
});

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: mocks.notify,
  }),
}));

vi.mock('~/compositions/useRouteBack', () => ({
  useRouteBack: () => vi.fn(),
}));

const ScaffoldStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', [h('header', slots.title?.()), slots.default?.()]);
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function mountSettings(admin: boolean) {
  const repository = ref({
    id: 101,
    org_id: 1,
    owner: 'acme',
    name: 'backend',
    full_name: 'acme/backend',
  } as Repo);
  const permissions = ref({
    pull: true,
    push: true,
    admin,
    synced: 0,
  } as RepoPermissions);
  const wrapper = mount(RepoSettings, {
    global: {
      plugins: [i18n],
      provide: {
        repo: repository,
        'repo-permissions': permissions,
      },
      stubs: {
        RepoSettingsNav: { template: '<nav data-testid="settings-nav" />' },
        RouterLink: { template: '<a><slot /></a>' },
        RouterView: { template: '<main data-testid="settings-view" />' },
        Scaffold: ScaffoldStub,
      },
    },
  });
  return { permissions, repository, wrapper };
}

describe('repository settings wrapper', () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.notify.mockReset();
  });

  it('keeps direct repository settings behind the existing admin gate', async () => {
    mountSettings(false);
    await flushPromises();

    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'error',
      title: 'You are not allowed to access the settings of this repository',
    });
    expect(mocks.replace).toHaveBeenCalledWith({ name: 'home' });
  });

  it('renders repository navigation and nested content for administrators', async () => {
    const { wrapper } = mountSettings(true);
    await flushPromises();

    expect(mocks.replace).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="settings-nav"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="settings-view"]').exists()).toBe(true);
  });

  it('re-runs the admin gate when a reused route receives new repository permissions', async () => {
    const { permissions, repository, wrapper } = mountSettings(true);
    await flushPromises();

    repository.value = {
      ...repository.value,
      id: 202,
      name: 'frontend',
      full_name: 'acme/frontend',
    };
    await nextTick();
    expect(wrapper.find('[data-testid="settings-nav"]').exists()).toBe(false);

    permissions.value = {
      ...permissions.value,
      admin: false,
    };
    await flushPromises();

    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'error',
      title: 'You are not allowed to access the settings of this repository',
    });
    expect(mocks.replace).toHaveBeenCalledWith({ name: 'home' });
    expect(wrapper.find('[data-testid="settings-nav"]').exists()).toBe(false);
  });
});
