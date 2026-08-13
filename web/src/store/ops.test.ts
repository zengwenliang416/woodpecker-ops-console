import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  Alert,
  Application,
  AppRelease,
  Deployment,
  DeploymentDetail,
  Environment,
  Server,
  ServerGroup,
} from '~/lib/api/types';

import { useApplicationStore, useDeploymentStore, useServerStore } from './ops';

const api = vi.hoisted(() => ({
  getServers: vi.fn(),
  getServerGroups: vi.fn(),
  getAlerts: vi.fn(),
  getApplications: vi.fn(),
  getEnvironments: vi.fn(),
  getReleases: vi.fn(),
  getDeployments: vi.fn(),
  getDeployment: vi.fn(),
}));

vi.mock('~/compositions/useApiClient', () => ({ default: () => api }));

function server(id: number): Server {
  return { id, name: `server-${id}` } as Server;
}

function deployment(id: number): Deployment {
  return { id, status: 'success' } as Deployment;
}

function application(id: number): Application {
  return { id, name: `app-${id}` } as Application;
}

function environment(id: number): Environment {
  return { id, name: `env-${id}` } as Environment;
}

function release(id: number): AppRelease {
  return { id, version: `v${id}` } as AppRelease;
}

function detail(id: number, status: Deployment['status'] = 'success'): DeploymentDetail {
  return {
    deployment: { ...deployment(id), status },
    targets: [],
    approvals: [],
  };
}

function group(id: number): ServerGroup {
  return { id, name: `group-${id}` } as ServerGroup;
}

function alert(id: number): Alert {
  return { id, status: 'active', message: `alert-${id}` } as Alert;
}

function deferred<T>() {
  let resolveValue!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveValue = resolve;
  });
  return { promise, resolve: resolveValue };
}

describe('ops stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('loads every server page and removes stale records', async () => {
    const firstPage = Array.from({ length: 50 }, (_, index) => server(index + 1));
    api.getServers
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce([server(51)])
      .mockResolvedValueOnce([server(2)]);

    const store = useServerStore();
    await store.loadServers();

    expect(api.getServers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 50 });
    expect(api.getServers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 50 });
    expect(store.serverList).toHaveLength(51);

    await store.loadServers();
    expect(store.serverList.map((item) => item.id)).toEqual([2]);
  });

  it('keeps the latest server refresh when requests finish out of order', async () => {
    const older = deferred<Server[]>();
    const latest = deferred<Server[]>();
    api.getServers.mockReturnValueOnce(older.promise).mockReturnValueOnce(latest.promise);

    const store = useServerStore();
    const olderLoad = store.loadServers();
    const latestLoad = store.loadServers();

    latest.resolve([server(2)]);
    await latestLoad;
    older.resolve([server(1)]);
    await olderLoad;

    expect(store.serverList.map((item) => item.id)).toEqual([2]);
  });

  it('marks servers loaded only after the newest refresh succeeds', async () => {
    const older = deferred<Server[]>();
    const latest = deferred<Server[]>();
    api.getServers.mockReturnValueOnce(older.promise).mockReturnValueOnce(latest.promise);

    const store = useServerStore();
    const olderLoad = store.loadServers();
    const latestLoad = store.loadServers();

    older.resolve([server(1)]);
    await olderLoad;
    expect(store.loaded).toBe(false);

    latest.resolve([server(2)]);
    await latestLoad;
    expect(store.loaded).toBe(true);
  });

  it('keeps the latest group refresh when requests finish out of order', async () => {
    const older = deferred<ServerGroup[]>();
    const latest = deferred<ServerGroup[]>();
    api.getServerGroups.mockReturnValueOnce(older.promise).mockReturnValueOnce(latest.promise);

    const store = useServerStore();
    const olderLoad = store.loadGroups();
    const latestLoad = store.loadGroups();

    latest.resolve([group(2)]);
    await latestLoad;
    older.resolve([group(1)]);
    await olderLoad;

    expect(store.groupList.map((item) => item.id)).toEqual([2]);
  });

  it('keeps the latest alert refresh when requests finish out of order', async () => {
    const older = deferred<Alert[]>();
    const latest = deferred<Alert[]>();
    api.getAlerts.mockReturnValueOnce(older.promise).mockReturnValueOnce(latest.promise);

    const store = useServerStore();
    const olderLoad = store.loadAlerts();
    const latestLoad = store.loadAlerts();

    latest.resolve([alert(2)]);
    await latestLoad;
    older.resolve([alert(1)]);
    await olderLoad;

    expect(store.alertsList.map((item) => item.id)).toEqual([2]);
  });

  it('loads every deployment page for approval and history views', async () => {
    api.getDeployments
      .mockResolvedValueOnce(Array.from({ length: 50 }, (_, index) => deployment(index + 1)))
      .mockResolvedValueOnce([deployment(51)]);

    const store = useDeploymentStore();
    await store.loadDeployments();

    expect(api.getDeployments).toHaveBeenCalledTimes(2);
    expect(store.deploymentList).toHaveLength(51);
    expect(store.deploymentList[0].id).toBe(51);
  });

  it('keeps the latest application, environment, and release refreshes', async () => {
    const olderApplications = deferred<Application[]>();
    const currentApplications = deferred<Application[]>();
    const olderEnvironments = deferred<Environment[]>();
    const currentEnvironments = deferred<Environment[]>();
    const olderReleases = deferred<AppRelease[]>();
    const currentReleases = deferred<AppRelease[]>();
    api.getApplications.mockReturnValueOnce(olderApplications.promise).mockReturnValueOnce(currentApplications.promise);
    api.getEnvironments.mockReturnValueOnce(olderEnvironments.promise).mockReturnValueOnce(currentEnvironments.promise);
    api.getReleases.mockReturnValueOnce(olderReleases.promise).mockReturnValueOnce(currentReleases.promise);

    const store = useApplicationStore();
    const older = Promise.all([store.loadApplications(), store.loadEnvironments(), store.loadReleases()]);
    const current = Promise.all([store.loadApplications(), store.loadEnvironments(), store.loadReleases()]);

    currentApplications.resolve([application(2)]);
    currentEnvironments.resolve([environment(2)]);
    currentReleases.resolve([release(2)]);
    await current;
    olderApplications.resolve([application(1)]);
    olderEnvironments.resolve([environment(1)]);
    olderReleases.resolve([release(1)]);
    await older;

    expect(store.applicationList.map((item) => item.id)).toEqual([2]);
    expect(store.environmentList.map((item) => item.id)).toEqual([2]);
    expect(store.releaseList.map((item) => item.id)).toEqual([2]);
  });

  it('keeps the latest deployment refresh when requests finish out of order', async () => {
    const older = deferred<Deployment[]>();
    const current = deferred<Deployment[]>();
    api.getDeployments.mockReturnValueOnce(older.promise).mockReturnValueOnce(current.promise);
    const store = useDeploymentStore();

    const olderLoad = store.loadDeployments();
    const currentLoad = store.loadDeployments();
    current.resolve([deployment(2)]);
    await currentLoad;
    older.resolve([deployment(1)]);
    await olderLoad;

    expect(store.deploymentList.map((item) => item.id)).toEqual([2]);
  });

  it('keeps the latest detail refresh for one deployment', async () => {
    const older = deferred<DeploymentDetail | null>();
    const current = deferred<DeploymentDetail | null>();
    api.getDeployment.mockReturnValueOnce(older.promise).mockReturnValueOnce(current.promise);
    const store = useDeploymentStore();

    const olderLoad = store.loadDetail(7);
    const currentLoad = store.loadDetail(7);
    current.resolve(detail(7, 'running'));
    await currentLoad;
    older.resolve(detail(7, 'failed'));
    await olderLoad;

    expect(store.details.get(7)?.deployment.status).toBe('running');
    expect(store.deployments.get(7)?.status).toBe('running');
  });
});
