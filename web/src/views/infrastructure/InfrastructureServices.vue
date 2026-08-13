<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold>
    <template #title>{{ $t('ops.services.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.services.refresh')"
        :title="$t('ops.services.refresh')"
        @click="loadServices(true)"
      />
    </template>

    <div class="mb-4">
      <InfrastructureNav :server-count="serverStore.serverList.length" :alert-count="serverStore.activeAlerts.length" />
    </div>

    <FeedbackState
      v-if="initialLoading"
      kind="loading"
      :title="$t('ops.services.loading_title')"
      :description="$t('ops.services.loading_description')"
    />
    <FeedbackState
      v-else-if="loadError && !hasConfirmedData"
      kind="error"
      :title="$t('ops.services.error_title')"
      :description="$t('ops.services.error_description')"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('ops.services.retry')" @click="loadServices()" />
      </template>
    </FeedbackState>
    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('ops.services.refresh_error_title')"
        :description="$t('ops.services.refresh_error_description')"
      />
      <FeedbackState
        v-if="services.length === 0"
        kind="empty"
        :title="$t('ops.services.none')"
        :description="$t('ops.services.loading_description')"
      />
      <template v-else>
        <div class="wp-metric-grid">
          <OpsMetricCard icon="server" :label="$t('ops.services.monitored_nodes')" :value="String(services.length)" />
          <OpsMetricCard
            icon="check"
            :label="$t('ops.services.healthy_nodes')"
            :value="String(healthyCount)"
            tone="success"
          />
          <OpsMetricCard
            icon="alert"
            :label="$t('ops.services.degraded_nodes')"
            :value="String(degradedCount)"
            :tone="degradedCount > 0 ? 'warning' : 'success'"
          />
          <OpsMetricCard
            icon="docker"
            :label="$t('ops.services.containers')"
            :value="String(containerCount)"
            tone="info"
          />
        </div>

        <section class="wp-card">
          <div class="wp-filters">
            <input v-model="search" class="input" :placeholder="$t('ops.services.search_placeholder')" />
            <select v-model="statusFilter" class="select">
              <option value="all">{{ $t('ops.services.all_statuses') }}</option>
              <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
            </select>
          </div>

          <FeedbackState
            v-if="filteredServices.length === 0"
            compact
            kind="empty"
            :title="$t('ops.services.filtered_none')"
            :description="$t('ops.services.search_placeholder')"
          />
          <div v-else class="wp-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{{ $t('ops.server.name') }}</th>
                  <th>{{ $t('ops.services.runtime') }}</th>
                  <th>{{ $t('ops.services.status') }}</th>
                  <th>{{ $t('ops.services.containers') }}</th>
                  <th>CPU</th>
                  <th>{{ $t('ops.server.memory') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="service in filteredServices" :key="service.server_id">
                  <td>
                    <router-link
                      class="text-wp-link-100"
                      :to="{ name: 'infrastructure-server', params: { serverId: service.server_id } }"
                      >{{ service.server_name }}</router-link
                    >
                  </td>
                  <td>{{ service.runtime || '—' }}</td>
                  <td>
                    <span class="badge" :class="serviceStatusClass(service.status)">{{ service.status }}</span>
                  </td>
                  <td>{{ service.containers }}</td>
                  <td>{{ service.cpu.toFixed(0) }}%</td>
                  <td>{{ service.memory.toFixed(0) }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </template>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import InfrastructureNav from '~/components/ops/InfrastructureNav.vue';
import OpsMetricCard from '~/components/ops/OpsMetricCard.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useServerStore } from '~/store/ops';

interface ServiceView {
  server_id: number;
  server_name: string;
  runtime: string;
  status: string;
  containers: number;
  cpu: number;
  memory: number;
}

const api = useApiClient();
const serverStore = useServerStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.services.title')]));

const services = ref<ServiceView[]>([]);
const search = ref('');
const statusFilter = ref('all');
const initialLoading = ref(true);
const refreshing = ref(false);
const loadError = ref(false);
const hasConfirmedData = ref(false);
let alive = true;
let loadGeneration = 0;

const statusOptions = computed(() => [...new Set(services.value.map((service) => service.status))].toSorted());
const filteredServices = computed(() => {
  const query = search.value.trim().toLowerCase();
  return services.value.filter((service) => {
    const matchesSearch =
      !query || `${service.server_name} ${service.runtime} ${service.status}`.toLowerCase().includes(query);
    const matchesStatus = statusFilter.value === 'all' || service.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});
const healthyCount = computed(() => services.value.filter((service) => service.status === 'healthy').length);
const degradedCount = computed(
  () => services.value.filter((service) => ['degraded', 'unreachable', 'stopped'].includes(service.status)).length,
);
const containerCount = computed(() => services.value.reduce((total, service) => total + service.containers, 0));

function normalizeServices(value: unknown[] | null): ServiceView[] {
  return (value ?? []).filter(
    (item): item is ServiceView =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as ServiceView).server_id === 'number' &&
      typeof (item as ServiceView).server_name === 'string' &&
      typeof (item as ServiceView).runtime === 'string' &&
      typeof (item as ServiceView).status === 'string' &&
      typeof (item as ServiceView).containers === 'number' &&
      typeof (item as ServiceView).cpu === 'number' &&
      typeof (item as ServiceView).memory === 'number',
  );
}

function serviceStatusClass(status: string) {
  if (status === 'healthy') return 'text-wp-state-ok-100';
  if (status === 'degraded' || status === 'stopped') return 'text-wp-state-warn-100';
  return 'text-wp-error-100';
}

async function loadServices(refresh = false) {
  const generation = ++loadGeneration;
  loadError.value = false;
  if (refresh) refreshing.value = true;
  else initialLoading.value = !hasConfirmedData.value;

  try {
    const serviceList = await api.getOpsServices();
    if (!alive || generation !== loadGeneration) return;
    services.value = normalizeServices(serviceList);
    hasConfirmedData.value = true;
    void serverStore.loadAll().catch(() => undefined);
  } catch {
    if (alive && generation === loadGeneration) loadError.value = true;
  } finally {
    if (alive && generation === loadGeneration) {
      initialLoading.value = false;
      refreshing.value = false;
    }
  }
}

onMounted(() => loadServices());
onBeforeUnmount(() => {
  alive = false;
  loadGeneration += 1;
});
</script>
