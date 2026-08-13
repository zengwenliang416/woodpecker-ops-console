<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold full-width-header fluid-content>
    <template #title
      ><span class="page-title">{{ $t('overview.title') }}</span></template
    >
    <template #headerActions>
      <select
        v-model="scopeFilter"
        class="select scope-select"
        :aria-label="$t('overview.environment_scope')"
        :disabled="scopeLoading"
      >
        <option value="all">{{ $t('overview.all_environments') }}</option>
        <option value="production">{{ $t('overview.production') }}</option>
        <option value="staging">{{ $t('overview.staging') }}</option>
      </select>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :disabled="refreshing"
        :text="$t('refresh')"
        @click="loadDashboard(true)"
      />
      <Button start-icon="settings" :text="$t('overview.configure')" @click="saveDashboardLayout" />
    </template>

    <div class="overview-page">
      <p class="page-description">{{ $t('overview.description') }}</p>

      <FeedbackState
        v-if="initialLoading"
        kind="loading"
        :title="$t('overview.loading_title')"
        :description="$t('overview.loading_description')"
      />
      <FeedbackState
        v-else-if="loadError"
        kind="error"
        :title="$t('overview.error_title')"
        :description="$t('overview.error_description')"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('overview.retry')" @click="loadDashboard()" />
        </template>
      </FeedbackState>
      <FeedbackState
        v-else-if="partialError"
        compact
        kind="error"
        :title="$t('overview.partial_error_title')"
        :description="$t('overview.partial_error_description')"
      />

      <div v-if="hasConfirmedCoreData" class="metric-grid">
        <OpsMetricCard
          :label="$t('overview.active_pipelines')"
          :value="String(activePipelineCount)"
          :hint="
            activePipelineCount > 0
              ? $t('overview.running_waiting', { running: runningPipelineCount, pending: pendingPipelineCount })
              : $t('overview.no_running_tasks')
          "
          icon="activity"
          :chart-values="activeTrend"
          :chart-max="Math.max(...activeTrend, 1)"
          :tone="activePipelineCount > 0 ? 'success' : 'neutral'"
        />
        <OpsMetricCard
          :label="$t('overview.success_rate')"
          :value="successRateLabel"
          :hint="$t('overview.recent_success', { success: successfulPipelineCount, total: terminalPipelineCount || 0 })"
          icon="shield"
          :chart-values="successTrend"
          :tone="
            terminalPipelineCount === 0
              ? 'neutral'
              : successRate >= 90
                ? 'success'
                : successRate >= 75
                  ? 'warning'
                  : 'danger'
          "
        />
        <OpsMetricCard
          :label="$t('overview.average_duration')"
          :value="averageDurationLabel"
          :hint="
            durationSamples.length > 0
              ? $t('overview.completed_records', { count: durationSamples.length })
              : $t('overview.no_completed_records')
          "
          icon="duration"
          :chart-values="durationTrend"
          :chart-max="Math.max(...durationTrend, 1)"
          tone="success"
        />
        <OpsMetricCard
          v-if="isAdmin"
          :label="$t('overview.queue_health')"
          :value="queueHealthLabel"
          :hint="
            queue
              ? $t('overview.queue_hint', { pending: queuePendingCount, blocked: queueBlockedCount })
              : $t('overview.queue_unavailable')
          "
          icon="list"
          :chart-values="queueTrend"
          :tone="
            queueHealth === null ? 'neutral' : queueHealth >= 90 ? 'success' : queueHealth >= 70 ? 'warning' : 'danger'
          "
        />
        <OpsMetricCard
          v-else
          :label="$t('overview.repository_count')"
          :value="hasConfirmedRepos ? String(repos.length) : '—'"
          :hint="hasConfirmedRepos ? $t('overview.repository_count_hint') : $t('overview.repository_count_unavailable')"
          icon="repo"
          :chart-values="hasConfirmedRepos ? [repos.length] : []"
          tone="neutral"
        />
      </div>

      <div v-if="hasConfirmedCoreData" class="dashboard-grid">
        <main class="dashboard-main">
          <section class="wp-card activity-card">
            <div class="wp-card-header">
              <div>
                <h2>{{ $t('overview.recent_activity') }}</h2>
                <p>{{ $t('overview.recent_activity_desc') }}</p>
              </div>
              <router-link class="section-action" to="/repos">{{ $t('overview.view_all') }}</router-link>
            </div>
            <div class="activity-list">
              <router-link
                v-for="pipeline in visibleActivity"
                :key="`${pipeline.repo_id}-${pipeline.number}`"
                class="activity-row"
                :to="{ name: 'repo-pipeline', params: { repoId: pipeline.repo_id, pipelineId: pipeline.number } }"
              >
                <span class="status-dot" :class="statusDotClass(pipeline.status)" />
                <span class="activity-copy">
                  <strong
                    >#{{ pipeline.number }} ·
                    {{ pipeline.message || pipeline.title || $t('overview.unnamed_pipeline') }}</strong
                  >
                  <small
                    >{{ repoShortName(pipeline.repo_id) }} · {{ pipeline.branch || pipeline.ref || '—' }} ·
                    {{ pipeline.author || pipeline.sender || $t('overview.system') }}</small
                  >
                </span>
                <span class="activity-time">{{ relativeTime(pipeline.finished || pipeline.created) }}</span>
                <span class="status-badge" :class="statusBadgeClass(pipeline.status)"
                  ><Icon :name="statusIcon(pipeline.status)" />{{ pipelineStatusLabel(pipeline.status) }}</span
                >
              </router-link>
              <div v-if="visibleActivity.length === 0" class="wp-empty-state">
                <strong>{{ $t('overview.no_activity') }}</strong>
                <p>{{ $t('overview.no_activity_hint') }}</p>
              </div>
            </div>
          </section>

          <section class="wp-card health-card">
            <div class="wp-card-header">
              <div>
                <h2>{{ $t('overview.repository_health') }}</h2>
                <p>{{ $t('overview.repository_health_desc') }}</p>
              </div>
              <Icon name="info" class="header-muted-icon" />
            </div>
            <div class="repo-health-list">
              <div v-for="item in repositoryHealth" :key="item.repo.id" class="repo-health-row">
                <router-link :to="{ name: 'repo', params: { repoId: item.repo.id } }">{{ item.repo.name }}</router-link>
                <strong>{{ item.score.toFixed(1) }}%</strong>
                <span class="health-track"
                  ><i :class="healthTone(item.score)" :style="{ width: `${item.score}%` }"
                /></span>
              </div>
              <div v-if="!hasConfirmedRepos" class="wp-empty-state">
                <strong>{{ $t('overview.repository_health_unavailable') }}</strong>
                <p>{{ $t('overview.partial_error_description') }}</p>
              </div>
              <div v-else-if="repositoryHealth.length === 0" class="wp-empty-state">
                <strong>{{ $t('overview.no_repositories') }}</strong>
                <p>{{ $t('overview.no_repositories_hint') }}</p>
              </div>
            </div>
            <div class="card-footer">
              <router-link to="/repos"
                >{{ $t('overview.view_all_repositories') }} <Icon name="chevron-right"
              /></router-link>
            </div>
          </section>
        </main>

        <aside class="dashboard-sidebar">
          <section v-if="isAdmin" class="wp-card agent-card">
            <div class="wp-card-header">
              <h2>{{ $t('overview.agent_capacity') }}</h2>
              <router-link class="section-action" to="/admin/agents">{{ $t('overview.manage') }}</router-link>
            </div>
            <div class="agent-body">
              <div class="capacity-donut" :style="capacityDonutStyle">
                <div>
                  <strong>{{ hasConfirmedAgents ? totalAgentCapacity : '—' }}</strong
                  ><small>{{ $t('overview.capacity') }}</small>
                </div>
              </div>
              <div class="agent-stats">
                <div>
                  <span>{{ $t('overview.online') }}</span
                  ><strong>{{ hasConfirmedAgents ? onlineAgentCount : '—' }}</strong>
                </div>
                <div>
                  <span>{{ $t('overview.busy') }}</span
                  ><strong>{{ hasConfirmedAgents ? busyAgentCount : '—' }}</strong>
                </div>
                <div>
                  <span>{{ $t('overview.disabled') }}</span
                  ><strong class="danger-text">{{ hasConfirmedAgents ? disabledAgentCount : '—' }}</strong>
                </div>
              </div>
            </div>
            <p v-if="!hasConfirmedAgents" class="agent-unavailable">
              {{ $t('overview.agent_capacity_unavailable') }}
            </p>
          </section>

          <section class="wp-card failures-card">
            <div class="wp-card-header">
              <h2>{{ $t('overview.recent_failures') }}</h2>
              <router-link v-if="recentFailures[0]" class="section-action" :to="failureLink(recentFailures[0])">{{
                $t('overview.view_analysis')
              }}</router-link>
            </div>
            <div class="failure-list">
              <router-link
                v-for="pipeline in recentFailures"
                :key="`${pipeline.repo_id}-${pipeline.number}`"
                class="failure-row"
                :to="failureLink(pipeline)"
              >
                <span class="status-dot dot-danger" />
                <span
                  ><strong>#{{ pipeline.number }} {{ pipeline.message || pipeline.title }}</strong
                  ><small
                    >{{ pipeline.branch || '—' }} ·
                    {{ pipeline.author || pipeline.sender || $t('overview.system') }}</small
                  ></span
                >
                <time>{{ relativeTime(pipeline.finished || pipeline.created) }}</time>
              </router-link>
              <div v-if="recentFailures.length === 0" class="healthy-empty">
                <Icon name="shield" /><strong>{{ $t('overview.no_failures') }}</strong
                ><small>{{ $t('overview.all_healthy') }}</small>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Icon from '~/components/ops/PrototypeIcon.vue';
import type { IconNames } from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import OpsMetricCard from '~/components/ops/OpsMetricCard.vue';
import useApiClient from '~/compositions/useApiClient';
import useAuthentication from '~/compositions/useAuthentication';
import useNotifications from '~/compositions/useNotifications';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Agent, Pipeline, PipelineFeed, PipelineStatus, QueueInfo, Repo } from '~/lib/api/types';
import { calculatePipelineStats, pipelineDurationSeconds } from '~/lib/repoMetrics';
import { useRepoStore } from '~/store/repos';

type DashboardPipeline = Pipeline & { repo_id: number };

const apiClient = useApiClient();
const { user } = useAuthentication();
const isAdmin = Boolean(user?.admin);
const repoStore = useRepoStore();
const notifications = useNotifications();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.sidebar.overview')]));

const feed = ref<PipelineFeed[]>([]);
const environmentPipelines = ref<DashboardPipeline[]>([]);
const agents = ref<Agent[]>([]);
const queue = ref<QueueInfo | null>(null);
const scopeFilter = ref('all');
const refreshing = ref(false);
const scopeLoading = ref(false);
const hasConfirmedCoreData = ref(false);
const hasConfirmedRepos = ref(false);
const hasConfirmedAgents = ref(false);
const loadError = ref(false);
const partialError = ref(false);
let environmentLoadGeneration = 0;
let dashboardLoadGeneration = 0;
let mounted = true;

const repos = computed(() => repoStore.ownedRepos);
const initialLoading = computed(() => refreshing.value && !hasConfirmedCoreData.value);
const fallbackPipelines = computed<DashboardPipeline[]>(() =>
  repos.value
    .filter((repo): repo is Repo & { last_pipeline: Pipeline } => !!repo.last_pipeline)
    .map((repo) => ({ ...repo.last_pipeline, repo_id: repo.id })),
);
const pipelineSamples = computed(() => (feed.value.length > 0 ? feed.value : fallbackPipelines.value));
const scopedPipelineSamples = computed(() =>
  scopeFilter.value === 'all'
    ? pipelineSamples.value
    : environmentPipelines.value.filter((pipeline) => pipeline.deploy_to?.toLowerCase() === scopeFilter.value),
);
const visibleActivity = computed(() => scopedPipelineSamples.value.slice(0, 6));
const runningPipelineCount = computed(
  () => scopedPipelineSamples.value.filter((item) => ['running', 'started'].includes(item.status)).length,
);
const pendingPipelineCount = computed(
  () => scopedPipelineSamples.value.filter((item) => ['pending', 'blocked'].includes(item.status)).length,
);
const activePipelineCount = computed(() => runningPipelineCount.value + pendingPipelineCount.value);
const pipelineStats = computed(() => calculatePipelineStats(scopedPipelineSamples.value));
const terminalPipelineCount = computed(() => pipelineStats.value.terminalCount);
const successfulPipelineCount = computed(() => pipelineStats.value.successfulCount);
const successRate = computed(() => pipelineStats.value.successRate ?? 0);
const successRateLabel = computed(() =>
  pipelineStats.value.successRate === null ? '—' : `${pipelineStats.value.successRate.toFixed(1)}%`,
);
const durationSamples = computed(() => pipelineStats.value.durations);
const averageDurationSeconds = computed(() => pipelineStats.value.averageDurationSeconds);
const averageDurationLabel = computed(() => formatDuration(averageDurationSeconds.value));
const queuePendingCount = computed(() => queue.value?.stats?.pending_count ?? 0);
const queueBlockedCount = computed(() => queue.value?.stats?.waiting_on_deps_count ?? 0);
const queueRunningCount = computed(() => queue.value?.stats?.running_count ?? 0);
const queueHealth = computed<number | null>(() =>
  queue.value ? Math.max(0, Math.min(100, 100 - queuePendingCount.value * 4 - queueBlockedCount.value * 10)) : null,
);
const queueHealthLabel = computed(() => (queueHealth.value === null ? '—' : `${queueHealth.value}%`));

const chronologicalSamples = computed(() => [...scopedPipelineSamples.value].reverse());
const activeTrend = computed(() => {
  const samples = chronologicalSamples.value.slice(-8);
  return samples.length > 0
    ? samples.map((item) => (['running', 'started', 'pending', 'blocked'].includes(item.status) ? 1 : 0))
    : [0];
});
const successTrend = computed(() => rollingSuccessRates(chronologicalSamples.value).slice(-8));
const durationTrend = computed(() =>
  chronologicalSamples.value
    .map(pipelineDurationSeconds)
    .filter((seconds): seconds is number => seconds !== null)
    .map((seconds) => seconds / 60)
    .slice(-8),
);
const queueTrend = computed(() => (queueHealth.value === null ? [] : [queueHealth.value]));

const repositoryHealth = computed(() => {
  const samplesByRepo = new Map<number, PipelineFeed[]>();
  scopedPipelineSamples.value.forEach((pipeline) => {
    const samples = samplesByRepo.get(pipeline.repo_id) ?? [];
    samples.push(pipeline);
    samplesByRepo.set(pipeline.repo_id, samples);
  });
  const result: { repo: Repo; score: number }[] = [];
  samplesByRepo.forEach((samples, repoId) => {
    const repo = repoStore.repos.get(repoId);
    const score = calculatePipelineStats(samples).successRate;
    if (repo && score !== null) result.push({ repo, score });
  });
  return result.sort((left, right) => right.score - left.score).slice(0, 7);
});
const recentFailures = computed(() =>
  scopedPipelineSamples.value
    .filter((pipeline) => ['failure', 'error', 'killed', 'canceled'].includes(pipeline.status))
    .slice(0, 4),
);

const totalAgentCapacity = computed(() => agents.value.reduce((sum, agent) => sum + Math.max(agent.capacity, 1), 0));
const onlineAgentCount = computed(() => agents.value.filter((agent) => !agent.no_schedule).length);
const disabledAgentCount = computed(() => agents.value.filter((agent) => agent.no_schedule).length);
const busyAgentCount = computed(() => Math.min(queueRunningCount.value, onlineAgentCount.value));
const availableCapacityPercent = computed(() => {
  if (agents.value.length === 0) return 0;
  return (onlineAgentCount.value / agents.value.length) * 100;
});
const capacityDonutStyle = computed(() => ({
  background: `conic-gradient(var(--wp-state-ok-100) 0deg ${availableCapacityPercent.value * 3.6}deg, var(--wp-background-100) ${availableCapacityPercent.value * 3.6}deg 360deg)`,
}));

function rollingSuccessRates(samples: PipelineFeed[]): number[] {
  let successful = 0;
  let terminal = 0;
  const rates: number[] = [];
  samples.forEach((pipeline) => {
    if (pipeline.status === 'success') {
      successful += 1;
      terminal += 1;
    } else if (['failure', 'error', 'killed', 'canceled', 'declined'].includes(pipeline.status)) {
      terminal += 1;
    } else {
      return;
    }
    rates.push((successful / terminal) * 100);
  });
  return rates.length > 0 ? rates : [0];
}

function repoShortName(repoId: number): string {
  return repoStore.repos.get(repoId)?.name ?? `repo-${repoId}`;
}

function healthTone(score: number): string {
  return score < 88 ? 'health-danger' : score < 93 ? 'health-warning' : 'health-success';
}

function statusDotClass(status: PipelineStatus): string {
  if (status === 'success') return 'dot-success';
  if (['failure', 'error', 'killed', 'canceled'].includes(status)) return 'dot-danger';
  if (['running', 'started'].includes(status)) return 'dot-info';
  return 'dot-warning';
}

function statusBadgeClass(status: PipelineStatus): string {
  if (status === 'success') return 'badge-success';
  if (['failure', 'error', 'killed', 'canceled'].includes(status)) return 'badge-danger';
  if (['running', 'started'].includes(status)) return 'badge-info';
  return 'badge-warning';
}

function statusIcon(status: PipelineStatus): IconNames {
  if (status === 'success') return 'check';
  if (['failure', 'error', 'killed', 'canceled'].includes(status)) return 'x';
  if (['running', 'started'].includes(status)) return 'play';
  return 'warning';
}

function pipelineStatusLabel(status: PipelineStatus): string {
  return {
    blocked: t('overview.status.blocked'),
    declined: t('overview.status.declined'),
    error: t('overview.status.error'),
    failure: t('overview.status.failure'),
    killed: t('overview.status.killed'),
    pending: t('overview.status.pending'),
    running: t('overview.status.running'),
    skipped: t('overview.status.skipped'),
    started: t('overview.status.started'),
    success: t('overview.status.success'),
    canceled: t('overview.status.canceled'),
  }[status];
}

function failureLink(pipeline: PipelineFeed) {
  return { name: 'repo-pipeline-errors', params: { repoId: pipeline.repo_id, pipelineId: pipeline.number } };
}

function relativeTime(timestamp?: number): string {
  if (!timestamp) return '—';
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
  if (seconds < 60) return t('overview.time.seconds_ago', { count: seconds });
  if (seconds < 3600) return t('overview.time.minutes_ago', { count: Math.floor(seconds / 60) });
  if (seconds < 86400) return t('overview.time.hours_ago', { count: Math.floor(seconds / 3600) });
  return t('overview.time.days_ago', { count: Math.floor(seconds / 86400) });
}

function formatDuration(seconds: number): string {
  if (!seconds) return '—';
  if (seconds < 60) return t('overview.duration.seconds', { seconds: Math.round(seconds) });
  return t('overview.duration.minutes_seconds', {
    minutes: Math.floor(seconds / 60),
    seconds: Math.round(seconds % 60),
  });
}

async function loadEnvironmentPipelines() {
  const generation = ++environmentLoadGeneration;
  scopeLoading.value = true;
  try {
    if (feed.value.length === 0) {
      if (generation === environmentLoadGeneration) environmentPipelines.value = fallbackPipelines.value;
      return;
    }
    const pipelines = await Promise.all(
      feed.value.map(async (item) => {
        try {
          const pipeline = await apiClient.getPipeline(item.repo_id, item.number);
          return { ...pipeline, repo_id: item.repo_id } satisfies DashboardPipeline;
        } catch {
          return null;
        }
      }),
    );
    if (generation === environmentLoadGeneration) {
      environmentPipelines.value = pipelines.filter((pipeline): pipeline is DashboardPipeline => pipeline !== null);
    }
  } finally {
    if (generation === environmentLoadGeneration) scopeLoading.value = false;
  }
}

async function loadDashboard(showNotification = false) {
  const generation = ++dashboardLoadGeneration;
  refreshing.value = true;
  loadError.value = false;
  partialError.value = false;
  environmentLoadGeneration += 1;
  scopeLoading.value = false;
  try {
    const [coreResults, adminResults] = await Promise.all([
      Promise.allSettled([repoStore.loadRepos(), apiClient.getPipelineFeed()]),
      isAdmin
        ? Promise.allSettled([apiClient.getAgents({ page: 1, perPage: 50 }), apiClient.getQueueInfo()])
        : Promise.resolve(null),
    ]);
    if (!mounted || generation !== dashboardLoadGeneration) return;

    const [repoResult, feedResult] = coreResults;
    const coreSucceeded = repoResult.status === 'fulfilled' || feedResult.status === 'fulfilled';
    const coreFailed = repoResult.status === 'rejected' || feedResult.status === 'rejected';
    if (repoResult.status === 'fulfilled') hasConfirmedRepos.value = true;
    if (feedResult.status === 'fulfilled') feed.value = feedResult.value ?? [];
    environmentPipelines.value = [];
    if (adminResults) {
      const [agentResult, queueResult] = adminResults;
      if (agentResult.status === 'fulfilled') {
        agents.value = agentResult.value ?? [];
        hasConfirmedAgents.value = true;
      }
      if (queueResult.status === 'fulfilled' && !Array.isArray(queueResult.value)) queue.value = queueResult.value;
      if (agentResult.status === 'rejected' || queueResult.status === 'rejected') partialError.value = true;
    } else {
      agents.value = [];
      queue.value = null;
    }

    if (coreSucceeded) hasConfirmedCoreData.value = true;
    if (coreFailed) {
      if (hasConfirmedCoreData.value) partialError.value = true;
      else loadError.value = true;
    }
    if (scopeFilter.value !== 'all') await loadEnvironmentPipelines();
    if (!mounted || generation !== dashboardLoadGeneration) return;
    if (showNotification && !loadError.value && !partialError.value) {
      notifications.notify({ type: 'success', title: t('overview.refresh_success') });
    }
  } finally {
    if (mounted && generation === dashboardLoadGeneration) refreshing.value = false;
  }
}

function saveDashboardLayout() {
  notifications.notify({ type: 'success', title: t('overview.layout_saved') });
}

watch(scopeFilter, (scope) => {
  if (scope === 'all') {
    environmentLoadGeneration += 1;
    scopeLoading.value = false;
  } else if (environmentPipelines.value.length === 0) {
    void loadEnvironmentPipelines();
  }
});
onMounted(() => loadDashboard());
onBeforeUnmount(() => {
  mounted = false;
  dashboardLoadGeneration += 1;
  environmentLoadGeneration += 1;
});
</script>

<style scoped>
@reference '~/tailwind.css';

.page-title {
  @apply text-wp-text-200 text-[28px] font-bold tracking-tight;
}
.overview-page {
  width: min(100%, 1440px);
  @apply mx-auto px-5 pb-10 md:px-7;
}
.page-description {
  @apply text-wp-text-alt-100 mb-5 text-sm;
}
.scope-select {
  @apply min-w-44;
}
.metric-grid {
  @apply grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4;
}
.dashboard-grid {
  @apply mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_330px];
}
.dashboard-main {
  @apply grid gap-4 lg:grid-cols-2;
}
.dashboard-sidebar {
  @apply grid content-start gap-4;
}
.agent-unavailable {
  @apply text-wp-text-alt-100 px-4 pb-4 text-[10px];
}
.wp-card-header > div h2,
.wp-card-header > div p {
  @apply block;
}
.wp-card-header h2 {
  @apply text-wp-text-200 text-sm font-bold;
}
.wp-card-header p {
  @apply text-wp-text-alt-100 mt-1 text-[10px];
}
.section-action {
  @apply text-wp-link-100 hover:text-wp-link-200 shrink-0 text-[10px] font-semibold;
}
.header-muted-icon {
  @apply text-wp-text-alt-100;
}
.activity-card,
.health-card {
  @apply overflow-hidden;
}
.activity-list {
  @apply divide-wp-border-100 divide-y px-4 py-1;
}
.activity-row {
  @apply grid grid-cols-[10px_minmax(0,1fr)_72px_auto] items-center gap-3 py-3 transition-colors;
}
.activity-row:hover {
  @apply bg-wp-background-200/60 -mx-2 px-2;
}
.status-dot {
  @apply block h-2.5 w-2.5 rounded-full ring-4;
}
.dot-success {
  @apply bg-wp-state-ok-100 ring-wp-state-ok-100/10;
}
.dot-danger {
  @apply bg-wp-error-100 ring-wp-error-100/10;
}
.dot-info {
  @apply bg-wp-state-info-100 ring-wp-state-info-100/10;
}
.dot-warning {
  @apply bg-wp-state-warn-100 ring-wp-state-warn-100/10;
}
.activity-copy {
  @apply min-w-0;
}
.activity-copy strong,
.activity-copy small {
  @apply block;
}
.activity-copy strong {
  @apply text-wp-text-200 truncate text-xs font-bold;
}
.activity-copy small {
  @apply text-wp-text-alt-100 mt-1 truncate text-[9px];
}
.activity-time {
  @apply text-wp-text-alt-100 text-right text-[10px];
}
.status-badge {
  @apply inline-flex min-h-6 items-center gap-1 rounded-md border px-2 text-[9px] font-bold;
}
.badge-success {
  @apply border-wp-state-ok-100/30 bg-wp-state-ok-100/10 text-wp-state-ok-100;
}
.badge-danger {
  @apply border-wp-error-100/30 bg-wp-error-100/10 text-wp-error-100;
}
.badge-info {
  @apply border-wp-state-info-100/30 bg-wp-state-info-100/10 text-wp-state-info-100;
}
.badge-warning {
  @apply border-wp-state-warn-100/30 bg-wp-state-warn-100/10 text-wp-state-warn-100;
}
.repo-health-list {
  @apply grid gap-0 px-4 py-2;
}
.repo-health-row {
  @apply border-wp-border-100 grid grid-cols-[minmax(0,1fr)_50px_88px] items-center gap-3 border-b py-3 last:border-0;
}
.repo-health-row :deep(a) {
  @apply text-wp-text-200 truncate text-xs font-bold;
}
.repo-health-row strong {
  @apply text-wp-text-100 text-right text-[10px];
}
.health-track {
  @apply bg-wp-background-100 h-1.5 overflow-hidden rounded-full;
}
.health-track i {
  @apply block h-full rounded-full;
}
.health-success {
  @apply bg-wp-state-ok-100;
}
.health-warning {
  @apply bg-wp-state-warn-100;
}
.health-danger {
  @apply bg-wp-error-100;
}
.card-footer {
  @apply border-wp-border-100 border-t px-4 py-3;
}
.card-footer :deep(a) {
  @apply text-wp-text-100 hover:text-wp-primary-100 inline-flex items-center gap-1 text-[10px] font-semibold;
}
.agent-body {
  @apply flex items-center justify-between gap-5 p-5;
}
.capacity-donut {
  @apply flex h-28 w-28 shrink-0 items-center justify-center rounded-full;
}
.capacity-donut::before {
  content: '';
  @apply bg-wp-background-300 absolute h-20 w-20 rounded-full;
}
.capacity-donut {
  @apply relative;
}
.capacity-donut > div {
  @apply relative z-10 text-center;
}
.capacity-donut strong,
.capacity-donut small {
  @apply block;
}
.capacity-donut strong {
  @apply text-wp-text-200 text-xl;
}
.capacity-donut small {
  @apply text-wp-text-alt-100 mt-1 text-[9px];
}
.agent-stats {
  @apply min-w-32 flex-1;
}
.agent-stats > div {
  @apply border-wp-border-100 flex items-center justify-between border-b py-2 text-[10px] last:border-0;
}
.agent-stats span {
  @apply text-wp-text-alt-100;
}
.agent-stats strong {
  @apply text-wp-text-200;
}
.danger-text {
  @apply text-wp-error-100!;
}
.failure-list {
  @apply divide-wp-border-100 divide-y px-4 py-1;
}
.failure-row {
  @apply grid grid-cols-[10px_minmax(0,1fr)_62px] items-center gap-3 py-3;
}
.failure-row > span:nth-child(2) {
  @apply min-w-0;
}
.failure-row strong,
.failure-row small {
  @apply block;
}
.failure-row strong {
  @apply text-wp-text-200 line-clamp-2 text-[10px] leading-4 font-bold;
}
.failure-row small {
  @apply text-wp-text-alt-100 mt-1 truncate text-[9px];
}
.failure-row time {
  @apply text-wp-text-alt-100 text-right text-[9px];
}
.healthy-empty {
  @apply text-wp-state-ok-100 flex flex-col items-center gap-2 py-8 text-center;
}
.healthy-empty strong {
  @apply text-wp-text-200 text-xs;
}
.healthy-empty small {
  @apply text-wp-text-alt-100 text-[9px];
}
@media (max-width: 720px) {
  .activity-row {
    @apply grid-cols-[10px_minmax(0,1fr)_auto];
  }
  .activity-time {
    @apply hidden;
  }
}
</style>
