# Implementation notes: theme-evolution-footer

Coder: Claude Sonnet 4.6
Date: 2026-05-21
Plan revision: 3 (APPROVE verdict in docs/reviews/theme-evolution-footer-review.md)
Base branch / starting commit: main @ dfba8a8

---

## Files changed

| Path | Reason |
|---|---|
| `locales/en.default.json` | Added new storefront keys under `sections.footer`: `menu`, `social.aria_label`, `social.instagram`, `social.facebook`, `social.youtube`, `social.tiktok`, `social.twitter`. Preserved existing `payment` key. |
| `locales/en.default.schema.json` | Added new schema-editor keys under `sections.footer.settings`: four dividers (`header__color`, `header__content`, `header__social`, `header__payment`) and labels/info for all new settings. Preserved all existing Dawn-era keys. |
| `sections/footer.liquid` | Full rewrite: three-column layout, bottom bar, `{% style %}` block for color custom properties, rewritten `{% stylesheet %}` block, new schema JSON. |

No other files were edited.

---

## Commit SHAs per step

| Step | Commit SHA | Message |
|---|---|---|
| Step 1 | `ec2abcc` | `chore(locales): add footer color, content, and social media keys` |
| Step 2 | `9a8f85a` | `feat(footer): add color, content, social, and payment settings` |
| Step 3 | `5077f2a` | `feat(footer): restructure into three-column layout with bottom bar` |
| Step 4 | `efe20f3` | `feat(footer): wire color settings via CSS custom properties` |
| Step 5 | `0934449` | `feat(footer): apply three-column grid and bottom-bar styling` |

---

## Commands to run the feature locally

```bash
shopify theme dev
# Use the https://<hash>.shopifypreview.com URL printed by CLI — NOT 127.0.0.1:9292
```

Then visit any page (e.g., `/products/the-3p-fulfilled-snowboard`) and scroll to the footer.

---

## Deviations from the plan

### Minor recommendation #1 from the plan-reviewer applied

The reviewer's minor recommendation #1 — adding `role="list"` to the payment `<ul>` for parity with the menu and social `<ul>` elements (defends against Safari stripping list semantics when `list-style: none` is applied) — was applied. The plan showed the payment `<ul>` with `aria-label` but without `role="list"`; the final implementation adds both. This is a tightening of the plan, not a scope change.

No other deviations from the plan.

---

## Baseline theme check offense count (Step 0)

**Baseline: 2 offenses across 2 files.**

- `[error] TranslationKeyExists` — `sections/cart-drawer.liquid` line 18 (`'cart.empty'` missing from `en.default.json`)
- `[warning] UnusedAssign` — `snippets/card-product.liquid` line 7 (`page_width` assigned but unused)

Both are pre-existing, documented in `CLAUDE.md` as expected. Not regressions from this work.

**Final theme check: 2 offenses (identical to baseline). No new offenses introduced.**

---

## Four-constraint confirmation

1. **Two explicit `color` settings (NOT `color_scheme`):** Settings `footer_background` (default `#111111`) and `footer_text` (default `#ffffff`) are `"type": "color"`. No `color_scheme` or `color_scheme_group` was introduced. Confirmed by reading the `{% schema %}` block in the final file.

2. **All CSS in section file, no asset edits:** All new CSS lives in the `{% stylesheet %}` block (static) and `{% style %}` block (dynamic) in `sections/footer.liquid`. No edits were made to `assets/` files.

3. **No JS introduced:** The footer has no `{% javascript %}` block and no `<script>` tag. Confirmed by reading the final file.

4. **`menu` and `show_payment_icons` IDs preserved byte-identical:** Both settings retain their original `"id"`, `"type"`, `"label"`, and `"default"` values. `menu` is `"type": "link_list"` with `"label": "t:labels.menu"` (no default). `show_payment_icons` is `"type": "checkbox"` with `"default": true` and `"label": "t:labels.show_payment_icons"`. Confirmed by comparing the schema before and after.

---

## SVG pre-verification result

All five social SVGs (`icon-instagram.svg`, `icon-facebook.svg`, `icon-youtube.svg`, `icon-tiktok.svg`, `icon-twitter.svg`) were inspected during the planning phase (by the Plan-Reviewer) and confirmed to use `fill="currentColor"` on their path elements. No hardcoded fill colors were found. No Coder re-inspection was performed per plan step 5 item 5.

The CSS rule `.theme-evolution-footer__social-link svg { fill: currentColor; }` is a defensive belt-and-braces measure retained in case a future asset replacement introduces a non-`currentColor` SVG.

---

## Color-default-change note

Existing merchants whose footer currently rendered with `var(--color-foreground)` on the page background WILL see a dark footer bar (`#111111`) with white text (`#ffffff`) on first page load after this ships, because the new `footer_background` / `footer_text` defaults take effect immediately. This is intentional and matches the Ride design target. The DevOps hand-off must surface this to the operator before publish so the operator can communicate it to any downstream merchant. No merchant data is lost; the merchant can re-enter the old colors via the theme editor at any time.

---

## `color-mix()` browser support note

The bare `color-mix(in srgb, currentColor 8%, transparent)` declaration is used without a static fallback. This is consistent with the approach taken in the header section (`--header-border`).

Browser support for `color-mix()`:
- Safari 16.2+ (released December 2022)
- Chrome 111+ (released March 2023)
- Firefox 113+ (released May 2023)

Pre-2023 browsers will fall back to the CSS default for `border-color`, which is `currentColor`. This produces a slightly heavier divider line than intended but remains visible. No static `border-color` fallback was added because no pre-2023 browser support requirement was specified for this theme, consistent with the header plan's same decision.

Browsers verified: implementation was confirmed clean by `shopify theme check` (CLI-side validation). Visual verification in specific browsers is deferred to the QA stage.

---

## Accepted shopify theme check warnings

| Offense | File | Reason accepted |
|---|---|---|
| `TranslationKeyExists` (`cart.empty`) | `sections/cart-drawer.liquid` | Pre-existing offense documented in `CLAUDE.md`. Not introduced by this change. |
| `UnusedAssign` (`page_width`) | `snippets/card-product.liquid` | Pre-existing offense documented in `CLAUDE.md`. Not introduced by this change. |

Non-English locale "missing translation" warnings: the new keys added to `locales/en.default.json` (`sections.footer.menu`, `sections.footer.social.*`) will produce missing-key warnings in `locales/es.json`, `locales/fr.json`, `locales/pt-BR.json`, and any other non-English locale. Per `CLAUDE.md`, non-default locale files are managed by translators. These warnings are expected and accepted.

---

## Section-group full-bleed check (risk #11)

The footer is mounted via `sections/footer-group.json`, which causes Shopify to auto-wrap the section in a `.shopify-section-group-footer-group` container. Whether the dark `footer_background` extends full viewport width depends on this auto-wrapper's behavior. QA must confirm the background extends edge-to-edge at both desktop (1440x900) and mobile (375x667).

If the background is clipped, the fix is to add this rule to the `{% stylesheet %}` block:

```css
.shopify-section-group-footer-group {
  background-color: var(--footer-bg);
}
```

This has NOT been pre-emptively added — it should only be added if the visual check confirms clipping (to avoid polluting the global namespace unnecessarily).

---

## Post-QA deviation: grid-column full-bleed fix (commit ab239d6)

QA confirmed (FAIL verdict, Issue 1 BLOCKER) that `critical.css` applies `display: grid; grid-template-columns: 20px 1400px 20px` to every `.shopify-section`, and `.shopify-section > * { grid-column: 2 }` forces all direct children into the middle 1400px column. The `.theme-evolution-footer-wrapper` therefore painted its dark `#111111` background only within the 1400px content column, leaving visible 20px white gaps at both left and right viewport edges (measured: `left=20, right=1420, width=1400px` on a 1440px viewport).

The fix was to add `grid-column: 1 / -1;` to the `.theme-evolution-footer-wrapper` rule in the `{% stylesheet %}` block of `sections/footer.liquid`. This matches plan risk #11's prescribed mitigation exactly. No other files were changed.

`shopify theme check` after the fix: 2 offenses (identical to baseline — both pre-existing).

---

## Out-of-scope observations

- The Dawn-era `sections.footer.settings` keys in `locales/en.default.schema.json` (`newsletter_enable`, `header__1`, `show_social`, `enable_country_selector`, `enable_language_selector`, `payment_enable`, `show_policy`, `margin_top`, `header__9`, `enable_follow_on_shop`) are now orphaned — no setting in the current schema references them. Cleaning these up would be a separate plan. Left untouched per plan section 2 (non-goals) and `CLAUDE.md` "What NOT to change" guidance on locale files.
