# Implementation notes: Tailwind phase T6b (QA follow-ups)

Plan: `docs/plans/theme-evolution-tailwind-t6b.md` (Revision 2.1, review `APPROVE`). Base: `main` at `6fa9202` (25 commits ahead of origin/main, nothing pushed). Verified on the agents' dev theme #188245508192 only; live and staging untouched.

## Commits

| SHA | Subject |
|---|---|
| `1d5e08f` | fix(cart-drawer): track open/close timers, add document keyup listener once (S1) |
| `593de8f` | feat(cart-drawer): initial focus, Tab trap, focus return and re-render focus (S2) |
| `4f5ec89` | feat(cart): line prices, total and numeric quantity field on /cart (S3) |
| `d7b4a32` | feat(product): visible add-to-cart error message (S4) |
| `cb10903` | feat(tooltip): keyboard-reachable material tooltip with focus, Escape and aria-describedby (S5) |
| `eb71c24` | fix(image-banner): shorter widths list for the preloaded banner image (S6) |
| (docs) | harness, evidence and these notes |

Step 7 (hello-world links) has **no commit**: S7 is verified and dropped (below).

## Files changed

- `sections/cart-drawer.liquid`: Step 1 and Step 2 exactly as plan 5.1 and 5.2 (timers, once-only listeners, panel `tabindex="-1"` + `focus-visible:outline-none`, trap, focus return, `keepFocusInside()`, the icon handler's `setActiveElement`). `getSectionsToRender()` and `updateLineItem()` byte-identical; `renderContents()` and `updateCart()` gain one line each.
- `sections/cart.liquid`: line price, total row, `type="number" inputmode="numeric" min="0"`, `formnovalidate` on Checkout.
- `sections/product.liquid`: error paragraph (Step 4); `tabindex="0"` on the trigger literal (Step 5, no ring utilities).
- `assets/eco-tooltip.js`: focusin/focusout/Escape, `activeTrigger`, stale-fetch guard, `role="tooltip"`, `id`, `aria-describedby`.
- `sections/image-banner.liquid`: `preload_widths` for the two preload branches (W5 / W5a).
- `docs/qa/harness/t6bc-*.mjs`, `docs/qa/evidence/t6bc-*`: harness and evidence.
- Not touched: schemas (23 shas identical), `locales`, `config`, `templates`, `layout`, `assets/product-form.js`, `src/tailwind.css`.

## Commands

`npm ci && npm run check` (exit 0, theme check: no offenses). Harness (one process at a time, `T6BC_STATE=<scratch file>`): `node docs/qa/harness/t6bc-<drawer|cartpage|error|tooltip|preload|facts|regress|shots>.mjs "https://theme-evolution-os2.myshopify.com/?preview_theme_id=188245508192" <label> [args]`. The password is read by `t0-lib.mjs` and never printed or stored.

## Step 0 results

- Preconditions: T5a deploy note names #187953643616 with SHA `905196f` (ancestor of HEAD), report `PASS WITH NITS`, `assets/base.css` gone. **Q5a.1 shipped option: (a)** browser default focus ring. T5b, T6a and the policy-spacing follow-up are in HEAD (baseline on them). Protected-paths status empty. No T5b Coder active (orchestrator); re-checked at the end, no new T5b commit.
- Base: `N_tc` = 0 offenses; `S_tw` = **59,172 / 11,331** (matches the orchestrator's figure).
- Anchors: all present. `loading__spinner` carries a literal `hidden` class in `sections/product.liquid` (existing, not touched).
- **Item 4 (FI):** hello-world links true x3 (focused `outline-style: auto`, resting shadow equal); injected trigger span true; positive control `button[name="add"]` true. Instrument check on the pre-T5a tree `0783033` (served to the dev theme from a `git archive`): links false x3, trigger false, control true. Decision: **S7 verified and dropped (no Step 7 commit)**; **Step 5 adds `tabindex` only** (no ring utilities).
- **Item 5:** header Escape with focus on `body`: 375 -> `button.theme-evolution-header-menu__toggle`; 1440 -> `body`.
- **Item 7:** F_3p returns 422 with `description` "The product 'The 3p Fulfilled Snowboard' is already sold out." (non-empty, Step 4 proceeds).
- **Item 8 (preload), PXB-exp via template suffixes, 1440:** both banner images are 4096 px wide. With the Supercycle app embed **on**, the response already has 10 non-image preloads (tailwind, accelerated-checkout, `compiled_assets/styles.css`, a font, 5 Supercycle styles and 1 script) so Shopify's 10-preload cap drops every image preload whatever the widths. With the embed **off** on the dev theme (scratch settings push, restored afterwards): `W9` (9 candidates) drops the entry; 6, 7, 8 candidates (L_len 909, 1032, 1155) keep it; `W5` 790 (5 cand), `W6` 913 (6 cand, valid), `W4` 667, `W4`+1780 790: all keep it; ambient the same (`W9a` has 8 candidates after the 7680 filter and keeps it). The threshold is therefore between 1155 and the 9-candidate length. **Chosen: `W5` / `W5a`** (margin 913 vs 1155). Character test not needed (images wide enough). **Finding:** only the **first** banner image gets a `Link` entry, in every run (also `W4`), so the plan's expectation of two entries (R5, RB6) doesn't hold.
- **Item 9:** schema shas in `t6bc-step0-schema-shas.txt`, method hashes in `t6bc-step0-methods.json`.
- **Item 10 (gate):** all of 5.x applied in a scratch copy: `P_b` = **59,172 / 11,331**, identical bytes, no new selector. Fits both budgets (828 B / 669 B headroom), continue.
- Item 11 (base screenshots): not taken on the base tree (Cloudflare blocks, below); final-tree screenshots are in `docs/qa/evidence/t6bc-shots/`.

`assets/tailwind.css` per step: 59,172 / 11,331 after every step and at the end (C6b.17: no selector change in any step; `npm run check:css` exit 0).

## Criteria (final tree on the dev theme, Supercycle embed off for C6b.15 only)

| ID | Result | Evidence |
|---|---|---|
| C6b.0 | pass | clean tree, `npm ci && npm run check:css` exit 0 |
| C6b.1 | pass | `npm run check` exit 0, theme check 0 offenses after each step |
| C6b.2 | pass | 23 schema shas identical; locales/config/templates/layout diff empty |
| C6b.3 | pass | `t6bc-diffscope.mjs`; `product-form.js` unchanged; no `include` |
| C6b.4 | pass at 1440 and 375, (a) and (b) | base red on both (`t6bc-drawer-base.json`: hidden true, state open) |
| C6b.5 | pass | keyup 1/1, keydown 4/4 after three re-renders, `close()` count 1 after one Escape; base keyup 1->4, close count 4 |
| C6b.6 | pass (a) 1440 and 375, (b) | base red (focus stays on the add button) |
| C6b.7 | pass one (N_f 5), two (8), empty (2) | each trap cycle checked |
| C6b.8 | pass (a) at 1440 and 375 (Escape, close button, overlay), (b) icon + quantity change, (c) not the menu toggle | base red: 375 ended on the menu toggle, close button left focus on `body` |
| C6b.9 | pass (a) quantity id kept, (b) inside dialog after remove | |
| C6b.10 | pass: flows at 1440 and 430, 422 keeps drawer closed, panel outline `none`, detach clause (Tab not swallowed, no pageerror) | the 375 width of the flow was not run (430 was) |
| C6b.11 | pass | line prices and total equal the drawer's; Update changed the price |
| C6b.12 | pass | number/numeric/min 0, Checkout `formnovalidate`, `-1` blocks Update (no POST, invalid) and Checkout posts, one H1, no overflow at 320-1920, Update/Checkout 48 px high, Checkout right edge `w - 52` |
| C6b.13 | pass at 1440 and 375, wax keeps `hidden` | red `rgb(211, 47, 47)`, text equals `description`, drawer closed, hidden during the delayed second request |
| C6b.14 | pass at 1440 and 375 (a)-(i); at 375 (d) Escape ends on the menu toggle (E6b.11) | PXP proxy |
| C6b.15 | pass with a deviation: one entry per response, not per image | PXB, PXB-amb at 1440 and 375: one `as=image` entry (`imagesrcset` set and `imagesizes` equal the first `img`), `L_n` 6, each banner image requested once; real `/`: no image entry, `srcset` is `W9` (9 candidates, all within 4096) |
| C6b.16 | guard pass | links true x3 on the final tree |
| C6b.17 | pass | compiled CSS byte-identical to base |
| C6b.18 | pass | 59,172 / 11,331 |
| C6b.19 | pass | no overflow at 320, 375, 768, 1440 on F_3p with error, F_wax, PXP with tooltip, `/`; one H1 each |
| C6b.20 | pass | no `pageerror`; console errors only third party (`shop.app` framing, monorail, 403) and the expected 422 |
| C6b.21 | pass | focus returns to the header icon after a failed add |

Theme editor pass (section 10): **not run** (no admin session in the harness); owner check 1 covers it.

## Deviations and findings (for the owner and QA)

1. **S6 has no effect on this store while the Supercycle app embed is on.** The embed's own 6 preloads plus the theme's 4 already reach the 10-preload cap, so Shopify drops image preloads regardless of `widths`. The width fix is correct and measured (9 candidates drop the entry, 5 keep it) when the cap isn't reached, but live, staging and dev currently show no banner image `Link` entry when the banner is first. Measured on dev with the embed disabled by a scratch settings push (restored; dev `settings_data.json` equals the repo's). This makes C6b.15 unreachable on a store with that embed; QA should repeat it with the embed off.
2. Only the first banner image receives a `Link` entry (C6b.15(a) and RB6 assumed one per image).
3. **Cloudflare 429.** Bursts of `/cart/add`, `/cart/change`, the password POST and `/search` get a `cf-mitigated: challenge` 429 lasting 20+ minutes. The harness therefore (a) caches the login for 6 h and seeded carts for 3 h, (b) paces `/cart/add` (150 s) and `/cart/change` (60 s) globally, (c) **answers a repeated `/cart/add` for a variant from the recorded earlier real response** (status and body, `t6bc-lib.mjs` `newPage`). Seeds (the carts), the first real 422 on F_3p and every `/cart/change` and `/cart` POST were real; later "add" clicks in C6b.6/8/10/13/21 were replayed (the server cart doesn't change on those, the drawer re-renders from the recorded sections). QA should rerun with real adds when the limit allows.
4. Base red evidence recorded for C6b.4, C6b.5, C6b.6(a) and C6b.8(a) only (`t6bc-drawer-base.json`, `t6bc-drawer-base5.json`); the others were blocked by the 429s. `N_f` was measured on the final tree (5, 8, 2; empty also 2 on base).
5. C6b.10 flow ran at 1440 and 430, not 375.
6. `t6bc-focus.mjs` is not a separate file: `t6bc-facts.mjs` covers C6b.16 and Step 0 items 4, 5, 7.
7. Step 5 stale guard sits after the tooltip element is created and before it is shown (the element may exist hidden; C6b.14(h) checks it isn't visible).

## Bug fix verification approach

Not a `fix-` slug; not applicable.

## Out-of-scope observations

- `loading__spinner` has a literal `hidden` class in `sections/product.liquid` (existing).
- The header's Escape handler focuses the menu toggle even when it is closed (plan RB1, known).

## Questions

None blocking. Owner decision worth having: whether the Supercycle embed's preloads (5 CSS and a script) should be reduced, since they use the whole preload cap (deviation 1).
