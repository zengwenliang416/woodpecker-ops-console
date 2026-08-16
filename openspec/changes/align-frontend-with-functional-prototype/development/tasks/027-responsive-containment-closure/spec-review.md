# Spec Review: 027-responsive-containment-closure

## Verdict

approved

Independent spec review of task `027-responsive-containment-closure` (baseline
task `7.3`: verify desktop, tablet, and 390px layouts with no page-level
horizontal overflow and contained scrolling for dense tables and logs). The
implementation, the production diff, and the executed evidence force approval:
the 39-state cross-family audit (13 representative production routes x desktop
`1280` / tablet `768` / mobile `390`, dark Simplified Chinese) passes with zero
page-level horizontal overflow and zero uncontained dense containers; the two
genuine tablet/mobile containment defects found by the audit were repaired with
minimal in-scope presentation changes; and the strict verifier, red-team, and
regression suite were independently re-executed and pass. No acceptance
assertion cited by the task is left unsupported.

## Missing Requirements

None. The task goal, in-scope items, and verification commands in `brief.md`
are all addressed by the delivered artifacts:

- The consolidated Mock API (`evidence/mock_api.py`) extends the
  `009/014/015/016` fixture chain with overview, user, infrastructure, and
  deployment fixtures; the capture run asserts the fixture identity
  `027-responsive-containment-closure` and the run id before measuring.
- `evidence/matrix.mjs` defines 13 representative routes (rows
  `1, 2, 3, 11, 24, 28, 32, 34, 39, 45, 47, 57, 58`) x 3 viewports = 39
  states; the browser-replay-summary confirms `states: 39`, `ok: true`, and an
  empty `failedStates`.
- Per-state measurement covers page-level horizontal overflow, dense-container
  containment, overflow contributors, raw i18n keys, and browser health
  (console/runtime/network/HTTP), with one PNG per state (39 PNGs, all real
  PNG image data at the declared viewport dimensions).
- The strict verifier (`verify_responsive.mjs`) fails closed on overflow,
  uncontained dense content, contributors, raw i18n keys, health failures,
  inventory drift, and manifest digest drift.
- The red-team (`redteam_verifier.mjs`) proves rejection of all 9 isolated
  mutations (run-id tamper, overflow injection, uncontained-dense injection,
  raw-i18n injection, health injection, PNG corruption, viewport tamper,
  state-count tamper, evidence-file removal) with a passing baseline.
- Focused regressions under `web/src/regression/responsive/containment.test.ts`
  (5 tests) lock the source-level containment contract.
- `route-parity.md` rows `1, 2, 3, 11, 24, 28, 32, 34, 39, 45, 47, 57, 58`
  were updated with the Task `027` cross-viewport evidence reference with no
  status downgrade (all remain `verified`), and `tasks.md` marks `7.3` `[x]`.

## Extra Behavior

None that violates scope. The only production changes are the two minimal,
presentation-only repairs inside the allowed responsive/containment surface:

- `web/src/views/Repos.vue`: the filter grid changes from
  `md:grid-cols-[minmax(260px,1fr)_140px_140px_auto]` to
  `md:grid-cols-[minmax(0,1fr)_140px_140px] xl:grid-cols-[minmax(260px,1fr)_140px_140px_auto]`,
  so the fixed `260+140+140` columns no longer overflow the narrow tablet
  content area while the original four-column layout is preserved at `xl`.
  No template, script, store, or API behavior changed.
- `web/src/components/agent/AgentList.vue`: the agent row and badge group gain
  `flex-wrap` (and `justify-end` on the badge group) so the up-to-six-badge
  metadata row wraps at tablet/mobile widths. No logic changed.

No new routes, APIs, payload fields, backend behavior, persistence, or
authorization rules were introduced in production; the Mock API is task-local
evidence tooling. The audit correctly treats this slice as a sampling contract
(13 representative families) and does not claim all 67 parity rows were
re-measured, consistent with the brief's stated non-goals and unsafe
assumptions.

## Misunderstood Requirements

None. The task's scoped claim on A2 (the Task `020-022` bundles remain the
parity evidence; this slice adds the three-viewport containment dimension) is
implemented exactly as scoped: the audit measures production routes in
equivalent theme (dark), locale (`zh-Hans`), viewport (1280/768/390), and
permission state (admin; guest for login), with deterministic fixtures serving
the same payload shapes the typed client expects. Readiness is gated on
route-specific content patterns (e.g. `/backend-api/`, `登录`, `404`), so
overflow is measured after the route's content/terminal state resolves, not
during the loading spinner. Dense-container measurement uses the established
selectors (`.wp-table-scroll`, `.table-scroll`, `.log-console`, `table`,
`pre`) and the established local-scroll determination
(`scrollWidth > clientWidth + 1` with `overflow-x: auto|scroll`).

## Cannot Verify From Diff

These items could not be confirmed from the diff or stored artifacts alone and
are recorded for completeness; none blocks approval because the executed
evidence and my independent re-runs cover the substance:

- The report's narrative number "Full frontend Vitest passes 106 files / 588
  tests" is stale. The executed gate log
  (`development/evidence/038-027-responsive-containment-closure.log`) records
  `109 passed (109)` files / `605 passed (605)` tests, and my re-run of
  `node node_modules/vitest/vitest.mjs run` at the closure HEAD reproduced
  exactly `109 passed (109)` / `605 passed (605)` with exit 0. The suite
  passes either way; the report narrative under-counts.
- The report states "Added the Task 027 ... task graph node"; the diff shows
  `task-context.jsonl` gained the Task `027` records, but `task-graph.json`
  was not extended (its 24 slices end at `024`, matching the pre-existing
  state where `025`/`026` also have no graph node). This is a narrative
  overstatement in the report, not a scope violation, and it does not affect
  the acceptance outcome.
- The pre-repair (red) capture artifacts for the two fixed defects are not
  stored; only the post-repair 39/39 pass is on disk. The red-capability of
  the audit is nonetheless demonstrated by the red-team (overflow and
  uncontained-dense mutations are rejected) and by the source-level
  containment regressions.
- `context.json` lists `evidence/verify_report.json` under
  `expected_evidence`, but the strict verifier writes its result to stdout
  ("Strict responsive verification passed for 39 states.") and the output is
  captured in the executed gate log rather than in a dedicated
  `verify_report.json`. The strict-verifier evidence substance is present in
  the gate log and was re-produced by my re-run.
- `development/task-context.jsonl` already records
  `status: review-approved` with `assertions_verified: ["A2","A3"]`; at review
  time the on-disk review files were scaffolds. This review file resolves the
  spec-review half; the quality review is produced separately. The premature
  ledger record does not change the outcome of this review.

## Acceptance Assertions Verified

Independently re-executed and verified against code and executed evidence:

- **A2** (verified in the task's scoped sense: the completed route families'
  containment dimension at equivalent theme/locale/viewport/permission/data
  state; the Task `020-022` bundles remain the parity evidence): re-ran
  `verify_responsive.mjs` (passed 39 states) and audited all 39 measurement
  JSONs — 13 families x 3 viewports at the declared widths, dark `zh-Hans`,
  `pageLevelHorizontalOverflow: false`, empty `overflowContributors`, no
  uncontained dense container (`scrollWidth > clientWidth + 1` without local
  scroll), no raw i18n keys, no console/runtime/network/HTTP failures, and
  consistent runIds. `browser-replay-summary.json` reports `ok: true`,
  `states: 39`, `failedStates: []`, matching the manifest (39 JSON + 39 PNG
  digests, 78 entries) and the on-disk inventory. The two production repairs
  preserve real APIs and mutations (presentation-only diffs).
- **A3** (formatting, lint, TypeScript, Vitest, Vite build, git diff checks,
  and targeted browser review): the executed gate log
  `038-027-responsive-containment-closure.log` ends with "Task 027 validation
  gates all passed." and shows Prettier pass, ESLint zero-warning pass,
  `vue-tsc --noEmit` pass, Vite build pass, full Vitest
  `109/605` pass, JavaScript syntax and JSON/JSONL parsing pass, and
  `git diff --check` pass. I independently re-ran the containment Vitest suite
  (`5/5` pass), the full Vitest suite (`109` files / `605` tests, exit 0),
  ESLint with `--max-warnings 0` on the changed files (exit 0), Prettier
  `--check` on the changed files (pass), and `git diff --check` (clean).
  Targeted browser review is covered by the desktop/tablet/mobile capture and
  my re-run of the strict verifier.

## Required Fixes

None blocking. Optional documentation corrections for report accuracy:

- Update `report.md`'s Vitest counts from the stale "106 files / 588 tests"
  to the executed and reproduced "109 files / 605 tests".
- Either remove the "task graph node" phrasing from `report.md` or add the
  Task `027` node to `task-graph.json`; the ledger/context records are the
  authoritative trace and already contain Task `027`.
