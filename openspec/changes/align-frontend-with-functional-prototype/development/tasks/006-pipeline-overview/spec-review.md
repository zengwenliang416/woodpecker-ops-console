# Spec Review: 006-pipeline-overview

## Verdict

approved

## Missing Requirements

- None. With no `stepId`, the route now renders an explicit execution overview
  instead of selecting the first step based on desktop width. A valid existing
  workflow or step PID still opens the existing `PipelineLog` through the
  current route parameter.
- The overview derives workflow count, flattened step count, terminal-step
  progress, pipeline duration, workflow name, translated step status, real
  step duration, and workflow environment directly from the injected pipeline.
  Empty workflows and missing environment/start-time values render explicit
  existing or localized fallbacks.
- The persisted server and frontend step contracts do not expose an execution
  image. The implementation therefore renders localized `Not reported` /
  `未报告` text and only offers the existing config route when historical
  pipeline config is available, without parsing YAML or inferring fixture data.
- Existing parse/runtime error precedence, blocked approve/decline APIs,
  declined state, no-step state, push-permission boundary, route title, step
  list, and selected-step log surface remain authoritative.

## Extra Behavior

- None. The production diff is limited to the four task-owned files and adds no
  route, API, store, backend, persistence, permission calculation, dependency,
  config parser, image field, or task-`3.3` tab-body behavior.
- The execution table is a route-specific composition that reuses the existing
  status icon, duration, badge, button, panel, step list, log, router, and i18n
  seams. Its internal horizontal scroll region does not create a new
  page-level navigation or responsive-state contract.

## Misunderstood Requirements

- None. Prototype-only queue time, CPU/resource consumption, agent, image,
  release, annotation, artifact, graph, and start-clock fixtures were
  deliberately not represented as real operational data.
- Approval is limited to task `3.2` / slice `006-pipeline-overview`. It does not
  claim completion of the full pipeline route family, task `3.3` log controls,
  or the changed-files, config, error-analysis, and debug bodies.
- The report correctly excludes the original red-test ordering because no
  replayable system receipt proves that history. The final test source,
  current independent reruns, and system-executed green receipts verify the
  implemented behavior instead.

## Cannot Verify From Diff

- Rendered prototype parity, computed responsive geometry, internal versus
  page-level overflow, theme/locale output, selected-log navigation, and
  read-only controls cannot be established from source diff alone. They are
  covered by the replayable `system-executed` receipt
  `task-006-pipeline-overview-browser-20260809`.
- That receipt verifies populated dark Simplified-Chinese desktop and
  `390x844` mobile states, representative light-English mobile output, an
  internally contained `784px` table within a `356px` viewport, the final-row
  unavailable-data fallbacks, selected-step routing to the existing log, a
  readable read-only overview with mutation/debug controls hidden, and
  approved-prototype desktop/mobile comparison.
- The temporary screenshots under
  `/tmp/woodpecker-ui-review/006-pipeline-overview/` are inspectable but are not
  durable task-packet artifacts. Their `.png` names contain JPEG-encoded files;
  production captures have the recorded `1600x1000` and `390x844` dimensions,
  while prototype captures are disclosed crops from attested viewports.

## Acceptance Assertions Verified

- `A2`: verified only for the `006` pipeline overview state. The actual
  four-file implementation, approved-prototype comparison receipt, real
  workflow/step data, preserved route/API/permission behavior, dark
  Simplified-Chinese desktop/mobile evidence, representative light-English
  evidence, and read-only state satisfy this slice's equivalent-state parity
  claim. This does not close task `3.3` or complete pipeline route-family
  parity.
- `A3`: independently verified with the focused suite (1 file, 8 tests), full
  frontend suite (24 files, 149 tests), targeted Prettier for all four
  task-owned files, ESLint, TypeScript, Vite build, tracked/untracked whitespace
  checks, and the replayable desktop/390px browser receipt. The build retains
  only the two documented pre-existing non-module script warnings for
  `/web-config.js` and `/assets/custom.js`.
- `A4`: verified only for data rendered by the `006` overview. Counts,
  terminal progress, translated statuses, pipeline/step durations, workflow
  environment, and route-selected step logs derive from current injected
  pipeline state; unavailable image, environment, and start-time values use
  explicit fallbacks rather than prototype fixtures or invented values.

## Required Fixes

- None for this slice. Task `3.3` and later pipeline tasks must be implemented
  and independently verified before any complete pipeline route-family claim.
