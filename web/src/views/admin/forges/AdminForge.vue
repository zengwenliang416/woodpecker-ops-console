<template>
  <div class="admin-forge-page">
    <header class="admin-forge-page-header">
      <div class="min-w-0">
        <h1>{{ $t('edit_forge') }}</h1>
        <p>{{ $t('forges_desc') }}</p>
      </div>
      <Button :text="$t('show_forges')" start-icon="back" :to="{ name: 'admin-settings-forges' }" />
    </header>

    <FeedbackState
      v-if="loadError"
      kind="error"
      :title="$t('admin.settings.forges.error_title')"
      :description="loadError"
    >
      <template #action>
        <Button start-icon="refresh" :text="$t('admin.settings.surface.retry')" @click="loadForge" />
      </template>
    </FeedbackState>

    <FeedbackState
      v-if="loading && !forge"
      kind="loading"
      :title="$t('admin.settings.forges.loading_title')"
      :description="$t('admin.settings.forges.loading_description')"
    />

    <SettingsSection v-if="forge" :title="$t('edit_forge')" :description="$t('admin.settings.forges.form_description')">
      <AdminForgeForm v-model:forge="forge" :is-saving="isSaving" @submit="saveForge" />
    </SettingsSection>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import AdminForgeForm from '~/components/admin/settings/forges/AdminForgeForm.vue';
import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
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

const forgeId = computed(() => Number.parseInt(route.params.forgeId.toString(), 10));
const forge = ref<Forge>();
const loading = ref(false);
const loadError = ref('');
const isSaving = ref(false);
let lifecycleGeneration = 0;
let loadGeneration = 0;
let saveGeneration = 0;
let unmounted = false;

interface Ownership {
  forgeId: number;
  lifecycle: number;
  generation: number;
}

function ownsCurrentLifecycle(ownership: Ownership) {
  return !unmounted && ownership.forgeId === forgeId.value && ownership.lifecycle === lifecycleGeneration;
}

async function loadForge() {
  const ownership: Ownership = {
    forgeId: forgeId.value,
    lifecycle: lifecycleGeneration,
    generation: ++loadGeneration,
  };
  loadError.value = '';
  loading.value = true;

  try {
    const loadedForge = await apiClient.getForge(ownership.forgeId);
    if (ownsCurrentLifecycle(ownership) && ownership.generation === loadGeneration) {
      forge.value = deepClone(loadedForge);
    }
  } catch (error) {
    if (ownsCurrentLifecycle(ownership) && ownership.generation === loadGeneration) {
      loadError.value = error instanceof Error ? error.message : i18n.t('admin.settings.forges.error_fallback');
    }
  } finally {
    if (ownsCurrentLifecycle(ownership) && ownership.generation === loadGeneration) {
      loading.value = false;
    }
  }
}

function notifyMutationError(error: unknown) {
  notifications.notify({
    title: error instanceof Error ? error.message : i18n.t('admin.settings.forges.mutation_error_fallback'),
    type: 'error',
  });
}

async function saveForge() {
  if (!forge.value || isSaving.value) {
    return;
  }

  const ownership: Ownership = {
    forgeId: forgeId.value,
    lifecycle: lifecycleGeneration,
    generation: ++saveGeneration,
  };
  const submittedForge = deepClone(forge.value);
  isSaving.value = true;

  try {
    await apiClient.updateForge(submittedForge);
  } catch (error) {
    if (ownsCurrentLifecycle(ownership) && ownership.generation === saveGeneration) {
      notifyMutationError(error);
    }
    return;
  } finally {
    if (ownsCurrentLifecycle(ownership) && ownership.generation === saveGeneration) {
      isSaving.value = false;
    }
  }

  if (!ownsCurrentLifecycle(ownership) || ownership.generation !== saveGeneration) {
    return;
  }

  notifications.notify({
    title: i18n.t('forge_saved'),
    type: 'success',
  });
  await loadForge();
}

watch(
  forgeId,
  () => {
    lifecycleGeneration += 1;
    loadGeneration += 1;
    saveGeneration += 1;
    isSaving.value = false;
    forge.value = undefined;
    void loadForge();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  unmounted = true;
  lifecycleGeneration += 1;
  loadGeneration += 1;
  saveGeneration += 1;
});

useWPTitle(computed(() => [i18n.t('edit_forge'), i18n.t('admin.settings.settings')]));
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
