# Task Brief: 027-responsive-containment-closure

## Goal

Every completed route family (`001-024`) renders at desktop `1280`, tablet
`768`, and mobile `390` widths without page-level horizontal overflow, dense
tables and log consoles scroll inside their designated containers, and a
replayable cross-family responsive audit plus focused regressions lock the
containment contract.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.json`
- `openspec/changes/align-frontend-with-functional-prototype/spec-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/component-impact-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/decision.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/artifact/index.html`
- The signed Task `014/020-022` browser-evidence bundles as the per-family
  desktop/390px baseline; this slice adds the cross-family tablet `768`
  dimension and the consolidated containment audit.

## Vertical Slice

Run a deterministic cross-family browser audit of representative production
routes from every completed route family (overview, repositories, pipeline
detail/logs, organization, administration, user, infrastructure, deployments,
login, and not-found) at `1280x1000`, `768x1024`, and `390x844` in dark
Simplified Chinese. Measure page-level horizontal overflow
(`scrollWidth > clientWidth` on `html`/`body`) and dense-container scrolling
(`.wp-table-scroll`, `.table-scroll`, `table`, `pre`, log consoles) with the
established CDP capture machinery, fail closed on any overflow or uncontained
dense content, repair genuine findings with minimal production changes, and
close baseline task `7.3` after strict verification and both reviews pass.

## In Scope

- Build the task-local consolidated Mock API (extending the `009/014/015/016`
  fixture chain) with overview, user, infrastructure, and deployment fixtures
  so the audit matrix can load real populated states for every family.
- Capture `13` representative production routes at `3` viewports in dark
  Simplified Chinese: overview, repos, pipeline logs tab, org, admin,
  admin users, admin agents, user, infrastructure servers, infrastructure
  alerts, deployments, login, and not-found (`39` states).
- Measure per state: page-level horizontal overflow, dense-container
  scroll/containment, raw i18n keys, console errors, runtime exceptions,
  network failures, and unexpected HTTP errors; capture one PNG per state.
- Fix any genuine overflow or uncontained-scroll finding with the smallest
  production change inside the responsive/containment surface and add a
  focused red-capable regression for each fix.
- Write the strict verifier that fails closed on any failed state, plus
  persistent red-team mutations proving the verifier rejects tampering.
- Update `route-parity.md` rows of the sampled families with the Task `027`
  cross-viewport evidence reference without downgrading any status.
- Close only baseline task `7.3` after implementation evidence and both
  reviews pass.

## Out Of Scope

- New routes, APIs, payload fields, backend behavior, persistence,
  authorization rules, or prototype fixtures in production.
- Reopening blocked repository-add row `4`.
- Sensory prototype-parity re-verification; the Task `020-022` bundles remain
  the parity evidence and this slice only adds the containment dimension.
- Phase `8` static/six-domain verification and the HTML report.
- Theme-token parity (baseline task `7.4`), keyboard/accessibility closure
  (task `7.2`, already closed), and i18n string closure (task `7.1`, closed).

## Files Allowed

- `web/src/views/**/*.vue` (repair only, when the audit reproduces a genuine
  overflow or uncontained-scroll defect)
- `web/src/components/**/*.vue` (repair only, same condition)
- `web/src/assets/tailwind.css` (repair only, same condition)
- `web/src/regression/responsive/**` (new focused regressions)
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/027-responsive-containment-closure/**`
- Existing task graph, CodeGraph plan, handoff, ledger, context, validation,
  drift, and acceptance files for task `027`.

## Interfaces / Seams

- The app is served by the Vite dev server with `VITE_DEV_PROXY` pointing at
  the task-local consolidated Mock API; the CDP capture follows the Task
  `021/022` machinery (Chrome headless, `Emulation.setDeviceMetricsOverride`,
  `Page.addScriptToEvaluateOnNewDocument` for theme/locale).
- Theme and locale are set through `localStorage` (`woodpecker:theme` /
  `woodpecker:locale`) exactly as the prior slices did.
- Dense-content containers are identified by the established selectors
  (`.wp-table-scroll`, `.table-scroll`, `table`, `pre`, `.log-console`).

## Components To Create

- No production component is planned.
- Create the task-local consolidated Mock API, capture, strict verifier,
  red-team, and validation scripts under
  `development/tasks/027-responsive-containment-closure/evidence/`.
- Create focused regressions under `web/src/regression/responsive/` only for
  repaired defects.

## Components To Reuse

- The `009/014/015/016` Python fixture chain via module inheritance.
- The Task `021/022` CDP client, service bootstrap, and measurement
  expression patterns.
- The existing `wp-table-scroll` / `table-scroll` / `log-console` containment
  classes and the responsive grid/layout system.

## Components To Extract

- None initially. If the audit finds repeated uncontained patterns, extend the
  established shared containment class instead of adding parallel layouts.

## API / Data Flow Contracts

- The audit visits production routes only; the Mock API serves deterministic
  fixtures with the same payload shapes the typed API client expects.
- No production code path changes behavior; repairs are presentation-only and
  must keep the existing API/store contracts authoritative.

## State / Error / Empty / Loading Behavior

- The audit matrix favors populated states so dense tables and logs actually
  overflow their containers; where a family has no populated fixture, its
  empty/error state is measured for overflow like any other state.
- Overflow is measured after the route's readiness pattern resolves
  (content or terminal error/empty state), not during the loading spinner.

## TDD Requirement

- For each genuine overflow or uncontained-scroll finding, add a focused
  red-capable regression before the production repair; the strict verifier
  must fail closed on any page-level overflow, uncontained dense content,
  raw i18n key, or browser health failure.

## Verification Commands

- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/027-responsive-containment-closure/evidence/capture_responsive.mjs`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/027-responsive-containment-closure/evidence/redteam_verifier.mjs`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/027-responsive-containment-closure/evidence/validate_task.mjs`
- Focused Vitest for the responsive regressions; full frontend Vitest;
  Prettier; ESLint; Vue TypeScript; Vite build; JSON/JSONL parsing; JavaScript
  syntax checks; `git diff --check`.
- SpecNav entry and handoff contracts with `OPENSPEC_TELEMETRY=0`.

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- A genuine overflow or uncontained-scroll defect requires a new API, backend
  contract, prototype fixture, new permission rule, or files outside the
  allowed scope.
- The audit cannot reach a route's readiness pattern, or any state fails the
  strict verifier without a direct fix inside the allowed scope.
- Closure would complete task `7.4`, phase `8`, row `4`, or parent acceptance.

## Unsafe Assumptions

- Per-family desktop/390px evidence from Tasks `014/020-022` does not prove
  tablet `768` containment or cross-family consistency; only the new audit
  run at three viewports proves this slice's contract.
- A passing full suite alone does not prove containment; only the replayable
  browser audit with its strict verifier does.
- The representative matrix is a sampling contract, not a claim that every
  one of the 67 parity rows was re-measured in this slice.
