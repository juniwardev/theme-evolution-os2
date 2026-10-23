# Impl notes: Tailwind phase T5a (Rev 2.2.2: Step 0 passed, Steps 1-2 committed, stopped at C5a.8, Q-C6)

Plan: `docs/plans/theme-evolution-tailwind-t5a.md` (Rev 2.1, review APPROVE). Base: `main`, theme files of `428094b`; HEAD at the end is `aaa03c8` (the coordinator's docs-only T6 commit; no theme, `src/`, scripts or package change). **No commit was made by the Coder, nothing pushed, no theme file touched.** Questions: `docs/plans/theme-evolution-tailwind-t5a-coder-questions.md` (Q-C1 and Q-C2 stop the gate; Q-C3 to Q-C5 are rulings for Step 9).

The storefront password was never printed, written or committed (read only inside `t0-lib.mjs`; the dev server got it through an environment variable set for that command only). The dev server ran only on the private dev theme #187953938528 (once from the repo root, once from a scratch copy, once again from the repo root); it is stopped, and the dev theme matches HEAD (last sync: repo root). Live and staging were only read (live probe: GETs and one login).

## Gate result

STOP. See the questions file for the figures. In short: `P_end` 58,675 / 11,219 (pass), live probe VALID-PASS, but one `TOG` group (hCaptcha popup divs on the opt-out page) has no allowed classification, and the image-banner wrapper prediction is wrong (no change, so Step 1's first commit and C5a.12(a) contradict parity).

## Step 0 figures

- Baseline: `assets/tailwind.css` 58,366 / 11,104; `assets/base.css` 80,537 bytes; 65 CSS files; theme check 0 (106 files); schema shasums `docs/qa/evidence/t5ac-step0-schema-shas.txt`.
- `P_end` scratch (`git archive` + `npm ci` + all section 5 edits with the recommendations: word-break, policy list, link and hover rules, checkbox margin, merchant-HTML `:empty` rule, `empty:hidden` on the vendor line, leak lines and card fallbacks deleted, shorter layer statement, `base.css` link removed): **58,675 / 11,219**. Per-step sizes are not recorded because no step ran. Evidence `t5ac-gate-pend.txt`.
- `TOG` 152 real runs, 33 proxy runs (all valid but one PXP 1440 run); `CEN` 176 runs, 0 unparsed; live probe VALID-PASS. Raw files were kept outside the repo; grouped results are in `docs/qa/evidence/t5ac-tog-groups-base.txt`, `t5ac-tog-groups-basepx.txt`, `t5ac-cen-agg-base.txt`, `t5ac-hover-base.json`, `t5ac-pixel-base.json` (on/off screenshots, 16 pages x 375 and 1440), `t5ac-facts-base.json`, `t5ac-liveprobe-*`.

## Classification table so far (real pages and states; entries are collapsed by group, pseudo-element mirrors folded)

| # | Group (what changes when `base.css` goes) | Class | Mechanism / evidence |
|---|---|---|---|
| 1 | `list-style-type: none` to `disc` on 11 `.grid` elements and every descendant (Dawn's `.grid { list-style: none }` inherited) | N | Not a list item anywhere it shows; no `li` or `summary` marker entry; pixel-equal on 15 pages at 375 and 1440 |
| 2 | `flex-wrap: wrap` to `nowrap` on `.grid` elements | N | They are `display: grid`; rects equal; pixel-equal |
| 3 | `word-break: break-word` to `normal` on `h1`-`h5` and the `a`, `img`, `p`-less descendants inheriting it (header logo link and image, footer, policy headings, widget heading) | P | D5a.5, M3 (`h1`-`h5` rule); C5a.17 on PXZ |
| 4 | Policy page (Shopify): `ul` padding 32 px, `ul`/`li`/`strong`/`a` `list-style-position: inside`, `li::marker` margins, links' offset 4.8 px, thickness 1.6 px, 100 ms transition, hover thickness 3.2 px | P | D5a.6 (list rule, link rule, hover rule); hover measured (`t5ac-hover-base.json`) |
| 5 | Policy `div.rte::after` clearfix (`content: ""`, `display: block`, `clear: both`) | N | Zero-height block, rect equal; C5a.15 geometry |
| 6 | Privacy widget checkboxes `margin-right: 8px` to `0` (two inputs) | P | D5a.8 under Q5a.3 recommendation (keep), M3 |
| 7 | Widget error-state `small.form__message`, `svg.icon-error`, `circle`, `path`: `line-height`, icon width, `flex-shrink` | N (ruling Q-C4) | 0 x 0, not rendered until an error |
| 8 | Widget button and checkout button transitions | N (ruling Q-C4) | timing only |
| 9 | Light-DOM "Buy it now" button: `position`, insets, `::before` / `::after` boxes | N (ruling Q-C4) | pixel-equal on wax, p3p, snow; hover 0 diffs |
| 10 | `shopify-accelerated-checkout` custom properties (value `""` vs absent) | N | no value change |
| 11 | Spinner `z-index: 1` to `auto` | N | E5a.11; S7 not run (Step 0 item 10 skipped) |
| 12 | Accordion `summary`: `position: relative`, `::marker` text-wrap | N | E5a.7; pixel-equal |
| 13 | Focus: outline `0` to browser default on the focused menu link, accordion summary, payment button | A | E5a.1, Q5a.1 (a), recommendation applied, owner to confirm at staging (flag) |
| 14 | **hCaptcha popup `div:empty` x 3** | **unexplained** | Q-C1 |

Proxy groups (`t5ac-tog-groups-basepx.txt`): PXA announcement bar `margin-bottom` 32 px to 0 (A, E5a.4, with derived `grid-template-rows` and inset sizes); PXZ vendor copy hidden to shown (P, M1 on `snippets/card-product.liquid`); PXZ `prose` copy empty `div`, `a`, `ul`, `h3` (P, D5a.19); PXZ bare empty `div`, `a`, `ul`, `h3`, flex gap (A, E5a.17); tables, `hr`, `blockquote`, `h6`, `summary` (A, E5a.6); bare anchor cursor (Q-C3); PXZ challenge model (A, E5a.12); PXE wrapper: **no entry** (Q-C2).

## Recommendations applied (Q5a.1-Q5a.5), flagged for owner check 3

Applied in the scratch end state only (nothing in the repo): Q5a.1 (a) browser default focus ring; Q5a.2 accept the announcement gap loss; Q5a.3 keep the checkbox margin rule; Q5a.4 accept the unstyled captcha page (no fixture reaches it: `/challenge` is the theme 404); Q5a.5 (a) the scoped `[data-rich-text]` `:empty` rule. Each is "recommendation applied, owner to confirm at staging". Flag list for owner check 3: E5a.1, E5a.2, E5a.3, E5a.4, E5a.5 (S8 not run), E5a.6, E5a.12, E5a.16, plus E5a.18 if Q-C1 option (a) is chosen.

## Deviations from the plan

- Stopped at the gate; Step 0 items 6 (`NZ`), 9, 10, 11 and 13 not run; Steps 1-9 not started; `t5ac-cmp`, `-focus`, `-inflight`, `-overflow`, `-brb`, `-regress`, `-shots` not written.
- `SZ` widened (logical insets, `grid-template-rows/-columns`) and control artifacts filtered; the proxies PXE, PXA and PXP were combined into one scratch copy with PXZ, PXR and PXG (independent features; PXG written but not measured: it has no `base.css`).
- Owner selectors extended for the widget and the hCaptcha popup (see questions file).

## Commands to run locally

```
export T5AC_STATE=<scratch>/state.json T5AC_RAW=<scratch>/raw   # cached session cookie (never the password) and raw output
node docs/qa/harness/t5ac-tog.mjs "<previewBase>" base all tog S0           # TOG; also pages,widths,state args
node docs/qa/harness/t5ac-cen.mjs "<previewBase>" base all tog S0 ; node docs/qa/harness/t5ac-cen.mjs agg $T5AC_RAW
node docs/qa/harness/t5ac-groups.mjs $T5AC_RAW '^tog-base-'                 # classification groups
node docs/qa/harness/t5ac-pixel.mjs "<previewBase>" base home,p3p 375,1440  # on/off screenshots
node docs/qa/harness/t5ac-hover.mjs "<previewBase>" base ; node docs/qa/harness/t5ac-facts.mjs "<previewBase>" base
node docs/qa/harness/t5ac-proxy.mjs gen <scratch git-archive dir>            # proxies, scratch only
node docs/qa/harness/t5ac-ref.mjs $T5AC_RAW ref.json ; node docs/qa/harness/t5ac-liveprobe.mjs run ref.json   # READ-ONLY on live
```
Dev server: `SHOPIFY_FLAG_STORE_PASSWORD` set for that one command, `shopify theme dev --theme 187953938528 --store theme-evolution-os2.myshopify.com`.

## Out-of-scope observations

- The blank image-banner buttons wrapper leaves a 20 px `mt-5` margin on an empty `inline-flex` box (pre-existing; for T6).
- `/challenge` is the theme's 404; `/account/login` is Shopify-hosted, so the captcha and login pages stay unmeasured.


---

# Round 2 (after Revision 2.2.2)

Resumed on HEAD `96a8898` (`git diff --stat 428094b..HEAD -- . ':(exclude)docs'` empty, theme files unchanged). Dev server only on #187953938528 (repo root for real pages, a `git archive` scratch copy with the proxies for PXZ/PXR/PXE/PXA/PXP/PXG); live and staging untouched except the read-only probe of round 1; no push; password never printed (staged-diff grep counts: 0 for both commits).

## Gate result: PASS (Step 0 complete)

| Item | Result |
|---|---|
| 1 | preconditions hold; HEAD `96a8898` |
| 6 `NZ` | 228 base pairs: 0 property noise except 4 injected hCaptcha textareas on the opt-out page (random ids; paired by normalised id), 0 pixel noise; 30 proxy pairs: 0. (Before the snapshot fix the preview-bar wrapper made 78 pairs noisy; excluded since.) Evidence `t5ac-nz-*` |
| 7a hCaptcha | 12 widths, one load each, reference with `base.css` on then off: mask has `pointer-events: none`, 5% white wash, `visibility: hidden`; at 375 and 1440 checkbox, button and header cart icon return the same element on and off (none inside the container); `X_page` 0 and no offenders at all 12 widths on and off. **No fallback: D5a.21 not in the end state; E5a.18 A stands.** `t5ac-hc-base.json` |
| 7b `PXN` | 456 base loads (19 pages x 12 widths x A,B) + 16 state loads + 3 extra: on/off pixel differences only on landing (320-750 px, one tooltip underline: 148 px, 13 levels, identical on 3 repeats, no TOG entry, rects equal, inside the grown box), `p3p` 320 (the `h3` with a P entry), `optout` (checkbox label, P) and `policy` (page-height change, P rows). **Registered: 1 element** (`t5ac-pxn-registered.json`). Proxy pages all change height on/off (A rows), judged by C5a.10 offsets |
| 7c | PXP at 1440 valid on 3 of 3 attempts with the trigger re-hovered before D2 and D3 |
| 8 | **0 unexplained groups** over 186 TOG runs (`t5ac-classification-table.txt`, rules in `t5ac-class.mjs`). Real pages: N (list-style inheritance, flex-wrap on grids, summary, spinner, light-DOM checkout pseudo-boxes, widget transitions), P (word-break, policy rules, checkbox margin, error-message sizing), A (focus outline E5a.1, hCaptcha parts E5a.18). Proxies: E5a.4, E5a.6, E5a.12, E5a.17, vendor line P (M1), merchant-HTML empties P (D5a.19); PXE: no entry. **NC-1**: `small.form__message` is hidden by its own inline `style="display: none;"` (set by the widget), not by Dawn; no `hidden` attribute; Dawn's `.form__message { display: flex }` (legacy) never applied, so D5a.20's `display: flex` can't change the shown state beyond what Shopify's script sets inline. `t5ac-nc1-base.json` |
| 9 focus sweep | 19 pages x 2 widths + drawer + menu + widget at 320/375/390/430; every theme control without its own focus utility has no outline today (e.g. collection 44 of 44). `t5ac-focus-base.json` |
| 10 S7 | route hit once at 375 and 1440; during the request the spinner is `display: block`, the label `visibility: hidden`; after, the spinner `none`. `t5ac-inflight-base.json` |
| 11 `B_rb` base | 23,205 B (tailwind 10,424 + base.css 10,813 + accelerated-checkout 1,598 + styles 370), on `/` and the 3p product. With `base.css` gone about 12,4xx, under `B_rb0` 15,910 |
| 12 `P_end` | **58,850 / 11,269** (D5a.20 included, no D5a.21, no banner edit; the banner edit alone is byte-identical, shasum `f1fd1e48...`). Projection 58,850-58,932 / 11,264-11,344. Spare 1,150 / 731. `check-css-layers` 0. Compiled forms in `t5ac-gate-pend2.txt` |
| 13 | base screenshots and geometry, 12 widths, S0, plus S1-S4 at 375/1440 (S3 at 375/989), proxies and `/password`, loads A and B each, in the RC-1 order (control reads `none` before the base shot; toggled loads never reused) |
| 14 | stands (VALID-PASS) |

## Commits and CSS sizes

| Step | Commit | Files | `assets/tailwind.css` min / gzip |
|---|---|---|---|
| base | `96a8898` | | 58,366 / 11,104 |
| 1 | `430d533` | `snippets/card-product.liquid` (vendor line `empty:hidden`; no image-banner edit, Q-C2) | 58,400 / 11,119 |
| 2 | `7dfb945` | `src/tailwind.css` (parity block incl. D5a.20, extended policy link rule) | 58,983 / 11,303 (leak lines still in until Step 5) |

Per step: fresh `npm run build:css`, `assets/tailwind.css` staged with the change, `check:css` 0, `check:hidden` 0, `shopify theme check` 0 (125 files incl. untracked harness), selector diffs `t5ac-selset-step1/2.txt` (added exactly the planned selectors).

## C5a.8 after Step 2

Theme-layout pages, S0 at 12 widths, S1-S4, PXZ, PXR, PXE+PXA, PXP (S0, S5): **no difference outside NZ**. Only `/password` and PXG differ: `word-break: break-word` appears on `h1`/`h2` (Q-C6), pixel-identical, no element moves.

## Deviations (round 2)

- Stopped after Step 2 on Q-C6; Steps 3-9 not started; `t5ac-regress`, `-overflow`, `-focus` head runs and the head-side C5a.9 to C5a.26 runs are not done.
- Harness: snapshot keys use ids and skip the preview bar and pixel sandbox; `t5ac-class.mjs` encodes the classification; the proxy copies were captured from loads A only at head.
- Selector-set diffs print a boundary artifact (a rule that follows an `@layer` opener appears as removed and added); no real removal.

## Owner check 3 flag list

E5a.1, E5a.2, E5a.3, E5a.4, E5a.5 (S8 not run), E5a.6 (now including the bare anchor cursor), E5a.12, E5a.16, **E5a.18** (hCaptcha parts, A), and E5a.19 (not flagged by the plan; listed for sight). Q-C6's row would join if accepted.
