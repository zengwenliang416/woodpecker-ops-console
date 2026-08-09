## Context

The standalone functional prototype covers 67 route and tab states. Production
already has the prototype shell and rebuilt Overview, Repositories,
Infrastructure, and Deployment route families, but many CI and management
routes retain the older Scaffold/Settings presentation. Previous local review
also compared different theme/data states and exposed invalid elapsed-time
presentation, so visual similarity cannot be judged from screenshots alone.

The production frontend must continue using Vue 3, Vue Router, Pinia, Vue i18n,
the typed API client, and existing Go contracts. The prototype is a product and
interaction reference, not a production data source.

## Goals / Non-Goals

**Goals:**

- Track every prototype route/state through an explicit parity matrix.
- Converge route families incrementally without leaving mixed visual systems
  inside a completed route.
- Preserve existing real data, permissions, actions, loading, errors, theme,
  locale, keyboard, and responsive behavior.
- Reuse and extend current shared components rather than copying prototype HTML.
- Produce deterministic static, unit, E2E, and sensory evidence per slice.

**Non-Goals:**

- Reimplement backend state machines, persistence, permissions, or CI semantics.
- Import prototype fixtures, browser-memory transitions, or mock actions into
  production.
- Finish all 67 routes in one unreviewable repository-wide rewrite.
- Add a second design system or new frontend framework.

## Decisions

### 1. Deliver by vertical route family

Each slice owns route registration, real data/state, user actions, shared
components, i18n, responsive behavior, tests, and screenshots. The order is:

1. Data-integrity and shared-shell comparison baseline.
2. Pipeline detail and tabs.
3. Repository subroutes and settings.
4. Organization, administration, and personal settings.
5. Re-verification and remaining deltas for already migrated operations pages.

Alternative considered: page-by-page CSS patches. Rejected because it preserves
duplicated page-local patterns and makes route-level completion ambiguous.

### 2. Compare equivalent states only

Prototype and production screenshots must use the same theme, locale, viewport,
role, and equivalent data/status state. Dark Simplified Chinese at 1600x1000
and 390px is mandatory; representative light and English fallback checks are
also required.

Alternative considered: accept subjective similarity across arbitrary
screenshots. Rejected because light/dark and different fixture values dominate
the comparison and hide structural defects.

### 3. Keep server state authoritative

Pages use existing typed clients, Pinia stores, and backend mutations. UI-only
optimism is limited to reversible browser preferences. Missing APIs or
permissions stop the affected task and create a documented gap.

Alternative considered: reproduce prototype behavior with local state. Rejected
because it would create false success states and diverge from production.

### 4. Extend the existing component system

Existing atomic, form, layout, ops, repository, and pipeline components are the
starting point. Repeated prototype patterns are extracted only when at least two
real route consumers share the same behavior contract. Legacy components may be
restyled or decomposed, but low-level controls cannot gain API/store knowledge.

Alternative considered: copy the prototype CSS/HTML wholesale. Rejected because
it bypasses Vue composition, i18n, accessibility, and existing behavior.

### 5. Fix presentation integrity before visual sign-off

Shared date/duration/metric formatting must reject invalid or missing values and
render a neutral fallback. Paginated stores retain latest-request-wins and
server-deletion reconciliation. Sensory review is blocked when visible values
are misleading.

Alternative considered: treat invalid values as fixture noise. Rejected because
they change layout, trust, and action decisions.

### 6. Preserve a committed task baseline

SpecNav development uses the standard lane. Requirements, prototype handoff,
design, parity matrix, and the full checkbox task list are committed before
production code edits. Task wording and numbering are preserved unless the user
explicitly approves a task-change artifact.

## Risks / Trade-offs

- [Risk] The full route scope is large. -> Mitigation: maintain all 67 rows but
  implement reviewable vertical slices with independent evidence.
- [Risk] Existing pages use several component generations. -> Mitigation: define
  extraction triggers and finish one route family before broad refactors.
- [Risk] Prototype actions exceed current APIs. -> Mitigation: block only the
  affected action and record the missing real contract; never simulate success.
- [Risk] Visual tests are sensitive to data and time. -> Mitigation: use stable
  demo/mock data, freeze equivalent states, and normalize invalid values.
- [Risk] Large locale coverage makes full manual review impractical. ->
  Mitigation: require Simplified Chinese plus English fallback and rely on
  i18n/static checks for the remaining dictionaries.
- [Trade-off] Incremental delivery temporarily leaves mixed visual languages
  across different route families. -> Mitigation: do not declare global parity
  until every parity-matrix row is verified.

## Migration Plan

1. Commit the SpecNav foundation, requirements, prototype handoff, design,
   parity matrix, and tasks as the development baseline.
2. Implement one route-family slice at a time behind existing routes and APIs.
3. Run focused checks, then full frontend checks and browser review.
4. Update matrix/task evidence only after direct validation.
5. Roll back a slice by reverting its focused production commit; no database
   migration or compatibility layer is required.

## Open Questions

None. Prototype approval is recorded separately in
`prototype/decision.json` before Development Entry.
