import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';
import type { ComputedRef, Ref  } from 'vue';

import useApiClient from '~/compositions/useApiClient';
import type {
  Alert,
  AppRelease,
  Application,
  Deployment,
  DeploymentDetail,
  Environment,
  Server,
  ServerGroup,
} from '~/lib/api/types';

// ---------- Servers ----------

export const useServerStore = defineStore('ops-servers', () => {
  const apiClient = useApiClient();

  const servers: Map<number, Server> = reactive(new Map());
  const groups: Map<number, ServerGroup> = reactive(new Map());
  const alerts: Map<number, Alert> = reactive(new Map());
  const loaded = ref(false);

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
    const list = (await apiClient.getServers()) ?? [];
    list.forEach((server) => setServer(server));
    loaded.value = true;
    return list;
  }

  async function loadGroups() {
    const list = (await apiClient.getServerGroups()) ?? [];
    list.forEach((group) => groups.set(group.id, { ...groups.get(group.id), ...group }));
    return list;
  }

  async function loadAlerts() {
    const list = (await apiClient.getAlerts()) ?? [];
    list.forEach((alert) => alerts.set(alert.id, { ...alerts.get(alert.id), ...alert }));
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
    const list = (await apiClient.getApplications()) ?? [];
    list.forEach((app) => applications.set(app.id, { ...applications.get(app.id), ...app }));
    return list;
  }

  async function loadEnvironments() {
    const list = (await apiClient.getEnvironments()) ?? [];
    list.forEach((env) => environments.set(env.id, { ...environments.get(env.id), ...env }));
    return list;
  }

  async function loadReleases() {
    const list = (await apiClient.getReleases()) ?? [];
    list.forEach((release) => releases.set(release.id, { ...releases.get(release.id), ...release }));
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

  const deploymentList = computed(() => [...deployments.values()].sort((a, b) => b.id - a.id));
  const runningDeployments = computed(() => deploymentList.value.filter((d) => ['running', 'paused', 'pending_approval'].includes(d.status)));
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
    const list = (await apiClient.getDeployments()) ?? [];
    list.forEach((deployment) => setDeployment(deployment));
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
