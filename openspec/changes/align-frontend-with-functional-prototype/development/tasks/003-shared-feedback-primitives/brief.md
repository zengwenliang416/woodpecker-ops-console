# Task Brief: 003-shared-feedback-primitives

## Goal

Users can understand and safely act on shared loading, empty, error, disabled,
permission, and stale states across repository and pipeline route families.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/component-impact-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/specs/component-architecture/design.md`

## Vertical Slice

Open repository branches, pipeline debug, or repository activation and receive
the same prototype-aligned feedback language for loading, no results, missing
permission, and stale/conflict states. Loading actions cannot be triggered
repeatedly, and errors are announced to assistive technology.

## In Scope

- Add one shared `FeedbackState` display component with `loading`, `empty`,
  `error`, `permission`, `disabled`, and `stale` variants.
- Support title, description, compact presentation, semantic live-region
  behavior, and an optional action slot without importing stores or APIs.
- Repair `Button` and `IconButton` so loading implies a real disabled state,
  exposes `aria-busy`, and blocks link navigation while busy or disabled.
- Repair the existing atomic `Error` component with alert semantics while
  preserving current slot/text behavior.
- Replace repository-branch loading/empty markup, pipeline-debug permission
  markup, and repository-activation stale/conflict explanation with the shared
  feedback component.
- Keep every new visible string in English and Simplified Chinese dictionaries.
- Add focused component and consumer tests for variants, action slots,
  loading/disabled semantics, alert semantics, and representative route-state
  integration.

## Out Of Scope

- Changing API calls, pagination behavior, route names, authentication,
  repository permission calculation, stores, or backend contracts.
- Adding retry behavior where the route has no existing retry/data contract.
- Restyling completed route content outside the feedback blocks.
- Replacing notifications, form validation, badges, or field-level disabled
  styling with the new panel.
- Adding dependencies or copying prototype fixtures/JavaScript.

## Files Allowed

- `web/src/components/atomic/FeedbackState.vue`
- `web/src/components/atomic/FeedbackState.test.ts`
- `web/src/components/atomic/Button.vue`
- `web/src/components/atomic/Button.test.ts`
- `web/src/components/atomic/IconButton.vue`
- `web/src/components/atomic/IconButton.test.ts`
- `web/src/components/atomic/Error.vue`
- `web/src/components/atomic/Error.test.ts`
- `web/src/views/repo/RepoBranches.vue`
- `web/src/views/repo/RepoBranches.test.ts`
- `web/src/views/repo/pipeline/PipelineDebug.vue`
- `web/src/views/repo/pipeline/PipelineDebug.test.ts`
- `web/src/views/RepoAdd.vue`
- `web/src/views/RepoAdd.test.ts`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`

## Interfaces / Seams

- `FeedbackState` is a display-only atomic component. Pages own state and pass
  translated copy; the component emits no API or routing behavior.
- `Button` and `IconButton` derive an internal interactive-disabled state from
  `disabled || isLoading`; links render as disabled buttons while blocked.
- `RepoBranches.vue` continues to receive `loading` and `data` from
  `usePagination`.
- `PipelineDebug.vue` continues to receive permission state from the existing
  `repo-permissions` injection.
- `RepoAdd.vue` continues to use current conflict flags from the real repository
  list response.

## Components To Create

- `FeedbackState.vue`.
- Focused test files for the new component, repaired atomic controls, atomic
  error semantics, and the two representative route integrations.

## Components To Reuse

- Existing `Button`, `IconButton`, `Error`, `PrototypeIcon`, Vue slots, Vue
  Router, Vue i18n, `usePagination`, required injections, and current page
  orchestration.

## Components To Extract

- The repeated page-local loading, empty, permission, and stale feedback blocks
  are extracted into `FeedbackState` after confirmed use in repository and
  pipeline families.

## API / Data Flow Contracts

- No API, payload, mutation, store, or persistence contract changes.
- Loading/empty values remain owned by `usePagination`.
- Permission truth remains the injected `repoPermissions.push` value.
- Stale/conflict truth remains `Repo.has_forge_name_conflict`.
- Busy actions still run their existing handlers once; the atomic control only
  prevents repeat interaction while `isLoading` is true.

## State / Error / Empty / Loading Behavior

- Loading: live polite status, spinner, translated title/description, and busy
  controls are natively disabled.
- Empty: neutral panel with translated result explanation.
- Error: assertive alert semantics without simulated retry or success.
- Disabled: native disabled button semantics and a disabled feedback variant.
- Permission: neutral/locked panel derived from existing permission state.
- Stale: warning panel explaining the existing repository identity conflict and
  its current settings action.

## TDD Requirement

- Write or update focused behavior tests before or alongside implementation.

## Verification Commands

- `pnpm exec vitest run src/components/atomic/FeedbackState.test.ts src/components/atomic/Button.test.ts src/components/atomic/IconButton.test.ts src/components/atomic/Error.test.ts src/views/RepoAdd.test.ts src/views/repo/RepoBranches.test.ts src/views/repo/pipeline/PipelineDebug.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check src/components/atomic/FeedbackState.vue src/components/atomic/FeedbackState.test.ts src/components/atomic/Button.vue src/components/atomic/Button.test.ts src/components/atomic/IconButton.vue src/components/atomic/IconButton.test.ts src/components/atomic/Error.vue src/components/atomic/Error.test.ts src/views/RepoAdd.vue src/views/RepoAdd.test.ts src/views/repo/RepoBranches.vue src/views/repo/RepoBranches.test.ts src/views/repo/pipeline/PipelineDebug.vue src/views/repo/pipeline/PipelineDebug.test.ts src/assets/locales/en.json src/assets/locales/zh-Hans.json`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- A consumer requires new retry, permission, API, store, or persistence
  behavior.
- A disabled link must remain navigable for an undocumented workflow.

## Unsafe Assumptions

- Do not assume visual opacity prevents click or keyboard activation.
- Do not assume a notification is a persistent route-level error state.
- Do not assume missing push permission should redirect; preserve the existing
  in-route denial.
- Do not reinterpret a stale repository conflict or invent repair success.
- Do not add generic state-machine logic without a second real consumer.
