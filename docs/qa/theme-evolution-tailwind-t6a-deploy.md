# theme-evolution-tailwind-t6a — Deploy Note

**Deploy timestamp:** 2026-11-07 01:54:32 UTC (push completed 01:54:36 UTC; local date 2026-11-06)
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging). Live #138872651872 untouched.
**Operator:** DevOps agent (project-scoped)
**Git SHA deployed:** 4bc95cd (includes T6a commits 67b6839, 9984a89, 942408d on top of T5b)
**Method:** `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616` (no `--allow-live`, no `--publish`)
**Backups:** local `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-11-06-pre-theme-evolution-tailwind-t6a-staging` (pull of staging as it was after T5b). No store-side duplicate: staging is overwritten by design and live is not touched.

## Gates
- Report ends `PASS WITH NITS` (8b63fd3); `.approved` present, zero bytes (4bc95cd).
- No modified/staged tracked files; no untracked files outside `docs/`.
- `npm ci` and `npm run check:css` exited 0.
- `theme list`: #187953643616 present, role unpublished, named theme-evolution-tailwind-staging.

## Push outcome
CLI reported "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully."

## Files pushed
T6a changes: `snippets/image.liquid` (optional widths/sizes/loading), `sections/collection.liquid` (Desktop columns / Mobile columns settings, card images with srcset, computed sizes, lazy after the first row), `assets/tailwind.css` (compiled; `grid-fill` and column utilities).

## Verification (preview `?preview_theme_id=187953643616`, one page at a time)
Every page asserted `Shopify.theme.id` = 187953643616. Result: 22 pass, 1 strict-assertion mismatch (explained).
- Home, product (`the-complete-snowboard`), policy (`/policies/privacy-policy`), cart at 1440x900: 200, no console errors.
- `/collections/all` at 1440x900: grid renders (2 columns under the default `auto` layout), 16/16 card images carry `srcset` and `sizes`, first row (2 cards) eager, the other 14 lazy, no console errors.
- `/collections/all` at 375x667: 1 column, 16/16 `srcset` and `sizes`, no console errors. Loading is eager for the first 2 cards, lazy for the other 14. My assertion expected only the first card eager in a one-column layout, so it reported a failure. The code sets the eager count from the auto layout's computed column cap (`n_eager = k_cap` = 2), not from the viewport, so this matches the design; I flag it for QA/owner awareness (the second card is below the fold at 375x667, top ~525px of 667, so it is still within the viewport).
- `tailwind.css` link returns 200; contains `.xl\:grid-fill` and `.md\:grid-cols-3`.
- Pending operator checks: theme editor (see below); 1440x900 and 375x667 visual checks.

## Pending
- Owner's theme-editor check of "Desktop columns" and "Mobile columns" on the collection section (change each option and confirm it applies), and the owner's Q6a.1 value choice.
- Live order: T6a goes live only after T5b is live, and only when the owner asks.
- Never publish #187953643616 (it carries the repo's `config/settings_data.json`).

## Rollback procedure
Staging only. Re-push the pre-T6a state: `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-11-06-pre-theme-evolution-tailwind-t6a-staging --nodelete`. Live was not changed, so no live rollback is needed.
