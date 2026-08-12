# Task Brief: 016-administration-routes

## Goal

System administrators can navigate and operate the existing administration
overview, global resources, repositories, users, organizations, Agents, queue,
and Forge connections through the approved responsive settings hierarchy
without legacy tabs, stale request publication, or prototype-only data and
actions.

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

Enter `/admin` as a system administrator, navigate the nine existing
administration destinations, and complete the currently supported list,
create, update, delete, repair, pause/resume, and Forge configuration flows.
Every route owns its loading, empty, error, retry, confirmed-row, mutation, and
obsolete-completion behavior. Non-administrators receive the current explicit
denial and home redirect. The Forge detail lifecycle must remain correct across
an `A -> B -> A` route sequence, and queue polling or mutations must not publish
after unmount or after a newer request owns the surface.

## In Scope

- Align parity rows `28` through `38`: administration overview, global Secrets,
  global Registries, repositories, users, organizations, Agents, queue, Forge
  list, Forge detail, and Forge create.
- Preserve the existing paths, route names, parameters, authentication metadata,
  and nested Forge route structure; add focused route-resolution coverage.
- Replace the legacy tabbed wrapper with a responsive administration settings
  navigation and `minmax(0, 1fr)` content containment.
- Rebuild the overview using only current Woodpecker version/update data and
  truthful links to the existing administration destinations.
- Rebuild global Secrets and Registries with the shared settings/feedback
  presentation while preserving current pagination, forms, confirmation,
  warnings, and typed CRUD calls.
- Rebuild repository, user, and organization administration lists with explicit
  loading, empty, error, retry, confirmed-row continuity, mutation rejection,
  pagination, current navigation, and current repair/delete/edit behavior.
- Reuse the shared Agent manager for the global Agent endpoints and add the
  administrator lifecycle key needed to reject obsolete completions.
- Rebuild queue presentation using only `QueueInfo`, current stats, task labels,
  pipeline navigation, and pause/resume APIs. Preserve confirmed data during
  active refresh failure and reject overlapping or post-unmount completions.
- Rebuild Forge list/detail/create around the existing `Forge` fields,
  `AdminForgeForm`, and typed CRUD calls, including active route ownership,
  error/retry, confirmed data, mutation rejection, and redirect correctness.
- Add English and Simplified-Chinese copy required by the new hierarchy and
  explicit request/mutation states.
- Record focused component/router tests and task-local desktop/390px browser
  evidence. Final family-wide parity closure remains baseline task `5.5`.

## Out Of Scope

- Forge connection tests, invented connection status, repository/user counts,
  display names not present in `Forge`, synchronization schedules, webhook
  claims beyond current fields, or OAuth callback behavior changes.
- Agent online/busy/offline claims, IP, heartbeat, CPU, memory, capacity,
  backend type, running-job metrics, or infrastructure configuration.
- Queue priority editing, promote, cancel, average wait, throughput, or inferred
  label-capacity explanations not present in the current API contract.
- Repository organization/Forge/activity/storage/pipeline metrics, export, new
  filters, or replacement of the existing repair API with a sync capability.
- User invitation, login activity, pipeline counts, enable/disable actions, or
  fields not present in the current `User` contract.
- Organization creation, member/repository counts, success rates, quotas, or
  activity metadata not present in the current `Org` contract.
- Secret plaintext reveal, usage counts, audit history, Registry verification,
  or any prototype fixture.
- New routes, endpoints, typed fields, stores, backend behavior, persistence,
  authentication algorithms, dependencies, or migrations.
- Personal settings, authentication, not-found, operations routes, or baseline
  task `5.5` family-wide parity closure.
- Marking rows `28` through `38` verified or claiming complete `A2` before task
  `5.5`.

## Files Allowed

- `web/src/router.test.ts`
- `web/src/views/admin/AdminSettingsWrapper.vue`
- `web/src/views/admin/AdminSettingsWrapper.test.ts`
- `web/src/views/admin/AdminInfo.vue`
- `web/src/views/admin/AdminInfo.test.ts`
- `web/src/views/admin/AdminSecrets.vue`
- `web/src/views/admin/AdminSecrets.test.ts`
- `web/src/views/admin/AdminRegistries.vue`
- `web/src/views/admin/AdminRegistries.test.ts`
- `web/src/views/admin/AdminRepos.vue`
- `web/src/views/admin/AdminRepos.test.ts`
- `web/src/views/admin/AdminUsers.vue`
- `web/src/views/admin/AdminUsers.test.ts`
- `web/src/views/admin/AdminOrgs.vue`
- `web/src/views/admin/AdminOrgs.test.ts`
- `web/src/views/admin/AdminAgents.vue`
- `web/src/views/admin/AdminAgents.test.ts`
- `web/src/views/admin/AdminQueue.vue`
- `web/src/views/admin/AdminQueue.test.ts`
- `web/src/views/admin/forges/AdminForges.vue`
- `web/src/views/admin/forges/AdminForges.test.ts`
- `web/src/views/admin/forges/AdminForge.vue`
- `web/src/views/admin/forges/AdminForge.test.ts`
- `web/src/views/admin/forges/AdminForgeCreate.vue`
- `web/src/views/admin/forges/AdminForgeCreate.test.ts`
- `web/src/components/admin/settings/AdminSettingsNav.vue`
- `web/src/components/admin/settings/AdminSettingsNav.test.ts`
- `web/src/components/admin/settings/queue/AdminQueueStats.vue`
- `web/src/components/admin/settings/queue/AdminQueueStats.test.ts`
- `web/src/components/admin/settings/forges/AdminForgeForm.vue`
- `web/src/components/admin/settings/forges/AdminForgeForm.test.ts`
- `web/src/components/agent/AgentManager.vue`
- `web/src/components/agent/AgentManager.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/016-administration-routes/**`
- Existing SpecNav task graph, ledger/context/validation/drift, extraction map,
  handoff, `tasks.md`, route parity, and generated CodeGraph/status files for
  task `016`.

## Interfaces / Seams

- Vue Router keeps the current administration route names, paths, parameters,
  nesting, and authentication metadata.
- `AdminSettingsWrapper` owns administrator visibility, denial notification,
  redirect, shared navigation, and route-lifecycle identity used by descendants.
- `usePagination` remains the single page/reset owner for paginated
  administration resources.
- `useInterval` remains the queue scheduling boundary; the page adds
  latest-request and unmount ownership around returned data.
- `AdminForgeForm` remains the authority for current Forge form fields,
  normalization, advanced options, and submit emission.
- Server administrator middleware and typed API responses remain authoritative;
  the frontend administrator check is only a presentation/redirect boundary.

## Components To Create

- `AdminSettingsNav.vue` for the nine existing administrator destinations.
- Focused tests for the administrator wrapper, navigation, eleven route
  destinations, queue stats, and Forge form behavior.

## Components To Reuse

- `Scaffold`, `FeedbackState`, `Button`, `IconButton`, `Badge`,
  `PrototypeIcon`, `SettingsSection`, `SettingsTable`, `SettingsActionRow`,
  `SecretEdit`, `RegistryEdit`, `AgentManager`, `AdminQueueStats`,
  `AdminForgeForm`, `usePagination`, `useAsyncAction`, `useInterval`,
  `useNotifications`, `useVersion`, and the typed API client.

## Components To Extract

- Keep administration navigation domain-specific because its route set and
  active-route grouping differ from organization and repository settings.
- Reuse the existing shared Settings presentation primitives instead of
  extracting another administration-only section/table/action abstraction.
- Keep resource orchestration route-owned because Secret, Registry, user,
  organization, queue, and Forge mutations have different identities and
  lifecycle effects.

## API / Data Flow Contracts

- Secrets use only global Secret list/create/update/delete methods.
- Registries use only global Registry list/create/update/delete methods.
- Repositories use only `getAllRepos` and `repairAllRepos`.
- Users use only Forge list plus current User list/create/update/delete methods.
- Organizations use only `getOrgs` and `deleteOrg`.
- Agents use only global Agent list/create/update/delete methods.
- Queue uses only `getQueueInfo`, `pauseQueue`, and `resumeQueue`.
- Forges use only Forge list/get/create/update/delete methods and current form
  fields.
- Successful mutation UI waits for the server and belongs to the active
  administration lifecycle. Failed or obsolete mutations preserve confirmed
  rows/editors and cannot report success, navigate, or overwrite newer state.
- Active list refresh failure preserves the last confirmed rows and exposes an
  explicit retry; first-load failure does not masquerade as an empty result.

## State / Error / Empty / Loading Behavior

- Loading: show explicit page/panel loading without prototype counts or stale
  route detail.
- Empty: distinguish an empty server result from loading and request failure.
- Error: active failures show retryable feedback; mutation failures remain
  visible through the existing notification boundary; obsolete failures are
  ignored.
- Disabled: duplicate saves, deletes, repair, pause/resume, and Forge submits
  remain locked while active.
- Authorization: only current system administrators render the settings shell;
  non-administrators receive the current error notification and home redirect.

## TDD Requirement

- Write focused router and component tests before or alongside implementation.
- Cover route resolution, administrator denial, responsive navigation,
  loading/empty/error/retry, confirmed-row continuity, mutation rejection,
  pagination refresh, queue overlap/unmount, Forge `A -> B -> A`, obsolete
  save/create completion, and structural 390px containment.

## Verification Commands

- `pnpm exec vitest run src/router.test.ts src/views/admin/AdminSettingsWrapper.test.ts src/components/admin/settings/AdminSettingsNav.test.ts src/views/admin/AdminInfo.test.ts src/views/admin/AdminSecrets.test.ts src/views/admin/AdminRegistries.test.ts src/views/admin/AdminRepos.test.ts src/views/admin/AdminUsers.test.ts src/views/admin/AdminOrgs.test.ts src/views/admin/AdminAgents.test.ts src/views/admin/AdminQueue.test.ts src/components/admin/settings/queue/AdminQueueStats.test.ts src/views/admin/forges/AdminForges.test.ts src/views/admin/forges/AdminForge.test.ts src/views/admin/forges/AdminForgeCreate.test.ts src/components/admin/settings/forges/AdminForgeForm.test.ts src/components/agent/AgentManager.test.ts`
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
  authentication algorithm, dependency, migration, or prototype-only value.
- Forge testing/status/counts, Agent telemetry, Queue unsupported actions, or
  invented administrator metrics become necessary.
- Administration pages duplicate shared Settings or Agent behavior that should
  remain in the existing shared component.
- A mutation or poll completion cannot be assigned to the active
  administration lifecycle without changing its server contract.
- Final parity closure would require work owned by task `5.5`.

## Unsafe Assumptions

- Existing routes and server checks do not prove frontend resolution,
  responsive hierarchy, explicit states, or stale-completion ownership.
- Frontend administrator visibility does not replace server authorization.
- Queue stats describe only the fields returned by `QueueInfo`; they do not
  justify prototype average-wait or throughput metrics.
- Agent `last_contact` and current fields do not justify live status or
  resource claims.
- Forge type and URL do not prove connectivity, synchronization health, or
  repository/user counts.
- Task-local tests and screenshots do not complete task `5.5` or prove all
  organization/administrator/user parity rows.
