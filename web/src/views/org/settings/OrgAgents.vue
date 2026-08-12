<template>
  <FeedbackState
    v-if="!userRegisteredAgents"
    kind="disabled"
    :title="$t('org.settings.surface.agents_disabled_title')"
    :description="$t('org.settings.surface.agents_disabled_description')"
  />

  <AgentManager
    v-else
    :owner-key="org.id"
    :owner-lifecycle="getOwnerLifecycle"
    :description="$t('org.settings.agents.desc')"
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
import useConfig from '~/compositions/useConfig';
import { requiredInject } from '~/compositions/useInjectProvide';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Agent } from '~/lib/api/types';

defineProps<{
  orgId: string;
}>();

const apiClient = useApiClient();
const org = requiredInject('org');
const orgLifecycle = requiredInject('org-lifecycle');
const { userRegisteredAgents } = useConfig();
const getOwnerLifecycle = () => orgLifecycle.value;

const loadAgents = (page: number) => {
  const orgId = org.value.id;
  return apiClient.getOrgAgents(orgId, { page });
};
const createAgent = (agent: Partial<Agent>) => {
  const orgId = org.value.id;
  return apiClient.createOrgAgent(orgId, agent);
};
const updateAgent = (agent: Agent) => {
  const orgId = org.value.id;
  return apiClient.updateOrgAgent(orgId, agent.id, agent);
};
const deleteAgent = (agent: Agent) => {
  const orgId = org.value.id;
  return apiClient.deleteOrgAgent(orgId, agent.id);
};

const { t } = useI18n();
useWPTitle(computed(() => [t('admin.settings.agents.agents'), org.value.name]));
</script>
