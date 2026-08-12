<template>
  <div class="admin-overview-page">
    <header class="admin-overview-header">
      <div class="min-w-0">
        <h1>{{ $t('admin.settings.surface.overview_title') }}</h1>
        <p>{{ $t('admin.settings.surface.overview_description') }}</p>
      </div>
    </header>

    <SettingsSection
      :title="$t('admin.settings.surface.version_title')"
      :description="$t('admin.settings.surface.version_description')"
    >
      <div class="version-panel">
        <WoodpeckerLogo class="fill-wp-text-200 h-16 w-16 shrink-0" />
        <div class="min-w-0">
          <i18n-t keypath="running_version" tag="p" class="text-wp-text-200 text-base">
            <span class="font-mono font-bold">{{ version?.current }}</span>
          </i18n-t>
          <p class="text-wp-text-alt-100 mt-1 text-xs leading-5">
            {{ $t('admin.settings.surface.version_scope') }}
          </p>
        </div>
      </div>

      <div v-if="version?.needsUpdate" class="update-panel">
        <PrototypeIcon name="warning" />
        <i18n-t keypath="update_woodpecker" tag="span">
          <a
            v-if="!version.usesNext"
            :href="`https://github.com/woodpecker-ci/woodpecker/releases/tag/${version.latest}`"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold underline"
          >
            {{ version.latest }}
          </a>
          <span v-else class="font-semibold">{{ version.latest }}</span>
        </i18n-t>
      </div>
    </SettingsSection>

    <SettingsSection
      :title="$t('admin.settings.surface.destinations_title')"
      :description="$t('admin.settings.surface.destinations_description')"
    >
      <div class="destination-grid">
        <router-link
          v-for="item in destinations"
          :key="item.name"
          data-testid="admin-overview-link"
          :to="{ name: item.name }"
          class="destination-card"
        >
          <span class="destination-icon">
            <PrototypeIcon :name="item.icon" />
          </span>
          <span class="min-w-0">
            <strong>{{ item.label }}</strong>
            <span>{{ item.description }}</span>
          </span>
          <PrototypeIcon name="chevron-right" class="ml-auto shrink-0" />
        </router-link>
      </div>
    </SettingsSection>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import WoodpeckerLogo from '~/assets/logo.svg?component';
import type { IconNames } from '~/components/atomic/Icon.vue';
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import { useVersion } from '~/compositions/useVersion';
import { useWPTitle } from '~/compositions/useWPTitle';

const version = useVersion();
const { t } = useI18n();

const destinations = computed<{ name: string; icon: IconNames; label: string; description: string }[]>(() => [
  {
    name: 'admin-settings-repos',
    icon: 'repo',
    label: t('admin.settings.repos.repos'),
    description: t('admin.settings.repos.desc'),
  },
  {
    name: 'admin-settings-users',
    icon: 'user',
    label: t('admin.settings.users.users'),
    description: t('admin.settings.users.desc'),
  },
  {
    name: 'admin-settings-orgs',
    icon: 'org',
    label: t('admin.settings.orgs.orgs'),
    description: t('admin.settings.orgs.desc'),
  },
  {
    name: 'admin-settings-agents',
    icon: 'agent',
    label: t('admin.settings.agents.agents'),
    description: t('admin.settings.agents.desc'),
  },
  {
    name: 'admin-settings-queue',
    icon: 'tray-full',
    label: t('admin.settings.queue.queue'),
    description: t('admin.settings.queue.desc'),
  },
  {
    name: 'admin-settings-forges',
    icon: 'forge',
    label: t('forges'),
    description: t('forges_desc'),
  },
]);

useWPTitle(computed(() => [t('info'), t('admin.settings.settings')]));
</script>

<style scoped>
@reference '~/tailwind.css';

.admin-overview-page {
  @apply flex min-w-0 flex-col gap-4;
}

.admin-overview-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.admin-overview-header p {
  @apply text-wp-text-alt-100 mt-1 max-w-3xl text-xs leading-5;
}

.version-panel {
  @apply flex min-w-0 items-center gap-4;
}

.update-panel {
  @apply border-wp-state-warn-100/35 bg-wp-state-warn-100/5 text-wp-text-100 mt-4 flex items-center gap-3 rounded-lg border px-3.5 py-3 text-xs;
}

.update-panel :deep(svg) {
  @apply text-wp-state-warn-100 h-5 w-5 shrink-0;
}

.destination-grid {
  @apply grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2;
}

.destination-card {
  @apply border-wp-border-100 hover:border-wp-primary-100/50 hover:bg-wp-control-neutral-100 flex min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors;
}

.destination-icon {
  @apply bg-wp-primary-100/10 text-wp-primary-100 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg;
}

.destination-card strong {
  @apply text-wp-text-200 block text-xs font-bold;
}

.destination-card span span {
  @apply text-wp-text-alt-100 mt-1 line-clamp-2 block text-[11px] leading-4;
}
</style>
