<template>
  <Scaffold v-if="accessGranted" :go-back="goBack">
    <template #title>
      <span>
        <router-link :to="{ name: 'org', params: { orgId: repo.org_id } }" class="hover:underline">{{
          repo!.owner
          /* eslint-disable-next-line @intlify/vue-i18n/no-raw-text */
        }}</router-link>
        /
        <router-link :to="{ name: 'repo' }" class="hover:underline">{{
          repo!.name
          /* eslint-disable-next-line @intlify/vue-i18n/no-raw-text */
        }}</router-link>
        /
        {{ $t('settings') }}
      </span>
    </template>

    <div class="repo-settings-layout">
      <RepoSettingsNav />
      <main class="min-w-0">
        <router-view />
      </main>
    </div>
  </Scaffold>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import RepoSettingsNav from '~/components/repo/settings/RepoSettingsNav.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import { requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';
import { useRouteBack } from '~/compositions/useRouteBack';

const notifications = useNotifications();
const router = useRouter();
const i18n = useI18n();

const repoPermissions = requiredInject('repo-permissions');
const repo = requiredInject('repo');
const accessGranted = ref(false);

watch(
  [() => repo.value.id, () => repoPermissions.value],
  async ([repoId, permissions], [previousRepoId, previousPermissions]) => {
    accessGranted.value = false;

    if (previousRepoId !== undefined && repoId !== previousRepoId && permissions === previousPermissions) {
      return;
    }

    if (permissions.admin) {
      accessGranted.value = true;
      return;
    }

    notifications.notify({ type: 'error', title: i18n.t('repo.settings.not_allowed') });
    await router.replace({ name: 'home' });
  },
  { immediate: true },
);

const goBack = useRouteBack({ name: 'repo' });
</script>

<style scoped>
@reference '~/tailwind.css';

.repo-settings-layout {
  @apply flex min-w-0 flex-col gap-4;
}
</style>
