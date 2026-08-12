<template>
  <div class="repo-settings-page">
    <header class="repo-settings-page-header">
      <div>
        <h1>{{ $t('secrets.secrets') }}</h1>
        <p>{{ $t('secrets.desc') }}</p>
      </div>
      <Button v-if="selectedSecret" :text="$t('secrets.show')" start-icon="back" @click="selectedSecret = undefined" />
      <Button v-else color="green" :text="$t('secrets.add')" start-icon="plus" @click="showAddSecret" />
    </header>

    <RepoSettingsSection
      v-if="selectedSecret"
      :title="isEditingSecret ? $t('secrets.edit') : $t('secrets.add')"
      :description="$t('repo.settings_surface.secrets.form_description')"
    >
      <SecretEdit
        v-model="selectedSecret"
        :is-saving="isSaving"
        @save="createSecret"
        @cancel="selectedSecret = undefined"
      />
    </RepoSettingsSection>

    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('repo.settings_surface.secrets.error_title')"
        :description="loadError"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('repo.settings_surface.retry')" @click="reloadSecrets" />
        </template>
      </FeedbackState>

      <FeedbackState
        v-if="loading && secrets.length === 0"
        kind="loading"
        :title="$t('repo.settings_surface.secrets.loading_title')"
        :description="$t('repo.settings_surface.secrets.loading_description')"
      />

      <FeedbackState
        v-else-if="!loadError && secrets.length === 0"
        kind="empty"
        :title="$t('secrets.none')"
        :description="$t('repo.settings_surface.secrets.empty_description')"
      >
        <template #action>
          <Button start-icon="plus" :text="$t('secrets.add')" @click="showAddSecret" />
        </template>
      </FeedbackState>

      <RepoSettingsTable v-else-if="secrets.length > 0" min-width="720px">
        <template #head>
          <tr>
            <th>{{ $t('secrets.name') }}</th>
            <th>{{ $t('repo.settings_surface.columns.scope') }}</th>
            <th>{{ $t('secrets.events.events') }}</th>
            <th>{{ $t('secrets.note') }}</th>
            <th>
              <span class="sr-only">{{ $t('repo.settings_surface.columns.actions') }}</span>
            </th>
          </tr>
        </template>

        <tr v-for="secret in secrets" :key="`${secret.level}-${secret.id}-${secret.name}`">
          <td>
            <div class="resource-name">
              <PrototypeIcon name="secret" />
              <span class="font-mono font-semibold">{{ secret.name }}</span>
            </div>
          </td>
          <td>
            <Badge :value="scopeLabel(secret.level)" />
          </td>
          <td>
            <div class="flex max-w-72 flex-wrap gap-1">
              <Badge v-for="event in secret.events" :key="event" :value="event" />
            </div>
          </td>
          <td class="max-w-64 truncate" :title="secret.note">{{ secret.note || '—' }}</td>
          <td>
            <div v-if="secret.edit !== false" class="flex justify-end gap-1">
              <IconButton icon="edit" :title="$t('secrets.edit')" @click="editSecret(secret)" />
              <IconButton
                icon="trash"
                class="text-wp-error-100"
                :is-loading="isDeleting"
                :title="$t('secrets.delete')"
                @click="confirmDeleteSecret(secret)"
              />
            </div>
            <span v-else class="text-wp-text-alt-100 text-xs">{{ $t('repo.settings_surface.inherited') }}</span>
          </td>
        </tr>

        <template #footer>
          {{ $t('repo.settings_surface.loaded_count', { count: secrets.length }) }}
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
import RepoSettingsSection from '~/components/settings/SettingsSection.vue';
import RepoSettingsTable from '~/components/settings/SettingsTable.vue';
import SecretEdit from '~/components/secrets/SecretEdit.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import { requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';
import { usePagination } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import { WebhookEvents } from '~/lib/api/types';
import type { Secret } from '~/lib/api/types';
import { deepClone } from '~/lib/utils';

const emptySecret: Partial<Secret> = {
  name: '',
  value: '',
  images: [],
  events: [WebhookEvents.Push],
};

const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();

const repo = requiredInject('repo');
const selectedSecret = ref<Partial<Secret>>();
const isEditingSecret = computed(() => !!selectedSecret.value?.id);
const loadError = ref('');
let reloadGeneration = 0;
let repoLifecycleGeneration = 0;

async function loadSecrets(page: number, level: 'repo' | 'org' | 'global'): Promise<Secret[] | null> {
  const repoId = repo.value.id;
  const requestGeneration = reloadGeneration;

  try {
    switch (level) {
      case 'repo':
        return await apiClient.getSecretList(repoId, { page });
      case 'org':
        return await apiClient.getOrgSecretList(repo.value.org_id, { page });
      case 'global':
        return await apiClient.getGlobalSecretList({ page });
      default:
        throw new Error(`Unexpected level: ${level}`);
    }
  } catch (error) {
    if (repo.value.id === repoId && requestGeneration === reloadGeneration) {
      loadError.value = error instanceof Error ? error.message : i18n.t('repo.settings_surface.secrets.error_fallback');
    }
    return [];
  }
}

const {
  resetPage,
  data: _secrets,
  loading,
} = usePagination(loadSecrets, () => !selectedSecret.value, {
  each: ['repo', 'org', 'global'],
});
const confirmedSecrets = ref<Secret[] | null>(null);
const displayedSecretRows = computed(() => confirmedSecrets.value ?? _secrets.value);
const secrets = computed(() => {
  const secretsList: Record<string, Secret & { edit?: boolean; level: 'repo' | 'org' | 'global' }> = {};

  for (const level of ['repo', 'org', 'global']) {
    for (const secret of displayedSecretRows.value) {
      if (
        ((level === 'repo' && secret.repo_id !== 0 && secret.org_id === 0) ||
          (level === 'org' && secret.repo_id === 0 && secret.org_id !== 0) ||
          (level === 'global' && secret.repo_id === 0 && secret.org_id === 0)) &&
        !secretsList[secret.name]
      ) {
        secretsList[secret.name] = { ...secret, edit: secret.repo_id !== 0, level };
      }
    }
  }

  const levelsOrder = {
    global: 0,
    org: 1,
    repo: 2,
  };

  return Object.values(secretsList)
    .toSorted((a, b) => a.name.localeCompare(b.name))
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

async function reloadSecrets(preserveConfirmed = true) {
  const requestGeneration = ++reloadGeneration;
  loadError.value = '';
  confirmedSecrets.value = preserveConfirmed ? [...displayedSecretRows.value] : null;
  await resetPage();
  await waitForPaginationIdle();
  if (requestGeneration === reloadGeneration && !loadError.value) {
    confirmedSecrets.value = null;
  }
}

watch(
  () => repo.value.id,
  () => {
    repoLifecycleGeneration += 1;
    selectedSecret.value = undefined;
    void reloadSecrets(false);
  },
);

const { doSubmit: createSecret, isLoading: isSaving } = useAsyncAction(async () => {
  if (!selectedSecret.value) {
    throw new Error("Unexpected: Can't get secret");
  }

  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  const editing = isEditingSecret.value;
  const secret = deepClone(selectedSecret.value);
  if (editing) {
    await apiClient.updateSecret(repoId, secret);
  } else {
    await apiClient.createSecret(repoId, secret);
  }
  if (repo.value.id !== repoId || requestGeneration !== repoLifecycleGeneration) {
    return;
  }
  notifications.notify({
    title: editing ? i18n.t('secrets.saved') : i18n.t('secrets.created'),
    type: 'success',
  });
  selectedSecret.value = undefined;
  await reloadSecrets();
});

const { doSubmit: deleteSecret, isLoading: isDeleting } = useAsyncAction(async (_secret: Secret) => {
  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  await apiClient.deleteSecret(repoId, _secret.name);
  if (repo.value.id !== repoId || requestGeneration !== repoLifecycleGeneration) {
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

function scopeLabel(level: 'repo' | 'org' | 'global') {
  if (level === 'repo') {
    return i18n.t('repo.settings_surface.scope.repo');
  }
  if (level === 'org') {
    return i18n.t('repo.settings_surface.scope.org');
  }
  return i18n.t('repo.settings_surface.scope.global');
}

function confirmDeleteSecret(secret: Secret) {
  // eslint-disable-next-line no-alert
  if (confirm(i18n.t('secrets.delete_confirm'))) {
    deleteSecret(secret);
  }
}

useWPTitle(computed(() => [i18n.t('secrets.secrets'), repo.value.full_name]));
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
