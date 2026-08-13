<template>
  <Scaffold :go-back="() => router.push('/deployments/apps')">
    <template #title>{{ application?.name ?? $t('ops.applications.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.applications.refresh')"
        :title="$t('ops.applications.refresh')"
        @click="loadApplication(true)"
      />
      <Button
        v-if="application"
        color="green"
        start-icon="rocket"
        :text="$t('ops.applications.deploy')"
        :to="{ path: '/deployments/new', query: { applicationId } }"
      />
    </template>

    <div class="mb-4">
      <DeploymentNav
        :application-count="appStore.applicationList.length"
        :environment-count="appStore.environmentList.length"
        :release-count="appStore.releaseList.length"
      />
    </div>

    <FeedbackState
      v-if="initialLoading"
      kind="loading"
      :title="$t('ops.applications.detail_loading_title')"
      :description="$t('ops.applications.detail_loading_description')"
    />
    <FeedbackState
      v-else-if="loadError && !hasConfirmedData"
      kind="error"
      :title="$t('ops.applications.detail_error_title')"
      :description="$t('ops.applications.detail_error_description')"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('ops.applications.retry')" @click="loadApplication()" />
      </template>
    </FeedbackState>
    <FeedbackState
      v-else-if="hasConfirmedData && !application"
      kind="empty"
      :title="$t('ops.applications.missing_title')"
      :description="$t('ops.applications.missing_description')"
    />
    <template v-else-if="application">
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('ops.applications.detail_refresh_error_title')"
        :description="$t('ops.applications.detail_refresh_error_description')"
      />
      <div class="wp-grid wp-grid-sidebar">
        <section class="wp-card">
          <div class="wp-card-header">
            <div>
              <h2>{{ $t('ops.applications.details') }}</h2>
              <p>{{ application.description || $t('ops.applications.no_description') }}</p>
            </div>
          </div>
          <div class="wp-card-body detail-grid">
            <div class="wp-muted">{{ $t('ops.applications.image') }}</div>
            <div class="wp-mono break-all">{{ application.image }}</div>
            <div class="wp-muted">{{ $t('ops.applications.runtime') }}</div>
            <div>{{ application.runtime }}</div>
            <div class="wp-muted">{{ $t('ops.applications.compose_file') }}</div>
            <div class="wp-mono">{{ application.compose_file || '—' }}</div>
            <div class="wp-muted">{{ $t('ops.applications.service') }}</div>
            <div>{{ application.service }}</div>
            <div class="wp-muted">{{ $t('ops.applications.health_path') }}</div>
            <div class="wp-mono">{{ healthEndpoint }}</div>
            <div class="wp-muted">{{ $t('ops.applications.owner_team') }}</div>
            <div>{{ application.owner_team || $t('ops.applications.unassigned') }}</div>
          </div>
        </section>
        <section class="wp-card">
          <div class="wp-card-header">
            <h2>{{ $t('ops.releases.title') }}</h2>
          </div>
          <FeedbackState
            v-if="releases.length === 0"
            compact
            kind="empty"
            :title="$t('ops.releases.none')"
            :description="$t('ops.releases.none_hint')"
          />
          <div v-else class="wp-card-body wp-stack">
            <div v-for="release in releases" :key="release.id" class="wp-split">
              <div class="min-w-0">
                <router-link
                  class="text-wp-link-100"
                  :to="{ path: '/deployments/new', query: { applicationId, releaseId: release.id } }"
                >
                  {{ release.version }}
                </router-link>
                <div class="wp-muted wp-mono truncate text-xs" :title="release.digest">{{ release.digest }}</div>
              </div>
              <span
                class="badge"
                :class="release.status === 'deployed' ? 'text-wp-state-ok-100' : 'text-wp-text-alt-100'"
              >
                {{ releaseStatusLabel(release.status) }}
              </span>
            </div>
          </div>
        </section>
      </div>
    </template>
  </Scaffold>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import { useConfirmedRequest } from '~/compositions/useConfirmedRequest';
import { useDeploymentPresentation } from '~/compositions/useDeploymentPresentation';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Application, AppRelease } from '~/lib/api/types';
import { useApplicationStore } from '~/store/ops';

const route = useRoute();
const router = useRouter();
const api = useApiClient();
const appStore = useApplicationStore();
const { t } = useI18n();
const { releaseStatusLabel } = useDeploymentPresentation();

const application = ref<Application | null>(null);
const releases = ref<AppRelease[]>([]);
const { begin, hasConfirmedData, initialLoading, loadError, refreshing, resetConfirmed } = useConfirmedRequest();

const applicationId = computed(() => Number(route.params.appId));
const healthEndpoint = computed(() => {
  if (!application.value?.health_path && !application.value?.port) return '—';
  return `${application.value.port ? `:${application.value.port}` : ''}${application.value.health_path ?? ''}`;
});
useWPTitle(computed(() => [application.value?.name ?? t('ops.applications.title')]));

async function loadApplication(refresh = false) {
  const requestedId = applicationId.value;
  const request = begin(refresh);

  const [detailResult, environmentResult] = await Promise.allSettled([
    api.getApplication(requestedId),
    appStore.loadEnvironments(),
  ]);
  if (!request.isCurrent() || requestedId !== applicationId.value) return;

  if (detailResult.status === 'fulfilled') {
    application.value = detailResult.value?.application ?? null;
    releases.value = detailResult.value?.releases ?? [];
    if (application.value) appStore.setApplication(application.value);
    for (const release of releases.value) appStore.setRelease(release);
    request.confirm();
  }
  request.finish(detailResult.status === 'rejected' || environmentResult.status === 'rejected');
}

watch(
  applicationId,
  () => {
    application.value = null;
    releases.value = [];
    resetConfirmed();
    void loadApplication();
  },
  { immediate: true },
);
</script>
