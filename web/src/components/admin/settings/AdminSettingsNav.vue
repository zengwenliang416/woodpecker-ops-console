<template>
  <nav class="admin-settings-nav" :aria-label="$t('admin.settings.surface.navigation_label')">
    <router-link
      v-for="item in items"
      :key="item.name"
      :to="{ name: item.name }"
      class="admin-settings-nav-item"
      :class="{ 'admin-settings-nav-item-active': isActive(item) }"
    >
      <PrototypeIcon :name="item.icon" />
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import type { IconNames } from '~/components/atomic/Icon.vue';
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';

interface NavigationItem {
  name: string;
  icon: IconNames;
  label: string;
  activeNames?: string[];
}

const { t } = useI18n();
const route = useRoute();

const items = computed<NavigationItem[]>(() => [
  { name: 'admin-settings', icon: 'info', label: t('info') },
  { name: 'admin-settings-secrets', icon: 'secret', label: t('secrets.secrets') },
  { name: 'admin-settings-registries', icon: 'docker', label: t('registries.registries') },
  { name: 'admin-settings-repos', icon: 'repo', label: t('admin.settings.repos.repos') },
  { name: 'admin-settings-users', icon: 'user', label: t('admin.settings.users.users') },
  { name: 'admin-settings-orgs', icon: 'org', label: t('admin.settings.orgs.orgs') },
  { name: 'admin-settings-agents', icon: 'agent', label: t('admin.settings.agents.agents') },
  { name: 'admin-settings-queue', icon: 'tray-full', label: t('admin.settings.queue.queue') },
  {
    name: 'admin-settings-forges',
    icon: 'forge',
    label: t('forges'),
    activeNames: ['admin-settings-forges', 'admin-settings-forge', 'admin-settings-forge-create'],
  },
]);

function isActive(item: NavigationItem) {
  return (item.activeNames ?? [item.name]).includes(route.name?.toString() ?? '');
}
</script>

<style scoped>
@reference '~/tailwind.css';

.admin-settings-nav {
  @apply border-wp-border-100 bg-wp-background-300 flex min-w-0 gap-1 overflow-x-auto rounded-xl border p-2 shadow-sm lg:flex-wrap lg:overflow-visible;
  scrollbar-width: thin;
}

.admin-settings-nav-item {
  @apply text-wp-text-alt-100 hover:bg-wp-control-neutral-100 hover:text-wp-text-200 flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors;
}

.admin-settings-nav-item :deep(svg) {
  @apply h-4.5 w-4.5;
}

.admin-settings-nav-item-active {
  @apply bg-wp-primary-100/10 text-wp-primary-100;
}
</style>
