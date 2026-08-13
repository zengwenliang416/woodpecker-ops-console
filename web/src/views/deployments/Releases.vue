<template>
  <Scaffold>
    <template #title>{{ $t('ops.releases.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.releases.refresh')"
        :title="$t('ops.releases.refresh')"
        @click="loadReleases(true)"
      />
    </template>

    <div class="mb-4">
      <DeploymentNav
        :application-count="applications.length"
        :environment-count="environments.length"
        :release-count="releases.length"
      />
    </div>

    <FeedbackState
      v-if="initialLoading"
      kind="loading"
      :title="$t('ops.releases.loading_title')"
      :description="$t('ops.releases.loading_description')"
    />
    <FeedbackState
      v-else-if="loadError && !hasConfirmedData"
      kind="error"
      :title="$t('ops.releases.error_title')"
      :description="$t('ops.releases.error_description')"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('ops.releases.retry')" @click="loadReleases()" />
      </template>
    </FeedbackState>
    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('ops.releases.refresh_error_title')"
        :description="$t('ops.releases.refresh_error_description')"
      />
      <FeedbackState
        v-if="releases.length === 0"
        kind="empty"
        :title="$t('ops.releases.none')"
        :description="$t('ops.releases.none_hint')"
      />
      <section v-else class="wp-card">
        <div class="wp-filters">
          <select v-model="applicationFilter" class="select">
            <option value="all">{{ $t('ops.releases.all_applications') }}</option>
            <option v-for="application in applications" :key="application.id" :value="String(application.id)">
              {{ application.name }}
            </option>
          </select>
          <select v-model="statusFilter" class="select">
            <option value="all">{{ $t('ops.releases.all_statuses') }}</option>
            <option v-for="status in statusOptions" :key="status" :value="status">
              {{ releaseStatusLabel(status) }}
            </option>
          </select>
          <input v-model="search" class="input" :placeholder="$t('ops.releases.search_placeholder')" />
        </div>
        <FeedbackState
          v-if="filteredReleases.length === 0"
          compact
          kind="empty"
          :title="$t('ops.releases.filtered_none')"
          :description="$t('ops.releases.search_placeholder')"
        />
        <div v-else class="wp-table-scroll">
          <table>
            <thead>
              <tr>
                <th>{{ $t('ops.deployment.application') }}</th>
                <th>{{ $t('ops.releases.version') }}</th>
                <th>{{ $t('ops.releases.status') }}</th>
                <th>{{ $t('ops.releases.commit') }}</th>
                <th>{{ $t('ops.releases.digest') }}</th>
                <th>{{ $t('ops.releases.pipeline') }}</th>
                <th>{{ $t('ops.releases.author') }}</th>
                <th>{{ $t('ops.releases.created') }}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="release in filteredReleases" :key="release.id">
                <td>
                  <router-link class="text-wp-link-100" :to="`/deployments/apps/${release.application_id}`">
                    {{ appName(release.application_id) }}
                  </router-link>
                </td>
                <td class="wp-mono">{{ release.version }}</td>
                <td>
                  <span
                    class="badge"
                    :class="release.status === 'deployed' ? 'text-wp-state-ok-100' : 'text-wp-text-alt-100'"
                  >
                    {{ releaseStatusLabel(release.status) }}
                  </span>
                </td>
                <td class="wp-mono">{{ release.commit?.slice(0, 12) || '—' }}</td>
                <td class="wp-mono max-w-60 truncate" :title="release.digest">{{ release.digest }}</td>
                <td class="wp-mono">{{ pipelineLabel(release.pipeline_id) }}</td>
                <td>{{ actorLabel(release.author) }}</td>
                <td class="wp-muted">{{ formatTimestamp(release.created) }}</td>
                <td>
                  <IconButton
                    icon="rocket"
                    :title="$t('ops.releases.deploy')"
                    :to="{
                      path: '/deployments/new',
                      query: { applicationId: release.application_id, releaseId: release.id },
                    }"
                  />
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
import IconButton from '~/components/atomic/IconButton.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import { useConfirmedRequest } from '~/compositions/useConfirmedRequest';
import { useDeploymentPresentation } from '~/compositions/useDeploymentPresentation';
import { useDate } from '~/compositions/useDate';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Application, AppRelease, Environment } from '~/lib/api/types';
import { useApplicationStore } from '~/store/ops';

const appStore = useApplicationStore();
const { t } = useI18n();
const { toLocaleString } = useDate();
const { actorLabel, releaseStatusLabel } = useDeploymentPresentation();
useWPTitle(computed(() => [t('ops.releases.title')]));

const applications = ref<Application[]>([]);
const environments = ref<Environment[]>([]);
const releases = ref<AppRelease[]>([]);
const search = ref('');
const applicationFilter = ref('all');
const statusFilter = ref('all');
const { begin, hasConfirmedData, initialLoading, loadError, refreshing } = useConfirmedRequest();

const statusOptions = computed(() => [...new Set(releases.value.map((release) => release.status))].toSorted());
const filteredReleases = computed(() => {
  const query = search.value.trim().toLowerCase();
  return releases.value.filter(
    (release) =>
      (!query ||
        `${release.version} ${release.commit ?? ''} ${release.digest} ${release.author ?? ''} ${appName(release.application_id)}`
          .toLowerCase()
          .includes(query)) &&
      (applicationFilter.value === 'all' || String(release.application_id) === applicationFilter.value) &&
      (statusFilter.value === 'all' || release.status === statusFilter.value),
  );
});

function appName(applicationId: number) {
  return applications.value.find((application) => application.id === applicationId)?.name ?? `#${applicationId}`;
}

function formatTimestamp(timestamp?: number) {
  return toLocaleString(timestamp ? new Date(timestamp * 1000) : undefined);
}

function pipelineLabel(pipelineId: number) {
  return `#${pipelineId}`;
}

async function loadReleases(refresh = false) {
  const request = begin(refresh);

  const [releaseResult, applicationResult, environmentResult] = await Promise.allSettled([
    appStore.loadReleases(),
    appStore.loadApplications(),
    appStore.loadEnvironments(),
  ]);
  if (!request.isCurrent()) return;

  if (releaseResult.status === 'fulfilled') {
    releases.value = [...appStore.releaseList];
    request.confirm();
  }
  if (applicationResult.status === 'fulfilled') applications.value = [...appStore.applicationList];
  if (environmentResult.status === 'fulfilled') environments.value = [...appStore.environmentList];
  request.finish(
    releaseResult.status === 'rejected' ||
      applicationResult.status === 'rejected' ||
      environmentResult.status === 'rejected',
  );
}

onMounted(() => loadReleases());
</script>
