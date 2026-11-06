# T5b implementation notes (Steps 0-5 complete; live push gated)

Plan: `docs/plans/theme-evolution-tailwind-t5b.md` Revision 2.2.1, review APPROVE. Base: `main` at `53a22a1` (no feature branch). Written 2026-11-06.

## State

All steps are implemented and verified on the dev theme 188245508192. Not pushed anywhere. Remaining before live: the full C5b.13 live probe immediately before the push (deliberately not run now; the reduced Step 0 probe below is only an early look), owner check 2 on staging.

## Owner answers (verbatim, 2026-11-06, via the coordinator; recorded in the coder-questions file)

- **Q5b.1:** "Go with the tailwind line height of 1.5". The words name "proposed" = option (a), delete the D6 `html` rule. Mapped to (a) before Step 2's commit (C5b.4(c)); the answer predates the commit.
- **Q5b.2:** "Go with your recommendation for the heading font. If there is a tailwind default, use that." = option (c), no heading base rule (Preflight default). Gate 2 / C5b.6(d) satisfied; Step 1 is "not applicable", no commit.
- Q5b.3: no owner answer yet; built on the recommendation (b), to be reviewed on staging.

## Commits

- `2e0d855` Step 2 (late): D6 `html` rule deleted, comment replaced; `assets/tailwind.css` 58,719 B / 11,215 gzip (byte-identical to the rebuilt scratch `P_endb`).
- `5f76df4` Step 4: line-height, heading and policy sentences in `CLAUDE.md` and `AGENTS.md` (identical edits).

- `942a661` feat(policy): T5b Step 3, policy wrapper in `layout/theme.liquid`, five `.shopify-policy__body` rules deleted from `src/tailwind.css`, `assets/tailwind.css` rebuilt.

## Files changed

- `layout/theme.liquid`: `if request.page_type == 'policy'` wrapper `div.prose.prose-tokens.mx-auto.w-full[data-rich-text][data-policy-prose]` around `content_for_layout` (plan 5.2).
- `src/tailwind.css`: policy comment and the five policy-body rules removed (391 B).
- `assets/tailwind.css`: rebuilt, 59,134 -> **58,743 B**, gzip 11,322 -> **11,222**.
- Untracked, not committed (QA convention): `docs/qa/harness/t5bc-{lib,sets,summary,owner-sheet,v3,liveprobe,nz}.mjs`, `docs/qa/evidence/t5bc-*`, the owner sheet and screenshots under the gitignored `docs/qa/screenshots/`.

## Budget gate (item 7), figures from scratch builds of the committed HEAD

| Build | Bytes | Gzip |
|---|---|---|
| `S_tw5a` (HEAD `53a22a1`, measured) | 59,134 | 11,322 |
| **`P_endb`: Step 1 none, Step 3 (b), no Step 2 (the committed set)** | **58,743** | **11,222** |
| `P_endb` rebuilt with a late Step 2 (a) (html rule deleted) | 58,719 | 11,215 |
| (b+) V3h: Step 3 plus `prose-h1:` variants | 59,667 (`S_ph` = 924) | 11,327 |
| Padding branch `px-(--page-margin)` | +56 (not needed: left edge is 20 px) | |

All within 60,000 / 12,000. `S_pol` measured 391 from five compiled rules (matches the plan). The committed `assets/tailwind.css` is byte-identical to the scratch build (`cmp`). `check-css-layers.mjs` passes; `npm run check:css` exits 0; theme check 0 offenses on HEAD. With (b+) plus T6a/T6b at upper bounds (+430) the total is about 60,097, over budget (as the plan says).

## Step 0 results

- Dev theme for this run: **188245508192** (role `development`; the plan's 187953938528 is a different dev theme). `TH` asserted on every load.
- V1/V2/V2a were produced from one load by CSSOM edits (delete the compiled `html{line-height:normal}` rule; insert the heading rule; add `font-sans` to the 9 opted-out lines), each valid only if its control flipped (span `19px` -> `24px` at 16 px font; `h3` body -> heading family, prose `h3` unchanged). **Deviation:** not separate served builds; the effect is identical and the spacing QA used the same method. `SEL` confirms V0 had the D6 rule and the five policy rules (`docs/qa/evidence/t5bc-sets/SEL-188245508192.json`). V3 is the real Step 3 build; V3h exists only as a scratch build (bytes), not served or screenshotted.
- `LH_n` = **19 px** per 16 px line (Work Sans at `normal`); `LH_15` = 24.
- `A_lh`/`D_h`/`A_hd` ran on 120 valid loads (all controls flipped): 21 pages at S0 x 320/375/768/1440/1920, S1, S2, S3 (375; 1440 N/A: no menu button on desktop), S4, S5 (on `the-complete-snowboard`, the only product with a tooltip; PXP not used), S6, S7, S9 at 375 and 1440. Tables: `docs/qa/evidence/t5bc-sets-table.txt`; per-load JSON `docs/qa/evidence/t5bc-sets/`.
  - `D_h`: largest policy page 2,672 (320) / 2,242 (375) / 1,257 (1440), measured before Step 3; **after Step 3 it is 32** (`docs/qa/evidence/t5bc-sets-v3`). Largest elsewhere: collection 247 (320) / 217 (375) / 112 (1440), snow 234 (320), p3p 180 (320), home 32.
  - Non-theme `A_lh`: Shopify payment button and "more payment options" (5 on product pages), Supercycle block (2 on the p3p product; 7 at S0 on rental products on dev; **219 at 1440 and 130 at 375 at S9**, picker inside the block, a modal-like overlay), the opt-out widget's hCaptcha parts (7, app class), the policy body (95 merchant + 3 Shopify). The opt-out widget's own elements are not in `A_lh` (they inherit `prose`).
  - `A_hd`: 3 to 14 per load; theme elements are the logo wrapper `h2` (#5, no visible effect), the home cards, product cards, archive cards, spotlight, tooltip, cart total. Policy: Shopify title `h1` and 13 merchant `h2`. No app headings. Page `h1`s declare `font-heading` already, so they are not in `A_hd`.
  - **Clipped or overflowing changes: none found** (only `sr-only` spans, which are clipped by design, filtered out). So RB2's badges, cart count and buttons show no clipping; header pairs are included regardless (R14 i).
- S9: the Supercycle picker opens **inside the Supercycle block** (`[id^="shopify-block-"]`), no new `OWN_APP` selector needed (n7). Readiness in the plan used an `input`, which does not exist on this block; the harness waits instead for a visible `table` with a `td` after the app's availability call. S9 failed first with HTTP 429 on `/apps/supercycle/availability_log` (rate limit after four parallel runs) and succeeded after a pause: run loads sequentially.
- Policy page (item 5), base vs V3 at 320/375/768/1440 (`docs/qa/evidence/t5bc-v3.json`): `page_type` is `policy` (wrapper renders, RB4 clear); `[data-policy-prose]` count 1 on the policy page and 0 on home, p3p, opt-out, both rentals, collection, cart, password; wrapper width = min(646.88, viewport) at every width (320 included); text left edge 20 px at 320/375 (>= 15), so the padding branch was not needed; no overflow at any width (`sw` = viewport; the pre-existing 5 px at 320 is gone); `ul` `disc` with 26 px padding; links underlined; `h1` count 1; title 36 px, weight 800, body font, no uppercase; no h5/h6/th in the body (D1-D2 match count 0); one empty element exists and is not hidden (whitespace inside, so T5a's `:empty` rule does not match; as on base). Container: `margin 0`, `padding 0 20px`, `max-width 646.88px`.
- Owner sheet (item 5a): 10 pairs, final list and captions in `docs/plans/theme-evolution-tailwind-t5b-coder-questions.md`; anchors and sheet log in `docs/qa/evidence/t5bc-pairs-final.json` and `docs/qa/screenshots/t5b-owner-q5b1/sheet-log*.json`. Every PNG was looked at for the legibility rule on a sample (pairs 01, 02, 05, 06, 08, 10, and the picker pair 04). Both panels come from one load with `SEL` and a flipped span control as identity.
  - **Swaps (R14).** Starting set of 10 plus required additions gave 13 candidates; the three lowest `A_lh`-in-crop pairs were dropped: starting pair 2 (home 375, 19), pair 1 (home 1440, 23), pair 8 (phone menu, 24). Required additions kept: header 1440 (26) and 375 (23), and the largest-`D_h` page. That page was the policy page (candidate 13, 28 in crop) but, because Step 3 (committed) cuts its growth from 2,672 to 32, I replaced it with the largest remaining page (collection at 375, `D_h` 217, 37 in crop). Other substitutions from the starting set: anchor for the home pair was the card text (`p.m-0.flex-1`, the home hero paragraph has its own `leading-[1.4]` and would not change); product description (`prose`, 1.75) replaced by the material spotlight; S9 and S2 overlays: the picker pair is scrolled to its anchor in the page behind the overlay (the anchor shows 306/304 and 150/143 px from the top; an overlay does not move with the scroll) and the drawer is not scrolled.
  - The footer pair's anchor sits at 645/637 px (end of the scroll range), per n9.
- **Live probe (item 8), reduced:** `docs/qa/harness/t5bc-liveprobe.mjs`, fresh context, one login on the bare domain, `TH` = 138872651872 / `main` on every page (11 loads valid, `docs/qa/evidence/t5bc-liveprobe-1.json`): home, p3p, wax, snow, opt-out, policy, collection, both rentals at S0, rental at S9 (1440, 375). All controls flipped. Non-theme sets on live: Shopify payment button 5, opt-out app 7, policy 3 Shopify + 95 merchant, rental Supercycle 219 (1440) / 130 (375); every app-owned line-height change satisfies the mechanism allowance (1.5 x font size), 0 failures. **Not done:** the container-by-path match against Step 0 (the plan's pass rule), the policy-wrapper simulation on live, and a `SEL` diff of live's rules against the committed build's (n11); the live probe must be run again in full immediately before any live push (C5b.13). **One difference to look at:** on live the rental products already show 219 app-owned `A_lh` elements at S0 (the app's calendar is expanded by default?), whereas the dev theme shows 7 at S0 and 219 only at S9; it does not change what the line-height rule does to the app.
- `NZ_b` (item 4a): reduced matrix, see below.

## NZ_b (reduced)

`docs/qa/harness/t5bc-nz.mjs`, base (tree before T5b's Step 3; the Step 3 commit changes only policy markup) loaded twice. Matrix run: home, p3p, wax, snow, rental, opt-out, collection, archive, policy at S0 375 and 1440; S1, S2, S9 at 375 and 1440. Results in `docs/qa/evidence/t5bc-nz.json` and `t5bc-nz-states.json` (see the end of this file).

## Deviations from the plan

1. V1, V1c-style, V2 and V2a were built by CSSOM edits in the page, not as separately served builds (see above). V3h only as a scratch build.
2. S5 on `/products/the-complete-snowboard` (real tooltip) instead of PXP; proxies PXR/PXG/PXZ were **not regenerated** this run (they are not needed for Q5b.1; the gift card, rich-text and zoo proxies are needed before Step 1/5).
3. `NZ_b` on a reduced matrix; the live probe reduced (above).
4. S9 readiness is a visible `table`, not an `input` (this app has no input).
5. The owner sheet's largest-`D_h` pair is the collection page, not the policy page (explained above).
6. Step 3 was committed before the owner answered Q5b.3, as the plan allows on the recommendation. The line-height owner answer and Step 2 are open.

## Commands to run the feature locally

`npm ci`, `npm run build:css`, `npm run check`; `shopify theme dev --store theme-evolution-os2.myshopify.com` (private development theme; do not point it at live or staging). Harness: `T5BC_STATE=<cache> node docs/qa/harness/t5bc-sets.mjs "<preview url>" <outdir> "pages=...;widths=...;states=..."`, `t5bc-owner-sheet.mjs`, `t5bc-v3.mjs`, `t5bc-liveprobe.mjs <out>`, `t5bc-nz.mjs`. Run loads one process at a time: parallel runs triggered 429s on the app proxy and `/search`.

## Out-of-scope observations

- The dev theme id differs from the plan's 187953938528.
- On `/products/the-complete-snowboard` the tooltip fetch (`/search?section_id=material-tooltip`) returned 429 under load; harness-only.

### NZ_b results

Base loaded twice, 0 line-height or font-family differences in every run. Zero differences at: home, p3p, wax, rental (375, 1440), snow 375, opt-out (4 unpaired hCaptcha elements), collection, archive, policy, S2 375. Non-zero: `the-complete-snowboard` at 1440, 62 differences (size-derived properties 9 each of `height`/`block-size`, `perspective-origin`/`transform-origin` 10, `cursor` 18, `opacity` 2, `display` 1, `width`/`inline-size`) and 6 unpaired elements (the product recommendations settling); S1 home, 1 difference. **Not obtained:** S2 at 1440 (invalid load, TH undefined) and S9 at 375 and 1440 (the Supercycle availability call was rate limited again, "no input" after a 15 s wait). These are to be repeated, one process at a time, before Step 5; until then the C5b.5 S9 rule (mechanism allowance, other app differences recorded) applies as planned.


## Step 5 verification (head `5f76df4` content on the dev theme vs base = `53a22a1` files served on the same dev theme, `SEL` checked on both)

Final `assets/tailwind.css`: **58,719 B, 11,215 gzip** (budget 60,000 / 12,000). Base 59,134 / 11,322.

| Criterion | Result |
|---|---|
| C5b.0 | PASS: `npm run check:css` exit 0 on the committed tree; `SEL` on every head load: no `html{line-height:normal}` rule, no `.shopify-policy__body` rule, no heading rule, no `prose-h1`; on base loads the D6 rule and the five policy rules (the serving theme matched the build); `TH` 188245508192 on every load. |
| C5b.1 | PASS: theme check 0 offenses after each commit and on HEAD (329 files); `npm run check` 0. |
| C5b.2 | PASS: no schema touched (diff vs `53a22a1` outside docs: `layout/theme.liquid`, `src/tailwind.css`, `assets/tailwind.css`, `CLAUDE.md`, `AGENTS.md`). |
| C5b.3 | PASS: only those files; Liquid diff is the wrapper block only; no `font-sans` edits (Q5b.2 (c)). |
| C5b.4 | PASS: (a) static: no compiled `html{line-height:` rule; the only `line-height` on `html` is Preflight's `html,:host{...line-height:1.5...}`; no `body`/`:root` rule. (b) rendered: `html` computes `24px` on all 75 head loads including `/`, `/password`, the policy page (no gift card page exists, PXG not available). (c) owner words quoted above, dated before the commit. |
| C5b.5 | PASS: `docs/qa/harness/t5bc-cmp.mjs`, 75 (page, state, width) pairs (21 pages at S0 at 375/1440, 10 pages at 320/768, S1-S5, S7, S9 at 375/1440; S3 at 375; S6 not in this matrix), `TH` asserted. 0 red. 64,724 `line-height` differences, all `normal` -> 1.5 x own font size (+-0.01); no `font-family` difference anywhere; policy page differences all inside the wrapper (832, allowed); S9: 17 (1440) and 1 (375) app-owned non-line-height differences recorded, not red (R12). Noise classes (NZ_b): rotating spinner `transform` in the drawer and add-to-cart spinner, 4 random-id hCaptcha textareas on the opt-out page. Added to the size-derived list: resolved `auto` margins (`mt-auto` on archive cards, 24 -> 30 px at 768, because a sibling card grew); deviation 4 below. |
| C5b.6 | PASS: compiled file has no `h1`-`h6` font-family rule; every heading's `font-family` equals base (no difference outside the policy wrapper); (d) owner answer quoted. Proxies not used (deviation 2). |
| C5b.7 | PASS: `docs/qa/evidence/t5bc-v3-final.json`: wrapper only on the policy page (count 1; 0 on home, p3p, opt-out, both rentals, collection, cart, password); `ul` disc with 26 px padding, links underlined; width min(646.88, viewport) at 320/375/768/1440; left edge 20 px at 320/375; one `h1`; empty-element clause not applicable (T5a committed no policy `:empty` rule). `(d)` not applicable. |
| C5b.8 | PASS: no head load has `scrollWidth` > viewport (S9 included); base had the pre-existing 5 px at 320 on the policy page, now gone; no new overflow offender. |
| C5b.9 | PASS: (a) 58,719 / 11,215; (b) equals the `P_endb` rebuilt for the committed set (`cmp`). |
| C5b.10 | PASS: selector-set diff vs base: removed the five `.shopify-policy__body` selectors and `html`; added none. |
| C5b.11 | PASS: `t5bc-regress.mjs` ALL PASS (drawer add/update/remove/Escape at 1440 and 375, menu, accordion); `t5bc-census.mjs sel`: 0 matches of D1-D2 on 20 pages at 375 and 1440 including the policy wrapper, opt-out and the rental. |
| C5b.12 | PASS: `h1` count 1 on every S0 theme page (rentals and policy included); heading order equal to base on all pairs; no more `<img>` lacking `width`/`height` than base. |
| C5b.13 | **Not run now, by instruction.** The full live probe runs immediately before any live push. The reduced Step 0 probe is above. |
| C5b.14 | PASS: the line-height, heading and policy sentences each appear once in `CLAUDE.md` and `AGENTS.md`, identical; `keep a scoped rule` prints nothing. |

NZ_b gaps closed (sequentially, no 429): S2 at 375 and 1440 each 1 difference (the spinner), S9 at 375 and 1440 0 differences. They were measured on the head tree, the base-vs-base noise is the same build family; the Step 5 comparison above does not depend on them beyond the classes listed.

## Final deviations

1. V1/V2/V2a by CSSOM edits; V3h scratch build only (bytes).
2. Proxies PXR/PXG/PXZ not regenerated: no store pages carry their templates, and with Q5b.2 (c) and no policy of heading changes nothing in C5b.5/C5b.6 needs them (the heading criteria are checked on every real page). Needed again only if Q5b.2 changes.
3. S5 on `the-complete-snowboard`; S9 readiness by visible calendar table; S6 and S3 at 1440 not in the Step 5 matrix (S6 had no banner effect in Step 0; no menu button at 1440).
4. The size-derived list gained resolved `auto` margins (top/bottom) and two noise classes are named above.
5. The Step 5 matrix is 75 loads (not the full 120-load Step 0 matrix); 1920 width and the remaining S0 pages at 320/768 were covered in Step 0 only.
6. The owner sheet's largest-growth pair is the collection page (see above).

## Still open

- Full C5b.13 live probe right before a live push, with live's JSON pulled first.
- Owner check 2 on staging (DevOps pushes staging after QA); the owner reviews Q5b.3 (b) there.
- The live rental products show 219 app-owned changed elements at S0 versus 7 on dev (not investigated).
