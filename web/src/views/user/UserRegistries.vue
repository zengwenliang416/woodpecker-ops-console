<template>
  <div class="user-resource-page">
    <header class="user-resource-page-header">
      <div class="min-w-0">
        <h1>{{ $t('registries.credentials') }}</h1>
        <p>{{ $t('user.settings.registries.desc') }}</p>
      </div>
      <Button v-if="selectedRegistry" :text="$t('registries.show')" start-icon="back" @click="closeEditor" />
      <Button v-else color="green" :text="$t('registries.add')" start-icon="plus" @click="showAddRegistry" />
    </header>

    <SettingsSection
      v-if="selectedRegistry"
      :title="isEditingRegistry ? $t('registries.edit') : $t('registries.add')"
      :description="$t('user.settings.surface.registry_form_description')"
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
          <Button start-icon="refresh" :text="$t('user.settings.surface.retry')" @click="reloadRegistries" />
        </template>
      </FeedbackState>
      <FeedbackState
        v-if="loading && displayedRegistries.length === 0"
        kind="loading"
        :title="$t('user.settings.surface.registries_loading_title')"
        :description="$t('user.settings.surface.registries_loading_description')"
      />
      <FeedbackState
        v-else-if="!loadError && displayedRegistries.length === 0"
        kind="empty"
        :title="$t('registries.none')"
        :description="$t('user.settings.surface.registries_empty_description')"
      >
        <template #action><Button start-icon="plus" :text="$t('registries.add')" @click="showAddRegistry" /></template>
      </FeedbackState>
      <SettingsTable v-else min-width="620px">
        <template #head>
          <tr>
            <th>{{ $t('registries.address.address') }}</th>
            <th>{{ $t('username') }}</th>
            <th>{{ $t('user.settings.surface.access') }}</th>
            <th>
              <span class="sr-only">{{ $t('user.settings.surface.actions') }}</span>
            </th>
          </tr>
        </template>
        <tr v-for="registry in displayedRegistries" :key="`${registry.id}-${registry.address}`">
          <td class="font-mono font-semibold">{{ registry.address }}</td>
          <td>{{ registry.username || '—' }}</td>
          <td>
            <Badge
              :value="registry.readonly ? $t('user.settings.surface.read_only') : $t('user.settings.surface.editable')"
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
          {{ $t('user.settings.surface.loaded_count', { count: displayedRegistries.length }) }}
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
import RegistryEdit from '~/components/registry/RegistryEdit.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import SettingsTable from '~/components/settings/SettingsTable.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import useAuthentication from '~/compositions/useAuthentication';
import useNotifications from '~/compositions/useNotifications';
import { usePagination } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Registry } from '~/lib/api/types';
import { deepClone } from '~/lib/utils';

const emptyRegistry: Partial<Registry> = { address: '', username: '', password: '' };
const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();
const { user } = useAuthentication();
if (!user) throw new Error('Unexpected: Unauthenticated');
const userOrgId = user.org_id;
const selectedRegistry = ref<Partial<Registry>>();
const isEditingRegistry = computed(() => !!selectedRegistry.value?.id);
const loadError = ref('');
const confirmedRegistries = ref<Registry[] | null>(null);
const isSaving = ref(false);
let alive = true;
let lifecycleGeneration = 0;
let saveGeneration = 0;
const ownsLifecycle = (generation: number) => alive && generation === lifecycleGeneration;

function notifyMutationError(error: unknown) {
  notifications.notify({
    title: error instanceof Error ? error.message : i18n.t('user.settings.surface.registry_mutation_error'),
    type: 'error',
  });
}
async function loadRegistries(page: number): Promise<Registry[] | null> {
  const generation = lifecycleGeneration;
  try {
    return await apiClient.getOrgRegistryList(userOrgId, { page });
  } catch (error) {
    if (ownsLifecycle(generation))
      loadError.value = error instanceof Error ? error.message : i18n.t('user.settings.surface.registries_error');
    return [];
  }
}
const { resetPage, data: registries, loading } = usePagination(loadRegistries, () => !selectedRegistry.value);
const displayedRegistries = computed(() => confirmedRegistries.value ?? registries.value);
watch(
  [registries, loading, loadError],
  ([rows, isLoading, error]) => {
    if (alive && !isLoading && !error) confirmedRegistries.value = [...rows];
  },
  { deep: true },
);
async function waitForPaginationIdle() {
  await nextTick();
  if (!loading.value) return;
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
  if (!selectedRegistry.value || isSaving.value) return;
  const mutationGeneration = lifecycleGeneration;
  const requestGeneration = ++saveGeneration;
  const editing = isEditingRegistry.value;
  const submitted = deepClone(selectedRegistry.value);
  isSaving.value = true;
  try {
    if (editing) await apiClient.updateOrgRegistry(userOrgId, submitted);
    else await apiClient.createOrgRegistry(userOrgId, submitted);
  } catch (error) {
    if (ownsLifecycle(mutationGeneration) && requestGeneration === saveGeneration) notifyMutationError(error);
    return;
  } finally {
    if (ownsLifecycle(mutationGeneration) && requestGeneration === saveGeneration) isSaving.value = false;
  }
  if (!ownsLifecycle(mutationGeneration) || requestGeneration !== saveGeneration) return;
  notifications.notify({ title: editing ? i18n.t('registries.saved') : i18n.t('registries.created'), type: 'success' });
  selectedRegistry.value = undefined;
  await reloadRegistries();
}
const { doSubmit: deleteRegistry, isLoading: isDeleting } = useAsyncAction(async (registry: Registry) => {
  const generation = lifecycleGeneration;
  try {
    await apiClient.deleteOrgRegistry(userOrgId, registry.address);
  } catch (error) {
    if (ownsLifecycle(generation)) notifyMutationError(error);
    return;
  }
  if (!ownsLifecycle(generation)) return;
  notifications.notify({ title: i18n.t('registries.deleted'), type: 'success' });
  await reloadRegistries();
});
function invalidateEditor() {
  lifecycleGeneration += 1;
  saveGeneration += 1;
  isSaving.value = false;
}
function closeEditor() {
  invalidateEditor();
  selectedRegistry.value = undefined;
}
function editRegistry(registry: Registry) {
  invalidateEditor();
  selectedRegistry.value = deepClone(registry);
}
function showAddRegistry() {
  invalidateEditor();
  selectedRegistry.value = deepClone(emptyRegistry);
}
function confirmDeleteRegistry(registry: Registry) {
  // eslint-disable-next-line no-alert
  if (confirm(i18n.t('registries.delete_confirm'))) void deleteRegistry(registry);
}
onBeforeUnmount(() => {
  alive = false;
  lifecycleGeneration += 1;
  saveGeneration += 1;
});
useWPTitle(computed(() => [i18n.t('registries.registries'), i18n.t('user.settings.settings')]));
</script>

<style scoped>
@reference '~/tailwind.css';
.user-resource-page {
  @apply flex min-w-0 flex-col gap-4;
}
.user-resource-page-header {
  @apply flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between;
}
.user-resource-page-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}
.user-resource-page-header p {
  @apply text-wp-text-alt-100 mt-1 max-w-2xl text-xs leading-5;
}
</style>
