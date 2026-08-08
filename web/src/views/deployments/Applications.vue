<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
  <Scaffold>
    <template #title>{{ $t('ops.applications.title') }}</template>
    <template #headerActions>
      <Button color="green" start-icon="plus" :text="$t('ops.applications.new')" @click="showForm = true" />
    </template>
    <section class="wp-card">
      <div class="wp-table-scroll">
        <table>
          <thead><tr><th>{{ $t('ops.applications.name') }}</th><th>Image</th><th>{{ $t('ops.applications.runtime') }}</th><th>{{ $t('ops.applications.releases') }}</th><th /></tr></thead>
          <tbody>
            <tr v-for="app in appStore.applicationList" :key="app.id">
              <td><router-link class="text-wp-link-100" :to="`/deployments/apps/${app.id}`">{{ app.name }}</router-link></td>
              <td class="wp-mono">{{ app.image }}</td>
              <td>{{ app.runtime }}</td>
              <td>{{ appStore.releasesOf(app.id).value.length }}</td>
              <td><IconButton icon="chevron-right" :to="`/deployments/apps/${app.id}`" /></td>
            </tr>
            <tr v-if="appStore.applicationList.length === 0"><td colspan="5" class="wp-empty-state"><strong>{{ $t('ops.applications.none') }}</strong></td></tr>
          </tbody>
        </table>
      </div>
    </section>
    <div v-if="showForm" class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" @click.self="showForm = false">
      <form class="wp-card w-full max-w-md p-5 wp-stack" @submit.prevent="createApp">
        <h2 class="text-lg font-bold">{{ $t('ops.applications.new') }}</h2>
        <label class="field"><span class="field-label">Name</span><input v-model="form.name" class="input" required /></label>
        <label class="field"><span class="field-label">Image</span><input v-model="form.image" class="input wp-mono" required /></label>
        <label class="field"><span class="field-label">Runtime</span>
          <select v-model="form.runtime" class="select"><option>docker-compose</option><option>kubernetes</option><option>systemd</option></select>
        </label>
        <label class="field"><span class="field-label">{{ $t('ops.applications.service') }}</span><input v-model="form.service" class="input" required /></label>
        <div class="wp-cluster"><Button type="submit" color="green" :text="$t('ops.applications.save')" /><Button type="button" variant="ghost" :text="$t('cancel')" @click="showForm = false" /></div>
      </form>
    </div>
  </Scaffold>
  <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import Button from '~/components/atomic/Button.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import { useApplicationStore } from '~/store/ops';

const api = useApiClient();
const appStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.applications.title')]));

const showForm = ref(false);
const form = reactive({ name: '', image: '', runtime: 'docker-compose', service: 'app' });

async function createApp() {
  await api.createApplication(form);
  showForm.value = false;
  await appStore.loadApplications();
}

onMounted(async () => {
  await Promise.all([appStore.loadApplications(), appStore.loadReleases()]);
});
</script>
