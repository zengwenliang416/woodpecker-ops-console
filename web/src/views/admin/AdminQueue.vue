<template>
  <div class="admin-queue-page">
    <header class="admin-queue-page-header">
      <div class="min-w-0">
        <h1>{{ $t('admin.settings.queue.queue') }}</h1>
        <p>{{ $t('admin.settings.queue.desc') }}</p>
      </div>
    </header>

    <FeedbackState
      v-if="loadError"
      compact
      kind="error"
      :title="$t('admin.settings.queue.queue')"
      :description="loadError"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('admin.settings.queue.retry')" @click="loadQueueInfo" />
      </template>
    </FeedbackState>

    <FeedbackState
      v-if="loading && !queueInfo"
      kind="loading"
      :title="$t('admin.settings.queue.queue')"
      :description="$t('admin.settings.queue.desc')"
    />

    <template v-else-if="queueInfo">
      <SettingsSection :title="$t('admin.settings.queue.queue')" :description="$t('admin.settings.queue.desc')">
        <template #actions>
          <div class="flex items-center gap-2">
            <Button
              v-if="queueInfo.paused"
              :is-loading="isMutating"
              :text="$t('admin.settings.queue.resume')"
              start-icon="play"
              @click="resumeQueue"
            />
            <Button
              v-else
              :is-loading="isMutating"
              :text="$t('admin.settings.queue.pause')"
              start-icon="pause"
              @click="pauseQueue"
            />
            <Icon
              :name="queueInfo.paused ? 'pause' : 'play'"
              class="h-5 w-5 shrink-0"
              :class="{
                'text-wp-error-100': queueInfo.paused,
                'text-wp-text-alt-100': !queueInfo.paused,
              }"
            />
          </div>
        </template>

        <AdminQueueStats :stats="queueInfo.stats" />
      </SettingsSection>

      <FeedbackState
        v-if="!loadError && tasks.length === 0"
        kind="empty"
        :title="$t('admin.settings.queue.empty')"
        :description="$t('admin.settings.queue.desc')"
      />

      <SettingsSection
        v-else-if="tasks.length > 0"
        :title="$t('admin.settings.queue.tasks')"
        :description="$t('admin.settings.queue.desc')"
      >
        <SettingsTable min-width="680px">
          <template #head>
            <tr>
              <th>{{ $t('admin.settings.queue.tasks') }}</th>
              <th>{{ $t('admin.settings.queue.agent') }}</th>
              <th>{{ $t('admin.settings.queue.waiting_for') }}</th>
              <th>
                <span class="sr-only">{{ $t('repo.pipeline.view') }}</span>
              </th>
            </tr>
          </template>

          <tr v-for="task in tasks" :key="task.id">
            <td>
              <div class="queue-task">
                <div
                  class="queue-task-name"
                  :title="
                    task.status === 'pending'
                      ? $t('admin.settings.queue.task_pending')
                      : task.status === 'running'
                        ? $t('admin.settings.queue.task_running')
                        : $t('admin.settings.queue.task_waiting_on_deps')
                  "
                >
                  <Icon
                    :name="
                      task.status === 'pending'
                        ? 'status-pending'
                        : task.status === 'running'
                          ? 'status-running'
                          : 'status-declined'
                    "
                    :class="{
                      'text-wp-error-100': task.status === 'waiting_on_deps',
                      'text-wp-state-info-100': task.status === 'running',
                      'text-wp-state-neutral-100': task.status === 'pending',
                    }"
                  />
                  <span>{{ task.name }}</span>
                </div>
                <div v-if="Object.keys(task.labels).length > 0" class="queue-task-labels">
                  <Badge v-for="(value, label) in task.labels" :key="label" :label="label.toString()" :value="value" />
                </div>
              </div>
            </td>
            <td>
              <Badge v-if="task.agent_name" :value="task.agent_name" />
              <span v-else aria-hidden="true">{{ $t('repo.pipeline.execution_overview.not_available') }}</span>
            </td>
            <td>
              <div v-if="task.dependencies.length > 0" class="flex max-w-72 flex-wrap gap-1">
                <Badge v-for="dependency in task.dependencies" :key="dependency" :value="dependency" />
              </div>
              <span v-else aria-hidden="true">{{ $t('repo.pipeline.execution_overview.not_available') }}</span>
            </td>
            <td>
              <div class="flex justify-end">
                <IconButton
                  v-if="task.pipeline_number"
                  icon="chevron-right"
                  :title="$t('repo.pipeline.view')"
                  :to="{
                    name: 'repo-pipeline',
                    params: { repoId: task.repo_id, pipelineId: task.pipeline_number, stepId: task.pid },
                  }"
                />
              </div>
            </td>
          </tr>

          <template #footer>
            {{ $t('repo.settings_surface.loaded_count', { count: tasks.length }) }}
          </template>
        </SettingsTable>
      </SettingsSection>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import AdminQueueStats from '~/components/admin/settings/queue/AdminQueueStats.vue';
import Badge from '~/components/atomic/Badge.vue';
import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Icon from '~/components/atomic/Icon.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import SettingsTable from '~/components/settings/SettingsTable.vue';
import useApiClient from '~/compositions/useApiClient';
import { useInterval } from '~/compositions/useInterval';
import useNotifications from '~/compositions/useNotifications';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { QueueInfo } from '~/lib/api/types';

const apiClient = useApiClient();
const notifications = useNotifications();
const { t } = useI18n();

const queueInfo = ref<QueueInfo>();
const loading = ref(true);
const loadError = ref('');
const isMutating = ref(false);
let alive = true;
let lifecycleGeneration = 0;
let loadGeneration = 0;

function ownsLifecycle(generation: number) {
  return alive && generation === lifecycleGeneration;
}

function loadErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : t('admin.settings.queue.error_fallback');
}

function mutationErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : t('admin.settings.queue.mutation_error_fallback');
}

const tasks = computed(() => {
  if (!queueInfo.value) {
    return [];
  }

  return [
    ...queueInfo.value.running.map((task) => ({ ...task, status: 'running' as const })),
    ...queueInfo.value.pending.map((task) => ({ ...task, status: 'pending' as const })),
    ...queueInfo.value.waiting_on_deps.map((task) => ({ ...task, status: 'waiting_on_deps' as const })),
  ]
    .map((task) => ({
      ...task,
      labels: Object.fromEntries(Object.entries(task.labels).filter(([key]) => key !== 'org-id')),
    }))
    .toSorted((a, b) => a.id - b.id);
});

async function loadQueueInfo() {
  const requestGeneration = ++loadGeneration;
  const requestLifecycle = lifecycleGeneration;
  loading.value = true;
  loadError.value = '';

  try {
    const nextQueueInfo = await apiClient.getQueueInfo();
    if (!ownsLifecycle(requestLifecycle) || requestGeneration !== loadGeneration) {
      return false;
    }
    queueInfo.value = nextQueueInfo;
    return true;
  } catch (error) {
    if (ownsLifecycle(requestLifecycle) && requestGeneration === loadGeneration) {
      loadError.value = loadErrorMessage(error);
    }
    return false;
  } finally {
    if (ownsLifecycle(requestLifecycle) && requestGeneration === loadGeneration) {
      loading.value = false;
    }
  }
}

async function changeQueue(action: 'pause' | 'resume') {
  if (isMutating.value) {
    return;
  }

  const mutationLifecycle = lifecycleGeneration;
  isMutating.value = true;
  try {
    if (action === 'pause') {
      await apiClient.pauseQueue();
    } else {
      await apiClient.resumeQueue();
    }
  } catch (error) {
    if (ownsLifecycle(mutationLifecycle)) {
      notifications.notify({
        title: mutationErrorMessage(error),
        type: 'error',
      });
      isMutating.value = false;
    }
    return;
  }

  if (!ownsLifecycle(mutationLifecycle)) {
    return;
  }

  const refreshed = await loadQueueInfo();
  if (!refreshed || !ownsLifecycle(mutationLifecycle)) {
    if (ownsLifecycle(mutationLifecycle)) {
      isMutating.value = false;
    }
    return;
  }

  isMutating.value = false;
  notifications.notify({
    title: action === 'pause' ? t('admin.settings.queue.paused') : t('admin.settings.queue.resumed'),
    type: 'success',
  });
}

function pauseQueue() {
  return changeQueue('pause');
}

function resumeQueue() {
  return changeQueue('resume');
}

async function pollQueueInfo() {
  await loadQueueInfo();
}

useInterval(pollQueueInfo, 5 * 1000);

onBeforeUnmount(() => {
  alive = false;
  lifecycleGeneration += 1;
  loadGeneration += 1;
});

useWPTitle(computed(() => [t('admin.settings.queue.queue'), t('admin.settings.settings')]));
</script>

<style scoped>
@reference '~/tailwind.css';

.admin-queue-page {
  @apply flex max-w-full min-w-0 flex-col gap-4;
}

.admin-queue-page-header {
  @apply min-w-0;
}

.admin-queue-page-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.admin-queue-page-header p {
  @apply text-wp-text-alt-100 mt-1 max-w-3xl text-xs leading-5;
}

.queue-task {
  @apply flex min-w-0 flex-col gap-2;
}

.queue-task-name {
  @apply flex min-w-0 items-center gap-2 font-semibold;
}

.queue-task-name :deep(svg) {
  @apply h-4 w-4 shrink-0;
}

.queue-task-name span {
  @apply truncate;
}

.queue-task-labels {
  @apply flex max-w-full flex-wrap gap-1;
}
</style>
