<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold :go-back="() => router.push('/infrastructure/servers')" :enable-tabs="true">
    <template #title>{{ server?.name ?? '...' }}</template>
    <template #headerActions>
      <Button :text="server?.maintenance ? $t('ops.server.exit_maintenance') : $t('ops.server.enter_maintenance')" :color="server?.maintenance ? 'gray' : 'red'" @click="toggleMaintenance" />
      <Button start-icon="rocket" color="green" :text="$t('ops.server.deploy_to_node')" :to="{ path: '/deployments/new', query: { serverId: server?.id } }" />
    </template>
    <template #tabActions>
      <IconButton icon="refresh" :title="$t('refresh')" @click="reload" />
    </template>

    <div v-if="server" class="wp-stack">
      <div class="wp-metric-grid">
        <div class="wp-metric-card"><div class="wp-metric-head"><Icon name="cpu" />CPU</div><div class="wp-metric-body"><strong>{{ server.cpu.toFixed(0) }}%</strong></div></div>
        <div class="wp-metric-card"><div class="wp-metric-head"><Icon name="memory" />{{ $t('ops.server.memory') }}</div><div class="wp-metric-body"><strong>{{ server.memory.toFixed(0) }}%</strong></div></div>
        <div class="wp-metric-card"><div class="wp-metric-head"><Icon name="disk" />{{ $t('ops.server.disk') }}</div><div class="wp-metric-body"><strong>{{ server.disk.toFixed(0) }}%</strong></div></div>
        <div class="wp-metric-card"><div class="wp-metric-head"><Icon name="activity" />{{ $t('ops.server.load') }}</div><div class="wp-metric-body"><strong>{{ server.load.toFixed(2) }}</strong></div></div>
      </div>

      <div class="wp-grid wp-grid-sidebar">
        <section class="wp-card">
          <div class="wp-card-header"><h2>{{ $t('ops.server.details') }}</h2><span class="badge" :class="statusClass">{{ server.status }}</span></div>
          <div class="wp-card-body wp-grid wp-grid-2">
            <div class="wp-muted">{{ $t('ops.server.ip') }}</div><div class="wp-mono">{{ server.private_ip || '—' }}</div>
            <div class="wp-muted">{{ $t('ops.server.region') }}</div><div>{{ server.region || '—' }} / {{ server.zone || '—' }}</div>
            <div class="wp-muted">OS</div><div>{{ server.os || '—' }} · {{ server.kernel || '' }}</div>
            <div class="wp-muted">{{ $t('ops.server.runtime') }}</div><div>{{ server.runtime || '—' }} · agent {{ server.agent_version || '—' }}</div>
            <div class="wp-muted">{{ $t('ops.server.heartbeat') }}</div><div>{{ server.last_heartbeat ? new Date(server.last_heartbeat * 1000).toLocaleString() : '—' }}</div>
            <div class="wp-muted">{{ $t('ops.server.labels') }}</div><div class="wp-cluster"><span v-for="(v, k) in server.labels" :key="k" class="badge">{{ k }}={{ v }}</span></div>
          </div>
        </section>

        <section class="wp-card">
          <div class="wp-card-header"><h2>{{ $t('ops.server.metrics') }}</h2></div>
          <div class="wp-card-body wp-stack">
            <div v-if="server.metrics">
              <div class="mb-1 flex justify-between text-xs"><span>CPU</span><span class="wp-muted">{{ server.cpu.toFixed(0) }}%</span></div>
              <div class="h-2 overflow-hidden rounded-full bg-wp-background-200"><div class="h-full rounded-full bg-wp-primary-100" :style="{ width: `${server.cpu}%` }" /></div>
              <div class="mt-3 mb-1 flex justify-between text-xs"><span>{{ $t('ops.server.memory') }}</span><span class="wp-muted">{{ server.memory.toFixed(0) }}%</span></div>
              <div class="h-2 overflow-hidden rounded-full bg-wp-background-200"><div class="h-full rounded-full bg-wp-state-info-100" :style="{ width: `${server.memory}%` }" /></div>
              <div class="mt-3 mb-1 flex justify-between text-xs"><span>{{ $t('ops.server.disk') }}</span><span class="wp-muted">{{ server.disk.toFixed(0) }}%</span></div>
              <div class="h-2 overflow-hidden rounded-full bg-wp-background-200"><div class="h-full rounded-full bg-wp-state-warn-100" :style="{ width: `${server.disk}%` }" /></div>
            </div>
            <div v-else class="wp-muted">{{ $t('ops.server.no_metrics') }}</div>
          </div>
        </section>
      </div>

      <section class="wp-card">
        <div class="wp-card-header"><h2>{{ $t('ops.server.deployments') }}</h2></div>
        <div class="wp-table-scroll">
          <table>
            <thead><tr><th>{{ $t('ops.deployment.id') }}</th><th>{{ $t('ops.deployment.status') }}</th><th>{{ $t('ops.deployment.strategy') }}</th><th>{{ $t('ops.deployment.triggered_by') }}</th><th>{{ $t('ops.deployment.started') }}</th></tr></thead>
            <tbody>
              <tr v-for="d in deployments" :key="d.id">
                <td><router-link class="text-wp-link-100" :to="`/deployments/${d.id}`">DEP-{{ d.id }}</router-link></td>
                <td><span class="badge" :class="deploymentStatusClass(d.status)">{{ d.status }}</span></td>
                <td>{{ d.strategy }}</td>
                <td>{{ d.triggered_by }}</td>
                <td class="wp-muted">{{ d.started_at ? new Date(d.started_at * 1000).toLocaleString() : '—' }}</td>
              </tr>
              <tr v-if="deployments.length === 0"><td colspan="5" class="wp-empty-state"><strong>{{ $t('ops.server.no_deployments') }}</strong></td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
    <div v-else class="flex justify-center py-20"><Icon name="spinner" class="animate-spin" /></div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import Icon from '~/components/atomic/Icon.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Deployment, Server } from '~/lib/api/types';

const route = useRoute();
const router = useRouter();
const apiClient = useApiClient();
const { t } = useI18n();

const server = ref<Server | null>(null);
const deployments = ref<Deployment[]>([]);
const serverId = computed(() => Number(route.params.serverId));

useWPTitle(computed(() => [server.value?.name ?? t('ops.servers.title')]));

const statusClass = computed(() => {
  if (!server.value) {
    return '';
  }
  if (server.value.status === 'online') {
    return 'text-wp-state-ok-100';
  }
  if (server.value.status === 'maintenance') {
    return 'text-wp-state-warn-100';
  }
  return 'text-wp-error-100';
});

async function reload() {
  server.value = await apiClient.getServer(serverId.value);
  deployments.value = (await apiClient.getServerDeployments(serverId.value)) ?? [];
}

async function toggleMaintenance() {
  if (!server.value) {
    return;
  }
  server.value = await apiClient.setServerMaintenance(serverId.value, !server.value.maintenance);
}

function deploymentStatusClass(status: string): string {
  if (['success', 'healthy'].includes(status)) {
    return 'text-wp-state-ok-100';
  }
  if (['failed', 'cancelled', 'rejected'].includes(status)) {
    return 'text-wp-error-100';
  }
  if (['running', 'paused', 'approved', 'pending_approval'].includes(status)) {
    return 'text-wp-state-info-100';
  }
  return 'text-wp-state-warn-100';
}

onMounted(reload);
watch(serverId, reload);
</script>
