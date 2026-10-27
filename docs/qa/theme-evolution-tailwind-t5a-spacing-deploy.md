# theme-evolution-tailwind-t5a-spacing — Deploy Note

**Deploy timestamp:** 2026-10-27 04:50:04 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging)
**Git SHA deployed:** a9f0d37 (main)
**Method:** `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616` (no `--allow-live`, not published)
**Backup:** local pull of staging before push: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-27-pre-theme-evolution-tailwind-t5a-spacing-staging`

## Pre-push checks
- Tracked tree clean; `npm ci` ok; `npm run check:css` exit 0; `shopify theme check`: 187 files, no offenses.
- `theme list`: #187953643616 role unpublished, already named theme-evolution-tailwind-staging; live is #138872651872.

## Push outcome
Push reported success. Remote deletions: none (every file in the pre-push backup exists in the repo). Staging received the repo's config/settings_data.json and templates, including the new templates/product.rental.json.

## Smoke test (preview_theme_id=187953643616, 1440x900 and 375x667)
Pages: /, /pages/contact, /policies/privacy-policy, /products/the-rental-snowboard, /products/selling-plans-ski-wax, /collections/all. All 12 page loads:
- HTTP 200, Shopify.theme.id 187953643616.
- tailwind.css requested once, base.css 0 times.
- 0 console and page errors (0 analytics/monorail noise).
- One h1; no horizontal overflow (scrollWidth - clientWidth = 0).
- Served tailwind.css (HTTP 200) contains `:where(tbody,tfoot)` 3 times and `:where(h5,h6)` once (minified, no space after the comma).
- Rental snowboard: no dynamic checkout button, no visible quantity input at both viewports. Control: selling-plans-ski-wax shows both, as expected.

Pending operator checks: theme editor; visual checks.

## Rollback procedure
Staging only; live was not touched. To restore staging: `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-27-pre-theme-evolution-tailwind-t5a-spacing-staging`. Never publish #187953643616.
