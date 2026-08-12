<template>
  <section class="settings-section" :class="{ 'settings-section-danger': danger }">
    <header class="settings-section-header">
      <div class="min-w-0">
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="settings-section-actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="settings-section-body">
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

.settings-section {
  @apply border-wp-border-100 bg-wp-background-300 overflow-hidden rounded-xl border shadow-sm;
}

.settings-section-header {
  @apply border-wp-border-100 flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between;
}

.settings-section-header h2 {
  @apply text-wp-text-200 text-sm font-bold;
}

.settings-section-header p {
  @apply text-wp-text-alt-100 mt-1 text-xs leading-5;
}

.settings-section-actions {
  @apply flex shrink-0 flex-wrap gap-2;
}

.settings-section-body {
  @apply p-4;
}

.settings-section-danger {
  @apply border-wp-error-100/40;
}

.settings-section-danger .settings-section-header {
  @apply border-wp-error-100/25 bg-wp-error-100/5;
}

.settings-section-danger .settings-section-header h2 {
  @apply text-wp-error-100;
}
</style>
