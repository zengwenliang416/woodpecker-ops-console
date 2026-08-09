<template>
  <svg class="ops-sparkline" viewBox="0 0 240 80" preserveAspectRatio="none" role="img" :aria-label="label">
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="currentColor" stop-opacity="0.24" />
        <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path class="spark-grid" d="M0 40 H240 M0 79 H240" />
    <path v-if="points.length > 1" class="spark-area" :d="areaPath" :fill="`url(#${gradientId})`" />
    <polyline v-if="points.length > 1" class="spark-line" :points="polylinePoints" />
    <line v-else class="spark-empty" x1="0" y1="79" x2="240" y2="79" />
  </svg>
</template>

<script lang="ts" setup>
import { computed, useId } from 'vue';

const props = withDefaults(
  defineProps<{
    values?: number[];
    label: string;
    max?: number;
  }>(),
  {
    values: () => [],
    max: 100,
  },
);

const gradientId = `ops-spark-${useId().replaceAll(':', '')}`;
const points = computed(() => props.values.filter(Number.isFinite));

const normalizedPoints = computed(() => {
  if (points.value.length < 2) {
    return [];
  }
  const ceiling = Math.max(props.max, ...points.value, 1);
  return points.value.map((value, index) => {
    const x = (index / (points.value.length - 1)) * 240;
    const y = 76 - (Math.min(Math.max(value, 0), ceiling) / ceiling) * 68;
    return { x, y };
  });
});

const polylinePoints = computed(() =>
  normalizedPoints.value.map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '),
);
const areaPath = computed(() => {
  if (normalizedPoints.value.length < 2) {
    return '';
  }
  const line = normalizedPoints.value.map(({ x, y }) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ');
  return `M 0 80 L ${line} L 240 80 Z`;
});
</script>

<style scoped>
.ops-sparkline {
  width: 100%;
  height: 100%;
  overflow: visible;
  color: var(--wp-primary-100);
}

.spark-grid {
  fill: none;
  stroke: var(--wp-border);
  stroke-width: 0.7;
  opacity: 0.65;
}

.spark-area {
  stroke: none;
}

.spark-line,
.spark-empty {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.spark-empty {
  color: var(--wp-border-strong);
  stroke-dasharray: 4 5;
}
</style>
