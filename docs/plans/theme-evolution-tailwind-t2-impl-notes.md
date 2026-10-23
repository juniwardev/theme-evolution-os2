# theme-evolution-tailwind-t2: implementation notes

Base: `main` at `3c16c3c`. No feature branch. Commits are local only; nothing pushed to git or to any Shopify theme except the private development theme #187953938528 (`shopify theme dev`, and a scratch-copy proxy run, see C2.25/C2.27). Plan: `docs/plans/theme-evolution-tailwind-t2.md` Revision 3, review verdict APPROVE (round 3).

| Step | Commit | Subject |
|---|---|---|
| 1 | `f780fae` | refactor(group): scope block rule so Tailwind group class is safe |
| 2 | `6ab76ed` | refactor(sustainability-rating): convert to Tailwind utilities |
| 3 | `d610c21` | refactor(material-spotlight): convert to Tailwind utilities |
| 4 | `bf3c45c` | refactor(material-info,trust-badge,specs-table): convert to Tailwind utilities |
| 5 | `bed094e` | refactor(custom-section): convert to Tailwind utilities |
| 6 | `c654188` | refactor(tooltip): convert eco tooltip to Tailwind, drop eco-tooltip.css, escape handle |
| 7 | `e26927d` | feat(product): convert product section to Tailwind, add btn-primary/btn-secondary utilities |
| 8 | `c2a574e` | refactor(price): convert price and unit-price to Tailwind, server-branch sale state |
| 9 | `7cc746b` | refactor(card-product): rewrite card on the live path with Tailwind |
| 10 | `855b0b2` | refactor(related-products): convert to Tailwind grid, remove Dawn sheets and grid shim |
| 11 | `7acd4cf` | fix(cart-drawer): keep header cart link aria-label in step with the count |
| 12 | `583221b` | docs(rules): add custom-CSS-never-selects-Tailwind-class rule, update theme-check baseline |
| 13 | (this notes commit) | docs: impl notes, harness scripts t2c-*, coder question |

## Files changed

Theme: `blocks/group.liquid` (selector scoped), `snippets/sustainability-rating.liquid`, `sections/material-spotlight.liquid`, `snippets/material-info.liquid`, `snippets/trust-badge.liquid`, `snippets/specs-table.liquid`, `sections/custom-section.liquid`, `sections/material-tooltip.liquid`, `layout/theme.liquid` (eco-tooltip.css link removed), `assets/eco-tooltip.css` (deleted), `sections/product.liquid`, `src/tailwind.css` (btn utilities added, shim and empty `@layer shims` block removed; `shims` stays in the layer statement), `snippets/price.liquid`, `snippets/unit-price.liquid`, `snippets/card-product.liquid`, `sections/related-products.liquid`, `sections/cart-drawer.liquid`, `locales/en.default.json` (5 keys), `assets/tailwind.css` (rebuilt each step), `CLAUDE.md`, `AGENTS.md`.
Not touched: `config/settings_data.json`, `templates/*.json`, `sections/*-group.json`, `.shopify/` (`git diff 3c16c3c -- config templates` is empty).
Docs/harness: this file, `docs/plans/theme-evolution-tailwind-t2-coder-questions.md`, `docs/qa/harness/t2c-*.mjs` (lib, dump, diff, overflow, mcss, sweep, facts, tooltip, behavior, misc, regress, proxy). Existing harness files untouched.

## Run locally

`shopify theme dev` (private dev theme; preview `https://theme-evolution-os2.myshopify.com/?preview_theme_id=187953938528`), `npm run build:css`, `git add assets/tailwind.css`, `npm run check:css`, `npm run check:hidden`, `shopify theme check`. Harness, from the repo root: `node docs/qa/harness/t2c-dump.mjs "<preview>" <label> <outDir> [pages] [widths]` then `t2c-diff.mjs <base> <head> <outDir> [prefixes]`; others take `<preview>`. The password is read by `t0-lib.mjs` and never printed. All dev servers were stopped at the end.

## Step 0 baselines (tree `3c16c3c`, dev theme)

- `N_tc` = 2: `TranslationKeyExists` (error, `cart-drawer.liquid`), `UnusedAssign` (warning, `page_width`, `card-product.liquid`). `S_tw` = 14,929 bytes min / 4,247 gzip.
- Bundle subsetting (section 3.4 item 1): the served `compiled_assets/styles.css` (6,206 bytes) contains `.group{`: the bundle is not subset, so every unlayered rule reaches every page.
- `X_off` gate: offenders were only the variant `select` / the `.product-container` it widens (wax: select 323 px wide inside a 371 px container at 320 to 390; at 768 `select` right edge 787; at 320 the Shopify payment button inherits the widened column, right 367) and the related cards (`img`, `a.full-unstyled-link`, card `div`, right 409). Nothing else, so no stop and no extra `min-w-0`. X_wax reproduced: 16 on load, 34 after cards load/add at 375.
- C2.9 baseline (X_page after load / after scroll / after add):

```
 320 p3p  cards 4 | load: xPage 0 | scroll: xPage 89 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"] 
 320 wax  cards 4 | load: xPage 71 offs ["button.shopify-payment-button__button#367","shopify-buy-it-now-button.#367","shopify-accelerated-checkout.#367"] | scroll: xPage 89 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"] | after add: xPage 89 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"]
 320 snow cards 4 | load: xPage 0 | scroll: xPage 89 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"] | after add: xPage 89 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"]
 375 p3p  cards 4 | load: xPage 0 | scroll: xPage 34 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"] 
 375 wax  cards 4 | load: xPage 16 offs ["div.product-container#391"] | scroll: xPage 34 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"] | after add: xPage 34 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"]
 375 snow cards 4 | load: xPage 0 | scroll: xPage 34 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"] | after add: xPage 34 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"]
 390 p3p  cards 4 | load: xPage 0 | scroll: xPage 19 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"] 
 390 wax  cards 4 | load: xPage 1 offs ["div.product-container#391"] | scroll: xPage 19 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"] | after add: xPage 19 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"]
 390 snow cards 4 | load: xPage 0 | scroll: xPage 19 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"] | after add: xPage 19 offs ["img.motion-reduce#409","a.full-unstyled-link#409","div.\n#409"]
 430 p3p  cards 4 | load: xPage 0 | scroll: xPage 0 
 430 wax  cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
 430 snow cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
 768 p3p  cards 4 | load: xPage 0 | scroll: xPage 0 
 768 wax  cards 4 | load: xPage 19 offs ["select.#787"] | scroll: xPage 19 offs ["select.#787"] | after add: xPage 19 offs ["select.#787"]
 768 snow cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
1024 p3p  cards 4 | load: xPage 0 | scroll: xPage 0 
1024 wax  cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
1024 snow cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
1440 p3p  cards 4 | load: xPage 0 | scroll: xPage 0 
1440 wax  cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
1440 snow cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
```

- M_css baseline (1440, empty cache, cards rendered = 4 on every product page): p3p, snow, wax: `B_head0` 18,492, `B_body0` 6,634, `B_doc0` **25,126**, `N_dawn0` **9**. `/`: `B_head0` 18,492, `B_body0` 1,412 (section-image-banner.css), `B_doc0` 19,904, `N_dawn0` 1 (eco-tooltip.css). Valid on all (no zero-size entries, no cross-origin).
- C2.6 sweep (p3p 1440): 99 unlayered rules matched T2 markup, all from `compiled_assets/styles.css` (product, spotlight, custom-section) and inline `<style>` blocks (sustainability, material-info, trust badge). Zero after Step 10.
- C2.7 baseline: probe passes from Step 1 (bare `group` is `overflow: visible, display: block`; `group group--vertical` is `hidden`/`flex`).
- Fixture facts (the `docs/dev-fixtures.md` profile is stale in two places): related products on all three pages are the same four, in order: `the-collection-snowboard-alternate-template` (749.95), `-liquid` (749.95), `the-multi-managed-snowboard` (629.95), `the-multi-location-snowboard` (729.95). All are available, single variant, one media, no compare-at price, no unit price, no reviews metafield, no quantity price breaks, with media. So **no card is on sale, sold out, media-less, two-media, rated or unit-priced**. **`the-complete-snowboard` also has a material spotlight and material-info** (rating 4, `heading_tag` h2), and one `.eco-tooltip-trigger` (the description mentions a material). 3p: spotlight + material-info, no trigger. Wax: no spotlight, no trigger. No `custom.technical_specs` anywhere. Landing-page template: no related section (0 cards).
- E2.17: material-info bars **rendered visible** before T2 (display block, 260 x 8, 4 active). `aria-valuenow` 4 (spotlight meter). The old material-info bars had no `role="meter"`.
- Schema sha (C2.2), first 12 hex: product `5afd8626a04a`, spotlight `82c538d97cf5`, related `eaee76ceb197`, custom-section `c5e2e2220f14`, tooltip `475719450d29`, group `7daea9c6440e`. All six identical at HEAD.

## Per-step results and gates

Every step: `npm run build:css` (minified), staged `assets/tailwind.css`, `npm run check:css` exit 0, `npm run check:hidden` exit 0. Schema round-trip checked for each converted section (sha above).

| Step | theme check | `S_tw` bytes / gzip | Evidence |
|---|---|---|---|
| 0 | 2 (expected) | 14,929 / 4,247 | baseline |
| 1 | 2 | 14,929 / 4,247 | C2.7 probe green |
| 2 | 2 | 16,179 / 4,572 | bars: 5, display block, 8 px, 4 active, `::after` rgb(45,90,39), animation `sustainabilityFillReveal`; geometry unchanged |
| 3 | 2 | 19,933 / 5,173 | spotlight geometry within 1 px (all rows), wax wrapper has 0 children |
| 4 | 2 | 22,141 / 5,533 | trust badge geometry/22.4 px unchanged on `/`, p3p, wax, snow; `UndefinedObject` for `product` in specs-table did **not** fire |
| 5 | 2 | 22,777 / 5,653 | zero geometry diff vs Step 4 on p3p, wax, `/` |
| 6 | 2 | 24,012 / 5,877 | C2.20 green (below) |
| 7 | 2 | 29,317 / 6,860 (after accordion fix) | `.btn-primary:hover{` 1, `.btn-secondary:hover{` 1, `&:` 0; spinner class string one line, no display token |
| 8 | 2 | 29,633 / 6,867 | `placeholder` boolean arg accepted by theme check |
| 9 | **4** (see deviation 1) | 34,758 / 7,814 | card structure verified, badge sibling of image box |
| 10 | 4 | 35,990 / 7,963 | `X_page` 0 everywhere, C2.18 |
| 11 | 4 | 35,990 / 7,963 | aria-label follows the count |
| 12 | 4 | 35,990 / 7,963 | CSS output unchanged |

## Key measurements

- `N_dawn`: **9 -> 0** on p3p, snow, wax (and the home page 1 -> 0).
- `B_doc` (compressed transfer bytes): p3p, snow, wax **25,126 -> 20,939** (guard `<= B_doc0` met, -4,187). `B_head` 18,492 -> 20,939 (tailwind.css 3,958 -> 7,433; styles.css 1,563 -> 1,095; eco-tooltip.css 560 -> gone). `B_body` 6,634 -> 0. `/`: `B_doc` 19,904 -> **22,351**, `B_head` 18,492 -> 20,939 (no threshold per N10; the rise is the larger `tailwind.css` loaded on every page, +2,447 bytes net with eco-tooltip.css gone: **reported to the owner as a cost of T2 on the home page**).
- `S_tw` 14,929 -> 35,990 bytes min (budget 60,000), 4,247 -> 7,963 gzip (budget 12,000).
- `X_page` on `selling-plans-ski-wax` at 375: before 16 on load, 34 after scroll/add; **after 0, 0, 0** (load, scroll, after one add to cart). All 21 width/page combinations 0, all states (table above `head`).
- Product `<h1>`: 16 px regular body font -> **30 px at 375, 36 px at 1440**, Oswald 700 uppercase, line height 1.25.
- Add to cart: 88 x 19 bare text -> 48 px tall full-width accent button (494 wide at 1440, 287 at 375), Oswald, uppercase, computed bg rgb(227,252,1) = `--color-accent`.
- Preload headers: p3p/wax/snow 7, landing page 6 (main image preload absent there, N14).

C2.9 after (X_page load / scroll / add), every width: all `xPage 0`, no `X_off`:

```
 320 p3p  cards 4 | load: xPage 0 | scroll: xPage 0 
 320 wax  cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
 320 snow cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
 375 p3p  cards 4 | load: xPage 0 | scroll: xPage 0 
 375 wax  cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
 375 snow cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
 390 p3p  cards 4 | load: xPage 0 | scroll: xPage 0 
 390 wax  cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
 390 snow cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
 430 p3p  cards 4 | load: xPage 0 | scroll: xPage 0 
 430 wax  cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
 430 snow cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
 768 p3p  cards 4 | load: xPage 0 | scroll: xPage 0 
 768 wax  cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
 768 snow cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
1024 p3p  cards 4 | load: xPage 0 | scroll: xPage 0 
1024 wax  cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
1024 snow cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
1440 p3p  cards 4 | load: xPage 0 | scroll: xPage 0 
1440 wax  cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
1440 snow cards 4 | load: xPage 0 | scroll: xPage 0 | after add: xPage 0
```

## C2.0 to C2.27 results

| ID | Result | Evidence |
|---|---|---|
| C2.0 | PASS | `npm ci && npm run check:css` exit 0 on the clean tree |
| C2.1 | **FAIL as written, see deviation 1** | `check:hidden` 0. Theme check at HEAD: 4 offenses = the cart-drawer `TranslationKeyExists` plus 3 `OrphanedSnippet` warnings (`loading-spinner`, `progress-bar`, `quantity-input`). Per-step record above: steps 1-8 exactly 2 as predicted, steps 9-12 predicted 1, actual 4 |
| C2.2 | PASS | all six shas identical to Step 0 |
| C2.3 | PASS | (a) no `stylesheet_tag` in the 12 files, no `'eco-tooltip.css'` in layout/templates, file deleted; (b) `N_dawn` 0 on p3p, snow, wax. The blob proxy (C2.25) uses an inline `<style>`, no link |
| C2.4 | PASS (guard) / record | `B_doc` 20,939 <= 25,126 on both products; `/` recorded 19,904 -> 22,351 (no threshold) |
| C2.5 | PASS | 35,990 <= 60,000; gzip 7,963 <= 12,000 |
| C2.6 | PASS | unlayered matches 0 on p3p, wax, snow at 1440, 375, 1023, 1024, 767, 768 (tooltip, shown, was not part of the sweep; its rules are in `@layer components`) |
| C2.6b | PASS | Dawn-class intersection = {grid, hidden, loading__spinner, overflow-hidden, uppercase} plus `section`, which is Shopify's wrapper class on the section root (not T2 markup); `grid` elements all have `margin-bottom` 0 |
| C2.7 | PASS | bare: visible/block; with `group--vertical`: hidden/flex |
| C2.8 | PASS | both `rg` patterns print nothing over the 12 files (the plan lists "13"; there are 12 names) |
| C2.9 | PASS | all zero; baseline table above |
| C2.10 | PASS with the Delta rows | tables below. Base is the dev theme at `3c16c3c` (identical to T1), not staging #187953643616 |
| C2.11 | PASS | p3p: no `select`, no "Default Title"; wax 3 options, snow 5, selected option = first available variant id |
| C2.12 | PASS | wax and snow at 1440 and 375: add 200, drawer opens, badge 1, aria-label "1 item", qty 3 -> badge 3 and "3 items", remove -> badge hidden and "0 items"; button `aria-disabled` null and spinner `hidden` after each step. (Before Step 11 the aria-label stayed "0 items": the check was red then.) |
| C2.13 | PASS | (a) p3p 422, drawer closed, badge unchanged, button recovers, 0 page errors; (b) one spinner class string, no display token |
| C2.14 | PASS | bg = `--color-accent`, color = accent-foreground, font Oswald, height 48, uppercase; Share border 1px, bg transparent; grep 1/1/0 |
| C2.15 | PASS | `H1` 1 on every page; Oswald; 30 px at 375, 36 px at 1440 |
| C2.16 | PASS (preload half partial) | 3p/snow: heading H2, `img` width/height present; wax wrapper 0 children. Hero proxy: `fetchpriority` high and `loading` eager with preload on; null/lazy with it off. The preload **Link header count stays 7** with or without the hero preload (see not verified) |
| C2.17 | PASS | 5 bars per meter, display block, 8 px, `data-active` = 4, `::after` rgb(45,90,39), animation `sustainabilityFillReveal`; grid children contained in every container at all 6 widths |
| C2.18 | PASS | 1440: 4 x 298 px (equal); 375: 2 per row (135.5); 1023: 2 per row; 1024: 4 per row (194); no `product-grid`/`grid__item`; css has 0 `product-grid`; no `@layer shims {` in the source |
| C2.19 | PASS (partial) | 4 cards = 4 recommendations; no `<style>` in `product-recommendations`; `elementFromPoint` at each image centre is the card link, and a click navigated to the right product; price: no compare-at on any card (none on sale), each price has exactly 1 non-sr-only span; badge not clipped for all 8 shapes, inside the media box, `elementsFromPoint` index of badge 1 vs `img` 2 (proxy, forced sale); static volume note: one line, inside the `quantity_price_breaks_configured?` `if`, class has `text-[0.625rem]` and `md:text-[0.75rem]`. Second-media hover: not exercisable (every product has one media) |
| C2.20 | PASS | 0 `eco-tooltip.css` requests; snow trigger hovered: opacity 1, visible, absolute, z 9999, white, title "Brushed oak"; mouse out opacity 0; injected trigger on p3p behaves the same; inner font Work Sans 14/21 px, color rgb(18,18,18); `material_handle | escape` present |
| C2.21 | PASS | summary click: `open`, icon `rotate` 45deg, one `view=api` request, container children replaced; thumbnail `max-width` 100px (after fixing deviation 2) |
| C2.22 | PASS as a guard, one note | exactly one JSON-LD in `<head>`; `@type` is `ProductGroup` on `the-complete-snowboard` (a multi-variant product), not `Product`. `snippets/meta-tags.liquid` is untouched, so this is pre-existing. The plan text says `Product` |
| C2.23 | PASS | first main `img`: eager, `fetchpriority` high, and the preload header holds it; landing page: eager, no `fetchpriority`, preload headers 6 not 7; later images lazy; every Liquid-rendered `img` has width/height. Accordion thumbnail excluded (R13) |
| C2.24 | PASS | `.product` container `column` at 767, `row` at 768; related 2 columns at 1023, 4 at 1024 |
| C2.25 | PASS via proxy; editor half BLOCKED | see "Proxy results" |
| C2.26 | PASS | `/`, `/collections/all`, `/search?q=snowboard`, `/cart`, `/pages/the-material-archive`, 404, `/password` at 1440 and 375: document height, `X_page`, `h1` count identical between staging #187953643616 and the dev theme (e.g. `/` 375 `X_page` 21; collections 145; search 103, unchanged); full-page screenshots of `/` compared by eye: identical apart from the preview bar's theme name |
| C2.27 | PASS | see below |

### Proxy results (scratch copy via `git archive` in the scratchpad, `shopify theme dev --path`, private dev theme only)

- `heading_size` h2/h1/h0/hxl/hxxl: 24/40/52/62/72 px at 1440 and 20/30/40/50/56 at 375 (five distinct, as the plan's map).
- `columns_desktop` 1 to 6: 1, 2, 3, 4, 5, 6 grid tracks at 1440 (6 cards returned with `products_to_show` 10); `columns_mobile` "1": one track at 375; `products_to_show` 2: 2 cards.
- `image_ratio`: portrait 0.8, square 1.0, `adapt` also 1.0 because these media are square (cannot be told from square here).
- `show_vendor` true: 2 vendor elements (the cards returned 2 vendor lines for this proxy state). Padding 0 and 100: related 0/100 px; spotlight 0/100 at 1440 and 0/75 at 375.
- `image_shape` all 8 give distinct outlines (none, arch url, blob polygon, chevronleft, chevronright, diamond, parallelogram, round ellipse); blob cards 1 to 4 compute 4 different `clip-path`s; badge not clipped, inside, painted above for every shape; screenshots `docs/qa/screenshots/t2c-shape-<shape>.png` (untracked). Sale badge forced in the scratch card only.
- Spotlight `heading_tag` h2/h3/h4 applied; `icon_style` hero 16:9 (aspect 1.78) with preload on/off; `show_rating` false removes the spotlight meter only.
- Trust badge `style` minimal/pill/underline with `text_color` #cc0033: minimal no border, pill 1px border + 5% tint + radius 30 + px 16, underline 2px bottom border; all 22.4 px. Two `specs_table` blocks (data forced in the scratch copy) keep their own colors (rgb(0,68,204) and rgb(170,85,0)); the old shared-style defect is gone.
- `show_dynamic_checkout` false: no payment button; `share_label` applied.
- **C2.27 palette** (scratch `config/settings_data.json` `foreground_color` #ee1188, `background_color` #112233, repo file never edited; precheck `--color-foreground` matched in both runs). Changed: spotlight title (rgb(238,17,136)), subtitle, card border, sustainability label, accordion border, summary color, variant `select` background (rgb(17,34,51)), Share color. Unchanged: material-info card color rgb(18,18,18) and background white, its label, active bar `::after` rgb(45,90,39), track rgb(238,238,238), Add to cart bg rgb(227,252,1). Screenshots `t2c-palette-{default,palette}-snow-1440.png` for the owner. Afterwards the repo dev server was restarted and `--color-foreground` read #333333 again. Not separately printed: the tooltip and trigger color keys (they sit in the unchanged set by comparison, but their values were not echoed).

## Delta rows (expected against actual, dev theme before/after)

| ID | Expected | Actual |
|---|---|---|
| E2.1 | h1 30 px below 768, 36 px from 768, Oswald 700, uppercase, lh 1.25 | 30 px at 375 (75 px tall, two lines), 36 px at 1440 (45 px tall) as expected |
| E2.2 | full-width accent button, 48 px min height, Oswald 700 uppercase 16 | wax 1440: 88.2 x 19 -> 494 x 48; 375: 287 x 48 |
| E2.3 | outline button, min-height 48 | 44.7 x 19 -> 97.6 x 48, 1px border, transparent |
| E2.4 | select 44 tall full width; input 80 wide; label + input one row, gap 12 | wax 1440 select 323 x 23 -> 494 x 44; 375 287 x 44; qty input 188 x 21 -> 80 x 44; wrapper flex |
| E2.5 | 16 px gaps; accordion distance 32 | confirmed: description bottom to accordion top 32 -> 32; every block shifts down by its gap |
| E2.6 | switches at 768 and 1024 | confirmed at 767/768 and 1023/1024. The 750-767 and 990-1023 bands were not screenshotted |
| E2.7 | equal columns, 16 px gap, no overflow | 1440: 397/296.5/277.4/269 -> 298 x 4; 375: 1 column of 365 -> 2 x 135.5; `X_page` 34 -> 0 |
| E2.8 | `h2`: 20/24 px, Oswald, mb 30 | 20 px at 375, 24 px at 1440, mb 48 -> 30 |
| E2.9 | Q1 sizes | price 25.6 -> 16 px, letter-spacing 1.6 -> 1 px (measured). Vendor, badge, unit price, info padding (13 px at 375, 17 px at 1440 measured on the info box), list gap: set by the class strings; vendor/badge/unit-price sizes not separately measured (no data, forced badge not measured numerically) |
| E2.10 | sale accent, sold-out foreground | sale badge rgb(227,252,1) measured on the forced proxy; sold-out only static |
| E2.11 | visible card focus ring | class strings per plan; not exercised |
| E2.12 | visible spinning spinner, label hidden | with the response delayed: button `loading`, spinner display block, label `visibility: hidden`, svg centred (dx 0, dy 0), `animate-spin`; recovers; screenshot `t2c-spinner-loading.png` |
| E2.13 | C_mix: title 18->51, subtitle 161->163, story 61->61, card border 240->243, icon wrap border 242->245 (bg 244->245), accordion 230->235, rating border 235->239 | all matched exactly (title 18->51; subtitle 161->163; card 240->243; icon border 242->245; accordion 230->235; rating border 235->239; story 61 unchanged) |
| E2.14 | wrapper empty without a material | wax: `children` 0, innerHTML length 0 |
| E2.15 | tooltip Work Sans | Work Sans, 14/21 px |
| E2.16 | sentence case | "Material specs", "Primary composition", "Sustainability score" via locale keys; tooltip label from key (static) |
| E2.17 | visible, role meter | visible before and after; `role="meter"` now on both; material-info bar widths now follow the snippet (228 at 1440 in the spotlight) |
| E2.18 | 0 | 0 in every state |
| E2.19 | placeholder card | not exercisable |
| E2.20 | eager/high/preload on product.json; eager only on landing | confirmed |
| E2.21 | aria-label follows | confirmed |
| E2.22 | 2 -> 1 | 2 -> **4** (deviation 1) |
| E2.23 | hover from 1024 | classes only; not hover-tested |
| E2.24 | unlisted rows within 1 px | see tables; unlisted: material-info card `color` 51 -> 18 and its header/icon-wrap inherit it (no text there, no visible change); material-info `matRating` gains `role="meter"` |
| E2.25 | volume note | not exercisable; static check passes |

## Before and after: x, y (section-relative), w, h

Base = dev theme at `3c16c3c`; head = HEAD. Element names are the harness's semantic finders (`main.*` product section, `sp.*` spotlight, `rp.*` related, `cs.*` custom section). Full per-element computed-style diffs are reproducible with `t2c-diff.mjs`.

#### snow @ 1440: x, y (section-relative), w, h, base -> head

| Element | base x,y,w,h | head x,y,w,h | moved >1px |
|---|---|---|---|
| main.container | 20, 0, 1400, 682 | 20, 0, 1400, 682 | - |
| main.media | 100, 0, 682, 682 | 100, 0, 682, 682 | - |
| main.info | 782, 0, 558, 436 | 782, 0, 558, 672 | h |
| main.img1 | 100, 0, 682, 682 | 100, 0, 682, 682 | - |
| main.vendor | 846, 0, 494, 19 | 846, 0, 494, 19 | - |
| main.h1 | 846, 19, 494, 19 | 846, 35, 494, 45 | yh |
| main.price | 846, 38, 494, 19 | 846, 96, 494, 19 | y |
| main.select | 846, 57, 164, 23 | 846, 131, 494, 44 | ywh |
| main.pickerWrap | 846, 57, 494, 23 | 846, 131, 494, 44 | yh |
| main.qty | 917.7, 80, 188, 21 | 924.6, 191, 80, 44 | xywh |
| main.qtyWrap | 846, 80, 494, 21 | 846, 191, 494, 44 | yh |
| main.qtyLabel | 846, 81, 66.2, 19 | 846, 203.5, 66.6, 19 | y |
| main.add | 846, 101, 88.2, 19 | 846, 251, 494, 48 | ywh |
| main.addSpan | 846, 101, 88.2, 19 | 1045.3, 265, 95.3, 20 | xyw |
| main.buy | 846, 101, 494, 98 | 846, 251, 494, 139 | yh |
| main.details | 846, 307, 494, 78 | 846, 514, 494, 78 | y |
| main.summary | 846, 332, 494, 28 | 846, 539, 494, 28 | y |
| main.summaryIcon | 1325.5, 332, 14.5, 28 | 1325.5, 539, 14.5, 28 | y |
| main.accContent | 846, 360, 494, 43 | 846, 567, 494, 43 | y |
| main.accLoading | 846, 384, 202.2, 19 | 846, 591, 194.2, 19 | yw |
| main.desc | 846, 199, 494, 76 | 846, 406, 494, 76 | y |
| main.share | 846, 417, 44.7, 19 | 846, 624, 97.6, 48 | ywh |
| sp.root | 0, 0, 1440, 399.5 | 0, 0, 1440, 399.5 | - |
| sp.wrap | 20, 0, 1400, 399.5 | 20, 0, 1400, 399.5 | - |
| sp.inner | 20, 36, 1400, 327.5 | 20, 36, 1400, 327.5 | - |
| sp.card | 100, 36, 1240, 327.5 | 100, 36, 1240, 327.5 | - |
| sp.header | 141, 77, 1158, 60 | 141, 77, 1158, 60 | - |
| sp.iconWrap | 141, 77, 60, 60 | 141, 77, 60, 60 | - |
| sp.icon | 142, 78, 58, 58 | 142, 78, 58, 58 | - |
| sp.title | 225, 101, 241.2, 30 | 225, 101, 241.2, 30 | - |
| sp.headingGroup | 225, 83, 241.2, 48 | 225, 83, 241.2, 48 | - |
| sp.subtitle | 225, 83, 241.2, 14 | 225, 83, 241.2, 14 | - |
| sp.rating | 141, 261.5, 1158, 61 | 141, 261.5, 1158, 61 | - |
| sp.story | 141, 169, 1158, 60.5 | 141, 169, 1158, 60.5 | - |
| sp.ratingHeader | 141, 286.5, 1158, 16 | 141, 286.5, 1158, 16 | - |
| sp.ratingLabel | 141, 287.5, 151.4, 15 | 141, 287.5, 151.4, 15 | - |
| sp.ratingScore | 1258.8, 286.5, 40.3, 16 | 1258.8, 286.5, 40.3, 16 | - |
| sp.ratingBars | 141, 314.5, 1158, 8 | 141, 314.5, 1158, 8 | - |
| sp.bar0 | 141, 314.5, 228.4, 8 | 141, 314.5, 228.4, 8 | - |
| rp.pr | 20, 0, 1400, 642.6 | 20, 0, 1400, 520 | h |
| rp.h2 | 100, 36, 1240, 19 | 100, 36, 1240, 30 | h |
| rp.ul | 100, 103, 1240, 511.6 | 100, 96, 1240, 396 | yh |
| rp.li0 | 100, 103, 397, 511.6 | 100, 96, 298, 396 | ywh |
| rp.li0.media | 100, 103, 397, 397 | 100, 96, 298, 298 | ywh |
| rp.li0.img | 100, 103, 397, 397 | 100, 96, 298, 298 | ywh |
| rp.li0.info | 100, 500, 397, 114.6 | 100, 394, 298, 98 | ywh |
| rp.li0.title | 100, 527.2, 397, 19 | 100, 411, 298, 38 | ywh |
| rp.li0.price | 100, 557.4, 397, 30 | 100, 456, 298, 19 | ywh |
| cs.root | 0, 0, 1440, 447.9 | 0, 0, 1440, 447.9 | - |
| cs.trust | 20, 407.5, 1400, 40.4 | 20, 407.5, 1400, 40.4 | - |
| cs.mat | 20, 40, 1400, 327.5 | 20, 40, 1400, 327.5 | - |
| cs.matHeader | 61, 81, 1318, 60 | 61, 81, 1318, 60 | - |
| cs.matTitle | 145, 105, 231.8, 30 | 145, 105, 231.8, 30 | - |
| cs.matSubtitle | 145, 87, 231.8, 14 | 145, 87, 231.8, 14 | - |
| cs.matIconWrap | 61, 81, 60, 60 | 61, 81, 60, 60 | - |
| cs.matRating | n/a | 61, 265.5, 1318, 61 | new/removed |

#### snow @ 375: x, y (section-relative), w, h, base -> head

| Element | base x,y,w,h | head x,y,w,h | moved >1px |
|---|---|---|---|
| main.container | 20, 0, 335, 812 | 20, 0, 335, 1078 | h |
| main.media | 44, 0, 287, 287 | 44, 0, 287, 287 | - |
| main.info | 44, 319, 287, 493 | 44, 319, 287, 759 | h |
| main.img1 | 44, 0, 287, 287 | 44, 0, 287, 287 | - |
| main.vendor | 44, 319, 287, 19 | 44, 319, 287, 19 | - |
| main.h1 | 44, 338, 287, 19 | 44, 354, 287, 75 | yh |
| main.price | 44, 357, 287, 19 | 44, 445, 287, 19 | y |
| main.select | 44, 376, 164, 23 | 44, 480, 287, 44 | ywh |
| main.pickerWrap | 44, 376, 287, 23 | 44, 480, 287, 44 | yh |
| main.qty | 115.7, 399, 188, 21 | 122.6, 540, 80, 44 | xywh |
| main.qtyWrap | 44, 399, 287, 21 | 44, 540, 287, 44 | yh |
| main.qtyLabel | 44, 400, 66.2, 19 | 44, 552.5, 66.6, 19 | y |
| main.add | 44, 420, 88.2, 19 | 44, 600, 287, 48 | ywh |
| main.addSpan | 44, 420, 88.2, 19 | 139.8, 614, 95.3, 20 | xyw |
| main.buy | 44, 420, 287, 98 | 44, 600, 287, 139 | yh |
| main.details | 44, 683, 287, 78 | 44, 920, 287, 78 | y |
| main.summary | 44, 708, 287, 28 | 44, 945, 287, 28 | y |
| main.summaryIcon | 316.5, 708, 14.5, 28 | 316.5, 945, 14.5, 28 | y |
| main.accContent | 44, 736, 287, 43 | 44, 973, 287, 43 | y |
| main.accLoading | 44, 760, 202.2, 19 | 44, 997, 194.2, 19 | yw |
| main.desc | 44, 518, 287, 133 | 44, 755, 287, 133 | y |
| main.share | 44, 793, 44.7, 19 | 44, 1030, 97.6, 48 | ywh |
| sp.root | 0, 0, 375, 641.1 | 0, 0, 375, 641.1 | - |
| sp.wrap | 20, 0, 335, 641.1 | 20, 0, 335, 641.1 | - |
| sp.inner | 20, 27, 335, 587.1 | 20, 27, 335, 587.1 | - |
| sp.card | 44, 27, 287, 587.1 | 44, 27, 287, 587.1 | - |
| sp.header | 85, 68, 205, 108 | 85, 68, 205, 108 | - |
| sp.iconWrap | 85, 92, 60, 60 | 85, 92, 60, 60 | - |
| sp.icon | 86, 93, 58, 58 | 86, 93, 58, 58 | - |
| sp.title | 169, 86, 121, 90 | 169, 86, 121, 90 | - |
| sp.headingGroup | 169, 68, 121, 108 | 169, 68, 121, 108 | - |
| sp.subtitle | 169, 68, 121, 14 | 169, 68, 121, 14 | - |
| sp.rating | 85, 512.1, 205, 61 | 85, 512.1, 205, 61 | - |
| sp.story | 85, 208, 205, 272.1 | 85, 208, 205, 272.1 | - |
| sp.ratingHeader | 85, 537.1, 205, 16 | 85, 537.1, 205, 16 | - |
| sp.ratingLabel | 85, 538.1, 151.4, 15 | 85, 538.1, 151.4, 15 | - |
| sp.ratingScore | 249.8, 537.1, 40.3, 16 | 249.8, 537.1, 40.3, 16 | - |
| sp.ratingBars | 85, 565.1, 205, 8 | 85, 565.1, 205, 8 | - |
| sp.bar0 | 85, 565.1, 37.8, 8 | 85, 565.1, 37.8, 8 | - |
| rp.pr | 20, 0, 335, 1748.1 | 20, 0, 335, 627 | h |
| rp.h2 | 44, 27, 287, 19 | 44, 27, 287, 25 | h |
| rp.ul | 44, 94, 287, 1633.1 | 44, 82, 287, 524 | yh |
| rp.li0 | 44, 94, 365, 466.7 | 44, 82, 135.5, 263.5 | ywh |
| rp.li0.media | 44, 94, 365, 365 | 44, 82, 135.5, 135.5 | ywh |
| rp.li0.img | 44, 94, 365, 365 | 44, 82, 135.5, 135.5 | ywh |
| rp.li0.info | 44, 459, 365, 101.8 | 44, 217.5, 135.5, 128 | ywh |
| rp.li0.title | 44, 479.8, 365, 19 | 44, 230.5, 135.5, 76 | ywh |
| rp.li0.price | 44, 509.9, 365, 30 | 44, 313.5, 135.5, 19 | ywh |
| cs.root | 0, 0, 375, 647.3 | 0, 0, 375, 647.3 | - |
| cs.trust | 20, 606.9, 335, 40.4 | 20, 606.9, 335, 40.4 | - |
| cs.mat | 20, 40, 335, 526.9 | 20, 40, 335, 526.9 | - |
| cs.matHeader | 61, 81, 253, 78 | 61, 81, 253, 78 | - |
| cs.matTitle | 145, 99, 169, 60 | 145, 99, 169, 60 | - |
| cs.matSubtitle | 145, 81, 169, 14 | 145, 81, 169, 14 | - |
| cs.matIconWrap | 61, 90, 60, 60 | 61, 90, 60, 60 | - |
| cs.matRating | n/a | 61, 464.9, 253, 61 | new/removed |

#### wax @ 375: x, y (section-relative), w, h, base -> head

| Element | base x,y,w,h | head x,y,w,h | moved >1px |
|---|---|---|---|
| main.container | 20, 0, 371, 1326 | 20, 0, 335, 1484 | wh |
| main.media | 44, 0, 323, 969 | 44, 0, 287, 861 | wh |
| main.info | 44, 1001, 323, 325 | 44, 893, 287, 591 | ywh |
| main.img1 | 44, 0, 323, 323 | 44, 0, 287, 287 | wh |
| main.vendor | 44, 1001, 323, 19 | 44, 893, 287, 19 | yw |
| main.h1 | 44, 1020, 323, 19 | 44, 928, 287, 75 | ywh |
| main.price | 44, 1039, 323, 19 | 44, 1019, 287, 19 | yw |
| main.select | 44, 1058, 323, 23 | 44, 1054, 287, 44 | ywh |
| main.pickerWrap | 44, 1058, 323, 23 | 44, 1054, 287, 44 | ywh |
| main.qty | 115.7, 1081, 188, 21 | 122.6, 1114, 80, 44 | xywh |
| main.qtyWrap | 44, 1081, 323, 21 | 44, 1114, 287, 44 | ywh |
| main.qtyLabel | 44, 1082, 66.2, 19 | 44, 1126.5, 66.6, 19 | y |
| main.add | 44, 1102, 88.2, 19 | 44, 1174, 287, 48 | ywh |
| main.addSpan | 44, 1102, 88.2, 19 | 139.8, 1188, 95.3, 20 | xyw |
| main.buy | 44, 1102, 323, 63 | 44, 1174, 287, 104 | ywh |
| main.details | 44, 1197, 323, 78 | 44, 1326, 287, 78 | yw |
| main.summary | 44, 1222, 323, 28 | 44, 1351, 287, 28 | yw |
| main.summaryIcon | 352.5, 1222, 14.5, 28 | 316.5, 1351, 14.5, 28 | xy |
| main.accContent | 44, 1250, 323, 43 | 44, 1379, 287, 43 | yw |
| main.accLoading | 44, 1274, 202.2, 19 | 44, 1403, 194.2, 19 | yw |
| main.share | 44, 1307, 44.7, 19 | 44, 1436, 97.6, 48 | ywh |
| sp.root | 0, 0, 375, 0 | 0, 0, 375, 0 | - |
| rp.pr | 20, 0, 335, 1748.1 | 20, 0, 335, 627 | h |
| rp.h2 | 44, 27, 287, 19 | 44, 27, 287, 25 | h |
| rp.ul | 44, 94, 287, 1633.1 | 44, 82, 287, 524 | yh |
| rp.li0 | 44, 94, 365, 466.7 | 44, 82, 135.5, 263.5 | ywh |
| rp.li0.media | 44, 94, 365, 365 | 44, 82, 135.5, 135.5 | ywh |
| rp.li0.img | 44, 94, 365, 365 | 44, 82, 135.5, 135.5 | ywh |
| rp.li0.info | 44, 459, 365, 101.8 | 44, 217.5, 135.5, 128 | ywh |
| rp.li0.title | 44, 479.8, 365, 19 | 44, 230.5, 135.5, 76 | ywh |
| rp.li0.price | 44, 509.9, 365, 30 | 44, 313.5, 135.5, 19 | ywh |
| cs.root | 0, 0, 375, 40.4 | 0, 0, 375, 40.4 | - |
| cs.trust | 20, 0, 335, 40.4 | 20, 0, 335, 40.4 | - |

#### p3p @ 1440: x, y (section-relative), w, h, base -> head

| Element | base x,y,w,h | head x,y,w,h | moved >1px |
|---|---|---|---|
| main.container | 20, 0, 1400, 682 | 20, 0, 1400, 682 | - |
| main.media | 100, 0, 682, 682 | 100, 0, 682, 682 | - |
| main.info | 782, 0, 558, 375 | 782, 0, 558, 574 | h |
| main.img1 | 100, 0, 682, 682 | 100, 0, 682, 682 | - |
| main.vendor | 846, 0, 494, 19 | 846, 0, 494, 19 | - |
| main.h1 | 846, 19, 494, 19 | 846, 35, 494, 45 | yh |
| main.price | 846, 38, 494, 19 | 846, 96, 494, 19 | y |
| main.qty | 917.7, 57, 188, 21 | 924.6, 131, 80, 44 | xywh |
| main.qtyWrap | 846, 57, 494, 21 | 846, 131, 494, 44 | yh |
| main.qtyLabel | 846, 58, 66.2, 19 | 846, 143.5, 66.6, 19 | y |
| main.add | 846, 78, 88.2, 19 | 846, 191, 494, 48 | ywh |
| main.addSpan | 846, 78, 88.2, 19 | 1045.3, 205, 95.3, 20 | xyw |
| main.buy | 846, 78, 494, 98 | 846, 191, 494, 139 | yh |
| main.details | 846, 246, 494, 78 | 846, 416, 494, 78 | y |
| main.summary | 846, 271, 494, 28 | 846, 441, 494, 28 | y |
| main.summaryIcon | 1325.5, 271, 14.5, 28 | 1325.5, 441, 14.5, 28 | y |
| main.accContent | 846, 299, 494, 42 | 846, 469, 494, 42 | y |
| main.accLoading | 846, 323, 185.9, 18 | 846, 493, 177.9, 18 | yw |
| main.desc | 846, 176, 494, 38 | 846, 346, 494, 38 | y |
| main.share | 846, 356, 44.7, 19 | 846, 526, 97.6, 48 | ywh |
| sp.root | 0, 0, 1440, 399.5 | 0, 0, 1440, 399.5 | - |
| sp.wrap | 20, 0, 1400, 399.5 | 20, 0, 1400, 399.5 | - |
| sp.inner | 20, 36, 1400, 327.5 | 20, 36, 1400, 327.5 | - |
| sp.card | 100, 36, 1240, 327.5 | 100, 36, 1240, 327.5 | - |
| sp.header | 141, 77, 1158, 60 | 141, 77, 1158, 60 | - |
| sp.iconWrap | 141, 77, 60, 60 | 141, 77, 60, 60 | - |
| sp.icon | 142, 78, 58, 58 | 142, 78, 58, 58 | - |
| sp.title | 225, 101, 187.5, 30 | 225, 101, 187.5, 30 | - |
| sp.headingGroup | 225, 83, 187.5, 48 | 225, 83, 187.5, 48 | - |
| sp.subtitle | 225, 83, 187.5, 14 | 225, 83, 187.5, 14 | - |
| sp.rating | 141, 261.5, 1158, 61 | 141, 261.5, 1158, 61 | - |
| sp.story | 141, 169, 1158, 60.5 | 141, 169, 1158, 60.5 | - |
| sp.ratingHeader | 141, 286.5, 1158, 16 | 141, 286.5, 1158, 16 | - |
| sp.ratingLabel | 141, 287.5, 151.4, 15 | 141, 287.5, 151.4, 15 | - |
| sp.ratingScore | 1258.8, 286.5, 40.3, 16 | 1258.8, 286.5, 40.3, 16 | - |
| sp.ratingBars | 141, 314.5, 1158, 8 | 141, 314.5, 1158, 8 | - |
| sp.bar0 | 141, 314.5, 228.4, 8 | 141, 314.5, 228.4, 8 | - |
| rp.pr | 20, 0, 1400, 642.6 | 20, 0, 1400, 520 | h |
| rp.h2 | 100, 36, 1240, 19 | 100, 36, 1240, 30 | h |
| rp.ul | 100, 103, 1240, 511.6 | 100, 96, 1240, 396 | yh |
| rp.li0 | 100, 103, 397, 511.6 | 100, 96, 298, 396 | ywh |
| rp.li0.media | 100, 103, 397, 397 | 100, 96, 298, 298 | ywh |
| rp.li0.img | 100, 103, 397, 397 | 100, 96, 298, 298 | ywh |
| rp.li0.info | 100, 500, 397, 114.6 | 100, 394, 298, 98 | ywh |
| rp.li0.title | 100, 527.2, 397, 19 | 100, 411, 298, 38 | ywh |
| rp.li0.price | 100, 557.4, 397, 30 | 100, 456, 298, 19 | ywh |
| cs.root | 0, 0, 1440, 447.9 | 0, 0, 1440, 447.9 | - |
| cs.trust | 20, 407.5, 1400, 40.4 | 20, 407.5, 1400, 40.4 | - |
| cs.mat | 20, 40, 1400, 327.5 | 20, 40, 1400, 327.5 | - |
| cs.matHeader | 61, 81, 1318, 60 | 61, 81, 1318, 60 | - |
| cs.matTitle | 145, 105, 184.7, 30 | 145, 105, 184.7, 30 | - |
| cs.matSubtitle | 145, 87, 184.7, 14 | 145, 87, 184.7, 14 | - |
| cs.matIconWrap | 61, 81, 60, 60 | 61, 81, 60, 60 | - |
| cs.matRating | n/a | 61, 265.5, 1318, 61 | new/removed |

#### p3p @ 375: x, y (section-relative), w, h, base -> head

| Element | base x,y,w,h | head x,y,w,h | moved >1px |
|---|---|---|---|
| main.container | 20, 0, 335, 732 | 20, 0, 335, 961 | h |
| main.media | 44, 0, 287, 287 | 44, 0, 287, 287 | - |
| main.info | 44, 319, 287, 413 | 44, 319, 287, 642 | h |
| main.img1 | 44, 0, 287, 287 | 44, 0, 287, 287 | - |
| main.vendor | 44, 319, 287, 19 | 44, 319, 287, 19 | - |
| main.h1 | 44, 338, 287, 19 | 44, 354, 287, 75 | yh |
| main.price | 44, 357, 287, 19 | 44, 445, 287, 19 | y |
| main.qty | 115.7, 376, 188, 21 | 122.6, 480, 80, 44 | xywh |
| main.qtyWrap | 44, 376, 287, 21 | 44, 480, 287, 44 | yh |
| main.qtyLabel | 44, 377, 66.2, 19 | 44, 492.5, 66.6, 19 | y |
| main.add | 44, 397, 88.2, 19 | 44, 540, 287, 48 | ywh |
| main.addSpan | 44, 397, 88.2, 19 | 139.8, 554, 95.3, 20 | xyw |
| main.buy | 44, 397, 287, 98 | 44, 540, 287, 139 | yh |
| main.details | 44, 603, 287, 78 | 44, 803, 287, 78 | y |
| main.summary | 44, 628, 287, 28 | 44, 828, 287, 28 | y |
| main.summaryIcon | 316.5, 628, 14.5, 28 | 316.5, 828, 14.5, 28 | y |
| main.accContent | 44, 656, 287, 42 | 44, 856, 287, 42 | y |
| main.accLoading | 44, 680, 185.9, 18 | 44, 880, 177.9, 18 | yw |
| main.desc | 44, 495, 287, 76 | 44, 695, 287, 76 | y |
| main.share | 44, 713, 44.7, 19 | 44, 913, 97.6, 48 | ywh |
| sp.root | 0, 0, 375, 611.1 | 0, 0, 375, 611.1 | - |
| sp.wrap | 20, 0, 335, 611.1 | 20, 0, 335, 611.1 | - |
| sp.inner | 20, 27, 335, 557.1 | 20, 27, 335, 557.1 | - |
| sp.card | 44, 27, 287, 557.1 | 44, 27, 287, 557.1 | - |
| sp.header | 85, 68, 205, 78 | 85, 68, 205, 78 | - |
| sp.iconWrap | 85, 77, 60, 60 | 85, 77, 60, 60 | - |
| sp.icon | 86, 78, 58, 58 | 86, 78, 58, 58 | - |
| sp.title | 169, 86, 121, 60 | 169, 86, 121, 60 | - |
| sp.headingGroup | 169, 68, 121, 78 | 169, 68, 121, 78 | - |
| sp.subtitle | 169, 68, 121, 14 | 169, 68, 121, 14 | - |
| sp.rating | 85, 482.1, 205, 61 | 85, 482.1, 205, 61 | - |
| sp.story | 85, 178, 205, 272.1 | 85, 178, 205, 272.1 | - |
| sp.ratingHeader | 85, 507.1, 205, 16 | 85, 507.1, 205, 16 | - |
| sp.ratingLabel | 85, 508.1, 151.4, 15 | 85, 508.1, 151.4, 15 | - |
| sp.ratingScore | 249.8, 507.1, 40.3, 16 | 249.8, 507.1, 40.3, 16 | - |
| sp.ratingBars | 85, 535.1, 205, 8 | 85, 535.1, 205, 8 | - |
| sp.bar0 | 85, 535.1, 37.8, 8 | 85, 535.1, 37.8, 8 | - |
| rp.pr | 20, 0, 335, 1748.1 | 20, 0, 335, 627 | h |
| rp.h2 | 44, 27, 287, 19 | 44, 27, 287, 25 | h |
| rp.ul | 44, 94, 287, 1633.1 | 44, 82, 287, 524 | yh |
| rp.li0 | 44, 94, 365, 466.7 | 44, 82, 135.5, 263.5 | ywh |
| rp.li0.media | 44, 94, 365, 365 | 44, 82, 135.5, 135.5 | ywh |
| rp.li0.img | 44, 94, 365, 365 | 44, 82, 135.5, 135.5 | ywh |
| rp.li0.info | 44, 459, 365, 101.8 | 44, 217.5, 135.5, 128 | ywh |
| rp.li0.title | 44, 479.8, 365, 19 | 44, 230.5, 135.5, 76 | ywh |
| rp.li0.price | 44, 509.9, 365, 30 | 44, 313.5, 135.5, 19 | ywh |
| cs.root | 0, 0, 375, 647.3 | 0, 0, 375, 647.3 | - |
| cs.trust | 20, 606.9, 335, 40.4 | 20, 606.9, 335, 40.4 | - |
| cs.mat | 20, 40, 335, 526.9 | 20, 40, 335, 526.9 | - |
| cs.matHeader | 61, 81, 253, 78 | 61, 81, 253, 78 | - |
| cs.matTitle | 145, 99, 169, 60 | 145, 99, 169, 60 | - |
| cs.matSubtitle | 145, 81, 169, 14 | 145, 81, 169, 14 | - |
| cs.matIconWrap | 61, 90, 60, 60 | 61, 90, 60, 60 | - |
| cs.matRating | n/a | 61, 464.9, 253, 61 | new/removed |

#### home @ 1440: x, y (section-relative), w, h, base -> head

| Element | base x,y,w,h | head x,y,w,h | moved >1px |
|---|---|---|---|
| main.container | 0, 0, 1440, 436.6 | 0, 0, 1440, 436.6 | - |
| main.media | 20, 72, 1400, 292.6 | 20, 72, 1400, 292.6 | - |
| main.img1 | 1096, 72, 300, 292.6 | 1096, 72, 300, 292.6 | - |
| cs.root | 0, 0, 1440, 40.4 | 0, 0, 1440, 40.4 | - |
| cs.trust | 20, 0, 1400, 40.4 | 20, 0, 1400, 40.4 | - |

#### land @ 1440: x, y (section-relative), w, h, base -> head

| Element | base x,y,w,h | head x,y,w,h | moved >1px |
|---|---|---|---|
| main.container | 20, 0, 1400, 682 | 20, 0, 1400, 682 | - |
| main.media | 100, 0, 682, 682 | 100, 0, 682, 682 | - |
| main.info | 782, 0, 558, 436 | 782, 0, 558, 672 | h |
| main.img1 | 100, 0, 682, 682 | 100, 0, 682, 682 | - |
| main.vendor | 846, 0, 494, 19 | 846, 0, 494, 19 | - |
| main.h1 | 846, 19, 494, 19 | 846, 35, 494, 45 | yh |
| main.price | 846, 38, 494, 19 | 846, 96, 494, 19 | y |
| main.select | 846, 57, 164, 23 | 846, 131, 494, 44 | ywh |
| main.pickerWrap | 846, 57, 494, 23 | 846, 131, 494, 44 | yh |
| main.qty | 917.7, 80, 188, 21 | 924.6, 191, 80, 44 | xywh |
| main.qtyWrap | 846, 80, 494, 21 | 846, 191, 494, 44 | yh |
| main.qtyLabel | 846, 81, 66.2, 19 | 846, 203.5, 66.6, 19 | y |
| main.add | 846, 101, 88.2, 19 | 846, 251, 494, 48 | ywh |
| main.addSpan | 846, 101, 88.2, 19 | 1045.3, 265, 95.3, 20 | xyw |
| main.buy | 846, 101, 494, 98 | 846, 251, 494, 139 | yh |
| main.details | 846, 307, 494, 78 | 846, 514, 494, 78 | y |
| main.summary | 846, 332, 494, 28 | 846, 539, 494, 28 | y |
| main.summaryIcon | 1325.5, 332, 14.5, 28 | 1325.5, 539, 14.5, 28 | y |
| main.accContent | 846, 360, 494, 43 | 846, 567, 494, 43 | y |
| main.accLoading | 846, 384, 202.2, 19 | 846, 591, 194.2, 19 | yw |
| main.desc | 846, 199, 494, 76 | 846, 406, 494, 76 | y |
| main.share | 846, 417, 44.7, 19 | 846, 624, 97.6, 48 | ywh |



## Deviations

1. **Theme check shows 4 offenses at Steps 9-12, not 1.** After the card rewrite removes the only callers, three `OrphanedSnippet` warnings appear: `snippets/loading-spinner.liquid`, `snippets/progress-bar.liquid`, `snippets/quantity-input.liquid`. The plan (section 2) says to leave them for T4/T5 but predicted no offense. Nothing deleted. Question filed in `docs/plans/theme-evolution-tailwind-t2-coder-questions.md`; choosing to delete them is a one-commit follow-up. C2.1 as written (exactly one offense) is red until that is decided. Steps 12's `CLAUDE.md:68` text adds one sentence naming the three warnings (the plan's text, otherwise verbatim).
2. **Arbitrary-variant underscores.** The plan's `[&_.material-accordion__thumbnail]:` classes compile to `.material-accordion thumbnail` (Tailwind turns `_` into a space), so the accordion thumbnail stayed 494 px wide (found by `t2c-behavior.mjs`). Fixed in Step 7 with escaped underscores: `[&_.material-accordion\_\_thumbnail]:...`, `[&_.material-accordion\_\_story]:...`. Verified: thumbnail 100px.
3. **Card info gap.** The plan's structure put the title directly above the information list with no spacing, which would make the title-to-price gap 0 (Dawn's was 11.2 px, E2.9 says 7). The info container is `flex flex-col gap-[0.4375rem]` (in addition to the list's own gap) so the gap is 7 px.
4. **Cart drawer first edit** is a second `if (section.id === 'header' && newContent && sectionElement)` right after the existing `if` rather than nested inside it. Same behavior.
5. **Sustainability bars** render two literal `<span>` variants (active / not) instead of a conditional class interpolation, to keep complete class strings. Same classes as the plan.
6. **Price volume branch** `<s>` (quantity price breaks) carries no `data-compare-at`; C2.19 reads that attribute only on the sale branch.
7. **C2.10 base** is the dev theme at `3c16c3c`, not staging #187953643616 (the tree is identical to T1 live; staging was used for C2.26).
8. Plan section 5.15 listed 5 locale keys; they were added as the files needed them in Steps 4, 6, 7.

## Not verified

- Theme-editor persistence of every setting (the editor half of C2.25 is BLOCKED for the Coder); `accent_color` and `type_heading_font` in the editor.
- Quantity price breaks, rating stars, unit price, sold-out badge, no-media card, second-media hover, card focus ring, hover-effects at 1024: no fixture; checked statically or by class string only.
- Numeric sizes for vendor, badge, unit price (E2.9) and the 750-767 / 990-1023 bands.
- Hero icon preload as a Link header: with `preload_icon` on or off the preload header count stays 7, so the header is not observable here (Shopify may cap or dedupe). The `fetchpriority` and `loading` attributes were verified.
- JSON-LD `@type` `Product` (it is `ProductGroup` on multi-variant products; unchanged file).
- Tooltip and trigger colors in the palette run were compared by key equality, not echoed. A push to staging and the real Add to cart on a published theme were not done.

## Out-of-scope observations

- `docs/dev-fixtures.md` says the-complete-snowboard has no spotlight and that wax may lack related products; both are out of date.
- The related-product `sizes` attribute still mentions Dawn's 750/990 breakpoints (kept byte-for-byte per the plan).
- Cards' `a` stretched link and `Badge-` id: `aria-labelledby` references a `Badge-` id that is absent when there is no badge (as before).

## Follow-ups

- **R12 (escaping stored story HTML), out of T2 scope, not fixed here.** Three unescaped prints of merchant story content: `snippets/material-info.liquid:150` (`{{ material.story.value | newline_to_br }}`, now at a different line after T2's rewrite: search for `material.story.value`), `sections/material-tooltip.liquid:30` (`{{ material_metaobject.story.value }}`), and, from review R3-N1, `sections/main-material-archive.liquid:215` (`{{ material.story.value | truncate: 160 }}`, no `escape`; `truncate` on stored HTML can also cut a tag in half). Proposed fix: `escape` on all three, placed **before** `newline_to_br` in material-info (escaping after would escape the `<br>`s), and `escape` before `truncate` (or `strip_html | truncate`) in the archive. The spotlight already escapes. The owner decides whether to promote this to a `docs/bugs/` entry.
- Decide the three orphaned snippets (deviation 1).
- T5: delete the eight now-unreferenced Dawn files (`component-card.css`, `component-price.css`, `section-related-products.css`, `mask-blobs.css`, `component-rating.css`, `component-volume-pricing.css`, `quick-order-list.css`, `quantity-popover.css`).
