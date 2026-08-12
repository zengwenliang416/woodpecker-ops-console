# Task Report: 017-user-auth-routes

## Status

DONE_WITH_CONCERNS

## Files Changed

- User settings wrapper/navigation, account preferences, personal Secrets,
  personal Registries, CLI/API token, optional Agents, guest login, CLI local
  authorization, catch-all not-found, router coverage, bilingual locale copy,
  focused tests, and task-local browser evidence/lifecycle artifacts.

## What Changed

- `/user` now uses a responsive five-destination settings hierarchy with
  desktop sidebar, mobile horizontal navigation, active-route semantics,
  logout, and `minmax(0, 1fr)` content containment.
- The account page renders only current authenticated `User` identity fields
  and browser-owned locale, theme, and collapsed-log-group preferences. No
  profile mutation, avatar synchronization, notification, or timezone contract
  was introduced.
- Personal Secrets and Registries use the authenticated user's `org_id` with
  the existing organization APIs. Explicit loading, empty, error, retry,
  confirmed-row, mutation-rejection, duplicate-action, editor-generation, and
  unmount behavior preserve active data and release successor editors.
- CLI/API uses only `getToken()` and `resetToken()`. Token examples never render
  `undefined`; reset failures retain the confirmed token, and logout occurs
  only after a confirmed reset.
- Personal Agents reuse `AgentManager` with stable organization ownership and
  expose an explicit direct-route disabled state when user-registered Agents
  are not enabled.
- `/login` preserves Forge-only authentication through `getForges()` and
  `authenticate(forge.id)` while adding loading, error, retry, empty,
  OAuth-query-error, malformed-URL, request-generation, and unmount behavior.
- `/cli/auth` strictly accepts decimal callback ports `1-65535`, posts only to
  `http://localhost:<port>/token`, requires an OK response with
  `{ "ok": "true" }`, and owns confirm, sending, success, failed, denied,
  invalid, duplicate-action, and unmount states without rendering or logging
  the token. Callback ownership now includes the reactive query port: every
  valid/invalid owner change invalidates active work, resets the state, and an
  authorization uses only the port captured when that request started.
- OAuth `error_uri` presentation creates a link only for an absolute HTTP(S)
  URL. Malformed, `javascript:`, `data:`, and other disallowed schemes remain
  non-clickable.
- The not-found route now provides truthful overview and repository navigation.
  Focused red evidence proved three broad deprecated generic matchers shadowed
  the named catch-all; those obsolete matchers were removed while current named
  routes and specific repository/organization compatibility redirects remain.
- The task-local producer captures exact dark Simplified-Chinese production and
  approved-prototype states for rows `1` and `39-45` at `1600x1000` and
  `390x844`. Its verifier binds state/file/row/surface/viewport/route/content,
  browser health, raw-key, overflow, PNG signature, and PNG dimensions.

## TDD Evidence

- The first focused run passed `10/11` files and `38/39` tests. Its only
  behavior failure proved unknown paths were captured by deprecated generic
  routes instead of the named not-found route.
- The final focused command passes `11` files and `45` tests, including named
  and inbound route resolution, responsive navigation, real preferences and
  identity, list/editor/token/login/CLI lifecycle ownership, invalid callback
  ports, callback owner `A -> B`, valid-to-invalid, invalid-to-valid, mutation
  failures, duplicate locking, safe OAuth URI schemes, disabled Agents,
  not-found actions, and structural `390px` containment.
- The complete frontend suite passes `84` files and `462` tests.

## Verification Commands

- PASS: focused task router/component Vitest (`11` files, `45` tests).
- PASS: `pnpm test -- --run` (`84` files, `462` tests).
- PASS: targeted Prettier for task production/test files and locales.
- PASS: `pnpm lint` with zero warnings.
- PASS: `pnpm typecheck`.
- PASS: `pnpm build`; only the existing `/web-config.js` and
  `/assets/custom.js` non-module warnings remain.
- PASS: final current-byte `node evidence/capture_browser.mjs`; run
  `6e59b655-c195-4474-8ac2-f0cda499de43` captured `32/32` production/prototype
  states for desktop and mobile.
- PASS: `node evidence/verify_evidence.mjs`; exact `32` JSON measurements and
  `32` PNG files share the final run identity and expected rows, routes,
  content, health, raw-key, overflow, signature, and dimensions.
- PASS: evidence JavaScript/Python syntax, changed JSON/JSONL parsing,
  CodeGraph development plan refresh, and `git diff --check`.
- BLOCKED: installed SpecNav development contract `0.3.0` currently reports `90`
  change-wide blockers because it requires `nodes/task_items` and a single
  authoritative task-context row while this established change uses
  `phases/vertical_slices` plus append-only lifecycle context.

## Concerns

- The task-local evidence fixture initially failed because it relied on
  transitive `argparse` and `ThreadingHTTPServer` globals that task `015` does
  not export. The fixture now imports both standard-library dependencies
  directly, and the producer reports early service exits with captured logs.
- Initial evidence content assertions expected fixture labels not present in
  the inherited organization data. The assertions now bind to the actual
  `ORG_SIGNING_KEY` and `ghcr.io/acme` records, and the complete final run
  supersedes the partial captures.
- The first independent spec and quality reviews returned `needs-fix`. They
  identified missing query-owner invalidation in CLI authorization, unsafe
  direct OAuth error links, absent owner-transition regressions, and an
  incorrectly invoked evidence-script Prettier check. Those blockers are now
  repaired; both evidence scripts pass the correct repo-relative Prettier
  command, and the added deferred/query/scheme regressions pass.
- An initial full lint run found obsolete English locale keys and a
  Prettier/ESLint template-format conflict. The unused keys were removed, the
  brand markup was expressed without conflicting adjacent tag formatting, and
  the final repository lint passes with zero warnings.
- The installed SpecNav `0.3.0` entry contract still rejects the change's
  established task graph/context model. No global contract migration or bypass
  is attempted inside this route slice.
- Rows `1` and `39-45` must remain `in-progress`; task `5.5` owns complete
  family-wide parity and full `A2`.

## Scope Deviations

- The only approved expansion is the minimal removal of three obsolete broad
  deprecated router matchers after a focused red regression proved they made
  the existing named catch-all unreachable. No named route, authentication
  metadata, layout, API, store, backend, dependency, or product capability was
  added.

## Follow-up Needed

- Keep baseline tasks `5.4` and `5.5`, rows `1` and `39-45`, and complete `A2`
  open after this task-local implementation review.

## Adjudication

Baseline task `5.3` is closed after both superseding independent current-byte
reviews approved task-scoped `A3` and `A4`. Complete `A2` remains open under
task `5.5`, permission-family closure remains open under task `5.4`, rows `1`
and `39-45` remain `in-progress`, and the recorded SpecNav `0.3.0` global
task-graph/context migration remains outside this task.
