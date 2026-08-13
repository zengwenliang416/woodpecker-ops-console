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
        data-action="server-maintenance"
        :text="server?.maintenance ? $t('ops.server.exit_maintenance') : $t('ops.server.enter_maintenance')"
        :color="server?.maintenance ? 'gray' : 'red'"
        :disabled="!server || Boolean(activeMutation)"
        :is-loading="activeMutation === 'maintenance'"
        @click="toggleMaintenance"
      />
      <Button
        start-icon="rocket"
        color="green"
        :text="$t('ops.server.deploy_to_node')"
        :disabled="!server"
        :to="{ path: '/deployments/new', query: { serverId: server?.id } }"
      />
    </template>

    <div class="ops-page">
      <FeedbackState
        v-if="loading && !server"
        kind="loading"
        :title="$t('feedback.loading_title')"
        :description="$t('feedback.loading_description')"
      />
      <FeedbackState
        v-else-if="loadError && !server"
        kind="error"
        :title="$t('unknown_error')"
        :description="$t('unknown_error')"
      >
        <template #action>
          <Button
            data-action="server-retry"
            start-icon="refresh"
            :text="$t('repo.settings_surface.retry')"
            :disabled="Boolean(activeMutation)"
            @click="reload"
          />
        </template>
      </FeedbackState>
      <FeedbackState
        v-else-if="missing"
        kind="empty"
        :title="$t('not_found.title')"
        :description="$t('not_found.description')"
      />
      <div v-else-if="server" class="page-stack">
        <FeedbackState
          v-if="loadError || mutationError"
          compact
          kind="error"
          :title="$t('unknown_error')"
          :description="$t('unknown_error')"
        >
          <template #action>
            <Button
              data-action="server-retry"
              start-icon="refresh"
              :text="$t('repo.settings_surface.retry')"
              :disabled="Boolean(activeMutation)"
              @click="reload"
            />
          </template>
        </FeedbackState>
        <div class="server-meta">
          <span>{{ environmentName }}</span
          ><span>{{ $t('ops.server.region') }}: {{ server.region || '—' }} · {{ server.zone || '—' }}</span
          ><span class="wp-mono">{{ $t('ops.server.ip') }}: {{ server.private_ip || '—' }}</span
          ><span>{{ relativeHeartbeat(server.last_heartbeat) }}</span>
        </div>

        <nav class="server-tabs" :aria-label="$t('ops.server_detail.tabs_label')">
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
              :hint="$t('ops.server_detail.agent_sample')"
              icon="memory"
              :chart-values="server.metrics?.memory"
              :tone="metricTone(server.memory)"
            />
            <OpsMetricCard
              :label="$t('ops.server.disk')"
              :value="`${server.disk.toFixed(0)}%`"
              :hint="$t('ops.server_detail.root_disk_usage')"
              icon="disk"
              :chart-values="server.metrics?.disk"
              :tone="metricTone(server.disk)"
            />
            <OpsMetricCard
              :label="$t('ops.server_detail.network')"
              :value="`${latestNetwork.toFixed(0)} Mb/s`"
              :hint="$t('ops.server_detail.current_throughput')"
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
                  <p>{{ $t('ops.server_detail.details_description') }}</p>
                </div>
              </div>
              <div class="detail-list">
                <div>
                  <span>{{ $t('ops.server.environment') }}</span
                  ><strong>{{ environmentName }}</strong>
                </div>
                <div>
                  <span>{{ $t('ops.server_detail.server_group') }}</span
                  ><router-link class="text-wp-link-100" :to="`/infrastructure/groups/${server.group_id}`">
                    {{ groupName }}
                  </router-link>
                </div>
                <div>
                  <span>{{ $t('ops.server.region') }}</span
                  ><strong>{{ server.region || '—' }} / {{ server.zone || '—' }}</strong>
                </div>
                <div>
                  <span>{{ $t('ops.server_detail.operating_system') }}</span
                  ><strong>{{ server.os || '—' }} · {{ server.kernel || '—' }}</strong>
                </div>
                <div>
                  <span>{{ $t('ops.server.runtime') }}</span
                  ><strong>{{ server.runtime || '—' }}</strong>
                </div>
                <div>
                  <span>Agent</span><strong>{{ server.agent_version || '—' }}</strong>
                </div>
                <div>
                  <span>{{ $t('ops.server_detail.uptime') }}</span
                  ><strong>{{ formatUptime(server.uptime_seconds) }}</strong>
                </div>
                <div>
                  <span>{{ $t('ops.server_detail.certificate_serial') }}</span
                  ><code>{{ server.cert_serial || '—' }}</code>
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
                  ><span v-if="!server.labels || Object.keys(server.labels).length === 0" class="wp-muted">{{
                    $t('ops.server_detail.no_labels')
                  }}</span>
                </div>
              </section>
              <section class="wp-card">
                <div class="wp-card-header">
                  <h2>{{ $t('ops.server_detail.active_alerts') }}</h2>
                  <router-link class="text-wp-link-100 text-xs" to="/infrastructure/alerts">
                    {{ $t('ops.server_detail.all') }}
                  </router-link>
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
                  <span v-if="serverAlerts.length === 0" class="wp-muted">{{
                    $t('ops.server_detail.no_active_alerts')
                  }}</span>
                </div>
              </section>
            </aside>
          </div>
        </template>

        <template v-else-if="currentTab === 'monitoring'">
          <div class="monitor-toolbar">
            <!-- eslint-disable vue/multiline-html-element-content-newline -->
            <div class="segment-control">
              <button
                data-action="metrics-range"
                class="active"
                disabled
                :title="$t('ops.server_detail.metrics_fixed_window')"
              >
                {{ $t('ops.server_detail.range_1h') }}</button
              ><button data-action="metrics-range" disabled :title="$t('ops.server_detail.metrics_fixed_window')">
                {{ $t('ops.server_detail.range_6h') }}</button
              ><button data-action="metrics-range" disabled :title="$t('ops.server_detail.metrics_fixed_window')">
                {{ $t('ops.server_detail.range_24h') }}</button
              ><button data-action="metrics-range" disabled :title="$t('ops.server_detail.metrics_fixed_window')">
                {{ $t('ops.server_detail.range_7d') }}
              </button>
            </div>
            <!-- eslint-enable vue/multiline-html-element-content-newline -->
            <Button
              data-action="metrics-export"
              disabled
              start-icon="download"
              :text="$t('ops.server_detail.export_metrics')"
              :title="$t('ops.server_detail.export_unsupported')"
            />
            <Button
              data-action="server-refresh"
              start-icon="refresh"
              :text="$t('refresh')"
              :disabled="Boolean(activeMutation)"
              @click="reload"
            />
          </div>
          <div v-if="!server.metrics?.cpu?.length" class="wp-alert wp-alert-info">
            <Icon name="info" /><span>{{ $t('ops.server.no_metrics') }}</span>
          </div>
          <div class="monitor-grid">
            <OpsMetricPanel
              :label="$t('ops.server_detail.cpu_usage')"
              :value="server.cpu"
              :values="server.metrics?.cpu"
              icon="cpu"
              :threshold="85"
            />
            <OpsMetricPanel
              :label="$t('ops.server_detail.memory_usage')"
              :value="server.memory"
              :values="server.metrics?.memory"
              icon="memory"
              :threshold="90"
            />
            <OpsMetricPanel
              :label="$t('ops.server_detail.root_disk_usage')"
              :value="server.disk"
              :values="server.metrics?.disk"
              icon="disk"
              :threshold="85"
            />
            <OpsMetricPanel
              :label="$t('ops.server_detail.network_throughput')"
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
                <h2>{{ $t('ops.services.title') }}</h2>
                <p>{{ $t('ops.server_detail.workloads_reported_by', { runtime: server.runtime || '—' }) }}</p>
              </div>
              <Button
                data-action="server-refresh"
                start-icon="refresh"
                :text="$t('refresh')"
                :disabled="Boolean(activeMutation)"
                @click="reload"
              />
            </div>
            <div class="wp-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{{ $t('ops.server_detail.service') }}</th>
                    <th>{{ $t('ops.server.runtime') }}</th>
                    <th>{{ $t('ops.server.status') }}</th>
                    <th>{{ $t('ops.server_detail.instances') }}</th>
                    <th>CPU</th>
                    <th>{{ $t('ops.server.memory') }}</th>
                    <th>{{ $t('ops.server_detail.actions') }}</th>
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
                    <td>
                      <Button
                        data-action="workload-restart-unsupported"
                        disabled
                        size="sm"
                        :text="$t('ops.server_detail.unsupported')"
                        :title="$t('ops.server_detail.service_restart_unsupported')"
                      />
                    </td>
                  </tr>
                  <tr v-if="serverServices.length === 0">
                    <td colspan="7" class="wp-empty-state">
                      <strong>{{ $t('ops.server_detail.no_workloads') }}</strong>
                      <p>{{ $t('ops.server_detail.no_workloads_hint') }}</p>
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
                <p>{{ $t('ops.server_detail.deployments_description') }}</p>
              </div>
              <Button
                color="green"
                start-icon="rocket"
                :text="$t('ops.server.deploy_to_node')"
                :to="{ path: '/deployments/new', query: { serverId: server.id } }"
              />
            </div>
            <div class="wp-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{{ $t('ops.server.status') }}</th>
                    <th>{{ $t('ops.server_detail.strategy') }}</th>
                    <th>{{ $t('ops.server_detail.progress') }}</th>
                    <th>{{ $t('ops.server_detail.triggered_by') }}</th>
                    <th>{{ $t('ops.server_detail.started') }}</th>
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
                <h2>{{ $t('ops.server_detail.node_events') }}</h2>
                <p>{{ $t('ops.server_detail.events_description') }}</p>
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
              <div v-if="events.length === 0" class="wp-empty-state">
                <strong>{{ $t('ops.server_detail.no_events') }}</strong>
              </div>
            </div>
          </section>
        </template>

        <template v-else>
          <div class="settings-grid">
            <section class="wp-card">
              <div class="wp-card-header">
                <div>
                  <h2>Node Agent</h2>
                  <p>{{ $t('ops.server_detail.agent_description') }}</p>
                </div>
              </div>
              <div class="setting-list">
                <div>
                  <span
                    ><strong>{{ $t('ops.server_detail.connection_status') }}</strong
                    ><small>{{
                      $t('ops.server_detail.latest_heartbeat', {
                        heartbeat: relativeHeartbeat(server.last_heartbeat),
                      })
                    }}</small></span
                  ><span
                    class="health-badge"
                    :class="server.status === 'online' ? 'health-healthy' : 'health-critical'"
                    >{{ server.status }}</span
                  >
                </div>
                <div>
                  <span
                    ><strong>{{ $t('ops.server_detail.restart_agent') }}</strong
                    ><small>{{ $t('ops.server_detail.restart_agent_description') }}</small></span
                  ><Button
                    data-action="server-restart"
                    start-icon="refresh"
                    :text="$t('ops.server_detail.restart')"
                    :disabled="Boolean(activeMutation)"
                    :is-loading="activeMutation === 'restart'"
                    @click="restartNode"
                  />
                </div>
                <div>
                  <span
                    ><strong>{{ $t('ops.server_detail.copy_diagnostics') }}</strong
                    ><small>{{ $t('ops.server_detail.copy_diagnostics_description') }}</small></span
                  ><Button start-icon="download" :text="$t('ops.server_detail.copy')" @click="copyDiagnostics" />
                </div>
              </div>
            </section>
            <section class="wp-card danger-card">
              <div class="wp-card-header">
                <div>
                  <h2>{{ $t('ops.server_detail.dangerous_actions') }}</h2>
                  <p>{{ $t('ops.server_detail.dangerous_actions_description') }}</p>
                </div>
              </div>
              <div class="setting-list">
                <div>
                  <span
                    ><strong>{{
                      server.maintenance
                        ? $t('ops.server_detail.exit_maintenance_mode')
                        : $t('ops.server_detail.enter_maintenance_mode')
                    }}</strong
                    ><small>{{ $t('ops.server_detail.maintenance_description') }}</small></span
                  ><Button
                    data-action="server-maintenance"
                    :color="server.maintenance ? 'gray' : 'red'"
                    :text="server.maintenance ? $t('ops.server.exit_maintenance') : $t('ops.server.enter_maintenance')"
                    :disabled="Boolean(activeMutation)"
                    :is-loading="activeMutation === 'maintenance'"
                    @click="toggleMaintenance"
                  />
                </div>
                <div v-if="isAdmin">
                  <span
                    ><strong>{{ $t('ops.server_detail.remove_server') }}</strong
                    ><small>{{ $t('ops.server_detail.remove_server_description') }}</small></span
                  ><Button
                    color="red"
                    start-icon="trash"
                    :text="$t('ops.server_detail.remove')"
                    :disabled="Boolean(activeMutation)"
                    :is-loading="activeMutation === 'delete'"
                    @click="removeServer"
                  />
                </div>
              </div>
            </section>
          </div>
        </template>
      </div>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline -->
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Icon from '~/components/atomic/Icon.vue';
import type { IconNames } from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import OpsMetricCard from '~/components/ops/OpsMetricCard.vue';
import OpsMetricPanel from '~/components/ops/OpsMetricPanel.vue';
import useApiClient from '~/compositions/useApiClient';
import useAuthentication from '~/compositions/useAuthentication';
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
const { user } = useAuthentication();
const isAdmin = Boolean(user?.admin);
const serverStore = useServerStore();
const applicationStore = useApplicationStore();
const { t } = useI18n();

const server = ref<Server | null>(null);
const deployments = ref<Deployment[]>([]);
const services = ref<ServiceView[]>([]);
const loading = ref(true);
const loadError = ref(false);
const mutationError = ref(false);
const missing = ref(false);
const activeMutation = ref<'delete' | 'maintenance' | 'restart'>();
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
    label: t('ops.services.title'),
    icon: 'docker',
    count: serverServices.value.length || undefined,
    to: { path: route.path, query: { tab: 'workloads' } },
  },
  {
    key: 'deployments',
    label: t('ops.server.deployments'),
    icon: 'rocket',
    count: deployments.value.length || undefined,
    to: { path: route.path, query: { tab: 'deployments' } },
  },
  {
    key: 'events',
    label: t('ops.server_detail.events'),
    icon: 'since',
    count: serverAlerts.value.length || undefined,
    to: { path: route.path, query: { tab: 'events' } },
  },
  { key: 'settings', label: t('settings'), icon: 'settings', to: { path: route.path, query: { tab: 'settings' } } },
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
let alive = true;
let lifecycleGeneration = 0;
let loadGeneration = 0;

function ownsLifecycle(generation: number, requestedId: number) {
  return alive && generation === lifecycleGeneration && requestedId === serverId.value;
}

async function reload(): Promise<boolean> {
  const requestedId = serverId.value;
  const requestLifecycle = lifecycleGeneration;
  const requestGeneration = ++loadGeneration;
  loading.value = true;
  loadError.value = false;
  mutationError.value = false;
  missing.value = false;

  const [serverResult, deploymentsResult, servicesResult, groupsResult, alertsResult, environmentsResult] =
    await Promise.allSettled([
      apiClient.getServer(requestedId),
      apiClient.getServerDeployments(requestedId),
      apiClient.getOpsServices(),
      serverStore.loadGroups(),
      serverStore.loadAlerts(),
      applicationStore.loadEnvironments(),
    ]);

  if (!ownsLifecycle(requestLifecycle, requestedId) || requestGeneration !== loadGeneration) {
    return false;
  }

  const supplementalResults = [deploymentsResult, servicesResult, groupsResult, alertsResult, environmentsResult];
  loadError.value =
    serverResult.status === 'rejected' || supplementalResults.some((result) => result.status === 'rejected');

  if (serverResult.status === 'fulfilled') {
    server.value = serverResult.value;
    missing.value = serverResult.value === null;
    if (missing.value) {
      deployments.value = [];
      services.value = [];
    }
  }
  if (deploymentsResult.status === 'fulfilled') {
    deployments.value = deploymentsResult.value ?? [];
  }
  if (servicesResult.status === 'fulfilled') {
    services.value = servicesResult.value as ServiceView[];
  }

  loading.value = false;
  return serverResult.status === 'fulfilled' && serverResult.value !== null;
}

async function toggleMaintenance() {
  if (!server.value || activeMutation.value) return;
  const requestedId = serverId.value;
  const mutationLifecycle = lifecycleGeneration;
  loadGeneration += 1;
  mutationError.value = false;
  activeMutation.value = 'maintenance';
  try {
    const nextServer = await apiClient.setServerMaintenance(requestedId, !server.value.maintenance);
    if (ownsLifecycle(mutationLifecycle, requestedId) && nextServer) {
      server.value = nextServer;
    }
  } catch {
    if (ownsLifecycle(mutationLifecycle, requestedId)) {
      mutationError.value = true;
    }
  } finally {
    if (ownsLifecycle(mutationLifecycle, requestedId) && activeMutation.value === 'maintenance') {
      activeMutation.value = undefined;
    }
  }
}

async function restartNode() {
  if (!server.value || activeMutation.value) return;
  const requestedId = serverId.value;
  const mutationLifecycle = lifecycleGeneration;
  loadGeneration += 1;
  mutationError.value = false;
  activeMutation.value = 'restart';
  try {
    await apiClient.restartServer(requestedId);
    if (!ownsLifecycle(mutationLifecycle, requestedId)) return;
    await reload();
  } catch {
    if (ownsLifecycle(mutationLifecycle, requestedId)) {
      mutationError.value = true;
    }
  } finally {
    if (ownsLifecycle(mutationLifecycle, requestedId) && activeMutation.value === 'restart') {
      activeMutation.value = undefined;
    }
  }
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
  if (!isAdmin || !server.value || activeMutation.value) return;
  // eslint-disable-next-line no-alert -- destructive removal requires explicit confirmation.
  if (!window.confirm(t('ops.server_detail.remove_confirmation', { name: server.value.name }))) return;
  const requestedId = serverId.value;
  const mutationLifecycle = lifecycleGeneration;
  loadGeneration += 1;
  mutationError.value = false;
  activeMutation.value = 'delete';
  try {
    await apiClient.deleteServer(requestedId);
    if (ownsLifecycle(mutationLifecycle, requestedId)) {
      await router.push('/infrastructure/servers');
    }
  } catch {
    if (ownsLifecycle(mutationLifecycle, requestedId)) {
      mutationError.value = true;
    }
  } finally {
    if (ownsLifecycle(mutationLifecycle, requestedId) && activeMutation.value === 'delete') {
      activeMutation.value = undefined;
    }
  }
}

function healthLabel(health: Server['health']): string {
  return {
    healthy: t('ops.server_detail.health.healthy'),
    warning: t('ops.server_detail.health.warning'),
    critical: t('ops.server_detail.health.critical'),
    maintenance: t('ops.server_detail.health.maintenance'),
  }[health];
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
  if (!timestamp) return t('ops.server_detail.no_heartbeat');
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
  return seconds < 60
    ? t('ops.server_detail.seconds_ago', { count: seconds })
    : seconds < 3600
      ? t('ops.server_detail.minutes_ago', { count: Math.floor(seconds / 60) })
      : t('ops.server_detail.hours_ago', { count: Math.floor(seconds / 3600) });
}
function formatTimestamp(timestamp?: number): string {
  return timestamp ? new Date(timestamp * 1000).toLocaleString() : '—';
}
function formatUptime(seconds?: number): string {
  if (!seconds) return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return t('ops.server_detail.uptime_value', { days, hours });
}

watch(serverId, () => {
  lifecycleGeneration += 1;
  loadGeneration += 1;
  activeMutation.value = undefined;
  server.value = null;
  deployments.value = [];
  services.value = [];
  loading.value = true;
  loadError.value = false;
  mutationError.value = false;
  missing.value = false;
  void reload();
});

onMounted(async () => {
  await reload();
  if (!alive) return;
  pollTimer = setInterval(() => {
    if (!activeMutation.value) void reload();
  }, 10_000);
});
onBeforeUnmount(() => {
  alive = false;
  lifecycleGeneration += 1;
  loadGeneration += 1;
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
