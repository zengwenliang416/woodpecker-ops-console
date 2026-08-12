import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import AdminQueueStats from './AdminQueueStats.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

describe('administrator queue stats', () => {
  it('renders only the five current QueueStats fields', () => {
    const wrapper = mount(AdminQueueStats, {
      props: {
        stats: {
          completed_count: 13,
          worker_count: 2,
          running_count: 3,
          pending_count: 5,
          waiting_on_deps_count: 7,
        },
      },
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.text()).toContain('Completed Tasks');
    expect(wrapper.text()).toContain('13');
    expect(wrapper.text()).toContain('Free');
    expect(wrapper.text()).toContain('2');
    expect(wrapper.text()).toContain('Running');
    expect(wrapper.text()).toContain('3');
    expect(wrapper.text()).toContain('Pending');
    expect(wrapper.text()).toContain('5');
    expect(wrapper.text()).toContain('Waiting on dependencies');
    expect(wrapper.text()).toContain('7');
    expect(wrapper.text()).not.toMatch(/average|throughput|capacity|priority/i);
  });

  it('does not render an unconfirmed stats shell', () => {
    const wrapper = mount(AdminQueueStats, {
      global: {
        plugins: [i18n],
      },
    });

    expect(wrapper.html()).toBe('<!--v-if-->');
  });

  it('uses a mobile-safe grid without horizontal minimum widths', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/admin/settings/queue/AdminQueueStats.vue'),
      'utf8',
    );

    expect(source).toContain('grid-cols-2');
    expect(source).toContain('min-w-0');
    expect(source).not.toMatch(/min-width|min-w-\[/);
  });
});
