<template>
  <OpsSectionNav :label="$t('ops.infrastructure.title')" :items="items" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import OpsSectionNav from './OpsSectionNav.vue';
import type { OpsNavItem } from './OpsSectionNav.vue';

const props = defineProps<{
  serverCount?: number;
  alertCount?: number;
}>();

const { t } = useI18n();

const items = computed<OpsNavItem[]>(() => [
  { to: '/infrastructure', label: t('ops.infrastructure.title'), icon: 'infrastructure', exact: true },
  { to: '/infrastructure/servers', label: t('ops.servers.title'), icon: 'server', count: props.serverCount },
  { to: '/infrastructure/groups', label: t('ops.groups.title'), icon: 'list-group' },
  { to: '/infrastructure/services', label: t('ops.services.title'), icon: 'docker' },
  { to: '/infrastructure/alerts', label: t('ops.alerts.title'), icon: 'bell', count: props.alertCount },
]);
</script>
