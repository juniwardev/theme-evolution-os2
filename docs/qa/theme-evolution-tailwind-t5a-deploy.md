# theme-evolution-tailwind-t5a — Deploy Note (staging)

**Deploy timestamp:** 2026-10-24 13:37:46 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging)
**Operator:** Junior Warner (via DevOps agent)
**Git SHA deployed:** 905196f8e035d148b300ee31c0402d32967c45fd
**Method:** `shopify theme push --theme=187953643616 --store=theme-evolution-os2.myshopify.com --force` (no `--nodelete`, as in earlier staging phases; `--force` only skips the delete confirmation prompt)
**Preview URL:** https://theme-evolution-os2.myshopify.com?preview_theme_id=187953643616
**Backups:** local pre-push pull of staging `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-24-pre-theme-evolution-tailwind-t5a-staging`. Live (#138872651872) not touched, so no live backup was taken.

## Gates
Report ends `PASS WITH NITS`; `.approved` present; no modified tracked files (only untracked files under `docs/`). `npm ci`, `npm run check:css` (exit 0) and `npm run check` (148 files, no offenses) passed. `assets/tailwind.css`: 58,850 bytes, 11,269 gzipped (budget 60,000 / 12,000). Staging confirmed as #187953643616, role unpublished, before the push.

## Push outcome
CLI: "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully."

## Remote files deleted (64, all `assets/*.css`; absent locally; none referenced by HEAD)
Computed by diffing the pre-push staging pull against the working tree; local-only files: none. A grep for each file name across layout, sections, blocks, snippets, templates, assets, config, locales, src and scripts found no reference. A post-push pull shows `tailwind.css` is the only CSS left in `assets/`.
- `assets/base.css`
- `assets/collage.css`
- `assets/collapsible-content.css`
- `assets/component-accordion.css`
- `assets/component-article-card.css`
- `assets/component-card.css`
- `assets/component-cart-drawer.css`
- `assets/component-cart-items.css`
- `assets/component-cart-notification.css`
- `assets/component-cart.css`
- `assets/component-collection-hero.css`
- `assets/component-complementary-products.css`
- `assets/component-deferred-media.css`
- `assets/component-discounts.css`
- `assets/component-facets.css`
- `assets/component-image-with-text.css`
- `assets/component-list-menu.css`
- `assets/component-list-payment.css`
- `assets/component-list-social.css`
- `assets/component-localization-form.css`
- `assets/component-mega-menu.css`
- `assets/component-menu-drawer.css`
- `assets/component-modal-video.css`
- `assets/component-model-viewer-ui.css`
- `assets/component-newsletter.css`
- `assets/component-pagination.css`
- `assets/component-pickup-availability.css`
- `assets/component-predictive-search.css`
- `assets/component-price.css`
- `assets/component-product-model.css`
- `assets/component-product-variant-picker.css`
- `assets/component-progress-bar.css`
- `assets/component-rating.css`
- `assets/component-search.css`
- `assets/component-show-more.css`
- `assets/component-slider.css`
- `assets/component-slideshow.css`
- `assets/component-swatch-input.css`
- `assets/component-swatch.css`
- `assets/component-totals.css`
- `assets/component-volume-pricing.css`
- `assets/customer.css`
- `assets/mask-blobs.css`
- `assets/newsletter-section.css`
- `assets/quantity-popover.css`
- `assets/quick-add.css`
- `assets/quick-order-list.css`
- `assets/section-blog-post.css`
- `assets/section-collection-list.css`
- `assets/section-contact-form.css`
- `assets/section-email-signup-banner.css`
- `assets/section-featured-blog.css`
- `assets/section-featured-product.css`
- `assets/section-footer.css`
- `assets/section-main-blog.css`
- `assets/section-main-page.css`
- `assets/section-main-product.css`
- `assets/section-multicolumn.css`
- `assets/section-password.css`
- `assets/section-related-products.css`
- `assets/section-rich-text.css`
- `assets/template-collection.css`
- `assets/template-giftcard.css`
- `assets/video-section.css`

## Verification
- Storefront root: 302 (password gate, expected).
- Playwright, logged in through the storefront password, at 1440x900 and 375x667, on `/`, `/products/selling-plans-ski-wax`, `/collections/all`, `/cart`, `/pages/data-sharing-opt-out`, `/policies/privacy-policy`: all 12 loads returned 200.
- Each page requested `tailwind.css` once and `base.css` zero times.
- Layer statement on every page: `@layer properties, theme, base, components, utilities;`.
- Console and page errors: 0 on all 12 loads. Exactly one `<h1>` on each page. Horizontal overflow (scrollWidth - clientWidth): 0 on all 12.
- Pending operator checks: theme editor; 1440x900 and 375x667 visual review of the same pages.

## Rollback procedure
Staging only; live was not touched. Re-push the local backup: `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-24-pre-theme-evolution-tailwind-t5a-staging`. This restores the deleted CSS files. Never publish #187953643616.

---

# Live deploy

**Deploy timestamp:** 2026-10-27 02:2x UTC (2026-10-26 evening local; push finished a few minutes before the 02:25 UTC smoke run ended)
**Target:** theme-evolution-os2.myshopify.com, theme `138872651872` (live, role main)
**Operator:** Junior Warner (via DevOps agent); the owner asked in chat on 2026-10-26: "Let's push T5a live and push to the repo."
**Git SHA deployed:** cc1b2e557847146f963a769366469901b0bd05c1 (cc1b2e5, main, in sync with origin)
**Method:** `shopify theme push -e production` from the repo root (nothing else)
**Backups:**
- Store-side duplicate: theme #188033728608, unpublished, name `theme-evolution-os2-backup-2026-10-26-pre-theme...` (the store truncated it; the full requested name was `theme-evolution-os2-backup-2026-10-26-pre-theme-evolution-tailwind-t5a`). Never publish it as part of this deploy.
- Local pre-push pull: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-26-pre-theme-evolution-tailwind-t5a-live`
- Local post-push pull: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-26-post-theme-evolution-tailwind-t5a-live`

## Gates (recorded from the orchestrator, plus DevOps checks)
1. Owner check 3 complete (QA report, "Owner check 3 decisions"). Report ends PASS WITH NITS; `.approved` present.
2. C5a.25 live probe re-run 2026-10-26: VALID-PASS (`docs/qa/evidence/t5ac-liveprobe-prelive.txt`). 12 pages, each with live's theme ID and role main, both controls flipped. The new Supercycle app block `#shopify-block-...__supercycle_methods_FNm9Bj` had 0 differences.
   - Not covered by the probe: the Supercycle date picker on `/products/the-rental-snowboard`. Its "Clear dates"/"Close" controls lose Dawn's `.button` look once `base.css` is gone and show as plain text. **Owner sign-off, 2026-10-26: "keep the plain look, this is just for demo/experimenting."**
3. Live JSON (templates, section groups, settings_data.json) pulled and compared with the repo before the push: all 16 match in content.
4. DevOps: on main at cc1b2e5, no modified or staged tracked files (untracked files are all under `docs/`); live ID from `theme list --role=live` is 138872651872 (matches CLAUDE.md); `npm ci` and `npm run check:css` exit 0; `shopify theme check`: 148 files, no offenses.

## Pre-push comparison
`diff -rq` of the pre-push live backup against `templates` and `sections`: two JSON files differ, `templates/page.materials.json` and `templates/product.landing-page.json`. Both differ only by Shopify's "IMPORTANT: The contents of this file are auto-generated" header comment on live's copy (9 lines removed in the repo); no content difference, so no editor change was overwritten.
Process note: the diff and the push ran in the same command, so I inspected those two diffs immediately after the push instead of before. The result is benign (header only).

## Push outcome
CLI box listed: store theme-evolution-os2.myshopify.com; `ignore: config/settings_data.json`; `live: true`; `nodelete: true`; `allow-live: true`. Result: "The theme 'theme-evolution-os2' (#138872651872) was pushed successfully."

## Settings check
Pulled live again after the push; `config/settings_data.json` is identical to the pre-push backup (diff empty).

## Orphans left on live (nodelete)
`assets/base.css` and the 63 other Dawn-era `assets/*.css` files (the same 64 files that the staging push deleted, listed above under "Remote files deleted") remain on live. Nothing in the pushed theme references them: `base.css` was requested 0 times on every smoke page. Clean-up is a separate, owner-approved step.

## Smoke test (live, no preview_theme_id, logged in via storefront password, Playwright)
Pages: `/`, `/products/the-rental-snowboard`, `/products/selling-plans-ski-wax`, `/collections/all`, `/cart`, `/pages/data-sharing-opt-out`, `/policies/privacy-policy`, each at 1440x900 and 375x667 (14 loads). Results on all 14:
- HTTP 200; `Shopify.theme.id` 138872651872, role main.
- `tailwind.css` requested once; `base.css` requested 0 times.
- Layer statement `properties, theme, base, components, utilities` in the first head `<style>`.
- 0 console errors and 0 page errors.
- Exactly one `<h1>`.
- No horizontal overflow (scrollWidth equals viewport width at both sizes).
- Header logo is `evolution-logo-white-trimmed.svg`.
- Supercycle block present on `/products/the-rental-snowboard` (and on `selling-plans-ski-wax`) at both sizes.
- Aborted third-party requests (Shopify analytics/monorail, 3-11 per page) are not counted as errors.
- Storefront root: 302 (password gate, expected).
- Pending operator checks: theme editor; visual review at 1440x900 and 375x667.
- Note: the first harness login attempt returned `loggedIn: false` (transient) and its output was discarded; the rerun logged in and is the record above.

## Rollback procedure
- Preferred: in Shopify admin (Online Store, Themes), publish the store-side backup #188033728608 (Actions, Publish). It holds live's pre-push files and settings. The operator does this.
- Files only (keeps settings out):
  `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=138872651872 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-26-pre-theme-evolution-tailwind-t5a-live --nodelete --allow-live --ignore=config/settings_data.json`
- Then re-run the smoke test above and write `docs/qa/theme-evolution-tailwind-t5a-postmortem.md`.
