<template>
  <div class="repo-settings-action-row">
    <div class="min-w-0">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
    <div class="repo-settings-action-control">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  title: string;
  description: string;
}>();
</script>

<style scoped>
@reference '~/tailwind.css';

.repo-settings-action-row {
  @apply border-wp-border-100 flex flex-col gap-3 border-b py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between;
}

.repo-settings-action-row h3 {
  @apply text-wp-text-200 text-sm font-semibold;
}

.repo-settings-action-row p {
  @apply text-wp-text-alt-100 mt-1 max-w-2xl text-xs leading-5;
}

.repo-settings-action-control {
  @apply flex shrink-0;
}
</style>
