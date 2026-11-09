# theme-evolution-tailwind-t5b-policy-spacing — Deploy Note (STAGING)

**Deploy timestamp:** 2026-11-09 04:35:43 UTC (push finished 04:35:47 UTC)
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging)
**Operator:** DevOps agent for Junior Warner
**Git SHA deployed:** 6adc49367265aabcfe7b7f3e90848e4fa269865f (adds fix commit 89e3056: `layout/theme.liquid`, `assets/tailwind.css`, on top of T5b + T6a from 4bc95cd)
**Method:** `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616` (no `--allow-live`, no `--publish`)
**Backups:** local `/Users/juniorwarner/Projects/Shopify/theme-backups/theme-evolution-os2/2026-11-08-pre-theme-evolution-tailwind-t5b-policy-spacing-staging` (pulled copy of staging). No store-side duplicate: staging is a long-lived overwrite target and this deploy does not touch live.

## Gates
Report ends `PASS WITH NITS` (419f4f6); `.approved` present (0 bytes, 6adc493); no modified or staged tracked files; no untracked files outside `docs/`; `npm ci && npm run check:css` exit 0. `theme list` confirmed #187953643616 is `unpublished` and live is #138872651872 (unchanged, not touched).

## Push outcome
CLI: "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully."

## Staging template reset
Staging's `templates/collection.json` held owner edits (`columns_desktop: "3"`, `columns_mobile: "2"`, saved from the staging editor). The push replaced it with the repo's copy (`{}`), so staging is back to Automatic desktop / 1 mobile columns. The pulled copy is kept in the backup. Owner's chosen live values (desktop 4, mobile 2) are to be set in the LIVE editor after T6a goes live. The other differing templates (`index`, `page.materials`, `product.landing-page`) differed only by the auto-generated header comment.

## Verification (preview_theme_id=187953643616; every load asserted `Shopify.theme.id` = 187953643616)
Smoke: 12 page loads (6 pages x 2 viewports), 12/12 HTTP 200, 12/12 theme id correct, 0 console errors, 0 horizontal overflow, 1 h1 on each; CSS link check 1/1 pass. Total 25/25 pass.

| Check | 1440x900 | 375x667 |
|---|---|---|
| Policy `/policies/privacy-policy` header-to-h1 gap | 64 | 40 |
| Policy gap above footer (last text to footer) | 64 | 40 |
| Policy text left edge | 396.5625 | 52 |
| `/pages/data-sharing-opt-out` text left edge | 396.5625 (equal) | 52 (equal) |
| `/pages/data-sharing-opt-out` header-to-h1 / gap above footer | 64 / 84 | 40 / 60 |
| Horizontal overflow (policy) | 0 | 0 |
| h1 count (policy) | 1 | 1 |

Other pages (all 200, no console errors, overflow 0 at both widths): `/`, `/collections/all` (17 images with srcset, grid present, T6a), `/products/selling-plans-ski-wax`, `/cart`.
The `tailwind.css` link returned 200 and contains the selectors `px-\(--page-margin\)` and `wrap-break-word`.
Note: the page-shell page `/pages/data-sharing-opt-out` measures 84 / 60 above the footer by the same text-bottom metric; the policy page matches the 64 / 40 spec.

## Pending
- Owner's look at the policy page on staging (and theme editor, 1440x900 and 375x667 visual checks).
- Live order, only on the owner's go: T5b + this fix via plan section 7.1 first, then T6a.
- Never publish #187953643616 (it carries the repo's `config/settings_data.json`).

## Rollback procedure
Staging only; live was not touched. To restore staging's previous state, re-push the backup:
`shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=/Users/juniorwarner/Projects/Shopify/theme-backups/theme-evolution-os2/2026-11-08-pre-theme-evolution-tailwind-t5b-policy-spacing-staging --nodelete`
Live rollback is not applicable to this deploy.
