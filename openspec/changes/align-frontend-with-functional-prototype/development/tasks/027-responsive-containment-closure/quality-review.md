# Quality Review: 027-responsive-containment-closure

## Verdict

approved

Independent review of the task-027 diff and executed evidence. The two
production fixes are minimal, correct, and preserve the desktop (xl) layout
byte-for-byte; the audit matrix is a defensible 13-route-per-family sampling
contract; the strict verifier fails closed with manifest-pinned digests,
runId-consistent state identity, and exact inventory checks; the red-team is
genuinely isolated (mutations applied to temp-dir copies of the evidence, with
the verifier and matrix copied alongside so the verifier reads tampered files
and never the real evidence); and every fast gate re-ran clean in this review:

- `verify_responsive.mjs` → "Strict responsive verification passed for 39 states."
- `redteam_verifier.mjs` → "Red-team: baseline passed; 9/9 mutations rejected."
- Vitest `src/regression/responsive/` → containment.test.ts 5/5 passed.
- Gate log `development/evidence/038-027-responsive-containment-closure.log`
  ends with "Task 027 validation gates all passed." (capture 39/39 ok:true,
  verifier pass, red-team 9/9, full Vitest 109 files / 605 tests, ESLint,
  vue-tsc, Vite build, syntax/JSON/JSONL, `git diff --check`).

Only non-blocking observations were found; they are listed under Required
Fixes and do not weaken the fail-closed guarantee.

## Separation Of Concerns

The slice separates production, measurement, and gate concerns cleanly:

- Production: two presentation-only repairs inside the allowed
  responsive/containment surface (`Repos.vue` filter grid, `AgentList.vue`
  badge-row wrap). No route, API, store, permission, or data-flow change.
- Data vs. behavior: `matrix.mjs` is pure sampling-contract data (13 routes x
  3 viewports, per-family row mapping, readiness patterns); `capture_responsive.mjs`
  only measures and records (it never asserts correctness); `verify_responsive.mjs`
  only checks (it never measures); `redteam_verifier.mjs` only proves rejection
  (it never touches real evidence); `validate_task.mjs` only orchestrates the
  gate chain. Each script has a single responsibility.
- Fixtures are separate from the app under test: the consolidated Mock API
  (`mock_api.py`) serves deterministic payloads through the existing
  `VITE_DEV_PROXY` seam, and the fixture identity is verified at boot
  (`fixture === '027-responsive-containment-closure'` and `run_id` match).
- The source-level regression (`web/src/regression/responsive/containment.test.ts`)
  is a separate fast contract lock, distinct from the browser audit.

## Component Cohesion / Coupling

High cohesion, low coupling. Each evidence script is self-contained and
couples only through well-defined seams: `matrix.mjs` exports `states` /
`expectedPatterns` consumed by capture, verifier, and red-team; the evidence
contract is schema'd (`woodpecker.task027-responsive-replay.v1`,
`woodpecker.task027-evidence-manifest.v1`) and joined by `runId` across the
summary, manifest, and every per-state JSON — mixing evidence from different
runs is rejected. The verifier resolves its evidence root from its own script
location, which is exactly what makes the red-team's temp-dir isolation work.
The mock API extends the `009 -> 014 -> 015 -> 016` fixture lineage by module
inheritance (`importlib` loading of `016/evidence/mock_api.py`, chaining to
`base.FixtureHandler`), so the consolidated fixture stays cohesive with its
chain instead of forking. No production component gained responsibilities; the
two repairs reuse the established breakpoint system (the `xl:` variant pattern
was already used by `.repos-grid` in the same file).

## Test Quality

Strong, multi-layer, and red-capable.

- Browser audit (39 states, 3 viewports, 13 families, dark zh-Hans): measures
  real geometry — page-level overflow via `documentElement`/`body`
  scrollWidth vs clientWidth, per-container dense checks
  (`.wp-table-scroll`/`.table-scroll`/`.log-console`/`table`/`pre`) with
  `overflowX` + `locallyScrollable`, overflow contributors with
  scrollable-ancestor awareness, raw i18n keys, and console/runtime/network/
  HTTP health — gated on route-specific readiness patterns, with PNG + JSON
  evidence per state. Sampling (one populated route per family, 13 of 67
  parity rows) is explicitly documented in brief/context/report as a contract,
  not an exhaustive re-measurement, and is defensible: the dense-table/log
  contract is additionally locked source-level for the whole tree.
- Strict verifier: fails closed on every failure class (overflow, contributors,
  uncontained dense content, raw i18n, health, inventory drift) and
  additionally pins all 78 JSON/PNG digests to the capture-time manifest with
  runId consistency and exact inventory checks (extra AND missing files
  flagged; a stray `production-*.json` fails the gate).
- Red-team: baseline-copy must pass first, then all 9 isolated mutations
  (run-id, overflow injection, uncontained-dense injection, raw-i18n, health,
  PNG corruption, viewport, state-count, file removal) are proven rejected,
  each in a fresh `mkdtemp` copy of the evidence with the verifier and matrix
  copied alongside. Verified by re-running.
- Source-level containment suite (5 tests): every `<table>` under a scroll
  containment token, `.wp-table-scroll` horizontally scrollable, app shell
  full-width with a contained vertical scroll region, dense
  `min-w-[940px]`/`min-w-[1080px]` tables paired with the shared wrapper, and
  the pipeline log surface contained. Robust enough as a fast contract lock;
  weaknesses (non-blocking): the table-containment heuristic scans only the 4
  lines above a `<table>` tag and counts `overflow-hidden` as containment even
  though it masks rather than scrolls — the browser audit remains the
  authoritative check, and the suite depends on POSIX `find` and CWD-relative
  reads.
- The two repaired defects are provably red-capable: the measurement
  (contributors with `right > viewport`, uncontained dense containers) would
  have flagged the clipped repos filter select at 768 and the nowrap
  six-badge agent row at tablet/mobile, and the injected-overflow /
  uncontained-dense red-team mutations demonstrate the verifier rejects
  exactly those signals.

## Error Handling

Excellent for the tooling. Capture: free-port allocation, URL readiness waits
with deadlines, per-state readiness-pattern timeout that aborts the whole run
(fail closed), `SIGTERM -> SIGKILL` child teardown with an exit assertion,
atomic write+rename for every artifact, and a `finally` block that always
reaps chrome, both services, and the chrome profile; exit code 1 when any
state fails. Verifier: aggregates every failure and exits non-zero with the
full list, rather than failing fast. Red-team: asserts per mutation and cleans
temp copies in `finally`. `validate_task.mjs` fails closed on the first
failing command and adds syntax, JSON/JSONL parsing, Prettier, ESLint
`--max-warnings 0`, vue-tsc, Vite build, and `git diff --check` gates.

One inconsistency (non-blocking, fail-closed direction): the capture exempts
Vite-HMR-websocket and fixture-SSE network failures from its own summary fail
set (`health.allowedArtifactFailures`), but that field is computed in-memory
in the summary loop and is not persisted to the per-state JSON files (0 of 39
contain it), and the strict verifier ignores the exemption entirely — it flags
every `health.networkFailures` entry. In this run no state recorded any
network failure, so the gate is unaffected; the net effect is that the
verifier is strictly stronger than the capture summary. The report.md
narrative ("recorded per state under health.allowedArtifactFailures and
excluded from the fail set") should be read as describing the capture summary
only.

## Reuse / Duplication

Good. The Mock API reuses the existing fixture chain via inheritance rather
than duplicating handler logic; new endpoints are additive fixtures only. The
CDP client and service bootstrap are re-implemented in
`capture_responsive.mjs`, but that matches the established per-task convention
(tasks 021/022 embed the same `CdpClient` class; there is no shared module),
and the brief's reuse requirement is satisfied at the pattern level — the
capture mirrors the 021/022 machinery structurally. No parallel production
layout was introduced: the fixes extend the existing breakpoint/containment
primitives (`.wp-table-scroll`, `xl:` variants), so no component extraction
was warranted.

## Complexity Delta

Production complexity delta is ~zero: two one-line class changes
(`Repos.vue` filter grid; `AgentList.vue` two `flex-wrap` additions), no new
routes, APIs, stores, or state. The md 3-column grid
(`minmax(0,1fr) 140px 140px`) replaces the overflow-prone
`minmax(260px,1fr) 140px 140px auto` at 768–1279 (the fourth `auto` element —
the conditional clear button — wraps to its own row), and the exact original
4-column layout is preserved at ≥1280 via `xl:grid-cols-[minmax(260px,1fr)_140px_140px_auto]`;
with Tailwind v4 defaults, xl is min-width 1280px, so the desktop capture at
1280 exercises the original layout — no desktop regression (confirmed by the
repos-desktop evidence: 4-column state, no overflow, `.wp-table-scroll`
628px/940px scrollable). The added complexity lives in the evidence tooling,
which is the deliverable itself, and is modular (5 small scripts + fixtures +
one test file). The audit matrix (13 routes x 3 viewports) is a documented
sampling contract; the brief's unsafe-assumptions section explicitly
disclaims exhaustive re-measurement.

## Required Fixes

None blocking; the verdict is approved on the executed evidence.

Non-blocking recommendations (recorded for follow-up, not gate-blocking):
1. Align `report.md` with the executed gate log: the closure Vitest run shows
   109 files / 605 tests, not "106 files / 588 tests" as reported.
2. Reconcile the artifact-failure exemption: either persist
   `health.allowedArtifactFailures` to the per-state JSONs and teach the
   verifier to honor it, or delete the exemption so the capture summary and
   the strict verifier share one policy. As-is, the verifier is stricter than
   the capture summary — safe, but the two contracts disagree and the report
   overstates what is recorded.
3. Optional robustness: the source-level table-containment heuristic (4-line
   lookback, `overflow-hidden` accepted as containment) is brittle; consider
   scanning the enclosing block or requiring an actual scroll token. The
   browser audit remains authoritative either way.
