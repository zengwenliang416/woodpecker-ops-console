# Task Brief: 015-organization-routes

## Goal

Organization members can browse their real repositories, and organization
administrators can manage the existing secret, registry, and agent resources
through the approved settings hierarchy without stale organization state,
legacy page structure, or prototype-only capabilities.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/spec-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/component-impact-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/decision.json`
- `openspec/specs/ui-design/design.md`
- `openspec/specs/system-architecture/design.md`
- `openspec/specs/frontend-backend-data-flow/design.md`
- `openspec/specs/component-architecture/design.md`

## Vertical Slice

Enter `/orgs/:orgId`, load the current organization and permissions, browse and
search only its real repositories, then navigate through the shared
organization settings shell to Secrets, Registries, or Agents. Administrators
can complete the currently supported create, update, and delete flows; members,
disabled Agent configurations, failed requests, and obsolete completions receive
explicit, route-owned outcomes. An `A -> B -> A` organization sequence must not
allow the first A load or mutation to publish into the final A lifecycle.

## In Scope

- Align parity rows `24` through `27`: organization repositories, Secrets,
  Registries, and Agents.
- Preserve the existing routes and add focused resolution coverage for all four
  terminal destinations plus the settings redirect.
- Rebuild the organization overview with a compact header, search, real
  organization repository table/list, explicit loading, empty, no-match, error,
  and retry states, and the existing administrator settings entry.
- Replace the legacy tabbed settings shell with a responsive organization
  settings navigation and `minmax(0, 1fr)` content containment.
- Promote the repository settings section, table, and action-row presentation
  primitives to scope-neutral shared Settings components and update their
  existing repository consumers without changing repository behavior.
- Rebuild organization Secrets and Registries with shared feedback and table
  primitives while preserving pagination, forms, confirmation, organization
  precedence, global Registry read-only behavior, and real CRUD calls.
- Align the shared Agent manager so organization Agent loading, empty, error,
  retry, form, deletion, and pagination states use the same production design
  system while preserving its current admin/user consumers.
- Add active organization lifecycle generations for organization,
  permission, list, save, and delete completions; obsolete completions may not
  mutate rows, navigation, notifications, or redirects.
- Guard both Agent navigation and direct-route behavior with the existing
  `userRegisteredAgents` feature flag.
- Add English and Simplified-Chinese copy required by the new hierarchy and
  explicit states.
- Record focused component/router tests and task-local desktop/390px browser
  evidence for the implemented organization states. Final family-wide parity
  closure remains baseline task `5.5`.

## Out Of Scope

- Organization members, invitations, teams, success rates, monthly pipeline
  counts, sparklines, quotas, audit timelines, secret usage counts, Registry
  verification/testing, Agent binding, or invented online/busy/resource data.
- New endpoints, typed fields, stores, backend behavior, persistence,
  authentication, permission calculations, dependencies, or migrations.
- Replacing the current organization repository visibility model with an
  administrator-only organization/repository directory endpoint.
- Revealing or copying Secret values that the list API does not return.
- Changing Registry address URL encoding without a separate red regression,
  explicit scope expansion, API-client tests, refreshed CodeGraph plan, and a
  new entry pass.
- Administration, personal settings, authentication, not-found, or operations
  route implementation owned by tasks `5.2`, `5.3`, and `6.*`.
- Claiming rows `24` through `27`, the full organization/admin/user family, or
  acceptance assertion `A2` verified before baseline task `5.5`.

## Files Allowed

- `web/src/router.ts`
- `web/src/router.test.ts`
- `web/src/views/org/OrgWrapper.vue`
- `web/src/views/org/OrgWrapper.test.ts`
- `web/src/views/org/OrgRepos.vue`
- `web/src/views/org/OrgRepos.test.ts`
- `web/src/views/org/settings/OrgSettingsWrapper.vue`
- `web/src/views/org/settings/OrgSettingsWrapper.test.ts`
- `web/src/views/org/settings/OrgSecrets.vue`
- `web/src/views/org/settings/OrgSecrets.test.ts`
- `web/src/views/org/settings/OrgRegistries.vue`
- `web/src/views/org/settings/OrgRegistries.test.ts`
- `web/src/views/org/settings/OrgAgents.vue`
- `web/src/views/org/settings/OrgAgents.test.ts`
- `web/src/components/org/settings/OrgSettingsNav.vue`
- `web/src/components/org/settings/OrgSettingsNav.test.ts`
- `web/src/components/settings/SettingsSection.vue`
- `web/src/components/settings/SettingsSection.test.ts`
- `web/src/components/settings/SettingsTable.vue`
- `web/src/components/settings/SettingsTable.test.ts`
- `web/src/components/settings/SettingsActionRow.vue`
- `web/src/components/settings/SettingsActionRow.test.ts`
- `web/src/components/repo/settings/RepoSettingsSection.vue`
- `web/src/components/repo/settings/RepoSettingsSection.test.ts`
- `web/src/components/repo/settings/RepoSettingsTable.vue`
- `web/src/components/repo/settings/RepoSettingsTable.test.ts`
- `web/src/components/repo/settings/RepoSettingsActionRow.vue`
- `web/src/components/repo/settings/RepoSettingsActionRow.test.ts`
- `web/src/views/repo/RepoManualPipeline.vue`
- `web/src/views/repo/RepoManualPipeline.test.ts`
- `web/src/views/repo/settings/General.vue`
- `web/src/views/repo/settings/General.test.ts`
- `web/src/views/repo/settings/Secrets.vue`
- `web/src/views/repo/settings/Registries.vue`
- `web/src/views/repo/settings/Crons.vue`
- `web/src/views/repo/settings/Badge.vue`
- `web/src/views/repo/settings/Actions.vue`
- `web/src/views/repo/settings/Extensions.vue`
- `web/src/components/agent/AgentManager.vue`
- `web/src/components/agent/AgentManager.test.ts`
- `web/src/compositions/useInjectProvide.ts`
- `web/src/store/repos.ts`
- `web/src/store/repos.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/015-organization-routes/**`
- Existing SpecNav task graph, ledger/context/validation/drift, extraction map,
  handoff, `tasks.md`, and generated CodeGraph/status files for task `015`.

## Interfaces / Seams

- Vue Router keeps the current route names, paths, parameters, redirects, and
  authentication metadata.
- `OrgWrapper` remains the owner of `org` and `org-permissions` injection and
  of the organization lifecycle generation used by descendant pages.
- The repository store remains the authority for repositories visible to the
  current user; organization filtering continues to use `repo.org_id`.
- `usePagination` remains the single page/reset owner for Secret, Registry, and
  Agent lists.
- Existing typed API methods and server `MustOrgMember` middleware remain
  authoritative for membership, administrator access, and mutations.
- The Agent feature flag controls both navigation and direct-route content; it
  does not introduce a new permission calculation.

## Components To Create

- `OrgSettingsNav.vue` for the three organization settings destinations.
- Scope-neutral `SettingsSection`, `SettingsTable`, and `SettingsActionRow`
  presentation primitives promoted from their repository-only names.
- Focused tests for the new organization pages and shared primitives.

## Components To Reuse

- `Scaffold`, `FeedbackState`, `Button`, `IconButton`, `Badge`,
  `PrototypeIcon`, `SecretEdit`, `RegistryEdit`, `AgentForm`, `AgentList`,
  `useRepoSearch`, `usePagination`, `useAsyncAction`, `useNotifications`, the
  repository store, and the typed API client.
- Current repository settings behavior and tests while changing only imports
  to the promoted shared presentation primitives.

## Components To Extract

- Extract the purely presentational repository `RepoSettingsSection`,
  `RepoSettingsTable`, and `RepoSettingsActionRow` implementations into
  scope-neutral shared Settings components because organization settings are
  now a second real consumer.
- Keep repository and organization navigation domain-specific because their
  route sets and visibility rules differ.
- Do not extract API orchestration until another real consumer proves identical
  loading, mutation, scope precedence, and lifecycle contracts.

## API / Data Flow Contracts

- Organization and permission requests snapshot the numeric `orgId`; only the
  active lifecycle may provide data, render a shell, notify, or redirect.
- Organization repositories come from the current repository store and are
  filtered by the active `org.id`; no prototype fixture or administrator-only
  directory call is allowed.
- Secrets use only `getOrgSecretList`, `createOrgSecret`,
  `updateOrgSecret`, and `deleteOrgSecret`.
- Registries merge `getOrgRegistryList` and `getGlobalRegistryList`, prefer the
  organization row for duplicate addresses, keep global rows read-only, and
  mutate only through organization Registry endpoints.
- Agents use `getOrgAgents`, `createOrgAgent`, `updateOrgAgent`, and
  `deleteOrgAgent`; creation means organization-owned Agent registration, not
  binding an existing global Agent.
- Successful mutation UI and notifications wait for the server and belong to
  the active organization lifecycle. Failed or obsolete mutations preserve the
  last confirmed rows and must not report success.

## State / Error / Empty / Loading Behavior

- Loading: clear the previous organization shell on active route change and
  show explicit page/panel loading without fake counts.
- Empty: distinguish no organization repositories/resources from a repository
  search with no matches.
- Error: active GET failures show retryable feedback; active membership or
  permission failures follow the current error/redirect boundary; obsolete
  failures are ignored.
- Disabled: duplicate saves/deletes remain locked; a disabled Agent feature
  shows an explicit unavailable state and performs no Agent request.
- Permission: members may browse the organization; only
  `OrgPermissions.admin` sees or enters organization settings; backend
  middleware remains authoritative on direct requests.

## TDD Requirement

- Write focused router and component behavior tests before or alongside
  implementation.
- Cover organization `A -> B -> A` stale organization, permission, list,
  save, and delete completion; pagination refresh/rejection; admin/non-admin
  routing; Agent feature disablement; and 390px local containment.

## Verification Commands

- `pnpm exec vitest run src/router.test.ts src/views/org/OrgWrapper.test.ts src/views/org/OrgRepos.test.ts src/views/org/settings/OrgSettingsWrapper.test.ts src/views/org/settings/OrgSecrets.test.ts src/views/org/settings/OrgRegistries.test.ts src/views/org/settings/OrgAgents.test.ts src/components/org/settings/OrgSettingsNav.test.ts src/components/settings/SettingsSection.test.ts src/components/settings/SettingsTable.test.ts src/components/settings/SettingsActionRow.test.ts src/components/agent/AgentManager.test.ts`
- `pnpm exec vitest run src/views/repo/RepoManualPipeline.test.ts src/views/repo/settings/General.test.ts src/views/repo/settings/Secrets.test.ts src/views/repo/settings/Registries.test.ts src/views/repo/settings/Crons.test.ts src/views/repo/settings/Badge.test.ts src/views/repo/settings/Actions.test.ts src/views/repo/settings/Extensions.test.ts`
- `pnpm exec vitest run src/store/repos.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check <task production/test files>`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Task-local desktop and `390x844` browser capture and health verification.
- JSON/JSONL parsing for changed SpecNav and evidence artifacts.
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode entry --json`
- `git diff --check`

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- A fix requires a new route, endpoint, field, store, backend, persistence,
  authentication, permission calculation, dependency, migration, or
  prototype-only value.
- Registry address URL behavior becomes necessary without a focused red test
  and explicit API-client scope expansion.
- Organization pages duplicate shared Settings presentation or mutation logic
  that should remain in an existing component/composition.
- A mutation cannot be assigned to the active organization lifecycle without
  changing its server contract.
- Final parity closure would require work owned by task `5.5`.

## Scope Expansion Record

- Independent spec and quality review proved that route-local generations
  cannot prevent an obsolete `repoStore.loadRepos()` request from mutating the
  shared repository and pipeline stores.
- The task therefore adds `web/src/store/repos.ts` and
  `web/src/store/repos.test.ts` for a latest-request-wins store boundary, plus
  `web/src/compositions/useInjectProvide.ts` for the existing `OrgWrapper`
  lifecycle injection contract.
- This expansion adds no route, endpoint, field, store, backend behavior,
  dependency, permission calculation, or prototype-only capability.

## Unsafe Assumptions

- Existing routes and server tests do not prove frontend route resolution,
  responsive hierarchy, explicit states, or stale-completion ownership.
- `OrgPermissions.admin` is a frontend visibility aid; it does not replace
  server `MustOrgMember(true)` enforcement.
- Agent registration is not Agent binding, and `last_contact` alone does not
  justify an online/busy claim.
- Prototype metrics, members, teams, verification states, usage counts, audit
  data, resource telemetry, and fixed pagination controls are not production
  contracts.
- Structural tests and task-local screenshots do not complete task `5.5` or
  prove all organization/admin/user parity rows.
