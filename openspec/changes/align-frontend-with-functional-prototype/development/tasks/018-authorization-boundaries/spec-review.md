# Final Current-Byte Spec Review: 018-authorization-boundaries

## Verdict

approved

## Missing Requirements

- None found within the locked task `018` scope.
- The `/admin/**` route family inherits required authentication and
  `system-admin` authorization without changing its existing paths, names,
  nesting, components, or backend enforcement.
- Guests retain saved-destination login behavior. Regular authenticated users
  are redirected to `overview` before an administration wrapper mounts, while
  system administrators reach the requested administration child.
- Direct and saved administration denial no longer depend on locale-loader
  success. A rejected `setI18nLanguage()` Promise still resolves navigation,
  clears saved state when applicable, keeps the administration wrapper
  unmounted, and emits exactly one non-raw-key fallback notification.
- Guest Sidebar rendering excludes authenticated workspace, delivery,
  infrastructure, build, administration, and personal destinations while
  preserving the login brand destination and public help links.
- Public repository and organization routes remain available to guests.
  Repository and organization authorization continues to use the existing
  server-returned `RepoPermissions` and `OrgPermissions` objects.

## Extra Behavior

- No new role, permission field, route, API, store, backend behavior,
  persistence, dependency, migration, or static resource-authorization
  algorithm was found.
- Importing the existing i18n and notification seams into the router is a
  bounded implementation detail for the required denial feedback. Navigation
  now fails open only for notification localization while authorization
  remains fail closed.
- Task-local capture and verification scripts are evidence infrastructure and
  are not imported by the production frontend.

## Misunderstood Requirements

- None found in the current bytes.
- `AdminSettingsWrapper` remains a presentation fallback; the global router
  guard is the first direct-route system-administrator boundary.
- Sidebar visibility mirrors authentication and administrator state but is not
  treated as authorization enforcement.
- Repository `pull`, `push`, and `admin` decisions remain owned by
  `getRepoPermissions()`. Organization `member` and `admin` decisions remain
  owned by `getOrgPermissions()`.
- Complete route-family sensory parity and complete `A2` remain outside this
  task and are not claimed by this approval.

## Cannot Verify From Diff

- Final source and receipts prove current behavior, not whether every test was
  written before the corresponding production edit.
- This reviewer independently passed the focused command at `8` files and `57`
  tests, complete ESLint, Vue TypeScript, targeted production/test Prettier,
  the strict evidence verifier, and `git diff --check`.
- The reviewer independently inspected representative guest public-repository,
  regular-user denial, and administrator mobile screenshots. Their current
  JSON records bind to run `35884fa1-a6ba-4077-bf2e-c80d409f3c86`, expected
  routes and actors, desktop or `390x844` dimensions, exact protected-link
  inventories, zero overflow, and zero browser-health failures.
- An equal-count malicious-link replacement was independently reproduced in a
  temporary evidence copy. Replacing the regular user's `/` link with
  `/admin/secret-unauthorized` is rejected by the exact-link assertion with
  exit `1`.
- Full frontend Vitest (`84` files / `471` tests), Vite build, evidence
  syntax/JSON/JSONL checks, and the final browser capture were confirmed from
  the current `system-executed` validation receipt rather than rerun during
  this review.
- The installed SpecNav `0.3.0` handoff remains blocked by established
  change-wide task-graph/context incompatibilities and missing
  `verify/v2/runtime-status.json`. These are not task-local implementation or
  review-format failures.

## Acceptance Assertions Verified

- `A3` (task `018` scope only): current bytes pass focused and recorded full
  Vitest, targeted formatting, zero-warning ESLint, Vue TypeScript, Vite build,
  evidence syntax and parsing, strict desktop/`390px` browser verification,
  malicious-link rejection, and whitespace checks. Run
  `35884fa1-a6ba-4077-bf2e-c80d409f3c86` verifies all `10` expected states,
  including guest public organization/repository access and guest, regular,
  and administrator administration boundaries.

## Required Fixes

- None for task `018-authorization-boundaries`.
- Keep complete `A2` and the later complete route-family parity work open.

## Validation Performed

- PASS: focused Vitest, `8/8` files and `57/57` tests.
- PASS: complete ESLint and Vue TypeScript.
- PASS: targeted Prettier for changed production and test files.
- PASS: strict evidence verifier, `10/10` states for run
  `35884fa1-a6ba-4077-bf2e-c80d409f3c86`.
- PASS: equal-count unauthorized-link negative replay rejected with exit `1`.
- PASS: `git diff --check`.
- CONFIRMED FROM CURRENT SYSTEM-EXECUTED RECEIPT: full frontend Vitest
  `84/84` files and `471/471` tests, Vite build, evidence syntax/JSON/JSONL,
  final browser capture, and CodeGraph refresh.
