# Task Brief: 017-user-auth-routes

## Goal

Authenticated users can manage the existing personal preferences, Secrets,
Registries, CLI/API token, and optional Agents routes, while guests and CLI
clients receive resilient login, local callback authorization, and not-found
surfaces aligned to the approved prototype hierarchy without invented
authentication or account capabilities.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/decision.json`
- `openspec/specs/ui-design/design.md`
- `openspec/specs/system-architecture/design.md`
- `openspec/specs/frontend-backend-data-flow/design.md`
- `openspec/specs/component-architecture/design.md`

## Vertical Slice

Enter `/login` as a guest or enter `/user` as an authenticated user, navigate
the five existing personal settings destinations, load and mutate only current
server-backed resources, authorize a CLI callback only to a validated
localhost port, and recover safely from malformed input, request failures,
obsolete completions, and unknown routes. The settings shell is responsive,
Secret and Registry mutations preserve confirmed data and editor ownership,
token reset redirects only after server success, and login or CLI callback
requests cannot publish after a newer request or unmount.

## In Scope

- Align parity row `1` and rows `39` through `45`: login, personal account
  preferences, personal Secrets, personal Registries, CLI/API, personal Agents,
  CLI authorization, and catch-all not-found.
- Preserve the current named paths, inherited authentication metadata, blank
  login layout, and guest-only login rule; add focused route coverage. Remove
  broad deprecated compatibility matchers only after a focused red regression
  proves they shadow the named catch-all 404 route.
- Replace legacy personal tabs with a responsive five-destination settings
  hierarchy and `minmax(0, 1fr)` content containment.
- Present only real local preferences and authenticated `User` identity fields
  on the account page. Locale, theme, and collapsed log-group settings remain
  client-owned.
- Preserve current organization-scoped Secret, Registry, and Agent APIs for the
  authenticated user's `org_id`.
- Add explicit loading, empty, error, retry, confirmed-row, mutation-failure,
  duplicate-action, latest-request, editor-generation, and unmount behavior.
- Preserve `POST /api/user/token` and `DELETE /api/user/token`; never render an
  undefined token into examples and redirect to logout only after reset
  succeeds.
- Preserve Forge-based authentication through
  `useAuthentication().authenticate(forge.id)` with explicit login
  loading/error/retry/empty states and safe malformed-URL presentation.
- Validate CLI callback ports as decimal TCP ports `1-65535`, send only to
  `http://localhost:<port>/token`, require an OK response and JSON
  `{ "ok": "true" }`, and expose confirm/sending/success/failed/denied/error
  states without rendering or logging the token.
- Rebuild the not-found page with truthful navigation to overview and
  repositories.
- Add English and Simplified-Chinese copy, focused tests, and task-local
  production-versus-approved-prototype desktop/mobile evidence.

## Out Of Scope

- Email/password authentication, SSO provider controls, fake health/features,
  registration, password recovery, or authentication algorithm changes.
- Profile update, avatar synchronization, notification preferences, timezone,
  compact tables, default log wrapping, or fields absent from `User`.
- User-specific Secret, Registry, or Agent endpoints that do not currently
  exist; current organization APIs remain authoritative.
- Token one-time-display semantics, token reveal/copy history, authorized
  application lists, revoke APIs, device/location/code approval, or permission
  scopes absent from the current API.
- Agent online/IP/heartbeat/resource/capacity telemetry or repository binding.
- New routes, API clients, typed fields, stores, backend behavior, persistence,
  dependencies, migrations, or prototype fixtures.
- Baseline tasks `5.4` and `5.5`, complete family-wide permission closure,
  marking rows `1` or `39-45` verified, or claiming complete `A2`.

## Files Allowed

- `web/src/router.test.ts`
- `web/src/router.ts`
- `web/src/views/user/UserWrapper.vue`
- `web/src/views/user/UserWrapper.test.ts`
- `web/src/views/user/UserGeneral.vue`
- `web/src/views/user/UserGeneral.test.ts`
- `web/src/views/user/UserSecrets.vue`
- `web/src/views/user/UserSecrets.test.ts`
- `web/src/views/user/UserRegistries.vue`
- `web/src/views/user/UserRegistries.test.ts`
- `web/src/views/user/UserCLIAndAPI.vue`
- `web/src/views/user/UserCLIAndAPI.test.ts`
- `web/src/views/user/UserAgents.vue`
- `web/src/views/user/UserAgents.test.ts`
- `web/src/components/user/settings/UserSettingsNav.vue`
- `web/src/components/user/settings/UserSettingsNav.test.ts`
- `web/src/views/Login.vue`
- `web/src/views/Login.test.ts`
- `web/src/views/cli/Auth.vue`
- `web/src/views/cli/Auth.test.ts`
- `web/src/views/NotFound.vue`
- `web/src/views/NotFound.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/017-user-auth-routes/**`
- Existing SpecNav task graph, ledger/context/validation/drift, extraction map,
  handoff, `tasks.md`, route parity, and generated CodeGraph/status files for
  task `017`.

## Interfaces / Seams

- Vue Router remains authoritative for guest-only login, inherited personal
  authentication, CLI authentication, catch-all ordering, and current layouts.
- `useAuthentication` remains authoritative for the authenticated user,
  Forge-based sign-in, and logout location.
- `usePagination` remains the page owner for Secret and Registry pagination;
  route pages add active lifecycle and confirmed-row ownership.
- `AgentManager` remains the personal Agent CRUD owner and receives a stable
  user organization identity.
- The CLI callback boundary is the existing local HTTP POST contract used by
  `cli/setup/token_fetcher.go`; the browser page validates the port and response
  without expanding the protocol.

## Components To Create

- `UserSettingsNav.vue` for the five current personal settings destinations.
- Focused tests for the personal wrapper/navigation and all eight destinations.

## Components To Reuse

- `Scaffold`, `FeedbackState`, `Button`, `IconButton`, `Badge`,
  `PrototypeIcon`, `SettingsSection`, `SettingsTable`, `SettingsActionRow`,
  `SecretEdit`, `RegistryEdit`, `AgentManager`, `InputField`, `SelectField`,
  `Checkbox`, `usePagination`, `useNotifications`, `useTheme`,
  `useUserConfig`, and the typed API client.

## Components To Extract

- Keep personal navigation domain-specific because its feature-flagged route
  set and logout action differ from organization and administration settings.
- Reuse existing shared Settings presentation and `AgentManager`; do not
  introduce another generic CRUD or callback framework for this bounded slice.

## API / Data Flow Contracts

- Personal Secrets use only organization Secret list/create/update/delete with
  the authenticated user's `org_id`.
- Personal Registries use only organization Registry list/create/update/delete
  with the authenticated user's `org_id`.
- Personal Agents use only organization Agent list/create/update/delete with
  the authenticated user's `org_id`.
- CLI/API uses only `getToken()` and `resetToken()`.
- Login uses only `getForges()` and `authenticate(forge.id)`.
- CLI authorization retrieves the token only after explicit approval and posts
  `{ token }` or `{ token: "" }` only to a validated localhost callback.
- Successful mutations and callback states belong to the active lifecycle.
  Failed or obsolete completions preserve confirmed values and cannot notify,
  redirect, close a newer editor, or overwrite newer state.

## State / Error / Empty / Loading Behavior

- Loading: display explicit request progress without undefined token text,
  prototype fixtures, or stale identity.
- Empty: distinguish no configured Forge/Secret/Registry/Agent results from
  request failure.
- Error: expose retryable active request failures; retain confirmed rows, token,
  or editor input when recovery is possible.
- Disabled: prevent duplicate token loads/resets and duplicate CLI callback
  approval/denial while active.
- Invalid: reject missing, non-decimal, zero, negative, and out-of-range CLI
  callback ports before token retrieval or network access.
- Feature-disabled: render an explicit personal Agent disabled state on direct
  access while keeping the navigation item hidden.

## TDD Requirement

- Write focused router and component tests before or alongside implementation.
- Cover named/inbound route resolution, auth metadata, responsive navigation,
  real preference/identity rendering, list and mutation state, old pending-save
  editor replacement, token load/reset races, login retry/empty/OAuth/malformed
  URL/unmount, CLI invalid-port/duplicate/failure/abort/unmount behavior, and
  structural `390px` containment.

## Verification Commands

- `pnpm exec vitest run src/router.test.ts src/views/user/UserWrapper.test.ts src/components/user/settings/UserSettingsNav.test.ts src/views/user/UserGeneral.test.ts src/views/user/UserSecrets.test.ts src/views/user/UserRegistries.test.ts src/views/user/UserCLIAndAPI.test.ts src/views/user/UserAgents.test.ts src/views/Login.test.ts src/views/cli/Auth.test.ts src/views/NotFound.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check <task production/test/locale/evidence files>`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Task-local dark Simplified-Chinese production/prototype capture at
  `1600x1000` and `390x844`, exactly `32` states.
- Evidence JavaScript/Python syntax, JSON/JSONL parsing, and
  `git diff --check`.
- `OPENSPEC_TELEMETRY=0 node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode entry --json`

## Stop Conditions

- Scope lock mismatch.
- A fix requires a new route, API, typed field, store, backend behavior,
  persistence, dependency, migration, authentication algorithm, or callback
  protocol.
- Prototype-only profile, login, token, application, device, permission, or
  Agent data becomes necessary.
- CLI authorization cannot be limited to a syntactically valid localhost TCP
  port or would expose the token in UI/logs.
- Final parity closure would require work owned by task `5.4` or `5.5`.

## Unsafe Assumptions

- A responsive hierarchy does not justify unsupported profile editing or
  authentication methods.
- A page called personal Secrets/Registries/Agents does not imply a new user API;
  the current implementation uses organization APIs through `user.org_id`.
- Repeated `getToken()` calls mean the current API does not support a
  one-time-display claim.
- A numeric-looking query string is not a safe callback port until strictly
  validated.
- Task-local tests and representative screenshots do not complete task `5.5`
  or prove complete `A2`.
