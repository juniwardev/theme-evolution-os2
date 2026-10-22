# QA report: theme-evolution-tailwind-t0 (Tailwind foundation)

Date: 2026-10-22. Commits under test: `5d23466`, `2de01fa`, `8a141ec`, `ec5d92f` on `main` (local, not pushed). Baseline for A/B: `2866f5f`.
Dev theme: #187953938528 (private development theme created by `shopify theme dev`; live theme untouched).

## Summary verdict: FAIL (one visible unlisted difference; flips to PASS WITH NITS if the owner accepts it)

All 19 criteria that can be run pass or are explicitly BLOCKED for access reasons, the build is reproducible, the size and `B_rb` budgets hold, and no new console errors appear. One finding blocks approval under the plan's own E6 rule ("not expected; the owner accepts it or it becomes a fix in T0"):

- **F1 (BLOCKER, pending owner decision):** at 1440px on every page the header **cart icon shrinks to about 45% of its size** (glyph 30.6x39.2 px to 13.9x17.8 px) while the account icon stays 28.6x30.3 px. The Coder's notes call this "no visible change". It is visible. See F1.

Everything else is nits or items for the owner's acceptance list.

Method: base-vs-after A/B on the same markup in the same session. "base" intercepts the `tailwind.css` and `base.css` requests and serves the old `critical.css` and unwrapped old `base.css` from `2866f5f`; "after" serves the real files. This gives a controlled pre-T0 reference without relying on the Coder's earlier dumps (which I used only as a cross-check). 9 pages x 2 viewports x 2 modes, plus the password page, plus targeted probes. Tool: Playwright (library, via committed scripts in `docs/qa/harness/`) rather than the Playwright MCP, because the storefront password must never be printed and the matrix is about 60 combinations. The Playwright MCP was used only to check the theme editor login. Chrome DevTools MCP was not needed.

## Pre-test gates

| Gate | Result |
|---|---|
| `npm ci && npm run check:css` | exit 0 (rebuild identical to the committed file, file tracked) |
| `npm run check:hidden` | exit 0 |
| `shopify theme check` | 2 offenses in 2 files, 62 files inspected: `TranslationKeyExists` (`cart-drawer.liquid`, `cart.empty`) and `UnusedAssign` (`card-product.liquid`, `page_width`). Matches the expected baseline, no new offense |
| `assets/tailwind.css` size | 9,202 B minified, 2,855 B gzip -9. Budget 25,000 / 12,000: within (37% / 24%) |
| `assets/base.css` | 80,537 B (was 80,382; +155 B for the layer wrapper, diff is +3 lines) |
| Working tree after testing | No tracked file changed. Only untracked `docs/qa/harness/` (new) and the two pre-existing design PNGs |

## C0.1 to C0.19 results

| ID | Check | Method | Result | Evidence |
|---|---|---|---|---|
| C0.1 | Reproducible, committed build | `npm ci && npm run check:css` on the clean tree | PASS | exit 0 |
| C0.2 | Layer statement first | `styleSheets[0].cssRules[0]` on home, 9 pages, password (via 127.0.0.1:9292), gift card preview | PASS | `CSSLayerStatementRule` `properties,theme,base,legacy,components,utilities,shims` on all. See note N1 for the password URL |
| C0.3 | `base.css` contained | CSSOM on `/` | PASS | `base.css` top-level rules: exactly `CSSLayerBlockRule:legacy` |
| C0.4 | Utilities beat legacy | grep precondition + `.grid` probe | PASS | `grep -cF '.grid{display:grid}'` = 1; probe computed `display: grid` |
| C0.5 | Legacy beats Preflight | `P_btn` on `/` | PASS | `.banner__buttons a.button` padding-left 48 px, equals baseline |
| C0.6 | Shim keeps Dawn grid | `/products/the-complete-snowboard` | PASS | `ul.product-grid` `display: flex`, 4 cards in 1 row, widths 397 / 296.5 / 277.4 / 269 (same as baseline) |
| C0.7 | `critical.css` gone | (a) request logs; (b) `rg`; (c) gift card | PASS | (a) no `critical.css` request on `/` or password; `tailwind.css` requested on both; (b) `rg -n "'critical.css'"` prints nothing, `rg -c "'tailwind.css'"` = 1 in all three files; (c) gift card preview requests `tailwind.css`, not `critical.css` |
| C0.8 | Theme check unchanged | `shopify theme check` | PASS | 2 offenses, same files and checks |
| C0.9 | Explicit source detection | `grep -cF 'max-md\:hidden' assets/tailwind.css` | PASS | 0 |
| C0.10 | Size budget and `B_rb` | see the `B_rb` section | PASS | `S_tw` 9,202 / 2,855. `B_rb` 1.130x baseline (limit 1.15), measurement valid |
| C0.11 | Password form usable | password page on 127.0.0.1:9292; typed the fixtures password, submitted in the browser | PASS | input `border-top-width` 1px (solid, rgb(51,51,51)); after submit the page moved to `/` and no password input remained |
| C0.12 | Every visual diff is expected | A/B computed-style diff (33 properties, all elements) plus screenshots | REVIEW GATE: see E-table and findings | 130 distinct property transitions in the dump, all mapped below; F1 and the owner-acceptance list are the open items |
| C0.13 | Shopify/app UI intact | `selling-plans-ski-wax`: add to cart, drawer, dynamic checkout, A/B | PASS (live app embed not testable, see BLOCKED) | cart drawer opens with the item, renders the same at 1440 and 375, header count 1, no console errors. Dynamic checkout renders (`shopify-accelerated-checkout` 494x44 at 1440, 323x44 at 375, identical to baseline). Header z-index 10 vs drawer 1000: the drawer still covers the header. The native "Add to cart" button loses its button chrome (E3, see N4) |
| C0.14 | `H1` = 1 | every page and viewport | PASS | 1 on all pages/viewports in both modes (404, home, products, collection, cart, search, materials, password, gift card) |
| C0.15 | No new console errors | console logs, base vs after | PASS | identical in both modes: 404 resource errors on the 404 page, Shopify "monorail" fetch failures on product pages (headless network), none new. Password page on localhost shows 4 CORS/framing errors in both modes (localhost artefact) |
| C0.16 | Dev loop works | `npm run dev` | PASS (partial) | `concurrently` starts both processes; `shopify theme dev` prints the preview URL; the Tailwind watcher rebuilt on `touch src/tailwind.css` ("Done in 18ms") with no diff in the tracked file; `SIGINT` to concurrently stopped both children. "Add a utility class to a section and see it in the preview" was not exercised because it needs a code edit, which QA must not make |
| C0.17 | `LH_root` = `normal` | `getComputedStyle(html).lineHeight` | PASS | `normal` on every page in both modes, including password and gift card |
| C0.18 | Layer gate both ways | run in a scratch copy of the tree (QA may not edit code) | PASS | (1) exit 0; (2) `properties, ` removed from `templates/gift_card.liquid`: exit 1, names that file; (3) `@layer probe` appended and built: exit 1, names `probe`; (4) reverted and rebuilt: exit 0, output byte-identical |
| C0.19 | Hidden guard both ways | scratch copy | PASS | green tree exit 0; probe file: exit 1 with exactly 3 findings (lines 1 to 3, line 4 not flagged); probe removed and rebuilt: exit 0; `max-md:hidden` count stays 0 |

## E1 to E14 observation table

| ID | Observed | Evidence (A/B) |
|---|---|---|
| E1 | Yes, but see "E1 deviation" | Close icon span `display: flex` to `none` on all 18 header page/viewport combos. At 375 the header shows only the hamburger and the grey button box is gone (`t0-base-home-375.png` vs `t0-after-home-375.png`). `X_hdr`/`X_page` did not shrink |
| E2 | Yes | Header section `z-index` 3 to 10 on 18 page/viewport combos. Cart drawer (1000) still covers the header |
| E3 | Yes, wider than written | Unclassed `button`: background `rgb(239,239,239)` to transparent, border 2px outset to 0, padding 1px 6px to 0, radius 0. Also font-family Arial to Work Sans, font-size 13.33 to 16 px, color black to `rgb(51,51,51)` (see owner acceptance) |
| E4 | Not observable | No unclassed lists or merchant rich text on the tested pages |
| E5 | Yes | Password page (`layout/password.liquid`): `h1` 32 px/700 to 16 px/400, input border 2px inset to 1px solid, submit button becomes bare text (`t0-base-pw-375.png` vs `t0-after-pw-375.png`). Line-height unchanged. Still works (C0.11) |
| E6 | One visible finding (F1); others are on the owner list | see Findings |
| E7 | Yes | Link color `rgb(0,0,238)` to `rgb(51,51,51)` on 126 links across 16 page/viewport combos |
| E8 | Yes | `text-decoration: underline` to none on classed links (collection/search product image links, 60 instances) and on the cart product link (`a 749x749`) |
| E9 | Yes | Text inputs `rgb(255,255,255)` to transparent. The cart "Update"/"Checkout" `input[type=submit]` also lose `rgb(239,239,239)` |
| E10 | Yes (not captured as a computed diff by my property list; the Coder recorded it) | Placeholder color is a pseudo-element; the Coder's dump shows `rgb(0,0,0)` to `rgb(51,51,51)`. Not re-measured |
| E11 | Only Shopify-injected iframes | I skip iframes in the dump; no theme iframe exists |
| E12 | **Not observable as written** | `/cart` table `border-collapse` is already `collapse` in the baseline (`base.css` sets it), so the "2px cell spacing disappears" effect does not exist. Table width at 375 changes 514.3 to 508.3 px because the inputs inside it shrink (E3/E9 side effect). Cart with a line item at 1440: table 1400 px in both |
| E13 | Not observable | No `h6` on any tested page |
| E14 | Yes, exactly as written | Gift card preview (`/gift_cards/66420244576/preview` on the dev server): `h1` 32 px/700 to 16 px/400, `h2` 24 px/700 to 16 px/400, image stays `display: inline` (300x200 both modes), no link, `H1` = 1. First rule is the layer statement; `tailwind.css` requested, `critical.css` not |

### E1 deviation, confirmed

The close icon is hidden as planned, but `X_hdr` and `X_page` are **unchanged** at every width (A/B on `/` and on `the-3p-fulfilled-snowboard`):

| Width | `X_hdr` base | `X_hdr` after | `X_page` base (`/`) | `X_page` after (`/`) |
|---|---|---|---|---|
| 320 | 71.2 | 71.2 | 76 | 76 |
| 375 | 38.2 | 38.2 | 38 | 38 |
| 390 | 29.2 | 29.2 | 29 | 29 |
| 430 | 5.2 | 5.2 | 5 | 5 |
| 1440 | -20 | -20 | 0 | 0 |

On the product page `X_page` is 71 at 320 and 38/29/5 at 375/390/430, also unchanged. The plan's E1 expectation ("`X_hdr` shrinks about 32 px") is contradicted. Why: the menu toggle button is sized by `.header__icon` (70.4 px x 70.4 px) before and after; the hidden close span was never what set its width. In the after state the open-icon span grows from 32x66.4 px to 70.4x70.4 px, so the box is unchanged. The overflow is driven by the three 70.4 px icon boxes plus the logo, as the bug report's W_icon analysis says. This is a premise error in the plan, not a Coder bug. `X_page` on `/cart` and `/search` at 375 does move (159 to 153, 109 to 103; about 6 px, from smaller inputs), which is unrelated to the header.

## Findings

### F1 — BLOCKER (pending owner decision): header cart icon renders at about 45% size at desktop and mobile; Coder reported it as invisible

- Where: every page, 1440 px and 375 px, any cart state (the badge also changes when the cart has items).
- Measured (Playwright, `docs/qa/harness/t0-icons.mjs`, empty cart):
  - Cart glyph: 30.6 x 39.2 px (base) to 13.9 x 17.8 px (after), at both 1440 and 375.
  - Account glyph: 28.6 x 30.3 px in both. So the two header icons are now visibly mismatched.
  - Cart SVG box: 70.4 x 70.4 to 70.4 x 32 px. Account SVG box: 32 x 32 to 70.4 x 32 px (glyph unchanged because it is centred).
  - With one item in the cart at 1440: the count badge was a tall white capsule overlapping the icon in the baseline (`t0-base-cartfull-1440.png`) and is now a small round badge (`t0-after-cartfull-1440.png`). That part looks like an improvement.
- Why it matters: the impl notes (item 5 under E6 candidates) say "Screenshots at 375 and 1440 show no visible change". The 1440 screenshots show the cart bag at half size (`t0-base-home-1440.png` vs `t0-after-home-1440.png`). A shopper would notice. The cause is the cascade flip the Coder named: unlayered `critical.css` `svg { height: auto }` no longer outranks the Dawn/`header` rules.
- Plan rule: E6 = not expected; the owner accepts it or it becomes a T0 fix. T1 rewrites the header, so acceptance is plausible, but it needs to be an explicit decision.
- Reproduce: open `/` at 1440 on the dev theme, compare to the baseline CSS (or the live theme): cart bag top-right. MCP used: Playwright (library).

### N1 — NIT: the password page cannot be inspected through the preview URL from a cookie-less visitor

A cookie-less request to `https://theme-evolution-os2.myshopify.com/password?preview_theme_id=...` redirects (302) to `/password` and serves Shopify's default password page (no theme CSS, no `layout/password.liquid`). `/?preview_theme_id=...` behaves the same. The dev theme's password layout is only reachable through `http://127.0.0.1:9292/password`. All C0.2/C0.7/C0.11/C0.17/E5 password checks above ran against `127.0.0.1:9292`. Playwright worked against it for this page (no 502). QA instructions in `CLAUDE.md` say to avoid localhost; consider adding this exception to `### QA`.

### N2 — NIT: E12 as written does not occur

See the E12 row. The baseline `base.css` already collapses table borders, so the plan's described change (2px spacing disappearing) cannot be observed. No action needed beyond correcting the plan text; the fallback rule is moot.

### N3 — NIT, not in the Coder's list: hamburger glyph grows about 12% at 375

`.theme-evolution-header-menu__toggle svg path`: 29.7 x 26.7 px to 33.4 x 30 px (the open-icon span is now 70.4 px square instead of 32 x 66.4). Visible as longer lines in `t0-after-home-375.png`. Likely related to the same cascade flip as F1.

### N4 — NIT, note for the owner: unclassed buttons read as plain text, including "Add to cart"

On the product page the native "Add to cart" and "Share" buttons lose their grey chrome and look like plain text (`t0-after-wax-drawer-1440.png` vs `t0-base-wax-drawer-1440.png`). This is E3 as written (the cart-add button is unclassed in `product-form`), and T2 will restyle it, but until then the primary CTA has no button affordance. The Shopify dynamic checkout button is unaffected. Same for the cart's Update/Checkout controls (they keep a 1px outline from the D6 input/submit rule). Layout side effect: the buy-buttons block shrinks 2 px (100 to 98 px), `.product-info` 8 px shorter on `the-3p-fulfilled-snowboard`/`the-complete-snowboard`.

### N5 — NIT: the Coder's `B_rb` was declared invalid and substituted; my measurement is valid

See `B_rb`. No action required; the figure agrees with the Coder's substitution (1.13x).

## For owner acceptance

Please accept or reject each. If rejected, the plan's fallback applies and the Coder re-runs the A/B.

1. **Q9: accept E7 to E13** (link color inherit, classed-link underline removed, transparent input backgrounds, placeholder color, iframe/embed block, table collapse, h6). Observed: E7 yes (126 links), E8 yes, E9 yes, E10 yes (Coder), E11 only Shopify iframes, E12 not observable (N2), E13 not observable.
2. **E3 is broader than written.** Buttons also change font-family (Arial to Work Sans), font-size (13.33 to 16 px) and text color (black to `rgb(51,51,51)`). Confirmed: 50 buttons, 60 spans and 42 svg inside buttons in the dump. Heights/widths of unclassed buttons change (for example "Add to cart" 80x21 to 88x19; Checkout 94x32 to 80x28).
3. **Unclassed inputs** change from a 2px inset border to 1px solid `currentColor` with padding 0 (from `1px 2px`), so they are 4 to 6 px smaller (cart input 257x32 to 251x28; height 25 to 21 px on product/password inputs). Confirmed.
4. **Buttons get `cursor: pointer`** (D6, permanent). Confirmed on buttons, their spans and svgs; no layout effect.
5. **`small` renders at 80%** (12.8 px vs 13.33 px; 2 hidden payment-button helper elements) **and `html` font-family changes** (Times to Work Sans). Confirmed; both invisible on the tested pages.
6. **Header SVG and cart-badge computed sizes flip.** Confirmed, but **not invisible**: this is F1 (cart icon to ~45%) plus N3 (hamburger +12%). The Coder's "no visible change" is incorrect at least for the cart icon. Needs an explicit decision.
7. **E1 deviation:** close icon hidden as planned, but `X_hdr`/`X_page` did not shrink at 320/375/390/430 (table above). Confirmed; contradicts the plan's "about 32 px". The mobile overflow bug is not reduced by T0.
8. **E5 (password page) and E14 (gift card)** as written: heading becomes body-size regular text and the password submit button becomes bare text. Confirmed and visible to anyone who opens a protected storefront; the page is plain and unstyled until T4.
9. **E3 consequence on the product page (N4):** the "Add to cart" button looks like plain text until T2.

## `B_rb` against baseline

Method per §0 and C0.10: fresh context (empty cache, storage state only carries the password cookie) per page; hrefs of `head link[rel=stylesheet]` matched to resource entries; sum of `encodedBodySize`; same-origin entries only counted, cross-origin entries listed (R2-N5). Baseline measured independently on the **live theme #138872651872** (published, still serving `critical.css`) instead of relying on the Coder's figures.

| Page | Baseline `B_rb0` (live, pre-T0) | After (dev theme) | Ratio | Valid? |
|---|---|---|---|---|
| `/` | 15,907 (critical 554, base 10,802, eco-tooltip 559, accelerated-checkout 1,598, compiled styles 2,394) | 17,970 (tailwind 2,605, base 10,813, eco-tooltip 560, accelerated-checkout 1,598, compiled styles 2,394) | **1.130x** | Yes: 5 head links = baseline count of 5, every href matched, no zero-size entries |
| `/products/the-3p-fulfilled-snowboard` | 15,907 | 17,970 | **1.130x** | Yes |

Cross-origin entries excluded: none (all five head stylesheets, including the Shopify `accelerated-checkout.css`, are served from the store origin). Budget 1.15x: within. The Coder's baseline (15,910) agrees with mine to 3 bytes. `tailwind.css` costs 2,605 B on the wire vs 554 B for the old `critical.css`, which is the whole delta (+2,051 B) apart from small changes in `base.css` and `eco-tooltip.css`. Headroom to 1.15x is about 330 B.

## Console, network, accessibility, performance

- Console: no new errors or warnings versus the base A/B run. Pre-existing: the 404 page's resource 404 (expected for the 404 test URL), Shopify monorail/metrics "Failed to fetch" on product pages in headless Chromium, and the CORS/framing errors on the localhost password page (both modes). The Coder's `favicon.ico` 404 was not reproduced in my runs.
- Network: no failed or missing theme assets. `tailwind.css` is requested on every page including password and gift card; `critical.css` is requested nowhere. One 502 appeared once in the base run on the ski-wax page (a Shopify-side request; the same page loaded 200 with 0 errors in the after run).
- Accessibility (limited; QA scope was the CSS foundation): headings H1 = 1 everywhere. Unclassed buttons keep their accessible names; the visual affordance loss in N4 is the only a11y-relevant change. Hamburger/close icon swap was not re-audited for ARIA beyond the visual check.
- Performance: no trace taken. `tailwind.css` is preloaded as before; the extra 2,051 B on the wire is the only measured cost.

## BLOCKED or not covered

| Item | Why |
|---|---|
| Theme editor (Customize) | Admin login required. `https://theme-evolution-os2.myshopify.com/admin/themes/187953938528/editor` redirected to `accounts.shopify.com` (login page); no admin session is available to QA. Not exercised: preview in the editor, section settings. T0 changes no section settings, so risk is low, but it is untested |
| Supercycle app embed (C0.13, "on live, after deploy") | Not testable before deploy; the dev theme shows no app embed in `head` (no cross-origin stylesheet) |
| Materials page URL | Used `/pages/the-material-archive` (the Coder's URL; it returned 200 and rendered), not independently confirmed from admin |
| C0.16 "edit a section and see it update" | Needs a code edit; only the watcher rebuild and the dual-process start were verified |
| E4, E13 | No unclassed list, rich text or `h6` on any tested page |
| Gift card | Reached through the dev server's `/gift_cards/66420244576/preview` route (store id from the page's `shopId`), so E14/C0.2/C0.7(c) were rendered, not just static |

## Screenshot index (`docs/qa/screenshots/`, gitignored)

Naming: `t0-<mode>-<page>-<width>.png`, mode `base` (old CSS) or `after` (T0). Pages: `home`, `p3p` (the-3p-fulfilled-snowboard), `wax` (selling-plans-ski-wax), `snow` (the-complete-snowboard), `coll` (/collections/all), `cart` (empty cart), `search`, `mat` (material archive page), `404`, `pw` (password page via 127.0.0.1:9292). Extra: `t0-<mode>-wax-buy-<w>.png` (buy area before add), `t0-<mode>-wax-drawer-<w>.png` (cart drawer open), `t0-<mode>-cartfull-<w>.png` (cart page with one line item), `t0-<mode>-giftcard-375.png`, `t0-pw-inspect-375.png` (the store-origin default password page, see N1). Key comparisons: `t0-{base,after}-home-1440.png` and `t0-{base,after}-cartfull-1440.png` (F1), `t0-{base,after}-home-375.png` (E1, N3), `t0-{base,after}-pw-375.png` (E5), `t0-{base,after}-wax-drawer-1440.png` (N4).

## Reproducibility

Reusable harness (committed path, not session scratch): `docs/qa/harness/t0-ab.mjs` (A/B dump), `t0-diff.mjs` (aggregate diff), `t0-extra.mjs` (widths, C0.4 to C0.6, `B_rb`), `t0-cart.mjs`, `t0-cartpage.mjs`, `t0-gift.mjs`, `t0-icons.mjs`, `t0-pw.mjs`, `t0-lib.mjs`. They read the storefront password from `docs/dev-fixtures.md` themselves; it is not written anywhere. Dev servers started by QA (`shopify theme dev`, and `npm run dev` for C0.16) were stopped; no processes remain.

FAIL


## Re-run (after 4d5e8c9)

Date: 2026-10-22. Code under test: `main` at `4d5e8c9` ("fix(header): restore header icon sizes via shims-layer rule"). Same A/B method as above (old `critical.css` and unwrapped old `base.css` from `2866f5f` served by request interception, against the real current files), same dev theme #187953938528, run via committed scripts in `docs/qa/harness/` (new: `t0r-icons.mjs`, `t0r-badge.mjs`, `t0r-cart.mjs`, `t0r-ab.mjs`; the last two are copies of `t0-cart.mjs`/`t0-ab.mjs` that write `t0r-` screenshots so the previous run's screenshots are not overwritten). Tool: Playwright library (the password must not appear in tool calls). Chrome DevTools MCP not needed. One incident: after about 60 page loads in a few minutes Shopify returned 429 "Verifying your connection" to the logged-in session; it cleared in about 7 minutes and the runs were repeated. Not a code issue.

### Re-run verdict: PASS WITH NITS

F1 is resolved. Nothing new is a blocker. Items on the owner-acceptance list are still pending (they are not blockers for this verdict).

### 1. F1 verification: RESOLVED

Header glyph and SVG boxes, old CSS (base) vs current (after), from `t0r-icons.mjs` (width x height in px). Identical base vs after in all 16 cases: `/` and `the-3p-fulfilled-snowboard` x 1440 and 375 x empty cart and one item (item added through `cart/add.js`).

| Element | base (pre-T0) | after (4d5e8c9) | previous run's "after" (F1) |
|---|---|---|---|
| Cart glyph (`svg path`) | 30.6 x 39.2 | 30.6 x 39.2 | 13.9 x 17.8 |
| Cart svg box | 70.4 x 70.4 | 70.4 x 70.4 | 70.4 x 32 |
| Account glyph | 28.6 x 30.3 | 28.6 x 30.3 | 28.6 x 30.3 |
| Account svg box | 32 x 32 | 32 x 32 | 70.4 x 32 |
| Hamburger glyph (375 only) | 29.7 x 26.7 | 29.7 x 26.7 | 33.4 x 30 |
| Hamburger svg box (375) | 32 x 32 | 32 x 32 | n/a |
| Cart glyph / svg position (x, y) | 1345,8 / 1324,-3 (1440) and 364,8 / 343,-3 (375) | same | n/a |
| Account glyph position | 1274,17 (1440), 293,17 (375) | same | n/a |

At 1440 the hamburger is `display: none` in both modes (0x0), as before. N3 (hamburger +12%) is resolved as well; what remains is the 16 px position shift below. The A/B computed-style aggregate (all pages) no longer contains any header `svg` width/height transition: the lines `width 32 -> 300px (svg)`, `width 32 -> 70.4 (svg)`, `height 70.4 -> 32 (svg)` from the previous run are gone. The "one item" cart used my own seeding and also a real product-form click (`t0r-badge.mjs`), and both give the same cart glyph numbers.

Evidence screenshots: `t0r-{base,after}-home-empty-1440.png`, `t0r-{base,after}-home-empty-375.png`, `t0r-{base,after}-home-one-{1440,375}.png`, `t0r-{base,after}-badge-{1440,375}.png`.

### 2. Classification of the two remaining visible differences

**Hamburger glyph +16 px to the right at 375 (left edge 206 to 222; svg box 205 to 221; button 202 to 272.4 in both): (a) E1 consequence, not a new finding, and I agree with the Coder.** Evidence: the button is 70.4 px wide in both modes. In the baseline the open span (32 px) and the close span (32 px) are both flex children, together 64 px, centred in 70.4 px: the open span starts at 202 + (70.4 - 64) / 2 = 205.2 (measured 205). With the close span `display: none` (E1), the open span alone is centred: 202 + (70.4 - 32) / 2 = 221.2 (measured 221). The difference is (32 / 2) = 16 px. The A/B diff confirms the only header-span changes are `display flex -> none` on the close span (18 instances) and the open span's height 66.4 -> 70.4. Also seen in the baseline screenshot `t0r-base-home-empty-375.png`: the hamburger and the close X sit side by side in a grey outlined box (a visible baseline bug), and `t0r-after-home-empty-375.png` shows one clean, centred hamburger. So the shift is the visible result of the E1 fix. I do not consider it a regression, but it is a visible change and goes on the owner list (see item 10 below).

**Cart count badge 22.4 x 70.4 tall capsule to 22.4 x 22.4 round: (c) was previously reported only in passing (F1 text, "looks like an improvement"), not listed in E1-E14. In the plan's E6 sense this is an unlisted visible change that needs the owner's accept. It is not a new defect.** Measured with one item (real add-to-cart click on `selling-plans-ski-wax`, 1440 and 375): base `.header__cart-count` 22.4 x 70.4 at (1362,6) / (381,6), after 22.4 x 22.4 at the same position; `border-radius` 999px, white background, `position: absolute` in both. Cause (matches the Coder): unlayered `.header__cart-count { height: 1.4rem }` (header.liquid) now beats legacy `.header__icon span { height: 100% }`. Screenshots: `t0r-base-badge-1440.png` (white capsule hanging below the bag, covering part of it) vs `t0r-after-badge-1440.png` (round "1" badge on the bag's top-right corner). It reads as the intended design. Accepting is low risk; T1 rewrites the header either way.

Neither one is a blocker.

### 3. Shim over-reach: none found

The shim selectors are `.header__icon .icon` and `.header__icon--cart .icon` (both `!important`, in `@layer shims`). Checks:

- DOM scan on `/` (1440 and 375): the selectors match exactly 4 elements: `icon-hamburger` and `icon-close` inside the menu toggle button, `icon-account` and `icon-cart`. Nothing outside the header.
- Static: `rg` over `sections/ snippets/ blocks/ layout/ templates/` finds `.header__icon` classes only in `sections/header.liquid` (3 elements). The stray `.icon` div in `sections/hello-world.liquid` has no `.header__icon` ancestor, so it is not matched (and the shim does not fix or break that rule; it only wins inside `.header__icon`). The cart drawer's `.header__icon--cart` references are JS selectors for refreshing the header icon; the replacement node has the same classes, and the glyph is still 30.6 x 39.2 after an add-to-cart (checked on the real flow above).
- Mobile menu panel open at 375 (home, empty cart): panel 335 x 161 at (20,64), four links 271 x 16, no svg inside the panel, close svg 34.2 x 34.2 (scale 1.07 hover/active transform), in both base and after: identical. The shim does not touch `transform`, so the hover scale and the menu icon transitions are intact. The only visible difference with the menu open is the baseline's grey outlined button box being gone (E1, already reported). Screenshots `t0r-{base,after}-menu-open-375.png`.
- Cart drawer (`selling-plans-ski-wax`, add to cart, drawer open, 1440 and 375): drawer element, class `cart-drawer drawer is-active is-open`, one line, header close icon, total, same text and layout; header count 1; 0 console errors in both modes. Header `z-index` 3 -> 10 (E2) and the "Add to cart" button size 80 x 21 -> 88 x 19 (E3) are the only differences, as before. Screenshots `t0r-{base,after}-wax-drawer-{1440,375}.png`.
- Caveat for T1, not a defect: `!important` on `width`/`height` means that a merchant or later rule cannot resize these icons without also using `!important` until the shim is deleted. The Coder marked it for deletion in T1; I recommend T1's checklist keep it explicitly (see the carry-forward list).

### 4. Regression checks

| Check | Result |
|---|---|
| `npm ci && npm run check:css` | exit 0 (rebuild byte-identical to the committed `assets/tailwind.css`, file tracked, layer gate green) |
| `npm run check:hidden` | exit 0 |
| `shopify theme check` | 62 files inspected, 2 offenses in 2 files: `TranslationKeyExists` (`cart-drawer.liquid`) and `UnusedAssign` (`card-product.liquid`). Exactly the 2 baseline offenses |
| `assets/tailwind.css` size | 9,338 B minified, 2,896 B gzip -9 (previous run 9,202 / 2,855). Budget 25,000 / 12,000: 37% / 24%. Matches the Coder's figures |
| Layer order (C0.2), `base.css` contained (C0.3), `.grid` utility (C0.4), `P_btn` (C0.5), `.product-grid` (C0.6) | Same as before: first rule `properties,theme,base,legacy,components,utilities,shims`; `base.css` top-level = `CSSLayerBlockRule:legacy`; probe `.grid` `display: grid`; `P_btn` padding-left 48 px; `the-complete-snowboard` `ul.product-grid` `display: flex`, 4 cards, widths 397 / 296.5 / 277.4 / 269, 1 row |
| `B_rb` (C0.10) | dev theme `/` and `the-3p-fulfilled-snowboard`: **18,008 B** (tailwind 2,643, base 10,813, eco-tooltip 560, accelerated-checkout 1,598, compiled styles 2,394). Live theme (pre-T0, published) 15,907 B (critical 554, base 10,802, eco-tooltip 559, accelerated-checkout 1,598, styles 2,394). Ratio **1.132x** (limit 1.15; previous 1.130x). Valid: fresh context, 5 head links both sides, no zero-size entries, no cross-origin entries. Headroom to 1.15x is about 285 B; the shim cost 38 B on the wire |
| Full A/B diff (9 pages x 2 widths, base vs after, plus password page via 127.0.0.1:9292) | 125 distinct property transitions (previous 130). Compared by key with the previous aggregate: nothing new that is not mapped. Dropped vs the previous run: the 3 header `svg` width/height lines (the F1 fix) and 7 content-timing lines (lazy "related products" height, body height, a few late-loaded `div` widths; these came from late JS in the previous dumps, not CSS). New keys vs the previous aggregate: 5 lines, all from the password page and all E5, as I ran the dump through `127.0.0.1:9292/password` this time so they show up in this file: `h1` 32 -> 16 px, 700 -> 400, `h1` height 38 -> 19, `div.shopify-section` height 63 -> 40, submit `button` width 47.9 -> 42.5. The remaining header-region lines are exactly E1 (close span `display: flex -> none` x18, `span` height/width on the open/close spans at 375), E2 (`z-index`), E3 and the E7-E9 set, and the `.header__cart-count` 100% -> 22.4 px height (the badge above) |
| H1, console | `H1` = 1 on all pages. No console errors during the cart-drawer A/B in either mode (0 and 0). The page-level console set in the A/B dump is the same pre-existing set as before (404 page, monorail) |
| `X_hdr` / `X_page` at 320/375/390/430/1440 on `/` and `the-3p-fulfilled-snowboard` | Unchanged and identical base vs after: 71.2 / 38.2 / 29.2 / 5.2 / -20 (header), 76 (home) / 71 (product) at 320 for the page. This is the E1 deviation carried forward |
| Working tree | No tracked file changed; only untracked `docs/qa/harness/` and this report and the two pre-existing design PNGs. No `.approved`, no commit, no push. The dev server (`shopify theme dev`) was started once and stopped; no processes or listeners remain on 9292 |

### 5. Carry-forward status

**Nits** (status after the re-run):

| ID | Status |
|---|---|
| F1 | RESOLVED (section 1) |
| N1 password page not inspectable via the preview URL | Unchanged. Still reachable only on `127.0.0.1:9292/password`; the `CLAUDE.md` `### QA` exception is still a good idea |
| N2 E12 does not occur as written | Unchanged, plan text correction only |
| N3 hamburger +12% at 375 | RESOLVED (glyph 29.7 x 26.7 = baseline). The 16 px position shift remains (section 2, owner item 10) |
| N4 unclassed buttons, including "Add to cart", read as plain text until T2 | Unchanged. Re-confirmed in `t0r-after-wax-drawer-1440.png` ("Add to cart" is bare text, 88 x 19) |
| N5 Coder's `B_rb` invalid, mine valid | Unchanged; my figure is now 1.132x |
| N6 (new, tiny) | The shim values are `!important` on header icon size. Fine for T0; make sure T1's "remove shims" step lists these two rules by name (they are tagged "Delete in T1" in `src/tailwind.css`) |

**For owner acceptance** (still all pending; item 6 reworded, items 10 and 11 added):

1. Q9: accept E7 to E13 (link color inherit, classed-link underline removed, transparent input backgrounds, placeholder color, iframe/embed block, table collapse, h6). Observed E7 yes (126 links), E8 yes, E9 yes, E10 yes (Coder), E11 only Shopify iframes, E12 not observable (N2), E13 not observable. Unchanged.
2. E3 is broader than written (buttons also change font-family, font-size, text color; unclassed button sizes change). Unchanged.
3. Unclassed inputs: 2px inset border to 1px solid `currentColor`, padding 0, 4 to 6 px smaller. Unchanged.
4. Buttons get `cursor: pointer` (D6, permanent). Unchanged.
5. `small` renders at 80% and `html` font-family changes (Times to Work Sans). Unchanged.
6. **Header SVG and cart-badge computed sizes flip: updated.** The visible part (cart icon at 45%, hamburger +12%) is fixed. What remains are the computed-only `svg`/`span` size differences that no longer change the rendering (none in the final A/B), plus the two visible changes in items 10 and 11. Please accept or reject as a group.
7. E1 deviation: close icon hidden as planned, but `X_hdr` / `X_page` did not shrink at 320/375/390/430 (table above). The mobile overflow bug is not reduced by T0. Unchanged.
8. E5 (password page) and E14 (gift card): headings become body-size regular text, the password submit button becomes bare text. Unchanged.
9. E3 consequence on the product page (N4): "Add to cart" looks like plain text until T2. Unchanged.
10. **New to the list:** hamburger glyph sits 16 px further right at 375 (left edge 206 to 222). Cause is E1 (the hidden close span no longer shares the 70.4 px button with the open span). It also removes the baseline's grey outlined button box with the overlapping X, so the result is cleaner than the baseline. Accept or reject; if rejected the fix is a `margin-right` of 32 px on the open span or similar at 375, and T1 rewrites this control anyway.
11. **New to the list:** cart count badge changes from a 22.4 x 70.4 white capsule hanging over the bag to a 22.4 x 22.4 round badge at the top-right of the bag (1440 and 375, one item). It looks like the intended design. Accept or reject; if rejected the fix is a second `!important` shim `.header__cart-count { height: 100% }` (not recommended).

**BLOCKED / not covered** (status: all unchanged):

| Item | Status |
|---|---|
| Theme editor (Customize) | Still BLOCKED (Shopify admin login). Not exercised. Header icon sizes in the editor preview use the same CSS, so low risk, but untested |
| Supercycle app embed (C0.13, after deploy) | Still BLOCKED until deploy |
| Materials page URL | Unchanged (`/pages/the-material-archive`, not confirmed from admin) |
| C0.16 "edit a section and see it update" | Unchanged (needs a code edit; watcher rebuild already verified) |
| E4, E13 | Unchanged (no unclassed list, rich text or `h6` on any tested page) |
| Gift card | Not re-run this time (nothing in 4d5e8c9 touches it; the layer statement and `tailwind.css` link are checked by the gate). The previous run's E14 evidence stands |
| `B_rb` in the app-embed case | Not applicable until the app embed is live |

### Re-run screenshot index (`docs/qa/screenshots/`, gitignored)

`t0r-{base,after}-home-{empty,one}-{1440,375}.png` (header strip, 160 px tall), `t0r-{base,after}-badge-{1440,375}.png`, `t0r-{base,after}-menu-open-375.png`, `t0r-{base,after}-wax-buy-{1440,375}.png`, `t0r-{base,after}-wax-drawer-{1440,375}.png`, and the A/B set `t0r-{base,after}-{home,p3p,wax,snow,coll,cart,search,mat,404,pw}-{1440,375}.png`.


## Owner decisions (2026-10-22)

The owner (Junior Warner) accepted **all 11 items** in the re-run's "For owner acceptance" list, including Q9 (E7–E13): "I approve of everything, this is phase 0 so all those items will be fixed in subsequent updates."

| # | Item | Decision | Expected resolution |
|---|---|---|---|
| 1 | Q9: Preflight link and input changes (E7–E13) | Accepted | Permanent baseline |
| 2 | E3 broader than written: button font-family, size (13.33 → 16px), color | Accepted | T1–T4 restyles |
| 3 | Unclassed inputs 4–6px smaller, 1px solid border | Accepted | T4 |
| 4 | `cursor: pointer` on buttons (D6) | Accepted | Permanent |
| 5 | `small` at 80%, `html` font-family change (not visible) | Accepted | — |
| 6 | Header SVG computed-size differences (computed only) | Accepted | T1 (shim deleted, N6) |
| 7 | E1 deviation: `X_hdr`/`X_page` not reduced | Accepted | T1 (44px icons) |
| 8 | E5/E14: password-page and gift-card headings plain, password submit bare | Accepted | T4 |
| 9 | N4: "Add to cart"/"Share" render as plain text | Accepted | T2 |
| 10 | Hamburger 16px right at 375 (E1 consequence) | Accepted | — |
| 11 | Cart badge round instead of capsule | Accepted | T1 |

Still BLOCKED and not covered by this acceptance: the theme editor check (no admin login) and the Supercycle app embed check (post-deploy). These remain operator checks on the staging theme.

PASS WITH NITS
