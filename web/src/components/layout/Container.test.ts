import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Container from './Container.vue';

describe('content container', () => {
  it('matches the prototype content width for standard pages', () => {
    const wrapper = mount(Container);

    expect(wrapper.classes()).toContain('max-w-[1540px]');
  });

  it('leaves full-width variants unconstrained', () => {
    const fullWidth = mount(Container, { props: { fullWidth: true } });
    const fillWidth = mount(Container, { props: { fillWidth: true } });

    expect(fullWidth.classes()).not.toContain('max-w-[1540px]');
    expect(fillWidth.classes()).not.toContain('max-w-[1540px]');
  });
});
