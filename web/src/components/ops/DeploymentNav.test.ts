import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import DeploymentNav from './DeploymentNav.vue';

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

describe('deployment navigation', () => {
  it('keeps all six deployment destinations and current counts', () => {
    const wrapper = mount(DeploymentNav, {
      props: {
        applicationCount: 4,
        environmentCount: 3,
        releaseCount: 8,
        approvalCount: 2,
      },
      global: {
        plugins: [i18n],
        stubs: {
          OpsSectionNav: OpsSectionNavStub,
        },
      },
    });

    const items: unknown = JSON.parse(wrapper.get('nav').attributes('data-items') ?? 'null');
    expect(items).toEqual([
      { to: '/deployments', label: 'Deployments', icon: 'rocket', exact: true },
      { to: '/deployments/apps', label: 'Applications', icon: 'app', count: 4 },
      { to: '/deployments/environments', label: 'Environments', icon: 'environment', count: 3 },
      { to: '/deployments/releases', label: 'Releases', icon: 'package', count: 8 },
      { to: '/deployments/approvals', label: 'Production approvals', icon: 'shield', count: 2 },
      { to: '/deployments/policies', label: 'Deployment policies', icon: 'settings' },
    ]);
  });
});
