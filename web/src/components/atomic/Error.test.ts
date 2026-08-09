import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ErrorMessage from './Error.vue';

describe('error message', () => {
  it('announces persistent errors and preserves text content', () => {
    const wrapper = mount(ErrorMessage, {
      props: {
        text: 'Request failed',
      },
      global: {
        stubs: {
          Icon: true,
        },
      },
    });

    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.attributes('aria-live')).toBe('assertive');
    expect(wrapper.text()).toContain('Request failed');
  });
});
