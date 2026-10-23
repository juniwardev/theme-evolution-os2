# QA report: theme-evolution-tailwind-t4c-page-center

HEAD 65f945f vs base f22c9a2 (staging #187953643616, read only). Dev theme #187953938528 was synced to HEAD with `shopify theme push --theme=187953938528 --nodelete --ignore config/settings_data.json` and still matches HEAD (no server left running). MCP used: none; Playwright via committed harness scripts (`docs/qa/harness/t4cpq-measure.mjs`, `t4cpq-widget.mjs`). Raw data: `docs/qa/t4cpq/measure.json`, `widget.json`. Every measured page's `window.Shopify.theme.id` matched the expected theme (no mismatch flags).

## Checks (criterion 1)
- `npm ci`: ok. `npm run check:css`: exit 0. `npm run check:hidden`: exit 0. `shopify theme check`: 0 offenses (104 files).
- CSS size: 58,366 bytes / 11,104 gzip -9 (budget 60,000 / 12,000). Within budget.

## Acceptance
2. PASS. Opt-out and balanced-face pages, dev theme: h1 left edge == prose left edge at 768 (60.6), 1024 (188.6), 1440 (396.6), 1920 (636.6). Gap left == gap right at every width (60.6/188.6/396.6/636.6). Prose width 646.9 everywhere >= 768. Staging comparison: left edge was 52 with 741 px right gap at 1440.
3. PASS. At 320/375/390/430 (and 700) h1 and prose x/width are identical to staging (52 / 216, 271, 286, 326; 700: 52 / 596); X_page (scrollWidth minus innerWidth) = 0 on both. Transition: shell hits the cap (710.9) just above ~711, so 768 is already centered; 700 is still full-width, same as staging.
4. PASS. Paragraph computed `text-align: start` on both pages at all widths. Opt-out widget at 375: inner form content is 379 px in a 271 px box, contained by `.prose.overflow-x-auto`, document width = 375 (no page overflow); identical to staging. At 1440 the Opt out button, label and checkbox all sit at x = 396.6 = prose left edge (staging: all at 52 = prose left edge, so alignment unchanged relative to the column). Screenshots: `docs/qa/screenshots/t4cpq-optout-{dev,stg}-{375,1440}.png`.
5. PASS. 1440 for `/collections/all`, `/search?q=snowboard`, `/blogs/news`, a 404 page: h1 x 52, w 1336, shell x 20, w 1400 on dev and staging (identical).
Also: exactly one h1 on every measured page.

## Console / network
Only a `Failed to load resource ... 404` on each theme's run, which comes from the deliberate 404 page probe (same on staging). No other errors.

## Accessibility / performance
No change in heading structure or semantics. CSS grew within budget (the one arbitrary `max-w-[calc(65ch+4rem)]` utility).

## Issues
None. Not tested: theme editor (not relevant to this change; no schema or settings touched).

Verdict: PASS
