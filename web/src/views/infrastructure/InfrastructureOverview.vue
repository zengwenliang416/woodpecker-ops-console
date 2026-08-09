<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline -->
  <Scaffold full-width-header fluid-content>
    <template #title>{{ $t('ops.infrastructure.title') }}</template>
    <template #headerActions>
      <Button
        :to="{ path: '/infrastructure/servers' }"
        start-icon="server"
        :text="$t('ops.infrastructure.manage_servers')"
      />
      <Button color="green" :to="{ path: '/deployments/new' }" start-icon="rocket" :text="$t('ops.deployments.new')" />
    </template>

    <div class="ops-page">
      <p class="page-description">服务器健康、运行容量、活动告警和部署状态的统一视图。</p>
      <InfrastructureNav :server-count="overview?.server_count" :alert-count="overview?.active_alerts" />

      <div v-if="overview" class="page-stack">
        <div class="metric-grid">
          <OpsMetricCard
            :label="$t('ops.infrastructure.total_servers')"
            :value="`${overview.server_online}/${overview.server_count}`"
            :hint="`${overview.server_online} ${$t('ops.infrastructure.online')} · ${overview.server_maintenance} 台维护 · ${overview.server_offline} 台离线`"
            icon="server"
            :chart-values="onlineSeries"
            :chart-max="Math.max(overview.server_count, 1)"
            :tone="overview.server_offline > 0 ? 'warning' : 'success'"
          />
          <OpsMetricCard
            :label="$t('ops.infrastructure.avg_cpu')"
            :value="`${overview.avg_cpu.toFixed(0)}%`"
            hint="过去 12 个采样点"
            icon="cpu"
            :chart-values="aggregateSeries.cpu"
            :tone="metricTone(overview.avg_cpu)"
          />
          <OpsMetricCard
            :label="$t('ops.server.memory')"
            :value="`${overview.avg_memory.toFixed(0)}%`"
            hint="集群平均使用率"
            icon="memory"
            :chart-values="aggregateSeries.memory"
            :tone="metricTone(overview.avg_memory)"
          />
          <OpsMetricCard
            :label="$t('ops.infrastructure.active_alerts')"
            :value="String(activeEventCount)"
            :hint="`${overview.active_alerts} 个告警 · ${runningDeployments.length} 个部署`"
            icon="activity"
            :chart-values="activitySeries"
            :chart-max="10"
            :tone="overview.active_alerts > 0 ? 'warning' : 'success'"
          />
        </div>

        <div class="overview-grid">
          <section class="wp-card server-health-card">
            <div class="wp-card-header">
              <div>
                <h2>{{ $t('ops.infrastructure.servers') }}</h2>
                <p>Node Agent 最近一次上报状态</p>
              </div>
              <router-link class="text-wp-link-100 text-xs" to="/infrastructure/servers">
                {{ $t('ops.infrastructure.view_all') }}
              </router-link>
            </div>
            <div class="wp-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{{ $t('ops.server.name') }}</th>
                    <th>健康</th>
                    <th>{{ $t('ops.server.environment') }}</th>
                    <th>{{ $t('ops.groups.name') }}</th>
                    <th>CPU</th>
                    <th>{{ $t('ops.server.memory') }}</th>
                    <th>{{ $t('ops.server.disk') }}</th>
                    <th>{{ $t('ops.server.heartbeat') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="server in overview.servers.slice(0, 8)" :key="server.id">
                    <td>
                      <router-link class="server-name" :to="`/infrastructure/servers/${server.id}`">
                        <span class="status-dot" :class="statusDotClass(server)" />
                        <span>
                          <strong>{{ server.name }}</strong>
                          <small>{{ server.private_ip || '—' }} · {{ server.zone || server.region || '—' }}</small>
                        </span>
                      </router-link>
                    </td>
                    <td>
                      <span class="health-badge" :class="healthClass(server.health)">{{
                        healthLabel(server.health)
                      }}</span>
                    </td>
                    <td>{{ environmentName(server.environment_id) }}</td>
                    <td>{{ groupName(server.group_id) }}</td>
                    <td><MetricCell :value="server.cpu" /></td>
                    <td><MetricCell :value="server.memory" /></td>
                    <td><MetricCell :value="server.disk" /></td>
                    <td class="wp-muted">{{ relativeHeartbeat(server.last_heartbeat) }}</td>
                  </tr>
                  <tr v-if="overview.servers.length === 0">
                    <td colspan="8" class="wp-empty-state">
                      <strong>{{ $t('ops.infrastructure.no_servers') }}</strong>
                      <p>{{ $t('ops.infrastructure.no_servers_hint') }}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <aside class="side-stack">
            <section class="wp-card health-summary-card">
              <div class="wp-card-header"><h2>基础设施健康</h2></div>
              <div class="wp-card-body health-summary">
                <div class="health-donut" :style="donutStyle">
                  <div>
                    <strong>{{ overview.server_online }}</strong
                    ><span>在线节点</span>
                  </div>
                </div>
                <div class="health-legend">
                  <div>
                    <span>健康</span><strong>{{ healthCounts.healthy }}</strong>
                  </div>
                  <div>
                    <span>警告</span><strong>{{ healthCounts.warning }}</strong>
                  </div>
                  <div>
                    <span>严重</span><strong>{{ healthCounts.critical }}</strong>
                  </div>
                  <div>
                    <span>维护</span><strong>{{ healthCounts.maintenance }}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section class="wp-card">
              <div class="wp-card-header">
                <h2>{{ $t('ops.infrastructure.latest_alerts') }}</h2>
                <router-link class="text-wp-link-100 text-xs" to="/infrastructure/alerts">全部告警</router-link>
              </div>
              <div class="wp-card-body alert-list">
                <router-link
                  v-for="alert in overview.alerts.filter((item) => item.status !== 'resolved').slice(0, 4)"
                  :key="alert.id"
                  :to="
                    alert.server_id
                      ? `/infrastructure/servers/${alert.server_id}`
                      : alert.deployment_id
                        ? `/deployments/${alert.deployment_id}`
                        : '/infrastructure/alerts'
                  "
                  class="alert-item"
                >
                  <span class="alert-icon" :class="severityClass(alert.severity)"><Icon name="alert" /></span>
                  <span class="alert-copy"
                    ><strong>{{ alert.message }}</strong
                    ><small>{{ alert.type }} · {{ formatTimestamp(alert.created) }}</small></span
                  >
                  <span class="health-badge" :class="severityClass(alert.severity)">{{ alert.status }}</span>
                </router-link>
                <div v-if="overview.alerts.length === 0" class="wp-muted">{{ $t('ops.infrastructure.no_alerts') }}</div>
              </div>
            </section>
          </aside>
        </div>

        <div class="lower-grid">
          <section class="wp-card trend-card">
            <div class="wp-card-header">
              <h2>CPU 使用率</h2>
              <strong>{{ overview.avg_cpu.toFixed(0) }}%</strong>
            </div>
            <div class="trend-chart"><OpsSparkline :values="aggregateSeries.cpu" label="CPU 使用率" /></div>
          </section>
          <section class="wp-card trend-card">
            <div class="wp-card-header">
              <h2>内存使用率</h2>
              <strong>{{ overview.avg_memory.toFixed(0) }}%</strong>
            </div>
            <div class="trend-chart"><OpsSparkline :values="aggregateSeries.memory" label="内存使用率" /></div>
          </section>
          <section class="wp-card trend-card">
            <div class="wp-card-header">
              <h2>网络吞吐</h2>
              <strong>{{ averageNetwork.toFixed(0) }} Mb/s</strong>
            </div>
            <div class="trend-chart">
              <OpsSparkline :values="aggregateSeries.network" label="网络吞吐" :max="networkMax" />
            </div>
          </section>
        </div>
      </div>
      <div v-else class="loading-state"><Icon name="spinner" class="animate-spin" /></div>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline -->
</template>

<script lang="ts" setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import Icon from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import InfrastructureNav from '~/components/ops/InfrastructureNav.vue';
import OpsMetricCard from '~/components/ops/OpsMetricCard.vue';
import OpsSparkline from '~/components/ops/OpsSparkline.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { InfrastructureOverview, Server } from '~/lib/api/types';
import { useApplicationStore, useDeploymentStore } from '~/store/ops';

const apiClient = useApiClient();
const deploymentStore = useDeploymentStore();
const applicationStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.infrastructure.title')]));

const overview = ref<InfrastructureOverview | null>(null);

const MetricCell = defineComponent({
  props: { value: { type: Number, required: true } },
  setup(props) {
    return () =>
      h('div', { class: 'metric-cell' }, [
        h('span', `${props.value.toFixed(0)}%`),
        h('span', { class: 'metric-track' }, [
          h('span', {
            class: `metric-fill ${metricTone(props.value)}`,
            style: { width: `${Math.min(props.value, 100)}%` },
          }),
        ]),
      ]);
  },
});

const runningDeployments = computed(() => deploymentStore.runningDeployments);
const activeEventCount = computed(() => (overview.value?.active_alerts ?? 0) + runningDeployments.value.length);
const onlineSeries = computed(
  () => overview.value?.servers[0]?.metrics?.cpu.map(() => overview.value?.server_online ?? 0) ?? [],
);
const activitySeries = computed(() => [1, 3, 2, 5, 4, 7, 5, 8, 6, Math.max(activeEventCount.value, 1)]);

function aggregateMetric(key: 'cpu' | 'memory' | 'disk' | 'network'): number[] {
  const series =
    overview.value?.servers.map((server) => server.metrics?.[key] ?? []).filter((values) => values.length > 0) ?? [];
  const maxLength = Math.max(0, ...series.map((values) => values.length));
  return Array.from({ length: maxLength }, (_, index) => {
    const values = series.map((items) => items[index]).filter((value): value is number => Number.isFinite(value));
    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  });
}

const aggregateSeries = computed(() => ({
  cpu: aggregateMetric('cpu'),
  memory: aggregateMetric('memory'),
  disk: aggregateMetric('disk'),
  network: aggregateMetric('network'),
}));
const averageNetwork = computed(() => {
  const values = aggregateSeries.value.network;
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
});
const networkMax = computed(() => Math.max(100, ...aggregateSeries.value.network));

const healthCounts = computed(() => {
  const counts = { healthy: 0, warning: 0, critical: 0, maintenance: 0 };
  overview.value?.servers.forEach((server) => {
    counts[server.health] += 1;
  });
  return counts;
});

const donutStyle = computed(() => {
  const total = Math.max(overview.value?.server_count ?? 0, 1);
  const healthyEnd = (healthCounts.value.healthy / total) * 360;
  const warningEnd = healthyEnd + (healthCounts.value.warning / total) * 360;
  const criticalEnd = warningEnd + (healthCounts.value.critical / total) * 360;
  return {
    background: `conic-gradient(var(--wp-state-ok-100) 0deg ${healthyEnd}deg, var(--wp-state-warn-100) ${healthyEnd}deg ${warningEnd}deg, var(--wp-error-100) ${warningEnd}deg ${criticalEnd}deg, var(--wp-state-info-100) ${criticalEnd}deg 360deg)`,
  };
});

function environmentName(id: number): string {
  return applicationStore.environments.get(id)?.title ?? applicationStore.environments.get(id)?.name ?? '—';
}

function groupName(id: number): string {
  return overview.value?.groups.find((group) => group.id === id)?.name ?? t('ops.infrastructure.no_groups');
}

function healthLabel(health: Server['health']): string {
  return { healthy: '健康', warning: '警告', critical: '严重', maintenance: '维护中' }[health];
}

function healthClass(health: Server['health']): string {
  return `health-${health}`;
}

function statusDotClass(server: Server): string {
  return server.status === 'offline'
    ? 'dot-danger'
    : server.status === 'maintenance'
      ? 'dot-info'
      : server.health === 'warning'
        ? 'dot-warning'
        : 'dot-success';
}

function severityClass(severity: string): string {
  return severity === 'critical' ? 'health-critical' : severity === 'warning' ? 'health-warning' : 'health-maintenance';
}

function metricTone(value: number): 'success' | 'warning' | 'danger' {
  if (value >= 85) return 'danger';
  if (value >= 70) return 'warning';
  return 'success';
}

function relativeHeartbeat(timestamp?: number): string {
  if (!timestamp) return '—';
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
  if (seconds < 60) return `${seconds} 秒前`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  return `${Math.floor(seconds / 3600)} 小时前`;
}

function formatTimestamp(timestamp?: number): string {
  return timestamp ? new Date(timestamp * 1000).toLocaleString() : '刚刚';
}

onMounted(async () => {
  const [data] = await Promise.all([
    apiClient.getInfrastructureOverview(),
    deploymentStore.loadDeployments(),
    applicationStore.loadEnvironments(),
  ]);
  overview.value = data;
});
</script>

<style scoped>
@reference '~/tailwind.css';

.ops-page {
  width: min(100%, 1440px);
  @apply mx-auto px-5 pb-10 md:px-7;
}

.page-description {
  @apply text-wp-text-alt-100 mb-4 text-sm;
}

.page-stack {
  @apply mt-4 grid gap-4;
}

.metric-grid {
  @apply grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4;
}

.overview-grid {
  @apply grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px];
}

.side-stack {
  @apply grid content-start gap-4;
}

.server-name {
  @apply text-wp-text-200 flex min-w-42 items-center gap-2.5;
}

.server-name strong,
.server-name small {
  @apply block;
}

.server-name strong {
  @apply text-xs font-bold;
}

.server-name small {
  @apply text-wp-text-alt-100 mt-0.5 text-[10px] font-normal;
}

.status-dot {
  @apply h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_0_4px_rgba(37,194,103,0.08)];
}

.dot-success {
  @apply bg-wp-state-ok-100;
}
.dot-warning {
  @apply bg-wp-state-warn-100;
}
.dot-danger {
  @apply bg-wp-error-100;
}
.dot-info {
  @apply bg-wp-state-info-100;
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

.health-summary {
  @apply flex items-center gap-6;
}

.health-donut {
  @apply relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full;
}

.health-donut::after {
  content: '';
  @apply bg-wp-background-300 absolute inset-3 rounded-full;
}

.health-donut > div {
  @apply relative z-1 flex flex-col items-center;
}

.health-donut strong {
  @apply text-wp-text-200 text-3xl leading-none;
}

.health-donut span {
  @apply text-wp-text-alt-100 mt-1 text-[10px];
}

.health-legend {
  @apply min-w-0 flex-1;
}

.health-legend > div {
  @apply border-wp-border-100 flex items-center justify-between border-b py-2 text-xs last:border-0;
}

.alert-list {
  @apply grid gap-2;
}

.alert-item {
  @apply border-wp-border-100 bg-wp-background-200 hover:border-wp-border-200 flex items-center gap-3 rounded-lg border p-2.5 transition-colors;
}

.alert-icon {
  @apply flex h-8 w-8 shrink-0 items-center justify-center rounded-lg;
}

.alert-copy {
  @apply min-w-0 flex-1;
}

.alert-copy strong,
.alert-copy small {
  @apply block;
}

.alert-copy strong {
  @apply text-wp-text-200 line-clamp-2 text-[11px];
}

.alert-copy small {
  @apply text-wp-text-alt-100 mt-1 text-[9px];
}

.lower-grid {
  @apply grid gap-4 lg:grid-cols-3;
}

.trend-card {
  @apply overflow-hidden;
}

.trend-card .wp-card-header strong {
  @apply text-wp-text-200 text-xl;
}

.trend-chart {
  @apply h-40 p-4 pt-2;
}

.loading-state {
  @apply flex justify-center py-24;
}

:deep(.metric-cell) {
  @apply grid min-w-20 gap-1.5 text-[11px];
}

:deep(.metric-track) {
  @apply bg-wp-background-100 block h-1.5 overflow-hidden rounded-full;
}

:deep(.metric-fill) {
  @apply bg-wp-state-ok-100 block h-full rounded-full;
}

:deep(.metric-fill.warning) {
  @apply bg-wp-state-warn-100;
}
:deep(.metric-fill.danger) {
  @apply bg-wp-error-100;
}
</style>
