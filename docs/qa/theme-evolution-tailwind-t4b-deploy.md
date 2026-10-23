# theme-evolution-tailwind-t4b — Deploy Note

**Deploy timestamp:** 2026-10-23 12:03:43 UTC (push completed 12:03:46 UTC)
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging). LIVE NOT TOUCHED.
**Operator:** Junior Warner (DevOps agent)
**Git SHA deployed:** 82dc6cf9275545bb980319a78d2aee4ab0663fcf
**Method:** `shopify theme push --theme=187953643616 --store=theme-evolution-os2.myshopify.com`
**Backups:** local pre-push pull of staging at `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t4b-staging`. No live backup was taken (staging-only deploy, live untouched; task scoped the backup to staging).

## Build gate
`npm ci && npm run check:css` exit 0. `assets/tailwind.css`: 43,803 bytes (`wc -c`), 9,253 bytes gzip -9. Within the 60,000 / 12,000 budget.

## Push outcome
CLI reported: "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully." Preview: https://theme-evolution-os2.myshopify.com?preview_theme_id=187953643616

## Smoke test (preview_theme_id=187953643616)
Overflow = scrollWidth - clientWidth.

| Route | 375 before | 375 after | 1440 before | 1440 after |
|---|---|---|---|---|
| / | 0 | 0 | 0 | 0 |
| /collections/all (30 product links) | 145 | 0 | 0 | 0 |
| /search?q=snowboard (30 product links) | 103 | 0 | 0 | 0 |
| /collections | 0 | 0 | 0 | 0 |
| /pages/the-material-archive | 0 | 0 | 0 | 0 |
| /blogs/news | 0 | 0 | 0 | 0 |
| 404 URL (HTTP 404) | 0 | 0 | 0 | 0 |
| /cart | 0 | 0 | 0 | 0 |
| /products/the-complete-snowboard | 0 | 0 | 0 | 0 |

- All routes, both viewports: exactly one h1, status as expected (200; 404 for the missing URL).
- `/` returns 200 and the `tailwind.css` link returns 200. No theme console errors on `/`. The 404 page logs the expected 404 resource error; the PDP logs a Shopify `MonorailRequestError` (analytics network failure, not theme code).
- `/search?q=%3Cb%3Ex%3C%2Fb%3E`: literal text `<b>x</b>` present, 0 `<b>` elements in main.
- `the-complete-snowboard` renders (h1 present). Add to cart from `selling-plans-ski-wax` opens the drawer (data-state=open) at 375 and 1440; cart emptied afterwards (item_count 0).
- Base store URL: 302 (password gate, expected).

## QA nits (from the QA report)
- N1: `/pages/data-sharing-opt-out` horizontal overflow worsened from 24 to 56 px at 375 by Shopify's privacy widget inside the new page-shell inset. Follow-up in T4c.
- Pagination text shows "Page N N".
- Article, comment, gift card and blog pagination untested for lack of fixtures.

## Outstanding owner checks
- E4b.3 collection grid and gap
- E4b.4 search form
- E4b.12 password page
- E4b.16 archive card footer (from the PDP rating snippet)
- Theme editor preview of affected sections
- 1440x900 and 375x667 visual review

## Live gate
Live NOT authorized. The C4b.29 live probe must be re-run immediately before any live push. A live push also needs a fresh explicit request, a live backup, and the editor-change diff (devops.md step 2).

## Rollback
Staging only; no rollback required for live. To restore staging, re-push the local backup: `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t4b-staging`. Never publish #187953643616.
