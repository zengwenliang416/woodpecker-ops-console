<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline -->
  <Scaffold :go-back="() => router.push('/deployments')" full-width-header fluid-content>
    <template #title>{{ $t('ops.deployment_wizard.title') }}</template>

    <div class="ops-page">
      <p class="page-description">从不可变 Release 创建服务器部署，并在执行前完成容量、安全和审批检查。</p>
      <DeploymentNav
        :application-count="appStore.applicationList.length"
        :environment-count="appStore.environmentList.length"
        :release-count="appStore.releaseList.length"
      />

      <div class="wizard-layout">
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
            <div class="wizard-card-header">
              <div>
                <span>步骤 {{ currentStep }} / 5</span>
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
                      <option :value="0" disabled>选择应用</option>
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
                      <small>{{ selectedApp.runtime }} · {{ selectedApp.owner_team || '未分配团队' }}</small>
                    </div>
                  </div>
                </div>
                <div class="form-section">
                  <div class="section-label">
                    <span>{{ $t('ops.deployment.release') }}</span
                    ><small>选择流水线产出的不可变制品</small>
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
                        ><em>Pipeline #{{ release.pipeline_id }} · {{ release.author || 'system' }}</em></span
                      ><span class="status-chip">{{ release.status }}</span></label
                    >
                    <div v-if="availableReleases.length === 0" class="wp-empty-state">
                      <strong>该应用暂无 Release</strong>
                      <p>请先从成功流水线生成不可变发布产物。</p>
                    </div>
                  </div>
                </div>
                <div class="wp-alert wp-alert-info">
                  <Icon name="info" />
                  <div>
                    <strong>{{ $t('ops.deployment_wizard.release_hint') }}</strong>
                    <p class="wp-muted">部署过程中使用镜像 Digest，避免标签漂移。</p>
                  </div>
                </div>
              </template>

              <template v-else-if="currentStep === 2">
                <div class="section-label">
                  <span>选择目标环境</span><small>保护规则、审批人数和发布窗口将在部署中强制执行</small>
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
                      ><small>{{ env.domain || '未配置域名' }}</small
                      ><span
                        ><em v-if="env.protected">受保护</em
                        ><em v-if="env.approval_required">{{ env.minimum_approvers }} 人审批</em
                        ><em v-if="env.auto_rollback">自动回滚</em></span
                      ></span
                    ></label
                  >
                </div>
                <div v-if="selectedEnv" class="environment-detail wp-card">
                  <div>
                    <span>发布窗口</span><strong>{{ selectedEnv.deploy_window || '随时' }}</strong>
                  </div>
                  <div>
                    <span>审批要求</span
                    ><strong>{{
                      selectedEnv.approval_required ? `${selectedEnv.minimum_approvers} 人` : '无需审批'
                    }}</strong>
                  </div>
                  <div>
                    <span>自动回滚</span><strong>{{ selectedEnv.auto_rollback ? '启用' : '关闭' }}</strong>
                  </div>
                </div>
              </template>

              <template v-else-if="currentStep === 3">
                <div class="form-section">
                  <div class="section-label"><span>选择服务器组</span><small>目标组必须属于所选环境</small></div>
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
                        ><small
                          >{{ serversInGroup(group.id).length }} 台服务器 · {{ group.description || '无描述' }}</small
                        ><em>{{ group.health_path || selectedApp?.health_path || '未配置健康检查' }}</em></span
                      ></label
                    >
                    <div v-if="groupsOfSelectedEnv.length === 0" class="wp-empty-state">
                      <strong>该环境没有服务器组</strong>
                      <p>请先在基础设施模块创建目标组。</p>
                    </div>
                  </div>
                </div>
                <div class="form-section">
                  <div class="section-label">
                    <span>{{ $t('ops.deployment.strategy') }}</span
                    ><small>决定节点并发和失败影响范围</small>
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
                  /><small
                    >当前目标 {{ selectedServers.length }} 台，建议每批 {{ suggestedBatchSize }} 台。</small
                  ></label
                >
              </template>

              <template v-else-if="currentStep === 4">
                <div class="preflight-summary" :class="preflightPassed ? 'passed' : 'blocked'">
                  <span><Icon :name="preflightPassed ? 'check' : 'warning'" /></span>
                  <div>
                    <strong>{{ preflightPassed ? '部署前检查通过' : '部署前检查存在阻断项' }}</strong>
                    <p>
                      {{
                        preflightPassed
                          ? 'Release、容量、锁和磁盘检查均满足执行条件。'
                          : '请返回前面的步骤修复阻断项后再提交。'
                      }}
                    </p>
                  </div>
                  <Button start-icon="refresh" text="重新检查" @click="preflightCheckedAt = Date.now()" />
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
                    <em>{{ item.ok ? '通过' : item.blocking ? '阻断' : '警告' }}</em>
                  </article>
                </div>
                <small class="checked-time">检查时间：{{ new Date(preflightCheckedAt).toLocaleTimeString() }}</small>
              </template>

              <template v-else>
                <div class="confirm-hero">
                  <span class="preview-icon"><Icon name="rocket" /></span>
                  <div>
                    <strong>{{ selectedApp?.name }} → {{ selectedEnv?.title ?? selectedEnv?.name }}</strong>
                    <p>{{ selectedRelease?.version }} · {{ selectedRelease?.digest }}</p>
                  </div>
                  <span v-if="selectedEnv?.approval_required" class="approval-chip"
                    ><Icon name="shield" />等待审批</span
                  >
                </div>
                <div class="confirm-grid">
                  <div>
                    <span>来源流水线</span><strong>#{{ selectedRelease?.pipeline_id || '—' }}</strong>
                  </div>
                  <div>
                    <span>Release</span><strong>{{ selectedRelease?.version || '—' }}</strong>
                  </div>
                  <div>
                    <span>服务器组</span><strong>{{ selectedGroup?.name || '—' }}</strong>
                  </div>
                  <div>
                    <span>目标节点</span><strong>{{ selectedServers.length }} 台</strong>
                  </div>
                  <div>
                    <span>策略</span><strong>{{ draft.strategy }}</strong>
                  </div>
                  <div>
                    <span>批次大小</span><strong>{{ draft.batchSize }}</strong>
                  </div>
                  <div>
                    <span>健康检查</span
                    ><strong>{{ selectedGroup?.health_path || selectedApp?.health_path || '—' }}</strong>
                  </div>
                  <div>
                    <span>自动回滚</span><strong>{{ selectedEnv?.auto_rollback ? '启用' : '关闭' }}</strong>
                  </div>
                </div>
                <label class="confirm-check"
                  ><input v-model="confirmed" type="checkbox" /><span
                    >我确认 Release、目标环境和服务器组无误；{{ $t('ops.deployment_wizard.confirm_note') }}。</span
                  ></label
                >
                <div v-if="selectedEnv?.approval_required" class="wp-alert wp-alert-warning">
                  <Icon name="shield" />
                  <div>
                    <strong>{{ $t('ops.deployment_wizard.approval_note') }}</strong>
                    <p class="wp-muted">提交后 Deployment 将进入 pending_approval 状态。</p>
                  </div>
                </div>
              </template>

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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import Icon from '~/components/atomic/Icon.vue';
import type { IconNames } from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import useApiClient from '~/compositions/useApiClient';
import type { AppRelease, DeployStrategy } from '~/lib/api/types';
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
const confirmed = ref(false);
const stepError = ref('');
const preflightCheckedAt = ref(Date.now());

const steps = computed(() => [
  { number: 1, label: t('ops.deployment_wizard.step_1'), description: '应用和不可变产物' },
  { number: 2, label: t('ops.deployment_wizard.step_2'), description: '保护策略与发布窗口' },
  { number: 3, label: t('ops.deployment_wizard.step_3'), description: '服务器组、策略和批次' },
  { number: 4, label: t('ops.deployment_wizard.step_4'), description: '容量、健康与安全检查' },
  { number: 5, label: t('ops.deployment_wizard.step_5'), description: '创建部署并开始执行' },
]);

const strategies: Array<{ value: DeployStrategy; label: string; description: string; icon: IconNames }> = [
  { value: 'single', label: '单节点', description: '仅部署一个目标节点，适合开发验证。', icon: 'server' },
  { value: 'all-at-once', label: '全部同时', description: '所有节点并发执行，速度最快但风险最高。', icon: 'activity' },
  { value: 'rolling', label: '滚动部署', description: '按批次逐步推进，生产环境推荐。', icon: 'rocket' },
];

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
        : '未选择 Release',
      ok: !!selectedRelease.value,
      blocking: true,
    },
    {
      label: t('ops.deployment_wizard.preflight_capacity'),
      detail: `${t('ops.deployment_wizard.preflight_capacity_detail', { online: online.length, total: selectedServers.value.length })}；${offline.length} 台离线，${maintenance.length} 台维护`,
      ok: selectedServers.value.length > 0 && online.length > 0,
      blocking: true,
    },
    {
      label: t('ops.deployment_wizard.preflight_locks'),
      detail: t('ops.deployment_wizard.preflight_locks_detail'),
      ok: true,
      blocking: true,
    },
    {
      label: t('ops.deployment_wizard.preflight_disk'),
      detail:
        highDisk.length > 0
          ? `${highDisk.length} ${t('ops.deployment_wizard.preflight_disk_warn')}：${highDisk.map((server) => server.name).join('、')}`
          : t('ops.deployment_wizard.preflight_disk_ok'),
      ok: highDisk.length === 0,
      blocking: false,
    },
    {
      label: '环境保护策略',
      detail: selectedEnv.value?.approval_required
        ? `需要 ${selectedEnv.value.minimum_approvers} 人审批后执行`
        : '当前环境无需审批',
      ok: !!selectedEnv.value,
      blocking: true,
    },
  ];
});
const preflightPassed = computed(() => preflight.value.every((item) => item.ok || !item.blocking));

function serversInGroup(groupId: number) {
  return serverStore.serverList.filter((server) => server.group_id === groupId);
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
    return '请选择当前应用生成的可部署 Release。';
  if (step === 2 && !selectedEnv.value) return '请选择目标环境。';
  if (step === 3 && (!selectedGroup.value || selectedServers.value.length === 0)) return '请选择包含服务器的目标组。';
  if (step === 3 && (draft.batchSize < 1 || draft.batchSize > selectedServers.value.length))
    return `批次大小应在 1 到 ${selectedServers.value.length} 之间。`;
  if (step === 4 && !preflightPassed.value) return '部署前检查存在阻断项，请修复后再继续。';
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
  const error = validateStep(4);
  if (error || !confirmed.value) {
    stepError.value = error || '请确认部署信息。';
    return;
  }
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
    if (deployment) await router.push(`/deployments/${deployment.id}`);
  } finally {
    submitting.value = false;
  }
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
  confirmed.value = false;
});

onMounted(async () => {
  await Promise.all([appStore.loadAll(), serverStore.loadAll()]);
  const qApplicationId = Number(route.query.applicationId);
  const qReleaseId = Number(route.query.releaseId);
  const qServerId = Number(route.query.serverId);

  draft.applicationId = appStore.applications.has(qApplicationId)
    ? qApplicationId
    : (appStore.applicationList[0]?.id ?? 0);
  onAppChange();
  const queryRelease = appStore.releases.get(qReleaseId);
  if (queryRelease?.application_id === draft.applicationId) draft.releaseId = queryRelease.id;

  if (qServerId) {
    const server = serverStore.servers.get(qServerId);
    if (server) {
      draft.environmentId = server.environment_id;
      draft.groupId = server.group_id;
    }
  } else {
    draft.environmentId = appStore.environmentList[0]?.id || 0;
    selectDefaultGroup();
  }
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
