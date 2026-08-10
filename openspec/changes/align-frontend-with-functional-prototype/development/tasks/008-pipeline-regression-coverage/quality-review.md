# Quality Review: 008-pipeline-regression-coverage

## Verdict

approved

## Separation Of Concerns

- The only production delta is the `PipelineWrapper.vue` interpolation key
  correction from `user` to `step`. It remains presentation-only and does not
  move routing, permission, API, store, or error ownership.
- The new regressions stay with their existing route/component owners:
  router registration in `router.test.ts`, header/tabs/cancellation in
  `PipelineWrapper.test.ts`, selected-step routing in `Pipeline.test.ts`, and
  diagnostic containment in the corresponding component tests.
- No new shared component, production helper, compatibility path, or
  prototype-only data source was introduced.

## Component Cohesion / Coupling

- `PipelineWrapper` remains cohesive around route-level header, action, and tab
  composition. The one-line i18n correction matches every shipped locale's
  existing `{step}` placeholder and adds no branching or dependency.
- The component tests use local stubs to expose current props, emits, API
  intent, and router intent. Their pipeline fixtures are similar but tailored
  to different component contracts; extracting a shared mutable fixture would
  add cross-test coupling without reducing meaningful duplication.
- The containment checks intentionally couple to local layout ownership. That
  is acceptable for this static regression slice, provided they are not
  represented as browser-level no-overflow evidence.

## Test Quality

- The round-1 HIGH finding is resolved. `web/src/router.test.ts:55-67` now
  checks both directions for every destination: named resolution must generate
  the expected base-prefixed URL, and inbound `/repos/...` path resolution must
  select the expected terminal route.
- The inbound matrix verifies `repoId` and `pipelineId` for overview, selected
  step, changed files, config, errors, and Debug. It requires `stepId` for the
  selected-step path and explicitly forbids `stepId` on the overview and four
  static diagnostic paths, directly protecting the optional-route precedence
  contract.
- The cancellation matrix mounts the real wrapper with the real English locale
  and checks visible output for superseding pipeline, canceling user, and
  canceling step. It directly exposed and now protects the `{step}` production
  fix rather than duplicating translation logic in the test.
- Tab/count, permission/action, busy state, workflow/step/invalid-step
  selection, mobile close, empty/error, and stale-log assertions exercise
  component props, emits, computed behavior, API calls, and router calls
  directly. No additional false-positive pattern was found in those tests.
- The CSS assertions protect only the presence and ownership of `min-w-0`,
  wrapping, and local overflow classes. Parent-element selectors in
  `PipelineLog.test.ts`, `Pipeline.test.ts`, `PipelineConfig.test.ts`, and
  `PipelineDebug.test.ts` are somewhat markup-sensitive, but that brittleness
  is proportionate to the explicit structural-containment contract and is
  non-blocking. They must remain supplemental to task `3.5` browser evidence.
- Independent round-2 replay passed the corrected router suite at 1 file /
  2 tests, targeted Prettier, and `git diff --check`. The system-executed
  post-fix evidence also records the focused suite at 8 files / 66 tests, the
  full frontend suite at 28 files / 175 tests, ESLint, and TypeScript.

## Error Handling

- The interpolation fix adds no async or failure path. Existing mutation
  actions continue through `useAsyncAction`; no optimistic success, swallowed
  error, or new exception boundary was introduced.
- Existing focused coverage retains pipeline error precedence, runtime/parse
  error rendering, stale log response rejection, empty diagnostic states, and
  metadata cleanup. Task `008` does not add a new API error-handling contract.

## Reuse / Duplication

- Existing router, Vue Test Utils, Vitest, i18n, typed pipeline data, component
  stubs, and injection seams are reused. No dependency or bespoke test harness
  was added.
- The table-driven destination, cancellation, and route-parameter cases avoid
  copy-pasted test bodies. The remaining local mount helpers reflect different
  dependency graphs and do not justify a shared abstraction.

## Complexity Delta

- Production complexity is effectively unchanged: one interpolation-property
  rename, with no new control flow.
- The test delta is linear and readable. Consolidating six pipeline
  destinations under one dynamic router import is preferable to one import per
  case.
- `router.test.ts` still performs two module-reset/dynamic-import cycles for the
  same root path. The recorded initial timeout and subsequent focused/full
  passes make this a non-blocking cold-transform risk. The pipeline matrix
  itself performs one import rather than one import per destination.

## Required Fixes

- None. The round-1 inbound-route blocker is fixed and independently
  rechecked. This approval covers task `008` / baseline task `3.4` unit and
  static regression quality only; task `3.5` remains responsible for rendered
  desktop/mobile, theme, locale, and page-level overflow evidence.
