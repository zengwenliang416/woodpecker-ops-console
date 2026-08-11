import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import RepoSettingsTable from './RepoSettingsTable.vue';

describe('repository settings table', () => {
  it('contains dense columns inside a local scroll region', () => {
    const wrapper = mount(RepoSettingsTable, {
      props: {
        minWidth: '780px',
      },
      slots: {
        head: '<tr><th>Name</th><th>Scope</th></tr>',
        default: '<tr><td>DEPLOY_TOKEN</td><td>Repository</td></tr>',
        footer: '1 loaded',
      },
    });

    expect(wrapper.find('.repo-settings-table-scroll').exists()).toBe(true);
    expect(wrapper.get('table').attributes('style')).toContain('min-width: 780px');
    expect(wrapper.get('thead').text()).toContain('Scope');
    expect(wrapper.get('tbody').text()).toContain('DEPLOY_TOKEN');
    expect(wrapper.get('.repo-settings-table-footer').text()).toBe('1 loaded');
  });
});
