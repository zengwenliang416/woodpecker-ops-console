<template>
  <div class="admin-resource-page min-w-0">
    <SettingsSection :title="$t('admin.settings.orgs.orgs')" :description="$t('admin.settings.orgs.desc')">
      <FeedbackState v-if="loadError" compact kind="error" :title="$t('unknown_error')" :description="loadError">
        <template #action>
          <Button start-icon="refresh" :text="$t('admin.settings.surface.retry')" @click="reloadOrgs" />
        </template>
      </FeedbackState>

      <FeedbackState
        v-if="loading && displayedOrgs.length === 0"
        kind="loading"
        :title="$t('feedback.loading_title')"
        :description="$t('feedback.loading_description')"
      />

      <FeedbackState
        v-else-if="!loadError && displayedOrgs.length === 0"
        kind="empty"
        :title="$t('admin.settings.orgs.none')"
      />

      <SettingsTable v-else-if="displayedOrgs.length > 0" class="mt-3" min-width="560px">
        <template #head>
          <tr>
            <th>{{ $t('admin.settings.agents.name.name') }}</th>
            <th>
              <span class="sr-only">{{ $t('admin.settings.surface.actions') }}</span>
            </th>
          </tr>
        </template>

        <tr v-for="org in displayedOrgs" :key="org.id">
          <td>
            <span class="font-semibold">{{ org.name }}</span>
          </td>
          <td>
            <div class="flex justify-end gap-1">
              <IconButton
                icon="chevron-right"
                :title="$t('admin.settings.orgs.view')"
                :to="{ name: 'org', params: { orgId: org.id } }"
              />
              <IconButton
                icon="settings-outline"
                :title="$t('admin.settings.orgs.org_settings')"
                :to="{ name: 'org-settings', params: { orgId: org.id } }"
              />
              <IconButton
                icon="trash"
                class="text-wp-error-100"
                :title="$t('admin.settings.orgs.delete_org')"
                :is-loading="isDeleting"
                @click="confirmDeleteOrg(org)"
              />
            </div>
          </td>
        </tr>

        <template #footer>
          {{ $t('admin.settings.surface.loaded_count', { count: displayedOrgs.length }) }}
        </template>
      </SettingsTable>
    </SettingsSection>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

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
import type { Org } from '~/lib/api/types';

const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();

const loadError = ref('');
const confirmedOrgs = ref<Org[] | null>(null);
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

async function loadOrgs(page: number): Promise<Org[] | null> {
  const ownership = requestGeneration;
  try {
    const result = await apiClient.getOrgs({ page });
    if (mounted && ownership === requestGeneration && page === 1 && (result?.length ?? 0) === 0) {
      confirmedOrgs.value = [];
    }
    return result;
  } catch (error) {
    if (mounted && ownership === requestGeneration) {
      loadError.value = error instanceof Error ? error.message : i18n.t('unknown_error');
    }
    return [];
  }
}

const { resetPage, data: orgs, loading } = usePagination(loadOrgs);
const displayedOrgs = computed(() => confirmedOrgs.value ?? orgs.value);

watch(
  [orgs, loading, loadError],
  ([rows, isLoading, error]) => {
    if (!isLoading && !error && (confirmedOrgs.value === null || rows.length > 0)) {
      confirmedOrgs.value = [...rows];
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

async function reloadOrgs() {
  requestGeneration += 1;
  loadError.value = '';
  await resetPage();
  await waitForPaginationIdle();
}

const { doSubmit: deleteOrg, isLoading: isDeleting } = useAsyncAction(async (org: Org) => {
  const ownership = lifecycle;
  try {
    await apiClient.deleteOrg(org);
  } catch (error) {
    if (ownsLifecycle(ownership)) {
      notifyMutationError(error);
    }
    return;
  }
  if (!ownsLifecycle(ownership)) {
    return;
  }

  notifications.notify({ title: i18n.t('admin.settings.orgs.deleted'), type: 'success' });
  await reloadOrgs();
});

function confirmDeleteOrg(org: Org) {
  // eslint-disable-next-line no-alert
  if (confirm(i18n.t('admin.settings.orgs.delete_confirm'))) {
    void deleteOrg(org);
  }
}

onBeforeUnmount(() => {
  mounted = false;
  lifecycle += 1;
  requestGeneration += 1;
});

useWPTitle(computed(() => [i18n.t('admin.settings.orgs.orgs'), i18n.t('admin.settings.settings')]));
</script>

<style scoped>
@reference '~/tailwind.css';

.admin-resource-page {
  @apply flex max-w-full flex-col gap-4;
  contain: layout paint;
}
</style>
