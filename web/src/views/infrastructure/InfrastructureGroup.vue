<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold :go-back="() => router.push('/infrastructure/groups')">
    <template #title>{{ group?.name ?? '...' }}</template>
    <div class="mb-4">
      <InfrastructureNav :server-count="serverStore.serverList.length" :alert-count="serverStore.activeAlerts.length" />
    </div>
    <div v-if="group" class="wp-grid wp-grid-sidebar">
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
          <div>{{ group.strategy }} · batch {{ group.batch_size }}</div>
          <div class="wp-muted">Health</div>
          <div>{{ group.health_path || '—' }} :{{ group.port || '—' }}</div>
        </div>
      </section>
      <section class="wp-card">
        <div class="wp-card-header">
          <h2>{{ $t('ops.groups.servers') }}</h2>
        </div>
        <div class="wp-table-scroll">
          <table>
            <thead>
              <tr>
                <th>{{ $t('ops.server.name') }}</th>
                <th>{{ $t('ops.server.status') }}</th>
                <th>CPU</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="server in servers" :key="server.id">
                <td>
                  <router-link class="text-wp-link-100" :to="`/infrastructure/servers/${server.id}`">{{
                    server.name
                  }}</router-link>
                </td>
                <td>{{ server.status }}</td>
                <td>{{ server.cpu.toFixed(0) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import InfrastructureNav from '~/components/ops/InfrastructureNav.vue';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useApplicationStore, useServerStore } from '~/store/ops';

const route = useRoute();
const router = useRouter();
const serverStore = useServerStore();
const appStore = useApplicationStore();
const { t } = useI18n();
const groupId = computed(() => Number(route.params.groupId));
const group = computed(() => serverStore.groups.get(groupId.value));
const servers = computed(() => serverStore.serverList.filter((s) => s.group_id === groupId.value));
useWPTitle(computed(() => [group.value?.name ?? t('ops.groups.title')]));

function envName(id: number) {
  return appStore.environments.get(id)?.title ?? `#${id}`;
}

onMounted(() => Promise.all([serverStore.loadAll(), appStore.loadEnvironments()]));
</script>
