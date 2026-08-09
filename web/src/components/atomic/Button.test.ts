import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import Button from './Button.vue';

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

function mountButton(props: Record<string, unknown>) {
  return mount(Button, {
    props,
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        PrototypeIcon: true,
      },
    },
  });
}

describe('button', () => {
  it('renders a busy link action as a native disabled button', async () => {
    const wrapper = mountButton({ text: 'Run', to: '/next', isLoading: true });

    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.attributes('aria-busy')).toBe('true');
    expect(wrapper.find('[data-to]').exists()).toBe(false);

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('keeps an enabled route action navigable', () => {
    const wrapper = mountButton({ text: 'Open', to: '/next' });

    expect(wrapper.find('a').exists()).toBe(true);
    expect(wrapper.attributes('data-to')).toContain('/next');
    expect(wrapper.attributes('aria-busy')).toBeUndefined();
  });

  it('keeps an enabled HTTP action as a link and blocks it when disabled', () => {
    const enabled = mountButton({ text: 'Docs', to: 'https://example.com/docs' });

    expect(enabled.find('a').exists()).toBe(true);
    expect(enabled.attributes('href')).toBe('https://example.com/docs');

    const disabled = mountButton({ text: 'Docs', to: 'https://example.com/docs', disabled: true });

    expect(disabled.find('button').exists()).toBe(true);
    expect(disabled.attributes('disabled')).toBeDefined();
    expect(disabled.attributes('href')).toBeUndefined();
  });

  it('blocks an explicitly disabled route action', () => {
    const wrapper = mountButton({ text: 'Open', to: '/next', disabled: true });

    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-to]').exists()).toBe(false);
  });

  it('preserves an explicit submit type while loading', () => {
    const wrapper = mount(Button, {
      props: {
        text: 'Save',
        isLoading: true,
      },
      attrs: {
        type: 'submit',
      },
      global: {
        stubs: {
          PrototypeIcon: true,
        },
      },
    });

    expect(wrapper.attributes('type')).toBe('submit');
    expect(wrapper.attributes('disabled')).toBeDefined();
  });
});
