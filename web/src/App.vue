<template>
  <div class="app bg-wp-background-500 dark:bg-wp-background-500 m-auto flex h-full w-full flex-col">
    <router-view v-if="layout === 'blank'" />
    <template v-else>
      <div class="app-shell">
        <Sidebar :open="sidebarOpen" @close="sidebarOpen = false" />
        <div v-if="sidebarOpen" class="drawer-backdrop md:hidden" @click="sidebarOpen = false" />
        <div class="app-main">
          <Navbar @open-sidebar="sidebarOpen = true" />
          <main class="relative flex h-full min-h-0">
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
import { computed, ref, watch } from 'vue';
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
watch(
  () => route.path,
  () => {
    sidebarOpen.value = false;
  },
);

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
  @apply fixed inset-0 z-20 bg-black/50;
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
