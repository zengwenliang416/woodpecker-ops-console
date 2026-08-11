<template>
  <div class="repo-settings-page">
    <header class="repo-settings-page-header">
      <div>
        <h1>{{ $t('repo.settings.badge.badge') }}</h1>
        <p>{{ $t('repo.settings_surface.badge.description') }}</p>
      </div>
    </header>

    <FeedbackState
      v-if="loadingBranches"
      kind="loading"
      :title="$t('repo.settings_surface.badge.loading_title')"
      :description="$t('repo.settings_surface.badge.loading_description')"
    />
    <FeedbackState
      v-else-if="branchLoadError"
      kind="error"
      :title="$t('repo.settings_surface.badge.error_title')"
      :description="branchLoadError"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('repo.settings_surface.retry')" @click="loadBranches" />
      </template>
    </FeedbackState>
    <FeedbackState
      v-else-if="branches.length === 0"
      kind="empty"
      :title="$t('repo.settings_surface.badge.empty_title')"
      :description="$t('repo.settings_surface.badge.empty_description')"
    />

    <div v-else class="badge-layout">
      <RepoSettingsSection :title="$t('repo.settings_surface.badge.configuration_title')">
        <div class="repo-settings-form-grid">
          <InputField v-slot="{ id }" :label="$t('repo.settings.badge.branch')">
            <SelectField :id="id" v-model="branch" :options="branches" required />
          </InputField>
          <InputField v-slot="{ id }" :label="$t('repo.settings.badge.type')">
            <SelectField
              :id="id"
              v-model="badgeType"
              :options="[
                {
                  value: 'url',
                  text: $t('repo.settings.badge.type_url'),
                },
                {
                  value: 'markdown',
                  text: $t('repo.settings.badge.type_markdown'),
                },
                {
                  value: 'html',
                  text: $t('repo.settings.badge.type_html'),
                },
              ]"
              required
            />
          </InputField>
        </div>

        <InputField :label="$t('repo.settings.badge.events')">
          <CheckboxesField
            v-model="events"
            :options="badgeEventsOptions"
            :disabled="isDisabled"
            @update:model-value="eventsChanged"
          />
        </InputField>

        <div class="repo-settings-form-grid">
          <InputField v-slot="{ id }" :label="$t('repo.settings.badge.workflow')">
            <TextField :id="id" v-model="workflow" :placeholder="$t('repo.settings.badge.workflow')" />
          </InputField>
          <InputField v-slot="{ id }" :label="$t('repo.settings.badge.step')">
            <TextField :id="id" v-model="step" :placeholder="$t('repo.settings.badge.step')" />
          </InputField>
        </div>

        <InputField :label="$t('repo.settings_surface.badge.embed_code')">
          <pre class="badge-code"><code>{{ badgeContent }}</code></pre>
          <template #description>
            {{ $t('repo.settings_surface.badge.embed_description') }}
          </template>
        </InputField>
      </RepoSettingsSection>

      <RepoSettingsSection
        :title="$t('repo.settings_surface.badge.preview_title')"
        :description="$t('repo.settings_surface.badge.preview_description')"
      >
        <div class="badge-preview">
          <a :href="badgeUrl" target="_blank" rel="noopener noreferrer">
            <img :src="badgeUrl" :alt="$t('repo.settings_surface.badge.preview_alt')" />
          </a>
          <dl>
            <div>
              <dt>{{ $t('repo.settings_surface.badge.preview_branch') }}</dt>
              <dd class="font-mono">{{ selectedBranchLabel }}</dd>
            </div>
            <div>
              <dt>{{ $t('repo.settings_surface.badge.preview_events') }}</dt>
              <dd>{{ events.join(', ') }}</dd>
            </div>
          </dl>
        </div>
      </RepoSettingsSection>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStorage } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import CheckboxesField from '~/components/form/CheckboxesField.vue';
import type { CheckboxOption, SelectOption } from '~/components/form/form.types';
import InputField from '~/components/form/InputField.vue';
import SelectField from '~/components/form/SelectField.vue';
import TextField from '~/components/form/TextField.vue';
import RepoSettingsSection from '~/components/repo/settings/RepoSettingsSection.vue';
import useApiClient from '~/compositions/useApiClient';
import useConfig from '~/compositions/useConfig';
import { requiredInject } from '~/compositions/useInjectProvide';
import { usePaginate } from '~/compositions/usePaginate';
import { useWPTitle } from '~/compositions/useWPTitle';
import { WebhookEvents } from '~/lib/api/types';
import type { RepoBadgeFormat } from '~/lib/repoBadge';
import { buildRepoBadgeTargetUrl, buildRepoBadgeUrl, formatRepoBadgeEmbed } from '~/lib/repoBadge';

const apiClient = useApiClient();
const repo = requiredInject('repo');
const { rootPath } = useConfig();
const { t } = useI18n();

const badgeType = useStorage<RepoBadgeFormat>('woodpecker:last-badge-type', 'markdown');
const branches = ref<SelectOption[]>([]);
const branch = ref('');
const events = ref<string[]>([WebhookEvents.Push]);
const workflow = ref('');
const step = ref('');
const loadingBranches = ref(true);
const branchLoadError = ref('');
let branchLoadGeneration = 0;

const baseUrl = `${window.location.protocol}//${window.location.hostname}${
  window.location.port ? `:${window.location.port}` : ''
}`;

const badgeUrl = computed(() =>
  buildRepoBadgeUrl({
    rootPath,
    repoId: repo.value.id,
    branch: branch.value,
    events: events.value,
    workflow: workflow.value,
    step: step.value,
  }),
);

const repoUrl = computed(() => buildRepoBadgeTargetUrl(rootPath, repo.value.id, branch.value));

const badgeContent = computed(() =>
  formatRepoBadgeEmbed({
    format: badgeType.value,
    baseUrl,
    badgeUrl: badgeUrl.value,
    repoUrl: repoUrl.value,
  }),
);

const selectedBranchLabel = computed(() => branch.value || repo.value.default_branch);

async function loadBranches() {
  const requestGeneration = ++branchLoadGeneration;
  const repoId = repo.value.id;
  const defaultBranch = repo.value.default_branch;

  loadingBranches.value = true;
  branchLoadError.value = '';
  branches.value = [];
  branch.value = '';

  try {
    const data = await usePaginate((page) => apiClient.getRepoBranches(repoId, { page }));
    if (requestGeneration !== branchLoadGeneration) {
      return;
    }

    const orderedBranches = data.includes(defaultBranch)
      ? [defaultBranch, ...data.filter((value) => value !== defaultBranch)]
      : data;
    branches.value = orderedBranches.map((value) => ({
      value: value === defaultBranch ? '' : value,
      text: value,
    }));
    branch.value = data.includes(defaultBranch) ? '' : (branches.value[0]?.value ?? '');
  } catch (error) {
    if (requestGeneration !== branchLoadGeneration) {
      return;
    }

    branchLoadError.value = error instanceof Error ? error.message : t('repo.settings_surface.badge.error_fallback');
  } finally {
    if (requestGeneration === branchLoadGeneration) {
      loadingBranches.value = false;
    }
  }
}

const badgeEventsOptions: CheckboxOption[] = [
  { value: WebhookEvents.Push, text: t('repo.pipeline.event.push'), description: t('default') },
  { value: WebhookEvents.Tag, text: t('repo.pipeline.event.tag') },
  { value: WebhookEvents.Release, text: t('repo.pipeline.event.release') },
  { value: WebhookEvents.PullRequest, text: t('repo.pipeline.event.pr') },
  { value: WebhookEvents.PullRequestClosed, text: t('repo.pipeline.event.pr_closed') },
  { value: WebhookEvents.PullRequestMetadata, text: t('repo.pipeline.event.pr_metadata') },
  { value: WebhookEvents.Deploy, text: t('repo.pipeline.event.deploy') },
  { value: WebhookEvents.Cron, text: t('repo.pipeline.event.cron') },
  { value: WebhookEvents.Manual, text: t('repo.pipeline.event.manual') },
];

function eventsChanged() {
  if (events.value.length === 0) {
    events.value.push(WebhookEvents.Push);
  }
}

const isDisabled = computed(() => (option: CheckboxOption) => {
  return events.value.length === 1 && events.value[0] === WebhookEvents.Push && option.value === WebhookEvents.Push;
});

watch(() => repo.value.id, loadBranches, { immediate: true });

useWPTitle(computed(() => [t('repo.settings.badge.badge'), repo.value.full_name]));
</script>

<style scoped>
@reference '~/tailwind.css';

.repo-settings-page {
  @apply min-w-0 space-y-4;
}

.repo-settings-page-header {
  @apply px-1 py-1;
}

.repo-settings-page-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.repo-settings-page-header p {
  @apply text-wp-text-alt-100 mt-1 text-xs leading-5;
}

.badge-layout {
  @apply grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)];
}

.repo-settings-form-grid {
  @apply grid gap-x-4 md:grid-cols-2;
}

.badge-code {
  @apply border-wp-border-100 bg-wp-background-100 text-wp-text-100 max-w-full overflow-x-auto rounded-lg border p-3 text-xs leading-5 whitespace-pre-wrap;
}

.badge-preview {
  @apply flex min-h-64 flex-col items-center justify-center gap-8;
}

.badge-preview img {
  @apply min-h-5 max-w-full;
}

.badge-preview dl {
  @apply divide-wp-border-100 w-full divide-y;
}

.badge-preview dl > div {
  @apply flex items-center justify-between gap-4 py-3;
}

.badge-preview dt {
  @apply text-wp-text-alt-100 text-xs;
}

.badge-preview dd {
  @apply text-wp-text-200 max-w-48 truncate text-right text-xs font-semibold;
}
</style>
