import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import InfrastructureNav from './InfrastructureNav.vue';

const OpsSectionNavStub = defineComponent({
  props: {
    items: {
      type: Array,
      required: true,
    },
    label: String,
  },
  setup(props) {
    return () => h('nav', { 'data-items': JSON.stringify(props.items), 'aria-label': props.label });
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

describe('infrastructure navigation', () => {
  it('keeps all five infrastructure destinations and current counts', () => {
    const wrapper = mount(InfrastructureNav, {
      props: {
        alertCount: 4,
        serverCount: 12,
      },
      global: {
        plugins: [i18n],
        stubs: {
          OpsSectionNav: OpsSectionNavStub,
        },
      },
    });

    const serializedItems = wrapper.get('nav').attributes('data-items');
    expect(serializedItems).toBeDefined();
    const items: unknown = JSON.parse(serializedItems ?? 'null');
    expect(items).toEqual([
      {
        to: '/infrastructure',
        label: 'Infrastructure',
        icon: 'infrastructure',
        exact: true,
      },
      {
        to: '/infrastructure/servers',
        label: 'Servers',
        icon: 'server',
        count: 12,
      },
      {
        to: '/infrastructure/groups',
        label: 'Server groups',
        icon: 'list-group',
      },
      {
        to: '/infrastructure/services',
        label: 'Services & containers',
        icon: 'docker',
      },
      {
        to: '/infrastructure/alerts',
        label: 'Alert center',
        icon: 'bell',
        count: 4,
      },
    ]);
  });
});
