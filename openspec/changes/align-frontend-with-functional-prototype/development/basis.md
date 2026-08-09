# Development Basis: align-frontend-with-functional-prototype

## Requirements Reference

- `openspec/specs/ui-design/design.md`
- `openspec/specs/system-architecture/design.md`
- `openspec/specs/frontend-backend-data-flow/design.md`
- `openspec/specs/component-architecture/design.md`
- `openspec/changes/align-frontend-with-functional-prototype/requirements.md`
- `openspec/changes/align-frontend-with-functional-prototype/acceptance.md`
- `openspec/changes/align-frontend-with-functional-prototype/spec-map.json`
- `openspec/changes/align-frontend-with-functional-prototype/component-impact-map.json`

## Prototype Reference

- `openspec/changes/align-frontend-with-functional-prototype/prototype/handoff.md`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/decision.json`
- `openspec/changes/align-frontend-with-functional-prototype/prototype/artifact/index.html`

## Handoff Reference

The user approved variant `approved-user-design` on 2026-08-09. Production
development consumes the prototype as a visual and interaction contract under
`openspec/changes/align-frontend-with-functional-prototype/scope.json`; it does
not import prototype fixtures, mock behavior, or browser-memory state.

## Development Baseline

- Git baseline: `d49d7f4`
- Route inventory: `openspec/changes/align-frontend-with-functional-prototype/route-parity.md`
- Task baseline: `openspec/changes/align-frontend-with-functional-prototype/tasks.md`
- First vertical slice:
  `openspec/changes/align-frontend-with-functional-prototype/development/tasks/001-date-duration-integrity/brief.md`

## Component Architecture Constraint

Implementation must preserve high cohesion and low coupling. Any duplicated UI,
state, validation, formatting, or domain behavior that meets the extraction rule
must become a shared component, hook, utility, or service.
