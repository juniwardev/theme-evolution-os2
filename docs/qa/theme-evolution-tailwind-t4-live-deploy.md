# theme-evolution-tailwind-t4 (T3, T4a, T4b, T4c, T4c page-center) — Live Deploy Note

**Deploy timestamp:** 2026-10-23 15:32:25 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `138872651872` (live: theme-evolution-os2)
**Operator:** owner-authorized ("push to live", 2026-10-23); executed by DevOps agent
**Git SHA deployed:** 0783033286b848b2ab66c942c6d9ca48fa4b5f00
**Method:** `shopify theme push -e production` (repo root)
**Backups:** store-side `theme-evolution-os2-backup-2026-10-23-pre-theme-evolution-tailwind-t4` (#187971436640, unpublished); local `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t4-live-push`. Post-push pull: `.../2026-10-23-post-theme-evolution-tailwind-t4-live-push`.

## Gates
- `.approved` present and QA PASS / PASS WITH NITS for t3, t4a, t4b, t4c, t4c-page-center.
- No modified tracked files; untracked files only under `docs/`.
- `npm ci && npm run check:css` exit 0. `assets/tailwind.css`: 58,366 bytes, 11,104 gzip -9 (budget 60,000 / 12,000).
- Pre-live probes (run by the owner's session against live, role main on every page): T4b C4b.29 VALID-PASS (no embed on 5 pages, D6 input rule matched once, control 1px to 0); T4c C4c.22 VALID-PASS (no embed on 7 pages, all four D6 list/link rules matched once, controls flipped). Step 14 (T4b) and Step 12 (T4c) cleared for live.

## Push outcome
Applied-environment box listed: store theme-evolution-os2.myshopify.com, `ignore: config/settings_data.json`, `live: true`, `nodelete: true`, `allow-live: true`. Result: "The theme 'theme-evolution-os2' (#138872651872) was pushed successfully."

## Pre-push comparison
- Live `templates/*.json` and `sections/*-group.json` vs repo: identical except `page.materials.json` and `product.landing-page.json`, which differ only by Shopify's auto-generated header comment. No editor changes.
- Live `config/settings_data.json` vs repo: identical (and skipped by the push anyway).
- Post-push pull: `config/settings_data.json` identical to the pre-push pull. Post-push theme files equal the repo (only the same two header-only differences).

## Verification
- Storefront response: 302 (password gate).
- `tailwind.css` linked (`/cdn/shop/t/5/assets/tailwind.css?v=...`), returns 200. The post-push pull of the asset is byte-identical to the repo file (58,366). The CDN-served body measured 58,311 bytes (55 fewer; CDN-side normalisation, not a content difference).
- `theme list`: #138872651872 still `[live]`.
- Playwright, fresh non-preview login, `Shopify.theme.id === 138872651872` on every page, at 1440x900 and 375x667: `/`, `/collections/all`, `/search?q=snowboard`, `/pages/data-sharing-opt-out`, `/pages/the-material-archive`, `/products/the-complete-snowboard`, `/policies/privacy-policy`, `/cart`. All HTTP 200, exactly one h1 each, horizontal overflow X = 0 on all 16 loads (including 375). Data-sharing page h1 centred at x=720 at 1440.
- Console: no theme errors. The only console error was a Shopify `MonorailRequestError` (analytics beacon network failure) on the product page at both widths, not theme code.
- At 375 on `/pages/data-sharing-opt-out` the page-level overflow is 0; the offscreen elements `div.pc--show-email-field` / label are from the privacy-compliance app block and do not widen the page.
- Add to cart from `selling-plans-ski-wax`: cart drawer opened (`data-state=open`), cart count 1, then cleared (0).
- Not re-measured: privacy policy at 320 (pre-existing 5 px).

## Orphans left by `--nodelete` (on live, not in repo; not deleted)
- `assets/critical.css`
- `assets/eco-tooltip.css`
- `assets/section-image-banner.css`
- `assets/loading-spinner.svg`
- `snippets/progress-bar.liquid`
- `snippets/loading-spinner.liquid`
- `snippets/quantity-input.liquid`

## Rollback procedure
- Preferred: Shopify admin, Online Store, Themes, `theme-evolution-os2-backup-2026-10-23-pre-theme-evolution-tailwind-t4` (#187971436640), Actions, Publish. Restores the whole theme with its settings.
- Files only (settings kept out):
  ```
  shopify theme push --store=theme-evolution-os2.myshopify.com --theme=138872651872 \
    --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t4-live-push \
    --nodelete --allow-live --ignore=config/settings_data.json
  ```
- Never publish staging #187953643616.

## Outstanding owner items
- Supercycle decision deferred.
- Theme editor round-trip on live (open each converted section, change select/checkbox/range/color settings) pending.
- Visual review of live at 1440x900 and 375x667 pending.
