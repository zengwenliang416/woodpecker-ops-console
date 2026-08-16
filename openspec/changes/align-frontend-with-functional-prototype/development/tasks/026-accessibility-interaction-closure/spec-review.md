# Spec Review: 026-accessibility-interaction-closure

## Verdict

Approved.

## Requirement Trace

Baseline `7.2` names six obligations; each is covered:

- Keyboard navigation: the drawer Escape path is already covered by
  `App.test.ts`, and FileTree directory nodes expose `role=button`,
  `tabindex`, Enter/Space handlers, and `aria-expanded`; the semantic
  click-target regression prevents new keyboard-invisible click handlers.
- Visible focus: the regression asserts the shared styles never reset the
  native outline and that Checkbox/TextField/RadioField keep focus-visible
  styling.
- Semantic controls: the click-target guard fails on any new
  click-handling `div/span/li/tr/td/p` without a role; the two allowed
  exceptions are documented with reasons in the audit evidence.
- Accessible labels: IconButton is asserted across button, link, and
  router-link variants to expose `aria-label`/`title`, `type=button`, and
  `aria-disabled`.
- Status text/icon pairing: the running status icon is decorative and
  `aria-hidden` while the translated status text (locked since the i18n
  slice) carries the meaning.
- Reduced motion: every component style declaring keyframes, infinite
  animation, or `transition: all` must declare `prefers-reduced-motion`;
  the three offenders found by the audit were fixed rather than allowed.

## Spec Compliance Checks

- Presentation-only diff; no API, route, permission, or store contract
  changed.
- The reduced-motion guards disable motion without removing the
  informational state (spinner still indicates activity statically, the
  running status remains conveyed by translated text).

## Concerns Raised And Resolved During Review

- The initial semantic-control scan produced two false positives; both were
  investigated and codified as a documented allowlist instead of weakening
  the rule.
- `vue-i18n` lint rules and regexp strictness in the test file were
  satisfied by restructuring rather than disabling rules.
