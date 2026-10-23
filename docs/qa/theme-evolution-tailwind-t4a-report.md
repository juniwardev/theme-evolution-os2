# QA report: Tailwind phase T4a (cart)

Slug: `theme-evolution-tailwind-t4a`. Plan: `docs/plans/theme-evolution-tailwind-t4a.md` (Rev 2.1, review APPROVE). Head `de08107` (branch main), base `41b5f1a`.
Date: 2026-10-23. QA wrote only under `docs/qa/`; no application code, no commits, no git push, nothing pushed to any theme but the private development theme #187953938528.

## Summary verdict

**PASS WITH NITS.** No blocker. Every criterion C4a.0 to C4a.22 that QA can run passes on its own measurements, taken independently of the Coder's `t4ac-*` evidence. The nits are all either pre-existing behaviour, already named in the plan as owner checks or follow-ups, or small observations (section "Nits").

Not verifiable by QA (owner or editor needed): the theme editor preview, owner checks 1 to 3 on staging, C0.13 dynamic-checkout app embed on live. See "Could not verify".

## Method and tools

- Playwright (Chromium, scripted from `docs/qa/harness/t4aq-*.mjs` through `/opt/homebrew/lib/node_modules/playwright`). The Playwright MCP was not used: this QA is dominated by width sweeps, route-delayed requests and computed-style diffs across two trees, which the task brief treats as the bulk-measurement exception. Chrome DevTools MCP was not used.
- Dev server: `shopify theme dev` on #187953938528, one server at a time. Head from the repo root. Base from a `git archive 41b5f1a` copy and head `git archive` copies (for the PX settings proxies) in the scratchpad, served with `--path`. At the end the dev theme was re-synced from the repo root (head, default settings: `--color-foreground` `#333333`, drawer enabled) and every server was stopped (`pgrep` shows none). Live #138872651872 and staging #187953643616 were never touched.
- Storefront login: `t0-lib.mjs` reads the password from `docs/dev-fixtures.md`. It was never printed, logged or written by QA; the session cookie was cached in a scratchpad state file (`T4AQ_STATE`).
- Cart seeding through the product form (Cloudflare 429s the Ajax `.js` endpoints), fresh context per cart state. Quantity changes: `fill()` then `blur()`.
- Reuse: `t0-lib.mjs` (login) and, for the in-page drawer element measurer only, `measureDrawerFn`/`PROPS` from the Coder's `t4ac-lib.mjs` (used by `t4aq-capture.mjs`). The comparison (`t4aq-diff.mjs`), the sweep, the state/flow tests, the cart page probe, the proxy runner and the wrapper compare are QA's own.

### Scripts written (all under `docs/qa/harness/`, uncommitted)

| Script | Does |
|---|---|
| `t4aq-lib.mjs` | login cache, fresh-context page with console/pageerror/4xx collectors, form seeding, host-state probe |
| `t4aq-drawer.mjs` | C4a.5, C4a.6, C4a.11 rendered half: closed, add, Escape, icon, overlay click, close button, busy overlay, remove to empty, rapid toggles at 1440/430/375/320 |
| `t4aq-flow.mjs` | Add to cart spinner, snowboard add, two items, checkout style, R1 race, 3p 422 |
| `t4aq-p3p.mjs` | 422 recovery on the Add to cart button (head and base) |
| `t4aq-cartpage.mjs` | `/cart` structure, geometry, overflow at 320 to 1920 (empty, one, two), Update and remove flows (base and head) |
| `t4aq-img.mjs` | cart image attributes and what is downloaded |
| `t4aq-sweep.mjs` | C4a.3, C4a.4, C4a.16, C4a.17(b) |
| `t4aq-capture.mjs`, `t4aq-diff.mjs`, `t4aq-matdiff.mjs` | regression screenshots (16 pages/states x 2 widths), drawer geometry diff, pixel diff |
| `t4aq-wrappers.mjs` | C4a.20 image wrapper geometry on `/collections/all`, `/collections`, `/search` |
| `t4aq-proxy.mjs` (+ scratchpad `runpx.sh`) | PX1 to PX4 on base and head scratch copies |
| `t4aq-misc.mjs`, `t4aq-scroll.mjs`, `t4aq-r1base.mjs` | add with drawer open, tab order, site-wide overflow, scroll lock, R1 baseline |

Screenshots (gitignored): `docs/qa/screenshots/t4aq-{base,head,head2,headcopy}-*.png`.

## Gates (re-run by QA)

| Criterion | Result | Evidence |
|---|---|---|
| C4a.0 `npm ci && npm run check:css` | PASS, exit 0 (clean tree, no tracked changes after) | shell |
| `npm run check:hidden` | PASS, exit 0 | shell |
| C4a.1 `shopify theme check` at HEAD | PASS: "72 files inspected with no offenses found" | shell |
| C4a.2 schema shasums (cart-drawer `1451daac3983`, cart `dad689eabfb5`, product `5afd8626a04a`) | PASS: base equals head | shell |
| C4a.13 size | PASS: `assets/tailwind.css` 44,667 bytes, 9,437 gzip -9 (budget 60,000 / 12,000) | `wc -c`, `gzip -9 -c` |
| Protected paths | PASS: `git diff 41b5f1a HEAD` touches only `locales/en.default.json` (+`cart.empty`, `cart.close`) among config/templates/locales/layout/src/js. `config/settings_data.json`, templates, layout, `src/`, `assets/*.js` untouched | shell |
| No `{% include %}` | PASS | `rg` |
| C4a.7(a) | PASS: `animate-spin` only in `snippets/spinner.liquid`; no `<svg` in `sections/product.liquid`; `render 'spinner'` in `product.liquid:98` and `cart-drawer.liquid:78` | `rg` |
| C4a.11 static | PASS: the `rg` prints nothing (exit 1). CLAUDE.md QA bullet and backlog note updated as Step 6 describes | `rg`, `git diff` |
| C4a.17(a) | PASS: diffing the two `<script>` blocks shows only `open()`, `close()` and the three `is-loading` lines changed. `getSectionsToRender()`, `renderContents()`, `.join(',')`, `sections_url`, aria-label sync are byte-identical | `diff` of extracted scripts |

## Acceptance criteria (dynamic)

All at head unless noted. Widths are those the criterion names.

| ID | Result | What QA observed |
|---|---|---|
| C4a.3 | PASS | 0 unlayered rules match any element under the T4a roots on `/cart` (empty, one item) and wax with drawer closed, open (one item), busy and empty, at 375 and 1440 (`t4aq-sweep`) |
| C4a.4 | PASS | Legacy-layer class intersection: drawer `{uppercase}`; `/cart` main `{uppercase, overflow-hidden}`; Add to cart at rest `{loading__spinner, hidden}` (the allowed JS hooks). Only childless `div` is the overlay, computed `display: block` |
| C4a.5 | PASS | At 1440, 430, 375 and 320. Closed: `hidden`, `data-state="closed"`, display `none`, no `is-*` classes, 0 focusable elements inside. Open: no `hidden`, `data-state="open"`, panel right = viewport, width 400 (1440, 430), 375 and 320 at those viewports, overlay `block`/opacity 1, body overflow `hidden` and no `style` attribute. Escape, header icon, close button all return to closed and body overflow `visible`. Overlay click at (10, 400) closes at 1440 and 430. At 375 `elementFromPoint(10,400)` is inside the dialog. Real wheel scrolling: page scrollY stays 600 while open, scrolls again after close (1440 and 375) |
| C4a.6 | PASS | Wax and the complete snowboard add: drawer opens with the item, `/cart/add` request body carries `sections`, badge shows count, header link `aria-label` "1 item", then after quantity 3 (delayed 1.5 s `/cart/change`): `aria-busy="true"`, busy overlay `visible`, spinner CSS size 32 x 32, centred on the panel (offset 0, 0), `animation-name: spin`; after: no `aria-busy`, badge 3, aria-label "3 items". Remove to empty: "Your cart is empty." and a `btn-primary` "Continue shopping", footer gone, badge empty, aria-label "0 items". Same at 1440, 430, 375, 320. 3p snowboard: `/cart/add` 422, drawer stays closed, button recovers (no `loading`, no `aria-disabled`), drawer still opens afterwards with the empty state. Two items: total "$724.90 USD". Add to cart again with the drawer open (focus is still on the button, Enter): quantity 2, badge 2, drawer stays open with fresh contents |
| C4a.7(b) | PASS | During a 1.5 s delayed `/cart/add`: wrapper `loading__spinner absolute inset-0 size-full` displayed (no `hidden`), SVG class tokens `size-5 animate-spin absolute inset-0 m-auto`, 20 x 20 computed, centred in the button (offset 0, 0), `aria-disabled="true"` |
| C4a.8 | PASS | `t4aq-diff geom` on base vs head, empty/one/two at 1440 and 375: every element's x, y, w, h within 1 px except the E4a rows (overlay shown E4a.1; heading Oswald 700 uppercase 25 px E4a.4; item title 18 to 51 E4a.5; item border 242 to 243 E4a.6; checkout and empty-state link `btn-primary` E4a.2/.3; busy overlay new E4a.10). Header and footer border colours change by about 1 channel as listed. No unlisted diff |
| C4a.9 | PASS | `/cart` with two items: 0 `<table>`, 2 `li`, exactly two submit buttons, the second `name="checkout"`. Field 1 set to 2, Update: page reloads at `/cart`, quantity 2, badge 3. Remove link on row 2: one row remains, badge 2. Empty cart: no `form`, "Your cart is empty.", `a.btn-primary` to `/collections/all`. Form `action="/cart"`, `method="post"` |
| C4a.10 | PASS | One item at 320, 375, 768, 1440, 1920: `h1` left 52 = `ul` left = first `li` left (T3 content edge); image column 80; quantity field 80 x 44; Update 48 high, Checkout 48 high, right-aligned (right edge `w - 52`); `h1` 30 px below 768 and 36 px from 768, Oswald, uppercase; root padding 40 at 375 and 64 at 1440. At 320 the two buttons wrap onto two rows without overflow, as the plan predicts |
| C4a.12 | PASS | `/cart` overflow (`scrollWidth - clientWidth`) is 0 for empty, one and two items at 320, 375, 390, 430, 768, 1440, 1920. Base, measured by QA at 320, 375 and 430 (390 not run on base): one item 172, 117, 62 px; two items 208, 153, 98 px; empty 0. Drawer open at 320: panel 0..320 |
| C4a.14 | not independently re-measured | Coder's figures stand. QA only confirms the bundle is the one in C4a.13 |
| C4a.15 | PASS | PX2 (`#ee1188` on `#112233`, `--color-foreground` precheck read `#ee1188`/`#112233`), drawer open, one item, 1440: panel `rgb(17,34,51)` (base stays white), item title `rgb(238,17,136)` (base stays 18), header border changes; remove link stays `rgb(211,47,47)`; banner (PX3) stays `rgb(232,245,233)`/`rgb(46,125,50)`; checkout `rgb(227,252,1)` in both default and palette runs. Base is red on panel and title, as the plan predicts. Screenshot `t4aq-headcopy-px2-drawer-1440.png` |
| C4a.16 | PASS | Every `img` under the T4a roots has `width`/`height` (cart: 160 x 160; drawer: 150 x N). Drawer headings `H2, H3`. `H1` count is 1 on `/cart`, and 1 on wax with the drawer open. `/cart` response `Link` header carries 6 preload entries (<= 10). Cart image request is `width=160` (1.4 KB), no preload |
| C4a.17(b) | PASS | `fetch('/?section_id=cart-drawer')` returns HTML with exactly one `.cart-drawer__inner` |
| C4a.18 | PASS | PX1 (`enable_cart_drawer` false): no `cart-drawer`, 0 `[data-cart-drawer-trigger]`, header cart link `href="/cart"`; Add to cart on wax navigates to `/cart` with one row; clicking the icon stays on `/cart` |
| C4a.19 | PASS | PX3 banner forced on, base vs head, drawer at 1440 and 375: rect (20, 73, 360/335 x 104), bg, border colour/width, colour, padding 15/20, radius 8, margins 0/20/24/20, weight 600, size 16, line-height 24, centre: all equal. On `/cart` only x 40 to 72 and the width shrink (E4a.16) |
| C4a.20 | PASS | `/collections/all`, `/collections` and `/search?q=snowboard` at 375 and 1440: 15, 3 and 15 image wrappers; 0 geometry or computed-style diffs between base and head (wrapper rect, `img` rect, display, position, overflow, width, height). Every head wrapper class is `relative block w-full overflow-hidden` plus the caller's `css_class` |
| C4a.21 | PASS | PX4 (`input_corner_radius` 10): head drawer field 10 px, cart field 10 px. Base drawer field stays 4 px |
| C4a.22 | PASS | Pixel diff base vs head, 10 pages (home, 3 products, `/collections/all`, `/collections`, search, material archive, missing page, `/password`) x 1440 and 375, preview bar hidden: 19 of 20 pixel-identical. One difference: `mat` 1440, 32 pixels in one 8-row band (y 1204 to 1211) inside a `material-archive-card__image` lazy image. Same-tree head vs head2 shows the same kind of difference at 375 (8 px, y 2170 to 2177). That page has no T4a file or `.image` class on it (its `<img>` is in `.material-archive-card__image`), so QA classes it as lazy-image decode jitter. The Coder's `snow` 1440 260 px difference did not reproduce: `snow` is pixel-identical in both of QA's captures. Overflow sweep across the 10 pages at 320, 375, 390, 430, 768, 1440: all 0 except `/collections/all` (200/145/130/90 at 320/375/390/430) and `/search?q=snowboard` (158/103/88/48), both identical on base (T4b scope) |

### Section settings (every select/checkbox/range/color)

`sections/cart-drawer.liquid` and `sections/cart.liquid` have `"settings": []`, so there is no per-section editor setting to exercise. The only merchant settings that reach T4a markup are the theme settings, all driven through the scratch-copy proxy: `enable_cart_drawer` checkbox (PX1, applies), `background_color` and `foreground_color` color settings (PX2, apply to panel, title and header border and correctly leave the fixed red link, the fixed green banner and the accent checkout), `input_corner_radius` range (PX4, applies to both quantity fields). The collection, collections and search sections only changed the snippet parameter name; their settings were not converted in T4a.

## Issues found

No FAIL-level issue. Nothing red.

## Nits and observations (all non-blocking)

1. **Red remove link contrast on a dark palette (classification: accepted limitation, follow-up).** `#d32f2f` on the `#112233` test panel is 3.24:1 (WCAG relative luminance 0.161 vs 0.015, calculated), below 4.5:1 for 0.85 rem text. On the default white panel it is about 4.98:1 (passes). The plan names this (section 4.4, owner check 2) and defers a token-relative danger colour. It only matters if the owner adopts a dark palette. Severity: low, owner decision.
2. **R1 close-then-reopen race remains (pre-existing, plan R1).** `close(); setTimeout(open, 50)` leaves `data-state="open"` with `hidden` set: nothing visible and the page scroll-locked. Base does the same (`is-open` with display none and `body style="overflow:hidden"`, measured with `t4aq-r1base.mjs`). A real user cannot hit it with a mouse click, because the overlay covers the header icon while closing; keyboard or an add-to-cart response arriving mid-close can. Plan keeps it out of T4a; the follow-up is a two-line timer clear in `open()`. Severity: low.
3. **No focus management in the drawer (pre-existing, plan 14.3).** After an add, focus stays on the Add to cart button behind the open drawer. Tab order from there is Buy it now, Material specs, Share, then Close cart and the drawer content: no trap and no initial focus. Improvement over base: while closed, the drawer is `hidden`, so 0 of its controls are focusable.
4. **3p 422 shows no visible error (pre-existing).** `product-form.js` handles an error message only if `.product-form__error-message-wrapper` exists, and `product.liquid` has none, on base too. The user sees the button recover and the console logs a 422 resource error, but no message. The drawer is unaffected. The brief expected "shows an error"; that expectation does not match base or head. Could be a small product-page follow-up. Severity: low.
5. **`/cart` page has no line prices or total, and the quantity field is `type="text"` with no `inputmode` (pre-existing on base; the list redesign did not add them).** Not in the T4a plan; worth a backlog line if the cart page is meant to be a real fallback.
6. **Header cart icon box overflows the content edge at 320, 375 and 390 (T3 deviation 3; unchanged).** Seen again as `headerR` right edge 312/334 vs content right 268/323 at those widths in the cart-page probe.
7. **`/collections/all` and `/search` overflow at <= 430 (pre-existing, T4b).** Identical numbers on base.
8. **Cosmetic, measurement note.** A rotating spinner's `getBoundingClientRect()` is about 40 px (32 px circle rotated), and 22 px for the 20 px Add to cart spinner. The computed CSS size is exactly 32 and 20. Criteria should read the computed size, not the rect.
9. **Analytics noise.** Console shows only Shopify analytics `Failed to fetch`/`ERR_ABORTED` (monorail, `api/collect`, event observer) when contexts navigate or close, plus "preloaded but not used" warnings for `tailwind.css` and `base.css` at 320 (Early Hints). No theme console errors, no page errors, no 4xx other than the expected 422 on the 3p add.

## Console errors and warnings

On the head cart flows (open, add, quantity change, remove, empty, 422, rapid toggles, Update, remove link): 0 theme errors, 0 `pageerror`s. Only the platform noise in nit 9 and the intentional 422 (`Failed to load resource ... 422`) from the 3p product.

## Network failures and slow responses

No failed theme requests. Aborted POSTs to analytics endpoints only. Cloudflare returned no 429 to the product-form add or to `/cart/change` in this run (session cached, form-driven seeding). `/cart` response carries 6 preload Link entries, under the 10 cap.

## Accessibility observations

- Drawer: dialog with `aria-modal`, translated `aria-label`, close button "Close cart" now from `cart.close`; quantity inputs have an `sr-only` label and a named `aria-label`; busy state is `aria-busy` on the host (the spinner is `aria-hidden`).
- Header cart link `aria-label` stays in step with the badge on add, update and remove ("1 item", "3 items", "0 items").
- `/cart` quantity inputs have an `sr-only` label (E4a.15); heading order `H1` only on the page, `H2`, `H3` in the drawer.
- Gaps already listed: no focus trap, no initial focus, no focus return (nit 3); remove-link contrast on a dark palette (nit 1).

## Performance notes

CSS 44,667 / 9,437 (T4a added +2,866 / +448 since Step 0, inside the plan's `ΔS_a`). `/cart` image is a 160 px, 1.4 KB request. Per-page inline CSS (`L_style`) and M_css were not re-measured by QA (Coder's `t4ac-mcss-compare.txt`). No LCP preload was added for cart images.

## Could not verify

- **Theme editor preview** (CLAUDE.md QA bullet: "check the theme editor preview as well"): QA cannot drive the editor. The drawer, cart page and spinner are standard section/snippet renders with no section schema change (shasums equal), so a regression is unlikely, but the owner should open the editor once.
- **Owner checks 1 to 3** on staging (enable_cart_drawer toggle in the live preview, colour change with the drawer open, visual acceptance of Q4a.1 to Q4a.5). The proxies above cover the data, not the live editor behaviour or the owner's taste.
- **C0.13 dynamic checkout on wax and the app embed on live.** The dynamic checkout button renders on the wax page in the drawer screenshot, same as base (pixel-identical product pages); the live app embed is a deploy-time check.
- **C4a.14 M_css and `L_style`**: not re-measured.
- **T1 C1.4, T2 C2.9/C2.14, T3 C3.5 scripts** were not re-run through `t4ac-` copies. QA's equivalents: site-wide overflow sweep, header badge/aria-label sync, T2 spinner geometry, product-page pixel identity, header unchanged in all pixel diffs.
- **Real data banner**: no eco-material fixture exists (wax has none; the complete snowboard's material is `ocean-bound-r-pet`), so the banner was proven through PX3 (markup, not the count logic).
- **E4a.20** (item without an image): no fixture, as the plan allows.

## Screenshots

`docs/qa/screenshots/` (gitignored), prefix `t4aq-`: `head-drawer-{empty,one,two}-{1440,375}.png`, `head-cart-{empty,one,two}-{1440,375}.png`, `base-...` equivalents, `headcopy-px2-drawer-1440.png`, regression set `head-*`/`base-*`/`head2-*`. Reviewed by eye: `head-drawer-two-1440` (dim page behind, lime checkout, oswald heading), `head-cart-two-375` (list, right-aligned Update and lime Checkout), `head-drawer-empty-375` (message, 16 px gap, lime link), `headcopy-px2-drawer-1440` (panel and title follow the palette, green banner and red link fixed).

## Bug-fix lines

Not applicable (feature phase).

## Verdict

**PASS WITH NITS**
