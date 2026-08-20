<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold full-width-header fluid-content>
    <template #title
      ><span class="page-title">{{ $t('repositories.title') }}</span></template
    >
    <template #headerActions>
      <Button color="green" :to="{ name: 'repo-add' }" start-icon="plus" :text="$t('repositories.add')" />
    </template>

    <div class="repos-page">
      <p class="page-description">{{ $t('repositories.description') }}</p>

      <FeedbackState
        v-if="initialLoading"
        kind="loading"
        :title="$t('repositories.loading_title')"
        :description="$t('repositories.loading_description')"
      />
      <FeedbackState
        v-else-if="loadError && repos.length === 0"
        kind="error"
        :title="$t('repositories.error_title')"
        :description="$t('repositories.error_description')"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('repositories.retry')" @click="loadRepositories()" />
        </template>
      </FeedbackState>
      <FeedbackState
        v-else-if="repos.length === 0"
        kind="empty"
        :title="$t('repositories.no_repositories')"
        :description="$t('repositories.no_repositories_hint')"
      />

      <FeedbackState
        v-if="repos.length > 0 && loadError"
        compact
        kind="error"
        :title="$t('repositories.refresh_error_title')"
        :description="$t('repositories.refresh_error_description')"
      />
      <FeedbackState
        v-else-if="repos.length > 0 && partialError"
        compact
        kind="error"
        :title="$t('repositories.partial_error_title')"
        :description="$t('repositories.partial_error_description')"
      />

      <div v-if="repos.length > 0" class="repos-grid">
        <main class="wp-card table-card">
          <div class="filters">
            <label class="search-field"
              ><Icon name="search" /><input
                v-model="search"
                class="input"
                :placeholder="$t('repositories.search_placeholder')"
            /></label>
            <select v-model="statusFilter" class="select">
              <option value="all">{{ $t('repositories.all_statuses') }}</option>
              <option value="success">{{ $t('repositories.status.success') }}</option>
              <option value="failure">{{ $t('repositories.status.failure') }}</option>
              <option value="running">{{ $t('repositories.status.running') }}</option>
              <option value="pending">{{ $t('repositories.status.pending') }}</option>
              <option value="skipped">{{ $t('repositories.status.skipped') }}</option>
              <option value="none">{{ $t('repositories.status.none') }}</option>
            </select>
            <select v-model="forgeFilter" class="select">
              <option value="all">{{ $t('repositories.all_forges') }}</option>
              <option v-for="forge in forges" :key="forge.id" :value="String(forge.id)">
                {{ forgeLabel(forge.type) }}
              </option>
            </select>
            <Button
              v-if="hasFilters"
              variant="ghost"
              start-icon="x"
              :text="$t('repositories.clear')"
              @click="clearFilters"
            />
          </div>

          <div class="wp-table-scroll repo-table-scroll">
            <table class="repo-table">
              <thead>
                <tr>
                  <th class="checkbox-column">
                    <input
                      type="checkbox"
                      :checked="allPageSelected"
                      :aria-label="$t('repositories.select_page')"
                      @change="togglePageSelection"
                    />
                  </th>
                  <th>{{ $t('repositories.columns.repository') }}</th>
                  <th>{{ $t('repositories.columns.forge') }}</th>
                  <th>{{ $t('repositories.columns.branch') }}</th>
                  <th>{{ $t('repositories.columns.latest_pipeline') }}</th>
                  <th>{{ $t('repositories.columns.last_run') }}</th>
                  <th>{{ $t('repositories.columns.duration') }}</th>
                  <th>{{ $t('repositories.columns.success_rate') }}</th>
                  <th>{{ $t('repositories.columns.visibility') }}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr v-for="repo in paginatedRepos" :key="repo.id">
                  <td class="checkbox-column">
                    <input
                      type="checkbox"
                      :checked="selectedRepoIds.has(repo.id)"
                      :aria-label="$t('repositories.select_repo', { repo: repo.full_name })"
                      @change="toggleRepo(repo.id)"
                    />
                  </td>
                  <td>
                    <router-link class="repo-name" :to="{ name: 'repo', params: { repoId: repo.id } }">{{
                      repo.full_name
                    }}</router-link>
                    <small class="repo-description">{{ repoDescription(repo) }}</small>
                  </td>
                  <td>
                    <span class="forge-badge"
                      ><Icon :name="forgeIcon(repo.forge_id)" />{{ forgeName(repo.forge_id) }}</span
                    >
                  </td>
                  <td>
                    <span class="branch-badge"><Icon name="branch" />{{ repo.default_branch || 'main' }}</span>
                  </td>
                  <td>
                    <span class="pipeline-badge" :class="statusClass(repoPipelineStatus(repo))"
                      ><Icon :name="statusIcon(repoPipelineStatus(repo))" />{{
                        statusLabel(repoPipelineStatus(repo))
                      }}</span
                    >
                  </td>
                  <td class="muted-cell">
                    {{ relativeTime(repo.last_pipeline?.finished || repo.last_pipeline?.created) }}
                  </td>
                  <td class="muted-cell wp-mono">{{ pipelineDuration(repo) }}</td>
                  <td>
                    <strong :class="healthTextClass(repoSuccessRate(repo))">{{ successRateLabel(repo) }}</strong>
                  </td>
                  <td>
                    <span class="visibility"><Icon :name="visibilityIcon(repo)" />{{ visibilityLabel(repo) }}</span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <IconButton
                        icon="play-outline"
                        :title="$t('repositories.run_title', { repo: repo.full_name })"
                        :to="{ name: 'repo-manual', params: { repoId: repo.id } }"
                      />
                      <IconButton
                        icon="dots"
                        :title="$t('repositories.settings_title', { repo: repo.full_name })"
                        :to="{ name: 'repo-settings', params: { repoId: repo.id } }"
                      />
                    </div>
                  </td>
                </tr>
                <tr v-if="paginatedRepos.length === 0">
                  <td colspan="10" class="wp-empty-state">
                    <strong>{{ $t('repositories.empty') }}</strong>
                    <p>{{ $t('repositories.empty_hint') }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer class="table-footer">
            <span
              ><template v-if="selectedRepoIds.size > 0"
                >{{ $t('repositories.selected_count', { count: selectedRepoIds.size }) }} · </template
              >{{ $t('repositories.total_count', { count: filteredRepos.length }) }}</span
            >
            <div class="pagination">
              <Button
                size="sm"
                :text="$t('repositories.previous')"
                :disabled="currentPage <= 1"
                @click="currentPage -= 1"
              /><span>{{ $t('repositories.page', { current: currentPage, total: totalPages }) }}</span
              ><Button
                size="sm"
                :text="$t('repositories.next')"
                :disabled="currentPage >= totalPages"
                @click="currentPage += 1"
              />
            </div>
          </footer>
        </main>

        <aside class="repos-sidebar">
          <section class="wp-card repo-health-card">
            <div class="wp-card-header">
              <h2>{{ $t('repositories.health') }}</h2>
              <IconButton
                icon="refresh"
                :title="$t('repositories.refresh')"
                :is-loading="isRefreshing"
                @click="refreshRepositories"
              />
            </div>
            <div class="health-summary">
              <div class="health-donut" :style="healthDonutStyle">
                <div>
                  <strong>{{ repos.length }}</strong
                  ><small>{{ $t('repositories.total_repositories') }}</small>
                </div>
              </div>
              <div class="health-stats">
                <div>
                  <span>{{ $t('repositories.status.success') }}</span
                  ><strong class="text-success">{{ healthCounts.success }}</strong>
                </div>
                <div>
                  <span>{{ $t('repositories.status.failure') }}</span
                  ><strong class="text-danger">{{ healthCounts.failure }}</strong>
                </div>
                <div>
                  <span>{{ $t('repositories.status.running') }}</span
                  ><strong class="text-info">{{ healthCounts.running }}</strong>
                </div>
                <div>
                  <span>{{ $t('repositories.status.pending') }}</span
                  ><strong>{{ healthCounts.pending }}</strong>
                </div>
                <div>
                  <span>{{ $t('repositories.status.skipped') }}</span
                  ><strong>{{ healthCounts.skipped }}</strong>
                </div>
                <div>
                  <span>{{ $t('repositories.status.none') }}</span
                  ><strong>{{ healthCounts.none }}</strong>
                </div>
              </div>
            </div>
          </section>

          <section class="wp-card team-card">
            <div class="wp-card-header">
              <h2>{{ $t('repositories.by_owner') }}</h2>
            </div>
            <div class="team-list">
              <div v-for="team in ownerGroups" :key="team.owner" class="team-row">
                <div>
                  <strong>{{ team.owner }}</strong
                  ><span class="team-progress"><i :style="{ width: `${team.percent}%` }" /></span>
                </div>
                <span>{{ $t('repositories.repo_count', { count: team.count }) }}</span>
              </div>
              <div v-if="ownerGroups.length === 0" class="wp-empty-state">
                <strong>{{ $t('repositories.no_owner_data') }}</strong>
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
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Icon from '~/components/ops/PrototypeIcon.vue';
import type { IconNames } from '~/components/atomic/Icon.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useApiClient from '~/compositions/useApiClient';
import useRepos from '~/compositions/useRepos';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Forge, ForgeType, Repo } from '~/lib/api/types';
import { calculatePipelineStats, pipelineDurationSeconds, repoPipelineStatus } from '~/lib/repoMetrics';
import type { PipelineStats, RepoPipelineStatus } from '~/lib/repoMetrics';
import { useRepoStore } from '~/store/repos';

const apiClient = useApiClient();
const repoStore = useRepoStore();
const { repoWithLastPipeline, sortReposByLastActivity } = useRepos();
const { t } = useI18n();
useWPTitle(computed(() => [t('repositories.title')]));

const search = ref('');
const statusFilter = ref('all');
const forgeFilter = ref('all');
const currentPage = ref(1);
const pageSize = 10;
const selectedRepoIds = ref(new Set<number>());
const forges = ref<Forge[]>([]);
const repoStats = reactive(new Map<number, PipelineStats>());
const loadingStats = new Map<number, number>();
const initialLoading = ref(true);
const isRefreshing = ref(false);
const loadError = ref(false);
const forgeError = ref(false);
const statsError = ref(false);
let loadGeneration = 0;
let statsGeneration = 0;
let mounted = true;

const repos = computed(() => sortReposByLastActivity(repoStore.ownedRepos.map((repo) => repoWithLastPipeline(repo))));
const forgeMap = computed(() => new Map(forges.value.map((forge) => [forge.id, forge])));
const hasFilters = computed(() => search.value !== '' || statusFilter.value !== 'all' || forgeFilter.value !== 'all');
const filteredRepos = computed(() => {
  const query = search.value.trim().toLowerCase();
  return repos.value.filter((repo) => {
    const matchesSearch =
      !query || `${repo.full_name} ${repo.default_branch} ${repo.config_file}`.toLowerCase().includes(query);
    const matchesStatus = statusFilter.value === 'all' || repoPipelineStatus(repo) === statusFilter.value;
    const matchesForge = forgeFilter.value === 'all' || String(repo.forge_id) === forgeFilter.value;
    return matchesSearch && matchesStatus && matchesForge;
  });
});
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRepos.value.length / pageSize)));
const paginatedRepos = computed(() =>
  filteredRepos.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize),
);
const allPageSelected = computed(
  () => paginatedRepos.value.length > 0 && paginatedRepos.value.every((repo) => selectedRepoIds.value.has(repo.id)),
);
const healthCounts = computed(() => ({
  success: repos.value.filter((repo) => repoPipelineStatus(repo) === 'success').length,
  failure: repos.value.filter((repo) => repoPipelineStatus(repo) === 'failure').length,
  running: repos.value.filter((repo) => repoPipelineStatus(repo) === 'running').length,
  pending: repos.value.filter((repo) => repoPipelineStatus(repo) === 'pending').length,
  skipped: repos.value.filter((repo) => repoPipelineStatus(repo) === 'skipped').length,
  none: repos.value.filter((repo) => repoPipelineStatus(repo) === 'none').length,
}));
const healthyRepoPercent = computed(() =>
  repos.value.length > 0 ? (healthCounts.value.success / repos.value.length) * 100 : 0,
);
const healthDonutStyle = computed(() => ({
  background: `conic-gradient(var(--wp-state-ok-100) 0deg ${healthyRepoPercent.value * 3.6}deg, var(--wp-background-100) ${healthyRepoPercent.value * 3.6}deg 360deg)`,
}));
const ownerGroups = computed(() => {
  const counts = new Map<string, number>();
  repos.value.forEach((repo) => counts.set(repo.owner, (counts.get(repo.owner) ?? 0) + 1));
  const groups = [...counts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 6);
  const maxCount = Math.max(...groups.map(([, count]) => count), 1);
  return groups.map(([owner, count]) => ({ owner, count, percent: Math.max(18, (count / maxCount) * 100) }));
});
const partialError = computed(() => forgeError.value || statsError.value);

async function loadRepositories(refresh = false) {
  const generation = ++loadGeneration;
  const metricGeneration = ++statsGeneration;
  loadingStats.clear();
  statsError.value = false;
  loadError.value = false;
  if (refresh) isRefreshing.value = true;
  else initialLoading.value = repos.value.length === 0;

  try {
    if (refresh) await repoStore.refreshRepos();
    const [repoResult, forgeResult] = await Promise.allSettled([
      repoStore.loadRepos(),
      apiClient.getForges({ page: 1, perPage: 50 }),
    ]);
    if (!mounted || generation !== loadGeneration) return;

    if (repoResult.status === 'rejected') {
      loadError.value = true;
      return;
    }

    forgeError.value = forgeResult.status === 'rejected';
    if (forgeResult.status === 'fulfilled') forges.value = forgeResult.value ?? [];

    await loadRepoStats(paginatedRepos.value, metricGeneration, refresh);
  } catch {
    if (mounted && generation === loadGeneration) loadError.value = true;
  } finally {
    if (mounted && generation === loadGeneration) {
      initialLoading.value = false;
      isRefreshing.value = false;
    }
  }
}

function refreshRepositories() {
  return loadRepositories(true);
}

function statusLabel(status: RepoPipelineStatus): string {
  return {
    success: t('repositories.status.success'),
    failure: t('repositories.status.failure'),
    running: t('repositories.status.running'),
    pending: t('repositories.status.pending'),
    skipped: t('repositories.status.skipped'),
    none: t('repositories.status.none'),
  }[status];
}

function statusClass(status: RepoPipelineStatus): string {
  return `status-${status}`;
}

function statusIcon(status: RepoPipelineStatus): IconNames {
  return {
    success: 'check',
    failure: 'x',
    running: 'play',
    pending: 'warning',
    skipped: 'blank',
    none: 'blank',
  }[status] as IconNames;
}

function forgeLabel(type: ForgeType): string {
  return {
    github: 'GitHub',
    gitlab: 'GitLab',
    gitea: 'Gitea',
    bitbucket: 'Bitbucket',
    'bitbucket-dc': 'Bitbucket DC',
    addon: 'Addon',
    forgejo: 'Forgejo',
  }[type];
}

function forgeName(forgeId: number): string {
  const forge = forgeMap.value.get(forgeId);
  return forge ? forgeLabel(forge.type) : `Forge #${forgeId}`;
}

function forgeIcon(forgeId: number): IconNames {
  const type = forgeMap.value.get(forgeId)?.type;
  if (type && ['github', 'gitlab', 'gitea', 'bitbucket', 'bitbucket-dc', 'forgejo'].includes(type))
    return type as IconNames;
  return 'forge';
}

function repoDescription(repo: Repo): string {
  if (!repo.active) return t('repositories.disabled_description');
  return repo.config_file || '.woodpecker.yml';
}

function repoSuccessRate(repo: Repo): number | null {
  return repoStats.get(repo.id)?.successRate ?? null;
}

function successRateLabel(repo: Repo): string {
  const rate = repoSuccessRate(repo);
  return rate === null ? '—' : `${rate.toFixed(1)}%`;
}

function healthTextClass(score: number | null): string {
  if (score === null) return 'text-wp-text-alt-100';
  return score < 75 ? 'text-danger' : score < 90 ? 'text-warning' : 'text-success';
}

function pipelineDuration(repo: Repo): string {
  const average = repoStats.get(repo.id)?.averageDurationSeconds ?? 0;
  if (average > 0) return formatDuration(average);
  const pipeline = repo.last_pipeline;
  if (!pipeline) return '—';
  const duration = pipelineDurationSeconds(pipeline);
  return duration === null ? '—' : formatDuration(duration);
}

function visibilityIcon(repo: Repo): IconNames {
  if (repo.visibility === 'private') return 'visibility-private';
  if (repo.visibility === 'internal') return 'visibility-internal';
  return 'external';
}

function visibilityLabel(repo: Repo): string {
  if (repo.visibility === 'private') return t('repositories.visibility.private');
  if (repo.visibility === 'internal') return t('repositories.visibility.internal');
  return t('repositories.visibility.public');
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return t('overview.duration.seconds', { seconds: Math.round(seconds) });
  return t('overview.duration.minutes_seconds', {
    minutes: Math.floor(seconds / 60),
    seconds: Math.round(seconds % 60),
  });
}

async function loadRepoStats(repoList: Repo[], generation = statsGeneration, force = false) {
  await Promise.all(
    repoList.map(async (repo) => {
      if ((!force && repoStats.has(repo.id)) || loadingStats.get(repo.id) === generation) return;
      loadingStats.set(repo.id, generation);
      try {
        const pipelines = await apiClient.getPipelineList(repo.id, { page: 1, perPage: 20 });
        if (mounted && generation === statsGeneration) {
          repoStats.set(repo.id, calculatePipelineStats(pipelines));
        }
      } catch {
        if (mounted && generation === statsGeneration) statsError.value = true;
      } finally {
        if (loadingStats.get(repo.id) === generation) loadingStats.delete(repo.id);
      }
    }),
  );
}

function relativeTime(timestamp?: number): string {
  if (!timestamp) return '—';
  const seconds = Math.max(0, Math.floor(Date.now() / 1000 - timestamp));
  if (seconds < 60) return t('overview.time.seconds_ago', { count: seconds });
  if (seconds < 3600) return t('overview.time.minutes_ago', { count: Math.floor(seconds / 60) });
  if (seconds < 86400) return t('overview.time.hours_ago', { count: Math.floor(seconds / 3600) });
  return t('overview.time.days_ago', { count: Math.floor(seconds / 86400) });
}

function toggleRepo(repoId: number) {
  const next = new Set(selectedRepoIds.value);
  if (next.has(repoId)) next.delete(repoId);
  else next.add(repoId);
  selectedRepoIds.value = next;
}

function togglePageSelection() {
  const next = new Set(selectedRepoIds.value);
  if (allPageSelected.value) paginatedRepos.value.forEach((repo) => next.delete(repo.id));
  else paginatedRepos.value.forEach((repo) => next.add(repo.id));
  selectedRepoIds.value = next;
}

function clearFilters() {
  search.value = '';
  statusFilter.value = 'all';
  forgeFilter.value = 'all';
}

watch([search, statusFilter, forgeFilter], () => {
  currentPage.value = 1;
});
watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages;
});
watch(paginatedRepos, (items) => {
  void loadRepoStats(items);
});

onMounted(() => {
  void loadRepositories();
});
onBeforeUnmount(() => {
  mounted = false;
  loadGeneration += 1;
  statsGeneration += 1;
});
</script>

<style scoped>
@reference '~/tailwind.css';

.page-title {
  @apply text-wp-text-200 text-[28px] font-bold tracking-tight;
}
.repos-page {
  width: min(100%, 1440px);
  @apply mx-auto px-5 pb-10 md:px-7;
}
.page-description {
  @apply text-wp-text-alt-100 mb-5 text-sm;
}
.repos-grid {
  @apply grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_330px];
}
.table-card {
  @apply overflow-hidden;
}
.filters {
  @apply border-wp-border-100 grid gap-2 border-b p-3 md:grid-cols-[minmax(0,1fr)_140px_140px] xl:grid-cols-[minmax(260px,1fr)_140px_140px_auto];
}
.search-field {
  @apply relative block;
}
.search-field > :deep(svg) {
  @apply text-wp-text-alt-100 pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2;
}
.search-field .input {
  @apply w-full pl-10;
}
.repo-table-scroll {
  @apply max-h-[680px];
}
.repo-table {
  @apply min-w-[940px];
}
.repo-table th {
  @apply text-[9px] tracking-wide uppercase;
}
.repo-table td {
  @apply py-3;
}
.checkbox-column {
  @apply w-10 text-center;
}
.checkbox-column input {
  @apply accent-wp-primary-100 h-3.5 w-3.5;
}
.repo-name,
.repo-description {
  @apply block;
}
.repo-name {
  @apply text-wp-text-200 hover:text-wp-link-100 max-w-64 truncate text-xs font-bold;
}
.repo-description {
  @apply text-wp-text-alt-100 mt-1 max-w-64 truncate text-[9px];
}
.forge-badge,
.branch-badge,
.pipeline-badge,
.visibility {
  @apply inline-flex items-center gap-1.5 whitespace-nowrap;
}
.forge-badge {
  @apply border-wp-border-100 bg-wp-background-100 text-wp-text-100 rounded-md border px-2 py-1 text-[9px] font-bold;
}
.branch-badge {
  @apply border-wp-state-info-100/25 bg-wp-state-info-100/10 text-wp-state-info-100 rounded-md border px-2 py-1 font-mono text-[9px] font-bold;
}
.pipeline-badge {
  @apply rounded-md border px-2 py-1 text-[9px] font-bold;
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
.status-skipped,
.status-none {
  @apply border-wp-border-200 bg-wp-background-100 text-wp-text-alt-100;
}
.muted-cell,
.visibility {
  @apply text-wp-text-alt-100 text-[10px];
}
.text-success {
  @apply text-wp-state-ok-100;
}
.text-danger {
  @apply text-wp-error-100;
}
.text-warning {
  @apply text-wp-state-warn-100;
}
.text-info {
  @apply text-wp-state-info-100;
}
.row-actions {
  @apply flex items-center justify-end gap-1;
}
.table-footer {
  @apply border-wp-border-100 text-wp-text-alt-100 flex items-center justify-between gap-4 border-t px-4 py-3 text-[10px];
}
.pagination {
  @apply flex items-center gap-3;
}
.repos-sidebar {
  @apply grid content-start gap-4;
}
.wp-card-header h2 {
  @apply text-wp-text-200 text-sm font-bold;
}
.health-summary {
  @apply flex items-center justify-between gap-5 p-5;
}
.health-donut {
  @apply relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full;
}
.health-donut::before {
  content: '';
  @apply bg-wp-background-300 absolute h-20 w-20 rounded-full;
}
.health-donut > div {
  @apply relative z-10 text-center;
}
.health-donut strong,
.health-donut small {
  @apply block;
}
.health-donut strong {
  @apply text-wp-text-200 text-xl;
}
.health-donut small {
  @apply text-wp-text-alt-100 mt-1 text-[9px];
}
.health-stats {
  @apply min-w-32 flex-1;
}
.health-stats > div {
  @apply border-wp-border-100 flex items-center justify-between border-b py-2 text-[10px] last:border-0;
}
.health-stats span {
  @apply text-wp-text-alt-100;
}
.health-stats strong {
  @apply text-wp-text-200;
}
.team-list {
  @apply grid gap-3 p-4;
}
.team-row {
  @apply grid grid-cols-[minmax(0,1fr)_70px] items-center gap-4;
}
.team-row > div {
  @apply min-w-0;
}
.team-row strong {
  @apply text-wp-text-200 block truncate text-[10px];
}
.team-row > span {
  @apply text-wp-text-alt-100 text-right text-[9px];
}
.team-progress {
  @apply bg-wp-background-100 mt-2 block h-1.5 overflow-hidden rounded-full;
}
.team-progress i {
  @apply bg-wp-state-ok-100 block h-full rounded-full;
}
</style>
