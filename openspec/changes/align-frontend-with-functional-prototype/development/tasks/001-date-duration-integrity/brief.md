# Task Brief: 001-date-duration-integrity

## Goal

Users see a neutral fallback instead of invalid, negative, non-finite, or
extreme dates and durations wherever the shared frontend formatting boundary is
used.

## Parent Artifacts

- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/spec-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/component-impact-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/decision.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/artifact/index.html`

## Vertical Slice

Reproduce invalid or extreme values with focused tests, normalize them in the
shared date/duration compositions, and prove valid values retain locale-aware
presentation.

## In Scope

- Date validity checks and neutral fallback rendering in `useDate`.
- Duration validity checks for missing, negative, non-finite, and extreme input.
- Elapsed-time guards that prevent invalid timer state from reaching formatters.
- Focused Vitest coverage for valid, invalid, boundary, locale, and running-time cases.

## Out Of Scope

- Route-family visual restyling or shell changes.
- Direct replacement of page-local formatters outside the four allowed files.
- Backend API, persistence, permission, pipeline-state, or deployment-state changes.
- New dependencies or changes to public route contracts.

## Files Allowed

- `web/src/compositions/useDate.ts`
- `web/src/compositions/useElapsedTime.ts`
- `web/src/compositions/useDate.test.ts`
- `web/src/compositions/useElapsedTime.test.ts`

## Interfaces / Seams

- Existing `useDate()` return API used by pipeline, agent, cron, and settings consumers.
- Existing `useElapsedTime(running, startTime)` computed `time` and `running` return values.
- Vue i18n locale propagation through `useI18n.ts`.

## Components To Create

- No visual component is expected.
- Focused test files may be created beside the compositions.

## Components To Reuse

- Existing `useDate`, `useElapsedTime`, Vue refs/computed lifecycle, and Intl formatters.

## Components To Extract

- Extract a small internal validity guard only if both date and duration paths share the exact contract.
- Do not introduce a general formatting abstraction without a second concrete consumer.

## API / Data Flow Contracts

- Input values remain milliseconds for durations and `Date` or epoch milliseconds for date helpers.
- No network request or store mutation is added.
- Valid values remain locale-aware and the neutral fallback is deterministic.

## State / Error / Empty / Loading Behavior

- Loading: running elapsed time continues updating once per second for valid input.
- Empty: undefined start or duration values resolve to the neutral fallback at formatting time.
- Error: invalid `Date`, negative duration, `NaN`, and infinities never reach `Intl` formatting.
- Disabled: not applicable; no user action is introduced.
- Permission: not applicable; the shared formatting boundary does not alter authorization.

## TDD Requirement

- Write or update focused behavior tests before or alongside implementation.

## Verification Commands

- `pnpm exec vitest run src/compositions/useDate.test.ts src/compositions/useElapsedTime.test.ts`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `git diff --check`

## Stop Conditions

- Scope lock mismatch.
- Missing product, architecture, data-flow, or component decision.
- Component duplication that should be extracted.
- A required fix reaches a page-local formatter outside the allowed files.
- Existing consumers require different fallback copy or units that are not defined by current requirements.

## Unsafe Assumptions

- Do not assume every numeric timestamp is valid merely because it is finite.
- Do not assume zero, a missing value, and an invalid value have identical domain meaning.
- Do not assume page-local direct `Date` formatting is covered by this first slice.
