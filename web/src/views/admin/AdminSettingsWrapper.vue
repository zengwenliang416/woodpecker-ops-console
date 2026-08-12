<template>
  <Scaffold v-if="user?.admin" full-width-header fluid-content>
    <template #title>
      {{ $t('admin.settings.settings') }}
    </template>

    <div class="admin-settings-layout">
      <AdminSettingsNav />
      <main class="admin-settings-content">
        <router-view />
      </main>
    </div>
  </Scaffold>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import AdminSettingsNav from '~/components/admin/settings/AdminSettingsNav.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useAuthentication from '~/compositions/useAuthentication';
import useNotifications from '~/compositions/useNotifications';

const notifications = useNotifications();
const router = useRouter();
const i18n = useI18n();
const { user } = useAuthentication();

onMounted(async () => {
  if (!user?.admin) {
    notifications.notify({ type: 'error', title: i18n.t('admin.settings.not_allowed') });
    await router.replace({ name: 'home' });
  }
});
</script>

<style scoped>
@reference '~/tailwind.css';

.admin-settings-layout {
  @apply mx-auto grid w-full max-w-[1500px] min-w-0 grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)];
}

.admin-settings-content {
  @apply min-w-0;
  contain: layout paint;
}
</style>
