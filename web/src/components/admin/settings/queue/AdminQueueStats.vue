<template>
  <div v-if="stats" class="queue-stats">
    <div class="queue-completed">
      <span>{{ $t('admin.settings.queue.stats.completed_count') }}</span>
      <strong>{{ stats.completed_count }}</strong>
    </div>

    <div v-if="total > 0" class="queue-distribution" aria-hidden="true">
      <span v-for="item in data" :key="item.key" :class="item.color" :style="{ width: `${item.percentage}%` }" />
    </div>

    <div class="queue-stat-grid">
      <div v-for="item in data" :key="item.key" class="queue-stat">
        <span class="queue-stat-label">
          <i :class="item.color" aria-hidden="true" />
          {{ item.label }}
        </span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { QueueStats } from '~/lib/api/types/queue';

const props = defineProps<{
  stats?: QueueStats;
}>();

const { t } = useI18n();

const total = computed(() => {
  if (!props.stats) {
    return 0;
  }

  return (
    props.stats.worker_count + props.stats.running_count + props.stats.pending_count + props.stats.waiting_on_deps_count
  );
});

const data = computed(() => {
  if (!props.stats) {
    return [];
  }

  return [
    {
      key: 'worker_count',
      label: t('admin.settings.queue.stats.worker_count'),
      value: props.stats.worker_count,
      percentage: total.value > 0 ? (props.stats.worker_count / total.value) * 100 : 0,
      color: 'bg-wp-state-ok-100',
    },
    {
      key: 'running_count',
      label: t('admin.settings.queue.stats.running_count'),
      value: props.stats.running_count,
      percentage: total.value > 0 ? (props.stats.running_count / total.value) * 100 : 0,
      color: 'bg-wp-state-info-100',
    },
    {
      key: 'pending_count',
      label: t('admin.settings.queue.stats.pending_count'),
      value: props.stats.pending_count,
      percentage: total.value > 0 ? (props.stats.pending_count / total.value) * 100 : 0,
      color: 'bg-wp-state-neutral-100',
    },
    {
      key: 'waiting_on_deps_count',
      label: t('admin.settings.queue.stats.waiting_on_deps_count'),
      value: props.stats.waiting_on_deps_count,
      percentage: total.value > 0 ? (props.stats.waiting_on_deps_count / total.value) * 100 : 0,
      color: 'bg-wp-error-100 dark:bg-wp-error-200',
    },
  ];
});
</script>

<style scoped>
@reference '~/tailwind.css';

.queue-stats {
  @apply flex min-w-0 flex-col gap-4;
}

.queue-completed {
  @apply border-wp-border-100 bg-wp-background-200 flex min-w-0 items-end justify-between gap-3 rounded-lg border px-4 py-3;
}

.queue-completed span {
  @apply text-wp-text-alt-100 min-w-0 text-xs font-semibold;
}

.queue-completed strong {
  @apply text-wp-text-200 shrink-0 text-2xl font-bold;
}

.queue-distribution {
  @apply flex h-2 w-full min-w-0 overflow-hidden rounded-full;
}

.queue-distribution span {
  @apply h-full;
}

.queue-stat-grid {
  @apply grid min-w-0 grid-cols-2 gap-2 lg:grid-cols-4;
}

.queue-stat {
  @apply border-wp-border-100 bg-wp-background-200 flex min-w-0 flex-col gap-1 rounded-lg border px-3 py-2.5;
}

.queue-stat-label {
  @apply text-wp-text-alt-100 flex min-w-0 items-center gap-1.5 truncate text-[11px];
}

.queue-stat-label i {
  @apply h-2 w-2 shrink-0 rounded-full;
}

.queue-stat strong {
  @apply text-wp-text-200 text-lg font-bold;
}
</style>
