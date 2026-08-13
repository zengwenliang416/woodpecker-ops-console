import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import zhHans from '~/assets/locales/zh-Hans.json';
import type { Forge, Pipeline, Repo } from '~/lib/api/types';

import Repos from './Repos.vue';

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
    forge_id: id % 2 === 0 ? 2 : 1,
    forge_remote_id: `repo-${id}`,
    scm: 'git',
    config_file: '.woodpecker.yml',
    default_branch: 'main',
    visibility: id % 3 === 0 ? 'internal' : 'private',
    last_pipeline: pipeline(id, status, 100, status === 'running' ? 0 : 160),
  } as Repo;
}

function forge(id: number, type: Forge['type']): Forge {
  return { id, type, url: `https://forge-${id}.example.test` };
}

function deferred<T>() {
  let resolveValue!: (value: T) => void;
  let rejectValue!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveValue = resolve;
    rejectValue = reject;
  });
  return { promise, reject: rejectValue, resolve: resolveValue };
}

function mountRepos(locale = 'en') {
  return mount(Repos, {
    global: {
      plugins: [createTestI18n(locale)],
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

describe('repositories overview', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    state.repoStore = reactive({
      loadRepos: vi.fn().mockResolvedValue(undefined),
      ownedRepos: [repository(1), repository(2, 'failure')],
      refreshRepos: vi.fn().mockResolvedValue(undefined),
    });
    state.api.getForges.mockResolvedValue([forge(1, 'github'), forge(2, 'gitlab')]);
    state.api.getPipelineList.mockImplementation(async (repoId: number) => [
      pipeline(repoId * 10, 'success', 100, 220),
      pipeline(repoId * 10 + 1, repoId === 1 ? 'success' : 'failure', 100, 160),
    ]);
  });

  it('renders real metrics, unknown fallbacks, bilingual labels, and contained dense-table structure', async () => {
    state.api.getPipelineList.mockImplementation(async (repoId: number) => {
      if (repoId === 2) throw new Error('stats unavailable');
      return [pipeline(10, 'success')];
    });
    const wrapper = mountRepos('zh-Hans');
    await flushPromises();

    expect(wrapper.text()).toContain('仓库');
    expect(wrapper.text()).toContain('acme/repo-1');
    expect(wrapper.text()).toContain('platform/repo-2');
    expect(wrapper.text()).toContain('100.0%');
    expect(wrapper.text()).toContain('—');
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('部分仓库数据暂不可用');
    expect(wrapper.get('.repo-table-scroll').classes()).toContain('wp-table-scroll');
    wrapper.get('.repo-table');
    expect(wrapper.text()).not.toContain('repositories.');
  });

  it('distinguishes a repository-empty state from a filter with no matches', async () => {
    state.repoStore!.ownedRepos.splice(0);
    const emptyWrapper = mountRepos();
    await flushPromises();

    expect(emptyWrapper.get('[data-feedback-state="empty"]').text()).toContain('No repositories yet');

    state.repoStore!.ownedRepos.push(repository(1));
    const filteredWrapper = mountRepos();
    await flushPromises();
    await filteredWrapper.get('input[placeholder="Search repositories…"]').setValue('missing');

    expect(filteredWrapper.text()).toContain('No matching repositories');
  });

  it('filters, paginates, selects the current page, and resets pagination on filter changes', async () => {
    state.repoStore!.ownedRepos.splice(
      0,
      state.repoStore!.ownedRepos.length,
      ...Array.from({ length: 12 }, (_, index) => repository(index + 1, index % 4 === 0 ? 'failure' : 'success')),
    );
    const wrapper = mountRepos();
    await flushPromises();

    expect(wrapper.findAll('tbody tr')).toHaveLength(10);
    await wrapper.get('button[title="Next"]').trigger('click');
    expect(wrapper.text()).toContain('2 / 2');
    expect(wrapper.findAll('tbody tr')).toHaveLength(2);

    await wrapper.get('input[aria-label="Select repositories on this page"]').setValue(true);
    expect(wrapper.text()).toContain('2 selected');

    await wrapper.get('input[placeholder="Search repositories…"]').setValue('repo-1');
    expect(wrapper.text()).toContain('1 / 1');
  });

  it('shows initial loading, retries an active list failure, and keeps Forge failure partial', async () => {
    const pending = deferred<void>();
    state.repoStore!.ownedRepos.splice(0);
    state.repoStore!.loadRepos.mockReturnValueOnce(pending.promise);
    const wrapper = mountRepos();

    expect(wrapper.get('[data-feedback-state="loading"]').text()).toContain('Loading repositories');

    pending.reject(new Error('repositories offline'));
    await flushPromises();
    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Repositories could not be loaded');
    expect(wrapper.text()).not.toContain('repositories offline');

    state.repoStore!.loadRepos.mockImplementationOnce(() => {
      state.repoStore!.ownedRepos.push(repository(3));
    });
    await wrapper.get('[data-feedback-state="error"] button').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('acme/repo-3');

    state.api.getForges.mockRejectedValueOnce(new Error('forges offline'));
    const partialWrapper = mountRepos();
    await flushPromises();
    expect(partialWrapper.get('[data-feedback-state="error"]').text()).toContain('Some repository data is unavailable');
    expect(partialWrapper.text()).toContain('Forge #1');
  });

  it('requests repository metrics once when an empty store hydrates', async () => {
    state.repoStore!.ownedRepos.splice(0);
    state.repoStore!.loadRepos.mockImplementationOnce(() => {
      state.repoStore!.ownedRepos.push(repository(1), repository(2));
    });

    const wrapper = mountRepos();
    await flushPromises();

    expect(wrapper.text()).toContain('acme/repo-1');
    expect(state.api.getPipelineList).toHaveBeenCalledTimes(2);
    expect(state.api.getPipelineList).toHaveBeenCalledWith(1, { page: 1, perPage: 20 });
    expect(state.api.getPipelineList).toHaveBeenCalledWith(2, { page: 1, perPage: 20 });
  });

  it('preserves confirmed rows and metrics through a failed refresh', async () => {
    const wrapper = mountRepos();
    await flushPromises();
    expect(wrapper.text()).toContain('acme/repo-1');
    expect(wrapper.text()).toContain('100.0%');

    state.repoStore!.refreshRepos.mockRejectedValueOnce(new Error('refresh offline'));
    await wrapper.get('button[title="Refresh repositories"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('The last confirmed repository data');
    expect(wrapper.text()).not.toContain('refresh offline');
    expect(wrapper.text()).toContain('acme/repo-1');
    expect(wrapper.text()).toContain('100.0%');
  });

  it('keeps confirmed metrics when a refreshed statistics request fails', async () => {
    state.repoStore!.ownedRepos.splice(0, state.repoStore!.ownedRepos.length, repository(1));
    const wrapper = mountRepos();
    await flushPromises();
    expect(wrapper.get('tbody tr').text()).toContain('100.0%');

    state.api.getPipelineList.mockRejectedValueOnce(new Error('stats offline'));
    await wrapper.get('button[title="Refresh repositories"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-feedback-state="error"]').text()).toContain('Some repository data is unavailable');
    expect(wrapper.get('tbody tr').text()).toContain('100.0%');
  });

  it('discards obsolete per-repository metric completion after refresh', async () => {
    state.repoStore!.ownedRepos.splice(0, state.repoStore!.ownedRepos.length, repository(1));
    const wrapper = mountRepos();
    await flushPromises();
    expect(wrapper.get('tbody tr').text()).toContain('100.0%');

    const obsolete = deferred<Pipeline[]>();
    const current = deferred<Pipeline[]>();
    state.api.getPipelineList.mockReturnValueOnce(obsolete.promise).mockReturnValueOnce(current.promise);
    const firstRefresh = (
      wrapper.vm as unknown as { loadRepositories: (refresh: boolean) => Promise<void> }
    ).loadRepositories(true);
    await vi.waitFor(() => expect(state.api.getPipelineList).toHaveBeenCalledTimes(2));
    const secondRefresh = (
      wrapper.vm as unknown as { loadRepositories: (refresh: boolean) => Promise<void> }
    ).loadRepositories(true);
    await vi.waitFor(() => expect(state.api.getPipelineList).toHaveBeenCalledTimes(3));
    current.resolve([pipeline(20, 'success')]);
    await secondRefresh;
    obsolete.resolve([pipeline(10, 'failure')]);
    await firstRefresh;
    await flushPromises();

    const firstRow = wrapper.get('tbody tr');
    expect(firstRow.text()).toContain('100.0%');
  });
});
