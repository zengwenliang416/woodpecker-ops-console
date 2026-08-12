import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SettingsTable from './SettingsTable.vue';

describe('settings table', () => {
  it('owns dense-table horizontal overflow locally', () => {
    const wrapper = mount(SettingsTable, {
      props: { minWidth: '720px' },
      slots: {
        head: '<tr><th>Name</th></tr>',
        default: '<tr><td>Token</td></tr>',
        footer: '1 loaded',
      },
    });

    const source = readFileSync(resolve(process.cwd(), 'src/components/settings/SettingsTable.vue'), 'utf8');
    expect(wrapper.get('table').attributes('style')).toContain('min-width: 720px');
    expect(source).toContain('@apply max-w-full overflow-x-auto;');
    expect(source).toContain('@apply border-wp-border-100 min-w-0 overflow-hidden');
    expect(source).toContain('contain: layout paint;');
    expect(wrapper.text()).toContain('1 loaded');
  });
});
