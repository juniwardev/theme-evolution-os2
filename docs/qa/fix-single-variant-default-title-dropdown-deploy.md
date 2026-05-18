# fix-single-variant-default-title-dropdown — Deploy Note

**Deploy timestamp:** 2026-05-18 10:09:00 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `138872651872` (live — currently published theme on this dev store)
**Operator:** Junior Warner
**Method:** `shopify theme push --theme=138872651872 --nodelete --allow-live`
**Snapshot:** `/tmp/pre-deploy-snapshots/fix-single-variant-default-title-dropdown/product.liquid`

## Push outcome

```
╭─ success ────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  Environment: d                                                              │
│                                                                              │
│   The theme 'theme-evolution-os2' (#138872651872) was pushed successfully.   │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

Push completed with no errors. 100% of files uploaded and remote theme cleaned successfully.

## Files pushed

- `sections/product.liquid` — primary change: added `{%- if product.variants.size > 1 -%}` guard around the `.product__variant-picker` block so the "Default Title" dropdown is hidden for single-variant products. The hidden `<input type="hidden" name="id">` in the `buy_buttons` block remains unconditional to preserve cart submission for all variants.

All other theme files were pushed as-is (unchanged relative to the previously deployed live theme state, confirmed by QA static diff).

## Verification

- Storefront response: **302** (redirect to password gate — expected and healthy for this dev store)
- Visual check: QA agent completed full browser verification at commit 2b63c88 prior to this deploy. The fix was confirmed present in the live theme by QA static diff (`diff /tmp/live-theme-check/sections/product.liquid sections/product.liquid` → no diff). No separate visual check required post-deploy.

## Rollback procedure

**Option 1 (preferred — Shopify admin):** Shopify admin → Online Store → Themes → find the previously unpublished theme → Actions → Publish. Shopify automatically retains the prior live theme as unpublished.

**Option 2 (single-file restore from snapshot):**
```
shopify theme push --theme=138872651872 --only sections/product.liquid --path=/tmp/pre-deploy-snapshots/fix-single-variant-default-title-dropdown --nodelete --allow-live
```
