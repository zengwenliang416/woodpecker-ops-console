# Development Goal: Finish align-frontend-with-functional-prototype

## Objective

Complete every remaining baseline task of the change
`align-frontend-with-functional-prototype` through successive development
slices (`025` and onward), keeping blocked repository parity row `4`
explicit, until the change-level acceptance is approved and the final
six-domain verification handoff exists. Development work after this goal is
written proceeds slice by slice under this document; no baseline task may be
skipped, reinterpreted, or silently narrowed.

## Current State (2026-08-16)

- Slices `001-024` are closed; baseline phases `1-6` (tasks `1.1-6.5`) are
  complete with signed task acceptance, reviews, and evidence.
- Production parity rows `1-3` and `24-67` carry current strict verification
  evidence; repository row `4` remains blocked by the measured production
  activation list versus the prototype four-step add wizard and must stay
  explicitly blocked.
- `main` is the working branch; every slice lands as its own commits and is
  pushed after closure.

## Remaining Scope

| Slice | Baseline task | Deliverable |
| --- | --- | --- |
| `025` | `7.1` | Remove untranslated visible strings from all completed slices; verify Simplified Chinese plus English fallback. |
| `026` | `7.2` | Verify keyboard navigation, visible focus, semantic controls, accessible labels, status text/icon pairing, and reduced-motion behavior. |
| `027` | `7.3` | Verify desktop, tablet, and 390px layouts with no page-level horizontal overflow and contained scrolling for dense tables and logs. |
| `028` | `7.4` | Verify light and dark semantic token parity without page-local color systems. |
| `029` | `8.1` | Run Prettier check, ESLint, TypeScript, all Vitest tests, Vite build, and `git diff --check`. |
| `030` | `8.2` | Run facticity, static, unit, redteam, E2E, and sensory verification against requirements and the full parity matrix. |
| `031` | `8.3` | Produce the SpecNav HTML verification report with evidence for every completed assertion and route row. |
| `032` | `8.4` | Leave incomplete or blocked route rows and tasks explicit; do not claim global prototype parity until all 67 rows are verified. |

Execution order is fixed: `7.1 → 7.2 → 7.3 → 7.4 → 8.1 → 8.2 → 8.3 → 8.4`.
A later slice may start only after the previous slice's acceptance is signed
and its baseline checkbox in `tasks.md` is checked.

## Per-Slice Definition Of Done

Each slice follows the established `001-024` ritual:

1. A task directory
   `development/tasks/<NNN>-<slug>/` with `brief.md`, `context.json`, and
   `report.md`.
2. Focused, red-capable Vitest regressions for every behavior the slice
   repairs or verifies; production changes land only through the slice.
3. Evidence artifacts under the task's `evidence/` directory, replayable and
   checksummed where the slice captures browser or source evidence.
4. `spec-review.md` and `quality-review.md`, then signed `acceptance.json`
   bound to the closure HEAD.
5. The matching baseline checkbox in `tasks.md` checked, `handoff-to-verify.md`
   extended with the implemented-slice entry, and CodeGraph/lifecycle records
   refreshed.
6. Separate functional commits (production code, tests, task artifacts)
   pushed to `main`.

## Constraints

- The approved prototype under `woodpecker-functional-prototype-with-ops/`
  stays read-only; never import prototype fixtures into production.
- Existing API contracts, routes, permissions, and streaming behavior are
  preserved; alignment changes user-visible presentation only.
- Blocked row `4` and any newly discovered blockers stay explicit in
  `route-parity.md`; never mark unverified rows verified.
- Do not claim global prototype parity until all `67` rows are verified; the
  final state must state exactly what is verified and what is blocked.

## Completion Criteria

All eight remaining baseline checkboxes are checked, every slice has signed
acceptance and evidence, phase `7-8` closure records exist, the SpecNav HTML
verification report covers every completed assertion and route row with
blocked row `4` explicit, and the change-level acceptance for
`align-frontend-with-functional-prototype` is approved on the final HEAD.
