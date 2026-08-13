<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold>
    <template #title>{{ $t('ops.groups.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.groups.refresh')"
        :title="$t('ops.groups.refresh')"
        @click="loadGroups(true)"
      />
    </template>

    <div class="mb-4">
      <InfrastructureNav :server-count="servers.length" :alert-count="serverStore.activeAlerts.length" />
    </div>

    <FeedbackState
      v-if="initialLoading"
      kind="loading"
      :title="$t('ops.groups.loading_title')"
      :description="$t('ops.groups.loading_description')"
    />
    <FeedbackState
      v-else-if="loadError && !hasConfirmedData"
      kind="error"
      :title="$t('ops.groups.error_title')"
      :description="$t('ops.groups.error_description')"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('ops.groups.retry')" @click="loadGroups()" />
      </template>
    </FeedbackState>
    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('ops.groups.refresh_error_title')"
        :description="$t('ops.groups.refresh_error_description')"
      />
      <FeedbackState
        v-if="groups.length === 0"
        kind="empty"
        :title="$t('ops.groups.empty')"
        :description="$t('ops.groups.loading_description')"
      />
      <section v-else class="wp-card">
        <div class="wp-filters">
          <input v-model="search" class="input" :placeholder="$t('ops.groups.search_placeholder')" />
          <select v-model="environmentFilter" class="select">
            <option value="all">{{ $t('ops.groups.all_environments') }}</option>
            <option v-for="environment in environmentOptions" :key="environment.id" :value="String(environment.id)">
              {{ environment.title || environment.name }}
            </option>
          </select>
          <select v-model="strategyFilter" class="select">
            <option value="all">{{ $t('ops.groups.all_strategies') }}</option>
            <option v-for="strategy in strategyOptions" :key="strategy" :value="strategy">{{ strategy }}</option>
          </select>
        </div>

        <FeedbackState
          v-if="filteredGroups.length === 0"
          compact
          kind="empty"
          :title="$t('ops.groups.filtered_empty')"
          :description="$t('ops.groups.search_placeholder')"
        />
        <div v-else class="wp-table-scroll">
          <table>
            <thead>
              <tr>
                <th>{{ $t('ops.groups.name') }}</th>
                <th>{{ $t('ops.deployment.environment') }}</th>
                <th>{{ $t('ops.deployment.strategy') }}</th>
                <th>{{ $t('ops.deployment.batch_size') }}</th>
                <th>{{ $t('ops.groups.health_check') }}</th>
                <th>{{ $t('ops.groups.servers') }}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in filteredGroups" :key="group.id">
                <td>
                  <router-link class="text-wp-link-100" :to="`/infrastructure/groups/${group.id}`">{{
                    group.name
                  }}</router-link>
                  <div v-if="group.description" class="wp-muted">{{ group.description }}</div>
                </td>
                <td>{{ envName(group.environment_id) }}</td>
                <td>{{ group.strategy }}</td>
                <td>{{ group.batch_size }}</td>
                <td class="wp-mono">{{ healthEndpoint(group) }}</td>
                <td>{{ serverCount(group.id) }}</td>
                <td><IconButton icon="chevron-right" :to="`/infrastructure/groups/${group.id}`" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import InfrastructureNav from '~/components/ops/InfrastructureNav.vue';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Environment, Server, ServerGroup } from '~/lib/api/types';
import { useApplicationStore, useServerStore } from '~/store/ops';

const serverStore = useServerStore();
const appStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.groups.title')]));

const groups = ref<ServerGroup[]>([]);
const servers = ref<Server[]>([]);
const environments = ref(new Map<number, Environment>());
const search = ref('');
const environmentFilter = ref('all');
const strategyFilter = ref('all');
const initialLoading = ref(true);
const refreshing = ref(false);
const loadError = ref(false);
const hasConfirmedData = ref(false);
let alive = true;
let loadGeneration = 0;

const environmentOptions = computed(() =>
  [...environments.value.values()].toSorted((left, right) =>
    (left.title || left.name).localeCompare(right.title || right.name),
  ),
);
const strategyOptions = computed(() => [...new Set(groups.value.map((group) => group.strategy))].toSorted());
const filteredGroups = computed(() => {
  const query = search.value.trim().toLowerCase();
  return groups.value.filter((group) => {
    const matchesSearch =
      !query ||
      `${group.name} ${group.description ?? ''} ${envName(group.environment_id)}`.toLowerCase().includes(query);
    const matchesEnvironment =
      environmentFilter.value === 'all' || String(group.environment_id) === environmentFilter.value;
    const matchesStrategy = strategyFilter.value === 'all' || group.strategy === strategyFilter.value;
    return matchesSearch && matchesEnvironment && matchesStrategy;
  });
});

function envName(id: number) {
  const environment = environments.value.get(id);
  return environment?.title || environment?.name || `#${id}`;
}

function healthEndpoint(group: ServerGroup) {
  if (!group.health_path && !group.port) return '—';
  return `${group.port ? `:${group.port}` : ''}${group.health_path ?? ''}`;
}

function serverCount(groupId: number) {
  return servers.value.filter((server) => server.group_id === groupId).length;
}

async function loadGroups(refresh = false) {
  const generation = ++loadGeneration;
  loadError.value = false;
  if (refresh) refreshing.value = true;
  else initialLoading.value = !hasConfirmedData.value;

  try {
    await Promise.all([
      serverStore.loadGroups(),
      serverStore.loadServers(),
      Promise.allSettled([serverStore.loadAlerts(), appStore.loadEnvironments()]),
    ]);
    if (!alive || generation !== loadGeneration) return;
    groups.value = [...serverStore.groupList];
    servers.value = [...serverStore.serverList];
    environments.value = new Map(appStore.environments);
    hasConfirmedData.value = true;
  } catch {
    if (alive && generation === loadGeneration) loadError.value = true;
  } finally {
    if (alive && generation === loadGeneration) {
      initialLoading.value = false;
      refreshing.value = false;
    }
  }
}

onMounted(() => loadGroups());
onBeforeUnmount(() => {
  alive = false;
  loadGeneration += 1;
});
</script>
