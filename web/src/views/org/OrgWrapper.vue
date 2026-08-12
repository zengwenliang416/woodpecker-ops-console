<template>
  <Scaffold v-if="loading" full-width-header>
    <template #title>{{ $t('org.surface.loading_title') }}</template>
    <FeedbackState
      kind="loading"
      :title="$t('org.surface.loading_title')"
      :description="$t('org.surface.loading_description')"
    />
  </Scaffold>

  <Scaffold v-else-if="loadError" full-width-header>
    <template #title>{{ $t('org.surface.error_title') }}</template>
    <FeedbackState kind="error" :title="$t('org.surface.error_title')" :description="loadError">
      <template #action>
        <Button start-icon="refresh" :text="$t('org.surface.retry')" @click="load" />
      </template>
    </FeedbackState>
  </Scaffold>

  <Scaffold v-else-if="org && orgPermissions && route.meta.orgHeader" full-width-header fluid-content>
    <template #title>
      {{ org.name }}
    </template>

    <template #headerActions>
      <IconButton
        v-if="orgPermissions.admin"
        :to="{ name: org.is_user ? 'user' : 'org-settings-secrets', params: { orgId: org.id } }"
        :title="$t('settings')"
        icon="settings"
      />
    </template>

    <router-view />
  </Scaffold>
  <router-view v-else-if="org && orgPermissions" />
</template>

<script lang="ts" setup>
import type { Ref } from 'vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useApiClient from '~/compositions/useApiClient';
import { provide } from '~/compositions/useInjectProvide';
import type { Org, OrgPermissions } from '~/lib/api/types';

const props = defineProps<{
  orgId: string;
}>();

const orgId = computed(() => Number.parseInt(props.orgId, 10));
const apiClient = useApiClient();
const route = useRoute();
const { t } = useI18n();

const org = ref<Org>();
const orgPermissions = ref<OrgPermissions>();
const orgLifecycle = ref(0);
const loading = ref(true);
const loadError = ref('');

provide('org', org as Ref<Org>);
provide('org-permissions', orgPermissions as Ref<OrgPermissions>);
provide('org-lifecycle', orgLifecycle);

async function load() {
  const requestGeneration = ++orgLifecycle.value;
  const requestOrgId = orgId.value;
  org.value = undefined;
  orgPermissions.value = undefined;
  loadError.value = '';
  loading.value = true;

  try {
    const nextOrg = await apiClient.getOrg(requestOrgId);
    const nextPermissions = await apiClient.getOrgPermissions(requestOrgId);
    if (requestGeneration !== orgLifecycle.value || requestOrgId !== orgId.value) {
      return;
    }
    org.value = nextOrg;
    orgPermissions.value = nextPermissions;
  } catch (error) {
    if (requestGeneration === orgLifecycle.value && requestOrgId === orgId.value) {
      loadError.value = error instanceof Error ? error.message : t('org.surface.error_fallback');
    }
  } finally {
    if (requestGeneration === orgLifecycle.value && requestOrgId === orgId.value) {
      loading.value = false;
    }
  }
}

onMounted(load);
onBeforeUnmount(() => {
  orgLifecycle.value += 1;
});
watch(orgId, load);
</script>
