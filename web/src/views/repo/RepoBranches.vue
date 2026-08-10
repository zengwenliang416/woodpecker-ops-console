<template>
  <div class="min-w-0 space-y-4">
    <section class="reference-toolbar">
      <label class="search-control">
        <span class="sr-only">{{ $t('repo.repository_refs.branches.search_label') }}</span>
        <PrototypeIcon name="search" aria-hidden="true" />
        <input
          v-model="search"
          type="search"
          :placeholder="$t('repo.repository_refs.branches.search_placeholder')"
          :aria-label="$t('repo.repository_refs.branches.search_label')"
        />
      </label>
      <Button
        :text="$t('repo.repository_refs.common.refresh')"
        start-icon="refresh"
        :is-loading="loading"
        @click="refresh"
      />
    </section>

    <FeedbackState
      v-if="loading && displayedBranches.length === 0"
      kind="loading"
      :title="$t('feedback.loading_title')"
      :description="$t('feedback.loading_description')"
    />
    <FeedbackState
      v-else-if="displayedBranches.length === 0"
      kind="empty"
      :title="$t('repo.repository_refs.branches.empty_title')"
      :description="$t('repo.repository_refs.branches.empty_description')"
    />
    <FeedbackState
      v-else-if="visibleBranches.length === 0"
      kind="empty"
      :title="$t('repo.repository_refs.branches.no_match_title')"
      :description="$t('repo.repository_refs.branches.no_match_description')"
    >
      <template #action>
        <Button :text="$t('repo.repository_refs.common.clear_search')" @click="search = ''" />
      </template>
    </FeedbackState>

    <section v-else class="reference-list" :aria-label="$t('repo.branches')">
      <article
        v-for="branch in visibleBranches"
        :key="branch"
        class="reference-row"
        data-testid="branch-row"
        :data-branch="branch"
      >
        <div class="min-w-0">
          <router-link
            class="reference-title"
            :to="{ name: 'repo-branch', params: { branch } }"
            data-testid="branch-link"
          >
            <PrototypeIcon name="branch" aria-hidden="true" />
            <span class="break-all">{{ branch }}</span>
            <Badge v-if="branch === repo.default_branch" :value="$t('default')" />
          </router-link>
          <p class="reference-secondary">
            {{ $t('repo.repository_refs.branches.row_description') }}
          </p>
        </div>

        <div v-if="latestPipelineByBranch.get(branch)" class="pipeline-summary">
          <PipelineStatusIcon :status="latestPipelineByBranch.get(branch)!.status" />
          <div class="min-w-0">
            <router-link
              class="pipeline-link"
              :to="{
                name: 'repo-pipeline',
                params: { pipelineId: latestPipelineByBranch.get(branch)!.number },
              }"
            >
              {{ latestPipelineByBranch.get(branch)!.message || $t('repo.repository_refs.common.no_message') }}
            </router-link>
            <p>
              <span class="font-mono">{{ latestPipelineByBranch.get(branch)!.commit.slice(0, 10) }}</span>
              <span aria-hidden="true">{{ $t('repo.repository_refs.common.separator') }}</span>
              <span>{{ pipelineAge(latestPipelineByBranch.get(branch)!) }}</span>
            </p>
          </div>
        </div>
        <div v-else class="no-pipeline">
          <PrototypeIcon name="list" aria-hidden="true" />
          <span>{{ $t('repo.repository_refs.common.no_loaded_pipeline') }}</span>
        </div>
      </article>
    </section>

    <footer v-if="displayedBranches.length > 0" class="reference-footer">
      <span>
        {{
          search
            ? $t('repo.repository_refs.common.filtered_count', {
                visible: visibleBranches.length,
                loaded: displayedBranches.length,
              })
            : $t('repo.repository_refs.branches.loaded_count', { count: displayedBranches.length })
        }}
      </span>
      <Button
        v-if="hasMore"
        :text="$t('repo.repository_refs.common.load_more')"
        :is-loading="loading"
        @click="nextPage"
      />
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Badge from '~/components/atomic/Badge.vue';
import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import PipelineStatusIcon from '~/components/repo/pipeline/PipelineStatusIcon.vue';
import useApiClient from '~/compositions/useApiClient';
import { useDate } from '~/compositions/useDate';
import { requiredInject } from '~/compositions/useInjectProvide';
import { usePagination } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Pipeline } from '~/lib/api/types';
import { isPullRequestEvent } from '~/lib/pipelineRefs';

const apiClient = useApiClient();
const repo = requiredInject('repo');
const allPipelines = requiredInject('pipelines');
const search = ref('');
const { timeAgo } = useDate();

async function loadBranches(page: number): Promise<string[]> {
  return apiClient.getRepoBranches(repo.value.id, { page });
}

const { resetPage, nextPage, data: branches, hasMore, loading } = usePagination(loadBranches);
const refreshSnapshot = ref<string[] | null>(null);
const displayedBranches = computed(() => refreshSnapshot.value ?? branches.value);
let refreshGeneration = 0;

const sortedBranches = computed(() =>
  displayedBranches.value.toSorted((a, b) => {
    if (a === repo.value.default_branch) return -1;
    if (b === repo.value.default_branch) return 1;
    return a.localeCompare(b);
  }),
);
const visibleBranches = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  return query
    ? sortedBranches.value.filter((branch) => branch.toLocaleLowerCase().includes(query))
    : sortedBranches.value;
});
const latestPipelineByBranch = computed(() => {
  const result = new Map<string, Pipeline>();
  allPipelines.value
    .filter((pipeline) => !isPullRequestEvent(pipeline.event))
    .toSorted((a, b) => b.number - a.number)
    .forEach((pipeline) => {
      if (!result.has(pipeline.branch)) result.set(pipeline.branch, pipeline);
    });
  return result;
});

function pipelineAge(pipeline: Pipeline): string {
  return pipeline.created > 0 ? timeAgo(pipeline.created * 1000) : '—';
}

async function refresh() {
  const requestGeneration = ++refreshGeneration;
  refreshSnapshot.value = [...displayedBranches.value];
  try {
    await resetPage();
  } catch (error) {
    if (requestGeneration === refreshGeneration) throw error;
    return;
  }
  if (requestGeneration === refreshGeneration) refreshSnapshot.value = null;
}

watch(repo, async () => {
  refreshGeneration += 1;
  search.value = '';
  refreshSnapshot.value = null;
  await resetPage();
});

const { t } = useI18n();
useWPTitle(computed(() => [t('repo.branches'), repo.value.full_name]));
</script>

<style scoped>
@reference '~/tailwind.css';

.reference-toolbar {
  @apply border-wp-border-100 bg-wp-background-300 flex min-w-0 flex-col gap-3 rounded-xl border p-3 shadow-sm sm:flex-row;
}

.search-control {
  @apply border-wp-border-100 bg-wp-background-100 text-wp-text-alt-100 focus-within:border-wp-primary-100 flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border px-3;
}

.search-control input {
  @apply text-wp-text-200 min-w-0 flex-1 bg-transparent text-xs outline-none;
}

.reference-list {
  @apply border-wp-border-100 bg-wp-background-300 min-w-0 overflow-hidden rounded-xl border shadow-sm;
}

.reference-row {
  @apply border-wp-border-100 grid min-w-0 gap-3 border-b p-4 last:border-b-0 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-center;
}

.reference-title {
  @apply text-wp-text-200 hover:text-wp-primary-100 flex min-w-0 items-center gap-2 text-sm font-bold;
}

.reference-secondary,
.pipeline-summary p {
  @apply text-wp-text-alt-100 mt-1 text-[11px];
}

.pipeline-summary {
  @apply bg-wp-background-100 flex min-w-0 items-center gap-3 rounded-lg px-3 py-2.5;
}

.pipeline-link {
  @apply text-wp-text-200 hover:text-wp-primary-100 block truncate text-xs font-semibold;
}

.no-pipeline {
  @apply text-wp-text-alt-100 bg-wp-background-100 flex min-w-0 items-center gap-2 rounded-lg px-3 py-3 text-xs;
}

.reference-footer {
  @apply border-wp-border-100 bg-wp-background-300 text-wp-text-alt-100 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs shadow-sm;
}
</style>
