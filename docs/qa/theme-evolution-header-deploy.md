# theme-evolution-header — Deploy Note

**Deploy timestamp:** 2026-05-21 06:11:19 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `138872651872` (live — published theme on dev store)
**Operator:** Junior Warner
**Git SHA deployed:** 5a5534d
**Method:** `shopify theme push --theme=138872651872 --nodelete --allow-live`
**Snapshot:** `/tmp/pre-deploy-snapshots/theme-evolution-header`

## Push outcome

```
Uploading files to remote theme [100%] ...
Cleaning your remote theme [100%] ...
Theme upload complete ...

The theme 'theme-evolution-os2' (#138872651872) was pushed successfully.
```

## Files pushed

Key files changed by this feature (per implementation notes):

- `locales/en.default.json` — added `sections.header.mobile_menu_label` and `sections.header.close_menu_label` keys
- `locales/en.default.schema.json` — added announcement bar and header color setting labels
- `sections/header.liquid` — complete refactor: `ThemeEvolutionHeaderMenu` Web Component, announcement bar, always-rendered cart badge, mobile hamburger toggle, `--header-bg`/`--header-text` CSS custom properties, mobile nav CSS specificity fix (commit `bfc6d1b`)

Pushed with `--nodelete` to preserve any merchant-edited template JSON or settings files not touched by this feature.

## Verification

- Storefront response: **302** (redirect to password gate — expected for dev store; storefront is healthy)
- Visual check: operator should confirm dark header (`#111111` background, white text), uppercase nav links on desktop, hamburger on mobile, and cart badge behavior via the storefront preview URL

## Important operator note — color-flash for existing merchants

The new `header_background` default is `#111111` (dark) and `header_text` default is `#ffffff` (white). Merchants whose theme previously rendered with `var(--color-background)` (typically white) will see the header color change immediately. This is intentional per the design target. Merchants can restore their previous colors via Online Store → Themes → Customize → Header settings.

## Rollback procedure

If a problem is discovered, re-push the pre-deploy snapshot to restore the previous theme state:

```
shopify theme push --theme=138872651872 --path=/tmp/pre-deploy-snapshots/theme-evolution-header --nodelete
```

Then re-verify:
```
curl -s -o /dev/null -w "%{http_code}\n" https://theme-evolution-os2.myshopify.com
```

Note: the snapshot is stored at `/tmp/pre-deploy-snapshots/theme-evolution-header` on this machine only. If a rollback is needed after the machine restarts, use the Shopify admin (Online Store → Themes) to re-publish the previous theme version that Shopify retains as an unpublished backup.
