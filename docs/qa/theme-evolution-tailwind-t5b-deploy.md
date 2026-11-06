# theme-evolution-tailwind-t5b — Deploy Note

**Deploy timestamp:** 2026-11-06 18:41:41 UTC (push finished 18:41:45 UTC)
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging)
**Git SHA deployed:** 1246aa5 (main, no tracked changes)
**Method:** `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616` (no `--allow-live`, not published)
**Backup:** local pull of staging before push: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-11-06-pre-theme-evolution-tailwind-t5b-staging`. No live backup taken: live was not touched (staging-only request).

## Pre-push checks
- Gates: QA report PASS WITH NITS, `.approved` present, tracked tree clean, no untracked files outside `docs/`.
- `npm ci` ok; `npm run check:css` exit 0.
- `theme list`: #187953643616 role unpublished, named theme-evolution-tailwind-staging; live is #138872651872 (untouched).

## Push outcome
CLI reported: theme 'theme-evolution-tailwind-staging' (#187953643616) pushed successfully.

## Smoke test (fresh context, preview_theme_id=187953643616, 1440x900 and 375x667)
Pages: /, /products/the-3p-fulfilled-snowboard, /products/the-rental-snowboard, /collections/all, /policies/privacy-policy. All 10 loads:
- HTTP 200; Shopify.theme.id == 187953643616 on every load.
- `html` line-height computes 24px.
- Privacy policy has the `data-policy-prose` wrapper (absent on the other pages, as expected).
- tailwind.css served with 200; one h1; no horizontal overflow.
- Console: 0 theme errors. The 3p snowboard page logged one Shopify monorail analytics network error at each viewport (platform noise, not theme).
- Storefront root curl: 302 (password gate).

Pending operator checks: theme editor; 1440x900 and 375x667 visual checks.

## Rollback procedure
Staging only; live was not touched. To restore staging: `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-11-06-pre-theme-evolution-tailwind-t5b-staging`. Never publish #187953643616.
