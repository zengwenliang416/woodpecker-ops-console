# Frontend-Backend Data Flow Spec

## Overview

User actions flow from Vue route pages through local state or Pinia stores, typed API client methods, Gin routes/handlers, store interfaces, and datastore models. Prototype-alignment work must render real server state and preserve permission and failure behavior.

## Flow Index

| Flow ID | Trigger | Entry UI | API/Service | Persistence | User Result |
| --- | --- | --- | --- | --- | --- |
| `FLOW-CI-BROWSE` | open overview/repository/pipeline routes | Overview, Repos, repo and pipeline views | existing repository/feed/pipeline APIs and SSE | CI repository/pipeline/feed/log entities | dense prototype-aligned CI status and logs |
| `FLOW-INFRA-LIST` | open infrastructure routes or change filters | infrastructure overview/list/group/service/alert views | `/api/infrastructure/*` | server, group, alert, service projections | current operational inventory with loading/empty/error states |
| `FLOW-INFRA-ACTION` | maintenance, restart, acknowledge, resolve, create/update/delete | infrastructure detail/list actions | infrastructure mutation routes | server, alert, node task, audit log | confirmed state transition or actionable error |
| `FLOW-DEPLOY-BROWSE` | open deployments/apps/environments/releases | deployment views | `/api/deployments`, `/api/applications`, `/api/environments`, `/api/releases`, policies | deployment domain entities | current release/deployment inventory |
| `FLOW-DEPLOY-CREATE` | submit five-step deployment wizard | DeploymentNew | `POST /api/deployments` | deployment, targets, approvals/audit | created deployment or validation/permission error |
| `FLOW-DEPLOY-ACTION` | approve/reject/pause/resume/cancel/advance/retry/rollback | DeploymentDetail or Approvals | deployment action endpoints | deployment state, approvals, targets, audit logs | server-confirmed lifecycle update |
| `FLOW-REALTIME` | subscribe to pipeline/deployment/log activity | feed and detail views | SSE/log endpoints | server event/log streams | live updates with reconnect or explicit stopped state |
| `FLOW-PREFERENCES` | select locale/theme | topbar and user settings | local storage and lazy locale import | browser storage only | immediate theme/locale update |

## Boundary Contracts

- UI event contract: events describe user intent such as `approve`, `retry`, `toggle-maintenance`, `filter`, or `deploy`.
- Client state contract: page-local filters/forms stay local; reusable server collections and details live in Pinia or established compositions.
- Request schema: typed payloads from `web/src/lib/api/types`; query values are encoded deterministically.
- Response schema: JSON domain types or text/SSE for logs and streams.
- Error schema: HTTP status plus message normalized by `ApiClient`, then rendered as page state or notification.
- Permission contract: frontend visibility may reduce invalid actions, but backend middleware/handlers are authoritative.

## State Ownership

- URL state: route identity, entity ids, tabs, and shareable filters when implemented.
- Local component state: transient form inputs, dialog visibility, non-shared selection, and display preferences.
- Shared client cache: Pinia maps/lists for repositories, pipelines, servers, groups, alerts, applications, environments, releases, deployments, and details.
- Server state: authenticated domain state and lifecycle transitions.
- Database state: persisted entities owned by store/datastore layers.
- Derived state: metrics, counts, health summaries, filtered lists, and action availability computed from source state.

## Validation Ownership

- Client-side validation: required fields, basic formats, step completeness, and immediate disabled-state guidance.
- Server-side validation: permissions, entity existence, legal lifecycle transitions, protected-environment rules, concurrency, node status, and destructive constraints.
- Database constraints: identity, relationship, and persistence integrity.
- Cross-field or cross-entity rules: deployment target eligibility, release/application/environment compatibility, approval requirements, and server maintenance/health constraints.
- Error copy source: i18n keys for expected UI states; server messages may provide technical detail but must not replace clear user guidance.

## Error & Empty States

- Empty state: distinguish no data, no filter match, and not-yet-configured.
- Permission denied: hide unsafe shortcuts and show an explicit authorization message on direct navigation/action failure.
- Validation error: keep user input, identify the affected field/step, and do not advance.
- Network error: preserve last confirmed data where safe and offer retry.
- Server error: show failure without optimistic success.
- Conflict/stale data: refresh authoritative state; latest request wins for overlapping loads.

## Loading / Optimistic / Retry Behavior

- Initial loading: show page or panel loading state without fake zero metrics.
- Partial loading: independent panels may resolve separately when their contracts are independent.
- Optimistic update: allowed only for reversible preference state; operational mutations wait for server confirmation.
- Retry rule: safe GET requests and explicit user-triggered retries may repeat; mutation retry follows endpoint semantics and current state.
- Cancellation rule: stale list loads must not overwrite newer generations; subscriptions close on view disposal.
- Idempotency rule: read operations are repeatable; deployment lifecycle actions must be guarded by current server state and must not be blindly replayed.

## End-to-End Flow Details

`FLOW-INFRA-LIST`: route mount starts store loads; the client requests paginated infrastructure collections; handlers authenticate and query stores; all pages are merged; only the newest load generation updates maps; derived metrics render; empty/error/retry states remain explicit.

`FLOW-DEPLOY-CREATE`: the wizard collects application/release, environment, server group/strategy, preflight, and confirmation data; client validation blocks incomplete steps; the server verifies identities, permissions, protected-environment/approval rules, targets, and state; persistence creates deployment-related records; the response redirects to the detail view. A failed submission keeps the wizard state.

`FLOW-DEPLOY-ACTION`: the UI derives currently available actions but sends intent to the API; the server revalidates actor and current lifecycle state; persistence updates deployment/targets/approvals/audit records; the UI replaces local state only with confirmed response/detail refresh. Failure leaves the previous confirmed state visible.

`FLOW-PREFERENCES`: theme and locale selections update browser storage; theme updates root classes/data attributes and theme color; locale dictionaries load lazily and update date locale. Failure to load a locale falls back to English rather than breaking navigation.

## Async / Realtime Flows

- Queue/event source: CI agents, node-agent tasks, deployment execution, pipeline logs, and server event streams.
- Subscriber: `EventSource`-based frontend subscriptions and periodic/store refresh where no realtime endpoint exists.
- Retry/dead-letter behavior: EventSource reconnects by default; node tasks and deployments expose explicit failure/retry states rather than hiding terminal errors.
- Realtime update channel: `/api/stream/*` and deployment/log endpoints where available.
- Consistency expectation: eventual live updates with server state authoritative; a refresh must reconcile stale client state.

## Flow Do's and Don'ts

- Do trace every acceptance criterion to a named flow and real contract.
- Do preserve user input and last confirmed state on recoverable errors.
- Do paginate complete operational datasets and prevent stale response overwrite.
- Don't simulate successful backend transitions in production UI.
- Don't add page-local API calls that duplicate store ownership or bypass permission/error handling.
