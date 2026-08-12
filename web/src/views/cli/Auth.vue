<template>
  <main class="cli-auth-page">
    <section class="cli-auth-card">
      <div class="cli-auth-brand">
        <WoodpeckerLogo class="h-11 w-11" />
        <div>
          <strong>{{ $t('cli_auth.product_name') }}</strong>
          <span>{{ $t('cli_auth.subtitle') }}</span>
        </div>
      </div>

      <FeedbackState
        v-if="state === 'invalid'"
        kind="error"
        :title="$t('cli_auth.invalid_title')"
        :description="$t('cli_auth.invalid_description')"
      >
        <template #action><Button :text="$t('cli_auth.back')" :to="{ name: 'user-cli-and-api' }" /></template>
      </FeedbackState>

      <template v-else-if="state === 'confirm' || state === 'sending'">
        <h1>{{ $t('login_to_cli') }}</h1>
        <p>{{ $t('login_to_cli_description') }}</p>
        <div class="cli-auth-actions">
          <Button
            color="green"
            :text="$t('login_to_cli')"
            :is-loading="state === 'sending'"
            @click="sendToken(false)"
          />
          <Button color="red" :text="$t('abort')" :disabled="state === 'sending'" @click="sendToken(true)" />
        </div>
      </template>

      <FeedbackState
        v-else-if="state === 'success'"
        kind="empty"
        :title="$t('cli_login_success')"
        :description="$t('return_to_cli')"
      />
      <FeedbackState
        v-else-if="state === 'denied'"
        kind="disabled"
        :title="$t('cli_login_denied')"
        :description="$t('return_to_cli')"
      />
      <FeedbackState v-else kind="error" :title="$t('cli_login_failed')" :description="failureMessage">
        <template #action>
          <Button start-icon="refresh" :text="$t('cli_auth.retry')" @click="state = 'confirm'" />
          <Button :text="$t('cli_auth.back')" :to="{ name: 'user-cli-and-api' }" />
        </template>
      </FeedbackState>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import WoodpeckerLogo from '~/assets/logo.svg?component';
import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import useApiClient from '~/compositions/useApiClient';

type AuthState = 'invalid' | 'confirm' | 'sending' | 'success' | 'failed' | 'denied';

const apiClient = useApiClient();
const route = useRoute();
const { t } = useI18n();
const rawPort = computed(() => {
  const value = route.query.port;
  return Array.isArray(value) ? value[0] : value;
});
const port = computed(() => {
  if (typeof rawPort.value !== 'string' || !/^[1-9]\d{0,4}$/.test(rawPort.value)) return null;
  const value = Number(rawPort.value);
  return value >= 1 && value <= 65535 ? value : null;
});
const state = ref<AuthState>(port.value ? 'confirm' : 'invalid');
const failureMessage = ref('');
let alive = true;
let requestGeneration = 0;

async function sendToken(abort: boolean) {
  if (state.value === 'sending' || port.value == null) return;
  const callbackPort = port.value;
  const generation = ++requestGeneration;
  state.value = 'sending';
  failureMessage.value = '';
  try {
    const token = abort ? '' : await apiClient.getToken();
    if (!alive || generation !== requestGeneration) return;
    const response = await fetch(`http://localhost:${callbackPort}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) throw new Error(t('cli_auth.callback_rejected'));
    const data = (await response.json()) as { ok?: string };
    if (data.ok !== 'true') throw new Error(t('cli_auth.callback_rejected'));
    if (!alive || generation !== requestGeneration) return;
    state.value = abort ? 'denied' : 'success';
    if (abort) window.close();
  } catch (error) {
    if (alive && generation === requestGeneration) {
      failureMessage.value = error instanceof Error ? error.message : t('cli_auth.error_fallback');
      state.value = 'failed';
    }
  }
}

watch(
  port,
  (nextPort, previousPort) => {
    if (nextPort === previousPort) return;
    requestGeneration += 1;
    failureMessage.value = '';
    state.value = nextPort == null ? 'invalid' : 'confirm';
  },
  { flush: 'sync' },
);

onBeforeUnmount(() => {
  alive = false;
  requestGeneration += 1;
});
</script>

<style scoped>
@reference '~/tailwind.css';

.cli-auth-page {
  @apply flex min-h-[70vh] w-full items-center justify-center p-5;
  background: radial-gradient(
    circle at 50% 20%,
    color-mix(in srgb, var(--wp-primary-100) 16%, transparent),
    transparent 38%
  );
}

.cli-auth-card {
  @apply border-wp-border-100 bg-wp-background-300 w-full max-w-xl rounded-2xl border p-6 shadow-xl sm:p-9;
}

.cli-auth-brand {
  @apply mb-7 flex items-center gap-3;
}
.cli-auth-brand div {
  @apply flex flex-col;
}
.cli-auth-brand strong {
  @apply text-wp-text-200 text-lg font-bold;
}
.cli-auth-brand span {
  @apply text-wp-text-alt-100 text-xs;
}
.cli-auth-card > h1 {
  @apply text-wp-text-200 text-2xl font-bold;
}
.cli-auth-card > p {
  @apply text-wp-text-alt-100 mt-2 text-sm leading-6;
}
.cli-auth-actions {
  @apply mt-6 flex flex-wrap gap-2;
}
</style>
