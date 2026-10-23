# Impl notes: Tailwind phase T4a (cart)

Plan: `docs/plans/theme-evolution-tailwind-t4a.md` (Rev 2.1, review verdict APPROVE).
Base: `main` at `41b5f1a` (T3 on staging #187953643616 per `docs/qa/theme-evolution-tailwind-t3-deploy.md`). Work was committed directly on `main` (no feature branch), in the order below. Nothing was pushed to git or to any theme other than the private development theme #187953938528.

## Commits (one per plan step)

| Step | Commit | Files |
|---|---|---|
| 0 | none (baseline only, no edits) | evidence under `docs/qa/evidence/t4ac-*`, committed with the notes |
| 1 | `f0c4ea5` | `snippets/spinner.liquid` (new), `sections/product.liquid` (3 lines to 1), `assets/tailwind.css` |
| 2 | `ba7d52d` | `snippets/image.liquid`, `sections/collection.liquid`, `sections/collections.liquid`, `sections/search.liquid` (`class:` to `css_class:`), `assets/tailwind.css` |
| 3 | `7a7c6ff` | `snippets/cart-intelligence-banner.liquid`, `assets/tailwind.css` |
| 4 | `21d4d88` | `sections/cart-drawer.liquid`, `locales/en.default.json` (`cart.empty`, `cart.close`), `assets/tailwind.css` |
| 5 | `7f4b5f8` | `sections/cart.liquid`, `assets/tailwind.css` |
| 6 | `2439dd0` | `CLAUDE.md` (QA bullet), `docs/backlog/theme-check-cleanups.md` |
| 7 | this notes commit | impl notes, `docs/qa/harness/t4ac-*.mjs`, `docs/qa/evidence/t4ac-*` |

Every commit message ends with the Opus 5.5 `Co-Authored-By` and `Claude-Session` trailers requested in the task. Explicit `git add` paths only.

## Gate results per step (run before each commit)

| After step | `npm run check:css` | `npm run check:hidden` | `shopify theme check` | `assets/tailwind.css` minified / gzip -9 | Growth vs previous |
|---|---|---|---|---|---|
| 0 (T3 final) | 0 | n/a | 1 offense: `TranslationKeyExists` `cart.empty`, `cart-drawer.liquid:18` | 41,801 / 8,989 | n/a |
| 1 | 0 | 0 | 1 (same) | 41,943 / 9,007 | +142 / +18 |
| 2 | 0 | 0 | 1 (same) | 41,943 / 9,007 | 0 / 0 |
| 3 | 0 | 0 | 1 (same) | 42,248 / 9,064 | +305 / +57 |
| 4 | 0 | 0 | **0** | 44,610 / 9,428 | +2,362 / +364 |
| 5 | 0 | 0 | 0 | 44,667 / 9,437 | +57 / +9 |
| 6 | 0 | n/a (docs) | 0 | 44,667 / 9,437 | 0 |
| HEAD (final) | 0 | 0 | 0 ("72 files inspected with no offenses found") | **44,667 / 9,437** | **+2,866 / +448 since Step 0** |

- Budget: 60,000 / 12,000. Final is 15,333 bytes minified and 2,563 gzip under. T4a's growth (+2,866 / +448) is inside `ΔS_a` (2,000-4,000 / 400-800) and inside the proposed 5,000 / 1,000 per-phase threshold. Nothing to escalate.
- T4b headroom for plain `prose` (plan §5.8): 60,000 - 44,667 - 12,591 = 2,742 minified, 12,000 - 9,437 - 1,651 = 912 gzip. So T4b's own utilities must fit in about 2.7 KB minified / 0.9 KB gzip, tighter than the plan's 5,608 / 1,360 because T4a used 2,866 of the 4,000 it was allowed. T4b should plan for the minified breach and ask the owner.

## Step 0 baseline (recorded, then compared at head)

Evidence: `docs/qa/evidence/t4ac-facts-base.json`, `t4ac-dump-base2.json`, `t4ac-sweep-base.txt`, `t4ac-step0-schema-shas.txt`. Base screenshots are under the gitignored `docs/qa/screenshots/t4a-base-*`.

1. Commit `41b5f1a`; `N_tc` = 1; `S_tw` 41,801 / 8,989 (matches the orchestrator's figure).
2. Overlay `display` on base is **`none`** (confirms plan's provisional claim); the click at (10, 400) lands on `DIV.cart-drawer__inner` and the drawer stays open. Open host classes `cart-drawer drawer is-active is-open`, `body` `style="overflow: hidden;"`.
3. Empty drawer message on base renders **"Translation missing: en.cart.empty"** (E4a.9 confirmed); the continue link computes `padding: 0 48px`, `font-size: 24px`, `display: inline-flex`.
4. Requested URLs, as expected: `/cart/change` and `/cart/add`.
5. Banner fixture: the complete snowboard's material handle is `ocean-bound-r-pet`, wax has no material. Neither is an eco handle, so **C4a.19 uses PX3** (banner forced on), not real data.
6. Natural button widths in `btn-secondary`/`btn-primary`: Update 104.9, Checkout 125.9; 104.9 + 125.9 + 12 = 242.8, so they share a row at 375 (271) but wrap at 320 (216).
7. `compiled_assets/styles.css` on base contains the `image.liquid` `.image` rule (2,258 B); on head it does not (2,147 B).
8. `/cart` on base: table `font-size` 22.4px, `table-layout: fixed`, page overflow (`scrollWidth - innerWidth`) 172 / 117 / 102 / 62 px at 320 / 375 / 390 / 430 with one item, 208 / 153 / 138 / 98 with two. Head: 0 at every width and state.
9. Schema shasums (cart-drawer `1451daac...`, cart `dad689ea...`, product `5afd8626...`) are identical at HEAD (C4a.2 PASS).

## Verification results (C4a.0-C4a.22 as far as the Coder can run them)

Dev theme #187953938528 was served from the repo (head) and from `git archive` scratch copies (base `41b5f1a`, and head with settings overrides) with `shopify theme dev --path`. Final state: `shopify theme dev` run from the repo root, `--color-foreground` read back as `#333333`, drawer enabled, then the server was stopped. No server is running.

| Criterion | Result | Evidence |
|---|---|---|
| C4a.0 | PASS: `check:css` exit 0 on a clean tree at HEAD | shell |
| C4a.1 | PASS: per-step table above; final 0 | shell |
| C4a.2 | PASS: shasums equal Step 0 | `t4ac-static-checks.txt` |
| C4a.3 | PASS: 0 unlayered rules match T4a markup in all 22 sweep states at 375 and 1440 (base: 9-24 per drawer state from the drawer `<style>`; 2 on `/cart` from the image rule) | `t4ac-sweep-head.txt`, `t4ac-sweep-base.txt` |
| C4a.4 | PASS: legacy-class intersection under drawer and cart roots is `{uppercase, overflow-hidden}`; under Add to cart `{loading__spinner, hidden}`; the only childless `div` is the overlay, computed `display: block` | `t4ac-sweep-head.txt` |
| C4a.5 | PASS at 1440, 430 and 375 (closed / open / Escape / overlay click at 1440 and 430 / panel covers overlay at 375 / close button) | `t4ac-behavior-head.txt` |
| C4a.6 | PASS on wax and the complete snowboard at 1440 and 375 (open, badge and aria-label, busy overlay 32 x 32 centred with `spin`, aria-busy cleared, count 3, remove to empty state). 3p 422 leaves the drawer closed and the button recovers | `t4ac-behavior-head.txt` |
| C4a.7 | PASS (a) `rg` results in `t4ac-static-checks.txt`; (b) wrapper unchanged, class set `{size-5, animate-spin, absolute, inset-0, m-auto}`, SVG and circle attributes equal, computed size 20 x 20, position within 0.1 px of base | `t4ac-geometry-diff.txt` |
| C4a.8 | PASS with the E4a rows: all drawer diffs are E4a.1, .2, .3, .4, .5, .10 and their knock-on heights (heading 24 to 25 px, checkout 49 to 48 px so body 698 to 699 and footer 129 to 128). No unlisted diff in 14 state/width tables | `t4ac-geometry-diff.txt` |
| C4a.9 | PASS (two items: no table, 2 rows, 2 submit buttons with the second `name="checkout"`, Update posts quantities and the badge reads 3, remove link leaves one row; empty cart shows the message and `a.btn-primary` to `/collections/all`; form `action="/cart"`, `method="post"`) | `t4ac-cart-head.txt` |
| C4a.10 | PASS at 320, 375, 390, 430, 768, 1440, 1920 against `E_R = w - L` (see deviation 3) | `t4ac-cart-head.txt` |
| C4a.11 | PASS: the `rg` prints nothing; rendered close label "Close cart", empty text "Your cart is empty.", total label "Total" | `t4ac-static-checks.txt`, `t4ac-behavior-head.txt` |
| C4a.12 | PASS: `/cart` empty, one and two items at 320-1440, and the open drawer at 320 and 375 (panel 0..w) | `t4ac-overflow-head.txt` |
| C4a.13 | PASS: 44,667 / 9,437; growth +2,866 / +448 | table above |
| C4a.14 | recorded, no threshold. `B_head` 22,136 to 22,525 (+389, from the larger `tailwind.css` 8,459 to 8,866 less the smaller `compiled_assets/styles.css` 781 to 763); `N_dawn` unchanged; `L_style` on `/` 3,251 to 116 bytes; Link headers 9 (`/`, `/cart`) and 13 (wax) before and after | `t4ac-mcss-compare.txt` |
| C4a.15 | PASS (PX2): panel `rgb(17, 34, 51)`, title `rgb(238, 17, 136)`, header border changes; remove link stays `rgb(211, 47, 47)`; banner stays `[232,245,233]` / `[46,125,50]`; checkout `rgb(227, 252, 1)` in the palette run (and in the default run, E4a.2). Base is red on the panel (`rgb(255,255,255)`) and title (`rgb(18,18,18)`) as the plan predicts | `t4ac-proxy-px2-*.json` |
| C4a.16 | PASS: drawer headings `H2, H3`, every drawer `img` has width and height, `H1` = 1 on `/cart` and with the drawer open, no preload `Link` growth | `t4ac-behavior-head.txt`, `t4ac-mcss-compare.txt` |
| C4a.17 | PASS (a) static diff of the script touches only `open()`, `close()` and the three `is-loading` lines; (b) `/?section_id=cart-drawer` has exactly one `.cart-drawer__inner` | `t4ac-static-checks.txt`, `t4ac-behavior-head.txt` |
| C4a.18 | PASS (PX1): no `cart-drawer`, no `data-cart-drawer-trigger`, header link `/cart`, Add to cart on wax goes to `/cart` with the item | `t4ac-proxy-px1-head.json` |
| C4a.19 | PASS via PX3: banner `G` and all listed properties equal base in the drawer at 375 and 1440; on `/cart` only x 40 to 72 and width change (E4a.16) | `t4ac-proxy-px34-*.json` |
| C4a.20 | PASS: 0 diffs over 60 wrappers on `/collections/all` and `/search?q=snowboard` at 375 and 1440; every wrapper class is `relative block w-full overflow-hidden` plus the caller's `css_class` | `t4ac-geometry-diff.txt` |
| C4a.21 | PASS (PX4, `input_corner_radius` 10): drawer and cart quantity fields 10px on head; drawer field stays 4px on base | `t4ac-proxy-px34-*.json` |
| C4a.22 | PASS for pixels: 18 of 20 screenshots (10 pages including `/password`, at 1440 and 375) are pixel-identical to base. `snow` 1440 (260 px) and `mat` 1440 (40 px) differ, but a same-tree head-vs-head re-capture differs the same way (`p3p` 1440 228 px, `mat` 8 and 18 px, same y ranges), so these are page jitter, not T4a | `t4ac-regression-pixdiff.txt` |

Not run by the Coder (left to QA): C0.13 dynamic checkout review, T1 C1.4 / T2 C2.9 / C2.14 / T3 C3.5 regression scripts through `t4ac-` copies beyond the overflow/behavior/pixel checks above, a Playwright MCP visual look, theme-editor checks, the three owner checks.

## Deviations and decisions

1. **`snippets/spinner.liquid` doc text reworded.** The plan's doc comment contains the words "ring" and "container". Tailwind scans plain text, so they generated the `.ring` and `.container` utilities, +546 B minified for nothing (umbrella risk 13). I changed "SVG ring that spins" to "SVG circle that rotates" and "its container" to "the parent element". Class names, params and markup are unchanged. Growth went from +688 to +142 B.
2. **Seeding the cart through the product form, not `fetch('/cart/add.js')`.** From headless Chromium the Ajax `.js` endpoints answered 429 with a Cloudflare challenge (`cf-mitigated: challenge`), also in the first runs after repeated password POSTs. The harness adds items through the theme's own Add to cart button, one fresh context per cart state. Plan §10 allowed `fetch` only as setup; the delayed requests in C4a.6/C4a.7 are still the theme's own `/cart/change` and `/cart/add`.
3. **C4a.10 right edge is `E_R = w - L`, not the rendered cart icon.** The header's cart icon box overflows `E_R` at 320, 375 and 390 on base and head (rendered right 312 / 334 / 340 against 268 / 323 / 338). This is T3 deviation 3. Cart content right edges equal `w - L` at every width; the rendered `R` is still recorded in the output.
4. **Quantity change in the harness is `fill()` then `blur()`, not `fill()` then `dispatchEvent('change')`.** Playwright's `fill` leaves the field focused and dirty; Chromium fires a second `change` when the drawer re-render removes the focused field, so the drawer posted `/cart/change` twice and `aria-busy` stayed set for the second request. A native blur gives one request. This is a harness artifact, not a drawer defect; C4a.6 text names `dispatchEvent('change')`, so QA should use `blur()` too (or accept a double post).
5. **`N_dawn` reads 2, not 0.** The two non-Tailwind stylesheet links on every page are Shopify's `accelerated-checkout.css` and `compiled_assets/styles.css`, neither a Dawn component sheet. The count is unchanged by T4a (plan C4a.14 has no threshold). No Dawn component sheet is linked on any T4a page.
6. **Base PX proxies.** Base was rendered as scratch copies for PX3+PX4 and PX2 (as the plan asks). PX1 was run on head only (the base is the always-enabled drawer; the criterion is about head). The base `t4ac-dump` was re-run (`base2`) after fixing the double-post artifact; the first base dump was discarded.
7. **Step 0 got no commit and is not a separate step in git history.** The plan makes it measurement only.

No other deviations. `config/settings_data.json`, `templates/*.json`, `sections/*-group.json`, `src/tailwind.css`, `layout/*`, `assets/*.js` and non-default locales were not edited (the scratch `settings_data.json` overrides lived only under the scratchpad).

## Commands to run the feature locally

```
npm ci
npm run build:css
npm run check:css && npm run check:hidden && shopify theme check
shopify theme dev            # private development theme; prints the ?preview_theme_id= URL
```

Harness (needs the printed preview URL; set `T4AC_STATE` to a scratch path so the storefront login is cached and the password POST rate limit is not hit):

```
export T4AC_STATE=<scratch>/state.json
U="https://theme-evolution-os2.myshopify.com/?preview_theme_id=<id>"
node docs/qa/harness/t4ac-behavior.mjs "$U"        # C4a.5, 6, 11, 16, 17b
node docs/qa/harness/t4ac-cart.mjs "$U"            # C4a.9, 10, 12
node docs/qa/harness/t4ac-overflow.mjs "$U"        # C4a.12, regression overflow
node docs/qa/harness/t4ac-sweep.mjs "$U" head      # C4a.3, 4
node docs/qa/harness/t4ac-dump.mjs "$U" <label>    # then: node docs/qa/harness/t4ac-diff.mjs base2 head all
node docs/qa/harness/t4ac-facts.mjs "$U" <label>   # M_css, facts
node docs/qa/harness/t4ac-proxy.mjs "$U" px34|px1|px2 <label>   # scratch copy served with --path
node docs/qa/harness/t4ac-shots.mjs "$U" <label>; node docs/qa/harness/t4ac-shots.mjs diff base head
```

The scripts read the storefront password from `docs/dev-fixtures.md` inside `t0-lib.mjs`, never print it, and only `t4ac-lib.mjs` caches the resulting session cookie in `T4AC_STATE`. Only `t0-lib.mjs` is reused from older scripts.

## Where QA should focus

- **Backdrop (E4a.1, Q4a.2):** the page now dims and an outside click closes the drawer at 1440 and 430; at 375 and below the panel covers it. Owner checkpoint.
- **Checkout look (E4a.2, Q4a.1):** lime `btn-primary` in the drawer, empty states and `/cart`.
- **Cart page structure (E4a.13, Q4a.5):** list instead of table; one Update button; the page no longer overflows at <= 430 (base overflowed up to 208 px).
- **Drawer state under real use:** rapid open/close (the timer race R1 is pre-existing and untouched), Add to cart from a product with the drawer already open, remove-to-empty, and the 3p 422.
- **Theme editor:** the drawer renders in the editor preview; with `enable_cart_drawer` off the header link goes to `/cart` (PX1 checked).
- **Dark palette:** the red remove link is about 3.2:1 on `#112233` (plan §4.4, owner check 2).
- **Image snippet:** collection, collections and search pass `css_class`; geometry is unchanged but QA should glance at them (they still overflow at 375, below).

## Out-of-scope observations (not fixed)

- `/collections/all` overflows horizontally at 375 (`scrollWidth - innerWidth` = 145 px, 12 offenders) and `/search?q=snowboard` by 103 px, from T4b's `minmax(500px, 1fr)` and search CSS. Same on base.
- The header's cart icon box overflows the header content edge at 320 / 375 / 390 (T3 deviation 3).
- Cloudflare rate limits storefront password POSTs and Ajax `.js` endpoints for several minutes after bursts; `T4AC_STATE` mitigates it.
- Pre-existing and planned follow-ups: drawer focus trap, repeated `keyup` listener, close-then-reopen timer race (stuck scroll lock), tooltip keyboard access (plan §14.3).

## Bug fix verification approach

Not applicable (feature phase, slug does not start with `fix-`).
