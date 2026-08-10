import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Pipeline } from '~/lib/api/types';

import { usePipelineStore } from './pipelines';

const api = vi.hoisted(() => ({
  getPipelineList: vi.fn(),
}));

const repoStore = vi.hoisted(() => ({
  repos: new Map(),
  ownedRepoIds: [] as number[],
}));

vi.mock('~/compositions/useApiClient', () => ({ default: () => api }));
vi.mock('~/store/repos', () => ({ useRepoStore: () => repoStore }));

function pipeline(number: number): Pipeline {
  return {
    id: number,
    number,
    created: number,
    status: 'success',
  } as Pipeline;
}

function deferred<T>() {
  let resolveValue!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveValue = resolve;
  });
  return { promise, resolve: resolveValue };
}

describe('pipeline store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    repoStore.repos.clear();
    repoStore.ownedRepoIds = [];
  });

  it('keeps hasMore action-local when repository requests resolve together', async () => {
    const first = deferred<Pipeline[]>();
    const second = deferred<Pipeline[]>();
    api.getPipelineList.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const store = usePipelineStore();
    const actionResults = new Map<number, boolean>();
    store.$onAction(({ name, args, after }) => {
      if (name !== 'loadRepoPipelines') return;
      after((result) => {
        actionResults.set(args[0], result);
      });
    });

    const firstLoad = store.loadRepoPipelines(101, 1);
    const secondLoad = store.loadRepoPipelines(202, 1);
    first.resolve([]);
    second.resolve(Array.from({ length: 50 }, (_, index) => pipeline(index + 1)));

    await expect(firstLoad).resolves.toBe(false);
    await expect(secondLoad).resolves.toBe(true);
    expect(actionResults).toEqual(
      new Map([
        [101, false],
        [202, true],
      ]),
    );
  });
});
