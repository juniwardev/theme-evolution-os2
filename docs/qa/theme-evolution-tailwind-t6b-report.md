# QA report: theme-evolution-tailwind-t6b

Verdict section is at the end (`PASS WITH NITS`). Tree under test: `main` HEAD `32f4506`, served by `shopify theme dev` to development theme **188245508192** only (every measured page asserted `Shopify.theme.id` = 188245508192). Staging #187953643616 and live #138872651872 were not touched. Browser tooling: Playwright (Node library, scripts under `docs/qa/harness/t6bqa-*`); the Playwright and Chrome DevTools MCPs were not needed.

## Summary verdict

**PASS WITH NITS.** All drawer focus flows were re-run with REAL `/cart/add` and `/cart/change` requests and pass at 375 and 1440. One clause (C6b.13's delayed second click at 375) could not be completed with a real request (Cloudflare 429) and is recorded as not run at 375 (it passes, real, at 1440). C6b.15 was re-run with the Supercycle embed on and off and reproduces the Coder's finding; my judgment is below. No blocker.

## Real versus replayed (the focus-1 question)

No request was replayed. `t6bqa-lib.mjs` only paces (60 s gap per `/cart/add`, 20 s per `/cart/change`) and forwards every request unchanged; every response status is recorded and a 429 invalidates the flow instead of being answered from a recording.

| Flow | Result | Real requests (from the run) |
|---|---|---|
| C6b.6(a) keyboard add on `F_wax`, 1440 | pass: focus on `div[role=dialog]` | add 200 |
| C6b.6(a) 375 | pass | add 200 |
| C6b.6(b) header icon (Tab + Enter), 1440 and 375 | pass | |
| C6b.8(a) Escape, close button (1440 and 375), overlay click (1440) | pass: focus on `button[name=add]` each time; at 375 not the menu toggle | (open() re-used, no second add, as the plan reads) |
| C6b.8(b) icon + one real quantity change + Escape, 1440 and 375 | pass: `[data-cart-drawer-trigger]`, `isConnected` true | change 200 |
| C6b.10 flow (open, add, Escape, icon, overlay/Escape, close button, busy overlay, quantity change, remove to empty), 1440 and 375 | pass at both; panel `outline-style` none | add 200, change 200 x2 per width |
| C6b.10 422 (`F_3p`, drawer stays closed) | pass | add 422 |
| C6b.10 detach clause (1440) | pass: two Tabs move focus, no pageerror | |
| C6b.13 `F_3p` 1440 (error visible, `role=alert`, text equals JSON `description`, `rgb(211, 47, 47)`, drawer closed, no `aria-disabled`; delayed second click hides then shows) | pass | add 422, 422 |
| C6b.13 `F_3p` 375, first click | pass: wrapper visible (40 px high, wraps to two lines), text, colour, drawer closed | add 422 |
| C6b.13 `F_3p` 375, delayed second click | **not run with a real request**: the second add was answered 429 twice (runs 3 and 4), so the clause is INVALID at 375 | add 422, add 429 |
| C6b.13 `F_wax` wrapper stays `hidden` before, during, after a real add, 1440 and 375 | pass | add 200 |
| C6b.21 (`F_3p` 422, icon focus + Enter, Escape returns to icon), 1440 | pass | add 422 x2 |

Cloudflare limiting: after about nine real adds plus about five `/cart/change` calls, `/cart/add`, `/cart.js` and `/search` returned `429` (HTML challenge) for roughly 40 minutes at a time. I waited it out (probe script `t6bqa-probe.mjs`) rather than replaying. This limit appears to cover `/search` and `/cart.js` too, which also cost me the tooltip screenshot (below).

## Criteria table

| ID | Result | How |
|---|---|---|
| C6b.0 | pass | clean tree (no tracked changes), `npm ci && npm run check:css` exit 0 |
| C6b.1 | pass | `npm run check` exit 0; theme check: "366 files inspected with no offenses found" |
| C6b.2 | pass (spot) | diff `6fa9202..HEAD` outside `docs/` touches only the 5 listed files; no locales/config/templates/layout/schema file; not re-hashed per schema |
| C6b.3 | pass (spot) | same diff; zero `{% include` in the diff; `product-form.js` not in the diff |
| C6b.4 | not re-run | Coder-reported pass; out of this QA's focus |
| C6b.5, 7, 9 | not re-run | Coder-reported; C6b.8 and C6b.10 flows exercise re-render and listeners indirectly with no pageerror |
| C6b.6 | pass, real | Playwright script `t6bqa-drawer.mjs`; 375 and 1440, (a) and (b) |
| C6b.8 | pass, real | same; (a) 1440/375, (b) with a real quantity change, (c) at 375 |
| C6b.10 | pass, real | flow at 1440 and 375 (the Coder had 430), 422, detach clause, panel outline `none` |
| C6b.11 | pass, real seeding | `t6bqa-cartpage.mjs`: `/cart` line prices (`$699.95`, `$24.95`) equal the drawer's; total `$724.90 USD` equals drawer; after Update (qty 2) `$1,399.90` / `$1,424.85 USD` equal the drawer's |
| C6b.12 | pass | inputs `type=number inputmode=numeric min=0`; Checkout `formnovalidate`; `-1` blocks Update (no POST, URL unchanged, `valid` false) while Checkout posts (`checkout` field present); one H1; no overflow at 320, 375, 768, 1440, 1920; Update and Checkout 48 px high |
| C6b.13 | pass at 1440; pass at 375 except the delayed-second-click clause (INVALID, 429) | see table above |
| C6b.14 | pass at 1440 and 375 (a)-(i), tooltip fetch real for the first request per handle (2 real, 6 served from that real response, because `/search` is limited) | `t6bqa-tooltip.mjs`; triggers injected in page with the exact markup of `sections/product.liquid:53` (no fixture contains a material name; the real tooltip JS and server fetch are used); `tabindex` 0, focus outline `auto` 1px vs rest `none`, tooltip `role=tooltip` `id` = `aria-describedby` and below the trigger, Escape hides and keeps focus (1440), second trigger replaces first, Tab out hides, hover shows and hides, stale fetch guard, click-then-leave hides. At 375 Escape ends on the header menu toggle (E6b.11, known RB1) |
| C6b.15 | pass with deviation (a), see next section | `t6bqa-preload.mjs` |
| C6b.16 | not re-run | Coder-reported; link outline measured in the tooltip run as `auto` on trigger |
| C6b.17 | pass | `assets/tailwind.css` sha `ad2ef513...` identical to base `6fa9202` |
| C6b.18 | pass | 59,172 B / 11,331 B gzip -9 (budget 60,000 / 12,000; 828 / 669 headroom) |
| C6b.19 | pass (375 and 1440 only) | `t6bqa-pages.mjs`: home, collection, privacy policy, wax, snowboard, 3p snowboard, `/cart`: HTTP 200, overflow 0, one H1 each at 375 and 1440. 320/768 were covered for `/cart` only |
| C6b.20 | pass | no `pageerror` in any run; console errors listed below |
| C6b.21 | pass, real | see table |
| E6b.3 | seen | screenshots `t6bqa-cart-1440.png`, `t6bqa-cart-375.png`: price under title, Total row above buttons |
| E6b.4 | seen/measured | number field with `-1` validation, Checkout posts |
| E6b.5 | seen | `t6bqa-error-375.png`, `t6bqa-error-1440.png`: red message above Add to cart, wording "The product 'The 3p Fulfilled Snowboard' is already sold out." |
| E6b.7 | measured, **no screenshot** | the tooltip screenshot runs hit Cloudflare 429 on `/search` (tooltip never appeared) so the images were discarded; behaviour is measured in C6b.14 |
| E6b.11 | measured | at 375 Escape on a trigger ends on `button.theme-evolution-header-menu__toggle`, at 1440 on the trigger |
| Theme editor (section 10) | **not run** | no admin session; owner steps below |

## C6b.15: embed on and off

Method (Coder's documented one): scratch copy of `git archive HEAD` served with `shopify theme dev --path=<scratch> --theme=188245508192` (`t6bqa-mkscratch.py` adds `templates/index.pxb.json` and `index.pxbamb.json`, banner first; the repo templates are untouched). Embed off = the Supercycle block `disabled: true` in the scratch `config/settings_data.json` only. Everything below is the document response's `Link` header, `as=image` entries, at 1440 and 375 (identical at both).

| Case | Supercycle embed ON | Supercycle embed OFF (HEAD) | Embed OFF, base `image-banner.liquid` (6fa9202) |
|---|---|---|---|
| PXB (banner first) | `L_n` 10 (cap), **0** image entries | `L_n` 6, **1** image entry (790 chars, 5 candidates, `imagesizes` 50vw) | `L_n` 5, **0** entries (9 candidates): red |
| PXB-amb | `L_n` 10, **0** | `L_n` 6, **1** (790, 5 candidates, 60vw) | `L_n` 6, 1 entry (1155 chars, 8 candidates) |
| Real `/` (banner at index 2) | `L_n` 10, 0 | `L_n` 5, 0 | not run (unchanged by S6) |

- Embed ON: the Link header is saturated by 10 non-image preloads (theme's 4 plus the embed's 6), so no image preload can appear whatever the widths. Same as the Coder's finding.
- Embed OFF, HEAD: the entry's `imagesrcset` candidate set (URL without scheme, `&amp;` decoded) equals the first `img`'s `srcset` set; `imagesizes` equals `sizes`; `L_n` 6 <= 10; `fetchpriority=high`; `performance.getEntriesByType('resource')` shows each banner file requested exactly once. So (b), (c), (d) pass.
- Base red is reproduced for the default (non-ambient) banner: without S6 the 9-candidate list drops the entry; with S6 (5 candidates) it comes back. For ambient, base already kept it (8 candidates).
- Real `/`: `srcset` has 9 candidates per image (W9 filtered to widths within the 4096 px images), no image entry, as designed.

**Judgment on (a) "one per banner image".** A plan-wording nit, not a defect. Both banner images are rendered with `preload: true` (`sections/image-banner.liquid:272-340`) and both are requested once, but Shopify emits a single `rel=preload; as=image` `Link` entry for the response (it happens on the base ambient run too, with 8 candidates, so it is not caused by S6 or by the list length). The theme cannot add the second entry. The plan's expectation (R5, RB6) assumed platform behaviour that does not occur. Suggested rewording: "at least one `as=image` entry for the first banner image, and each banner image requested once".

**Separate owner-level finding (not a code defect).** While the Supercycle embed is on, S6 has no visible effect: a banner-first page loses its hero preload header on this store regardless of widths. It does not hurt today because the real home page has the banner at index 2 (no preload by design). Owner decision, noted in the Coder notes too: reduce the embed's preloads if a banner-first layout is ever wanted.

**Restoration proof.** After the embed-off runs I copied the repo's `config/settings_data.json` back into the scratch copy, let `theme dev` sync it, restarted `theme dev` from the repo root (which deletes the scratch templates remotely), then pulled the dev theme's `config/settings_data.json` and compared: `cmp` = IDENTICAL, sha1 `c47c98a31356b4d21762e5814ca2bc691ef2dc53` both sides. The pull of `templates/index.pxb.json` / `index.pxbamb.json` returned nothing (deleted). `git status` shows `config/settings_data.json` unmodified (and no tracked file modified).

## Issues found

None blocking. Nits:

1. **N1 (plan wording)**: C6b.15(a) "one per banner image" can't hold (platform emits one entry). Reword as above. MCP: none (Node Playwright script).
2. **N2 (owner decision)**: S6 is inert while the Supercycle embed is on (10-preload cap). Verified on the dev theme only.
3. **N3 (coverage)**: C6b.13's delayed-second-click clause at 375 was not proven with a real request (two 429s). It passes real at 1440, and the first-click part passes real at 375.
4. **N4 (coverage)**: no tooltip screenshot (E6b.7); not captured because `/search` was throttled. Behaviour is measured.
5. **N5 (coverage)**: C6b.4, 5, 7, 9, 16 were not re-run (Coder-reported); base-tree red runs were not repeated; the theme editor pass is not run.
6. **N6 (style, trivial)**: the error paragraph uses a hard-coded `text-[#d32f2f]`, the same pattern as the existing tooltip colours, and is not a merchant theme token. CSS unchanged because the utility already existed.
7. **N7 (known)**: at 375, Escape on a focused tooltip trigger moves focus to the header menu toggle (RB1 / E6b.11).

## Console errors and warnings

No `pageerror` anywhere. Console `error` entries seen, all outside the theme's code:
- The known unrelated Monorail error (`MonorailRequestError ... shopify_pay_page_load/2.7`), and `ERR_ABORTED` on `/.well-known/shopify/monorail/unstable/produce_batch`.
- `Framing 'https://shop.app/' violates ... frame-ancestors` and `403 https://shop.app/pay/hop` (Shop Pay iframe).
- `429` on `/web-pixels@.../web-pixel-shopify-app-pixel` and Cloudflare `/cdn-cgi/challenge-platform` (`NotSameOriginAfterDefaultedToSameOriginByCoep`), caused by this machine's traffic being throttled during the session.
- `Failed to load resource: 422` on `F_3p` add (expected) and, while throttled, `Error refreshing cart: SyntaxError: Unexpected token '<'` when `/cart.js` returned the 429 HTML page (`product-form.js`, unchanged by T6b).
- The drawer/flow runs on the wax product with unthrottled traffic logged no errors (`logs: []`).

## Network failures and slow responses

Only the Cloudflare 429s described above (`/cart/add`, `/cart.js`, `/search`, web pixels), tied to request volume, not to the theme. No 5xx. All page documents returned 200.

## Accessibility observations

- Drawer: focus moves to the panel (`tabindex=-1`, no outline) on open, Tab/Shift+Tab stay inside, Escape, close button and overlay return focus to the opener, a detached drawer does not swallow Tab.
- Error message: `role=alert`, hidden attribute toggled, visible and readable at 375 (wraps to two lines).
- Tooltip triggers: `tabindex=0`, focus ring is the browser default (`outline-style: auto`, 1 px), `role=tooltip`, `aria-describedby` set, Escape dismisses (WCAG 1.4.13).
- `/cart` quantity: `type=number`, `inputmode=numeric`, `min=0`.

## Performance notes

CSS 59,172 B / 11,331 B gzip, byte-identical to base. No performance trace taken. S6 effect on the Link header as above.

## Theme editor pass (section 10): NOT RUN

Agents have no admin session. Owner steps, on the dev or staging theme in the theme editor preview (open `https://theme-evolution-os2.myshopify.com/admin/themes/<theme id>/editor`):
1. In the preview pick a product page (for example `selling-plans-ski-wax`). Click the cart icon in the header: the drawer slides in and the cart panel has focus (no visible outline).
2. Press Tab repeatedly (and Shift+Tab): focus cycles only through the drawer's close button, item controls and Checkout, never out to the page.
3. Press Escape: the drawer closes and focus is back on the cart icon in the header.
4. Reopen with the cart icon, click the dark overlay, and click the X: each closes and returns focus to the cart icon.
5. Add to cart (keyboard: Tab to Add to cart, Enter): the drawer opens with focus inside; Escape returns focus to the Add to cart button.
6. Repeat 1-3 on the home page. Also change any section's settings in the sidebar and re-open the drawer once to confirm it still opens and Tab stays inside.

Owner checks that stay on staging: keyboard drawer (above) and the 422 message on `the-3p-fulfilled-snowboard` (look and wording).

## Screenshots

(Local only: `docs/qa/screenshots/` is gitignored, so these are not committed.) `docs/qa/screenshots/t6bqa-cart-1440.png`, `t6bqa-cart-375.png`, `t6bqa-drawer-1440.png`, `t6bqa-drawer-375.png`, `t6bqa-error-1440.png`, `t6bqa-error-375.png`, `t6bqa-home-1440.png`, `t6bqa-home-375.png`, `t6bqa-collection-1440.png`, `t6bqa-collection-375.png`, `t6bqa-header-menu-375.png`.

## Harness and evidence

Harness: `docs/qa/harness/t6bqa-lib.mjs`, `t6bqa-drawer.mjs`, `t6bqa-cartpage.mjs`, `t6bqa-tooltip.mjs`, `t6bqa-shots.mjs`, `t6bqa-pages.mjs`, `t6bqa-preload.mjs`, `t6bqa-mkscratch.py`, `t6bqa-probe.mjs`, `t6bqa-429.mjs`. Evidence: `docs/qa/evidence/t6bqa-*.json`. `t6bqa-drawer-run2` and `t6bqa-tooltip-run1` are invalid runs (429) kept for the record; `t6bqa-drawer-run1` is the main real-add run, `-run3` the 375 retry; `t6bqa-shots-run*` includes the 429-affected tooltip attempts (no tooltip shown, screenshots discarded).

## Housekeeping

`npm ci && npm run check:css`: exit 0. `shopify theme check` (via `npm run check`): 0 offenses. Dev server stopped; no background processes left. Dev theme 188245508192 settings restored and verified identical to the repo's. `config/settings_data.json` unmodified in git.

## Verdict

**PASS WITH NITS**
