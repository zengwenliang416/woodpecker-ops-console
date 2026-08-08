<template>
  <span
    class="bg-wp-control-neutral-200 text-wp-text-100 dark:bg-wp-background-100 inline-block min-w-5.5 rounded-full px-2 py-0.5 text-center text-xs leading-4 font-bold"
  >
    {{ value }}
  </span>
</template>

<script lang="ts" setup>
defineProps<{
  value?: string | number;
}>();
</script>
