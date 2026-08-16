# Quality Review: 029-static-gate-closure

## Verdict

approved

## Separation Of Concerns

The slice cleanly separates verification tooling from production code. The
consolidated gate (`evidence/run_static_gate.mjs`) lives entirely under the
task's evidence directory and is the single owner of the whole-tree gate
chain (Prettier, ESLint, vue-tsc, Vitest, Vite build, `git diff --check`),
reusing the project's own `node_modules/.bin` binaries and the package.json
build flags (`--base=/BASE_PATH`). Production changes are confined to the
four files the gate flagged: three are formatting-only and one (`Popup.vue`)
is a one-attribute accessibility fix. `.prettierignore` is the correct
configuration surface for the AppleDouble exclusion. No production behavior,
routes, APIs, or fixtures were touched, matching the "formatting and
configuration only" scope.

## Component Cohesion / Coupling

No component structure changed. `ListItem.vue` and `Warning.vue` are
behaviorally identical after formatting; `Popup.vue` gains a single static
attribute (`role="presentation"`) on its existing click-away backdrop with no
new dependencies or coupling. The overlay is a decorative backdrop whose
click emits `close` and whose Escape path is handled by the component's
existing `onKeyStroke` — the role is inert to behavior and appropriate for
the accessibility tree. The gate script is self-contained with no coupling
to production modules. Cohesion intact; coupling unchanged.

## Test Quality

The regression for the four format fixes is the whole-tree `prettier -c .`
check itself, which I re-ran and confirmed passes (exit 0, "All matched files
use Prettier code style!") — proving the fixes are complete and the `._*`
exclusion hides nothing real. The Task 026 accessibility suite
(`src/accessibilityInteraction.test.ts`) re-ran 6/6 green against the
reformatted `Popup.vue`. The gate script asserts a non-empty Vitest test
count before writing the receipt, and the recorded receipt reports the full
suite at 110 files / 610 tests. One nuance: the report's narrative that a
"formatting collapse exposed the missing role" is imprecise — the overlay's
`@click` stays on its own line, so the 026 per-line scanner would not flag it
either way — but the role addition is still a genuine, documented a11y
improvement and is verified by the passing suite. Test quality is
appropriate for a static-gate closure task.

## Error Handling

The gate fails closed: `spawnSync` results are asserted to exit 0 after each
step, so the script aborts on the first non-zero exit with a message naming
the failing gate, and the receipt is written only on a fully green run (no
false-positive receipt on failure). stdout/stderr are streamed through, and
`maxBuffer` (256 MB) prevents truncation of large ESLint/Vitest output.
Per-gate exit statuses and durations are recorded in the receipt. Minor
nits only: a missing binary surfaces as "exit status null" rather than the
spawn error, and `taskRoot` is an unused variable — neither affects the
fail-closed contract.

## Reuse / Duplication

The gate reuses the project's own tooling and the exact conventions of the
per-slice gates (project binaries, `node_modules/vitest/vitest.mjs` because
pnpm is unavailable in the sandbox, `vite build --base=/BASE_PATH`). No
tooling logic is duplicated; the script is a thin, sequential runner over
existing commands. The `**/._*` exclusion is a single config line, verified
against the actual 211 AppleDouble metadata files present under `web/` (all
`._`-prefixed companions, e.g. `public/favicons/._favicon-*.png`); the
pattern cannot match real source (`.env`, `.eslintrc`, etc. lack the `_`
second character), and the four genuine violations still caught and fixed
prove real source remains checked.

## Complexity Delta

Near zero for production code: one static attribute added and three
formatting-only edits. The gate script adds ~72 lines of straightforward
sequential command execution. No state, branching, or error-path complexity
beyond the fail-closed assert. The whole change is low-risk and
well-contained.

## Required Fixes

None. All checks verified independently: whole-tree `prettier -c .` (exit 0),
`eslint --max-warnings 0 .` (exit 0), and the 026 accessibility suite (6/6)
re-ran green from `web/`; the gate evidence log ends with "Static gate
receipt written"; the receipt records all six gates ok with 110 files / 610
tests; `tasks.md` closes only baseline task 8.1 while 8.2–8.4, row 4, and
parent acceptance (A3's browser-review portion) remain open; and scope
(no production behavior change) is respected. Non-blocking observations for
the record: the report's "formatting collapse" wording is imprecise, and
`git diff --check` does not cover untracked task-packet files (standard git
behavior; the executed gate was green at run time).
