# Spec Review: 001-date-duration-integrity

## Verdict

approved

## Missing Requirements

- None. The shared timestamp guard now rejects the existing zero/missing
  sentinel, so `new Date(0)` and `timeAgo(0)` render `—` rather than a
  misleading 1970 value.
- Missing, negative, non-finite, unsafe, and invalid duration/date inputs are
  guarded before formatting, while valid values retain locale-aware output.

## Extra Behavior

- Changing numeric duration output from modulo-24 hours to cumulative hours is
  consistent with preventing misleading extreme durations and remains inside
  the shared formatting boundary.

## Misunderstood Requirements

- None. The implementation now matches the existing pipeline seam where zero
  represents a missing timestamp, without changing the valid positive Unix
  timestamp contract.

## Cannot Verify From Diff

- No remaining functional claim is unverifiable. The pre-fix implementation and
  the added `Date(0)` regression substantiate the reported 1970 failure; the
  reviewer independently reran the green focused suite.
- Repository-wide `pnpm format:check` remains blocked by pre-existing ignored
  AppleDouble files. This is a non-blocking scope concern because targeted
  Prettier passed for all four allowed files, along with focused Vitest,
  TypeScript, ESLint, the recorded full Vitest/build runs, and
  `git diff --check`.

## Acceptance Assertions Verified

- A4: Verified the shared date/duration guards, zero/missing pipeline timestamp
  regression, valid locale-aware rendering, cumulative duration formatting,
  elapsed timer validation, and focused system-executed test evidence.

## Required Fixes

- No required fixes remain for this task slice; the previously identified
  zero/missing timestamp gap is implemented and covered by focused regression.
