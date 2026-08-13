<template>
  <Scaffold>
    <template #title>{{ $t('ops.approvals.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.approvals.refresh')"
        :title="$t('ops.approvals.refresh')"
        @click="loadApprovals(true)"
      />
    </template>

    <div class="mb-4">
      <DeploymentNav
        :application-count="applications.length"
        :environment-count="environments.length"
        :release-count="releases.length"
        :approval-count="pendingApprovals.length"
      />
    </div>

    <FeedbackState
      v-if="initialLoading"
      kind="loading"
      :title="$t('ops.approvals.loading_title')"
      :description="$t('ops.approvals.loading_description')"
    />
    <FeedbackState
      v-else-if="loadError && !hasConfirmedData"
      kind="error"
      :title="$t('ops.approvals.error_title')"
      :description="$t('ops.approvals.error_description')"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('ops.approvals.retry')" @click="loadApprovals()" />
      </template>
    </FeedbackState>
    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('ops.approvals.refresh_error_title')"
        :description="$t('ops.approvals.refresh_error_description')"
      />
      <FeedbackState
        v-if="pendingApprovals.length === 0"
        kind="empty"
        :title="$t('ops.approvals.none')"
        :description="$t('ops.approvals.none_hint')"
      />
      <section v-else class="wp-card">
        <div class="wp-filters">
          <input v-model="search" class="input" :placeholder="$t('ops.approvals.search_placeholder')" />
        </div>
        <FeedbackState
          v-if="filteredApprovals.length === 0"
          compact
          kind="empty"
          :title="$t('ops.approvals.filtered_none')"
          :description="$t('ops.approvals.search_placeholder')"
        />
        <div v-else class="wp-table-scroll">
          <table>
            <thead>
              <tr>
                <th>{{ $t('ops.deployment.id') }}</th>
                <th>{{ $t('ops.deployment.application') }}</th>
                <th>{{ $t('ops.deployment.environment') }}</th>
                <th>{{ $t('ops.deployment.release') }}</th>
                <th>{{ $t('ops.deployment.triggered_by') }}</th>
                <th>{{ $t('ops.deployments.created') }}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="deployment in filteredApprovals" :key="deployment.id">
                <td>
                  <router-link class="text-wp-link-100 wp-mono" :to="`/deployments/${deployment.id}`">
                    {{ deploymentLabel(deployment.id) }}
                  </router-link>
                </td>
                <td>{{ appName(deployment.application_id) }}</td>
                <td>{{ envName(deployment.environment_id) }}</td>
                <td class="wp-mono">{{ releaseVersion(deployment.release_id) }}</td>
                <td>{{ actorLabel(deployment.triggered_by) }}</td>
                <td class="wp-muted">{{ formatTimestamp(deployment.created) }}</td>
                <td>
                  <Button size="sm" :text="$t('ops.approvals.review')" :to="`/deployments/${deployment.id}`" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </Scaffold>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import { useConfirmedRequest } from '~/compositions/useConfirmedRequest';
import { useDate } from '~/compositions/useDate';
import { useDeploymentPresentation } from '~/compositions/useDeploymentPresentation';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Application, AppRelease, Deployment, Environment } from '~/lib/api/types';
import { useApplicationStore, useDeploymentStore } from '~/store/ops';

const store = useDeploymentStore();
const appStore = useApplicationStore();
const { t } = useI18n();
const { toLocaleString } = useDate();
const { actorLabel } = useDeploymentPresentation();
useWPTitle(computed(() => [t('ops.approvals.title')]));

const deployments = ref<Deployment[]>([]);
const applications = ref<Application[]>([]);
const environments = ref<Environment[]>([]);
const releases = ref<AppRelease[]>([]);
const search = ref('');
const { begin, hasConfirmedData, initialLoading, loadError, refreshing } = useConfirmedRequest();

const pendingApprovals = computed(() =>
  deployments.value.filter((deployment) => deployment.status === 'pending_approval'),
);
const filteredApprovals = computed(() => {
  const query = search.value.trim().toLowerCase();
  return pendingApprovals.value.filter(
    (deployment) =>
      !query ||
      `dep-${deployment.id} ${appName(deployment.application_id)} ${envName(deployment.environment_id)} ${releaseVersion(deployment.release_id)} ${deployment.triggered_by ?? ''}`
        .toLowerCase()
        .includes(query),
  );
});

function appName(id: number) {
  return applications.value.find((application) => application.id === id)?.name ?? `#${id}`;
}

function envName(id: number) {
  const environment = environments.value.find((item) => item.id === id);
  return environment?.title ?? environment?.name ?? `#${id}`;
}

function releaseVersion(id: number) {
  return releases.value.find((release) => release.id === id)?.version ?? `#${id}`;
}

function deploymentLabel(id: number) {
  return `DEP-${id}`;
}

function formatTimestamp(timestamp?: number) {
  return toLocaleString(timestamp ? new Date(timestamp * 1000) : undefined);
}

async function loadApprovals(refresh = false) {
  const request = begin(refresh);

  const [deploymentResult, applicationResult, environmentResult, releaseResult] = await Promise.allSettled([
    store.loadDeployments(),
    appStore.loadApplications(),
    appStore.loadEnvironments(),
    appStore.loadReleases(),
  ]);
  if (!request.isCurrent()) return;

  if (deploymentResult.status === 'fulfilled') {
    deployments.value = [...store.deploymentList];
    request.confirm();
  }
  if (applicationResult.status === 'fulfilled') applications.value = [...appStore.applicationList];
  if (environmentResult.status === 'fulfilled') environments.value = [...appStore.environmentList];
  if (releaseResult.status === 'fulfilled') releases.value = [...appStore.releaseList];
  request.finish(
    deploymentResult.status === 'rejected' ||
      applicationResult.status === 'rejected' ||
      environmentResult.status === 'rejected' ||
      releaseResult.status === 'rejected',
  );
}

onMounted(() => loadApprovals());
</script>
