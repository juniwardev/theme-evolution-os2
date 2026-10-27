# theme-evolution-tailwind-t5a-spacing — Deploy Note

**Deploy timestamp:** 2026-10-27 04:50:04 UTC
**Target:** theme-evolution-os2.myshopify.com, theme `187953643616` (unpublished: theme-evolution-tailwind-staging)
**Git SHA deployed:** a9f0d37 (main)
**Method:** `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616` (no `--allow-live`, not published)
**Backup:** local pull of staging before push: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-27-pre-theme-evolution-tailwind-t5a-spacing-staging`

## Pre-push checks
- Tracked tree clean; `npm ci` ok; `npm run check:css` exit 0; `shopify theme check`: 187 files, no offenses.
- `theme list`: #187953643616 role unpublished, already named theme-evolution-tailwind-staging; live is #138872651872.

## Push outcome
Push reported success. Remote deletions: none (every file in the pre-push backup exists in the repo). Staging received the repo's config/settings_data.json and templates, including the new templates/product.rental.json.

## Smoke test (preview_theme_id=187953643616, 1440x900 and 375x667)
Pages: /, /pages/contact, /policies/privacy-policy, /products/the-rental-snowboard, /products/selling-plans-ski-wax, /collections/all. All 12 page loads:
- HTTP 200, Shopify.theme.id 187953643616.
- tailwind.css requested once, base.css 0 times.
- 0 console and page errors (0 analytics/monorail noise).
- One h1; no horizontal overflow (scrollWidth - clientWidth = 0).
- Served tailwind.css (HTTP 200) contains `:where(tbody,tfoot)` 3 times and `:where(h5,h6)` once (minified, no space after the comma).
- Rental snowboard: no dynamic checkout button, no visible quantity input at both viewports. Control: selling-plans-ski-wax shows both, as expected.

Pending operator checks: theme editor; visual checks.

## Rollback procedure
Staging only; live was not touched. To restore staging: `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=187953643616 --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-27-pre-theme-evolution-tailwind-t5a-spacing-staging`. Never publish #187953643616.

---

# Live deploy

**Deploy timestamp:** 2026-10-27 04:56:48 UTC (push finished 04:56:51 UTC)
**Target:** theme-evolution-os2.myshopify.com, theme `138872651872` (live, role `main`)
**Git SHA deployed:** 6a4f1c1 (main, no tracked changes)
**Method:** `shopify theme push -e production` from the repo root. The CLI box listed `ignore: config/settings_data.json`, `live: true`, `nodelete: true`, `allow-live: true`.
**Authority:** owner chat request 2026-10-27 ("push live, then save the stopping point"); `.approved` present; QA report PASS WITH NITS.
**Backups:**
- Store-side: `theme-evolution-os2-backup-2026-10-27-pre-theme-evolution-tailwind-t5a-spacing` (#188035727456, unpublished). Never publish it unless rolling back (see below).
- Local pre-push pull: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-27-pre-theme-evolution-tailwind-t5a-spacing-live`
- Local post-push pull: `~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-27-post-theme-evolution-tailwind-t5a-spacing-live`

## Gates
1. `npm ci`, `npm run check:css` (exit 0) and `shopify theme check` (187 files, no offenses) all passed.
2. Orchestrator's C-S.8 census on live (read-only), both clean:
   - `t5as-census.mjs policy live`: privacy-policy 200, h2 13, 0 of h5/h6/table/th/td/hr/blockquote/details/summary; other six policy handles 404.
   - `t5as-census.mjs sel live`: matched=[] and outside=[] on every page at 375 and 1440, including the Supercycle picker on `/products/the-rental-snowboard` (its tables sit outside `[data-rich-text]`).
3. T5a's C5a.25 probe: not applicable (it requires base.css on live, which T5a removed from the layouts).
4. Live JSON pulled by the orchestrator matched the repo (17 files). Re-checked by DevOps just before the push with `diff -rq` on `templates/` and `sections/`: only `templates/page.materials.json` and `templates/product.landing-page.json` differed, and the only difference in each is Shopify's auto-generated `/* IMPORTANT ... */` header (9 lines, no content difference). `config/settings_data.json` identical to the repo.

## Push outcome
"The theme 'theme-evolution-os2' (#138872651872) was pushed successfully." No errors.

## Settings check
Post-push pull of live: `config/settings_data.json` is identical to the pre-push backup (`diff` clean).

## Smoke test (live)
Fresh browser context, logged in via `t0-lib.mjs` `loginState` (no preview_theme_id URL ever opened). Pages: `/`, `/pages/contact`, `/policies/privacy-policy`, `/products/the-rental-snowboard`, `/products/the-one-of-one-rental-snowboard`, `/products/selling-plans-ski-wax`, `/collections/all`, each at 1440x900 and 375x667 (14 loads).
- All 14: HTTP 200; `Shopify.theme.id === 138872651872`, `role === 'main'`; exactly one h1; no horizontal overflow (scrollWidth minus clientWidth = 0); `tailwind.css` requested once; `base.css` requested 0 times; 0 console errors and 0 page errors (no analytics noise surfaced either).
- Served `tailwind.css`: HTTP 200, 59,081 bytes; `:where(tbody,tfoot)` appears 3 times and `:where(h5,h6)` once.
- Both rental snowboards: 0 dynamic checkout buttons, 0 visible quantity inputs, Supercycle block rendering (`supercycle-methods` / `supercycle-method--calendar`, 170 px tall). `selling-plans-ski-wax` (not a rental) keeps its payment buttons and quantity input, as expected.
- Header logo on every page: `evolution-logo-white-trimmed.svg`.
- Observation: `assets/base.css` (80,537 bytes) is still present in live's asset list. It is an orphan: nothing requests it. `--nodelete` is why it was not removed. Not a blocker; remove it in admin or a later cleanup if wanted.
- Pending operator checks: theme editor; 1440x900 and 375x667 visual checks.

## Rollback procedure
Roll back first, investigate second.
- **Preferred:** in Shopify admin, Online Store, Themes, `theme-evolution-os2-backup-2026-10-27-pre-theme-evolution-tailwind-t5a-spacing` (#188035727456), Actions, Publish. This restores the whole theme including settings and app embeds. The operator does this.
- **Files only:**
  ```
  shopify theme push --store=theme-evolution-os2.myshopify.com --theme=138872651872 \
    --path=~/Projects/Shopify/theme-backups/theme-evolution-os2/2026-10-27-pre-theme-evolution-tailwind-t5a-spacing-live \
    --nodelete --allow-live --ignore=config/settings_data.json
  ```
  (expand `~` to the absolute home path). Then re-run the smoke test and write `docs/qa/theme-evolution-tailwind-t5a-spacing-postmortem.md`.
