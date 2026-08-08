<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>{{ $t('ops.services.title') }}</template>
    <section class="wp-card">
      <div class="wp-table-scroll">
        <table>
          <thead><tr><th>{{ $t('ops.server.name') }}</th><th>{{ $t('ops.services.runtime') }}</th><th>{{ $t('ops.services.status') }}</th><th>CPU</th><th>{{ $t('ops.server.memory') }}</th></tr></thead>
          <tbody>
            <tr v-for="service in services" :key="service.server_id">
              <td><router-link class="text-wp-link-100" :to="`/infrastructure/servers/${service.server_id}`">{{ service.server_name }}</router-link></td>
              <td>{{ service.runtime }}</td>
              <td><span class="badge" :class="service.status === 'healthy' ? 'text-wp-state-ok-100' : service.status === 'degraded' ? 'text-wp-state-warn-100' : 'text-wp-error-100'">{{ service.status }}</span></td>
              <td>{{ service.cpu.toFixed(0) }}%</td>
              <td>{{ service.memory.toFixed(0) }}%</td>
            </tr>
            <tr v-if="services.length === 0"><td colspan="5" class="wp-empty-state"><strong>{{ $t('ops.services.none') }}</strong></td></tr>
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
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';

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
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.services.title')]));
const services = ref<ServiceView[]>([]);

onMounted(async () => {
  services.value = (await api.getOpsServices()) as ServiceView[];
});
</script>
