# Task Brief: 029-static-gate-closure

## Goal

The complete frontend passes the full static gate chain on the current HEAD:
Prettier over the whole `web/` tree, ESLint with zero warnings, Vue
TypeScript, the entire Vitest suite, the Vite production build, and
`git diff --check`, with a replayable consolidated gate script and a recorded
evidence log.

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
- Slices `001-028`, whose per-slice gates established the components of this
  consolidated gate.

## Vertical Slice

Close baseline task `8.1`: run the complete static gate chain against the
whole frontend (not just task-scoped files), fix the genuine format
violations it surfaces (the macOS `._*` AppleDouble files are excluded from
Prettier via `.prettierignore`; the four real formatting violations in
`ListItem.vue`, `Warning.vue`, `Popup.vue`, and the 027 containment suite are
reformatted), and record the full-gate evidence.

## In Scope

- Add `**/._*` to `web/.prettierignore` so the full Prettier check is not
  blocked by macOS AppleDouble metadata files (211 files under `web/`), and
  reformat the four genuine violations the full check surfaces.
- Build `evidence/run_static_gate.mjs`: Prettier check over the whole `web/`
  tree, ESLint `--max-warnings 0 .`, `vue-tsc --noEmit`, full Vitest, Vite
  build, and `git diff --check`, failing closed on the first non-zero exit
  and writing a gate receipt JSON.
- Record the executed gate output as `development/evidence/040-029-static-gate-closure.log`.
- Close only baseline task `8.1` after both reviews pass.

## Out Of Scope

- The six-domain verification (task `8.2`), HTML report (task `8.3`), and
  final parity declaration (task `8.4`).
- Reopening blocked repository-add row `4`.
- Changing production behavior; the slice only fixes formatting and
  configuration.
- New routes, APIs, payload fields, or prototype fixtures.

## Files Allowed

- `web/.prettierignore`
- `web/src/components/atomic/ListItem.vue`
- `web/src/components/atomic/Warning.vue`
- `web/src/components/layout/Popup.vue`
- `web/src/regression/responsive/containment.test.ts`
- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/029-static-gate-closure/**`
- Existing task graph, CodeGraph plan, handoff, ledger, context, validation,
  drift, and acceptance files for task `029`.

## Interfaces / Seams

- The gate runs from `web/` with the project binaries
  (`node_modules/.bin/prettier|eslint|vue-tsc|vite`) exactly as the per-slice
  gates did; the Vitest entry is `node_modules/vitest/vitest.mjs` because
  `pnpm` is unavailable in the sandbox.

## Components To Create

- No production component is planned; create only the consolidated gate
  script and receipt under the task's `evidence/` directory.

## Components To Reuse

- The project lint/format/type/build/test tooling and the per-slice gate
  conventions established by slices `001-028`.

## Components To Extract

- No component extraction is planned: the gate script is a single
  self-contained pass over existing project tooling, and the formatting fixes
  touch no shared component seams.

## API / Data Flow Contracts

- No production code behavior changes; the diff is formatting and the
  Prettier ignore rule.

## State / Error / Empty / Loading Behavior

- Not applicable; this slice is a static gate verification.

## TDD Requirement

- The gate script fails closed on the first failing command; the receipt
  records exact counts; the full Prettier check is the regression for the
  format violations fixed here.

## Verification Commands

- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/029-static-gate-closure/evidence/run_static_gate.mjs`
- SpecNav entry and handoff contracts with `OPENSPEC_TELEMETRY=0`.

## Stop Conditions

- Scope lock mismatch.
- A gate command fails without a direct in-scope fix.
- The `._*` exclusion hides a real format violation (the four reformatted
  files prove the exclusion is scoped to AppleDouble metadata).
- Closure would complete tasks `8.2-8.4`, row `4`, or parent acceptance.

## Unsafe Assumptions

- A full gate pass at this HEAD does not prove the six-domain verification
  (task `8.2`), which remains open.
- The `.prettierignore` exclusion applies only to `._*` metadata files, never
  to real source.
