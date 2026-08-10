<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <div class="repo-pipelines-page">
    <section v-if="!initialLoading" class="pipeline-metrics">
      <OpsMetricCard
        data-testid="pipeline-metric-latest"
        :label="$t('repo.pipeline_list.metrics.latest_result')"
        :value="latestStatus"
        :hint="latestHint"
        icon="activity"
        :chart-values="statusChart"
        :tone="latestTone"
      />
      <OpsMetricCard
        data-testid="pipeline-metric-success"
        :label="$t('repo.pipeline_list.metrics.success_rate')"
        :value="successRate"
        :hint="
          $t('repo.pipeline_list.metrics.success_hint', {
            success: pipelineStats.successfulCount,
            total: pipelineStats.terminalCount,
          })
        "
        icon="shield"
        :chart-values="statusChart"
        tone="success"
      />
      <OpsMetricCard
        data-testid="pipeline-metric-duration"
        :label="$t('repo.pipeline_list.metrics.average_duration')"
        :value="averageDuration"
        :hint="$t('repo.pipeline_list.metrics.duration_hint', { count: pipelineStats.durations.length })"
        icon="duration"
        :chart-values="durationChart"
        :chart-max="durationChartMax"
        tone="info"
      />
    </section>

    <section class="wp-card pipeline-table-card">
      <div class="pipeline-filters">
        <label class="pipeline-search">
          <PrototypeIcon name="search" />
          <input
            v-model="search"
            data-testid="pipeline-search"
            class="input"
            :aria-label="$t('repo.pipeline_list.filters.search_label')"
            :placeholder="$t('repo.pipeline_list.filters.search_placeholder')"
          />
        </label>

        <select
          v-model="statusFilter"
          data-testid="pipeline-status-filter"
          class="select"
          :aria-label="$t('repo.pipeline_list.filters.status_label')"
        >
          <option value="all">{{ $t('repo.pipeline_list.filters.all_statuses') }}</option>
          <option value="success">{{ $t('repo.pipeline.status.success') }}</option>
          <option value="failure">{{ $t('repo.pipeline.status.failure') }}</option>
          <option value="running">{{ $t('repo.pipeline.status.running') }}</option>
          <option value="pending">{{ $t('repo.pipeline.status.pending') }}</option>
          <option value="skipped">{{ $t('repo.pipeline.status.skipped') }}</option>
        </select>

        <select
          v-model="branchFilter"
          data-testid="pipeline-branch-filter"
          class="select"
          :aria-label="$t('repo.pipeline_list.filters.branch_label')"
        >
          <option value="all">{{ $t('repo.pipeline_list.filters.all_branches') }}</option>
          <option v-for="branch in branches" :key="branch" :value="branch">{{ branch }}</option>
        </select>

        <select
          v-model="eventFilter"
          data-testid="pipeline-event-filter"
          class="select"
          :aria-label="$t('repo.pipeline_list.filters.event_label')"
        >
          <option value="all">{{ $t('repo.pipeline_list.filters.all_events') }}</option>
          <option v-for="event in events" :key="event" :value="event">{{ eventLabel(event) }}</option>
        </select>

        <Button
          v-if="hasFilters"
          data-testid="pipeline-clear-filters"
          start-icon="x"
          :text="$t('repo.pipeline_list.filters.clear')"
          @click="clearFilters"
        />
      </div>

      <FeedbackState
        v-if="initialLoading"
        kind="loading"
        :title="$t('feedback.loading_title')"
        :description="$t('feedback.loading_description')"
      />
      <FeedbackState
        v-else-if="sortedPipelines.length === 0"
        kind="empty"
        :title="$t('repo.pipeline_list.empty.title')"
        :description="$t('repo.pipeline_list.empty.description')"
      />
      <FeedbackState
        v-else-if="filteredPipelines.length === 0"
        kind="empty"
        :title="$t('repo.pipeline_list.no_match.title')"
        :description="$t('repo.pipeline_list.no_match.description')"
      >
        <template #action>
          <Button
            data-testid="pipeline-clear-filters"
            :text="$t('repo.pipeline_list.filters.clear')"
            @click="clearFilters"
          />
        </template>
      </FeedbackState>

      <div v-else class="wp-table-scroll pipeline-table-scroll">
        <table class="pipeline-table">
          <thead>
            <tr>
              <th>{{ $t('repo.pipeline_list.columns.status') }}</th>
              <th>{{ $t('repo.pipeline_list.columns.pipeline') }}</th>
              <th>{{ $t('repo.pipeline_list.columns.branch') }}</th>
              <th>{{ $t('repo.pipeline_list.columns.event') }}</th>
              <th>{{ $t('repo.pipeline_list.columns.author') }}</th>
              <th>{{ $t('repo.pipeline_list.columns.commit') }}</th>
              <th>{{ $t('repo.pipeline_list.columns.duration') }}</th>
              <th>{{ $t('repo.pipeline_list.columns.queued') }}</th>
              <th>{{ $t('repo.pipeline_list.columns.finished') }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="pipeline in paginatedPipelines"
              :key="pipeline.id"
              data-testid="pipeline-row"
              :data-pipeline-number="pipeline.number"
            >
              <td>
                <span class="pipeline-status" :class="`status-${statusGroup(pipeline.status)}`">
                  <PipelineStatusIcon :status="pipeline.status" />
                  {{ statusLabel(pipeline.status) }}
                </span>
              </td>
              <td>
                <router-link
                  class="pipeline-number"
                  :to="{ name: 'repo-pipeline', params: { pipelineId: pipeline.number } }"
                >
                  #{{ pipeline.number }}
                </router-link>
              </td>
              <td>
                <span class="pipeline-branch" :title="pipeline.branch">
                  <PrototypeIcon name="branch" />
                  {{ pipeline.branch || $t('repo.pipeline_list.not_available') }}
                </span>
              </td>
              <td>{{ eventLabel(pipeline.event) }}</td>
              <td>
                <span class="pipeline-author">
                  <img v-if="pipeline.author_avatar" :src="pipeline.author_avatar" alt="" />
                  <span v-else class="pipeline-author-fallback"><PrototypeIcon name="user" /></span>
                  {{ pipeline.author || $t('repo.pipeline_list.unknown_author') }}
                </span>
              </td>
              <td>
                <router-link
                  class="pipeline-message"
                  :title="pipeline.message"
                  :to="{ name: 'repo-pipeline', params: { pipelineId: pipeline.number } }"
                >
                  <strong>{{ pipeline.message || $t('repo.pipeline_list.not_available') }}</strong>
                  <small class="wp-mono">{{ shortCommit(pipeline.commit) }}</small>
                </router-link>
              </td>
              <td class="pipeline-time wp-mono">{{ pipelineDuration(pipeline) }}</td>
              <td class="pipeline-time wp-mono">{{ queueDuration(pipeline) }}</td>
              <td class="pipeline-time">{{ finishedAt(pipeline) }}</td>
              <td>
                <div class="pipeline-actions">
                  <IconButton
                    v-if="canDeploy(pipeline)"
                    :data-testid="`pipeline-deploy-${pipeline.number}`"
                    icon="rocket"
                    :title="$t('repo.pipeline_list.actions.deploy', { pipeline: pipeline.number })"
                    @click="openDeploy(pipeline.number)"
                  />
                  <IconButton
                    icon="play-outline"
                    :title="$t('repo.pipeline_list.actions.view', { pipeline: pipeline.number })"
                    :to="{ name: 'repo-pipeline', params: { pipelineId: pipeline.number } }"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer v-if="sortedPipelines.length > 0" class="pipeline-table-footer">
        <span>
          {{
            hasFilters
              ? $t('repo.pipeline_list.pagination.filtered_count', {
                  visible: filteredPipelines.length,
                  loaded: sortedPipelines.length,
                })
              : $t('repo.pipeline_list.pagination.loaded_count', { count: sortedPipelines.length })
          }}
        </span>
        <div class="pipeline-pagination">
          <Button
            data-testid="pipeline-previous"
            size="sm"
            :text="$t('repo.pipeline_list.pagination.previous')"
            :disabled="currentPage <= 1"
            @click="currentPage -= 1"
          />
          <span>{{ $t('repo.pipeline_list.pagination.page', { current: currentPage, total: totalPages }) }}</span>
          <Button
            data-testid="pipeline-next"
            size="sm"
            :text="$t('repo.pipeline_list.pagination.next')"
            :disabled="!canGoNext"
            :is-loading="loadingMore"
            @click="goNext"
          />
        </div>
      </footer>
    </section>

    <DeployPipelinePopup
      v-if="selectedPipelineNumber"
      data-testid="deploy-pipeline-popup"
      :pipeline-number="selectedPipelineNumber"
      :open="selectedPipelineNumber !== undefined"
      @close="selectedPipelineNumber = undefined"
    />
  </div>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import DeployPipelinePopup from '~/components/layout/popups/DeployPipelinePopup.vue';
import OpsMetricCard from '~/components/ops/OpsMetricCard.vue';
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import PipelineStatusIcon from '~/components/repo/pipeline/PipelineStatusIcon.vue';
import { useDate } from '~/compositions/useDate';
import { requiredInject } from '~/compositions/useInjectProvide';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Pipeline, PipelineStatus } from '~/lib/api/types';
import { calculatePipelineStats } from '~/lib/repoMetrics';
import { usePipelineStore } from '~/store/pipelines';

type PipelineStatusGroup = 'success' | 'failure' | 'running' | 'pending' | 'skipped';

const repo = requiredInject('repo');
const repoPermissions = requiredInject('repo-permissions');
const pipelines = requiredInject('pipelines');
const pipelineStore = usePipelineStore();
const { t } = useI18n();
const { durationAsNumber, timeAgo } = useDate();

useWPTitle(computed(() => [t('repo.activity'), repo.value.full_name]));

const search = ref('');
const statusFilter = ref<PipelineStatusGroup | 'all'>('all');
const branchFilter = ref('all');
const eventFilter = ref('all');
const currentPage = ref(1);
// eslint-disable-next-line ts/no-use-before-define
const serverPage = ref(repoPipelinePageCursor.get(repo.value.id) ?? 1);
// eslint-disable-next-line ts/no-use-before-define
const hasMore = ref(repoPipelineHasMore.get(repo.value.id) ?? false);
const loadingMore = ref(false);
const selectedPipelineNumber = ref<string>();
const pageSize = 10;
let repoGeneration = 0;

const sortedPipelines = computed(() =>
  [...pipelines.value].sort((left, right) => (right.created || 0) - (left.created || 0)),
);
const pipelineStats = computed(() => calculatePipelineStats(sortedPipelines.value));
const latestPipeline = computed(() => sortedPipelines.value[0]);
const branches = computed(() =>
  [...new Set(sortedPipelines.value.map((pipeline) => pipeline.branch).filter(Boolean))].sort(),
);
const events = computed(() => [...new Set(sortedPipelines.value.map((pipeline) => pipeline.event))].sort());
const hasFilters = computed(
  () =>
    search.value.trim() !== '' ||
    statusFilter.value !== 'all' ||
    branchFilter.value !== 'all' ||
    eventFilter.value !== 'all',
);
const filteredPipelines = computed(() => {
  const query = search.value.trim().toLowerCase();
  return sortedPipelines.value.filter((pipeline) => {
    const matchesSearch =
      query === '' ||
      `${pipeline.number} ${pipeline.message} ${pipeline.author} ${pipeline.commit} ${pipeline.branch}`
        .toLowerCase()
        .includes(query);
    const matchesStatus = statusFilter.value === 'all' || statusGroup(pipeline.status) === statusFilter.value;
    const matchesBranch = branchFilter.value === 'all' || pipeline.branch === branchFilter.value;
    const matchesEvent = eventFilter.value === 'all' || pipeline.event === eventFilter.value;
    return matchesSearch && matchesStatus && matchesBranch && matchesEvent;
  });
});
const totalPages = computed(() => Math.max(1, Math.ceil(filteredPipelines.value.length / pageSize)));
const paginatedPipelines = computed(() =>
  filteredPipelines.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize),
);
const canGoNext = computed(() => currentPage.value < totalPages.value || hasMore.value);
const initialLoading = computed(() => pipelineStore.loading && sortedPipelines.value.length === 0);
const statusChart = computed(() =>
  sortedPipelines.value
    .filter((pipeline) => pipeline.status === 'success' || statusGroup(pipeline.status) === 'failure')
    .slice(0, 10)
    .reverse()
    .map((pipeline) => (pipeline.status === 'success' ? 100 : 0)),
);
const durationChart = computed(() => [...pipelineStats.value.durations].slice(-10));
const durationChartMax = computed(() => Math.max(1, ...durationChart.value));
const latestStatus = computed(() =>
  latestPipeline.value ? statusLabel(latestPipeline.value.status) : t('repo.pipeline_list.metrics.no_result'),
);
const latestHint = computed(() => {
  if (!latestPipeline.value) return t('repo.pipeline_list.metrics.no_runs');
  return t('repo.pipeline_list.metrics.latest_hint', {
    pipeline: latestPipeline.value.number,
    time: relativeTime(latestPipeline.value.created),
  });
});
const latestTone = computed(() => {
  if (!latestPipeline.value) return 'neutral';
  const group = statusGroup(latestPipeline.value.status);
  if (group === 'success') return 'success';
  if (group === 'failure') return 'danger';
  if (group === 'running') return 'info';
  return 'warning';
});
const successRate = computed(() =>
  pipelineStats.value.successRate === null ? '—' : `${pipelineStats.value.successRate.toFixed(1)}%`,
);
const averageDuration = computed(() =>
  pipelineStats.value.durations.length === 0
    ? '—'
    : durationAsNumber(pipelineStats.value.averageDurationSeconds * 1000),
);

function statusGroup(status: PipelineStatus): PipelineStatusGroup {
  if (status === 'success') return 'success';
  if (['failure', 'error', 'killed', 'canceled', 'declined'].includes(status)) return 'failure';
  if (status === 'running' || status === 'started') return 'running';
  if (status === 'pending' || status === 'blocked') return 'pending';
  return 'skipped';
}

function statusLabel(status: PipelineStatus): string {
  return {
    blocked: t('repo.pipeline.status.blocked'),
    declined: t('repo.pipeline.status.declined'),
    error: t('repo.pipeline.status.error'),
    failure: t('repo.pipeline.status.failure'),
    killed: t('repo.pipeline.status.killed'),
    pending: t('repo.pipeline.status.pending'),
    running: t('repo.pipeline.status.running'),
    skipped: t('repo.pipeline.status.skipped'),
    canceled: t('repo.pipeline.status.canceled'),
    started: t('repo.pipeline.status.started'),
    success: t('repo.pipeline.status.success'),
  }[status];
}

function eventLabel(event: Pipeline['event']): string {
  return {
    push: t('repo.pipeline.event.push'),
    tag: t('repo.pipeline.event.tag'),
    pull_request: t('repo.pipeline.event.pr'),
    pull_request_closed: t('repo.pipeline.event.pr_closed'),
    pull_request_metadata: t('repo.pipeline.event.pr_metadata'),
    deployment: t('repo.pipeline.event.deploy'),
    cron: t('repo.pipeline.event.cron'),
    manual: t('repo.pipeline.event.manual'),
    release: t('repo.pipeline.event.release'),
  }[event];
}

function shortCommit(commit: string): string {
  return commit ? commit.slice(0, 10) : t('repo.pipeline_list.not_available');
}

function durationBetween(start: number, end: number): string {
  if (!start || !end || end <= start) return t('repo.pipeline_list.not_available');
  return durationAsNumber((end - start) * 1000);
}

function pipelineDuration(pipeline: Pipeline): string {
  return durationBetween(pipeline.started, pipeline.finished || pipeline.updated);
}

function queueDuration(pipeline: Pipeline): string {
  return durationBetween(pipeline.created, pipeline.started);
}

function relativeTime(timestamp: number): string {
  return timestamp > 0 ? timeAgo(timestamp * 1000) : t('repo.pipeline_list.not_available');
}

function finishedAt(pipeline: Pipeline): string {
  return pipeline.finished > 0 ? relativeTime(pipeline.finished) : t('repo.pipeline_list.not_available');
}

function canDeploy(pipeline: Pipeline): boolean {
  return repoPermissions.value.push && repo.value.allow_deploy && pipeline.status === 'success';
}

function openDeploy(pipelineNumber: number) {
  selectedPipelineNumber.value = String(pipelineNumber);
}

function clearFilters() {
  search.value = '';
  statusFilter.value = 'all';
  branchFilter.value = 'all';
  eventFilter.value = 'all';
}

function recordRepoPagination(repoId: number, loadedPage: number, repoHasMore: boolean) {
  const confirmedPage = repoPipelinePageCursor.get(repoId) ?? 1;
  if (loadedPage < confirmedPage) return;

  repoPipelinePageCursor.set(repoId, loadedPage);
  repoPipelineHasMore.set(repoId, repoHasMore);
  if (repo.value.id !== repoId) return;

  serverPage.value = loadedPage;
  hasMore.value = repoHasMore;
}

const unsubscribePipelineActions = pipelineStore.$onAction(({ name, args, after }) => {
  if (name !== 'loadRepoPipelines') return;

  const [loadedRepoId, requestedPage] = args as [number, number?];
  const loadedPage = requestedPage ?? 1;
  after((repoHasMore) => {
    recordRepoPagination(loadedRepoId, loadedPage, repoHasMore as boolean);
  });
});
onUnmounted(unsubscribePipelineActions);

async function goNext() {
  if (loadingMore.value) return;

  if (currentPage.value < totalPages.value) {
    currentPage.value += 1;
    return;
  }

  if (!hasMore.value) return;

  const requestedGeneration = repoGeneration;
  const requestedRepoId = repo.value.id;
  loadingMore.value = true;
  const nextServerPage = serverPage.value + 1;
  try {
    const repoHasMore = await pipelineStore.loadRepoPipelines(requestedRepoId, nextServerPage);
    if (requestedGeneration !== repoGeneration || repo.value.id !== requestedRepoId) return;

    recordRepoPagination(requestedRepoId, nextServerPage, repoHasMore);
    if (currentPage.value < totalPages.value) currentPage.value += 1;
  } catch (error) {
    if (requestedGeneration === repoGeneration && repo.value.id === requestedRepoId) throw error;
  } finally {
    if (requestedGeneration === repoGeneration) loadingMore.value = false;
  }
}

watch([search, statusFilter, branchFilter, eventFilter], () => {
  currentPage.value = 1;
});
watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages;
});
watch(
  () => repo.value.id,
  () => {
    repoGeneration += 1;
    serverPage.value = repoPipelinePageCursor.get(repo.value.id) ?? 1;
    hasMore.value = repoPipelineHasMore.get(repo.value.id) ?? false;
    currentPage.value = 1;
    loadingMore.value = false;
    selectedPipelineNumber.value = undefined;
    clearFilters();
  },
);
</script>

<script lang="ts">
const repoPipelinePageCursor = new Map<number, number>();
const repoPipelineHasMore = new Map<number, boolean>();
</script>

<style scoped>
@reference '~/tailwind.css';

.repo-pipelines-page {
  @apply grid gap-4 pb-8;
}

.pipeline-metrics {
  @apply grid gap-3 lg:grid-cols-3;
}

.pipeline-table-card {
  @apply min-w-0 overflow-hidden;
}

.pipeline-filters {
  @apply border-wp-border-100 grid gap-2 border-b p-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_150px_150px_150px_auto];
}

.pipeline-search {
  @apply relative block;
}

.pipeline-search > :deep(svg) {
  @apply text-wp-text-alt-100 pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2;
}

.pipeline-search .input {
  @apply w-full pl-10;
}

.pipeline-table-scroll {
  @apply max-w-full;
}

.pipeline-table {
  @apply min-w-[1080px];
}

.pipeline-table th {
  @apply text-[9px] tracking-wide uppercase;
}

.pipeline-table td {
  @apply py-3;
}

.pipeline-status {
  @apply inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold whitespace-nowrap;
}

.pipeline-status :deep(svg) {
  @apply h-3.5! w-3.5!;
}

.status-success {
  @apply border-wp-state-ok-100/30 bg-wp-state-ok-100/10 text-wp-state-ok-100;
}

.status-failure {
  @apply border-wp-error-100/30 bg-wp-error-100/10 text-wp-error-100;
}

.status-running {
  @apply border-wp-state-info-100/30 bg-wp-state-info-100/10 text-wp-state-info-100;
}

.status-pending {
  @apply border-wp-state-warn-100/30 bg-wp-state-warn-100/10 text-wp-state-warn-100;
}

.status-skipped {
  @apply border-wp-border-200 bg-wp-background-100 text-wp-text-alt-100;
}

.pipeline-number {
  @apply text-wp-link-100 font-mono text-xs font-bold hover:underline;
}

.pipeline-branch,
.pipeline-author {
  @apply flex max-w-44 items-center gap-1.5 truncate whitespace-nowrap;
}

.pipeline-branch :deep(svg),
.pipeline-author-fallback :deep(svg) {
  @apply h-3.5 w-3.5 shrink-0;
}

.pipeline-author img,
.pipeline-author-fallback {
  @apply bg-wp-control-neutral-100 flex h-6 w-6 shrink-0 items-center justify-center rounded-md object-cover;
}

.pipeline-message {
  @apply block max-w-72;
}

.pipeline-message strong,
.pipeline-message small {
  @apply block truncate;
}

.pipeline-message strong {
  @apply text-wp-text-200 text-xs hover:underline;
}

.pipeline-message small,
.pipeline-time {
  @apply text-wp-text-alt-100 mt-1 text-[10px] whitespace-nowrap;
}

.pipeline-actions {
  @apply flex justify-end gap-1;
}

.pipeline-table-footer {
  @apply border-wp-border-100 text-wp-text-alt-100 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-[10px];
}

.pipeline-pagination {
  @apply flex items-center gap-3;
}

@media (max-width: 640px) {
  .pipeline-metrics {
    @apply grid-cols-1;
  }

  .pipeline-filters {
    @apply grid-cols-1;
  }
}
</style>
