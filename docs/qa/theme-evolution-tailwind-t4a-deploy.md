# theme-evolution-tailwind-t4a — Deploy Note

**Deploy timestamp:** 2026-10-23 09:50 UTC (push started)
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging)
**Operator:** Junior Warner (DevOps agent)
**Git SHA deployed:** de08107
**Method:** `shopify theme push --theme=187953643616 --store=theme-evolution-os2.myshopify.com`
**Backups:** local `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t4a-staging` (staging pre-push pull). No live backup taken: staging-only deploy, live untouched.

## Push outcome
Success: "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully." Staging receives the repo's `config/settings_data.json` by design.

## Build gate
`npm ci && npm run check:css` exit 0. `assets/tailwind.css`: 44,667 bytes (`wc -c`), 9,437 bytes gzipped (`gzip -9`). Within the 60,000 / 12,000 budget.

## Files pushed
Whole working tree at de08107 (T4a: cart intelligence banner, cart drawer, cart page list, compiled tailwind.css). See `docs/plans/theme-evolution-tailwind-t4a-impl-notes.md`.

## Verification (preview_theme_id=187953643616, 1440x900 and 375x667)
- Storefront root: 302 (password gate, expected). `/` with preview: 200.
- `tailwind.css` linked and returns 200. No console errors or page errors on `/`. No 4xx/5xx responses.
- Wax (`selling-plans-ski-wax`) add to cart: 200, drawer opens with 1 item at both widths (panel 400px at 1440, full width at 375).
- Drawer closes via close button and via Escape; reopens from header cart icon.
- `/cart`: item list rendered with remove link, one Update button, checkout button(s). Horizontal overflow 0 at 1440 and 375.
- Removing the item: "Your cart is empty." shown, no "Translation missing".
- `the-complete-snowboard`: renders at 1440 and 375, overflow 0.
- Smoke-script caveat: its list-item count selector matched 0 (selector artifact); item presence was confirmed by the remove link and Update button.

## QA nits (from the report, PASS WITH NITS)
- Red remove link contrast 3.24:1 on dark palette.
- Pre-existing close/reopen race.
- No drawer focus management.
- 3p snowboard add-to-cart 422 shows no visible error.
- /cart shows no prices or total.
- Header cart icon edge case.

## Outstanding owner checks
- Q4a.1: lime `btn-primary` checkout button.
- Q4a.2: restored backdrop.
- Q4a.5: cart page as a list (undo = revert Step 5 commit 7f4b5f8).
- Theme editor preview of the drawer and cart.
- 1440x900 and 375x667 visual checks.

## Live deploy
NOT authorized. Never publish #187953643616: it carries the repo's `settings_data.json` and would overwrite live's settings and app embeds.

## Rollback procedure
Staging only: re-push the previous state from the local backup, `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t4a-staging --nodelete`. Live was not touched; no live rollback needed.
