<template>
  <Scaffold :go-back="() => router.push('/deployments/environments')">
    <template #title>{{ environment?.title ?? environment?.name ?? $t('ops.environments.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.environments.refresh')"
        :title="$t('ops.environments.refresh')"
        @click="loadEnvironment(true)"
      />
      <Button
        v-if="environment"
        color="green"
        start-icon="rocket"
        :text="$t('ops.environments.deploy')"
        :to="{ path: '/deployments/new', query: { environmentId } }"
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
      :title="$t('ops.environments.detail_loading_title')"
      :description="$t('ops.environments.detail_loading_description')"
    />
    <FeedbackState
      v-else-if="loadError && !hasConfirmedData"
      kind="error"
      :title="$t('ops.environments.detail_error_title')"
      :description="$t('ops.environments.detail_error_description')"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('ops.environments.retry')" @click="loadEnvironment()" />
      </template>
    </FeedbackState>
    <FeedbackState
      v-else-if="hasConfirmedData && !environment"
      kind="empty"
      :title="$t('ops.environments.missing_title')"
      :description="$t('ops.environments.missing_description')"
    />
    <template v-else-if="environment">
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('ops.environments.detail_refresh_error_title')"
        :description="$t('ops.environments.detail_refresh_error_description')"
      />
      <div class="wp-cluster">
        <span class="badge" :class="environment.protected ? 'text-wp-state-warn-100' : 'text-wp-state-ok-100'">
          <PrototypeIcon :name="environment.protected ? 'shield' : 'check'" />
          {{ environment.protected ? $t('ops.environments.protected') : $t('ops.environments.open') }}
        </span>
        <span v-if="environment.approval_required" class="badge text-wp-state-warn-100">
          {{ approvalLabel(environment.minimum_approvers) }}
        </span>
        <span v-if="environment.auto_rollback" class="badge text-wp-state-ok-100">
          {{ $t('ops.environment.auto_rollback') }}
        </span>
      </div>
      <div class="wp-grid wp-grid-sidebar">
        <section class="wp-card">
          <div class="wp-card-header">
            <h2>{{ $t('ops.environment.details') }}</h2>
          </div>
          <div class="wp-card-body detail-grid">
            <div class="wp-muted">{{ $t('ops.environments.name') }}</div>
            <div>{{ environment.name }}</div>
            <div class="wp-muted">{{ $t('ops.environment.domain') }}</div>
            <div>{{ environment.domain || '—' }}</div>
            <div class="wp-muted">{{ $t('ops.environment.deploy_window') }}</div>
            <div>{{ environment.deploy_window || '—' }}</div>
            <div class="wp-muted">{{ $t('ops.environment.minimum_approvers') }}</div>
            <div>{{ environment.minimum_approvers }}</div>
            <div class="wp-muted">{{ $t('ops.environment.auto_rollback') }}</div>
            <div>
              {{ environment.auto_rollback ? $t('ops.environments.enabled') : $t('ops.environments.disabled') }}
            </div>
          </div>
        </section>
        <section class="wp-card">
          <div class="wp-card-header">
            <h2>{{ $t('ops.infrastructure.groups') }}</h2>
          </div>
          <FeedbackState
            v-if="groups.length === 0"
            compact
            kind="empty"
            :title="$t('ops.environments.no_groups')"
            :description="$t('ops.environments.no_groups_hint')"
          />
          <div v-else class="wp-card-body wp-stack">
            <div v-for="group in groups" :key="group.id" class="wp-split">
              <router-link class="text-wp-link-100" :to="`/infrastructure/groups/${group.id}`">
                {{ group.name }}
              </router-link>
              <span class="wp-muted">{{ groupStrategyLabel(group.strategy, group.batch_size) }}</span>
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
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import { useConfirmedRequest } from '~/compositions/useConfirmedRequest';
import { useDeploymentPresentation } from '~/compositions/useDeploymentPresentation';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Environment, ServerGroup } from '~/lib/api/types';
import { useApplicationStore, useServerStore } from '~/store/ops';

const route = useRoute();
const router = useRouter();
const appStore = useApplicationStore();
const serverStore = useServerStore();
const { t } = useI18n();
const { strategyLabel } = useDeploymentPresentation();

const environment = ref<Environment | null>(null);
const allGroups = ref<ServerGroup[]>([]);
const { begin, hasConfirmedData, initialLoading, loadError, refreshing, resetConfirmed } = useConfirmedRequest();

const environmentId = computed(() => Number(route.params.envId));
const groups = computed(() => allGroups.value.filter((group) => group.environment_id === environmentId.value));
useWPTitle(computed(() => [environment.value?.title ?? environment.value?.name ?? t('ops.environments.title')]));

function approvalLabel(minimumApprovers: number) {
  return `${t('ops.environment.approval_required')} · ${minimumApprovers}`;
}

function groupStrategyLabel(strategy: ServerGroup['strategy'], batchSize: number) {
  return `${strategyLabel(strategy)} · ${batchSize}`;
}

async function loadEnvironment(refresh = false) {
  const requestedId = environmentId.value;
  const request = begin(refresh);

  const [environmentResult, groupResult, applicationResult, releaseResult] = await Promise.allSettled([
    appStore.loadEnvironments(),
    serverStore.loadGroups(),
    appStore.loadApplications(),
    appStore.loadReleases(),
  ]);
  if (!request.isCurrent() || requestedId !== environmentId.value) return;

  if (environmentResult.status === 'fulfilled') {
    environment.value = appStore.environments.get(requestedId) ?? null;
    request.confirm();
  }
  if (groupResult.status === 'fulfilled') allGroups.value = [...serverStore.groupList];
  request.finish(
    environmentResult.status === 'rejected' ||
      groupResult.status === 'rejected' ||
      applicationResult.status === 'rejected' ||
      releaseResult.status === 'rejected',
  );
}

watch(
  environmentId,
  () => {
    environment.value = null;
    allGroups.value = [];
    resetConfirmed();
    void loadEnvironment();
  },
  { immediate: true },
);
</script>
