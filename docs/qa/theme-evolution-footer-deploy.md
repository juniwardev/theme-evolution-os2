# theme-evolution-footer — Deploy Note

**Deploy timestamp:** 2026-10-22 18:20:10 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (`theme-evolution-footer-staging`, unpublished, newly created)
**Operator:** Junior Warner
**Git SHA deployed:** 17fa04e
**Method:** `shopify theme push --unpublished --theme="theme-evolution-footer-staging"`
**Snapshot:** `/tmp/pre-deploy-snapshots/theme-evolution-footer` (pull of live theme `138872651872`; live was not modified)

## Push outcome

```
Uploading files to remote theme [100%] ...
Cleaning your remote theme [100%] ...
Theme upload complete ...

The theme 'theme-evolution-footer-staging' (#187953643616) was pushed successfully.

[1] https://theme-evolution-os2.myshopify.com?preview_theme_id=187953643616
[2] https://theme-evolution-os2.myshopify.com/admin/themes/187953643616/editor
```

No errors or warnings. The "AGENTS.md exceeds 50 KB" message from QA nit N1 no longer appears (`.shopifyignore` now excludes AGENTS.md, DESIGN.md, docs/*).

## Files pushed

Whole theme (HEAD of main) to a fresh unpublished theme. Key files for this feature (per impl-notes `docs/plans/theme-evolution-footer-impl-notes.md`):

- `sections/footer.liquid` — footer refactor
- `sections/footer-group.json` — seeds the five social URLs (uploaded; rendered footer shows all five links)
- `locales/en.default.json`, `locales/en.default.schema.json` — new footer strings and setting labels

## Verification

- Health check `curl -s -o /dev/null -w "%{http_code}\n" https://theme-evolution-os2.myshopify.com`: **302** (password gate, expected)
- Password flow via curl cookie jar worked (POST /password -> 302). Homepage with `?preview_theme_id=187953643616` returned **200**.
- HTML contains `theme-evolution-footer` (20 matches). Social links present: instagram.com, facebook.com, youtube.com, tiktok.com, x.com.
- Visual check: not done. Pending owner.

## Operator notes

- Remaining owner checks on the staging theme: theme editor (QA could not reach it), plus desktop 1440x900 and mobile 375x667 visual checks.
- Going live, owner decides:
  - Publish the staging theme from Shopify admin (Online Store -> Themes -> Actions -> Publish). This swaps the whole theme, including its `config/settings_data.json`.
  - Or push to the live theme as was done for the header.
- Caveat: `sections/footer-group.json` overwrites any footer settings saved in the theme editor on the target theme.

## Rollback

Live theme `138872651872` was not touched, so no rollback is needed for it. To discard staging, delete theme `187953643616` in Shopify admin (Online Store -> Themes). If the feature is later pushed live and must be reverted:

```
shopify theme push --theme=138872651872 --path=/tmp/pre-deploy-snapshots/theme-evolution-footer --nodelete --allow-live
```

Then re-verify with the health-check curl. The snapshot lives only on this machine's /tmp. After a reboot, re-publish the previous theme from Shopify admin.

---

## Live push (2026-10-22)

**Deploy timestamp:** 2026-10-22 18:24:02 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `138872651872` (live)
**Git SHA deployed:** e86969d (theme files identical to 17fa04e, which went to staging)
**Method:** `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=138872651872 --nodelete --allow-live`

### Backups taken before the push
- Store-side duplicate of live: `theme-evolution-os2-backup-2026-10-22-pre-footer` (#187953774688, unpublished). To roll back, publish this theme from Online Store → Themes.
- Local pull of live: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-22-pre-footer-live` (outside the repo; survives reboots).

### Pre-push comparison
Live already matched the repo for every theme file except Shopify's auto-generated comment headers on four files (both `locales/en.default*.json`, `templates/page.materials.json`, `templates/product.landing-page.json`). A post-push pull is byte-identical to the pre-push backup, so the push changed no content on live.

**Why live already had the footer:** `shopify.theme.toml`'s default environment sets `theme = 138872651872`, so `shopify theme dev` (run by QA earlier on 2026-10-22) synced the working tree straight to the live theme. The footer was effectively live before the approval gate.

### Verification
- Storefront: **302** (password gate, expected)
- Live homepage behind the password gate: 200; `theme-evolution-footer` present; all five social links render.

### App configuration (owner report)
The owner reported installing and configuring the Cupercycle app on the live theme. No app blocks, app embeds (`shopify://apps/...`) or references to the app exist in the live theme files before or after this push (`config/settings_data.json` → `current.blocks` is empty), and none appear in the rendered homepage. The push therefore did not remove any app configuration from theme files. Whether the app's settings live outside the theme, or were overwritten earlier by the `shopify theme dev` sync, is unresolved.
