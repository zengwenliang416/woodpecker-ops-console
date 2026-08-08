<template>
  <header class="topbar">
    <IconButton class="md:hidden!" icon="menu" :title="$t('ops.sidebar.open')" @click="$emit('openSidebar')" />
    <button class="global-search" type="button" @click="notifySearch">
      <Icon name="search" class="h-4.5 w-4.5" />
      <span>{{ $t('ops.topbar.search_placeholder') }}</span>
      <kbd>{{ $t('ops.topbar.search_shortcut') }}</kbd>
    </button>
    <div class="topbar-spacer" />
    <IconButton :title="$t('ops.topbar.theme')" @click="toggleTheme">
      <Icon :name="isDark ? 'sun' : 'moon'" />
    </IconButton>
    <IconButton
      v-if="user?.admin"
      class="relative"
      :title="$t('settings')"
      :to="{ name: 'admin-settings' }"
    >
      <Icon name="settings" />
      <div v-if="version?.needsUpdate" class="bg-wp-error-100 absolute top-2 right-2 h-3 w-3 rounded-full" />
    </IconButton>
    <ActivePipelines v-if="user" class="topbar-icon p-1.5!" />
    <IconButton v-if="user" :to="{ name: 'user' }" :title="$t('user.settings.settings')" class="topbar-icon p-1.5!">
      <img v-if="user.avatar_url" class="rounded-md" :src="user.avatar_url" />
    </IconButton>
    <Button
      v-else
      :text="$t('login')"
      :to="{ name: 'login' }"
      class="topbar-link !border-transparent bg-wp-primary-100 text-white"
      @click="saveRedirect"
    />
  </header>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import Icon from '~/components/atomic/Icon.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import useAuthentication from '~/compositions/useAuthentication';
import useNotifications from '~/compositions/useNotifications';
import { useTheme } from '~/compositions/useTheme';
import useUserConfig from '~/compositions/useUserConfig';
import { useVersion } from '~/compositions/useVersion';

import ActivePipelines from './ActivePipelines.vue';

defineEmits<{
  (event: 'openSidebar'): void;
}>();

const version = useVersion();
const userConfig = useUserConfig();
const route = useRoute();
const authentication = useAuthentication();
const { user } = authentication;
const { notify } = useNotifications();
const { theme, storeTheme } = useTheme();

const isDark = computed(() => theme.value === 'dark');

function toggleTheme() {
  storeTheme.value = isDark.value ? 'light' : 'dark';
}

function saveRedirect() {
  userConfig.setUserConfig('redirectUrl', route.fullPath);
}

function notifySearch() {
  notify({ title: 'Command palette', text: '⌘K 命令面板将在后续阶段接入（Phase 2）', type: 'info' });
}

</script>
<style scoped>
@reference '~/tailwind.css';

.topbar {
  @apply border-wp-border-100 dark:border-wp-background-100 sticky top-0 z-24 flex items-center gap-4 px-5;
  height: var(--wp-topbar-h);
  border-bottom-width: 1px;
  background: var(--wp-background-400);
  backdrop-filter: blur(16px);
}

.global-search {
  @apply text-wp-text-alt-100 border-wp-border-100 dark:border-wp-background-100 hover:border-wp-border-200 hover:bg-wp-control-neutral-200 dark:hover:bg-wp-control-neutral-100 flex h-9.5 min-w-0 items-center gap-2.5 rounded-lg border bg-wp-control-neutral-100 px-3 text-[13px] transition-colors duration-150;
  width: min(590px, 52vw);
}

.global-search kbd {
  @apply text-wp-text-alt-100 border-wp-border-100 dark:border-wp-background-100 border-b-2 ml-auto rounded-md bg-wp-control-neutral-200 px-1.5 py-0.5 font-sans text-[11px];
}

.topbar-spacer {
  @apply flex-1;
}

.topbar-icon {
  @apply hover:bg-wp-control-neutral-200 dark:hover:bg-wp-control-neutral-100;
}

.topbar-link {
  @apply text-wp-primary-text-100;
}
</style>
