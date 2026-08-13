import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import type { ComputedRef, Ref } from 'vue';

import useApiClient from '~/compositions/useApiClient';
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

interface OpsPageOptions {
  page: number;
  perPage: number;
}

interface Identifiable {
  id: number;
}

const OPS_PAGE_SIZE = 50;
const OPS_MAX_PAGES = 1000;

async function loadAllPages<T>(loader: (options: OpsPageOptions) => Promise<T[] | null>): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= OPS_MAX_PAGES; page += 1) {
    const batch = (await loader({ page, perPage: OPS_PAGE_SIZE })) ?? [];
    items.push(...batch);
    if (batch.length < OPS_PAGE_SIZE) {
      break;
    }
  }
  return items;
}

function syncMap<T extends Identifiable>(target: Map<number, T>, items: T[]): void {
  const nextIds = new Set(items.map((item) => item.id));
  target.forEach((_, id) => {
    if (!nextIds.has(id)) target.delete(id);
  });
  items.forEach((item) => target.set(item.id, { ...target.get(item.id), ...item }));
}

// ---------- Servers ----------

export const useServerStore = defineStore('ops-servers', () => {
  const apiClient = useApiClient();

  const servers: Map<number, Server> = reactive(new Map());
  const groups: Map<number, ServerGroup> = reactive(new Map());
  const alerts: Map<number, Alert> = reactive(new Map());
  const loaded = ref(false);
  let serverLoadGeneration = 0;
  let groupLoadGeneration = 0;
  let alertLoadGeneration = 0;

  const serverList = computed(() => [...servers.values()].sort((a, b) => a.id - b.id));
  const groupList = computed(() => [...groups.values()].sort((a, b) => a.id - b.id));
  const alertsList = computed(() => [...alerts.values()].sort((a, b) => b.id - a.id));
  const activeAlerts = computed(() => alertsList.value.filter((a) => a.status === 'active'));

  function getServer(serverId: Ref<number> | number) {
    const id = typeof serverId === 'number' ? serverId : serverId.value;
    return computed(() => servers.get(id));
  }

  function setServer(server: Server) {
    servers.set(server.id, { ...servers.get(server.id), ...server });
  }

  async function loadServers() {
    const generation = ++serverLoadGeneration;
    const list = await loadAllPages(async (options) => apiClient.getServers(options));
    if (generation === serverLoadGeneration) {
      syncMap(servers, list);
      loaded.value = true;
    }
    return list;
  }

  async function loadGroups() {
    const generation = ++groupLoadGeneration;
    const list = await loadAllPages(async (options) => apiClient.getServerGroups(options));
    if (generation === groupLoadGeneration) syncMap(groups, list);
    return list;
  }

  async function loadAlerts() {
    const generation = ++alertLoadGeneration;
    const list = await loadAllPages(async (options) => apiClient.getAlerts(options));
    if (generation === alertLoadGeneration) syncMap(alerts, list);
    return list;
  }

  async function loadAll() {
    await Promise.all([loadServers(), loadGroups(), loadAlerts()]);
  }

  return {
    servers,
    groups,
    alerts,
    loaded,
    serverList,
    groupList,
    alertsList,
    activeAlerts,
    getServer,
    setServer,
    loadServers,
    loadGroups,
    loadAlerts,
    loadAll,
  };
});

// ---------- Applications / Environments / Releases ----------

export const useApplicationStore = defineStore('ops-applications', () => {
  const apiClient = useApiClient();

  const applications: Map<number, Application> = reactive(new Map());
  const environments: Map<number, Environment> = reactive(new Map());
  const releases: Map<number, AppRelease> = reactive(new Map());
  let applicationLoadGeneration = 0;
  let environmentLoadGeneration = 0;
  let releaseLoadGeneration = 0;

  const applicationList = computed(() => [...applications.values()].sort((a, b) => a.id - b.id));
  const environmentList = computed(() => [...environments.values()].sort((a, b) => a.id - b.id));
  const releaseList = computed(() => [...releases.values()].sort((a, b) => b.id - a.id));

  function getApplication(appId: number) {
    return computed(() => applications.get(appId));
  }

  function getEnvironment(envId: number) {
    return computed(() => environments.get(envId));
  }

  async function loadApplications() {
    const generation = ++applicationLoadGeneration;
    const list = await loadAllPages(async (options) => apiClient.getApplications(options));
    if (generation === applicationLoadGeneration) syncMap(applications, list);
    return list;
  }

  async function loadEnvironments() {
    const generation = ++environmentLoadGeneration;
    const list = await loadAllPages(async (options) => apiClient.getEnvironments(options));
    if (generation === environmentLoadGeneration) syncMap(environments, list);
    return list;
  }

  async function loadReleases() {
    const generation = ++releaseLoadGeneration;
    const list = await loadAllPages(async (options) => apiClient.getReleases(options));
    if (generation === releaseLoadGeneration) syncMap(releases, list);
    return list;
  }

  async function loadAll() {
    await Promise.all([loadApplications(), loadEnvironments(), loadReleases()]);
  }

  function releasesOf(appId: number): ComputedRef<AppRelease[]> {
    return computed(() => releaseList.value.filter((r) => r.application_id === appId));
  }

  return {
    applications,
    environments,
    releases,
    applicationList,
    environmentList,
    releaseList,
    getApplication,
    getEnvironment,
    loadApplications,
    loadEnvironments,
    loadReleases,
    loadAll,
    releasesOf,
  };
});

// ---------- Deployments ----------

export const useDeploymentStore = defineStore('ops-deployments', () => {
  const apiClient = useApiClient();

  const deployments: Map<number, Deployment> = reactive(new Map());
  const details: Map<number, DeploymentDetail> = reactive(new Map());
  let deploymentLoadGeneration = 0;

  const deploymentList = computed(() => [...deployments.values()].sort((a, b) => b.id - a.id));
  const runningDeployments = computed(() =>
    deploymentList.value.filter((d) => ['running', 'paused', 'pending_approval'].includes(d.status)),
  );
  const pendingApprovals = computed(() => deploymentList.value.filter((d) => d.status === 'pending_approval'));

  function getDeployment(deploymentId: Ref<number> | number) {
    const id = typeof deploymentId === 'number' ? deploymentId : deploymentId.value;
    return computed(() => deployments.get(id));
  }

  function getDetail(deploymentId: number) {
    return computed(() => details.get(deploymentId));
  }

  function setDeployment(deployment: Deployment) {
    deployments.set(deployment.id, { ...deployments.get(deployment.id), ...deployment });
  }

  async function loadDeployments() {
    const generation = ++deploymentLoadGeneration;
    const list = await loadAllPages(async (options) => apiClient.getDeployments(options));
    if (generation === deploymentLoadGeneration) syncMap(deployments, list);
    return list;
  }

  async function loadDetail(deploymentId: number) {
    const detail = await apiClient.getDeployment(deploymentId);
    if (detail) {
      details.set(deploymentId, detail);
      setDeployment(detail.deployment);
    }
    return detail;
  }

  return {
    deployments,
    details,
    deploymentList,
    runningDeployments,
    pendingApprovals,
    getDeployment,
    getDetail,
    setDeployment,
    loadDeployments,
    loadDetail,
  };
});
