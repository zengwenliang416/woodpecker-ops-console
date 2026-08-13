import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Alert, Deployment, Server, ServerGroup } from '~/lib/api/types';

import { useDeploymentStore, useServerStore } from './ops';

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
});
