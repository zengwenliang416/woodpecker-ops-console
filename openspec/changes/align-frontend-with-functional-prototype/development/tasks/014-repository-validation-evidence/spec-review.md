# Superseding Spec Review: 014-repository-validation-evidence

## Verdict

approved

## Missing Requirements

- None for task `014` / baseline task `4.5` as an evidence and parity-matrix
  adjudication slice.
- The superseding evidence package contains a fresh no-resume replay of all
  `100` required states: `84` dark Simplified-Chinese production/prototype
  desktop/mobile states for repository rows `3-23`, plus `16`
  light-English and permission representatives.
- Every measurement, the replay summary, service identity, and manifest is
  bound to run `1082fba7-576e-4c0f-8f72-fb8beca08df0`. The measurements were
  captured from `2026-08-11T14:11:45.522Z` through
  `2026-08-11T14:14:08.060Z`; the verifier rejects mixed run IDs, missing or
  extra states, unexpected files or subdirectories, and checksum drift.
- Capture starts and owns fresh Mock API, production, and prototype services,
  rejects occupied ports, verifies the proxied repository contract, binds the
  served production and approved-prototype bytes to their current Git trees,
  and atomically replaces the summary and manifest.
- Row `4` is correctly evidence-bearing `blocked`, not a missing task result:
  production `/repos/add` renders the existing Forge activation list with
  `0` wizard steps while the approved prototype renders a `4`-step
  configuration wizard at both required viewports.

## Extra Behavior

- None found. Production `web/`, router runtime, APIs/stores, locale files,
  permission calculation, backend, dependencies, and the approved prototype
  remain unchanged from `HEAD`
  `c416ce346110b4b2315c995e2302797ea5ee9f0c`.
- The Mock API, smoke runner, browser capture runner, verifier, measurements,
  screenshots, summary, and manifest remain task-local and are not imported
  by production code.
- The task-specific changes claimed by the final report remain within
  `allowed_files`: repository rows in `route-parity.md`, the task directory,
  and the approved append-only development lifecycle artifacts.

## Misunderstood Requirements

- None found. The task treats an evidence-bearing `blocked` row as an honest
  terminal validation outcome and does not simulate the approved wizard or
  make an unauthorized production repair.
- The matrix does not claim repository-family completion: rows `3` and
  `5-23` are `verified`, while row `4` remains `blocked` with direct
  production/prototype evidence.
- Equivalent-state review uses the required dark Simplified-Chinese
  desktop/mobile matrix and representative light-English and permission
  states without requiring pixel identity or copying prototype fixtures into
  production.

## Cannot Verify From Diff

- The diff alone cannot prove browser state, service ownership, served-byte
  identity, screenshot dimensions, responsive containment, warning
  classification, or artifact integrity. This reviewer independently ran
  `node evidence/verify_evidence.mjs`; it passed run
  `1082fba7-576e-4c0f-8f72-fb8beca08df0`, exactly `100` states (`58`
  production and `42` prototype), rows `3` and `5-23` verified, row `4`
  blocked, zero page-overflow/raw-key/browser-error states, exact inventory,
  protected-tree identity, and all checksums.
- The capture command was not rerun during this review because it rewrites the
  evidence package and this reviewer owns only `spec-review.md`. The
  superseding system-executed capture receipt records a complete no-resume
  replay under task-owned services; the current verifier confirms every
  measurement, summary, service record, and manifest uses that one run ID.
- This reviewer parsed `103` task JSON files, `8` changed shared JSON files,
  and all records in the four development JSONL files: `115` JSON/JSONL files
  in total. A separate matrix check confirmed the prototype inventory and
  `route-parity.md` each contain exactly rows `1-67`, all statuses use the
  allowed vocabulary, and repository rows retain the declared
  `20 verified / 1 blocked` outcome.
- JavaScript syntax checks passed for the capture, verifier, and Mock API smoke
  scripts; Python AST parsing passed for `mock_api.py`; the Mock API smoke
  independently passed; protected production/prototype tree checks and
  `git diff --check` passed.
- Focused Vitest (`32` files / `214` tests) and full Vitest (`50` files /
  `314` tests) were not rerun by this reviewer. Their system-executed receipts
  remain applicable because the quality fixes changed only task-local evidence
  infrastructure and task artifacts, while the verifier and independent Git
  checks confirm production `web/` bytes remain identical to the tested
  `HEAD`. The superseding current-byte receipt separately covers formatting,
  ESLint, TypeScript, Vite build, syntax, smoke, evidence, JSON/JSONL,
  protected-tree, and diff checks.
- The captures contain `8984` classified warnings:
  `8900` vue-i18n fallback-chain diagnostics, `24` Vue extraneous-prop
  warnings, and `60` Vue Router deprecation warnings, with `other: 0`.
  There are no error-level console entries, runtime exceptions, network
  failures, HTTP errors, or raw visible i18n keys. Warning cleanup remains
  outside this evidence-only task.
- The shared worktree contains modified CodeGraph and SpecNav registry files
  outside task `014`'s `allowed_files`. They are not claimed by this task and
  cannot be attributed from the combined dirty-worktree diff; the reviewed
  task-owned changes and lifecycle records remain within scope.

## Acceptance Assertions Verified

- `A1`: verified as the maintained route-inventory assertion. The approved
  prototype and `route-parity.md` each contain all `67` numbered route/tab
  states with one allowed explicit status per row. This does not claim
  all-route completion: the matrix currently contains `20` verified, `1`
  blocked, `23` in-progress, and `23` not-started rows.
- `A3`: verified for task `014` as the completed evidence slice. Current
  system-executed receipts cover focused and full Vitest plus the superseding
  no-resume browser replay, formatting, ESLint, TypeScript, Vite build, Mock
  API smoke, syntax, JSON/JSONL, protected-tree, and diff checks. Independent
  review reproduced the strict run-bound verifier, artifact parsing, matrix
  validation, syntax, Mock API smoke, protected-tree check, and
  `git diff --check`.
- `A2` is not verified for the complete repository family because row `4`
  remains evidence-bearing `blocked`; this review does not claim all-route or
  full-change parity completion.
- `A4` is not verified by this evidence-only task. Operational value,
  fallback, and stale-response correctness remains established by the owning
  implementation and regression slices, not by task `014` alone.

## Required Fixes

- None for task `014` / baseline task `4.5` as a repository
  validation-evidence slice.
- Keep route-parity row `4`, repository-family `A2`, and full-change
  completion open until an authorized implementation slice delivers and
  replays the approved four-step repository wizard.
