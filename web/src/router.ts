import type { Component } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationMatched, RouteRecordRaw } from 'vue-router';

import useAuthentication from '~/compositions/useAuthentication';
import useConfig from '~/compositions/useConfig';
import { i18n, setI18nLanguage } from '~/compositions/useI18n';
import useNotifications from '~/compositions/useNotifications';
import useUserConfig from '~/compositions/useUserConfig';

declare module 'vue-router' {
  interface RouteMeta {
    authentication?: 'required' | 'guest-only';
    authorization?: 'system-admin';
    repoHeader?: true;
    layout?: 'default' | 'blank';
  }
}

type AuthenticationMode = 'required' | 'guest-only';
type AuthorizationMode = 'system-admin';
const englishAdminDeniedTitle = 'You are not allowed to access server settings';

function findRouteMeta(
  matched: readonly RouteLocationMatched[],
  key: 'authentication' | 'authorization',
): AuthenticationMode | AuthorizationMode | undefined {
  for (let index = matched.length - 1; index >= 0; index -= 1) {
    const value = matched[index]?.meta[key];
    if (value != null) return value;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    redirect: { name: 'overview' },
  },
  {
    path: '/overview',
    name: 'overview',
    component: (): Component => import('~/views/Overview.vue'),
    meta: { authentication: 'required' },
  },
  {
    path: '/repos',
    component: (): Component => import('~/views/RouterView.vue'),
    children: [
      {
        path: '',
        name: 'repos',
        component: (): Component => import('~/views/Repos.vue'),
        meta: { authentication: 'required' },
      },
      {
        path: 'add',
        name: 'repo-add',
        component: (): Component => import('~/views/RepoAdd.vue'),
        meta: { authentication: 'required' },
      },
      {
        path: ':repoId',
        component: (): Component => import('~/views/repo/RepoWrapper.vue'),
        props: true,
        children: [
          {
            path: '',
            name: 'repo',
            component: (): Component => import('~/views/repo/RepoPipelines.vue'),
            meta: { repoHeader: true },
          },
          {
            path: 'branches',
            meta: { repoHeader: true },
            children: [
              {
                path: '',
                name: 'repo-branches',
                component: (): Component => import('~/views/repo/RepoBranches.vue'),
              },
              {
                path: ':branch',
                name: 'repo-branch',
                component: (): Component => import('~/views/repo/RepoBranch.vue'),
                props: (route) => ({ branch: route.params.branch }),
              },
            ],
          },

          {
            path: 'pull-requests',
            meta: { repoHeader: true },
            children: [
              {
                path: '',
                name: 'repo-pull-requests',
                component: (): Component => import('~/views/repo/RepoPullRequests.vue'),
              },
              {
                path: ':pullRequest',
                name: 'repo-pull-request',
                component: (): Component => import('~/views/repo/RepoPullRequest.vue'),
                props: (route) => ({ pullRequest: route.params.pullRequest }),
              },
            ],
          },
          {
            path: 'pipeline/:pipelineId',
            component: (): Component => import('~/views/repo/pipeline/PipelineWrapper.vue'),
            props: true,
            children: [
              {
                path: ':stepId?',
                name: 'repo-pipeline',
                component: (): Component => import('~/views/repo/pipeline/Pipeline.vue'),
                props: true,
              },
              {
                path: 'changed-files',
                name: 'repo-pipeline-changed-files',
                component: (): Component => import('~/views/repo/pipeline/PipelineChangedFiles.vue'),
              },
              {
                path: 'config',
                name: 'repo-pipeline-config',
                component: (): Component => import('~/views/repo/pipeline/PipelineConfig.vue'),
                props: true,
              },
              {
                path: 'errors',
                name: 'repo-pipeline-errors',
                component: (): Component => import('~/views/repo/pipeline/PipelineErrors.vue'),
                props: true,
              },
              {
                path: 'debug',
                name: 'repo-pipeline-debug',
                component: (): Component => import('~/views/repo/pipeline/PipelineDebug.vue'),
                props: true,
                meta: { authentication: 'required' },
              },
            ],
          },
          {
            path: 'settings',
            component: (): Component => import('~/views/repo/settings/RepoSettings.vue'),
            meta: { authentication: 'required' },
            props: true,
            children: [
              {
                path: '',
                name: 'repo-settings',
                component: (): Component => import('~/views/repo/settings/General.vue'),
                props: true,
              },
              {
                path: 'secrets',
                name: 'repo-settings-secrets',
                component: (): Component => import('~/views/repo/settings/Secrets.vue'),
                props: true,
              },
              {
                path: 'registries',
                name: 'repo-settings-registries',
                component: (): Component => import('~/views/repo/settings/Registries.vue'),
                props: true,
              },
              {
                path: 'crons',
                name: 'repo-settings-crons',
                component: (): Component => import('~/views/repo/settings/Crons.vue'),
                props: true,
              },
              {
                path: 'badge',
                name: 'repo-settings-badge',
                component: (): Component => import('~/views/repo/settings/Badge.vue'),
                props: true,
              },
              {
                path: 'actions',
                name: 'repo-settings-actions',
                component: (): Component => import('~/views/repo/settings/Actions.vue'),
                props: true,
              },
              {
                path: 'extensions',
                name: 'repo-settings-extensions',
                component: (): Component => import('~/views/repo/settings/Extensions.vue'),
                props: true,
              },
            ],
          },
          {
            path: 'manual',
            name: 'repo-manual',
            component: (): Component => import('~/views/repo/RepoManualPipeline.vue'),
            meta: { authentication: 'required', repoHeader: true },
          },
        ],
      },
      {
        path: ':repoOwner/:repoName/:pathMatch(.*)*',
        component: (): Component => import('~/views/repo/RepoDeprecatedRedirect.vue'),
        props: true,
      },
    ],
  },
  {
    path: '/orgs/:orgId',
    component: (): Component => import('~/views/org/OrgWrapper.vue'),
    props: true,
    children: [
      {
        path: '',
        name: 'org',
        component: (): Component => import('~/views/org/OrgRepos.vue'),
        meta: { orgHeader: true },
        props: true,
      },
      {
        path: 'settings',
        component: (): Component => import('~/views/org/settings/OrgSettingsWrapper.vue'),
        meta: { authentication: 'required' },
        props: true,
        children: [
          {
            path: '',
            name: 'org-settings',
            redirect: { name: 'org-settings-secrets' },
          },
          {
            path: 'secrets',
            name: 'org-settings-secrets',
            component: (): Component => import('~/views/org/settings/OrgSecrets.vue'),
            props: true,
          },
          {
            path: 'registries',
            name: 'org-settings-registries',
            component: (): Component => import('~/views/org/settings/OrgRegistries.vue'),
            props: true,
          },
          {
            path: 'agents',
            name: 'org-settings-agents',
            component: (): Component => import('~/views/org/settings/OrgAgents.vue'),
            props: true,
          },
        ],
      },
    ],
  },
  {
    path: '/org/:orgName/:pathMatch(.*)*',
    component: (): Component => import('~/views/org/OrgDeprecatedRedirect.vue'),
    props: true,
  },
  {
    path: '/admin',
    component: (): Component => import('~/views/admin/AdminSettingsWrapper.vue'),
    meta: { authentication: 'required', authorization: 'system-admin' },
    children: [
      {
        path: '',
        name: 'admin-settings',
        component: (): Component => import('~/views/admin/AdminInfo.vue'),
      },
      {
        path: 'secrets',
        name: 'admin-settings-secrets',
        component: (): Component => import('~/views/admin/AdminSecrets.vue'),
      },
      {
        path: 'registries',
        name: 'admin-settings-registries',
        component: (): Component => import('~/views/admin/AdminRegistries.vue'),
      },
      {
        path: 'repos',
        name: 'admin-settings-repos',
        component: (): Component => import('~/views/admin/AdminRepos.vue'),
      },
      {
        path: 'users',
        name: 'admin-settings-users',
        component: (): Component => import('~/views/admin/AdminUsers.vue'),
      },
      {
        path: 'orgs',
        name: 'admin-settings-orgs',
        component: (): Component => import('~/views/admin/AdminOrgs.vue'),
      },
      {
        path: 'agents',
        name: 'admin-settings-agents',
        component: (): Component => import('~/views/admin/AdminAgents.vue'),
      },
      {
        path: 'queue',
        name: 'admin-settings-queue',
        component: (): Component => import('~/views/admin/AdminQueue.vue'),
      },
      {
        path: 'forges',
        component: (): Component => import('~/views/RouterView.vue'),
        props: true,
        children: [
          {
            path: '',
            name: 'admin-settings-forges',
            component: (): Component => import('~/views/admin/forges/AdminForges.vue'),
          },
          {
            path: ':forgeId',
            name: 'admin-settings-forge',
            component: (): Component => import('~/views/admin/forges/AdminForge.vue'),
            props: true,
          },
          {
            path: 'create',
            name: 'admin-settings-forge-create',
            component: (): Component => import('~/views/admin/forges/AdminForgeCreate.vue'),
          },
        ],
      },
    ],
  },

  {
    path: '/user',
    component: (): Component => import('~/views/user/UserWrapper.vue'),
    meta: { authentication: 'required' },
    children: [
      {
        path: '',
        name: 'user',
        component: (): Component => import('~/views/user/UserGeneral.vue'),
      },
      {
        path: 'secrets',
        name: 'user-secrets',
        component: (): Component => import('~/views/user/UserSecrets.vue'),
      },
      {
        path: 'registries',
        name: 'user-registries',
        component: (): Component => import('~/views/user/UserRegistries.vue'),
      },
      {
        path: 'cli-and-api',
        name: 'user-cli-and-api',
        component: (): Component => import('~/views/user/UserCLIAndAPI.vue'),
      },
      {
        path: 'agents',
        name: 'user-agents',
        component: (): Component => import('~/views/user/UserAgents.vue'),
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: (): Component => import('~/views/Login.vue'),
    meta: { layout: 'blank', authentication: 'guest-only' },
  },
  {
    path: '/cli/auth',
    component: (): Component => import('~/views/cli/Auth.vue'),
    meta: { authentication: 'required' },
  },

  // ---------- Ops: infrastructure & deployment control plane ----------
  {
    path: '/infrastructure',
    component: (): Component => import('~/views/RouterView.vue'),
    meta: { authentication: 'required' },
    children: [
      {
        path: '',
        name: 'infrastructure',
        component: (): Component => import('~/views/infrastructure/InfrastructureOverview.vue'),
      },
      {
        path: 'servers',
        name: 'infrastructure-servers',
        component: (): Component => import('~/views/infrastructure/InfrastructureServers.vue'),
      },
      {
        path: 'servers/:serverId',
        name: 'infrastructure-server',
        component: (): Component => import('~/views/infrastructure/InfrastructureServer.vue'),
        props: true,
      },
      {
        path: 'groups',
        name: 'infrastructure-groups',
        component: (): Component => import('~/views/infrastructure/InfrastructureGroups.vue'),
      },
      {
        path: 'groups/:groupId',
        name: 'infrastructure-group',
        component: (): Component => import('~/views/infrastructure/InfrastructureGroup.vue'),
        props: true,
      },
      {
        path: 'services',
        name: 'infrastructure-services',
        component: (): Component => import('~/views/infrastructure/InfrastructureServices.vue'),
      },
      {
        path: 'alerts',
        name: 'infrastructure-alerts',
        component: (): Component => import('~/views/infrastructure/InfrastructureAlerts.vue'),
      },
    ],
  },
  {
    path: '/deployments',
    component: (): Component => import('~/views/RouterView.vue'),
    meta: { authentication: 'required' },
    children: [
      { path: '', name: 'deployments', component: (): Component => import('~/views/deployments/Deployments.vue') },
      {
        path: 'new',
        name: 'deployment-new',
        component: (): Component => import('~/views/deployments/DeploymentNew.vue'),
      },
      {
        path: 'approvals',
        name: 'deployment-approvals',
        component: (): Component => import('~/views/deployments/DeploymentApprovals.vue'),
      },
      {
        path: 'apps',
        name: 'applications',
        component: (): Component => import('~/views/deployments/Applications.vue'),
      },
      {
        path: 'apps/:appId',
        name: 'application',
        component: (): Component => import('~/views/deployments/ApplicationDetail.vue'),
        props: true,
      },
      {
        path: 'environments',
        name: 'environments',
        component: (): Component => import('~/views/deployments/Environments.vue'),
      },
      {
        path: 'environments/:envId',
        name: 'environment',
        component: (): Component => import('~/views/deployments/EnvironmentDetail.vue'),
        props: true,
      },
      { path: 'releases', name: 'releases', component: (): Component => import('~/views/deployments/Releases.vue') },
      {
        path: 'policies',
        name: 'deployment-policies',
        component: (): Component => import('~/views/deployments/DeploymentPolicies.vue'),
      },
      {
        path: ':deploymentId',
        name: 'deployment',
        component: (): Component => import('~/views/deployments/DeploymentDetail.vue'),
        props: true,
      },
    ],
  },

  // not found handler
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: (): Component => import('~/views/NotFound.vue'),
  },
];

const { rootPath } = useConfig();
const router = createRouter({
  history: createWebHistory(rootPath || '/'),
  routes,
});

router.beforeEach(async (to) => {
  const authenticationMode = findRouteMeta(to.matched, 'authentication');
  const authorizationMode = findRouteMeta(to.matched, 'authorization');

  const config = useUserConfig();
  const { redirectUrl } = config.userConfig.value;

  const { isAuthenticated, user } = useAuthentication();
  const denySystemAdminAccess = async () => {
    try {
      await setI18nLanguage(i18n.global.locale.value);
    } catch {
      // Authorization navigation must not depend on a locale chunk loading successfully.
    }
    const translatedTitle = i18n.global.t('admin.settings.not_allowed');
    useNotifications().notify({
      type: 'error',
      title: translatedTitle === 'admin.settings.not_allowed' ? englishAdminDeniedTitle : translatedTitle,
    });
    return { name: 'home' } as const;
  };

  // redirect to saved url when not on login page
  if (redirectUrl !== '' && isAuthenticated && authenticationMode !== 'guest-only') {
    config.setUserConfig('redirectUrl', '');

    const redirectAuthorizationMode = findRouteMeta(router.resolve(redirectUrl).matched, 'authorization');
    if (redirectAuthorizationMode === 'system-admin' && user?.admin !== true) {
      return denySystemAdminAccess();
    }

    return redirectUrl;
  }

  if (authenticationMode === 'required' && !isAuthenticated) {
    config.setUserConfig('redirectUrl', to.fullPath);
    return { name: 'login' };
  }

  if (authenticationMode === 'guest-only' && isAuthenticated) {
    return { name: 'home' };
  }

  if (authorizationMode === 'system-admin' && user?.admin !== true) {
    return denySystemAdminAccess();
  }
});

export default router;
