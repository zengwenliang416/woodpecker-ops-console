# Task Brief: 007-pipeline-log-diagnostics

## Goal

Users can inspect real step logs, changed-file paths, historical pipeline
configuration, parse/runtime errors, and permission-gated debug metadata
through a consistent responsive diagnostic surface.

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

Open any existing pipeline diagnostic destination and receive a coherent
prototype-aligned card/control hierarchy over current production data:
searchable/filterable step logs, an explicit changed-file path list, decoded
historical configuration, structured real errors, and the existing
permission-gated metadata debug flow. Dense log/config/error content remains
contained on desktop and `390px` without replacing current routes, APIs,
permissions, downloads, deletion, streaming, or grouping behavior.

## In Scope

- Align the existing `PipelineLog` header and toolbar with the approved log
  hierarchy while preserving fullscreen, download, push-gated deletion,
  auto-scroll, grouped-command expansion/collapse, live streaming, line links,
  highlighted error/warning types, exit code, and mobile close behavior.
- Add client-side log search, errors-only filtering, and line wrapping over the
  already loaded real log buffer, with an explicit no-match state and a clear
  way to reset filters.
- Align changed-files around the real `pipeline.changed_files` path list with a
  count, local path search, explicit no-files/no-match states, and responsive
  containment. Do not claim diff hunks or line statistics that the API omits.
- Align historical configuration panels with file identity, decoded read-only
  YAML, copy intent where supported by existing browser APIs, explicit empty
  state, and contained code scrolling. Do not edit, format, validate, or parse
  the configuration.
- Align runtime and parse/warning errors into responsive semantic sections with
  current messages, typed metadata, documentation links, and real navigation
  to existing pipeline destinations. Add an explicit no-error state.
- Align the existing debug metadata instructions, metadata download, version,
  success/error feedback, busy state, and no-push permission state with shared
  cards and feedback primitives.
- Add focused tests for every affected surface and matching English and
  Simplified-Chinese visible copy.

## Out Of Scope

- Adding a new `?tab=logs` query-state contract or changing the current
  `stepId` route used by `PipelineLog`.
- Adding diff content, additions/deletions, file contents, previous-success
  comparisons, first-failure summaries, remediation suggestions, or error
  annotations not exposed by the current pipeline API.
- Making historical config editable or adding format, validation, dependency,
  secret-reference, matrix, provenance, or syntax-analysis claims.
- Adding interactive debug sessions, SSH/Web Terminal access, container
  retention, TTL controls, environment/tool inventory, or new debug APIs.
- Adding artifacts, release details, agent/resource/image data, or prototype
  fixtures.
- Router, API client, store, backend, persistence, dependency, authentication,
  permission calculation, pipeline header/overview, or approved prototype
  edits.

## Files Allowed

- `web/src/components/repo/pipeline/PipelineLog.vue`
- `web/src/components/repo/pipeline/PipelineLog.test.ts`
- `web/src/views/repo/pipeline/PipelineChangedFiles.vue`
- `web/src/views/repo/pipeline/PipelineChangedFiles.test.ts`
- `web/src/views/repo/pipeline/PipelineConfig.vue`
- `web/src/views/repo/pipeline/PipelineConfig.test.ts`
- `web/src/views/repo/pipeline/PipelineErrors.vue`
- `web/src/views/repo/pipeline/PipelineErrors.test.ts`
- `web/src/views/repo/pipeline/PipelineDebug.vue`
- `web/src/views/repo/pipeline/PipelineDebug.test.ts`
- `web/src/style/console.css`
- `web/src/assets/locales/en.json`
- `web/src/assets/locales/zh-Hans.json`

## Interfaces / Seams

- `PipelineWrapper.vue` continues to provide `pipeline`, `pipeline-configs`,
  `repo`, and `repo-permissions`; its header, actions, and route tabs are not
  changed.
- `Pipeline.vue` continues to mount `PipelineLog` only for the current selected
  real `stepId`; no separate log route/query state is introduced.
- `PipelineLog` continues to use `ApiClient.getLogs`, `deleteLogs`,
  `downloadLogs`, and `subscribeLogs` with current pipeline/step identifiers.
- `PipelineChangedFiles` continues to use only
  `pipeline.changed_files?: string[]`.
- `PipelineConfig` continues to decode injected `PipelineConfig[]` and render
  read-only content.
- `PipelineErrors` continues to use `Pipeline.errors`,
  `workflowsWithErrors`, typed error guards, `DocsLink`, and `RenderMarkdown`.
- `PipelineDebug` continues to use repository push permission and
  `ApiClient.getPipelineMetadata` for the existing metadata download.

## Components To Create

- None. These are existing domain-specific route and log surfaces.

## Components To Reuse

- Existing `Panel`, `FeedbackState`, `Button`, `IconButton`, `InputField`,
  `SyntaxHighlight`, `FileTree`, `DocsLink`, `RenderMarkdown`,
  `PipelineStatusIcon`, semantic Tailwind tokens, Vue i18n, Vue Router,
  notifications, browser download/clipboard APIs, and existing API seams.

## Components To Extract

- None at task entry. The five destinations have different real data and action
  contracts; reuse shared atoms/layouts instead of adding a configurable
  diagnostic-page abstraction. Extract only if implementation proves repeated
  state or control logic with an identical typed contract.

## API / Data Flow Contracts

- Log fetch, live subscription, download, and deletion remain on the existing
  `ApiClient` methods and wait for their current server behavior.
- Log search, errors-only filtering, and wrapping are local presentation state
  over already loaded lines; they do not change log retrieval or persistence.
- Changed-file filtering is local presentation state over the injected path
  strings and does not request or invent diff data.
- Historical config remains the injected base64 payload decoded for read-only
  display; it is not parsed as YAML or sent back to the server.
- Error presentation remains derived from current pipeline/workflow error
  objects.
- Debug metadata download remains the current authenticated API call and
  browser object-URL flow.
- No optimistic success, simulated response, endpoint, payload, store,
  permission rule, backend field, or dependency is introduced.

## State / Error / Empty / Loading Behavior

- Loading: preserve real log loading/streaming states and debug download busy
  state; no fixture rows or config/error data render while absent.
- Empty: distinguish no logs, no log filter match, no changed files, no changed
  file match, no historical config, and no errors.
- Error: preserve existing API notification behavior for log and metadata
  operations; render current pipeline errors without fabricating remediation.
- Disabled: busy download/delete/metadata controls use existing native disabled
  and `aria-busy` behavior; unavailable actions are not simulated.
- Permission: log deletion and debug metadata remain repository-push gated;
  read-only log, changed-file, config, and error inspection remain available.

## TDD Requirement

- Add focused tests before production markup changes for log filtering/wrapping
  and preserved actions, changed-file no-data/no-match behavior, config
  decoding/empty/copy behavior, error section/empty behavior, debug
  permission/download feedback, and responsive containment contracts.

## Verification Commands

- `pnpm exec vitest run src/components/repo/pipeline/PipelineLog.test.ts src/views/repo/pipeline/PipelineChangedFiles.test.ts src/views/repo/pipeline/PipelineConfig.test.ts src/views/repo/pipeline/PipelineErrors.test.ts src/views/repo/pipeline/PipelineDebug.test.ts`
- `pnpm test -- --run`
- `pnpm exec prettier --check src/components/repo/pipeline/PipelineLog.vue src/components/repo/pipeline/PipelineLog.test.ts src/views/repo/pipeline/PipelineChangedFiles.vue src/views/repo/pipeline/PipelineChangedFiles.test.ts src/views/repo/pipeline/PipelineConfig.vue src/views/repo/pipeline/PipelineConfig.test.ts src/views/repo/pipeline/PipelineErrors.vue src/views/repo/pipeline/PipelineErrors.test.ts src/views/repo/pipeline/PipelineDebug.vue src/views/repo/pipeline/PipelineDebug.test.ts src/style/console.css src/assets/locales/en.json src/assets/locales/zh-Hans.json`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`
- Targeted browser review of selected-step logs, changed files, config, errors,
  and debug at desktop and `390x844`, including dark Simplified Chinese,
  representative light/English, empty/filter states, push/read-only
  permissions, and contained dense content.

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- A required change touches router, API client, store, backend, persistence,
  dependency, authentication, permission calculation, pipeline header/overview,
  or the approved prototype.
- The implementation needs diff contents/statistics, editable/validated config,
  interactive debug sessions, artifacts, annotations, image/agent/resource
  fields, or any other unsupported prototype fixture.
- Log controls would alter retrieval, streaming, deletion, download, grouping,
  or current `stepId` route semantics instead of remaining presentation-only.
- Component duplication that should be extracted.

## Unsafe Assumptions

- Do not assume `changed_files` contains diff hunks or line statistics.
- Do not assume decoded historical config is valid YAML or safe to rewrite.
- Do not assume every error has file, field, docs, suggestion, step, exit-code,
  previous-success, or log-context data.
- Do not assume the existing metadata download endpoint creates an interactive
  debug session.
- Do not assume client-side log filters may discard the underlying log buffer,
  interrupt streaming, change line anchors, or alter downloaded/deleted logs.
- Do not let prototype controls override current repository permissions or real
  API availability.
