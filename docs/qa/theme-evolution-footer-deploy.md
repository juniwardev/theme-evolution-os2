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
