# Plan review: theme-evolution-tailwind-t2 (Revision 1)

Reviewer: Plan-Reviewer
Date: 2026-10-22
Plan under review: `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/docs/plans/theme-evolution-tailwind-t2.md`
Revision: 1 (first review round of the T2 addendum)
Also reviewed: the two CF1 amendments to the umbrella, `docs/plans/theme-evolution-tailwind.md` D12 (third bullet, line 374) and §17.4 (line 1654).

Rules re-read this pass: `CLAUDE.md` (lines 55-224 in full, including `### CSS architecture (Tailwind CSS v4)`), `AGENTS.md` (the `### CSS architecture` heading at 186 and the Cascade-layers bullet at 196), `.theme-check.yml` (`extends: theme-check:recommended`). `learn_shopify_api` (liquid) was called once. Shopify Dev MCP docs were used for the `t` filter's `_html` escaping and for the theme-check rules `UndefinedObject`, `MissingRenderSnippetArguments`, `UnrecognizedRenderSnippetArguments` and `ValidRenderSnippetArgumentTypes`.

Cross-references read:
- Theme files: `sections/product.liquid`, `sections/related-products.liquid`, `sections/material-spotlight.liquid` (1-165), `sections/material-tooltip.liquid`, `sections/custom-section.liquid`, `sections/cart-drawer.liquid` (280-394), `sections/header.liquid` (cart link), `blocks/group.liquid`, `snippets/card-product.liquid` (1-235, 228-251, 296-325, 560-651, plus every `if`/`else` line), `snippets/price.liquid`, `snippets/unit-price.liquid`, `snippets/sustainability-rating.liquid`, `snippets/material-info.liquid`, `snippets/trust-badge.liquid`, `snippets/specs-table.liquid`, `snippets/css-variables.liquid`, `layout/theme.liquid`, `templates/product.json`, `templates/product.landing-page.json` (block types).
- Assets and source: `src/tailwind.css`, `package.json` scripts, `scripts/check-bare-hidden.mjs`, `assets/eco-tooltip.css`, `assets/eco-tooltip.js`, `assets/product-form.js`, `assets/global.js` (1120-1184), `assets/material-api-fetch.js` (hooks), `assets/component-price.css`, `assets/component-card.css` (270-294, 404-443, 505-559), `assets/section-related-products.css`, `assets/mask-blobs.css`, `assets/base.css` (190-201, 292-316, 458-487, 876-915, 2918-2937, 3496-3535, plus a search for `.loading`/`.hidden` and for Tailwind-named classes).
- `config/settings_schema.json` (colors), `config/settings_data.json`, `locales/en.default.json` (130-270), and live's post-T1 `config/settings_data.json` from the DevOps backup pull (`~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-post-t1-live-push/`).
- Docs: the umbrella's §0 `B_rb` row, D12 and §17.2-17.4; T0 and T1 QA reports (the `B_rb` sections and the T1 overflow, wax and B1 sections); T0 impl notes (Step 0); T1 impl notes (deviations, N3); T1 deploy notes; `docs/dev-fixtures.md`; `docs/plans/material-spotlight-impl-notes.md` (140-167); the round-1 and round-2 umbrella review.

I had no shell. Nothing was built or rendered. The Tailwind 4.3.3 facts about `@utility` nesting and `--minify` come from the orchestrator's build and are relied on as given. Other Tailwind v4 syntax facts are from my own knowledge (cutoff June 2026) and are labelled where they matter.

---

## Summary

This is a careful addendum. Its design choices are sound:
- The cascade model is designed in: custom CSS goes in `@layer components` in the same commit, and there is an unlayered sweep (C2.6).
- The B1 lesson is applied (no implicit-row height tricks, plus a containment check), and geometry uses section-relative `y`.
- The N4 fix is made at the source, and the scoped selector is exactly right for the block's two option values.
- The cart `aria-label` fix is minimal, and the tooltip move is clean.
- The criteria sweep is honest about guards and partial checks.

CF1 is resolved in substance. `B_doc` is well defined, the validity rules make it two-sided, and C2.3 has both a static half and a rendered half, each of which goes red on a leftover Dawn tag. One umbrella line was missed when the umbrella was amended (R5).

I found **no blockers** and **nine required changes**:
- Three are theme-check gate failures that the plan's own specified markup would cause (R1).
- Two are merchant-visible regressions on paths the fixtures don't exercise: the card badge clipped by image shapes (R2), and a reachable volume-pricing note deleted as "unreachable" (R3).
- One is a design decision (D2.5) that no criterion can distinguish from the alternative it rejects (R4).
- Three are text that reaches agents or the owner: the umbrella budget line, the new `CLAUDE.md` rule, and the Q1 timing (R5, R6, R9).
- Two are small criterion and evidence fixes, including the orchestrator's minify requirement (R7, R8).

None needs a redesign. Verdict: **APPROVE WITH CHANGES**.

---

## Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**
- **Line citations.** Every `sections/product.liquid` citation (8-9, 11, 13-15, 30-32, 35-37, 39-49, 45, 51-61, 53, 58, 64, 66, 76-80, 84-99, 86-94, 102-105, 111-221 with 118/133/138, 223-323, 258-273).
- **related-products.** 1-3, 6, 9-21, 15, 23-29, 25, 31, 35, 38-51, 56-58, schema 61-255. The `color_scheme` setting is at 139-145.
- **material-spotlight.** 25-26, 32-36, 38-49, 51-79, 66-68, 81-100, 127-142, 146-159.
- **sustainability-rating, material-info, trust-badge, specs-table and custom-section.** Every cited range.
- **material-tooltip.** 8, 17-19, 22-45, 36, 42.
- **eco-tooltip.css and eco-tooltip.js.** All ranges.
- **group.liquid.** 15, 26-31, 50, 57-60.
- **Other single lines.** `layout/theme.liquid` 29, 30 and 38. `global.js` 1141-1149, 1152-1162 and 1169. `cart-drawer` 286-297, 321 and 380. `header.liquid:96`.
- **price and card-product.** `price.liquid` 1-4, 5-18, 19-45, 47-129, 66-95 and 116. `card-product` 7, 32-39, 41-52, 66-70, 141-157, 160-227, 535/550/644, 571-587 and 591-650.
- **base.css.** 196-198, 298-308, 462, 470-484, 881-913, 2921-2934 and 3504-3534.
- **Range and select counts.**
  - Ranges: `products_to_show` gives 9 values, `columns_desktop` 6, and each related padding range 26.
  - Selects: `heading_size` 5 (default `h1`), `columns_mobile` 2 (string values), `image_ratio` 3, `image_shape` 8, trust `style` 3, `picker_type` 2, group `layout_direction` 2.
- **Arithmetic.**
  - `K_q1` rows (25.6→16, 20.8→13, 19.2→12, 48→30).
  - All seven `C_mix` pairs in E2.13. The formula is right: mixing with `transparent` keeps the color and scales alpha, which is then composited over white.
  - 18,409 ÷ 15,907 = 1.1573.
  - Both blob maps, recomputed rule by rule for indexes 1-10. Base `1,2,3,4,5,3,6,1,3,5`, hover `5,6,1,2,3,1,4,5,1,3`.
- **`N_dawn` before = 9.** Three tags render at page load outside `<product-recommendations>` (only its `innerHTML` is copied in, `global.js:1161`), five come from the first card, and one is the layout tag.
- **Locales.** `sections.product`, `sections.material_info` and `sections.material_tooltip` don't exist yet. `sections.header.cart_count` is pluralized ("1 item", "0 items"). Only English locale files exist, so the new keys can't trigger `MatchingTranslations`.
- **`--content-grid`.** It is defined on `.shopify-section` (`src/tailwind.css:121-126`) and inherited, so the custom-section mapping is parity.
- **`product-recommendations--loaded`.** Only `global.js:1169` mentions it. Nothing styles it.

**Sampled and found wrong:**
- §3.7 / §5.12: "the bulk popover (229-307) … never render[s]". The `{% else %}` at `card-product.liquid:244-247` is reachable (R3).
- E2.17's rationale. `material-info.liquid:107` (`display: block !important`) follows `height: 8px !important;`, not a comment (N5).
- §5.12's badge placement. The badge sits inside the clipped media box; today it isn't clipped (R2).

**Taken on trust (not re-read):**
- `material-spotlight.liquid` 165-355 (the stylesheet and schema), and the `heading_tag`/`icon_style` option counts.
- `component-card.css` rows in E2.9 beyond those I opened, and `base.css` 105, 146-149, 272-291, 993-1028 and 3215-3236.
- The `W_li`, `ATC`, `X_wax` and T1 `/` overflow figures. I checked the quotes against the reports, not the pages.
- Tailwind default sizes in the §15 list, except `text-3xl`/`text-4xl`.

**Gaps the manifest itself lists, reviewed in full:**
- **Nested `@utility` states.** Settled by the orchestrator's build, with one condition (R7).
- **Bundle subsetting.** Corroborated: T0 QA measured the same `styles.css` (2,394 B) on `/` and on the product page.
- **`search.terms` escaping.** Escaping before interpolating into an `_html` key is correct per Shopify's locale docs.
- **Live palette.** Verified: live's `settings_data.json` after the T1 push is `{"current": {}}`, the same as the repo, so `C_mix` holds on live today.
- **Cart-drawer code.** Traced against 303-327 and 359-384.
- **Liquid not run through validation.** This is where R1 came from.

---

## Blocking issues

None. Every issue below can be folded into a Revision 2 without changing the design.

---

## Required non-blocking changes

Each is graded **REQUIRED**: fold it in before `/implement`. On its own it doesn't block a build, but several would send a correct build to a FAIL or to a pointless QA cycle.

### R1 — REQUIRED. As specified, three steps fail their own theme-check gate

`.theme-check.yml` extends `theme-check:recommended`. Shopify documents the following checks as enabled by default, at warning severity:
- `UndefinedObject` is **skipped for snippets without LiquidDoc and enforced once a `{% doc %}` exists**.
- `MissingRenderSnippetArguments` reports a required `@param` that isn't passed.
- `UnrecognizedRenderSnippetArguments` reports an argument that the doc doesn't declare.

T2 adds `{% doc %}` to `price.liquid` and `card-product.liquid`, so these checks start to apply there:

1. **Step 9 and C2.1, `UndefinedObject` in the new card.**
   - §5.12 keeps `id="Badge-{{ section_id }}-{{ card_product.id }}"` and the `CardLink-…` id/`aria-labelledby` (both use `section_id`).
   - It also keeps the images' `loading` block byte-for-byte, which is `{% unless lazy_load == false %}` at 92-94.
   - The doc header documents neither `section_id` nor `lazy_load`. That gives at least one more offense, so "exactly 1" is red on the plan's own markup.
   - R4's mitigation ("document only the parameters each caller passes") is what causes this.
2. **Step 8, `MissingRenderSnippetArguments`.** §5.11 documents `product` as required. Until Step 9, `card-product.liquid:644` renders `price` with only `placeholder` and `show_compare_at_price`, so Step 8 shows 3 offenses where the checklist says 2.
3. **Step 9, `UnrecognizedRenderSnippetArguments`.** `related-products.liquid:48` still passes `skip_styles` until Step 10, and the new card's doc doesn't declare it. Step 9 therefore shows 2 offenses where it says "exactly 1".

**Change:**
- **Card.** Drop `section_id` from the ids, keeping `CardLink-`/`Badge-` consistent with `aria-labelledby`. Replace the `lazy_load` block with a plain `loading="lazy"`. Alternatively, document both as optional.
- **Price.** Document `product` as `[product]`, which is the truthful contract given the `placeholder` path.
- **Related call.** Move the `skip_styles` removal (and `card_index`) on the render call into Step 9, or state that Step 9 expects 2 offenses and Step 10 expects 1.
- **R4.** Rewrite it to name these three checks.

### R2 — REQUIRED. The card badge is clipped by four of the seven image shapes

- **Today.** Dawn applies the shape to `.card__media` (`card-product.liquid:75`, class `shape--*`). The visible badge lives in the sibling `.card__inner > .card__content` (141-157), so the shape never clips it.
- **Under the plan.** §5.12 puts `{{ shape_classes }}` (a `clip-path`) on the media box and the badge **inside** that box at `bottom-2.5 left-2.5`. `clip-path` clips all descendants, so the bottom-left corner is cut away for `round` (ellipse 45%), `blob`, `diamond` and `chevronleft`.
- **Effect.** A sale or sold-out badge becomes invisible on those shapes.
- **Why no criterion catches it.** The fixtures use `default`, and C2.25's "eight distinct outlines" doesn't look at badges.

**Change:**
- Put the clip on an inner element: a relative, unclipped media wrapper that holds a clipped image box and an unclipped badge.
- Add to C2.25's `image_shape` proxy: "with a product on sale or sold out, the badge's centre `elementFromPoint` is the badge for every shape" (or a screenshot check, if no fixture product is on sale).

### R3 — REQUIRED. A reachable branch is deleted as "unreachable": the volume-pricing note

`card-product.liquid:228-248` is:

```liquid
{%- if card_product.quantity_price_breaks_configured? -%}
  {% if card_product.variants_count == 1 and quick_add == 'bulk' %} …popover…
  {% else %}
    <div class="card__information-volume-pricing-note"><span class="caption">{{ 'products.product.volume_pricing.note' | t }}</span></div>
  {% endif %}
```

No caller passes `quick_add`, so the `else` branch at 244-247 renders for every product with quantity price breaks. §3.7 calls 229-307 unreachable, and §5.12 deletes 228-570 as "unreachable or hidden". Meanwhile §5.11 deliberately keeps the volume-pricing branch of `price.liquid`, so the card would show volume prices without the note that explains them. The note only appears for B2B buyers (quantity price breaks), so no fixture can exercise it. That makes it a silent removal rather than a visible one.

**Change:** Keep the note as one conditional line in the card, for example `text-[0.75rem]` with `products.product.volume_pricing.note`. Otherwise, list it in §7/§8 as an accepted removal for the owner. Correct §3.7's range either way.

### R4 — REQUIRED. No criterion can tell D2.5's token rule from the "exact hex everywhere" alternative it rejects

D2.5 rejects exact hex because it "breaks on the dark palette the owner intends". Every color check in §9, however, runs at the default palette:
- C2.10 checks "same computed color".
- E2.13 compares values at the defaults.
- C2.25's operator list changes only `accent_color` and `type_heading_font`.

At the defaults, `text-foreground` and `text-[#333333]` compute identically. A Coder who hardcodes the transparent-surface colors would pass everything. That is exactly the "criteria don't test the decision" case. (I confirmed the defaults are what live runs today: live's `settings_data.json` is `current: {}`.)

**Change:** Add to the §10 settings proxy (the scratch copy, as T1 QA did with `#ff0066`) a variant with `foreground_color` and `background_color` set to clearly different values. Then check both directions:
- **Must follow the palette:** the spotlight title and subtitle, the accordion border and story, the sustainability label inside the spotlight, the card badges, and the buttons.
- **Must stay fixed:** the material-info card text and background, the tooltip box, the bar fill and track, and the teal trigger.

This also gives the owner a preview of the dark Ride palette before setting it on live.

### R5 — REQUIRED (text that reaches people). The umbrella amendment missed D12's budget bullet

The amended D12 third bullet (line 374) and §17.4 (line 1654) say that from T2 on, `B_doc`/`N_dawn` replace the head-only allowance. D12's budget sub-bullet at **line 378 still says** "`B_rb(home)` and `B_rb(product)` ≤ 1.15 × `B_rb0` at the end of T0 to T4 (coexistence allowance)". A reader of the umbrella now finds two contradictory T2-T4 budgets in the same decision.

**Change:** Make line 378 read "at the end of T0 and T1 (from T2, see the amended bullet above and §17.4)". If the Architect prefers, add a one-line pointer in §0's `B_rb` row too.

**Otherwise the amendment checks out:**
- The 1.157× claim is correct against the T1 QA figures: 3,862 + 10,813 + 560 + 1,598 + 1,576 = 18,409 on `/` and 3p, five head links, all valid.
- It uses the same basis T0 used: the dev theme against live pre-T0's 15,907.
- "T5 still compares `B_rb`" is consistent with §17.4.

### R6 — REQUIRED (rules text). R-T2.1's own example contradicts `CLAUDE.md:211`

The new bullet says custom CSS "never selects a Tailwind class name". Its example is `.grid { … }` in an `assets/` file, and it says that "when an existing rule collides, fix it at its source … in the same commit". The `.grid` rule that actually exists in `assets/` is Dawn's `base.css:881` (legacy layer). The project deliberately does **not** fix that one at source: `CLAUDE.md:211` says to add `mb-*`, and T2 itself relies on `mb-0` in three places and on C2.6b's allowlist of `grid`, `hidden`, `uppercase` and `overflow-hidden`.

Read literally, the new rule tells the next Coder to edit `base.css`, which the umbrella reserves for T5. It also contradicts the bullet four lines below it.

**Change:**
- Scope the rule to unlayered CSS outside `assets/base.css`, for example: "This doesn't apply to the coincident names in `assets/base.css` (legacy layer); handle those as the bullets under 'While `assets/base.css` still loads' say."
- Pick an example that is actually unlayered (the `.group` one is enough).
- Fold in N12 (`data-` attributes) while editing.

### R7 — REQUIRED. State that the nested button states depend on the minified build, and check the flattened form

The orchestrator confirmed the following with Tailwind 4.3.3:
- `@utility btn-primary { &:hover {…} }` compiles.
- **Only `--minify` (Lightning CSS) flattens it** to `.btn-primary:hover{…}`.
- Unminified output keeps native `&:hover` nesting, which Tailwind's own browser floor (Chrome 111, Safari 16.4) doesn't support.

`build:css` and `watch:css` both pass `--minify`, and `check:css` rebuilds and diffs, so the committed file is minified today. But D2.7, R2 and Step 7 present nesting as unconfirmed with a fallback, and Step 7's check ("confirm the `:hover` … rules are present") passes on nested output too.

**Change:**
- In D2.7 and R2, record the confirmed behavior and the minify dependency.
- Make Step 7 and C2.14 check `grep -c '.btn-primary:hover{' assets/tailwind.css` ≥ 1, and `grep -c '&:' assets/tailwind.css` = 0.
- Note that `--minify` must never be dropped from `build:css`.
- Update the §15 "not checked" line.

### R8 — REQUIRED. C2.13 and R5 claim a check that doesn't exist (the spinner display utility)

§9.2 says C2.13 goes red when the "spinner [is] given a display utility, so it stays visible after `hidden` comes back in T5". R5's mitigation cites "§5.10 forbids it; C2.13". But C2.13 only checks that the class `hidden` is present and that `aria-disabled` is cleared. During T2, Dawn's `.hidden { display: none !important }` (`base.css:196`) hides the spinner whatever display utility it carries, so no rendered T2 check can see this mistake. `check:hidden` won't see it either: it flags only *variant-prefixed* display utilities next to `hidden`. The failure would surface in T5 as a spinner permanently over the "Add to cart" label.

**Change:** Add a static half to C2.13. The quoted class string containing `loading__spinner` in `sections/product.liquid` must contain no unprefixed display token (`block|flex|grid|inline|inline-block|inline-flex|contents|table`). Also correct §9.2's "Red on" cell to name that check.

### R9 — REQUIRED (owner decision timing). Q1's trust-badge sub-question is due after the step that converts the trust badge

§14 Q1 says the plan proceeds "unless you say otherwise before Step 8". But `trust-badge.liquid` is converted in **Step 4**, and its size (`text-[1.4rem]`, 22.4 px) is set there. The plan's recommendation for the trust badge is **parity**, with correction only "if the owner includes it".

The orchestrator's summary of the adopted Q1 ("correct … the related-product cards **and the trust badge**") goes beyond the plan's recommendation. That isn't unsafe, but it changes the badge on **`/` and every product page**, and the plan has no Δ row for it. C2.10 (trust badge geometry on `/`) and C2.26 (`/` screenshots match staging) would then flag a correct build.

**Change:**
- Move the Q1 deadline to "before Step 4" for the trust-badge part.
- If the owner (or the orchestrator, under the standing instruction) chooses correction, add an E-row: trust badge text 22.4 → 14 px (`text-[0.875rem]`) on `/` and the product pages, padding unchanged (it's px).
- Exempt it in C2.10/C2.26.
- If parity is chosen, say so explicitly in the impl notes, so QA doesn't treat 22.4 px as an oversight.

---

## Nits

Each is graded **NIT**: it doesn't block and needs no Revision 2 on its own. Apply them while editing.

- **N1 — C2.7's width half can't go red.** The probe sets `style="width:10px"`, and an inline style beats any stylesheet rule that isn't `!important`, so `width` reads 10px whether or not the block rule is scoped. The `overflow` half carries the test, so it is still two-sided. Drop the width assertion, or move the width into a class.
- **N2 — M_css: raise the resource-timing buffer.** The default buffer is 250 entries. The body stylesheets are injected last (after scroll), so if a long page fills the buffer they are the entries that get dropped. That would turn every run "invalid". Add `performance.setResourceTimingBufferSize(1000)` via `addInitScript`.
- **N3 — C2.6: say that inline sheets count.** Inline `<style>` sheets (`href === null`) must be included as "same-origin". That covers `{% style %}`, `<style>` and anything Shopify injects. Report matches whose owner isn't a theme file separately, so a Shopify- or app-injected rule isn't mistaken for a T2 defect.
- **N4 — C2.8 misses the leading `!` form.** Tailwind v4 still accepts `!mb-0` (the v3 style). Extend the guard to class strings with a leading `!`, but don't match `!important` inside `<style>`.
- **N5 — E2.17's stated cause is wrong.** No comment precedes the material-info `display: block !important` (`material-info.liquid:107`). The row is `[to be measured]`, so no decision depends on it. Fix the wording.
- **N6 — The §5 convention "No `h-full` or percentage heights inside T2 grids" is broader than intended.** The plan itself uses `size-full` on card images, the placeholder SVG and the spinner, all inside the related grid. Say "on grid items (direct children of a grid)", which is the B1 lesson.
- **N7 — Make C2.19's price assertion exact.** A card has `[data-compare-at]` **iff** its product's `compare_at_price > price` (read from `/products/<handle>.js`), and on-sale cards have exactly one price element.
- **N8 — Specs row type hint.** For consistency with §5.13, use `text-[length:clamp(0.9rem,1vw,1.1rem)]`. I expect v4 to infer a length from `clamp()` anyway (my knowledge, unverified).
- **N9 — C0.8 versus C2.1.** Umbrella §17.4 applies C0.8 ("offenses = Step 0's `N_tc`, same files and checks") in every phase. T2 intentionally goes from 2 to 1. Say in §9 that C2.1 supersedes C0.8 for T2, so QA doesn't mark C0.8 red.
- **N10 — Record `B_doc` on `/`.** The amendment drops the home page from every CSS-transfer guard: only the product pages are budgeted. Step 0 already measures `/`, so record it in C2.4 (no threshold, or the same one) for the owner. Head growth on `/` is otherwise bounded only by `S_tw`.
- **N11 — Blob variants per index are untested.** "Eight distinct outlines" passes even if every card uses blob 1. Add "with `image_shape: blob` and 4+ cards, cards 1-4 compute four different `clip-path` values".
- **N12 — R-T2.1 says "a `data-` attribute".** `CLAUDE.md:222` says JS-hook `data-` attributes carry no CSS. Write "a dedicated `data-` attribute that isn't a JS hook".
- **N13 — Rollback.** "Reverting 9 alone also works" is true, but the old card then gets no `skip_styles` and emits its five Dawn links **per card**. Say so, so a partial rollback isn't mistaken for a regression.
- **N14 — The landing-page template** renders `image-banner` (with `preload: true`) above the product section. The new `fetchpriority="high"` and preload on the product's first image then compete with the banner's LCP. Consider applying the high priority only when the product section is first in the template, or accept and note it.
- **N15 — R12, optional.** T2 rewrites `material-info.liquid:150` and touches `material-tooltip.liquid:30` anyway, and the spotlight already uses `escape | newline_to_br`. Escaping both now costs one filter each. It stays out of scope if the Architect prefers, because it changes how stored HTML renders.

---

## Verdict on Q1 and Q2

**Q2 (no sale or compare-at price on the product page): safe. It removes nothing.** I checked this directly:
- The main section's price block is `{{ product.price | money }}` and nothing else (`sections/product.liquid:34-37`). It has never rendered a compare-at or sale price.
- `templates/product.json` and `product.landing-page.json` both use this same section.
- `snippets/price.liquid` is rendered only from `card-product.liquid` (ripgrep).

So keeping the product page price-only isn't a behavior removal, and it needs no blocker or required change. The plan keeps the card's sale branch and (per D2.12) makes it server-branched, which C2.19 tests. The rationale (the variant `<select>` sits outside the form) is accurate (`product.liquid:63-74` versus `84-99`).

**Q1 (correct Dawn-derived rems on the related-product cards to Dawn's intended sizes): safe for the cards.**
- The values are Dawn literals rendered 1.6× large because the root is 16px (for example, 25.6px card prices).
- Correcting them changes no setting, no option value and no behavior, and E2.9 lists every row.
- A rejection is a class-string swap.

**For the trust badge**, the plan recommends **parity**, not correction. If the orchestrator adopts correction as its summary says, that is not unsafe, but it must be decided before Step 4 and needs a Δ row covering `/` (R9).

---

## Verified facts versus unverified claims

**Verified this round (by reading files or Shopify docs):**
- `card-product` renders only from `related-products.liquid:41`. `price` renders only from `card-product`. `unit-price` renders only from `price`.
- No caller passes `quick_add`, `section_id`, `lazy_load`, `extend_height` or `horizontal_*`. The quick-add (311-570) and placeholder (591-650) branches are unreachable. **244-247 is reachable** (R3).
- `material-tooltip.liquid:42` prints `search.terms | strip` unescaped. The error branch needs an empty `material` definition (17-19).
- The product `<h1>` font size is `calc(var(--font-heading-scale) * 3rem)` (`base.css:298-308`). That variable is undefined, so the size is unset and the title inherits 16px.
- Dawn's `.grid__item` widths use undefined variables, which leaves `flex-grow: 1; flex-shrink: 0` items at their content size. T1 QA traced the ski-wax 34 to the related cards.
- `blocks/group.liquid` renders `class="group {{ block.settings.layout_direction }}"`, and the only option values are `group--horizontal` and `group--vertical`. The default and both presets set one of them, so `.group:is(.group--horizontal, .group--vertical)` keeps every rendered block styled. The block's three rules set disjoint properties, so the specificity rise from (0,1,0) to (0,2,0) changes nothing inside the block.
- `eco-tooltip.css` is referenced only by `layout/theme.liquid:30` (not `password.liquid` or the gift card). `eco-tooltip.js` references only the `.eco-tooltip` and `.is-visible` classes, which the plan keeps in `@layer components`. Deleting the asset is safe, and on live `nodelete = true` keeps the file.
- `product-form.js` hooks: the first `span` is the label; `.loading__spinner` has `hidden` toggled; `finally` always restores the button. On a 422, `response.status` is truthy, so no `.sold-out-message` exists and `this.error` stays false, which is the C2.13 recovery. The legacy `.loading__spinner { display: inline-block }` plus `absolute` keeps the shown spinner a block, so T2 doesn't need a display utility (see R8 for the T5 side).
- The `[data-header-cart-icon]` link carries `aria-label="{{ cart_count_label }}"` (`header.liquid:96`), and both update paths replace only `innerHTML` (321, 380). §5.14's guards are correct.
- The live palette is repo defaults (`current: {}` in the post-T1 live pull). `foreground_color` defaults to `#333333`. The D2.5 colors therefore hold on live today; R4 covers the future dark palette.
- `build:css` and `watch:css` use `--minify`, and `check:css` rebuilds and diffs.
- `check-bare-hidden.mjs` excludes `:hidden` forms and flags only variant-prefixed display utilities. That makes every class string in §5 pass, and also means it can't see R8's case.
- The bundle isn't subset: corroborated by T0 QA's identical `styles.css` size on `/` and the product page.
- The theme-check behaviors cited in R1 come from shopify.dev's check reference.

**Unverified (left to Step 0, the Coder or QA):**
- The `X_wax` culprit, which the plan correctly gates in Step 0.
- `B_doc0`, `B_body0` and the direction of `B_doc`.
- Whether the material-info `<div>` bars render today.
- Whether any related product is on sale, sold out, without media, or has two media or reviews.
- Tailwind syntax I know only from documentation or memory: `aspect-(--x)`, `bg-(--x)/5`, `text-(--x)` resolving to color, `after:animate-[…var()…]`, `forced-colors:`/`not-forced-colors:`, `font-[Times]` and `-z-1`. I expect all of them to work in v4, but none was built.
- Whether `theme-check:recommended` enables all three checks in R1. Shopify documents them as enabled by default, so R1 assumes yes.

---

## Trajectory

This is round 1 of the T2 addendum: 0 blockers, 9 required, 15 nits. The required items are local edits, mostly to class placement, doc headers, step ordering and criterion text. None reopens a design decision, and CF1 is resolved apart from one missed umbrella line. The Architect doesn't need to resubmit for a full review if a Revision 2 folds these in. A targeted check of R1-R9 is enough.

## Required changes

1. **R1.** Make the specified markup pass its own theme-check gates:
   - drop or document `section_id` and `lazy_load` in the new card;
   - make `price`'s `product` param optional;
   - move the `skip_styles` render-argument removal into Step 9, or restate the Step 9 count;
   - rewrite R4.
2. **R2.** Keep the card badge outside the clipped shape element, and add a badge-visible check to the `image_shape` proxy.
3. **R3.** Keep the reachable volume-pricing note (`card-product.liquid:244-247`), or list its removal as an accepted Δ. Correct §3.7.
4. **R4.** Add a changed-`foreground_color`/`background_color` proxy variant that checks token-driven surfaces follow and fixed white surfaces don't.
5. **R5.** Amend umbrella D12 line 378 so the 1.15× head allowance covers T0 and T1 only.
6. **R6.** Carve `assets/base.css` legacy coincident names out of R-T2.1, use an unlayered example, and fold in N12.
7. **R7.** Record that the nested button states rely on `--minify`. Make Step 7 and C2.14 check for `.btn-primary:hover{` and zero `&:` in `assets/tailwind.css`.
8. **R8.** Add a static no-display-utility check on the spinner's class string to C2.13, and fix §9.2 and R5's text.
9. **R9.** Move Q1's trust-badge deadline to before Step 4. If correction is chosen, add the E-row (22.4 → 14 px on `/` and the product pages) and the C2.10/C2.26 exemption.

APPROVE WITH CHANGES

---

## Round 2

Reviewer: Plan-Reviewer
Date: 2026-10-23
Plan under review: `docs/plans/theme-evolution-tailwind-t2.md`, **Revision 2**
Also reviewed: the umbrella edits in `docs/plans/theme-evolution-tailwind.md` (§0 `B_rb` row at line 62, D12 third bullet at 374, D12 budget sub-bullet at 378, §17.4 at 1654). That file is modified in the working tree but not committed yet.

Rules re-read this pass:
- `CLAUDE.md`: the session copy in full, plus a grep of the repo file to confirm the anchors the plan cites. Line 60 is `check:hidden`, 68 the theme-check bullet, 191 `### CSS architecture`, 201 the Cascade-layers bullet, 207-208 the "While `base.css` still loads" bullets and `hidden`, 211 the `grid` margin, 214 and 221 the JavaScript directives.
- `AGENTS.md`: anchors at 186 and 196.
- `learn_shopify_api` (liquid) was called once. The Shopify docs were searched for `section.index`.
- I had no shell, so nothing was built, rendered or run through theme check.

### Round 2 summary

Revision 2 resolves all nine round-1 required changes. Two are substitutions, and I accept both:
- **R2.** An ancestor `clip-path` check replaces my `elementFromPoint` check, which really is defeated by the stretched link's `::after`.
- **R9.** The owner's Q1 decision keeps the trust badge at parity, so no deadline or E-row is needed.

The Architect's own sweep found two more `UnusedAssign` instances of the R1 defect class. Both are real: `price.liquid:32` and `material-spotlight.liquid:58`, each confirmed by grep.

Revision 2 introduces one new **REQUIRED** item, which is small. The kept volume-pricing note misses Dawn's 750 px caption step, and E2.25 states the wrong "current" size. There are four new nits. Nothing blocks, and no round 3 is needed (see Trajectory).

### Manifest: what I sampled this round, and what I took on trust

**Sampled and confirmed:**
- **§15 "Gate sequencing" and the §13 offense table.** I walked every step against the files it touches and read `card-product.liquid` 1-260 and 300-651, `price.liquid` and `unit-price.liquid` in full, `related-products.liquid` 1-70, `material-spotlight.liquid` 1-165, `specs-table.liquid`, `trust-badge.liquid`, `material-info.liquid` (1-20 and 134-174), `sustainability-rating.liquid` 1-45, and `product.liquid` 1-110. Details are under R1 below.
- **The two extra `UnusedAssign` reads.** `price.liquid:32` `available` is read only at 52. `material-spotlight.liquid:58` `color_scheme` is read only at 81: a grep finds only 58, 81 and the schema id at 294-295.
- **`page_width`.** It appears only at `card-product.liquid:7`.
- **`card-product` callers.** It is rendered only from `related-products.liquid:41` (grep over the theme, docs excluded). `price` is rendered at 227, 535 and 550 with `product`, `price_class` and `show_compare_at_price`, and at 644 with `placeholder` and `show_compare_at_price`.
- **The umbrella's four statements** (62, 374, 378, 1654). See R5.
- **C2.27's premises.**
  - `settings_schema.json` defaults: `foreground_color` `#333333` at 73-74 and `background_color` `#FFFFFF` at 67-68.
  - `css-variables.liquid:25-26` prints both settings.
  - The repo's `settings_data.json` is `{"current": {}}`.
  - The token chain reaches the "must change" elements that have no color class of their own. `src/tailwind.css:114-118` sets `body { color: var(--color-foreground) }`, and `base.css` has no `body` color rule. The legacy `h1`-`h5` `color: rgb(var(--color-foreground))` (`base.css:267`) is invalid with a hex value, so it inherits. The accordion summary and "Share" (`color: inherit`) therefore do follow the palette.
  - The arithmetic: `#ee1188` = rgb(238, 17, 136) and `#112233` = rgb(17, 34, 51).
- **`section.index`.** Per shopify.dev "Use section.index", it is nil in the editor, for static sections and in the Section Rendering API, and it restarts at 1 per template and per section group. `product.landing-page.json:102-105` orders `landing-hero` then `main`, and `product.json:124-129` orders `main` first.
- **Card id uniqueness.** `sections/related-products.liquid` has no `presets` (grep), so a merchant can't add a second instance in the editor. It appears only in `product.json:83`.
- **The volume-pricing key and Dawn's caption.** The key exists (`en.default.json:98`). Dawn's `.caption` is 1rem, and **1.2rem from 750** (`base.css:373-383`). The note's own rule is `component-card.css:146-150`.

**Taken on trust (not re-derived):**
- The blob maps and the `K_q1` and `C_mix` arithmetic (verified in round 1, unchanged).
- The Tailwind 4.3.3 `--minify` facts (from the orchestrator).
- The Tailwind default sizes.
- The theme-check behaviors that the D2.11 table quotes (`UnusedDocParam`, `ValidDocParamTypes`) and the two open predictions. Both have fallbacks; see below.
- Whether `shopify theme dev --path` uploads `settings_data.json`. C2.27's precheck guards this.

**Gaps the manifest lists, reviewed in full:** the two theme-check predictions, and C2.27's upload assumption. Both are below.

### Round-1 items against Revision 2

| Item | Status | Evidence |
|---|---|---|
| R1 | **Resolved** | See "R1 walk" below |
| R2 | **Resolved (acceptable substitution)** | §5.12's structure diagram and the media wrapper / image box / badge rows; C2.19's badge half; C2.25's per-shape loop with a forced badge in the scratch copy. Equivalence is argued below |
| R3 | **Resolved**, with one new required item | §3.7 range corrected to 229-243 / 249-307 (matches the file). The note is kept in §5.12 and checked statically in C2.19. **E2.25 and the class string miss the ≥750 size** (R2-1) |
| R4 | **Resolved** | C2.27 is two-sided, has a validity precheck, and is confined to the scratch copy and the dev theme. Detail below |
| R5 | **Resolved** | Detail below |
| R6 | **Resolved** | R-T2.1 now uses the unlayered `.group` example, carves out `base.css` coincident names (pointing at the 207 bullets), and says "dedicated `data-` attribute that isn't a JS hook" |
| R7 | **Resolved** | D2.7 records the minify dependency. The §5.1 comment, Step 7's three greps and C2.14 match the round-1 request. The `&:` = 0 test is sound: escaped arbitrary variants such as `[&::-webkit-details-marker]` and `[&.loading>span]` always have a backslash after the `&` |
| R8 | **Resolved** | C2.13(b) plus the Step 7 commands. The lookbehind excludes `md:block`-style tokens, which `check:hidden` already covers. Today's spinner string `loading__spinner hidden absolute inset-0 size-full` yields no match (`inset` isn't `inline`), and a bare `block`/`flex` goes red. §9.2 and R5 were corrected |
| R9 | **Resolved by owner decision Q1** | §14 item 1, §5.6 and Step 4 state parity at 22.4 px. E2.1-E2.25 contain no trust-badge row. C2.10 and C2.26 expect it unchanged |

| Nit | Status |
|---|---|
| N1 | Resolved. The `display` half can go red (the block rule sets `display: flex`). The probe has no inline style |
| N2 | Resolved (M_css step 1) |
| N3 | Resolved (C2.6) |
| N4 | Resolved (C2.8's second pattern; `!=` and `!important` excluded) |
| N5 | Resolved (E2.17) |
| N6 | Resolved (§3.4 item 6, §5 conventions) |
| N7 | Resolved, but the iff is one clause short (NIT R2-N1) |
| N8 | Resolved (§5.7 row) |
| N9 | Resolved (§9 intro) |
| N10 | Resolved (C2.4, labelled a record) |
| N11 | Resolved (C2.25. Base map indexes 1-4 → variants 1, 2, 3, 4, so four distinct values) |
| N12 | Resolved (inside R6) |
| N13 | Resolved (§12 "Card and related") |
| N14 | Resolved. Details below |
| N15 | **Declined. Acceptable.** Details below |

#### R1 walk (every commit on its own)

- **Steps 1-2.** Step 1 makes no Liquid change that theme check reads. In Step 2, `sustainability-rating` already has a doc header. The new `active_bar_classes` is read inside the loop, and all four documented params are still read.
- **Step 3.** `padding_*_mobile` stays read (the style attribute), as do `icon_style` (60, 87) and `show_rating` (152). The new `header_classes` and `icon_wrap_classes` are read. Deleting 58 removes the only orphan.
- **Step 4.**
  - `specs-table` gets `@param {object} block`. Its caller passes `block`, and `block` is read.
  - `trust-badge`'s existing doc is unchanged, and `badge_style_classes` is read.
  - `material-info` (doc'd `{metaobject} material`) passes `rating`, `label`, `score_text` and `aria_label`, all declared by `sustainability-rating`.
  - The `sections.material_info` key lands in the same step.
  - One prediction is open: `UndefinedObject` for `product` in `specs-table`. Its fallback (`@param {product} [product]`) is well formed. It's optional, so `MissingRenderSnippetArguments` doesn't fire, and it is read, so `UnusedDocParam` doesn't either. At runtime the global `product` still resolves inside `render`. **The Coder is not blocked.**
- **Step 5.** No snippet or param change.
- **Step 6.** `escaped_handle` is read, and the `material_tooltip` keys land in the same step.
- **Step 7.** `product.liquid`'s only assigns are 41-46, all still read. The `sections.product` keys land in the same step.
- **Step 8.** `price`'s doc has five optional params.
  - The four existing callers pass only documented names.
  - `available` is deleted with its read, and `show_badges` with its two settings assigns (1-4) and its markup (119-127).
  - Every remaining param is read: `use_variant` at 20; `placeholder` at 22 and 47; `price_class` in the new markup; `show_compare_at_price` in the kept volume-pricing branch (today's line 67).
  - `unit-price` keeps its `unless`.
  - One prediction is open: `ValidRenderSnippetArgumentTypes` on `placeholder: placeholder` (644). It is a variable lookup, not a literal, so I expect it isn't type-checked. Even if it is, it lasts one commit, because Step 9 deletes line 644. The stated fallback (adjust the doc type and record a deviation) is enough. **The Coder is not blocked.**
- **Step 9.** The card's doc declares seven params, and the render call passes six of them plus `card_index`. `skip_styles` and the two `skip_card_product_styles` assigns go in the same commit, so neither `UnrecognizedRenderSnippetArguments` nor `UnusedAssign` fires. The new card reads no `section_id`, `lazy_load`, `block` or `settings`. `page_width` goes, so the count is 1.
- **Step 10.** `rp_pt_mobile`, `rp_pb_mobile`, `heading_classes`, `mobile_columns` and `desktop_columns` are all read.
- **Steps 11-13.** No Liquid reads change.

The §13 table (2 offenses for Steps 0-8, 1 for Steps 9-13) is right. The D2.11 table of what a `{% doc %}` header turns on matches the shopify.dev check descriptions used in round 1. I found no sixth instance.

#### R2: is the ancestor check equivalent or better?

**For clipping, it is better.** `clip-path` clips only the subtree of the element that carries it. So "no ancestor of the badge, up to the card, has `clip-path` ≠ `none`" is the exact condition. It isn't fooled by the transparent `::after`, which is why `elementFromPoint` was the wrong tool. The containment half (the badge's box sits inside `[data-card-media]`, ±0.5 px) also rules out clipping by `overflow` on an ancestor, because the only ancestors inside the card are the media wrapper and the card itself. Running it for all 8 shapes, with a forced badge when no fixture has one, removes my round-1 "fixtures use `default`" gap.

**What neither check covers is paint order.** If the badge were placed *before* the image box, the positioned images would paint over it. The structure diagram forbids that, and C2.25's per-shape screenshot would show it to a human, so I grade this a NIT (R2-N2).

#### R4 / C2.27: can it go red, and does it stay off the repo file?

- **It goes red both ways.** A hardcoded `text-[#333333]` on the spotlight title stays `rgb(51, 51, 51)` in the palette run (must-change list, red). A `text-foreground` on the material-info card turns `rgb(238, 17, 136)` (must-not-change list, red).
- **It is green on §5's markup.** Every must-change element is either a token utility or inherits `body`'s `var(--color-foreground)`. Every must-not-change element is an arbitrary hex or `bg-white`.
- **The precheck stops a stale upload from passing silently.**
- **The repo file stays untouched.** §10 edits only the `git archive` scratch copy and names the private development theme. It forbids pointing at live, runs this variant last, and requires restarting from the repo and re-reading `#333333` before any further measurement.
- **One harmless weak entry.** "Add to cart" on the must-not-change list is unchanged only because this variant doesn't touch the accent. It isn't wrong.

#### R5: the four umbrella statements

All four give the same schedule:
- **§0 row (62):** from T2, phases budget the whole-document measure, and `B_rb` is recorded.
- **D12 third bullet (374):** from T2 on, each addendum budgets `B_doc` and proves removals with `N_dawn`; T5 still compares `B_rb`.
- **Budget sub-bullet (378):** 1.15 × `B_rb0` "at the end of T0 and T1"; T2-T4 use the whole-document budget; `< B_rb0` at T5.
- **§17.4 (1654):** T2-T4 use the addendum's budget, which replaces the head-only rule; T5 uses `B_rb` < `B_rb0`.

They are consistent. Cosmetic: R-T2.4 says "the three umbrella statements now agree", while §15 correctly lists four places. See R2-N3.

#### N14 and C2.23

The `section.index == 1` guard is the safe form Shopify recommends. Nil (editor, Section Rendering API) falls through to `eager` without a priority hint, never to `lazy`.

C2.23's landing-page case goes red if the guard is missing: the `main` section there is index 2, so a missing guard puts `fetchpriority` and a preload `Link` header on it. It is green on a correct build.

One consequence is inherent, not a defect: in the theme editor (nil), `product.json`'s first image also gets no `fetchpriority`. C2.23 runs on the storefront, so it isn't affected.

#### Card ids `CardLink-{{ card_product.id }}` / `Badge-…`

They can't duplicate on any page:
- `card-product` renders only inside `related-products`.
- That section has no `presets`, so it exists only where a template JSON places it (`product.json`, once).
- One recommendations response doesn't repeat a product.
- The initial server render has no cards (`recommendations.performed` is false outside the Section Rendering API fetch), and `global.js` swaps `innerHTML` once, so no second copy coexists.

Today's ids (`CardLink--<id>`) have the same uniqueness basis, so this is parity. D2.11's phrase "because only one section renders cards" is accurate given the missing presets.

#### N15 declined: acceptable

Escaping `material.story.value` (material-info:150) and the tooltip's `story.value` changes how stored metaobject HTML renders. That is a content-behavior change no fixture exercises, and it would land in a styling phase. Only staff with admin access can write that data, and they could edit the theme anyway, so it isn't a privilege boundary. The real reflected-input hole (`search.terms`, R11) **is** fixed in T2. Declining is the right scope call, provided R12 doesn't get lost (R2-N4).

### New findings in Revision 2

#### R2-1 — REQUIRED (Δ text that reaches QA and the owner). The kept volume-pricing note drops Dawn's 750 px caption step

Today the note's text is `<span class="caption">`. Dawn's `.caption` is `1rem`, **and `1.2rem` from 750** (`base.css:373-383`, legacy layer, and the note's own rule at `component-card.css:146-150` sets no font size). So it renders 16 px below 750 and **19.2 px** from 750. The plan gets this wrong in two places:
- E2.25 says "current 16 px".
- §5.12 gives the note a single `text-[0.625rem]`, which is 10 px at every width.

Under Q1, the Dawn-intended sizes are 10 px and **12 px from 768**. The plan's own rating-count mapping for the same `.caption` class already does this (`text-[0.625rem] md:text-[0.75rem]`). As written, the B2B note would ship at 10 px on tablet and desktop, smaller than Q1 intends, and the Δ row the owner signs off would misstate the current size.

- **Prevents a build?** No. It is a two-token edit, and the path isn't exercisable on the fixtures, which is why the static check can't see it.
- **Change:**
  - In §5.12's volume-note row, use `text-[0.625rem] md:text-[0.75rem]`.
  - In E2.25, put "16 px (19.2 px from 750)" under Current and "10 px (12 px from 768)" under After, letter-spacing unchanged.
  - Optionally extend C2.19's static half to require the `md:` token.

#### R2-N1 — NIT. C2.19's price iff can go red on a correct build for one data shape

§5.11 suppresses the `<s>` when `product.price_varies == false and product.compare_at_price_varies`. That is Dawn's `price--no-compare`, kept for parity. C2.19 requires `[data-compare-at]` **iff** `compare_at_price > price`. For a product whose variants share one price but carry different compare-at prices, a correct card is on sale but has no `<s>`, so the criterion goes red.

No fixture is known to have this shape, and Step 0 records the fixture facts, so this changes no decision. Fix: "iff `compare_at_price > price` and not (`price_varies` false and `compare_at_price_varies` true)". `/products/<handle>.js` exposes both fields.

#### R2-N2 — NIT. The badge half doesn't check paint order

The ancestor check and the containment check prove the badge isn't clipped. They don't prove it paints above the images.

`document.elementsFromPoint(x, y)` (plural) at the badge's centre does both:
- It lists every element under the point in paint order, so the stretched link's `::after` doesn't hide the rest.
- Hit-testing respects `clip-path`.

Asserting that the badge appears in that list before every `img` of its card would cover order and clipping in one check. The per-shape screenshot already covers order for a human, so this is optional.

#### R2-N3 — NIT. Umbrella edit housekeeping

Two small fixes:
- R-T2.4's "the three umbrella statements" should read "four places: §0, D12's third bullet, D12's budget sub-bullet, §17.4". §15 already says this.
- The umbrella file is modified but not committed (`git status`). §12's "Umbrella amendment" rollback row assumes it lands in the same commit as this plan. Commit them together.

#### R2-N4 — NIT. Give R12 a home outside this plan

N15 was declined on good grounds, but "flagged for a separate fix" lives only in §11 of a phase plan that will be closed. Add a line to the impl notes' follow-ups, or open a `docs/bugs/` entry, so the unescaped `story.value` renders in `material-info` and the tooltip aren't forgotten.

### Checked and found sound (Revision 2 additions)

- **New criteria and Δ rows.** E2.25's arithmetic is right apart from R2-1: 1.12 × 0.625 = 0.7 px letter-spacing, which is `tracking-[0.04375rem]`. C2.27's hex-to-rgb conversions are correct. C2.19's static volume-note check finds the single line inside the `quantity_price_breaks_configured?` guard.
- **No stale values.** I spot-greped `229-307`, `228-570`, `before Step 8`, `unless you say`, `exactly 1` and `2 offenses`. Every hit is correct current text or a deliberate historical reference.
- **Numbering.** C2.27 and E2.25 are appended, and no ID shifted. Step 13 runs C2.0-C2.27.
- **No criterion that can't go red,** beyond the ones the plan already labels guard or record (C2.4's `/` half, C2.8, C2.20's escape half, C2.22).
- **Owner decisions (final).** Q1 is carried consistently through D2.9, §5.6, §8's preamble, §14 and Step 4. Q2 removes nothing; §2 and §14 match `product.liquid:34-37`.

### Trajectory

| Round | Blockers | Required | Nits |
|---|---|---|---|
| 1 | 0 | 9 | 15 |
| 2 | 0 | 1 | 4 |

Findings are shrinking in count and severity, and the remaining risk is low. The one required item is a two-token class edit and a corrected Δ row on a B2B-only path. **No round 3 review is needed.** The Architect can fold R2-1 into the plan directly. Or the Coder can apply it in Step 9 and record it in the impl notes as a pre-approved deviation citing this review. The nits are optional.

### Required changes (round 2)

1. **R2-1.** In §5.12's volume-pricing-note row, use `text-[0.625rem] md:text-[0.75rem]`. Correct E2.25 to "current 16 px (19.2 px from 750) → 10 px (12 px from 768)".

APPROVE WITH CHANGES

## Round 3

Reviewer: Plan-Reviewer
Date: 2026-10-23
Plan under review: `docs/plans/theme-evolution-tailwind-t2.md`, **Revision 3**
Scope: narrow. I checked only the Revision 3 edits against my round-2 items (R2-1, R2-N1 to R2-N4), plus whether those edits introduced new inconsistencies. Sections that didn't change were not re-reviewed. The Architect's Revision 3 checks are dated 2026-10-22 (local time) and this review 2026-10-23 (UTC). That is a timezone difference, not an error.

Rules re-read this pass:
- `CLAUDE.md`: the session copy. Nothing in the Revision 3 edits touches a hard rule. The edits are plan text only, and the volume note's classes are utilities with no inline style beyond what the card already uses.
- `learn_shopify_api` (liquid) was called once.
- I had no shell, so nothing was built, rendered or run through theme check.

### Manifest: what I sampled, and what I took on trust

**Sampled and confirmed:**
- **R2-1's source.** `assets/base.css:373-383`: `.caption` has `font-size: 1rem` and `letter-spacing: 0.07rem`, and `font-size: 1.2rem` inside `@media screen and (min-width: 750px)`. Letter-spacing doesn't change at 750. The arithmetic checks out: 16 → 10 px, 19.2 → 12 px, and 1.12 → 0.7 px = `tracking-[0.04375rem]`.
- **The vendor-row survivor** (`0.625rem] tracking`). `base.css:385-390` `.caption-with-letter-spacing` is 1rem and has no 750 step. The single-size mapping there is correct, as the manifest says.
- **R12's citations.** `snippets/material-info.liquid:150` (`material.story.value | newline_to_br`, unescaped) and `sections/material-tooltip.liquid:30` (`material_metaobject.story.value`, raw).
- **§5.11's `show_compare` condition** (plan line 689) matches C2.19's new exclusion word for word.
- **No stale values.** I grepped for `current 16 px` and `0.625rem] tracking-[0.04375` (the old single-size class string) and found no hits.
- **E2.6** exists and defines the 750-767 band. E2.25 cites it.

**Taken on trust:** the Architect's statement that no ID was added, removed or renumbered. My own spot reads of C2.19, E2.25, R12, the §13 preamble and Step 13 found the IDs they cite where they should be.

### Round-2 items against Revision 3

| Item | Status | Evidence |
|---|---|---|
| R2-1 (REQUIRED) | **Resolved** | §5.12's row (plan line 782) now reads `text-[0.625rem] md:text-[0.75rem] tracking-[0.04375rem]`, with the citation widened to `base.css:373-383`. E2.25 (line 984) now reads "16 px (19.2 px from 750)" → "10 px (12 px from 768)", letter-spacing 1.12 → 0.7 unchanged across the breakpoint, and the 750-767 band is tied to E2.6. C2.19's static half (line 1018) requires both `text-[0.625rem]` and `md:text-[0.75rem]` on the `data-volume-pricing-note` line. §9.2 (line 1052) lists "volume note without its `md:` size" as a red case. **Two-sided:** Revision 2's string fails the new check, and §5.12's string passes it |
| R2-N1 (NIT) | **Resolved** | C2.19's price half now reads "iff `compare_at_price > price` and not (`price_varies` false and `compare_at_price_varies` true)", which matches §5.11:689. §9.2 says it is green on the `price--no-compare` shape. The "exactly one non-`sr-only` span" assertion still holds on that shape, because the sale `span` is present and only the `<s>` is absent |
| R2-N2 (NIT) | **Resolved** | C2.19 adds the `elementsFromPoint` assertion: the badge is present, at a lower index than every `img` of its card. See "Paint-order check" below |
| R2-N3 (NIT) | **Resolved** | R-T2.4 (line 910) and §14 (line 1237) both say "four places" and name all four. §12's umbrella row (line 1145) states the umbrella edit must land in the same commit as this plan. `git status` still shows the umbrella modified and this plan untracked, so the instruction is live and correctly addressed to the orchestrator |
| R2-N4 (NIT) | **Resolved** (one optional addition, R3-N1) | §11 R12 (line 1127), the §13 preamble (line 1151) and Step 13 (line 1216) require a `## Follow-ups` heading in the impl notes listing R12, naming both lines and the `escape`-before-`newline_to_br` fix. Step 13 makes QA-visible confirmation part of the verify step. The ordering is correct: escaping after `newline_to_br` would escape the `<br>`s |

#### Paint-order check: can it go red, and is it green?

- **Green on §5.12's structure.** The image box (`absolute`, plus a `clip-path` from the shape classes, which also makes it a stacking context) and the badge (`absolute`) both have `z-index: auto`. They therefore paint in tree order within the card's stacking context, and the badge comes later, so it paints on top. `elementsFromPoint` lists all hit elements top-down, occluded ones included. The badge therefore precedes the `img`s. The `a::after` (`z-1`) shows up as its `a`, ahead of both, and the assertion ignores it.
- **Red on the rejected build.** If the badge comes before the image box, the `img`s paint above it, and they appear earlier in the list. This goes red at any shape where the image covers the badge's centre, including the default rectangle that the fixtures use.
- **Vacuous where it should be.** If a shape clips the image away at the badge's bottom-left centre, no `img` is in the list, and the check passes. The per-shape screenshot (C2.25) still covers those shapes for a human. That is the right outcome, not a gap.
- **No `pointer-events: none` on the badge, images or image box.** The only `pointer-events` in the plan is the tooltip's (lines 616 and 630). So hit-testing can't drop the badge, or the `img`s, from the list on a correct build.

### New findings in Revision 3

#### R3-N1 — NIT (optional; doesn't block). R12's follow-up misses a third unescaped `story.value`

`sections/main-material-archive.liquid:215` prints `{{ material.story.value | truncate: 160 }}` with no `escape`. `truncate` on stored HTML can also cut a tag in half. The follow-up R12 asks for names only `material-info:150` and `material-tooltip:30`. The §13 wording "must list **at least** risk R12" already allows the Coder to add it, so nothing is wrong as written. But the reason for R2-N4 was to stop instances getting lost, and this one would be. **Suggestion:** have the Coder add the archive line to the same `## Follow-ups` entry (proposed fix: `escape` before `truncate`, or `strip_html | truncate`). It is out of T2's scope, so no step or criterion should change.

#### Observation, not a finding

C2.19's price iff still ignores quantity price breaks, which suppress the sale branch (§5.11:685). The plan says so in a parenthetical. Quantity price breaks need B2B catalogs, which the dev store doesn't have, so a recommended product can't take this path. This changes no decision.

### Checked and found sound

- **No broken anchors or IDs.** I followed every cross-reference in the edited rows (§5.12 → E2.25, E2.25 → E2.6 and E2.9, C2.19 → §5.11 and C2.25, R12 → §13, Step 13 → §13 preamble) and each one resolves.
- **No criterion that can't go red.** Each of C2.19's three new or changed halves (the price exclusion, paint order, and the `md:` token) has a reachable red case and is green on §5.12/§5.11's markup.
- **No new rule conflict.** The note's markup is a plain `div` with utility classes inside an existing `if`, so no `{% stylesheet %}` sits inside logic and no new inline style is added.

### Trajectory

| Round | Blockers | Required | Nits |
|---|---|---|---|
| 1 | 0 | 9 | 15 |
| 2 | 0 | 1 | 4 |
| 3 | 0 | 0 | 1 (optional) |

The one required item from round 2 is resolved, and all four nits are resolved. Revision 3 introduces no correctness problem. The plan is ready for the Coder. R3-N1 can go into the impl notes' `## Follow-ups` without another plan revision.

APPROVE
