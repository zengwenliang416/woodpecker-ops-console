<template>
  <div class="org-settings-page">
    <header class="org-settings-page-header">
      <div class="min-w-0">
        <h1>{{ $t('secrets.secrets') }}</h1>
        <p>{{ $t('org.settings.secrets.desc') }}</p>
      </div>
      <Button v-if="selectedSecret" :text="$t('secrets.show')" start-icon="back" @click="selectedSecret = undefined" />
      <Button v-else color="green" :text="$t('secrets.add')" start-icon="plus" @click="showAddSecret" />
    </header>

    <SettingsSection
      v-if="selectedSecret"
      :title="isEditingSecret ? $t('secrets.edit') : $t('secrets.add')"
      :description="$t('org.settings.surface.secrets_form_description')"
    >
      <SecretEdit
        v-model="selectedSecret"
        :is-saving="isSaving"
        @save="saveSecret"
        @cancel="selectedSecret = undefined"
      />
    </SettingsSection>

    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('org.settings.surface.secrets_error_title')"
        :description="loadError"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('org.surface.retry')" @click="reloadSecrets" />
        </template>
      </FeedbackState>

      <FeedbackState
        v-if="loading && displayedSecrets.length === 0"
        kind="loading"
        :title="$t('org.settings.surface.secrets_loading_title')"
        :description="$t('org.settings.surface.secrets_loading_description')"
      />

      <FeedbackState
        v-else-if="!loadError && displayedSecrets.length === 0"
        kind="empty"
        :title="$t('secrets.none')"
        :description="$t('org.settings.surface.secrets_empty_description')"
      >
        <template #action>
          <Button start-icon="plus" :text="$t('secrets.add')" @click="showAddSecret" />
        </template>
      </FeedbackState>

      <SettingsTable v-else-if="displayedSecrets.length > 0" min-width="720px">
        <template #head>
          <tr>
            <th>{{ $t('secrets.name') }}</th>
            <th>{{ $t('secrets.events.events') }}</th>
            <th>{{ $t('secrets.note') }}</th>
            <th>
              <span class="sr-only">{{ $t('repo.settings_surface.columns.actions') }}</span>
            </th>
          </tr>
        </template>

        <tr v-for="secret in displayedSecrets" :key="`${secret.id}-${secret.name}`">
          <td>
            <div class="resource-name">
              <PrototypeIcon name="secret" />
              <span class="font-mono font-semibold">{{ secret.name }}</span>
            </div>
          </td>
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

        <template #footer>
          {{ $t('org.settings.surface.loaded_count', { count: displayedSecrets.length }) }}
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
import SecretEdit from '~/components/secrets/SecretEdit.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import SettingsTable from '~/components/settings/SettingsTable.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import { requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';
import { usePagination } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import { WebhookEvents } from '~/lib/api/types';
import type { Secret } from '~/lib/api/types';
import { deepClone } from '~/lib/utils';

defineProps<{
  orgId: string;
}>();

const emptySecret: Partial<Secret> = {
  name: '',
  value: '',
  images: [],
  events: [WebhookEvents.Push],
};

const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();
const org = requiredInject('org');
const orgLifecycle = requiredInject('org-lifecycle');

const selectedSecret = ref<Partial<Secret>>();
const isEditingSecret = computed(() => !!selectedSecret.value?.id);
const loadError = ref('');
const confirmedSecrets = ref<Secret[] | null>(null);
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
    title: error instanceof Error ? error.message : i18n.t('org.settings.surface.secrets_mutation_error_fallback'),
    type: 'error',
  });
}

async function loadSecrets(page: number): Promise<Secret[] | null> {
  const requestOrgId = org.value.id;
  const requestLifecycle = orgLifecycle.value;
  const requestGeneration = reloadGeneration;
  try {
    return await apiClient.getOrgSecretList(requestOrgId, { page });
  } catch (error) {
    if (
      requestLifecycle === orgLifecycle.value &&
      requestOrgId === org.value.id &&
      requestGeneration === reloadGeneration
    ) {
      loadError.value = error instanceof Error ? error.message : i18n.t('org.settings.surface.secrets_error_fallback');
    }
    return [];
  }
}

const { resetPage, data: secrets, loading } = usePagination(loadSecrets, () => !selectedSecret.value);
const displayedSecrets = computed(() => confirmedSecrets.value ?? secrets.value);

watch(
  [secrets, loading, loadError],
  ([rows, isLoading, error]) => {
    if (!isLoading && !error) {
      confirmedSecrets.value = [...rows];
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

async function reloadSecrets() {
  reloadGeneration += 1;
  loadError.value = '';
  await resetPage();
  await waitForPaginationIdle();
}

const { doSubmit: saveSecret, isLoading: isSaving } = useAsyncAction(async () => {
  if (!selectedSecret.value) {
    throw new Error("Unexpected: Can't get secret");
  }

  saveOwnership = currentOwnership();
  const editing = isEditingSecret.value;
  try {
    if (editing) {
      await apiClient.updateOrgSecret(saveOwnership.orgId, selectedSecret.value);
    } else {
      await apiClient.createOrgSecret(saveOwnership.orgId, selectedSecret.value);
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
    title: editing ? i18n.t('secrets.saved') : i18n.t('secrets.created'),
    type: 'success',
  });
  selectedSecret.value = undefined;
  await reloadSecrets();
});

const { doSubmit: deleteSecret, isLoading: isDeleting } = useAsyncAction(async (secret: Secret) => {
  deleteOwnership = currentOwnership();
  try {
    await apiClient.deleteOrgSecret(deleteOwnership.orgId, secret.name);
  } catch (error) {
    if (ownsCurrentLifecycle(deleteOwnership)) {
      notifyMutationError(error);
    }
    return;
  }
  if (!ownsCurrentLifecycle(deleteOwnership)) {
    return;
  }

  notifications.notify({ title: i18n.t('secrets.deleted'), type: 'success' });
  await reloadSecrets();
});

function editSecret(secret: Secret) {
  selectedSecret.value = deepClone(secret);
}

function showAddSecret() {
  selectedSecret.value = deepClone(emptySecret);
}

function confirmDeleteSecret(secret: Secret) {
  // eslint-disable-next-line no-alert
  if (confirm(i18n.t('secrets.delete_confirm'))) {
    void deleteSecret(secret);
  }
}

useWPTitle(computed(() => [i18n.t('secrets.secrets'), org.value.name]));
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
