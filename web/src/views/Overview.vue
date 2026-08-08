<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>
{{ $t('ops.sidebar.overview') }}  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

    <div class="wp-stack">
      <div class="wp-metric-grid">
        <div class="wp-metric-card">
          <div class="wp-metric-head"><Icon name="repo" />{{ $t('overview.repositories') }}</div>
          <div class="wp-metric-body"><strong>{{ repoStore.ownedRepos.length }}</strong><span class="wp-muted text-xs">{{ $t('overview.active_repos') }}</span></div>
        </div>
        <div class="wp-metric-card">
          <div class="wp-metric-head"><Icon name="activity" class="text-wp-state-info-100" />{{ $t('overview.running') }}</div>
          <div class="wp-metric-body"><strong class="text-wp-state-info-100">{{ runningCount }}</strong><span class="wp-muted text-xs">{{ $t('overview.pipelines_running') }}</span></div>
        </div>
        <div class="wp-metric-card">
          <div class="wp-metric-head"><Icon name="agent" class="text-wp-state-ok-100" />{{ $t('overview.agents') }}</div>
          <div class="wp-metric-body"><strong class="text-wp-state-ok-100">{{ agents.length }}</strong><span class="wp-muted text-xs">{{ $t('overview.agents_online') }}</span></div>
        </div>
        <div class="wp-metric-card">
          <div class="wp-metric-head"><Icon name="stopwatch" />{{ $t('overview.feed') }}</div>
          <div class="wp-metric-body"><strong>{{ feed.length }}</strong><span class="wp-muted text-xs">{{ $t('overview.recent_activity') }}</span></div>
        </div>
      </div>

      <div class="wp-grid wp-grid-sidebar">
        <section class="wp-card">
          <div class="wp-card-header"><h2>{{ $t('overview.recent_activity') }}</h2><router-link class="text-wp-link-100 text-xs" to="/repos">{{ $t('ops.infrastructure.view_all') }}</router-link></div>
          <div class="wp-card-body" style="padding: 6px 16px">
            <div v-for="item in feed.slice(0, 10)" :key="`${item.repo_id}-${item.number}`" class="activity-item">
              <span class="status-dot" :class="item.status" />
              <div class="activity-copy">
                <strong class="text-wp-text-200">{{ repoName(item.repo_id) }}{{ pipelineRef(item.number) }}</strong>
                <p class="wp-muted">{{ item.message || '—' }}</p>
              </div>
              <span class="wp-muted text-xs">{{ item.event }}</span>
            </div>
            <div v-if="feed.length === 0" class="wp-empty-state">
              <strong>{{ $t('overview.no_activity') }}</strong>
              <p>{{ $t('overview.no_activity_hint') }}</p>
            </div>
          </div>
        </section>

        <aside class="wp-stack">
          <section class="wp-card">
            <div class="wp-card-header"><h2>{{ $t('overview.agents') }}</h2><router-link class="text-wp-link-100 text-xs" to="/admin/agents">{{ $t('ops.infrastructure.view_all') }}</router-link></div>
            <div class="wp-card-body wp-stack">
              <div v-for="agent in agents.slice(0, 8)" :key="agent.id" class="wp-split">
                <span class="wp-cluster"><Icon name="agent" class="text-wp-text-alt-100" />{{ agent.name }}</span>
                <span class="badge" :class="agent.no_schedule ? 'text-wp-error-100' : 'text-wp-state-ok-100'">{{ agent.no_schedule ? $t('overview.disabled') : $t('overview.online') }}</span>
              </div>
              <span v-if="agents.length === 0" class="wp-muted">{{ $t('overview.no_agents') }}</span>
            </div>
          </section>
          <section class="wp-card">
            <div class="wp-card-header"><h2>{{ $t('overview.repositories') }}</h2><router-link class="text-wp-link-100 text-xs" to="/repos">{{ $t('ops.infrastructure.view_all') }}</router-link></div>
            <div class="wp-card-body wp-stack">
              <div v-for="repo in repoStore.ownedRepos.slice(0, 8)" :key="repo.id" class="wp-split">
                <router-link class="text-wp-link-100" :to="{ name: 'repo', params: { repoId: repo.id } }">{{ repo.full_name }}</router-link>
                <span v-if="repo.last_pipeline" class="wp-muted text-xs">{{ repo.last_pipeline.status }}</span>
              </div>
              <span v-if="repoStore.ownedRepos.length === 0" class="wp-muted">{{ $t('overview.no_repos') }}</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Icon from '~/components/atomic/Icon.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Agent, PipelineFeed } from '~/lib/api/types';
import { useRepoStore } from '~/store/repos';

const apiClient = useApiClient();
const repoStore = useRepoStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.sidebar.overview')]));

const feed = ref<PipelineFeed[]>([]);

function repoName(repoId: number): string {
  const repo = repoStore.repos.get(repoId);
  return repo ? `${repo.owner}/${repo.name}` : `#${repoId}`;
}

function pipelineRef(number: number): string {
  return ` #${number}`;
}
const agents = ref<Agent[]>([]);

const runningCount = computed(() => feed.value.filter((p) => p.status === 'running' || p.status === 'pending').length);

onMounted(async () => {
  await Promise.all([
    repoStore.loadRepos(),
    apiClient.getPipelineFeed().then((r) => {
      feed.value = r ?? [];
      return r;
    }),
    apiClient.getAgents().then((r) => {
      agents.value = r ?? [];
      return r;
    }),
  ]);
});
</script>

