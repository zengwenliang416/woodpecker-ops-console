## ADDED Requirements

### Requirement: Complete route and state parity tracking

The system SHALL maintain a parity matrix covering every route and tab state
documented in `woodpecker-functional-prototype-with-ops/ROUTES.md`.

#### Scenario: A route family is started

- **WHEN** implementation begins for a prototype route family
- **THEN** every affected route and state is recorded with a status and source
  implementation path
- **AND** no route is silently removed, merged, or declared complete without
  evidence

### Requirement: Equivalent-state visual parity

The production frontend SHALL match the approved prototype's information
hierarchy, density, navigation, controls, statuses, and responsive behavior for
each completed route when compared in equivalent conditions.

#### Scenario: A completed screen is visually reviewed

- **WHEN** the prototype and production screen use the same theme, locale,
  viewport, user role, and data state
- **THEN** the review records screenshots and remaining material deltas
- **AND** color-only or different-state comparisons do not count as parity
  evidence

### Requirement: Real application behavior is preserved

Prototype alignment SHALL preserve existing routes, typed APIs, permissions,
server-authoritative mutations, loading behavior, error handling, and domain
state transitions.

#### Scenario: A prototype action maps to a real mutation

- **WHEN** a user invokes an infrastructure, deployment, repository, pipeline,
  organization, administration, or settings action
- **THEN** the production UI uses the current authorized API contract
- **AND** it does not simulate success or import prototype fixtures

### Requirement: Complete state coverage

Completed route families SHALL expose explicit loading, empty, no-filter-match,
permission, disabled, validation, network-error, server-error, and stale-state
behavior where applicable.

#### Scenario: Data cannot be shown or changed

- **WHEN** a collection is empty, a request fails, permissions are insufficient,
  or a mutation conflicts with newer server state
- **THEN** the UI presents a distinct actionable state
- **AND** preserves the last confirmed data or user input where safe

### Requirement: Theme, locale, accessibility, and responsive parity

Completed slices SHALL remain usable in light and dark themes, use Vue i18n for
visible copy, preserve keyboard/focus semantics, and avoid page-level horizontal
overflow at 390px.

#### Scenario: A completed slice is verified

- **WHEN** verification runs for the route family
- **THEN** Simplified Chinese dark-mode desktop and mobile evidence is required
- **AND** representative light-mode and English-fallback evidence is recorded
- **AND** dense tables scroll only inside their designated container

### Requirement: Data integrity in presentation

User-visible dates, durations, metrics, counts, percentages, and statuses SHALL
derive from valid source values or render an explicit fallback.

#### Scenario: A source value is missing or invalid

- **WHEN** formatting receives a missing, invalid, or stale value
- **THEN** the UI renders a neutral fallback or error state
- **AND** does not show misleading extreme durations, timestamps, or metrics
