<template>
  <FeedbackState
    v-if="pipelineConfigsDecoded.length === 0"
    kind="empty"
    :title="$t('repo.pipeline.config_diagnostics.empty')"
    :description="$t('repo.pipeline.config_diagnostics.empty_description')"
  />
  <div v-else class="flex min-w-0 flex-col gap-y-4">
    <Panel
      v-for="pipelineConfig in pipelineConfigsDecoded"
      :key="pipelineConfig.hash"
      :collapsable="pipelineConfigsDecoded && pipelineConfigsDecoded.length > 1"
      collapsed-by-default
      :title="pipelineConfig.name"
    >
      <div class="flex min-w-0 flex-col gap-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-wp-text-alt-100 text-xs">{{ $t('repo.pipeline.config_diagnostics.read_only') }}</p>
          <Button
            size="sm"
            :disabled="!canCopy"
            :text="$t('repo.pipeline.config_diagnostics.copy')"
            @click="copyConfig(pipelineConfig.data)"
          />
        </div>
        <div class="max-h-[38rem] min-w-0 overflow-auto rounded-lg">
          <SyntaxHighlight
            class="code-box min-w-max font-mono whitespace-pre"
            language="yaml"
            :code="pipelineConfig.data"
          />
        </div>
      </div>
    </Panel>
  </div>
</template>

<script lang="ts" setup>
import { decode } from 'js-base64';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import SyntaxHighlight from '~/components/atomic/SyntaxHighlight';
import Panel from '~/components/layout/Panel.vue';
import { requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';
import { useWPTitle } from '~/compositions/useWPTitle';

const repo = requiredInject('repo');
const pipeline = requiredInject('pipeline');
const pipelineConfigs = requiredInject('pipeline-configs');
const notifications = useNotifications();
const { t } = useI18n();

const pipelineConfigsDecoded = computed(
  () =>
    pipelineConfigs.value?.map((i) => ({
      ...i,
      data: decode(i.data),
    })) ?? [],
);

const canCopy = computed(() => typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.writeText));

async function copyConfig(config: string) {
  if (!canCopy.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(config);
    notifications.notify({ type: 'success', title: t('repo.pipeline.config_diagnostics.copy_success') });
  } catch {
    notifications.notify({ type: 'error', title: t('repo.pipeline.config_diagnostics.copy_error') });
  }
}

useWPTitle(
  computed(() => [
    t('repo.pipeline.config'),
    t('repo.pipeline.pipeline', { pipelineId: pipeline.value.number }),
    repo.value.full_name,
  ]),
);
</script>
