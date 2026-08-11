# Spec Review: 012-repository-manual-run-settings

## Verdict

approved

## Missing Requirements

- None found. Manual-run loads all real branch pages, selects a confirmed
  default branch when available, exposes loading/error/empty states, validates
  variables, prevents duplicate submission, and preserves the existing
  pipeline-result and no-manual-workflow navigation behavior.
- Repository settings retain the seven established route names and existing
  administrator boundary. General, Secrets, Registries, Crons, Badge, Actions,
  and Extensions use only established fields, API methods, permissions,
  editors, mutations, and navigation outcomes.
- Manual, General, Secrets, Registries, Crons, Actions, and Extensions now
  capture both repository ID and a monotonic repository lifecycle generation.
  Their mutation/run completions require both owners to match before notifying,
  closing an editor, reloading or overwriting state, emitting close, or
  navigating. Returning through `A -> B -> A` cannot make the first A request
  current again.
- Secrets, Registries, and Crons retain confirmed rows while pagination resets.
  They wait for a watcher-started page-one replacement when the previous page
  was greater than one, retain the snapshot on recoverable failure, release it
  after active success, and reject obsolete fulfillment/error ownership.

## Extra Behavior

- None found. No backend, API/type, router, repository-store, authentication,
  permission-calculation, dependency, shared organization/admin/user settings,
  or approved-prototype file was changed.
- No prototype-only repository metadata, registry verification, secret
  usage/audit information, cron result history, badge style model, cache,
  export, archive, or extension marketplace behavior was introduced.
- The four extracted repository-settings components remain limited to shared
  navigation, section, dense-table, and action-row presentation contracts.

## Misunderstood Requirements

- None found. Repository identity and route-lifecycle identity are now separate
  ownership conditions for asynchronous completion.
- Recoverable error preservation applies to page-greater-than-one resets as
  well as page-one refreshes. The implementation now keeps the last confirmed
  rows visible until the asynchronous replacement settles and preserves them
  when it fails.
- Dense tables remain locally scrollable without causing page-level mobile
  overflow, while inherited Secrets and Registries remain visible and
  read-only.

## Cannot Verify From Diff

- Final bytes cannot prove the original TDD ordering.
- This reviewer independently ran the exact focused command from `brief.md`;
  all `14` files and `75` tests passed. The pagination composition suite passed
  `1` file and `9` tests, and `git diff --check` passed.
- Current system-executed v5 receipts record the full frontend suite at
  `49` files / `286` tests and passing targeted Prettier, ESLint, TypeScript,
  Vite build, Python/Node syntax, diff, and JSONL checks. Validation-log entries
  261-264 explicitly overturn the v4 receipts.
- The focused tests genuinely exercise `A -> B -> A` obsolete success and
  rejection ownership across the affected routes. They cover navigation,
  emitted close, notification, editor preservation, state overwrite and reload
  suppression, including Secret/Registry deletion and Cron save/delete/run
  paths.
- This reviewer independently ran `verify_evidence.mjs`; all `10`
  checksum-valid `1280x720` and `390x844` captures passed route/text,
  navigation, locale, console, network, containment, and local table-scroll
  checks.
- Complete route-matrix and equivalent-state sensory closure remain assigned
  to baseline tasks `4.4` and `4.5`; this task does not independently establish
  change-wide `A1` or `A2`.

## Acceptance Assertions Verified

- `A3`: verified for task `012` by the current system-executed v5 formatting,
  ESLint, TypeScript, focused/full Vitest, Vite build, diff, JSONL, and browser
  receipts, plus independently reproduced focused tests, pagination tests,
  evidence verification, and `git diff --check`.
- `A4`: verified for task `012` through real branch/resource/cron values,
  explicit fallbacks and loading/error/empty states, request-generation-owned
  loads, lifecycle-generation-owned mutations/runs, confirmed-row preservation
  for synchronous and page-two asynchronous resets, and current regressions for
  obsolete fulfillment, rejection, reload, notification, editor-close, emit,
  and navigation effects.

## Required Fixes

- None. The current v5 implementation satisfies the reviewed task
  requirements.
