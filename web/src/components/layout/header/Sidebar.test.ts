import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import Sidebar from './Sidebar.vue';

const state = vi.hoisted<{
  path: string;
  user: Record<string, unknown> | null;
}>(() => ({
  path: '/overview',
  user: { id: 1, login: 'regular', admin: false },
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({
    get path() {
      return state.path;
    },
  }),
}));

vi.mock('~/compositions/useAuthentication', () => ({
  default: () => ({ user: state.user }),
}));

vi.mock('~/compositions/useConfig', () => ({
  default: () => ({
    enableSwagger: false,
    rootPath: '',
  }),
}));

vi.mock('~/store/repos', () => ({
  useRepoStore: () => ({
    ownedRepos: [],
  }),
}));

const RouterLinkStub = defineComponent({
  props: {
    to: {
      type: [String, Object],
      required: true,
    },
  },
  setup(props, { slots }) {
    return () =>
      h(
        'a',
        {
          'data-to': typeof props.to === 'string' ? props.to : JSON.stringify(props.to),
        },
        slots.default?.(),
      );
  },
});

const IconButtonStub = defineComponent({
  inheritAttrs: false,
  props: {
    title: String,
    icon: String,
  },
  emits: ['click'],
  setup(props, { attrs, emit }) {
    return () =>
      h('button', {
        ...attrs,
        title: props.title,
        'aria-label': props.title,
        onClick: () => emit('click'),
      });
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function mountSidebar(open = false) {
  return mount(Sidebar, {
    props: { open },
    global: {
      plugins: [i18n],
      stubs: {
        RouterLink: RouterLinkStub,
        IconButton: IconButtonStub,
        PrototypeIcon: true,
        WoodpeckerLogo: true,
      },
    },
  });
}

describe('shared sidebar', () => {
  beforeEach(() => {
    state.path = '/overview';
    state.user = { id: 1, login: 'regular', admin: false };
  });

  it('keeps the approved shell dimensions and navigation density', () => {
    const tokens = readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8');
    const source = readFileSync(resolve(process.cwd(), 'src/components/layout/header/Sidebar.vue'), 'utf8');
    const navbarSource = readFileSync(resolve(process.cwd(), 'src/components/layout/header/Navbar.vue'), 'utf8');
    const appSource = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8');

    expect(tokens).toContain('--wp-sidebar-w: 248px');
    expect(tokens).toContain('--wp-topbar-h: 64px');
    expect(source).toMatch(/(?:w-62|width:\s*var\(--wp-sidebar-w\))/);
    expect(source).toContain('text-[17px]');
    expect(source).toContain('min-h-10');
    expect(navbarSource).toMatch(/\.topbar\s*\{[\s\S]*shrink-0/);
    expect(appSource).toContain('class="relative flex min-h-0 flex-1"');
  });

  it('exposes drawer identity and open state', () => {
    const wrapper = mountSidebar(true);

    expect(wrapper.get('aside').attributes('id')).toBe('app-sidebar');
    expect(wrapper.get('aside').classes()).toContain('sidebar-open');
  });

  it('emits close from the mobile drawer control', async () => {
    const wrapper = mountSidebar(true);

    await wrapper.get('[data-drawer-close]').trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('keeps personal navigation for regular users and hides administrator navigation', () => {
    const wrapper = mountSidebar();
    const destinations = wrapper.findAll('[data-to]').map((link) => link.attributes('data-to'));

    expect(destinations).toContain('/user/secrets');
    expect(destinations).not.toContain('/admin/agents');
    expect(destinations).not.toContain('/admin/queue');
    expect(destinations).not.toContain('/admin/users');
    expect(destinations).not.toContain('/admin/forges');
  });

  it('keeps protected application and personal destinations out of the guest sidebar', () => {
    state.user = null;
    const wrapper = mountSidebar();
    const destinations = wrapper.findAll('[data-to]').map((link) => link.attributes('data-to'));

    expect(destinations).toEqual(['{"name":"login"}']);
    expect(wrapper.text()).toContain('Docs');
    expect(wrapper.text()).not.toContain('Overview');
    expect(wrapper.text()).not.toContain('Repositories');
    expect(wrapper.text()).not.toContain('Deployments');
    expect(wrapper.text()).not.toContain('Infrastructure');
    expect(wrapper.text()).not.toContain('Personal settings');
  });

  it('shows administrator navigation only to administrators', () => {
    state.user = { id: 2, login: 'admin', admin: true };
    const wrapper = mountSidebar();
    const destinations = wrapper.findAll('[data-to]').map((link) => link.attributes('data-to'));

    expect(destinations).toContain('/admin/agents');
    expect(destinations).toContain('/admin/queue');
    expect(destinations).toContain('/admin/users');
    expect(destinations).toContain('/admin/forges');
  });
});
