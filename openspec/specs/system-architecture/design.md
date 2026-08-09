# System Architecture & Database Spec

## Overview

Woodpecker is a Go server with an embedded Vue 3 single-page application. The existing CI/CD domain and the added infrastructure/deployment control plane share authentication, routing, API conventions, persistence, and deployment packaging. Prototype-alignment work is frontend-first unless a documented UI state lacks an existing backend contract.

## Application Topology

- Frontend runtime: Vue 3, Vue Router, Pinia, Vue i18n, Tailwind CSS 4, and Vite under `web/`.
- Backend runtime: Go HTTP server using Gin under `server/`.
- API gateway or edge layer: the Woodpecker server exposes `/api/*`; Vite proxies `/api` in development.
- Background workers: Woodpecker agents execute CI tasks; node agents poll and report infrastructure tasks.
- External services: configured Git forges, agents, databases, and optional object/integration services.
- Local development entrypoints: `pnpm start` in `web/`; Vite defaults to `127.0.0.1:8010` when proxied. The standalone prototype uses `python3 serve.py`.
- Production deployment shape: the built SPA is embedded/served by the Go application; the server owns APIs and sessions.

## Module Boundaries

- Responsibility: `web/src/views` owns route-level composition and user-visible screen state; `web/src/components` owns reusable atomic, form, layout, pipeline, repository, and ops UI.
- Public contract: route definitions, typed component props/events, Pinia store actions/state, typed API client methods, Gin HTTP routes, and store interfaces.
- Owned data: local Vue state and browser preferences in the frontend; authenticated domain entities in Go model/store/datastore layers.
- Dependencies: pages depend on shared components, compositions, stores, and typed API contracts; API handlers depend on model/store services.
- Forbidden dependencies: presentational components must not access server packages or persistence; server API handlers must not depend on frontend code; shared components must not import route pages.
- Extension points: new API endpoints follow `server/router` + `server/api` + `server/store` patterns; new UI domains expose typed client methods and Pinia/composition ownership.
- Module groups: UI modules are under `web/src`; domain and persistence modules are under `server/model`, `server/store`, and `server/store/datastore`; shared CI pipeline logic remains under `pipeline`, `shared`, `agent`, and related packages.

## Frontend Architecture

- Routing: HTML5 history through `createWebHistory`, lazy-loaded route components, route meta for auth/layout/repository header.
- Rendering mode: client-rendered SPA.
- State management: Pinia for shared server/cache state; Vue refs/computed values for local and derived state.
- Form handling: existing form components with explicit Vue models and server-side validation.
- Data fetching: typed `ApiClient` methods called through compositions/stores; operations lists load paginated server state.
- Error handling: API errors are normalized by the client and shown through notification/toast flows; pages own empty/loading states.
- Design system source: `web/src/style.css`, `web/src/tailwind.css`, shared components, and the approved functional prototype.

## Backend Architecture

- API style: JSON REST endpoints under `/api`, plus SSE for logs/events.
- Request validation: API handlers parse paths/query/body and enforce domain constraints before store mutations.
- Auth/session model: session middleware provides guest, authenticated-user, admin, and node-agent boundaries.
- Domain service boundaries: CI domain remains existing handlers/services; infrastructure and deployment handlers live in `ops_infrastructure.go`, `ops_deployments.go`, and `ops_nodeagent.go`.
- Background jobs: CI agents and node-agent task polling/reporting.
- File/object storage: unchanged by prototype alignment.
- Observability: structured Go logging, Prometheus/debug routes where enabled, audit logs for operational actions, and user-visible deployment logs.

## API Surface

| Route or RPC | Owner | Input | Output | Auth | Side Effects |
| --- | --- | --- | --- | --- | --- |
| `/api/infrastructure/*` | infrastructure API | pagination, ids, server/group/action payloads | server, group, service, alert, overview models | user; admin for destructive group/server delete | infrastructure CRUD, maintenance/restart tasks, alert transitions |
| `/api/applications/*` | deployment API | application fields and ids | application models | user; admin for delete | application CRUD |
| `/api/environments/*` | deployment API | environment fields and ids | environment models | user read; admin write | environment CRUD |
| `/api/releases/*` | deployment API | release fields and ids | release models | user | release creation/read |
| `/api/deployments/*` | deployment API | deployment creation and action payloads | deployment/detail/log models | user | create, approve, reject, pause, resume, cancel, advance, retry, rollback |
| `/api/ops/policies` | ops API | none | deployment policy models | user | none |
| `/api/ops/audit-logs` | ops API | pagination/filter | audit log models | admin | none |
| `/api/node-agent/*` | node-agent API | registration, heartbeat, task result | identity/tasks/result acknowledgement | node-agent credential | node registration, heartbeat, task transitions |
| `/api/stream/*` | stream API | access/session and stream selection | SSE events/logs | route-specific session rules | live client updates |

## Database Model

| Entity | Purpose | Owner | Fields | Relationships | Indexes | Constraints | Lifecycle | Migration | Retention/Deletion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Server | managed infrastructure node | ops store | identity, address, environment, status, metrics, agent metadata | optional server group; deployment targets; alerts; tasks | id/name/group/status | unique identity/name rules in store/model | register, heartbeat/update, maintenance, remove | datastore migrations | admin delete; audit operational changes |
| ServerGroup | deployment target grouping | ops store | name, environment, labels, strategy metadata | servers, environments, deployments | id/name/environment | referenced groups cannot be silently broken | create, update, delete | datastore migrations | admin delete |
| Application | deployable product | ops store | repo/image/runtime/health metadata | releases, environments, deployments | id/name/repo | application identity and required fields | create, update, delete | datastore migrations | admin delete |
| Environment | deployment environment and protection policy | ops store | name, protection/approval settings, group binding | applications/releases/deployments/groups | id/name | protected environment rules | create, update, delete | datastore migrations | admin delete |
| AppRelease | immutable deployable release record | ops store | version/source/image/pipeline metadata | application and deployments | id/application/version | application reference required | create/read/update by internal flow | datastore migrations | retained for deployment history |
| Deployment | deployment state machine | ops store | application, release, environment, strategy, status, actor/timestamps | targets, approvals, logs, servers | id/status/application/environment | legal state transitions and target rules | create through terminal/rollback states | datastore migrations | retained for history |
| DeploymentTarget | per-server deployment progress | ops store | deployment/server/status/progress/error | deployment and server | deployment/server | unique target per deployment/server | upsert through execution | datastore migrations | deleted with deployment |
| Approval | protected deployment decision | ops store | deployment, actor, decision, note, time | deployment | deployment/time | authorized decision only | append-only decision record | datastore migrations | retained with deployment |
| Alert | infrastructure operational alert | ops store | source, severity, status, message, timestamps | server/service/deployment | id/status/severity | valid acknowledgement/resolution transitions | active, acknowledged, resolved | datastore migrations | retained for operational history |
| AuditLog | administrative/operational evidence | ops store | actor, action, target, payload, time | domain targets | time/action/actor | append-only through API actions | append/read | datastore migrations | follow existing retention policy |
| NodeTask | task dispatched to node agent | ops store | server, kind, payload, status, result, timestamps | server/deployment | server/status | node identity and legal result transition | pending, claimed, completed/failed | datastore migrations | retained for diagnostics |

## Permissions & Security

- User roles: guest, authenticated user, administrator, and node agent.
- Permission checks: enforced in Gin middleware and API handlers; destructive infrastructure/application actions and environment writes require admin where routed.
- Data isolation: repository/org permissions remain existing Woodpecker rules; operational read/write access follows route middleware.
- Secret handling: tokens, CSRF values, node-agent credentials, registry secrets, and CI secrets must not enter UI specs, logs, or prototype fixtures.
- Audit logging: operational mutations and protected deployment decisions must create or preserve audit evidence.
- Abuse cases: unauthorized admin actions, forged node-agent requests, replayed deployment actions, stale UI state, and destructive actions without confirmation.

## Integration Boundaries

- Third-party APIs: GitHub/Gitea/Forgejo/GitLab and configured forges through existing forge interfaces.
- Webhooks: forge webhooks enter the existing CI event pipeline.
- Queues: CI task queues and node-agent pending task polling.
- Email/SMS/push: no new notification channel is introduced by this change.
- Payments: none.
- Analytics: no new analytics integration; operational metrics/logs use existing observability.

## Operational Constraints

- Performance constraints: list APIs are paginated; UI must load all required pages without stale-response overwrite and avoid unbounded rendering.
- Availability expectations: UI must degrade to explicit loading/error/empty states; destructive actions must not be inferred as successful.
- Migration rules: visual-alignment slices should avoid schema migrations; any missing backend capability requires a separate documented decision.
- Backup/restore: follow existing database operational procedures; UI changes do not alter them.
- Feature flag rules: do not hide incomplete production paths behind undocumented flags.
- Rollback constraints: frontend changes must remain buildable with the current server API; deployment rollback is a domain action, not a UI-only simulation.

## Architecture Do's and Don'ts

- Do preserve route, API, store, and permission boundaries.
- Do use typed client models and existing backend contracts.
- Do separate visual parity work from new backend behavior.
- Don't add APIs, persistence, queues, or permissions merely to reproduce prototype placeholder data.
- Don't let frontend components bypass stores/client contracts or claim a mutation succeeded before server confirmation.
