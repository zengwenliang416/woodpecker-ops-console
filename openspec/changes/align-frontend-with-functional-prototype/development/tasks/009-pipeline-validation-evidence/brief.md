# Task Brief: 009-pipeline-validation-evidence

## Goal

Users can trust that the completed pipeline detail route family passes current
frontend validation and remains equivalent to the approved prototype across
desktop/mobile, dark/representative-light, locale, and permission states.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.json`
- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/spec-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/component-impact-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/decision.json`
- `openspec/specs/ui-design/design.md`
- `openspec/specs/system-architecture/design.md`
- `openspec/specs/frontend-backend-data-flow/design.md`
- `openspec/specs/component-architecture/design.md`

## Vertical Slice

Replay the current pipeline detail implementation against a deterministic Mock
API and the approved prototype. Record direct browser measurements and
screenshots for the overview, selected log, changed-files, configuration,
errors, and Debug routes, then reconcile those observations with focused/full
frontend validation and the completed tasks `3.1` through `3.4`.

## In Scope

- Create a task-local deterministic Mock API harness that serves authenticated
  repository `101`, failed pipeline `842`, two workflows, four terminal steps,
  real log lines including stderr, changed files, base64 configuration,
  pipeline/runtime errors, Debug metadata, and switchable push/read-only
  permission states.
- Run the final pipeline-focused regression suite covering eight files and the
  complete frontend Vitest suite at the current commit.
- Run targeted pipeline Prettier, ESLint, TypeScript, Vite build, and
  `git diff --check`.
- Render production and approved-prototype pipeline detail states at
  `1600x1000` and `390x844`.
- Use dark Simplified Chinese for the required primary comparison and
  representative light English for secondary coverage.
- Verify the overview, selected log, changed-files, configuration, errors, and
  Debug destinations, plus push and read-only permission boundaries.
- Record URL, terminal route name, viewport, screenshot dimensions, document
  theme and language, computed page colors, page and dense-container overflow,
  visible mutation controls, raw i18n-key leakage, and console/runtime/network
  failures.
- Preserve durable screenshots, measurements, and a manifest under the task's
  `evidence/` directory.
- Treat this as an evidence-only slice unless a current rendered defect is
  reproduced.

## Out Of Scope

- Production component, router, API client, store, backend, persistence,
  dependency, authentication, permission-calculation, locale, or approved
  prototype changes.
- New routes, fields, pipeline states, mutation behavior, compatibility paths,
  fixtures in production, or prototype-only data.
- Repository, organization, administration, user, operations, accessibility,
  internationalization, or global responsive closure owned by later phases.
- Reusing previous screenshots or reports as proof of the current commit.
- Claiming global `A1`, `A2`, `A3`, or all 67 route rows are complete.

## Files Allowed

- `web/src/router.test.ts`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/brief.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/context.json`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/report.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/spec-review.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/quality-review.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/009-pipeline-validation-evidence/evidence/**`

## Interfaces / Seams

- The production frontend continues to use its existing `/api` client, stores,
  named routes, locale preferences, theme preferences, and permission
  calculations.
- The task-local Mock API emulates only existing HTTP response contracts and is
  never imported by production code.
- The approved prototype remains the immutable standalone artifact at
  `prototype/artifact/index.html`.
- Browser evidence normalizes viewport, theme, locale, permission role, and
  populated pipeline state while preserving each surface's real runtime.

## Components To Create

- No production component.
- One task-local Mock API harness and durable evidence files.

## Components To Reuse

- Existing `App`, shared shell, pipeline wrapper, execution overview,
  `PipelineLog`, changed-files, config, errors, Debug, router, API/store seams,
  shared feedback atoms, locale files, theme handling, and current tests.

## Components To Extract

- None. The task harness is isolated evidence infrastructure and must not become
  a production abstraction.

## API / Data Flow Contracts

- Mock responses must conform to the current production request/response shapes
  for repository, permissions, pipeline, workflows/steps, config, metadata,
  logs, Forge, applications, environments, releases, and event streaming.
- Production requests continue through the Vite proxy configured by
  `VITE_DEV_PROXY`; the task does not change production endpoint selection.
- Push/read-only evidence changes only the mocked permission response, not the
  frontend permission algorithm.
- Pipeline and diagnostic content derives from the Mock API, never from copied
  prototype fixtures.

## State / Error / Empty / Loading Behavior

- Loading: wait for route requests and rendering to settle before capturing;
  loading transitions are not redefined.
- Empty: preserve the explicit empty states already covered by focused tests;
  primary browser evidence uses populated diagnostics.
- Error: render the real pipeline parse error and workflow runtime error;
  console, runtime, or failed network requests block the evidence gate.
- Disabled: preserve current busy/unsupported action behavior; no disabled
  contract changes.
- Permission: compare authenticated push access with read-only access; all
  read routes remain reachable while mutations and Debug remain push-gated.

## TDD Requirement

- No new product-behavior test is planned because task `3.4` already owns
  focused regressions. Re-run that exact suite at the current commit.
- Independent review reproduced a timing-dependent 5-second timeout while
  `router.test.ts` dynamically imports the complete router in the combined
  eight-file run. Stabilize only that existing test's explicit timeout; do not
  weaken assertions, skip the suite, or change production routing.
- Any rendered defect must be reproduced by a failing focused test before a
  production repair, followed by an explicit allowed-file scope update and a
  passing development entry contract.

## Verification Commands

- `pnpm exec vitest run src/router.test.ts src/views/repo/pipeline/PipelineWrapper.test.ts src/views/repo/pipeline/Pipeline.test.ts src/components/repo/pipeline/PipelineLog.test.ts src/views/repo/pipeline/PipelineChangedFiles.test.ts src/views/repo/pipeline/PipelineConfig.test.ts src/views/repo/pipeline/PipelineErrors.test.ts src/views/repo/pipeline/PipelineDebug.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check src/router.test.ts src/views/repo/pipeline/PipelineWrapper.vue src/views/repo/pipeline/PipelineWrapper.test.ts src/views/repo/pipeline/Pipeline.vue src/views/repo/pipeline/Pipeline.test.ts src/components/repo/pipeline/PipelineLog.vue src/components/repo/pipeline/PipelineLog.test.ts src/views/repo/pipeline/PipelineChangedFiles.vue src/views/repo/pipeline/PipelineChangedFiles.test.ts src/views/repo/pipeline/PipelineConfig.vue src/views/repo/pipeline/PipelineConfig.test.ts src/views/repo/pipeline/PipelineErrors.vue src/views/repo/pipeline/PipelineErrors.test.ts src/views/repo/pipeline/PipelineDebug.vue src/views/repo/pipeline/PipelineDebug.test.ts`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`
- Browser review of production repository `101` / pipeline `842` and approved
  prototype pipeline routes at `1600x1000` and `390x844` in the required
  dark Simplified-Chinese and representative light-English states.

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- The Mock API cannot reproduce current production response contracts.
- Production and prototype cannot be placed in comparable route, viewport,
  theme, locale, permission, or populated-data states.
- A screenshot or source-only inspection is the sole evidence for behavior,
  overflow, runtime health, or route reachability.
- A rendered defect requires any production edit; record it, expand the task
  scope explicitly, rerun the entry contract, and add a focused red regression
  before changing production.
- Any test-stability repair exceeds `web/src/router.test.ts` or changes a
  production router/runtime contract.

## Unsafe Assumptions

- Previous task screenshots, passing tests, CSS classes, source tokens, or
  reports do not prove the current commit's rendered output.
- Matching page hierarchy does not prove route reachability, permission
  boundaries, no-overflow behavior, locale output, or runtime health.
- Pixel identity is not required when real-data hierarchy, behavior,
  responsive containment, and semantic tokens satisfy the approved contract.
- Prototype-only values must not be interpreted as missing production API
  fields or copied into the Mock API.
