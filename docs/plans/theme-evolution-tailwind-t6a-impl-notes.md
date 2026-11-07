# T6a impl notes (Coder)

Plan: `docs/plans/theme-evolution-tailwind-t6a.md` (Revision 2.1, review APPROVE). Base: HEAD `7b8221b` (T5b committed, on staging; option (a)), branch `main`, no feature branch. Dev theme #188245508192 only; nothing pushed.

## Commits

| SHA | Subject |
|---|---|
| 67b6839 | feat(image): T6a Step 1, snippet takes optional widths, sizes and loading |
| 9984a89 | feat(collection): T6a Step 2, desktop and mobile column settings for the product grid |
| 942408d | feat(collection): T6a Step 3, card images get srcset, computed sizes and lazy loading after the first row |

## Files changed

- `snippets/image.liquid`: three optional params, an `@example`, one branch (else branch is today's line).
- `sections/collection.liquid`: ten `grid_classes` literals, two settings, sizes block, per-card widths/loading block, image call.
- `locales/en.default.schema.json`: the five §5.5 keys only (JSON diff: five added, none removed or changed).
- `assets/tailwind.css`: rebuilt in Step 2.
- Harness `docs/qa/harness/t6ac-{lib,facts,grid,sizes,shots}.mjs`; evidence `docs/qa/evidence/t6ac-*`; screenshots `docs/qa/screenshots/t6a-{base,head}-*` (gitignored, local only).

## Step 0 (no commits)

- T5a deploy note names #187953643616 and SHA 905196f (ancestor of HEAD); T5a report ends PASS WITH NITS; `assets/base.css` absent; no `base.css` in `layout`. T5b option (a) per orchestrator. Plan/index/review committed; source paths clean.
- `N_tc` = 0 (330 files). `S_T5` = 58,719 / 11,215. Scripts: `build:css`, `watch:css`, `dev`, `check:css`, `check` (no `check:hidden`).
- Gate: `P_a` = **58,904 / 11,238** (+185 / +23), budget 60,000 / 12,000: fits. `.xl\:grid-fill` is in `@media (min-width:80rem)`, `.md\:grid-cols-3` in `@media (min-width:48rem)`, both in utilities (`check-css-layers.mjs` passes).
- Base geometry (`/collections/all`): `W_c` = `min(1440,w) - 104` at all 12 widths (216 ... 1336). `N_prod` = **16** (plan said 15), `N_img` = 16; 15 featured images are larger than 1080 in both dimensions (so C6a.7(d) is distinguishable); one is 1024 x 1024.
- `image_tag` probe (RA1, R5, R6): every candidate file is square (360, 540, 720, 1080, 1600 and 1024 for the small upload); `N_out` equals planned `out_px` for all 16 cards. No stop condition.
- `sizes` probe (RA2): rendered strings equal §5.3's table character for character for the five defaults variants listed, and for the three PXW variants (C6a.6(c)).
- Base vs head bytes (card images, response bodies; 16 cards, 13 distinct files), before / after scrolling to the bottom, LCP ms:

| Setting | Base first 4 | Base total | Base LCP | Head first 4 | Head loaded before scroll | Head before | Head after | Head LCP |
|---|---|---|---|---|---|---|---|---|
| 375 DPR 2 | 25,730 | 142,900 / 142,900 | 396 | 46,042 | 10 | 178,262 | 275,596 | 536 |
| 1440 DPR 1 | 25,730 | 142,900 / 142,900 | 352 | 46,042 | 9 | 148,168 | 275,596 | 360 |
| 1440 DPR 2 | 25,730 | 142,900 / 142,900 | 372 | 128,974 | 9 | 383,662 | 664,276 | 372 |

  Base serves the same 400 px file at every DPR. At 1440 DPR 2 head picks 1600 (4.6x total bytes after scroll). LCP single readings, headless, noisy (one 536 vs 396 at 375 DPR 2 is not a trend). For Q6a.6.

## Step 4 results (head = HEAD 942408d; scratch copy byte-identical for the four changed files)

Proxies: scratch copy of HEAD in the session scratchpad with `node_modules` symlinked to the repo's (not a second `npm ci`), ten `collection.t6a-<d>-<m>.json` templates, served with `shopify theme dev --path` on #188245508192. PXW: the scratch `settings_data.json` had `max_page_width` 110rem and `min_page_margin` 50 patched in (not replaced wholesale); restored afterwards and `--page-width` read back `90rem`.

| ID | Result | Evidence |
|---|---|---|
| C6a.0 | pass: `npm ci && npm run check:css` exit 0, clean tree | shell |
| C6a.1 | pass: `npm run check` and theme check 0 offenses after each step | shell |
| C6a.2 | pass: (a) schema ids/types/options/defaults/labels/info as §5.1, no presets/blocks; (b) only `sections/collection.liquid`'s schema sha changed; (c) all six `t:` keys resolve, five locale keys added | `t6ac-schema-shas-base.txt` |
| C6a.3 | pass: grid opening tag, `gridTemplateColumns`, 16 card and 16 img rects equal base within 1 px at all 12 widths (0 diffs) | `t6ac-base-facts.json` vs `t6ac-step4-head-facts.json` |
| C6a.4 | pass: 10 variants x 13 widths, tracks and card widths match, 0 fails | `t6ac-step4-pxc.json` |
| C6a.5 | pass: ten single-line literals, class attr `{{ grid_classes }}`; compiled classes present | shell |
| C6a.6 | pass: S_eval within 2 px of the rendered card for every img, PXC (130 runs) and PXW (21 runs, precheck 110rem/50px); rendered strings equal the table | `t6ac-step4-pxc.json`, `t6ac-step0-pxw.json` |
| C6a.7 | (a), (c), (d) pass; **(b) fails for the 1024 px upload** (see deviation 2) | `t6ac-step4-sizes.json` |
| C6a.8 | pass: R_pick >= 1.09 everywhere (375 and 1440, DPR 1-3, default and 4/2); base 0.61 is red by the plan's figure | same |
| C6a.9 | pass: every other-caller `img` outerHTML and wrapper rect identical (search 16, collections 3, cart 1, at 375 and 1440) | facts JSONs |
| C6a.10 | pass: overflow 0 (inside t6ac-grid) | pxc json |
| C6a.11 | pass: Step 1 none; Step 2 added exactly `.md\:grid-cols-3`, `.xl\:grid-fill`, removed none; Step 3 none | shell |
| C6a.12 | pass: final 58,904 / 11,238 equals `P_a` | shell |
| C6a.13 | pass: H1 = 1 for all variants, every card img has width and height; `by 20` and `render 'pagination'` unchanged | grid json |
| C6a.14 | pass: eager through `n_eager` (n, or 2 for Automatic), lazy after, for all 10 variants | pxc json |

`S_tw` per step: after Step 1 58,719 / 11,215; Step 2 and Step 3 58,904 / 11,238.

## Deviations

1. **Per-card widths block sits inside `{% if product.featured_image %}`**, not directly before it (§5.2 says before). A product with no image would otherwise run `at_most` on nil. Output is identical for cards with images; `forloop.index` is the same loop.
2. **C6a.7(b) as written is wrong for small uploads.** `image_tag` prints `width`/`height` from the requested `image_url` size (1600 x 1600), not the file's `N_out`. For the 1024 px product the file is 1024 x 1024 but the attributes say 1600 x 1600 (square, so no CLS and the layout is unaffected). Not a Step 0 stop condition (candidates are square, `N_out` equals `out_px`). I kept the plan's code. QA should read (b) as "width = height = the requested 1600" or the plan should switch the call to `width: out_px, height: out_px`; the owner/architect decides.
3. Fixtures: 16 products, not 15 (`N_prod` 16); the empty-slot arithmetic in Q6a.1 shifts accordingly (16 products: `4` and `2` fill desktop rows, `3` and `5` leave one lone card in the last row; the tablet three columns leave one card too).
4. Harness prefix `t6ac-` (plan §10) rather than the brief's `t6a-`.
5. Scratch used a symlinked `node_modules` rather than a second `npm ci`.

## Run locally

`npm ci && npm run check`; preview with the dev theme: `shopify theme dev --theme=188245508192 --store=theme-evolution-os2.myshopify.com` (never live or staging). In the theme editor, the Collection section shows "Desktop columns" and "Mobile columns". Harness (from the repo root, `T6AC_STATE=<scratch file>`): `node docs/qa/harness/t6ac-grid.mjs <preview url> pxc|pxw <out>`, `t6ac-sizes.mjs`, `t6ac-facts.mjs`.

## For QA first

Q6a.6 bytes (above), the 1024 px upload (C6a.7(b)), tablet three columns for `3`-`5` on staging, theme-editor option changes, screenshots in `docs/qa/screenshots/t6a-*`. Live order: T6a must not go live before T5a and T5b are live (T5b is not live yet).

## Out-of-scope observations

None. (Process note: one `grep` while locating the fixtures file printed the storefront password line into my tool output once; it was not written to any file, script, log or commit, and staged diffs were grepped for it at every commit: 0 matches.)
