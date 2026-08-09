<template>
  <article class="metric-panel">
    <div class="metric-panel-head">
      <div>
        <span>{{ label }}</span>
        <strong>{{ displayValue }}</strong>
        <small v-if="threshold !== undefined">{{ thresholdLabel }} {{ thresholdValue }}</small>
      </div>
      <span class="metric-icon"><Icon :name="icon" /></span>
    </div>
    <div class="metric-panel-chart" :class="toneClass">
      <OpsSparkline :values="values" :label="label" :max="chartMax" />
    </div>
    <div class="metric-panel-stats">
      <span>{{ minLabel }} {{ formatValue(minimum) }}</span>
      <span>{{ avgLabel }} {{ formatValue(average) }}</span>
      <span>{{ maxLabel }} {{ formatValue(maximum) }}</span>
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
    value: number;
    values?: number[];
    icon: IconNames;
    unit?: string;
    threshold?: number;
    thresholdLabel?: string;
    minLabel?: string;
    avgLabel?: string;
    maxLabel?: string;
  }>(),
  {
    values: () => [],
    unit: '%',
    threshold: undefined,
    thresholdLabel: '告警阈值',
    minLabel: '最小',
    avgLabel: '平均',
    maxLabel: '最大',
  },
);

const samples = computed(() => (props.values.length > 0 ? props.values : [props.value]));
const minimum = computed(() => Math.min(...samples.value));
const maximum = computed(() => Math.max(...samples.value));
const average = computed(() => samples.value.reduce((sum, value) => sum + value, 0) / samples.value.length);
const chartMax = computed(() => (props.unit === '%' ? 100 : Math.max(100, maximum.value * 1.15)));
const displayValue = computed(() => formatValue(props.value));
const thresholdValue = computed(() => formatValue(props.threshold ?? 0));
const toneClass = computed(() =>
  props.value >= 85 ? 'tone-danger' : props.value >= 70 ? 'tone-warning' : 'tone-success',
);

function formatValue(value: number): string {
  return `${value.toFixed(props.unit === '%' ? 0 : 1)}${props.unit}`;
}
</script>

<style scoped>
@reference '~/tailwind.css';

.metric-panel {
  @apply border-wp-border-100 bg-wp-background-300 overflow-hidden rounded-xl border p-4 shadow-sm;
}

.metric-panel-head {
  @apply flex items-start justify-between gap-4;
}

.metric-panel-head span,
.metric-panel-head strong,
.metric-panel-head small {
  @apply block;
}

.metric-panel-head > div > span {
  @apply text-wp-text-alt-100 text-[11px];
}

.metric-panel-head strong {
  @apply text-wp-text-200 mt-2 text-3xl tracking-[-0.04em];
}

.metric-panel-head small {
  @apply text-wp-text-alt-100 mt-1 text-[9px];
}

.metric-icon {
  @apply bg-wp-primary-100/10 text-wp-primary-100 flex h-9 w-9 items-center justify-center rounded-lg;
}

.metric-panel-chart {
  @apply mt-3 h-40;
}

.metric-panel-stats {
  @apply text-wp-text-alt-100 mt-1 flex justify-between text-[9px];
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
</style>
