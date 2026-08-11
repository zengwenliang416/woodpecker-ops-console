<template>
  <FeedbackState
    v-if="!pullRequestsAvailable"
    kind="disabled"
    :title="$t('repo.repository_refs.pull_requests.disabled_title')"
    :description="$t('repo.repository_refs.pull_requests.disabled_description')"
  />
  <RepoPipelineReference
    v-else
    kind="pull-request"
    :title="title"
    :reference="`#${pullRequest}`"
    :pipelines="pipelines"
  />
</template>

<script lang="ts" setup>
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';

import FeedbackState from '~/components/atomic/FeedbackState.vue';
import RepoPipelineReference from '~/components/repo/RepoPipelineReference.vue';
import { requiredInject } from '~/compositions/useInjectProvide';
import { useWPTitle } from '~/compositions/useWPTitle';
import { pipelineMatchesPullRequest } from '~/lib/pipelineRefs';

const props = defineProps<{
  pullRequest: string;
}>();
const pullRequest = toRef(props, 'pullRequest');
const repo = requiredInject('repo');
const pullRequestsAvailable = computed(() => repo.value.pr_enabled && repo.value.allow_pr);
const allPipelines = requiredInject('pipelines');
const pipelines = computed(() =>
  allPipelines.value.filter((pipeline) => pipelineMatchesPullRequest(pipeline, pullRequest.value)),
);

const { t } = useI18n();
const title = computed(
  () =>
    pipelines.value.toSorted((a, b) => b.number - a.number)[0]?.title?.trim() ||
    t('repo.repository_refs.pull_requests.fallback_title', { index: pullRequest.value }),
);
useWPTitle(computed(() => [t('repo.activity'), pullRequest.value, repo.value.full_name]));
</script>
