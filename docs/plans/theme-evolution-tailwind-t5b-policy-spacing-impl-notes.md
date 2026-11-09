# Impl notes: T5b policy spacing (Rev 2.1)

Code commit (cherry-pick this in section 7.1): `89e3056` (`layout/theme.liquid`, `assets/tailwind.css` only). Base HEAD `ec3e0e4` on main. No branch. Not pushed.

## Files changed
- `layout/theme.liquid`: policy branch rebuilt as the plan's section 3 block (comment copied as written), plus `wrap-break-word` on the prose box (R2 pre-authorized fix, see Deviations).
- `assets/tailwind.css`: fresh `npm run build:css`.
- Docs commit: this file, `docs/qa/harness/t5bps-measure.mjs`, `t5bps-analyse.mjs`, `docs/qa/evidence/t5bps-*.json`.

## Run locally
`npm run build:css && npm run check:css`; push to dev theme 188245508192 with `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=188245508192 --ignore config/settings_data.json --nodelete --force`; measure from repo root: `node docs/qa/harness/t5bps-measure.mjs "<previewBase>" <out.json> policy|optout|deep|others [widths]`, then `node docs/qa/harness/t5bps-analyse.mjs`.

## Step 0 (unmodified tree on dev theme 188245508192)
- `S_css` 58,904 / 11,238. `shopify theme check`: 0 offenses. `check:css` exit 0.
- Policy base: `G_top` 0, `PT`/`PB` 0, `G_bot` 20, `W_gap` 0 at all five widths; `T_L` = `C_L` + 20; `C_w` (prose rect) already 646.9 from 768 (the 606.9 in the plan is the text column, `T_R - T_L`); `X_page` 0 everywhere.
- `TC` = `div.shopify-policy__container > div.shopify-policy__body > div.rte > div > p` (the last `p`, margin-bottom 20px; the other four are 0). Wrapper's only direct child: the container.
- Shopify sheet `https://.../cdn/shopifycloud/storefront/assets/storefront/policy-0e156355.css`, readable, all rules unlayered: `.shopify-policy__container{max-width:65ch;margin:0 auto;padding-left:20px;padding-right:20px}`, `.shopify-policy__title{text-align:center}`, `.shopify-policy__remote-policy-heading-wrapper{text-align:center}`, `.shopify-policy__remote-policy-body{margin-bottom:20px}`. No margin rule on `.shopify-policy__body`. So the `!` is needed (R1 holds).
- One visible empty `div` in the body (`...>div:0>div:27`), display block, not a last child, not in `TC` (R3 fine).
- Widest unbreakable run in an `li`: 253.06 px (27 `li`) > 190 available at 320, which predicted A7 red.
- A5 witnesses: 6 (last-child elements outside `TC` with non-zero margin-bottom).
- Opt-out base: `G_top` 40/64, `C_L` 52/52/60.56/188.56/396.56, `C_w` 216/271/646.9, `PB` 40/64, `G_bot` 56 (320, 375) and 80 (768+), i.e. `PB` + 16, from the privacy widget that ends its prose box (R5; its `T_R` 430 is the widget overflowing inside `overflow-x-auto`).
- Contact: `/pages/contact` returns 200, one `h1`, used as is.

## Results (head, dev theme 188245508192, `Shopify.theme.id` asserted on every load)
| W | G_top (opt-out) | C_L / C_R | C_w | T_L / T_R | PB | G_bot | X_page |
|---|---|---|---|---|---|---|---|
| 320 | 40 (40) | 52 / 268 | 216 | 52 / 268 | 40 | 40 | 0 |
| 375 | 40 (40) | 52 / 323 | 271 | 52 / 323 | 40 | 40 | 0 |
| 768 | 64 (64) | 60.56 / 707.44 | 646.9 | 60.56 / 707.44 | 64 | 64 | 0 |
| 1024 | 64 (64) | 188.56 / 835.44 | 646.9 | same as C | 64 | 64 | 0 |
| 1440 | 64 (64) | 396.56 / 1043.44 | 646.9 | same as C | 64 | 64 | 0 |

- A1 green. A2 green (policy `C_L`/`C_R` equal opt-out's; `T_L`=`C_L`, `T_R`=`C_R`; container padding computes 0px/0px). A4 green (216 = 320-104, 271 = 375-104; 646.9 from 768). `W_gap` 0 = base.
- A3 green: `G_bot` = `PB` at every width; all five `TC` members compute `margin-bottom: 0` (320, 375, 1440). Opt-out `G_bot` is `PB` + 16 (widget), recorded not red.
- A5 green at 375 and 1440: 93 elements outside `TC` compared by path relative to `[data-policy-prose]`, 0 differences in margin-top/bottom; 6 witnesses.
- A6 green at 320, 375, 1440: 5 `ul`, all `disc` with `padding-inline-start` 26px; 4 `a`, all underline; `H1` = 1.
- A7: red at 320 first (`X_page` 17, no single offender listed); after `wrap-break-word` it is 0 at all widths (see Deviations).
- A8: diff adds exactly the three planned rules plus the `.wrap-break-word` selector joined to the existing `.\[overflow-wrap\:break-word\]` rule; nothing removed. New rules:
  - `.px-\(--page-margin\){padding-inline:var(--page-margin)}`
  - `:is(.\*\:px-0\!>*){padding-inline:0!important}`
  - `.\[\&_\:last-child\:not\(\[data-rich-text\]_\:not\(\:last-child\)_\*\)\]\:mb-0 :last-child:not([data-rich-text] :not(:last-child) *){margin-bottom:0}`
  - `,.wrap-break-word` appended to the existing break-word rule.
  - `S_css`: before 58,904 / 11,238, after **59,172 / 11,331** (+268 B, +93 B gzip). Without `wrap-break-word` it was 59,155 / 11,325 (+251). Within 60,000 / 12,000. `src/tailwind.css` unchanged. No `container` rule from the comment.
- A9: contact, opt-out, blog, collections/all, search, cart, product at 375 and 1440: `[data-policy-prose]` count 0, `G_top` and footer top equal base, except the product page footer at 1440 (2392.7 vs 2301.3; it also varied between two base runs, app-owned/dynamic, not red). Some loads of the first run timed out (`ERR_TIMED_OUT`); re-run into `t5bps-head-others2.json`; blog 375 passed in the first run (`t5bps-head-others.json`). Static: the `{%- else -%}` branch still prints a bare `{{ content_for_layout }}`; the block occurs once.
- A10: `npm run check:css` exit 0 (with the files staged), `shopify theme check` 0 offenses.

## Deviations
- `wrap-break-word` added to the prose box: A7 was red at 320 (`X_page` 17, as R2/N4 predicted from the 253 px unbreakable `li` run). This is the plan's pre-authorized fix; all of A1-A10 were re-run after it. The first (planned-only) build was 59,155 / 11,325.

## Notes
- `npm run check` (check:css) exits non-zero until the changed `assets/tailwind.css` is staged (it compares with the index); it was 0 once staged.
- Dev theme 188245508192 now carries this build (head). Dev theme push used `--ignore config/settings_data.json --nodelete`. No dev server was started.
- Out-of-scope observation: `.shopify-policy__title{text-align:center}` is Shopify's own rule; the policy title is not changed here (non-goal).

## What QA should look at first
The 320 phone width (the only width that needed the overflow fix; check long words in lists), the bottom gap above the footer at 375 and 1440, and the desktop column widening from 606.9 to 646.9 (R4) in screenshots beside the opt-out page.
