import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import type { Ref } from 'vue';

import useApiClient from '~/compositions/useApiClient';
import useConfig from '~/compositions/useConfig';
import { usePaginate } from '~/compositions/usePaginate';
import type { Repo } from '~/lib/api/types';

import { usePipelineStore } from './pipelines';

export const useRepoStore = defineStore('repos', () => {
  const apiClient = useApiClient();
  const pipelineStore = usePipelineStore();

  const repos: Map<number, Repo> = reactive(new Map());
  const ownedRepoIds = ref<number[]>([]);
  let loadReposGeneration = 0;

  const ownedRepos = computed(() =>
    [...repos.entries()].filter(([repoId]) => ownedRepoIds.value.includes(repoId)).map(([, repo]) => repo),
  );

  function getRepo(repoId: Ref<number>) {
    return computed(() => repos.get(repoId.value));
  }

  function setRepo(repo: Repo) {
    repos.set(repo.id, {
      ...repos.get(repo.id),
      ...repo,
    });
  }

  async function loadRepo(repoId: number) {
    const repo = await apiClient.getRepo(repoId);
    setRepo(repo);
    return repo;
  }

  async function loadRepos() {
    const requestGeneration = ++loadReposGeneration;
    const _ownedRepos = await apiClient.getRepoList();

    // If the current user is a system admin, also hydrate the store with all repos (paginated)
    const { user } = useConfig();
    const isSystemAdmin = !!user?.admin;
    let allRepos: Repo[] = [];
    if (isSystemAdmin) {
      allRepos = await usePaginate<Repo>(async (page: number) => apiClient.getAllRepos({ page }).then((r) => r ?? []));
    }

    if (requestGeneration !== loadReposGeneration) {
      return;
    }

    const hydrateRepos = (rows: Repo[]) => {
      rows.forEach((repo) => {
        if (repo.last_pipeline) {
          pipelineStore.setPipeline(repo.id, repo.last_pipeline);
          repo.last_pipeline_number = repo.last_pipeline.number;
        }
        setRepo(repo);
      });
    };

    hydrateRepos(_ownedRepos);
    ownedRepoIds.value = _ownedRepos.map((repo) => repo.id);
    hydrateRepos(allRepos);
  }

  async function refreshRepos() {
    await apiClient.refreshRepoList();
  }

  return {
    repos,
    ownedRepos,
    ownedRepoIds,
    getRepo,
    setRepo,
    loadRepo,
    loadRepos,
    refreshRepos,
  };
});
