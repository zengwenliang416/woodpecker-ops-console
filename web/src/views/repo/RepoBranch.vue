<template>
  <RepoPipelineReference
    kind="branch"
    :title="branch"
    :pipelines="pipelines"
    :is-default="branch === repo.default_branch"
  />
</template>

<script lang="ts" setup>
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';

import RepoPipelineReference from '~/components/repo/RepoPipelineReference.vue';
import { requiredInject } from '~/compositions/useInjectProvide';
import { useWPTitle } from '~/compositions/useWPTitle';
import { isPullRequestEvent } from '~/lib/pipelineRefs';

const props = defineProps<{
  branch: string;
}>();

const branch = toRef(props, 'branch');
const repo = requiredInject('repo');
const allPipelines = requiredInject('pipelines');
const pipelines = computed(() =>
  allPipelines.value.filter((pipeline) => pipeline.branch === branch.value && !isPullRequestEvent(pipeline.event)),
);

const { t } = useI18n();
useWPTitle(computed(() => [t('repo.activity'), branch.value, repo.value.full_name]));
</script>
