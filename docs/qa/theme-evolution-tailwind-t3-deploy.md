# theme-evolution-tailwind-t3 — Deploy Note

**Deploy timestamp:** 2026-10-23 08:22:49 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging). STAGING ONLY. Live (#138872651872) was not touched.
**Operator:** Junior Warner (deployed by DevOps agent)
**Git SHA deployed:** ab06960 (clean tracked tree)
**Method:** `shopify theme push --theme=187953643616 --store=theme-evolution-os2.myshopify.com`
**Backups:** no store-side duplicate (the staging theme is long-lived and overwritten by design); local pull of staging before the push: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t3-staging` (contains assets, blocks, config, layout, locales, sections, snippets, templates). Live was not modified, so no live backup was taken for this staging-only deploy.

## Build gate
`npm ci && npm run check:css` exit 0. `assets/tailwind.css`: 41,801 bytes (`wc -c`), 8,989 bytes (`gzip -9 -c | wc -c`); budget 60,000 / 12,000. Staging's copy is byte-identical to the repo file.

## Push outcome
CLI reported: "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully." The remote cleanup step ran (no `--nodelete`). `assets/section-image-banner.css` existed in the pre-push backup and is absent from staging after the push: deleted by this push, as T3 intended.
One aborted attempt: my first push command carried a malformed flag (`--nodelete=false`) and the CLI rejected it before uploading anything.

## Files pushed
Whole repo tree per `.shopifyignore`. T3 content: image-banner and hello-world converted to Tailwind utilities, Dawn banner CSS deleted, no-op `color_scheme` settings removed from sections (owner decision Q10). See `docs/plans/theme-evolution-tailwind-t3-impl-notes.md`. Staging also received the repo's `config/settings_data.json` (expected for this theme).

## Verification (staging preview, `?preview_theme_id=187953643616`)
- Storefront `/` (no preview param, no cookie): 302 (password gate, expected)
- `tailwind.css` link present; asset URL returns 200
- `/` renders `[data-image-banner]` (section `image-banner`) and `[data-hello-band]` (custom-section): both present; one h1
- Horizontal overflow, `scrollWidth - clientWidth` on `/` (documentElement and body): 320 = 0, 375 = 0, 390 = 0, 1440 = 0 (previously 76/21/6 on staging)
- Console errors on `/` at all four widths: 0
- `/products/the-complete-snowboard` at 1440x900 and 375x667: HTTP 200, h1 present, add-to-cart form present, overflow 0. One console error on each: `Error producing monorail event MonorailRequestError` (Shopify analytics beacon network failure; not theme code, not on `/`). Visual look not judged by DevOps.

## Pending operator checks
- C3.4: theme editor no longer shows the color-scheme warning
- Owner check 2: settings sweep in the editor (change each select/checkbox/range/color setting on the converted sections); also whether a save drops the orphaned `color_scheme` values
- Owner check 3: visual acceptance of Q3.1 to Q3.4 at 1440x900 and 375x667
- QA nits (non-blocking): F1 banner preload Link header is dropped when widths + sizes are set; F2 hello-world link focus outline
- Theme editor check generally

## Rollback procedure
Staging only; nothing user-facing changed. To restore staging's prior state, re-push the local backup:
`shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t3-staging`
Never publish #187953643616 (it carries the repo's settings_data.json). Live deploy is NOT authorized and awaits the owner; it would use `shopify theme push -e production` after the live-vs-repo editor-change check.
