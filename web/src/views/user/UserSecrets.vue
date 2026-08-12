<template>
  <div class="user-resource-page">
    <header class="user-resource-page-header">
      <div class="min-w-0">
        <h1>{{ $t('secrets.secrets') }}</h1>
        <p>{{ $t('user.settings.secrets.desc') }}</p>
      </div>
      <Button v-if="selectedSecret" :text="$t('secrets.show')" start-icon="back" @click="closeEditor" />
      <Button v-else color="green" :text="$t('secrets.add')" start-icon="plus" @click="showAddSecret" />
    </header>

    <SettingsSection
      v-if="selectedSecret"
      :title="isEditingSecret ? $t('secrets.edit') : $t('secrets.add')"
      :description="$t('user.settings.surface.secret_form_description')"
    >
      <SecretEdit v-model="selectedSecret" :is-saving="isSaving" @save="saveSecret" @cancel="closeEditor" />
    </SettingsSection>

    <template v-else>
      <FeedbackState v-if="loadError" compact kind="error" :title="$t('secrets.secrets')" :description="loadError">
        <template #action>
          <Button start-icon="refresh" :text="$t('user.settings.surface.retry')" @click="reloadSecrets" />
        </template>
      </FeedbackState>

      <FeedbackState
        v-if="loading && displayedSecrets.length === 0"
        kind="loading"
        :title="$t('user.settings.surface.secrets_loading_title')"
        :description="$t('user.settings.surface.secrets_loading_description')"
      />

      <FeedbackState
        v-else-if="!loadError && displayedSecrets.length === 0"
        kind="empty"
        :title="$t('secrets.none')"
        :description="$t('user.settings.surface.secrets_empty_description')"
      >
        <template #action>
          <Button start-icon="plus" :text="$t('secrets.add')" @click="showAddSecret" />
        </template>
      </FeedbackState>

      <SettingsTable v-else min-width="680px">
        <template #head>
          <tr>
            <th>{{ $t('secrets.name') }}</th>
            <th>{{ $t('secrets.events.events') }}</th>
            <th>{{ $t('secrets.note') }}</th>
            <th>
              <span class="sr-only">{{ $t('user.settings.surface.actions') }}</span>
            </th>
          </tr>
        </template>
        <tr v-for="secret in displayedSecrets" :key="`${secret.id}-${secret.name}`">
          <td class="font-mono font-semibold">{{ secret.name }}</td>
          <td>
            <div class="flex max-w-72 flex-wrap gap-1">
              <Badge v-for="event in secret.events" :key="event" :value="event" />
            </div>
          </td>
          <td class="max-w-64 truncate" :title="secret.note">{{ secret.note || '—' }}</td>
          <td>
            <div class="flex justify-end gap-1">
              <IconButton icon="edit" :title="$t('secrets.edit')" @click="editSecret(secret)" />
              <IconButton
                icon="trash"
                class="text-wp-error-100"
                :is-loading="isDeleting"
                :title="$t('secrets.delete')"
                @click="confirmDeleteSecret(secret)"
              />
            </div>
          </td>
        </tr>
        <template #footer>{{ $t('user.settings.surface.loaded_count', { count: displayedSecrets.length }) }}</template>
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
import SecretEdit from '~/components/secrets/SecretEdit.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import SettingsTable from '~/components/settings/SettingsTable.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import useAuthentication from '~/compositions/useAuthentication';
import useNotifications from '~/compositions/useNotifications';
import { usePagination } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Secret } from '~/lib/api/types';
import { WebhookEvents } from '~/lib/api/types';
import { deepClone } from '~/lib/utils';

const emptySecret: Partial<Secret> = { name: '', value: '', images: [], events: [WebhookEvents.Push] };
const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();
const { user } = useAuthentication();
if (!user) throw new Error('Unexpected: Unauthenticated');
const userOrgId = user.org_id;

const selectedSecret = ref<Partial<Secret>>();
const isEditingSecret = computed(() => !!selectedSecret.value?.id);
const loadError = ref('');
const confirmedSecrets = ref<Secret[] | null>(null);
const isSaving = ref(false);
let alive = true;
let lifecycleGeneration = 0;
let saveGeneration = 0;
const ownsLifecycle = (generation: number) => alive && generation === lifecycleGeneration;

function notifyMutationError(error: unknown) {
  notifications.notify({
    title: error instanceof Error ? error.message : i18n.t('user.settings.surface.secret_mutation_error'),
    type: 'error',
  });
}

async function loadSecrets(page: number): Promise<Secret[] | null> {
  const generation = lifecycleGeneration;
  try {
    return await apiClient.getOrgSecretList(userOrgId, { page });
  } catch (error) {
    if (ownsLifecycle(generation)) {
      loadError.value = error instanceof Error ? error.message : i18n.t('user.settings.surface.secrets_error');
    }
    return [];
  }
}

const { resetPage, data: secrets, loading } = usePagination(loadSecrets, () => !selectedSecret.value);
const displayedSecrets = computed(() => confirmedSecrets.value ?? secrets.value);
watch(
  [secrets, loading, loadError],
  ([rows, isLoading, error]) => {
    if (alive && !isLoading && !error) confirmedSecrets.value = [...rows];
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

async function reloadSecrets() {
  lifecycleGeneration += 1;
  loadError.value = '';
  await resetPage();
  await waitForPaginationIdle();
}

async function saveSecret() {
  if (!selectedSecret.value || isSaving.value) return;
  const mutationGeneration = lifecycleGeneration;
  const requestGeneration = ++saveGeneration;
  const editing = isEditingSecret.value;
  const submitted = deepClone(selectedSecret.value);
  isSaving.value = true;
  try {
    if (editing) await apiClient.updateOrgSecret(userOrgId, submitted);
    else await apiClient.createOrgSecret(userOrgId, submitted);
  } catch (error) {
    if (ownsLifecycle(mutationGeneration) && requestGeneration === saveGeneration) notifyMutationError(error);
    return;
  } finally {
    if (ownsLifecycle(mutationGeneration) && requestGeneration === saveGeneration) isSaving.value = false;
  }
  if (!ownsLifecycle(mutationGeneration) || requestGeneration !== saveGeneration) return;
  notifications.notify({ title: editing ? i18n.t('secrets.saved') : i18n.t('secrets.created'), type: 'success' });
  selectedSecret.value = undefined;
  await reloadSecrets();
}

const { doSubmit: deleteSecret, isLoading: isDeleting } = useAsyncAction(async (secret: Secret) => {
  const generation = lifecycleGeneration;
  try {
    await apiClient.deleteOrgSecret(userOrgId, secret.name);
  } catch (error) {
    if (ownsLifecycle(generation)) notifyMutationError(error);
    return;
  }
  if (!ownsLifecycle(generation)) return;
  notifications.notify({ title: i18n.t('secrets.deleted'), type: 'success' });
  await reloadSecrets();
});

function invalidateEditor() {
  lifecycleGeneration += 1;
  saveGeneration += 1;
  isSaving.value = false;
}
function closeEditor() {
  invalidateEditor();
  selectedSecret.value = undefined;
}
function editSecret(secret: Secret) {
  invalidateEditor();
  selectedSecret.value = deepClone(secret);
}
function showAddSecret() {
  invalidateEditor();
  selectedSecret.value = deepClone(emptySecret);
}
function confirmDeleteSecret(secret: Secret) {
  // eslint-disable-next-line no-alert
  if (confirm(i18n.t('secrets.delete_confirm'))) void deleteSecret(secret);
}

onBeforeUnmount(() => {
  alive = false;
  lifecycleGeneration += 1;
  saveGeneration += 1;
});
useWPTitle(computed(() => [i18n.t('secrets.secrets'), i18n.t('user.settings.settings')]));
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
