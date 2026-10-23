# QA report: theme-evolution-tailwind-t2 (product page)

Build under test: HEAD `7c59f39` (13 commits f780fae..7c59f39 on 3c16c3c). Dev theme #187953938528 via `shopify theme dev`; baseline staging #187953643616. Nothing pushed; dev server stopped. Tool: Playwright (node scripts, headless chromium) throughout; Chrome DevTools MCP not used.
Harness: reused `t2c-*` (overflow, behavior, sweep, mcss, tooltip, misc, facts, regress, proxy) plus new `docs/qa/harness/t2q-pdp.mjs`, `t2q-pixdiff.mjs`, `t2q-restore.mjs`. Screenshots in `docs/qa/screenshots/` (`t2q-head-*`, `t2c-reg-qbase-*`/`qhead-*`, `t2c-shape-*`, `t2c-palette-*`).

## Summary verdict

**PASS WITH NITS**

No blockers. All C2 criteria pass or are partial for fixture reasons. C2.1 deviates from the plan text only because the plan's prediction was wrong (see below).

## Gates and size

| Check | Result |
|---|---|
| `npm ci && npm run check:css` | exit 0 |
| `npm run check:hidden` | exit 0 |
| `assets/tailwind.css` | 35,990 B minified (budget 60,000), 7,963 B gzip -9 (budget 12,000). Within budget |
| Theme check | 4 offenses: `TranslationKeyExists` (cart-drawer, error) + 3 `OrphanedSnippet` warnings (`loading-spinner`, `progress-bar`, `quantity-input`). Nothing else |
| Orphans confirmed | rg finds no `render` of the three in sections, snippets, blocks, layout, templates other than inside the orphaned snippets themselves (a doc example, and `quantity-input` rendering `progress-bar`). Nothing deleted |
| Untouched | `git diff 3c16c3c..HEAD -- config templates sections/*-group.json` empty. Locale +11 lines. No `{% include %}`. Repo has no tracked modifications after my run |

## C2 criteria

| ID | Result | Evidence |
|---|---|---|
| C2.0 | PASS | check:css exit 0 |
| C2.1 | PASS as amended | 4 offenses = the expected set (plan-prediction deviation: plan said 1; the predicted-wrong part is the OrphanedSnippet warnings that follow from the plan's own S2 instruction). Not a code defect |
| C2.2 | PASS | schema text identical between 3c16c3c and HEAD for all six files (shasum) |
| C2.3 | PASS | no `stylesheet_tag` in the 12 files; no `'eco-tooltip.css'` in layout; `assets/eco-tooltip.css` gone; rendered `N_dawn` 0 on p3p, snow, wax, home (M_css, 4 related cards each) |
| C2.4 | PASS (guard) | `B_doc` 20,939 vs Step 0 25,126 on all three products (`B_head` 20,939, `B_body` 0). `/`: 22,351 vs 19,904 (record only; rise is the larger tailwind.css in head on every page, 3,958 to 7,433). Report to owner as a cost on `/` |
| C2.5 | PASS | see sizes |
| C2.6 | PASS | 0 unlayered matches on p3p, wax, snow at 1440 and 375 |
| C2.6b | PASS | Dawn-class intersection within allowlist plus Shopify's `section`; grid `margin-bottom` 0 |
| C2.7 | PASS | bare `group`: overflow visible, display block; `group group--vertical`: hidden, flex |
| C2.8 | PASS | both rg patterns print nothing |
| C2.9 | PASS | `X_page` 0 and no `X_off` at 320/375/390/430/768/1024/1440, all three products, after load, after scroll, after add (wax, snow). Ski-wax 375 = 0 (was 16 and 34) |
| C2.10 | PASS | Coder's before/after tables reviewed; regression pages pixel-identical (below). Δ rows E2.1 to E2.8 observed as expected. Not re-measured by me element by element |
| C2.11 | PASS | p3p no select/no "Default Title"; wax 3 options, snow 5, selected = first available |
| C2.12 | PASS | wax and snow at 1440 and 375: add 200, drawer opens, badge 1/"1 item", qty 3 gives "3 items", remove gives badge hidden/"0 items"; spinner hidden, no `aria-disabled` after each step. aria-label deviation 3 verified |
| C2.13 | PASS | p3p 422: drawer closed, badge unchanged, button recovers, 0 page errors; spinner class string has no display token (`loading__spinner hidden absolute inset-0 size-full`) |
| C2.14 | PASS | add bg rgb(227,252,1) = accent, color #111 = accent-foreground, Oswald, 48 px, uppercase; Share 1px border, transparent bg; `.btn-primary:hover{` 1, `.btn-secondary:hover{` 1, `&:` 0 |
| C2.15 | PASS | one h1 on every page; Oswald; 30 px at 375, 36 px at 1440 |
| C2.16 | PASS | spotlight present on p3p/snow (H2); wax wrapper empty; img width/height present; hero proxy `fetchpriority` high, `loading` eager |
| C2.17 | PASS | 5 bars, block, 8 px, active `::after` rgb(45,90,39), animation `sustainabilityFillReveal`; grid children contained |
| C2.18 | PASS | 1440: 4 x 298; 375: 2 x 135.5; 1023 two columns, 1024 four (Coder, and 767/768 confirmed by me via misc); no `product-grid` in CSS; no `@layer shims {` |
| C2.19 | PASS (partial) | 4 cards, no `<style>` in recommendations, hit-test and click navigate; no card on sale so price branch checked as exactly one price span and no `[data-compare-at]`. Badge-per-shape proxy: 8 shapes, 0 problems (not clipped, inside media, above imgs). Volume note static: one line, `text-[0.625rem] md:text-[0.75rem]`. Second-media hover not exercisable |
| C2.20 | PASS | no `eco-tooltip.css` requests; tooltip opacity 1, visible, absolute, z 9999, white, title, Work Sans 14/21; hides on mouse out; `material_handle \| escape` present |
| C2.21 | PASS | details open, icon 45deg, one `view=api` request, thumbnail max-width and width 100px |
| C2.22 | PASS as guard | one JSON-LD; `@type` is `ProductGroup` on multi-variant product (file untouched; plan text said `Product`) |
| C2.23 | PASS | main first img eager/high, preload header; landing page eager, no fetchpriority, 6 preload headers; others lazy; all imgs sized |
| C2.24 | PASS | container column at 767, row at 768 |
| C2.25 | PASS via proxy, editor BLOCKED | re-ran full proxy on a scratch `git archive` copy: heading_size 24/20, 40/30, 52/40, 62/50, 72/56; columns_desktop 1 to 6; columns_mobile 1; products_to_show 2; image_ratio portrait 0.8 and square 1; show_vendor; paddings; 8 distinct shapes, 4 distinct blob clip-paths; heading_tag h2/h3/h4; icon_style hero 16:9 with preload on/off; show_rating off; trust style minimal/pill/underline; two specs_table blocks keep own colors; dynamic checkout off; share label |
| C2.26 | PASS | 7 regression pages at 1440 and 375, staging vs dev: status, height, `X_page`, h1 count identical (`/` 375 x=21, collections 145, search 103 unchanged). Pixel diff of full-page screenshots: only the preview bar theme-name region differs (one fixed bbox), so content is pixel-identical |
| C2.27 | PASS | `--color-foreground` precheck matched in both runs. Changed (palette run): spotlight title rgb(238,17,136), subtitle, card border, label, accordion border and summary, variant select bg rgb(17,34,51), Share color. Unchanged: material-info color/bg/label, active bar, track, Add to cart bg. Dev theme restored and `--color-foreground` re-read #333333 |

## Coder deviations

1. Orphaned snippets: confirmed, see C2.1. Recommend owner decide deletion at T4/T5.
2. Escaped underscores: compiled selector is `.\[\&_\.material-accordion\\_\\_thumbnail\]\:max-w-\[100px\] .material-accordion__thumbnail{max-width:100px}`, correct; thumbnail renders 100 px wide.
3. Card gap: title bottom to price top measured 7 px (1440), matching E2.9. Title and price 16 px.
4. Cart-drawer sibling `if`: verified functionally (C2.12), both the renderContents and updateCart paths use the same logic; aria-label follows count on add, quantity change and remove.
5. Other listed deviations (spinner span variants, volume `<s>`, C2.10 base choice) reviewed; no objection.

## Console, network, accessibility

- Console: the only errors are Shopify `Error producing monorail event` (telemetry, headless network failure). No theme errors or page errors on p3p, wax, snow, landing page or home at 1440 and 375.
- Network failures are only Shopify telemetry/shop.app assets (`api/collect`, monorail, error-analytics, `shop.app/pay` sprites). No theme asset 4xx.
- One h1 per page. Heading order on PDP: an h2 precedes the h1 in DOM (not from T2 files; likely cart drawer/header, unchanged), then h1, h2, h2, h3s; no skips within T2 markup. `/` shows one skip (not T2).
- No unnamed buttons/links; all main imgs have alt.
- Focus: Add to cart and Share show a visible 2px solid outline on keyboard focus (`focus-visible`). Hover on primary uses `filter: brightness(.95)`, so background color value is unchanged by design.
- Security: no new unescaped output introduced by the diff; `material_handle` now escaped. Remaining unescaped story HTML is R12 (known, listed in Follow-ups).
- Performance: CSS transfer down on product pages (25,126 to 20,939 B), up on `/` (+2,447 B).

## Issues / nits

1. (Nit, pre-existing, not T2) Tooltip trigger `<span class="eco-tooltip-trigger">` has no `tabindex`/role and the tooltip does not show on focus: not keyboard accessible. `product.liquid` and `eco-tooltip.js` behavior unchanged from baseline. Suggest a follow-up.
2. (Nit) JSON-LD type is `ProductGroup` for multi-variant products; plan C2.22 text should say so.
3. (Nit) Hero `preload_icon` Link header count is 7 with preload on or off, so the preload-as-header half of C2.16 is not observable here.
4. (Nit) Plan C2.1 prediction (1 offense) and `CLAUDE.md` QA text; Coder updated `CLAUDE.md:68`; the plan itself should note 4.
5. (Nit) Home page `B_doc` +2,447 B (head tailwind.css growth) is a cost to report to owner.

## Not verified / pending owner

- Theme editor persistence and live update of every converted setting; `accent_color` and `type_heading_font` in the editor (editor half of C2.25 BLOCKED for QA).
- Paths with no fixture: sale/sold-out badges on real data (badge checked with a forced-sale scratch proxy only), rating stars, unit price, quantity price breaks (static only), no-media card, second-media hover, card focus ring, hover effects at 1024, `adapt` image ratio (media are square, so indistinguishable from square).
- 750-767 and 990-1023 bands not screenshotted; numeric vendor/badge/unit-price sizes.
- Real-world Add to cart on a published theme; a push to staging was not done.
- Tooltip colors in the palette run were compared by equality only, per Coder; my re-run used the same probe.

PASS WITH NITS
