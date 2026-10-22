# theme-evolution-tailwind-t0 — Deploy Note

**Deploy timestamp:** 2026-10-22 22:30:04 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging, renamed from theme-evolution-footer-staging)
**Operator:** DevOps agent (owner: Junior Warner, "ship it" for T0)
**Git SHA deployed:** 4d5e8c9
**Method:** `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616`
**Backups:** store-side `theme-evolution-os2-backup-2026-10-22-pre-theme-evolution-tailwind-t0` (#187957510240, copy of live #138872651872); local live `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-theme-evolution-tailwind-t0-live`; local staging pre-overwrite (footer-era) `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-t0-staging`

## Push outcome

Gates: report verdict PASS WITH NITS (owner accepted all 11 items), `.approved` present, tracked tree clean, `npm ci`, `npm run check:css` exit 0, `npm run check:hidden` exit 0. `theme list` confirmed #187953643616 `[unpublished]` and live still #138872651872.

Rename: `The theme 'theme-evolution-footer-staging' (#187953643616) was renamed to 'theme-evolution-tailwind-staging'`.

Push: "Theme upload complete"; "The theme 'theme-evolution-tailwind-staging' (#187953643616) was pushed successfully." The push had no `--nodelete`, so the CLI ran its remote-cleanup pass, removing remote files absent locally (expected for a full overwrite of staging). Live was not touched and nothing was published.

## Files pushed

Full theme upload per the T0 plan (`docs/plans/theme-evolution-tailwind.md` section 7): committed `assets/tailwind.css` (compiled), layouts linking `tailwind.css` with the cascade-layer statement first in `<head>`, `base.css` contained in the `legacy` layer, `critical.css` folded in and no longer referenced. Note that `config/settings_data.json` from the repo went to staging as well (staging only).

## Verification

- Storefront response: 302 (password gate, healthy)
- Feature check (via `?preview_theme_id=187953643616`, behind the password): page theme id 187953643616; links `tailwind.css` (asset URL returns 200); no reference to `critical.css`; `<head>` begins with `<style>@layer properties, theme, base, legacy, components, utilities, shims;</style>`. PASS.
- Pending operator checks: theme editor on staging (QA was blocked without admin login); 1440x900 and 375x667 visual checks; Supercycle app embed on live (owner-managed).

## Rollback procedure

Live was not changed, so no live rollback is needed. To restore staging to its footer-era state:
`shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-t0-staging --ignore=config/settings_data.json`
Live backup, if ever needed: publish store-side `theme-evolution-os2-backup-2026-10-22-pre-theme-evolution-tailwind-t0` (#187957510240) from admin (operator action). Never publish #187953643616.


## Live push

**Deploy timestamp:** 2026-10-22 22:33:08 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `138872651872` (live; development store, not customer-facing)
**Git SHA deployed:** b0fbd8f (code identical to 4d5e8c9 staged earlier; b0fbd8f adds docs only)
**Method:** `shopify theme push -e production` (from repo root)
**Backups:** store-side `theme-evolution-os2-backup-2026-10-22-pre-t0-live` (#187957543008); local `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-t0-live-push`. The earlier pre-staging duplicate `...-pre-theme-evolution-tailwind-t0` (#187957510240) is separate.

**Owner request and note:** the owner explicitly requested this live deploy ("Push to production", 2026-10-22). Staging (#187953643616) was deployed at 22:30:04 UTC; the owner has not reported doing the staging theme-editor or visual checks and chose to go live anyway.

### Push outcome

Applied-environment box:

```
Using applicable flags from production environment:
  store: theme-evolution-os2.myshopify.com
  ignore: config/settings_data.json
  live: true
  nodelete: true
  allow-live: true
```

Result: "The theme 'theme-evolution-os2' (#138872651872) was pushed successfully."

### Pre-push comparison

`diff -rq` of live's `templates/` and `sections/` against the repo showed three differing files:
- `templates/page.materials.json` and `templates/product.landing-page.json`: only Shopify's auto-generated `/* IMPORTANT ... */` header. Fine.
- `templates/gift_card.liquid`: the T0 change (layer statement, `tailwind.css` instead of `critical.css`). Expected.

No editor changes (e.g. app blocks) found. `sections/` had no differences.

### settings_data.json check

Post-push pull at `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-post-t0-live-push`. `config/settings_data.json` is byte-identical (`cmp`) to the pre-push backup's.

### Verification

- Storefront response: 302 (password gate, healthy)
- Feature check on live, behind the password: homepage links `tailwind.css` (asset returns 200); no `critical.css` reference; `<head>` begins with `<style>@layer properties, theme, base, legacy, components, utilities, shims;</style>`; header cart icon markup present.
- Pending operator checks: theme editor on live; 1440x900 and 375x667 visual checks; confirm the Supercycle app embed is still enabled (re-enable if not).

### Rollback procedure

- Preferred: publish the store-side backup `theme-evolution-os2-backup-2026-10-22-pre-t0-live` (#187957543008) in Shopify admin (Online Store, Themes, Actions, Publish). Operator action.
- Files only:
  `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=138872651872 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-t0-live-push --nodelete --allow-live --ignore=config/settings_data.json`
