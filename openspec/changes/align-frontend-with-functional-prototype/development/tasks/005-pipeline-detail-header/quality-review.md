# Quality Review: 005-pipeline-detail-header

## Verdict

approved

## Separation Of Concerns

- The header composition remains local to the pipeline-detail route and reuses
  the existing store, API, router, permission, notification, date, and
  deployment seams. It does not pull task `3.2` overview/log content or task
  `3.3` route-body redesign into this slice.
- The action boundary is readable: push permission and a non-blocked status
  gate the action group, pending/running gate Cancel, and success plus
  `allow_deploy` gates Deploy.
- Status and event labels remain presentation-only computed values. They do not
  alter pipeline state, permission calculation, API intent, or routing.

## Component Cohesion / Coupling

- Keeping the domain-specific header in `PipelineWrapper.vue` is cohesive; a
  generic page-header component is not justified by this slice.
- The full status and event switches from the first review are gone. Status
  labels resolve through the existing status key convention and fall back to
  the raw status instead of rendering an empty label.
- Event labels use the `WebhookEvents` value directly except for four typed
  aliases required by existing locale key names. Missing translations fall
  back to the raw event rather than being mislabeled as Push.
- The four-entry alias record is a small locale adapter, not a second complete
  domain mapping. Extracting it outside the four-file scope would add
  indirection without a demonstrated additional consumer contract.

## Test Quality

- Independently rerun: the focused suite passed 1 file and 29 tests, and an
  isolated full rerun passed 23 files and 141 tests. Targeted Prettier, ESLint,
  TypeScript, and `git diff --check` also passed.
- Table-driven cases assert the visible translation for all 11 current
  `PipelineStatus` values and all 9 current `WebhookEvents` values.
- Action tests cover running and pending Cancel, terminal non-blocked Retry,
  blocked/read-only mutation hiding, `allow_deploy=false`, release-backed
  Deploy, legacy popup fallback, returned-pipeline routing, and Retry
  `aria-busy` entry and cleanup.
- The report no longer presents the unrecorded original red run as acceptance
  evidence. The current green focused/full receipts are replayable and
  system-executed.
- Updated browser evidence covers equivalent dark Simplified-Chinese
  production/prototype states plus production push/read-only permissions at
  desktop and mobile widths. Production captures are true `1600x1000` and
  `390x844`; prototype screenshot cropping is explicitly disclosed and the
  outer viewports are separately attested.
- One concurrent review run timed out in the unrelated `router.test.ts` while
  several heavy checks ran in parallel. The immediate isolated full rerun
  passed all 141 tests, matching the recorded system-executed receipt.

## Error Handling

- Cancel and Retry continue through `useAsyncAction`, and notifications are
  emitted only after the API calls succeed. No new swallowed-error or
  fabricated-success path was introduced.
- Missing i18n entries now degrade to the actual status or event value, keeping
  execution context visible without silently substituting a different event.
- Loading and API error ownership remains with the existing pipeline store and
  `useAsyncAction` seams.

## Reuse / Duplication

- Existing `Scaffold`, `Tab`, `Button`, `PipelineStatusIcon`,
  `RenderMarkdown`, `DeployPipelinePopup`, `usePipeline`, stores, and action
  composables are reused appropriately.
- The duplicated 11-case status switch and 9-case event switch identified in
  the first review were removed. The remaining four event aliases only bridge
  enum values to legacy locale key names and are typed against
  `WebhookEvents`.
- No new header abstraction, tab system, action component, prototype fixture,
  or deployment implementation was introduced.

## Complexity Delta

- The action and tab conditions remain simple and do not need abstraction.
- Replacing the two complete switches with dynamic key resolution and a
  four-entry alias record removes most of the first-round branching and drift
  risk.
- The remaining complexity is proportional to the route's real responsibilities:
  header presentation, existing action orchestration, deploy target selection,
  and route-tab registration.

## Acceptance Assertions Verified

- `A2`: verified for the pipeline detail header through approved-prototype
  hierarchy comparison, preserved route/API/permission/deploy behavior, and
  equivalent desktop/mobile browser evidence.
- `A3`: verified through focused and full frontend tests, targeted formatting,
  lint, type checking, build, and diff checks for the reviewed slice.

## Required Fixes

- None. The first-round mapping, fallback, test-coverage, TDD-claim, and browser
  evidence issues are resolved. This approval covers only the pipeline detail
  header, primary actions, and existing tab registration in task `3.1`; it
  makes no completion claim for tasks `3.2` or `3.3`.
