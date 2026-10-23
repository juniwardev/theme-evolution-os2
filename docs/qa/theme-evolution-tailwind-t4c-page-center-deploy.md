# theme-evolution-tailwind-t4c-page-center — Deploy Note

**Deploy timestamp:** 2026-10-23 15:27:20 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging)
**Operator:** Junior Warner (DevOps agent)
**Git SHA deployed:** 65f945f
**Method:** `shopify theme push --theme=187953643616 --store=theme-evolution-os2.myshopify.com`
**Backups:** no store-side duplicate (staging deploy, not requested); local pre-push pull of staging: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t4c-page-center-staging`

## Push outcome
Success: "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully."
Build gate: `npm ci && npm run check:css` exit 0. `assets/tailwind.css` 58,366 bytes, 11,104 gzipped (`gzip -9`).

## Files pushed
- `sections/page.liquid`: centered title and text column.
- `assets/tailwind.css`: rebuilt.

## Verification
- Storefront (no preview) response: 302 (password gate, expected).
- Every smoke page reported `Shopify.theme.id === 187953643616`; `tailwind.css` returned 200 on all.
- 1440x900: `/` 200, one h1; `/pages/data-sharing-opt-out` 200, h1 x=396.6 w=646.9, prose x=396.6 w=646.9, gaps L/R 396.6/396.6, X_page 0, one h1; `/collections/all` 200, h1 x=52, one h1.
- 375x667: `/` 200, one h1; `/pages/data-sharing-opt-out` 200, X_page 0, h1 and prose x=52 w=271; `/collections/all` 200, h1 x=52, one h1.
- Pending operator checks: theme editor; visual checks at 1440x900 and 375x667.

## Live
Not authorized for this slug. Before any live deploy, re-run the C4b.29 and C4c.22 probes.

## Rollback procedure
Staging only; nothing to roll back on live. To restore staging, re-push the local backup:
`shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t4c-page-center-staging`
Never publish #187953643616.
