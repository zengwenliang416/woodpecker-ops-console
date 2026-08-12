# Quality Review: 018-authorization-boundaries

## Verdict

approved

This final current-byte review found no remaining task-local quality blocker.
The locale-loader rejection identified after the first superseding review is
now isolated from authorization navigation, with direct and saved-route
regressions proving denial still completes safely. All earlier compatibility,
locale-readiness, duplicate-denial, saved-destination, and evidence-inventory
findings also remain closed.

## Separation Of Concerns

- Vue Router owns static authentication and system-administrator entry.
  Repository and organization wrappers continue to own their asynchronous
  server-backed `RepoPermissions` and `OrgPermissions`; no resource permission
  is inferred from route metadata or the bootstrap user.
- `findRouteMeta` remains a small pure route-hierarchy seam. It reads the
  nearest ancestor value through a non-mutating reverse index loop and is
  reused for current and saved destinations
  (`web/src/router.ts:24-32,487-489,513`).
- The guard clears and resolves a saved destination before returning it, sends
  guests to login while preserving the requested path, and rejects regular
  users before an administration wrapper or child component renders
  (`web/src/router.ts:509-532`).
- `AdminSettingsWrapper` remains an independent presentation fallback rather
  than the normal direct-route boundary. Real `RouterView` coverage proves the
  route guard produces one notification and zero wrapper mounts for a regular
  user's direct administration navigation.

## Component Cohesion / Coupling

- The Sidebar change is cohesive with global navigation visibility. All four
  application sections and the personal footer require an authenticated user;
  the help section remains public; administrator links retain the narrower
  `user?.admin` condition (`Sidebar.vue:27-169`).
- Section-level `v-if="user"` is appropriately simple for the current
  inventory because every link inside those sections is authenticated. Exact
  browser inventories make a future accidental public/protected
  reclassification visible.
- The router intentionally depends on the existing i18n and notification seams
  for denial feedback. Authorization state still comes only from
  `useAuthentication`, and locale loading cannot alter the access decision or
  prevent the redirect.
- The fallback wrapper retains similar denial effects by requirement, but
  mounted integration coverage proves the two layers do not both execute on
  the normal route path.

## Test Quality

- Independent current-byte focused Vitest passed `8/8` files and `57/57`
  tests. It covers inherited administrator metadata, guest/regular/admin direct
  entry, guest saved continuation, stale saved-administration rejection,
  delayed first-locale loading, wrapper non-mount, exactly one notification,
  direct and saved locale-loader rejection, Sidebar roles, fallback denial,
  and existing repository/organization permission behavior.
- The delayed-locale test holds `setI18nLanguage` pending, proves no early
  notification is emitted, then resolves it and requires Simplified-Chinese
  denial copy (`web/src/router.test.ts:433-465`).
- The direct rejection regression makes locale loading fail and requires the
  router push to resolve, terminal `overview`, zero administrator-wrapper
  mounts, and one English denial notification
  (`web/src/router.test.ts:488-513`).
- The saved rejection regression independently requires the navigation to
  resolve, terminal `overview`, the stale redirect to be cleared, and one
  English denial notification (`web/src/router.test.ts:515-542`).
- Independent full frontend Vitest passed `84/84` files and `471/471` tests.
  Complete ESLint, Vue TypeScript, Vite build, targeted Prettier, evidence
  syntax/JSON, lifecycle JSONL, and `git diff --check` also pass.

## Error Handling

- Guest navigation to authenticated routes preserves the full requested path
  before redirecting to login. A stale saved administrator destination is
  cleared and rejected without intermediate protected navigation.
- Administrator denial first attempts to make the active locale ready. A
  locale-loader rejection is intentionally isolated because authorization
  navigation must not depend on a translation chunk loading successfully
  (`web/src/router.ts:495-500`).
- After the load attempt, the normal i18n translation is used when available.
  Only when translation still returns the raw key does the guard use the
  existing English denial copy, preventing a raw-key notification without
  weakening the redirect (`web/src/router.ts:501-506`).
- Direct and saved-route failure tests prove the loader exception cannot escape
  the guard, leave a protected route active, preserve a stale redirect, mount
  administration content, or produce duplicate feedback.
- No fabricated permission, optimistic success, silent authorization bypass,
  or alternate fallback authorization decision was introduced.

## Reuse / Duplication

- Existing route metadata, authentication, user config, locale loader,
  notifications, Sidebar, Navbar, administrator wrapper, repository wrappers,
  and organization wrappers are reused. No role, API, store, dependency, or
  permission framework was introduced.
- Ancestor metadata lookup is centralized in `findRouteMeta`. The
  implementation neither mutates Vue Router's matched arrays nor depends on
  `Array.prototype.toReversed()`.
- Exact regular and administrator link inventories are independently enforced
  by the evidence verifier through deep comparison, uniqueness, and
  non-administrator `/admin` exclusion.
- **LOW residual risk:** the English fallback literal duplicates the value at
  `assets/locales/en.json`. The duplication is deliberately bounded to the
  exceptional case where locale resources cannot provide that value; it avoids
  adding a new dependency or allowing authorization navigation to fail.

## Complexity Delta

- The production change remains small and linear: one typed metadata helper,
  one inherited administrator marker, return-value guard control flow, one
  failure-tolerant denial closure, and six Sidebar condition/target
  adjustments.
- The denial closure now has an explicit two-stage policy: attempt locale
  readiness, then translate with a non-key fallback. The added branch is
  proportionate to keeping authorization reliable during chunk failure and is
  covered on both direct and saved paths.
- Test complexity increased materially in `router.test.ts`, but each mock has a
  specific purpose: notification count, locale readiness/rejection, or wrapper
  mount detection. The tests exercise behavior through the real router instead
  of duplicating the guard algorithm.
- Final evidence run `35884fa1-a6ba-4077-bf2e-c80d409f3c86` passes exact route,
  ordered link inventory, uniqueness, role exclusion, viewport, PNG, overflow,
  and browser-health checks for ten desktop/mobile states.
- An independent equal-count substitution of `/overview` with
  `/admin/secret-unauthorized` was correctly rejected with verifier exit `1`;
  the original evidence was restored and passed again.
- **LOW residual risk:** the evidence producer's forced `SIGKILL` path does not
  wait again for confirmed child exit before profile deletion. This affects
  rare harness cleanup after an already timed-out shutdown, not the verified
  authorization behavior or current artifacts.

## Required Fixes

None for task `018` / baseline task `5.4`.

Keep task `5.5`, route-parity statuses, and complete `A2` open; this approval is
limited to the final authorization-boundary slice and task-scoped `A3`.

## Acceptance Assertions Verified

- `A3`: verified for task `018` only through focused Vitest (`8/57`), full
  Vitest (`84/471`), targeted Prettier, zero-warning ESLint, Vue TypeScript,
  Vite build, syntax/JSON/JSONL checks, `git diff --check`, and exact ten-state
  desktop/mobile browser run
  `35884fa1-a6ba-4077-bf2e-c80d409f3c86`.
- Complete `A2` is not verified or claimed. Sensory parity and remaining route
  families stay owned by baseline task `5.5`.

## Validation Performed

- PASS: independent focused task Vitest, `8` files and `57` tests.
- PASS: independent full frontend Vitest, `84` files and `471` tests.
- PASS: independent `pnpm lint`, `pnpm typecheck`, and `pnpm build`; build
  retains only the existing non-module warnings for `/web-config.js` and
  `/assets/custom.js`.
- PASS: independent targeted Prettier, evidence JavaScript syntax, task JSON,
  lifecycle JSONL parsing, and `git diff --check`.
- PASS: independent evidence verifier for ten JSON/PNG states under run
  `35884fa1-a6ba-4077-bf2e-c80d409f3c86`.
- PASS: independent negative verifier replay; an equal-count unauthorized-link
  substitution exited `1`, after which the original evidence was restored and
  reverified.
- BLOCKED outside this task review: installed SpecNav Development `0.3.0`
  entry/handoff remain blocked by the established change-wide task-graph and
  append-only context incompatibility plus missing
  `verify/v2/runtime-status.json`. These receipts identify no task-local
  implementation, evidence, or review-format blocker.
