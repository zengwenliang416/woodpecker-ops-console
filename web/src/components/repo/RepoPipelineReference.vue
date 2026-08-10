<template>
  <div class="min-w-0 space-y-4">
    <section class="reference-header">
      <div class="reference-icon" aria-hidden="true">
        <PrototypeIcon :name="kind === 'branch' ? 'branch' : 'pull-request'" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="text-wp-text-alt-100 text-[11px] font-bold tracking-[0.12em] uppercase">
          {{ eyebrow }}
        </div>
        <div class="mt-1 flex min-w-0 flex-wrap items-center gap-2">
          <h1 class="text-wp-text-200 min-w-0 text-xl font-bold break-words md:text-2xl">{{ title }}</h1>
          <Badge v-if="isDefault" :value="$t('default')" />
        </div>
        <p v-if="reference && reference !== title" class="text-wp-text-alt-100 mt-1 font-mono text-xs">
          {{ reference }}
        </p>
        <p class="text-wp-text-alt-100 mt-2 text-xs leading-5">{{ description }}</p>
      </div>
    </section>

    <section class="grid gap-3 md:grid-cols-3" :aria-label="$t('repo.repository_refs.detail.summary')">
      <article class="summary-card" data-testid="history-count">
        <span>{{ $t('repo.repository_refs.detail.loaded_history') }}</span>
        <strong>{{ $t('repo.repository_refs.detail.run_count', { count: pipelines.length }) }}</strong>
      </article>
      <article class="summary-card" data-testid="latest-status">
        <span>{{ $t('repo.repository_refs.detail.latest_result') }}</span>
        <div v-if="latestPipeline" class="mt-3 flex items-center gap-2">
          <PipelineStatusIcon :status="latestPipeline.status" />
          <strong class="mt-0! text-base!">{{ statusLabel }}</strong>
        </div>
        <strong v-else>{{ $t('repo.repository_refs.common.not_available') }}</strong>
      </article>
      <article class="summary-card" data-testid="latest-commit">
        <span>{{ $t('repo.repository_refs.detail.latest_commit') }}</span>
        <strong class="font-mono text-base!">{{
          latestPipeline?.commit.slice(0, 10) || $t('repo.repository_refs.common.not_available')
        }}</strong>
      </article>
    </section>

    <section class="history-card">
      <div class="history-heading">
        <div>
          <h2>{{ $t('repo.repository_refs.detail.pipeline_history') }}</h2>
          <p>{{ $t('repo.repository_refs.detail.pipeline_history_description') }}</p>
        </div>
      </div>
      <div class="pipeline-history-scroll p-4">
        <PipelineList :pipelines="orderedPipelines" />
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Badge from '~/components/atomic/Badge.vue';
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import PipelineList from '~/components/repo/pipeline/PipelineList.vue';
import PipelineStatusIcon from '~/components/repo/pipeline/PipelineStatusIcon.vue';
import type { Pipeline, PipelineStatus } from '~/lib/api/types';

const props = withDefaults(
  defineProps<{
    kind: 'branch' | 'pull-request';
    title: string;
    reference?: string;
    pipelines: Pipeline[];
    isDefault?: boolean;
  }>(),
  {
    reference: undefined,
    isDefault: false,
  },
);

const { t } = useI18n();

const orderedPipelines = computed(() => props.pipelines.toSorted((a, b) => b.number - a.number));
const latestPipeline = computed(() => orderedPipelines.value[0]);
const eyebrow = computed(() =>
  props.kind === 'branch'
    ? t('repo.repository_refs.branches.detail_eyebrow')
    : t('repo.repository_refs.pull_requests.detail_eyebrow'),
);
const description = computed(() =>
  props.kind === 'branch'
    ? t('repo.repository_refs.branches.detail_description')
    : t('repo.repository_refs.pull_requests.detail_description'),
);
const statusDescriptions = {
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
} satisfies Record<PipelineStatus, string>;
const statusLabel = computed(() =>
  latestPipeline.value
    ? statusDescriptions[latestPipeline.value.status]
    : t('repo.repository_refs.common.not_available'),
);
</script>

<style scoped>
@reference '~/tailwind.css';

.reference-header {
  @apply border-wp-border-100 bg-wp-background-300 flex min-w-0 items-start gap-4 rounded-xl border p-4 shadow-sm md:p-5;
}

.reference-icon {
  @apply bg-wp-control-neutral-100 text-wp-primary-100 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl;
}

.summary-card {
  @apply border-wp-border-100 bg-wp-background-300 flex min-h-28 min-w-0 flex-col rounded-xl border p-4 shadow-sm;
}

.summary-card > span {
  @apply text-wp-text-alt-100 text-xs;
}

.summary-card > strong {
  @apply text-wp-text-200 mt-3 min-w-0 text-xl font-bold break-all;
}

.history-card {
  @apply border-wp-border-100 bg-wp-background-300 min-w-0 overflow-hidden rounded-xl border shadow-sm;
}

.history-heading {
  @apply border-wp-border-100 border-b px-4 py-3;
}

.history-heading h2 {
  @apply text-wp-text-200 text-sm font-bold;
}

.history-heading p {
  @apply text-wp-text-alt-100 mt-1 text-xs;
}

.pipeline-history-scroll {
  @apply min-w-0 overflow-x-auto;
}
</style>
