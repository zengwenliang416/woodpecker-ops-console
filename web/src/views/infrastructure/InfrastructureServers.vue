<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold v-model:search="search">
    <template #title>{{ $t('ops.servers.title') }}</template>
    <template #headerActions>
      <Button start-icon="plus" :text="$t('ops.servers.register')" @click="showRegister = true" />
    </template>

    <div class="mb-4">
      <InfrastructureNav :server-count="serverStore.serverList.length" :alert-count="serverStore.activeAlerts.length" />
    </div>
    <section class="wp-card">
      <div class="wp-filters">
        <select v-model="statusFilter" class="select wp-mono">
          <option value="all">{{ $t('ops.servers.all_status') }}</option>
          <option value="online">{{ $t('ops.servers.online') }}</option>
          <option value="maintenance">{{ $t('ops.servers.maintenance') }}</option>
          <option value="offline">{{ $t('ops.servers.offline') }}</option>
        </select>
      </div>
      <div class="wp-table-scroll">
        <table>
          <thead>
            <tr>
              <th>{{ $t('ops.server.name') }}</th>
              <th>{{ $t('ops.server.status') }}</th>
              <th>{{ $t('ops.server.environment') }}</th>
              <th>CPU</th>
              <th>{{ $t('ops.server.memory') }}</th>
              <th>{{ $t('ops.server.disk') }}</th>
              <th>{{ $t('ops.server.runtime') }}</th>
              <th>{{ $t('ops.server.heartbeat') }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="server in filteredServers" :key="server.id">
              <td>
                <router-link class="text-wp-link-100" :to="`/infrastructure/servers/${server.id}`">{{
                  server.name
                }}</router-link>
              </td>
              <td>
                <span class="badge" :class="statusClass(server)">{{ server.status }}</span>
              </td>
              <td>{{ envName(server.environment_id) }}</td>
              <td>{{ server.cpu.toFixed(0) }}%</td>
              <td>{{ server.memory.toFixed(0) }}%</td>
              <td>{{ server.disk.toFixed(0) }}%</td>
              <td class="wp-muted">{{ server.runtime }}</td>
              <td class="wp-muted">
                {{ server.last_heartbeat ? new Date(server.last_heartbeat * 1000).toLocaleTimeString() : '—' }}
              </td>
              <td>
                <IconButton
                  icon="settings"
                  :title="$t('ops.servers.manage')"
                  :to="`/infrastructure/servers/${server.id}`"
                />
              </td>
            </tr>
            <tr v-if="filteredServers.length === 0">
              <td colspan="9" class="wp-empty-state">
                <strong>{{ $t('ops.servers.none') }}</strong>
                <p>{{ $t('ops.servers.none_hint') }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
      v-if="showRegister"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      @click.self="showRegister = false"
    >
      <form class="wp-card wp-stack w-full max-w-md p-5" @submit.prevent="registerServer">
        <h2 class="text-lg font-bold">{{ $t('ops.servers.register') }}</h2>
        <label class="field"
          ><span class="field-label">{{ $t('ops.server.name') }}</span
          ><input v-model="form.name" class="input" required
        /></label>
        <label class="field"
          ><span class="field-label">{{ $t('ops.server.runtime') }}</span>
          <select v-model="form.runtime" class="select">
            <option>docker</option>
            <option>kubernetes</option>
            <option>systemd</option>
          </select>
        </label>
        <div class="wp-cluster">
          <Button type="submit" color="green" :text="$t('ops.servers.register')" />
          <Button type="button" variant="ghost" :text="$t('cancel')" @click="showRegister = false" />
        </div>
      </form>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import InfrastructureNav from '~/components/ops/InfrastructureNav.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Server } from '~/lib/api/types';
import { useApplicationStore, useServerStore } from '~/store/ops';

const apiClient = useApiClient();
const serverStore = useServerStore();
const appStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.servers.title')]));

const search = ref('');
const statusFilter = ref('all');
const showRegister = ref(false);
const form = reactive<Partial<Server>>({ name: '', runtime: 'docker' });

const filteredServers = computed(() => {
  const q = search.value.toLowerCase();
  return serverStore.serverList.filter((s) => {
    const matchStatus = statusFilter.value === 'all' || s.status === statusFilter.value;
    const matchSearch = !q || s.name.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
});

function envName(envId: number): string {
  return appStore.environments.get(envId)?.title ?? appStore.environments.get(envId)?.name ?? '—';
}

async function registerServer() {
  await apiClient.createServer(form as Partial<Server>);
  showRegister.value = false;
  await serverStore.loadServers();
}

function statusClass(server: Server): string {
  if (server.status === 'online') {
    return 'text-wp-state-ok-100';
  }
  if (server.status === 'maintenance') {
    return 'text-wp-state-warn-100';
  }
  return 'text-wp-error-100';
}

onMounted(async () => {
  await Promise.all([serverStore.loadAll(), appStore.loadEnvironments()]);
});
</script>
