<template>
  <div class="admin-resource-page min-w-0">
    <SettingsSection :title="$t('admin.settings.users.users')" :description="$t('admin.settings.users.desc')">
      <template #actions>
        <Button v-if="selectedUser" :text="$t('admin.settings.users.show')" start-icon="back" @click="closeEditor" />
        <Button v-else color="green" :text="$t('admin.settings.users.add')" start-icon="plus" @click="showAddUser" />
      </template>

      <form v-if="selectedUser" @submit.prevent="saveUser">
        <InputField v-slot="{ id }" :label="$t('admin.settings.users.login')">
          <TextField
            :id="id"
            v-model="selectedUser.login"
            :placeholder="$t('admin.settings.users.login')"
            :disabled="isEditingUser"
          />
        </InputField>

        <InputField
          v-if="selectedUser.forge_id !== undefined && forgesMap.has(selectedUser.forge_id)"
          v-slot="{ id }"
          :label="$t('admin.settings.users.forge')"
        >
          <TextField :id="id" v-model="selectedUserForge" :placeholder="$t('admin.settings.users.forge')" disabled />
        </InputField>

        <InputField v-slot="{ id }" :label="$t('admin.settings.users.email')">
          <TextField :id="id" v-model="selectedUser.email" :placeholder="$t('admin.settings.users.email')" />
        </InputField>

        <InputField v-slot="{ id }" :label="$t('admin.settings.users.avatar_url')">
          <div class="flex gap-2">
            <img v-if="selectedUser.avatar_url" class="h-8 w-8 rounded-md" :src="selectedUser.avatar_url" alt="" />
            <TextField
              :id="id"
              v-model="selectedUser.avatar_url"
              login
              :placeholder="$t('admin.settings.users.avatar_url')"
            />
          </div>
        </InputField>

        <InputField :label="$t('admin.settings.users.admin.admin')">
          <Warning
            v-if="selectedUser.admin_env"
            class="mb-4 text-sm"
            :text="$t('admin.settings.users.admin.admin_warning')"
          />

          <Checkbox
            :model-value="selectedUser.admin || false"
            :label="$t('admin.settings.users.admin.placeholder')"
            @update:model-value="selectedUser!.admin = $event"
          />
        </InputField>

        <div class="flex flex-wrap gap-2">
          <Button :text="$t('admin.settings.users.cancel')" @click="closeEditor" />
          <Button
            :is-loading="isSaving"
            type="submit"
            color="green"
            :text="isEditingUser ? $t('admin.settings.users.save') : $t('admin.settings.users.add')"
          />
        </div>
      </form>

      <template v-else>
        <FeedbackState v-if="loadError" compact kind="error" :title="$t('unknown_error')" :description="loadError">
          <template #action>
            <Button start-icon="refresh" :text="$t('admin.settings.surface.retry')" @click="reloadUsers" />
          </template>
        </FeedbackState>

        <FeedbackState
          v-if="loading && displayedUsers.length === 0"
          kind="loading"
          :title="$t('feedback.loading_title')"
          :description="$t('feedback.loading_description')"
        />

        <FeedbackState
          v-else-if="!loadError && displayedUsers.length === 0"
          kind="empty"
          :title="$t('admin.settings.users.none')"
        >
          <template #action>
            <Button start-icon="plus" :text="$t('admin.settings.users.add')" @click="showAddUser" />
          </template>
        </FeedbackState>

        <SettingsTable v-else-if="displayedUsers.length > 0" class="mt-3" min-width="760px">
          <template #head>
            <tr>
              <th>{{ $t('admin.settings.users.login') }}</th>
              <th>{{ $t('admin.settings.users.email') }}</th>
              <th>{{ $t('admin.settings.users.forge') }}</th>
              <th>{{ $t('admin.settings.users.admin.admin') }}</th>
              <th>
                <span class="sr-only">{{ $t('admin.settings.surface.actions') }}</span>
              </th>
            </tr>
          </template>

          <tr v-for="user in displayedUsers" :key="user.id">
            <td>
              <div class="flex min-w-0 items-center gap-2">
                <img v-if="user.avatar_url" class="h-7 w-7 shrink-0 rounded-md" :src="user.avatar_url" alt="" />
                <span class="font-semibold">{{ user.login }}</span>
              </div>
            </td>
            <td>{{ user.email || $t('admin.settings.surface.not_available') }}</td>
            <td>
              <Badge v-if="forgesMap.has(user.forge_id)" :value="forgesMap.get(user.forge_id)" />
              <span v-else>{{ $t('admin.settings.surface.not_available') }}</span>
            </td>
            <td>
              <Badge v-if="user.admin" :value="$t('admin.settings.users.admin.admin')" />
              <span v-else>{{ $t('admin.settings.surface.not_available') }}</span>
            </td>
            <td>
              <div class="flex justify-end gap-1">
                <IconButton icon="edit" :title="$t('admin.settings.users.edit_user')" @click="editUser(user)" />
                <IconButton
                  icon="trash"
                  class="text-wp-error-100"
                  :title="$t('admin.settings.users.delete_user')"
                  :is-loading="isDeleting"
                  @click="confirmDeleteUser(user)"
                />
              </div>
            </td>
          </tr>

          <template #footer>
            {{ $t('admin.settings.surface.loaded_count', { count: displayedUsers.length }) }}
          </template>
        </SettingsTable>
      </template>
    </SettingsSection>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Badge from '~/components/atomic/Badge.vue';
import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Warning from '~/components/atomic/Warning.vue';
import Checkbox from '~/components/form/Checkbox.vue';
import InputField from '~/components/form/InputField.vue';
import TextField from '~/components/form/TextField.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import SettingsTable from '~/components/settings/SettingsTable.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import useNotifications from '~/compositions/useNotifications';
import { usePagination } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Forge, User } from '~/lib/api/types';
import { deepClone } from '~/lib/utils';

const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();

const forgesMap = ref<Map<number, string>>(new Map());
const selectedUser = ref<Partial<User>>();
const isEditingUser = computed(() => !!selectedUser.value?.id);
const selectedUserForge = computed(() => forgesMap.value.get(selectedUser.value?.forge_id ?? -1));
const usersError = ref('');
const forgesError = ref('');
const loadError = computed(() => usersError.value || forgesError.value);
const confirmedUsers = ref<User[] | null>(null);
const isSaving = ref(false);
let mounted = true;
let requestGeneration = 0;
let lifecycle = 0;
let saveGeneration = 0;

function ownsLifecycle(ownership: number) {
  return mounted && ownership === lifecycle;
}

function notifyMutationError(error: unknown) {
  notifications.notify({
    title: error instanceof Error ? error.message : i18n.t('unknown_error'),
    type: 'error',
  });
}

function forgeLabel(forge: Forge) {
  const endpoint = forge.oauth_host || forge.url;
  if (endpoint) {
    try {
      return new URL(endpoint).hostname;
    } catch {
      // Fall back to the typed Forge kind when the server URL is not absolute.
    }
  }
  return forge.type.charAt(0).toUpperCase() + forge.type.slice(1);
}

async function loadForges() {
  const ownership = requestGeneration;
  try {
    const forges = await apiClient.getForges({ page: 1 });
    if (mounted && ownership === requestGeneration && forges) {
      forgesMap.value = new Map(forges.map((forge) => [forge.id, forgeLabel(forge)]));
    }
  } catch (error) {
    if (mounted && ownership === requestGeneration) {
      forgesError.value = error instanceof Error ? error.message : i18n.t('unknown_error');
    }
  }
}

onMounted(loadForges);

async function loadUsers(page: number): Promise<User[] | null> {
  const ownership = requestGeneration;
  try {
    const result = await apiClient.getUsers({ page });
    if (mounted && ownership === requestGeneration && page === 1 && (result?.length ?? 0) === 0) {
      confirmedUsers.value = [];
    }
    return result;
  } catch (error) {
    if (mounted && ownership === requestGeneration) {
      usersError.value = error instanceof Error ? error.message : i18n.t('unknown_error');
    }
    return [];
  }
}

const { resetPage, data: users, loading } = usePagination(loadUsers, () => !selectedUser.value);
const displayedUsers = computed(() => confirmedUsers.value ?? users.value);

watch(
  [users, loading, loadError],
  ([rows, isLoading, error]) => {
    if (!isLoading && !error && (confirmedUsers.value === null || rows.length > 0)) {
      confirmedUsers.value = [...rows];
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

async function reloadUsers() {
  requestGeneration += 1;
  usersError.value = '';
  forgesError.value = '';
  await Promise.all([loadForges(), resetPage()]);
  await waitForPaginationIdle();
}

async function saveUser() {
  if (!selectedUser.value || isSaving.value) {
    return;
  }

  const ownership = lifecycle;
  const requestGeneration = ++saveGeneration;
  const editing = isEditingUser.value;
  const submittedUser = deepClone(selectedUser.value);
  isSaving.value = true;

  try {
    if (editing) {
      await apiClient.updateUser(submittedUser);
    } else {
      await apiClient.createUser(submittedUser);
    }
  } catch (error) {
    if (ownsLifecycle(ownership) && requestGeneration === saveGeneration) {
      notifyMutationError(error);
    }
    return;
  } finally {
    if (ownsLifecycle(ownership) && requestGeneration === saveGeneration) {
      isSaving.value = false;
    }
  }
  if (!ownsLifecycle(ownership) || requestGeneration !== saveGeneration) {
    return;
  }

  notifications.notify({
    title: editing ? i18n.t('admin.settings.users.saved') : i18n.t('admin.settings.users.created'),
    type: 'success',
  });
  selectedUser.value = undefined;
  lifecycle += 1;
  await reloadUsers();
}

const { doSubmit: deleteUser, isLoading: isDeleting } = useAsyncAction(async (user: User) => {
  const ownership = lifecycle;
  try {
    await apiClient.deleteUser(user);
  } catch (error) {
    if (ownsLifecycle(ownership)) {
      notifyMutationError(error);
    }
    return;
  }
  if (!ownsLifecycle(ownership)) {
    return;
  }

  notifications.notify({ title: i18n.t('admin.settings.users.deleted'), type: 'success' });
  await reloadUsers();
});

function editUser(user: User) {
  invalidateEditor();
  selectedUser.value = deepClone(user);
}

function showAddUser() {
  invalidateEditor();
  selectedUser.value = { login: '' };
}

function invalidateEditor() {
  lifecycle += 1;
  saveGeneration += 1;
  isSaving.value = false;
}

function closeEditor() {
  invalidateEditor();
  selectedUser.value = undefined;
}

function confirmDeleteUser(user: User) {
  // eslint-disable-next-line no-alert
  if (confirm(i18n.t('admin.settings.users.delete_confirm'))) {
    void deleteUser(user);
  }
}

onBeforeUnmount(() => {
  mounted = false;
  lifecycle += 1;
  saveGeneration += 1;
  requestGeneration += 1;
});

useWPTitle(computed(() => [i18n.t('admin.settings.users.users'), i18n.t('admin.settings.settings')]));
</script>

<style scoped>
@reference '~/tailwind.css';

.admin-resource-page {
  @apply flex max-w-full flex-col gap-4;
  contain: layout paint;
}
</style>
