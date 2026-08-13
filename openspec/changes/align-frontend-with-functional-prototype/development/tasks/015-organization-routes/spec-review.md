# Spec Review: 015-organization-routes

## Verdict

approved

## Missing Requirements

- No task-scoped requirement is missing from the current allowed-file diff.
- `OrgWrapper` owns and provides one monotonic organization lifecycle. It
  increments that lifecycle before clearing the injected organization and
  permissions, and invalidates it again on unmount. Descendant list and
  mutation ownership therefore remains invalid after a real child unmount,
  including an `A -> B -> A` return.
- Organization, permission, repository, Secret, Registry, and Agent
  completions are covered by focused active/obsolete fulfilled/rejected
  regressions. The new unmount regressions prove obsolete closures remain inert
  after the injected organization is cleared instead of only simulating a
  same-instance prop change.
- `repoStore.loadRepos()` applies latest-request-wins before repository,
  owned-ID, or last-pipeline writes. The focused store test proves an obsolete
  request cannot hydrate any of those shared states after the current request.
- Active Secret, Registry, and Agent failures preserve the editor and confirmed
  rows, while rejected pagination refreshes preserve confirmed rows. Obsolete
  mutation failures do not notify, reload, or publish success.
- Organization members retain the browse route while settings use the existing
  administrator permission. Agent navigation and direct-route content both
  honor `userRegisteredAgents`.

## Extra Behavior

- No new route, endpoint, payload field, store, backend behavior, dependency,
  permission calculation, Registry URL behavior, migration, or prototype-only
  operational value was found.
- The shared Settings extraction is supported by both organization and existing
  repository consumers. The repository-named presentation files are removed
  rather than retained as compatibility wrappers.
- Prototype-only members, metrics, Secret reveal/usage, Registry verification,
  Agent binding, and Agent online/resource telemetry remain absent as required.

## Misunderstood Requirements

- None found in the current bytes.
- Parity rows `24-27` correctly remain `in-progress`. The report explicitly
  leaves baseline task `5.5` and full route-family assertion `A2` open.
- Frontend administrator visibility remains an interface aid and does not
  replace the existing server authorization boundary.

## Cannot Verify From Diff

- Final bytes cannot establish whether every test was written before or
  alongside its implementation.
- The task-local browser transaction is intentionally representative dark
  Simplified-Chinese desktop and `390x844` evidence. It verifies this slice's
  routes, content, containment, health, and exact artifact inventory, but does
  not establish the full theme, locale, permission, and data-state equivalence
  required for `A2`.
- The exact allowed production/test inventory contains `43` changed paths:
  `21` modified, `6` deleted repository-named shared-component paths, and `16`
  new production/test paths. Task-local review/evidence artifacts and approved
  generated SpecNav records are separately within the brief's allowed scope.

## Acceptance Assertions Verified

- `A3`: verified for task `015` only. Current-byte system receipts pass
  task-scoped Prettier, complete ESLint, TypeScript, full Vitest
  (`59` files / `351` tests), Vite build, JSON/JSONL parsing, SpecNav entry,
  and diff checks. This reviewer independently passed the focused suite
  (`13` files / `44` tests), supporting repository suite
  (`8` files / `62` tests), evidence-script syntax, and `git diff --check`.
  This reviewer also independently reran the strict evidence verifier for run
  `f5452fe5-ef9d-4b00-9126-20404e946858`, which passed exactly `16` paired
  measurements/screenshots at desktop and `390px`.
- `A4`: verified for task `015` only. The code and focused tests establish
  latest-request-wins repository hydration, monotonic organization lifecycle
  ownership, inert obsolete fulfilled/rejected list/save/delete completions,
  and preservation of confirmed rows and editor input after active failures.
- Baseline task `5.5` remains open, and rows `24-27` remain `in-progress`.

## Required Fixes

- None for task `015`.
- Continue baseline tasks `5.2-5.5`; do not promote rows `24-27` to `verified`
  or close full `A2` from this task review.

## Validation Performed

- PASS: focused organization/router/shared/store Vitest, `13/13` files and
  `44/44` tests. An initial parallel run timed out only the router dynamic
  import test; the router passed independently (`1/1`, `4/4`) and the complete
  focused command then passed serially.
- PASS: supporting repository settings Vitest, `8/8` files and `62/62` tests.
- PASS: strict evidence verifier, exact run
  `f5452fe5-ef9d-4b00-9126-20404e946858`, `16` measurements and `16`
  screenshots with exact state IDs and JSON/PNG basename pairs.
- PASS: evidence JavaScript syntax, Python syntax compilation, exact inventory
  inspection, and `git diff --check`.
- CONFIRMED FROM CURRENT SYSTEM-EXECUTED RECEIPTS: full frontend
  `59/59` files and `351/351` tests, task-scoped Prettier, ESLint, TypeScript,
  Vite build, JSON/JSONL parsing, and SpecNav entry.
