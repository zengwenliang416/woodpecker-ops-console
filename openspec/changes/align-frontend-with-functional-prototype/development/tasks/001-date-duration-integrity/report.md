# Task Report: 001-date-duration-integrity

## Status

DONE_WITH_CONCERNS

## Files Changed

- `web/src/compositions/useDate.ts`
- `web/src/compositions/useElapsedTime.ts`
- `web/src/compositions/useDate.test.ts`
- `web/src/compositions/useElapsedTime.test.ts`

## What Changed

- Added shared validity guards for missing, negative, non-finite, unsafe, and invalid date/duration values.
- Invalid user-visible values now resolve to the deterministic neutral fallback `—` before reaching `Intl`.
- Zero epoch timestamps produced by missing backend values are treated as missing instead of rendering a localized 1970 date.
- Elapsed timers reject invalid input, stop before unsafe integer overflow, and expose a negative invalid sentinel compatible with existing numeric consumers.
- Numeric duration formatting keeps cumulative hours instead of wrapping after 24 hours.

## TDD Evidence

- Red run: the focused command produced 10 expected failures out of 12 tests, including `NaN seconds`, missing elapsed time becoming `0`, invalid timers starting, and 25 hours rendering as `01:01:01`.
- Independent review found the real `usePipeline` seam still converted missing creation time to `new Date(0)`; the added regression failed with a localized 1970 date before the timestamp guard was tightened.
- Green run: the same focused command passed 2 files and 12 tests after the implementation.
- Full regression: 11 test files and 75 tests passed.

## Verification Commands

- PASS: `pnpm exec vitest run src/compositions/useDate.test.ts src/compositions/useElapsedTime.test.ts` (2 files, 12 tests).
- PASS: `pnpm test -- --run` (11 files, 75 tests).
- PASS: `pnpm lint`.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`.
- PASS: `pnpm exec prettier --check src/compositions/useDate.ts src/compositions/useElapsedTime.ts src/compositions/useDate.test.ts src/compositions/useElapsedTime.test.ts`.
- PASS: `git diff --check`.
- BLOCKED BY PRE-EXISTING WORKSPACE METADATA: `pnpm format:check` scans 250 ignored `._*` AppleDouble files and fails before evaluating the complete source tree.

## Concerns

- Full-tree Prettier remains blocked by ignored AppleDouble metadata outside this task's allowed files.
- Page-local direct `Date` formatting remains explicitly outside task `2.1`; later route-family slices must migrate or guard those call sites when they are touched.

## Scope Deviations

- None. Production edits remained within the four files allowed by the task context.

## Follow-up Needed

- Add or verify repository-wide formatter exclusion/cleanup for ignored AppleDouble metadata in a separately scoped task.
- Cover remaining page-local direct date formatting during the owning route-family slices.

## Adjudication

Task `2.1` may close because focused formatting, lint, typecheck, build, complete
Vitest, and diff checks all passed for the allowed production files. The
repository-wide Prettier failure is caused exclusively by ignored AppleDouble
metadata that predates this slice; deleting those files or expanding formatter
configuration would exceed the locked four-file task scope. This concern
remains explicit and cannot be used as evidence that global task `8.1` passed.
