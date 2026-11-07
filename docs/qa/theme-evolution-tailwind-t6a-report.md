# QA report: Tailwind phase T6a (collection grid columns)

Slug: `theme-evolution-tailwind-t6a`. Code under test: HEAD `7f6745a` (commits 67b6839, 9984a89, 942408d on top of 7b8221b). Dev theme #188245508192 only; nothing pushed. Tools: Playwright (Node harness, headless Chromium) only; Chrome DevTools MCP not needed.

## Verdict: PASS WITH NITS

No blockers. Every criterion C6a.0-C6a.14 passed on my own runs except C6a.7(b), which fails as written for one fixture and is rated a nit (below).

## Blockers

None.

## Nits

1. **C6a.7(b), `width`/`height` attributes on the 1024 px upload (card 16, "Gift Card"): confirmed, severity nit (cosmetic, no user-visible effect).**
   - Confirmed: `image_tag` prints `width="1600" height="1600"` (the requested `image_url` size). The `src` file and the largest srcset candidate are 1024 x 1024 (detached `new Image()`), and the srcset descriptors are correct (360, 540, 720, 1024). The other 15 cards (all larger than 1080) print 1600 = `N_out`, so (b) holds for them.
   - Impact: none on layout, aspect or CLS. The `img` is `block h-auto w-full`, the crop is square (`crop: 'center'`, 1:1), so the attribute ratio (1:1) equals the file ratio. Rendered rects: 660 x 660 at 1440, 271 x 271 at 375, same as the other cards; all 16 card images square at 1440; base-vs-head rects equal (C6a.3). The attributes are an intrinsic-size hint and only their ratio is used. A 1200 x 900 upload would crop to 900 square, so the ratio stays 1:1 for any upload. The CLAUDE.md rule ("explicit `width` and `height` on every img") is met: 0 images without both attributes on every page tested.
   - Plan wording vs code: mostly a plan-wording issue. (b) should read "width = height = the requested 1600 (square), and equal `N_out` when the image is at least 1600". If the owner wants the attributes to equal the file (honest intrinsic size), the code fix is small: compute `out_px` before the call and pass `width: out_px, height: out_px` (the `out_px` block would move above the render call it already precedes; the `image_url` request then asks for exactly the file's size). It also shifts nothing else. I recommend not blocking T6a on it; fix in a follow-up or in T6b if the owner cares.
2. **Imageless card path not rendered live.** All 16 fixture products have a featured image (`N_img` = `N_prod` = 16), so I could not render the imageless case. Static read: the per-card widths block sits inside `{% if product.featured_image %}` (Coder deviation 1, sensible), so an imageless card renders title and price only, the same as base. Unverified in a browser; low risk.
3. Product count is 16, not the plan's 15 (Coder deviation 3), so Q6a.1's empty-slot arithmetic shifts: `2` and `4` fill desktop rows, `3` and `5` leave one lone card, and the three tablet columns leave one lone card. Owner decision for Q6a.1 should use 16.
4. Console: `Monorail` analytics request error on `/products/the-3p-fulfilled-snowboard` only (both viewports): Shopify analytics, unrelated to T6a (no T6a file is on that template path). No other console errors or warnings on 18 page loads.

## Pending for the owner (not testable by QA)

- Theme editor: open the collection template, confirm "Desktop columns" (Automatic, 2-5) and "Mobile columns" (1, 2) with info text, change each option once and see it apply. I cannot reach the admin (login wall). Option application was verified through scratch `collection.t6a-<d>-<m>.json` templates instead (below), which exercises the same `section.settings` path.
- Q6a.1 (value for live), Q6a.5 (three tablet columns, screenshot `var-3-1-768.png` looks right), Q6a.6 (image weight, numbers below).

## Evidence

### Gates (C6a.0, C6a.1, C6a.12)
- `npm ci && npm run check:css`: exit 0, clean tree.
- `shopify theme check`: 338 files, 0 offenses.
- `assets/tailwind.css`: 58,904 B, 11,238 B gzip -9 (budget 60,000 / 12,000; matches the Coder, `P_a`).
- No custom CSS: diff vs 7b8221b touches `assets/tailwind.css`, `locales/en.default.schema.json` (five keys added, none changed), `sections/collection.liquid`, `snippets/image.liquid` only. `src/tailwind.css`, templates and config unchanged. The only `style=` added is the existing `style="--grid-min: 31.25rem"` (a custom property). No `<style>` or `{% stylesheet %}` added.
- Working tree has no modified tracked files; I did not touch `templates/*.json` (scratch copy only, in the session scratchpad; the ten alternate templates are also now on the dev theme #188245508192, which is harmless scratch).

### C6a.3 default parity (own run, base 7b8221b vs head, `docs/qa/harness/t6aqa-diff.mjs`)
12 widths (320 to 1920), 192 card rects and 192 image rects: 0 diffs. Grid opening tag byte-identical, `gridTemplateColumns` equal at every width. Images change by design (base: width 400, no `sizes`, no `loading`; head: srcset, computed `sizes`, lazy after the first row).

### Column settings (C6a.4, C6a.5, C6a.6, C6a.10, C6a.14; `t6ac-grid.mjs pxc`)
10 variants x 13 widths (320, 375, 767, 768, 1023, 1024, 1119, 1121, 1279, 1280, 1439, 1440, 1920) = 130 runs, 0 fails. Per run: class attribute precheck against the variant literal, track count, every card width within 1 px of the derived width (this covers 3 columns at 768 and 1023 for options 3, 4 and 5), `sizes` evaluated within 2 px of each rendered image, rendered `sizes` strings equal the plan's table, overflow 0, one `h1`, `loading` eager through `n_eager` and lazy after. PXW (110rem, margin 50) not re-run by me; the Coder's evidence `t6ac-step0-pxw.json` stands.

### Images (C6a.7, C6a.8; `t6ac-sizes.mjs`)
- srcset descriptors equal the expected set for all 16 cards; 1600 top present for all 15 images larger than 1080; first card's five candidate files each load as square at the descriptor width. (b) fails for card 16 only (nit 1).
- `R_pick` at 375 and 1440, DPR 1, 2, 3, default and 4/2: 0 below 0.75.

### Q6a.6 bytes (own run, matches the Coder to the byte; card image response bodies, 16 cards, 13 distinct files)

| Setting | Base first 4 | Base total | Head first 4 | Head before scroll (loaded) | Head after scroll | LCP base / head (single headless reads, noisy) |
|---|---|---|---|---|---|---|
| 375 DPR 2 | 25,730 | 142,900 | 46,042 | 178,262 (10) | 275,596 | n/a / 388 ms |
| 1440 DPR 1 | 25,730 | 142,900 | 46,042 | 148,168 (9) | 275,596 | n/a / 388 ms |
| 1440 DPR 2 | 25,730 | 142,900 | 128,974 | 383,662 (9) | 664,276 | n/a / 396 ms |

At 1440 DPR 2, after scroll, head is 4.65x base bytes (664,276 / 142,900); before scroll 2.7x. Head's LCP did not regress in these readings. Base per-setting LCP not re-measured (Coder: 352-396 ms).

### Regression sweep (`docs/qa/harness/t6aqa-regress.mjs`, 9 pages x 2 viewports, theme id asserted each load)
Pages: `/collections/all`, `?page=2`, `/search?q=snowboard`, `/collections`, `/cart`, `/`, and the three fixture product pages, at 1440x900 and 375x667. Every page: exactly one `h1`, no horizontal overflow, 0 images missing `width`/`height`, 0 HTTP >= 400. Other callers (C6a.9, own diff): 40 image outerHTML and wrapper rects on search, collections and cart at 375 and 1440 identical to base. Screenshots (gitignored, local): `docs/qa/screenshots/t6a-qa/`.

### Accessibility / performance
No new interactive elements; the section's `h1` unchanged; card links keep their text. No performance trace taken (not needed); LCP readings above are single headless samples.

### Process notes
Harness added: `docs/qa/harness/t6aqa-diff.mjs`, `t6aqa-regress.mjs` (reuse `t6ac-lib.mjs`). Password read only inside `t0-lib.mjs`; never printed or written. Dev servers stopped (port 9393 free).

## Verdict: PASS WITH NITS
