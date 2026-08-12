import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Pipeline, Repo } from '~/lib/api/types';

import { useRepoStore } from './repos';

const api = vi.hoisted(() => ({
  getRepoList: vi.fn(),
  getAllRepos: vi.fn(),
}));

const pipelineStore = vi.hoisted(() => ({
  setPipeline: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({ default: () => api }));
vi.mock('~/compositions/useConfig', () => ({ default: () => ({ user: null }) }));
vi.mock('~/store/pipelines', () => ({ usePipelineStore: () => pipelineStore }));

function repository(id: number, name: string, pipelineNumber?: number): Repo {
  return {
    id,
    name,
    owner: 'acme',
    full_name: `acme/${name}`,
    last_pipeline:
      pipelineNumber !== undefined
        ? ({ id: pipelineNumber, number: pipelineNumber, status: 'success' } as Pipeline)
        : undefined,
  } as Repo;
}

function deferred<T>() {
  let resolveValue!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveValue = resolve;
  });
  return { promise, resolve: resolveValue };
}

describe('repository store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('allows only the latest overlapping repository request to hydrate shared state', async () => {
    const obsolete = deferred<Repo[]>();
    const current = deferred<Repo[]>();
    api.getRepoList.mockReturnValueOnce(obsolete.promise).mockReturnValueOnce(current.promise);
    const store = useRepoStore();

    const obsoleteLoad = store.loadRepos();
    const currentLoad = store.loadRepos();
    current.resolve([repository(2, 'current', 22)]);
    await currentLoad;
    obsolete.resolve([repository(1, 'obsolete', 11)]);
    await obsoleteLoad;

    expect([...store.repos.values()].map((repo) => repo.full_name)).toEqual(['acme/current']);
    expect(store.ownedRepoIds).toEqual([2]);
    expect(pipelineStore.setPipeline).toHaveBeenCalledTimes(1);
    expect(pipelineStore.setPipeline).toHaveBeenCalledWith(2, expect.objectContaining({ number: 22 }));
  });
});
