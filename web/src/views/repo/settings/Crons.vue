<template>
  <div class="repo-settings-page">
    <header class="repo-settings-page-header">
      <div>
        <h1>{{ $t('repo.settings.crons.crons') }}</h1>
        <p>{{ $t('repo.settings.crons.desc') }}</p>
      </div>
      <Button
        v-if="selectedCron"
        start-icon="back"
        :text="$t('repo.settings.crons.show')"
        @click="selectedCron = undefined"
      />
      <Button
        v-else
        color="green"
        start-icon="plus"
        :text="$t('repo.settings.crons.add')"
        @click="selectedCron = { timezone: 'UTC' }"
      />
    </header>

    <RepoSettingsSection
      v-if="selectedCron"
      :title="isEditingCron ? $t('repo.settings.crons.edit') : $t('repo.settings.crons.add')"
      :description="$t('repo.settings_surface.crons.form_description')"
    >
      <form class="space-y-2" @submit.prevent="createCron">
        <InputField v-slot="{ id }" :label="$t('repo.settings.crons.name.name')">
          <TextField
            :id="id"
            v-model="selectedCron.name"
            :placeholder="$t('repo.settings.crons.name.placeholder')"
            required
          />
        </InputField>

        <Checkbox v-model="selectedCronEnabled" :label="$t('repo.settings.crons.enabled')" />

        <InputField v-slot="{ id }" :label="$t('repo.settings.crons.branch.title')">
          <TextField
            :id="id"
            v-model="selectedCron.branch"
            :placeholder="$t('repo.settings.crons.branch.placeholder')"
          />
        </InputField>

        <InputField v-slot="{ id }" :label="$t('repo.settings.crons.timezone')">
          <SelectField :id="id" v-model="selectedCronTimezone" :options="timezones" />
        </InputField>

        <InputField
          v-slot="{ id }"
          :label="$t('repo.settings.crons.schedule.title')"
          docs-url="https://pkg.go.dev/github.com/gdgvda/cron#hdr-CRON_Expression_Format"
        >
          <TextField
            :id="id"
            v-model="selectedCron.schedule"
            :placeholder="$t('repo.settings.crons.schedule.placeholder')"
            required
          />
        </InputField>

        <div v-if="isEditingCron && selectedCronEnabled" class="mb-4 ml-auto">
          <span v-if="selectedCron.next_exec && selectedCron.next_exec > 0" class="text-wp-text-100">
            {{
              $t('repo.settings.crons.next_exec_both', {
                local: date.toLocaleString(new Date(selectedCron.next_exec * 1000)),
                zoned: date.toLocaleString(new Date(selectedCron.next_exec * 1000), selectedCron.timezone),
                timezone: selectedCron.timezone,
              })
            }}
          </span>
          <span v-else class="text-wp-text-100">{{ $t('repo.settings.crons.not_executed_yet') }}</span>
        </div>

        <InputField v-slot="{ id }" :label="$t('repo.manual_pipeline.variables.title')">
          <span class="text-wp-text-alt-100 mb-2 text-sm">{{ $t('repo.manual_pipeline.variables.desc') }}</span>
          <KeyValueEditor
            :id="id"
            v-model="selectedCronVariables"
            :key-placeholder="$t('repo.manual_pipeline.variables.name')"
            :value-placeholder="$t('repo.manual_pipeline.variables.value')"
            :delete-title="$t('repo.manual_pipeline.variables.delete')"
            @update:is-valid="isVariablesValid = $event"
          />
        </InputField>

        <div class="flex gap-2">
          <Button type="button" color="gray" :text="$t('cancel')" @click="selectedCron = undefined" />
          <Button
            type="submit"
            color="green"
            :is-loading="isSaving"
            :text="isEditingCron ? $t('repo.settings.crons.save') : $t('repo.settings.crons.add')"
            :disabled="!isFormValid"
          />
        </div>
      </form>
    </RepoSettingsSection>

    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('repo.settings_surface.crons.error_title')"
        :description="loadError"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('repo.settings_surface.retry')" @click="reloadCrons" />
        </template>
      </FeedbackState>

      <FeedbackState
        v-if="loading && crons.length === 0"
        kind="loading"
        :title="$t('repo.settings_surface.crons.loading_title')"
        :description="$t('repo.settings_surface.crons.loading_description')"
      />

      <FeedbackState
        v-else-if="!loadError && crons.length === 0"
        kind="empty"
        :title="$t('repo.settings.crons.none')"
        :description="$t('repo.settings_surface.crons.empty_description')"
      >
        <template #action>
          <Button start-icon="plus" :text="$t('repo.settings.crons.add')" @click="selectedCron = { timezone: 'UTC' }" />
        </template>
      </FeedbackState>

      <RepoSettingsTable v-else-if="crons.length > 0" min-width="820px">
        <template #head>
          <tr>
            <th>{{ $t('repo.settings.crons.name.name') }}</th>
            <th>{{ $t('repo.settings.crons.schedule.title') }}</th>
            <th>{{ $t('repo.settings.crons.branch.title') }}</th>
            <th>{{ $t('repo.settings.crons.timezone') }}</th>
            <th>{{ $t('repo.settings_surface.crons.next_execution') }}</th>
            <th>{{ $t('repo.settings.crons.enabled') }}</th>
            <th>
              <span class="sr-only">{{ $t('repo.settings_surface.columns.actions') }}</span>
            </th>
          </tr>
        </template>

        <tr v-for="cron in crons" :key="cron.id">
          <td class="font-semibold">{{ cron.name }}</td>
          <td class="font-mono">{{ cron.schedule }}</td>
          <td class="font-mono">{{ cron.branch || repo.default_branch || '—' }}</td>
          <td>{{ cron.timezone || 'UTC' }}</td>
          <td>
            <span v-if="cron.enabled && cron.next_exec > 0" :title="$t('repo.settings.crons.your_timezone')">
              {{
                $t('repo.settings.crons.next_exec_local', {
                  local: date.toLocaleString(new Date(cron.next_exec * 1000)),
                })
              }}
            </span>
            <span v-else-if="cron.enabled">{{ $t('repo.settings.crons.not_executed_yet') }}</span>
            <span v-else>{{ $t('disabled') }}</span>
          </td>
          <td>
            <Badge :value="cron.enabled ? $t('repo.settings.crons.enabled') : $t('disabled')" />
          </td>
          <td>
            <div class="flex justify-end gap-1">
              <IconButton
                icon="play-outline"
                :is-loading="isRunning"
                :title="$t('repo.settings.crons.run')"
                @click="runCron(cron)"
              />
              <IconButton icon="edit" :title="$t('repo.settings.crons.edit')" @click="editCron(cron)" />
              <IconButton
                icon="trash"
                class="text-wp-error-100"
                :is-loading="isDeleting"
                :title="$t('repo.settings.crons.delete')"
                @click="deleteCron(cron)"
              />
            </div>
          </td>
        </tr>

        <template #footer>
          {{ $t('repo.settings_surface.loaded_count', { count: crons.length }) }}
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
import Checkbox from '~/components/form/Checkbox.vue';
import InputField from '~/components/form/InputField.vue';
import KeyValueEditor from '~/components/form/KeyValueEditor.vue';
import SelectField from '~/components/form/SelectField.vue';
import TextField from '~/components/form/TextField.vue';
import RepoSettingsSection from '~/components/repo/settings/RepoSettingsSection.vue';
import RepoSettingsTable from '~/components/repo/settings/RepoSettingsTable.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import { useDate } from '~/compositions/useDate';
import { requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';
import { usePagination } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Cron } from '~/lib/api/types';
import { deepClone } from '~/lib/utils';
import router from '~/router';

const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();

const repo = requiredInject('repo');
const selectedCron = ref<Partial<Cron>>();
const isEditingCron = computed(() => !!selectedCron.value?.id);
const loadError = ref('');
const date = useDate();
let reloadGeneration = 0;
let repoLifecycleGeneration = 0;

const timezones = Intl.supportedValuesOf('timeZone').map((tz) => ({
  value: tz,
  text: tz,
}));

const selectedCronTimezone = computed<string>({
  async set(tz) {
    selectedCron.value!.timezone = tz;
  },
  get() {
    return selectedCron.value!.timezone ?? 'UTC';
  },
});
const selectedCronVariables = computed<Record<string, string>>({
  async set(_vars) {
    selectedCron.value!.variables = _vars;
  },
  get() {
    return selectedCron.value!.variables ?? {};
  },
});

const selectedCronEnabled = computed<boolean>({
  async set(_enabled) {
    selectedCron.value!.enabled = _enabled;
  },
  get() {
    return selectedCron.value!.enabled !== undefined ? selectedCron.value!.enabled : true;
  },
});

async function loadCrons(page: number): Promise<Cron[] | null> {
  const repoId = repo.value.id;
  const requestGeneration = reloadGeneration;

  try {
    return await apiClient.getCronList(repoId, { page });
  } catch (error) {
    if (repo.value.id === repoId && requestGeneration === reloadGeneration) {
      loadError.value = error instanceof Error ? error.message : i18n.t('repo.settings_surface.crons.error_fallback');
    }
    return [];
  }
}

const isVariablesValid = ref(true);

const isFormValid = computed(() => {
  return isVariablesValid.value;
});

const { resetPage, data: _crons, loading } = usePagination(loadCrons, () => !selectedCron.value);
const confirmedCrons = ref<Cron[] | null>(null);
const crons = computed(() => confirmedCrons.value ?? _crons.value);

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

async function reloadCrons(preserveConfirmed = true) {
  const requestGeneration = ++reloadGeneration;
  loadError.value = '';
  confirmedCrons.value = preserveConfirmed ? [...crons.value] : null;
  await resetPage();
  await waitForPaginationIdle();
  if (requestGeneration === reloadGeneration && !loadError.value) {
    confirmedCrons.value = null;
  }
}

watch(
  () => repo.value.id,
  () => {
    repoLifecycleGeneration += 1;
    selectedCron.value = undefined;
    void reloadCrons(false);
  },
);

const { doSubmit: createCron, isLoading: isSaving } = useAsyncAction(async () => {
  if (!selectedCron.value) {
    throw new Error("Unexpected: Can't get cron");
  }

  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  const editing = isEditingCron.value;
  const cron = deepClone(selectedCron.value);
  if (editing) {
    await apiClient.updateCron(repoId, cron);
  } else {
    await apiClient.createCron(repoId, cron);
  }
  if (repo.value.id !== repoId || requestGeneration !== repoLifecycleGeneration) {
    return;
  }
  notifications.notify({
    title: editing ? i18n.t('repo.settings.crons.saved') : i18n.t('repo.settings.crons.created'),
    type: 'success',
  });
  selectedCron.value = undefined;
  await reloadCrons();
});

const { doSubmit: deleteCron, isLoading: isDeleting } = useAsyncAction(async (_cron: Cron) => {
  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  await apiClient.deleteCron(repoId, _cron.id);
  if (repo.value.id !== repoId || requestGeneration !== repoLifecycleGeneration) {
    return;
  }
  notifications.notify({ title: i18n.t('repo.settings.crons.deleted'), type: 'success' });
  await reloadCrons();
});

function editCron(cron: Cron) {
  selectedCron.value = deepClone(cron);
}

const { doSubmit: runCron, isLoading: isRunning } = useAsyncAction(async (_cron: Cron) => {
  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  const pipeline = await apiClient.runCron(repoId, _cron.id);
  if (repo.value.id !== repoId || requestGeneration !== repoLifecycleGeneration) {
    return;
  }
  await router.push({
    name: 'repo-pipeline',
    params: {
      repoId,
      pipelineId: pipeline.number,
    },
  });
});

useWPTitle(computed(() => [i18n.t('repo.settings.crons.crons'), repo.value.full_name]));
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
</style>
