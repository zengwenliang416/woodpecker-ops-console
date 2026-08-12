import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';

import en from '~/assets/locales/en.json';
import type { Org, Repo } from '~/lib/api/types';

import OrgRepos from './OrgRepos.vue';

const state = vi.hoisted(() => ({
  repositories: new Map<number, Repo>(),
  loadRepos: vi.fn(),
}));

vi.mock('~/store/repos', () => ({
  useRepoStore: () => ({
    repos: state.repositories,
    loadRepos: state.loadRepos,
  }),
}));

vi.mock('~/compositions/useRepos', () => ({
  default: () => ({
    repoWithLastPipeline: (repo: Repo) => repo,
    sortReposByLastActivity: (repos: Repo[]) => repos,
  }),
}));

vi.mock('~/compositions/useWPTitle', () => ({
  useWPTitle: vi.fn(),
}));

const i18n = createI18n({ legacy: false, locale: 'en', messages: { en } });

function repository(id: number, orgId: number, name: string): Repo {
  return {
    id,
    org_id: orgId,
    owner: `org-${orgId}`,
    name,
    full_name: `org-${orgId}/${name}`,
    default_branch: 'main',
  } as Repo;
}

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

function mountRepos(
  org = ref<Org | undefined>({ id: 1, name: 'org-1', is_user: false } as Org),
  orgLifecycle = ref(1),
) {
  return {
    org,
    orgLifecycle,
    wrapper: mount(OrgRepos, {
      props: { orgId: '1' },
      global: {
        plugins: [i18n],
        provide: {
          org,
          'org-lifecycle': orgLifecycle,
        },
        stubs: {
          PrototypeIcon: true,
          RouterLink: {
            props: ['to'],
            template: '<a><slot /></a>',
          },
        },
      },
    }),
  };
}

describe('organization repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.repositories.clear();
    state.repositories.set(1, repository(1, 1, 'api'));
    state.repositories.set(2, repository(2, 2, 'other'));
    state.loadRepos.mockResolvedValue(undefined);
  });

  it('loads repositories and renders only the active organization', async () => {
    const { wrapper } = mountRepos();
    await flushPromises();

    expect(state.loadRepos).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('org-1/api');
    expect(wrapper.text()).not.toContain('org-2/other');
  });

  it('distinguishes search no-match from an empty organization', async () => {
    const { wrapper } = mountRepos();
    await flushPromises();
    await wrapper.get('input').setValue('missing');

    expect(wrapper.get('[data-feedback-state="empty"]').text()).toContain('No matching repositories');
    await wrapper.get('[data-feedback-state="empty"] button').trigger('click');
    expect(wrapper.text()).toContain('org-1/api');
  });

  it('ignores an obsolete list rejection after the route child unmounts', async () => {
    const load = deferred<void>();
    state.loadRepos.mockReturnValue(load.promise);
    const { org, orgLifecycle, wrapper } = mountRepos();
    wrapper.unmount();
    orgLifecycle.value = 2;
    org.value = undefined;

    load.reject(new Error('obsolete repositories failed'));
    await expect(load.promise).rejects.toThrow('obsolete repositories failed');
    await flushPromises();
  });
});
