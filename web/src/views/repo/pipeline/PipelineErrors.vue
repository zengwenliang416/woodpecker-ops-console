<template>
  <FeedbackState
    v-if="!hasErrors"
    kind="empty"
    :title="$t('repo.pipeline.error_diagnostics.empty')"
    :description="$t('repo.pipeline.error_diagnostics.empty_description')"
  />
  <div v-else class="flex min-w-0 flex-col gap-4">
    <section
      class="border-wp-border-100 bg-wp-background-200 flex min-w-0 flex-col gap-3 rounded-xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="min-w-0">
        <h2 class="text-wp-text-200 text-sm font-bold">{{ $t('repo.pipeline.error_diagnostics.title') }}</h2>
        <p class="text-wp-text-alt-100 mt-1 text-xs">{{ $t('repo.pipeline.error_diagnostics.description') }}</p>
      </div>
      <Button
        class="self-start sm:self-auto"
        size="sm"
        :text="$t('repo.pipeline.error_diagnostics.view_changed_files')"
        :to="{ name: 'repo-pipeline-changed-files' }"
      />
    </section>

    <Panel v-if="runtimeErrorWorkflows.length > 0" :title="$t('repo.pipeline.runtime_errors')">
      <div class="flex min-w-0 flex-col gap-3">
        <article
          v-for="workflow in runtimeErrorWorkflows"
          :key="workflow.id"
          class="border-wp-error-100/25 bg-wp-error-100/5 grid min-w-0 gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(8rem,0.35fr)_minmax(0,1fr)]"
        >
          <span class="text-wp-text-100 flex min-w-0 items-start gap-2 text-xs font-semibold">
            <Icon name="alert" class="text-wp-error-100 shrink-0" />
            <code class="truncate">{{ workflow.name }}</code>
          </span>
          <pre class="code-box max-h-72 min-w-0 overflow-auto break-words whitespace-pre-wrap">{{
            workflow.error
          }}</pre>
        </article>
      </div>
    </Panel>

    <Panel v-if="parseErrors.length > 0" :title="$t('repo.pipeline.parse_errors')">
      <div class="flex min-w-0 flex-col gap-3">
        <article
          v-for="(error, index) in parseErrors"
          :key="`${error.type}-${index}`"
          class="border-wp-border-100 bg-wp-background-300 grid min-w-0 gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(8rem,0.35fr)_minmax(0,1fr)]"
        >
          <div class="flex min-w-0 items-start gap-2">
            <Icon
              name="alert"
              class="shrink-0"
              :class="{
                'text-wp-state-warn-100': error.is_warning,
                'text-wp-error-100': !error.is_warning,
              }"
            />
            <div class="flex min-w-0 flex-col gap-1">
              <code class="text-wp-text-100 truncate text-xs font-semibold">{{ error.type }}</code>
              <span
                v-if="isLinterError(error) || isDeprecationError(error) || isBadHabitError(error)"
                class="text-wp-text-alt-100 min-w-0 text-xs break-words"
              >
                <!-- eslint-disable-next-line @intlify/vue-i18n/no-raw-text -->
                <strong v-if="error.data?.file">{{ error.data.file }}: </strong>
                {{ error.data?.field }}
              </span>
              <DocsLink
                v-if="isDeprecationError(error) || isBadHabitError(error)"
                :topic="error.data?.field || ''"
                :url="error.data?.docs || ''"
              />
            </div>
          </div>
          <div class="text-wp-text-100 min-w-0 overflow-auto text-sm">
            <RenderMarkdown :content="error.message" />
          </div>
        </article>
      </div>
    </Panel>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import DocsLink from '~/components/atomic/DocsLink.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Icon from '~/components/atomic/Icon.vue';
import RenderMarkdown from '~/components/atomic/RenderMarkdown.vue';
import Panel from '~/components/layout/Panel.vue';
import { requiredInject } from '~/compositions/useInjectProvide';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { PipelineError } from '~/lib/api/types';
import { pipelineHasErrorsToShow, workflowsWithErrors } from '~/lib/pipeline';

const repo = requiredInject('repo');
const pipeline = requiredInject('pipeline');

const runtimeErrorWorkflows = computed(() => workflowsWithErrors(pipeline.value));
const parseErrors = computed(() => pipeline.value.errors ?? []);
const hasErrors = computed(() => runtimeErrorWorkflows.value.length > 0 || parseErrors.value.length > 0);

function isLinterError(error: PipelineError): error is PipelineError<{ file?: string; field: string }> {
  return error.type === 'linter';
}

function isDeprecationError(
  error: PipelineError,
): error is PipelineError<{ file: string; field: string; docs: string }> {
  return error.type === 'deprecation';
}

function isBadHabitError(error: PipelineError): error is PipelineError<{ file?: string; field: string; docs: string }> {
  return error.type === 'bad_habit';
}

const { t } = useI18n();
useWPTitle(
  computed(() => [
    pipelineHasErrorsToShow(pipeline.value) ? t('repo.pipeline.errors') : t('repo.pipeline.warnings'),
    t('repo.pipeline.pipeline', { pipelineId: pipeline.value.number }),
    repo.value.full_name,
  ]),
);
</script>
