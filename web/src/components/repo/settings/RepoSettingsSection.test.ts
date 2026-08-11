import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import RepoSettingsSection from './RepoSettingsSection.vue';

describe('repository settings section', () => {
  it('renders hierarchy, actions, body, and danger state', () => {
    const wrapper = mount(RepoSettingsSection, {
      props: {
        title: 'Danger zone',
        description: 'Server-confirmed destructive actions.',
        danger: true,
      },
      slots: {
        actions: '<button type="button">Repair</button>',
        default: '<p>Section body</p>',
      },
    });

    expect(wrapper.classes()).toContain('repo-settings-section-danger');
    expect(wrapper.get('h2').text()).toBe('Danger zone');
    expect(wrapper.text()).toContain('Server-confirmed destructive actions.');
    expect(wrapper.get('button').text()).toBe('Repair');
    expect(wrapper.text()).toContain('Section body');
  });
});
