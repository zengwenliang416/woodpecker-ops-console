<template>
  <Scaffold full-width-header fluid-content>
    <template #title>{{ $t('user.settings.settings') }}</template>
    <template #headerActions><Button :text="$t('logout')" :to="`${address}/logout`" /></template>

    <div class="user-settings-layout">
      <UserSettingsNav :show-agents="userRegisteredAgents" />
      <main class="user-settings-content">
        <router-view />
      </main>
    </div>
  </Scaffold>
</template>

<script lang="ts" setup>
import Button from '~/components/atomic/Button.vue';
import UserSettingsNav from '~/components/user/settings/UserSettingsNav.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useConfig from '~/compositions/useConfig';

const { userRegisteredAgents } = useConfig();

const address = `${window.location.protocol}//${window.location.host}${useConfig().rootPath}`; // port is included in location.host
</script>

<style scoped>
@reference '~/tailwind.css';

.user-settings-layout {
  @apply mx-auto flex w-full max-w-[1500px] min-w-0 flex-col gap-4 px-4 py-5 sm:px-6;
}

.user-settings-content {
  @apply min-w-0;
  contain: layout paint;
}
</style>
