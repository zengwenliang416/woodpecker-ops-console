<template>
  <div class="admin-forges-page">
    <header class="admin-forges-page-header">
      <div class="min-w-0">
        <h1>{{ $t('forges') }}</h1>
        <p>{{ $t('forges_desc') }}</p>
      </div>
      <Button color="green" :text="$t('add_forge')" start-icon="plus" :to="{ name: 'admin-settings-forge-create' }" />
    </header>

    <FeedbackState
      v-if="loadError"
      compact
      kind="error"
      :title="$t('admin.settings.forges.error_title')"
      :description="loadError"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('admin.settings.surface.retry')" @click="reloadForges" />
      </template>
    </FeedbackState>

    <FeedbackState
      v-if="loading && displayedForges.length === 0"
      kind="loading"
      :title="$t('admin.settings.forges.loading_title')"
      :description="$t('admin.settings.forges.loading_description')"
    />

    <FeedbackState
      v-else-if="!loadError && displayedForges.length === 0"
      kind="empty"
      :title="$t('no_forges')"
      :description="$t('admin.settings.forges.empty_description')"
    >
      <template #action>
        <Button color="green" start-icon="plus" :text="$t('add_forge')" :to="{ name: 'admin-settings-forge-create' }" />
      </template>
    </FeedbackState>

    <SettingsSection v-else-if="displayedForges.length > 0" :title="$t('forges')" :description="$t('forges_desc')">
      <SettingsTable min-width="560px">
        <template #head>
          <tr>
            <th>{{ $t('url') }}</th>
            <th>{{ $t('forge_type') }}</th>
            <th>
              <span class="sr-only">{{ $t('admin.settings.surface.actions') }}</span>
            </th>
          </tr>
        </template>

        <tr v-for="forge in displayedForges" :key="forge.id">
          <td>
            <div class="forge-address">
              <PrototypeIcon name="forge" />
              <span class="font-mono font-semibold">{{ displayUrl(forge.url) }}</span>
            </div>
          </td>
          <td>
            <Badge :value="forge.type" />
          </td>
          <td>
            <div class="flex justify-end gap-1">
              <IconButton
                icon="edit"
                :title="$t('edit_forge')"
                :to="{ name: 'admin-settings-forge', params: { forgeId: forge.id } }"
              />
              <IconButton
                icon="trash"
                class="text-wp-error-100"
                :title="$t('delete_forge')"
                :is-loading="isDeleting"
                @click="confirmDeleteForge(forge)"
              />
            </div>
          </td>
        </tr>

        <template #footer>
          {{ $t('admin.settings.surface.loaded_count', { count: displayedForges.length }) }}
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
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import SettingsTable from '~/components/settings/SettingsTable.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import useNotifications from '~/compositions/useNotifications';
import { usePagination } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Forge } from '~/lib/api/types';

const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();

const loadError = ref('');
const confirmedForges = ref<Forge[] | null>(null);
let reloadGeneration = 0;
let deleteGeneration = 0;
let unmounted = false;

async function loadForges(page: number): Promise<Forge[] | null> {
  const requestGeneration = reloadGeneration;
  try {
    return await apiClient.getForges({ page });
  } catch (error) {
    if (!unmounted && requestGeneration === reloadGeneration) {
      loadError.value = error instanceof Error ? error.message : i18n.t('admin.settings.forges.error_fallback');
    }
    return [];
  }
}

const { resetPage, data: forges, loading } = usePagination(loadForges);
const displayedForges = computed(() => confirmedForges.value ?? forges.value);

watch(
  [forges, loading, loadError],
  ([rows, isLoading, error]) => {
    if (!isLoading && !error) {
      confirmedForges.value = [...rows];
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

async function reloadForges() {
  const requestGeneration = ++reloadGeneration;
  loadError.value = '';
  confirmedForges.value = [...displayedForges.value];
  await resetPage();
  await waitForPaginationIdle();
  if (!unmounted && requestGeneration === reloadGeneration && !loadError.value) {
    confirmedForges.value = null;
  }
}

function notifyMutationError(error: unknown) {
  notifications.notify({
    title: error instanceof Error ? error.message : i18n.t('admin.settings.forges.mutation_error_fallback'),
    type: 'error',
  });
}

const { doSubmit: deleteForge, isLoading: isDeleting } = useAsyncAction(async (forge: Forge) => {
  const requestGeneration = ++deleteGeneration;
  try {
    await apiClient.deleteForge(forge);
  } catch (error) {
    if (!unmounted && requestGeneration === deleteGeneration) {
      notifyMutationError(error);
    }
    return;
  }
  if (unmounted || requestGeneration !== deleteGeneration) {
    return;
  }

  notifications.notify({ title: i18n.t('forge_deleted'), type: 'success' });
  await reloadForges();
});

function confirmDeleteForge(forge: Forge) {
  // eslint-disable-next-line no-alert
  if (confirm(i18n.t('forge_delete_confirm'))) {
    void deleteForge(forge);
  }
}

function displayUrl(url: string) {
  return url.replace(/^https?:\/\//, '');
}

onBeforeUnmount(() => {
  unmounted = true;
  reloadGeneration += 1;
  deleteGeneration += 1;
});

useWPTitle(computed(() => [i18n.t('forges'), i18n.t('admin.settings.settings')]));
</script>

<style scoped>
@reference '~/tailwind.css';

.admin-forges-page {
  @apply flex min-w-0 flex-col gap-4;
}

.admin-forges-page-header {
  @apply flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between;
}

.admin-forges-page-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.admin-forges-page-header p {
  @apply text-wp-text-alt-100 mt-1 max-w-2xl text-xs leading-5;
}

.forge-address {
  @apply flex min-w-0 items-center gap-2;
}

.forge-address :deep(svg) {
  @apply text-wp-primary-100 h-4 w-4 shrink-0;
}
</style>
