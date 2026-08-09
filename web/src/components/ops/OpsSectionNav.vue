<template>
  <nav class="ops-section-nav" :aria-label="label">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="ops-section-link"
      :class="{ active: isActive(item) }"
    >
      <Icon :name="item.icon" />
      <span>{{ item.label }}</span>
      <span v-if="item.count !== undefined" class="ops-section-count">{{ item.count }}</span>
    </router-link>
  </nav>
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';

import type { IconNames } from '~/components/atomic/Icon.vue';
import Icon from '~/components/ops/PrototypeIcon.vue';

export interface OpsNavItem {
  to: string;
  label: string;
  icon: IconNames;
  count?: number;
  exact?: boolean;
}

defineProps<{
  label: string;
  items: OpsNavItem[];
}>();

const route = useRoute();

function isActive(item: OpsNavItem): boolean {
  if (item.exact) {
    return route.path === item.to;
  }
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}
</script>

<style scoped>
@reference '~/tailwind.css';

.ops-section-nav {
  @apply border-wp-border-100 flex min-w-0 gap-1 overflow-x-auto border-b;
  scrollbar-width: none;
}

.ops-section-nav::-webkit-scrollbar {
  display: none;
}

.ops-section-link {
  @apply text-wp-text-100 relative flex shrink-0 items-center gap-2 px-3 py-3 text-xs font-semibold transition-colors;
}

.ops-section-link::after {
  content: '';
  @apply bg-wp-primary-100 absolute right-2 bottom-0 left-2 h-0.5 origin-center scale-x-0 rounded-full transition-transform;
}

.ops-section-link:hover,
.ops-section-link.active {
  @apply text-wp-primary-100;
}

.ops-section-link.active::after {
  @apply scale-x-100;
}

.ops-section-link :deep(svg) {
  @apply h-4.5 w-4.5;
}

.ops-section-count {
  @apply bg-wp-background-100 text-wp-text-alt-100 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px];
}
</style>
