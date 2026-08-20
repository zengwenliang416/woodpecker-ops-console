<template>
  <Scaffold v-if="org" :go-back="goBack" full-width-header fluid-content>
    <template #title>
      <span class="min-w-0 truncate">
        <router-link :to="{ name: 'org', params: { orgId: org.id } }" class="hover:underline">
          {{ org.name }}
        </router-link>
        <span class="text-wp-text-alt-100">
          {{ $t('org.settings.surface.breadcrumb_separator') }} {{ $t('settings') }}
        </span>
      </span>
    </template>

    <FeedbackState
      v-if="!orgPermissions.admin"
      class="mx-auto mt-6 max-w-3xl"
      kind="permission"
      :title="$t('org.settings.not_allowed')"
      :description="$t('feedback.permission_description')"
    />

    <div v-else class="org-settings-layout">
      <OrgSettingsNav :show-agents="userRegisteredAgents" />
      <main class="org-settings-content">
        <router-view />
      </main>
    </div>
  </Scaffold>
</template>

<script lang="ts" setup>
import { watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import OrgSettingsNav from '~/components/org/settings/OrgSettingsNav.vue';
import useConfig from '~/compositions/useConfig';
import { requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';

defineProps<{
  orgId: string;
}>();

const notifications = useNotifications();
const router = useRouter();
const i18n = useI18n();

const { userRegisteredAgents } = useConfig();
const org = requiredInject('org');
const orgPermissions = requiredInject('org-permissions');

watch(
  () => [org.value.id, orgPermissions.value.admin] as const,
  async ([, isAdmin]) => {
    if (!isAdmin) {
      notifications.notify({ type: 'error', title: i18n.t('org.settings.not_allowed') });
      await router.replace({ name: 'org', params: { orgId: org.value.id } });
    }
  },
  { immediate: true },
);

async function goBack() {
  await router.replace({ name: 'org', params: { orgId: org.value.id } });
}
</script>

<style scoped>
@reference '~/tailwind.css';

.org-settings-layout {
  @apply mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-4 px-4 py-5 sm:px-6;
}

.org-settings-content {
  @apply min-w-0;
  contain: layout paint;
}
</style>
