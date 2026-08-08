<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>{{ $t('ops.alerts.title') }}</template>

    <section class="wp-card">
      <div class="wp-filters">
        <select v-model="statusFilter" class="select wp-mono">
          <option value="all">{{ $t('ops.alerts.all') }}</option>
          <option value="active">{{ $t('ops.alerts.active') }}</option>
          <option value="acknowledged">{{ $t('ops.alerts.acknowledged') }}</option>
          <option value="resolved">{{ $t('ops.alerts.resolved') }}</option>
        </select>
      </div>
      <div class="wp-table-scroll">
        <table>
          <thead><tr><th>{{ $t('ops.alerts.severity') }}</th><th>{{ $t('ops.alerts.type') }}</th><th>{{ $t('ops.alerts.message') }}</th><th>{{ $t('ops.alerts.status') }}</th><th>{{ $t('ops.alerts.created') }}</th><th /></tr></thead>
          <tbody>
            <tr v-for="alert in filteredAlerts" :key="alert.id">
              <td><span class="badge" :class="severityClass(alert.severity)">{{ alert.severity }}</span></td>
              <td class="wp-mono">{{ alert.type }}</td>
              <td>{{ alert.message }}</td>
              <td><span class="badge" :class="alertStatusClass(alert.status)">{{ alert.status }}</span></td>
              <td class="wp-muted">{{ new Date((alert.created ?? 0) * 1000).toLocaleString() }}</td>
              <td>
                <div class="wp-cluster">
                  <Button v-if="alert.status === 'active'" size="sm" :text="$t('ops.alerts.acknowledge')" @click="acknowledge(alert.id)" />
                  <Button v-if="alert.status !== 'resolved'" size="sm" color="green" :text="$t('ops.alerts.resolve')" @click="resolve(alert.id)" />
                </div>
              </td>
            </tr>
            <tr v-if="filteredAlerts.length === 0"><td colspan="6" class="wp-empty-state"><strong>{{ $t('ops.alerts.none') }}</strong></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useServerStore } from '~/store/ops';

const apiClient = useApiClient();
const serverStore = useServerStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.alerts.title')]));

const statusFilter = ref('all');

const filteredAlerts = computed(() => serverStore.alertsList.filter((a) => statusFilter.value === 'all' || a.status === statusFilter.value));

async function acknowledge(alertId: number) {
  await apiClient.acknowledgeAlert(alertId);
  await serverStore.loadAlerts();
}

async function resolve(alertId: number) {
  await apiClient.resolveAlert(alertId);
  await serverStore.loadAlerts();
}

function severityClass(severity: string): string {
  if (severity === 'critical') {
    return 'text-wp-error-100';
  }
  if (severity === 'warning') {
    return 'text-wp-state-warn-100';
  }
  return 'text-wp-state-info-100';
}

function alertStatusClass(status: string): string {
  if (status === 'resolved') {
    return 'text-wp-state-ok-100';
  }
  if (status === 'acknowledged') {
    return 'text-wp-state-warn-100';
  }
  return 'text-wp-error-100';
}

onMounted(() => serverStore.loadAlerts());
</script>
