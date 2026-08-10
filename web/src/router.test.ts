import { afterEach, describe, expect, it, vi } from 'vitest';

describe('router base path', () => {
  afterEach(() => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: undefined });
    vi.resetModules();
  });

  it('keeps application routes base-relative when Woodpecker uses a root path', async () => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: '/woodpecker' });
    const { default: router } = await import('./router');

    expect(router.resolve('/overview').href).toBe('/woodpecker/overview');
    expect(router.resolve('/deployments/new').href).toBe('/woodpecker/deployments/new');
    expect(router.resolve('/infrastructure/servers/7').href).toBe('/woodpecker/infrastructure/servers/7');
  });

  it('resolves every pipeline destination without falling through the optional step route', async () => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: '/woodpecker' });
    const { default: router } = await import('./router');

    const destinations = [
      {
        name: 'repo-pipeline',
        params: { repoId: 101, pipelineId: 842 },
        path: '/repos/101/pipeline/842',
      },
      {
        name: 'repo-pipeline',
        params: { repoId: 101, pipelineId: 842, stepId: 12 },
        path: '/repos/101/pipeline/842/12',
      },
      {
        name: 'repo-pipeline-changed-files',
        params: { repoId: 101, pipelineId: 842 },
        path: '/repos/101/pipeline/842/changed-files',
      },
      {
        name: 'repo-pipeline-config',
        params: { repoId: 101, pipelineId: 842 },
        path: '/repos/101/pipeline/842/config',
      },
      {
        name: 'repo-pipeline-errors',
        params: { repoId: 101, pipelineId: 842 },
        path: '/repos/101/pipeline/842/errors',
      },
      {
        name: 'repo-pipeline-debug',
        params: { repoId: 101, pipelineId: 842 },
        path: '/repos/101/pipeline/842/debug',
      },
    ] as const;

    for (const { name, params, path } of destinations) {
      const route = router.resolve({ name, params });
      expect(route.href).toBe(`/woodpecker${path}`);

      const incomingRoute = router.resolve(path);
      expect(incomingRoute.matched.at(-1)?.name).toBe(name);
      expect(incomingRoute.params.repoId).toBe('101');
      expect(incomingRoute.params.pipelineId).toBe('842');
      if ('stepId' in params) {
        expect(incomingRoute.params.stepId).toBe(`${params.stepId}`);
      } else {
        expect(incomingRoute.params).not.toHaveProperty('stepId');
      }
    }
  });
});
