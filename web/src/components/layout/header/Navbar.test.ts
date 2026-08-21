import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import zhHans from '~/assets/locales/zh-Hans.json';

import Navbar from './Navbar.vue';

const state = vi.hoisted<{
  user: Record<string, unknown> | null;
  notify: ReturnType<typeof vi.fn>;
  setUserConfig: ReturnType<typeof vi.fn>;
  setI18nLanguage: ReturnType<typeof vi.fn>;
  theme?: { value: string };
  storeTheme?: { value: string };
}>(() => ({
  user: { id: 1, login: 'regular', admin: false },
  notify: vi.fn(),
  setUserConfig: vi.fn(),
  setI18nLanguage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('~/compositions/useAuthentication', () => ({
  default: () => ({ user: state.user }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({ notify: state.notify }),
}));

vi.mock('~/compositions/useTheme', async () => {
  const { ref } = await import('vue');
  state.theme = ref('dark');
  state.storeTheme = ref('dark');

  return {
    useTheme: () => ({
      theme: state.theme,
      storeTheme: state.storeTheme,
    }),
  };
});

vi.mock('~/compositions/useUserConfig', () => ({
  default: () => ({ setUserConfig: state.setUserConfig }),
}));

vi.mock('~/compositions/useI18n', () => ({
  setI18nLanguage: state.setI18nLanguage,
}));

vi.mock('~/compositions/useVersion', () => ({
  useVersion: () => ({ value: undefined }),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/overview' }),
}));

const IconButtonStub = defineComponent({
  inheritAttrs: false,
  props: {
    title: String,
    icon: String,
    to: [String, Object],
  },
  emits: ['click'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          title: props.title,
          'aria-label': props.title,
          'data-to': props.to !== undefined ? JSON.stringify(props.to) : undefined,
          onClick: (event: MouseEvent) => emit('click', event),
        },
        slots.default?.(),
      );
  },
});

const ButtonStub = defineComponent({
  props: {
    text: String,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { onClick: () => emit('click') }, props.text);
  },
});

function mountNavbar(locale: 'en' | 'zh-Hans' = 'en', sidebarOpen = false) {
  const i18n = createI18n({
    legacy: false,
    locale,
    messages: {
      en,
      'zh-Hans': zhHans,
    },
  });

  return mount(Navbar, {
    props: { sidebarOpen },
    global: {
      plugins: [i18n],
      stubs: {
        IconButton: IconButtonStub,
        Button: ButtonStub,
        ActivePipelines: true,
        PrototypeIcon: true,
      },
    },
  });
}

describe('shared topbar', () => {
  beforeEach(() => {
    state.user = { id: 1, login: 'regular', admin: false };
    state.notify.mockReset();
    state.setUserConfig.mockReset();
    state.setI18nLanguage.mockReset();
    state.setI18nLanguage.mockResolvedValue(undefined);
    localStorage.removeItem('woodpecker:locale');
    state.theme!.value = 'dark';
    state.storeTheme!.value = 'dark';
  });

  it('connects the mobile menu to the sidebar state', async () => {
    const wrapper = mountNavbar('en', true);
    const menu = wrapper.get('[aria-controls="app-sidebar"]');

    expect(menu.attributes('aria-expanded')).toBe('true');
    await menu.trigger('click');
    expect(wrapper.emitted('openSidebar')).toHaveLength(1);
    expect(wrapper.emitted('openSidebar')?.[0]?.[0]).toBe(menu.element);
  });

  it('toggles the stored light and dark preference', async () => {
    const wrapper = mountNavbar();

    await wrapper.get('[title="Toggle theme"]').trigger('click');
    expect(state.storeTheme!.value).toBe('light');

    state.theme!.value = 'light';
    await nextTick();
    await wrapper.get('[title="Toggle theme"]').trigger('click');
    expect(state.storeTheme!.value).toBe('dark');
  });

  it('switches and persists the global locale from the topbar', async () => {
    const wrapper = mountNavbar('en');
    const localeSelect = wrapper.get('select[aria-label="Language"]');

    await localeSelect.setValue('zh-Hans');
    await nextTick();

    expect(state.setI18nLanguage).toHaveBeenCalledWith('zh-Hans');
    expect(localStorage.getItem('woodpecker:locale')).toBe('zh-Hans');
  });

  it('uses localized placeholder and unavailable feedback in English', async () => {
    const wrapper = mountNavbar('en');

    expect(wrapper.get('.global-search').text()).toContain('Search pipelines, repos, users and settings…');
    await wrapper.get('.global-search').trigger('click');

    expect(state.notify).toHaveBeenCalledWith({
      title: 'Search unavailable',
      text: 'Global search is not available in this build.',
      type: 'info',
    });
  });

  it('uses localized placeholder and unavailable feedback in Simplified Chinese', async () => {
    const wrapper = mountNavbar('zh-Hans');

    expect(wrapper.get('.global-search').text()).toContain('搜索流水线、仓库、用户和设置…');
    await wrapper.get('.global-search').trigger('click');

    expect(state.notify).toHaveBeenCalledWith({
      title: '全局搜索暂不可用',
      text: '当前版本尚未提供全局搜索。',
      type: 'info',
    });
  });

  it('keeps administrator settings out of the regular-user topbar', () => {
    const regular = mountNavbar();

    expect(
      regular.findAll('[data-to]').some((button) => button.attributes('data-to')?.includes('admin-settings')),
    ).toBe(false);

    state.user = { id: 2, login: 'admin', admin: true };
    const admin = mountNavbar();

    expect(admin.findAll('[data-to]').some((button) => button.attributes('data-to')?.includes('admin-settings'))).toBe(
      true,
    );
  });
});
