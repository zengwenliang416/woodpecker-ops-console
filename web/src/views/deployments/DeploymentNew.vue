<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline -->
  <Scaffold :go-back="() => router.push('/deployments')" full-width-header fluid-content>
    <template #title>{{ $t('ops.deployment_wizard.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.deployment_wizard.refresh')"
        :title="$t('ops.deployment_wizard.refresh')"
        @click="loadOptions(true)"
      />
    </template>

    <div class="ops-page">
      <p class="page-description">{{ $t('ops.deployment_wizard.description') }}</p>
      <DeploymentNav
        :application-count="appStore.applicationList.length"
        :environment-count="appStore.environmentList.length"
        :release-count="appStore.releaseList.length"
      />

      <FeedbackState
        v-if="initialLoading"
        kind="loading"
        :title="$t('ops.deployment_wizard.loading_title')"
        :description="$t('ops.deployment_wizard.loading_description')"
      />
      <FeedbackState
        v-else-if="loadError && !hasConfirmedData"
        kind="error"
        :title="$t('ops.deployment_wizard.error_title')"
        :description="$t('ops.deployment_wizard.error_description')"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('ops.deployment_wizard.retry')" @click="loadOptions()" />
        </template>
      </FeedbackState>
      <div v-else class="wizard-layout">
        <aside class="wizard-steps wp-card">
          <button
            v-for="step in steps"
            :key="step.number"
            type="button"
            :class="{ active: currentStep === step.number, complete: currentStep > step.number }"
            :disabled="step.number > currentStep"
            @click="currentStep = step.number"
          >
            <span class="step-index"
              ><Icon v-if="currentStep > step.number" name="check" /><span v-else>{{ step.number }}</span></span
            >
            <span
              ><strong>{{ step.label }}</strong
              ><small>{{ step.description }}</small></span
            >
          </button>
        </aside>

        <main class="wizard-main">
          <section class="wp-card wizard-card">
            <FeedbackState
              v-if="loadError"
              compact
              kind="error"
              :title="$t('ops.deployment_wizard.refresh_error_title')"
              :description="$t('ops.deployment_wizard.refresh_error_description')"
            />
            <div class="wizard-card-header">
              <div>
                <span>{{ $t('ops.deployment_wizard.step_progress', { current: currentStep, total: 5 }) }}</span>
                <h2>{{ steps[currentStep - 1].label }}</h2>
                <p>{{ steps[currentStep - 1].description }}</p>
              </div>
              <span class="step-progress">{{ currentStep * 20 }}%</span>
            </div>

            <div class="wizard-content">
              <template v-if="currentStep === 1">
                <div class="form-section">
                  <label class="field"
                    ><span class="field-label">{{ $t('ops.deployment.application') }}</span
                    ><select v-model.number="draft.applicationId" class="select" @change="onAppChange">
                      <option :value="0" disabled>{{ $t('ops.deployment_wizard.select_application') }}</option>
                      <option v-for="app in appStore.applicationList" :key="app.id" :value="app.id">
                        {{ app.name }} · {{ app.image }}
                      </option>
                    </select></label
                  >
                  <div v-if="selectedApp" class="selection-preview">
                    <span class="preview-icon"><Icon name="app" /></span>
                    <div>
                      <strong>{{ selectedApp.name }}</strong>
                      <p>{{ selectedApp.description || selectedApp.image }}</p>
                      <small>{{ applicationMeta(selectedApp.runtime, selectedApp.owner_team) }}</small>
                    </div>
                  </div>
                </div>
                <div class="form-section">
                  <div class="section-label">
                    <span>{{ $t('ops.deployment.release') }}</span
                    ><small>{{ $t('ops.deployment_wizard.release_selection_hint') }}</small>
                  </div>
                  <div class="option-grid">
                    <label
                      v-for="release in availableReleases"
                      :key="release.id"
                      class="release-option"
                      :class="{ selected: draft.releaseId === release.id }"
                      ><input v-model.number="draft.releaseId" type="radio" :value="release.id" /><span
                        ><strong>{{ release.version }}</strong
                        ><small>{{ release.digest }}</small
                        ><em>{{ releaseMeta(release.pipeline_id, release.author) }}</em></span
                      ><span class="status-chip">{{ releaseStatusLabel(release.status) }}</span></label
                    >
                    <div v-if="availableReleases.length === 0" class="wp-empty-state">
                      <strong>{{ $t('ops.deployment_wizard.no_releases') }}</strong>
                      <p>{{ $t('ops.deployment_wizard.no_releases_hint') }}</p>
                    </div>
                  </div>
                </div>
                <div class="wp-alert wp-alert-info">
                  <Icon name="info" />
                  <div>
                    <strong>{{ $t('ops.deployment_wizard.release_hint') }}</strong>
                    <p class="wp-muted">{{ $t('ops.deployment_wizard.digest_hint') }}</p>
                  </div>
                </div>
              </template>

              <template v-else-if="currentStep === 2">
                <div class="section-label">
                  <span>{{ $t('ops.deployment_wizard.select_environment') }}</span
                  ><small>{{ $t('ops.deployment_wizard.environment_hint') }}</small>
                </div>
                <div class="environment-grid">
                  <label
                    v-for="env in appStore.environmentList"
                    :key="env.id"
                    class="environment-option"
                    :class="{ selected: draft.environmentId === env.id }"
                    ><input v-model.number="draft.environmentId" type="radio" :value="env.id" /><span
                      class="environment-icon"
                      :style="{ '--environment-color': env.color || 'var(--wp-primary-100)' }"
                      ><Icon name="environment" /></span
                    ><span class="environment-copy"
                      ><strong>{{ env.title ?? env.name }}</strong
                      ><small>{{ env.domain || $t('ops.deployment_wizard.no_domain') }}</small
                      ><span
                        ><em v-if="env.protected">{{ $t('ops.environments.protected') }}</em
                        ><em v-if="env.approval_required">{{
                          $t('ops.deployment_wizard.approver_count', { count: env.minimum_approvers })
                        }}</em
                        ><em v-if="env.auto_rollback">{{ $t('ops.environment.auto_rollback') }}</em></span
                      ></span
                    ></label
                  >
                </div>
                <div v-if="selectedEnv" class="environment-detail wp-card">
                  <div>
                    <span>{{ $t('ops.environment.deploy_window') }}</span
                    ><strong>{{ selectedEnv.deploy_window || $t('ops.deployment_wizard.any_time') }}</strong>
                  </div>
                  <div>
                    <span>{{ $t('ops.deployment_wizard.approval_requirement') }}</span
                    ><strong>{{
                      selectedEnv.approval_required
                        ? $t('ops.deployment_wizard.approver_count', { count: selectedEnv.minimum_approvers })
                        : $t('ops.deployment_wizard.no_approval')
                    }}</strong>
                  </div>
                  <div>
                    <span>{{ $t('ops.environment.auto_rollback') }}</span
                    ><strong>{{
                      selectedEnv.auto_rollback ? $t('ops.environments.enabled') : $t('ops.environments.disabled')
                    }}</strong>
                  </div>
                </div>
              </template>

              <template v-else-if="currentStep === 3">
                <div class="form-section">
                  <div class="section-label">
                    <span>{{ $t('ops.deployment_wizard.select_group') }}</span
                    ><small>{{ $t('ops.deployment_wizard.group_hint') }}</small>
                  </div>
                  <div class="group-grid">
                    <label
                      v-for="group in groupsOfSelectedEnv"
                      :key="group.id"
                      class="group-option"
                      :class="{ selected: draft.groupId === group.id }"
                      ><input v-model.number="draft.groupId" type="radio" :value="group.id" /><span class="preview-icon"
                        ><Icon name="server" /></span
                      ><span
                        ><strong>{{ group.name }}</strong
                        ><small>{{ groupMeta(group.id, group.description) }}</small
                        ><em>{{
                          group.health_path || selectedApp?.health_path || $t('ops.deployment_wizard.no_health_check')
                        }}</em></span
                      ></label
                    >
                    <div v-if="groupsOfSelectedEnv.length === 0" class="wp-empty-state">
                      <strong>{{ $t('ops.deployment_wizard.no_groups') }}</strong>
                      <p>{{ $t('ops.deployment_wizard.no_groups_hint') }}</p>
                    </div>
                  </div>
                </div>
                <div class="form-section">
                  <div class="section-label">
                    <span>{{ $t('ops.deployment.strategy') }}</span
                    ><small>{{ $t('ops.deployment_wizard.strategy_hint') }}</small>
                  </div>
                  <div class="strategy-grid">
                    <label
                      v-for="strategy in strategies"
                      :key="strategy.value"
                      :class="{ selected: draft.strategy === strategy.value }"
                      ><input v-model="draft.strategy" type="radio" :value="strategy.value" /><Icon
                        :name="strategy.icon"
                      /><span
                        ><strong>{{ strategy.label }}</strong
                        ><small>{{ strategy.description }}</small></span
                      ></label
                    >
                  </div>
                </div>
                <label class="field batch-field"
                  ><span class="field-label">{{ $t('ops.deployment.batch_size') }}</span
                  ><input
                    v-model.number="draft.batchSize"
                    type="number"
                    min="1"
                    :max="Math.max(selectedServers.length, 1)"
                    class="input"
                  /><small>{{
                    $t('ops.deployment_wizard.batch_hint', {
                      target: selectedServers.length,
                      suggested: suggestedBatchSize,
                    })
                  }}</small></label
                >
              </template>

              <template v-else-if="currentStep === 4">
                <div class="preflight-summary" :class="preflightPassed ? 'passed' : 'blocked'">
                  <span><Icon :name="preflightPassed ? 'check' : 'warning'" /></span>
                  <div>
                    <strong>{{
                      preflightPassed
                        ? $t('ops.deployment_wizard.preflight_passed')
                        : $t('ops.deployment_wizard.preflight_blocked')
                    }}</strong>
                    <p>
                      {{
                        preflightPassed
                          ? $t('ops.deployment_wizard.preflight_passed_description')
                          : $t('ops.deployment_wizard.preflight_blocked_description')
                      }}
                    </p>
                  </div>
                  <Button
                    start-icon="refresh"
                    :text="$t('ops.deployment_wizard.recheck')"
                    @click="preflightCheckedAt = Date.now()"
                  />
                </div>
                <div class="preflight-list">
                  <article
                    v-for="item in preflight"
                    :key="item.label"
                    :class="item.ok ? 'success' : item.blocking ? 'danger' : 'warning'"
                  >
                    <span><Icon :name="item.ok ? 'check' : 'warning'" /></span>
                    <div>
                      <strong>{{ item.label }}</strong>
                      <p>{{ item.detail }}</p>
                    </div>
                    <em>{{
                      item.ok
                        ? $t('ops.deployment_wizard.check_passed')
                        : item.blocking
                          ? $t('ops.deployment_wizard.check_blocked')
                          : $t('ops.deployment_wizard.check_warning')
                    }}</em>
                  </article>
                </div>
                <small class="checked-time">{{
                  $t('ops.deployment_wizard.checked_at', { time: formatCheckedAt(preflightCheckedAt) })
                }}</small>
              </template>

              <template v-else>
                <div class="confirm-hero">
                  <span class="preview-icon"><Icon name="rocket" /></span>
                  <div>
                    <strong>{{ selectedApp?.name }} → {{ selectedEnv?.title ?? selectedEnv?.name }}</strong>
                    <p>{{ selectedRelease?.version }} · {{ selectedRelease?.digest }}</p>
                  </div>
                  <span v-if="selectedEnv?.approval_required" class="approval-chip"
                    ><Icon name="shield" />{{ $t('ops.deployments.pending_approval') }}</span
                  >
                </div>
                <div class="confirm-grid">
                  <div>
                    <span>{{ $t('ops.deployment_wizard.source_pipeline') }}</span
                    ><strong>{{ pipelineLabel(selectedRelease?.pipeline_id) }}</strong>
                  </div>
                  <div>
                    <span>{{ $t('ops.deployment.release') }}</span
                    ><strong>{{ selectedRelease?.version || '—' }}</strong>
                  </div>
                  <div>
                    <span>{{ $t('ops.deployment.server_group') }}</span
                    ><strong>{{ selectedGroup?.name || '—' }}</strong>
                  </div>
                  <div>
                    <span>{{ $t('ops.deployment.targets') }}</span
                    ><strong>{{ $t('ops.deployment_wizard.node_count', { count: selectedServers.length }) }}</strong>
                  </div>
                  <div>
                    <span>{{ $t('ops.deployment.strategy') }}</span
                    ><strong>{{ strategyLabel(draft.strategy) }}</strong>
                  </div>
                  <div>
                    <span>{{ $t('ops.deployment.batch_size') }}</span
                    ><strong>{{ draft.batchSize }}</strong>
                  </div>
                  <div>
                    <span>{{ $t('ops.deployment_wizard.health_check') }}</span
                    ><strong>{{ selectedGroup?.health_path || selectedApp?.health_path || '—' }}</strong>
                  </div>
                  <div>
                    <span>{{ $t('ops.environment.auto_rollback') }}</span
                    ><strong>{{
                      selectedEnv?.auto_rollback ? $t('ops.environments.enabled') : $t('ops.environments.disabled')
                    }}</strong>
                  </div>
                </div>
                <label class="confirm-check"
                  ><input v-model="confirmed" type="checkbox" /><span>{{
                    $t('ops.deployment_wizard.confirmation')
                  }}</span></label
                >
                <div v-if="selectedEnv?.approval_required" class="wp-alert wp-alert-warning">
                  <Icon name="shield" />
                  <div>
                    <strong>{{ $t('ops.deployment_wizard.approval_note') }}</strong>
                    <p class="wp-muted">{{ $t('ops.deployment_wizard.approval_state_hint') }}</p>
                  </div>
                </div>
              </template>

              <FeedbackState
                v-if="submitError"
                compact
                kind="error"
                :title="$t('ops.deployment_wizard.submit_error_title')"
                :description="$t('ops.deployment_wizard.submit_error_description')"
              />
              <div v-if="stepError" class="wp-alert wp-alert-danger">
                <Icon name="warning" />
                <div>
                  <strong>{{ stepError }}</strong>
                </div>
              </div>
            </div>

            <div class="wizard-actions">
              <Button v-if="currentStep > 1" :text="$t('ops.deployment_wizard.back')" @click="previousStep" />
              <Button v-else :text="$t('cancel')" :to="{ path: '/deployments' }" />
              <Button
                v-if="currentStep < 5"
                color="green"
                :text="$t('ops.deployment_wizard.next')"
                end-icon="chevron-right"
                @click="nextStep"
              />
              <Button
                v-else
                color="green"
                start-icon="rocket"
                :disabled="!confirmed || !preflightPassed"
                :is-loading="submitting"
                :text="
                  selectedEnv?.approval_required
                    ? $t('ops.deployment_wizard.submit_approval')
                    : $t('ops.deployment_wizard.start')
                "
                @click="submit"
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline -->
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Icon from '~/components/atomic/Icon.vue';
import type { IconNames } from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import { useConfirmedRequest } from '~/compositions/useConfirmedRequest';
import useApiClient from '~/compositions/useApiClient';
import { useDeploymentPresentation } from '~/compositions/useDeploymentPresentation';
import type { AppRelease, DeployStrategy } from '~/lib/api/types';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useApplicationStore, useServerStore } from '~/store/ops';

const route = useRoute();
const router = useRouter();
const api = useApiClient();
const appStore = useApplicationStore();
const serverStore = useServerStore();
const { t } = useI18n();
const { actorLabel, releaseStatusLabel, strategyLabel } = useDeploymentPresentation();
useWPTitle(computed(() => [t('ops.deployment_wizard.title')]));

const currentStep = ref(1);
const submitting = ref(false);
const submitError = ref(false);
const confirmed = ref(false);
const stepError = ref('');
const preflightCheckedAt = ref(Date.now());
const { begin, hasConfirmedData, initialLoading, loadError, refreshing } = useConfirmedRequest();
let alive = true;
let lifecycleGeneration = 0;
let draftInitialized = false;

const steps = computed(() => [
  { number: 1, label: t('ops.deployment_wizard.step_1'), description: t('ops.deployment_wizard.step_1_description') },
  { number: 2, label: t('ops.deployment_wizard.step_2'), description: t('ops.deployment_wizard.step_2_description') },
  { number: 3, label: t('ops.deployment_wizard.step_3'), description: t('ops.deployment_wizard.step_3_description') },
  { number: 4, label: t('ops.deployment_wizard.step_4'), description: t('ops.deployment_wizard.step_4_description') },
  { number: 5, label: t('ops.deployment_wizard.step_5'), description: t('ops.deployment_wizard.step_5_description') },
]);

const strategies = computed<Array<{ value: DeployStrategy; label: string; description: string; icon: IconNames }>>(
  () => [
    {
      value: 'single',
      label: t('ops.deployment.strategy_single'),
      description: t('ops.deployment_wizard.strategy_single_description'),
      icon: 'server',
    },
    {
      value: 'all-at-once',
      label: t('ops.deployment.strategy_all_at_once'),
      description: t('ops.deployment_wizard.strategy_all_description'),
      icon: 'activity',
    },
    {
      value: 'rolling',
      label: t('ops.deployment.strategy_rolling'),
      description: t('ops.deployment_wizard.strategy_rolling_description'),
      icon: 'rocket',
    },
  ],
);

const draft = reactive({
  applicationId: 0,
  releaseId: 0,
  environmentId: 0,
  groupId: 0,
  strategy: 'rolling' as DeployStrategy,
  batchSize: 1,
});
const selectedApp = computed(() => appStore.applications.get(draft.applicationId));
const selectedEnv = computed(() => appStore.environments.get(draft.environmentId));
const availableReleases = computed(() => appStore.releasesOf(draft.applicationId).value);
const selectedRelease = computed(() => appStore.releases.get(draft.releaseId) as AppRelease | undefined);
const groupsOfSelectedEnv = computed(() =>
  serverStore.groupList.filter((group) => group.environment_id === draft.environmentId),
);
const selectedGroup = computed(() => serverStore.groups.get(draft.groupId));
const selectedServers = computed(() => serverStore.serverList.filter((server) => server.group_id === draft.groupId));
const suggestedBatchSize = computed(() =>
  draft.strategy === 'all-at-once'
    ? Math.max(selectedServers.value.length, 1)
    : draft.strategy === 'single'
      ? 1
      : Math.max(1, Math.ceil(selectedServers.value.length / 3)),
);

const preflight = computed(() => {
  const online = selectedServers.value.filter((server) => server.status === 'online' && !server.maintenance);
  const highDisk = selectedServers.value.filter((server) => server.disk >= 85);
  const offline = selectedServers.value.filter((server) => server.status === 'offline');
  const maintenance = selectedServers.value.filter((server) => server.maintenance || server.status === 'maintenance');
  return [
    {
      label: t('ops.deployment_wizard.preflight_release'),
      detail: selectedRelease.value
        ? `${selectedRelease.value.version} · ${selectedRelease.value.digest}`
        : t('ops.deployment_wizard.no_release_selected'),
      ok: !!selectedRelease.value,
      blocking: true,
    },
    {
      label: t('ops.deployment_wizard.preflight_capacity'),
      detail: t('ops.deployment_wizard.preflight_capacity_summary', {
        online: online.length,
        total: selectedServers.value.length,
        offline: offline.length,
        maintenance: maintenance.length,
      }),
      ok: selectedServers.value.length > 0 && online.length > 0,
      blocking: true,
    },
    {
      label: t('ops.deployment_wizard.preflight_disk'),
      detail:
        highDisk.length > 0
          ? t('ops.deployment_wizard.preflight_disk_warning', {
              count: highDisk.length,
              servers: highDisk.map((server) => server.name).join(', '),
            })
          : t('ops.deployment_wizard.preflight_disk_ok'),
      ok: highDisk.length === 0,
      blocking: false,
    },
    {
      label: t('ops.deployment_wizard.preflight_environment'),
      detail: selectedEnv.value?.approval_required
        ? t('ops.deployment_wizard.preflight_environment_approval', {
            count: selectedEnv.value.minimum_approvers,
          })
        : t('ops.deployment_wizard.preflight_environment_open'),
      ok: !!selectedEnv.value,
      blocking: true,
    },
  ];
});
const preflightPassed = computed(() => preflight.value.every((item) => item.ok || !item.blocking));

function serversInGroup(groupId: number) {
  return serverStore.serverList.filter((server) => server.group_id === groupId);
}

function applicationMeta(runtime: string, ownerTeam?: string) {
  return `${runtime} · ${ownerTeam || t('ops.applications.unassigned')}`;
}

function releaseMeta(pipelineId: number, author?: string) {
  return `${t('ops.releases.pipeline')} #${pipelineId} · ${actorLabel(author, t('ops.deployment.system_actor'))}`;
}

function groupMeta(groupId: number, description?: string) {
  return `${t('ops.deployment_wizard.node_count', { count: serversInGroup(groupId).length })} · ${
    description || t('ops.deployment_wizard.no_description')
  }`;
}

function pipelineLabel(pipelineId?: number) {
  return pipelineId ? `#${pipelineId}` : '—';
}

function formatCheckedAt(timestamp: number) {
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? date.toLocaleTimeString() : '—';
}

function onAppChange() {
  draft.releaseId = availableReleases.value[0]?.id ?? 0;
}
function selectDefaultGroup() {
  draft.groupId = groupsOfSelectedEnv.value[0]?.id ?? 0;
  if (selectedGroup.value) {
    draft.strategy = selectedGroup.value.strategy;
    draft.batchSize = Math.max(selectedGroup.value.batch_size, 1);
  }
}

function validateStep(step: number): string {
  if (
    step === 1 &&
    (!selectedApp.value || !selectedRelease.value || selectedRelease.value.application_id !== draft.applicationId)
  )
    return t('ops.deployment_wizard.validation_release');
  if (step === 2 && !selectedEnv.value) return t('ops.deployment_wizard.validation_environment');
  if (step === 3 && (!selectedGroup.value || selectedServers.value.length === 0))
    return t('ops.deployment_wizard.validation_group');
  if (step === 3 && (draft.batchSize < 1 || draft.batchSize > selectedServers.value.length))
    return t('ops.deployment_wizard.validation_batch', { count: selectedServers.value.length });
  if (step === 4 && !preflightPassed.value) return t('ops.deployment_wizard.validation_preflight');
  return '';
}

function nextStep() {
  const error = validateStep(currentStep.value);
  stepError.value = error;
  if (!error) currentStep.value += 1;
}
function previousStep() {
  stepError.value = '';
  currentStep.value = Math.max(1, currentStep.value - 1);
}

async function submit() {
  if (submitting.value) return;
  const error = validateStep(4);
  if (error || !confirmed.value) {
    stepError.value = error || t('ops.deployment_wizard.validation_confirmation');
    return;
  }
  submitError.value = false;
  submitting.value = true;
  const lifecycle = lifecycleGeneration;
  try {
    const deployment = await api.createDeployment({
      application_id: draft.applicationId,
      environment_id: draft.environmentId,
      release_id: draft.releaseId,
      group_id: draft.groupId,
      strategy: draft.strategy,
      batch_size: draft.batchSize,
    });
    if (!alive || lifecycle !== lifecycleGeneration) return;
    if (!deployment) {
      submitError.value = true;
      return;
    }
    await router.push(`/deployments/${deployment.id}`);
  } catch {
    if (alive && lifecycle === lifecycleGeneration) submitError.value = true;
  } finally {
    if (alive && lifecycle === lifecycleGeneration) submitting.value = false;
  }
}

function initializeDraft() {
  if (draftInitialized) return;
  draftInitialized = true;

  const queryApplicationId = Number(route.query.applicationId);
  const queryReleaseId = Number(route.query.releaseId);
  const queryEnvironmentId = Number(route.query.environmentId);
  const queryServerId = Number(route.query.serverId);

  draft.applicationId = appStore.applications.has(queryApplicationId)
    ? queryApplicationId
    : (appStore.applicationList[0]?.id ?? 0);
  onAppChange();
  const queryRelease = appStore.releases.get(queryReleaseId);
  if (queryRelease?.application_id === draft.applicationId) draft.releaseId = queryRelease.id;

  const queryServer = serverStore.servers.get(queryServerId);
  if (queryServer) {
    draft.environmentId = queryServer.environment_id;
    draft.groupId = queryServer.group_id;
  } else {
    draft.environmentId = appStore.environments.has(queryEnvironmentId)
      ? queryEnvironmentId
      : (appStore.environmentList[0]?.id ?? 0);
    selectDefaultGroup();
  }
}

function reconcileDraft() {
  if (!appStore.applications.has(draft.applicationId)) {
    draft.applicationId = appStore.applicationList[0]?.id ?? 0;
    onAppChange();
  }
  const currentRelease = appStore.releases.get(draft.releaseId);
  if (currentRelease?.application_id !== draft.applicationId) onAppChange();
  if (!appStore.environments.has(draft.environmentId)) {
    draft.environmentId = appStore.environmentList[0]?.id ?? 0;
  }
  const currentGroup = serverStore.groups.get(draft.groupId);
  if (currentGroup?.environment_id !== draft.environmentId) selectDefaultGroup();
}

async function loadOptions(refresh = false) {
  const request = begin(refresh);

  const [applicationResult, serverResult] = await Promise.allSettled([appStore.loadAll(), serverStore.loadAll()]);
  if (!request.isCurrent()) return;

  if (applicationResult.status === 'fulfilled' && serverResult.status === 'fulfilled') {
    request.confirm();
    initializeDraft();
    reconcileDraft();
  }
  request.finish(applicationResult.status === 'rejected' || serverResult.status === 'rejected');
}

watch(
  () => draft.environmentId,
  () => {
    const currentGroup = serverStore.groups.get(draft.groupId);
    if (currentGroup?.environment_id !== draft.environmentId) selectDefaultGroup();
  },
);
watch(
  () => draft.strategy,
  () => {
    draft.batchSize = suggestedBatchSize.value;
  },
);
watch([() => draft.applicationId, () => draft.releaseId, () => draft.environmentId, () => draft.groupId], () => {
  stepError.value = '';
  submitError.value = false;
  confirmed.value = false;
});

onMounted(() => loadOptions());
onBeforeUnmount(() => {
  alive = false;
  lifecycleGeneration += 1;
});
</script>

<style scoped>
@reference '~/tailwind.css';

.ops-page {
  width: min(100%, 1440px);
  @apply mx-auto px-5 pb-10 md:px-7;
}
.page-description {
  @apply text-wp-text-alt-100 mb-4 text-sm;
}
.wizard-layout {
  @apply mt-4 grid items-start gap-4 lg:grid-cols-[270px_minmax(0,1fr)];
}
.wizard-steps {
  @apply overflow-hidden p-2 lg:sticky lg:top-20;
}
.wizard-steps button {
  @apply text-wp-text-100 flex w-full items-center gap-3 rounded-lg p-3 text-left disabled:cursor-not-allowed disabled:opacity-55;
}
.wizard-steps button.active {
  @apply bg-wp-primary-100/12 text-wp-text-200;
}
.wizard-steps button.complete {
  @apply text-wp-text-200;
}
.step-index {
  @apply border-wp-border-200 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold;
}
.wizard-steps button.active .step-index {
  @apply border-wp-primary-100 bg-wp-primary-100/15 text-wp-primary-100;
}
.wizard-steps button.complete .step-index {
  @apply border-wp-state-ok-100 bg-wp-state-ok-100 text-white;
}
.wizard-steps strong,
.wizard-steps small {
  @apply block;
}
.wizard-steps strong {
  @apply text-xs;
}
.wizard-steps small {
  @apply text-wp-text-alt-100 mt-1 text-[9px];
}
.wizard-card {
  @apply overflow-hidden;
}
.wizard-card-header {
  @apply border-wp-border-100 flex items-start justify-between gap-5 border-b p-5;
}
.wizard-card-header span {
  @apply text-wp-primary-100 text-[10px] font-bold tracking-wider uppercase;
}
.wizard-card-header h2 {
  @apply text-wp-text-200 mt-1 text-lg font-bold;
}
.wizard-card-header p {
  @apply text-wp-text-alt-100 mt-1 text-xs;
}
.wizard-card-header .step-progress {
  @apply bg-wp-primary-100/10 rounded-full px-3 py-1;
}
.wizard-content {
  @apply grid gap-5 p-5;
}
.form-section {
  @apply grid gap-3;
}
.section-label > span,
.section-label > small {
  @apply block;
}
.section-label > span {
  @apply text-wp-text-200 text-xs font-bold;
}
.section-label > small {
  @apply text-wp-text-alt-100 mt-1 text-[10px];
}
.selection-preview,
.confirm-hero {
  @apply border-wp-border-100 bg-wp-background-200 flex items-center gap-4 rounded-xl border p-4;
}
.preview-icon {
  @apply bg-wp-primary-100/12 text-wp-primary-100 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl;
}
.selection-preview strong,
.selection-preview p,
.selection-preview small,
.confirm-hero strong,
.confirm-hero p {
  @apply block;
}
.selection-preview strong,
.confirm-hero strong {
  @apply text-wp-text-200;
}
.selection-preview p,
.confirm-hero p {
  @apply text-wp-text-100 mt-1 text-xs;
}
.selection-preview small {
  @apply text-wp-text-alt-100 mt-1 text-[10px];
}
.option-grid,
.group-grid {
  @apply grid gap-2;
}
.release-option,
.group-option {
  @apply border-wp-border-100 bg-wp-background-200 grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3 transition-colors;
}
.group-option {
  @apply grid-cols-[48px_minmax(0,1fr)];
}
.release-option.selected,
.group-option.selected {
  @apply border-wp-primary-100 bg-wp-primary-100/5;
}
.release-option input,
.group-option input,
.environment-option input,
.strategy-grid input {
  @apply sr-only;
}
.release-option strong,
.release-option small,
.release-option em,
.group-option strong,
.group-option small,
.group-option em {
  @apply block;
}
.release-option strong,
.group-option strong {
  @apply text-wp-text-200 text-xs;
}
.release-option small {
  @apply text-wp-text-alt-100 mt-1 truncate font-mono text-[9px];
}
.release-option em,
.group-option em {
  @apply text-wp-text-alt-100 mt-1 text-[9px] not-italic;
}
.status-chip,
.approval-chip {
  @apply border-wp-state-ok-100/30 bg-wp-state-ok-100/10 text-wp-state-ok-100 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-bold;
}
.environment-grid {
  @apply grid gap-3 md:grid-cols-3;
}
.environment-option {
  @apply border-wp-border-100 bg-wp-background-200 flex cursor-pointer items-center gap-3 rounded-xl border p-4;
}
.environment-option.selected {
  @apply border-wp-primary-100 bg-wp-primary-100/5;
}
.environment-icon {
  color: var(--environment-color);
  @apply flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-current/10;
}
.environment-copy {
  @apply min-w-0;
}
.environment-copy strong,
.environment-copy small {
  @apply block;
}
.environment-copy strong {
  @apply text-wp-text-200 text-xs;
}
.environment-copy small {
  @apply text-wp-text-alt-100 mt-1 truncate text-[9px];
}
.environment-copy > span {
  @apply mt-2 flex flex-wrap gap-1;
}
.environment-copy em {
  @apply bg-wp-background-100 text-wp-text-100 rounded px-1.5 py-0.5 text-[8px] not-italic;
}
.environment-detail {
  @apply grid md:grid-cols-3;
}
.environment-detail > div {
  @apply border-wp-border-100 flex items-center justify-between gap-3 border-b p-4 last:border-0 md:border-r md:border-b-0 md:last:border-r-0;
}
.environment-detail span {
  @apply text-wp-text-alt-100 text-[10px];
}
.environment-detail strong {
  @apply text-wp-text-200 text-xs;
}
.strategy-grid {
  @apply grid gap-2 md:grid-cols-3;
}
.strategy-grid label {
  @apply border-wp-border-100 bg-wp-background-200 flex cursor-pointer items-start gap-3 rounded-xl border p-4;
}
.strategy-grid label.selected {
  @apply border-wp-primary-100 bg-wp-primary-100/5 text-wp-primary-100;
}
.strategy-grid strong,
.strategy-grid small {
  @apply block;
}
.strategy-grid strong {
  @apply text-wp-text-200 text-xs;
}
.strategy-grid small {
  @apply text-wp-text-alt-100 mt-1 text-[9px];
}
.batch-field {
  @apply max-w-sm;
}
.batch-field small {
  @apply text-wp-text-alt-100 mt-1 text-[9px];
}
.preflight-summary {
  @apply flex items-center gap-4 rounded-xl border p-4;
}
.preflight-summary.passed {
  @apply border-wp-state-ok-100/30 bg-wp-state-ok-100/8;
}
.preflight-summary.blocked {
  @apply border-wp-error-100/30 bg-wp-error-100/8;
}
.preflight-summary > span {
  @apply bg-wp-state-ok-100 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white;
}
.preflight-summary.blocked > span {
  @apply bg-wp-error-100;
}
.preflight-summary > div {
  @apply min-w-0 flex-1;
}
.preflight-summary strong,
.preflight-summary p {
  @apply block;
}
.preflight-summary strong {
  @apply text-wp-text-200 text-xs;
}
.preflight-summary p {
  @apply text-wp-text-alt-100 mt-1 text-[10px];
}
.preflight-list {
  @apply grid gap-2;
}
.preflight-list article {
  @apply border-wp-border-100 grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3;
}
.preflight-list article > span {
  @apply flex h-8 w-8 items-center justify-center rounded-lg;
}
.preflight-list article.success > span {
  @apply bg-wp-state-ok-100/10 text-wp-state-ok-100;
}
.preflight-list article.warning > span {
  @apply bg-wp-state-warn-100/10 text-wp-state-warn-100;
}
.preflight-list article.danger > span {
  @apply bg-wp-error-100/10 text-wp-error-100;
}
.preflight-list strong,
.preflight-list p {
  @apply block;
}
.preflight-list strong {
  @apply text-wp-text-200 text-xs;
}
.preflight-list p {
  @apply text-wp-text-alt-100 mt-1 text-[9px];
}
.preflight-list em {
  @apply text-[9px] font-bold not-italic;
}
.preflight-list .success em {
  @apply text-wp-state-ok-100;
}
.preflight-list .warning em {
  @apply text-wp-state-warn-100;
}
.preflight-list .danger em {
  @apply text-wp-error-100;
}
.checked-time {
  @apply text-wp-text-alt-100 text-right text-[9px];
}
.confirm-hero {
  @apply relative;
}
.confirm-hero > div {
  @apply min-w-0 flex-1;
}
.approval-chip {
  @apply border-wp-state-warn-100/30 bg-wp-state-warn-100/10 text-wp-state-warn-100;
}
.confirm-grid {
  @apply border-wp-border-100 grid overflow-hidden rounded-xl border md:grid-cols-2;
}
.confirm-grid > div {
  @apply border-wp-border-100 flex items-center justify-between gap-4 border-b p-3 odd:md:border-r;
}
.confirm-grid span {
  @apply text-wp-text-alt-100 text-[10px];
}
.confirm-grid strong {
  @apply text-wp-text-200 max-w-64 truncate text-right text-xs;
}
.confirm-check {
  @apply border-wp-border-100 bg-wp-background-200 flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-xs;
}
.confirm-check input {
  @apply accent-wp-primary-100 mt-0.5 h-4 w-4;
}
.wizard-actions {
  @apply border-wp-border-100 flex justify-end gap-2 border-t p-4;
}
</style>
