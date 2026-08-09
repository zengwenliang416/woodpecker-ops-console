import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import App from './App.vue';

const routerMock = vi.hoisted(() => ({
  route: undefined as { path: string; meta: Record<string, unknown> } | undefined,
}));

const apiMock = vi.hoisted(() => ({
  setErrorHandler: vi.fn(),
}));

vi.mock('vue-router', async () => {
  const { reactive } = await import('vue');
  routerMock.route = reactive({ path: '/overview', meta: {} });

  return {
    useRoute: () => routerMock.route,
  };
});

vi.mock('~/compositions/useApiClient', () => ({
  default: () => apiMock,
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({ notify: vi.fn() }),
}));

const SidebarStub = defineComponent({
  name: 'Sidebar',
  props: {
    open: Boolean,
  },
  emits: ['close'],
  setup(props, { emit }) {
    return () =>
      h('aside', { id: 'app-sidebar', tabindex: -1, 'data-testid': 'sidebar', 'data-open': String(props.open) }, [
        h('button', { 'data-drawer-close': '', 'data-testid': 'close-sidebar', onClick: () => emit('close') }),
        h('a', { href: '/overview', 'data-testid': 'last-sidebar-link' }),
      ]);
  },
});

const NavbarStub = defineComponent({
  name: 'Navbar',
  props: {
    sidebarOpen: Boolean,
  },
  emits: ['openSidebar'],
  setup(props, { emit }) {
    return () =>
      h('button', {
        'data-testid': 'open-sidebar',
        'aria-expanded': String(props.sidebarOpen),
        onClick: (event: MouseEvent) => emit('openSidebar', event.currentTarget),
      });
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function mountApp() {
  return mount(App, {
    attachTo: document.body,
    global: {
      plugins: [i18n],
      stubs: {
        Sidebar: SidebarStub,
        Navbar: NavbarStub,
        PipelineFeedSidebar: true,
        RouterView: true,
        Notifications: true,
      },
    },
  });
}

describe('application shell drawer', () => {
  let desktopMatches = false;
  let breakpointListener: ((event: MediaQueryListEvent) => void) | undefined;

  beforeEach(() => {
    routerMock.route!.path = '/overview';
    document.body.style.overflow = '';
    desktopMatches = false;
    breakpointListener = undefined;
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        get matches() {
          return desktopMatches;
        },
        media: '(min-width: 768px)',
        onchange: null,
        addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
          breakpointListener = listener;
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    document.body.style.overflow = '';
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('propagates open state, isolates the background, and moves focus into the drawer', async () => {
    const wrapper = mountApp();
    const trigger = wrapper.get<HTMLButtonElement>('[data-testid="open-sidebar"]');
    trigger.element.focus();

    await trigger.trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="sidebar"]').attributes('data-open')).toBe('true');
    expect(wrapper.get('[data-testid="open-sidebar"]').attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('.app-main').attributes()).toHaveProperty('inert');
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.activeElement).toBe(wrapper.get('[data-testid="close-sidebar"]').element);

    wrapper.unmount();
  });

  it('closes from the real drawer control and restores scrolling and trigger focus', async () => {
    const wrapper = mountApp();
    const trigger = wrapper.get<HTMLButtonElement>('[data-testid="open-sidebar"]');
    trigger.element.focus();
    document.body.style.overflow = 'clip';

    await trigger.trigger('click');
    await wrapper.get('[data-testid="close-sidebar"]').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-testid="sidebar"]').attributes('data-open')).toBe('false');
    expect(wrapper.get('.app-main').attributes()).not.toHaveProperty('inert');
    expect(document.body.style.overflow).toBe('clip');
    expect(document.activeElement).toBe(trigger.element);

    wrapper.unmount();
  });

  it('contains focus and closes on Escape and route changes', async () => {
    const wrapper = mountApp();

    await wrapper.get('[data-testid="open-sidebar"]').trigger('click');
    wrapper.get<HTMLAnchorElement>('[data-testid="last-sidebar-link"]').element.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(wrapper.get('[data-testid="close-sidebar"]').element);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(wrapper.get('[data-testid="sidebar"]').attributes('data-open')).toBe('false');

    await wrapper.get('[data-testid="open-sidebar"]').trigger('click');
    routerMock.route!.path = '/repos';
    await nextTick();

    expect(wrapper.get('[data-testid="sidebar"]').attributes('data-open')).toBe('false');

    wrapper.unmount();
  });

  it('clears mobile drawer side effects when crossing to desktop', async () => {
    const wrapper = mountApp();

    await wrapper.get('[data-testid="open-sidebar"]').trigger('click');
    expect(document.body.style.overflow).toBe('hidden');

    desktopMatches = true;
    breakpointListener?.({ matches: true } as MediaQueryListEvent);
    await nextTick();

    expect(wrapper.get('[data-testid="sidebar"]').attributes('data-open')).toBe('false');
    expect(wrapper.get('.app-main').attributes()).not.toHaveProperty('inert');
    expect(document.body.style.overflow).toBe('');

    wrapper.unmount();
  });

  it('keeps the backdrop above the topbar layer contract', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8');

    expect(source).toMatch(/\.drawer-backdrop\s*\{[\s\S]*z-25/);
  });
});
