# Acceptance Criteria: align-frontend-with-functional-prototype

## User-Visible Criteria

- Every documented prototype route/state appears in a maintained parity matrix
  with `not-started`, `in-progress`, `verified`, or `blocked` status.
- A completed route matches the prototype's shell, hierarchy, density, controls,
  status vocabulary, and responsive behavior when compared in an equivalent
  theme, locale, viewport, permission role, and data state.
- Pipeline details expose the prototype-level header, actions, status, tabs,
  step overview/log access, errors, changed files, configuration, and debug
  entry without losing current Woodpecker behavior.
- Repository, organization, administration, and personal-settings pages use the
  same production design system instead of an isolated legacy visual language.
- Loading, no-data, no-filter-match, permission, disabled, network-error,
  server-error, and stale/conflict states are explicit and usable.
- Theme and locale controls continue to work; completed slices are usable in
  dark/light themes and do not introduce untranslated visible strings.

## System Criteria

- Existing route names, authentication requirements, repository permissions,
  admin boundaries, and node-agent boundaries remain intact.
- Existing API payloads and operational lifecycle transitions remain
  authoritative; no production success state is simulated.
- All completed slices pass formatting, lint, TypeScript, focused Vitest, full
  frontend test, Vite build, and `git diff --check`.
- Responsive layouts avoid page-level horizontal overflow at 390px while dense
  tables may scroll inside their designated containers.

## Data Criteria

- Operational list views load all required paginated records and remove
  server-deleted records from shared maps.
- Older overlapping requests cannot overwrite newer confirmed state.
- Visual dates, durations, counts, percentages, and statuses derive from valid
  source values; invalid or missing values render an explicit fallback instead
  of misleading extreme values.

## Component Criteria

- Reusable components, hooks, utilities, or services named in
  `component-impact-map.json` are extracted instead of duplicated.

## Verification Surfaces

- Facticity: compare route matrix, source paths, API/type contracts, i18n keys,
  and prototype route definitions.
- Static: Prettier check, ESLint, TypeScript, Vite build, and `git diff --check`.
- Unit: focused component/router/store/composition Vitest coverage.
- Redteam: direct route access, missing permissions, empty/error/stale state,
  invalid dates, long content, and repeated mutation attempts.
- E2E: local Vue app with authenticated backend or Mock Ops API for affected
  route families and critical multi-step flows.
- Sensory: same-state prototype/production screenshots at 1600x1000 and 390px,
  with dark Simplified Chinese required and representative light/English checks.

## Unresolved Gaps

- None.
