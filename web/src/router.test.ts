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
  }, 15_000);

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
  }, 15_000);

  it('resolves every non-pipeline repository destination from names and inbound paths', async () => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: '/woodpecker' });
    const { default: router } = await import('./router');

    const destinations = [
      { name: 'repos', path: '/repos', params: {}, authentication: 'required' },
      { name: 'repo-add', path: '/repos/add', params: {}, authentication: 'required' },
      { name: 'repo', path: '/repos/101', params: { repoId: 101 }, repoHeader: true },
      { name: 'repo-branches', path: '/repos/101/branches', params: { repoId: 101 }, repoHeader: true },
      {
        name: 'repo-branch',
        path: '/repos/101/branches/release%2F2026.08',
        params: { repoId: 101, branch: 'release/2026.08' },
        repoHeader: true,
      },
      {
        name: 'repo-pull-requests',
        path: '/repos/101/pull-requests',
        params: { repoId: 101 },
        repoHeader: true,
      },
      {
        name: 'repo-pull-request',
        path: '/repos/101/pull-requests/92',
        params: { repoId: 101, pullRequest: 92 },
        repoHeader: true,
      },
      {
        name: 'repo-manual',
        path: '/repos/101/manual',
        params: { repoId: 101 },
        authentication: 'required',
        repoHeader: true,
      },
      { name: 'repo-settings', path: '/repos/101/settings', params: { repoId: 101 }, authentication: 'required' },
      {
        name: 'repo-settings-secrets',
        path: '/repos/101/settings/secrets',
        params: { repoId: 101 },
        authentication: 'required',
      },
      {
        name: 'repo-settings-registries',
        path: '/repos/101/settings/registries',
        params: { repoId: 101 },
        authentication: 'required',
      },
      {
        name: 'repo-settings-crons',
        path: '/repos/101/settings/crons',
        params: { repoId: 101 },
        authentication: 'required',
      },
      {
        name: 'repo-settings-badge',
        path: '/repos/101/settings/badge',
        params: { repoId: 101 },
        authentication: 'required',
      },
      {
        name: 'repo-settings-actions',
        path: '/repos/101/settings/actions',
        params: { repoId: 101 },
        authentication: 'required',
      },
      {
        name: 'repo-settings-extensions',
        path: '/repos/101/settings/extensions',
        params: { repoId: 101 },
        authentication: 'required',
      },
    ] as const;

    for (const destination of destinations) {
      const route = router.resolve({
        name: destination.name,
        params: destination.params,
      });
      expect(route.href).toBe(`/woodpecker${destination.path}`);

      const incomingRoute = router.resolve(destination.path);
      expect(incomingRoute.matched.at(-1)?.name).toBe(destination.name);
      if ('repoId' in destination.params) {
        expect(incomingRoute.params.repoId).toBe('101');
      }
      if ('branch' in destination.params) {
        expect(incomingRoute.params.branch).toBe(destination.params.branch);
      }
      if ('pullRequest' in destination.params) {
        expect(incomingRoute.params.pullRequest).toBe(`${destination.params.pullRequest}`);
      }
      if ('authentication' in destination) {
        expect(incomingRoute.meta.authentication).toBe(destination.authentication);
      } else {
        expect(incomingRoute.meta.authentication).toBeUndefined();
      }
      if ('repoHeader' in destination) {
        expect(incomingRoute.meta.repoHeader).toBe(destination.repoHeader);
      } else {
        expect(incomingRoute.meta.repoHeader).toBeUndefined();
      }
    }
  }, 15_000);
});
