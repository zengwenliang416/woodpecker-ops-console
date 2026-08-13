import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import zhHans from '~/assets/locales/zh-Hans.json';

import { useDeploymentPresentation } from './useDeploymentPresentation';

function renderLabels(locale: 'en' | 'zh-Hans') {
  const component = defineComponent({
    setup() {
      const presentation = useDeploymentPresentation();
      return () =>
        h(
          'div',
          [
            presentation.deploymentStatusLabel('pending_approval'),
            presentation.releaseStatusLabel('deployed'),
            presentation.strategyLabel('rolling'),
            presentation.targetStatusLabel('healthy'),
            presentation.phaseLabel('pulling'),
            presentation.phaseLabel('failed'),
            presentation.actorLabel('system'),
          ].join('|'),
        );
    },
  });

  return mount(component, {
    global: {
      plugins: [
        createI18n({
          legacy: false,
          locale,
          messages: { en, 'zh-Hans': zhHans },
        }),
      ],
    },
  }).text();
}

describe('useDeploymentPresentation', () => {
  it('maps typed deployment vocabulary to English labels', () => {
    expect(renderLabels('en')).toBe(
      'Awaiting approval|Deployed|Rolling|Healthy|Pulling the immutable image|Deployment failed|System',
    );
  });

  it('maps typed deployment vocabulary to Simplified Chinese labels', () => {
    const labels = renderLabels('zh-Hans');
    expect(labels).toBe('待审批|已部署|滚动部署|成功|正在拉取不可变镜像|部署失败|系统');
    expect(labels).not.toMatch(/pending_approval|deployed|rolling|healthy|pulling|system/i);
  });
});
