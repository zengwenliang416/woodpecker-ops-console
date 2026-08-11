import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

  it('locks wide settings tables to the contained horizontal scroll owner', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/repo/settings/RepoSettingsTable.vue'), 'utf8');

    expect(source).toMatch(/\.repo-settings-table-shell\s*\{[\s\S]*min-w-0 overflow-hidden/);
    expect(source).toMatch(/\.repo-settings-table-scroll\s*\{[\s\S]*overflow-x-auto/);
    expect(source).toMatch(/\.repo-settings-table-scroll\s*\{[\s\S]*contain:\s*layout paint/);
    expect(source).toMatch(/<table :style="\{ minWidth \}">/);
  });
});
