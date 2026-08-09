<template>
  <aside
    id="app-sidebar"
    class="sidebar"
    :class="{ 'sidebar-open': open }"
    :aria-label="$t('ops.sidebar.main')"
    tabindex="-1"
  >
    <div class="sidebar-brand">
      <router-link :to="{ name: 'home' }" class="flex min-w-0 items-center gap-2.5">
        <WoodpeckerLogo class="text-wp-primary-100 h-8 w-8 shrink-0" />
        <div class="brand-copy">
          <strong>{{ $t('ops.sidebar.brand_name') }}</strong>
          <small>{{ $t('ops.sidebar.brand_subtitle') }}</small>
        </div>
      </router-link>
      <IconButton
        class="md:hidden!"
        data-drawer-close
        icon="close"
        :title="$t('ops.sidebar.close')"
        @click="$emit('close')"
      />
    </div>

    <div class="sidebar-scroll">
      <div class="nav-section">
        <div class="nav-label">{{ $t('ops.sidebar.workspace') }}</div>
        <router-link to="/overview" class="nav-link" :class="{ active: isActive('/overview') }">
          <Icon name="overview" />
          <span>{{ $t('ops.sidebar.overview') }}</span>
        </router-link>
        <router-link to="/repos" class="nav-link" :class="{ active: isActive('/repos') }">
          <Icon name="repo" />
          <span>{{ $t('repos') }}</span>
          <span v-if="repoStore.ownedRepos.length" class="nav-count">{{ repoStore.ownedRepos.length }}</span>
        </router-link>
      </div>

      <div class="nav-section">
        <div class="nav-label">{{ $t('ops.sidebar.delivery') }}</div>
        <router-link to="/deployments" class="nav-link" :class="{ active: isActive('/deployments') }">
          <Icon name="rocket" />
          <span>{{ $t('ops.sidebar.deployments') }}</span>
        </router-link>
        <router-link to="/deployments/apps" class="nav-link" :class="{ active: isActive('/deployments/apps') }">
          <Icon name="app" />
          <span>{{ $t('ops.sidebar.applications') }}</span>
        </router-link>
        <router-link
          to="/deployments/environments"
          class="nav-link"
          :class="{ active: isActive('/deployments/environments') }"
        >
          <Icon name="environment" />
          <span>{{ $t('ops.sidebar.environments') }}</span>
        </router-link>
        <router-link to="/deployments/releases" class="nav-link" :class="{ active: isActive('/deployments/releases') }">
          <Icon name="package" />
          <span>{{ $t('ops.releases.title') }}</span>
        </router-link>
        <router-link
          to="/deployments/approvals"
          class="nav-link"
          :class="{ active: isActive('/deployments/approvals') }"
        >
          <Icon name="shield" />
          <span>{{ $t('ops.approvals.title') }}</span>
        </router-link>
      </div>

      <div class="nav-section">
        <div class="nav-label">{{ $t('ops.sidebar.server_ops') }}</div>
        <router-link to="/infrastructure" class="nav-link" :class="{ active: isActive('/infrastructure') }">
          <Icon name="infrastructure" />
          <span>{{ $t('ops.sidebar.infrastructure') }}</span>
        </router-link>
        <router-link
          to="/infrastructure/servers"
          class="nav-link"
          :class="{ active: isActive('/infrastructure/servers') }"
        >
          <Icon name="server" />
          <span>{{ $t('ops.sidebar.servers') }}</span>
        </router-link>
        <router-link
          to="/infrastructure/groups"
          class="nav-link"
          :class="{ active: isActive('/infrastructure/groups') }"
        >
          <Icon name="list-group" />
          <span>{{ $t('ops.groups.title') }}</span>
        </router-link>
        <router-link
          to="/infrastructure/services"
          class="nav-link"
          :class="{ active: isActive('/infrastructure/services') }"
        >
          <Icon name="docker" />
          <span>{{ $t('ops.services.title') }}</span>
        </router-link>
        <router-link
          to="/infrastructure/alerts"
          class="nav-link"
          :class="{ active: isActive('/infrastructure/alerts') }"
        >
          <Icon name="bell" />
          <span>{{ $t('ops.sidebar.alerts') }}</span>
        </router-link>
      </div>

      <div class="nav-section">
        <div class="nav-label">{{ $t('ops.sidebar.build_infra') }}</div>
        <router-link
          v-if="user?.admin"
          to="/admin/agents"
          class="nav-link"
          :class="{ active: isActive('/admin/agents') }"
        >
          <Icon name="agent" />
          <span>{{ $t('ops.sidebar.agents') }}</span>
        </router-link>
        <router-link
          v-if="user?.admin"
          to="/admin/queue"
          class="nav-link"
          :class="{ active: isActive('/admin/queue') }"
        >
          <Icon name="tray-full" />
          <span>{{ $t('ops.sidebar.queue') }}</span>
        </router-link>
        <router-link to="/user/secrets" class="nav-link" :class="{ active: isActive('/user/secrets') }">
          <Icon name="secret" />
          <span>{{ $t('ops.sidebar.secrets') }}</span>
        </router-link>
      </div>

      <div v-if="user?.admin" class="nav-section">
        <div class="nav-label">{{ $t('ops.sidebar.management') }}</div>
        <router-link to="/admin" class="nav-link" :class="{ active: isActive('/admin') }">
          <Icon name="settings" />
          <span>{{ $t('ops.sidebar.admin') }}</span>
        </router-link>
        <router-link to="/admin/users" class="nav-link" :class="{ active: isActive('/admin/users') }">
          <Icon name="org" />
          <span>{{ $t('ops.sidebar.users') }}</span>
        </router-link>
        <router-link to="/admin/forges" class="nav-link" :class="{ active: isActive('/admin/forges') }">
          <Icon name="forge" />
          <span>{{ $t('ops.sidebar.forges') }}</span>
        </router-link>
      </div>

      <div class="nav-section">
        <div class="nav-label">{{ $t('ops.sidebar.help') }}</div>
        <a href="https://woodpecker-ci.org/docs/" target="_blank" rel="noreferrer" class="nav-link">
          <Icon name="file" />
          <span>{{ $t('docs') }}</span>
          <Icon name="chevron-right" class="nav-count" />
        </a>
        <a v-if="enableSwagger" :href="apiUrl" target="_blank" rel="noreferrer" class="nav-link">
          <Icon name="console" />
          <span>{{ $t('api') }}</span>
          <Icon name="chevron-right" class="nav-count" />
        </a>
      </div>
    </div>

    <div class="sidebar-footer">
      <router-link :to="{ name: 'user' }" class="nav-link" :class="{ active: isUserActive }">
        <img v-if="user?.avatar_url" class="h-6 w-6 rounded-md" :src="user.avatar_url" />
        <Icon v-else name="user" />
        <span>{{ $t('ops.sidebar.personal') }}</span>
        <Icon name="chevron-right" class="nav-count" />
      </router-link>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import WoodpeckerLogo from '~/assets/logo.svg?component';
import Icon from '~/components/ops/PrototypeIcon.vue';
import IconButton from '~/components/atomic/IconButton.vue';
import useAuthentication from '~/compositions/useAuthentication';
import useConfig from '~/compositions/useConfig';
import { useRepoStore } from '~/store/repos';

defineProps<{
  open?: boolean;
}>();

defineEmits<{
  (event: 'close'): void;
}>();

const route = useRoute();
const repoStore = useRepoStore();
const authentication = useAuthentication();
const { user } = authentication;
const config = useConfig();

const { enableSwagger } = config;
const apiUrl = `${config.rootPath ?? ''}/swagger/index.html`;

function isActive(target: string): boolean {
  const path = route.path;
  if (target === '/admin') {
    return path.startsWith('/admin') && !path.startsWith('/admin/agents') && !path.startsWith('/admin/queue');
  }
  if (target === '/repos') {
    return path === '/repos' || path.startsWith('/repos/');
  }
  if (target === '/deployments' || target === '/infrastructure' || target === '/overview') {
    return path === target;
  }
  if (target.startsWith('/deployments/') || target.startsWith('/infrastructure/')) {
    return path === target || path.startsWith(`${target}/`);
  }
  return path === target;
}

const isUserActive = computed(() => route.path.startsWith('/user'));
</script>

<style scoped>
@reference '~/tailwind.css';

.sidebar {
  @apply border-wp-border-100 dark:border-wp-background-100 bg-wp-background-400 dark:bg-wp-background-400 fixed inset-y-0 left-0 z-30 flex shrink-0 flex-col border-r transition-transform duration-200;
  width: var(--wp-sidebar-w);
  visibility: hidden;
  transform: translateX(-100%);
  box-shadow: var(--wp-shadow);
}

.sidebar-open {
  visibility: visible;
  transform: translateX(0);
}

.sidebar-brand {
  @apply border-wp-border-100 dark:border-wp-background-100 flex items-center gap-[11px] border-b px-[18px];
  height: var(--wp-topbar-h);
}

.brand-copy {
  @apply flex min-w-0 flex-col leading-tight;
}

.brand-copy strong {
  @apply text-wp-text-200 text-[17px] font-bold tracking-[-0.02em] whitespace-nowrap;
}

.brand-copy small {
  @apply text-wp-text-alt-100 mt-[-2px] text-[10px] tracking-[0.04em] whitespace-nowrap uppercase;
}

.sidebar-scroll {
  @apply flex-1 overflow-y-auto px-2.5 pt-1.5 pb-[18px];
}

.nav-section {
  @apply mb-4;
}

.nav-label {
  @apply text-wp-text-alt-100 mb-1 px-2 text-[10px] font-bold tracking-wider uppercase;
}

.nav-link {
  @apply text-wp-text-100 hover:bg-wp-control-neutral-200 dark:hover:bg-wp-control-neutral-100 relative mb-0.5 flex min-h-10 w-full items-center gap-[11px] rounded-[9px] px-2.5 text-[13px] font-medium transition-colors duration-150;
}

.nav-link.active {
  @apply bg-wp-primary-100/15 text-wp-primary-100 dark:text-wp-primary-100 font-semibold;
}

.nav-link :deep(svg) {
  @apply h-[17px] w-[17px] shrink-0;
}

.nav-count {
  @apply text-wp-text-alt-100 bg-wp-control-neutral-200 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold;
}

.nav-link.active .nav-count {
  @apply bg-wp-primary-100/20 text-wp-primary-100;
}

.sidebar-footer {
  @apply border-wp-border-100 dark:border-wp-background-100 border-t p-2.5;
}

@media (min-width: 768px) {
  .sidebar {
    position: static;
    visibility: visible;
    transform: none;
    box-shadow: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar {
    transition: none;
  }
}
</style>
