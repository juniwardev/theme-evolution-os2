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
