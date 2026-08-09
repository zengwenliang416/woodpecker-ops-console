# Task Brief: 006-pipeline-overview

## Goal

Users can understand a pipeline's real workflow and step execution state before
opening a specific step log, with explicit environment and image availability
instead of prototype fixture data.

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

Open a real repository pipeline at its overview route and receive a responsive
execution summary plus step table derived from the current pipeline workflows.
Each row exposes translated status, real duration, workflow environment, and an
honest image-availability fallback, then opens the existing step log through
the current `stepId` route parameter. Existing approval, decline, error, and
detail-header action flows remain authoritative.

## In Scope

- Replace desktop's implicit first-step log selection with an explicit overview
  as the default route state.
- Summarize real workflow count, step count, terminal-step progress, and
  pipeline duration without queue/resource fixture metrics.
- Render each real step with workflow name, translated status, real duration,
  workflow environment badges or an explicit fallback, and an image column.
- Render image as explicitly unavailable because the persisted/API
  `PipelineStep` contract does not expose the backend execution image.
- Link the image fallback to the existing configuration route when historical
  pipeline config is available.
- Open the existing `PipelineLog` by setting the current `stepId` route
  parameter from either the step list or overview row action.
- Preserve parse/runtime error precedence, blocked approval/decline APIs,
  declined state, no-step state, current permissions, and the route title.
- Add focused component tests and matching English/Simplified-Chinese copy.

## Out Of Scope

- Parsing YAML config in the browser, importing an undeclared YAML dependency,
  adding image to the frontend/API/backend step contract, or guessing an image
  from step/workflow names.
- Queue time, CPU/resource consumption, agent names, release outcome cards,
  graph mode, annotations, or artifacts shown only by prototype fixtures.
- Redesigning the log console or adding a separate log query tab from task
  `3.3`.
- Redesigning changed-files, config, errors, or debug page bodies from task
  `3.3`.
- Restart, cancel, deploy, or detail-header changes owned by task `3.1`.
- Router, API client, store, backend, persistence, dependency, permission, or
  approved prototype edits.

## Files Allowed

- `web/src/views/repo/pipeline/Pipeline.vue`
- `web/src/views/repo/pipeline/Pipeline.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`

## Interfaces / Seams

- `PipelineWrapper.vue` continues to provide `pipeline`, `pipeline-configs`,
  `repo`, and `repo-permissions`.
- `PipelineStepList` remains the workflow/step navigation source and emits the
  selected real step PID.
- `PipelineLog` remains the existing log surface and is mounted only when a
  valid `stepId` is selected.
- Vue Router continues to own `stepId` through `router.replace` without a new
  route or query-state contract.
- `PipelineStatusIcon`, `PipelineStepDuration`, `Badge`, `Panel`, `Button`, and
  existing semantic Tailwind tokens remain the visual building blocks.
- `usePipeline` remains the shared pipeline-duration formatter.

## Components To Create

- None. The overview is a domain-specific composition inside the existing
  pipeline route.

## Components To Reuse

- Existing `PipelineStepList`, `PipelineLog`, `PipelineStatusIcon`,
  `PipelineStepDuration`, `Badge`, `Panel`, `Button`, `Icon`, `Container`,
  `usePipeline`, Vue i18n, notifications, and Vue Router.

## Components To Extract

- None in this slice. The step table has no second consumer with the same
  workflow, environment, image-availability, and log-navigation contract.

## API / Data Flow Contracts

- Pipeline/workflow/step state continues through the injected real `Pipeline`
  loaded by `usePipelineStore`.
- Historical config availability continues through injected
  `PipelineConfig[]` loaded by `ApiClient.getPipelineConfig`; config contents
  are not parsed or reinterpreted in this slice.
- Approve continues through
  `ApiClient.approvePipeline(repo.id, pipeline.number)`.
- Decline continues through
  `ApiClient.declinePipeline(repo.id, pipeline.number)`.
- Step log navigation continues through the existing route `stepId` parameter
  and the existing log API behavior inside `PipelineLog`.
- No optimistic state, simulated success, endpoint, payload, store, permission
  rule, or backend field is introduced.

## State / Error / Empty / Loading Behavior

- Loading: retain the wrapper's existing pipeline/config loading gate; do not
  render fake workflow data.
- Empty: render the existing no-step message in a full overview panel.
- Error: parse/runtime errors still replace the overview when current error
  precedence requires it; existing errors route remains the destination.
- Disabled: existing async approval/decline busy state remains unchanged.
- Permission: approval/decline controls remain visible only with repository
  push permission; overview and step/log reading remain read-only.

## TDD Requirement

- Add focused component tests before production markup changes. The initial red
  run must cover default overview state, real summary and step context, explicit
  image fallback/config entry, step-log routing, empty state, error precedence,
  and blocked approval/decline behavior.

## Verification Commands

- `pnpm exec vitest run src/views/repo/pipeline/Pipeline.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check src/views/repo/pipeline/Pipeline.vue src/views/repo/pipeline/Pipeline.test.ts src/assets/locales/en.json src/assets/locales/zh-Hans.json`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`
- Targeted browser review of a populated pipeline overview at desktop and
  `390x844`, including default overview, selected-step log entry, dark
  Simplified Chinese, representative light/English, and read-only permission.

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- A required change touches router, API client, store, permission calculation,
  backend, dependency, or approved prototype files.
- Per-step image display would require parsing arbitrary YAML, importing an
  undeclared dependency, changing the API, or inferring prototype fixture data.
- The implementation changes task `3.3` log controls or other tab bodies.
- The implementation duplicates a proven shared overview/table component
  rather than extending an existing component or keeping unique composition
  local.

## Unsafe Assumptions

- Do not assume the internal executor step image is part of the persisted/API
  `PipelineStep`; the current server model and frontend type omit it.
- Do not assume historical config order or YAML syntax can be safely mapped to
  persisted step PIDs in the browser.
- Do not assume prototype queue time, resource consumption, agent name, image,
  start clock, release, annotation, or artifact fixtures exist in production.
- Do not assume the first step log should open when the overview route has no
  `stepId`.
- Do not let prototype presentation override real error, approval, decline, or
  permission behavior.
