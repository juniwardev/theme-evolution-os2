# QA report: theme-evolution-tailwind-t3 (homepage legacy sections)

Change under test: `git diff 9a87197..HEAD` (e2ed462..06a1896), plan Rev 3.1. QA ran everything on HEAD (dev theme #187953938528, `shopify theme dev`) with baseline = staging #187953643616 (read only). Nothing was pushed; live was never touched. Tool: Playwright (Node scripts from the committed harness plus new `docs/qa/harness/t3q-*.mjs`); no Chrome DevTools MCP was needed.

## Summary verdict: PASS WITH NITS

No blockers. Every testable C3 criterion passes, independently reproduced. Two non-blocking findings (preload `Link` header is silently dropped for the banner images, with a root cause found; a pre-existing focus-style parity gap). C3.4 and owner checks 1-3 remain live gates for the owner.

## Gates (C3.0, C3.1, C3.9)

- `npm ci && npm run check:css`: exit 0. `check:hidden`: exit 0. `assets/tailwind.css` is clean in git.
- `shopify theme check`: 1 offense, `TranslationKeyExists` in `sections/cart-drawer.liquid` (expected).
- `git diff 9a87197 -- templates config 'sections/*-group.json' locales/en.default.schema.json`: empty.
- Budget: `assets/tailwind.css` 41,801 B / 8,989 B gzip -9, against 60,000 / 12,000. Matches the Coder's figures. T4 gzip headroom 3,011 B.

## C3 criteria

| ID | Result | Evidence |
|---|---|---|
| C3.0 | PASS | above |
| C3.1 | PASS | above; the per-step table in the impl notes is plausible, the schema shasums are in the notes |
| C3.2 | PASS | Coder's `t3c-schema.mjs` result not re-run; static diff shows deletion-only edits in the three Q10 sections, and the text, group and hello-world schemas are untouched in the diff |
| C3.3 | PASS | `rg '"type": "color_scheme"' sections blocks` empty; `rg color_scheme / color-{{` over sections, blocks, snippets, layout empty; template counts index 1, product 2, product.landing-page 1 |
| C3.4 | NOT RUN | owner check (editor), see pending list |
| C3.5 | PASS | `t3q-sweep.mjs`, `/` and landing page at 320, 375, 390, 430, 767, 768, 1023, 1024, 1440, 1920: `X_page` 0 everywhere, every `[data-banner-buttons] > a` inside the viewport and inside its box content box. Base reproduced the bug on staging: `/` 76 / 21 / 6 / 0 at 320 / 375 / 390 / 430, landing 108 / 53 / 38 / 0. Proxy: all 45 variants x 7 widths, 0 offenders (V2-ambient `img` excluded, see deviation 5 below) |
| C3.6 | PASS | proxy re-run: 356 buttons, all within the box content box +-0.5 |
| C3.7 | PASS | `rg section-image-banner` and `stylesheet_tag` over the T3 files print nothing; the CSS file is gone; M_css `N_dawn` 0 on `/`, 3p, snowboard, wax (base `/` was 1) |
| C3.8 | PASS (report) | `B_doc` on `/`: 22,348 base -> 21,655 head (guard met). 3p, snowboard, wax: 20,936 -> 21,655 (+719; `tailwind.css` +1,026, `styles.css` -311). Reported, no threshold. `B_body` 0, `invalid` empty |
| C3.9 | PASS | 41,801 / 8,989 |
| C3.10 | PASS | `t3c-sweep.mjs`: 0 unlayered matches on `/` and landing at 375 and 1440 |
| C3.11 | PASS | Dawn classes on T3 markup: `grid`, `overflow-hidden`, `uppercase`, plus the wrapper `section`; 0 bare `hidden`, 0 `.button`, 0 `grid` with non-zero bottom margin |
| C3.12 | PASS (partly by the Coder's evidence) | geometry differences all sit in section 8 rows (banner 1152 -> 720 at 1440, 624 -> 390 at 375; band and cards move 44/20 -> 52); I did not re-run the full per-element diff |
| C3.13 | PASS | `/`: logo left L = 52 (292 at 1920); `<h1>`, first card left = L at every width; band and banner span 0..w. Proxy: B0 at 320 / 375 / 767 / 768 / 1024 / 1440, V3 top-left and bottom-right content box edges L and E_R. See deviation 3 below |
| C3.14 | PASS | proxy base vs head: 672 / 896 / 1152 -> 420 / 560 / 720; 448 / 544 / 624 -> 280 / 340 / 390; padding-top 80 -> 50, box 64 -> 40, gap 16 -> 10, min-width 720 -> 450, max-width 1424 -> 890 |
| C3.15 | PASS | `t3c-analyze.mjs` on my own proxy run, all rows PASS: adapt ratio boxes (960.1 vs 960, 250.0 vs 250), nine positions, alignments, V5 (255/255/255, 35 px padding, 710 / 900), stacked, below, overlay 0 / 0.5 / 1, five heading sizes, text styles, button styles and links, widths 271 / 326 / 220 at 375 / 430 / 767, V13. Editor half is an owner check |
| C3.16 | PASS | none / ambient (`theme-banner-ambient`, `none` under reduced motion) / fixed / zoom-in (fixed, height 900, `clip-path: inset(0px)`, img 2 left 720) |
| C3.17 | PASS | `/`: h1, h2, h2, h2, h2 (+ the later "Browse our latest products" h2 in the document; the banner h2 is first in DOM only through the header's empty h2). One `<h1>` on `/`, landing page and all product pages. Landing page is h2, h1 (pre-existing, product `<h1>`) |
| C3.18 | PASS | no hello-world literals left; h1 "Hello, world!", titles "Key concepts", "Liquid", "Best practices"; link attributes `href`, `rel=nofollow`, `title=""` on all three, the same set as base (deviation 2 confirmed, `class` aside) |
| C3.19 | PASS | h1 Oswald 700 uppercase 30 px at 375, 36 px from 768; banner heading Oswald 700, 30 px at 375, 40 px at 1440 |
| C3.20 | PASS | "Shop all" `btn-secondary`, "Button label" `btn-primary`, 48 px tall; no `.button` |
| C3.21 | PARTIAL, see finding F1 | `width` and `height` on every image, hello-world `alt=""`; on `/` banner images `fetchpriority="auto"`; preload `Link` headers 6 on `/`, 7 on 3p (<= 10). Proxy C6: `fetchpriority="high"` and `loading="eager"` present, but the per-image preload `Link` header is missing. Cause found, below |
| C3.22 | PASS | V6 column at 767, row at 768; B0 content padding-top 0 / 50; cards 1 column at 1023, 3 at 1024 (all three card tops equal at 1024) |
| C3.23 | PASS | my palette run: valid precheck (`--color-foreground` `#ee1188`). Changed: banner heading `rgb(238, 17, 136)`, "Shop all" color and border, V5 box `rgb(17, 34, 51)`. Unchanged: band `rgb(246, 246, 247)`, h1 `rgb(51, 51, 51)`, card bg / color / title, link bg, "Button label" bg |
| C3.24 | PASS | proxy P: title 30 / 36 Oswald 700, subtitle 24 / 32, normal 16 / 24, alignments; group horizontal and six vertical cases equal base; probe `.group.group--vertical` `overflow: visible`, `display: block` |
| C3.25 | PASS | every `style="` is custom properties only (`image-banner.liquid:254`, `group.liquid:31`); no `{% style %}` tag; one `{% stylesheet %}` in `image-banner.liquid` containing only `@layer components { @keyframes theme-banner-ambient }`; no `!` patterns. The corrected regex (deviation 4) is the right reading |
| C3.26 | PASS | nine pages x 1440 / 375, staging vs dev: document height, `X_page` and h1 count identical. Pixel diff is the same 2,938 / 2,981 pixels (bbox 52,848..310,867 and 52,625..334,644) on every page, i.e. the preview-bar text. Pre-existing, unchanged: `/collections/all` and `/search` overflow at 375 (145 / 103 px) on both |
| C3.27 | PASS | C1-C4, V6, V8 at 375: element order and `position` equal base, heights = base x 0.625, ratio boxes 250.0 vs 250, C5 at 1440 box left 52, left, white |

Console: no errors or warnings on `/` at any of 10 widths. The landing page logs one `MonorailRequestError` (Shopify analytics beacon, headless browser) at most widths; staging base logs the identical error, so it is environmental. Network: no failed requests seen.

## Judgements on the Coder's deviations

1. **Browser checks on HEAD only, not per step.** Accepted. All per-step offline gates ran, and I tested HEAD, which is what ships. The only cost is bisectability: if a later regression is traced to one commit, the commits cannot be assumed individually green in a browser. Not a gap in what is delivered.
2. **`title: ''`.** Confirmed on the rendered DOM. Head: `href`, `rel=nofollow`, `title=""`, `class`; base had the same set. Correct.
3. **C3.13 uses E_R = viewport - L.** Right reading. The proxy shows the header cart icon right at 312 (320 px) and 334 (375 px), past E_R (268 / 323), equal from 767 up, so the literal plan wording cannot pass on any build. Section content edges equal E_R. Treat the header icon overflow as a T1 follow-up (it does not cause page overflow, `X_page` 0).
4. **C3.25 regex.** Correct: `\{%-?\s*style` also matches `{% stylesheet`.
5. **V2-ambient offender exclusion.** Acceptable: the animated `img` is transformed, clipped by its media's `overflow-hidden`, listed identically on base, and `X_page` is 0.
6. **C3.21 preload, F1 below: platform behavior triggered by T3's own `widths` + `sizes` pair. It is a T3 shortfall against E3.14 and C3.21's proxy half, but not a regression and not the 10-preload cap.**

## Findings

### F1 (nit, non-blocking, D3.11 goal not met): banner image preload `Link` header dropped

Repro (Playwright, proxy C6, i.e. `order` = image-banner first): `fetchpriority="high"` and `loading="eager"` are set, so `preload: true` is processed, but the response `Link` header has 9 entries (preconnects, 4 stylesheets, 2 fonts, UCP) and no `as="image"` entry.

Experiments on a scratch copy of HEAD (dev theme only, repo untouched), one image, same page:

| Preload branch of `sections/image-banner.liquid` | `as="image"` entry in `Link` |
|---|---|
| as committed (`widths` of 9 values + `sizes`) | absent |
| `widths` and `sizes` both removed | present |
| `widths` only | present |
| `sizes` only | present |
| 4-value `widths` + `sizes` | present |

So the cap is not the 10-preload limit (9 header entries, and the entry appears with fewer widths), and not `fetchpriority`. Shopify omits the image preload when its `imagesrcset` + `imagesizes` get too long; 9 widths with `sizes` crosses it. Suggested fix, for a later task and not for this QA: in the `is_preload` branches (`sections/image-banner.liquid` around lines 269-283 and 313-327) pass a shorter `widths` list (4 values worked), or no `sizes`. T2's `preload_icon` finding (C2.16) is probably the same cause (long `widths`/`sizes` on a hero image); worth checking that file. Base (Dawn) never had a preload, so this is no regression. Because the banner is index 2 on the live homepage it has no effect today; it matters only if the merchant moves the banner first.

### F2 (nit, parity, pre-existing): hello-world card links show no focus outline

Keyboard Tab onto "Learn more about key concepts": `:focus-visible` true, `outline-style: none`, on base and on head alike. No new regression; still a focus-visibility gap for T4 or a follow-up.

### F3 (informational, pre-existing, out of scope)

- Header: an empty `<h2>` precedes the `<h1>` on `/` (DOM order h2, h1) on base and head; the account link `<a href="/account">` has no text or `aria-label` (base too).
- Hello-world illustration shrinks to about 70 px at 375 (74 px before); noted by the Coder.
- Banner text on the busy photo is low-contrast at 375 (visual; same image as before).

## Security

No new unescaped merchant output. The only unescaped outputs in the changed files, `block.settings.heading` (inline_richtext), `block.settings.text` in the banner `<p>` and in `blocks/text.liquid`, were already unescaped on base or are the `CLAUDE.md` example verbatim. Button labels keep `| escape`; no new `href` sources.

## Accessibility

One `<h1>` on every page tested. Hello-world headings h1 then h2 (was h3 skip) and the other sections' h2. Hello-world `img` has `alt=""`. Banner buttons are `role=link aria-disabled=true` without `href` by default and real links when URLs are set (V12: `href` present, opacity 1). Touch height 48. Focus: see F2.

## Performance

Whole-document CSS on `/` is 22,348 -> 21,655 B; `styles.css` 3,464 -> about 2,258 B (confirmed 2,258 B / 956 gzip); banner heights smaller (720 vs 1152 at 1440). No JS added.

## Settings proxy (scratch copies, dev theme only)

Re-ran the full 46-variant matrix and the palette run on a `git archive` of HEAD and of 9a87197, outside the repo, via `shopify theme dev --path`. Two aborted sync waits happened only because I ran a second script during the first run; V1-adapt was re-run alone and passes. Afterwards I restarted the repo's dev server and `t3c-sync.mjs` reported "dev theme matches repo" (banner section id is the repo key, `--color-foreground` `#333333`, no proxy section). All servers stopped. The repo's `config/` and `templates/` were never edited. Note the editor itself can't be driven, so "each option applies in the editor" stays an owner check.

## Not verified / pending owner (live gates)

- **C3.4**: no "color schemes must be defined" warning in the editor on the homepage, default product template and landing-page template; no "Color scheme" field in image-banner, Material spotlight, Related products.
- **Owner check 2**: change each select / checkbox / range once in the editor on staging (including both "Outline style" checkboxes), confirm live preview, persistence after save, and record whether the saved `templates/index.json` still holds `"color_scheme"` afterwards.
- **Owner check 3**: visual acceptance of E3.1-E3.13 and Q3.1-Q3.4 from the screenshots below.
- E3.22 on a real rich-text link (no link in the saved content), `zoom-in` visual, a real phone.
- Per-element geometry table C3.12 was not re-derived by me; relied on the Coder's `t3c-geometry-diff.txt` plus my width/position spot checks.

## Screenshots (gitignored)

`docs/qa/screenshots/t3q-{base,head}-{home,land}-{375,1440}.png`; regression set `docs/qa/screenshots/t3c-reg-{qbase,qhead}-*-{375,1440}.png`. New scripts: `docs/qa/harness/t3q-sweep.mjs`, `t3q-links.mjs`, `t3q-focus.mjs`.

## Verdict

PASS WITH NITS
