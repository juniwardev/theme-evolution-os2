# QA report: theme-evolution-tailwind-t4b (content pages)

HEAD `82dc6cf`, base `22cc86e`. Plan Rev 2.1. Browser: Playwright (node harness `docs/qa/harness/t4bq-*.mjs`, Chromium); no Chrome DevTools MCP used.
Dev server only on private dev theme #187953938528 (repo tree, a `git archive` base copy, and a `git archive` head copy with scratch alternate templates, one at a time). Dev theme restored to HEAD from the repo and all servers stopped. Nothing pushed, no scratch files in the repo tree.

## Summary verdict: PASS WITH NITS

One non-blocking finding (N1: `/pages/data-sharing-opt-out` horizontal overflow, pre-existing but made worse) and a few observations. No blocker.

## Gates (re-run by QA)

- `npm ci && npm run check:css` exit 0; `check:hidden` 0; `shopify theme check` "89 files inspected with no offenses found".
- CSS 43,803 bytes / 9,253 gzip (`gzip -9 -c`), budget 60,000 / 12,000.
- Schema shasums of the ten sections equal Step 0 (C4b.2). Protected paths changed vs base: `locales/en.default.json` (+3) and `templates/gift_card.liquid` only (in scope). `.inline{display:inline}` present.
- C4b.3(a): `rg` for style/stylesheet tags in the T4b files prints only `templates/gift_card.liquid:7` (layer statement). C4b.11 escapes present (19 hits); no `innerHTML = story`; no `h-full` in the archive; no `page-shell` in `src/tailwind.css`; no old strings (`>Sustainability<`, `More items engineered` literal).

## Results by focus item

**Overflow (C4b.5), head, widths 320/375/390/430/768/1440/1920** (`t4bq-overflow.mjs`): X = 0 everywhere on `/`, `/collections/all`, `/collections`, `/search`, `/search?q=snowboard`, no-results search, `/pages/contact`, balanced-face page, material archive, `/blogs/news`, 404, three products, `/cart`, `/password`. Base reproduced: `/collections/all` 200/145/130/90 (320/375/390/430) and search 158/103/88/48. **Exception: `/pages/data-sharing-opt-out`, see N1.** Every `<img>` has width and height; one `<h1>` per page.

**Search escaping (C4b.10)** (`t4bq-escape.mjs`, payloads use `console.log`, never `alert`): terms `<i>zz</i> & "q"`, `snowboard <i>zz</i> & "q"`, `<b>x</b>`, `"><img src=x onerror=console.log(...)>`, `</script><script>...`, `&amp; &lt;b&gt;`, `snowboard '><svg onload=...>`. Both branches reached (no-results and "13 results found for ..." with a match). In every case `[data-search-summary]` has no child elements, its text contains the literal term, no double escaping (`&amp;` input shows literally as typed once), input `value` equals the terms, no injected `img`/`svg`/`script`, console shows no payload output. Observation (not T4b): Shopify's `<title>` for such queries is cut/entity-formatted (`"zz &amp; "q""`); that is layout/Shopify `page_title`, unchanged.

**Pagination snippet** (head copy, page size 2 on collection and search; `t4bq-proxy.mjs pag`): pages 1/2/4/8/99. Exactly one `nav[data-pagination][aria-label="Pagination"]`; hrefs correct (`?page=N`, `/search?page=N&q=snowboard`); one `aria-current="page"` (absent only for the out-of-range page 99, as expected); no previous on page 1, no next on the last; previous/next carry translated `aria-label`s ("Previous page"/"Next page"), page links "Page N"; every item including the gap ellipsis is 44x44; nav sits below the grid and is centred (x = 720). The `| append: ''` comparison works on both sides (current marker found on every page). Nit: the current item's `textContent` is "Page N N" (sr-only label plus aria-hidden number), as the snippet is written; plan C4b.9(c) literal wording ("text is the page number") is not met textually but the accessible name is correct. Blog and article-comment pagination: no fixture (blog has no articles); static diff reviewed (`anchor: 'comments'` argument, first-image-only preload, others `loading: 'lazy'`).

**Collections settings (C4b.8, PX3 via alternate page templates containing the collections section)**: compact gap 0/10/50 at 1440 = 8x167 / 7x182.3 / 6x181; full = 4x334 / 326.5 / 296.5; 375 all 1x271; computed `column-gap` equals the setting; X = 0.

**Archive settings (C4b.15 b/c, PX4)**: `columns_desktop` 1-4 at 1440 = 1240 / 604 / 392 / 286; at 900 two tracks of 334; 375 one of 287; padding 0/100 gives 0/0 and 100/100 at 1440, 0 and 75 at 375.

**Recommendations (C4b.18, PX5/PX5b/PX5c on the 3p product, matches forced)**: 4 `li` each with `[data-related-card]`, no mini-card/relational-rec/page-width, heading "More items engineered with Recycled Steel", Oswald uppercase 40 px (1440) / 30 px (375), padding 36 default (27 at 375), 0/0, 100 (75 at 375), images with dimensions, one `h1`.

**Archive frame parity (C4b.15a, E4b.14/15)** (`t4bq-archive.mjs`, base vs head): grid edges identical at 375 (44-331), 749 (44-705), 768/900/1024/1440 (100-...), 1920 (340-1580). Change only in 750-767 as designed (base 100-650..667, head 44-706..723). Column counts: head 2 columns from 768 and 3 from 1024 (base 750 and 990), as E4b.15. Meter per card: 6 meters, 30 bars, 21 active (3+2+3+5+4+4), animation `sustainabilityFillReveal`, delays 0/150/300/450/600 ms, `aria-label` "Sustainability rating: 3 out of 5", no old classes in HTML. Card: radius 12, border `1px oklab(0 0 0 / .08)`, bg `rgb(255,255,255)`, color `rgb(51,51,51)`, hover `translate 0px -5px` plus `0 10px 30px` 5% shadow after 600 ms. Footer: label "Sustainability score" 12.8 px, "3 of 5" 14.4 px `rgb(45,90,39)` (E4b.16 confirmed). **Card height measured +11.0 px (467.6 to 478.6 at 1440; 431.5 to 442.5 at 375), not ~37 px**; the Coder's 37 includes the shifted header block (row bottoms 737.6 vs 774.6). Owner should still eyeball E4b.16 (screenshot `docs/qa/screenshots/t4bq-head-archive.png`, base `t4bq-base-archive.png`).

**`p3p` 375 pixel diff**: reproduced nothing. Base vs head: 0 differing pixels at 375 and 1440. Head vs head (three captures): 0. Base vs base: `snow` 1440 shows 32 px jitter (y 1060-1991, x 1064-1113, likewise on base alone), so the earlier 14/196 px diffs were jitter, not a regression from the Step 13 story escape. Home, wax, cart identical base vs head at 375/1440; snow 375 identical.

**Password page and inputs (C4b.20/26)** (`t4bq-controls.mjs`, 16 pages at 1440, base vs head): computed border-top-width of every visible input/select/textarea identical to base (search input 1px/44, quantity 1px/44, variant select 1px/44, `/password` input 1px/44). None went to 0 after D6 rule removal. No contact/comment form fixture exists (contact page body is blank; no article), so those inputs were not rendered; their classes are covered by static diff only. Not run: the single password-submission attempt on a fresh context (not needed, Coder recorded its limits; one login only was used by QA, plus one for the live check).

**Gift card**: static only. `<main class="text-center">`, `inline` on images, no `{% style %}`, layer statement kept, `shop.name | escape`. No fixture rendered.

**Headings/images/preload**: heading sequence on archive is h1 then h2s; other pages h1 only inside the shell (an h2 precedes the h1 in DOM order from the header/footer area, same markup as base). Blog is empty so preload behavior not renderable (no fixture; static diff correct).

**Regression T1-T4a** (`t4bq-regress.mjs`, 1440x900 and 375x667): header 64 px, footer, nav links, one `h1` on `/`, wax, snow, p3p, cart; add-to-cart on wax opens drawer (200), quantity to 3 via `fill()`+`blur()`, remove returns "Your cart is empty.", Escape closes; at both viewports. Console errors only Shopify `MonorailRequestError` (analytics network, not theme). Product pages p3p/wax/home/cart pixel identical to base.

**Visual (E4b rows)**: collection and search at 375 render single-column with 16 px gaps, no horizontal scroll; screenshots under `docs/qa/screenshots/t4bq-*`.

## C4b.29: live app embed check (read-only)

Run `docs/qa/harness/t4bq-live.mjs`, `t4bq-live2.mjs`: fresh browser context, one storefront login (the only POST), then GET navigation only on `https://theme-evolution-os2.myshopify.com` with **no `preview_theme_id`**. On `/`, wax, snow, 3p and `/cart`: `Shopify.theme.id` = 138872651872, `role` = "main", name "theme-evolution-os2" on every page. Found: **no `supercycle` string in the document HTML; no `[id^="shopify-block-"]`/app-block/app-embed elements; no third-party scripts** (only `shop.app/checkouts/internal/preloads.js`). Hosts contacted are all Shopify-owned (`shop.app`, `monorail-edge`/`otlp`/`error-analytics` on `shopifysvc.com`, `shopify-assets.shopifycdn.com`, `extensions.shopifycdn.com`). Other DOM items: one shadow host `shop-cart-sync` (Shopify's own), Shopify accelerated-checkout/digital-wallet elements, and a store web-pixel sandbox (`web-pixel-sandbox-CUSTOM-shopify-custom-pixel-...`, a merchant custom pixel, not a theme app embed). Conclusion: **no Supercycle app embed markup or script is present on live right now**, which agrees with the Coder. Caveat: the checkout-side hosts `extensions.shopifycdn.com` appeared in one run (likely the web-pixel extension); I did not identify it further. An embed that is installed but disabled leaves no storefront trace, so this cannot show whether the 2026-10-22 disabled embed still exists in the theme editor; the owner's check remains outstanding. No writes were made to live.

## Issues

**N1 (nit, medium-low): `/pages/data-sharing-opt-out` overflows horizontally, worse than base.** Repro: `/pages/data-sharing-opt-out` at 375 wide (Playwright, repo head): `scrollWidth` 431 vs viewport 375 (X = 56); 320: 111; 390: 41; 430: 1. Base: X = 24 / 79 / 9 / 0 at the same widths. Cause: Shopify's privacy widget (`div.pc--show-email-field`, fixed about 379 px) sits inside page content; the shell's 32 px inset (content at x = 52 instead of 20) pushes it 32 px further out. The page already overflowed on base, and the Coder's page set did not include it, so the "X_page 0 on every page" claim does not hold for it. It is merchant/Shopify-widget content. Suggested follow-up: `min-w-0`/`overflow-x-auto` on the page content wrapper, or note it for T4c. (Playwright.)

**O1 (observation):** Coder's "~37 px taller cards" is +11 px per card (see above); the rest is header-block spacing.
**O2 (observation):** current-page item text "Page N N" (see pagination).
**O3 (observation):** Shopify `<title>` for hostile search terms is truncated at the first `>`/`<` (Shopify's `page_title`, unchanged).

## Console, network

Console: only `[HotReload]`/bugsnag info plus Shopify Monorail analytics errors in the preview; no theme JS errors; no payload execution during escape tests. No failed theme requests observed (all pages 200, 404 page 404).

## Accessibility

Pagination nav labelled "Pagination", previous/next labelled, current page `aria-current="page"`, 44 px targets. Archive meters have `role=meter` with `aria-valuenow` and descriptive `aria-label`. Search label `sr-only`.

## Performance

CSS net -864 / -184 bytes vs T4a (43,803 / 9,253). Page/bundle sizes not re-measured by QA (Coder recorded `K_bun` 2,147 to 826).

## Could not verify

Blog and article pagination, comment form, blog preload, gift-card render (no fixtures); the theme's `/password` submit in a fresh context (Shopify's built-in page shows instead); theme editor settings (QA can't drive the editor; proxies used); C0.13 dynamic checkout review; hover on touch devices; contact/comment form input borders (no fixture).

## Evidence

Harness: `docs/qa/harness/t4bq-{lib,overflow,escape,archive,controls,dso,headings,proxy,regress,shots,live,live2}.mjs`. Screenshots (gitignored): `docs/qa/screenshots/t4bq-*` (`b1` base, `h1`/`h2`/`h3` head, `head-archive`, `base-archive`, `px5-*`).

Verdict: PASS WITH NITS
