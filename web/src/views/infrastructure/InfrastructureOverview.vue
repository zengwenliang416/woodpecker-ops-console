<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>{{ $t('ops.infrastructure.title') }}</template>
    <template #headerActions>
      <Button :to="{ path: '/infrastructure/servers' }" start-icon="server" :text="$t('ops.infrastructure.manage_servers')" />
    </template>

    <div v-if="overview" class="wp-stack">
      <div class="wp-metric-grid">
        <div class="wp-metric-card">
          <div class="wp-metric-head"><Icon name="server" />{{ $t('ops.infrastructure.total_servers') }}</div>
          <div class="wp-metric-body"><strong>{{ overview.server_count }}</strong></div>
        </div>
        <div class="wp-metric-card">
          <div class="wp-metric-head"><Icon name="server" class="text-wp-state-ok-100" />{{ $t('ops.infrastructure.online') }}</div>
          <div class="wp-metric-body"><strong class="text-wp-state-ok-100">{{ overview.server_online }}</strong></div>
        </div>
        <div class="wp-metric-card">
          <div class="wp-metric-head"><Icon name="bell" class="text-wp-state-warn-100" />{{ $t('ops.infrastructure.active_alerts') }}</div>
          <div class="wp-metric-body"><strong class="text-wp-state-warn-100">{{ overview.active_alerts }}</strong></div>
        </div>
        <div class="wp-metric-card">
          <div class="wp-metric-head"><Icon name="activity" />{{ $t('ops.infrastructure.avg_cpu') }}</div>
          <div class="wp-metric-body"><strong>{{ overview.avg_cpu.toFixed(0) }}%</strong></div>
        </div>
      </div>

      <div class="wp-grid wp-grid-sidebar">
        <section class="wp-card">
          <div class="wp-card-header"><h2>{{ $t('ops.infrastructure.servers') }}</h2><router-link class="text-wp-link-100 text-xs" to="/infrastructure/servers">{{ $t('ops.infrastructure.view_all') }}</router-link></div>
          <div class="wp-table-scroll">
            <table>
              <thead><tr><th>{{ $t('ops.server.name') }}</th><th>{{ $t('ops.server.status') }}</th><th>CPU</th><th>{{ $t('ops.server.memory') }}</th><th>{{ $t('ops.server.disk') }}</th><th>{{ $t('ops.server.heartbeat') }}</th></tr></thead>
              <tbody>
                <tr v-for="server in overview.servers.slice(0, 8)" :key="server.id">
                  <td><router-link class="text-wp-link-100" :to="`/infrastructure/servers/${server.id}`">{{ server.name }}</router-link></td>
                  <td><span class="badge" :class="statusClass(server)">{{ server.status }}</span></td>
                  <td>{{ server.cpu.toFixed(0) }}%</td>
                  <td>{{ server.memory.toFixed(0) }}%</td>
                  <td>{{ server.disk.toFixed(0) }}%</td>
                  <td class="wp-muted">{{ server.last_heartbeat ? new Date(server.last_heartbeat * 1000).toLocaleTimeString() : '—' }}</td>
                </tr>
                <tr v-if="overview.servers.length === 0"><td colspan="6" class="wp-empty-state"><strong>{{ $t('ops.infrastructure.no_servers') }}</strong><p>{{ $t('ops.infrastructure.no_servers_hint') }}</p></td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside class="wp-stack">
          <section class="wp-card">
            <div class="wp-card-header"><h2>{{ $t('ops.infrastructure.groups') }}</h2></div>
            <div class="wp-card-body wp-stack">
              <div v-for="group in overview.groups" :key="group.id" class="wp-split">
                <router-link class="text-wp-link-100" :to="`/infrastructure/groups/${group.id}`">{{ group.name }}</router-link>
                <span class="wp-muted">{{ group.strategy }} · {{ group.batch_size }}</span>
              </div>
              <span v-if="overview.groups.length === 0" class="wp-muted">{{ $t('ops.infrastructure.no_groups') }}</span>
            </div>
          </section>
          <section class="wp-card">
            <div class="wp-card-header"><h2>{{ $t('ops.infrastructure.latest_alerts') }}</h2><router-link class="text-wp-link-100 text-xs" to="/infrastructure/alerts">{{ $t('ops.infrastructure.view_all') }}</router-link></div>
            <div class="wp-card-body wp-stack">
              <div v-for="alert in overview.alerts.slice(0, 4)" :key="alert.id" class="wp-cluster">
                <span class="badge" :class="severityClass(alert.severity)">{{ alert.severity }}</span>
                <span>{{ alert.message }}</span>
              </div>
              <span v-if="overview.alerts.length === 0" class="wp-muted">{{ $t('ops.infrastructure.no_alerts') }}</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
    <div v-else class="flex justify-center py-20"><Icon name="spinner" class="animate-spin" /></div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import Icon from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { InfrastructureOverview, Server } from '~/lib/api/types';

const apiClient = useApiClient();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.infrastructure.title')]));

const overview = ref<InfrastructureOverview | null>(null);

onMounted(async () => {
  overview.value = await apiClient.getInfrastructureOverview();
});

function statusClass(server: Server): string {
  if (server.status === 'online') {
    return 'text-wp-state-ok-100';
  }
  if (server.status === 'maintenance') {
    return 'text-wp-state-warn-100';
  }
  return 'text-wp-error-100';
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
</script>
