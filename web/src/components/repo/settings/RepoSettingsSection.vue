<template>
  <section class="repo-settings-section" :class="{ 'repo-settings-section-danger': danger }">
    <header class="repo-settings-section-header">
      <div class="min-w-0">
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="repo-settings-section-actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="repo-settings-section-body">
      <slot />
    </div>
  </section>
</template>

<script lang="ts" setup>
defineProps<{
  title: string;
  description?: string;
  danger?: boolean;
}>();
</script>

<style scoped>
@reference '~/tailwind.css';

.repo-settings-section {
  @apply border-wp-border-100 bg-wp-background-300 overflow-hidden rounded-xl border shadow-sm;
}

.repo-settings-section-header {
  @apply border-wp-border-100 flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between;
}

.repo-settings-section-header h2 {
  @apply text-wp-text-200 text-sm font-bold;
}

.repo-settings-section-header p {
  @apply text-wp-text-alt-100 mt-1 text-xs leading-5;
}

.repo-settings-section-actions {
  @apply flex shrink-0 flex-wrap gap-2;
}

.repo-settings-section-body {
  @apply p-4;
}

.repo-settings-section-danger {
  @apply border-wp-error-100/40;
}

.repo-settings-section-danger .repo-settings-section-header {
  @apply border-wp-error-100/25 bg-wp-error-100/5;
}

.repo-settings-section-danger .repo-settings-section-header h2 {
  @apply text-wp-error-100;
}
</style>
