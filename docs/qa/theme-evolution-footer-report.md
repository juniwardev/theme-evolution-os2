# QA Report: theme-evolution-footer (run 3, after commits aff04a3, 8510a5d, 4492878)

Date: 2026-10-22
Plan: `docs/plans/theme-evolution-footer.md` (rev 3)
Impl-notes: `docs/plans/theme-evolution-footer-impl-notes.md` (see "Post-QA round 2")
Prior verdict: FAIL (invalid `url` defaults, uncommitted)
MCP used: Playwright only (no Chrome DevTools escalation needed)

## Summary verdict

**PASS WITH NITS.** All three columns render together, the grid is `640px 320px 320px` (2fr 1fr 1fr) at 1440px, all five social icons render with correct links, attributes and aria-labels, the background is full-bleed at both sizes, and theme check shows only the two expected offenses. The prior blocker is gone. Nits are listed below; none block deploy.

Test environment note: `shopify theme dev` printed only `http://127.0.0.1:9292` and the `https://theme-evolution-os2.myshopify.com/?preview_theme_id=138872651872` URL (no `shopifypreview.com` host). I used the myshopify preview URL (same edge path, not localhost), after passing the storefront password gate.

## Prior issues status

| Prior issue | Prior status | Status now |
|---|---|---|
| Blocker: invalid `"default"` on `url` settings (upload failure) | BLOCKER | RESOLVED. No `url` setting has a default. No schema error in dev-server log or `/hot-reload/app-state`. |
| Blocker (run 1): footer background not full-bleed (ab239d6) | RESOLVED in run 2 | STILL RESOLVED. wrapper left=0, right=viewport width at both sizes. |
| Nit: social column untestable | NIT | RESOLVED. Seeded URLs in `footer-group.json` render all five icons. |
| Nit: 3-column grid not verifiable | NIT | RESOLVED. Measured `640px 320px 320px`. |
| Nit: `about_text` richtext `"default"` deviates from plan | NIT | Owner-accepted deviation. Noted, not failed. |

## Test cases

| ID | Check | Method | Result | Evidence |
|---|---|---|---|---|
| T1 | Three columns render together; desktop grid 2fr 1fr 1fr | Playwright, computed style + rects, 1440px, home and 3p product | PASS | grid `640px 320px 320px`; about 640 / menu 320 / social 320 wide; lefts 32 / 720 / 1088 |
| T2 | Five icons, seeded URLs, new tab, rel | Playwright DOM | PASS | hrefs instagram.com, facebook.com, youtube.com, tiktok.com, x.com; all `target=_blank`, `rel=noopener` |
| T2b | aria-label = platform + hint, comma separated | Playwright DOM | PASS | "Instagram, Opens in a new window." (likewise Facebook, YouTube, TikTok, "X (Twitter)") |
| T2c | `<ul>` role and aria-label | Playwright DOM | PASS | `role="list"`, `aria-label="Social media"` |
| T3 | SVG color inherits `--footer-text` | Playwright computed style | PASS | `--footer-text` #ffffff; svg `fill` and link `color` both rgb(255,255,255) on all 5 icons |
| T4 | Full-bleed background | Playwright rects | PASS | desktop left=0, right=1440 (scrollWidth 1440); mobile left=0, right=375 |
| T5 | Mobile stack about → nav → social, no footer overflow | Playwright rects at 375px | PASS | grid `327px`; tops 2335 / 2436 / 2518 (home), 2271 / 2373 / 2455 (3p); zero footer elements extend past viewport |
| T6 | Bottom bar: copyright, powered-by, payment icons | Playwright DOM + screenshot | PASS | "© 2026 theme-evolution-os2 · Powered by Shopify"; 9 payment `<li>`; payment `<ul>` role=list, aria-label="Payment methods"; mobile bottom bar `flex-direction: column` |
| T7 | Per-icon hiding, all-blank, toggle off | STATIC: read `sections/footer.liquid` lines 7-20 and 56-96 (not tested live; theme files cannot be edited and editor not reachable) | PASS (static) | `has_social` true only if `show_social_icons` AND at least one URL non-blank; each `<li>` wrapped in its own `!= blank` guard. All blank gives no column; one URL gives only that icon; toggle off gives no column. |
| T8 | Exactly one `<h1>`; footer adds no heading skips | Playwright DOM, home and 3p | PASS | 1 `<h1>` on both pages; zero headings inside `<footer>` |
| T9 | Console errors related to footer | Playwright console, both pages | PASS | None footer-related. One Shopify `monorail ... Failed to fetch` (shopify_pay_page_load) seen on password/product load, platform analytics noise. Home page: 0 errors. |
| T10 | Theme editor check | Not attempted | BLOCKED | Editor URL requires Shopify admin login, which is not available to QA. Storefront preview was verified instead. |
| T11 | Dev server uploads without schema errors | Dev-server log and `/hot-reload/app-state` | PASS WITH NIT | No schema error. See N1. |
| T12 | `shopify theme check` | CLI | PASS | Exactly the two expected offenses (below) |

## Issues

No blockers.

- **N1 (NIT, environmental):** The dev server's upload panel reports `AGENTS.md file size exceeds the maximum of 50 KB`. Not footer-related, but it keeps the dev server in a "Failed to Upload Theme Files" state. Footer changes were nonetheless live on the preview. Consider adding `AGENTS.md` to `.shopifyignore`.
- **N2 (NIT, out of scope):** At 375px, `document.documentElement.scrollWidth` is 413 on both the home page and the 3p product page. The overflowing elements are `.header__icons` / cart icon and `.banner__buttons`, none in the footer (0 footer elements exceed the viewport). Worth a separate header/banner fix. Footer requirement T5 is met.
- **N3 (NIT, informational):** `about_text` default retained (owner-accepted). Pushing `sections/footer-group.json` overwrites saved footer settings on stores already configured (per impl-notes).
- **N4 (NIT):** The element screenshots of the footer have the Shopify preview bar ("Password protected", "Hide bar") overlaid on the bottom bar. This is a preview artifact; bottom bar contents were verified through the DOM.

## Console and network

- Home page: 0 errors. 3p product page: 1 error, Shopify Pay monorail analytics fetch failure (platform, not theme). No footer asset failures.
- Hot-reload INFO messages only.

## Accessibility

Footer contains `<nav aria-label="Footer menu">` and `role="list"` on menu, social and payment lists. Social links carry platform name plus new-window hint. The footer adds no headings.

## Theme check

```
61 files inspected with 2 total offenses found across 2 files.
1 errors. 1 warnings.
```
- `[error] TranslationKeyExists`, sections/cart-drawer.liquid (expected)
- `[warning] UnusedAssign`, snippets/card-product.liquid (expected)

## Screenshots (`docs/qa/screenshots/`)

| File | Description |
|---|---|
| `v3-desktop-home-footer.png` | 1440px home page, three columns with five icons |
| `v3-desktop-3p-footer.png` | 1440px the-3p-fulfilled-snowboard footer |
| `v3-mobile-home-footer.png` | 375px home page, stacked footer |
| `v3-mobile-3p-footer.png` | 375px the-3p-fulfilled-snowboard footer |

Dev server stopped. No `.approved` file created; nothing committed.

PASS WITH NITS
