<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>{{ $t('ops.deployments.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.deployments.refresh')"
        :title="$t('ops.deployments.refresh')"
        @click="loadDeployments(true)"
      />
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

    <FeedbackState
      v-if="initialLoading"
      kind="loading"
      :title="$t('ops.deployments.loading_title')"
      :description="$t('ops.deployments.loading_description')"
    />
    <FeedbackState
      v-else-if="loadError && !hasConfirmedData"
      kind="error"
      :title="$t('ops.deployments.error_title')"
      :description="$t('ops.deployments.error_description')"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('ops.deployments.retry')" @click="loadDeployments()" />
      </template>
    </FeedbackState>
    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('ops.deployments.refresh_error_title')"
        :description="$t('ops.deployments.refresh_error_description')"
      />
      <div class="wp-metric-grid">
        <div class="wp-metric-card">
          <div class="wp-metric-head"><Icon name="rocket" />{{ $t('ops.deployments.total') }}</div>
          <div class="wp-metric-body">
            <strong>{{ deployments.length }}</strong>
          </div>
        </div>
        <div class="wp-metric-card">
          <div class="wp-metric-head">
            <Icon name="activity" class="text-wp-state-info-100" />{{ $t('ops.deployments.running') }}
          </div>
          <div class="wp-metric-body">
            <strong class="text-wp-state-info-100">{{ runningCount }}</strong>
          </div>
        </div>
        <div class="wp-metric-card">
          <div class="wp-metric-head">
            <Icon name="shield" class="text-wp-state-warn-100" />{{ $t('ops.deployments.pending_approval') }}
          </div>
          <div class="wp-metric-body">
            <strong class="text-wp-state-warn-100">{{ approvalCount }}</strong>
          </div>
        </div>
        <div class="wp-metric-card">
          <div class="wp-metric-head">
            <Icon name="check" class="text-wp-state-ok-100" />{{ $t('ops.deployments.success') }}
          </div>
          <div class="wp-metric-body">
            <strong class="text-wp-state-ok-100">{{ deployments.filter((d) => d.status === 'success').length }}</strong>
          </div>
        </div>
      </div>

      <section class="wp-card">
        <div class="wp-filters">
          <input v-model="search" class="input" :placeholder="$t('ops.deployments.search_placeholder')" />
          <select v-model="statusFilter" class="select">
            <option value="all">{{ $t('ops.deployments.all_statuses') }}</option>
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ deploymentStatusLabel(status) }}
            </option>
          </select>
          <select v-model="environmentFilter" class="select">
            <option value="all">{{ $t('ops.deployments.all_environments') }}</option>
            <option v-for="environment in environments" :key="environment.id" :value="String(environment.id)">
              {{ environment.title || environment.name }}
            </option>
          </select>
          <select v-model="applicationFilter" class="select">
            <option value="all">{{ $t('ops.deployments.all_applications') }}</option>
            <option v-for="application in applications" :key="application.id" :value="String(application.id)">
              {{ application.name }}
            </option>
          </select>
        </div>
        <FeedbackState
          v-if="deployments.length === 0"
          kind="empty"
          :title="$t('ops.deployments.none')"
          :description="$t('ops.deployments.none_hint')"
        />
        <FeedbackState
          v-else-if="filteredDeployments.length === 0"
          compact
          kind="empty"
          :title="$t('ops.deployments.filtered_none')"
          :description="$t('ops.deployments.search_placeholder')"
        />
        <div class="wp-table-scroll">
          <table v-if="filteredDeployments.length > 0">
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
                <th>{{ $t('ops.deployments.created') }}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in filteredDeployments" :key="d.id">
                <td>
                  <router-link class="text-wp-link-100" :to="`/deployments/${d.id}`">DEP-{{ d.id }}</router-link>
                </td>
                <td>
                  <span class="badge" :class="statusClass(d.status)">{{ deploymentStatusLabel(d.status) }}</span>
                </td>
                <td>{{ appName(d.application_id) }}</td>
                <td class="wp-mono">{{ releaseVersion(d.release_id) }}</td>
                <td>{{ envName(d.environment_id) }}</td>
                <td>{{ strategyLabel(d.strategy) }}{{ d.batch_size > 1 ? ` (${d.batch_size})` : '' }}</td>
                <td>
                  <div class="flex items-center gap-2">
                    <div class="bg-wp-background-200 h-1.5 w-24 overflow-hidden rounded-full">
                      <div class="bg-wp-primary-100 h-full rounded-full" :style="{ width: `${d.progress}%` }" />
                    </div>
                    <span class="wp-muted text-xs">{{ d.progress }}%</span>
                  </div>
                </td>
                <td>{{ actorLabel(d.triggered_by) }}</td>
                <td class="wp-muted">{{ formatTimestamp(d.created) }}</td>
                <td>
                  <IconButton icon="chevron-right" :to="`/deployments/${d.id}`" :title="$t('ops.deployments.view')" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Icon from '~/components/atomic/Icon.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import { useConfirmedRequest } from '~/compositions/useConfirmedRequest';
import { useDeploymentPresentation } from '~/compositions/useDeploymentPresentation';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useDate } from '~/compositions/useDate';
import type { Application, Deployment, Environment } from '~/lib/api/types';
import { useApplicationStore, useDeploymentStore } from '~/store/ops';

const store = useDeploymentStore();
const appStore = useApplicationStore();
const { t } = useI18n();
const { toLocaleString } = useDate();
const { actorLabel, deploymentStatusLabel, strategyLabel } = useDeploymentPresentation();
useWPTitle(computed(() => [t('ops.deployments.title')]));

const deployments = ref<Deployment[]>([]);
const applications = ref<Application[]>([]);
const environments = ref<Environment[]>([]);
const search = ref('');
const statusFilter = ref('all');
const environmentFilter = ref('all');
const applicationFilter = ref('all');
const { begin, hasConfirmedData, initialLoading, loadError, refreshing } = useConfirmedRequest();

const statusOptions = computed(() => [...new Set(deployments.value.map((deployment) => deployment.status))].toSorted());
const runningCount = computed(
  () => deployments.value.filter((deployment) => ['running', 'paused'].includes(deployment.status)).length,
);
const approvalCount = computed(
  () => deployments.value.filter((deployment) => deployment.status === 'pending_approval').length,
);
const filteredDeployments = computed(() => {
  const query = search.value.trim().toLowerCase();
  return deployments.value.filter((deployment) => {
    const searchable = `dep-${deployment.id} ${appName(deployment.application_id)} ${releaseVersion(deployment.release_id)} ${deployment.triggered_by ?? ''}`;
    return (
      (!query || searchable.toLowerCase().includes(query)) &&
      (statusFilter.value === 'all' || deployment.status === statusFilter.value) &&
      (environmentFilter.value === 'all' || String(deployment.environment_id) === environmentFilter.value) &&
      (applicationFilter.value === 'all' || String(deployment.application_id) === applicationFilter.value)
    );
  });
});

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

function formatTimestamp(timestamp?: number): string {
  return toLocaleString(timestamp ? new Date(timestamp * 1000) : undefined);
}

async function loadDeployments(refresh = false) {
  const request = begin(refresh);

  const [deploymentResult, applicationResult] = await Promise.allSettled([store.loadDeployments(), appStore.loadAll()]);
  if (!request.isCurrent()) return;

  if (deploymentResult.status === 'fulfilled') {
    deployments.value = [...store.deploymentList];
    request.confirm();
  }
  if (applicationResult.status === 'fulfilled') {
    applications.value = [...appStore.applicationList];
    environments.value = [...appStore.environmentList];
  }
  request.finish(deploymentResult.status === 'rejected' || applicationResult.status === 'rejected');
}

onMounted(() => loadDeployments());
</script>
