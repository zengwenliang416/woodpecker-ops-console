<template>
  <div class="admin-resource-page">
    <header class="admin-resource-page-header">
      <div class="min-w-0">
        <h1>{{ $t('registries.credentials') }}</h1>
        <p>{{ $t('admin.settings.registries.desc') }}</p>
      </div>
      <Button v-if="selectedRegistry" :text="$t('registries.show')" start-icon="back" @click="closeEditor" />
      <Button v-else color="green" :text="$t('registries.add')" start-icon="plus" @click="showAddRegistry" />
    </header>

    <Warning class="text-sm" :text="$t('admin.settings.registries.warning')" />

    <SettingsSection
      v-if="selectedRegistry"
      :title="isEditingRegistry ? $t('registries.edit') : $t('registries.add')"
      :description="$t('admin.settings.registries.form_description')"
    >
      <RegistryEdit v-model="selectedRegistry" :is-saving="isSaving" @save="saveRegistry" @cancel="closeEditor" />
    </SettingsSection>

    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('registries.credentials')"
        :description="loadError"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('admin.settings.surface.retry')" @click="reloadRegistries" />
        </template>
      </FeedbackState>

      <FeedbackState
        v-if="loading && displayedRegistries.length === 0"
        kind="loading"
        :title="$t('admin.settings.registries.loading_title')"
        :description="$t('admin.settings.registries.loading_description')"
      />

      <FeedbackState
        v-else-if="!loadError && displayedRegistries.length === 0"
        kind="empty"
        :title="$t('registries.none')"
        :description="$t('admin.settings.registries.empty_description')"
      >
        <template #action>
          <Button start-icon="plus" :text="$t('registries.add')" @click="showAddRegistry" />
        </template>
      </FeedbackState>

      <SettingsTable v-else-if="displayedRegistries.length > 0" min-width="620px">
        <template #head>
          <tr>
            <th>{{ $t('registries.address.address') }}</th>
            <th>{{ $t('username') }}</th>
            <th>{{ $t('admin.settings.surface.access') }}</th>
            <th>
              <span class="sr-only">{{ $t('admin.settings.surface.actions') }}</span>
            </th>
          </tr>
        </template>

        <tr v-for="registry in displayedRegistries" :key="`${registry.id}-${registry.address}`">
          <td>
            <div class="resource-name">
              <PrototypeIcon name="docker" />
              <span class="font-mono font-semibold">{{ registry.address }}</span>
            </div>
          </td>
          <td>{{ registry.username || '—' }}</td>
          <td>
            <Badge
              :value="
                registry.readonly ? $t('admin.settings.surface.read_only') : $t('admin.settings.surface.editable')
              "
            />
          </td>
          <td>
            <div class="flex justify-end gap-1">
              <IconButton
                :icon="registry.readonly ? 'chevron-right' : 'edit'"
                :title="registry.readonly ? $t('registries.view') : $t('registries.edit')"
                @click="editRegistry(registry)"
              />
              <IconButton
                v-if="!registry.readonly"
                icon="trash"
                class="text-wp-error-100"
                :is-loading="isDeleting"
                :title="$t('registries.delete')"
                @click="confirmDeleteRegistry(registry)"
              />
            </div>
          </td>
        </tr>

        <template #footer>
          {{ $t('admin.settings.surface.loaded_count', { count: displayedRegistries.length }) }}
        </template>
      </SettingsTable>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Badge from '~/components/atomic/Badge.vue';
import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Warning from '~/components/atomic/Warning.vue';
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import RegistryEdit from '~/components/registry/RegistryEdit.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import SettingsTable from '~/components/settings/SettingsTable.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import useNotifications from '~/compositions/useNotifications';
import { usePagination } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Registry } from '~/lib/api/types';
import { deepClone } from '~/lib/utils';

const emptyRegistry: Partial<Registry> = {
  address: '',
  username: '',
  password: '',
};

const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();

const selectedRegistry = ref<Partial<Registry>>();
const isEditingRegistry = computed(() => !!selectedRegistry.value?.id);
const loadError = ref('');
const confirmedRegistries = ref<Registry[] | null>(null);
const isSaving = ref(false);
let alive = true;
let lifecycleGeneration = 0;
let saveGeneration = 0;

function ownsLifecycle(generation: number) {
  return alive && generation === lifecycleGeneration;
}

function notifyMutationError(error: unknown) {
  notifications.notify({
    title: error instanceof Error ? error.message : i18n.t('admin.settings.registries.mutation_error_fallback'),
    type: 'error',
  });
}

async function loadRegistries(page: number): Promise<Registry[] | null> {
  const requestGeneration = lifecycleGeneration;
  try {
    return await apiClient.getGlobalRegistryList({ page });
  } catch (error) {
    if (ownsLifecycle(requestGeneration)) {
      loadError.value = error instanceof Error ? error.message : i18n.t('admin.settings.registries.error_fallback');
    }
    return [];
  }
}

const { resetPage, data: registries, loading } = usePagination(loadRegistries, () => !selectedRegistry.value);
const displayedRegistries = computed(() => confirmedRegistries.value ?? registries.value);

watch(
  [registries, loading, loadError],
  ([rows, isLoading, error]) => {
    if (alive && !isLoading && !error) {
      confirmedRegistries.value = [...rows];
    }
  },
  { deep: true },
);

async function waitForPaginationIdle() {
  await nextTick();
  if (!loading.value) {
    return;
  }
  await new Promise<void>((resolve) => {
    const stop = watch(loading, (isLoading) => {
      if (!isLoading || !alive) {
        stop();
        resolve();
      }
    });
  });
}

async function reloadRegistries() {
  lifecycleGeneration += 1;
  loadError.value = '';
  await resetPage();
  await waitForPaginationIdle();
}

async function saveRegistry() {
  if (!selectedRegistry.value || isSaving.value) {
    return;
  }

  const mutationGeneration = lifecycleGeneration;
  const requestGeneration = ++saveGeneration;
  const editing = isEditingRegistry.value;
  const submittedRegistry = deepClone(selectedRegistry.value);
  isSaving.value = true;

  try {
    if (editing) {
      await apiClient.updateGlobalRegistry(submittedRegistry);
    } else {
      await apiClient.createGlobalRegistry(submittedRegistry);
    }
  } catch (error) {
    if (ownsLifecycle(mutationGeneration) && requestGeneration === saveGeneration) {
      notifyMutationError(error);
    }
    return;
  } finally {
    if (ownsLifecycle(mutationGeneration) && requestGeneration === saveGeneration) {
      isSaving.value = false;
    }
  }
  if (!ownsLifecycle(mutationGeneration) || requestGeneration !== saveGeneration) {
    return;
  }

  notifications.notify({
    title: editing ? i18n.t('registries.saved') : i18n.t('registries.created'),
    type: 'success',
  });
  selectedRegistry.value = undefined;
  await reloadRegistries();
}

const { doSubmit: deleteRegistry, isLoading: isDeleting } = useAsyncAction(async (registry: Registry) => {
  const mutationGeneration = lifecycleGeneration;
  try {
    await apiClient.deleteGlobalRegistry(registry.address);
  } catch (error) {
    if (ownsLifecycle(mutationGeneration)) {
      notifyMutationError(error);
    }
    return;
  }
  if (!ownsLifecycle(mutationGeneration)) {
    return;
  }

  notifications.notify({ title: i18n.t('registries.deleted'), type: 'success' });
  await reloadRegistries();
});

function editRegistry(registry: Registry) {
  invalidateEditor();
  selectedRegistry.value = deepClone(registry);
}

function showAddRegistry() {
  invalidateEditor();
  selectedRegistry.value = deepClone(emptyRegistry);
}

function invalidateEditor() {
  lifecycleGeneration += 1;
  saveGeneration += 1;
  isSaving.value = false;
}

function closeEditor() {
  invalidateEditor();
  selectedRegistry.value = undefined;
}

function confirmDeleteRegistry(registry: Registry) {
  // eslint-disable-next-line no-alert
  if (confirm(i18n.t('registries.delete_confirm'))) {
    void deleteRegistry(registry);
  }
}

onBeforeUnmount(() => {
  alive = false;
  lifecycleGeneration += 1;
  saveGeneration += 1;
});

useWPTitle(computed(() => [i18n.t('registries.registries'), i18n.t('admin.settings.settings')]));
</script>

<style scoped>
@reference '~/tailwind.css';

.admin-resource-page {
  @apply flex min-w-0 flex-col gap-4;
}

.admin-resource-page-header {
  @apply flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between;
}

.admin-resource-page-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.admin-resource-page-header p {
  @apply text-wp-text-alt-100 mt-1 max-w-2xl text-xs leading-5;
}

.resource-name {
  @apply flex min-w-0 items-center gap-2;
}

.resource-name :deep(svg) {
  @apply h-4 w-4 shrink-0;
}
</style>
