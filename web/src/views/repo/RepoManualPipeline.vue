<template>
  <div v-if="accessGranted" class="manual-run-layout">
    <RepoSettingsSection
      :title="$t('repo.manual_pipeline.title')"
      :description="$t('repo.settings_surface.manual.description')"
    >
      <FeedbackState
        v-if="loadingBranches"
        kind="loading"
        :title="$t('repo.settings_surface.manual.loading_title')"
        :description="$t('repo.settings_surface.manual.loading_description')"
      />
      <FeedbackState
        v-else-if="branchLoadError"
        kind="error"
        :title="$t('repo.settings_surface.manual.error_title')"
        :description="branchLoadError"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('repo.settings_surface.retry')" @click="loadBranches" />
        </template>
      </FeedbackState>
      <FeedbackState
        v-else-if="branches.length === 0"
        kind="empty"
        :title="$t('repo.settings_surface.manual.empty_title')"
        :description="$t('repo.settings_surface.manual.empty_description')"
      />
      <form v-else data-testid="manual-pipeline-form" @submit.prevent="triggerManualPipeline">
        <InputField v-slot="{ id }" :label="$t('repo.manual_pipeline.select_branch')">
          <SelectField :id="id" v-model="payload.branch" :options="branches" required />
        </InputField>
        <InputField v-slot="{ id }" :label="$t('repo.manual_pipeline.variables.title')">
          <span class="text-wp-text-alt-100 mb-2 text-sm">{{ $t('repo.manual_pipeline.variables.desc') }}</span>
          <KeyValueEditor
            :id="id"
            v-model="payload.variables"
            :key-placeholder="$t('repo.manual_pipeline.variables.name')"
            :value-placeholder="$t('repo.manual_pipeline.variables.value')"
            :delete-title="$t('repo.manual_pipeline.variables.delete')"
            @update:is-valid="isVariablesValid = $event"
          />
        </InputField>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            color="green"
            start-icon="play-outline"
            :text="$t('repo.manual_pipeline.trigger')"
            :disabled="!isFormValid"
            :is-loading="isTriggering"
          />
          <span class="text-wp-text-alt-100 text-xs">
            {{ $t('repo.settings_surface.manual.confirmation_hint') }}
          </span>
        </div>
      </form>
    </RepoSettingsSection>

    <aside class="space-y-4">
      <RepoSettingsSection
        :title="$t('repo.settings_surface.manual.summary_title')"
        :description="$t('repo.settings_surface.manual.summary_description')"
      >
        <dl class="manual-run-summary">
          <div>
            <dt>{{ $t('repo.settings_surface.manual.repository') }}</dt>
            <dd>{{ repo.full_name }}</dd>
          </div>
          <div>
            <dt>{{ $t('repo.settings_surface.manual.default_branch') }}</dt>
            <dd class="font-mono">{{ repo.default_branch || fallback }}</dd>
          </div>
          <div>
            <dt>{{ $t('repo.settings_surface.manual.available_branches') }}</dt>
            <dd>{{ loadingBranches ? fallback : branches.length }}</dd>
          </div>
          <div>
            <dt>{{ $t('repo.settings_surface.manual.variables_count') }}</dt>
            <dd>{{ Object.keys(payload.variables).length }}</dd>
          </div>
        </dl>
      </RepoSettingsSection>

      <FeedbackState
        compact
        kind="stale"
        :title="$t('repo.settings_surface.manual.server_authority_title')"
        :description="$t('repo.settings_surface.manual.server_authority_description')"
      />
    </aside>
  </div>
</template>

<script lang="ts" setup>
import { useNotification } from '@kyvg/vue3-notification';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import InputField from '~/components/form/InputField.vue';
import KeyValueEditor from '~/components/form/KeyValueEditor.vue';
import SelectField from '~/components/form/SelectField.vue';
import RepoSettingsSection from '~/components/repo/settings/RepoSettingsSection.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import { requiredInject } from '~/compositions/useInjectProvide';
import { usePaginate } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';

defineProps<{
  open?: boolean;
}>();

const emit = defineEmits<{
  (event: 'close'): void;
}>();

const apiClient = useApiClient();
const notifications = useNotification();
const i18n = useI18n();
const router = useRouter();

const repo = requiredInject('repo');
const repoPermissions = requiredInject('repo-permissions');

const branches = ref<{ text: string; value: string }[]>([]);
const payload = ref<{ branch: string; variables: Record<string, string> }>({
  branch: '',
  variables: {},
});
const isVariablesValid = ref(true);
const loadingBranches = ref(true);
const branchLoadError = ref('');
const accessGranted = ref(false);
const fallback = '—';
let branchLoadGeneration = 0;
let repoLifecycleGeneration = 0;

async function loadBranches() {
  const requestGeneration = ++branchLoadGeneration;
  const repoId = repo.value.id;
  const defaultBranch = repo.value.default_branch;

  loadingBranches.value = true;
  branchLoadError.value = '';
  branches.value = [];
  payload.value.branch = '';

  try {
    const data = await usePaginate((page) => apiClient.getRepoBranches(repoId, { page }));
    if (requestGeneration !== branchLoadGeneration) {
      return;
    }

    branches.value = data.map((branch) => ({ text: branch, value: branch }));

    payload.value.branch = data.includes(defaultBranch) ? defaultBranch : (data[0] ?? '');
  } catch (error) {
    if (requestGeneration !== branchLoadGeneration) {
      return;
    }

    branchLoadError.value =
      error instanceof Error ? error.message : i18n.t('repo.settings_surface.manual.error_fallback');
  } finally {
    if (requestGeneration === branchLoadGeneration) {
      loadingBranches.value = false;
    }
  }
}

const { doSubmit: triggerManualPipeline, isLoading: isTriggering } = useAsyncAction(async () => {
  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  const pipeline = await apiClient.createPipeline(repoId, {
    branch: payload.value.branch,
    variables: payload.value.variables,
  });

  if (repo.value.id !== repoId || requestGeneration !== repoLifecycleGeneration) {
    return;
  }

  emit('close');

  if (typeof pipeline === 'string') {
    await router.push({ name: 'repo', params: { repoId } });
    notifications.notify({ type: 'warn', title: i18n.t('repo.manual_pipeline.no_manual_workflows') });
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

const isFormValid = computed(
  () =>
    accessGranted.value &&
    payload.value.branch !== '' &&
    isVariablesValid.value &&
    !loadingBranches.value &&
    !isTriggering.value,
);

watch(
  [() => repo.value.id, () => repoPermissions.value],
  async ([repoId, permissions], [previousRepoId, previousPermissions]) => {
    if (previousRepoId === undefined || repoId !== previousRepoId) {
      repoLifecycleGeneration += 1;
    }
    branchLoadGeneration += 1;
    accessGranted.value = false;
    loadingBranches.value = true;
    branchLoadError.value = '';
    branches.value = [];
    payload.value.branch = '';
    payload.value.variables = {};
    isVariablesValid.value = true;

    if (previousRepoId !== undefined && repoId !== previousRepoId && permissions === previousPermissions) {
      return;
    }

    if (!permissions.push) {
      loadingBranches.value = false;
      notifications.notify({ type: 'error', title: i18n.t('repo.settings.not_allowed') });
      await router.replace({ name: 'home' });
      return;
    }

    accessGranted.value = true;
    await loadBranches();
  },
  { immediate: true },
);

useWPTitle(computed(() => [i18n.t('repo.manual_pipeline.trigger'), repo.value.full_name]));
</script>

<style scoped>
@reference '~/tailwind.css';

.manual-run-layout {
  @apply grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px];
}

.manual-run-summary {
  @apply divide-wp-border-100 divide-y;
}

.manual-run-summary > div {
  @apply flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0;
}

.manual-run-summary dt {
  @apply text-wp-text-alt-100 text-xs;
}

.manual-run-summary dd {
  @apply text-wp-text-200 min-w-0 truncate text-right text-xs font-semibold;
}
</style>
