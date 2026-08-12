<template>
  <div class="org-settings-page">
    <header class="org-settings-page-header">
      <div class="min-w-0">
        <h1>{{ $t('registries.credentials') }}</h1>
        <p>{{ $t('org.settings.registries.desc') }}</p>
      </div>
      <Button
        v-if="selectedRegistry"
        :text="$t('registries.show')"
        start-icon="back"
        @click="selectedRegistry = undefined"
      />
      <Button v-else color="green" :text="$t('registries.add')" start-icon="plus" @click="showAddRegistry" />
    </header>

    <SettingsSection
      v-if="selectedRegistry"
      :title="isEditing ? $t('registries.edit') : $t('registries.add')"
      :description="$t('org.settings.surface.registries_form_description')"
    >
      <RegistryEdit
        v-model="selectedRegistry"
        :is-saving="isSaving"
        @save="saveRegistry"
        @cancel="selectedRegistry = undefined"
      />
    </SettingsSection>

    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('org.settings.surface.registries_error_title')"
        :description="loadError"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('org.surface.retry')" @click="reloadRegistries" />
        </template>
      </FeedbackState>

      <FeedbackState
        v-if="loading && registries.length === 0"
        kind="loading"
        :title="$t('org.settings.surface.registries_loading_title')"
        :description="$t('org.settings.surface.registries_loading_description')"
      />

      <FeedbackState
        v-else-if="!loadError && registries.length === 0"
        kind="empty"
        :title="$t('registries.none')"
        :description="$t('org.settings.surface.registries_empty_description')"
      >
        <template #action>
          <Button start-icon="plus" :text="$t('registries.add')" @click="showAddRegistry" />
        </template>
      </FeedbackState>

      <SettingsTable v-else-if="registries.length > 0" min-width="660px">
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
          <td>
            <Badge :value="scopeLabel(registry.level)" />
          </td>
          <td>
            <Badge
              :value="registry.edit ? $t('repo.settings_surface.editable') : $t('repo.settings_surface.read_only')"
            />
          </td>
          <td>
            <div v-if="registry.edit" class="flex justify-end gap-1">
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
          {{ $t('org.settings.surface.loaded_count', { count: registries.length }) }}
        </template>
      </SettingsTable>
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
import RegistryEdit from '~/components/registry/RegistryEdit.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import SettingsTable from '~/components/settings/SettingsTable.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import { requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';
import { usePagination } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Registry } from '~/lib/api/types';
import { deepClone } from '~/lib/utils';

defineProps<{
  orgId: string;
}>();

type OrganizationRegistry = Registry & { edit: boolean; level: 'org' | 'global' };

const emptyRegistry: Partial<Registry> = {
  address: '',
  username: '',
  password: '',
};

const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();
const org = requiredInject('org');
const orgLifecycle = requiredInject('org-lifecycle');

const selectedRegistry = ref<Partial<Registry>>();
const isEditing = computed(() => !!selectedRegistry.value?.id);
const loadError = ref('');
const confirmedRegistries = ref<Registry[] | null>(null);
let reloadGeneration = 0;

interface MutationOwnership {
  orgId: number;
  lifecycle: number;
}

let saveOwnership: MutationOwnership | undefined;
let deleteOwnership: MutationOwnership | undefined;

function currentOwnership(): MutationOwnership {
  return { orgId: org.value.id, lifecycle: orgLifecycle.value };
}

function ownsCurrentLifecycle(ownership: MutationOwnership | undefined) {
  return ownership?.lifecycle === orgLifecycle.value && ownership.orgId === org.value.id;
}

function notifyMutationError(error: unknown) {
  notifications.notify({
    title: error instanceof Error ? error.message : i18n.t('org.settings.surface.registries_mutation_error_fallback'),
    type: 'error',
  });
}

async function loadRegistries(page: number, level: 'org' | 'global'): Promise<Registry[] | null> {
  const requestOrgId = org.value.id;
  const requestLifecycle = orgLifecycle.value;
  const requestGeneration = reloadGeneration;
  try {
    if (level === 'org') {
      return await apiClient.getOrgRegistryList(requestOrgId, { page });
    }
    return await apiClient.getGlobalRegistryList({ page });
  } catch (error) {
    if (
      requestLifecycle === orgLifecycle.value &&
      requestOrgId === org.value.id &&
      requestGeneration === reloadGeneration
    ) {
      loadError.value =
        error instanceof Error ? error.message : i18n.t('org.settings.surface.registries_error_fallback');
    }
    return [];
  }
}

const {
  resetPage,
  data: registryRows,
  loading,
} = usePagination(loadRegistries, () => !selectedRegistry.value, {
  each: ['org', 'global'],
});
const displayedRegistryRows = computed(() => confirmedRegistries.value ?? registryRows.value);
const registries = computed<OrganizationRegistry[]>(() => {
  const byAddress = new Map<string, OrganizationRegistry>();

  for (const registry of displayedRegistryRows.value.filter((row) => row.org_id === 0)) {
    byAddress.set(registry.address, { ...registry, edit: false, level: 'global' });
  }
  for (const registry of displayedRegistryRows.value.filter((row) => row.org_id !== 0)) {
    byAddress.set(registry.address, { ...registry, edit: true, level: 'org' });
  }

  return [...byAddress.values()].sort((a, b) => a.address.localeCompare(b.address));
});

watch(
  [registryRows, loading, loadError],
  ([rows, isLoading, error]) => {
    if (!isLoading && !error) {
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
      if (!isLoading) {
        stop();
        resolve();
      }
    });
  });
}

async function reloadRegistries() {
  reloadGeneration += 1;
  loadError.value = '';
  await resetPage();
  await waitForPaginationIdle();
}

const { doSubmit: saveRegistry, isLoading: isSaving } = useAsyncAction(async () => {
  if (!selectedRegistry.value) {
    throw new Error("Unexpected: Can't get registry");
  }

  saveOwnership = currentOwnership();
  const editing = isEditing.value;
  try {
    if (editing) {
      await apiClient.updateOrgRegistry(saveOwnership.orgId, selectedRegistry.value);
    } else {
      await apiClient.createOrgRegistry(saveOwnership.orgId, selectedRegistry.value);
    }
  } catch (error) {
    if (ownsCurrentLifecycle(saveOwnership)) {
      notifyMutationError(error);
    }
    return;
  }
  if (!ownsCurrentLifecycle(saveOwnership)) {
    return;
  }

  notifications.notify({
    title: editing ? i18n.t('registries.saved') : i18n.t('registries.created'),
    type: 'success',
  });
  selectedRegistry.value = undefined;
  await reloadRegistries();
});

const { doSubmit: deleteRegistry, isLoading: isDeleting } = useAsyncAction(async (registry: Registry) => {
  deleteOwnership = currentOwnership();
  try {
    await apiClient.deleteOrgRegistry(deleteOwnership.orgId, registry.address);
  } catch (error) {
    if (ownsCurrentLifecycle(deleteOwnership)) {
      notifyMutationError(error);
    }
    return;
  }
  if (!ownsCurrentLifecycle(deleteOwnership)) {
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

function confirmDeleteRegistry(registry: Registry) {
  // eslint-disable-next-line no-alert
  if (confirm(i18n.t('registries.delete_confirm'))) {
    void deleteRegistry(registry);
  }
}

function scopeLabel(level: 'org' | 'global') {
  return level === 'org' ? i18n.t('org_level_registry') : i18n.t('global_level_registry');
}

useWPTitle(computed(() => [i18n.t('registries.registries'), org.value.name]));
</script>

<style scoped>
@reference '~/tailwind.css';

.org-settings-page {
  @apply flex min-w-0 flex-col gap-4;
}

.org-settings-page-header {
  @apply flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between;
}

.org-settings-page-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.org-settings-page-header p {
  @apply text-wp-text-alt-100 mt-1 max-w-2xl text-xs leading-5;
}

.resource-name {
  @apply flex min-w-0 items-center gap-2;
}

.resource-name :deep(svg) {
  @apply h-4 w-4 shrink-0;
}
</style>
