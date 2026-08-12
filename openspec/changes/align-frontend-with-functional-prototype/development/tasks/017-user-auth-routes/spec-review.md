# Spec Review: 017-user-auth-routes

## Verdict

approved

## Missing Requirements

- None found within the locked task 017 scope.

## Extra Behavior

- No unsupported password/SSO, profile mutation, user-specific resource API,
  token-application/device, Agent telemetry, backend, dependency, or
  persistence behavior was found in the task diff.
- Removing the three broad deprecated matchers is the recorded minimal scope
  expansion needed to make the existing named catch-all reachable. Specific
  repository and organization compatibility routes remain intact.
- Login now renders `error_uri` only when it is an absolute HTTP(S) URL. This
  is a bounded safety correction for the existing OAuth error presentation;
  focused tests reject JavaScript, data, and malformed URI values.

## Misunderstood Requirements

- None found. The superseding implementation makes the validated callback port
  a reactive request owner, invalidates active generations when that owner
  changes, and captures the immutable port used by each callback request.
- The prior evidence-script formatting mismatch is closed on the current bytes
  by the correctly rooted repository Prettier check.

## Cannot Verify From Diff

- Complete `A2` is intentionally not verified by this task-local review.
  Representative production/prototype evidence cannot establish family-wide
  parity across all theme, locale, permission, and data-state combinations.
- Baseline permission-family closure in task `5.4` and full parity closure in
  task `5.5` remain open.
- Route parity rows `1` and `39-45` remain `in-progress`; this review does not
  mark any of them verified.
- The installed SpecNav development `0.3.0` handoff/entry contract remains
  blocked by the change-wide task-graph/context model mismatch. That global
  blocker is not treated as a task-local `A3` or `A4` implementation failure.

## Acceptance Assertions Verified

- `A3` (task 017 scope only): current-byte focused Vitest passes `11` files and
  `45` tests; the recorded full suite passes `84` files and `462` tests.
  Correctly rooted task/evidence Prettier, zero-warning ESLint, Vue TypeScript,
  Vite build, evidence syntax, JSON/JSONL parsing, and diff checks pass. Strict
  browser evidence run `6e59b655-c195-4474-8ac2-f0cda499de43` verifies exactly
  `32` JSON measurements and `32` PNG screenshots for rows `1` and `39-45` at
  desktop and `390px`.
- `A4` (task 017 scope only): focused implementation and tests verify
  confirmed-resource/token continuity, explicit empty/error fallbacks,
  generation-owned mutations and requests, obsolete-completion suppression,
  query-owner transitions, safe OAuth error links, and unmount safety. This
  does not verify complete change-wide `A4`.

## Required Fixes

- None for task 017. Keep complete `A2`, baseline tasks `5.4/5.5`, and route
  parity rows `1` and `39-45` open.
