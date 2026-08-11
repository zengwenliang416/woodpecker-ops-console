<template>
  <div class="repo-settings-page">
    <header class="repo-settings-page-header">
      <div>
        <h1>{{ $t('repo.settings.actions.actions') }}</h1>
        <p>{{ $t('repo.settings_surface.actions.description') }}</p>
      </div>
      <Badge
        :value="isActive ? $t('repo.settings_surface.actions.active') : $t('repo.settings_surface.actions.inactive')"
      />
    </header>

    <RepoSettingsSection
      :title="$t('repo.settings_surface.actions.maintenance_title')"
      :description="$t('repo.settings_surface.actions.maintenance_description')"
    >
      <RepoSettingsActionRow
        :title="$t('repo.settings.actions.repair.repair')"
        :description="$t('repo.settings_surface.actions.repair_description')"
      >
        <Button
          start-icon="refresh"
          :is-loading="isRepairingRepo"
          :text="$t('repo.settings.actions.repair.repair')"
          @click="repairRepo"
        />
      </RepoSettingsActionRow>

      <RepoSettingsActionRow
        v-if="!isActive"
        :title="$t('repo.settings.actions.enable.enable')"
        :description="$t('repo.settings_surface.actions.enable_description')"
      >
        <Button
          color="green"
          start-icon="play"
          :is-loading="isActivatingRepo"
          :text="$t('repo.settings.actions.enable.enable')"
          @click="activateRepo"
        />
      </RepoSettingsActionRow>
    </RepoSettingsSection>

    <RepoSettingsSection
      danger
      :title="$t('repo.settings_surface.actions.danger_title')"
      :description="$t('repo.settings_surface.actions.danger_description')"
    >
      <RepoSettingsActionRow
        v-if="isActive"
        :title="$t('repo.settings.actions.disable.disable')"
        :description="$t('repo.settings_surface.actions.disable_description')"
      >
        <Button
          color="red"
          start-icon="stop"
          :is-loading="isDeactivatingRepo"
          :text="$t('repo.settings.actions.disable.disable')"
          @click="deactivateRepo"
        />
      </RepoSettingsActionRow>

      <RepoSettingsActionRow
        :title="$t('repo.settings.actions.delete.delete')"
        :description="$t('repo.settings_surface.actions.delete_description')"
      >
        <Button
          color="red"
          start-icon="trash"
          :is-loading="isDeletingRepo"
          :text="$t('repo.settings.actions.delete.delete')"
          @click="deleteRepo"
        />
      </RepoSettingsActionRow>
    </RepoSettingsSection>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import Badge from '~/components/atomic/Badge.vue';
import Button from '~/components/atomic/Button.vue';
import RepoSettingsActionRow from '~/components/repo/settings/RepoSettingsActionRow.vue';
import RepoSettingsSection from '~/components/repo/settings/RepoSettingsSection.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import { requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';
import { useWPTitle } from '~/compositions/useWPTitle';

const apiClient = useApiClient();
const router = useRouter();
const notifications = useNotifications();
const i18n = useI18n();

const repo = requiredInject('repo');
let repoLifecycleGeneration = 0;

watch(
  () => repo.value.id,
  () => {
    repoLifecycleGeneration += 1;
  },
  { immediate: true },
);

const { doSubmit: repairRepo, isLoading: isRepairingRepo } = useAsyncAction(async () => {
  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  await apiClient.repairRepo(repoId);
  if (repo.value.id === repoId && requestGeneration === repoLifecycleGeneration) {
    notifications.notify({ title: i18n.t('repo.settings.actions.repair.success'), type: 'success' });
  }
});

const { doSubmit: deleteRepo, isLoading: isDeletingRepo } = useAsyncAction(async () => {
  // eslint-disable-next-line no-alert
  if (!confirm(i18n.t('repo.settings.actions.delete.confirm'))) {
    return;
  }

  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  await apiClient.deleteRepo(repoId);
  if (repo.value.id !== repoId || requestGeneration !== repoLifecycleGeneration) {
    return;
  }
  notifications.notify({ title: i18n.t('repo.settings.actions.delete.success'), type: 'success' });
  await router.replace({ name: 'repos' });
});

const { doSubmit: activateRepo, isLoading: isActivatingRepo } = useAsyncAction(async () => {
  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  const forgeRemoteId = repo.value.forge_remote_id;
  await apiClient.activateRepo(forgeRemoteId);
  if (repo.value.id === repoId && requestGeneration === repoLifecycleGeneration) {
    notifications.notify({ title: i18n.t('repo.settings.actions.enable.success'), type: 'success' });
  }
});

const { doSubmit: deactivateRepo, isLoading: isDeactivatingRepo } = useAsyncAction(async () => {
  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  await apiClient.deleteRepo(repoId, false);
  if (repo.value.id !== repoId || requestGeneration !== repoLifecycleGeneration) {
    return;
  }
  notifications.notify({ title: i18n.t('repo.settings.actions.disable.success'), type: 'success' });
  await router.replace({ name: 'repos' });
});

const isActive = computed(() => repo.value.active);

useWPTitle(computed(() => [i18n.t('repo.settings.actions.actions'), repo.value.full_name]));
</script>

<style scoped>
@reference '~/tailwind.css';

.repo-settings-page {
  @apply min-w-0 space-y-4;
}

.repo-settings-page-header {
  @apply flex flex-col gap-3 px-1 py-1 sm:flex-row sm:items-center sm:justify-between;
}

.repo-settings-page-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.repo-settings-page-header p {
  @apply text-wp-text-alt-100 mt-1 text-xs leading-5;
}
</style>
