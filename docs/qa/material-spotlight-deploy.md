# Material Spotlight — Deploy Note

**Deploy timestamp:** 2026-05-17 12:16:49 PDT
**Target:** theme-evolution-os2.myshopify.com, theme `138872651872` (live)
**Operator:** Junior Warner
**Method:** Manual `shopify theme push --theme=138872651872 --nodelete`
**Snapshot:** `/tmp/pre-deploy-snapshots/material-spotlight-pre`

## Push outcome

```
The theme 'theme-evolution-os2' (#138872651872) was pushed successfully.
```

## Files pushed

- `sections/material-spotlight.liquid` (new)
- `snippets/sustainability-rating.liquid` (new)
- `locales/en.default.json` (modified — material_spotlight section keys added)
- `locales/en.default.schema.json` (modified — labels and info text added)

## Verification

- Storefront redirect chain: `302 → /password → 103 → 200` (healthy, dev store password gate working as expected)
- Theme editor: Material Spotlight visible in product template section picker
- Test product page: section renders, rating bars visible (regression fix for round-5 bug confirmed), no console errors
- Mobile layout: confirmed responsive
- Empty state on product without `custom.material_link` metafield: confirmed no markup rendered

## Rollback procedure

If issues are discovered post-deploy:

```
shopify theme push --theme=138872651872 --path=/tmp/pre-deploy-snapshots/material-spotlight-pre --nodelete
```

The snapshot at `/tmp/pre-deploy-snapshots/material-spotlight-pre` captures the live theme's state before this deploy. Push it back to revert.

## Followups captured for next feature

- DevOps agent (`~/.claude/agents/devops.md`) needs Shopify-aware rewrite — current version assumes generic web-app CI/CD which doesn't apply to Liquid themes. Manual deploy was used for this feature as a workaround.
- Ship command (`~/.claude/commands/ship.md`) needs a `--dry-run` gate before live push so the file diff can be reviewed pre-confirmation.
- `CLAUDE.md` needs a `## Deploy targets` section documenting theme IDs and verification URLs so future agents and operators don't have to hunt for them.

## Post-deploy correction (2026-05-17)

After initial deploy, discovered that adding the section to a product template via the theme editor did not persist (theme editor template changes were not being written back to source). Resolved by adding the section directly to `templates/product.json` with all schema defaults and pushing again.

Files modified in correction:
- `templates/product.json` (added `material-spotlight` section + reordered)

Verification:
- Re-ran `/qa material-spotlight` against live storefront: 41/41 PASS
- Section now visible on product pages without manual editor configuration

Note for future Shopify projects: theme editor template changes are persisted only on the unpublished theme being edited. Pushing local files via `shopify theme push` overwrites the remote template with the local version. For sections that should be present by default on a template, configure them in the local `templates/*.json` file and commit, rather than relying on theme editor configuration.