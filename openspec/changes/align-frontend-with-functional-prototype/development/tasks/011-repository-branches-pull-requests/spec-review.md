# Spec Review: 011-repository-branches-pull-requests

## Verdict

approved

## Missing Requirements

- None. Branch records remain the existing `string[]`, pull-request records
  remain `{ index, title }[]`, and row/detail enrichment comes only from the
  injected repository `Pipeline[]`.
- Both lists implement loaded-record search, existing service pagination,
  refresh, explicit loading/empty/no-match states, disabled pending actions,
  loaded counts, and navigation to their existing detail routes.
- Branch history excludes pull-request events and matches exact branch strings.
  Pull-request history accepts only the existing three prefixes and
  `/merge`, `/head`, or `/from` suffixes, then requires an exact index match.
- Refresh preserves the last confirmed rows across `resetPage()`'s synchronous
  clear, adopts a successful page-one response atomically, preserves and
  propagates an active failure, clears state on repository change, and prevents
  obsolete fulfillments or rejections from owning a newer snapshot.

## Extra Behavior

- No unsupported Forge metadata or write action was added. The implementation
  does not present protection, ahead/behind, comparison, deletion, creation,
  approval, review, comment, merge, diff, source/target, or author fields.
- The `usePipeline.ts` change only reuses the extracted pull-request event/ref
  normalization. Unsupported ref shapes now remain visible as their original
  ref instead of being partially rewritten.
- English and Simplified-Chinese obsolete branch/PR headings and generic empty
  keys were removed after their production consumers were replaced. No
  remaining source reference to those keys was found.

## Misunderstood Requirements

- None. The corrected implementation preserves `usePagination` as the
  authoritative API/pagination seam while adding only route-local presentation
  continuity for its synchronous reset lifecycle.
- Loaded counts are presented as loaded records rather than server totals, and
  absent or unsupported pipeline history renders explicit fallback content
  instead of fabricated prototype metadata.

## Cannot Verify From Diff

- Final bytes cannot prove the original TDD ordering. The completed task report
  and current system-executed validation receipts are consistent with the
  current tests and independently reproduced commands.
- This reviewer independently ran the six focused suites (`6` files / `27`
  tests), the complete frontend suite (`35` files / `211` tests), targeted
  Prettier, ESLint, Vue TypeScript, Vite build, evidence verification,
  JavaScript/Python syntax checks, and `git diff --check`; all passed. Vite
  retained only the existing `/web-config.js` and `/assets/custom.js`
  non-module warnings.
- The task-local verifier validates eight checksum-matched desktop/mobile PNGs,
  expected populated route text, three detail summary cards, no raw locale
  keys, no unexpected console/network errors, and no page-level horizontal
  overflow at `390px`. Refresh, pagination, empty, no-match, active rejection,
  repository reset, and obsolete continuation behavior are verified by focused
  tests rather than by the populated-state browser captures.
- Full equivalent-state prototype comparison across themes, locales, and
  permissions remains assigned to baseline task `4.5`.

## Acceptance Assertions Verified

- `A3`: verified for this completed slice by independently passing targeted
  formatting, ESLint, TypeScript, focused Vitest, full Vitest, Vite build,
  `git diff --check`, and checksum-valid desktop plus `390px` browser evidence.
- `A4`: verified for this slice through exact real-data branch/PR correlation,
  newest loaded-pipeline selection, explicit missing-value fallbacks,
  confirmed-row refresh continuity, successful and rejected active refreshes,
  repository-generation reset, and obsolete fulfillment/rejection isolation.
- This slice does not close the complete maintained route/state parity matrix.
- Full equivalent-state comparison across theme, locale, permissions, viewport,
  and data state remains assigned to baseline task `4.5`.

## Required Fixes

- The current implementation satisfies the reviewed task requirements; no
  corrective change is required.
