<template>
  <div class="repo-settings-table-shell">
    <div class="repo-settings-table-scroll">
      <table :style="{ minWidth }">
        <thead>
          <slot name="head" />
        </thead>
        <tbody>
          <slot />
        </tbody>
      </table>
    </div>
    <footer v-if="$slots.footer" class="repo-settings-table-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    minWidth?: string;
  }>(),
  {
    minWidth: '640px',
  },
);
</script>

<style scoped>
@reference '~/tailwind.css';

.repo-settings-table-shell {
  @apply border-wp-border-100 min-w-0 overflow-hidden rounded-xl border;
}

.repo-settings-table-scroll {
  @apply max-w-full overflow-x-auto;
  contain: layout paint;
}

table {
  @apply w-full border-collapse text-left text-xs;
}

:deep(th) {
  @apply border-wp-border-100 bg-wp-background-200 text-wp-text-alt-100 border-b px-3.5 py-2.5 font-semibold whitespace-nowrap;
}

:deep(td) {
  @apply border-wp-border-100 text-wp-text-100 border-b px-3.5 py-3 align-middle;
}

:deep(tbody tr:last-child td) {
  @apply border-b-0;
}

:deep(tbody tr:hover td) {
  @apply bg-wp-control-neutral-100/60;
}

.repo-settings-table-footer {
  @apply border-wp-border-100 bg-wp-background-200 text-wp-text-alt-100 border-t px-3.5 py-2.5 text-xs;
}
</style>
