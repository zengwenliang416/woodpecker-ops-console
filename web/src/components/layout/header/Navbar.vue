<template>
  <header class="topbar">
    <IconButton
      class="md:hidden!"
      icon="menu"
      :title="$t('ops.sidebar.open')"
      :aria-expanded="sidebarOpen"
      aria-controls="app-sidebar"
      @click="emitOpenSidebar"
    />
    <button class="global-search" type="button" @click="notifySearch">
      <Icon name="search" class="h-4.5 w-4.5" />
      <span>{{ $t('ops.topbar.search_placeholder') }}</span>
      <kbd>{{ $t('ops.topbar.search_shortcut') }}</kbd>
    </button>
    <div class="topbar-spacer" />
    <label class="locale-switcher">
      <span class="sr-only">{{ $t('ops.topbar.language') }}</span>
      <select v-model="selectedLocale" :aria-label="$t('ops.topbar.language')">
        <option v-for="option in localeOptions" :key="option.value" :value="option.value">
          {{ option.text }}
        </option>
      </select>
    </label>
    <IconButton :title="$t('ops.topbar.theme')" @click="toggleTheme">
      <Icon :name="isDark ? 'sun' : 'moon'" />
    </IconButton>
    <IconButton v-if="user?.admin" class="relative" :title="$t('settings')" :to="{ name: 'admin-settings' }">
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
      class="topbar-link bg-wp-primary-100 !border-transparent text-white"
      @click="saveRedirect"
    />
  </header>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core';
import { SUPPORTED_LOCALES } from 'virtual:vue-i18n-supported-locales';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import Icon from '~/components/ops/PrototypeIcon.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import useAuthentication from '~/compositions/useAuthentication';
import { setI18nLanguage } from '~/compositions/useI18n';
import useNotifications from '~/compositions/useNotifications';
import { useTheme } from '~/compositions/useTheme';
import useUserConfig from '~/compositions/useUserConfig';
import { useVersion } from '~/compositions/useVersion';

import ActivePipelines from './ActivePipelines.vue';

defineProps<{
  sidebarOpen?: boolean;
}>();

const emit = defineEmits<{
  (event: 'openSidebar', trigger: HTMLElement | null): void;
}>();

const version = useVersion();
const userConfig = useUserConfig();
const route = useRoute();
const authentication = useAuthentication();
const { user } = authentication;
const { notify } = useNotifications();
const { theme, storeTheme } = useTheme();
const { locale, t } = useI18n();

const isDark = computed(() => theme.value === 'dark');
const storedLocale = useStorage('woodpecker:locale', locale.value);
const localeOptions = computed(() => {
  const displayNames = new Intl.DisplayNames(locale.value, { type: 'language' });
  return SUPPORTED_LOCALES.map((supportedLocale) => ({
    value: supportedLocale,
    text: displayNames.of(supportedLocale) || supportedLocale,
  }));
});
const selectedLocale = computed<string>({
  get: () => storedLocale.value,
  async set(value) {
    await setI18nLanguage(value);
    storedLocale.value = value;
  },
});

function emitOpenSidebar(event: MouseEvent) {
  emit('openSidebar', event.currentTarget instanceof HTMLElement ? event.currentTarget : null);
}

function toggleTheme() {
  storeTheme.value = isDark.value ? 'light' : 'dark';
}

function saveRedirect() {
  userConfig.setUserConfig('redirectUrl', route.fullPath);
}

function notifySearch() {
  notify({
    title: t('ops.topbar.search_unavailable_title'),
    text: t('ops.topbar.search_unavailable_text'),
    type: 'info',
  });
}
</script>
<style scoped>
@reference '~/tailwind.css';

.topbar {
  @apply border-wp-border-100 dark:border-wp-background-100 sticky top-0 z-24 flex shrink-0 items-center gap-4 px-[22px];
  height: var(--wp-topbar-h);
  border-bottom-width: 1px;
  background: var(--wp-background-400);
  backdrop-filter: blur(16px);
}

.global-search {
  @apply text-wp-text-alt-100 border-wp-border-100 dark:border-wp-background-100 hover:border-wp-border-200 hover:bg-wp-control-neutral-200 dark:hover:bg-wp-control-neutral-100 bg-wp-control-neutral-100 flex h-9.5 min-w-0 items-center gap-2.5 rounded-lg border px-3 text-[13px] transition-colors duration-150;
  width: min(590px, 52vw);
}

.global-search kbd {
  @apply text-wp-text-alt-100 border-wp-border-100 dark:border-wp-background-100 bg-wp-control-neutral-200 ml-auto rounded-md border-b-2 px-1.5 py-0.5 font-sans text-[11px];
}

.global-search span {
  @apply min-w-0 overflow-hidden text-ellipsis whitespace-nowrap;
}

.topbar-spacer {
  @apply flex-1;
}

.topbar-icon {
  @apply hover:bg-wp-control-neutral-200 dark:hover:bg-wp-control-neutral-100;
}

.locale-switcher {
  @apply border-wp-border-100 bg-wp-control-neutral-100 text-wp-text-100 inline-flex h-9.5 shrink-0 items-center rounded-lg border px-2;
}

.locale-switcher select {
  @apply bg-transparent text-xs outline-none;
}

.topbar-link {
  @apply text-wp-primary-text-100;
}

@media (max-width: 767px) {
  .topbar {
    @apply gap-1.5 overflow-hidden px-3;
  }

  .global-search {
    @apply flex-1 px-2;
    width: auto;
  }

  .global-search kbd,
  .topbar-spacer {
    display: none;
  }

  .locale-switcher {
    @apply px-1.5;
  }

  .locale-switcher select {
    max-width: 4.5rem;
  }
}
</style>
