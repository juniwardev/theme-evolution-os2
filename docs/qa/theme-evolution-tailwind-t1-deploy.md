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


## Staging push 2 (after c4d49aa)

**Deploy timestamp:** 2026-10-23 00:50:58 UTC (push completed 00:51:01 UTC)
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging). Live is still `138872651872`, unchanged.
**Git SHA deployed:** a7e2994 (code from c4d49aa; a7e2994 only adds QA docs)
**Method:** `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616` (no `--allow-live`, no `--publish`, no `-e production`). Outcome: "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully."

### Why a re-push
The first T1 push (55081ab, 2026-10-23 00:05:12 UTC) shipped a header bar that was not full width, as reported by the owner. Two fix rounds followed: 9524e61 (full-bleed header background, content column unchanged) and c4d49aa (definite header row, blocker B1). QA re-run 3 ended in PASS (report committed in a7e2994) and `docs/qa/theme-evolution-tailwind-t1.approved` exists.

### Gates
Report ends with `PASS`; `.approved` present; tracked tree clean at a7e2994 (untracked files only under `docs/`); `npm ci`, `npm run check:css` and `npm run check:hidden` all exited 0. `theme list` confirmed #187953643616 is `unpublished` and live is #138872651872.

### Backups
- Store-side duplicate of live: `theme-evolution-os2-backup-2026-10-22-pre-theme-evolution-tailwind-t1-2` (#187959017568)
- Local pull of live: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-t1-staging-2-live`
- Local pull of staging before this push (T1 from 55081ab): `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-t1-staging-2`

### Verification
- Storefront response: 302 (password gate, healthy)
- Feature check on `?preview_theme_id=187953643616` (behind password): PASS
  - Page reports theme id 187953643616; `tailwind.css` linked and its asset URL returns 200.
  - Layer statement `@layer properties, theme, base, legacy, components, utilities, shims;` is the first style in `<head>`.
  - Header wrapper carries `col-span-full`; `<header>` carries `grid-rows-[minmax(0,1fr)]`.
  - Cart link has `data-header-cart-icon`.
  - Oswald heading-font preload present.
  - Footer renders 5 social links (Instagram, Facebook, YouTube, TikTok, X).

### Pending owner items before any live push
- Owner-acceptance list items 1-9 in `docs/qa/theme-evolution-tailwind-t1-report.md` ("Owner-acceptance list (updated)"): NOT yet accepted.
- Theme editor checks on staging (QA BLOCKED: C1.2 editor round-trip, C1.7 live updates, C1.8 editor display).
- Announcement-bar full-bleed check once the bar is enabled (same grid-row sizing may apply; unverified).
- Visual checks at 1440, 375 and 768-1023.
- Set the dark Ride background and foreground colors in the theme editor.

### Rollback
`shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-t1-staging-2 --nodelete`
Live was not changed. Do not publish #187953643616.
