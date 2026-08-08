<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold :go-back="() => router.push('/deployments')">
    <template #title>{{ $t('ops.deployment_wizard.title') }}</template>

    <div class="wp-card mb-4">
      <div class="flex items-center gap-3 p-4">
        <div class="flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" :class="stepClass(1)">{{ stepIcon(1) }}</span>
          <span class="text-xs font-semibold" :class="stepLabelClass(1)">{{ $t('ops.deployment_wizard.step_1') }}</span>
        </div>
        <div class="h-px w-8 bg-wp-border-100" />
        <div class="flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" :class="stepClass(2)">{{ stepIcon(2) }}</span>
          <span class="text-xs font-semibold" :class="stepLabelClass(2)">{{ $t('ops.deployment_wizard.step_2') }}</span>
        </div>
        <div class="h-px w-8 bg-wp-border-100" />
        <div class="flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" :class="stepClass(3)">{{ stepIcon(3) }}</span>
          <span class="text-xs font-semibold" :class="stepLabelClass(3)">{{ $t('ops.deployment_wizard.step_3') }}</span>
        </div>
        <div class="h-px w-8 bg-wp-border-100" />
        <div class="flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" :class="stepClass(4)">{{ stepIcon(4) }}</span>
          <span class="text-xs font-semibold" :class="stepLabelClass(4)">{{ $t('ops.deployment_wizard.step_4') }}</span>
        </div>
        <div class="h-px w-8 bg-wp-border-100" />
        <div class="flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold" :class="stepClass(5)">{{ stepIcon(5) }}</span>
          <span class="text-xs font-semibold" :class="stepLabelClass(5)">{{ $t('ops.deployment_wizard.step_5') }}</span>
        </div>
      </div>
    </div>

    <div class="wp-card p-5">
      <!-- Step 1: Application & Release -->
      <div v-if="currentStep === 1" class="wp-stack">
        <h2 class="text-lg font-bold">{{ $t('ops.deployment_wizard.step_1') }}</h2>
        <label class="field"><span class="field-label">{{ $t('ops.deployment.application') }}</span>
          <select v-model="draft.applicationId" class="select" @change="onAppChange">
            <option v-for="app in appStore.applicationList" :key="app.id" :value="app.id">{{ app.name }}</option>
          </select>
        </label>
        <label class="field"><span class="field-label">{{ $t('ops.deployment.release') }}</span>
          <select v-model="draft.releaseId" class="select">
            <option v-for="release in availableReleases" :key="release.id" :value="release.id">{{ release.version }} · {{ release.digest.slice(0, 12) }}</option>
          </select>
        </label>
        <div class="wp-alert wp-alert-info"><Icon name="info" /><div><strong>{{ $t('ops.deployment_wizard.release_hint') }}</strong></div></div>
      </div>

      <!-- Step 2: Environment -->
      <div v-else-if="currentStep === 2" class="wp-stack">
        <h2 class="text-lg font-bold">{{ $t('ops.deployment_wizard.step_2') }}</h2>
        <label class="field"><span class="field-label">{{ $t('ops.deployment.environment') }}</span>
          <select v-model="draft.environmentId" class="select">
            <option v-for="env in appStore.environmentList" :key="env.id" :value="env.id">{{ env.title ?? env.name }}</option>
          </select>
        </label>
        <div v-if="selectedEnv" class="wp-stack">
          <div class="wp-cluster">
            <span v-if="selectedEnv.protected" class="badge text-wp-state-warn-100"><Icon name="shield" />{{ $t('ops.environment.protected') }}</span>
            <span v-if="selectedEnv.approval_required" class="badge text-wp-state-warn-100">{{ $t('ops.environment.approval_required') }}</span>
            <span v-if="selectedEnv.auto_rollback" class="badge text-wp-state-ok-100">{{ $t('ops.environment.auto_rollback') }}</span>
          </div>
          <div class="wp-muted">{{ $t('ops.environment.deploy_window') }}: {{ selectedEnv.deploy_window || '—' }}</div>
        </div>
      </div>

      <!-- Step 3: Server group & strategy -->
      <div v-else-if="currentStep === 3" class="wp-stack">
        <h2 class="text-lg font-bold">{{ $t('ops.deployment_wizard.step_3') }}</h2>
        <label class="field"><span class="field-label">{{ $t('ops.deployment.server_group') }}</span>
          <select v-model="draft.groupId" class="select">
            <option v-for="group in groupsOfSelectedEnv" :key="group.id" :value="group.id">{{ group.name }} ({{ group.strategy }})</option>
          </select>
        </label>
        <label class="field"><span class="field-label">{{ $t('ops.deployment.strategy') }}</span>
          <select v-model="draft.strategy" class="select">
            <option value="single">{{ $t('ops.deployment.strategy_single') }}</option>
            <option value="all-at-once">{{ $t('ops.deployment.strategy_all_at_once') }}</option>
            <option value="rolling">{{ $t('ops.deployment.strategy_rolling') }}</option>
          </select>
        </label>
        <label class="field"><span class="field-label">{{ $t('ops.deployment.batch_size') }}</span>
          <input v-model.number="draft.batchSize" type="number" min="1" class="input" />
        </label>
      </div>

      <!-- Step 4: Preflight -->
      <div v-else-if="currentStep === 4" class="wp-stack">
        <h2 class="text-lg font-bold">{{ $t('ops.deployment_wizard.step_4') }}</h2>
        <div v-for="(item, i) in preflight" :key="i" class="wp-alert" :class="item.ok ? 'wp-alert-success' : 'wp-alert-warning'">
          <Icon :name="item.ok ? 'check' : 'warning'" />
          <div><strong>{{ item.label }}</strong><p class="wp-muted">{{ item.detail }}</p></div>
        </div>
      </div>

      <!-- Step 5: Confirm -->
      <div v-else-if="currentStep === 5" class="wp-stack">
        <h2 class="text-lg font-bold">{{ $t('ops.deployment_wizard.step_5') }}</h2>
        <div class="wp-grid wp-grid-2">
          <div class="wp-muted">{{ $t('ops.deployment.application') }}</div><div>{{ selectedApp?.name }}</div>
          <div class="wp-muted">{{ $t('ops.deployment.release') }}</div><div class="wp-mono">{{ selectedRelease?.version }} · {{ selectedRelease?.digest }}</div>
          <div class="wp-muted">{{ $t('ops.deployment.environment') }}</div><div>{{ selectedEnv?.title ?? selectedEnv?.name }}</div>
          <div class="wp-muted">{{ $t('ops.deployment.server_group') }}</div><div>{{ selectedGroup?.name }}</div>
          <div class="wp-muted">{{ $t('ops.deployment.strategy') }}</div><div>{{ draft.strategy }} · {{ $t('ops.deployment.batch_size') }} {{ draft.batchSize }}</div>
          <div class="wp-muted">{{ $t('ops.deployment.triggered_by') }}</div><div>{{ $t('ops.deployment_wizard.confirm_note') }}</div>
        </div>
        <div v-if="selectedEnv?.approval_required" class="wp-alert wp-alert-warning"><Icon name="shield" /><div><strong>{{ $t('ops.deployment_wizard.approval_note') }}</strong></div></div>
      </div>

      <div class="mt-5 flex justify-end gap-2 border-t border-wp-border-100 pt-4">
        <Button v-if="currentStep > 1" variant="ghost" :text="$t('ops.deployment_wizard.back')" @click="currentStep--" />
        <Button v-else :text="$t('cancel')" :to="{ path: '/deployments' }" />
        <Button v-if="currentStep < 5" color="green" :text="$t('ops.deployment_wizard.next')" @click="currentStep++" />
        <Button v-else color="green" start-icon="rocket" :is-loading="submitting" :text="selectedEnv?.approval_required ? $t('ops.deployment_wizard.submit_approval') : $t('ops.deployment_wizard.start')" @click="submit" />
      </div>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import Icon from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useApiClient from '~/compositions/useApiClient';
import type { AppRelease } from '~/lib/api/types';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useApplicationStore, useServerStore } from '~/store/ops';

const route = useRoute();
const router = useRouter();
const api = useApiClient();
const appStore = useApplicationStore();
const serverStore = useServerStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.deployment_wizard.title')]));

const currentStep = ref(1);
const submitting = ref(false);

function stepClass(step: number): string {
  if (step === currentStep.value) {
    return 'bg-wp-primary-100 text-white';
  }
  if (step < currentStep.value) {
    return 'bg-wp-state-ok-100 text-white';
  }
  return 'bg-wp-background-200 text-wp-text-alt-100';
}

function stepIcon(step: number): string {
  return step < currentStep.value ? '✓' : String(step);
}

function stepLabelClass(step: number): string {
  return step === currentStep.value ? 'text-wp-text-200' : 'text-wp-text-alt-100';
}

const draft = reactive({
  applicationId: 0,
  releaseId: 0,
  environmentId: 0,
  groupId: 0,
  strategy: 'rolling',
  batchSize: 1,
});

const selectedApp = computed(() => appStore.applications.get(draft.applicationId));
const selectedEnv = computed(() => appStore.environments.get(draft.environmentId));
const availableReleases = computed(() => appStore.releasesOf(draft.applicationId).value);
const selectedRelease = computed(() => appStore.releases.get(draft.releaseId) as AppRelease | undefined);
const groupsOfSelectedEnv = computed(() => serverStore.groupList.filter((g) => g.environment_id === draft.environmentId));
const selectedGroup = computed(() => serverStore.groups.get(draft.groupId));

const preflight = computed(() => {
  const servers = serverStore.serverList.filter((s) => s.group_id === draft.groupId);
  const online = servers.filter((s) => s.status === 'online' && !s.maintenance);
  const highDisk = servers.filter((s) => s.disk >= 85);
  return [
    { label: t('ops.deployment_wizard.preflight_release'), detail: selectedRelease.value ? `${selectedRelease.value.version} (${selectedRelease.value.digest.slice(0, 16)})` : '—', ok: !!selectedRelease.value },
    { label: t('ops.deployment_wizard.preflight_capacity'), detail: t('ops.deployment_wizard.preflight_capacity_detail', { online: online.length, total: servers.length }), ok: online.length > 0 },
    { label: t('ops.deployment_wizard.preflight_locks'), detail: t('ops.deployment_wizard.preflight_locks_detail'), ok: true },
    { label: t('ops.deployment_wizard.preflight_disk'), detail: highDisk.length > 0 ? `${highDisk.length} ${t('ops.deployment_wizard.preflight_disk_warn')}` : t('ops.deployment_wizard.preflight_disk_ok'), ok: highDisk.length === 0 },
  ];
});

function onAppChange() {
  const releases = appStore.releasesOf(draft.applicationId).value;
  draft.releaseId = releases[0]?.id ?? 0;
}

async function submit() {
  submitting.value = true;
  try {
    const deployment = await api.createDeployment({
      application_id: draft.applicationId,
      environment_id: draft.environmentId,
      release_id: draft.releaseId,
      group_id: draft.groupId,
      strategy: draft.strategy,
      batch_size: draft.batchSize,
    });
    if (deployment) {
      await router.push(`/deployments/${deployment.id}`);
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  await Promise.all([appStore.loadAll(), serverStore.loadAll()]);
  // Query params allow deep links from pipelines / releases / servers.
  const qApplicationId = Number(route.query.applicationId);
  const qReleaseId = Number(route.query.releaseId);
  const qServerId = Number(route.query.serverId);
  if (appStore.applicationList.length > 0) {
    draft.applicationId = qApplicationId || appStore.applicationList[0].id;
    onAppChange();
    if (qReleaseId) {
      draft.releaseId = qReleaseId;
    }
  }
  if (qServerId) {
    const server = serverStore.servers.get(qServerId);
    if (server) {
      draft.groupId = server.group_id;
      draft.environmentId = server.environment_id;
    }
  }
});
</script>
