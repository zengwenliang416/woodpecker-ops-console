<template>
  <main class="not-found-page">
    <section class="not-found-card">
      <span aria-hidden="true">{{ $t('not_found.code') }}</span>
      <h1>{{ $t('not_found.title') }}</h1>
      <p>{{ $t('not_found.description') }}</p>
      <div>
        <Button color="green" start-icon="overview" :text="$t('not_found.back_overview')" :to="{ name: 'overview' }" />
        <Button start-icon="repo" :text="$t('not_found.view_repositories')" :to="{ name: 'repos' }" />
      </div>
    </section>
  </main>
</template>

<script lang="ts" setup>
import Button from '~/components/atomic/Button.vue';
</script>

<style scoped>
@reference '~/tailwind.css';

.not-found-page {
  @apply flex h-full min-h-[60vh] w-full items-center justify-center p-5;
  background:
    radial-gradient(circle at 50% 20%, color-mix(in srgb, var(--wp-primary-100) 14%, transparent), transparent 35%),
    linear-gradient(180deg, transparent, color-mix(in srgb, var(--wp-background-200) 75%, transparent));
}

.not-found-card {
  @apply border-wp-border-100 bg-wp-background-300 flex w-full max-w-xl flex-col items-center rounded-2xl border px-6 py-12 text-center shadow-lg sm:px-12;
}

.not-found-card > span {
  @apply text-wp-primary-100 text-7xl font-black tracking-tighter;
}

.not-found-card h1 {
  @apply text-wp-text-200 mt-4 text-2xl font-bold;
}

.not-found-card p {
  @apply text-wp-text-alt-100 mt-2 max-w-md text-sm leading-6;
}

.not-found-card > div {
  @apply mt-6 flex flex-wrap justify-center gap-2;
}
</style>
