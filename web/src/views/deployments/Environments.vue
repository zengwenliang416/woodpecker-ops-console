<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Scaffold>
    <template #title>{{ $t('ops.environments.title') }}</template>
    <div class="mb-4">
      <DeploymentNav
        :application-count="appStore.applicationList.length"
        :environment-count="appStore.environmentList.length"
        :release-count="appStore.releaseList.length"
      />
    </div>
    <section class="wp-card">
      <div class="wp-table-scroll">
        <table>
          <thead>
            <tr>
              <th>{{ $t('ops.environments.name') }}</th>
              <th>{{ $t('ops.environment.protected') }}</th>
              <th>{{ $t('ops.environment.approval_required') }}</th>
              <th>{{ $t('ops.environment.auto_rollback') }}</th>
              <th>{{ $t('ops.environment.deploy_window') }}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="env in appStore.environmentList" :key="env.id">
              <td>
                <router-link class="text-wp-link-100" :to="`/deployments/environments/${env.id}`">{{
                  env.title ?? env.name
                }}</router-link>
              </td>
              <td><Icon v-if="env.protected" name="check" class="text-wp-state-ok-100" /></td>
              <td><Icon v-if="env.approval_required" name="shield" class="text-wp-state-warn-100" /></td>
              <td><Icon v-if="env.auto_rollback" name="rollback" class="text-wp-state-ok-100" /></td>
              <td class="wp-muted">{{ env.deploy_window || '—' }}</td>
              <td><IconButton icon="chevron-right" :to="`/deployments/environments/${env.id}`" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text, vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import Icon from '~/components/atomic/Icon.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useApplicationStore } from '~/store/ops';

const appStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.environments.title')]));
onMounted(() => appStore.loadAll());
</script>
