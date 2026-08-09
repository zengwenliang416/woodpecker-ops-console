<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline -->
  <Scaffold :go-back="() => router.push('/infrastructure/servers')" full-width-header fluid-content>
    <template #title>
      <span class="server-title"
        ><span>{{ server?.name ?? '...' }}</span
        ><span v-if="server" class="health-badge" :class="healthClass(server.health)">{{
          healthLabel(server.health)
        }}</span
        ><span
          v-if="server"
          class="health-badge"
          :class="server.status === 'online' ? 'health-healthy' : 'health-maintenance'"
          >{{ server.status }}</span
        ></span
      >
    </template>
    <template #headerActions>
      <Button
        :text="server?.maintenance ? $t('ops.server.exit_maintenance') : $t('ops.server.enter_maintenance')"
        :color="server?.maintenance ? 'gray' : 'red'"
        @click="toggleMaintenance"
      />
      <Button
        start-icon="rocket"
        color="green"
        :text="$t('ops.server.deploy_to_node')"
        :to="{ path: '/deployments/new', query: { serverId: server?.id } }"
      />
    </template>

    <div class="ops-page">
      <div v-if="server" class="page-stack">
        <div class="server-meta">
          <span>{{ environmentName }}</span
          ><span>{{ $t('ops.server.region') }}: {{ server.region || '—' }} · {{ server.zone || '—' }}</span
          ><span class="wp-mono">{{ $t('ops.server.ip') }}: {{ server.private_ip || '—' }}</span
          ><span>{{ relativeHeartbeat(server.last_heartbeat) }}</span>
        </div>

        <nav class="server-tabs" aria-label="服务器详情">
          <router-link v-for="tab in tabs" :key="tab.key" :to="tab.to" :class="{ active: currentTab === tab.key }">
            <Icon :name="tab.icon" /><span>{{ tab.label }}</span
            ><span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
          </router-link>
        </nav>

        <template v-if="currentTab === 'overview'">
          <div class="metric-grid">
            <OpsMetricCard
              label="CPU"
              :value="`${server.cpu.toFixed(0)}%`"
              :hint="`${$t('ops.server.load')} ${server.load.toFixed(2)}`"
              icon="cpu"
              :chart-values="server.metrics?.cpu"
              :tone="metricTone(server.cpu)"
            />
            <OpsMetricCard
              :label="$t('ops.server.memory')"
              :value="`${server.memory.toFixed(0)}%`"
              hint="Node Agent 采样"
              icon="memory"
              :chart-values="server.metrics?.memory"
              :tone="metricTone(server.memory)"
            />
            <OpsMetricCard
              :label="$t('ops.server.disk')"
              :value="`${server.disk.toFixed(0)}%`"
              hint="根磁盘使用率"
              icon="disk"
              :chart-values="server.metrics?.disk"
              :tone="metricTone(server.disk)"
            />
            <OpsMetricCard
              label="网络"
              :value="`${latestNetwork.toFixed(0)} Mb/s`"
              hint="当前吞吐"
              icon="activity"
              :chart-values="server.metrics?.network"
              :chart-max="networkMax"
              tone="info"
            />
          </div>

          <div class="detail-grid">
            <section class="wp-card">
              <div class="wp-card-header">
                <div>
                  <h2>{{ $t('ops.server.details') }}</h2>
                  <p>Node Agent、运行时与操作系统</p>
                </div>
              </div>
              <div class="detail-list">
                <div>
                  <span>环境</span><strong>{{ environmentName }}</strong>
                </div>
                <div>
                  <span>服务器组</span
                  ><router-link class="text-wp-link-100" :to="`/infrastructure/groups/${server.group_id}`">
                    {{ groupName }}
                  </router-link>
                </div>
                <div>
                  <span>{{ $t('ops.server.region') }}</span
                  ><strong>{{ server.region || '—' }} / {{ server.zone || '—' }}</strong>
                </div>
                <div>
                  <span>操作系统</span><strong>{{ server.os || '—' }} · {{ server.kernel || '—' }}</strong>
                </div>
                <div>
                  <span>运行时</span><strong>{{ server.runtime || '—' }}</strong>
                </div>
                <div>
                  <span>Agent</span><strong>{{ server.agent_version || '—' }}</strong>
                </div>
                <div>
                  <span>在线时长</span><strong>{{ formatUptime(server.uptime_seconds) }}</strong>
                </div>
                <div>
                  <span>证书序列号</span><code>{{ server.cert_serial || '—' }}</code>
                </div>
              </div>
            </section>

            <aside class="side-stack">
              <section class="wp-card">
                <div class="wp-card-header">
                  <h2>{{ $t('ops.server.labels') }}</h2>
                </div>
                <div class="wp-card-body label-list">
                  <span v-for="(value, key) in server.labels" :key="key" class="label-chip"
                    ><strong>{{ key }}</strong
                    >= {{ value }}</span
                  ><span v-if="!server.labels || Object.keys(server.labels).length === 0" class="wp-muted"
                    >暂无标签</span
                  >
                </div>
              </section>
              <section class="wp-card">
                <div class="wp-card-header">
                  <h2>活动告警</h2>
                  <router-link class="text-wp-link-100 text-xs" to="/infrastructure/alerts">全部</router-link>
                </div>
                <div class="wp-card-body compact-list">
                  <router-link
                    v-for="alert in serverAlerts.slice(0, 4)"
                    :key="alert.id"
                    to="/infrastructure/alerts"
                    class="compact-item"
                  >
                    <Icon name="alert" :class="severityTextClass(alert.severity)" /><span
                      ><strong>{{ alert.message }}</strong
                      ><small>{{ formatTimestamp(alert.created) }}</small></span
                    >
                  </router-link>
                  <span v-if="serverAlerts.length === 0" class="wp-muted">该节点没有活动告警。</span>
                </div>
              </section>
            </aside>
          </div>
        </template>

        <template v-else-if="currentTab === 'monitoring'">
          <div class="monitor-toolbar">
            <div class="segment-control">
              <button class="active">1 小时</button><button>6 小时</button><button>24 小时</button><button>7 天</button>
            </div>
            <Button start-icon="download" text="导出指标" />
            <Button start-icon="refresh" :text="$t('refresh')" @click="reload" />
          </div>
          <div v-if="!server.metrics?.cpu?.length" class="wp-alert wp-alert-info">
            <Icon name="info" /><span>{{ $t('ops.server.no_metrics') }}</span>
          </div>
          <div class="monitor-grid">
            <OpsMetricPanel
              label="CPU 使用率"
              :value="server.cpu"
              :values="server.metrics?.cpu"
              icon="cpu"
              :threshold="85"
            />
            <OpsMetricPanel
              label="内存使用率"
              :value="server.memory"
              :values="server.metrics?.memory"
              icon="memory"
              :threshold="90"
            />
            <OpsMetricPanel
              label="根磁盘使用率"
              :value="server.disk"
              :values="server.metrics?.disk"
              icon="disk"
              :threshold="85"
            />
            <OpsMetricPanel
              label="网络吞吐"
              :value="latestNetwork"
              :values="server.metrics?.network"
              icon="activity"
              unit=" Mb/s"
            />
          </div>
        </template>

        <template v-else-if="currentTab === 'workloads'">
          <section class="wp-card">
            <div class="wp-card-header">
              <div>
                <h2>服务与容器</h2>
                <p>由 {{ server.runtime || '运行时' }} 上报的工作负载</p>
              </div>
              <Button start-icon="refresh" :text="$t('refresh')" @click="reload" />
            </div>
            <div class="wp-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>服务</th>
                    <th>运行时</th>
                    <th>状态</th>
                    <th>实例</th>
                    <th>CPU</th>
                    <th>内存</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="service in serverServices" :key="`${service.server_id}-${service.server_name}`">
                    <td>
                      <strong>{{ service.server_name }}</strong>
                    </td>
                    <td>{{ service.runtime }}</td>
                    <td>
                      <span
                        class="health-badge"
                        :class="service.status === 'healthy' ? 'health-healthy' : 'health-warning'"
                        >{{ service.status }}</span
                      >
                    </td>
                    <td>{{ service.containers }}</td>
                    <td>{{ service.cpu.toFixed(0) }}%</td>
                    <td>{{ service.memory.toFixed(0) }}%</td>
                    <td><Button size="sm" start-icon="refresh" text="重启" @click="restartNode" /></td>
                  </tr>
                  <tr v-if="serverServices.length === 0">
                    <td colspan="7" class="wp-empty-state">
                      <strong>暂无工作负载数据</strong>
                      <p>等待 Node Agent 上报容器或服务状态。</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>

        <template v-else-if="currentTab === 'deployments'">
          <section class="wp-card">
            <div class="wp-card-header">
              <div>
                <h2>{{ $t('ops.server.deployments') }}</h2>
                <p>该节点参与过的发布记录</p>
              </div>
              <Button
                color="green"
                start-icon="rocket"
                text="部署到此节点"
                :to="{ path: '/deployments/new', query: { serverId: server.id } }"
              />
            </div>
            <div class="wp-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>状态</th>
                    <th>策略</th>
                    <th>进度</th>
                    <th>触发人</th>
                    <th>开始</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="deployment in deployments" :key="deployment.id">
                    <td>
                      <router-link class="text-wp-link-100" :to="`/deployments/${deployment.id}`">
                        DEP-{{ deployment.id }}
                      </router-link>
                    </td>
                    <td>
                      <span class="health-badge" :class="deploymentStatusClass(deployment.status)">{{
                        deployment.status
                      }}</span>
                    </td>
                    <td>{{ deployment.strategy }} · {{ deployment.batch_size }}</td>
                    <td>
                      <div class="progress-inline">
                        <span><i :style="{ width: `${deployment.progress}%` }" /></span
                        ><small>{{ deployment.progress }}%</small>
                      </div>
                    </td>
                    <td>{{ deployment.triggered_by || '—' }}</td>
                    <td>{{ formatTimestamp(deployment.started_at) }}</td>
                  </tr>
                  <tr v-if="deployments.length === 0">
                    <td colspan="6" class="wp-empty-state">
                      <strong>{{ $t('ops.server.no_deployments') }}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>

        <template v-else-if="currentTab === 'events'">
          <section class="wp-card">
            <div class="wp-card-header">
              <div>
                <h2>节点事件</h2>
                <p>告警、部署和 Node Agent 状态变更</p>
              </div>
            </div>
            <div class="event-timeline">
              <div v-for="event in events" :key="event.key" class="event-row">
                <span class="event-dot" :class="event.tone" />
                <div>
                  <strong>{{ event.title }}</strong>
                  <p>{{ event.detail }}</p>
                </div>
                <time>{{ event.time }}</time>
              </div>
              <div v-if="events.length === 0" class="wp-empty-state"><strong>暂无事件</strong></div>
            </div>
          </section>
        </template>

        <template v-else>
          <div class="settings-grid">
            <section class="wp-card">
              <div class="wp-card-header">
                <div>
                  <h2>Node Agent</h2>
                  <p>管理代理进程和诊断信息</p>
                </div>
              </div>
              <div class="setting-list">
                <div>
                  <span
                    ><strong>连接状态</strong
                    ><small>最近心跳 {{ relativeHeartbeat(server.last_heartbeat) }}</small></span
                  ><span
                    class="health-badge"
                    :class="server.status === 'online' ? 'health-healthy' : 'health-critical'"
                    >{{ server.status }}</span
                  >
                </div>
                <div>
                  <span><strong>重启 Node Agent</strong><small>重新启动代理并恢复心跳</small></span
                  ><Button start-icon="refresh" text="重启" @click="restartNode" />
                </div>
                <div>
                  <span><strong>复制诊断信息</strong><small>包含服务器 ID、版本与证书序列号</small></span
                  ><Button start-icon="download" text="复制" @click="copyDiagnostics" />
                </div>
              </div>
            </section>
            <section class="wp-card danger-card">
              <div class="wp-card-header">
                <div>
                  <h2>危险操作</h2>
                  <p>这些操作会影响节点调度和证书</p>
                </div>
              </div>
              <div class="setting-list">
                <div>
                  <span
                    ><strong>{{ server.maintenance ? '退出维护模式' : '进入维护模式' }}</strong
                    ><small>维护中的节点不会接收新部署任务</small></span
                  ><Button
                    :color="server.maintenance ? 'gray' : 'red'"
                    :text="server.maintenance ? '退出维护' : '进入维护'"
                    @click="toggleMaintenance"
                  />
                </div>
                <div>
                  <span><strong>移除服务器</strong><small>吊销节点注册并从控制面删除</small></span
                  ><Button color="red" start-icon="trash" text="移除" @click="removeServer" />
                </div>
              </div>
            </section>
          </div>
        </template>
      </div>
      <div v-else class="loading-state"><Icon name="spinner" class="animate-spin" /></div>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline -->
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import Icon from '~/components/atomic/Icon.vue';
import type { IconNames } from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import OpsMetricCard from '~/components/ops/OpsMetricCard.vue';
import OpsMetricPanel from '~/components/ops/OpsMetricPanel.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Alert, Deployment, Server } from '~/lib/api/types';
import { useApplicationStore, useServerStore } from '~/store/ops';

interface ServiceView {
  server_id: number;
  server_name: string;
  runtime: string;
  status: string;
  containers: number;
  cpu: number;
  memory: number;
}

type ServerTab = 'overview' | 'monitoring' | 'workloads' | 'deployments' | 'events' | 'settings';

const route = useRoute();
const router = useRouter();
const apiClient = useApiClient();
const serverStore = useServerStore();
const applicationStore = useApplicationStore();
const { t } = useI18n();

const server = ref<Server | null>(null);
const deployments = ref<Deployment[]>([]);
const services = ref<ServiceView[]>([]);
const serverId = computed(() => Number(route.params.serverId));
const validTabs: ServerTab[] = ['overview', 'monitoring', 'workloads', 'deployments', 'events', 'settings'];
const currentTab = computed<ServerTab>(() =>
  validTabs.includes(route.query.tab as ServerTab) ? (route.query.tab as ServerTab) : 'overview',
);

useWPTitle(computed(() => [server.value?.name ?? t('ops.servers.title')]));

const serverAlerts = computed<Alert[]>(() =>
  serverStore.alertsList.filter((alert) => alert.server_id === serverId.value && alert.status !== 'resolved'),
);
const serverServices = computed(() => services.value.filter((service) => service.server_id === serverId.value));
const environmentName = computed(
  () =>
    applicationStore.environments.get(server.value?.environment_id ?? 0)?.title ??
    applicationStore.environments.get(server.value?.environment_id ?? 0)?.name ??
    '—',
);
const groupName = computed(() => serverStore.groups.get(server.value?.group_id ?? 0)?.name ?? '—');
const latestNetwork = computed(() => server.value?.metrics?.network.at(-1) ?? 0);
const networkMax = computed(() => Math.max(100, ...(server.value?.metrics?.network ?? [])));

const tabs = computed<
  Array<{
    key: ServerTab;
    label: string;
    icon: IconNames;
    count?: number;
    to: { path: string; query?: { tab: ServerTab } };
  }>
>(() => [
  { key: 'overview', label: t('ops.server.details'), icon: 'overview', to: { path: route.path } },
  {
    key: 'monitoring',
    label: t('ops.server.metrics'),
    icon: 'activity',
    to: { path: route.path, query: { tab: 'monitoring' } },
  },
  {
    key: 'workloads',
    label: '服务与容器',
    icon: 'docker',
    count: serverServices.value.length || undefined,
    to: { path: route.path, query: { tab: 'workloads' } },
  },
  {
    key: 'deployments',
    label: '部署',
    icon: 'rocket',
    count: deployments.value.length || undefined,
    to: { path: route.path, query: { tab: 'deployments' } },
  },
  {
    key: 'events',
    label: '事件',
    icon: 'since',
    count: serverAlerts.value.length || undefined,
    to: { path: route.path, query: { tab: 'events' } },
  },
  { key: 'settings', label: '配置', icon: 'settings', to: { path: route.path, query: { tab: 'settings' } } },
]);

const events = computed(() => {
  const alertEvents = serverAlerts.value.map((alert) => ({
    key: `alert-${alert.id}`,
    title: alert.message,
    detail: `${alert.type} · ${alert.status}`,
    time: formatTimestamp(alert.created),
    tone: alert.severity === 'critical' ? 'danger' : 'warning',
  }));
  const deploymentEvents = deployments.value.slice(0, 8).map((deployment) => ({
    key: `deployment-${deployment.id}`,
    title: `Deployment DEP-${deployment.id} ${deployment.status}`,
    detail: `${deployment.strategy} · ${deployment.triggered_by || 'system'}`,
    time: formatTimestamp(deployment.updated ?? deployment.started_at),
    tone: deployment.status === 'success' ? 'success' : deployment.status === 'failed' ? 'danger' : 'info',
  }));
  return [...alertEvents, ...deploymentEvents];
});

let pollTimer: ReturnType<typeof setInterval> | undefined;
let disposed = false;
let loadingServerId: number | undefined;

async function reload() {
  const requestedId = serverId.value;
  if (loadingServerId === requestedId) return;
  loadingServerId = requestedId;
  try {
    const [nextServer, nextDeployments, nextServices] = await Promise.all([
      apiClient.getServer(requestedId),
      apiClient.getServerDeployments(requestedId),
      apiClient.getOpsServices(),
      serverStore.loadGroups(),
      serverStore.loadAlerts(),
      applicationStore.loadEnvironments(),
    ]);
    if (disposed || requestedId !== serverId.value) return;
    server.value = nextServer;
    deployments.value = nextDeployments ?? [];
    services.value = nextServices as ServiceView[];
  } finally {
    if (loadingServerId === requestedId) loadingServerId = undefined;
  }
}

async function toggleMaintenance() {
  if (!server.value) return;
  server.value = await apiClient.setServerMaintenance(serverId.value, !server.value.maintenance);
}

async function restartNode() {
  await apiClient.restartServer(serverId.value);
  await reload();
}

async function copyDiagnostics() {
  if (!server.value) return;
  await navigator.clipboard.writeText(
    JSON.stringify(
      {
        id: server.value.id,
        name: server.value.name,
        agent_version: server.value.agent_version,
        cert_serial: server.value.cert_serial,
        status: server.value.status,
      },
      null,
      2,
    ),
  );
}

async function removeServer() {
  // eslint-disable-next-line no-alert
  if (!server.value || !window.confirm(`确认移除服务器 ${server.value.name}？`)) return;
  await apiClient.deleteServer(server.value.id);
  await router.push('/infrastructure/servers');
}

function healthLabel(health: Server['health']): string {
  return { healthy: '健康', warning: '警告', critical: '严重', maintenance: '维护中' }[health];
}

function healthClass(health: Server['health']): string {
  return `health-${health}`;
}
function severityTextClass(severity: string): string {
  return severity === 'critical'
    ? 'text-wp-error-100'
    : severity === 'warning'
      ? 'text-wp-state-warn-100'
      : 'text-wp-state-info-100';
}
function metricTone(value: number): 'success' | 'warning' | 'danger' {
  return value >= 85 ? 'danger' : value >= 70 ? 'warning' : 'success';
}
function deploymentStatusClass(status: Deployment['status']): string {
  return status === 'success'
    ? 'health-healthy'
    : ['failed', 'cancelled', 'rejected'].includes(status)
      ? 'health-critical'
      : status === 'pending_approval'
        ? 'health-warning'
        : 'health-maintenance';
}
function relativeHeartbeat(timestamp?: number): string {
  if (!timestamp) return '无心跳';
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
  return seconds < 60
    ? `${seconds} 秒前`
    : seconds < 3600
      ? `${Math.floor(seconds / 60)} 分钟前`
      : `${Math.floor(seconds / 3600)} 小时前`;
}
function formatTimestamp(timestamp?: number): string {
  return timestamp ? new Date(timestamp * 1000).toLocaleString() : '—';
}
function formatUptime(seconds?: number): string {
  if (!seconds) return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days} 天 ${hours} 小时`;
}

watch(serverId, () => {
  server.value = null;
  void reload();
});

onMounted(async () => {
  await reload();
  if (disposed) return;
  pollTimer = setInterval(() => void reload(), 10_000);
});
onBeforeUnmount(() => {
  disposed = true;
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
@reference '~/tailwind.css';

.ops-page {
  width: min(100%, 1440px);
  @apply mx-auto px-5 pb-10 md:px-7;
}
.page-stack {
  @apply grid gap-4;
}
.server-title {
  @apply flex flex-wrap items-center gap-2;
}
.server-meta {
  @apply text-wp-text-alt-100 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs;
}
.server-meta span + span::before {
  content: '·';
  @apply mr-5;
}
.server-tabs {
  @apply border-wp-border-100 flex gap-2 overflow-x-auto border-b;
  scrollbar-width: none;
}
.server-tabs :deep(a) {
  @apply text-wp-text-100 relative flex shrink-0 items-center gap-2 px-3 py-3 text-xs font-semibold;
}
.server-tabs :deep(a::after) {
  content: '';
  @apply bg-wp-primary-100 absolute right-2 bottom-0 left-2 h-0.5 scale-x-0 rounded-full;
}
.server-tabs :deep(a.active) {
  @apply text-wp-primary-100;
}
.server-tabs :deep(a.active::after) {
  @apply scale-x-100;
}
.tab-count {
  @apply bg-wp-background-100 min-w-5 rounded-full px-1.5 text-center text-[10px];
}
.metric-grid {
  @apply grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4;
}
.detail-grid {
  @apply grid gap-4 xl:grid-cols-[minmax(0,1fr)_350px];
}
.side-stack {
  @apply grid content-start gap-4;
}
.detail-list {
  @apply grid md:grid-cols-2;
}
.detail-list > div {
  @apply border-wp-border-100 flex min-h-14 items-center justify-between gap-5 border-b px-4 py-3 text-xs odd:md:border-r;
}
.detail-list span {
  @apply text-wp-text-alt-100;
}
.detail-list code {
  @apply text-wp-text-100 max-w-52 truncate;
}
.label-list {
  @apply flex flex-wrap gap-2;
}
.label-chip {
  @apply border-wp-border-100 bg-wp-background-200 rounded-md border px-2 py-1 font-mono text-[10px];
}
.compact-list {
  @apply grid gap-2;
}
.compact-item {
  @apply border-wp-border-100 flex items-start gap-2 border-b pb-2 text-xs last:border-0 last:pb-0;
}
.compact-item span {
  @apply min-w-0;
}
.compact-item strong,
.compact-item small {
  @apply block;
}
.compact-item strong {
  @apply text-wp-text-200 line-clamp-2;
}
.compact-item small {
  @apply text-wp-text-alt-100 mt-1 text-[10px];
}
.health-badge {
  @apply inline-flex min-h-6 items-center rounded-md border px-2 text-[10px] font-bold;
}
.health-healthy {
  @apply border-wp-state-ok-100/30 bg-wp-state-ok-100/10 text-wp-state-ok-100;
}
.health-warning {
  @apply border-wp-state-warn-100/30 bg-wp-state-warn-100/10 text-wp-state-warn-100;
}
.health-critical {
  @apply border-wp-error-100/30 bg-wp-error-100/10 text-wp-error-100;
}
.health-maintenance {
  @apply border-wp-state-info-100/30 bg-wp-state-info-100/10 text-wp-state-info-100;
}
.monitor-toolbar {
  @apply flex flex-wrap items-center gap-2;
}
.segment-control {
  @apply border-wp-border-100 bg-wp-background-300 flex overflow-hidden rounded-lg border;
}
.segment-control button {
  @apply text-wp-text-alt-100 px-3 py-2 text-[10px];
}
.segment-control button.active {
  @apply bg-wp-background-100 text-wp-text-200;
}
.monitor-grid {
  @apply grid gap-4 lg:grid-cols-2;
}
.progress-inline {
  @apply flex min-w-28 items-center gap-2;
}
.progress-inline > span {
  @apply bg-wp-background-100 h-1.5 flex-1 overflow-hidden rounded-full;
}
.progress-inline i {
  @apply bg-wp-primary-100 block h-full rounded-full;
}
.progress-inline small {
  @apply text-wp-text-alt-100 text-[10px];
}
.event-timeline {
  @apply px-5 py-2;
}
.event-row {
  @apply border-wp-border-100 relative grid grid-cols-[18px_minmax(0,1fr)_auto] gap-3 border-b py-4 last:border-0;
}
.event-dot {
  @apply bg-wp-state-info-100 mt-1 h-2.5 w-2.5 rounded-full;
}
.event-dot.success {
  @apply bg-wp-state-ok-100;
}
.event-dot.warning {
  @apply bg-wp-state-warn-100;
}
.event-dot.danger {
  @apply bg-wp-error-100;
}
.event-row strong {
  @apply text-wp-text-200 text-xs;
}
.event-row p,
.event-row time {
  @apply text-wp-text-alt-100 mt-1 text-[10px];
}
.settings-grid {
  @apply grid gap-4 xl:grid-cols-2;
}
.setting-list > div {
  @apply border-wp-border-100 flex items-center justify-between gap-5 border-b p-4 last:border-0;
}
.setting-list span > strong,
.setting-list span > small {
  @apply block;
}
.setting-list span > strong {
  @apply text-wp-text-200 text-xs;
}
.setting-list span > small {
  @apply text-wp-text-alt-100 mt-1 text-[10px];
}
.danger-card {
  @apply border-wp-error-100/30;
}
.loading-state {
  @apply flex justify-center py-24;
}
</style>
