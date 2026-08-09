# Prototype Handoff: align-frontend-with-functional-prototype

## Approved Branch Variant

- Branch: `ui-html`
- Variant: `approved-user-design`
- Approval: explicitly approved by the user on 2026-08-09 for production
  alignment through the SpecNav Development Gate.

## Screens Or Flows

- All 67 routes and tab states listed in `artifact/ROUTES.md`.
- CI/repository, organization/administration/user, infrastructure/server, and
  application/release/deployment route families.
- Five-step deployment, deployment lifecycle, pipeline-to-release/deployment,
  server maintenance, alert handling, and responsive navigation flows.

## Components To Create

- Only focused shared components triggered by two or more real route consumers.

## Components To Reuse

- Production app shell, atomic/form/layout/scaffold/ops components, repository
  and pipeline components, compositions, typed API client, and Pinia stores.

## Extraction Targets

- Repeated prototype-aligned headers, metrics, filters, tables, status regions,
  empty/error states, action bars, pagination, and stale-request behavior.

## API Contracts

- Existing repository/pipeline/org/admin/user APIs.
- `/api/infrastructure/*`, `/api/applications/*`, `/api/environments/*`,
  `/api/releases/*`, `/api/deployments/*`, `/api/ops/*`, and `/api/stream/*`.

## Data Flows

- `FLOW-CI-BROWSE`, `FLOW-INFRA-LIST`, `FLOW-INFRA-ACTION`,
  `FLOW-DEPLOY-BROWSE`, `FLOW-DEPLOY-CREATE`, `FLOW-DEPLOY-ACTION`,
  `FLOW-REALTIME`, and `FLOW-PREFERENCES`.

## State Behavior

- Loading: explicit panel/page loading without fake zero metrics.
- Empty: distinguish no data, no filter match, and not configured.
- Error: preserve last confirmed state and provide retry where safe.
- Disabled: explain unavailable actions and current state prerequisites.
- Permission: UI visibility assists users; server authorization is authoritative.

## Theme And Locale Policy

- Theme support: system preference with light and dark modes.
- Theme modes shown in prototype: dark and light.
- Theme toggle: present in the prototype topbar.
- Internationalization: production enabled; prototype copy is Simplified Chinese.
- Locales shown in prototype: `zh-Hans`.
- Locale switcher: intentionally omitted from the prototype; production user
  settings retain locale selection.

## Out Of Scope Items

- Prototype fixtures or browser-memory state in production.
- New APIs, persistence, permissions, CI semantics, or deployment state machines.
- Real infrastructure operations performed by the prototype.

## Required Tests

- Route/state matrix, static checks, focused unit/component/store/router tests,
  permission and stale-state redteam checks, local E2E flows, and same-state
  dark/light desktop/mobile sensory review.

## Open Risks

- Full parity is a multi-slice change and must not be claimed early.
- Some prototype actions may lack a production contract and must block rather
  than be simulated.
- Different theme, locale, time, or data state can produce misleading visual
  comparisons.
