<template>
  <div
    v-if="repoPermissions && repoPermissions.push"
    class="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(16rem,0.5fr)]"
  >
    <Panel :title="$t('repo.pipeline.debug.metadata_exec_title')">
      <div class="flex min-w-0 flex-col gap-4">
        <p class="text-wp-text-alt-100 text-sm leading-6">{{ $t('repo.pipeline.debug.metadata_exec_desc') }}</p>
        <div class="min-w-0 overflow-auto rounded-lg">
          <pre class="code-box min-w-max font-mono text-xs">{{ cliExecWithMetadata }}</pre>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <Button
            :is-loading="isLoading"
            :text="$t('repo.pipeline.debug.download_metadata')"
            @click="downloadMetadata"
          />
          <span class="text-wp-text-alt-100 min-w-0 text-xs break-all">{{ metadataFileName }}</span>
        </div>
      </div>
    </Panel>

    <Panel v-if="pipeline.version" :title="$t('repo.pipeline.version_header')">
      <div class="flex min-w-0 flex-col gap-3">
        <p class="text-wp-text-alt-100 text-sm leading-6">{{ $t('repo.pipeline.version') }}</p>
        <pre class="code-box min-w-0 overflow-auto font-mono text-xs">{{ pipeline.version }}</pre>
      </div>
    </Panel>
  </div>
  <FeedbackState
    v-else
    kind="permission"
    :title="$t('repo.pipeline.debug.no_permission')"
    :description="$t('feedback.permission_description')"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Panel from '~/components/layout/Panel.vue';
import useApiClient from '~/compositions/useApiClient';
import { requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';
import { useWPTitle } from '~/compositions/useWPTitle';

const { t } = useI18n();
const apiClient = useApiClient();
const notifications = useNotifications();

const repo = requiredInject('repo');
const pipeline = requiredInject('pipeline');
const repoPermissions = requiredInject('repo-permissions');

const isLoading = ref(false);

const metadataFileName = computed(
  () => `${repo?.value.full_name.replaceAll('/', '-')}-pipeline-${pipeline?.value.number}-metadata.json`,
);
const cliExecWithMetadata = computed(() => `# woodpecker-cli exec --metadata-file ${metadataFileName.value}`);

async function downloadMetadata() {
  if (!repo?.value || !pipeline?.value || !repoPermissions?.value?.push) {
    notifications.notify({ type: 'error', title: t('repo.pipeline.debug.metadata_download_error') });
    return;
  }

  isLoading.value = true;
  try {
    const metadata = await apiClient.getPipelineMetadata(repo.value.id, pipeline.value.number);

    // Create a Blob with the JSON data
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });

    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = metadataFileName.value;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    notifications.notify({ type: 'success', title: t('repo.pipeline.debug.metadata_download_successful') });
  } catch (error) {
    console.error('Error fetching metadata:', error);
    notifications.notify({ type: 'error', title: t('repo.pipeline.debug.metadata_download_error') });
  } finally {
    isLoading.value = false;
  }
}

useWPTitle(
  computed(() => [
    t('repo.pipeline.debug.title'),
    t('repo.pipeline.pipeline', { pipelineId: pipeline.value.number }),
    repo.value.full_name,
  ]),
);
</script>
