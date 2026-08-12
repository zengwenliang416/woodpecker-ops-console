<template>
  <div class="org-repos-page">
    <header class="org-repos-header">
      <div class="min-w-0">
        <h1>{{ $t('org.surface.repositories_title') }}</h1>
        <p>{{ $t('org.surface.repositories_description') }}</p>
      </div>
      <label class="org-repos-search">
        <PrototypeIcon name="search" />
        <input v-model="search" :placeholder="$t('org.surface.search_placeholder')" />
      </label>
    </header>

    <FeedbackState
      v-if="loadError"
      compact
      kind="error"
      :title="$t('org.surface.repositories_error_title')"
      :description="loadError"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('org.surface.retry')" @click="loadRepositories" />
      </template>
    </FeedbackState>

    <FeedbackState
      v-if="loading && organizationRepos.length === 0"
      kind="loading"
      :title="$t('org.surface.repositories_loading_title')"
      :description="$t('org.surface.repositories_loading_description')"
    />

    <FeedbackState
      v-else-if="!loadError && organizationRepos.length === 0"
      kind="empty"
      :title="$t('repo.user_none')"
      :description="$t('org.surface.repositories_empty_description')"
    />

    <FeedbackState
      v-else-if="!loadError && reposLastActivity.length === 0"
      kind="empty"
      :title="$t('org.surface.repositories_no_match_title')"
      :description="$t('org.surface.repositories_no_match_description')"
    >
      <template #action>
        <Button :text="$t('repositories.clear')" @click="search = ''" />
      </template>
    </FeedbackState>

    <SettingsTable v-else-if="reposLastActivity.length > 0" min-width="680px">
      <template #head>
        <tr>
          <th>{{ $t('repositories.columns.repository') }}</th>
          <th>{{ $t('repositories.columns.branch') }}</th>
          <th>{{ $t('repositories.columns.latest_pipeline') }}</th>
          <th>
            <span class="sr-only">{{ $t('repo.settings_surface.columns.actions') }}</span>
          </th>
        </tr>
      </template>

      <tr v-for="repo in reposLastActivity" :key="repo.id">
        <td>
          <router-link class="org-repo-name" :to="{ name: 'repo', params: { repoId: repo.id } }">
            {{ repo.full_name }}
          </router-link>
        </td>
        <td class="font-mono">{{ repo.default_branch || '—' }}</td>
        <td>
          <Badge :value="statusLabel(repoPipelineStatus(repo))" />
        </td>
        <td>
          <div class="flex justify-end">
            <IconButton
              icon="chevron-right"
              :title="$t('org.surface.open_repository', { repo: repo.full_name })"
              :to="{ name: 'repo', params: { repoId: repo.id } }"
            />
          </div>
        </td>
      </tr>

      <template #footer>
        {{ $t('org.surface.repositories_loaded_count', { count: reposLastActivity.length }) }}
      </template>
    </SettingsTable>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Badge from '~/components/atomic/Badge.vue';
import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import SettingsTable from '~/components/settings/SettingsTable.vue';
import { requiredInject } from '~/compositions/useInjectProvide';
import useRepos from '~/compositions/useRepos';
import { useRepoSearch } from '~/compositions/useRepoSearch';
import { useWPTitle } from '~/compositions/useWPTitle';
import { repoPipelineStatus } from '~/lib/repoMetrics';
import type { RepoPipelineStatus } from '~/lib/repoMetrics';
import { useRepoStore } from '~/store/repos';

defineProps<{
  orgId: string;
}>();

const repoStore = useRepoStore();
const { repoWithLastPipeline, sortReposByLastActivity } = useRepos();
const { t } = useI18n();

const org = requiredInject('org');
const orgLifecycle = requiredInject('org-lifecycle');
const search = ref('');
const loading = ref(false);
const loadError = ref('');
let loadGeneration = 0;

const organizationRepos = computed(() =>
  [...repoStore.repos.values()].filter((repo) => repo.org_id === org.value.id).map(repoWithLastPipeline),
);
const { searchedRepos } = useRepoSearch(organizationRepos, search);
const reposLastActivity = computed(() => sortReposByLastActivity([...(searchedRepos.value || [])]));

async function loadRepositories() {
  const requestGeneration = ++loadGeneration;
  const requestOrgId = org.value.id;
  const requestLifecycle = orgLifecycle.value;
  loading.value = true;
  loadError.value = '';
  try {
    await repoStore.loadRepos();
  } catch (error) {
    if (
      requestGeneration === loadGeneration &&
      requestLifecycle === orgLifecycle.value &&
      requestOrgId === org.value.id
    ) {
      loadError.value = error instanceof Error ? error.message : t('org.surface.repositories_error_fallback');
    }
  } finally {
    if (
      requestGeneration === loadGeneration &&
      requestLifecycle === orgLifecycle.value &&
      requestOrgId === org.value.id
    ) {
      loading.value = false;
    }
  }
}

function statusLabel(status: RepoPipelineStatus) {
  const labels = {
    success: t('repositories.status.success'),
    failure: t('repositories.status.failure'),
    running: t('repositories.status.running'),
    pending: t('repositories.status.pending'),
    skipped: t('repositories.status.skipped'),
    none: t('repositories.status.none'),
  };
  return labels[status];
}

onMounted(loadRepositories);

useWPTitle(computed(() => [t('repositories.title'), org.value.name]));
</script>

<style scoped>
@reference '~/tailwind.css';

.org-repos-page {
  @apply mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-4 px-4 py-5 sm:px-6;
}

.org-repos-header {
  @apply flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between;
}

.org-repos-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.org-repos-header p {
  @apply text-wp-text-alt-100 mt-1 max-w-2xl text-xs leading-5;
}

.org-repos-search {
  @apply border-wp-border-100 bg-wp-background-300 text-wp-text-alt-100 flex min-h-9 w-full min-w-0 items-center gap-2 rounded-lg border px-3 sm:max-w-sm;
}

.org-repos-search input {
  @apply text-wp-text-200 min-w-0 flex-1 bg-transparent text-xs outline-none;
}

.org-repo-name {
  @apply text-wp-text-200 font-semibold hover:underline;
}
</style>
