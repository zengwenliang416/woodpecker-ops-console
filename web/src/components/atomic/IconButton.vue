<template>
  <router-link
    v-if="to && !interactiveDisabled"
    :to="to"
    :title="title"
    :aria-label="title"
    class="icon-button"
    :class="sizeClasses"
  >
    <slot>
      <Icon v-if="icon" :name="icon" />
    </slot>
  </router-link>
  <a
    v-else-if="href && !interactiveDisabled"
    :href="href"
    :title="title"
    :aria-label="title"
    class="icon-button"
    :class="sizeClasses"
    target="_blank"
    rel="noopener noreferrer"
  >
    <slot>
      <Icon v-if="icon" :name="icon" />
    </slot>
  </a>
  <button
    v-else
    :disabled="interactiveDisabled"
    :aria-disabled="interactiveDisabled || undefined"
    :aria-busy="isLoading || undefined"
    class="icon-button"
    :class="sizeClasses"
    type="button"
    :title="title"
    :aria-label="title"
  >
    <slot>
      <Icon v-if="icon" :name="icon" />
    </slot>
    <div v-if="isLoading" class="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center">
      <Icon name="spinner" class="animate-spin" />
    </div>
  </button>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import Icon from '~/components/ops/PrototypeIcon.vue';
import type { IconNames } from '~/components/atomic/Icon.vue';

const props = withDefaults(
  defineProps<{
    icon?: IconNames;
    disabled?: boolean;
    to?: RouteLocationRaw;
    isLoading?: boolean;
    title?: string;
    href?: string;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  {
    size: 'md',
  },
);

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-7.5 w-7.5';
    case 'lg':
      return 'h-10 w-10';
    default:
      return 'h-9 w-9';
  }
});

const interactiveDisabled = computed(() => props.disabled || props.isLoading);
</script>

<style scoped>
@reference '~/tailwind.css';

.icon-button {
  @apply hover:bg-wp-control-neutral-200 dark:hover:bg-wp-control-neutral-100 relative flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-transparent px-1 py-1 transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50;
  @apply in-[.border-wp-background-400]:hover:bg-wp-control-neutral-200;
}
</style>
