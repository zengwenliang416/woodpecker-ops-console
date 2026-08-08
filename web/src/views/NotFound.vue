<template>
  <div class="flex h-full w-full flex-col items-center justify-center gap-3 p-6">
    <div class="wp-card flex flex-col items-center gap-3 px-10 py-12 text-center">
      <div class="text-7xl font-black tracking-tighter text-wp-primary-100">404</div>
      <p class="text-wp-text-100 text-lg">{{ $t('not_found.not_found') }}</p>
      <router-link class="text-wp-link-100 hover:text-wp-link-200 mt-2 text-sm font-medium" replace :to="{ name: 'home' }">
        {{ $t('not_found.back_home') }}
      </router-link>
    </div>
  </div>
</template>
