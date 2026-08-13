import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Router } from 'vue-router';

interface RouteContract {
  row: number;
  name: string | null;
  path: string;
  params?: Record<string, string | number>;
  authentication?: 'required' | 'guest-only';
  authorization?: 'system-admin';
  layout?: 'blank';
  orgHeader?: true;
}

const routeContracts: RouteContract[] = [
  { row: 1, name: 'login', path: '/login', authentication: 'guest-only', layout: 'blank' },
  { row: 24, name: 'org', path: '/orgs/17', params: { orgId: 17 }, orgHeader: true },
  {
    row: 25,
    name: 'org-settings-secrets',
    path: '/orgs/17/settings/secrets',
    params: { orgId: 17 },
    authentication: 'required',
  },
  {
    row: 26,
    name: 'org-settings-registries',
    path: '/orgs/17/settings/registries',
    params: { orgId: 17 },
    authentication: 'required',
  },
  {
    row: 27,
    name: 'org-settings-agents',
    path: '/orgs/17/settings/agents',
    params: { orgId: 17 },
    authentication: 'required',
  },
  {
    row: 28,
    name: 'admin-settings',
    path: '/admin',
    authentication: 'required',
    authorization: 'system-admin',
  },
  {
    row: 29,
    name: 'admin-settings-secrets',
    path: '/admin/secrets',
    authentication: 'required',
    authorization: 'system-admin',
  },
  {
    row: 30,
    name: 'admin-settings-registries',
    path: '/admin/registries',
    authentication: 'required',
    authorization: 'system-admin',
  },
  {
    row: 31,
    name: 'admin-settings-repos',
    path: '/admin/repos',
    authentication: 'required',
    authorization: 'system-admin',
  },
  {
    row: 32,
    name: 'admin-settings-users',
    path: '/admin/users',
    authentication: 'required',
    authorization: 'system-admin',
  },
  {
    row: 33,
    name: 'admin-settings-orgs',
    path: '/admin/orgs',
    authentication: 'required',
    authorization: 'system-admin',
  },
  {
    row: 34,
    name: 'admin-settings-agents',
    path: '/admin/agents',
    authentication: 'required',
    authorization: 'system-admin',
  },
  {
    row: 35,
    name: 'admin-settings-queue',
    path: '/admin/queue',
    authentication: 'required',
    authorization: 'system-admin',
  },
  {
    row: 36,
    name: 'admin-settings-forges',
    path: '/admin/forges',
    authentication: 'required',
    authorization: 'system-admin',
  },
  {
    row: 37,
    name: 'admin-settings-forge',
    path: '/admin/forges/7',
    params: { forgeId: 7 },
    authentication: 'required',
    authorization: 'system-admin',
  },
  {
    row: 38,
    name: 'admin-settings-forge-create',
    path: '/admin/forges/create',
    authentication: 'required',
    authorization: 'system-admin',
  },
  { row: 39, name: 'user', path: '/user', authentication: 'required' },
  { row: 40, name: 'user-secrets', path: '/user/secrets', authentication: 'required' },
  { row: 41, name: 'user-registries', path: '/user/registries', authentication: 'required' },
  { row: 42, name: 'user-cli-and-api', path: '/user/cli-and-api', authentication: 'required' },
  { row: 43, name: 'user-agents', path: '/user/agents', authentication: 'required' },
  { row: 44, name: null, path: '/cli/auth?port=49152', authentication: 'required' },
  { row: 45, name: 'not-found', path: '/definitely-not-a-route' },
];

const focusedComponentTests = [
  'components/admin/settings/AdminSettingsNav.test.ts',
  'components/admin/settings/forges/AdminForgeForm.test.ts',
  'components/admin/settings/queue/AdminQueueStats.test.ts',
  'components/org/settings/OrgSettingsNav.test.ts',
  'components/user/settings/UserSettingsNav.test.ts',
  'views/admin/AdminAgents.test.ts',
  'views/admin/AdminInfo.test.ts',
  'views/admin/AdminOrgs.test.ts',
  'views/admin/AdminQueue.test.ts',
  'views/admin/AdminRegistries.test.ts',
  'views/admin/AdminRepos.test.ts',
  'views/admin/AdminSecrets.test.ts',
  'views/admin/AdminSettingsWrapper.test.ts',
  'views/admin/AdminUsers.test.ts',
  'views/admin/forges/AdminForge.test.ts',
  'views/admin/forges/AdminForgeCreate.test.ts',
  'views/admin/forges/AdminForges.test.ts',
  'views/cli/Auth.test.ts',
  'views/Login.test.ts',
  'views/NotFound.test.ts',
  'views/org/OrgRepos.test.ts',
  'views/org/OrgWrapper.test.ts',
  'views/org/settings/OrgAgents.test.ts',
  'views/org/settings/OrgRegistries.test.ts',
  'views/org/settings/OrgSecrets.test.ts',
  'views/org/settings/OrgSettingsWrapper.test.ts',
  'views/user/UserAgents.test.ts',
  'views/user/UserCLIAndAPI.test.ts',
  'views/user/UserGeneral.test.ts',
  'views/user/UserRegistries.test.ts',
  'views/user/UserSecrets.test.ts',
  'views/user/UserWrapper.test.ts',
] as const;

describe('route family parity closure', () => {
  let router: Router;

  beforeAll(async () => {
    Object.defineProperty(window, 'WOODPECKER_ROOT_PATH', { configurable: true, value: '/woodpecker' });
    ({ default: router } = await import('./router'));
  });

  it('owns exactly parity rows 1 and 24 through 45', () => {
    expect(routeContracts.map(({ row }) => row)).toEqual([1, ...Array.from({ length: 22 }, (_, index) => index + 24)]);
  });

  it.each(routeContracts)('resolves parity row $row at $path with its current metadata', (contract) => {
    const incoming = router.resolve(contract.path);
    const terminalMatch = incoming.matched.at(-1);

    expect(terminalMatch?.name ?? null).toBe(contract.name);
    expect(incoming.meta.authentication).toBe(contract.authentication);
    expect(incoming.meta.authorization).toBe(contract.authorization);
    expect(incoming.meta.layout).toBe(contract.layout);
    expect(incoming.meta.orgHeader).toBe(contract.orgHeader);

    for (const [key, value] of Object.entries(contract.params ?? {})) {
      expect(incoming.params[key]).toBe(String(value));
    }

    if (contract.row === 44) {
      expect(incoming.path).toBe('/cli/auth');
      expect(incoming.query.port).toBe('49152');
      expect(terminalMatch?.path).toBe('/cli/auth');
      return;
    }

    if (contract.row === 45) {
      expect(router.resolve('/nested/unknown/path').matched.at(-1)?.name).toBe('not-found');
      return;
    }

    expect(contract.name).not.toBeNull();
    expect(router.resolve({ name: contract.name!, params: contract.params }).href).toBe(`/woodpecker${contract.path}`);
  });

  it('keeps the focused component suites required by baseline task 5.5', () => {
    const sourceRoot = path.dirname(fileURLToPath(import.meta.url));
    const missingTests = focusedComponentTests.filter((testPath) => !existsSync(path.join(sourceRoot, testPath)));

    expect(focusedComponentTests).toHaveLength(32);
    expect(missingTests).toEqual([]);
  });
});
