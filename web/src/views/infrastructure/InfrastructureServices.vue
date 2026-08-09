<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold>
    <template #title>{{ $t('ops.services.title') }}</template>
    <div class="mb-4">
      <InfrastructureNav :server-count="serverStore.serverList.length" :alert-count="serverStore.activeAlerts.length" />
    </div>
    <section class="wp-card">
      <div class="wp-table-scroll">
        <table>
          <thead>
            <tr>
              <th>{{ $t('ops.server.name') }}</th>
              <th>{{ $t('ops.services.runtime') }}</th>
              <th>{{ $t('ops.services.status') }}</th>
              <th>CPU</th>
              <th>{{ $t('ops.server.memory') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in services" :key="service.server_id">
              <td>
                <router-link class="text-wp-link-100" :to="`/infrastructure/servers/${service.server_id}`">{{
                  service.server_name
                }}</router-link>
              </td>
              <td>{{ service.runtime }}</td>
              <td>
                <span
                  class="badge"
                  :class="
                    service.status === 'healthy'
                      ? 'text-wp-state-ok-100'
                      : service.status === 'degraded'
                        ? 'text-wp-state-warn-100'
                        : 'text-wp-error-100'
                  "
                  >{{ service.status }}</span
                >
              </td>
              <td>{{ service.cpu.toFixed(0) }}%</td>
              <td>{{ service.memory.toFixed(0) }}%</td>
            </tr>
            <tr v-if="services.length === 0">
              <td colspan="5" class="wp-empty-state">
                <strong>{{ $t('ops.services.none') }}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import InfrastructureNav from '~/components/ops/InfrastructureNav.vue';
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

onMounted(async () => {
  const [serviceList] = await Promise.all([api.getOpsServices(), serverStore.loadAll()]);
  services.value = serviceList as ServiceView[];
});
</script>
