<template>
  <div class="admin-forge-page">
    <header class="admin-forge-page-header">
      <div class="min-w-0">
        <h1>{{ $t('add_forge') }}</h1>
        <p>{{ $t('forges_desc') }}</p>
      </div>
      <Button :text="$t('show_forges')" start-icon="back" :to="{ name: 'admin-settings-forges' }" />
    </header>

    <SettingsSection :title="$t('add_forge')" :description="$t('admin.settings.forges.form_description')">
      <AdminForgeForm v-model:forge="forge" :is-saving="isSaving" is-new @submit="saveForge" />
    </SettingsSection>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import AdminForgeForm from '~/components/admin/settings/forges/AdminForgeForm.vue';
import Button from '~/components/atomic/Button.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import useApiClient from '~/compositions/useApiClient';
import useNotifications from '~/compositions/useNotifications';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Forge } from '~/lib/api/types';
import { deepClone } from '~/lib/utils';

const apiClient = useApiClient();
const notifications = useNotifications();
const i18n = useI18n();
const route = useRoute();
const router = useRouter();

const forge = ref<Partial<Forge>>({});
const isSaving = ref(false);
let lifecycleGeneration = 0;
let createGeneration = 0;
let unmounted = false;

interface Ownership {
  route: string;
  lifecycle: number;
  generation: number;
}

function ownsCurrentLifecycle(ownership: Ownership) {
  return (
    !unmounted &&
    ownership.route === route.fullPath &&
    ownership.lifecycle === lifecycleGeneration &&
    ownership.generation === createGeneration
  );
}

function notifyMutationError(error: unknown) {
  notifications.notify({
    title: error instanceof Error ? error.message : i18n.t('admin.settings.forges.mutation_error_fallback'),
    type: 'error',
  });
}

async function saveForge() {
  if (isSaving.value) {
    return;
  }

  const ownership: Ownership = {
    route: route.fullPath,
    lifecycle: lifecycleGeneration,
    generation: ++createGeneration,
  };
  const submittedForge = deepClone(forge.value);
  isSaving.value = true;

  try {
    const createdForge = await apiClient.createForge(submittedForge);
    if (!ownsCurrentLifecycle(ownership)) {
      return;
    }
    forge.value = createdForge;
  } catch (error) {
    if (ownsCurrentLifecycle(ownership)) {
      notifyMutationError(error);
    }
    return;
  } finally {
    if (ownsCurrentLifecycle(ownership)) {
      isSaving.value = false;
    }
  }

  if (!ownsCurrentLifecycle(ownership)) {
    return;
  }

  notifications.notify({
    title: i18n.t('forge_created'),
    type: 'success',
  });
  await router.push({ name: 'admin-settings-forge', params: { forgeId: forge.value.id } });
}

watch(
  () => route.fullPath,
  () => {
    lifecycleGeneration += 1;
    createGeneration += 1;
    isSaving.value = false;
  },
);

onBeforeUnmount(() => {
  unmounted = true;
  lifecycleGeneration += 1;
  createGeneration += 1;
});

useWPTitle(computed(() => [i18n.t('add_forge'), i18n.t('admin.settings.settings')]));
</script>

<style scoped>
@reference '~/tailwind.css';

.admin-forge-page {
  @apply flex min-w-0 flex-col gap-4;
}

.admin-forge-page-header {
  @apply flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between;
}

.admin-forge-page-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.admin-forge-page-header p {
  @apply text-wp-text-alt-100 mt-1 max-w-2xl text-xs leading-5;
}
</style>
