# Task Report: 018-authorization-boundaries

## Status

DONE

## Files Changed

- Vue Router authorization metadata, navigation guard behavior, router
  regressions, guest Sidebar visibility, Sidebar regressions, task-local
  browser capture/verifier, CodeGraph claims, and SpecNav lifecycle artifacts.

## What Changed

- The existing `/admin/**` parent route now declares both required
  authentication and `system-admin` authorization. Every administration child
  inherits that metadata without changing its path, name, nesting, component,
  or backend enforcement.
- The global router guard uses Vue Router return-value navigation. Guests are
  still sent to login with the current saved destination, regular authenticated
  users are rejected before an administration child renders, and system
  administrators enter the requested child directly.
- Route metadata lookup uses a non-mutating reverse index loop compatible with
  the configured Vite browser target. No `Array.prototype.toReversed()` call
  remains in the authorization guard or production bundle.
- Saved post-login destinations are resolved through the same authorization
  metadata before use. A regular user with a stale `/admin/**` redirect has the
  redirect cleared, receives the existing translated denial notification, and
  remains on the current home destination without an intermediate protected
  navigation.
- Administrator denial awaits the existing active locale loader before
  publishing the one-shot notification. A delayed first-load regression proves
  Simplified-Chinese denial copy is translated rather than emitted as a raw
  i18n key.
- Locale loading failure is isolated from authorization navigation. Direct and
  saved administration denials still return home, keep the administrator
  wrapper unmounted, clear saved state, and emit at most one non-key English
  fallback notification when the locale loader rejects.
- `AdminSettingsWrapper` retains its component-level administrator check as a
  presentation fallback; it is no longer the first direct-route boundary.
- Guest Sidebar rendering now keeps only the brand login destination and
  public help links. Workspace, delivery, infrastructure, build,
  administration, and personal destinations render only for an authenticated
  user; administration destinations remain restricted to `user.admin`.
- Public repository and organization detail routes remain public. Repository
  `pull`, `push`, and `admin` decisions still use `RepoPermissions`, while
  organization `member` and `admin` decisions still use `OrgPermissions`.
  No resource permission is inferred from static route metadata or the
  bootstrap user.
- No role, route, API, type, store, backend middleware, persistence,
  dependency, migration, or authorization algorithm was added.

## TDD Evidence

- The initial focused red run failed because administration routes had no
  system-administrator metadata, a regular authenticated user could navigate
  to `/admin/users`, and the guest Sidebar exposed fifteen authenticated
  application destinations.
- The current focused command passes `8` files and `57` tests. It covers
  administration metadata, guest/regular/admin direct navigation, stale saved
  administration redirects, first-navigation locale readiness, real
  `RouterView` rejection before administrator-wrapper mount, exactly one denial
  notification, direct and saved locale-loader rejection, guest/authenticated/
  admin Sidebar visibility, administrator wrapper fallback, repository
  read/push/admin boundaries, and organization member/admin boundaries.

## Browser Evidence

- Final current-byte run `35884fa1-a6ba-4077-bf2e-c80d409f3c86`
  captured and strictly verified `10/10` states at `1600x1000` and `390x844`.
- Guest public navigation requests `/orgs/1`, terminates at route `org`, keeps
  zero protected Sidebar links, and confirms public organization access was
  not converted into an authenticated route.
- Guest public repository navigation requests `/repos/101`, terminates at route
  `repo`, keeps zero protected Sidebar links, and confirms public repository
  access was not converted into an authenticated route.
- Guest administration navigation requests `/admin/users`, terminates at
  `login`, and keeps zero protected Sidebar links.
- Regular-user administration navigation requests `/admin/users`, terminates
  at `overview`, renders the translated denial notification, and keeps the
  fifteen authenticated non-administrator Sidebar destinations.
- System-administrator navigation requests `/admin/users`, terminates at
  `admin-settings-users`, and renders the twenty authenticated administrator
  Sidebar destinations.
- All ten states have zero page-level horizontal overflow, console errors, and
  runtime exceptions. Capture and verification deep-compare exact ordered
  protected-link inventories, require uniqueness, explicitly reject `/admin`
  links for non-administrators, and check run identity, expected routes, PNG
  signatures, and exact PNG dimensions.
- A negative robustness replay replaces one regular-user link with
  `/admin/secret-unauthorized` while preserving the link count. The verifier
  exits `1` on the exact-inventory assertion, closing the initial review gap.

## Verification Commands

- PASS: focused task Vitest (`8` files, `57` tests).
- PASS: full frontend Vitest (`84` files, `471` tests).
- PASS: targeted task/governance Prettier and complete ESLint with zero
  warnings.
- PASS: Vue TypeScript and Vite build; only the existing `/web-config.js` and
  `/assets/custom.js` non-module warnings remain.
- PASS: current-byte ten-state browser capture, strict verifier, and negative
  equal-count unauthorized-link rejection.
- PASS: evidence JavaScript syntax, task JSON, lifecycle JSONL, CodeGraph
  development refresh, and `git diff --check`.
- BLOCKED OUTSIDE TASK: installed SpecNav `0.3.0` entry exits `2` with `91`
  change-wide blockers; handoff exits `2` with `96`. The first blockers remain
  the established `nodes/task_items` versus `phases/vertical_slices` ownership
  mismatch, append-only task-context incompatibility, and missing
  `verify/v2/runtime-status.json`. No global migration or bypass is attempted.

## Concerns

- Hidden navigation is not authorization. The router now prevents
  non-administrator child loading, the administrator wrapper remains a
  presentation fallback, and backend authorization remains authoritative.
- The first independent spec and quality reviews returned `needs-fix`.
  Findings covered exact navigation-inventory verification, missing public
  repository browser evidence, incomplete final validation receipts, browser
  compatibility of `toReversed()`, asynchronous locale readiness, missing
  wrapper non-mount integration coverage, and missing guest saved-destination
  assertion. All findings are repaired in current bytes and await superseding
  review.
- The first superseding quality review approved, while the superseding spec
  review found that a rejected locale loader could still reject the router
  guard. Current bytes catch that failure, use the normal translation when
  available and the existing English denial copy as a last fallback, and add
  direct/saved rejection regressions. Both reviews must re-evaluate these final
  bytes.
- Importing the existing global i18n singleton into the router still creates a
  deliberate notification dependency, but denial now awaits the existing
  locale readiness seam and has a deterministic delayed-load regression.
- Complete sensory parity is not claimed. Baseline task `5.5`, route-family
  parity statuses, and complete `A2` remain open.

## Scope Deviations

- No implementation scope deviation occurred. The final changes stayed within
  existing route-entry authorization, guest navigation visibility,
  server-backed repository/organization permission regressions, and task-local
  evidence; no new role, route, API, or backend permission was introduced.

## Follow-up Needed

- Keep task `5.5`, route parity statuses, and complete `A2` open.
- Resolve the change-wide SpecNav graph/context/runtime contract migration
  separately before final verification handoff.

## Adjudication

Baseline task `5.4` is closed after final independent spec and quality reviews
approved task-scoped `A3` on current bytes, focused `8/57`, full `84/471`, and
browser run `35884fa1-a6ba-4077-bf2e-c80d409f3c86`. Complete `A2`, task `5.5`,
and route parity statuses remain open. The installed SpecNav global contract
mismatch remains separately recorded and is not bypassed by changing the
established task graph or append-only context model inside this slice.
