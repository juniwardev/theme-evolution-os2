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

## Live push

**Deploy timestamp:** 2026-10-23 00:54 UTC (local 2026-10-22 17:54)
**Target:** theme-evolution-os2.myshopify.com, theme `138872651872` (live, "theme-evolution-os2")
**Git SHA deployed:** `0a1c9fa` (theme files identical to staging push 2, `a7e2994`; only docs changed since)
**Authority:** owner request 2026-10-23, "Push to production and let's move on to the next phase." Recorded in the QA report under "Owner decision (2026-10-23)".
**Method:** `shopify theme push -e production`

### Gates
Report ends `PASS`; `docs/qa/theme-evolution-tailwind-t1.approved` exists; no modified or staged tracked files and untracked files only under `docs/`; `npm ci`, `npm run check:css` and `npm run check:hidden` exit 0; live theme resolved from the store as #138872651872.

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
- Store-side: `theme-evolution-os2-backup-2026-10-22-pre-t1-live` (#187959181408, unpublished)
- Local pre-push: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-t1-live-push`
- Local post-push pull: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-post-t1-live-push`

### Editor-change check
Compared live's `templates/` and `sections/` in the pre-push backup against the repo. `sections/header-group.json` and `sections/footer-group.json` are identical, so there are no editor edits to the footer social URLs or header group. JSON differences: `templates/page.materials.json` and `templates/product.landing-page.json`, both only Shopify's auto-generated `/* IMPORTANT ... */` header. Liquid differences are all T1 changes: `header.liquid`, `footer.liquid`, `cart-drawer.liquid` (`[data-header-cart-icon]` selector), `hello-world.liquid` (scoped `.icon` rule). No unexpected editor changes. Push proceeded.

### settings_data.json check
`config/settings_data.json` in the post-push pull is byte-identical to the pre-push copy (`cmp` clean). It was skipped by the push.
Note: T1 added settings to `config/settings_schema.json` (heading font, accent, accent foreground). Because `settings_data.json` is not pushed, live keeps its saved values and Shopify falls back to the schema defaults for the new keys, as intended by the plan (section 8.1). The merchant can set them in the theme editor.

### Verification (live, behind the storefront password; the password was not printed or stored)
- Health: `302` (password gate, healthy).
- The cascade-layer statement `@layer properties, theme, base, legacy, components, utilities, shims;` is the first element in `<head>`.
- `tailwind.css` is linked (`.../assets/tailwind.css?v=...`) and returns `200`.
- Header wrapper has `col-span-full`; `<header class="grid h-16 grid-cols-(--content-grid) grid-rows-[minmax(0,1fr)]">` present.
- `data-header-cart-icon` present (4 occurrences).
- Oswald `oswald_n7` woff2 `<link rel="preload" as="font">` present.
- Footer wrapper has `col-span-full`; 5 social links render (facebook, instagram, tiktok, youtube, x).
- Accent custom properties `--color-accent` and `--color-accent-foreground` are emitted.

### Pending operator checks
- Theme editor checks C1.2, C1.7 and C1.8 on live.
- The announcement-bar full-bleed variant, once enabled.
- Setting the dark Ride colors in the theme editor.
- Confirming the Supercycle app embed is still enabled (settings_data.json is unchanged, but confirm in the editor).
- 1440x900 and 375x667 visual checks on live.

### Rollback
- Preferred (operator action): in Shopify admin, Online Store, Themes, publish `theme-evolution-os2-backup-2026-10-22-pre-t1-live` (#187959181408). This restores the whole theme including settings and app embeds.
- Files only:
  ```
  shopify theme push --store=theme-evolution-os2.myshopify.com --theme=138872651872 \
    --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-t1-live-push \
    --nodelete --allow-live --ignore=config/settings_data.json
  ```
