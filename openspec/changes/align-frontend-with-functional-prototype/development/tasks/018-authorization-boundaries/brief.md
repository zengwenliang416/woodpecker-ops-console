# Task Brief: 018-authorization-boundaries

## Goal

Guests, authenticated users, repository operators, organization
administrators, and system administrators see only the navigation and direct
routes allowed by the current authentication and server-backed authorization
contracts.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/specs/system-architecture/design.md`
- `openspec/specs/frontend-backend-data-flow/design.md`
- `openspec/specs/component-architecture/design.md`

## Vertical Slice

Open the production shell and protected route families as a guest, regular
authenticated user, repository reader/operator/administrator, organization
member/administrator, or system administrator. Global navigation exposes only
destinations available to the current authentication state. Direct
administration access is rejected before an administration child route renders,
while repository and organization decisions continue to use their current
server-returned permission objects.

## In Scope

- Add a route-level system-administrator authorization marker to the existing
  `/admin/**` route family without changing paths, names, nesting, or backend
  enforcement.
- Redirect guests from authenticated routes to login and regular authenticated
  users from system-administrator routes to the current home destination.
- Preserve `AdminSettingsWrapper` as a presentation-level fallback denial.
- Hide protected workspace, delivery, infrastructure, build, management, and
  personal sidebar destinations from guests while retaining public help links.
- Keep administrator sidebar and topbar destinations visible only to current
  system administrators.
- Preserve repository `pull`, `push`, and `admin` behavior in `RepoWrapper` and
  `RepoSettings`; preserve organization `member` and `admin` behavior in
  `OrgWrapper` and `OrgSettingsWrapper`.
- Add focused real-router and component tests for guest, regular-user,
  repository, organization, and system-administrator boundaries.

## Out Of Scope

- New roles, permission fields, routes, APIs, stores, backend middleware,
  persistence, dependencies, migrations, or authorization algorithms.
- Moving repository or organization authorization into static route metadata;
  those permissions remain server-backed and resource-specific.
- Changing public repository or organization visibility.
- Operations-specific role design, node-agent policy changes, or complete
  route-family parity verification owned by task `5.5`.
- Marking any parity row verified or claiming complete `A2`.

## Files Allowed

- `web/src/router.ts`
- `web/src/router.test.ts`
- `web/src/components/layout/header/Sidebar.vue`
- `web/src/components/layout/header/Sidebar.test.ts`
- `web/src/components/layout/header/Navbar.test.ts`
- `web/src/views/admin/AdminSettingsWrapper.vue`
- `web/src/views/admin/AdminSettingsWrapper.test.ts`
- `web/src/views/repo/RepoWrapper.vue`
- `web/src/views/repo/RepoWrapper.test.ts`
- `web/src/views/repo/settings/RepoSettings.vue`
- `web/src/views/repo/settings/RepoSettings.test.ts`
- `web/src/views/org/OrgWrapper.vue`
- `web/src/views/org/OrgWrapper.test.ts`
- `web/src/views/org/settings/OrgSettingsWrapper.vue`
- `web/src/views/org/settings/OrgSettingsWrapper.test.ts`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/018-authorization-boundaries/**`
- Existing task graph, ledger/context/validation/drift, handoff, `tasks.md`,
  route parity, and generated CodeGraph/status files for task `018`.

## Interfaces / Seams

- Vue Router owns authentication and system-administrator route entry.
- `useAuthentication` remains the current source for the bootstrap user and
  system-administrator flag.
- `RepoPermissions` and `OrgPermissions` remain authoritative for
  resource-specific access after their wrappers load the active resource.
- Sidebar and topbar visibility mirror the same bootstrap authentication and
  system-administrator state but do not replace server enforcement.

## Components To Create

- No new components are created by this slice; the work enforces the existing
  router-guard, `Sidebar`/`Navbar`, and wrapper-level authorization boundaries
  already owned by the components listed under Components To Reuse.

## Components To Reuse

- Existing router guard, `Sidebar`, `Navbar`, `AdminSettingsWrapper`,
  `RepoWrapper`, `RepoSettings`, `OrgWrapper`, and `OrgSettingsWrapper`.

## Components To Extract

- No shared component extraction is needed. Static route authorization and
  resource-specific asynchronous authorization have different owners and
  should remain separate.

## State / Error / Empty / Loading Behavior

- Guests reaching authenticated routes retain the current saved-destination
  login redirect.
- Regular users reaching `/admin/**` are redirected before nested
  administration content renders.
- Repository and organization wrappers keep loading or error states until
  current server permissions resolve.
- Obsolete repository or organization permission completions remain inert.

## TDD Requirement

- Add failing tests before production edits.
- Cover route metadata and real navigation for guest, regular user, and system
  administrator.
- Cover guest versus authenticated versus administrator sidebar destinations.
- Re-run existing repository and organization wrapper tests for direct-route
  denial, action visibility, permission changes, and obsolete completions.

## Verification Commands

- `pnpm exec vitest run src/router.test.ts src/components/layout/header/Sidebar.test.ts src/components/layout/header/Navbar.test.ts src/views/admin/AdminSettingsWrapper.test.ts src/views/repo/RepoWrapper.test.ts src/views/repo/settings/RepoSettings.test.ts src/views/org/OrgWrapper.test.ts src/views/org/settings/OrgSettingsWrapper.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check <task production/test/governance files>`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- JSON/JSONL parsing and `git diff --check`.
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode entry --json`
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode handoff --json`

## Stop Conditions

- A fix requires a new role, route, API, typed field, store, backend contract,
  persistence, dependency, migration, or authentication mechanism.
- Public repository or organization access would need to become globally
  authenticated.
- Static route metadata would need to guess dynamic repository or organization
  permissions.
- Complete sensory parity or operations authorization work owned by later tasks
  becomes necessary.

## Unsafe Assumptions

- Hidden navigation is not authorization; direct routes and backend checks must
  remain authoritative.
- A logged-in user is not necessarily a system administrator.
- A repository administrator is not necessarily an organization or system
  administrator.
- Bootstrap user state cannot replace resource-specific server permissions.
