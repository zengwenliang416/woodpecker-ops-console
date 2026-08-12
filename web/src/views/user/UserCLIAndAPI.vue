<template>
  <div class="user-cli-page">
    <header>
      <h1>{{ $t('user.settings.cli_and_api.cli_and_api') }}</h1>
      <p>{{ $t('user.settings.cli_and_api.desc') }}</p>
    </header>

    <SettingsSection
      :title="$t('user.settings.surface.cli_title')"
      :description="$t('user.settings.surface.cli_description')"
    >
      <template #actions>
        <Button :text="$t('user.settings.cli_and_api.download_cli')" start-icon="download" :to="cliDownload" />
      </template>
      <pre class="code-box">{{ usageWithCli }}</pre>
    </SettingsSection>

    <FeedbackState
      v-if="loadError"
      compact
      kind="error"
      :title="$t('user.settings.surface.token_error_title')"
      :description="loadError"
    >
      <template #action>
        <Button
          start-icon="refresh"
          :text="$t('user.settings.surface.retry')"
          :is-loading="loading"
          @click="loadToken"
        />
      </template>
    </FeedbackState>

    <SettingsSection
      :title="$t('user.settings.cli_and_api.token')"
      :description="$t('user.settings.surface.token_description')"
    >
      <template #actions>
        <Button
          color="red"
          :text="$t('user.settings.cli_and_api.reset_token')"
          :is-loading="resetting"
          :disabled="loading || !token"
          @click="resetToken"
        />
      </template>
      <FeedbackState
        v-if="loading && !token"
        compact
        kind="loading"
        :title="$t('user.settings.surface.token_loading_title')"
        :description="$t('user.settings.surface.token_loading_description')"
      />
      <pre v-else-if="token" class="code-box">{{ token }}</pre>
      <FeedbackState
        v-else
        compact
        kind="empty"
        :title="$t('user.settings.surface.token_empty_title')"
        :description="$t('user.settings.surface.token_empty_description')"
      />
      <p v-if="resetError" class="token-reset-error" role="alert">{{ resetError }}</p>
    </SettingsSection>

    <SettingsSection
      :title="$t('user.settings.cli_and_api.api_usage')"
      :description="$t('user.settings.surface.api_description')"
    >
      <template #actions>
        <Button
          v-if="enableSwagger"
          :text="$t('user.settings.cli_and_api.swagger_ui')"
          start-icon="external"
          :to="`${address}/swagger/index.html`"
        />
      </template>
      <pre class="code-box">{{ usageWithCurl }}</pre>
    </SettingsSection>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import SettingsSection from '~/components/settings/SettingsSection.vue';
import useApiClient from '~/compositions/useApiClient';
import useConfig from '~/compositions/useConfig';
import { useWPTitle } from '~/compositions/useWPTitle';

const { rootPath, enableSwagger } = useConfig();
const apiClient = useApiClient();
const { t } = useI18n();
const token = ref('');
const loading = ref(false);
const resetting = ref(false);
const loadError = ref('');
const resetError = ref('');
let alive = true;
let lifecycleGeneration = 0;
let resetGeneration = 0;

const address = `${window.location.protocol}//${window.location.host}${rootPath}`;
const usageWithCli = `# woodpecker setup --server ${address}`;
const cliDownload = 'https://github.com/woodpecker-ci/woodpecker/releases';

const usageWithCurl = computed(() => {
  const tokenLine = token.value
    ? `export WOODPECKER_TOKEN="${token.value}"`
    : '# Load your Personal Access Token before running this example.';
  return [
    `export WOODPECKER_SERVER="${address}"`,
    tokenLine,
    '',
    `curl -i -H "Authorization: Bearer \${WOODPECKER_TOKEN}" "\${WOODPECKER_SERVER}/api/user"`,
  ].join('\n');
});

async function loadToken() {
  const generation = ++lifecycleGeneration;
  loadError.value = '';
  loading.value = true;
  try {
    const nextToken = await apiClient.getToken();
    if (alive && generation === lifecycleGeneration) token.value = nextToken;
  } catch (error) {
    if (alive && generation === lifecycleGeneration) {
      loadError.value = error instanceof Error ? error.message : t('user.settings.surface.token_error_fallback');
    }
  } finally {
    if (alive && generation === lifecycleGeneration) loading.value = false;
  }
}

async function resetToken() {
  if (resetting.value || loading.value || !token.value) return;
  const lifecycle = ++lifecycleGeneration;
  const generation = ++resetGeneration;
  resetError.value = '';
  resetting.value = true;
  try {
    await apiClient.resetToken();
  } catch (error) {
    if (alive && lifecycle === lifecycleGeneration && generation === resetGeneration) {
      resetError.value = error instanceof Error ? error.message : t('user.settings.surface.token_reset_error_fallback');
    }
    return;
  } finally {
    if (alive && lifecycle === lifecycleGeneration && generation === resetGeneration) resetting.value = false;
  }
  if (alive && lifecycle === lifecycleGeneration && generation === resetGeneration) {
    window.location.href = `${address}/logout`;
  }
}

onMounted(loadToken);
onBeforeUnmount(() => {
  alive = false;
  lifecycleGeneration += 1;
  resetGeneration += 1;
});

useWPTitle(computed(() => [t('user.settings.cli_and_api.cli_and_api'), t('user.settings.settings')]));
</script>

<style scoped>
@reference '~/tailwind.css';

.user-cli-page {
  @apply flex min-w-0 flex-col gap-4;
}

.user-cli-page > header h1 {
  @apply text-wp-text-200 text-lg font-bold;
}

.user-cli-page > header p {
  @apply text-wp-text-alt-100 mt-1 max-w-2xl text-xs leading-5;
}

.code-box {
  @apply bg-wp-background-100 text-wp-text-100 max-w-full overflow-x-auto rounded-xl p-4 font-mono text-xs leading-6;
  white-space: pre;
}

.token-reset-error {
  @apply text-wp-error-100 mt-3 text-xs font-semibold;
}
</style>
