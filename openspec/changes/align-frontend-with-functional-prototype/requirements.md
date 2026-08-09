# Requirements: align-frontend-with-functional-prototype

## Summary

Align the production Vue frontend with the user-designed
`woodpecker-functional-prototype-with-ops` across all documented routes and
states. Delivery is incremental by route family, but every completed slice must
use real application contracts and produce test and visual evidence.

## Users & Actors

- Authenticated Woodpecker users operating repositories, pipelines, deployments,
  infrastructure, and personal settings.
- Administrators managing users, organizations, repositories, agents, queues,
  forges, and system configuration.
- Node/deployment operators reviewing alerts, approvals, logs, and rollout state.

## In Scope

- Maintain a route/state parity matrix for all 67 prototype routes and tabs.
- Preserve the current global shell while matching prototype density, hierarchy,
  navigation, status vocabulary, and responsive behavior.
- Complete the remaining high-gap route families: pipeline detail and tabs,
  repository branches/PR/settings, organization pages, admin pages, and user
  settings.
- Re-verify already migrated Overview, Repositories, Infrastructure, and
  Deployment pages in equivalent theme, locale, viewport, and data states.
- Render real API/store data and explicit loading, empty, error, permission,
  disabled, and stale/conflict states.
- Keep all visible copy in Vue i18n and preserve existing permission checks.

## Out of Scope

- Replacing backend state machines, permissions, persistence, or CI semantics.
- Copying prototype fixtures or in-memory simulation into production.
- Adding new deployment/infrastructure APIs solely to reproduce mock values.
- Declaring all-route completion from only the five supplied preview images.
- Redesigning the standalone prototype source during production implementation.

## UI Design Impact

- Foundation spec: `openspec/specs/ui-design/design.md`
- Required UI decisions: the standalone prototype is the visual and interaction
  reference; `web/src/style.css`, Tailwind mappings, and production shared
  components are the implementation source. Comparisons use equivalent theme,
  locale, viewport, permissions, and data state.

## Theme & Locale Capability Impact

- Theme support: `system` with resolved light and dark modes.
- Theme toggle policy: preserve the existing topbar toggle and user setting for
  `auto`, `light`, and `dark`.
- Internationalization: enabled.
- Supported locales: all 27 locale dictionaries currently shipped by the app.
- Default locale: supported browser locale or base language, with English
  fallback.
- Prototype coverage: every completed route family is reviewed in Simplified
  Chinese dark mode; representative shell/table/detail/wizard screens are also
  reviewed in light mode and English fallback.

## Architecture & Database Impact

- Foundation spec: `openspec/specs/system-architecture/design.md`
- Required architecture/database decisions: frontend-only visual and component
  changes use current routes, Pinia stores, typed clients, Go APIs, permissions,
  and persistence. A missing real contract is recorded as a blocker instead of
  being simulated or invented.

## Frontend-Backend Data Flow Impact

- Foundation spec: `openspec/specs/frontend-backend-data-flow/design.md`
- Required data-flow decisions: real server state remains authoritative;
  paginated lists load complete required data; overlapping loads use
  latest-request-wins; operational mutations wait for server confirmation;
  recoverable errors preserve the last confirmed state and user input.

## Component Architecture Impact

- Foundation spec: `openspec/specs/component-architecture/design.md`
- Cohesion/coupling impact: route pages orchestrate data and intent; shared
  visual components render typed props; stores/compositions own reusable loading,
  mutation, subscription, theme, locale, and pagination behavior.
- Shared extraction requirement: extend existing atomic/layout/ops components
  before adding new families. Extract repeated prototype header, metric, table,
  status, filter, empty-state, and action patterns only when two real consumers
  share the same contract.

## Unresolved Gaps

- None. The user-supplied prototype, current code, route inventory, theme/i18n
  runtime, and backend contracts provide the decisions required for this change.
