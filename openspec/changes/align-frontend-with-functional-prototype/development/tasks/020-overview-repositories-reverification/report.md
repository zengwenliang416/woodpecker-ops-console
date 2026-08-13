# Task Report: 020-overview-repositories-reverification

## Status

DONE

## Files Changed

- Updated `web/src/views/Overview.vue` and
  `web/src/views/Overview.test.ts`.
- Updated `web/src/views/Repos.vue` and `web/src/views/Repos.test.ts`.
- Updated `web/src/App.vue` and `web/src/App.test.ts` under the user-approved
  review-fix scope expansion.
- Added bilingual Overview and Repositories feedback copy in
  `web/src/assets/locales/en.json` and `zh-Hans.json`.
- Added task-local deterministic Mock API, smoke runner, current-byte Chrome
  capture, independent verifier, persistent red-team, exact `20` measurement
  JSON files, exact `20` PNG screenshots, checksummed manifest, and replay
  summary under `evidence/`.
- Added task packet, CodeGraph plan updates, report, reviews, and append-only
  implementation lifecycle records.

## What Changed

- Overview no longer renders fake zero metrics while the first current-data
  request is pending. It now renders explicit loading, retryable core failure,
  and partial-failure feedback while preserving confirmed core content.
- Overview only requests and renders Agent and queue data for system
  administrators. Normal users receive the real repository count instead, and
  overlapping refreshes adopt only the newest completion.
- Overview tracks repository and Agent confirmation independently. A first
  failed optional request renders an explicit unavailable placeholder rather
  than a fabricated zero, while a failed refresh preserves previously
  confirmed repository, Agent, and queue values.
- Repositories distinguishes first-load failure, no repositories, filtered
  empty results, refresh failure with confirmed rows, and optional Forge or
  pipeline-stat partial failure.
- Repository metric refresh preserves the last confirmed values on failure.
  Explicit refresh forces a new metric fetch, ordinary pagination reuses the
  cache, and generation ownership prevents obsolete metric requests from
  overwriting the newest page. Initial empty-store hydration now requests each
  visible repository's pipeline statistics exactly once.
- Repositories uses stable bilingual initial-load and refresh guidance instead
  of rendering arbitrary `Error.message` content.
- The user-approved shared error-policy repair keeps the existing localized
  404 notification and replaces every other raw global API error payload with
  the existing localized generic error. Task 020 partial states no longer
  expose English `Service Unavailable` text or JSON.
- Current run `1eae7bc3-e742-4aac-bce0-ec61105eebb8` captured exact
  production/prototype Overview and Repositories states. The `8` equivalent
  states cover dark Simplified Chinese on production and the approved
  prototype at `1600x1000` and `390x844`; `8` representative states cover
  production light English and the prototype's real light Chinese support;
  `4` production boundary states cover a normal user, Overview partial
  failure, empty Repositories, and Repositories partial failure.
- The independent verifier recomputes source-tree identities, content
  assertions, exact route/path, theme, language, role, data state, allowed HTTP
  failures, normal-user request inventory, page overflow, mobile table local
  scrolling, raw localization keys, browser health, PNG signature/dimensions,
  and aggregate checksums.
- The persistent red-team proves the verifier rejects `15` isolated mutations:
  run ID, theme, locale, body content, missing state, role, route, browser
  health, raw i18n, raw server toast, normal-user administrator request,
  unexpected HTTP error, page overflow, source identity, and PNG signature.

## TDD Evidence

- Added focused page tests before final closure for initial loading, core and
  partial errors, retries, confirmed-data preservation, administrator versus
  normal-user requests, overlapping refreshes, empty and filtered-empty
  repositories, pagination, selection, cached versus forced metrics, and
  obsolete metric requests.
- Focused command passes `5` files and `26` tests:
  `App.test.ts`, `Overview.test.ts`, `Repos.test.ts`,
  `repoMetrics.test.ts`, and `store/repos.test.ts`.
- Full frontend Vitest passes `87` files and `513` tests.
- The positive evidence verifier passes the exact `20` measurements and `20`
  screenshots; all `15` persistent negative mutations exit non-zero.

## Verification Commands

- PASS: focused Vitest, `5` files / `26` tests.
- PASS: full Vitest, `87` files / `513` tests.
- PASS: targeted Prettier for production, tests, task packet, evidence scripts,
  manifest, summaries, and reviews.
- PASS: complete ESLint with zero warnings.
- PASS: Vue TypeScript.
- PASS: Vite build; only the established `/web-config.js` and
  `/assets/custom.js` non-module warnings remain.
- PASS: Mock API smoke across populated, normal-user, empty, and partial states.
- PASS: final browser capture run
  `1eae7bc3-e742-4aac-bce0-ec61105eebb8`, `20/20` states and zero failed
  states.
- PASS: independent strict verifier, exact `20` measurements and `20` PNGs for
  rows `2-3`, zero page overflow, zero raw i18n keys, and zero normal-user
  administrator requests.
- PASS: persistent verifier red-team, positive exit `0` and all `15` mutations
  rejected.
- PASS: evidence JavaScript/Python syntax, JSON/JSONL parsing, source identity,
  checksums, bounded service cleanup, and `git diff --check`.

## Concerns

- Partial API failures still produce both the scoped page feedback and the
  existing global notification. Both are now localized, and the strict
  verifier rejects raw server payloads or an English generic notification in a
  Chinese state.
- The approved prototype is Simplified Chinese only. Equivalent comparison
  therefore uses dark Chinese on both surfaces; production English and
  prototype light Chinese are representative capability checks rather than a
  fabricated prototype-English state.

## Scope Deviations

- No route, API, backend contract, typed payload, persistence, dependency,
  permission algorithm, production fixture, or approved-prototype byte changed.
- Independent review proved the existing global error handler exposed raw
  English/JSON server payloads in Task 020 partial states. The user explicitly
  approved the minimal scope expansion to `web/src/App.vue` and
  `web/src/App.test.ts` on 2026-08-13. No API contract or request behavior
  changed.

## Follow-up Needed

- Bind the approved current-byte reviews to a signed system-executed validation
  receipt after the implementation/evidence commit.
- Then update only parity rows `2-3`, baseline task `6.1`, task `020`, and the
  development handoff/lifecycle records. Tasks `6.2+`, operations rows `46+`,
  blocked row `4`, and complete change-level acceptance remain open.

## Adjudication

The implementation evidence supports task-scoped `A1`, `A2`, `A3`, and `A4`
for Overview and Repositories only. Parent `acceptance.json` remains failing
until the later route families and cross-cutting tasks complete.
