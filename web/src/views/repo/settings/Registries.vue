<template>
  <div class="repo-settings-page">
    <header class="repo-settings-page-header">
      <div>
        <h1>{{ $t('registries.credentials') }}</h1>
        <p>{{ $t('registries.desc') }}</p>
      </div>
      <Button
        v-if="selectedRegistry"
        :text="$t('registries.show')"
        start-icon="back"
        @click="selectedRegistry = undefined"
      />
      <Button v-else color="green" :text="$t('registries.add')" start-icon="plus" @click="showAddRegistry" />
    </header>

    <RepoSettingsSection
      v-if="selectedRegistry"
      :title="isEditingRegistry ? $t('registries.edit') : $t('registries.add')"
      :description="$t('repo.settings_surface.registries.form_description')"
    >
      <RegistryEdit
        v-model="selectedRegistry"
        :is-saving="isSaving"
        @save="createRegistry"
        @cancel="selectedRegistry = undefined"
      />
    </RepoSettingsSection>

    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('repo.settings_surface.registries.error_title')"
        :description="loadError"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('repo.settings_surface.retry')" @click="reloadRegistries" />
        </template>
      </FeedbackState>

      <FeedbackState
        v-if="loading && registries.length === 0"
        kind="loading"
        :title="$t('repo.settings_surface.registries.loading_title')"
        :description="$t('repo.settings_surface.registries.loading_description')"
      />

      <FeedbackState
        v-else-if="!loadError && registries.length === 0"
        kind="empty"
        :title="$t('registries.none')"
        :description="$t('repo.settings_surface.registries.empty_description')"
      >
        <template #action>
          <Button start-icon="plus" :text="$t('registries.add')" @click="showAddRegistry" />
        </template>
      </FeedbackState>

      <RepoSettingsTable v-else-if="registries.length > 0" min-width="660px">
        <template #head>
          <tr>
            <th>{{ $t('registries.address.address') }}</th>
            <th>{{ $t('username') }}</th>
            <th>{{ $t('repo.settings_surface.columns.scope') }}</th>
            <th>{{ $t('repo.settings_surface.columns.access') }}</th>
            <th>
              <span class="sr-only">{{ $t('repo.settings_surface.columns.actions') }}</span>
            </th>
          </tr>
        </template>

        <tr v-for="registry in registries" :key="`${registry.level}-${registry.id}-${registry.address}`">
          <td>
            <div class="resource-name">
              <PrototypeIcon name="docker" />
              <span class="font-mono font-semibold">{{ registry.address }}</span>
            </div>
          </td>
          <td>{{ registry.username || '—' }}</td>
          <td><Badge :value="scopeLabel(registry.level)" /></td>
          <td>
            <Badge
              :value="registry.readonly ? $t('repo.settings_surface.read_only') : $t('repo.settings_surface.editable')"
            />
          </td>
          <td>
            <div v-if="registry.edit !== false" class="flex justify-end gap-1">
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
            <span v-else class="text-wp-text-alt-100 text-xs">{{ $t('repo.settings_surface.inherited') }}</span>
          </td>
        </tr>

        <template #footer>
          {{ $t('repo.settings_surface.loaded_count', { count: registries.length }) }}
        </template>
      </RepoSettingsTable>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Badge from '~/components/atomic/Badge.vue';
import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import RepoSettingsSection from '~/components/repo/settings/RepoSettingsSection.vue';
import RepoSettingsTable from '~/components/repo/settings/RepoSettingsTable.vue';
import RegistryEdit from '~/components/registry/RegistryEdit.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import { requiredInject } from '~/compositions/useInjectProvide';
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

const repo = requiredInject('repo');
const selectedRegistry = ref<Partial<Registry>>();
const isEditingRegistry = computed(() => !!selectedRegistry.value?.id);
const loadError = ref('');
let reloadGeneration = 0;
let repoLifecycleGeneration = 0;

async function loadRegistries(page: number, level: 'repo' | 'org' | 'global'): Promise<Registry[] | null> {
  const repoId = repo.value.id;
  const requestGeneration = reloadGeneration;

  try {
    switch (level) {
      case 'repo':
        return await apiClient.getRegistryList(repoId, { page });
      case 'org':
        return await apiClient.getOrgRegistryList(repo.value.org_id, { page });
      case 'global':
        return await apiClient.getGlobalRegistryList({ page });
      default:
        throw new Error(`Unexpected level: ${level}`);
    }
  } catch (error) {
    if (repo.value.id === repoId && requestGeneration === reloadGeneration) {
      loadError.value =
        error instanceof Error ? error.message : i18n.t('repo.settings_surface.registries.error_fallback');
    }
    return [];
  }
}

const {
  resetPage,
  data: _registries,
  loading,
} = usePagination(loadRegistries, () => !selectedRegistry.value, {
  each: ['repo', 'org', 'global'],
});
const confirmedRegistries = ref<Registry[] | null>(null);
const displayedRegistryRows = computed(() => confirmedRegistries.value ?? _registries.value);
const registries = computed(() => {
  const registriesList: Record<string, Registry & { edit?: boolean; level: 'repo' | 'org' | 'global' }> = {};

  for (const level of ['repo', 'org', 'global']) {
    for (const registry of displayedRegistryRows.value) {
      if (
        ((level === 'repo' && registry.repo_id !== 0 && registry.org_id === 0) ||
          (level === 'org' && registry.repo_id === 0 && registry.org_id !== 0) ||
          (level === 'global' && registry.repo_id === 0 && registry.org_id === 0)) &&
        !registriesList[registry.address]
      ) {
        registriesList[registry.address] = { ...registry, edit: registry.repo_id !== 0, level };
      }
    }
  }

  const levelsOrder = {
    global: 0,
    org: 1,
    repo: 2,
  };

  return Object.values(registriesList)
    .toSorted((a, b) => a.address.localeCompare(b.address))
    .toSorted((a, b) => levelsOrder[b.level] - levelsOrder[a.level]);
});

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

async function reloadRegistries(preserveConfirmed = true) {
  const requestGeneration = ++reloadGeneration;
  loadError.value = '';
  confirmedRegistries.value = preserveConfirmed ? [...displayedRegistryRows.value] : null;
  await resetPage();
  await waitForPaginationIdle();
  if (requestGeneration === reloadGeneration && !loadError.value) {
    confirmedRegistries.value = null;
  }
}

watch(
  () => repo.value.id,
  () => {
    repoLifecycleGeneration += 1;
    selectedRegistry.value = undefined;
    void reloadRegistries(false);
  },
);

const { doSubmit: createRegistry, isLoading: isSaving } = useAsyncAction(async () => {
  if (!selectedRegistry.value) {
    throw new Error("Unexpected: Can't get registry");
  }

  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  const editing = isEditingRegistry.value;
  const registry = deepClone(selectedRegistry.value);
  if (editing) {
    await apiClient.updateRegistry(repoId, registry);
  } else {
    await apiClient.createRegistry(repoId, registry);
  }
  if (repo.value.id !== repoId || requestGeneration !== repoLifecycleGeneration) {
    return;
  }
  notifications.notify({
    title: editing ? i18n.t('registries.saved') : i18n.t('registries.created'),
    type: 'success',
  });
  selectedRegistry.value = undefined;
  await reloadRegistries();
});

const { doSubmit: deleteRegistry, isLoading: isDeleting } = useAsyncAction(async (_registry: Registry) => {
  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  const registryAddress = encodeURIComponent(_registry.address);
  await apiClient.deleteRegistry(repoId, registryAddress);
  if (repo.value.id !== repoId || requestGeneration !== repoLifecycleGeneration) {
    return;
  }
  notifications.notify({ title: i18n.t('registries.deleted'), type: 'success' });
  await reloadRegistries();
});

function editRegistry(registry: Registry) {
  selectedRegistry.value = deepClone(registry);
}

function showAddRegistry() {
  selectedRegistry.value = deepClone(emptyRegistry);
}

function scopeLabel(level: 'repo' | 'org' | 'global') {
  if (level === 'repo') {
    return i18n.t('repo.settings_surface.scope.repo');
  }
  if (level === 'org') {
    return i18n.t('repo.settings_surface.scope.org');
  }
  return i18n.t('repo.settings_surface.scope.global');
}

function confirmDeleteRegistry(registry: Registry) {
  // eslint-disable-next-line no-alert
  if (confirm(i18n.t('registries.delete_confirm'))) {
    deleteRegistry(registry);
  }
}

useWPTitle(computed(() => [i18n.t('registries.registries'), repo.value.full_name]));
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

.resource-name {
  @apply text-wp-text-200 flex items-center gap-2;
}

.resource-name :deep(svg) {
  @apply text-wp-text-alt-100 h-4 w-4 shrink-0;
}
</style>
