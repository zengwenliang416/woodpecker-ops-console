<template>
  <div class="repo-settings-page">
    <header class="repo-settings-page-header">
      <div>
        <h1>{{ $t('extensions') }}</h1>
        <p>{{ $t('extensions_description') }}</p>
      </div>
    </header>

    <form class="space-y-4" @submit.prevent="saveExtensions">
      <RepoSettingsSection
        :title="$t('extensions_signatures_public_key')"
        :description="$t('extensions_signatures_public_key_description')"
      >
        <FeedbackState
          v-if="loadingSignature"
          compact
          kind="loading"
          :title="$t('repo.settings_surface.extensions.signature_loading_title')"
        />
        <FeedbackState
          v-else-if="signatureError"
          compact
          kind="error"
          :title="$t('repo.settings_surface.extensions.signature_error_title')"
          :description="signatureError"
        >
          <template #action>
            <Button
              size="sm"
              start-icon="refresh"
              :text="$t('repo.settings_surface.retry')"
              @click="loadSignaturePublicKey"
            />
          </template>
        </FeedbackState>
        <pre v-else class="extension-key"><code>{{ signaturePublicKey || '—' }}</code></pre>
      </RepoSettingsSection>

      <RepoSettingsSection
        :title="$t('config_extension_endpoint')"
        :description="$t('repo.settings_surface.extensions.config_description')"
      >
        <InputField :label="$t('config_extension_endpoint')" docs-url="docs/usage/extensions/configuration-extension">
          <TextField
            v-model="extensions.config_extension_endpoint"
            :placeholder="$t('extension_endpoint_placeholder')"
          />
        </InputField>

        <Checkbox
          v-model="extensions.config_extension_exclusive"
          :label="$t('config_extension_exclusive')"
          :description="$t('config_extension_exclusive_desc')"
        />

        <Checkbox
          v-model="extensions.config_extension_netrc"
          :label="$t('extension_netrc')"
          :description="$t('extension_netrc_desc')"
        />
      </RepoSettingsSection>

      <div class="extension-grid">
        <RepoSettingsSection
          :title="$t('registry_extension_endpoint')"
          :description="$t('repo.settings_surface.extensions.registry_description')"
        >
          <InputField :label="$t('registry_extension_endpoint')" docs-url="docs/usage/extensions/registry-extension">
            <TextField
              v-model="extensions.registry_extension_endpoint"
              :placeholder="$t('extension_endpoint_placeholder')"
            />
          </InputField>

          <Checkbox
            v-model="extensions.registry_extension_netrc"
            :label="$t('extension_netrc')"
            :description="$t('extension_netrc_desc')"
          />
        </RepoSettingsSection>

        <RepoSettingsSection
          :title="$t('secret_extension_endpoint')"
          :description="$t('repo.settings_surface.extensions.secret_description')"
        >
          <InputField :label="$t('secret_extension_endpoint')" docs-url="docs/usage/extensions/secret-extension">
            <TextField
              v-model="extensions.secret_extension_endpoint"
              :placeholder="$t('extension_endpoint_placeholder')"
            />
          </InputField>

          <Checkbox
            v-model="extensions.secret_extension_netrc"
            :label="$t('extension_netrc')"
            :description="$t('extension_netrc_desc')"
          />
        </RepoSettingsSection>
      </div>

      <Button color="green" type="submit" start-icon="check" :is-loading="isSaving" :text="$t('save')" />
    </form>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Checkbox from '~/components/form/Checkbox.vue';
import InputField from '~/components/form/InputField.vue';
import TextField from '~/components/form/TextField.vue';
import RepoSettingsSection from '~/components/settings/SettingsSection.vue';
import useApiClient from '~/compositions/useApiClient';
import { useAsyncAction } from '~/compositions/useAsyncAction';
import { requiredInject } from '~/compositions/useInjectProvide';
import useNotifications from '~/compositions/useNotifications';
import type { ExtensionSettings } from '~/lib/api/types';

const i18n = useI18n();
const apiClient = useApiClient();
const notifications = useNotifications();
const repo = requiredInject('repo');

const signaturePublicKey = ref('');
const loadingSignature = ref(true);
const signatureError = ref('');
const extensionsOwnerId = ref<number>();
let repoLifecycleGeneration = 0;

async function loadSignaturePublicKey() {
  loadingSignature.value = true;
  signatureError.value = '';

  try {
    signaturePublicKey.value = await apiClient.getSignaturePublicKey();
  } catch (error) {
    signatureError.value =
      error instanceof Error ? error.message : i18n.t('repo.settings_surface.extensions.signature_error_fallback');
  } finally {
    loadingSignature.value = false;
  }
}

onMounted(loadSignaturePublicKey);

const extensions = ref<ExtensionSettings>({
  config_extension_endpoint: '',
  config_extension_exclusive: false,
  config_extension_netrc: false,
  registry_extension_endpoint: '',
  registry_extension_netrc: false,
  secret_extension_endpoint: '',
  secret_extension_netrc: false,
});

function loadExtensions() {
  extensionsOwnerId.value = repo.value.id;
  extensions.value = {
    config_extension_endpoint: repo.value.config_extension_endpoint,
    config_extension_exclusive: repo.value.config_extension_exclusive,
    config_extension_netrc: repo.value.config_extension_netrc,
    registry_extension_endpoint: repo.value.registry_extension_endpoint,
    registry_extension_netrc: repo.value.registry_extension_netrc,
    secret_extension_endpoint: repo.value.secret_extension_endpoint,
    secret_extension_netrc: repo.value.secret_extension_netrc,
  };
}

watch(
  () => repo.value.id,
  () => {
    repoLifecycleGeneration += 1;
    loadExtensions();
  },
  { immediate: true },
);

const { doSubmit: saveExtensions, isLoading: isSaving } = useAsyncAction(async () => {
  if (extensionsOwnerId.value !== repo.value.id) {
    throw new Error('Unexpected: Extension settings belong to another repository');
  }

  const repoId = repo.value.id;
  const requestGeneration = repoLifecycleGeneration;
  await apiClient.updateRepo(repoId, { ...extensions.value });
  if (repo.value.id === repoId && requestGeneration === repoLifecycleGeneration) {
    notifications.notify({ title: i18n.t('extensions_configuration_saved'), type: 'success' });
  }
});
</script>

<style scoped>
@reference '~/tailwind.css';

.repo-settings-page {
  @apply min-w-0 space-y-4;
}

.repo-settings-page-header {
  @apply px-1 py-1;
}

.repo-settings-page-header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.repo-settings-page-header p {
  @apply text-wp-text-alt-100 mt-1 text-xs leading-5;
}

.extension-grid {
  @apply grid min-w-0 gap-4 xl:grid-cols-2;
}

.extension-key {
  @apply border-wp-border-100 bg-wp-background-100 text-wp-text-100 max-w-full overflow-x-auto rounded-lg border p-3 text-xs leading-5 whitespace-pre-wrap;
}
</style>
