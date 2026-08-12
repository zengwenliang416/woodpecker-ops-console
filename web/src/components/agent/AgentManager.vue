<template>
  <div class="agent-settings-page">
    <header class="agent-settings-page-header">
      <div class="min-w-0">
        <h1>{{ $t('admin.settings.agents.agents') }}</h1>
        <p>{{ description }}</p>
      </div>
      <Button v-if="selectedAgent" :text="$t('admin.settings.agents.show')" start-icon="back" @click="closeEditor" />
      <Button v-else color="green" :text="$t('admin.settings.agents.add')" start-icon="plus" @click="showAddAgent" />
    </header>

    <SettingsSection
      v-if="selectedAgent"
      :title="isEditingAgent ? $t('admin.settings.agents.edit_agent') : $t('admin.settings.agents.add')"
      :description="description"
    >
      <AgentForm
        v-model="selectedAgent"
        :is-editing-agent="isEditingAgent"
        :is-saving="isSaving"
        @save="saveAgent"
        @cancel="closeEditor"
      />
    </SettingsSection>

    <template v-else>
      <FeedbackState
        v-if="loadError"
        compact
        kind="error"
        :title="$t('admin.settings.agents.agents')"
        :description="loadError"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('admin.settings.agents.retry')" @click="reloadAgents" />
        </template>
      </FeedbackState>

      <FeedbackState
        v-if="loading && displayedAgents.length === 0"
        kind="loading"
        :title="$t('admin.settings.agents.agents')"
        :description="description"
      />

      <FeedbackState
        v-else-if="!loadError && displayedAgents.length === 0"
        kind="empty"
        :title="$t('admin.settings.agents.none')"
        :description="description"
      >
        <template #action>
          <Button start-icon="plus" :text="$t('admin.settings.agents.add')" @click="showAddAgent" />
        </template>
      </FeedbackState>

      <SettingsSection
        v-else-if="displayedAgents.length > 0"
        :title="$t('admin.settings.agents.agents')"
        :description="description"
      >
        <AgentList
          :loading="false"
          :agents="displayedAgents"
          :is-deleting="isDeleting"
          :is-admin="isAdmin"
          @edit="editAgent"
          @delete="deleteAgent"
        />
      </SettingsSection>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import useNotifications from '~/compositions/useNotifications';
import { usePagination } from '~/compositions/usePaginate';
import type { Agent } from '~/lib/api/types';
import { deepClone } from '~/lib/utils';

import AgentForm from './AgentForm.vue';
import AgentList from './AgentList.vue';

const props = defineProps<{
  description: string;
  loadAgents: (page: number) => Promise<Agent[] | null>;
  createAgent: (agent: Partial<Agent>) => Promise<Agent>;
  updateAgent: (agent: Agent) => Promise<Agent | void>;
  deleteAgent: (agent: Agent) => Promise<unknown>;
  isAdmin?: boolean;
  ownerKey?: string | number;
  ownerLifecycle?: () => string | number | undefined;
}>();

const notifications = useNotifications();
const { t } = useI18n();

const selectedAgent = ref<Partial<Agent>>();
const isEditingAgent = computed(() => !!selectedAgent.value?.id);
const loadError = ref('');
const confirmedAgents = ref<Agent[] | null>(null);
const isSaving = ref(false);
let reloadGeneration = 0;
let ownerLifecycleGeneration = 0;
let saveGeneration = 0;
let unmounted = false;

interface MutationOwnership {
  owner: string | number | undefined;
  ownerLifecycleKey: string | number | undefined;
  generation: number;
}

let deleteOwnership: MutationOwnership | undefined;

function currentOwnership(): MutationOwnership {
  return {
    owner: props.ownerKey,
    ownerLifecycleKey: props.ownerLifecycle?.(),
    generation: ownerLifecycleGeneration,
  };
}

function ownsCurrentLifecycle(ownership: MutationOwnership | undefined) {
  if (!ownership || unmounted) {
    return false;
  }
  return (
    ownership.owner === props.ownerKey &&
    ownership.ownerLifecycleKey === props.ownerLifecycle?.() &&
    ownership.generation === ownerLifecycleGeneration
  );
}

function notifyMutationError(error: unknown) {
  notifications.notify({
    title: error instanceof Error ? error.message : t('admin.settings.agents.mutation_error_fallback'),
    type: 'error',
  });
}

async function loadAgents(page: number) {
  const requestGeneration = reloadGeneration;
  const requestOwner = props.ownerKey;
  const requestOwnerLifecycleKey = props.ownerLifecycle?.();
  try {
    return await props.loadAgents(page);
  } catch (error) {
    if (
      requestGeneration === reloadGeneration &&
      requestOwner === props.ownerKey &&
      requestOwnerLifecycleKey === props.ownerLifecycle?.()
    ) {
      loadError.value = error instanceof Error ? error.message : t('admin.settings.agents.error_fallback');
    }
    return [];
  }
}

const { resetPage, data: agents, loading } = usePagination(loadAgents);
const displayedAgents = computed(() => confirmedAgents.value ?? agents.value);

watch(
  [agents, loading, loadError],
  ([rows, isLoading, error]) => {
    if (!isLoading && !error) {
      confirmedAgents.value = [...rows];
    }
  },
  { deep: true },
);

async function reloadAgents() {
  reloadGeneration += 1;
  loadError.value = '';
  await resetPage();
}

async function saveAgent() {
  if (!selectedAgent.value || isSaving.value) {
    return;
  }

  const saveOwnership = currentOwnership();
  const requestGeneration = ++saveGeneration;
  const editing = isEditingAgent.value;
  const submittedAgent = deepClone(selectedAgent.value);
  isSaving.value = true;

  try {
    if (editing) {
      await props.updateAgent(submittedAgent as Agent);
    } else {
      const createdAgent = await props.createAgent(submittedAgent);
      if (!ownsCurrentLifecycle(saveOwnership) || requestGeneration !== saveGeneration) {
        return;
      }
      selectedAgent.value = createdAgent;
    }
  } catch (error) {
    if (ownsCurrentLifecycle(saveOwnership) && requestGeneration === saveGeneration) {
      notifyMutationError(error);
    }
    return;
  } finally {
    if (ownsCurrentLifecycle(saveOwnership) && requestGeneration === saveGeneration) {
      isSaving.value = false;
    }
  }
  if (!ownsCurrentLifecycle(saveOwnership) || requestGeneration !== saveGeneration) {
    return;
  }

  if (editing) {
    selectedAgent.value = undefined;
  }
  notifications.notify({
    title: editing ? t('admin.settings.agents.saved') : t('admin.settings.agents.created'),
    type: 'success',
  });
  await reloadAgents();
}

const { doSubmit: deleteAgent, isLoading: isDeleting } = useAsyncAction(async (agent: Agent) => {
  // eslint-disable-next-line no-alert
  if (!confirm(t('admin.settings.agents.delete_confirm'))) {
    return;
  }

  deleteOwnership = currentOwnership();
  try {
    await props.deleteAgent(agent);
  } catch (error) {
    if (ownsCurrentLifecycle(deleteOwnership)) {
      notifyMutationError(error);
    }
    return;
  }
  if (!ownsCurrentLifecycle(deleteOwnership)) {
    return;
  }

  notifications.notify({ title: t('admin.settings.agents.deleted'), type: 'success' });
  await reloadAgents();
});

function editAgent(agent: Agent) {
  invalidateEditor();
  selectedAgent.value = deepClone(agent);
}

function showAddAgent() {
  invalidateEditor();
  selectedAgent.value = { name: '' };
}

function invalidateEditor() {
  ownerLifecycleGeneration += 1;
  saveGeneration += 1;
  isSaving.value = false;
}

function closeEditor() {
  invalidateEditor();
  selectedAgent.value = undefined;
}

watch(
  () => props.ownerKey,
  () => {
    ownerLifecycleGeneration += 1;
    reloadGeneration += 1;
    saveGeneration += 1;
    isSaving.value = false;
    selectedAgent.value = undefined;
    loadError.value = '';
    confirmedAgents.value = null;
    void resetPage();
  },
);

onBeforeUnmount(() => {
  unmounted = true;
  ownerLifecycleGeneration += 1;
  reloadGeneration += 1;
  saveGeneration += 1;
});
</script>

<style scoped>
@reference '~/tailwind.css';

.agent-settings-page {
  @apply flex min-w-0 flex-col gap-4;
}

.agent-settings-page-header {
  @apply flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between;
}

.agent-settings-page-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.agent-settings-page-header p {
  @apply text-wp-text-alt-100 mt-1 max-w-2xl text-xs leading-5;
}
</style>
