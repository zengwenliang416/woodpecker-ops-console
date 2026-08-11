<template>
  <nav class="repo-settings-nav" :aria-label="$t('repo.settings_surface.navigation_label')">
    <router-link
      v-for="item in items"
      :key="item.name"
      :to="{ name: item.name }"
      class="repo-settings-nav-item"
      :class="{ 'repo-settings-nav-item-active': route.name === item.name }"
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

import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import type { IconNames } from '~/components/atomic/Icon.vue';

interface SettingsNavItem {
  name: string;
  icon: IconNames;
  label: string;
}

const { t } = useI18n();
const route = useRoute();

const items = computed<SettingsNavItem[]>(() => [
  { name: 'repo-settings', icon: 'settings-outline', label: t('repo.settings.general.general') },
  { name: 'repo-settings-secrets', icon: 'secret', label: t('secrets.secrets') },
  { name: 'repo-settings-registries', icon: 'docker', label: t('registries.registries') },
  { name: 'repo-settings-crons', icon: 'cron', label: t('repo.settings.crons.crons') },
  { name: 'repo-settings-badge', icon: 'tag', label: t('repo.settings.badge.badge') },
  { name: 'repo-settings-extensions', icon: 'puzzle', label: t('extensions') },
  { name: 'repo-settings-actions', icon: 'toolbox', label: t('repo.settings.actions.actions') },
]);
</script>

<style scoped>
@reference '~/tailwind.css';

.repo-settings-nav {
  @apply border-wp-border-100 bg-wp-background-300 flex gap-1 overflow-x-auto rounded-xl border p-2 shadow-sm lg:sticky lg:top-20 lg:flex-col lg:self-start lg:overflow-visible;
  scrollbar-width: thin;
}

.repo-settings-nav-item {
  @apply text-wp-text-alt-100 hover:bg-wp-control-neutral-100 hover:text-wp-text-200 flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors;
}

.repo-settings-nav-item :deep(svg) {
  @apply h-4.5 w-4.5;
}

.repo-settings-nav-item-active {
  @apply bg-wp-primary-100/10 text-wp-primary-100;
}
</style>
