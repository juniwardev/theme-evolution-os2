# Plan Review: Material Spotlight section (Revision 3 — fourth review pass)

Plan: `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/docs/plans/material-spotlight.md`
Reviewer pass: 4 (verifies the single surgical fix applied since pass 3)
Date: 2026-05-16

---

## Scope of this pass

The plan author asserts a single change since the third review: a `shopify theme check` verification sub-step was added to Step 4 of the Coder checklist (sub-step 5), covering the preload-enabled `image_tag` invocation. This review verifies that change and does one final adversarial read for anything not yet caught.

---

## Required change from pass 3 — verification

**Status: APPLIED**

Plan file line 928 reads:

> - Run `shopify theme check` after wiring the preload-enabled icon invocation and confirm no warnings related to `image_tag` parameters surface.

This sub-bullet sits directly under Step 4, sub-step 5, which is the step that configures the `hero` + `preload_icon` branch with `loading: 'eager'`, `fetchpriority: 'high'`, and `preload: true`. The placement is correct — the check runs immediately after the parameter wiring that introduces the risk, not deferred to the catch-all "run theme check" at sub-step 10. The wording is conservative (it does not assume a warning will surface; it asks the Coder to confirm none does), which is the right tone for a forward-looking compatibility check.

Verdict on this item: APPLIED as requested.

---

## Spot-check of previously resolved issues

| Issue | Where | Still resolved? |
| --- | --- | --- |
| `enabled_on.templates` (review issue #1) | Schema lines 253-255; Step 3 sub-step 3; appendix B | Yes |
| `{% style %}` outside Liquid logic (review issue #7) | Section 10 outline lines 394-405 (top-level `{% style %}`); Step 7 sub-step 2 reinforces non-nesting | Yes |
| `escape` before `newline_to_br` (review safety rule) | Section 6 "Liquid output safety"; Step 5 sub-step 2; appendix B row "Multi-line text output" | Yes |
| No `data-section-id` (review fix B) | Section 10 wrapper `<div>` carries class list only; Step 4 sub-step 2 explicit reminder | Yes |
| Plain-language `preload_icon` description (review fix C) | Locale JSON lines 808-810; section 9 schema notes paragraph; no "LCP" jargon in merchant copy | Yes |
| Conditional snippet defaults via `if x == blank` (review issue #4) | Snippet outline lines 658-664; Step 1 sub-step 2 with the corrected idiom inline; design-notes bullet at line 758 | Yes |

All six critical previously-resolved items remain resolved. Additional spot-checks:

- Schema `class` is still `section--material-spotlight` (no generic `section` class — review issue #10). Line 252.
- `color_scheme` is still declared as a real schema setting (review issue #2). Lines 284-288.
- Translated strings are still pre-assigned before being passed to `render` (review issue #3). Lines 422-424.
- `has_valid_icon` two-step check and `placeholder_svg_tag` fallback intact (review issue #9). Lines 431-434, 471-475.
- Image dimensions are still explicit on both `image_tag` branches (review issue #5). Lines 449-450, 463-464.
- Display-name `assign`/`if blank` pattern remains (review issue #15). Lines 426-429.

---

## Fresh adversarial read — remaining observations

### NIT: `widths` / `sizes` parameter values not separately validated

The hero branch (section 10 lines 444-456) passes `widths: '400, 800, 1200, 1500'` and `sizes: '(min-width: 750px) 100vw, 100vw'`. The new Step 4 sub-step 5.1 covers `image_tag` parameter warnings generally, so any theme-check complaint about `widths` or `sizes` would surface there. This is adequate. The `sizes` value `'(min-width: 750px) 100vw, 100vw'` is functionally a single `100vw` at all breakpoints (the media query branches to the same value as the default), so it can be simplified to `'100vw'`. Not blocking — purely cosmetic.

### NIT: `padding_top_mobile` rounding parameter is redundant

The top-level `{% liquid %}` block (section 10 lines 388-392) computes `padding_top_mobile = section.settings.padding_top | times: 0.75 | round: 0`. `round` with no argument defaults to 0 decimals, so the `: 0` is redundant. Cosmetic only.

### NIT: Step 4 sub-step 5 vs sub-step 10 theme-check redundancy

Step 4 now has theme-check invocations at sub-step 5.1 (after preload wiring) AND sub-step 10 (final pass). The duplication is intentional (early-fail on a known risk vs. catch-all at end) and the cost is one extra command run. Fine.

### MINOR: Heading hierarchy guidance is advisory, not enforced

Section 12 risk 8 reminds merchants to "manually downgrade subsequent sections' heading levels" if stacking multiple spotlight-style sections. The schema permits `h2`/`h3`/`h4` but cannot detect sibling sections. The plan could optionally note in the section's `{% comment %}` header that the merchant is responsible for sequential heading hierarchy when stacking. Not blocking; an impl-notes-level reminder is also acceptable.

### MINOR: Placeholder SVG behaviour worth confirming in QA

Section 10 line 473 emits `placeholder_svg_tag` only — no `<img>` element exists in that branch, so `loading` and explicit width/height attributes do not apply. The CSS at lines 570-575 sets `width: 100%; height: 100%; object-fit: cover` on the inline SVG, which inherits the container's reserved space (60x60 inline / 16:9 hero). Confirmed not a bug; flagged to pre-empt QA confusion.

### NIT: Snippet `<style>` block emitted once per render

Section 12 risk 7 acknowledges that rendering the snippet multiple times on one page duplicates the `<style>` block. The chosen mitigation (deferred to v2 via `{% liquid increment %}`) is reasonable. For this section's v1 the snippet is rendered at most once per page, so the issue is purely theoretical.

---

## What was not caught in earlier passes — none

The fourth-pass adversarial read did not surface any new blocking, major, or moderate concerns. Every observation above is NIT or MINOR-advisory. The plan's contracts (graceful empty, output safety, template restriction, CLS dimensions, no `{% style %}` inside Liquid logic, no speculative attributes, pre-assigned translations, conditional snippet defaults) are intact and internally consistent.

---

## Summary

- Pass-3 required change: APPLIED at line 928 with correct placement (Step 4, sub-step 5.1, immediately after preload wiring).
- All six critical previously-resolved issues remain resolved.
- Fresh adversarial read surfaced only NIT / MINOR-advisory items that do not affect correctness, security, performance, or testability.
- No blocking, major, or moderate concerns remain.

APPROVE
