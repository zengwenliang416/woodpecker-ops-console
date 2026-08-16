<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold v-model:search="search">
    <template #title>{{ $t('ops.servers.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :disabled="refreshing"
        :text="$t('refresh')"
        @click="loadServers(true)"
      />
      <Button start-icon="plus" :disabled="registering" :text="$t('ops.servers.register')" @click="openRegister" />
    </template>

    <div class="mb-4">
      <InfrastructureNav :server-count="serverStore.serverList.length" :alert-count="serverStore.activeAlerts.length" />
    </div>

    <FeedbackState
      v-if="initialLoading"
      kind="loading"
      :title="$t('feedback.loading_title')"
      :description="$t('ops.servers.loading_description')"
    />
    <FeedbackState
      v-else-if="loadError && !hasConfirmedServerData"
      kind="error"
      :title="$t('ops.servers.error_title')"
      :description="$t('ops.servers.error_description')"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('ops.alerts.retry')" @click="loadServers()" />
      </template>
    </FeedbackState>
    <FeedbackState
      v-else-if="hasConfirmedServerData && serverStore.serverList.length === 0 && !hasFilters"
      kind="empty"
      :title="$t('ops.servers.none')"
      :description="$t('ops.servers.none_hint')"
    />

    <FeedbackState
      v-if="hasConfirmedServerData && loadError"
      class="mb-4"
      compact
      kind="error"
      :title="$t('ops.servers.refresh_error_title')"
      :description="$t('ops.servers.refresh_error_description')"
    />
    <FeedbackState
      v-else-if="hasConfirmedServerData && partialError"
      class="mb-4"
      compact
      kind="error"
      :title="$t('ops.servers.partial_error_title')"
      :description="$t('ops.servers.partial_error_description')"
    />

    <section v-if="hasConfirmedServerData && (serverStore.serverList.length > 0 || hasFilters)" class="wp-card">
      <div class="wp-filters">
        <select v-model="statusFilter" class="select wp-mono" :aria-label="$t('ops.servers.filter_status')">
          <option value="all">{{ $t('ops.servers.all_status') }}</option>
          <option value="online">{{ $t('ops.servers.online') }}</option>
          <option value="maintenance">{{ $t('ops.servers.maintenance') }}</option>
          <option value="offline">{{ $t('ops.servers.offline') }}</option>
          <option value="warning">{{ $t('ops.servers.warning') }}</option>
          <option value="critical">{{ $t('ops.servers.critical') }}</option>
        </select>
        <select v-model="groupFilter" class="select" :aria-label="$t('ops.servers.filter_group')">
          <option value="all">{{ $t('ops.servers.all_groups') }}</option>
          <option v-for="group in serverStore.groupList" :key="group.id" :value="String(group.id)">
            {{ group.name }}
          </option>
        </select>
        <select v-model="regionFilter" class="select" :aria-label="$t('ops.servers.filter_region')">
          <option value="all">{{ $t('ops.servers.all_regions') }}</option>
          <option v-for="region in regions" :key="region" :value="region">{{ region }}</option>
        </select>
      </div>
      <div class="wp-table-scroll">
        <table>
          <thead>
            <tr>
              <th>{{ $t('ops.server.name') }}</th>
              <th>{{ $t('ops.server.status') }}</th>
              <th>{{ $t('ops.server.environment') }}</th>
              <th>{{ $t('ops.server.cpu') }}</th>
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
                <span class="badge" :class="statusClass(server)">{{ effectiveStatus(server) }}</span>
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
                <strong>{{ $t('ops.servers.filtered_empty') }}</strong>
                <p>{{ $t('ops.servers.filtered_empty_hint') }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
      v-if="showRegister"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeRegister"
    >
      <form class="wp-card wp-stack w-full max-w-md p-5" @submit.prevent="registerServer">
        <h2 class="text-lg font-bold">{{ $t('ops.servers.register') }}</h2>
        <FeedbackState
          v-if="registerError"
          compact
          kind="error"
          :title="$t('ops.servers.register_error_title')"
          :description="$t('ops.servers.register_error_description')"
        />
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
          <Button
            type="submit"
            color="green"
            :disabled="registering"
            :is-loading="registering"
            :text="$t('ops.servers.register')"
          />
          <Button type="button" variant="ghost" :disabled="registering" :text="$t('cancel')" @click="closeRegister" />
        </div>
      </form>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
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
const groupFilter = ref('all');
const regionFilter = ref('all');
const showRegister = ref(false);
const form = reactive<Partial<Server>>({ name: '', runtime: 'docker' });
const initialLoading = ref(true);
const refreshing = ref(false);
const hasConfirmedServerData = ref(false);
const loadError = ref(false);
const partialError = ref(false);
const registering = ref(false);
const registerError = ref(false);
let loadGeneration = 0;
let mounted = true;

const filteredServers = computed(() => {
  const query = search.value.trim().toLowerCase();
  return serverStore.serverList.filter((s) => {
    const searchableLabels = Object.entries(s.labels ?? {})
      .flatMap(([key, value]) => [key, value])
      .join(' ');
    const searchable = [s.name, s.private_ip, s.public_ip, searchableLabels].filter(Boolean).join(' ').toLowerCase();
    const matchStatus = statusFilter.value === 'all' || effectiveStatus(s) === statusFilter.value;
    const matchGroup = groupFilter.value === 'all' || String(s.group_id) === groupFilter.value;
    const matchRegion = regionFilter.value === 'all' || s.region === regionFilter.value;
    const matchSearch = !query || searchable.includes(query);
    return matchStatus && matchGroup && matchRegion && matchSearch;
  });
});
const regions = computed(() =>
  [
    ...new Set(serverStore.serverList.map((server) => server.region).filter((region): region is string => !!region)),
  ].sort((left, right) => left.localeCompare(right)),
);
const hasFilters = computed(
  () =>
    search.value.trim() !== '' ||
    statusFilter.value !== 'all' ||
    groupFilter.value !== 'all' ||
    regionFilter.value !== 'all',
);

function envName(envId: number): string {
  return appStore.environments.get(envId)?.title ?? appStore.environments.get(envId)?.name ?? '—';
}

function openRegister() {
  registerError.value = false;
  showRegister.value = true;
}

function closeRegister() {
  if (registering.value) return;
  showRegister.value = false;
  registerError.value = false;
}

async function registerServer() {
  if (registering.value) return;
  registering.value = true;
  registerError.value = false;
  try {
    const created = await apiClient.createServer(form as Partial<Server>);
    if (!created) throw new Error('Server registration returned no data');
    serverStore.setServer(created);
    showRegister.value = false;
    form.name = '';
    form.runtime = 'docker';
    await loadServers(true);
  } catch {
    registerError.value = true;
  } finally {
    registering.value = false;
  }
}

function effectiveStatus(server: Server): Server['status'] | 'warning' | 'critical' {
  if (server.health === 'critical' || server.health === 'warning') return server.health;
  return server.status;
}

function statusClass(server: Server): string {
  const status = effectiveStatus(server);
  if (status === 'online') {
    return 'text-wp-state-ok-100';
  }
  if (status === 'maintenance' || status === 'warning') {
    return 'text-wp-state-warn-100';
  }
  return 'text-wp-error-100';
}

async function loadServers(refresh = false) {
  const generation = ++loadGeneration;
  loadError.value = false;
  partialError.value = false;
  if (refresh) refreshing.value = true;
  else initialLoading.value = !hasConfirmedServerData.value;

  const [serversResult, groupsResult, alertsResult, environmentsResult] = await Promise.allSettled([
    serverStore.loadServers(),
    serverStore.loadGroups(),
    serverStore.loadAlerts(),
    appStore.loadEnvironments(),
  ]);
  if (!mounted || generation !== loadGeneration) return;

  if (serversResult.status === 'fulfilled') {
    hasConfirmedServerData.value = true;
  } else {
    loadError.value = true;
  }
  partialError.value =
    groupsResult.status === 'rejected' ||
    alertsResult.status === 'rejected' ||
    environmentsResult.status === 'rejected';
  initialLoading.value = false;
  refreshing.value = false;
}

onMounted(() => {
  void loadServers();
});

onBeforeUnmount(() => {
  mounted = false;
});
</script>
