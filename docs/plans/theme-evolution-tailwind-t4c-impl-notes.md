# Impl notes: Tailwind phase T4c (rich text `prose`, D6 removals, N1)

Plan: `docs/plans/theme-evolution-tailwind-t4c.md` (Rev 2.1, review APPROVE). Base: `main` at `c3a5fa3`; work committed directly on `main`. Nothing pushed to git, live #138872651872 or staging #187953643616. Dev server only on the private dev theme #187953938528; last started from the repo root, then stopped, so the dev theme matches HEAD (before these notes' commit). No server is running. The storefront password was never printed, written or committed (read inside `t0-lib.mjs` / `t4cc-liveprobe.mjs` only).

## Step 0 gate (C4c.20(a)): PASS, nothing was blocked

Scratch end state (`git archive` of HEAD, `npm ci`, plugin 0.5.20, every Section 5 edit, selector `.shopify-policy__body`, both leak lines): **58,308 minified / 11,082 gzip (`gzip -9 -c file`)**. Budget 60,000 / 12,000: 1,692 / 918 spare. (The plan's estimate was 57,214-57,559 / 11,026-11,226; actual is about 750 B above the estimate's top, still inside.) The committed final file is **identical in size: 58,308 / 11,082** (C4c.20(b) holds).
- `.prose{` at byte 8,245, `.prose-tokens{` at 27,212, `.max-w-none{` at 24,560, all inside `@layer utilities` (opens at 7,299); `check-css-layers` passes.
- Plugin 0.5.20 is the newest 0.5.x (npm view). `R_vars`: 18 `--tw-prose-*` names in `DEFAULT` (+ invert set), exactly the plan's list; `--tw-prose-kbd-shadows` is a color (`oklab(21% ...)`), not a triplet. Not mapped, as planned.
- Item 9 (PXR on the scratch end state): `--tw-prose-body` on `prose prose-tokens` is `currentColor` (no order fallback needed); `prose max-w-none` computes `none`. **`M_ch` = 646.88 px** (plan guessed about 600). Leak probe without the two lines: prose `hr` `border-top-style: none` (width 0) and `blockquote` `border-left-style: none`, so **both lines kept**. The no-leak build was 58,195 / 11,069 (evidence `t4cc-rich-pxr-gate-noleak.json`).

## Commits

| Step | Commit | Files | `assets/tailwind.css` min / gzip |
|---|---|---|---|
| base | c3a5fa3 | | 43,803 / 9,253 |
| 1 | 97896fa | `sections/page.liquid` | 43,836 / 9,259 (+`.overflow-x-auto`) |
| 2 | 5ccb5e9 | `package.json`, `package-lock.json`, `src/tailwind.css`, `sections/page.liquid` | 58,177 / 11,052 (79 added selectors: `.prose` family, `.prose-tokens` x3) |
| 3 | d43b92c | `sections/article.liquid` | 58,177 / 11,052 |
| 4 | 01b7cc1 | `sections/blog.liquid` | same |
| 5 | 640538a | `sections/main-material-archive.liquid` | same |
| 6 | 5021e26 | `sections/product.liquid` | same |
| 7 | a77e079 | `sections/footer.liquid` | 58,333 / 11,092 (3 variant selectors) |
| 8 | 23049d4 | `sections/image-banner.liquid` | same |
| 9 | a0b9dd0 | `sections/related-products.liquid` | same |
| 10 | 9c87ca6 | `sections/article.liquid`, `sections/password.liquid` | same |
| 11 | 66afe6e | `src/tailwind.css` (policy rule, `.shopify-policy__body`) | 58,483 / 11,120 |
| 12 | 2d1a4bc | `src/tailwind.css` (four D6 rules removed) | **58,308 / 11,082** |
| 13 | a6db38f | `CLAUDE.md`, `AGENTS.md` | n/a |
| 14 | this commit | notes, `docs/qa/harness/t4cc-*`, `docs/qa/evidence/t4cc-*` | |

Every step: fresh `npm run build:css`, `assets/tailwind.css` staged with the change, `check:css` 0, `check:hidden` 0, `shopify theme check` 0 offenses (N files = 95; grows only because untracked harness/evidence files are inspected). Per-step selector diffs: `docs/qa/evidence/t4cc-selset-step2.txt`, `t4cc-step{3..12}.txt` (Steps 3-6 and 8-10 added 0 and removed 0; Step 12 removed exactly the four D6 selectors).

## Gated steps

- Step 1 (N1): ran. Step 0 item 5 found the widget (`div.pc--show-email-field`, in the server HTML) inside the page's `[data-rich-text]`.
- Steps 11 and 12: **both ran**. Item 6 resolved the selector `.shopify-policy__body` (chain `div < div.rte < div.shopify-policy__body < div.shopify-policy__container`; 5 `ul`, 0 `ol`, 4 `a`; no inline style). Only `/policies/privacy-policy` renders; the other six standard handles 404.
- Item 7 parity sweep (base, 15 pages + cart drawer open + fresh no-consent context, 375/1440): the only unclassed `ul`/`ol`/`a` outside rich text and the policy body are the footer's two copyright links (already `[&_a]:no-underline`). Nothing uncovered.
- Item 13 live probe (C4c.22) at Step 0: **VALID-PASS**, `Shopify.theme.id` 138872651872 role main on all seven pages, no app block/embed container found (one shadow host, no scripts), exactly one match per D6 rule (`ul:not([class]), ol:not([class]) {padding-inline-start:1.5em}`, `ul:not([class]) {list-style: outside}` (the compiled form of `disc`), `ol` decimal, `a` underline), both controls flipped (disc/24px -> none/0; underline -> none). Evidence `t4cc-liveprobe-step0.txt`. First attempt was INVALID (my `ul` matcher rejected `list-style: outside`); fixed in the harness and re-run (two logins in total). **Must be re-run immediately before any live push.**

## Deviations and findings

1. **`M_ch` is 646.88, not about 600, so PXW can't discriminate.** C4c.8(b)'s PXW at 1920 with `max_page_width` 110rem: description width 638 = parent 638, but 638 < `M_ch` + 2, so by the plan's own precheck the clause is **invalid** (it can't tell `max-w-none` from `65ch`). `max-w-none` on the PDP is not load-bearing at either page-width setting. Evidence `t4cc-pxw-head.txt`.
2. **Option C (widget sizing) can't be verified.** Item 5: the only readable width rule matching the widget is Dawn's `input[type=checkbox]{width:auto}` (legacy); the widget's own sheet `cdn.shopify.com/.../data-sale-opt-out.css` is cross-origin and unreadable; no inline style; the 378.8 px comes from a `label` (intrinsic text width). Verdict: unknown, not applied. `W_pc` = **378.8** at every width (end state and base). Focus rings: the checkbox and button have `outline: none` (computed), so **no ring to clip** (0 px on all four sides); the Tab sequence is checkbox, button, then out of the widget.
3. **C4c.16** all green: `X_page` 0 and `X_off'` empty at the seven widths (base 111/56/41/1); `X_in` = 163/108/93/53 at 320-430 and 0 at 768+; `scrollHeight - clientHeight` 0; box `overflow-x: auto`. **C4c.17**: every page 0, except `/policies/privacy-policy` at 320 = 5 on both base and head, offender `div.shopify-policy__container` (Shopify markup, outside T4c).
4. **Base proxies (Step 0 items 11-12)** were done partly: PXS base and head both rendered and compared (C4c.11); PXR base was rendered (`t4cc-rich-pxr-base.json`); base screenshots were taken at HEAD's parent via a pure `c3a5fa3` copy. PXS "related-products" at 375 never rendered recommendations within 10 s (null on both base and head), so that clause is **invalid at 375** (1440 valid, equal).
5. **PXR/PXS/PXP/PXW/PX6 used `git archive` scratch copies** (`headpx`, `basepx`, `base0`, `gate` in the scratchpad), never the repo tree; no scratch template or settings edit was ever in the repo. The scratch `assets/tailwind.css` equals head's (`cmp`).
6. The sweep's cart drawer is opened on `/` through `[data-header-cart-icon]` after seeding wax via the product form (drawer state `open`, 30 list/link elements).
7. C4c.9(b) on real pages: only the wrapper's `font-size`/`line-height` (16px / 28px) and the opt-out page's `p` margins were asserted; PDP descriptions are 0-185 characters of plain text (wax's is empty, an empty prose wrapper, as it was an empty wrapper before).
8. PX6 and the PXS palette variant ran last on `headpx`; settings were restored in the scratch copy (never in the repo).

## Gate results

| Criterion | Result |
|---|---|
| C4c.0 | PASS: `npm ci && npm run check:css` exit 0 on HEAD (tree clean apart from untracked evidence) |
| C4c.1 | PASS: 0 offenses at every step and on HEAD; `check:hidden` 0 |
| C4c.2 | PASS: nine schema shasums equal Step 0 (`t4cc-step0-schema-shas.txt`) |
| C4c.3 | PASS: `git diff c3a5fa3 --stat -- sections`: 9 files, 15 insertions, 12 deletions; `\| escape` counts equal Step 0 |
| C4c.4 | PASS: pinned `0.5.20` exact; one `@plugin`; first `.prose` inside `@layer utilities`; the only `prose-` word in scanned files is `prose-tokens`; no `.prose-*` modifier selector other than `.prose-tokens` |
| C4c.5 | PASS: tokens after `.prose` (27,212 > 8,245); all 15 mapped variables equal Section 5.1 on every PXR copy at 375 and 1440 (0 mismatches); unmapped ones are the plugin defaults; `max-width: none` on every `prose max-w-none` wrapper (PXR, real archive, three PDPs) |
| C4c.6 | PASS (PX6, 1440): p, h2, a, strong, blockquote `rgb(238, 17, 136)`; marker 30 %, hr 10 % of it; archive description 75 % (real page `oklab(... / 0.75)`); `pre` background unchanged |
| C4c.7 | PASS: six `prose prose-tokens` wrappers; rendered on opt-out, balanced-face, archive and three PDPs |
| C4c.8 | PASS (a): page/article/comment/excerpt PXR copies 271 at 375 and 646.9 at 1440, parent equals `W_c`; real opt-out page the same. (b): archive 287 = 287 (375) / 600 = 600 (1440); PDP 494 = 494 at 1440, 287 at 375. PXW invalid (deviation 1) |
| C4c.9 | PASS (a) on PXR: 16px/28px, p margins 20px, h2 24px 700, ul/ol padding 26px, a 500 underline, hr solid 1px, blockquote solid 4px. (b) wrapper metrics on real pages |
| C4c.10 | PASS (PXP): trigger `rgb(0, 112, 124)`, underline dotted, offset 4px, weight 500, also inside `strong`; hover `rgb(0, 76, 85)` and `div.eco-tooltip.is-visible` present |
| C4c.11 | PASS: PXS base == head at 375 and 1440 (footer link underline, ul disc 21px in a 14px wrapper; banner heading and text links underline 1px/3px; related heading link at 1440); palette variant footer link `rgb(238, 17, 136)` |
| C4c.12 | PASS (a) static, (c) PXR forms: `ul` disc 24px. (b) rendered `/password` classList not run (deviation: that form is Shopify's built-in page without a session; plan's logged-in route not re-run) |
| C4c.13 | PASS: none of the four strings; `html{line-height:normal}` and the cursor rule present; no `T4c */` left |
| C4c.14 | PASS: base vs head, 963 compared elements, 0 problems (`t4cc-sweep-base.json` vs `t4cc-sweep-head12.json`) |
| C4c.15 | PASS: privacy policy 9 elements, `list-style-type`, `list-style-position`, `padding-left`, `text-decoration-line` equal base at 375 and 1440 (ul disc, a underline); `ol` count 0 |
| C4c.16, C4c.17 | PASS (deviation 3) |
| C4c.18 | `H1` and heading order not separately re-run; Liquid diff changes no heading or image (C4c.3) |
| C4c.19 | PASS: selector diffs per step as listed |
| C4c.20 | PASS: gate 58,308 / 11,082; final equals it |
| C4c.21 | PASS: drawer add/update/remove/Escape at 1440 and 375 (`t4cc-regress-head.txt`). Pixel diff base vs head (`t4cc-shots-diff.txt`): `/`, wax, collections, search, 404, page, blog, password, cart identical at both widths; p3p/snow/archive differ (description and archive line height; sizes changed) |
| C4c.22 | VALID-PASS at Step 0; re-run before the live push |

## Observations for QA and the owner

- `M_ch` 646.88 (about 647 px) is the measure on pages, articles, comments, excerpts. PXR screenshots `docs/qa/screenshots/t4c-head-{pxr,pxp,optout}-{1440,375}.png` and base/head page shots exist locally (gitignored).
- Archive: the PXR copy's headings show centered text; the archive card grid moves down (3,835 vs 3,862 px tall at 375, 1,620 vs 1,629 at 1440).
- Heading font in rich text is the body font (Q4c.7) as planned.

## Out-of-scope observations

- Archive description has a stray `<meta charset>` inside its `<p>` (merchant content), as in T4b.
- The T4b `/policies/privacy-policy` 320 px overflow of 5 px is pre-existing Shopify markup.

## Commands to run locally

```
npm ci && npm run build:css
npm run check:css && npm run check:hidden && shopify theme check
shopify theme dev --theme 187953938528      # private dev theme only
export T4CC_STATE=<scratch>/state.json      # cached session cookie, not the password
node docs/qa/harness/t4cc-rich.mjs "$U" optout|pxr <label> ; t4cc-real.mjs ; t4cc-sweep.mjs "$U" sweep <label> / diff <a> <b>
node docs/qa/harness/t4cc-overflow.mjs "$U" <label> ; t4cc-pxs.mjs ; t4cc-regress.mjs ; t4cc-shots.mjs
node docs/qa/harness/t4cc-liveprobe.mjs run [recorded.json] [--out file]   # READ-ONLY, live; re-run before any live push
node docs/qa/harness/t4cc-proxy.mjs gen|pxs|px6|pxw <SCRATCH dir>          # scratch copies only
```

## QA focus

PDP and archive visual change (owner check 3, E4c.2/E4c.3), the opt-out page inside the privacy widget (E4c.8, 16px/28px inherited text), policy page parity, footer/banner/related links in the theme editor, `/password` form error list (not rendered by the theme without a session), PXW inconclusive, related-products 375 clause.

## Bug fix verification approach

Not applicable (feature phase). For N1: open `/pages/data-sharing-opt-out` at 320-430; `scrollWidth - innerWidth` must be 0 and the widget scrolls inside the content box.
