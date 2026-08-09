<template>
  <OpsSectionNav :label="$t('ops.deployments.title')" :items="items" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import OpsSectionNav from './OpsSectionNav.vue';
import type { OpsNavItem } from './OpsSectionNav.vue';

const props = defineProps<{
  applicationCount?: number;
  environmentCount?: number;
  releaseCount?: number;
  approvalCount?: number;
}>();

const { t } = useI18n();

const items = computed<OpsNavItem[]>(() => [
  { to: '/deployments', label: t('ops.deployments.title'), icon: 'rocket', exact: true },
  { to: '/deployments/apps', label: t('ops.applications.title'), icon: 'app', count: props.applicationCount },
  {
    to: '/deployments/environments',
    label: t('ops.environments.title'),
    icon: 'environment',
    count: props.environmentCount,
  },
  { to: '/deployments/releases', label: t('ops.releases.title'), icon: 'package', count: props.releaseCount },
  { to: '/deployments/approvals', label: t('ops.approvals.title'), icon: 'shield', count: props.approvalCount },
  { to: '/deployments/policies', label: t('ops.policies.title'), icon: 'settings' },
]);
</script>
