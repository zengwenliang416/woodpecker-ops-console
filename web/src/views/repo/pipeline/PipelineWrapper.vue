<template>
  <Scaffold
    v-if="pipeline && repo"
    enable-tabs
    :go-back="goBack"
    :fluid-content="route.name === 'repo-pipeline'"
    full-width-header
  >
    <template #title>
      <span data-testid="pipeline-detail-heading" class="flex min-w-0 flex-col gap-3 py-1">
        <span
          data-testid="pipeline-detail-eyebrow"
          class="text-wp-text-alt-100 flex flex-wrap items-center gap-1 text-sm font-normal"
        >
          <router-link :to="{ name: 'repo' }" class="hover:underline">{{ repo.name }}</router-link>
          <!-- eslint-disable-next-line @intlify/vue-i18n/no-raw-text -->
          <span>/</span>
          <span>{{ $t('repo.pipeline.eyebrow') }}</span>
        </span>

        <span class="flex flex-wrap items-center gap-3">
          <span class="text-xl font-semibold">{{ $t('repo.pipeline.pipeline', { pipelineId }) }}</span>
          <span
            data-testid="pipeline-status"
            class="border-wp-state-neutral-200 bg-wp-state-neutral-100 flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium"
          >
            <PipelineStatusIcon :status="pipeline.status" class="shrink-0" />
            <span>{{ pipelineStatusTitle }}</span>
          </span>
        </span>

        <RenderMarkdown
          data-testid="pipeline-message"
          class="max-w-4xl text-base font-normal"
          :title="message"
          :content="shortMessage"
          inline
        />

        <span
          data-testid="pipeline-metadata"
          class="text-wp-text-alt-100 flex flex-wrap gap-x-5 gap-y-2 text-sm font-normal"
        >
          <span v-if="prettyRef" class="flex items-center gap-1.5">
            <Icon name="branch" />
            <span>{{ $t('repo.pipeline.metadata.branch') }}</span>
            <span class="text-wp-text-100">{{ prettyRef }}</span>
          </span>
          <span class="flex items-center gap-1.5">
            <Icon name="activity" />
            <span>{{ $t('repo.pipeline.metadata.event') }}</span>
            <span class="text-wp-text-100">{{ pipelineEventTitle }}</span>
          </span>
          <span v-if="pipeline.author" class="flex items-center gap-1.5">
            <Icon name="user" />
            <span>{{ $t('repo.pipeline.metadata.author') }}</span>
            <span class="text-wp-text-100">{{ pipeline.author }}</span>
          </span>
          <span v-if="pipeline.commit" class="flex items-center gap-1.5">
            <Icon name="commit" />
            <span>{{ $t('repo.pipeline.metadata.commit') }}</span>
            <span class="text-wp-text-100 font-mono">{{ pipeline.commit.slice(0, 10) }}</span>
          </span>
          <span class="flex items-center gap-1.5" :title="$t('repo.pipeline.created', { created })">
            <Icon name="since" />
            <span>{{ $t('repo.pipeline.metadata.created') }}</span>
            <span class="text-wp-text-100">{{ since }}</span>
          </span>
          <span
            class="flex items-center gap-1.5"
            :title="
              durationElapsed > 0 ? $t('repo.pipeline.duration', { duration: durationAsNumber(durationElapsed) }) : ''
            "
          >
            <Icon name="duration" />
            <span>{{ $t('repo.pipeline.metadata.duration') }}</span>
            <span class="text-wp-text-100">{{ duration }}</span>
          </span>
        </span>
      </span>
    </template>

    <template #headerActions>
      <template v-if="repoPermissions!.push && pipeline.status !== 'blocked'">
        <div class="flex flex-wrap justify-end gap-2">
          <Button
            v-if="pipeline.status === 'pending' || pipeline.status === 'running'"
            class="shrink-0"
            :text="$t('repo.pipeline.actions.cancel')"
            :is-loading="isCancelingPipeline"
            @click="cancelPipeline"
          />
          <Button
            class="shrink-0"
            :text="$t('repo.pipeline.actions.retry')"
            :is-loading="isRestartingPipeline"
            @click="restartPipeline"
          />
          <Button
            v-if="pipeline.status === 'success' && repo.allow_deploy"
            class="shrink-0"
            start-icon="rocket"
            :color="opsDeploymentTarget ? 'green' : 'gray'"
            :text="$t('repo.pipeline.actions.deploy')"
            :to="opsDeploymentTarget"
            @click="openDeploy"
          />
          <DeployPipelinePopup
            v-if="!opsDeploymentTarget"
            :pipeline-number="pipelineId"
            :open="showDeployPipelinePopup"
            @close="showDeployPipelinePopup = false"
          />
        </div>
      </template>
    </template>

    <template #tabActions>
      <div class="flex flex-wrap gap-4 md:flex-nowrap">
        <div v-if="pipeline.status === 'killed' && pipeline.cancel_info" class="flex shrink-0 items-center gap-2">
          <Icon name="status-killed" />
          <span class="truncate">
            <router-link
              v-if="pipeline.cancel_info.superseded_by"
              :to="{ name: 'repo-pipeline', params: { pipelineId: pipeline.cancel_info.superseded_by } }"
              class="hover:underline"
            >
              {{ $t('repo.pipeline.cancel_info.superseded_by', { pipelineId: pipeline.cancel_info.superseded_by }) }}
            </router-link>
            <template v-else-if="pipeline.cancel_info.canceled_by_user">
              {{ $t('repo.pipeline.cancel_info.canceled_by_user', { user: pipeline.cancel_info.canceled_by_user }) }}
            </template>
            <template v-else-if="pipeline.cancel_info.canceled_by_step">
              {{ $t('repo.pipeline.cancel_info.canceled_by_step', { user: pipeline.cancel_info.canceled_by_step }) }}
            </template>
          </span>
        </div>
      </div>
    </template>

    <Tab icon="tray-full" :to="{ name: 'repo-pipeline' }" :title="$t('repo.pipeline.overview')" />
    <Tab
      :to="{ name: 'repo-pipeline-changed-files' }"
      icon="file-edit-outline"
      :title="$t('repo.pipeline.files')"
      :count="pipeline.changed_files?.length"
    />
    <Tab icon="file-cog-outline" :to="{ name: 'repo-pipeline-config' }" :title="$t('repo.pipeline.config')" />
    <Tab
      :to="{ name: 'repo-pipeline-errors' }"
      icon="alert"
      :title="$t('repo.pipeline.errors')"
      :count="errorsTabCount"
      :icon-class="pipelineHasErrorsToShow(pipeline) ? 'text-wp-error-100' : 'text-wp-state-warn-100'"
    />
    <Tab
      v-if="repoPermissions && repoPermissions.push"
      icon="bug-outline"
      :to="{ name: 'repo-pipeline-debug' }"
      :title="$t('repo.pipeline.debug.title')"
    />

    <router-view />
  </Scaffold>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, toRef, watch } from 'vue';
import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import Icon from '~/components/atomic/Icon.vue';
import RenderMarkdown from '~/components/atomic/RenderMarkdown.vue';
import DeployPipelinePopup from '~/components/layout/popups/DeployPipelinePopup.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import Tab from '~/components/layout/scaffold/Tab.vue';
import PipelineStatusIcon from '~/components/repo/pipeline/PipelineStatusIcon.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import { useDate } from '~/compositions/useDate';
import { useFavicon } from '~/compositions/useFavicon';
import { provide, requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';
import usePipeline from '~/compositions/usePipeline';
import { useRouteBack } from '~/compositions/useRouteBack';
import { WebhookEvents } from '~/lib/api/types';
import type { Pipeline, PipelineConfig } from '~/lib/api/types';
import { pipelineHasErrorsToShow, workflowsWithErrors } from '~/lib/pipeline';
import { useApplicationStore } from '~/store/ops';
import { usePipelineStore } from '~/store/pipelines';

const props = defineProps<{
  repoId: string;
  pipelineId: string;
}>();

const apiClient = useApiClient();
const route = useRoute();
const router = useRouter();
const notifications = useNotifications();
const favicon = useFavicon();
const i18n = useI18n();

const pipelineStore = usePipelineStore();
const appStore = useApplicationStore();
const { durationAsNumber } = useDate();
const pipelineId = toRef(props, 'pipelineId');
const _repoId = toRef(props, 'repoId');
const repositoryId = computed(() => Number.parseInt(_repoId.value, 10));
const repo = requiredInject('repo');
const repoPermissions = requiredInject('repo-permissions');

const pipeline = pipelineStore.getPipeline(repositoryId, pipelineId);
const { since, duration, durationElapsed, created, message, shortMessage, prettyRef } = usePipeline(pipeline);

const errorsTabCount = computed(
  () => (pipeline.value?.errors?.length ?? 0) + workflowsWithErrors(pipeline.value).length,
);
const pipelineStatusTitle = computed(() => {
  const status = pipeline.value?.status;
  if (!status) {
    return '';
  }

  const translationKey = `repo.pipeline.status.${status}`;
  // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
  return i18n.te(translationKey) ? i18n.t(translationKey) : status;
});

const pipelineEventTranslationAliases: Partial<Record<WebhookEvents, string>> = {
  [WebhookEvents.PullRequest]: 'pr',
  [WebhookEvents.PullRequestClosed]: 'pr_closed',
  [WebhookEvents.PullRequestMetadata]: 'pr_metadata',
  [WebhookEvents.Deploy]: 'deploy',
};
const pipelineEventTitle = computed(() => {
  const event = pipeline.value?.event;
  if (!event) {
    return '';
  }

  const translationKey = `repo.pipeline.event.${pipelineEventTranslationAliases[event] ?? event}`;
  // eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys
  return i18n.te(translationKey) ? i18n.t(translationKey) : event;
});
provide('pipeline', pipeline as Ref<Pipeline>); // can't be undefined because of v-if in template

const pipelineConfigs = ref<PipelineConfig[]>();
provide('pipeline-configs', pipelineConfigs);

watch(
  pipeline,
  () => {
    favicon.updateStatus(pipeline.value?.status);
  },
  { immediate: true },
);

const showDeployPipelinePopup = ref(false);
const opsRelease = computed(() =>
  appStore.releaseList.find(
    (release) => release.pipeline_id === pipeline.value?.id || release.pipeline_id === pipeline.value?.number,
  ),
);
const opsDeploymentTarget = computed(() => {
  if (!opsRelease.value) {
    return undefined;
  }
  return {
    path: '/deployments/new',
    query: { applicationId: opsRelease.value.application_id, releaseId: opsRelease.value.id },
  };
});

function openDeploy() {
  if (!opsDeploymentTarget.value) {
    showDeployPipelinePopup.value = true;
  }
}

async function loadPipeline(): Promise<void> {
  await pipelineStore.loadPipeline(repo.value.id, Number.parseInt(pipelineId.value, 10));

  if (!pipeline.value?.number) {
    throw new Error('Unexpected: Pipeline number not found');
  }

  pipelineConfigs.value = await apiClient.getPipelineConfig(repo.value.id, pipeline.value.number);
}

const { doSubmit: cancelPipeline, isLoading: isCancelingPipeline } = useAsyncAction(async () => {
  if (!pipeline.value?.number) {
    throw new Error('Unexpected: Pipeline number not found');
  }

  await apiClient.cancelPipeline(repo.value.id, pipeline.value.number);
  notifications.notify({ title: i18n.t('repo.pipeline.actions.cancel_success'), type: 'success' });
});

const { doSubmit: restartPipeline, isLoading: isRestartingPipeline } = useAsyncAction(async () => {
  const newPipeline = await apiClient.restartPipeline(repo.value.id, pipelineId.value, {
    fork: true,
  });
  notifications.notify({ title: i18n.t('repo.pipeline.actions.restart_success'), type: 'success' });
  await router.push({
    name: 'repo-pipeline',
    params: { pipelineId: newPipeline.number },
  });
});

onMounted(() => Promise.all([loadPipeline(), appStore.loadAll()]));
watch([repositoryId, pipelineId], loadPipeline);

const goBack = useRouteBack({ name: 'repo' });
</script>
