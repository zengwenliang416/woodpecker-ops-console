import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SettingsActionRow from './SettingsActionRow.vue';

describe('settings action row', () => {
  it('renders behavior copy and the supplied control', () => {
    const wrapper = mount(SettingsActionRow, {
      props: {
        title: 'Repair',
        description: 'Reconcile repository state.',
      },
      slots: {
        default: '<button>Run</button>',
      },
    });

    expect(wrapper.text()).toContain('Repair');
    expect(wrapper.text()).toContain('Reconcile repository state.');
    expect(wrapper.get('button').text()).toBe('Run');
  });
});
