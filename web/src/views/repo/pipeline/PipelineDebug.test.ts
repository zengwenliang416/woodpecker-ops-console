import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import PipelineDebug from './PipelineDebug.vue';

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getPipelineMetadata: vi.fn(),
  }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: vi.fn(),
  }),
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const FeedbackStateStub = defineComponent({
  props: {
    kind: String,
    title: String,
  },
  setup(props) {
    return () => h('section', { 'data-feedback-state': props.kind }, props.title);
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function mountDebug(canPush: boolean) {
  return mount(PipelineDebug, {
    global: {
      plugins: [i18n],
      provide: {
        repo: ref({ id: 1, full_name: 'acme/repo' }),
        pipeline: ref({ number: 42, version: 'v1' }),
        'repo-permissions': ref({ push: canPush }),
      },
      stubs: {
        FeedbackState: FeedbackStateStub,
        Panel: true,
        InputField: true,
        Button: true,
      },
    },
  });
}

describe('pipeline debug feedback', () => {
  it('uses the shared permission state without changing the permission source', () => {
    const wrapper = mountDebug(false);

    expect(wrapper.get('[data-feedback-state="permission"]').text()).toContain(
      'You are not allowed to access the debug information',
    );
  });

  it('keeps the debug content available with push permission', () => {
    const wrapper = mountDebug(true);

    expect(wrapper.find('[data-feedback-state]').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'Panel' }).exists()).toBe(true);
  });
});
