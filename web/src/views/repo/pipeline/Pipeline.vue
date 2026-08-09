<template>
  <Container full-width class="md:min-h-xs flex grow-0 flex-col md:grow md:px-4">
    <div class="flex min-h-0 w-full grow flex-wrap-reverse md:flex-nowrap md:gap-4">
      <PipelineStepList
        v-if="overviewSteps.length > 0"
        v-model:selected-step-id="selectedStepId"
        :class="{ 'hidden md:flex': pipeline!.status === 'blocked' }"
        :pipeline="pipeline!"
      />

      <div class="relative flex min-w-0 grow basis-full items-start justify-center md:basis-auto">
        <div v-if="showErrorPanel" data-testid="pipeline-error-panel" class="mb-4 w-full md:mb-auto">
          <Panel>
            <div class="flex flex-col items-center gap-4 text-center">
              <Icon name="status-error" class="text-wp-error-100 h-16 w-16" size="1.5rem" />
              <span class="text-xl">{{ $t('repo.pipeline.we_got_some_errors') }}</span>
              <Button color="red" :text="$t('repo.pipeline.show_errors')" :to="{ name: 'repo-pipeline-errors' }" />
            </div>
          </Panel>
        </div>

        <div v-else-if="pipeline!.status === 'blocked'" class="mb-4 w-full md:mb-auto">
          <Panel>
            <div class="flex flex-col items-center gap-4">
              <Icon name="status-blocked" size="1.5rem" class="h-16 w-16" />
              <span class="text-xl">{{ $t('repo.pipeline.protected.awaits') }}</span>
              <div v-if="repoPermissions!.push" class="flex flex-wrap items-center justify-center gap-2">
                <Button
                  color="green"
                  :text="$t('repo.pipeline.protected.approve')"
                  :is-loading="isApprovingPipeline"
                  @click="approvePipeline"
                />
                <Button
                  color="red"
                  :text="$t('repo.pipeline.protected.decline')"
                  :is-loading="isDecliningPipeline"
                  @click="declinePipeline"
                />
              </div>
            </div>
          </Panel>
        </div>

        <div v-else-if="pipeline!.status === 'declined'" class="mb-4 w-full md:mb-auto">
          <Panel>
            <div class="flex flex-col items-center gap-4">
              <Icon name="status-declined" size="1.5rem" class="text-wp-error-100 h-16 w-16" />
              <p class="text-xl">{{ $t('repo.pipeline.protected.declined') }}</p>
            </div>
          </Panel>
        </div>

        <PipelineLog v-else-if="selectedStepId !== null" v-model:step-id="selectedStepId" :pipeline="pipeline!" />

        <div v-else data-testid="pipeline-overview" class="flex w-full min-w-0 flex-col gap-4 pb-4">
          <Panel v-if="overviewSteps.length === 0">
            <div data-testid="pipeline-overview-empty" class="flex flex-col items-center gap-3 py-8 text-center">
              <Icon name="list" class="text-wp-state-neutral-100 h-10 w-10" />
              <span class="text-lg">{{ $t('repo.pipeline.no_pipeline_steps') }}</span>
            </div>
          </Panel>

          <template v-else>
            <section
              class="border-wp-background-400 dark:border-wp-background-100 bg-wp-background-200 rounded-md border"
            >
              <div
                class="border-wp-background-400 dark:border-wp-background-100 flex flex-col gap-1 border-b px-4 py-3 sm:px-5"
              >
                <h2 class="text-lg font-semibold">{{ $t('repo.pipeline.execution_overview.title') }}</h2>
                <p class="text-wp-text-alt-100 text-sm">
                  {{ $t('repo.pipeline.execution_overview.description') }}
                </p>
              </div>

              <dl class="grid grid-cols-2 gap-px sm:grid-cols-4">
                <div class="flex min-w-0 flex-col gap-1 px-4 py-4 sm:px-5">
                  <dt class="text-wp-text-alt-100 text-xs font-medium tracking-wide uppercase">
                    {{ $t('repo.pipeline.execution_overview.workflows') }}
                  </dt>
                  <dd data-testid="workflow-count" class="text-xl font-semibold">{{ workflowCount }}</dd>
                </div>
                <div class="flex min-w-0 flex-col gap-1 px-4 py-4 sm:px-5">
                  <dt class="text-wp-text-alt-100 text-xs font-medium tracking-wide uppercase">
                    {{ $t('repo.pipeline.execution_overview.steps') }}
                  </dt>
                  <dd data-testid="step-count" class="text-xl font-semibold">{{ overviewSteps.length }}</dd>
                </div>
                <div class="flex min-w-0 flex-col gap-1 px-4 py-4 sm:px-5">
                  <dt class="text-wp-text-alt-100 text-xs font-medium tracking-wide uppercase">
                    {{ $t('repo.pipeline.execution_overview.progress') }}
                  </dt>
                  <dd data-testid="step-progress" class="text-xl font-semibold">
                    {{
                      $t('repo.pipeline.execution_overview.progress_value', {
                        finished: finishedStepCount,
                        total: overviewSteps.length,
                      })
                    }}
                  </dd>
                </div>
                <div class="flex min-w-0 flex-col gap-1 px-4 py-4 sm:px-5">
                  <dt class="text-wp-text-alt-100 text-xs font-medium tracking-wide uppercase">
                    {{ $t('repo.pipeline.execution_overview.duration') }}
                  </dt>
                  <dd class="truncate text-xl font-semibold">{{ duration ?? '—' }}</dd>
                </div>
              </dl>
            </section>

            <section
              class="border-wp-background-400 dark:border-wp-background-100 bg-wp-background-200 min-w-0 overflow-hidden rounded-md border"
            >
              <div class="overflow-x-auto">
                <table class="w-full min-w-3xl border-collapse text-left text-sm">
                  <thead class="bg-wp-background-300">
                    <tr>
                      <th scope="col" class="px-4 py-3 font-medium">
                        {{ $t('repo.pipeline.execution_overview.step') }}
                      </th>
                      <th scope="col" class="px-4 py-3 font-medium">
                        {{ $t('repo.pipeline.execution_overview.status') }}
                      </th>
                      <th scope="col" class="px-4 py-3 font-medium">
                        {{ $t('repo.pipeline.execution_overview.environment') }}
                      </th>
                      <th scope="col" class="px-4 py-3 font-medium">
                        {{ $t('repo.pipeline.execution_overview.image') }}
                      </th>
                      <th scope="col" class="px-4 py-3 font-medium">
                        {{ $t('repo.pipeline.execution_overview.duration') }}
                      </th>
                      <th scope="col" class="px-4 py-3 text-right font-medium">
                        {{ $t('repo.pipeline.execution_overview.action') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="{ step, workflow, environment } in overviewSteps"
                      :key="step.id"
                      :data-step-row="step.pid"
                      class="border-wp-background-400 dark:border-wp-background-100 border-t align-top"
                    >
                      <td class="px-4 py-4">
                        <div class="flex min-w-40 flex-col gap-1">
                          <span class="font-medium">{{ step.name }}</span>
                          <span class="text-wp-text-alt-100 text-xs">{{ workflow.name }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-4">
                        <div class="flex items-center gap-2">
                          <PipelineStatusIcon
                            :service="step.type === StepType.Service"
                            :status="step.state"
                            class="h-4! w-4!"
                          />
                          <span>{{ pipelineStatusTitle(step.state) }}</span>
                        </div>
                      </td>
                      <td class="px-4 py-4">
                        <div v-if="environment.length > 0" class="flex max-w-xs flex-wrap gap-1">
                          <Badge v-for="[key, value] in environment" :key="key" :label="key" :value="value" />
                        </div>
                        <span v-else class="text-wp-text-alt-100">
                          {{ $t('repo.pipeline.execution_overview.no_environment') }}
                        </span>
                      </td>
                      <td class="px-4 py-4">
                        <div class="flex min-w-36 flex-col items-start gap-1">
                          <span class="text-wp-text-alt-100">
                            {{ $t('repo.pipeline.execution_overview.image_unavailable') }}
                          </span>
                          <Button
                            v-if="hasPipelineConfigs"
                            size="sm"
                            :text="$t('repo.pipeline.execution_overview.view_config')"
                            :to="{ name: 'repo-pipeline-config' }"
                          />
                        </div>
                      </td>
                      <td class="px-4 py-4">
                        <PipelineStepDuration v-if="step.started !== undefined" :step="step" class="ml-0!" />
                        <span v-else>{{ $t('repo.pipeline.execution_overview.not_available') }}</span>
                      </td>
                      <td class="px-4 py-4 text-right">
                        <Button
                          :data-step-log="step.pid"
                          size="sm"
                          :text="$t('repo.pipeline.execution_overview.view_logs')"
                          @click="selectedStepId = step.pid"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </template>
        </div>
      </div>
    </div>
  </Container>
</template>

<script lang="ts" setup>
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import Badge from '~/components/atomic/Badge.vue';
import Icon from '~/components/atomic/Icon.vue';
import Container from '~/components/layout/Container.vue';
import Panel from '~/components/layout/Panel.vue';
import PipelineLog from '~/components/repo/pipeline/PipelineLog.vue';
import PipelineStatusIcon from '~/components/repo/pipeline/PipelineStatusIcon.vue';
import PipelineStepList from '~/components/repo/pipeline/PipelineStepList.vue';
import PipelineStepDuration from '~/components/repo/pipeline/PipelineStepDuration.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import { requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';
import usePipeline from '~/compositions/usePipeline';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { PipelineStatus, PipelineStep } from '~/lib/api/types';
import { StepType } from '~/lib/api/types';
import { anyStepStarted, pipelineHasErrorsToShow, pipelineHasNonWarningErrors } from '~/lib/pipeline';

const props = defineProps<{
  stepId?: string | null;
}>();

const apiClient = useApiClient();
const router = useRouter();
const route = useRoute();
const notifications = useNotifications();
const i18n = useI18n();

const pipeline = requiredInject('pipeline');
const repo = requiredInject('repo');
const repoPermissions = requiredInject('repo-permissions');
const pipelineConfigs = requiredInject('pipeline-configs');

const stepId = toRef(props, 'stepId');

const defaultStepId = computed(() => pipeline.value?.workflows?.[0]?.children?.[0]?.pid ?? null);
const workflowCount = computed(() => pipeline.value.workflows?.length ?? 0);
const overviewSteps = computed(
  () =>
    pipeline.value.workflows?.flatMap((workflow) =>
      workflow.children.map((step) => ({
        step,
        workflow,
        environment: Object.entries(workflow.environ ?? {}),
      })),
    ) ?? [],
);
const terminalStepStatuses = new Set<PipelineStatus>([
  'declined',
  'error',
  'failure',
  'killed',
  'skipped',
  'canceled',
  'success',
]);
const finishedStepCount = computed(
  () => overviewSteps.value.filter(({ step }) => terminalStepStatuses.has(step.state)).length,
);
const hasPipelineConfigs = computed(() => (pipelineConfigs.value?.length ?? 0) > 0);
const { duration } = usePipeline(pipeline);

function pipelineStatusTitle(status: PipelineStatus): string {
  // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
  return i18n.t(`repo.pipeline.status.${status}`);
}

// Replace the log view with the error panel for parse errors, or for workflow
// runtime errors when no step produced logs yet. If steps already ran (e.g.
// the error happened during cleanup), keep the logs accessible; the errors
// tab still points to the details.
const showErrorPanel = computed(() =>
  anyStepStarted(pipeline.value)
    ? pipelineHasNonWarningErrors(pipeline.value)
    : pipelineHasErrorsToShow(pipeline.value),
);

const selectedStepId = computed({
  get() {
    if (stepId.value !== '' && stepId.value !== null && stepId.value !== undefined) {
      const id = Number.parseInt(stepId.value, 10);

      let step = pipeline.value.workflows?.find((workflow) => workflow.pid === id)?.children[0];
      if (step) {
        return step.pid;
      }

      step = pipeline.value?.workflows?.reduce(
        (prev, p) => prev || p.children?.find((c) => c.pid === id),
        undefined as PipelineStep | undefined,
      );
      if (step) {
        return step.pid;
      }

      // return fallback if step-id is provided, but step cannot be found
      return defaultStepId.value;
    }

    return null;
  },
  set(_selectedStepId: number | null) {
    if (_selectedStepId === null) {
      router.replace({ params: { ...route.params, stepId: '' } });
      return;
    }

    router.replace({ params: { ...route.params, stepId: `${_selectedStepId}` } });
  },
});

const { doSubmit: approvePipeline, isLoading: isApprovingPipeline } = useAsyncAction(async () => {
  await apiClient.approvePipeline(repo.value.id, `${pipeline.value.number}`);
  notifications.notify({ title: i18n.t('repo.pipeline.protected.approve_success'), type: 'success' });
});

const { doSubmit: declinePipeline, isLoading: isDecliningPipeline } = useAsyncAction(async () => {
  await apiClient.declinePipeline(repo.value.id, `${pipeline.value.number}`);
  notifications.notify({ title: i18n.t('repo.pipeline.protected.decline_success'), type: 'success' });
});

useWPTitle(
  computed(() => [
    i18n.t('repo.pipeline.tasks'),
    i18n.t('repo.pipeline.pipeline', { pipelineId: pipeline.value.number }),
    repo.value.full_name,
  ]),
);
</script>
