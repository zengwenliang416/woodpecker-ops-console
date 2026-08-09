<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline -->
  <Scaffold :go-back="() => router.push('/deployments')" full-width-header fluid-content>
    <template #title>
      <span class="deployment-title"
        ><span>Deployment {{ $t('ops.deployment.id') }} DEP-{{ deploymentId }}</span
        ><span v-if="detail" class="status-badge" :class="statusClass(detail.deployment.status)">{{
          detail.deployment.status
        }}</span></span
      >
    </template>
    <template #headerActions>
      <template v-if="detail">
        <Button
          v-if="detail.deployment.status === 'pending_approval'"
          color="green"
          start-icon="check"
          :text="$t('ops.deployment.approve')"
          @click="approve"
        />
        <Button
          v-if="detail.deployment.status === 'pending_approval'"
          color="red"
          start-icon="x"
          :text="$t('ops.deployment.reject')"
          @click="reject"
        />
        <Button
          v-if="detail.deployment.status === 'running'"
          start-icon="pause"
          :text="$t('ops.deployment.pause')"
          @click="pause"
        />
        <Button
          v-if="detail.deployment.status === 'paused'"
          start-icon="play"
          :text="$t('ops.deployment.resume')"
          @click="resume"
        />
        <Button
          v-if="detail.deployment.status === 'running' && detail.deployment.strategy === 'rolling'"
          color="green"
          start-icon="play"
          text="推进下一节点"
          @click="advance"
        />
        <Button v-if="isRunning" color="red" start-icon="stop" :text="$t('ops.deployment.cancel')" @click="cancel" />
        <Button
          v-if="detail.deployment.status === 'failed'"
          color="red"
          start-icon="rollback"
          :text="$t('ops.deployment.rollback')"
          @click="rollback"
        />
      </template>
    </template>

    <div class="ops-page">
      <div v-if="detail" class="page-stack">
        <div class="deployment-meta">
          <span>{{ appName }}</span
          ><span>{{ releaseVersion }}</span
          ><span>Pipeline #{{ detail.deployment.pipeline_id || '—' }}</span
          ><span>{{ detail.deployment.triggered_by || 'system' }}</span
          ><span>{{ $t('ops.deployment.started') }} {{ relativeTime(detail.deployment.created) }}</span>
        </div>

        <DeploymentNav
          :application-count="appStore.applicationList.length"
          :environment-count="appStore.environmentList.length"
          :release-count="appStore.releaseList.length"
          :approval-count="store.pendingApprovals.length"
        />

        <div class="hero-grid">
          <section class="deployment-hero wp-card">
            <div class="release-node">
              <span class="hero-icon"><Icon name="package" /></span>
              <div>
                <strong>{{ releaseVersion }}</strong
                ><small>{{ releaseDigest }}</small>
              </div>
            </div>
            <Icon name="chevron-right" class="hero-arrow" />
            <div class="release-node target-node">
              <span class="hero-icon"><Icon name="environment" /></span>
              <div>
                <strong>{{ envName }}</strong
                ><small>{{ environment?.domain || '目标环境' }}</small>
              </div>
            </div>
            <div class="hero-progress">
              <div class="progress-copy">
                <span>{{ targetProgress }}%</span
                ><small>{{ healthyCount }} / {{ detail.targets.length }} 节点完成</small>
              </div>
              <span class="progress-track"><i :style="{ width: `${targetProgress}%` }" /></span>
            </div>
          </section>

          <aside class="control-state wp-card">
            <span class="control-indicator" :class="statusClass(detail.deployment.status)"
              ><Icon :name="statusIcon(detail.deployment.status)"
            /></span>
            <div>
              <small>控制面状态</small><strong>{{ statusTitle(detail.deployment.status) }}</strong>
              <p>{{ statusDescription(detail.deployment.status) }}</p>
            </div>
          </aside>
        </div>

        <div class="content-grid">
          <main class="main-stack">
            <section class="wp-card rollout-card">
              <div class="wp-card-header">
                <div>
                  <h2>{{ $t('ops.deployment.targets') }}</h2>
                  <p>{{ detail.deployment.strategy }} · 每批 {{ detail.deployment.batch_size }} 台</p>
                </div>
                <span class="elapsed">{{ elapsedTime }}</span>
              </div>
              <div class="target-columns">
                <span>{{ $t('ops.deployment.targets') }}</span>
                <span>{{ $t('ops.deployment.phase') }} / {{ $t('ops.deployment.message') }}</span>
                <span>{{ $t('ops.deployment.target_status') }}</span>
              </div>
              <div class="target-list">
                <article
                  v-for="(target, index) in detail.targets"
                  :key="target.server_id"
                  class="target-card"
                  :class="targetClass(target.status)"
                >
                  <span class="target-index"
                    ><Icon v-if="target.status === 'healthy'" name="check" /><Icon
                      v-else-if="target.status === 'failed'"
                      name="x"
                    /><span v-else>{{ index + 1 }}</span></span
                  >
                  <div class="target-copy">
                    <router-link :to="`/infrastructure/servers/${target.server_id}`">
                      {{ serverName(target.server_id) }}
                    </router-link>
                    <small>{{ serverMeta(target.server_id) }}</small>
                    <p>
                      <strong>{{ target.phase.toUpperCase() }}</strong
                      ><span>{{ target.message || phaseDescription(target.phase) }}</span>
                    </p>
                  </div>
                  <div class="target-state">
                    <span class="status-badge" :class="targetStatusClass(target.status)">{{
                      targetStatusLabel(target.status)
                    }}</span>
                    <small>{{ targetDuration(target) }}</small>
                    <Button
                      v-if="target.status === 'failed'"
                      size="sm"
                      color="green"
                      :text="$t('ops.deployment.retry')"
                      @click="retry(target.server_id)"
                    />
                  </div>
                </article>
                <div v-if="detail.targets.length === 0" class="wp-empty-state">
                  <strong>{{ $t('ops.deployment.no_targets') }}</strong>
                </div>
              </div>
            </section>

            <section class="wp-card log-card">
              <div class="wp-card-header">
                <div>
                  <h2>{{ $t('ops.deployment.logs') }}</h2>
                  <p>Controller 与 Node Agent 的结构化事件流</p>
                </div>
                <Button size="sm" start-icon="download" text="下载日志" @click="downloadLogs" />
              </div>
              <div class="log-console">
                <div v-for="(log, index) in detail.deployment.logs ?? []" :key="`${log.at}-${index}`" class="log-row">
                  <span class="log-line">{{ index + 1 }}</span
                  ><time>{{ formatTime(log.at) }}</time
                  ><span :class="logLevelClass(log.level)">{{ log.message }}</span>
                </div>
                <div v-if="(detail.deployment.logs ?? []).length === 0" class="log-empty">
                  {{ $t('ops.deployment.no_logs') }}
                </div>
              </div>
            </section>

            <section v-if="detail.approvals.length > 0" class="wp-card">
              <div class="wp-card-header">
                <h2>{{ $t('ops.deployment.approvals') }}</h2>
              </div>
              <div class="approval-list">
                <div v-for="approval in detail.approvals" :key="approval.id">
                  <span class="status-badge" :class="approval.approved ? 'status-success' : 'status-failed'">{{
                    approval.approved ? $t('ops.deployment.approved') : $t('ops.deployment.rejected')
                  }}</span
                  ><strong>{{ approval.approver }}</strong
                  ><span>{{ approval.comment || '—' }}</span
                  ><time>{{ formatTimestamp(approval.created) }}</time>
                </div>
              </div>
            </section>
          </main>

          <aside class="aside-stack">
            <section class="wp-card">
              <div class="wp-card-header"><h2>部署详情</h2></div>
              <div class="detail-list">
                <div>
                  <span>应用</span
                  ><router-link :to="`/deployments/apps/${detail.deployment.application_id}`">
                    {{ appName }}
                  </router-link>
                </div>
                <div>
                  <span>环境</span
                  ><router-link :to="`/deployments/environments/${detail.deployment.environment_id}`">
                    {{ envName }}
                  </router-link>
                </div>
                <div>
                  <span>{{ $t('ops.deployment.server_group') }}</span
                  ><strong>{{
                    serverStore.groups.get(detail.deployment.group_id ?? 0)?.name ||
                    `#${detail.deployment.group_id ?? '—'}`
                  }}</strong>
                </div>
                <div>
                  <span>Release</span><strong>{{ releaseVersion }}</strong>
                </div>
                <div>
                  <span>镜像 Digest</span><code>{{ releaseDigest }}</code>
                </div>
                <div>
                  <span>策略</span><strong>{{ detail.deployment.strategy }}</strong>
                </div>
                <div>
                  <span>批次大小</span><strong>{{ detail.deployment.batch_size }}</strong>
                </div>
                <div>
                  <span>触发人</span><strong>{{ detail.deployment.triggered_by || '—' }}</strong>
                </div>
                <div>
                  <span>审批人</span><strong>{{ detail.deployment.approved_by || '—' }}</strong>
                </div>
                <div>
                  <span>{{ $t('ops.deployment.started') }}</span
                  ><strong>{{ formatTimestamp(detail.deployment.started_at) }}</strong>
                </div>
                <div>
                  <span>结束</span><strong>{{ formatTimestamp(detail.deployment.finished_at) }}</strong>
                </div>
              </div>
            </section>

            <section class="wp-card">
              <div class="wp-card-header"><h2>健康验证</h2></div>
              <div class="detail-list">
                <div>
                  <span>路径</span><code>{{ application?.health_path || '—' }}</code>
                </div>
                <div>
                  <span>端口</span><strong>{{ application?.port || '—' }}</strong>
                </div>
                <div>
                  <span>最小健康节点</span><strong>{{ minimumHealthyPercent }}%</strong>
                </div>
                <div>
                  <span>自动回滚</span><strong>{{ environment?.auto_rollback ? '启用' : '关闭' }}</strong>
                </div>
              </div>
            </section>

            <section v-if="detail.deployment.status === 'failed'" class="wp-card recovery-card">
              <div class="wp-card-header"><h2>恢复建议</h2></div>
              <div class="wp-card-body recovery-copy">
                <Icon name="warning" />
                <p>先重试失败节点；若健康检查持续失败，创建回滚 Deployment 恢复上一稳定 Release。</p>
                <Button color="red" start-icon="rollback" text="创建回滚" @click="rollback" />
              </div>
            </section>
          </aside>
        </div>
      </div>
      <div v-else class="loading-state"><Icon name="spinner" class="animate-spin" /></div>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline -->
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import Icon from '~/components/atomic/Icon.vue';
import type { IconNames } from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { DeploymentDetail, DeploymentStatus, DeploymentTarget, TargetStatus } from '~/lib/api/types';
import { useApplicationStore, useDeploymentStore, useServerStore } from '~/store/ops';

const route = useRoute();
const router = useRouter();
const api = useApiClient();
const store = useDeploymentStore();
const appStore = useApplicationStore();
const serverStore = useServerStore();

const deploymentId = computed(() => Number(route.params.deploymentId));
const detail = ref<DeploymentDetail | null>(null);
let pollTimer: ReturnType<typeof setInterval> | undefined;
let disposed = false;
let loadingDeploymentId: number | undefined;

useWPTitle(computed(() => [`DEP-${deploymentId.value}`]));

const application = computed(() =>
  detail.value ? appStore.applications.get(detail.value.deployment.application_id) : undefined,
);
const environment = computed(() =>
  detail.value ? appStore.environments.get(detail.value.deployment.environment_id) : undefined,
);
const release = computed(() => (detail.value ? appStore.releases.get(detail.value.deployment.release_id) : undefined));
const appName = computed(() => application.value?.name ?? `#${detail.value?.deployment.application_id ?? ''}`);
const envName = computed(
  () => environment.value?.title ?? environment.value?.name ?? `#${detail.value?.deployment.environment_id ?? ''}`,
);
const releaseVersion = computed(() => release.value?.version ?? `#${detail.value?.deployment.release_id ?? ''}`);
const releaseDigest = computed(() => release.value?.digest ?? '—');
const isRunning = computed(() => ['running', 'paused'].includes(detail.value?.deployment.status ?? ''));
const healthyCount = computed(
  () =>
    detail.value?.targets.filter((target) => ['healthy', 'skipped', 'rolled_back'].includes(target.status)).length ?? 0,
);
const targetProgress = computed(() => {
  const targets = detail.value?.targets ?? [];
  if (targets.length === 0) return detail.value?.deployment.progress ?? 0;
  const terminal = targets.filter((target) =>
    ['healthy', 'failed', 'skipped', 'rolled_back'].includes(target.status),
  ).length;
  return Math.round((terminal / targets.length) * 100);
});
const minimumHealthyPercent = computed(() =>
  detail.value?.targets.length ? Math.max(1, Math.round((healthyCount.value / detail.value.targets.length) * 100)) : 0,
);
const elapsedTime = computed(() => {
  const started = detail.value?.deployment.started_at;
  if (!started) return '—';
  const end = detail.value?.deployment.finished_at || Math.floor(Date.now() / 1000);
  const seconds = Math.max(0, end - started);
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
});

async function reload() {
  const requestedId = deploymentId.value;
  if (loadingDeploymentId === requestedId) return;
  loadingDeploymentId = requestedId;
  try {
    const nextDetail = await store.loadDetail(requestedId);
    if (!disposed && requestedId === deploymentId.value) detail.value = nextDetail;
  } finally {
    if (loadingDeploymentId === requestedId) loadingDeploymentId = undefined;
  }
}
async function approve() {
  await api.approveDeployment(deploymentId.value);
  await reload();
}
async function reject() {
  // eslint-disable-next-line no-alert
  if (!window.confirm('确认拒绝该生产部署？')) return;
  await api.rejectDeployment(deploymentId.value, 'Rejected from control plane');
  await reload();
}
async function pause() {
  await api.pauseDeployment(deploymentId.value);
  await reload();
}
async function resume() {
  await api.resumeDeployment(deploymentId.value);
  await reload();
}
async function advance() {
  await api.advanceDeployment(deploymentId.value);
  await reload();
}
async function cancel() {
  // eslint-disable-next-line no-alert
  if (!window.confirm('确认取消正在运行的部署？')) return;
  await api.cancelDeployment(deploymentId.value);
  await reload();
}
async function retry(serverId: number) {
  await api.retryDeployment(deploymentId.value, [serverId]);
  await reload();
}
async function rollback() {
  const deployment = await api.rollbackDeployment(deploymentId.value);
  if (deployment) await router.push(`/deployments/${deployment.id}`);
}

function downloadLogs() {
  if (!detail.value) return;
  const text = (detail.value.deployment.logs ?? [])
    .map((log) => `${new Date(log.at * 1000).toISOString()} [${log.level.toUpperCase()}] ${log.message}`)
    .join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `deployment-${deploymentId.value}.log`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function serverName(id: number): string {
  return serverStore.servers.get(id)?.name ?? `server-${id}`;
}
function serverMeta(id: number): string {
  const server = serverStore.servers.get(id);
  return server ? `${server.zone || server.region || '—'} · ${server.private_ip || '—'}` : `ID ${id}`;
}
function statusClass(status: DeploymentStatus): string {
  return status === 'success'
    ? 'status-success'
    : ['failed', 'cancelled', 'rejected'].includes(status)
      ? 'status-failed'
      : status === 'pending_approval'
        ? 'status-warning'
        : 'status-running';
}
function targetStatusClass(status: TargetStatus): string {
  return status === 'healthy'
    ? 'status-success'
    : status === 'failed'
      ? 'status-failed'
      : ['deploying', 'health_check'].includes(status)
        ? 'status-running'
        : status === 'skipped'
          ? 'status-warning'
          : 'status-neutral';
}
function targetClass(status: TargetStatus): string {
  return status === 'healthy'
    ? 'target-success'
    : status === 'failed'
      ? 'target-failed'
      : ['deploying', 'health_check'].includes(status)
        ? 'target-running'
        : '';
}
function targetStatusLabel(status: TargetStatus): string {
  return {
    queued: '等待中',
    deploying: '运行中',
    health_check: '健康检查',
    healthy: '成功',
    failed: '失败',
    skipped: '已跳过',
    rolled_back: '已回滚',
  }[status];
}
function statusIcon(status: DeploymentStatus): IconNames {
  return status === 'success'
    ? 'check'
    : ['failed', 'cancelled', 'rejected'].includes(status)
      ? 'x'
      : status === 'pending_approval'
        ? 'shield'
        : status === 'paused'
          ? 'pause'
          : 'play';
}
function statusTitle(status: DeploymentStatus): string {
  return status === 'pending_approval'
    ? '等待生产审批'
    : status === 'running'
      ? '部署正在进行'
      : status === 'paused'
        ? '部署已暂停'
        : status === 'success'
          ? '部署已完成'
          : status === 'failed'
            ? '部署失败'
            : status;
}
function statusDescription(status: DeploymentStatus): string {
  return status === 'running'
    ? '控制器正在按策略推进目标节点'
    : status === 'pending_approval'
      ? '达到最低审批人数后自动开始'
      : status === 'failed'
        ? '检查失败节点并决定重试或回滚'
        : '状态已同步到控制面';
}
function phaseDescription(phase: string): string {
  return (
    (
      {
        waiting: '等待上一批节点完成',
        pulling: '正在拉取不可变镜像',
        starting: '正在启动服务',
        health_check: '正在执行健康检查',
        healthy: '健康检查通过',
      } as Record<string, string>
    )[phase] ?? phase
  );
}
function targetDuration(target: DeploymentTarget): string {
  if (!target.started_at) return '—';
  const end = target.finished_at || Math.floor(Date.now() / 1000);
  const seconds = Math.max(0, end - target.started_at);
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString();
}
function formatTimestamp(timestamp?: number): string {
  return timestamp ? new Date(timestamp * 1000).toLocaleString() : '—';
}
function relativeTime(timestamp?: number): string {
  if (!timestamp) return '—';
  const minutes = Math.floor((Date.now() / 1000 - timestamp) / 60);
  return minutes < 1 ? '刚刚' : minutes < 60 ? `${minutes} 分钟前` : `${Math.floor(minutes / 60)} 小时前`;
}
function logLevelClass(level: string): string {
  return level === 'danger'
    ? 'log-danger'
    : level === 'warning'
      ? 'log-warning'
      : level === 'success'
        ? 'log-success'
        : 'log-info';
}

watch(deploymentId, () => {
  detail.value = null;
  void reload();
});

onMounted(async () => {
  await Promise.all([reload(), appStore.loadAll(), serverStore.loadAll(), store.loadDeployments()]);
  if (disposed) return;
  pollTimer = setInterval(() => {
    if (isRunning.value || detail.value?.deployment.status === 'pending_approval') void reload();
  }, 3000);
});
onBeforeUnmount(() => {
  disposed = true;
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
@reference '~/tailwind.css';

.ops-page {
  width: min(100%, 1440px);
  @apply mx-auto px-5 pb-10 md:px-7;
}
.page-stack,
.main-stack,
.aside-stack {
  @apply grid content-start gap-4;
}
.deployment-title {
  @apply flex flex-wrap items-center gap-2;
}
.deployment-meta {
  @apply text-wp-text-alt-100 flex flex-wrap gap-x-5 gap-y-2 text-xs;
}
.deployment-meta span + span::before {
  content: '·';
  @apply mr-5;
}
.hero-grid {
  @apply grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px];
}
.deployment-hero {
  @apply relative grid min-h-48 grid-cols-[1fr_auto_1fr] items-center gap-5 overflow-hidden p-5 pb-12;
}
.release-node {
  @apply flex items-center justify-center gap-4 text-center sm:text-left;
}
.release-node strong,
.release-node small {
  @apply block;
}
.release-node strong {
  @apply text-wp-text-200 text-lg;
}
.release-node small {
  @apply text-wp-text-alt-100 mt-1 max-w-52 truncate font-mono text-[10px];
}
.hero-icon {
  @apply bg-wp-primary-100/12 text-wp-primary-100 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl;
}
.hero-arrow {
  @apply text-wp-primary-100 h-7! w-7!;
}
.hero-progress {
  @apply absolute right-5 bottom-4 left-5;
}
.progress-copy {
  @apply text-wp-text-alt-100 mb-2 flex items-center justify-between text-[10px];
}
.progress-track {
  @apply bg-wp-background-100 block h-1.5 overflow-hidden rounded-full;
}
.progress-track i {
  @apply bg-wp-state-info-100 block h-full rounded-full transition-[width] duration-500;
}
.control-state {
  @apply flex items-center gap-4 p-5;
}
.control-indicator {
  @apply flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border;
}
.control-state small,
.control-state strong,
.control-state p {
  @apply block;
}
.control-state small {
  @apply text-wp-text-alt-100 text-[10px];
}
.control-state strong {
  @apply text-wp-text-200 mt-1;
}
.control-state p {
  @apply text-wp-text-alt-100 mt-1 text-[10px];
}
.content-grid {
  @apply grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px];
}
.elapsed {
  @apply text-wp-text-alt-100;
}
.target-columns {
  @apply border-wp-border-100 text-wp-text-alt-100 hidden grid-cols-[minmax(180px,1fr)_minmax(180px,2fr)_100px] gap-4 border-b px-5 py-2 text-[9px] font-bold tracking-wide uppercase md:grid;
}
.target-columns span:last-child {
  @apply text-right;
}
.target-list {
  @apply grid gap-2 p-4;
}
.target-card {
  @apply border-wp-border-100 bg-wp-background-200 grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border p-3;
}
.target-card.target-success {
  @apply border-wp-state-ok-100/35;
}
.target-card.target-running {
  @apply border-wp-state-info-100/50 bg-wp-state-info-100/5;
}
.target-card.target-failed {
  @apply border-wp-error-100/45 bg-wp-error-100/5;
}
.target-index {
  @apply border-wp-border-200 text-wp-text-100 flex h-8 w-8 items-center justify-center rounded-full border text-xs;
}
.target-success .target-index {
  @apply border-wp-state-ok-100 bg-wp-state-ok-100 text-white;
}
.target-running .target-index {
  @apply border-wp-state-info-100 bg-wp-state-info-100 text-white;
}
.target-failed .target-index {
  @apply border-wp-error-100 bg-wp-error-100 text-white;
}
.target-copy > :deep(a) {
  @apply text-wp-text-200 text-sm font-bold;
}
.target-copy > small {
  @apply text-wp-text-alt-100 ml-2 text-[9px];
}
.target-copy p {
  @apply mt-1 flex flex-wrap gap-2 text-[9px];
}
.target-copy p strong {
  @apply text-wp-text-100;
}
.target-copy p span {
  @apply text-wp-text-alt-100;
}
.target-state {
  @apply flex flex-col items-end gap-1.5;
}
.target-state small {
  @apply text-wp-text-alt-100 text-[9px];
}
.status-badge {
  @apply inline-flex min-h-6 items-center rounded-md border px-2 text-[10px] font-bold;
}
.status-success {
  @apply border-wp-state-ok-100/30 bg-wp-state-ok-100/10 text-wp-state-ok-100;
}
.status-running {
  @apply border-wp-state-info-100/30 bg-wp-state-info-100/10 text-wp-state-info-100;
}
.status-warning {
  @apply border-wp-state-warn-100/30 bg-wp-state-warn-100/10 text-wp-state-warn-100;
}
.status-failed {
  @apply border-wp-error-100/30 bg-wp-error-100/10 text-wp-error-100;
}
.status-neutral {
  @apply border-wp-border-200 bg-wp-background-100 text-wp-text-alt-100;
}
.log-card {
  @apply overflow-hidden;
}
.log-console {
  @apply max-h-96 overflow-auto bg-[#050b10] py-3 font-mono text-[10px] leading-6;
}
.log-row {
  @apply grid grid-cols-[38px_76px_minmax(0,1fr)] gap-2 px-4;
}
.log-line,
.log-row time {
  @apply text-[#506674];
}
.log-success {
  @apply text-[#42d884];
}
.log-warning {
  @apply text-[#ffc15c];
}
.log-danger {
  @apply text-[#ff7478];
}
.log-info {
  @apply text-[#b2c2ca];
}
.log-empty {
  @apply px-4 text-[#708492];
}
.detail-list > div {
  @apply border-wp-border-100 flex items-center justify-between gap-4 border-b px-4 py-3 text-[11px] last:border-0;
}
.detail-list span {
  @apply text-wp-text-alt-100 shrink-0;
}
.detail-list strong,
.detail-list :deep(a) {
  @apply text-wp-text-200 text-right;
}
.detail-list code {
  @apply text-wp-text-100 max-w-44 truncate text-right;
}
.recovery-card {
  @apply border-wp-error-100/30;
}
.recovery-copy {
  @apply grid gap-3 text-xs;
}
.recovery-copy > :deep(svg) {
  @apply text-wp-state-warn-100;
}
.approval-list > div {
  @apply border-wp-border-100 grid grid-cols-[auto_100px_minmax(0,1fr)_auto] items-center gap-3 border-b p-4 text-xs last:border-0;
}
.approval-list > div > span:not(.status-badge),
.approval-list time {
  @apply text-wp-text-alt-100;
}
.loading-state {
  @apply flex justify-center py-24;
}
@media (max-width: 640px) {
  .deployment-hero {
    @apply grid-cols-1 pb-16;
  }
  .hero-arrow {
    @apply rotate-90 justify-self-center;
  }
  .target-card {
    @apply grid-cols-[32px_minmax(0,1fr)];
  }
  .target-state {
    @apply col-start-2 items-start;
  }
  .approval-list > div {
    @apply grid-cols-1;
  }
}
</style>
