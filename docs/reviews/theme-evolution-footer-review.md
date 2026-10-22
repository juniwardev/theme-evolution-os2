# Plan review: theme-evolution-footer (Revision 3)

Reviewer: Plan-Reviewer
Date: 2026-05-21
Plan under review: `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/docs/plans/theme-evolution-footer.md`
Revision: 3 (third pass; Revisions 1 and 2 surfaced and resolved 9 distinct issues — broken `labels.menu`/storefront filter, section-group mounting risk, SVG re-inspection busywork, Step 6 numbering, Section 4.2 `:empty` framing, social `aria-label` separator, new-window hint, baseline `shopify theme check`, Twitter label)

Cross-references read:
- `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/sections/footer.liquid` (current 57-line bare footer)
- `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/sections/footer-group.json` (section-group mount with `"menu": "footer"` and `"show_payment_icons": true` preserved)
- `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/sections/header.liquid` (precedent for `--header-bg`/`--header-text` + `theme-evolution-header-wrapper` pattern)
- `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/locales/en.default.json` (storefront keys: existing `sections.footer.payment`, `sections.header.menu`, `accessibility.link_messages.new_window`, `general.social.links.twitter: "X (Twitter)"`)
- `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/locales/en.default.schema.json` (schema-editor keys: `labels.menu`, `labels.show_payment_icons`, `sections.footer.settings.header__1` / `header__9`, full Dawn-era `sections.footer.*` block at lines 857–940)
- All five social SVGs (`icon-instagram.svg`, `icon-facebook.svg`, `icon-youtube.svg`, `icon-tiktok.svg`, `icon-twitter.svg`) — spot-checked

---

## Verification of previously resolved issues

| Issue from prior reviews | Status in Revision 3 | Evidence |
|---|---|---|
| Broken `'labels.menu' | t` aria-label (storefront cannot resolve schema-locale keys) | **Resolved.** Plan adds new storefront key `sections.footer.menu: "Footer menu"` (section 8) and references it via `assign menu_label = 'sections.footer.menu' | t` in section 7. | Section 7 line ~415, section 8 line ~676 |
| Section-group mounting risk (Shopify auto-wraps `.shopify-section-group-footer-group`) | **Resolved.** Risk #11 in section 9 documents the auto-wrapper, calls for a visual full-bleed check in step 5 item / step 6 item 3, and provides the exact escape-hatch CSS rule. | Section 9 risk #11 line ~798, step 5 line ~1015, step 6 line ~912 |
| SVG re-inspection busywork | **Resolved.** Risk #2 now states all five social SVGs are pre-verified `fill="currentColor"` compliant; step 5 item 5 instructs the Coder to record this in impl-notes without re-inspecting. I independently confirmed all five SVGs use `fill="currentColor"`. | Section 9 risk #2 line ~771, step 5 item 5 line ~895 |
| Step 6 duplicate item numbers | **Resolved.** Step 6 now contains items 1–7 with no duplicates. | Section 10 step 6 lines ~907–934 |
| Section 4.2 `:empty` framing inconsistent with edge case #5 | **Resolved.** Section 4.2 now explicitly states `:empty` is "forward-looking belt-and-braces protection only" and cross-references edge case #5; edge case #5 confirms the outer Liquid guard makes the rule unreachable today. | Section 4.2 line ~116, edge case #5 line ~806 |
| Social `aria-label` separator (must produce natural screen-reader output) | **Resolved.** Each social link uses `aria-label="{{ ... | t }}, {{ 'accessibility.link_messages.new_window' | t }}"` — comma+space yields the natural pause. | Section 7 lines ~447, 454, 461, 468, 475 |
| "Opens in new tab" hint must be exposed to assistive tech | **Resolved.** `accessibility.link_messages.new_window` (existing key, value `"Opens in a new window."`) is concatenated into each social `aria-label`. I confirmed the key exists at `en.default.json:259`. | Section 7 + section 8 note line ~696 |
| Step 0 baseline theme check | **Resolved.** Step 0 added as the first action; records baseline offenses before edits so regressions can be detected. | Step 0 lines ~822–826 |
| Twitter label — `"X (Twitter)"` (matches platform rebrand and existing precedent) | **Resolved.** Storefront key value is `"X (Twitter)"`. I confirmed the project's existing `general.social.links.twitter` key in `en.default.json:316` uses the same value. | Section 8 line ~683 |

All nine prior-review concerns are credibly addressed. I did not find any silent regressions from the resolution edits.

---

## Correctness

The plan solves the stated problem (rewrite the 57-line Dawn-derived footer into a dark, multi-column footer with three optional columns + a copyright/payment bottom bar, color-controllable, mobile-stacking).

Spot-checks of concrete claims:

- **Existing footer line references** (e.g., `lines 1-21`, `lines 23-38`, `lines 40-56`) match the current 57-line file byte-for-byte.
- **`labels.menu` value `"Menu"` at `en.default.schema.json:44`** confirmed (line 44 of the file).
- **Existing `sections.footer.payment: "Payment methods"`** confirmed at `en.default.json:184-186`.
- **`accessibility.link_messages.new_window`** confirmed at `en.default.json:259`.
- **Dawn-era `sections.footer.*` schema block** confirmed at `en.default.schema.json:857-940`, including `header__1` ("Email signup") and `header__9` ("Utilities"). The plan correctly chooses NOT to reuse these for unrelated dividers.
- **Header precedent (`--header-bg`/`--header-text` on `.theme-evolution-header-wrapper`)** confirmed at `sections/header.liquid:109-128`; the plan's `--footer-bg`/`--footer-text`/`--footer-border` structure mirrors it exactly.
- **All five social SVGs use `fill="currentColor"`** confirmed via direct inspection of each file. Risk #2's "pre-verified" claim holds.
- **`general.social.links.twitter: "X (Twitter)"`** confirmed at `en.default.json:316`, vindicating the chosen Twitter label.

The Liquid guard chain (`elsif`-based `has_social`) correctly follows `CLAUDE.md`'s rule against multi-`or` conditions. The `{% style %}` and `{% stylesheet %}` blocks sit at the top level of the section file (outside any `{% if %}`) per project rules. No `{% include %}` is used; SVG inlining via `inline_asset_content` is the correct alternative. Two existing setting IDs (`menu`, `show_payment_icons`) are preserved byte-identical so the merchant's saved values (per `sections/footer-group.json`: `"menu": "footer", "show_payment_icons": true`) carry across.

## Missing edge cases and failure modes

A handful of small gaps remain. None are blocking, but folding them in would tighten the implementation:

1. **`role="list"` is applied to the payment `<ul>` AND the menu/social `<ul>`s, but the plan's Section 7 markup omits `role="list"` on the payment `<ul>`** (it has `aria-label` but no `role="list"`). The reasoning in risk #5 — "Safari strips list semantics when `list-style: none` is applied" — applies equally to the payment list. Suggest adding `role="list"` to the payment `<ul>` for consistency.

2. **The `<nav>` landmark for the menu column has an `aria-label` but the `<ul>` inside it also has `role="list"` only — not an additional `aria-label`.** This is fine (the `<nav>` already provides the landmark name), but the plan should call out explicitly in section 4.4 that the `<nav>`-level label is sufficient and the `<ul>` does not need a redundant label. As written a careful reader might wonder.

3. **`accessibility.link_messages.new_window` ends with a period (`"Opens in a new window."`)**. When concatenated as `"Instagram, Opens in a new window."`, the result has the correct natural reading. Fine. But the plan's example shows the comma+space separator producing "Instagram, Opens in a new window." — note that the leading "O" capital in the new-window key combined with the comma is slightly awkward but acceptable; not worth changing.

4. **`color-mix()` fallback strategy is deferred** (section 4.7 says "if pre-2023 browser support becomes a concern, add `border-color: rgba(128, 128, 128, 0.2);` immediately before the `var(--footer-border)` declaration"). This is fine as deferred work, but the impl-notes template in step 6 only asks the Coder to "state whether the bare `color-mix()` declaration is used or a static `border-color` fallback was added" — it does not specify what the test browsers should be. Suggest naming "Safari 16.2+, Chrome 111+, Firefox 113+" explicitly in the impl-notes prompt to align with the risk #3 wording.

5. **`shop.name | link_to: routes.root_url` outputs an unescaped `<a>` tag.** The plan correctly preserves this verbatim from the existing file (it's a known-safe Shopify filter chain), but does not note that if a merchant ever changes their shop name to contain HTML, `link_to` does NOT escape the inner text. This is a pre-existing behavior and out of scope for this plan, so no action needed; flagging for transparency.

6. **Schema editor preview may show a flash of unstyled content if the merchant configures a very long `about_text` richtext.** The `.theme-evolution-footer__about-text { max-width: 32rem; }` rule constrains it on desktop but the merchant won't see a preview of the column-width clamp until after save+reload in some theme editor builds. Minor UX nit; not a blocker.

7. **`shop.enabled_payment_types` returns the empty array for newly-set-up stores.** Edge case #6 acknowledges this — the `<ul>` renders empty. With `gap: 0.5rem; flex-wrap: wrap;` and zero children, the `<ul>` will be visually zero-width but DOES still exist in the DOM with an `aria-label`. Screen readers may announce "Payment methods, list" with zero items, which is mildly weird but not a regression. Acceptable.

## Scaling, performance, and security concerns

- **Performance:** All SVGs inlined via `inline_asset_content` — server-rendered, no extra HTTP requests. No JS. No `<img>` (so no CLS risk). All CSS lives in the section file (per `CLAUDE.md` asset-location rule). LCP not implicated (footer is below-the-fold).
- **Security:** Social URL settings use Shopify's `url` type, which validates scheme on save (rejects `javascript:` etc.). `richtext` for `about_text` is sanitized by Shopify before save. `target="_blank" rel="noopener"` blocks cross-tab `window.opener` access. Edge case #7 documents all this correctly.
- **Scaling:** The footer renders O(N) where N is the number of menu links (capped at link-list maximum) + 5 social icons + payment types. No loops over `all_products` or metafields. No concerns.

## Testability and observability gaps

- The plan asks for screenshots in five distinct states (full / about+menu / socials only / no columns / light background) but does not specify which dev fixture product to capture from. Suggest pinning to `the-3p-fulfilled-snowboard` (visual-only) per `CLAUDE.md`'s test-fixture guide, since this work is visual-only.
- The plan asks the Coder to confirm `aria-label="Payment methods"` via "inspect element" but does not specify whether to also verify the social-link `aria-label` value (e.g., `"Instagram, Opens in a new window."`). Suggest adding one DOM-inspection check for a social-link `aria-label` to step 6 — it's the highest-value accessibility verification this plan introduces.
- The Coder is instructed to record the "baseline offense count" in step 0 but the impl-notes template in step 6 does not echo this back. Suggest adding "baseline `shopify theme check` count" to the impl-notes summary so QA can compare baseline vs final at a glance.

## Hidden coupling or breaking changes

- **`footer-group.json` mount.** Existing template references the footer section by handle `"footer"`. The plan does not rename the section file or handle, so this binding survives. Confirmed against `sections/footer-group.json`.
- **`merchant data preservation`** for `menu` and `show_payment_icons`. The plan preserves IDs and defaults byte-identical. `config/settings_data.json` would persist any merchant overrides because Shopify resolves settings by ID. The current `footer-group.json` has both at their defaults, so even a fresh install is fine.
- **Default color change is a deliberate visual change.** Risk #1 documents the dark-by-default behavior. The DevOps hand-off must mention it before publish. Acceptable.
- **No `color_scheme_group` introduced.** Section 2 (non-goals) and the header plan's precedent confirm this is intentional. No coupling to theme settings.
- **Dawn-era schema-locale keys preserved.** The plan instructs the Coder NOT to delete `newsletter_enable`, `header__1`, `show_social`, `enable_country_selector`, etc. These remain orphaned but harmless. Future cleanup is a separate plan.

No breaking changes detected.

## Alternatives the architect did not consider (or considered but did not document)

- **Wrapping the bottom-bar payment list in `<nav aria-label="Payment methods">` instead of `<ul aria-label="Payment methods">`.** A list of payment-method icons is arguably navigational only if the icons link somewhere; in this codebase they're decorative `payment_type_svg_tag` outputs. The `<ul>` choice is correct.
- **Using CSS `mask-image` to recolor non-`currentColor` SVGs.** Made moot by the pre-verification that all five SVGs are `currentColor`-compliant. No action needed.
- **A `text` setting (instead of `richtext`) for `about_text`** to keep the schema lean. The plan's choice of `richtext` is defended in section 6 ("brand 'about' copy benefits from paragraph and inline-emphasis support"). I agree.
- **`grid-template-columns: repeat(3, 1fr)` for equal columns vs `2fr 1fr 1fr`.** The plan defends the 2:1:1 ratio against the Ride design. Reasonable.

## Bug-fix-only review criteria

The plan slug does NOT start with `fix-`. Bug-fix-specific criteria do not apply.

---

## Minor recommendations (non-blocking)

1. Add `role="list"` to the payment-icons `<ul>` in section 7 (parity with the menu and social `<ul>`s; defends against Safari list-semantic stripping).
2. In section 4.4, add one sentence clarifying that the `<nav>` landmark's `aria-label` is sufficient and the inner `<ul>` does not need an additional label.
3. In step 6 item 7's impl-notes template, explicitly name "Safari 16.2+, Chrome 111+, Firefox 113+" as the browsers to attest against for `color-mix()`. Right now it just says "which browsers were tested."
4. In step 6 item 3, add "Inspect one configured social link in DOM and confirm its `aria-label` contains both the platform name and the new-window hint, comma-separated."
5. In step 6 item 7, add "Baseline `shopify theme check` offense count (from step 0) vs final count" so QA can see the diff at a glance.
6. In the QA/screenshot list, pin the dev fixture to `the-3p-fulfilled-snowboard` per `docs/dev-fixtures.md` (visual-only is sufficient).

These are quality-of-life improvements. None of them block implementation.

---

## Final assessment

This is the third revision; Revisions 1 and 2 cleared the substantive issues (storefront vs schema-locale namespace bug, section-group mounting, edge-case framing). Revision 3 holds up under independent re-verification: line references match the current files, SVG `currentColor` compliance is real, the header precedent supports every architectural choice, and the locale keys are correctly placed in the storefront vs schema-locale files.

The plan is implementation-ready. The six minor recommendations above are worth folding in but none are correctness blockers — a Coder following the plan as written would produce a working, accessible, theme-check-clean footer that matches the design.

APPROVE
