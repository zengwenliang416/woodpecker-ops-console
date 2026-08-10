import { mount } from '@vue/test-utils';
import { encode } from 'js-base64';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import PipelineConfig from './PipelineConfig.vue';

const testState = vi.hoisted(() => ({
  notify: vi.fn(),
  writeText: vi.fn(),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: testState.notify,
  }),
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const ButtonStub = defineComponent({
  name: 'Button',
  props: {
    text: String,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () => h('button', { 'data-action': props.text, onClick: () => emit('click') }, props.text);
  },
});

const SyntaxHighlightStub = defineComponent({
  name: 'SyntaxHighlight',
  props: {
    code: String,
  },
  setup(props) {
    return () => h('pre', { 'data-config-code': '' }, props.code);
  },
});

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

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function mountConfig(configs: Array<{ hash: string; name: string; data: string }>) {
  return mount(PipelineConfig, {
    global: {
      plugins: [i18n],
      provide: {
        repo: ref({ full_name: 'acme/backend-api' }),
        pipeline: ref({ number: 842 }),
        'pipeline-configs': ref(configs),
      },
      stubs: {
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        Panel: false,
        SyntaxHighlight: SyntaxHighlightStub,
        Icon: true,
      },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: testState.writeText.mockResolvedValue(undefined),
    },
  });
});

describe('pipeline configuration diagnostics', () => {
  it('renders decoded read-only config with file identity and copy intent', async () => {
    const wrapper = mountConfig([{ hash: 'config-hash', name: '.woodpecker.yml', data: encode('steps:\\n  test:') }]);

    expect(wrapper.text()).toContain('.woodpecker.yml');
    expect(wrapper.get('[data-config-code]').text()).toContain('steps:');

    await wrapper.get('[data-action="Copy config"]').trigger('click');
    expect(testState.writeText).toHaveBeenCalledWith('steps:\\n  test:');
    expect(testState.notify).toHaveBeenCalledWith({ type: 'success', title: 'Configuration copied' });
  });

  it('renders an explicit empty state when no historical config exists', () => {
    const wrapper = mountConfig([]);

    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No historical configuration');
  });

  it('contains long read-only configuration inside its own scroll region', () => {
    const wrapper = mountConfig([
      {
        hash: 'config-hash',
        name: '.woodpecker.yml',
        data: encode(`steps:\n  test:\n    commands:\n      - ${'x'.repeat(200)}`),
      },
    ]);
    const code = wrapper.get('[data-config-code]');

    expect(wrapper.classes()).toContain('min-w-0');
    expect(code.element.parentElement?.classList.contains('min-w-0')).toBe(true);
    expect(code.element.parentElement?.classList.contains('overflow-auto')).toBe(true);
  });
});
