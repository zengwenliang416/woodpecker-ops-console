<template>
  <nav class="org-settings-nav" :aria-label="$t('org.settings.surface.navigation_label')">
    <router-link
      v-for="item in items"
      :key="item.name"
      :to="{ name: item.name, params: { orgId: route.params.orgId } }"
      class="org-settings-nav-item"
      :class="{ 'org-settings-nav-item-active': route.name === item.name }"
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

const props = defineProps<{
  showAgents: boolean;
}>();

const { t } = useI18n();
const route = useRoute();

const items = computed(() => {
  const result: { name: string; icon: IconNames; label: string }[] = [
    { name: 'org-settings-secrets', icon: 'secret', label: t('secrets.secrets') },
    { name: 'org-settings-registries', icon: 'docker', label: t('registries.registries') },
  ];

  if (props.showAgents) {
    result.push({
      name: 'org-settings-agents',
      icon: 'agent',
      label: t('admin.settings.agents.agents'),
    });
  }

  return result;
});
</script>

<style scoped>
@reference '~/tailwind.css';

.org-settings-nav {
  @apply border-wp-border-100 bg-wp-background-300 flex min-w-0 gap-1 overflow-x-auto rounded-xl border p-2 shadow-sm lg:flex-wrap lg:overflow-visible;
  scrollbar-width: thin;
}

.org-settings-nav-item {
  @apply text-wp-text-alt-100 hover:bg-wp-control-neutral-100 hover:text-wp-text-200 flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors;
}

.org-settings-nav-item :deep(svg) {
  @apply h-4.5 w-4.5;
}

.org-settings-nav-item-active {
  @apply bg-wp-primary-100/10 text-wp-primary-100;
}
</style>
