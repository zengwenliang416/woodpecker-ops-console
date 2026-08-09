<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold :go-back="() => router.push('/deployments/environments')">
    <template #title>{{ env?.title ?? env?.name ?? '...' }}</template>
    <div class="mb-4">
      <DeploymentNav
        :application-count="appStore.applicationList.length"
        :environment-count="appStore.environmentList.length"
        :release-count="appStore.releaseList.length"
      />
    </div>
    <div v-if="env" class="wp-stack">
      <div class="wp-cluster">
        <span v-if="env.protected" class="badge text-wp-state-warn-100"
          ><Icon name="shield" />{{ $t('ops.environment.protected') }}</span
        >
        <span v-if="env.approval_required" class="badge text-wp-state-warn-100"
          >{{ $t('ops.environment.approval_required') }} ({{ env.minimum_approvers }})</span
        >
        <span v-if="env.auto_rollback" class="badge text-wp-state-ok-100">{{
          $t('ops.environment.auto_rollback')
        }}</span>
      </div>
      <div class="wp-grid wp-grid-sidebar">
        <section class="wp-card">
          <div class="wp-card-header">
            <h2>{{ $t('ops.environment.details') }}</h2>
          </div>
          <div class="wp-card-body wp-grid wp-grid-2">
            <div class="wp-muted">{{ $t('ops.environment.deploy_window') }}</div>
            <div>{{ env.deploy_window || '—' }}</div>
            <div class="wp-muted">Domain</div>
            <div>{{ env.domain || '—' }}</div>
            <div class="wp-muted">{{ $t('ops.environment.minimum_approvers') }}</div>
            <div>{{ env.minimum_approvers }}</div>
          </div>
        </section>
        <section class="wp-card">
          <div class="wp-card-header">
            <h2>{{ $t('ops.infrastructure.groups') }}</h2>
          </div>
          <div class="wp-card-body wp-stack">
            <div v-for="group in groups" :key="group.id" class="wp-split">
              <router-link class="text-wp-link-100" :to="`/infrastructure/groups/${group.id}`">{{
                group.name
              }}</router-link>
              <span class="wp-muted">{{ group.strategy }} · {{ group.batch_size }}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Icon from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useApplicationStore, useServerStore } from '~/store/ops';

const route = useRoute();
const router = useRouter();
const appStore = useApplicationStore();
const serverStore = useServerStore();
const { t } = useI18n();
const envId = computed(() => Number(route.params.envId));
const env = computed(() => appStore.environments.get(envId.value));
const groups = computed(() => serverStore.groupList.filter((g) => g.environment_id === envId.value));
useWPTitle(computed(() => [env.value?.title ?? t('ops.environments.title')]));

onMounted(() => Promise.all([appStore.loadAll(), serverStore.loadGroups()]));
</script>
