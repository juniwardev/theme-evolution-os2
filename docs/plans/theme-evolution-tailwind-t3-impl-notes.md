# Impl notes: Tailwind phase T3 (homepage legacy sections)

Plan: `docs/plans/theme-evolution-tailwind-t3.md` Revision 3.1. Review verdict: APPROVE (round 3).
Base: `main` at `9a87197` (plan, review and umbrella edits). No feature branch. Commits are local only. Nothing was pushed to git, and nothing was pushed to any Shopify theme except the private development theme #187953938528 (`shopify theme dev`, plus scratch-copy proxy runs). Live (#138872651872) and staging (#187953643616) were never written; staging was only read, through its preview URL, for the C3.26 base screenshots.

## Commits

| Step | SHA | Subject |
|---|---|---|
| 1 | `e2ed462` | `blocks/text.liquid` from the `CLAUDE.md` Text example |
| 2 | `b67afd9` | `blocks/group.liquid` from the `CLAUDE.md` Group example |
| 3 | `35e6c4f` | `sections/hello-world.liquid` + 12 `sections.hello_world.*` keys |
| 4 | `f3fb1a7` | `sections/image-banner.liquid` + `git rm assets/section-image-banner.css` |
| 5 | `ed31492` | Q10: three `color_scheme` objects deleted |
| 3 follow-up | `754fef3` | `title: ''` on the card links (deviation 2) |
| notes | (this commit) | harness `t3c-*`, evidence text, these notes |

## Files changed

| Path | Reason |
|---|---|
| `blocks/text.liquid` | Step 1: utilities and Liquid maps, stylesheet and inline `--text-align` removed. Schema untouched |
| `blocks/group.liquid` | Step 2: utilities, T2's scoped `.group` rule and stylesheet removed. Schema untouched |
| `sections/hello-world.liquid` | Step 3: utilities, `data-hello-*` hooks, translated strings, `<h2>` card titles, `alt=""`. Schema untouched |
| `locales/en.default.json` | Step 3: `sections.hello_world.*` (12 keys) |
| `sections/image-banner.liquid` | Step 4: utilities, Liquid prelude, one layered keyframes `{% stylesheet %}`; Step 5: `color_scheme` object deleted |
| `assets/section-image-banner.css` | Step 4: deleted (its only tag went in the same commit) |
| `sections/material-spotlight.liquid`, `sections/related-products.liquid` | Step 5: `color_scheme` object deleted (schema only) |
| `assets/tailwind.css` | rebuilt with every step that changed classes (fresh `build:css`, staged with the change) |
| `docs/qa/harness/t3c-*.mjs` | measurement harness (below) |
| `docs/qa/evidence/t3c-*` | text output of the runs quoted below |

Not edited: `config/settings_data.json`, `templates/*.json`, `sections/*-group.json`, `locales/en.default.schema.json`, `src/tailwind.css`, `layout/*`, `snippets/*`, `CLAUDE.md`. `git diff 9a87197 -- templates config 'sections/*-group.json' locales/en.default.schema.json` is empty.

## Run locally

`npm ci && npm run check:css`; `npm run dev` (or `shopify theme dev`, private dev theme; preview `https://theme-evolution-os2.myshopify.com/?preview_theme_id=187953938528`). Harness, from the repo root:

- `node docs/qa/harness/t3c-dump.mjs "<preview>" <label> <outDir> [pages] [widths] [shots]` writes geometry and computed-style dumps; `t3c-diff.mjs <dir>` compares `base-*` and `head-*`; `t3c-checks.mjs <dir>` evaluates C3.5, C3.13 (1920), C3.17-C3.22 on the dumps.
- `t3c-sweep.mjs` (C3.10, C3.11, C3.24 probe), `t3c-mcss.mjs` (M_css), `t3c-facts.mjs` (`styles.css`, label widths, preload headers), `t3c-regress.mjs` + `t3c-pixdiff.mjs` (C3.26), `t3c-sync.mjs` (dev theme equals repo).
- Proxy matrix: `git archive <commit>` into a scratch dir, add `sections/t3-proxy.liquid` (the plan's `P` section), run `shopify theme dev --path <scratch>`, then `t3c-proxy.mjs <preview> <scratch> <base|head> <outDir> [variants|PALETTE]`; `t3c-analyze.mjs <outDir>` and `t3c-blocks.mjs <outDir>` evaluate it. `t3c-q10.mjs` applies the three Q10 deletions; `t3c-schema.mjs` is C3.2(b).
- The password is read from `docs/dev-fixtures.md` inside `t0-lib.mjs` and is never printed.

All dev servers are stopped. The last server run was the repo's; `t3c-sync.mjs` confirmed the dev theme equals the repo (banner section id is the repo key, `--color-foreground` `#333333`, no proxy section) before it was stopped.

## Per-step gate results

Every commit: fresh `npm run build:css`, `assets/tailwind.css` staged with the change, `npm run check:css` exit 0, `npm run check:hidden` exit 0, `shopify theme check` = exactly 1 offense (`TranslationKeyExists`, `cart-drawer.liquid`; "59 files inspected, 1 total offenses").

| Step | check:css | check:hidden | theme check | `tailwind.css` bytes / gzip -9 | Schema shasums |
|---|---|---|---|---|---|
| 0 (9a87197) | 0 | 0 | 1 | 35,990 / 7,963 | text `7f23c863ed07`, group `7daea9c6440e`, hello `97b5c1f6d007`, banner `0357e01ec286`, spotlight `82c538d97cf5`, related `eaee76ceb197` |
| 1 | 0 | 0 | 1 | 36,173 / 7,997 | text `7f23c863ed07` (= step 0) |
| 2 | 0 | 0 | 1 | 36,327 / 8,023 | group `7daea9c6440e` (= step 0) |
| 3 | 0 | 0 | 1 | 37,341 / 8,235 | hello `97b5c1f6d007` (= step 0) |
| 4 | 0 | 0 | 1 | 41,801 / 8,989 | banner `0357e01ec286` (= step 0) |
| 5 | 0 | 0 | 1 | 41,801 / 8,989 | banner `931acf5a5827`, spotlight `aae338ff1abe`, related `1aa0ba54a76f` (changed by design) |
| 3 follow-up | 0 | 0 | 1 | 41,801 / 8,989 | hello unchanged |

Step 1/2: the markup and Liquid are the `CLAUDE.md` Text and Group examples verbatim (copied, indentation aside). Step 4: `rg -n "section-image-banner" layout sections blocks snippets templates assets config` prints nothing; the Step 4 compiled-order self-check on the fresh minified file: `grep -c 'min-width:87.5rem'` = 1; `max-width:56.25rem` at offset 36603 after `max-width:44.375rem` at 33134 (exit 0); `grep -c 'min-width:1400px'` = 0. Step 5: C3.2(b) (`t3c-schema.mjs`): for all three, Step 0's settings minus `color_scheme` deep-equal HEAD's, other keys deep-equal; the diffs are deletions of 6, 6 and 7 lines; C3.3 greps are empty and `rg -c '"color_scheme"' templates` gives index 1, product 2, landing-page 1.

Step 0 item 10 (early Q10 theme-check prediction on a `git archive` copy with the three deletions): exactly the baseline offense; nothing named a template value (R7 did not fire).

## Step 0 facts (for QA, plan section 10)

- `r1` = 4096 / 2731 = 1.5 (banner image `width` / `height` attributes).
- Landing page renders **two** buttons ("Shop now", "Button label"; both `button button--primary` before).
- The hello-world illustration does not force a row overflow. Step 0 `X_off` on `/` and the landing page named only the buttons (`a.button`), `div.banner__buttons` and nothing else (right edges 396 on `/`, 428 on the landing page). Gate 4 passed; no `min-w-0` was needed.
- `styles.css` on `/` and on the 3p product: 3,464 bytes (1,295 gzip) before, contains `.welcome`, `.text`, `.group:is(`. After: 2,258 bytes (954 gzip), none of the three, contains `theme-banner-ambient` (the layered keyframes survived the bundler).
- Base `X_page` (E3.19): `/` 76 / 21 / 6 / 0 at 320 / 375 / 390 / 430; landing page 108 / 53 / 38 / 0.
- Label natural widths (`btn-*`, 16 px Oswald, `white-space: nowrap`): "Shop all" 120, "Button label" 154.5, "Shop now" 126.5. 120 + 154.5 + 10 = 284.5, below 326, so C3.15's 430 check discriminates grow-only builds.
- Base heading sequence on `/`: h1, h3, h3, h3, h2. Card link attributes before: `href`, `title=""`, `rel="nofollow"`.
- Base M_css: `/` `B_head` 20,939, `B_body` 1,412, `B_doc` 22,351, `N_dawn` 1; 3p and snowboard `B_doc` 20,939.
- Base C3.10 sweep on `/`: 32 unlayered matches (hello-world's `styles.css` rules, `section-image-banner.css`, the overlay `<style>`); 0 after.
- Base preload `Link` headers: `/` 6, 3p product 7.
- Heights of the banner `/` before: 1152 at 1440, 624 at 375.

## Key measurements (head, dev theme; evidence `docs/qa/evidence/t3c-home-land-checks.txt`)

`X_page` on `/` and on the landing page is **0 at 320, 375, 390, 430, 767, 768, 1023, 1024, 1440 and 1920**; `X_off` empty; every button inside the viewport (min left 52, max right -52 at 320-430; 220 px buttons at 767+).

| Page @ width | Base `X_page` | Head `X_page` |
|---|---|---|
| `/` @320 / 375 / 390 / 430 | 76 / 21 / 6 / 0 | 0 / 0 / 0 / 0 |
| landing @320 / 375 / 390 / 430 | 108 / 53 / 38 / 0 | 0 / 0 / 0 / 0 |

Banner box `max-width` (V5, `show_text_box`): **710px at 1024, 900px at 1440** (rem breakpoint works). B0 (non-boxed) box `max-width` 890 at 1440 (base 1424).

Two centred buttons on `/` (B0), x / y / w:

| Width | Wrapper x, w | Button 1 x, y, w | Button 2 x, y, w | Layout |
|---|---|---|---|---|
| 320 | 52, 216 | 52, 208.3, 216 | 52, 266.3, 216 | one per row |
| 375 | 52, 271 | 52, 189.5, 271 | 52, 247.5, 271 | one per row |
| 430 | 52, 326 | 52, 189.5, 326 | 52, 247.5, 326 | one per row |
| 767 | 158.5, 450 | 158.5, 199.8, 220 | 388.5, 199.8, 220 | side by side |
| 1440 | 495, 450 | 495, 582, 220 | 725, 582, 220 | side by side |

CSS size: `assets/tailwind.css` **41,801 bytes minified / 8,989 gzip -9** against the 60,000 / 12,000 budget (T3 added 5,811 / 1,026, inside the plan's 5,400-8,900 / 1,000-1,650 estimate). Gzip headroom for T4: 3,011 bytes.

M_css (head): `/`, landing, 3p, snowboard, wax all `B_head` 21,654 (`tailwind.css` 8,459, `base.css` 10,813, `accelerated-checkout.css` 1,598, `styles.css` 784), `B_body` 0, `N_dawn` 0. `/` `B_doc` 22,351 -> 21,654 (guard met). The 3p and snowboard pages `B_doc` 20,939 -> 21,654 (+715: `tailwind.css` +1,026, `styles.css` -311); reported, no threshold (C3.8).

## Geometry (x, y, w, h; section-relative y; base -> head; full tables `docs/qa/evidence/t3c-geometry-diff.txt`)

Every difference beyond 1 px belongs to a section 8 row. Selected rows, `/`:

| Element | @375 base | @375 head | @1440 base | @1440 head |
|---|---|---|---|---|
| hello band `<h1>` | 44,72,196.8,19 | 52,72,185.2,37.5 | 44,128.8,796.2,19 | 52,115.8,796.2,45 |
| hello illustration | 256.8,293.2,74.2,72.3 | 253.2,304.6,69.8,68.1 | 1096,72,300,292.6 | 1088,72,300,292.6 |
| card 0 | 20,708.8,335,246.7 | 52,727.3,271,313.9 | 20,486.6,445.3,224.3 | 52,486.6,424,246.7 |
| card 0 link | 44,899.2,270.7,32.4 | 76,962.4,223,54.8 | 44,654.6,270.7,32.4 | 76,677,270.7,32.4 |
| banner section | 0,0,375,624 | 0,0,375,390 | 0,0,1440,1152 | 0,0,1440,720 |
| banner root | 20,0,335,624 | 0,0,375,390 | 20,0,1400,1152 | 0,0,1440,720 |
| media 1 / media 2 | 20,0,167.5,624 / 187.5,0,167.5,624 | 0,0,187.5,390 / 187.5,0,187.5,390 | 20,0,700,1152 / 720,0,700,1152 | 0,0,720,720 / 720,0,720,720 |
| content area | 20,0,335,624 | 0,0,375,390 | 20,0,1400,1152 | 0,0,1440,720 |
| box | 20,186.5,335,251 | 0,54.5,375,281 | 360,865,720,207 | 455.9,472,528.3,198 |
| heading | 44,250.5,287,19 | 52,94.5,271,75 | 360,929,720,19 | 455.9,512,528.3,50 |
| buttons wrapper | 44,301.5,352,72 | 52,189.5,271,106 | 360,980,720,28 | 495,582,450,48 |

Landing page: @375 section 849 -> 612.5 high, media 544 -> 340, box 20,544,335,305 -> 0,340,375,272.5, buttons 76,713,352,28 -> 52,466.5,271,48 (second 52,524.5). @1440 section 896 -> 560, box 304,327,832,242 -> 460,166.5,520,227, buttons 360,477,352,28 / 728,477,352,28 -> 495,305.5,220,48 / 725,305.5,220,48. Hello-world at 1024: three columns, card 285.3 wide; at 1023 one column.

## Section 8 rows as observed

| ID | Observed |
|---|---|
| E3.1 | band text left 44 -> 52; illustration right 1396 -> 1388 (1440); 323 at 375; 292 / 1628 at 1920 |
| E3.2 | `<h1>` Oswald 700 uppercase, 30 px at 375, 36 px at 1440, line-height 1.25 (45 px high at 1440); text "Hello, world!"; band 658.8 -> 677.3 high at 375 |
| E3.3 | cards x 52; width 424.0 at 1440 (base 445.3), 271 at 375 (base 335) |
| E3.4 | one column at 1023, three at 1024 (285.3 px cards) |
| E3.5 | `<h2>`, same 16 px; "Key concepts", "Liquid", "Best practices" |
| E3.6 | band `<h1>` `rgb(51, 51, 51)` (same as before at the defaults) |
| E3.7 | banner root, media and content area 0..w at every width; half media 720 (187.5 at 375) |
| E3.8 | desktop `min-height` 1152 -> 720 (420 / 560 / 720 for small / medium / large), mobile content 624 -> 390 (280 / 340 / 390); landing medium 896 -> 560, media 544 -> 340 |
| E3.9 | content padding-top 80 -> 50, box padding-top 64 -> 40, box max-width 1424 -> 890, min-width 720 -> 450; at 375 box border box 0..375, content box 52..323 |
| E3.10 | banner heading Oswald 30 px at 375, 40 px at 1440 (h2 20/24, h0 40/52, hxl 50/62, hxxl 56/72) |
| E3.11 | "Shop all" `btn-secondary`, "Button label" `btn-primary`, 48 px tall, opacity 0.6; widths and layout in the table above (side by side at 767, one per row at 430); gap 10; heading-to-buttons 20 (582 - 562) |
| E3.12 | 767 gets the mobile layout (content padding-top 0), 768 the desktop one (50) |
| E3.13 | landing page desktop: boxed, `bg-background`, 520 x 227 at 1440 (450 + 2 x 35 padding); mobile: placeholder 340 high, text from x 52, 271 wide at 375 (216 at 320) |
| E3.14 | proxy C6 (banner first): `fetchpriority="high"` and `loading="eager"` on both images; **no preload `Link` header was observed** for them (see Not verified) |
| E3.15 | not observable (editor) |
| E3.16 | text block via proxy P: title 30 px Oswald 700 line-height 36 (base 32 px Work Sans, `normal`); subtitle 24 / 32; normal 16 / 24 |
| E3.17 | group block: all seven proxy blocks equal base |
| E3.18 | `styles.css` 3,464 -> 2,258 bytes (954 gzip) |
| E3.19 | `X_page` 0 at every width on both pages |
| E3.20 | hello-world `<img alt="">` |
| E3.21 | no unlisted difference beyond the above. Noted (not new): the hello-world illustration shrinks to 69.8 x 68.1 at 375 because the row is 271 px wide (base 74.2 x 72.3) |
| E3.22 | underline offset / thickness classes `[&_a]:underline-offset-[0.1875rem] [&_a]:decoration-[0.0625rem]` (hover `0.125rem`) are on the heading and the text `div`; not measured on a link (no rich-text link in the saved content) |

## C3.0 - C3.27

Method and evidence. "Proxy" = scratch copies of `9a87197` (base) and HEAD (`ed31492`) served with `shopify theme dev --path` to the private dev theme, 45 variants each (V1-V13, C1-C6, P), measured at 320 / 375 / 430 / 767 / 768 / 1024 / 1440. Evidence files are under `docs/qa/evidence/`; screenshots (untracked) `docs/qa/screenshots/t3-*` and `t3c-reg-*`.

| ID | Result | Method and evidence |
|---|---|---|
| C3.0 | PASS | `npm ci && npm run check:css` exit 0 on the clean tree at the final commit |
| C3.1 | PASS | per-step table above; `check:hidden` 0 |
| C3.2 | PASS | (a) shasums equal step 0 for text, group, hello-world; (b) `t3c-schema.mjs` true / true for the three; (c) diffs are 6 / 6 / 7 deleted lines |
| C3.3 | PASS | `rg` empty for `"type": "color_scheme"`, `color_scheme` and `color-{{`; templates 1 / 2 / 1; `git diff 9a87197 -- templates config sections/*-group.json` empty |
| C3.4 | NOT RUN | owner check (theme editor) |
| C3.5 | PASS | `t3c-home-land-checks.txt`: `/` and landing at 320 ... 1920, `X_page` 0, `X_off` empty, `X_btn` <= 0. Proxy: all 45 variants x 7 widths pass; only exception is the V2-ambient animated `img` (transformed, clipped by its media; base lists the same `img`; `X_page` 0) |
| C3.6 | PASS | proxy, 356 buttons at 320 / 375 / 768 / 1440 over all variants, each inside the box content box +-0.5 (`t3c-proxy-criteria.txt`) |
| C3.7 | PASS | (a) `rg` for `section-image-banner` and `stylesheet_tag` prints nothing; file gone. (b) `N_dawn` 0 on every page |
| C3.8 | PASS (report) | `/` `B_doc` 22,351 -> 21,654; 3p / snowboard 20,939 -> 21,654 (+715, reported, no threshold) |
| C3.9 | PASS | 41,801 / 8,989 |
| C3.10 | PASS | `t3c-sweep-head.txt`: 0 unlayered matches on `/` and the landing page at 375 and 1440 (`styles.css` has no hello-world rule; the Dawn sheet is gone) |
| C3.11 | PASS | Dawn classes on T3 markup: `grid`, `overflow-hidden`, `uppercase`, plus Shopify's wrapper class `section`; 0 bare `hidden`, 0 `button`, 0 `grid` with non-zero bottom margin |
| C3.12 | PASS | `t3c-geometry-diff.txt`: `/` and landing at 375 and 1440 (and 320, 768, 1024): every move beyond 1 px is a section 8 row |
| C3.13 | PASS | proxy B0 at 320 / 375 / 767 / 768 / 1024 / 1440 and `/` at 1920: `<h1>`, first paragraph, first card left = L (52; 292 at 1920); illustration right and last card right = E_R; band and banner 0..w; box content box 52..268 / 52..323 at 320 / 375; V3 top-left content-box left = L, bottom-right right = E_R at 768 / 1024 / 1440. R is E_R = w - L (deviation 3) |
| C3.14 | PASS | all ratios 0.625: root 672 / 896 / 1152 -> 420 / 560 / 720, adapt `auto` both, content 448 / 544 / 624 -> 280 / 340 / 390, V8 media 624 -> 390, content padding-top 80 -> 50, box 64 -> 40, gap 16 -> 10, min-width 720 -> 450, max-width 1424 -> 890 |
| C3.15 | PASS | `t3c-proxy-criteria.txt` (adapt 960.1 vs 960 at 1440, content `::before` 250.0 vs 250 at 375; nine positions; alignments; V5 `bg-background` `rgb(255, 255, 255)`, padding 35, max-width 710 / 900; stacked; below; overlay 0 / 0.5 / 1; five heading sizes; three text styles; swap, links, label 2 blank; two-button widths 271 / 326 / 220; image_2 only; placeholder) |
| C3.16 | PASS | none / ambient (`theme-banner-ambient`, `none` under reduced motion), fixed and zoom-in (`position: fixed`, height 900, `clip-path: inset(0px)`, image 2 left 720) |
| C3.17 | PASS | `/`: h1, h2, h2, h2, h2; landing page: h2 then h1 (the product `<h1>`; pre-existing order) |
| C3.18 | PASS | no literals left (`rg`); h1 "Hello, world!"; titles "Key concepts", "Liquid", "Best practices"; link attributes equal step 0's (after the follow-up commit; deviation 2) |
| C3.19 | PASS | h1 Oswald 700 uppercase 30 / 36 px; banner heading Oswald 30 / 40 px |
| C3.20 | PASS | `btn-secondary` transparent with 1px border, `btn-primary` accent; `role=link`, `aria-disabled=true`, no `href`, opacity 0.6, height 48, Oswald; no `.button` under the banner |
| C3.21 | PARTIAL | `width`, `height` on every image; hello-world `alt=""`; `/` banner images `fetchpriority="auto"`; 6 preload headers. Proxy C6: both images `fetchpriority="high"`, `loading="eager"`; **the per-image preload `Link` header was not observed** (also with one image). Header count 6, below 10 |
| C3.22 | PASS | V6 root column at 767, row at 768; B0 content padding-top 0 / 50; cards 1 column at 1023, 3 at 1024 |
| C3.23 | PASS | `t3c-palette.json`: changed: banner heading `rgb(238, 17, 136)`, "Shop all" color and border, V5 box `rgb(17, 34, 51)` (default white); unchanged: band `rgb(246, 246, 247)`, band `<h1>` `rgb(51, 51, 51)`, card background / color / title, link background, "Button label" background. Both runs' `--color-foreground` precheck matched (`#333333`, `#ee1188`). Afterwards the repo server was restarted and read `#333333` |
| C3.24 | PASS | `t3c-blocks.txt`: text title 30 px Oswald 700 / 36, subtitle 24 / 32, normal 16 / 24, alignment left / center / right; group horizontal and six vertical cases equal base; probe `<div class="group group--vertical">` -> `overflow: visible`, `display: block` |
| C3.25 | PASS | every `style="` is custom properties only (`--banner-overlay`/`--banner-ratio`, `--padding`); no `{% style %}` tag; one `{% stylesheet %}` (image-banner) containing only `@layer components { @keyframes }`; both `!` patterns print nothing |
| C3.26 | PASS | `t3c-regression.txt`: nine pages at 1440 and 375, base from staging #187953643616 (read-only), head from the dev theme: document height, `X_page`, `h1` identical; pixel diff is the same 2,938 / 2,981 pixels at the bottom-left preview-bar text on every page, nothing else |
| C3.27 | PASS | C1-C4, V6, V8 at 375: element order and `position` equal base (C1: media 1, content, media 2); heights = base x 0.625; C2 and C3 ratio boxes 250.0 vs 250 (content area full width, R2-1); C5 at 1440 box left 52, `text-align: left`, white background |

## Deviations

1. **Step-level dev-theme checks ran once, on the final tree.** The plan asks for C3.24's probe at Step 2, C3.13 / C3.17 / C3.18 at Step 3 and C3.5 / C3.6 / C3.13 at Step 4. The single shared dev theme was occupied by the 45-variant base proxy run when Steps 1-5 were committed, so each commit passed the offline gates (build, `check:css`, `check:hidden`, theme check, schema shasums, compiled-order check) and the browser checks were run after Step 5 on HEAD. They are green on HEAD, so no step is known to be broken on its own; a per-step browser pass was not made.
2. **`title: ''` added to the three hello-world links** (`754fef3`, after Step 3). With `class:` alone `link_to` dropped the `title=""` it emits today, which would have failed C3.18's "attributes other than `class` equal Step 0". The added argument restores it (attribute order differs; the set is equal). This line is in none of the plan's strings.
3. **C3.13's right edge uses E_R = w - L, not the rendered cart icon's right.** The header's cart icon overflows E_R at narrow widths (rendered right 312 at 320, 334 at 375, 340 at 390, against E_R 268 / 323 / 338; equal from 430 up). This is the same on the base build (Step 0 dumps), so the plan's literal "R = cart right" can't pass at 320 and 375 on any build. The banner's box content box and the hello-world edges equal E_R, which is what section 4.4 defines; the header's own overflow is listed under Out-of-scope observations.
4. **The plan's C3.25 regex `\{%-?\s*style` also matches `{% stylesheet`**, the one allowed tag. I used `\{%-?\s*style\s*-?%\}` for the "no `{% style %}`" half, which prints nothing.
5. **C3.5 over all proxy variants** (a stricter read than the plan's `/` and landing page): the V2-ambient run lists its animated `img` as an offender at every width, as base does; the media's `overflow-hidden` clips it and `X_page` is 0. Excluded in the analyzer with that comment.
6. **Harness names:** the plan says `t3-*.mjs`; the task said `t3c-*.mjs`, which I used. Text evidence is committed under `docs/qa/evidence/` (small files); the large JSON dumps stay in the scratch directory.
7. **Palette run:** the first palette attempt measured the V5 box before the template had synced (default box background transparent). The script now waits for both the template marker and `--color-foreground`; the numbers above are from the second run.
8. **Plan text unchanged where it was ambiguous:** Dawn's mobile `min-height` rule applies when `stack_images_on_mobile` too (not only unstacked), as implemented per plan section 5.5.2. The `text-center` default and `[&_a:hover]` strings are as planned.

## Not verified

- **Preload `Link` header for banner images** (C3.21 proxy C6, E3.14): `loading="eager"` and `fetchpriority="high"` appear (so `preload: true` was processed), but no image entry appears in the response `Link` header, with two images or one. T2 saw the same for its hero preload (C2.16) but did see one for the product's main image (C2.23). The reason is unknown (a header size or cap rule on this page type is a guess). Not investigated further.
- C3.4 and the editor half of C3.15 (owner checks; the editor can't be driven).
- Whether an editor save drops the orphaned `color_scheme` values (owner check 2).
- E3.22 on a real rich-text link (none in the saved content); only the classes are present.
- `zoom-in` visual (no zoom, parity with `fixed`).
- Nothing was exercised on a real phone; widths were emulated with a resized Chromium viewport.

## Out-of-scope observations

- Header cart icon exceeds E_R at <= 390 px (see deviation 3); pre-existing, T1 area.
- On the landing page the banner `<h2>` precedes the product `<h1>`; heading order there is `h2, h1` (pre-existing structure).
- The hello-world illustration (fixed 300 px wide) shrinks to about 70 px at 375 because the row is narrow; it was 74 px before.
- `docs/plans/theme-evolution-tailwind-t4*.md` and `docs/reviews/theme-evolution-tailwind-t4a-review.md` are untracked in the working tree; they are not part of this work and were not touched.

## Follow-ups

- Owner checks 1-3 on staging after DevOps pushes (C3.4, editor settings sweep with the "saved `color_scheme` after editor save" record, visual acceptance of Q3.1-Q3.4).
- DevOps Step 7: append the bug-report note (section 14.3). Measured values to quote: `/` `X_page` 0 at 320 / 375 / 390 / 430; landing page was 108 at 320 and 53 at 375 before, 0 after.
- Align the other pages' content edges to the header (product page 44 / 100, footer, trust badge x = 20; plan Q3.2 follow-up).
- Header cart icon overflow of E_R at <= 390 px.
- `locales/en.default.schema.json` still holds the two unused `sections.all.colors.*` keys; the four saved `"color_scheme"` template values remain (plan section 15).
- Investigate the missing image preload `Link` header on `/` (and the landing page at index 1) before relying on it for LCP.
- T4 gzip headroom: 12,000 - 8,989 = 3,011 bytes.
