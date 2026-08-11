# Task Brief: 014-repository-validation-evidence

## Goal

Users and reviewers can trust that every repository parity-matrix row has been
replayed at the current commit and assessed from equivalent-state production
and approved-prototype evidence rather than inherited screenshots or source
inspection.

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

Replay repository parity rows `3` through `23` against a deterministic Mock API
and the immutable approved prototype. Capture current desktop and 390px
evidence for every route/state, verify route identity, visible content,
permissions, locale, theme, overflow, and browser health, then update each
matrix row to `verified` or evidence-bearing `blocked`.

## In Scope

- Create a task-local deterministic Mock API that combines the repository,
  branch, pull-request, pipeline, manual-run, and settings response contracts
  already exercised by tasks `009` through `012`.
- Render production and approved-prototype repository rows `3` through `23` at
  `1600x1000` and `390x844` in dark Simplified Chinese.
- Record URL, production terminal route, viewport and PNG dimensions, document
  theme and language, expected visible content, page and dense-container
  overflow, visible mutation controls, raw i18n keys, console exceptions,
  network failures, and HTTP errors for every primary state.
- Add representative production light-English desktop/mobile evidence for the
  repository list, activity, branches, pull requests, manual run, and dense
  settings surfaces.
- Add representative production push, read-only, and administrator permission
  evidence for mutation visibility and direct-route behavior.
- Run the repository-focused regression suite from tasks `009` through `013`,
  the complete frontend Vitest suite, targeted formatting, ESLint, TypeScript,
  Vite build, JSON/JSONL parsing, evidence verification, SpecNav entry, and
  `git diff --check`.
- Update repository rows `3` through `23` in `route-parity.md` with direct
  task-local evidence references and honest `verified` or `blocked` status.
- Preserve durable screenshots, measurements, service identity, Git commit
  identity, verifier output, and a manifest under this task's `evidence/`
  directory.
- Treat this as an evidence-only slice unless current rendered output produces
  a reproducible defect.

## Out Of Scope

- Production component, router runtime, API client, store, backend,
  persistence, dependency, authentication, permission-calculation, locale, or
  approved-prototype edits.
- New routes, fields, repository states, mutation behavior, compatibility
  paths, production fixtures, or prototype-only data.
- Organization, administration, user, operations, global accessibility,
  internationalization, or change-wide responsive closure owned by later
  phases.
- Reusing task `009` through `013` screenshots as proof of the current commit.
- Marking a row `verified` from tests, source structure, route declarations, or
  a screenshot without the matching browser measurement and health record.
- Claiming global assertions `A1`, `A2`, all 67 rows, or the full change are
  complete.

## Files Allowed

- `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- `openspec/changes/align-frontend-with-functional-prototype/development/tasks/014-repository-validation-evidence/**`
- `openspec/changes/align-frontend-with-functional-prototype/development/task-graph.json`
- `openspec/changes/align-frontend-with-functional-prototype/development/task-ledger.jsonl`
- `openspec/changes/align-frontend-with-functional-prototype/development/task-context.jsonl`
- `openspec/changes/align-frontend-with-functional-prototype/development/validation-log.jsonl`
- `openspec/changes/align-frontend-with-functional-prototype/development/drift-check.jsonl`
- `openspec/changes/align-frontend-with-functional-prototype/development/handoff-to-verify.md`
- `openspec/changes/align-frontend-with-functional-prototype/tasks.md`

## Interfaces / Seams

- Production continues to use the existing Vite `/api` proxy, router, stores,
  repository permissions, locale preferences, and theme preferences.
- The task-local Mock API emulates only existing request and response
  contracts and is never imported by production code.
- The approved prototype remains the immutable standalone artifact at
  `prototype/artifact/index.html`.
- Equivalent-state comparison normalizes route purpose, viewport, dark
  Simplified-Chinese state, permission role, and populated data while
  preserving each surface's real runtime and route model.

## Components To Create

- No production component.
- One task-local Mock API, browser capture runner, evidence verifier, durable
  measurements, screenshots, and manifest.

## Components To Reuse

- Existing production repository list, repository wrapper, activity, branch,
  pull-request, pipeline, manual-run, settings, router, API/store, permission,
  shared feedback, locale, theme, and responsive-table behavior.
- The service lifecycle, Chrome DevTools Protocol capture, browser-health,
  PNG/checksum, and manifest patterns from task `009`.
- Existing repository API fixtures and selectors from tasks `010` through
  `012`, without reusing their screenshots as current evidence.

## Components To Extract

- None. Evidence infrastructure stays task-local and must not become a
  production abstraction.

## API / Data Flow Contracts

- Mock responses must conform to the current production shapes for user config,
  repository lists and activation candidates, repository permissions,
  repository details, pipelines, branches, pull requests, pipeline detail and
  diagnostics, manual-run branches, repository settings resources, Forge data,
  and event streaming.
- Production requests must resolve through the Vite proxy to this task's Mock
  API; direct and proxied repository identity must match.
- Permission evidence changes only the mocked permission response and user
  identity, never production permission calculation.
- Prototype-only labels or values are comparison context and must not be copied
  into production or invented as backend fields.

## State / Error / Empty / Loading Behavior

- Loading: wait for route requests and rendering to settle before capture;
  existing loading transitions are not redefined.
- Empty: primary evidence uses populated repository data; representative empty
  behavior remains covered by focused regressions and is not reimplemented.
- Error: any console exception, runtime exception, unexpected network failure,
  unexpected HTTP error, wrong terminal route, or missing required content
  blocks that state.
- Disabled: preserve current busy and unsupported-action behavior; no disabled
  contract changes are allowed.
- Permission: compare push/admin access with read-only access so read routes
  remain reachable and mutation controls or gated direct routes follow current
  contracts.

## TDD Requirement

- No product-behavior test is planned because baseline task `4.4` already owns
  the current repository regressions. Re-run the focused suites at the current
  commit.
- Any rendered defect must first be recorded by the browser harness and
  reproduced with a focused failing test. Before a production repair, expand
  `allowed_files`, refresh the CodeGraph development plan, and rerun the
  development entry contract until `ok:true`.

## Verification Commands

- `pnpm exec vitest run src/router.test.ts src/views/RepoAdd.test.ts src/views/repo/RepoWrapper.test.ts src/views/repo/RepoPipelines.test.ts src/views/repo/RepoBranches.test.ts src/views/repo/RepoBranch.test.ts src/views/repo/RepoPullRequests.test.ts src/views/repo/RepoPullRequest.test.ts src/views/repo/RepoManualPipeline.test.ts src/views/repo/pipeline/PipelineWrapper.test.ts src/views/repo/pipeline/Pipeline.test.ts src/components/repo/pipeline/PipelineLog.test.ts src/views/repo/pipeline/PipelineChangedFiles.test.ts src/views/repo/pipeline/PipelineConfig.test.ts src/views/repo/pipeline/PipelineErrors.test.ts src/views/repo/pipeline/PipelineDebug.test.ts src/views/repo/settings/RepoSettings.test.ts src/views/repo/settings/General.test.ts src/views/repo/settings/Secrets.test.ts src/views/repo/settings/Registries.test.ts src/views/repo/settings/Crons.test.ts src/views/repo/settings/Badge.test.ts src/views/repo/settings/Actions.test.ts src/views/repo/settings/Extensions.test.ts src/components/repo/settings/RepoSettingsNav.test.ts src/components/repo/settings/RepoSettingsSection.test.ts src/components/repo/settings/RepoSettingsTable.test.ts src/components/repo/settings/RepoSettingsActionRow.test.ts src/lib/repoBadge.test.ts src/lib/pipelineRefs.test.ts src/compositions/usePaginate.test.ts src/store/pipelines.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check <repository production/test paths and task evidence scripts>`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/014-repository-validation-evidence/evidence/mock_api_smoke.mjs`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/014-repository-validation-evidence/evidence/capture_browser.mjs`
- `node openspec/changes/align-frontend-with-functional-prototype/development/tasks/014-repository-validation-evidence/evidence/verify_evidence.mjs`
- JSON/JSONL parsing for changed SpecNav and evidence artifacts.
- `node "$SPECNAV_DEVELOPMENT_ROOT/scripts/development-contract.js" --mode entry --json`
- `git diff --check`

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- The Mock API cannot reproduce the current production request/response
  contracts.
- Production and prototype cannot be placed in comparable route, viewport,
  theme, locale, permission, or populated-data states.
- A screenshot or source-only inspection is the sole evidence for route
  reachability, visible behavior, overflow, or browser health.
- Any row lacks its expected URL, route/content measurement, viewport-matched
  PNG, overflow result, locale/theme result, or browser-health record.
- A rendered defect requires a production edit. Record the failure, expand
  scope explicitly, refresh CodeGraph, rerun development entry, and add a
  focused red regression before repair.

## Unsafe Assumptions

- Previous task screenshots, green tests, source tokens, route declarations,
  or review reports do not prove the current commit's rendered output.
- A completed implementation task does not make its parity row `verified`
  without current same-state browser evidence.
- Matching page hierarchy does not prove route reachability, permission
  boundaries, locale output, responsive containment, or runtime health.
- Pixel identity is not required when real-data hierarchy, behavior,
  responsive containment, and semantic tokens satisfy the approved contract.
- `/repos/add` is not presumed equivalent: production and prototype must be
  measured in the same activation state before the row is marked `verified` or
  evidence-bearing `blocked`.
- Pipeline screenshots from task `009` predate current repository-wrapper
  changes and cannot be reused as proof for this task.
