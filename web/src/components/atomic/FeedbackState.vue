<template>
  <section
    class="feedback-state"
    :class="[`feedback-state-${kind}`, { 'feedback-state-compact': compact }]"
    :data-feedback-state="kind"
    :role="semanticRole"
    :aria-live="liveMode"
    :aria-busy="kind === 'loading' || undefined"
  >
    <span class="feedback-state-icon" aria-hidden="true">
      <PrototypeIcon :name="iconName" :class="{ 'animate-spin': kind === 'loading' }" />
    </span>
    <span class="feedback-state-copy">
      <strong>{{ title }}</strong>
      <span v-if="description">{{ description }}</span>
    </span>
    <span v-if="$slots.action" class="feedback-state-action">
      <slot name="action" />
    </span>
  </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import type { IconNames } from '~/components/atomic/Icon.vue';

type FeedbackStateKind = 'loading' | 'empty' | 'error' | 'permission' | 'disabled' | 'stale';

const props = defineProps<{
  kind: FeedbackStateKind;
  title: string;
  description?: string;
  compact?: boolean;
}>();

const iconName = computed<IconNames>(
  () =>
    ({
      loading: 'refresh',
      empty: 'list',
      error: 'alert',
      permission: 'visibility-private',
      disabled: 'pause',
      stale: 'warning',
    })[props.kind] as IconNames,
);

const semanticRole = computed(() => {
  if (props.kind === 'error') {
    return 'alert';
  }
  if (props.kind === 'loading' || props.kind === 'stale') {
    return 'status';
  }
  return undefined;
});

const liveMode = computed(() => {
  if (props.kind === 'error') {
    return 'assertive';
  }
  if (props.kind === 'loading' || props.kind === 'stale') {
    return 'polite';
  }
  return undefined;
});
</script>

<style scoped>
@reference '~/tailwind.css';

.feedback-state {
  @apply border-wp-border-100 bg-wp-background-300 text-wp-text-alt-100 flex min-h-40 w-full flex-col items-center justify-center gap-3 rounded-xl border px-6 py-10 text-center shadow-sm;
}

.feedback-state-icon {
  @apply bg-wp-control-neutral-100 text-wp-text-alt-100 flex h-11 w-11 items-center justify-center rounded-xl;
}

.feedback-state-copy {
  @apply flex max-w-xl flex-col gap-1.5;
}

.feedback-state-copy strong {
  @apply text-wp-text-200 text-sm font-bold;
}

.feedback-state-copy > span {
  @apply text-xs leading-5;
}

.feedback-state-action {
  @apply mt-1 flex flex-wrap justify-center gap-2;
}

.feedback-state-error {
  @apply border-wp-error-100/35 bg-wp-error-100/5;
}

.feedback-state-error .feedback-state-icon {
  @apply bg-wp-error-100/10 text-wp-error-100;
}

.feedback-state-permission,
.feedback-state-disabled {
  @apply border-wp-state-info-100/30 bg-wp-state-info-100/5;
}

.feedback-state-permission .feedback-state-icon,
.feedback-state-disabled .feedback-state-icon {
  @apply bg-wp-state-info-100/10 text-wp-state-info-100;
}

.feedback-state-stale {
  @apply border-wp-state-warn-100/35 bg-wp-state-warn-100/5;
}

.feedback-state-stale .feedback-state-icon {
  @apply bg-wp-state-warn-100/10 text-wp-state-warn-100;
}

.feedback-state-compact {
  @apply min-h-0 flex-row justify-start gap-3 rounded-lg px-3.5 py-3 text-left;
}

.feedback-state-compact .feedback-state-icon {
  @apply h-9 w-9 shrink-0 rounded-lg;
}

.feedback-state-compact .feedback-state-copy {
  @apply min-w-0 flex-1;
}

.feedback-state-compact .feedback-state-action {
  @apply mt-0 ml-auto shrink-0;
}
</style>
