<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold :go-back="() => router.push('/deployments/apps')">
    <template #title>{{ app?.name ?? '...' }}</template>
    <template #headerActions>
      <Button
        color="green"
        start-icon="rocket"
        :text="$t('ops.applications.deploy')"
        :to="{ path: '/deployments/new', query: { applicationId: appId } }"
      />
    </template>
    <div class="mb-4">
      <DeploymentNav
        :application-count="appStore.applicationList.length"
        :environment-count="appStore.environmentList.length"
        :release-count="appStore.releaseList.length"
      />
    </div>
    <div v-if="app" class="wp-stack">
      <div class="wp-grid wp-grid-sidebar">
        <section class="wp-card">
          <div class="wp-card-header">
            <h2>{{ $t('ops.applications.details') }}</h2>
          </div>
          <div class="wp-card-body wp-grid wp-grid-2">
            <div class="wp-muted">Image</div>
            <div class="wp-mono">{{ app.image }}</div>
            <div class="wp-muted">{{ $t('ops.applications.runtime') }}</div>
            <div>{{ app.runtime }} · {{ app.compose_file || '—' }}</div>
            <div class="wp-muted">{{ $t('ops.applications.service') }}</div>
            <div>{{ app.service }}</div>
            <div class="wp-muted">Health</div>
            <div>{{ app.health_path || '—' }} :{{ app.port || '—' }}</div>
          </div>
        </section>
        <section class="wp-card">
          <div class="wp-card-header">
            <h2>{{ $t('ops.releases.title') }}</h2>
          </div>
          <div class="wp-card-body wp-stack">
            <div v-for="release in appStore.releasesOf(appId).value" :key="release.id" class="wp-split">
              <div>
                <router-link
                  class="text-wp-link-100"
                  :to="{ path: '/deployments/new', query: { applicationId: appId, releaseId: release.id } }"
                  >{{ release.version }}</router-link
                >
                <div class="wp-muted wp-mono text-xs">{{ release.digest.slice(0, 16) }}</div>
              </div>
              <span
                class="badge"
                :class="release.status === 'deployed' ? 'text-wp-state-ok-100' : 'text-wp-text-alt-100'"
                >{{ release.status }}</span
              >
            </div>
            <span v-if="appStore.releasesOf(appId).value.length === 0" class="wp-muted">{{
              $t('ops.releases.none')
            }}</span>
          </div>
        </section>
      </div>
    </div>
    <div v-else class="flex justify-center py-20"><Icon name="spinner" class="animate-spin" /></div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import Icon from '~/components/atomic/Icon.vue';
import Button from '~/components/atomic/Button.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useApplicationStore } from '~/store/ops';

const route = useRoute();
const router = useRouter();
const appStore = useApplicationStore();
const { t } = useI18n();
const appId = computed(() => Number(route.params.appId));
const app = computed(() => appStore.applications.get(appId.value));
useWPTitle(computed(() => [app.value?.name ?? t('ops.applications.title')]));

onMounted(() => appStore.loadAll());
</script>
