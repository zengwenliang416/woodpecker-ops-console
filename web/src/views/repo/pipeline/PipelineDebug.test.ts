import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import PipelineDebug from './PipelineDebug.vue';

const testState = vi.hoisted(() => ({
  getPipelineMetadata: vi.fn(),
  notify: vi.fn(),
  revokeObjectURL: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getPipelineMetadata: testState.getPipelineMetadata,
  }),
}));

vi.mock('~/compositions/useNotifications', () => ({
  default: () => ({
    notify: testState.notify,
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

const ButtonStub = defineComponent({
  name: 'Button',
  props: {
    text: String,
    isLoading: Boolean,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-action': props.text,
          'aria-busy': props.isLoading ? 'true' : undefined,
          onClick: () => emit('click'),
        },
        props.text,
      );
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
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        Icon: true,
        InputField: false,
        Panel: false,
      },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  testState.getPipelineMetadata.mockResolvedValue({ pipeline: 42 });
  vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:metadata');
  vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(testState.revokeObjectURL);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

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

  it('downloads real metadata and reports successful completion', async () => {
    const wrapper = mountDebug(true);

    await wrapper.get('[data-action="Download metadata"]').trigger('click');

    expect(testState.getPipelineMetadata).toHaveBeenCalledWith(1, 42);
    expect(testState.notify).toHaveBeenCalledWith({ type: 'success', title: 'Metadata downloaded successfully' });
    expect(testState.revokeObjectURL).toHaveBeenCalledWith('blob:metadata');
  });

  it('contains the CLI and version values inside local scroll regions', () => {
    const wrapper = mountDebug(true);
    const codeBlocks = wrapper.findAll('pre');

    expect(wrapper.classes()).toContain('min-w-0');
    expect(codeBlocks).toHaveLength(2);
    expect(codeBlocks[0].element.parentElement?.classList.contains('overflow-auto')).toBe(true);
    expect(codeBlocks[1].classes()).toEqual(expect.arrayContaining(['min-w-0', 'overflow-auto']));
  });
});
