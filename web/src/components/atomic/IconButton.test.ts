import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import IconButton from './IconButton.vue';

const RouterLinkStub = defineComponent({
  props: {
    to: {
      type: [String, Object],
      required: true,
    },
  },
  setup(props, { slots }) {
    return () => h('a', { 'data-to': JSON.stringify(props.to) }, slots.default?.());
  },
});

function mountIconButton(props: Record<string, unknown>) {
  return mount(IconButton, {
    props,
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        PrototypeIcon: true,
      },
    },
  });
}

describe('icon button', () => {
  it('blocks navigation and repeated interaction while loading', async () => {
    const wrapper = mountIconButton({ icon: 'refresh', title: 'Refresh', to: '/next', isLoading: true });

    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.find('[data-to]').exists()).toBe(false);

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('keeps an enabled route icon navigable', () => {
    const wrapper = mountIconButton({ icon: 'settings', title: 'Settings', to: '/settings' });

    expect(wrapper.find('a').exists()).toBe(true);
    expect(wrapper.attributes('data-to')).toContain('/settings');
  });

  it('keeps an enabled external icon link secure and blocks it while disabled', () => {
    const enabled = mountIconButton({
      icon: 'external',
      title: 'Docs',
      href: 'https://example.com/docs',
    });

    expect(enabled.find('a').exists()).toBe(true);
    expect(enabled.attributes('href')).toBe('https://example.com/docs');
    expect(enabled.attributes('target')).toBe('_blank');
    expect(enabled.attributes('rel')).toBe('noopener noreferrer');

    const disabled = mountIconButton({
      icon: 'external',
      title: 'Docs',
      href: 'https://example.com/docs',
      disabled: true,
    });

    expect(disabled.find('button').exists()).toBe(true);
    expect(disabled.attributes('disabled')).toBeDefined();
    expect(disabled.attributes('href')).toBeUndefined();
  });

  it('blocks an explicitly disabled route icon', () => {
    const wrapper = mountIconButton({ icon: 'settings', title: 'Settings', to: '/settings', disabled: true });

    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-to]').exists()).toBe(false);
  });
});
