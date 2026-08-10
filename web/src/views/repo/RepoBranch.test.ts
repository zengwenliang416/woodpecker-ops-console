import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Pipeline } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types/webhook';

import RepoBranch from './RepoBranch.vue';

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const ReferenceStub = defineComponent({
  props: {
    kind: String,
    title: String,
    pipelines: Array,
    isDefault: Boolean,
  },
  setup(props) {
    return () =>
      h('div', {
        'data-kind': props.kind,
        'data-title': props.title,
        'data-pipeline-count': props.pipelines?.length ?? 0,
        'data-default': String(props.isDefault),
      });
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function pipeline(event: WebhookEvents, branch: string): Pipeline {
  return { event, branch } as Pipeline;
}

describe('repository branch detail', () => {
  it('passes only exact non-PR branch pipelines to the shared detail', () => {
    const wrapper = mount(RepoBranch, {
      props: {
        branch: 'main',
      },
      global: {
        plugins: [i18n],
        provide: {
          repo: ref({ full_name: 'acme/repo', default_branch: 'main' }),
          pipelines: ref([
            pipeline(WebhookEvents.Push, 'main'),
            pipeline(WebhookEvents.Manual, 'main'),
            pipeline(WebhookEvents.PullRequest, 'main'),
            pipeline(WebhookEvents.Push, 'release'),
          ]),
        },
        stubs: {
          RepoPipelineReference: ReferenceStub,
        },
      },
    });

    const reference = wrapper.get('[data-kind]');
    expect(reference.attributes('data-kind')).toBe('branch');
    expect(reference.attributes('data-title')).toBe('main');
    expect(reference.attributes('data-pipeline-count')).toBe('2');
    expect(reference.attributes('data-default')).toBe('true');
  });
});
