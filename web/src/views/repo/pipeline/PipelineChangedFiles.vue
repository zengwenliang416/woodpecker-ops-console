<template>
  <section
    class="border-wp-border-100 bg-wp-background-200 flex min-w-0 flex-col overflow-hidden rounded-xl border shadow-sm"
  >
    <header
      class="border-wp-border-100 bg-wp-background-300 flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="min-w-0">
        <h2 class="text-wp-text-200 text-sm font-bold">{{ $t('repo.pipeline.changed_files.title') }}</h2>
        <p class="text-wp-text-alt-100 mt-1 text-xs">{{ $t('repo.pipeline.changed_files.description') }}</p>
      </div>
      <span
        data-testid="changed-files-count"
        class="border-wp-border-100 bg-wp-control-neutral-100 text-wp-text-alt-100 shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold"
      >
        {{ visibleFileCount }}
      </span>
    </header>

    <div class="flex min-w-0 flex-col gap-4 p-4">
      <label class="flex min-w-0 flex-col gap-1.5">
        <span class="text-wp-text-100 text-xs font-semibold">{{ $t('repo.pipeline.changed_files.search') }}</span>
        <input
          v-model="search"
          data-testid="changed-files-search"
          type="search"
          class="border-wp-border-100 bg-wp-background-100 text-wp-text-100 placeholder:text-wp-text-alt-100 focus:border-wp-primary-100 h-9 w-full rounded-lg border px-3 text-sm outline-hidden"
          :placeholder="$t('repo.pipeline.changed_files.search_placeholder')"
        />
      </label>

      <FeedbackState
        v-if="allFiles.length === 0"
        kind="empty"
        compact
        :title="$t('repo.pipeline.changed_files.empty')"
        :description="$t('repo.pipeline.changed_files.empty_description')"
      />
      <FeedbackState
        v-else-if="filteredFiles.length === 0"
        kind="empty"
        compact
        :title="$t('repo.pipeline.changed_files.no_match')"
        :description="$t('repo.pipeline.changed_files.no_match_description')"
      />
      <ul
        v-else
        class="border-wp-border-100 bg-wp-background-300 max-h-[32rem] min-w-0 divide-y overflow-auto rounded-lg border"
      >
        <li
          v-for="file in filteredFiles"
          :key="file"
          class="text-wp-text-100 flex min-w-0 items-center gap-2 px-3 py-2.5 font-mono text-xs"
        >
          <Icon name="file" class="text-wp-text-alt-100 shrink-0" />
          <span class="min-w-0 break-all">{{ file }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Icon from '~/components/atomic/Icon.vue';
import { requiredInject } from '~/compositions/useInjectProvide';
import { useWPTitle } from '~/compositions/useWPTitle';

const repo = requiredInject('repo');
const pipeline = requiredInject('pipeline');

const { t } = useI18n();
useWPTitle(
  computed(() => [
    t('repo.pipeline.files'),
    t('repo.pipeline.pipeline', { pipelineId: pipeline.value.number }),
    repo.value.full_name,
  ]),
);

const search = ref('');
const allFiles = computed(() => pipeline.value.changed_files ?? []);
const filteredFiles = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  if (!query) {
    return allFiles.value;
  }
  return allFiles.value.filter((file) => file.toLocaleLowerCase().includes(query));
});
const visibleFileCount = computed(() => {
  if (filteredFiles.value.length === allFiles.value.length) {
    return allFiles.value.length === 1
      ? t('repo.pipeline.changed_files.file_count_one', { count: allFiles.value.length })
      : t('repo.pipeline.changed_files.file_count', { count: allFiles.value.length });
  }

  return allFiles.value.length === 1
    ? t('repo.pipeline.changed_files.filtered_file_count_one', {
        visible: filteredFiles.value.length,
        total: allFiles.value.length,
      })
    : t('repo.pipeline.changed_files.filtered_file_count', {
        visible: filteredFiles.value.length,
        total: allFiles.value.length,
      });
});
</script>
