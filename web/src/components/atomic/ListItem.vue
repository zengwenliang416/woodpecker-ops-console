<template>
  <component
    :is="to ? 'router-link' : clickable ? 'button' : 'div'"
    :to="to"
    class="border-wp-border-100 dark:border-wp-background-100 bg-wp-background-200 dark:bg-wp-background-200 flex w-full overflow-hidden rounded-lg border p-4 transition-colors duration-150"
    :class="{
      'hover:border-wp-border-200 hover:bg-wp-control-neutral-100 dark:hover:bg-wp-control-neutral-200 cursor-pointer': clickable || to,
    }"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router';

defineProps<{
  clickable?: boolean;
  to?: RouteLocationRaw;
}>();
</script>
