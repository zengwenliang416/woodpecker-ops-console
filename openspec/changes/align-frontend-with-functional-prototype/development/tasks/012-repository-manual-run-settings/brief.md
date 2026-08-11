# Task Brief: 012-repository-manual-run-settings

## Goal

Repository operators can manually trigger a real pipeline and administer the
existing repository settings surfaces through a dense, responsive information
hierarchy aligned with the approved prototype without inventing metadata,
mutations, or server capabilities.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`

## Vertical Slice

Enter the manual-run or repository-settings routes, pass the existing
repository permission boundary, load the established API data, inspect or edit
the supported fields, submit the existing mutation, and receive the current
notification/navigation result.

## In Scope

- Align the manual-run route with explicit branch loading, empty/error states,
  real default-branch selection, variable validation, duplicate-submit
  protection, and existing pipeline-result navigation.
- Replace the repository settings top-tab presentation with a responsive
  settings navigation and content grid while preserving route names and the
  existing admin gate.
- Reorganize general settings into prototype-aligned sections using only
  current `RepoSettings` fields and preserve the existing save/reload flow.
- Align repository secrets and registries with dense, locally scrollable tables,
  inherited scope labels, explicit loading/empty states, and their existing
  create/edit/delete forms and APIs.
- Align cron management with a responsive table, real schedule/branch/timezone/
  enabled/next-execution values, explicit loading/empty states, and existing
  run/create/update/delete behavior.
- Align badge generation with a two-column configuration/preview layout while
  preserving the current URL, Markdown, HTML, branch, event, workflow, and step
  semantics.
- Present existing repair/enable/disable/delete actions as clearly separated
  maintenance and danger regions without adding prototype-only cache, export,
  or archive actions.
- Present current config/registry/secret extension endpoints and signature key
  as grouped settings; no prototype-only extension catalog or toggle model is
  introduced.
- Add focused route/component/pure-function tests and English plus
  Simplified-Chinese copy for the aligned surfaces.

## Out Of Scope

- Backend, API endpoint/type, router-name/path, repository store, permission,
  authentication, cron scheduler, badge server, or extension protocol changes.
- Prototype-only repository name/description editing, registry verification,
  secret usage/audit data, cron last-result data, badge visual styles, cache
  cleanup, export, archive, or extension marketplace cards.
- Organization, administrator, and personal settings routes; their shared
  secret/registry components remain behaviorally unchanged.
- Full repository-family regression and parity-matrix closure owned by baseline
  tasks `4.4` and `4.5`.

## Files Allowed

- `web/src/views/repo/RepoManualPipeline.vue`
- `web/src/views/repo/RepoManualPipeline.test.ts`
- `web/src/views/repo/settings/RepoSettings.vue`
- `web/src/views/repo/settings/RepoSettings.test.ts`
- `web/src/views/repo/settings/General.vue`
- `web/src/views/repo/settings/General.test.ts`
- `web/src/views/repo/settings/Secrets.vue`
- `web/src/views/repo/settings/Secrets.test.ts`
- `web/src/views/repo/settings/Registries.vue`
- `web/src/views/repo/settings/Registries.test.ts`
- `web/src/views/repo/settings/Crons.vue`
- `web/src/views/repo/settings/Crons.test.ts`
- `web/src/views/repo/settings/Badge.vue`
- `web/src/views/repo/settings/Badge.test.ts`
- `web/src/views/repo/settings/Actions.vue`
- `web/src/views/repo/settings/Actions.test.ts`
- `web/src/views/repo/settings/Extensions.vue`
- `web/src/views/repo/settings/Extensions.test.ts`
- `web/src/components/repo/settings/RepoSettingsNav.vue`
- `web/src/components/repo/settings/RepoSettingsNav.test.ts`
- `web/src/components/repo/settings/RepoSettingsSection.vue`
- `web/src/components/repo/settings/RepoSettingsSection.test.ts`
- `web/src/components/repo/settings/RepoSettingsTable.vue`
- `web/src/components/repo/settings/RepoSettingsTable.test.ts`
- `web/src/components/repo/settings/RepoSettingsActionRow.vue`
- `web/src/components/repo/settings/RepoSettingsActionRow.test.ts`
- `web/src/lib/repoBadge.ts`
- `web/src/lib/repoBadge.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- This task packet, task ledger/context/validation/drift artifacts, task graph,
  extraction map, handoff document, `tasks.md`, and generated CodeGraph/SpecNav
  status files.

## Interfaces / Seams

- `RepoWrapper.vue` remains authoritative for repository loading and injected
  `repo` / `repo-permissions` refs.
- `RepoSettings.vue` remains the direct-navigation admin boundary and nested
  settings route outlet.
- `usePaginate` remains the complete branch loader for manual-run and badge
  selectors; `usePagination` remains authoritative for secret, registry, and
  cron collections.
- Existing API client mutation methods and `useAsyncAction` remain
  authoritative for pending state and failure propagation.
- Existing `SecretEdit.vue`, `RegistryEdit.vue`, form components, notifications,
  and route names remain the mutation and navigation seams.

## Components To Create

- Create `RepoSettingsNav.vue` for the repository-only responsive side/horizontal
  settings navigation over the seven existing child routes.
- Create `RepoSettingsSection.vue` for the repeated prototype-aligned section
  header/body/danger presentation.
- Create `RepoSettingsTable.vue` for the shared dense, locally scrollable table
  shell used by secrets, registries, and crons.
- Create `RepoSettingsActionRow.vue` for repeated maintenance/destructive action
  copy plus pending button presentation.
- Create `repoBadge.ts` as a pure formatter for the current badge URL and embed
  formats.

## Components To Reuse

- `Button`, `IconButton`, `Badge`, `FeedbackState`, `PrototypeIcon`,
  `InputField`, existing form fields/editors, `Settings`, `Scaffold`,
  `SecretEdit`, `RegistryEdit`, `useAsyncAction`, `usePaginate`,
  `usePagination`, `useDate`, `useWPTitle`, and injection seams.

## Components To Extract

- Extract only the four contracts shared by real consumers: settings
  navigation, section framing, dense table containment, and action-row
  presentation.
- Keep route data shaping and mutations in their owning pages because secret,
  registry, cron, badge, general, action, and extension contracts differ.
- Do not generalize organization/admin/user settings as part of this repository
  slice.

## API / Data Flow Contracts

- Manual branches come from all pages of `getRepoBranches`; a real
  `createPipeline` response either navigates to the created pipeline or follows
  the existing no-manual-workflow warning path.
- General and extension updates use the existing partial `updateRepo` payloads;
  the repository store remains authoritative after general settings save.
- Secret and registry precedence remains repository over organization over
  global by name/address. Only repository-owned entries may mutate.
- Cron rows and mutations use only `Cron` fields and current API methods.
- Badge output derives only from current repository identity, root path, branch,
  event, workflow, step, and selected output format.
- Repair, activation, deactivation, and deletion remain server-confirmed before
  success notification/navigation.

## State / Error / Empty / Loading Behavior

- Loading: show shared explicit loading feedback before initial branch/resource
  confirmation and preserve form/list content during mutations.
- Empty: distinguish no branches/resources from a pending load; inherited
  resources remain visible and read-only.
- Error: safe GET failures render retry actions where the route owns the load;
  mutations retain the existing `useAsyncAction` error behavior and never show
  optimistic success.
- Disabled: pending manual triggers and destructive mutations cannot be
  submitted repeatedly; invalid variables or missing branches disable the
  manual trigger.
- Permission: `RepoSettings` keeps the admin redirect and manual-run keeps the
  push redirect; no new client permission calculation is introduced.

## TDD Requirement

- Write or update focused behavior tests before or alongside implementation.

## Verification Commands

- `pnpm exec vitest run src/lib/repoBadge.test.ts src/components/repo/settings/RepoSettingsNav.test.ts src/components/repo/settings/RepoSettingsSection.test.ts src/components/repo/settings/RepoSettingsTable.test.ts src/components/repo/settings/RepoSettingsActionRow.test.ts src/views/repo/RepoManualPipeline.test.ts src/views/repo/settings/RepoSettings.test.ts src/views/repo/settings/General.test.ts src/views/repo/settings/Secrets.test.ts src/views/repo/settings/Registries.test.ts src/views/repo/settings/Crons.test.ts src/views/repo/settings/Badge.test.ts src/views/repo/settings/Actions.test.ts src/views/repo/settings/Extensions.test.ts`
- `pnpm exec prettier --check <task production/test/locale/evidence files>`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test -- --run`
- `pnpm build`
- `git diff --check`
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode entry --json`
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode handoff --json`

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- A route needs a new field, endpoint, mutation, route, store contract,
  permission rule, backend behavior, or prototype fixture.
- General settings cannot reload confirmed server state with the existing repo
  store, or an inherited secret/registry cannot be identified from current IDs.

## Unsafe Assumptions

- Prototype secret usage counts, audit history, registry verification/types,
  cron last-result labels, extension cards, and additional repository actions
  are illustrative and unsupported.
- Branch enumeration APIs provide names only; manual-run and badge selectors
  must not infer protection, commit, or availability metadata.
- Extension settings are endpoint configuration fields, not a catalog of
  installable feature toggles.
- A successful repository mutation is known only after the existing API
  resolves; local button state is not server confirmation.
