import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Pipeline } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types/webhook';

import RepoPullRequest from './RepoPullRequest.vue';

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const ReferenceStub = defineComponent({
  props: {
    kind: String,
    title: String,
    reference: String,
    pipelines: Array,
  },
  setup(props) {
    return () =>
      h('div', {
        'data-kind': props.kind,
        'data-title': props.title,
        'data-reference': props.reference,
        'data-pipeline-count': props.pipelines?.length ?? 0,
      });
  },
});

const FeedbackStateStub = defineComponent({
  props: {
    kind: String,
    title: String,
    description: String,
  },
  setup(props) {
    return () => h('section', { 'data-feedback-state': props.kind }, [h('strong', props.title), props.description]);
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function pipeline(number: number, event: WebhookEvents, refValue: string, title = ''): Pipeline {
  return { number, event, ref: refValue, title } as Pipeline;
}

function mountPullRequest(
  pipelines: Pipeline[],
  repo = ref({
    full_name: 'acme/repo',
    pr_enabled: true,
    allow_pr: true,
  }),
) {
  return mount(RepoPullRequest, {
    props: {
      pullRequest: '42',
    },
    global: {
      plugins: [i18n],
      provide: {
        repo,
        pipelines: ref(pipelines),
      },
      stubs: {
        FeedbackState: FeedbackStateStub,
        RepoPipelineReference: ReferenceStub,
      },
    },
  });
}

describe('repository pull-request detail', () => {
  it('renders a disabled state instead of throwing on direct access when pull requests are unavailable', () => {
    const wrapper = mountPullRequest(
      [],
      ref({
        full_name: 'acme/repo',
        pr_enabled: false,
        allow_pr: false,
      }),
    );

    expect(wrapper.get('[data-feedback-state="disabled"]').text()).toContain('Pull requests are disabled');
  });

  it('passes exact PR pipeline events and newest real title to the shared detail', () => {
    const wrapper = mountPullRequest([
      pipeline(5, WebhookEvents.PullRequest, 'refs/pull/42/merge', 'Older title'),
      pipeline(9, WebhookEvents.PullRequestMetadata, 'refs/merge-requests/42/from', 'Current title'),
      pipeline(12, WebhookEvents.Push, 'refs/pull/42/merge', 'Push title'),
      pipeline(10, WebhookEvents.PullRequest, 'refs/pull/7/head', 'Other PR'),
    ]);

    const reference = wrapper.get('[data-kind]');
    expect(reference.attributes('data-kind')).toBe('pull-request');
    expect(reference.attributes('data-reference')).toBe('#42');
    expect(reference.attributes('data-title')).toBe('Current title');
    expect(reference.attributes('data-pipeline-count')).toBe('2');
  });

  it('uses the translated identifier when no loaded pipeline exposes a title', () => {
    const wrapper = mountPullRequest([]);
    expect(wrapper.get('[data-kind]').attributes('data-title')).toBe('Pull request #42');
  });
});
