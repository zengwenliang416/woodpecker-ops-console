<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>{{ $t('ops.approvals.title') }}</template>
    <div class="mb-4">
      <DeploymentNav
        :application-count="appStore.applicationList.length"
        :environment-count="appStore.environmentList.length"
        :release-count="appStore.releaseList.length"
        :approval-count="store.pendingApprovals.length"
      />
    </div>
    <section class="wp-card">
      <div class="wp-table-scroll">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ $t('ops.deployment.application') }}</th>
              <th>{{ $t('ops.deployment.environment') }}</th>
              <th>{{ $t('ops.deployment.release') }}</th>
              <th>{{ $t('ops.deployment.triggered_by') }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in store.pendingApprovals" :key="d.id">
              <td>
                <router-link class="text-wp-link-100" :to="`/deployments/${d.id}`">DEP-{{ d.id }}</router-link>
              </td>
              <td>{{ appName(d.application_id) }}</td>
              <td>{{ envName(d.environment_id) }}</td>
              <td class="wp-mono">{{ releaseVersion(d.release_id) }}</td>
              <td>{{ d.triggered_by }}</td>
              <td><IconButton icon="chevron-right" :to="`/deployments/${d.id}`" /></td>
            </tr>
            <tr v-if="store.pendingApprovals.length === 0">
              <td colspan="6" class="wp-empty-state">
                <strong>{{ $t('ops.approvals.none') }}</strong>
              </td>
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
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useApplicationStore, useDeploymentStore } from '~/store/ops';

const store = useDeploymentStore();
const appStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.approvals.title')]));

function appName(id: number) {
  return appStore.applications.get(id)?.name ?? `#${id}`;
}
function envName(id: number) {
  return appStore.environments.get(id)?.title ?? `#${id}`;
}
function releaseVersion(id: number) {
  return appStore.releases.get(id)?.version ?? `#${id}`;
}

onMounted(() => Promise.all([store.loadDeployments(), appStore.loadAll()]));
</script>
