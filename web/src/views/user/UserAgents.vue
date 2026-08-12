<template>
  <FeedbackState
    v-if="!userRegisteredAgents"
    kind="disabled"
    :title="$t('user.settings.surface.agents_disabled_title')"
    :description="$t('user.settings.surface.agents_disabled_description')"
  />

  <AgentManager
    v-else
    :owner-key="user.org_id"
    :description="$t('user.settings.agents.desc')"
    :load-agents="loadAgents"
    :create-agent="createAgent"
    :update-agent="updateAgent"
    :delete-agent="deleteAgent"
  />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import AgentManager from '~/components/agent/AgentManager.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import useApiClient from '~/compositions/useApiClient';
import useAuthentication from '~/compositions/useAuthentication';
import useConfig from '~/compositions/useConfig';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Agent } from '~/lib/api/types';

const apiClient = useApiClient();
const { user } = useAuthentication();
const { userRegisteredAgents } = useConfig();

if (!user) {
  throw new Error('Unexpected: User should be authenticated');
}

const loadAgents = (page: number) => apiClient.getOrgAgents(user.org_id, { page });
const createAgent = (agent: Partial<Agent>) => apiClient.createOrgAgent(user.org_id, agent);
const updateAgent = (agent: Agent) => apiClient.updateOrgAgent(user.org_id, agent.id, agent);
const deleteAgent = (agent: Agent) => apiClient.deleteOrgAgent(user.org_id, agent.id);

const { t } = useI18n();
useWPTitle(computed(() => [t('admin.settings.agents.agents'), t('user.settings.settings')]));
</script>
