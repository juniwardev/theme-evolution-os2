# QA report: theme-evolution-tailwind-t5a-spacing (Rev 1.1.2)

Date: 2026-10-26/27. Tree: `main` at `255b2fc` (D1-D2 in `9ed5676`, rules text `6a07d49`, harness `bacb989`). Dev theme: private development theme 187953938528 via `shopify theme dev` (stopped afterwards). Browser: Playwright (Chromium) harness scripts for the bulk sweeps (the plan's own harness approach); Chrome DevTools MCP not used.

## Summary verdict

**PASS WITH NITS**

All criteria C-S.1 to C-S.14 hold (C-S.12 not applicable: Q1 = (a)). One gap: the theme editor could not be opened (Shopify admin login wall), so that check is not done; no schema, setting, block or template changed, so there was no setting to cycle. Nits are listed below.

## Criteria

| ID | Result | Evidence |
|---|---|---|
| C-S.1 | PASS | `npm ci && npm run check:css` exit 0 (re-run before testing, tree clean for tracked files); `shopify theme check`: 167 files, no offenses |
| C-S.2 | PASS | `assets/tailwind.css` **59,134 B** minified (budget 60,000; 866 spare), **11,322 B** gzip -9 (budget 12,000; 678 spare). Matches projection 59,134 exactly |
| C-S.3 | PASS | `G_56`: head 24, head-off 0, at 375 and 1440 |
| C-S.4 | PASS | `M_nest` 0px / 0px on head and head-off, both widths (nested `h5` first child, `h6` last child still trimmed; D1 is in `@layer base`, `:where`) |
| C-S.5 | PASS | Zoo A table: `X_col` 0/0/0, `H_hdr` -0.5 (within ±1), `X_tbl` 0; ZR `X_tbl` 0/0. Computed: every header-row and row-header `th` `vertical-align: baseline`, padding-top/bottom 8.00001px, left 0 on first cell and 8 otherwise, right 0 on last cell and 8 otherwise (D2c verified: third header cell `padding-right` 0). Head-off reads `X_col` 0/-8/-8, `H_hdr` -16.5 (control valid) |
| C-S.6 | PASS | `ZT` `PT_th` 0 and `thead th` computed styles identical between head and head-off (both widths) |
| C-S.7 | PASS | Sample B computed-style snapshot (elements, `::marker`, `::before`, `::after`) byte-identical head vs head-off at 375 and 1440 (`bsnap-*.json`): `Δ_B` = 0 |
| C-S.8 | PASS | Census over the 18-page set + `/products/the-rental-snowboard` (Supercycle picker opened), 375 and 1440: 0 matches of D1/D2 selectors anywhere, 0 `h5`/`h6`/`tbody th`/`tfoot th` outside rich text, so 0 Shopify- or app-owned matches. Supercycle container: table 1 (2 at 1440), th 7 (14), td 35 (77), hr/blockquote/h5/h6/details/summary 0, no shadow root. Opt-out page included. Live-side policy count was done by the Coder (impl notes 2a); not re-run by QA |
| C-S.9 | PASS | In both `CLAUDE.md` and `AGENTS.md`: new sentence 1 occurrence, old sentence 0, T5b's two old strings 1 occurrence each |
| C-S.10 | PASS (with noise note) | See below |
| C-S.11 | PASS | Source: the four rules sit inside `@layer base` (block opens before line 200, closes at 356) directly after the `:empty` rule; no selector contains `.prose` or a Tailwind class. `R_new` (rule diff of committed file vs `9ed5676^`) = exactly 4 rules, 4 removed, both widths |
| C-S.12 | N/A | Q1 = (a), Step 2 not built |
| C-S.13 | PASS (guard) | `G_6p` 20 on head and head-off |
| C-S.14 | PASS | Side-by-side below |

### C-S.10 same-page sweep (head vs head-off, same load, R_new deleted from the CSSOM)

Pages: T5a's 18-page set (home, 3 products, landing view, collection, collections, search, empty search, cart, seeded cart, opt-out, balanced, contact, archive, blog, missing, policy) plus `/products/the-rental-snowboard` with the Supercycle picker open, at 375 and 1440 = 38 runs. Every run valid: removal count 4 = `|R_new|`, probe `h6` `margin-top` 24px in head and 0px in head-off. The seeded cart used a throwaway context and `/cart/clear.js` afterwards; no checkout was started.

Result: no page shows a differing pixel or a moved rect attributable to the change. Three kinds of residual noise appeared, and all reproduce **without** any change to the page, so they are not leaks:

1. `landing` 375: 148 px at y 1510-1511 differs between two head shots of the same page with nothing changed (head1 vs head2); head3 equals head-off exactly.
2. `archive` 375 (first run only; byte-equal on rerun) and `wax`/`rental` 1440: a 5 px difference at y 876-883 between two same-state shots.
3. A `DIV.flex` on every product page (and its single "moved rect", 177.9 to 194.2 px wide) drifts by itself 2.5 s apart with no change (an asynchronously settling widget, probably payment terms). Rect drift run on `wax` 1440 with no change confirms it.

The open Supercycle picker's base-vs-base capture: `identical` at 375, `DIFFERS` at 1440 (the same 5 px timing noise as item 2; allowed by clause (3)).

Two first-pass sweep failures (collections, search, empty search, 375 and 1440) were a harness-side transient (tailwind sheet not found at the moment of the evaluate; probably a rate-limited load). They passed on rerun (valid, 0 px, 0 rect diffs). Evidence: `docs/qa/evidence/t5asp-qa/sweep-results*.json`, `census-sel.txt`.

### C-S.14 side by side (zoo A, 1440 and 375 identical)

| Build | `G_56` | `G_6p` | `X_col` (c1, c2, c3) | `H_hdr` | Note |
|---|---|---|---|---|---|
| staging #187953643616 (T5a, before D1-D2) | 0 | 20 | 0, -8, -8 | -16.5 | as the plan's staging derivation (-16) |
| live (measured today) | 24 | 20 | 0, 0, 0 | -0.5 | **live already carries D1-D2** (identical to head) |
| head (dev theme) | 24 | 20 | 0, 0, 0 | -0.5 | plan: 24, 20, 0, 0 |
| head-off | 0 | 20 | 0, -8, -8 | -16.5 | control |

Pre-T5a (Dawn) live values (about 27 / 27 / +14 / +12) are only in `docs/qa/evidence/t5as-owner/` and were not re-measured; head differs from them by design (plan 7.2).

Screenshots (`docs/qa/evidence/t5asp-qa/`): `zoo-A-{live,staging,head,head-off}-{375,1440}.png`, `zoo-B-*` the same set. I viewed `zoo-A-head-1440.png` and `zoo-A-staging-1440.png`: head has a visible gap between the two headings and the table header row is aligned with its columns and as tall as the body rows; staging has the headings touching and the header columns 8 px left of the data.

## Issues found

None blocking.

- **Nit 1 (harness, low):** the sweep and the Coder's harness need `T5AC_STATE` or repeated password logins; Cloudflare rate-limited a few loads once in the first sweep run. A load that fails is swallowed by `.catch` in `t5as-census.mjs`, which can silently give an empty census. The census output here was spot-checked to show content (the rental page counts are non-zero), so it is valid. Not a product defect.
- **Nit 2 (D2a, accepted in plan N3):** `tfoot th` gets `vertical-align: baseline` where prose's `tfoot td` is `top`. Not tested (no `tfoot` in the fixture); accepted in the plan.
- **Nit 3 (zoo harness, info):** `H_hdr` reads -0.5 on head, not 0, because prose's first body row has a 1 px border; inside the plan's ±1.

## Gaps

- **Theme editor check not done.** The editor URL redirects to the Shopify accounts login; no admin session is available to QA. No schema, setting or template changed, so there is no setting to cycle and risk is low. Editor design-mode preview was therefore not checked.
- **Rental template and Quantity block:** the rental page was tested only as a census/sweep page (picker open; the dev theme carries `templates/product.rental.json`). If live's rental template differs from the repo's (for example the owner removed the Quantity selector), that is expected and was not treated as a defect. Add-to-cart on rental products was not exercised (not part of this change).
- Live-side policy census (Step 0 item 2a) was not re-run by QA; it relies on the Coder's recorded result (13 `h2`, 0 of every other listed element).
- Staging and live zoo values were read through the same harness on `/pages/contact`; live's own copy of the page content was replaced in-page by the fixture, so live content differences do not matter here.

## Console errors and warnings

The harness only collects page errors when asked; none were seen in the runs that printed output. The Playwright MCP visit to the Shopify accounts login page logged 3 errors and 2 warnings, which are from Shopify's login page, not the storefront.

## Network failures and slow responses

No storefront failures. A transient load failure on 4 pages in the first sweep pass (see C-S.10) did not recur on rerun; likely Cloudflare rate limiting from the burst of logins.

## Accessibility observations

No markup changed, so no new accessibility surface. Only spacing and `vertical-align` on rich-text `th`; header cells remain `th`. Not separately audited.

## Performance

CSS size +284 B minified / +53 B gzip against `S_0'` (58,850 / 11,269). No JS, no new requests.

## Housekeeping

- Dev server stopped (0 `shopify theme dev` processes). It was pointed at private theme 187953938528, never live or staging; nothing pushed or published. Staging and live were only read.
- Storefront password occurrences in files I wrote (`t5as-sweep.mjs`, `t5as-noise.mjs`, `t5as-dbg.mjs`, `docs/qa/evidence/t5asp-qa/`, this report): **0**.
- New files: `docs/qa/harness/t5as-sweep.mjs` (C-S.10 sweep), `t5as-noise.mjs` (noise and rect attribution), `t5as-dbg.mjs`, `docs/qa/evidence/t5asp-qa/` (24 MB; screenshots, measures, sweep JSON, census). Nothing committed.

## Orchestrator correction (2026-10-27)

The C-S.14 "live (measured today)" row, and the statement that live already carries D1-D2, are wrong. Live does not have the fix.

- **Checked directly:** in a fresh context with no preview cookie, the page reported theme 138872651872 with role `main`. Its served `tailwind.css` contains 0 occurrences of `:where(tbody, tfoot)` and `:where(h5, h6)`. The current build has 3 and 1.
- **Likely cause:** the "live" capture ran in a browser context that had already opened a `?preview_theme_id=` URL, so Shopify kept serving the preview (development) theme.
- **What still stands:** the head and head-off figures and every other criterion. C-S.14's staging and head columns remain the owner-facing comparison.
- **Not committed:** the eight `bsnap-*.json` snapshots in `docs/qa/evidence/t5asp-qa/` (about 2.7 MB each) stay local.

**Verdict: PASS WITH NITS**
