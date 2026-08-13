<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>{{ $t('ops.alerts.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.alerts.refresh')"
        :title="$t('ops.alerts.refresh')"
        @click="loadAlerts(true)"
      />
    </template>

    <div class="mb-4">
      <InfrastructureNav :server-count="serverStore.serverList.length" :alert-count="activeAlertCount" />
    </div>

    <FeedbackState
      v-if="initialLoading"
      kind="loading"
      :title="$t('ops.alerts.loading_title')"
      :description="$t('ops.alerts.loading_description')"
    />
    <FeedbackState
      v-else-if="loadError && !hasConfirmedData"
      kind="error"
      :title="$t('ops.alerts.error_title')"
      :description="$t('ops.alerts.error_description')"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('ops.alerts.retry')" @click="loadAlerts()" />
      </template>
    </FeedbackState>
    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('ops.alerts.refresh_error_title')"
        :description="$t('ops.alerts.refresh_error_description')"
      />
      <FeedbackState
        v-if="alerts.length === 0"
        kind="empty"
        :title="$t('ops.alerts.none')"
        :description="$t('ops.alerts.loading_description')"
      />
      <section v-else class="wp-card">
        <div class="wp-filters">
          <select v-model="statusFilter" class="select wp-mono">
            <option value="all">{{ $t('ops.alerts.all') }}</option>
            <option value="active">{{ $t('ops.alerts.active') }}</option>
            <option value="acknowledged">{{ $t('ops.alerts.acknowledged') }}</option>
            <option value="resolved">{{ $t('ops.alerts.resolved') }}</option>
          </select>
          <select v-model="severityFilter" class="select wp-mono">
            <option value="all">{{ $t('ops.alerts.all_severities') }}</option>
            <option v-for="severity in severityOptions" :key="severity" :value="severity">{{ severity }}</option>
          </select>
        </div>

        <FeedbackState
          v-if="filteredAlerts.length === 0"
          compact
          kind="empty"
          :title="$t('ops.alerts.filtered_none')"
          :description="$t('ops.alerts.all_severities')"
        />
        <div v-else class="wp-table-scroll">
          <table>
            <thead>
              <tr>
                <th>{{ $t('ops.alerts.severity') }}</th>
                <th>{{ $t('ops.alerts.type') }}</th>
                <th>{{ $t('ops.alerts.message') }}</th>
                <th>{{ $t('ops.alerts.status') }}</th>
                <th>{{ $t('ops.alerts.created') }}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="alert in filteredAlerts" :key="alert.id">
                <td>
                  <span class="badge" :class="severityClass(alert.severity)">{{ alert.severity }}</span>
                </td>
                <td class="wp-mono">{{ alert.type }}</td>
                <td>{{ alert.message }}</td>
                <td>
                  <span class="badge" :class="alertStatusClass(alert.status)">{{ alert.status }}</span>
                </td>
                <td class="wp-muted">{{ new Date((alert.created ?? 0) * 1000).toLocaleString() }}</td>
                <td>
                  <div class="wp-cluster">
                    <Button
                      v-if="alert.server_id"
                      size="sm"
                      :text="$t('ops.alerts.view_server')"
                      :to="{ name: 'infrastructure-server', params: { serverId: alert.server_id } }"
                    />
                    <Button
                      v-if="alert.deployment_id"
                      size="sm"
                      :text="$t('ops.alerts.view_deployment')"
                      :to="{ name: 'deployment', params: { deploymentId: alert.deployment_id } }"
                    />
                    <Button
                      v-if="alert.status === 'active'"
                      size="sm"
                      :disabled="pendingMutations.has(alert.id)"
                      :is-loading="pendingMutations.get(alert.id) === 'acknowledge'"
                      :text="$t('ops.alerts.acknowledge')"
                      :title="$t('ops.alerts.acknowledge')"
                      @click="mutateAlert(alert.id, 'acknowledge')"
                    />
                    <Button
                      v-if="alert.status !== 'resolved'"
                      size="sm"
                      color="green"
                      :disabled="pendingMutations.has(alert.id)"
                      :is-loading="pendingMutations.get(alert.id) === 'resolve'"
                      :text="$t('ops.alerts.resolve')"
                      :title="$t('ops.alerts.resolve')"
                      @click="mutateAlert(alert.id, 'resolve')"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import InfrastructureNav from '~/components/ops/InfrastructureNav.vue';
import useApiClient from '~/compositions/useApiClient';
import useNotifications from '~/compositions/useNotifications';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Alert } from '~/lib/api/types';
import { useServerStore } from '~/store/ops';

type AlertMutation = 'acknowledge' | 'resolve';

const apiClient = useApiClient();
const serverStore = useServerStore();
const notifications = useNotifications();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.alerts.title')]));

const alerts = ref<Alert[]>([]);
const statusFilter = ref('all');
const severityFilter = ref('all');
const initialLoading = ref(true);
const refreshing = ref(false);
const loadError = ref(false);
const hasConfirmedData = ref(false);
const pendingMutations = reactive(new Map<number, AlertMutation>());
let alive = true;
let lifecycleGeneration = 0;
let loadGeneration = 0;

const severityOptions = computed(() => [...new Set(alerts.value.map((alert) => alert.severity))].toSorted());
const filteredAlerts = computed(() =>
  alerts.value.filter(
    (alert) =>
      (statusFilter.value === 'all' || alert.status === statusFilter.value) &&
      (severityFilter.value === 'all' || alert.severity === severityFilter.value),
  ),
);
const activeAlertCount = computed(() => alerts.value.filter((alert) => alert.status === 'active').length);

function publishStoreAlerts() {
  alerts.value = [...serverStore.alertsList];
  hasConfirmedData.value = true;
}

async function loadAlerts(refresh = false) {
  const generation = ++loadGeneration;
  const lifecycle = lifecycleGeneration;
  loadError.value = false;
  if (refresh) refreshing.value = true;
  else initialLoading.value = !hasConfirmedData.value;

  try {
    await serverStore.loadAlerts();
    if (!alive || lifecycle !== lifecycleGeneration || generation !== loadGeneration) return false;
    publishStoreAlerts();
    if (!refresh) void serverStore.loadServers().catch(() => undefined);
    return true;
  } catch {
    if (alive && lifecycle === lifecycleGeneration && generation === loadGeneration) loadError.value = true;
    return false;
  } finally {
    if (alive && lifecycle === lifecycleGeneration && generation === loadGeneration) {
      initialLoading.value = false;
      refreshing.value = false;
    }
  }
}

async function mutateAlert(alertId: number, mutation: AlertMutation) {
  if (pendingMutations.has(alertId)) return;
  const lifecycle = lifecycleGeneration;
  pendingMutations.set(alertId, mutation);

  try {
    const updated =
      mutation === 'acknowledge' ? await apiClient.acknowledgeAlert(alertId) : await apiClient.resolveAlert(alertId);
    if (!alive || lifecycle !== lifecycleGeneration) return;

    if (updated) {
      serverStore.alerts.set(updated.id, updated);
      alerts.value = alerts.value.map((alert) => (alert.id === updated.id ? updated : alert));
    } else {
      await loadAlerts(true);
    }
  } catch {
    if (alive && lifecycle === lifecycleGeneration) {
      notifications.notify({ title: t('ops.alerts.mutation_error'), type: 'error' });
    }
  } finally {
    if (alive && lifecycle === lifecycleGeneration) pendingMutations.delete(alertId);
  }
}

function severityClass(severity: string): string {
  if (severity === 'critical') return 'text-wp-error-100';
  if (severity === 'warning') return 'text-wp-state-warn-100';
  return 'text-wp-state-info-100';
}

function alertStatusClass(status: string): string {
  if (status === 'resolved') return 'text-wp-state-ok-100';
  if (status === 'acknowledged') return 'text-wp-state-warn-100';
  return 'text-wp-error-100';
}

onMounted(() => loadAlerts());
onBeforeUnmount(() => {
  alive = false;
  lifecycleGeneration += 1;
  loadGeneration += 1;
});
</script>
