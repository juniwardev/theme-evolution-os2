# Impl notes: theme-evolution-tailwind-t5a-spacing (Rev 1.1.2)

Base: `main` at `ed16c73`. Worked on `main` (no feature branch), nothing pushed.

## Commits
- `9ed5676` style(css): space h5, h6 and tbody th rows in rich text (T5a follow-up): D1-D2 in `src/tailwind.css` (`@layer base`) plus rebuilt `assets/tailwind.css`.
- `6a07d49` docs(rules): `CLAUDE.md` and `AGENTS.md` "Rich text" sentence (plan 5.2).
- A third commit adds the harness and evidence (`docs/qa/harness/t5as-zoo2.mjs`, `t5as-census.mjs`, `docs/qa/evidence/t5asp-{live,staging,head}`).

## Size
`assets/tailwind.css`: **59,134 bytes** minified (projection 59,134 exactly), **11,322** gzip -9 (projection 11,359 to 11,399, so under). Baseline `S_0'` 58,850 / 11,269, as expected. Both budgets pass. `npm run check:css` exit 0; `shopify theme check` 0 offenses.

## Step 0 results
- 2a policy census on live (read only): `privacy-policy` 200 with 13 `h2` and 0 of `h1,h3-h6`, table/th/td, hr, blockquote, details, summary; the other six handles 404. Matches `N_pol`.
- 3 census `N_sel` (dev theme 187953938528): the 18-page set plus `/products/the-rental-snowboard` (Supercycle picker opened by clicking its first input), 375 and 1440. **0 matches** of D1/D2 selectors anywhere, 0 `h5`/`h6`/`tbody th` outside rich text. Supercycle container: table 1 (2 at 1440), th 7 (14), td 35 (77), hr/blockquote/h5/h6/details/summary 0, no shadow root. Nothing Shopify or app owned matches, so no stop.
- 4 zoo captured for live and staging. **Note:** live now serves T5a (since about 2026-10-27 02:25 UTC), so "live" reads like staging (`G_56` 0, `H_hdr` -16.5, `X_col` 0/-8/-8). The pre-T5a (Dawn) look is only in `docs/qa/evidence/t5as-owner/`.
- 5 budget gate: see Deviations.

## Step 4 figures (head vs head-off, same page and load; both widths identical)
- `R_new` = exactly 4 rules (D1, D2a, D2b, D2c), 4 removed (C-S.11 green). Controls: head-off `G_56` 0, `X_col` 0/-8/-8.
- C-S.3 `G_56`: head 24, head-off 0. C-S.13 `G_6p`: 20 on both.
- C-S.4 `M_nest` 0/0 on both. C-S.5: `X_col` 0/0/0, `H_hdr` -0.5, `X_tbl` 0, ZR `X_tbl` 0/0; header-row and row-header `th`: `vertical-align: baseline`, padding 8 top and bottom, left 0 on first cell and right 0 on last (8 otherwise).
- C-S.6: ZT `PT_th` 0 and `thead th` computed styles equal head-off.
- C-S.7 `Delta_B`: 0 (216 elements/pseudos, byte-identical snapshots, both widths).

## Deviations
1. Step 0 item 5: I applied Step 1 in the working tree and measured, instead of a `git archive` scratch copy. The result was well inside both budgets, so no stop; the committed file is the measured file.
2. `R_new` is computed by parsing the pre-Step-1 and head files as constructed stylesheets in the page and diffing, then deleting the matching selectors from the served sheet. Diffing against the served sheet gave 33 false "new" rules (the browser serializes it differently, for example `calc(1 * -1)`). The plan's intent (rule-level diff, removal count equals `|R_new|`) holds.
3. First head capture at 375 showed a spurious `Delta_B` (a web font loading mid-run). The harness now awaits `document.fonts.ready`; the rerun is identical.
4. The sticky-header neutralisation injects `position: static` on `header` and the header section.

## Left to QA
C-S.10 (18-page same-page sweep with probe), C-S.14 side-by-side report, theme editor check, and the independent re-run of C-S.1 to C-S.9.

## Run locally
`SHOPIFY_FLAG_STORE_PASSWORD` set from `docs/dev-fixtures.md` (never printed) then `shopify theme dev --store theme-evolution-os2.myshopify.com` (private dev theme; this run used 187953938528, since stopped). Then `node docs/qa/harness/t5as-zoo2.mjs <outdir> head <theme_id> <pre-step-1 tailwind.css>` and `node docs/qa/harness/t5as-census.mjs sel <theme_id>`.

## Out-of-scope observations
`shopify theme dev` non-interactively needs the storefront password via env var or flag; plain invocation fails with "Incorrect store password".
