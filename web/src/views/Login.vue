<template>
  <main class="login-page">
    <section class="login-visual">
      <div class="login-brand">
        <WoodpeckerLogo class="h-11 w-11" />
        <div>
          <strong>{{ $t('login_surface.product_name') }}</strong>
          <span>{{ $t('login_surface.tagline') }}</span>
        </div>
      </div>
      <div class="login-hero">
        <span>{{ $t('login_surface.eyebrow') }}</span>
        <h1>{{ $t('login_surface.title') }}</h1>
        <p>{{ $t('login_surface.description') }}</p>
      </div>
    </section>

    <section class="login-form-side">
      <div class="login-card">
        <h2>{{ $t('login_surface.welcome') }}</h2>
        <p>{{ $t('login_to_woodpecker_with') }}</p>

        <ErrorMessage v-if="errorMessage" class="mt-4 w-full">
          <span>{{ errorMessage }}</span>
          <span v-if="errorDescription" class="mt-1">{{ errorDescription }}</span>
          <a v-if="errorUri" :href="errorUri" target="_blank" rel="noopener noreferrer" class="text-wp-link-100 mt-1">
            {{ errorUri }}
          </a>
        </ErrorMessage>

        <FeedbackState
          v-if="loading && displayedForges.length === 0"
          compact
          kind="loading"
          :title="$t('login_surface.loading_title')"
          :description="$t('login_surface.loading_description')"
        />
        <FeedbackState
          v-else-if="loadError"
          compact
          kind="error"
          :title="$t('login_surface.error_title')"
          :description="loadError"
        >
          <template #action>
            <Button start-icon="refresh" :text="$t('login_surface.retry')" @click="loadForges" />
          </template>
        </FeedbackState>
        <FeedbackState
          v-else-if="displayedForges.length === 0"
          compact
          kind="empty"
          :title="$t('login_surface.empty_title')"
          :description="$t('login_surface.empty_description')"
        />
        <div v-else class="login-providers">
          <Button
            v-for="forge in displayedForges"
            :key="forge.id"
            class="w-full justify-start!"
            @click="authenticate(forge.id)"
          >
            <span class="login-provider-icon">
              <img
                v-if="forge.favicon && !failedForgeFavicons.has(forge.id)"
                :src="forge.favicon"
                :alt="forge.name"
                @error="failedForgeFavicons.add(forge.id)"
              />
              <Icon v-else :name="forge.type === 'addon' ? 'repo' : forge.type" />
            </span>
            <span class="min-w-0 flex-1 truncate text-left">{{ forge.name }}</span>
            <Icon name="chevron-right" />
          </Button>
        </div>
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import WoodpeckerLogo from '~/assets/logo.svg?component';
import Button from '~/components/atomic/Button.vue';
import ErrorMessage from '~/components/atomic/Error.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import Icon from '~/components/atomic/Icon.vue';
import useApiClient from '~/compositions/useApiClient';
import useAuthentication from '~/compositions/useAuthentication';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Forge } from '~/lib/api/types';

const route = useRoute();
const { authenticate } = useAuthentication();
const i18n = useI18n();
const apiClient = useApiClient();
const forges = ref<Forge[]>([]);
const confirmedForges = ref<Forge[] | null>(null);
const loading = ref(false);
const loadError = ref('');
const failedForgeFavicons = ref(new Set<number>());
let alive = true;
let requestGeneration = 0;

const authErrorMessages = {
  oauth_error: i18n.t('oauth_error'),
  internal_error: i18n.t('internal_error'),
  registration_closed: i18n.t('registration_closed'),
  access_denied: i18n.t('access_denied'),
  invalid_state: i18n.t('invalid_state'),
  org_access_denied: i18n.t('org_access_denied'),
};

const errorMessage = computed(() => {
  const raw = Array.isArray(route.query.error) ? route.query.error[0] : route.query.error;
  if (!raw) return '';
  return authErrorMessages[raw as keyof typeof authErrorMessages] ?? raw;
});
const errorDescription = computed(() => {
  const value = route.query.error_description;
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
});
const errorUri = computed(() => {
  const value = route.query.error_uri;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
});

function presentForge(forge: Forge) {
  const fallbackName = forge.type.charAt(0).toUpperCase() + forge.type.slice(1);
  const rawUrl = forge.oauth_host || forge.url;
  if (!rawUrl) return { ...forge, name: fallbackName, favicon: null };
  try {
    const url = new URL(rawUrl);
    return { ...forge, name: url.hostname || fallbackName, favicon: `${url.origin}/favicon.ico` };
  } catch {
    return { ...forge, name: fallbackName, favicon: null };
  }
}

const displayedForges = computed(() => (confirmedForges.value ?? forges.value).map(presentForge));

async function loadForges() {
  const generation = ++requestGeneration;
  loadError.value = '';
  loading.value = true;
  try {
    const rows = (await apiClient.getForges()) ?? [];
    if (alive && generation === requestGeneration) {
      forges.value = rows;
      confirmedForges.value = [...rows];
    }
  } catch (error) {
    if (alive && generation === requestGeneration) {
      loadError.value = error instanceof Error ? error.message : i18n.t('login_surface.error_fallback');
    }
  } finally {
    if (alive && generation === requestGeneration) loading.value = false;
  }
}

onMounted(loadForges);
onBeforeUnmount(() => {
  alive = false;
  requestGeneration += 1;
});
useWPTitle(computed(() => [i18n.t('login')]));
</script>

<style scoped>
@reference '~/tailwind.css';

.login-page {
  @apply grid min-h-full w-full grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(380px,0.8fr)];
}

.login-visual {
  @apply relative hidden min-h-screen overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between;
  background:
    radial-gradient(circle at 18% 18%, rgba(49, 210, 121, 0.34), transparent 30%),
    radial-gradient(circle at 80% 72%, rgba(24, 116, 255, 0.24), transparent 28%),
    linear-gradient(145deg, #07170f 0%, #0e2d20 52%, #07110d 100%);
}

.login-visual::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.16;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.16) 1px, transparent 1px);
  background-size: 42px 42px;
  mask-image: linear-gradient(to bottom, black, transparent);
}

.login-brand,
.login-hero {
  @apply relative z-10;
}
.login-brand {
  @apply flex items-center gap-3 text-white;
}
.login-brand div {
  @apply flex flex-col;
}
.login-brand strong {
  @apply text-lg font-bold;
}
.login-brand span {
  @apply text-xs text-white/55;
}
.login-hero {
  @apply max-w-2xl pb-16 text-white;
}
.login-hero > span {
  @apply text-wp-primary-100 text-xs font-bold tracking-[0.18em] uppercase;
}
.login-hero h1 {
  @apply mt-4 text-5xl leading-[1.08] font-black tracking-tight;
}
.login-hero p {
  @apply mt-5 max-w-xl text-base leading-7 text-white/65;
}
.login-form-side {
  @apply bg-wp-background-200 flex min-h-screen items-center justify-center p-5 sm:p-10;
}
.login-card {
  @apply border-wp-border-100 bg-wp-background-300 w-full max-w-md rounded-2xl border p-6 shadow-xl sm:p-8;
}
.login-card > h2 {
  @apply text-wp-text-200 text-2xl font-bold;
}
.login-card > p {
  @apply text-wp-text-alt-100 mt-2 mb-5 text-sm;
}
.login-providers {
  @apply flex flex-col gap-2.5;
}
.login-provider-icon {
  @apply flex h-6 w-6 shrink-0 items-center justify-center;
}
.login-provider-icon img {
  @apply max-h-5 max-w-5;
}
</style>
