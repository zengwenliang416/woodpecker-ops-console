# Task Report: 012-repository-manual-run-settings

## Status

DONE

## Files Changed

- Manual-run route and focused test.
- Repository settings wrapper, general, secrets, registries, crons, badge,
  actions, and extensions routes plus their focused tests.
- Shared repository settings navigation, section, table, and action-row
  components plus focused tests.
- Pure badge URL/embed formatter plus focused tests.
- English and Simplified-Chinese repository settings copy.
- Task-local deterministic Mock API, bounded CDP capture, independent evidence
  verifier, manifest, and ten desktop/mobile PNG screenshots.
- This task packet plus task ledger/context, validation, drift, CodeGraph, and
  SpecNav status artifacts.

## What Changed

- Manual-run now loads all real branch pages, selects the repository default
  branch when available, distinguishes loading/error/empty states, validates
  variables, prevents duplicate submission, and retains the existing
  create-pipeline result navigation and no-manual-workflow warning. Repository
  changes reset its form and request generations prevent obsolete branch
  fulfillment or rejection from replacing the active repository state.
- Repository settings use a responsive seven-route navigation: a desktop
  sidebar and mobile horizontal scroll surface, while the existing direct-route
  administrator gate remains authoritative. Settings and manual-run permissions
  are re-evaluated for every repository/permission owner change, and protected
  content stays hidden until the active repository permissions are confirmed.
- General settings are grouped into pipeline behavior, execution policy, and
  trust sections using only current `RepoSettings` fields and the existing
  update/reload flow. General and extension form snapshots are owned by the
  current repository ID and are replaced before another repository can submit.
- Secrets and registries preserve repository-over-organization-over-global
  precedence, render inherited records read-only, and use dense local-scroll
  tables with explicit loading, retryable GET error, and empty states. Route-
  owned confirmed snapshots preserve visible rows when pagination clears for a
  refresh that later fails, while repository changes discard the old snapshot.
- Crons show only current schedule, branch, timezone, enabled, and next
  execution values while preserving run/create/update/delete APIs, including
  manual execution of disabled schedules. Cron edits use detached confirmed
  snapshots so cancel or mutation failure cannot alter the list.
- Badge generation uses a pure formatter for the existing URL, Markdown, and
  HTML formats and presents the current branch/event/workflow/step controls
  beside a live preview. Empty branch results no longer fabricate a default
  option and request generations discard obsolete repository responses.
- Actions separate maintenance and danger operations without adding cache,
  export, or archive behavior. Extensions group the current endpoint fields and
  signature key without inventing a marketplace or toggle model.
- Manual/Cron runs and General, Secrets, Registries, Crons, Actions, and
  Extensions mutations capture both the repository and its monotonic route
  lifecycle generation. Completion from an obsolete route lifetime cannot
  navigate, notify, close an editor, reload, or overwrite the current
  repository even after an `A -> B -> A` sequence.
- Secrets, Registries, and Crons wait for the watcher-owned replacement load
  after pagination resets from a page greater than one. Confirmed rows remain
  visible until the real page-one request settles and remain preserved when
  that request fails.
- Browser capture reproduced a mobile Secrets defect where the `821px` table
  still expanded the `390px` document despite the visible local scroll shell.
  `RepoSettingsTable` now applies `contain: layout paint` to the scroll region;
  the table remains locally scrollable at `821/345` while the document is
  contained at `390/390`.

## TDD Evidence

- Focused tests pass `14` files and `75` tests, covering the four shared
  boundaries, badge formatting, manual-run lifecycle, permission navigation,
  reactive allowed-to-denied repository switching, supported settings fields,
  stale fulfill/reject races, retryable collection failures, inherited resource
  precedence, confirmed-row refresh preservation, realistic page-two reset and
  asynchronous page-one replacement timing, same-ID `A -> B -> A` GET and
  mutation ownership, resource save/delete completion, cron save/delete/run
  completion, cron confirmed state, badge empty/error ownership, action
  mutation failures, and extension submission.
- The complete frontend suite passes `49` files and `286` tests.
- The table containment regression is independently exercised by current
  desktop/mobile browser measurements in addition to the shared table unit
  test.

## Verification Commands

- PASS: exact focused Vitest command from `brief.md` (`14` files, `75` tests).
- PASS: `pnpm test -- --run` (`49` files, `286` tests).
- PASS: targeted Prettier for production, tests, locales, and evidence scripts.
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the existing non-module warnings for
  `/web-config.js` and `/assets/custom.js` remain.
- PASS: Python AST parse plus both evidence-script Node syntax checks.
- PASS: `git diff --check`.
- PASS: `node evidence/capture_browser.mjs && node
evidence/verify_evidence.mjs`.
- PASS: ten checksum-valid `1280x720` / `390x844` screenshots covering
  manual-run, general settings, Secrets, Badge, and Actions.
- Browser measurements prove exact routes and expected real text, seven
  settings destinations, zero raw locale keys, zero console errors, zero
  unexpected HTTP errors, and no document/main horizontal overflow. Mobile
  Secrets specifically proves `390/390` document containment with an
  `821/345` local table scroll region and a real `scrollLeft` transition from
  `0` to `120`.

## Review Fixes

- First-round independent spec and quality reviews both returned `needs-fix`.
- The implementation now owns state by repository ID across Manual, General,
  Secrets, Registries, Crons, Badge, and Extensions.
- Secrets, Registries, and Crons catch route-owned GET failures, clear loading
  through the existing pagination contract, render retry, and preserve any
  already-confirmed rows.
- Badge empty results and obsolete fulfill/reject races, Manual lifecycle and
  mutation failures, General/Extensions repository switching, resource retry,
  Cron edit isolation, and Actions duplicate/failure behavior are covered by
  focused regressions.
- Reactive admin/push gates cover allowed-to-denied repository changes, and
  deferred success/rejection regressions prove obsolete Manual/Cron and settings
  mutations cannot affect the new repository.
- Secrets, Registries, and Crons now retain confirmed rows across active refresh
  failure and discard obsolete fulfilled/rejected repository refreshes using
  realistic pagination clear/load/commit tests.
- Secrets, Registries, and Crons bind route-local errors to the active reload
  generation, so an old `A` rejection cannot pollute a newer successful `A`
  after `A -> B -> A`. General also skips its repository reload when the save
  owner is obsolete.
- Deferred General, Secrets, Registries, and Extensions regressions now prove
  obsolete success and rejection cannot notify, close or overwrite the current
  editor, or reload a repository after the route owner changes.
- Manual, General, Secrets, Registries, Crons, Actions, and Extensions now use
  an independent repository lifecycle generation for mutation/run completion.
  Deferred `A -> B -> A` regressions prove an old A completion cannot become
  current merely because the route returns to repository A.
- Secrets, Registries, and Crons now wait for the watcher-started replacement
  request when a page-greater-than-one reset returns before the page-one load.
  Behaviorally exact regressions prove the last confirmed rows remain visible
  during loading and after rejection.
- Resource delete and Cron save/delete regressions substantiate the same
  lifecycle guard beyond the previously covered save/run paths.
- Earlier implementation, first-round review-fix, v2, v3, and v4 receipts are
  explicitly overturned by the current-byte v5 receipts and regenerated browser
  manifest.

## Concerns

- The browser captures record the existing `/assets/custom.js` development hook
  `404` separately and reject every other HTTP error. This slice does not create
  or change that hook.
- Baseline tasks `4.4` and `4.5` still own complete repository-family
  regression and equivalent-state prototype parity across themes, locales,
  permissions, and additional data states.

## Scope Deviations

- None. No backend, API endpoint/type, router, `RepoWrapper`, repository store,
  authentication, permission calculation, dependency, organization/admin/user
  settings route, or approved-prototype file changed.

## Follow-up Needed

- Continue baseline task `4.4` for repository-family regression coverage.
- Keep baseline task `4.5` open for complete sensory/parity closure.

## Adjudication

Baseline task `4.3` is closed after current-byte independent spec and quality
reviews both approved the implementation. The concerns above remain
non-blocking and are bounded to existing development-hook behavior and later
`4.4`/`4.5` scope.
