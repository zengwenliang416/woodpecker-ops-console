<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold :go-back="() => router.push('/infrastructure/groups')">
    <template #title>{{ group?.name ?? $t('ops.groups.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.groups.refresh')"
        :title="$t('ops.groups.refresh')"
        @click="loadGroup(true)"
      />
    </template>

    <div class="mb-4">
      <InfrastructureNav :server-count="allServers.length" :alert-count="serverStore.activeAlerts.length" />
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
        <Button start-icon="refresh" :text="$t('ops.groups.retry')" @click="loadGroup()" />
      </template>
    </FeedbackState>
    <FeedbackState
      v-else-if="hasConfirmedData && !group"
      kind="empty"
      :title="$t('ops.groups.missing_title')"
      :description="$t('ops.groups.missing_description')"
    />
    <template v-else-if="group">
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('ops.groups.refresh_error_title')"
        :description="$t('ops.groups.refresh_error_description')"
      />
      <div class="wp-grid wp-grid-sidebar">
        <section class="wp-card">
          <div class="wp-card-header">
            <h2>{{ $t('ops.groups.details') }}</h2>
          </div>
          <div class="wp-card-body wp-grid wp-grid-2">
            <div class="wp-muted">{{ $t('ops.groups.description') }}</div>
            <div>{{ group.description || '—' }}</div>
            <div class="wp-muted">{{ $t('ops.deployment.environment') }}</div>
            <div>{{ envName(group.environment_id) }}</div>
            <div class="wp-muted">{{ $t('ops.deployment.strategy') }}</div>
            <div>{{ group.strategy }}</div>
            <div class="wp-muted">{{ $t('ops.deployment.batch_size') }}</div>
            <div>{{ group.batch_size }}</div>
            <div class="wp-muted">{{ $t('ops.groups.health_check') }}</div>
            <div class="wp-mono">{{ healthEndpoint(group) }}</div>
            <div class="wp-muted">{{ $t('ops.groups.servers') }}</div>
            <div>{{ servers.length }}</div>
          </div>
        </section>
        <section class="wp-card">
          <div class="wp-card-header">
            <h2>{{ $t('ops.groups.servers') }}</h2>
          </div>
          <FeedbackState
            v-if="servers.length === 0"
            compact
            kind="empty"
            :title="$t('ops.groups.empty_servers')"
            :description="$t('ops.groups.description')"
          />
          <div v-else class="wp-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{{ $t('ops.server.name') }}</th>
                  <th>{{ $t('ops.server.status') }}</th>
                  <th>CPU</th>
                  <th>{{ $t('ops.server.memory') }}</th>
                  <th>{{ $t('ops.server.disk') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="server in servers" :key="server.id">
                  <td>
                    <router-link class="text-wp-link-100" :to="`/infrastructure/servers/${server.id}`">{{
                      server.name
                    }}</router-link>
                  </td>
                  <td>{{ server.health }} · {{ server.status }}</td>
                  <td>{{ server.cpu.toFixed(0) }}%</td>
                  <td>{{ server.memory.toFixed(0) }}%</td>
                  <td>{{ server.disk.toFixed(0) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import InfrastructureNav from '~/components/ops/InfrastructureNav.vue';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Environment, Server, ServerGroup } from '~/lib/api/types';
import { useApplicationStore, useServerStore } from '~/store/ops';

const route = useRoute();
const router = useRouter();
const serverStore = useServerStore();
const appStore = useApplicationStore();
const { t } = useI18n();

const group = ref<ServerGroup | null>(null);
const allServers = ref<Server[]>([]);
const environments = ref(new Map<number, Environment>());
const initialLoading = ref(true);
const refreshing = ref(false);
const loadError = ref(false);
const hasConfirmedData = ref(false);
let alive = true;
let loadGeneration = 0;

const groupId = computed(() => Number(route.params.groupId));
const servers = computed(() => allServers.value.filter((server) => server.group_id === groupId.value));
useWPTitle(computed(() => [group.value?.name ?? t('ops.groups.title')]));

function envName(id: number) {
  const environment = environments.value.get(id);
  return environment?.title || environment?.name || `#${id}`;
}

function healthEndpoint(value: ServerGroup) {
  if (!value.health_path && !value.port) return '—';
  return `${value.port ? `:${value.port}` : ''}${value.health_path ?? ''}`;
}

async function loadGroup(refresh = false) {
  const requestedId = groupId.value;
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
    if (!alive || generation !== loadGeneration || requestedId !== groupId.value) return;
    group.value = serverStore.groups.get(requestedId) ?? null;
    allServers.value = [...serverStore.serverList];
    environments.value = new Map(appStore.environments);
    hasConfirmedData.value = true;
  } catch {
    if (alive && generation === loadGeneration && requestedId === groupId.value) loadError.value = true;
  } finally {
    if (alive && generation === loadGeneration && requestedId === groupId.value) {
      initialLoading.value = false;
      refreshing.value = false;
    }
  }
}

watch(groupId, () => loadGroup(), { immediate: true });
onBeforeUnmount(() => {
  alive = false;
  loadGeneration += 1;
});
</script>
