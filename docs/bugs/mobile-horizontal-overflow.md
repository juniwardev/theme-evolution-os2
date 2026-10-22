# Bug: Page scrolls horizontally on phones; cart icon is pushed off-screen

**Slug:** mobile-horizontal-overflow
**Reported:** 2026-10-22
**Reported by:** internal QA (nit N2 in `docs/qa/theme-evolution-footer-report.md`), reproduced and measured by Claude on the live theme
**Severity:** High
**Affected scope:** Every page at phone widths (header overflow, measured 320–430px); homepage at ≤ ~395px (banner buttons). All browsers (layout bug, not engine-specific). Desktop (≥ 750px) is unaffected.

## Steps to reproduce

1. Open `https://theme-evolution-os2.myshopify.com/` at a 375×667 viewport (iPhone SE size) and enter the storefront password from `docs/dev-fixtures.md`.
2. Look at the header: the cart icon is partly or fully cut off at the right edge.
3. Swipe or scroll sideways: the whole page moves left, revealing a blank strip on the right.
4. Scroll to the image banner near the bottom of the homepage: the "Shop all" / second button are wider than the screen.
5. Repeat on `/products/the-3p-fulfilled-snowboard`: the header overflow is the same; there is no banner on this page.

To measure, run in the console: `document.documentElement.scrollWidth` (should equal `innerWidth`).

## Expected behavior

No horizontal scrolling at any viewport width. `document.documentElement.scrollWidth` equals the viewport width, and the header's menu toggle, account and cart icons all fit on screen.

## Actual behavior

Measured on the live theme (#138872651872) on 2026-10-22:

| Viewport | Page `scrollWidth` | `.header__icons` right edge | `.banner__buttons` right edge |
|---|---|---|---|
| 320 | 396 | 385 | 396 |
| 375 | 413 | 407 (cart icon spans 343–413) | 396 |
| 390 | 419 | 413 | 396 |
| 430 | 435 | 429 | 396 (fits) |
| 749 | 749 (no overflow) | 697 | 705 |

Two separate elements overflow:

1. **Header icons (all pages, all phone widths).** `.header__icons` holds the mobile menu toggle, account and cart, each **70px** wide, in a `flex-wrap: nowrap` row. The menu toggle shows **both** its hamburger and its close (✕) icon side by side while the menu is closed. At 375px only 32px of the 70px cart icon is on screen.
2. **Banner buttons (homepage, ≤ ~395px).** Each `.banner__buttons--multiple` button has `min-width: 352px`, but the banner box only has 287px of content width at 375px (335px box minus 2×24px padding).

Screenshot (local only; `docs/qa/screenshots/` is gitignored): `docs/qa/screenshots/bug-mobile-overflow-375-home.png`, a full-page capture at 375px.

2026-10-22: after `theme-evolution-tailwind-t0` (E1), the menu toggle no longer shows the close icon, so the header overflow figures above are out of date. Re-measured `X_hdr`/`X_page` at 320/375/390/430: see `docs/qa/theme-evolution-tailwind-t0-report.md`. QA found that T0 did NOT reduce the overflow (the E1 deviation, accepted by the owner). The header half will be resolved in T1 and the banner half in T3 (`docs/plans/theme-evolution-tailwind.md` D9).

## Hypothesis (optional)

Two findings, both confirmed in the browser. Whether they are the whole story is for the investigation.

1. **Close icon never hides (specificity).** `sections/header.liquid:235` sets `.theme-evolution-header-menu__icon--close { display: none; }` (specificity 0,1,0), but `assets/base.css` has `.header__icon:not(.header__icon--summary), .header__icon span { display: flex; }` (0,1,1), which wins. So the close icon always renders, widening the toggle by ~32px. This is the same class of bug fixed in `bfc6d1b` for the mobile nav.
2. **rem values render 1.6× too large (likely root cause for both).** The root font size is **16px**. Dawn-derived CSS assumes a **10px** rem: Dawn's layout sets `html { font-size: calc(var(--font-body-scale) * 62.5%) }`, and this theme's `layout/theme.liquid` doesn't. As a result `.header__icon { width: 4.4rem }` renders at 70px instead of 44px, and the banner rule `min-width: 22rem` renders at 352px instead of 220px. With a 10px rem, both overflows would likely disappear.

**Caution for the Architect:** fixing #2 at the root (setting 62.5% on `html`) would shrink every Dawn-derived rem value across the theme, including the shipped header, footer and material spotlight, which were built and QA'd against the current 16px sizes. A targeted fix to the two components is lower risk. The site-wide change is a separate decision with its own regression testing.

## Suspected files

- `sections/header.liquid`: `.header__icon` width (line ~150), `.header__icons` (lines ~159–165), menu icon show/hide rules (lines ~235–243)
- `assets/base.css`: `.header__icon:not(.header__icon--summary), .header__icon span { display: flex; }`, plus the cart icon's negative right margin (computed `-19.2px`)
- `assets/section-image-banner.css`: lines ~444–460 (`.banner__buttons`, mobile `.banner__buttons--multiple > * { min-width: 22rem; }`)
- `sections/image-banner.liquid`: line 142 (adds `banner__buttons--multiple`)
- `layout/theme.liquid`: no root `font-size` rule (context for hypothesis #2)

## Regression risk areas

(To be filled by the Architect during planning.)
