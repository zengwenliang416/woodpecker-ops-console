import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import PipelineErrors from './PipelineErrors.vue';

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const FeedbackStateStub = defineComponent({
  name: 'FeedbackState',
  props: {
    kind: String,
    title: String,
  },
  setup(props) {
    return () => h('section', { 'data-feedback-state': props.kind }, props.title);
  },
});

const ButtonStub = defineComponent({
  name: 'Button',
  props: {
    text: String,
    to: Object,
  },
  setup(props) {
    return () => h('a', { 'data-action': props.text, 'data-to': JSON.stringify(props.to) }, props.text);
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function mountErrors({
  errors = [],
  workflowError,
}: {
  errors?: Array<{ type: string; message: string; data?: unknown; is_warning: boolean }>;
  workflowError?: string;
} = {}) {
  return mount(PipelineErrors, {
    global: {
      plugins: [i18n],
      provide: {
        repo: ref({ full_name: 'acme/backend-api' }),
        pipeline: ref({
          number: 842,
          errors,
          workflows:
            workflowError !== undefined && workflowError.length > 0
              ? [{ id: 1, name: 'build', error: workflowError, children: [], state: 'failure' }]
              : [],
        }),
      },
      stubs: {
        Button: ButtonStub,
        DocsLink: true,
        FeedbackState: FeedbackStateStub,
        Icon: true,
        Panel: false,
        RenderMarkdown: {
          props: ['content'],
          template: '<div data-error-message>{{ content }}</div>',
        },
      },
    },
  });
}

describe('pipeline error diagnostics', () => {
  it('renders real runtime and parse error data with current route actions', () => {
    const wrapper = mountErrors({
      workflowError: 'container exited before setup',
      errors: [
        {
          type: 'linter',
          message: 'missing required image',
          data: { file: '.woodpecker.yml', field: 'steps.build.image' },
          is_warning: false,
        },
      ],
    });

    expect(wrapper.text()).toContain('Runtime errors');
    expect(wrapper.text()).toContain('container exited before setup');
    expect(wrapper.text()).toContain('Parse errors');
    expect(wrapper.text()).toContain('missing required image');
    expect(wrapper.get('[data-action="View changed files"]').attributes('data-to')).toContain(
      'repo-pipeline-changed-files',
    );
  });

  it('renders an explicit no-error state without manufacturing analysis', () => {
    const wrapper = mountErrors();

    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No pipeline errors');
    expect(wrapper.text()).not.toContain('Previous success');
  });
});
