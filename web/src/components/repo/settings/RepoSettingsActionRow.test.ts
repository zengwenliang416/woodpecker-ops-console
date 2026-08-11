import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import RepoSettingsActionRow from './RepoSettingsActionRow.vue';

describe('repository settings action row', () => {
  it('keeps operational copy and action control together', () => {
    const wrapper = mount(RepoSettingsActionRow, {
      props: {
        title: 'Disable repository',
        description: 'Stop processing new webhooks.',
      },
      slots: {
        default: '<button type="button">Disable</button>',
      },
    });

    expect(wrapper.get('h3').text()).toBe('Disable repository');
    expect(wrapper.get('p').text()).toBe('Stop processing new webhooks.');
    expect(wrapper.get('button').text()).toBe('Disable');
  });
});
