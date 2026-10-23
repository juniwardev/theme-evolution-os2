# theme-evolution-tailwind-t2 — Deploy Note

**Deploy timestamp:** 2026-10-23 04:20:36 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging). Staging only; not live, not published.
**Operator:** Junior Warner (DevOps agent)
**Git SHA deployed:** 7663536b9a823363234b44d56df40d6f23b961b9
**Method:** `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616` (no `--allow-live`, no `--publish`)
**Backups:** store-side `theme-evolution-os2-backup-2026-10-22-pre-theme-evolution-tailwind-t2` (#187961606240; the CLI truncates the name in listings); local `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-theme-evolution-tailwind-t2-live` (assets, blocks, config, layout, locales, sections, snippets, templates). Both are copies of live #138872651872, taken read-only before the push.

## Push outcome
Gates passed: `.approved` present (owner's standing instruction), QA report ends `PASS WITH NITS`, no tracked modifications, no untracked files outside `docs/`, `npm ci && npm run check:css` exit 0. Live ID resolved from the store as 138872651872, matching CLAUDE.md. #187953643616 confirmed `unpublished`.

Push finished with "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully." Applied environment: default (path only). The push had no `--nodelete`, and the "Cleaning your remote theme" step ran.

QA tested 7c59f39. HEAD 7663536 adds one owner-approved cleanup commit that deletes four unreferenced files (`snippets/loading-spinner.liquid`, `snippets/progress-bar.liquid`, `snippets/quantity-input.liquid`, `assets/loading-spinner.svg`) and edits docs. The compiled `assets/tailwind.css` is byte-identical to the one QA tested, and theme check dropped to the one known `TranslationKeyExists` offense in `cart-drawer.liquid`. This commit was not separately QA-tested.

Deletions confirmed: a `shopify theme pull` of #187953643616 after the push contains none of the four files, and its `assets/tailwind.css` is byte-identical (`cmp`) to the repo's.

## Files pushed
Whole working tree (minus `.shopifyignore` entries), as the T2 conversion at HEAD: Tailwind conversion of the product page and product card, related products, cart drawer fixes, and the committed `assets/tailwind.css`. See `docs/plans/theme-evolution-tailwind-t2-impl-notes.md`. Note that this push also sends the repo's `config/settings_data.json` to staging. Never publish this theme.

## Verification
- Storefront response: `https://theme-evolution-os2.myshopify.com` returned 302 (password gate, expected).
- Feature check (password-gated, `?preview_theme_id=187953643616`), both `/products/the-3p-fulfilled-snowboard` and `/products/selling-plans-ski-wax` returned 200 after the password POST:
  - `btn-primary` present (1 occurrence each); `font-heading` present (3 each).
  - Stylesheet links are only `tailwind.css`, `base.css`, Shopify's accelerated-checkout.css and compiled_assets/styles.css. No `section-main-product.css`, `component-card.css` or `eco-tooltip.css` links.
  - `tailwind.css` asset URL returned 200.
  - Not checked by curl: the Oswald font rendering itself (class presence only).
  - Cookie jar and page files deleted. The password was not printed or written.
- Pending operator checks:
  - Theme editor, including editor persistence and live update of every converted setting; `accent_color` and `type_heading_font` in the editor.
  - 1440x900 and 375x667 visual checks.
  - Paths with no fixture: sale/sold-out badges on real data, rating stars, unit price, quantity price breaks, no-media card, second-media hover, card focus ring, hover effects at 1024, `adapt` image ratio.
  - 750-767 and 990-1023 px bands not screenshotted; numeric vendor/badge/unit-price sizes.
  - Real-world Add to cart on a published theme (not possible on this unpublished theme without publishing, which must not be done).
  - Tooltip colors, compared by equality only.
  - Confirm the Supercycle app embed is still enabled in the live theme editor (settings_data.json was unchanged, but confirm).

## Rollback procedure
Staging only, so live is unaffected. To restore live to its pre-T2 state if ever needed: publish the store-side backup #187961606240 from Shopify admin (Online Store, Themes, Actions, Publish). Files only:
`shopify theme push --store=theme-evolution-os2.myshopify.com --theme=138872651872 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-theme-evolution-tailwind-t2-live --nodelete --allow-live --ignore=config/settings_data.json`
To revert staging, re-push the previous commit's tree. Never publish #187953643616.

## Live deploy

**Deploy timestamp:** 2026-10-23 04:34:11 UTC (push completed 04:34:16 UTC)
**Target:** theme-evolution-os2.myshopify.com, theme `138872651872` (live, "theme-evolution-os2")
**Authority:** owner request in the current session: "Push the code to the live theme."
**Git SHA deployed:** 07e5e9e (theme files identical to the staging push of 7663536; the commits since change only `docs/`, which `.shopifyignore` excludes)
**Method:** `shopify theme push -e production`

### Gates
`.approved` present; QA report ends `PASS WITH NITS`; no modified or staged tracked files, untracked files only under `docs/`; `npm ci` and `npm run check:css` exit 0; live resolved from the store as #138872651872.

### Applied environment (CLI box)
```
Using applicable flags from production environment:
  store: theme-evolution-os2.myshopify.com
  ignore: config/settings_data.json
  live: true
  nodelete: true
  allow-live: true
```
Result: "The theme 'theme-evolution-os2' (#138872651872) was pushed successfully."

### Backups
- Store-side: `theme-evolution-os2-backup-2026-10-22-pre-theme-evolution-tailwind-t2-live` (#187961671776, unpublished). The staging-time backup #187961606240 is untouched.
- Local pre-push pull: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-theme-evolution-tailwind-t2-live-push`
- Local post-push pull: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-post-theme-evolution-tailwind-t2-live-push`

### Pre-push comparison
`templates/` and `sections/` of the fresh live pull vs the repo. JSON differences: `templates/page.materials.json` and `templates/product.landing-page.json`, both only Shopify's auto-generated `/* IMPORTANT ... */` header. `sections/*-group.json` identical. Liquid differences are all T2 changes (`cart-drawer`, `custom-section`, `material-spotlight`, `material-tooltip`, `product`, `related-products`). No editor changes on live; push proceeded.

### settings_data.json check
`config/settings_data.json` in the post-push pull is byte-identical (`cmp` clean) to the pre-push backup. The post-push `assets/tailwind.css` is byte-identical to the repo's.

### Verification (live, no preview_theme_id; password not printed or stored; cookie jar and pages deleted)
- Health: 302 (password gate, healthy).
- `/products/the-3p-fulfilled-snowboard` and `/products/selling-plans-ski-wax` both 200 after the password POST; page reports theme id 138872651872.
  - `btn-primary` present (1 each); `font-heading` present (3 each).
  - Stylesheets linked: `tailwind.css`, `base.css`, `styles.css`. No `section-main-product.css`, `component-card.css` or `eco-tooltip.css` links. `eco-tooltip.js` is still loaded (kept file).
  - `tailwind.css` asset URL returns 200.

### Expected orphans on live (production uses `nodelete`)
T2 deleted files stay on live unused: `assets/eco-tooltip.css`, `assets/loading-spinner.svg`, `snippets/loading-spinner.liquid`, `snippets/progress-bar.liquid`, `snippets/quantity-input.liquid`. `assets/critical.css` (removed earlier, T1) also remains. No live page links any of them. The `quantity-input` strings in page HTML are the inline custom-element CSS/JS, not the snippet. Remove the orphans manually in the admin code editor if desired.

### Pending operator checks (live)
Same list as the staging section above, plus the Supercycle app embed check and the theme editor round-trip of converted settings on live.

### Rollback
- Preferred (operator action): in Shopify admin, publish `theme-evolution-os2-backup-2026-10-22-pre-theme-evolution-tailwind-t2-live` (#187961671776).
- Files only:
  ```
  shopify theme push --store=theme-evolution-os2.myshopify.com --theme=138872651872 \
    --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-theme-evolution-tailwind-t2-live-push \
    --nodelete --allow-live --ignore=config/settings_data.json
  ```
