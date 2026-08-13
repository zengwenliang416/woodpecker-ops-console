<template>
  <Scaffold>
    <template #title>{{ $t('ops.environments.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.environments.refresh')"
        :title="$t('ops.environments.refresh')"
        @click="loadEnvironments(true)"
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
      :title="$t('ops.environments.loading_title')"
      :description="$t('ops.environments.loading_description')"
    />
    <FeedbackState
      v-else-if="loadError && !hasConfirmedData"
      kind="error"
      :title="$t('ops.environments.error_title')"
      :description="$t('ops.environments.error_description')"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('ops.environments.retry')" @click="loadEnvironments()" />
      </template>
    </FeedbackState>
    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('ops.environments.refresh_error_title')"
        :description="$t('ops.environments.refresh_error_description')"
      />
      <FeedbackState
        v-if="environments.length === 0"
        kind="empty"
        :title="$t('ops.environments.none')"
        :description="$t('ops.environments.none_hint')"
      />
      <section v-else class="wp-card">
        <div class="wp-filters">
          <input v-model="search" class="input" :placeholder="$t('ops.environments.search_placeholder')" />
          <select v-model="protectionFilter" class="select">
            <option value="all">{{ $t('ops.environments.all_protection') }}</option>
            <option value="protected">{{ $t('ops.environments.protected_only') }}</option>
            <option value="open">{{ $t('ops.environments.open_only') }}</option>
          </select>
        </div>
        <FeedbackState
          v-if="filteredEnvironments.length === 0"
          compact
          kind="empty"
          :title="$t('ops.environments.filtered_none')"
          :description="$t('ops.environments.search_placeholder')"
        />
        <div v-else class="environment-card-grid p-4">
          <article v-for="environment in filteredEnvironments" :key="environment.id" class="environment-card">
            <div class="environment-card-head">
              <span class="empty-icon"><PrototypeIcon name="environment" /></span>
              <div class="min-w-0 flex-1">
                <router-link class="table-link" :to="`/deployments/environments/${environment.id}`">
                  {{ environment.title || environment.name }}
                </router-link>
                <p>{{ environment.domain || environment.name }}</p>
              </div>
              <span class="badge" :class="environment.protected ? 'text-wp-state-warn-100' : 'text-wp-state-ok-100'">
                {{ environment.protected ? $t('ops.environments.protected') : $t('ops.environments.open') }}
              </span>
            </div>
            <div class="detail-grid">
              <div class="wp-muted">{{ $t('ops.environment.approval_required') }}</div>
              <div>
                {{ environment.approval_required ? $t('ops.environments.enabled') : $t('ops.environments.disabled') }}
              </div>
              <div class="wp-muted">{{ $t('ops.environment.minimum_approvers') }}</div>
              <div>{{ environment.minimum_approvers }}</div>
              <div class="wp-muted">{{ $t('ops.environment.deploy_window') }}</div>
              <div>{{ environment.deploy_window || '—' }}</div>
              <div class="wp-muted">{{ $t('ops.environment.auto_rollback') }}</div>
              <div>
                {{ environment.auto_rollback ? $t('ops.environments.enabled') : $t('ops.environments.disabled') }}
              </div>
            </div>
            <div class="application-card-foot">
              <router-link class="btn btn-ghost btn-sm" :to="`/deployments/environments/${environment.id}`">
                {{ $t('ops.environment.details') }}
              </router-link>
              <Button
                size="sm"
                color="green"
                start-icon="rocket"
                :text="$t('ops.environments.deploy')"
                :to="{ path: '/deployments/new', query: { environmentId: environment.id } }"
              />
            </div>
          </article>
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
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import { useConfirmedRequest } from '~/compositions/useConfirmedRequest';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Application, AppRelease, Environment } from '~/lib/api/types';
import { useApplicationStore } from '~/store/ops';

const appStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.environments.title')]));

const applications = ref<Application[]>([]);
const environments = ref<Environment[]>([]);
const releases = ref<AppRelease[]>([]);
const search = ref('');
const protectionFilter = ref('all');
const { begin, hasConfirmedData, initialLoading, loadError, refreshing } = useConfirmedRequest();

const filteredEnvironments = computed(() => {
  const query = search.value.trim().toLowerCase();
  return environments.value.filter(
    (environment) =>
      (!query ||
        `${environment.name} ${environment.title ?? ''} ${environment.domain ?? ''}`.toLowerCase().includes(query)) &&
      (protectionFilter.value === 'all' ||
        (protectionFilter.value === 'protected' ? environment.protected : !environment.protected)),
  );
});

async function loadEnvironments(refresh = false) {
  const request = begin(refresh);

  const [environmentResult, applicationResult, releaseResult] = await Promise.allSettled([
    appStore.loadEnvironments(),
    appStore.loadApplications(),
    appStore.loadReleases(),
  ]);
  if (!request.isCurrent()) return;

  if (environmentResult.status === 'fulfilled') {
    environments.value = [...appStore.environmentList];
    request.confirm();
  }
  if (applicationResult.status === 'fulfilled') applications.value = [...appStore.applicationList];
  if (releaseResult.status === 'fulfilled') releases.value = [...appStore.releaseList];
  request.finish(
    environmentResult.status === 'rejected' ||
      applicationResult.status === 'rejected' ||
      releaseResult.status === 'rejected',
  );
}

onMounted(() => loadEnvironments());
</script>
