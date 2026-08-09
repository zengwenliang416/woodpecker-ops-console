<template>
  <div class="app bg-wp-background-500 dark:bg-wp-background-500 m-auto flex h-full w-full flex-col">
    <router-view v-if="layout === 'blank'" />
    <template v-else>
      <div class="app-shell">
        <Sidebar :open="sidebarOpen" @close="closeSidebar" />
        <div v-if="sidebarOpen" class="drawer-backdrop md:hidden" aria-hidden="true" @click="closeSidebar" />
        <div ref="appMain" class="app-main">
          <Navbar :sidebar-open="sidebarOpen" @open-sidebar="openSidebar" />
          <main class="relative flex min-h-0 flex-1">
            <div id="scroll-component" class="flex grow flex-col overflow-y-auto">
              <router-view />
            </div>
            <transition name="slide-right">
              <PipelineFeedSidebar
                class="dark:shadow-wp-background-500 absolute top-0 right-0 bottom-0 w-full max-w-80 border-l shadow-lg xl:max-w-96"
              />
            </transition>
          </main>
        </div>
      </div>
    </template>
    <notifications position="bottom right" />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import Sidebar from '~/components/layout/header/Sidebar.vue';
import Navbar from '~/components/layout/header/Navbar.vue';
import PipelineFeedSidebar from '~/components/pipeline-feed/PipelineFeedSidebar.vue';
import useApiClient from '~/compositions/useApiClient';
import useNotifications from '~/compositions/useNotifications';

const route = useRoute();
const apiClient = useApiClient();
const { notify } = useNotifications();
const i18n = useI18n();

// eslint-disable-next-line promise/prefer-await-to-callbacks
apiClient.setErrorHandler((err) => {
  if (err.status === 404) {
    notify({ title: i18n.t('errors.not_found'), type: 'error' });
    return;
  }
  notify({ title: err.message || i18n.t('unknown_error'), type: 'error' });
});

const layout = computed(() => route.meta.layout ?? 'default');

const sidebarOpen = ref(false);
const appMain = ref<HTMLElement>();
let previousBodyOverflow: string | undefined;
let sidebarTrigger: HTMLElement | null = null;
let desktopMediaQuery: MediaQueryList | undefined;

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getSidebarElement() {
  return document.getElementById('app-sidebar');
}

function getSidebarFocusables() {
  return [...(getSidebarElement()?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])].filter(
    (element) => !element.hidden,
  );
}

function setBackgroundInert(inert: boolean) {
  if (inert) {
    appMain.value?.setAttribute('inert', '');
    return;
  }
  appMain.value?.removeAttribute('inert');
}

function restoreBodyScroll() {
  if (previousBodyOverflow === undefined) {
    return;
  }
  document.body.style.overflow = previousBodyOverflow;
  previousBodyOverflow = undefined;
}

function openSidebar(trigger?: HTMLElement | null) {
  if (desktopMediaQuery?.matches) {
    return;
  }
  sidebarTrigger = trigger ?? null;
  sidebarOpen.value = true;
}

function closeSidebar() {
  sidebarOpen.value = false;
}

watch(sidebarOpen, async (isOpen) => {
  if (isOpen) {
    previousBodyOverflow ??= document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setBackgroundInert(true);
    await nextTick();
    (getSidebarFocusables()[0] ?? getSidebarElement())?.focus();
    return;
  }

  restoreBodyScroll();
  setBackgroundInert(false);
  await nextTick();
  sidebarTrigger?.focus();
  sidebarTrigger = null;
});

watch(() => route.path, closeSidebar);

function handleDrawerKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && sidebarOpen.value) {
    closeSidebar();
    return;
  }
  if (event.key !== 'Tab' || !sidebarOpen.value) {
    return;
  }

  const focusables = getSidebarFocusables();
  const first = focusables[0];
  const last = focusables.at(-1);
  if (!first || !last) {
    event.preventDefault();
    getSidebarElement()?.focus();
    return;
  }

  const activeElement = document.activeElement;
  if (!getSidebarElement()?.contains(activeElement)) {
    event.preventDefault();
    first.focus();
  } else if (event.shiftKey && activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function handleDesktopBreakpoint(event: MediaQueryListEvent) {
  if (event.matches && sidebarOpen.value) {
    sidebarTrigger = null;
    closeSidebar();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleDrawerKeydown);
  desktopMediaQuery = window.matchMedia('(min-width: 768px)');
  desktopMediaQuery.addEventListener('change', handleDesktopBreakpoint);
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDrawerKeydown);
  desktopMediaQuery?.removeEventListener('change', handleDesktopBreakpoint);
  setBackgroundInert(false);
  restoreBodyScroll();
});

const { locale } = useI18n();
watch(
  locale,
  () => {
    document.documentElement.setAttribute('lang', locale.value);
  },
  { immediate: true },
);
</script>

<style scoped>
@reference '~/tailwind.css';

.app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-shell {
  @apply flex h-full w-full;
}

.app-main {
  @apply flex h-full min-w-0 flex-1 flex-col;
}

.drawer-backdrop {
  @apply fixed inset-0 z-25 bg-black/50;
}

#scroll-component {
  scrollbar-gutter: stable;
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translate(100%, 0);
}
</style>
