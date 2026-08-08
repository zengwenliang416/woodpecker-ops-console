<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>{{ $t('ops.groups.title') }}</template>
    <section class="wp-card">
      <div class="wp-table-scroll">
        <table>
          <thead><tr><th>{{ $t('ops.groups.name') }}</th><th>{{ $t('ops.deployment.environment') }}</th><th>{{ $t('ops.deployment.strategy') }}</th><th>{{ $t('ops.deployment.batch_size') }}</th><th>{{ $t('ops.groups.servers') }}</th><th /></tr></thead>
          <tbody>
            <tr v-for="group in serverStore.groupList" :key="group.id">
              <td><router-link class="text-wp-link-100" :to="`/infrastructure/groups/${group.id}`">{{ group.name }}</router-link></td>
              <td>{{ envName(group.environment_id) }}</td>
              <td>{{ group.strategy }}</td>
              <td>{{ group.batch_size }}</td>
              <td>{{ serverStore.serverList.filter((s) => s.group_id === group.id).length }}</td>
              <td><IconButton icon="chevron-right" :to="`/infrastructure/groups/${group.id}`" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import IconButton from '~/components/atomic/IconButton.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useApplicationStore, useServerStore } from '~/store/ops';

const serverStore = useServerStore();
const appStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.groups.title')]));

function envName(id: number) {
  return appStore.environments.get(id)?.title ?? `#${id}`;
}

onMounted(() => Promise.all([serverStore.loadAll(), appStore.loadEnvironments()]));
</script>
