# Spec Review: 004-shell-theme-evidence

## Verdict

approved

## Missing Requirements

- None. The evidence-only slice covers the required production and approved
  prototype shell states in dark/light desktop and mobile modes, including the
  specified shell geometry, theme application, readable controls, overflow,
  and production drawer lifecycle.
- No production or test edit was required: the current rendered shell passed
  the gate and `git diff --quiet -- web` confirms that the evidence-first stop
  rule was followed.

## Extra Behavior

- None. The task introduces no route, API, store, authentication, permission,
  persistence, dependency, prototype, production, or test behavior.

## Misunderstood Requirements

- None. This review does not treat the shared-shell comparison as completion of
  any route-family parity claim. It verifies the prerequisite shell evidence
  only; each route family must establish its own equivalent-state `A2`
  evidence.
- The prototype mobile capture is not represented as a true 390x844 PNG. The
  browser receipt records an explicitly set 390x844 viewport and separately
  discloses that the standalone screenshot API cropped the content grid to
  380x822.

## Cannot Verify From Diff

- Browser-computed geometry, theme colors, readability, overflow, and drawer
  focus/ARIA/inert/scroll-lock behavior cannot be established from the zero
  production diff. They are covered by the replayable `system-executed`
  receipt `task-004-shell-theme-browser-20260809`.
- The `/tmp/woodpecker-shell-evidence-*` PNG files are no longer present, so
  their pixels cannot be independently re-inspected in this review. The
  system-executed receipt remains the approval evidence for the measured
  viewport and behavior results.
- The prototype 380x822 PNG dimensions could not independently prove the outer
  browser viewport even if the temporary file remained available. Approval
  relies on the receipt's explicit 390x844 viewport attestation and does not
  claim that the cropped PNG itself is 390x844.
- The all-allowed-files Prettier command still reports the unchanged
  `src/style.css` baseline mismatch. Independent review confirmed that the
  other 11 allowed shell files pass Prettier and that `web/` has zero diff.
  This proves no formatting regression from this evidence-only slice; it does
  not claim that `src/style.css` is currently formatted.

## Acceptance Assertions Verified

- `A3`: independently verified with the zero production/test diff, focused
  shell Vitest (4 files, 16 tests), isolated full frontend Vitest (22 files,
  112 tests), ESLint, TypeScript, Vite build, targeted Prettier for the 11
  non-baseline allowed files, and `git diff --check`. The build retains only
  the two documented pre-existing non-module script warnings. The replayable
  browser receipt covers production and approved-prototype review at desktop
  and an attested 390x844 mobile viewport.

## Required Fixes

- None for this evidence-only slice. Route-family tasks must verify `A2`
  independently, and the pre-existing `src/style.css` formatting mismatch
  remains for a separately authorized formatting task.
