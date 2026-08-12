<template>
  <div class="admin-resource-page min-w-0">
    <SettingsSection :title="$t('admin.settings.repos.repos')" :description="$t('admin.settings.repos.desc')">
      <template #actions>
        <Button
          start-icon="heal"
          :title="$t('admin.settings.repos.repair.repair')"
          :is-loading="isRepairingRepos"
          :text="$t('admin.settings.repos.repair.repair')"
          @click="repairRepos"
        />
      </template>

      <FeedbackState v-if="loadError" compact kind="error" :title="$t('unknown_error')" :description="loadError">
        <template #action>
          <Button start-icon="refresh" :text="$t('admin.settings.surface.retry')" @click="reloadRepos" />
        </template>
      </FeedbackState>

      <FeedbackState
        v-if="loading && displayedRepos.length === 0"
        kind="loading"
        :title="$t('feedback.loading_title')"
        :description="$t('feedback.loading_description')"
      />

      <FeedbackState
        v-else-if="!loadError && displayedRepos.length === 0"
        kind="empty"
        :title="$t('admin.settings.repos.none')"
      />

      <SettingsTable v-else-if="displayedRepos.length > 0" class="mt-3" min-width="640px">
        <template #head>
          <tr>
            <th>{{ $t('repositories.columns.repository') }}</th>
            <th>{{ $t('admin.settings.surface.status') }}</th>
            <th>
              <span class="sr-only">{{ $t('admin.settings.surface.actions') }}</span>
            </th>
          </tr>
        </template>

        <tr v-for="repo in displayedRepos" :key="repo.id">
          <td>
            <span class="font-semibold">{{ repo.full_name }}</span>
          </td>
          <td>
            <Badge :value="repo.active ? $t('admin.settings.surface.active') : $t('admin.settings.repos.disabled')" />
          </td>
          <td>
            <div class="flex justify-end gap-1">
              <IconButton
                icon="chevron-right"
                :title="$t('admin.settings.repos.view')"
                :to="{ name: 'repo', params: { repoId: repo.id } }"
              />
              <IconButton
                icon="settings-outline"
                :title="$t('admin.settings.repos.settings')"
                :to="{ name: 'repo-settings', params: { repoId: repo.id } }"
              />
            </div>
          </td>
        </tr>

        <template #footer>
          {{ $t('admin.settings.surface.loaded_count', { count: displayedRepos.length }) }}
        </template>
      </SettingsTable>
    </SettingsSection>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Badge from '~/components/atomic/Badge.vue';
import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import SettingsTable from '~/components/settings/SettingsTable.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import useNotifications from '~/compositions/useNotifications';
import { usePagination } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Repo } from '~/lib/api/types';

const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();

const loadError = ref('');
const confirmedRepos = ref<Repo[] | null>(null);
let mounted = true;
let requestGeneration = 0;
let lifecycle = 0;

function ownsLifecycle(ownership: number) {
  return mounted && ownership === lifecycle;
}

function notifyMutationError(error: unknown) {
  notifications.notify({
    title: error instanceof Error ? error.message : i18n.t('unknown_error'),
    type: 'error',
  });
}

async function loadRepos(page: number): Promise<Repo[] | null> {
  const ownership = requestGeneration;
  try {
    const result = await apiClient.getAllRepos({ page });
    if (mounted && ownership === requestGeneration && page === 1 && (result?.length ?? 0) === 0) {
      confirmedRepos.value = [];
    }
    return result;
  } catch (error) {
    if (mounted && ownership === requestGeneration) {
      loadError.value = error instanceof Error ? error.message : i18n.t('unknown_error');
    }
    return [];
  }
}

const { resetPage, data: repos, loading } = usePagination(loadRepos);
const displayedRepos = computed(() => confirmedRepos.value ?? repos.value);

watch(
  [repos, loading, loadError],
  ([rows, isLoading, error]) => {
    if (!isLoading && !error && (confirmedRepos.value === null || rows.length > 0)) {
      confirmedRepos.value = [...rows];
    }
  },
  { deep: true, immediate: true },
);

async function waitForPaginationIdle() {
  await nextTick();
  if (!loading.value) {
    return;
  }
  await new Promise<void>((resolve) => {
    const stop = watch(loading, (isLoading) => {
      if (!isLoading) {
        stop();
        resolve();
      }
    });
  });
}

async function reloadRepos() {
  requestGeneration += 1;
  loadError.value = '';
  await resetPage();
  await waitForPaginationIdle();
}

const { doSubmit: repairRepos, isLoading: isRepairingRepos } = useAsyncAction(async () => {
  const ownership = lifecycle;
  try {
    await apiClient.repairAllRepos();
  } catch (error) {
    if (ownsLifecycle(ownership)) {
      notifyMutationError(error);
    }
    return;
  }
  if (!ownsLifecycle(ownership)) {
    return;
  }

  notifications.notify({ title: i18n.t('admin.settings.repos.repair.success'), type: 'success' });
});

onBeforeUnmount(() => {
  mounted = false;
  lifecycle += 1;
  requestGeneration += 1;
});

useWPTitle(computed(() => [i18n.t('admin.settings.repos.repos'), i18n.t('admin.settings.settings')]));
</script>

<style scoped>
@reference '~/tailwind.css';

.admin-resource-page {
  @apply flex max-w-full flex-col gap-4;
  contain: layout paint;
}
</style>
