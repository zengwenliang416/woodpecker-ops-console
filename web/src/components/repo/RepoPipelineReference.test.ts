import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Pipeline } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types/webhook';

import RepoPipelineReference from './RepoPipelineReference.vue';

const PipelineListStub = defineComponent({
  props: {
    pipelines: Array,
  },
  setup(props) {
    return () => h('div', { 'data-pipeline-count': props.pipelines?.length ?? 0 });
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function pipeline(number: number, status: Pipeline['status'] = 'success'): Pipeline {
  return {
    id: number,
    number,
    parent: 0,
    event: WebhookEvents.Push,
    event_reason: [],
    status,
    created: 1_754_386_000,
    updated: 1_754_386_010,
    started: 1_754_386_001,
    finished: 1_754_386_009,
    deploy_to: '',
    commit: `abcdef${number}123456789`,
    branch: 'main',
    message: `pipeline ${number}`,
    timestamp: 1_754_386_000,
    ref: 'refs/heads/main',
    refspec: '',
    clone_url: '',
    title: '',
    sender: '',
    author: 'alice',
    author_avatar: '',
    author_email: '',
    forge_url: '',
    reviewed_by: '',
    reviewed: 0,
    cancel_info: {
      canceled_by_user: '',
      canceled_by_step: '',
      superseded_by: 0,
    },
    version: 'next',
  };
}

describe('repository pipeline reference detail', () => {
  it('shows the newest real pipeline summary and ordered history', () => {
    const wrapper = mount(RepoPipelineReference, {
      props: {
        kind: 'branch',
        title: 'main',
        isDefault: true,
        pipelines: [pipeline(4), pipeline(9, 'running')],
      },
      global: {
        plugins: [i18n],
        stubs: {
          Badge: true,
          PipelineList: PipelineListStub,
          PipelineStatusIcon: true,
          PrototypeIcon: true,
        },
      },
    });

    expect(wrapper.get('h1').text()).toBe('main');
    expect(wrapper.get('[data-testid="history-count"]').text()).toContain('2 loaded runs');
    expect(wrapper.get('[data-testid="latest-status"]').text()).toContain('running');
    expect(wrapper.get('[data-testid="latest-commit"]').text()).toContain('abcdef9123');
    expect(wrapper.get('[data-pipeline-count]').attributes('data-pipeline-count')).toBe('2');
  });

  it('renders explicit unavailable summary values without pipeline history', () => {
    const wrapper = mount(RepoPipelineReference, {
      props: {
        kind: 'pull-request',
        title: 'Pull request #42',
        reference: '#42',
        pipelines: [],
      },
      global: {
        plugins: [i18n],
        stubs: {
          Badge: true,
          PipelineList: PipelineListStub,
          PipelineStatusIcon: true,
          PrototypeIcon: true,
        },
      },
    });

    expect(wrapper.get('[data-testid="history-count"]').text()).toContain('0 loaded runs');
    expect(wrapper.get('[data-testid="latest-status"]').text()).toContain('—');
    expect(wrapper.get('[data-testid="latest-commit"]').text()).toContain('—');
  });
});
