<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>{{ $t('ops.policies.title') }}</template>
    <div v-if="policies" class="wp-grid wp-grid-sidebar">
      <section class="wp-card">
        <div class="wp-card-header"><h2>{{ $t('ops.policies.defaults') }}</h2></div>
        <div class="wp-card-body wp-grid wp-grid-2">
          <div class="wp-muted">{{ $t('ops.policies.health_retries') }}</div><div>{{ policies.health_check_retries }}</div>
          <div class="wp-muted">{{ $t('ops.policies.health_interval') }}</div><div>{{ policies.health_check_interval }}s</div>
          <div class="wp-muted">{{ $t('ops.policies.batch_default') }}</div><div>{{ policies.batch_size_default }}</div>
          <div class="wp-muted">{{ $t('ops.policies.auto_rollback') }}</div><div>{{ policies.auto_rollback ? '✓' : '—' }}</div>
        </div>
      </section>
      <section class="wp-card">
        <div class="wp-card-header"><h2>{{ $t('ops.policies.strategies') }}</h2></div>
        <div class="wp-card-body wp-stack">
          <div class="wp-split"><span>{{ $t('ops.deployment.strategy_single') }}</span><span class="wp-muted">1 × 1</span></div>
          <div class="wp-split"><span>{{ $t('ops.deployment.strategy_rolling') }}</span><span class="wp-muted">batch {{ policies.batch_size_default }}</span></div>
          <div class="wp-split"><span>{{ $t('ops.deployment.strategy_all_at_once') }}</span><span class="wp-muted">N × N</span></div>
        </div>
      </section>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';

const api = useApiClient();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.policies.title')]));
const policies = ref<Record<string, any> | null>(null);
onMounted(async () => {
  policies.value = (await api.getOpsPolicies()) as Record<string, any>;
});
</script>
