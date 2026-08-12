# Task Report: 016-administration-routes

## Status

DONE_WITH_CONCERNS

## Files Changed

- Administrator router coverage, settings wrapper/navigation, overview, global
  Secrets, global Registries, repositories, users, organizations, Agents,
  queue, and Forge list/detail/create production components plus focused tests.
- Shared `AgentManager` unmount ownership, queue-stat presentation, existing
  Forge-form regression coverage, English and Simplified-Chinese
  administration copy, and task-local browser producer/verifier artifacts.

## What Changed

- `/admin` now uses a responsive administration settings hierarchy with nine
  existing destinations, administrator denial/redirect behavior, active-route
  grouping for Forge children, and `minmax(0, 1fr)` content containment.
- The overview now presents only current Woodpecker version/update information
  and truthful links to existing administration routes. It does not manufacture
  prototype health, capacity, trend, or activity metrics.
- Global Secrets and Registries preserve their typed pagination and CRUD APIs,
  confirmation, editors, and warnings while adding explicit loading, empty,
  error, retry, confirmed-row, refresh, and mutation-failure behavior.
- Repository, user, and organization administration lists preserve their
  current API calls, pagination, navigation, repair/edit/delete actions, and
  server-confirmed rows. Active failures are visible, failed mutations preserve
  confirmed state, and obsolete list or mutation completions cannot publish.
- Global Agents reuse `AgentManager` with the fixed `admin` owner identity.
  `AgentManager` now invalidates load and mutation ownership on editor changes
  and unmount so an obsolete same-owner or torn-down component cannot report
  success, notify, reload, overwrite current state, or keep a successor editor
  disabled.
- Queue presentation uses only current `QueueInfo`, task labels, pipeline
  navigation, and pause/resume APIs. Confirmed queue data remains visible
  during refresh failure; overlapping requests, mutations, and post-unmount
  completions are lifecycle-owned.
- Forge list, detail, and create use only current `Forge` fields,
  `AdminForgeForm`, and typed CRUD APIs. Detail ownership remains correct
  through `A -> B -> A`; obsolete save/create completions cannot navigate or
  publish, same-route post-save reload failures retain the confirmed editor,
  and active failures preserve confirmed data or form input.
- The task-local browser transaction captures dark Simplified-Chinese
  production and approved-prototype states for rows `28-38` at `1600x1000`
  and `390x844`. The strict verifier requires the exact 44 JSON/PNG pairs,
  shared run identity, expected rows/routes/content, browser health, no raw
  locale keys, and no page-level horizontal overflow.

## TDD Evidence

- Focused tests cover all eleven administration destinations, named route
  resolution, administrator denial, responsive navigation, active Forge
  grouping, loading/empty/error/retry states, confirmed-row continuity,
  pagination, current CRUD/repair/pause/resume behavior, mutation rejection,
  duplicate-action locking, queue overlap/unmount, Agent unmount, Forge
  `A -> B -> A`, same-route post-save reload failure, obsolete save/create
  completion, same-owner editor replacement while an obsolete save remains
  pending, successor-editor submit availability, and structural 390px
  containment.
- The final focused command passes `17` files and `84` tests.
- The complete frontend suite passes `74` files and `422` tests.

## Verification Commands

- PASS: focused administrator/router/shared Agent Vitest (`17` files,
  `84` tests).
- PASS: `pnpm test -- --run` (`74` files, `422` tests).
- PASS: the two unrelated tests that timed out or drifted under prior
  concurrent load pass independently (`2` files, `23` tests), superseding that
  resource-contended failure.
- PASS: targeted Prettier for all task production/test files and locales.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the existing `/web-config.js` and
  `/assets/custom.js` non-module warnings remain.
- PASS: `node evidence/capture_browser.mjs`; final run
  `09279f46-4db9-4a6a-b00f-8340ef3c1fc0` captured `44/44` states from the
  final production bytes.
- PASS: `node evidence/verify_evidence.mjs`; all `44` JSON measurements and
  `44` PNG files have the expected rows, shared run ID, terminal production
  routes, content assertions, browser health, raw-key, and overflow results.
- PASS: evidence JavaScript/Python syntax, locale JSON, changed JSON/JSONL, and
  `git diff --check`.
- BLOCKED: the currently installed SpecNav development contract `0.3.0`
  requires a `nodes/task_items` task graph and one authoritative context row
  per task, while this active change still uses its established
  `phases/vertical_slices` graph and append-only lifecycle context. Handoff
  additionally requires the not-yet-created Verification 2.0
  `verify/v2/runtime-status.json`. No task-local review-format blocker was
  observed, but the global contract cannot return `ok:true` without a
  separately scoped SpecNav data-model/runtime migration.

## Concerns

- This slice intentionally does not copy prototype-only administrator metrics,
  Secret reveal/usage/audit data, Registry connection testing, repository
  activity/storage/pipeline metrics, user invitation/activity, organization
  creation/quotas, Agent telemetry, Queue priority/promote/cancel/throughput,
  or Forge connection status/tests/counts because current contracts do not
  support them.
- Rows `28-38` remain `in-progress`. Task `5.5` still owns complete
  organization/administration/user/authentication/error parity across theme,
  locale, permission, and data-state combinations and the full `A2` claim.
- Repository-wide `pnpm exec prettier --check .` is blocked by `2051`
  pre-existing, untracked macOS `._*` resource-fork files. The task-owned
  production/test files and locales pass explicit Prettier checks; these
  unrelated metadata files are neither modified nor staged.
- The installed SpecNav `0.3.0` entry/handoff contract no longer accepts this
  change's legacy `phases/vertical_slices` task graph and append-only task
  context, and handoff also lacks Verification 2.0 runtime status. Repairing
  those global lifecycle artifacts is outside this administration slice and
  must be handled as an explicit SpecNav migration/recovery task. Handoff also
  reports the truthful blocked contract receipt as
  `validation-log:executed-evidence-failed`; this is not a superseded task-local
  production or review failure.

## Scope Deviations

- None.

## Follow-up Needed

- Continue with baseline tasks `5.3-5.5` for personal settings,
  authentication/error routes, and family-wide permission/parity closure.
- Do not promote rows `28-38` to `verified` or claim complete `A2` from this
  task-local representative evidence.

## Adjudication

Baseline task `5.2` is closed after both independent current-byte reviews
approved task-scoped `A3` and `A4`. Complete `A2` remains open under task
`5.5`, rows `28-38` remain `in-progress`, and the recorded SpecNav `0.3.0`
global lifecycle/runtime migration remains outside this task.
