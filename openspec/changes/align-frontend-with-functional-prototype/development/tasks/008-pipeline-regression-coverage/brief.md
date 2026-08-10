# Task Brief: 008-pipeline-regression-coverage

## Goal

Protect the completed pipeline detail route family with focused component and
router regressions for current production routes, status/cancellation variants,
permissions, actions, tabs, empty/error states, and responsive containment.

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

Resolve every current pipeline destination through its production named route,
then exercise the completed header, overview/log, and diagnostic surfaces across
real supported states. The suite must directly protect route parameters,
tab destinations and counts, push/read-only action boundaries, killed-pipeline
cancellation context, invalid/closed step-log routing, explicit empty/error
states, and local mobile containment without changing production behavior.

## In Scope

- Add router resolution coverage for the existing overview/step,
  changed-files, config, errors, and debug named routes under a configured root
  path.
- Add direct tab destination/count coverage and preserve the existing
  push-gated Debug tab and mutation actions.
- Cover all three supported killed-pipeline cancellation information branches:
  superseding pipeline, canceling user, and canceling step.
- Cover valid step, workflow PID, invalid step fallback, and mobile log-close
  route parameter behavior.
- Preserve and consolidate existing focused coverage for status variants,
  action intent/busy state, read-only permissions, empty workflows, pipeline
  errors, log currency, diagnostic empty states, and metadata download.
- Add structural assertions for wrapping, `min-w-0`, and internal overflow on
  the completed pipeline header, overview/log, and diagnostic surfaces.
- Repair the verified killed-pipeline step-cancellation translation parameter
  mismatch exposed by the new focused regression.

## Out Of Scope

- Production component changes other than the verified
  `PipelineWrapper.vue` cancellation-parameter correction; router, API client,
  store, backend, persistence, dependency, authentication,
  permission-calculation, locale, and prototype changes.
- New routes, query parameters, pipeline status/event variants, permissions,
  actions, data fields, fixtures, or compatibility behavior.
- Repeating task `3.5` desktop/mobile screenshot, dark-mode, representative
  light-mode, or consolidated sensory evidence.
- Reopening the completed visual implementations from tasks `3.1` through
  `3.3` without a failing regression and an explicit scope update.

## Files Allowed

- `web/src/router.test.ts`
- `web/src/views/repo/pipeline/PipelineWrapper.vue`
- `web/src/views/repo/pipeline/PipelineWrapper.test.ts`
- `web/src/views/repo/pipeline/Pipeline.test.ts`
- `web/src/components/repo/pipeline/PipelineLog.test.ts`
- `web/src/views/repo/pipeline/PipelineChangedFiles.test.ts`
- `web/src/views/repo/pipeline/PipelineConfig.test.ts`
- `web/src/views/repo/pipeline/PipelineErrors.test.ts`
- `web/src/views/repo/pipeline/PipelineDebug.test.ts`

## Interfaces / Seams

- Vue Router's existing named route table and `WOODPECKER_ROOT_PATH` remain
  authoritative; tests resolve routes without editing the router.
- `PipelineWrapper` continues to use current injected repository permissions,
  pipeline/store data, API actions, release mapping, and named tab targets.
- `Pipeline` continues to use the optional `stepId` route parameter for
  overview/log selection and `router.replace` for opening or closing a log.
- Diagnostic components continue to use their current injected data, API,
  permission, notification, clipboard, and browser download seams.

## Components To Create

- None. This slice adds regression coverage only.

## Components To Reuse

- Existing component test mounts, Vue Test Utils, Vitest, Vue Router,
  `vue-i18n`, current typed pipeline fixtures, and local component stubs.

## Components To Extract

- None. Shared fixture extraction is not justified unless the focused additions
  prove identical mutable setup across multiple test modules.

## API / Data Flow Contracts

- Route assertions use current names and parameters only.
- Action assertions continue to verify current API identifiers and returned
  pipeline navigation without simulating success in production code.
- Cancellation information derives only from `pipeline.cancel_info`.
- The killed-step cancellation branch passes the existing
  `cancel_info.canceled_by_step` value to the locale's existing `step`
  parameter; no copy or data contract changes.
- Empty/error/count/status assertions derive only from current injected
  pipeline, workflow, config, log, changed-file, error, and permission values.
- Responsive assertions protect existing local containment classes; they do not
  replace task `3.5` browser evidence.

## State / Error / Empty / Loading Behavior

- Loading: preserve current retry/debug busy assertions and completed-log
  latest-request-wins behavior.
- Empty: preserve explicit no-step, no-log-match, no-changed-files/no-match,
  no-config, and no-error states.
- Error: preserve pipeline error precedence and real runtime/parse error
  rendering.
- Disabled: preserve busy semantics and the absence of unavailable mutation
  controls.
- Permission: read-only users keep non-mutating routes while mutation and
  Debug controls remain push-gated.

## TDD Requirement

- Add focused behavior regressions before considering any production edit.
- A green test-only result is valid because the baseline task is regression
  coverage; a failing result must identify a real unsupported production
  behavior before scope can expand.

## Verification Commands

- `pnpm exec vitest run src/router.test.ts src/views/repo/pipeline/PipelineWrapper.test.ts src/views/repo/pipeline/Pipeline.test.ts src/components/repo/pipeline/PipelineLog.test.ts src/views/repo/pipeline/PipelineChangedFiles.test.ts src/views/repo/pipeline/PipelineConfig.test.ts src/views/repo/pipeline/PipelineErrors.test.ts src/views/repo/pipeline/PipelineDebug.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check src/router.test.ts src/views/repo/pipeline/PipelineWrapper.test.ts src/views/repo/pipeline/Pipeline.test.ts src/components/repo/pipeline/PipelineLog.test.ts src/views/repo/pipeline/PipelineChangedFiles.test.ts src/views/repo/pipeline/PipelineConfig.test.ts src/views/repo/pipeline/PipelineErrors.test.ts src/views/repo/pipeline/PipelineDebug.test.ts`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- A required fix touches any production file other than the allowed
  `PipelineWrapper.vue` cancellation-parameter correction, or touches the
  router, API client, store, backend, persistence, dependency, authentication,
  permission calculation, locale, or approved prototype.
- A test would assert prototype-only data, a new route/query contract, a new
  status/permission rule, or task `3.5` sensory evidence.
- Component or fixture duplication that should be extracted.

## Unsafe Assumptions

- Do not assume a route is protected merely because a tab renders; resolve each
  production named route and parameter shape directly.
- Do not assume status coverage proves cancellation-context coverage.
- Do not assume a workflow PID, step PID, and invalid route parameter have the
  same selection behavior.
- Do not treat CSS class assertions as rendered no-overflow proof; they protect
  local containment only, while task `3.5` owns browser evidence.
- Do not reinterpret existing green tests as proof of untested router, tab, or
  cancellation branches.
