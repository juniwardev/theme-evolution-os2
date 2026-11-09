# QA report: theme-evolution-tailwind-t5b-policy-spacing

Code under test: `89e3056` (`layout/theme.liquid`, `assets/tailwind.css`). HEAD at test `9152cb2`. Dev theme 188245508192, re-synced from the committed tree (`shopify theme push --ignore config/settings_data.json --nodelete`) before testing; `Shopify.theme.id` asserted on every load. Before = staging 187953643616 (read-only loads). Tool: Playwright (own scripts, `docs/qa/harness/t5bpsqa-*`, independent of the Coder's t5bps-*). Chrome DevTools MCP not used.

## Summary verdict: PASS WITH NITS

Blockers: none. All of A1-A10 are green.

Nits:
1. (info) `/collections/all` footer top differs between dev and staging (375: 5933.5 vs 2241.5; 1440: 6173 vs 3341). Not caused by this change: dev renders the T6a grid (`grid-fill`, 1 col at 375, 2 at 1440) and staging the older `grid-cols-2 md:grid-cols-3`. The code diff touches only the policy branch. Staging therefore does not appear to carry T6a's collection section; the impl notes and plan say it does. Worth the orchestrator knowing before judging staging as "T5b + T6a".
2. (info) Product page footer at 1440: Coder saw 2392.7 vs 2301.3. In my runs it was 2392.7 on both dev and staging, at 375 2867.3 on both. Confirmed not caused by this change (the diff cannot reach a product page; `[data-policy-prose]` count 0). Variation between runs is consistent with app/lazy content, not proven app-owned.
3. (info) Opt-out `G_bot` is `PB`+16 (80 vs 64 at 768+; 56 vs 40 below). It is the privacy widget button ending its prose box (R5), so the policy page's space above the footer is 16 px less than the opt-out page's. Matches `PB` exactly, which is the stated goal.
4. (visible, expected, R4) Desktop text column widens 646.9 vs 606.9 and moves 20 px outward on each side.
5. Theme editor not checked (admin login out of reach). Pending for the owner; policy pages have no template or settings (plan R8).

## Gates
- `npm ci && npm run check:css`: exit 0. `shopify theme check`: 347 files, no offenses.
- `assets/tailwind.css`: 59,172 B, 11,331 B gzip -9 (budget 60,000 / 12,000; within). Matches the Coder.
- `src/tailwind.css` not in the commit (`git diff --stat 89e3056^ 89e3056 -- src` empty).

## A1-A4 (policy `/policies/privacy-policy` vs `/pages/data-sharing-opt-out`, same run, px)
Head (dev). `G_top` / `C_L` / `C_R` / `C_w` / `T_L` / `T_R` / `PT=PB` / `G_bot` / `W_gap` / `X_page`:

| W | G_top (opt-out) | C_L / C_R (opt-out same) | C_w | T_L / T_R | PT=PB | G_bot | W_gap | X |
|---|---|---|---|---|---|---|---|---|
| 320 | 40 (40) | 52 / 268 (same) | 216 | 52 / 268 | 40 | 40 | 0 | 0 |
| 375 | 40 (40) | 52 / 323 (same) | 271 | 52 / 323 | 40 | 40 | 0 | 0 |
| 768 | 64 (64) | 60.56 / 707.44 (same) | 646.88 | same | 64 | 64 | 0 | 0 |
| 1024 | 64 (64) | 188.56 / 835.44 (same) | 646.88 | same | 64 | 64 | 0 | 0 |
| 1440 | 64 (64) | 396.56 / 1043.44 (same) | 646.88 | same | 64 | 64 | 0 | 0 |

Before (staging): `G_top` 0, `PT`=`PB` 0, `G_bot` 20, `T_L` = `C_L`+20 at 768+ (e.g. 416.56 at 1440; text column 606.9), 20 at phones; `X_page` 0.
- A1 green; A2 green (container computes `padding-left/right: 0px`, `T_L`=`C_L`, `T_R`=`C_R`); A4 green (216 = 320-104, 271 = 375-104; 646.88 from 768).
- A3 green: `PB` 40/64, `G_bot` = `PB`, `W_gap` 0 (equals the old wrapper-to-footer relation); the five trailing-chain members (`div`x4, `p`) all compute `margin-bottom: 0px` at 320, 375, 1440 (before: last `p` had 20px). Opt-out `G_bot` = `PB`+16 (nit 3).

## A5/A6
- A5: at 375 and 1440, 93 elements outside the trailing chain paired by DOM path relative to `[data-policy-prose]`: 0 differences in `margin-top`/`margin-bottom` vs staging; 6 witnesses (last-child elements outside the chain with non-zero `margin-bottom`).
- A6 at 320, 375, 1440: 5 `ul`, all `disc` with 26 px inline-start padding; 4 `a`, all underlined; one `h1` (H1 = 1).

## A7 (320)
`X_page` 0 at every W including 320. Removing `wrap-break-word` in the page at 320 gives `X_page` 17 (restoring it: 0), so the Coder's added class is needed and sufficient. At 360 it is 0 either way. The only long word in a list is a 34-character URL (`https://globalprivacycontrol.org/.`, widest li min-content 259 px vs 190 available); it breaks mid-word across two lines inside the list item, no clipping (`docs/qa/screenshots/t5bps-qa-policy-320-longword-url.png`). Computed `overflow-wrap: break-word` on `li` (inherited from the prose box).

## A8
`assets/tailwind.css` diff vs `89e3056^` adds exactly: `.px-\(--page-margin\){padding-inline:var(--page-margin)}`; `:is(.\*\:px-0\!>*){padding-inline:0!important}`; the trailing-margin variant rule (`...:mb-0 :last-child:not([data-rich-text] :not(:last-child) *){margin-bottom:0}`); and `,.wrap-break-word` joined to the existing `.\[overflow-wrap\:break-word\]` rule. Nothing removed, no `.container` or other rule, no custom CSS in `src/` or the markup. Delta +268 B / +93 B gzip.

## A9 (375 and 1440; staging as before)
`[data-policy-prose]` count 0, `G_top` equal on contact (`/pages/contact` 200, one h1), opt-out, blog, collections/all, search, cart, `/products/the-complete-snowboard`; `X_page` 0 everywhere. Footer tops equal on all pages except `/collections/all` (nit 1, theme-content difference, unrelated). Statically the `{%- else -%}` branch still prints a bare `{{ content_for_layout }}` and the new block occurs once. No console-error check beyond page loads (no failures observed; page loads all succeeded, 0 errors in the harness).

## A10
Green (gates above).

## Console, network, accessibility, performance
- Harness loads: no failures or timeouts in this run. Console messages were not separately audited. One `h1` on the policy page, heading order unchanged (A5/A6). No performance concerns; +93 B gzip CSS.

## Screenshots (gitignored, `docs/qa/screenshots/`)
`t5bps-{stg,head}-{policy,optout}-{375,1440}-{top,bottom}.png` (stg = before, head = after), plus `t5bps-qa-policy-320-longword-url.png` and `t5bps-qa-policy-320-longword-list.png`.

## Evidence and harness
`docs/qa/evidence/t5bpsqa-{head,stg}-{spacing,others}.json`, `t5bpsqa-wrap.json`; harness `docs/qa/harness/t5bpsqa-{run,analyse,wrap,shot-url,coll}.mjs`.

Verdict: PASS WITH NITS
