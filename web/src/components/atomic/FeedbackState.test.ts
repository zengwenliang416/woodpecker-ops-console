import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FeedbackState from './FeedbackState.vue';

describe('feedback state', () => {
  it.each([
    ['loading', 'status', 'polite', 'true'],
    ['empty', undefined, undefined, undefined],
    ['error', 'alert', 'assertive', undefined],
    ['permission', undefined, undefined, undefined],
    ['disabled', undefined, undefined, undefined],
    ['stale', 'status', 'polite', undefined],
  ] as const)('renders the %s semantic variant', (kind, role, live, busy) => {
    const wrapper = mount(FeedbackState, {
      props: {
        kind,
        title: `${kind} title`,
        description: `${kind} description`,
      },
      global: {
        stubs: {
          PrototypeIcon: true,
        },
      },
    });

    expect(wrapper.attributes('data-feedback-state')).toBe(kind);
    expect(wrapper.attributes('role')).toBe(role);
    expect(wrapper.attributes('aria-live')).toBe(live);
    expect(wrapper.attributes('aria-busy')).toBe(busy);
    expect(wrapper.text()).toContain(`${kind} title`);
    expect(wrapper.text()).toContain(`${kind} description`);
  });

  it('supports compact presentation and an action slot', () => {
    const wrapper = mount(FeedbackState, {
      props: {
        kind: 'stale',
        title: 'Outdated repository',
        compact: true,
      },
      slots: {
        action: '<button type="button">Resolve</button>',
      },
      global: {
        stubs: {
          PrototypeIcon: true,
        },
      },
    });

    expect(wrapper.classes()).toContain('feedback-state-compact');
    expect(wrapper.get('button').text()).toBe('Resolve');
  });
});
