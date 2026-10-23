# theme-evolution-tailwind-t1 — Deploy Note

**Deploy type:** STAGING deploy for owner review. Not a live deploy. Not published.
**Deploy timestamp:** 2026-10-23 00:05:12 UTC (2026-10-22 local)
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging)
**Operator:** DevOps agent (on the owner's instruction "After QA passes, ship T1 to staging", 2026-10-22)
**Git SHA deployed:** 55081ab
**Method:** `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616`
**Backups:**
- store-side `theme-evolution-os2-backup-2026-10-22-pre-theme-evolution-tailwind-t1` (#187958591584, duplicate of live #138872651872)
- local live pull: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-theme-evolution-tailwind-t1-live`
- local staging (T0 contents) pull: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-t1-staging`

## Gates
- Report ends `PASS WITH NITS`; `.approved` exists; no modified or staged tracked files; untracked files only under `docs/`.
- `npm ci`, `npm run check:css`, `npm run check:hidden` all exit 0.
- `theme list`: #187953643616 is `unpublished`; live is still #138872651872.

## Push outcome
CLI: "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully." Exit 0. Live was not touched; nothing was published.

## Files pushed
T1 scope per `docs/plans/theme-evolution-tailwind-t1` impl notes: `assets/tailwind.css` (compiled tokens and utilities, layer statement), header and footer sections/snippets (Tailwind utilities, 40px cart glyph with top-right badge, menu toggle switching at lg 1024px), heading-font preload (Oswald), and the repo `config/settings_data.json` (goes to staging on every push, by design).

## Verification
- Storefront response: 302 (password gate, healthy)
- Feature check on `?preview_theme_id=187953643616` (behind password): PASS
  - `tailwind.css` linked (asset returns 200); the layer statement `@layer properties, theme, base, legacy, components, utilities, shims;` is the first element in `<head>`.
  - Header cart link has `data-header-cart-icon`, `[&_svg]:size-10` and the SVG with `viewBox="0 0 40 40"`; badge positioned top-right.
  - Oswald heading-font preload present.
  - Footer renders 5 social links (Instagram, Facebook, YouTube, TikTok, X).
- Pending operator checks:
  - Theme editor on staging (QA BLOCKED: C1.2, C1.7, C1.8; use QA's operator checklist in `docs/qa/theme-evolution-tailwind-t1-report.md`)
  - Visual checks at 1440, 375 and 768-1023 (new hamburger behavior in that range)
  - Owner-acceptance list review for T1. NOT YET REVIEWED by the owner, including the new 768-1023px hamburger change. It must be completed before any live push.
  - Owner action: set background and foreground colors in the theme editor for the dark Ride look.

## Rollback procedure
Staging only, so low risk. To restore T0 contents on staging:
`shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-t1-staging --nodelete`
Live was not changed. If ever needed, the live backup is the store-side theme #187958591584 and the local live pull above. Do not publish #187953643616.
