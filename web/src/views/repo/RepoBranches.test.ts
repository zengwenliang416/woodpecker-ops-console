import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';

import RepoBranches from './RepoBranches.vue';

const pagination = vi.hoisted<{
  data?: ReturnType<typeof ref<string[]>>;
  loading?: ReturnType<typeof ref<boolean>>;
  resetPage: ReturnType<typeof vi.fn>;
}>(() => ({
  resetPage: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => ({
    getRepoBranches: vi.fn(),
  }),
}));

vi.mock('~/compositions/usePaginate', async () => {
  const { ref: vueRef } = await import('vue');
  pagination.data = vueRef<string[]>([]);
  pagination.loading = vueRef(true);

  return {
    usePagination: () => ({
      data: pagination.data,
      loading: pagination.loading,
      resetPage: pagination.resetPage,
    }),
  };
});

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const FeedbackStateStub = defineComponent({
  props: {
    kind: String,
    title: String,
    description: String,
  },
  setup(props) {
    return () =>
      h('section', { 'data-feedback-state': props.kind }, [h('strong', props.title), h('p', props.description)]);
  },
});

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
});

function mountBranches() {
  return mount(RepoBranches, {
    global: {
      plugins: [i18n],
      provide: {
        repo: ref({ id: 1, full_name: 'acme/repo', default_branch: 'main' }),
      },
      stubs: {
        FeedbackState: FeedbackStateStub,
        ListItem: true,
        Badge: true,
      },
    },
  });
}

describe('repository branches feedback', () => {
  beforeEach(() => {
    pagination.data!.value = [];
    pagination.loading!.value = true;
  });

  it('uses the shared loading and empty states', async () => {
    const wrapper = mountBranches();

    expect(wrapper.find('[data-feedback-state="loading"]').exists()).toBe(true);

    pagination.loading!.value = false;
    await nextTick();

    expect(wrapper.find('[data-feedback-state="empty"]').exists()).toBe(true);
  });
});
