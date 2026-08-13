# Task Report: 003-shared-feedback-primitives

## Status

DONE

## Files Changed

- `web/src/components/atomic/FeedbackState.vue`
- `web/src/components/atomic/FeedbackState.test.ts`
- `web/src/components/atomic/Button.vue`
- `web/src/components/atomic/Button.test.ts`
- `web/src/components/atomic/IconButton.vue`
- `web/src/components/atomic/IconButton.test.ts`
- `web/src/components/atomic/Error.vue`
- `web/src/components/atomic/Error.test.ts`
- `web/src/views/repo/RepoBranches.vue`
- `web/src/views/repo/RepoBranches.test.ts`
- `web/src/views/repo/pipeline/PipelineDebug.vue`
- `web/src/views/repo/pipeline/PipelineDebug.test.ts`
- `web/src/views/RepoAdd.vue`
- `web/src/views/RepoAdd.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`

## What Changed

- Added `FeedbackState` as a display-only shared component with loading, empty,
  error, permission, disabled, and stale variants, semantic live regions,
  translated copy supplied by consumers, compact layout, and an action slot.
- Replaced repository-branch loading and empty blocks with the shared state,
  without changing `usePagination` or branch ordering.
- Replaced the pipeline-debug permission error card with the shared permission
  state while keeping the existing injected `repoPermissions.push` source.
- Added a compact stale explanation to the existing repository identity
  conflict while preserving both real repository rows and the existing settings
  action.
- Repaired `Button` and `IconButton` so `isLoading` implies native disabled and
  `aria-busy` behavior. Busy or explicitly disabled links render as buttons and
  cannot navigate or be triggered repeatedly.
- Added `role="alert"` and assertive live-region semantics to the existing
  atomic `Error` component used by login and administrator information routes.
- Added English and Simplified-Chinese feedback copy without changing other
  locale fallback behavior.

## TDD Evidence

- Initial focused run produced one missing-component suite plus five expected
  failures and three passes. Failures covered loading link navigation, icon
  loading navigation, missing error alert semantics, repository branch
  page-local loading markup, and pipeline debug page-local permission markup.
- After implementation, the focused suite passed 7 files and 21 tests,
  including explicit disabled route links, enabled and blocked HTTP links,
  secure external icon links, submit-button type preservation while busy, and
  the repository stale-conflict integration.
- TypeScript and ESLint caught test-only API/title issues during broadening;
  those tests were corrected without weakening production assertions.
- Full regression passed 22 files and 112 tests.

## Browser Evidence

- PASS: `/repos/add` at `1600x1000` and `390x844` rendered the compact stale
  state with Simplified-Chinese long copy, two repository records for the real
  conflict, the existing settings action, and a native disabled conflict
  button. Page-level horizontal overflow was false at both viewports.
- PASS: `/repos/17/branches` at `1600x1000` and `390x844` rendered the full
  shared empty state without page-level horizontal overflow.
- PASS: English long copy remained visible at `1600x1000`, and the real
  activation action entered a native disabled busy state with
  `aria-busy="true"` and `aria-disabled="true"` while the delayed Mock API
  request was in flight.
- PASS: At `390x844`, the compact panel copy measured
  `scrollWidth == clientWidth` and `scrollHeight == clientHeight`; no hidden
  local text overflow was detected.
- Screenshots:
  `/tmp/woodpecker-feedback-compact-zh-desktop-1600x1000.jpg`,
  `/tmp/woodpecker-feedback-full-zh-desktop-1600x1000.jpg`,
  `/tmp/woodpecker-feedback-compact-zh-mobile-390x844.jpg`,
  `/tmp/woodpecker-feedback-full-zh-mobile-390x844.jpg`,
  `/tmp/woodpecker-feedback-compact-en-desktop-1600x1000.jpg`, and
  `/tmp/woodpecker-feedback-busy-en-desktop-1600x1000.jpg`.

## Verification Commands

- PASS: `pnpm exec vitest run src/components/atomic/FeedbackState.test.ts src/components/atomic/Button.test.ts src/components/atomic/IconButton.test.ts src/components/atomic/Error.test.ts src/views/RepoAdd.test.ts src/views/repo/RepoBranches.test.ts src/views/repo/pipeline/PipelineDebug.test.ts` (7 files, 21 tests).
- PASS: `pnpm test -- --run` (22 files, 112 tests).
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`.
- PASS: targeted Prettier for all 16 allowed files.
- PASS: `git diff --check`.

## Concerns

- Vite build continues to report the two pre-existing non-module script warnings
  for `/web-config.js` and `/assets/custom.js`.
- Repository-wide `pnpm format:check` remains outside this slice because the
  known AppleDouble metadata issue is not in the allowed file set. Every
  task-owned file passes targeted Prettier.
- Browser logs contained no runtime errors. Existing locale-load fallback and
  Vue Router `next()` deprecation warnings remain outside this slice.

## Scope Deviations

- None. No API, store, route, permission, persistence, or dependency file was
  changed.

## Follow-up Needed

- Adopt `FeedbackState` in later route-family slices when a real loading, empty,
  error, permission, disabled, or stale contract is present. Do not replace
  unique field-level validation or notification-only feedback mechanically.

## Adjudication

Task `2.3` may close after independent review because every allowed production
and test file passes focused/full Vitest, targeted formatting, ESLint,
TypeScript, Vite build, diff checks, and targeted desktop/390px browser review.
The existing build/browser warnings and full-tree AppleDouble formatting issue
predate this task and do not invalidate its task-scoped evidence.
