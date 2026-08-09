<template>
  <article class="ops-metric-card">
    <div class="metric-copy">
      <div class="metric-label">
        <Icon :name="icon" />
        <span>{{ label }}</span>
      </div>
      <strong>{{ value }}</strong>
      <span v-if="hint" class="metric-hint" :class="toneClass">{{ hint }}</span>
    </div>
    <div v-if="chartValues.length > 1" class="metric-chart" :class="toneClass">
      <OpsSparkline :values="chartValues" :label="label" :max="chartMax" />
    </div>
  </article>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import type { IconNames } from '~/components/atomic/Icon.vue';
import Icon from '~/components/ops/PrototypeIcon.vue';

import OpsSparkline from './OpsSparkline.vue';

const props = withDefaults(
  defineProps<{
    label: string;
    value: string;
    hint?: string;
    icon: IconNames;
    chartValues?: number[];
    chartMax?: number;
    tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  }>(),
  {
    hint: undefined,
    chartValues: () => [],
    chartMax: 100,
    tone: 'success',
  },
);

const toneClass = computed(() => `tone-${props.tone}`);
</script>

<style scoped>
@reference '~/tailwind.css';

.ops-metric-card {
  @apply border-wp-border-100 bg-wp-background-300 flex min-h-32 items-stretch justify-between gap-4 overflow-hidden rounded-xl border p-4 shadow-sm;
}

.metric-copy {
  @apply flex min-w-0 flex-col;
}

.metric-label {
  @apply text-wp-text-100 flex items-center gap-2 text-xs;
}

.metric-label :deep(svg) {
  @apply h-4.5 w-4.5;
}

.metric-copy strong {
  @apply text-wp-text-200 mt-5 text-3xl leading-none font-bold tracking-[-0.04em];
}

.metric-hint {
  @apply mt-2 text-[11px] font-semibold;
}

.metric-chart {
  @apply h-20 w-32 self-end;
}

.tone-success {
  @apply text-wp-state-ok-100;
}

.tone-warning {
  @apply text-wp-state-warn-100;
}

.tone-danger {
  @apply text-wp-error-100;
}

.tone-info {
  @apply text-wp-state-info-100;
}

.tone-neutral {
  @apply text-wp-text-alt-100;
}
</style>
