import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import PipelineChangedFiles from './PipelineChangedFiles.vue';

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const FileTreeStub = defineComponent({
  name: 'FileTree',
  props: {
    node: Object,
  },
  setup(props) {
    return () =>
      h('div', { 'data-file-node': (props.node as { path: string }).path }, (props.node as { name: string }).name);
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

function mountChangedFiles(changedFiles: string[]) {
  return mount(PipelineChangedFiles, {
    global: {
      plugins: [i18n],
      provide: {
        repo: ref({ full_name: 'acme/backend-api' }),
        pipeline: ref({ number: 842, changed_files: changedFiles }),
      },
      stubs: {
        FileTree: FileTreeStub,
        FeedbackState: FeedbackStateStub,
        Panel: true,
        Icon: true,
      },
    },
  });
}

describe('pipeline changed files diagnostics', () => {
  it('filters the real changed-file paths and reports the visible count', async () => {
    const wrapper = mountChangedFiles(['src/routes/user.ts', 'docs/runbook.md']);

    expect(wrapper.get('[data-testid="changed-files-count"]').text()).toContain('2 files');
    await wrapper.get('[data-testid="changed-files-search"]').setValue('docs');

    expect(wrapper.get('[data-testid="changed-files-count"]').text()).toContain('1 of 2 files');
    expect(wrapper.text()).toContain('docs/runbook.md');
    expect(wrapper.text()).not.toContain('src/routes/user.ts');
  });

  it('distinguishes no changed files from no filter match', async () => {
    const emptyWrapper = mountChangedFiles([]);
    expect(emptyWrapper.get('[data-feedback-state="empty"]').text()).toContain('No changed files');

    const filteredWrapper = mountChangedFiles(['src/routes/user.ts']);
    await filteredWrapper.get('[data-testid="changed-files-search"]').setValue('docs');
    expect(filteredWrapper.get('[data-feedback-state="empty"]').text()).toContain('No matching files');
  });
});
