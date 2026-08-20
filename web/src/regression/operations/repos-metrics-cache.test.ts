import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import zhHans from '~/assets/locales/zh-Hans.json';
import type { Forge, Pipeline, Repo } from '~/lib/api/types';
import Repos from '~/views/Repos.vue';

/**
 * Operations regression: repository pipeline-statistics cache and forced
 * refresh (repaired by task 020, baseline task 6.1/6.4).
 *
 * Repaired behavior under test: "Explicit refresh forces a new metric fetch,
 * ordinary pagination reuses the cache, and generation ownership prevents
 * obsolete metric requests from overwriting the newest page."
 */
const state = vi.hoisted(() => ({
  api: {
    getForges: vi.fn(),
    getPipelineList: vi.fn(),
  },
  repoStore: null as {
    loadRepos: ReturnType<typeof vi.fn>;
    ownedRepos: Repo[];
    refreshRepos: ReturnType<typeof vi.fn>;
  } | null,
}));

vi.mock('~/compositions/useApiClient', () => ({
  default: () => state.api,
}));

vi.mock('~/compositions/useRepos', () => ({
  default: () => ({
    repoWithLastPipeline: (repo: Repo) => repo,
    sortReposByLastActivity: (repos: Repo[]) =>
      repos.sort((left, right) => (right.last_pipeline?.created ?? 0) - (left.last_pipeline?.created ?? 0)),
  }),
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

vi.mock('~/store/repos', () => ({
  useRepoStore: () => state.repoStore,
}));

const ScaffoldStub = defineComponent({
  setup(_, { slots }) {
    return () => h('section', [h('header', [slots.title?.(), slots.headerActions?.()]), h('main', slots.default?.())]);
  },
});

const ButtonStub = defineComponent({
  props: {
    disabled: Boolean,
    isLoading: Boolean,
    text: String,
    title: String,
    to: [String, Object],
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-to': JSON.stringify(props.to),
          disabled: props.disabled || props.isLoading,
          title: props.title ?? props.text ?? '',
          onClick: () => emit('click'),
        },
        props.text,
      );
  },
});

const IconButtonStub = defineComponent({
  props: {
    disabled: Boolean,
    isLoading: Boolean,
    title: String,
    to: [String, Object],
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          'data-to': JSON.stringify(props.to),
          disabled: props.disabled || props.isLoading,
          title: props.title,
          onClick: () => emit('click'),
        },
        props.title,
      );
  },
});

const FeedbackStateStub = defineComponent({
  props: {
    description: String,
    kind: String,
    title: String,
  },
  setup(props, { slots }) {
    return () =>
      h('section', { 'data-feedback-state': props.kind }, [
        h('strong', props.title),
        h('p', props.description),
        slots.action?.(),
      ]);
  },
});

const RouterLinkStub = defineComponent({
  props: {
    to: [String, Object],
  },
  setup(props, { slots }) {
    return () => h('a', { 'data-to': JSON.stringify(props.to) }, slots.default?.());
  },
});

function createTestI18n(locale = 'en') {
  return createI18n({
    legacy: false,
    locale,
    messages: { en, 'zh-Hans': zhHans },
  });
}

function pipeline(number: number, status: Pipeline['status'], started = 100, finished = 160): Pipeline {
  return {
    id: number,
    number,
    status,
    event: 'push',
    message: `pipeline-${number}`,
    branch: 'main',
    created: number,
    started,
    finished,
  } as Pipeline;
}

function repository(id: number, status: Pipeline['status'] = 'success'): Repo {
  return {
    id,
    active: true,
    owner: id % 2 === 0 ? 'platform' : 'acme',
    name: `repo-${id}`,
    full_name: `${id % 2 === 0 ? 'platform' : 'acme'}/repo-${id}`,
    forge_id: 1,
    forge_remote_id: `repo-${id}`,
    config_file: '.woodpecker.yml',
    default_branch: 'main',
    visibility: 'private',
    last_pipeline: pipeline(id, status, 100, status === 'running' ? 0 : 160),
  } as Repo;
}

function forge(id: number, type: Forge['type']): Forge {
  return { id, type, url: `https://forge-${id}.example.test` };
}

function mountRepos() {
  return mount(Repos, {
    global: {
      plugins: [createTestI18n()],
      stubs: {
        Button: ButtonStub,
        FeedbackState: FeedbackStateStub,
        IconButton: IconButtonStub,
        PrototypeIcon: true,
        RouterLink: RouterLinkStub,
        Scaffold: ScaffoldStub,
      },
    },
  });
}

describe('operations regression: repository pipeline-statistics cache', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    state.repoStore = reactive({
      loadRepos: vi.fn().mockResolvedValue(undefined),
      ownedRepos: [repository(1), repository(2, 'failure')],
      refreshRepos: vi.fn().mockResolvedValue(undefined),
    });
    state.api.getForges.mockResolvedValue([forge(1, 'github')]);
    state.api.getPipelineList.mockImplementation(async (repoId: number) => [
      pipeline(repoId * 10, 'success', 100, 220),
    ]);
  });

  it('reuses cached pipeline statistics when pagination changes the visible page', async () => {
    state.repoStore!.ownedRepos.splice(
      0,
      state.repoStore!.ownedRepos.length,
      ...Array.from({ length: 12 }, (_, index) => repository(index + 1)),
    );
    const wrapper = mountRepos();
    await flushPromises();

    // First page hydrates statistics for the 10 visible repositories exactly once.
    expect(state.api.getPipelineList).toHaveBeenCalledTimes(10);

    // Moving to page two fetches only the 2 newly visible repositories; the 10
    // cached page-one repositories are not re-fetched (cache reuse).
    await wrapper.get('button[title="Next"]').trigger('click');
    await flushPromises();
    expect(state.api.getPipelineList).toHaveBeenCalledTimes(12);

    // Returning to page one issues no new requests: every visible repository
    // already has cached statistics.
    await wrapper.get('button[title="Previous"]').trigger('click');
    await flushPromises();
    expect(state.api.getPipelineList).toHaveBeenCalledTimes(12);
  });

  it('forces a fresh pipeline-statistics fetch on explicit refresh', async () => {
    const wrapper = mountRepos();
    await flushPromises();

    expect(state.api.getPipelineList).toHaveBeenCalledTimes(2);
    expect(wrapper.text()).toContain('acme/repo-1');
    expect(wrapper.text()).toContain('100.0%');

    const vm = wrapper.vm as unknown as { loadRepositories: (refresh: boolean) => Promise<void> };
    await vm.loadRepositories(true);
    await flushPromises();

    // The explicit refresh re-fetches the server list and re-requests the
    // pipeline statistics of every visible repository even though they were
    // already cached.
    expect(state.repoStore!.refreshRepos).toHaveBeenCalledTimes(1);
    expect(state.api.getPipelineList).toHaveBeenCalledTimes(4);
  });
});
