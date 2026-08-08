<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold :go-back="() => router.push('/deployments')">
    <template #title>DEP-{{ deploymentId }}</template>
    <template #headerActions>
      <template v-if="detail">
        <Button v-if="detail.deployment.status === 'pending_approval'" color="green" start-icon="check" :text="$t('ops.deployment.approve')" @click="approve" />
        <Button v-if="detail.deployment.status === 'pending_approval'" color="red" start-icon="x" :text="$t('ops.deployment.reject')" @click="reject" />
        <Button v-if="isRunning" start-icon="pause" :text="$t('ops.deployment.pause')" @click="api.pauseDeployment(deploymentId).then(reload)" />
        <Button v-if="detail.deployment.status === 'paused'" start-icon="play" :text="$t('ops.deployment.resume')" @click="api.resumeDeployment(deploymentId).then(reload)" />
        <Button v-if="isRunning" color="red" start-icon="stop" :text="$t('ops.deployment.cancel')" @click="cancel" />
        <Button v-if="detail.deployment.status === 'failed'" color="red" start-icon="rollback" :text="$t('ops.deployment.rollback')" @click="rollback" />
      </template>
    </template>

    <div v-if="detail" class="wp-stack">
      <div class="wp-metric-grid">
        <div class="wp-metric-card"><div class="wp-metric-head"><Icon name="app" />{{ $t('ops.deployment.application') }}</div><div class="wp-metric-body"><strong class="text-lg">{{ appName }}</strong></div></div>
        <div class="wp-metric-card"><div class="wp-metric-head"><Icon name="environment" />{{ $t('ops.deployment.environment') }}</div><div class="wp-metric-body"><strong class="text-lg">{{ envName }}</strong></div></div>
        <div class="wp-metric-card"><div class="wp-metric-head"><Icon name="package" />{{ $t('ops.deployment.release') }}</div><div class="wp-metric-body"><strong class="wp-mono text-lg">{{ releaseVersion }}</strong></div></div>
        <div class="wp-metric-card"><div class="wp-metric-head"><Icon name="activity" />{{ $t('ops.deployment.progress') }}</div><div class="wp-metric-body"><strong>{{ detail.deployment.progress }}%</strong><span class="badge" :class="statusClass">{{ detail.deployment.status }}</span></div></div>
      </div>

      <div class="wp-grid wp-grid-sidebar">
        <section class="wp-card">
          <div class="wp-card-header"><h2>{{ $t('ops.deployment.targets') }}</h2><span class="wp-muted">{{ detail.deployment.strategy }} · batch {{ detail.deployment.batch_size }}</span></div>
          <div class="wp-table-scroll">
            <table>
              <thead><tr><th>{{ $t('ops.server.name') }}</th><th>{{ $t('ops.deployment.target_status') }}</th><th>{{ $t('ops.deployment.phase') }}</th><th>{{ $t('ops.deployment.message') }}</th><th /></tr></thead>
              <tbody>
                <tr v-for="target in detail.targets" :key="target.server_id">
                  <td><router-link class="text-wp-link-100" :to="`/infrastructure/servers/${target.server_id}`">{{ serverName(target.server_id) }}</router-link></td>
                  <td><span class="badge" :class="targetStatusClass(target.status)">{{ target.status }}</span></td>
                  <td class="wp-muted">{{ target.phase }}</td>
                  <td>{{ target.message || '—' }}</td>
                  <td><Button v-if="target.status === 'failed'" size="sm" color="green" :text="$t('ops.deployment.retry')" @click="retry(target.server_id)" /></td>
                </tr>
                <tr v-if="detail.targets.length === 0"><td colspan="5" class="wp-empty-state"><strong>{{ $t('ops.deployment.no_targets') }}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="wp-card">
          <div class="wp-card-header"><h2>{{ $t('ops.deployment.logs') }}</h2></div>
          <div class="max-h-96 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
            <div v-for="(log, i) in detail.deployment.logs ?? []" :key="i" :class="logLevelClass(log.level)">
              <span class="wp-muted">[{{ formatTime(log.at) }}]</span> {{ log.message }}
            </div>
            <div v-if="(detail.deployment.logs ?? []).length === 0" class="wp-muted">{{ $t('ops.deployment.no_logs') }}</div>
          </div>
        </section>
      </div>

      <section v-if="detail.approvals.length > 0" class="wp-card">
        <div class="wp-card-header"><h2>{{ $t('ops.deployment.approvals') }}</h2></div>
        <div class="wp-card-body wp-stack">
          <div v-for="a in detail.approvals" :key="a.id" class="wp-cluster">
            <span class="badge" :class="a.approved ? 'text-wp-state-ok-100' : 'text-wp-error-100'">{{ a.approved ? $t('ops.deployment.approved') : $t('ops.deployment.rejected') }}</span>
            <strong>{{ a.approver }}</strong>
            <span class="wp-muted">{{ a.comment }}</span>
          </div>
        </div>
      </section>
    </div>
    <div v-else class="flex justify-center py-20"><Icon name="spinner" class="animate-spin" /></div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Button from '~/components/atomic/Button.vue';
import Icon from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { DeploymentDetail } from '~/lib/api/types';
import { useApplicationStore, useDeploymentStore, useServerStore } from '~/store/ops';

const route = useRoute();
const router = useRouter();
const api = useApiClient();
const store = useDeploymentStore();
const appStore = useApplicationStore();
const serverStore = useServerStore();

const deploymentId = computed(() => Number(route.params.deploymentId));
const detail = ref<DeploymentDetail | null>(null);

useWPTitle(computed(() => [`DEP-${deploymentId.value}`]));

const isRunning = computed(() => detail.value?.deployment.status === 'running' || detail.value?.deployment.status === 'paused');

const statusClass = computed(() => {
  const status = detail.value?.deployment.status ?? '';
  if (status === 'success') {
    return 'text-wp-state-ok-100';
  }
  if (['failed', 'cancelled', 'rejected'].includes(status)) {
    return 'text-wp-error-100';
  }
  if (['running', 'paused', 'approved'].includes(status)) {
    return 'text-wp-state-info-100';
  }
  if (status === 'pending_approval') {
    return 'text-wp-state-warn-100';
  }
  return '';
});

const appName = computed(() => (detail.value ? appStore.applications.get(detail.value.deployment.application_id)?.name ?? `#${detail.value.deployment.application_id}` : ''));
const envName = computed(() => (detail.value ? appStore.environments.get(detail.value.deployment.environment_id)?.title ?? `#${detail.value.deployment.environment_id}` : ''));
const releaseVersion = computed(() => (detail.value ? appStore.releases.get(detail.value.deployment.release_id)?.version ?? `#${detail.value.deployment.release_id}` : ''));

function serverName(serverId: number): string {
  return serverStore.servers.get(serverId)?.name ?? `#${serverId}`;
}

async function reload() {
  detail.value = await store.loadDetail(deploymentId.value);
}

async function approve() {
  await api.approveDeployment(deploymentId.value);
  await reload();
}

async function reject() {
  await api.rejectDeployment(deploymentId.value, 'rejected');
  await reload();
}

async function cancel() {
  await api.cancelDeployment(deploymentId.value);
  await reload();
}

async function retry(serverId: number) {
  await api.retryDeployment(deploymentId.value, [serverId]);
  await reload();
}

async function rollback() {
  const deployment = await api.rollbackDeployment(deploymentId.value);
  if (deployment) {
    await router.push(`/deployments/${deployment.id}`);
  }
}

function targetStatusClass(status: string): string {
  if (status === 'healthy') {
    return 'text-wp-state-ok-100';
  }
  if (status === 'failed') {
    return 'text-wp-error-100';
  }
  if (['deploying', 'health_check'].includes(status)) {
    return 'text-wp-state-info-100';
  }
  return 'text-wp-text-alt-100';
}

function logLevelClass(level: string): string {
  if (level === 'danger') {
    return 'text-wp-error-100';
  }
  if (level === 'warning') {
    return 'text-wp-state-warn-100';
  }
  if (level === 'success') {
    return 'text-wp-state-ok-100';
  }
  return 'text-wp-text-100';
}

function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString();
}

onMounted(async () => {
  await Promise.all([reload(), appStore.loadAll(), serverStore.loadServers()]);
});
</script>
