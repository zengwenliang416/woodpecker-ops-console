import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SettingsSection from './SettingsSection.vue';

describe('settings section', () => {
  it('renders shared copy, actions, content, and danger styling', () => {
    const wrapper = mount(SettingsSection, {
      props: {
        title: 'Credentials',
        description: 'Manage credentials.',
        danger: true,
      },
      slots: {
        actions: '<button>Add</button>',
        default: '<p>Rows</p>',
      },
    });

    expect(wrapper.text()).toContain('Credentials');
    expect(wrapper.text()).toContain('Manage credentials.');
    expect(wrapper.text()).toContain('Add');
    expect(wrapper.text()).toContain('Rows');
    expect(wrapper.classes()).toContain('settings-section-danger');
  });
});
