<template>
  <Scaffold full-width-header fluid-content>
    <template #title>{{ $t('ops.applications.title') }}</template>
    <template #headerActions>
      <Button
        start-icon="refresh"
        :is-loading="refreshing"
        :text="$t('ops.applications.refresh')"
        :title="$t('ops.applications.refresh')"
        @click="loadApplications(true)"
      />
      <Button color="green" start-icon="plus" :text="$t('ops.applications.new')" @click="openForm" />
    </template>

    <div class="ops-page-content">
      <div class="mb-4">
        <DeploymentNav
          :application-count="applications.length"
          :environment-count="environments.length"
          :release-count="releases.length"
        />
      </div>

      <FeedbackState
        v-if="initialLoading"
        kind="loading"
        :title="$t('ops.applications.loading_title')"
        :description="$t('ops.applications.loading_description')"
      />
      <FeedbackState
        v-else-if="loadError && !hasConfirmedData"
        kind="error"
        :title="$t('ops.applications.error_title')"
        :description="$t('ops.applications.error_description')"
      >
        <template #action>
          <Button start-icon="refresh" :text="$t('ops.applications.retry')" @click="loadApplications()" />
        </template>
      </FeedbackState>
      <template v-else>
        <FeedbackState
          v-if="loadError"
          compact
          kind="error"
          :title="$t('ops.applications.refresh_error_title')"
          :description="$t('ops.applications.refresh_error_description')"
        />
        <FeedbackState
          v-if="applications.length === 0"
          kind="empty"
          :title="$t('ops.applications.none')"
          :description="$t('ops.applications.none_hint')"
        />
        <section v-else class="wp-card">
          <div class="wp-filters">
            <input v-model="search" class="input" :placeholder="$t('ops.applications.search_placeholder')" />
          </div>
          <FeedbackState
            v-if="filteredApplications.length === 0"
            compact
            kind="empty"
            :title="$t('ops.applications.filtered_none')"
            :description="$t('ops.applications.search_placeholder')"
          />
          <div v-else class="application-grid p-4">
            <article v-for="application in filteredApplications" :key="application.id" class="application-card">
              <div class="application-card-head">
                <span class="empty-icon"><PrototypeIcon name="app" /></span>
                <div class="min-w-0 flex-1">
                  <router-link class="table-link" :to="`/deployments/apps/${application.id}`">
                    {{ application.name }}
                  </router-link>
                  <p>{{ application.description || $t('ops.applications.no_description') }}</p>
                </div>
                <IconButton icon="chevron-right" :to="`/deployments/apps/${application.id}`" />
              </div>
              <div class="application-card-meta">
                <span><PrototypeIcon name="docker" />{{ application.runtime }}</span>
                <span><PrototypeIcon name="package" />{{ releaseLabel(application.id) }}</span>
                <span><PrototypeIcon name="user" />{{ ownerLabel(application.owner_team) }}</span>
              </div>
              <div class="application-card-details">
                <div class="wp-muted">{{ $t('ops.applications.image') }}</div>
                <div class="wp-mono break-all">{{ application.image }}</div>
                <div class="wp-muted">{{ $t('ops.applications.service') }}</div>
                <div>{{ application.service }}</div>
              </div>
              <div class="application-card-foot">
                <router-link class="btn btn-ghost btn-sm" :to="`/deployments/apps/${application.id}`">
                  {{ $t('ops.applications.details') }}
                </router-link>
                <Button
                  size="sm"
                  color="green"
                  start-icon="rocket"
                  :text="$t('ops.applications.deploy')"
                  :to="{ path: '/deployments/new', query: { applicationId: application.id } }"
                />
              </div>
            </article>
          </div>
        </section>
      </template>

      <div
        v-if="showForm"
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeForm"
      >
        <form class="wp-card wp-stack w-full max-w-md p-5" @submit.prevent="createApp">
          <h2 class="text-lg font-bold">{{ $t('ops.applications.new') }}</h2>
          <FeedbackState
            v-if="createError"
            compact
            kind="error"
            :title="$t('ops.applications.create_error_title')"
            :description="$t('ops.applications.create_error_description')"
          />
          <label class="field">
            <span class="field-label">{{ $t('ops.applications.name') }}</span>
            <input v-model="form.name" class="input" required />
          </label>
          <label class="field">
            <span class="field-label">{{ $t('ops.applications.image') }}</span>
            <input v-model="form.image" class="input wp-mono" required />
          </label>
          <label class="field">
            <span class="field-label">{{ $t('ops.applications.runtime') }}</span>
            <select v-model="form.runtime" class="select">
              <option v-for="runtime in runtimeOptions" :key="runtime" :value="runtime">{{ runtime }}</option>
            </select>
          </label>
          <label class="field">
            <span class="field-label">{{ $t('ops.applications.service') }}</span>
            <input v-model="form.service" class="input" required />
          </label>
          <div class="wp-cluster">
            <Button
              color="green"
              :disabled="creating"
              :is-loading="creating"
              :text="$t('ops.applications.save')"
              @click="createApp"
            />
            <Button variant="ghost" :disabled="creating" :text="$t('cancel')" @click="closeForm" />
          </div>
        </form>
      </div>
    </div>
  </Scaffold>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Button from '~/components/atomic/Button.vue';
import FeedbackState from '~/components/atomic/FeedbackState.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import Scaffold from '~/components/layout/scaffold/Scaffold.vue';
import DeploymentNav from '~/components/ops/DeploymentNav.vue';
import PrototypeIcon from '~/components/ops/PrototypeIcon.vue';
import { useConfirmedRequest } from '~/compositions/useConfirmedRequest';
import useApiClient from '~/compositions/useApiClient';
import { useWPTitle } from '~/compositions/useWPTitle';
import type { Application, AppRelease, Environment } from '~/lib/api/types';
import { useApplicationStore } from '~/store/ops';

const api = useApiClient();
const appStore = useApplicationStore();
const { t } = useI18n();
useWPTitle(computed(() => [t('ops.applications.title')]));

const applications = ref<Application[]>([]);
const environments = ref<Environment[]>([]);
const releases = ref<AppRelease[]>([]);
const search = ref('');
const showForm = ref(false);
const creating = ref(false);
const createError = ref(false);
const { begin, hasConfirmedData, initialLoading, loadError, refreshing } = useConfirmedRequest();
const form = reactive({ name: '', image: '', runtime: 'docker-compose', service: 'app' });
const runtimeOptions = ['docker-compose', 'kubernetes', 'systemd'];
let alive = true;
let lifecycleGeneration = 0;

const filteredApplications = computed(() => {
  const query = search.value.trim().toLowerCase();
  return applications.value.filter(
    (application) =>
      !query ||
      `${application.name} ${application.description ?? ''} ${application.owner_team ?? ''} ${application.image} ${application.runtime}`
        .toLowerCase()
        .includes(query),
  );
});

function releaseCount(applicationId: number) {
  return releases.value.filter((release) => release.application_id === applicationId).length;
}

function releaseLabel(applicationId: number) {
  return `${releaseCount(applicationId)} ${t('ops.applications.releases')}`;
}

function ownerLabel(ownerTeam?: string) {
  return ownerTeam || t('ops.applications.unassigned');
}

function resetForm() {
  Object.assign(form, { name: '', image: '', runtime: 'docker-compose', service: 'app' });
  createError.value = false;
}

function openForm() {
  resetForm();
  showForm.value = true;
}

function closeForm() {
  if (!creating.value) showForm.value = false;
}

async function loadApplications(refresh = false) {
  const request = begin(refresh);

  const [applicationResult, environmentResult, releaseResult] = await Promise.allSettled([
    appStore.loadApplications(),
    appStore.loadEnvironments(),
    appStore.loadReleases(),
  ]);
  if (!request.isCurrent()) return;

  if (applicationResult.status === 'fulfilled') {
    applications.value = [...appStore.applicationList];
    request.confirm();
  }
  if (environmentResult.status === 'fulfilled') environments.value = [...appStore.environmentList];
  if (releaseResult.status === 'fulfilled') releases.value = [...appStore.releaseList];
  request.finish(
    applicationResult.status === 'rejected' ||
      environmentResult.status === 'rejected' ||
      releaseResult.status === 'rejected',
  );
}

async function createApp() {
  if (creating.value) return;
  creating.value = true;
  createError.value = false;
  const lifecycle = lifecycleGeneration;

  try {
    const created = await api.createApplication({ ...form });
    if (!alive || lifecycle !== lifecycleGeneration) return;
    if (!created) {
      createError.value = true;
      return;
    }
    appStore.setApplication(created);
    applications.value = [...appStore.applicationList];
    if (!alive || lifecycle !== lifecycleGeneration) return;
    showForm.value = false;
    resetForm();
  } catch {
    if (alive && lifecycle === lifecycleGeneration) createError.value = true;
  } finally {
    if (alive && lifecycle === lifecycleGeneration) creating.value = false;
  }
}

onMounted(() => loadApplications());
onBeforeUnmount(() => {
  alive = false;
  lifecycleGeneration += 1;
});
</script>

<style scoped>
@reference '~/tailwind.css';

.ops-page-content {
  @apply mx-auto w-full max-w-[1540px] px-4 pt-6 pb-12 sm:px-6 lg:px-7;
}

.application-grid {
  @apply grid grid-cols-1 gap-3 p-4 xl:grid-cols-2;
}

.application-card {
  @apply border-wp-border-100 bg-wp-background-300 flex min-w-0 flex-col rounded-xl border p-4 shadow-sm;
}

.application-card-head {
  @apply grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3;
}

.application-card-head .table-link {
  @apply text-wp-text-200 text-sm font-bold;
}

.application-card-head p {
  @apply text-wp-text-alt-100 mt-1 text-xs;
}

.application-card-meta {
  @apply text-wp-text-alt-100 my-3 flex flex-wrap gap-x-4 gap-y-2 text-xs;
}

.application-card-meta span {
  @apply inline-flex items-center gap-1.5;
}

.application-card-meta :deep(svg) {
  @apply h-3.5 w-3.5;
}

.application-card-details {
  @apply border-wp-border-100 mt-1 grid min-w-0 gap-x-4 gap-y-2 border-t pt-3 text-xs;
  grid-template-columns: max-content minmax(0, 1fr);
}

.application-card-foot {
  @apply border-wp-border-100 mt-3 flex items-center justify-between gap-3 border-t pt-3;
}

@media (max-width: 639px) {
  .application-card-foot {
    @apply items-stretch;
    flex-direction: column;
  }
}
</style>
