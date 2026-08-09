<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>{{ $t('ops.deployments.title') }}</template>
    <template #headerActions>
      <Button color="green" start-icon="rocket" :text="$t('ops.deployments.new')" :to="{ path: '/deployments/new' }" />
    </template>

    <div class="mb-4">
      <DeploymentNav
        :application-count="appStore.applicationList.length"
        :environment-count="appStore.environmentList.length"
        :release-count="appStore.releaseList.length"
        :approval-count="store.pendingApprovals.length"
      />
    </div>

    <div class="wp-metric-grid">
      <div class="wp-metric-card">
        <div class="wp-metric-head"><Icon name="rocket" />{{ $t('ops.deployments.total') }}</div>
        <div class="wp-metric-body">
          <strong>{{ store.deploymentList.length }}</strong>
        </div>
      </div>
      <div class="wp-metric-card">
        <div class="wp-metric-head">
          <Icon name="activity" class="text-wp-state-info-100" />{{ $t('ops.deployments.running') }}
        </div>
        <div class="wp-metric-body">
          <strong class="text-wp-state-info-100">{{ store.runningDeployments.length }}</strong>
        </div>
      </div>
      <div class="wp-metric-card">
        <div class="wp-metric-head">
          <Icon name="shield" class="text-wp-state-warn-100" />{{ $t('ops.deployments.pending_approval') }}
        </div>
        <div class="wp-metric-body">
          <strong class="text-wp-state-warn-100">{{ store.pendingApprovals.length }}</strong>
        </div>
      </div>
      <div class="wp-metric-card">
        <div class="wp-metric-head">
          <Icon name="check" class="text-wp-state-ok-100" />{{ $t('ops.deployments.success') }}
        </div>
        <div class="wp-metric-body">
          <strong class="text-wp-state-ok-100">{{
            store.deploymentList.filter((d) => d.status === 'success').length
          }}</strong>
        </div>
      </div>
    </div>

    <section class="wp-card">
      <div class="wp-table-scroll">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ $t('ops.deployment.status') }}</th>
              <th>{{ $t('ops.deployment.application') }}</th>
              <th>{{ $t('ops.deployment.release') }}</th>
              <th>{{ $t('ops.deployment.environment') }}</th>
              <th>{{ $t('ops.deployment.strategy') }}</th>
              <th>{{ $t('ops.deployment.progress') }}</th>
              <th>{{ $t('ops.deployment.triggered_by') }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in store.deploymentList" :key="d.id">
              <td>
                <router-link class="text-wp-link-100" :to="`/deployments/${d.id}`">DEP-{{ d.id }}</router-link>
              </td>
              <td>
                <span class="badge" :class="statusClass(d.status)">{{ d.status }}</span>
              </td>
              <td>{{ appName(d.application_id) }}</td>
              <td class="wp-mono">{{ releaseVersion(d.release_id) }}</td>
              <td>{{ envName(d.environment_id) }}</td>
              <td>{{ d.strategy }}{{ d.batch_size > 1 ? ` (${d.batch_size})` : '' }}</td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="bg-wp-background-200 h-1.5 w-24 overflow-hidden rounded-full">
                    <div class="bg-wp-primary-100 h-full rounded-full" :style="{ width: `${d.progress}%` }" />
                  </div>
                  <span class="wp-muted text-xs">{{ d.progress }}%</span>
                </div>
              </td>
              <td>{{ d.triggered_by }}</td>
              <td>
                <IconButton icon="chevron-right" :to="`/deployments/${d.id}`" :title="$t('ops.deployments.view')" />
              </td>
            </tr>
            <tr v-if="store.deploymentList.length === 0">
              <td colspan="9" class="wp-empty-state">
                <strong>{{ $t('ops.deployments.none') }}</strong>
                <p>{{ $t('ops.deployments.none_hint') }}</p>
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

import Icon from '~/components/atomic/Icon.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Button from '~/components/atomic/Button.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useApplicationStore, useDeploymentStore } from '~/store/ops';

const store = useDeploymentStore();
const appStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.deployments.title')]));

function appName(appId: number): string {
  return appStore.applications.get(appId)?.name ?? `#${appId}`;
}

function releaseVersion(releaseId: number): string {
  return appStore.releases.get(releaseId)?.version ?? `#${releaseId}`;
}

function envName(envId: number): string {
  return appStore.environments.get(envId)?.title ?? appStore.environments.get(envId)?.name ?? `#${envId}`;
}

function statusClass(status: string): string {
  if (status === 'success') {
    return 'text-wp-state-ok-100';
  }
  if (['failed', 'cancelled', 'rejected'].includes(status)) {
    return 'text-wp-error-100';
  }
  if (['running', 'paused', 'approved'].includes(status)) {
    return 'text-wp-state-info-100';
  }
  if (status === 'pending_approval') {
    return 'text-wp-state-warn-100';
  }
  return 'text-wp-text-alt-100';
}

onMounted(async () => {
  await Promise.all([store.loadDeployments(), appStore.loadAll()]);
});
</script>
