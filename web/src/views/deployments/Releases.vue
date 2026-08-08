<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>{{ $t('ops.releases.title') }}</template>
    <section class="wp-card">
      <div class="wp-table-scroll">
        <table>
          <thead><tr><th>{{ $t('ops.releases.version') }}</th><th>{{ $t('ops.deployment.application') }}</th><th>Commit</th><th>Digest</th><th>{{ $t('ops.releases.status') }}</th><th>{{ $t('ops.releases.author') }}</th><th /></tr></thead>
          <tbody>
            <tr v-for="release in appStore.releaseList" :key="release.id">
              <td class="wp-mono">{{ release.version }}</td>
              <td>{{ appName(release.application_id) }}</td>
              <td class="wp-mono">{{ release.commit?.slice(0, 7) || '—' }}</td>
              <td class="wp-mono">{{ release.digest.slice(0, 16) }}</td>
              <td><span class="badge" :class="release.status === 'deployed' ? 'text-wp-state-ok-100' : 'text-wp-text-alt-100'">{{ release.status }}</span></td>
              <td>{{ release.author }}</td>
              <td><IconButton icon="rocket" :title="$t('ops.releases.deploy')" :to="{ path: '/deployments/new', query: { applicationId: release.application_id, releaseId: release.id } }" /></td>
            </tr>
            <tr v-if="appStore.releaseList.length === 0"><td colspan="7" class="wp-empty-state"><strong>{{ $t('ops.releases.none') }}</strong></td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import IconButton from '~/components/atomic/IconButton.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useApplicationStore } from '~/store/ops';

const appStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.releases.title')]));

function appName(appId: number): string {
  return appStore.applications.get(appId)?.name ?? `#${appId}`;
}

onMounted(() => appStore.loadAll());
</script>
