# theme-evolution-tailwind-t4c — Deploy Note

**Deploy timestamp:** 2026-10-23 14:07 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging). Never publish this theme.
**Operator:** Junior Warner (DevOps agent)
**Git SHA deployed:** 639611e (theme code identical to a81620d; 639611e is a docs-only umbrella note)
**Method:** `shopify theme push --theme=187953643616 --store=theme-evolution-os2.myshopify.com`
**Backups:** local staging pull `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t4c-staging` (assets, blocks, config, layout, locales, sections, snippets, templates). No store-side live duplicate and no local live pull were made this run (the automation permission layer denied the combined command; the operator's instruction covered the staging backup only). Live was not touched. Live theme confirmed as #138872651872.

## Push outcome
Gates: `npm ci` and `npm run check:css` exit 0. `assets/tailwind.css` is 58,308 bytes, 11,082 gzipped (`gzip -9`), within the 60,000 / 12,000 budget. CLI reported "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully."

## Files pushed
Whole working tree minus `.shopifyignore` entries (T4c: rich-text `prose` handling, D6 list/link parity rules removed, opt-out widget scroll box, archive card grid change). See `docs/plans/theme-evolution-tailwind-t4c-impl-notes.md` if present.

## Verification
- Storefront: `/` 200 at 1440x900 and 375x667; `tailwind.css` link returns 200.
- Console errors: one per viewport, a Shopify `MonorailRequestError` (network telemetry), not theme code.
- `/pages/data-sharing-opt-out` overflow (scrollWidth - clientWidth) at 320/375/390/430: before push 111/56/41/1; after push 0/0/0/0. Rich-text wrapper has `prose` (1 element).
- `/pages/the-material-archive` and `/products/the-complete-snowboard`: 200, description inside a `prose` element, at both viewports.
- `/policies/privacy-policy`: 200; list-style `disc`, `li` display `list-item`, links `underline` (1440 and 375).
- Footer renders on all checked pages. Exactly one h1 on each checked page.
- Overflow at 375 (and 1440) on `/`, `/collections/all`, `/search?q=snowboard`, `/cart`: 0.
- Add to cart from `selling-plans-ski-wax` opened the drawer at both viewports; cart emptied afterwards (item_count 0).
- Session cookie cache and scratch scripts were kept in the session scratchpad; cookie cache deleted. Password never printed or written.

## QA nits (from the report)
- Opt-out checkbox label clipped on phones inside the scroll box; no touch scroll hint (Q4c.6 option A cost).
- Widget controls `outline: none` is Shopify's.
- Centered archive list markers.
- Compound alpha.
- Opt-out page is taller.

## Unverified
- Rendered `default_errors`.
- PXW inconclusive.
- Related products at 375 on two fixtures.
- Theme editor checks.

## Owner checks pending
- Q4c.2 PDP description typography.
- Q4c.6 / E4c.1 / E4c.8 opt-out widget.
- E4c.3 archive card grid shift.
- Q4c.7 rich-text headings in body font.
- Theme editor round-trip on footer, image-banner and related-products rich text.
- 1440x900 and 375x667 visual checks.

## Live gate
Live is NOT authorized. Immediately before any live push, re-run T4b's C4b.29 and T4c's C4c.22 read-only probes, and use `shopify theme push -e production` only.

## Rollback procedure
Staging only. Restore the previous staging state with:
`shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-23-pre-theme-evolution-tailwind-t4c-staging --nodelete`
Do not publish #187953643616. Live was not modified.
