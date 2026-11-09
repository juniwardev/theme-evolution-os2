# theme-evolution-tailwind-t6b — Deploy Note (STAGING)

**Deploy timestamp:** 2026-11-09 08:13:05 UTC (push finished 08:13:09 UTC)
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging)
**Operator:** DevOps agent for Junior Warner
**Git SHA deployed:** e1ac809 (main; T6b changes in `sections/cart-drawer.liquid`, `sections/cart.liquid`, `sections/product.liquid`, `sections/image-banner.liquid`, `assets/eco-tooltip.js`; `assets/tailwind.css` unchanged, 59,172 / 11,331)
**Method:** `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616` (no `--allow-live`, no `--publish`)
**Backups:** local `/Users/juniorwarner/Projects/Shopify/theme-backups/theme-evolution-os2/2026-11-09-pre-theme-evolution-tailwind-t6b-staging` (pulled copy of staging). No store-side duplicate: staging is a long-lived overwrite target and live was not touched.

## Gates
Report ends `PASS WITH NITS` (01a3a02); `.approved` present (e1ac809); no modified or staged tracked files; no untracked files outside `docs/`; `npm ci && npm run check:css` exit 0. `theme list` confirmed #187953643616 is `unpublished` (name theme-evolution-tailwind-staging) and live is #138872651872 (not touched).

## Push outcome
CLI: "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully."
Staging's `templates/collection.json` was replaced by the repo's copy (`{}`); any staging editor values are in the backup.

## Verification (preview_theme_id=187953643616; every load asserted `Shopify.theme.id` = 187953643616)
Note: Cloudflare returned 429 / "Just a moment" challenges to the first three smoke attempts (login false, nothing replayed against the cart). Waited it out (about 10 minutes), then ran once, one page load at a time, adds 65 s+ apart.

| Check | Result |
|---|---|
| Home | 200, theme id ok, `tailwind.css` link present and asset URL 200, no console errors |
| `selling-plans-ski-wax` 1440 | 200, no overflow, real add-to-cart opened drawer, focus on `div[role=dialog]` inside drawer, Escape closed it, focus returned to `button[name=add]`, 0 console errors |
| `selling-plans-ski-wax` 375 | same as 1440: open, focus in drawer, Escape closes, focus back on add button, no overflow, 0 console errors |
| `/cart` | 200, 1 h1, 2 money values (line price, total), "total" present, quantity inputs numeric (value 1) |
| `the-3p-fulfilled-snowboard` add | 422 as expected; visible alert wrapper (hidden false, height 20px) with text "The product 'The 3p Fulfilled Snowboard' is already sold out."; drawer stayed closed |
| `/collections/all` | 200, 1 h1, no overflow |
| `/policies/privacy-policy` | 200, 1 h1, no overflow |

Console: apart from the expected 422 on the snowboard add, the only errors on the snowboard, collection and policy pages were Cloudflare 429 subresource responses, one `ERR_BLOCKED_BY_RESPONSE...Coep` (third-party resource), and one "Error refreshing cart ... Unexpected token '<'" on the snowboard page, which is the cart refetch receiving the 429 HTML page. Monorail errors filtered as known. No page errors from theme code.

## Pending
- Owner checks: theme editor; 1440x900 and 375x667 visual checks.
- Never publish #187953643616 (it carries the repo's `config/settings_data.json`).
- Test lines remain in the smoke session's guest carts only (no store data).

## Rollback procedure
Staging only; live was not touched. To restore staging's previous state, re-push the backup:
`shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=/Users/juniorwarner/Projects/Shopify/theme-backups/theme-evolution-os2/2026-11-09-pre-theme-evolution-tailwind-t6b-staging --nodelete`
Live rollback is not applicable to this deploy.
