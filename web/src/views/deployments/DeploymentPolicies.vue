<template>
  <Scaffold>
    <template #title>{{ $t('ops.policies.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.policies.refresh')"
        :title="$t('ops.policies.refresh')"
        @click="loadPolicies(true)"
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
      :title="$t('ops.policies.loading_title')"
      :description="$t('ops.policies.loading_description')"
    />
    <FeedbackState
      v-else-if="loadError && !hasConfirmedData"
      kind="error"
      :title="$t('ops.policies.error_title')"
      :description="$t('ops.policies.error_description')"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('ops.policies.retry')" @click="loadPolicies()" />
      </template>
    </FeedbackState>
    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('ops.policies.refresh_error_title')"
        :description="$t('ops.policies.refresh_error_description')"
      />
      <FeedbackState
        v-if="!policies"
        kind="empty"
        :title="$t('ops.policies.none')"
        :description="$t('ops.policies.none_hint')"
      />
      <div v-else class="wp-grid wp-grid-sidebar">
        <section class="wp-card">
          <div class="wp-card-header">
            <div>
              <h2>{{ $t('ops.policies.defaults') }}</h2>
              <p>{{ $t('ops.policies.defaults_description') }}</p>
            </div>
          </div>
          <div class="wp-card-body detail-grid">
            <div class="wp-muted">{{ $t('ops.policies.health_retries') }}</div>
            <div>{{ policies.health_check_retries }}</div>
            <div class="wp-muted">{{ $t('ops.policies.health_interval') }}</div>
            <div>{{ $t('ops.policies.seconds', { count: policies.health_check_interval }) }}</div>
            <div class="wp-muted">{{ $t('ops.policies.batch_default') }}</div>
            <div>{{ policies.batch_size_default }}</div>
            <div class="wp-muted">{{ $t('ops.policies.auto_rollback') }}</div>
            <div>{{ policies.auto_rollback ? $t('ops.policies.enabled') : $t('ops.policies.disabled') }}</div>
          </div>
        </section>
        <aside class="wp-card">
          <div class="wp-card-header">
            <h2>{{ $t('ops.policies.scope_title') }}</h2>
          </div>
          <div class="wp-card-body">
            <p class="wp-muted">{{ $t('ops.policies.scope_description') }}</p>
          </div>
        </aside>
      </div>
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
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { DeploymentPolicies } from '~/lib/api/types';
import { useApplicationStore } from '~/store/ops';

const api = useApiClient();
const appStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.policies.title')]));

const policies = ref<DeploymentPolicies | null>(null);
const { begin, hasConfirmedData, initialLoading, loadError, refreshing } = useConfirmedRequest();

async function loadPolicies(refresh = false) {
  const request = begin(refresh);

  try {
    const result = await api.getOpsPolicies();
    if (!request.isCurrent()) return;
    policies.value = result;
    request.confirm();
    void appStore.loadAll().catch(() => undefined);
    request.finish();
  } catch {
    request.finish(true);
  }
}

onMounted(() => loadPolicies());
</script>
