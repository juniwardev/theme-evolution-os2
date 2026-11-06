# QA report: theme-evolution-tailwind-t5b

Dev theme 188245508192 (role `development`, asserted on every load). MCP used: Playwright (scripted via the existing harness lib); Chrome DevTools not needed. Harness: `docs/qa/harness/t5bq-sweep.mjs`, `t5bq-detail.mjs`, plus the existing `t5bc-regress.mjs`. Evidence: `docs/qa/evidence/t5b-qa/`.

## Summary verdict: PASS WITH NITS

## Results

| Check | Result |
|---|---|
| `npm ci && npm run check:css` | exit 0; tree clean afterwards |
| `shopify theme check` | 329 files, 0 offenses |
| CSS size | 58,719 B / 11,215 gzip (budget 60,000 / 12,000) |
| Line height 1.5 site-wide | `html` and body compute 24px on home, p3p, wax, rental, collection, search, contact, blog, policy, opt-out, cart, archive at 375 and 1440 (24 loads, all HTTP 200) |
| Clipping / overflow | 0 clipped text elements in all 24 loads; `scrollWidth` == viewport everywhere; header bar 64px on every page |
| Rental Supercycle picker | opens at 375 and 1440, calendar fits, dates inside cells, no overflow |
| Cart drawer, menu, accordion | `t5bc-regress.mjs` ALL PASS (add/update/remove/Escape at 1440 and 375, menu open/Escape/outside click, accordion) |
| Policy `/policies/privacy-policy` | wrapper `prose prose-tokens mx-auto w-full` present (`[data-policy-prose]` count 1); 0 on every other page; wrapper width = viewport at 320 and 375; text left edge 20px; no overflow at 320 or 375; `ul` disc with 26px padding; links underlined; paragraph line height 28px; one `h1` (36px, body font) |
| Other policies | terms, refund, shipping and contact-information return 404 on this store (do not exist; not tested) |
| Headings | in the sweep, headings without `font-heading` outside `prose` use Work Sans (as before); those with `font-heading` use Oswald; the only prose headings are in the policy page. No heading rule seen in the compiled CSS by the Coder; nothing in my measurements contradicts it |
| One `h1` per page | yes on all 24 loads incl. policy and rental |
| Theme editor | NOT CHECKED (gap): admin login wall |
| Live probe C5b.13 | deferred by instruction; run before the live push |

## Issues

1. Nit (low): the policy `h1` renders in the body font (Work Sans) while every other page title uses Oswald. This is the known, documented Q5b.3 (b) tradeoff awaiting owner review on staging, not a defect.
2. Nit (info): my first ad-hoc "Escape closes drawer" selector reported still-open; this was my selector (an `aria-modal` element always exists). The Coder's regress harness checks the real drawer state and passed. Not an issue.

## Console and network

Only error: Shopify's own `monorail` telemetry fetch failure on the p3p page (`shopify_pay_page_load`), environmental. No theme JS errors. No 4xx or 5xx on tested pages (the four 404s above are non-existent policies).

## Accessibility and performance

No new observations. Mobile menu opens with focus on the first link, and the drawer and picker render correctly. No performance work was done.

## Open note: live rentals show 219 app-owned changed elements at S0 versus 7 on dev

Assessed from the Coder's data only (I did not load live): the changed elements are all inside the Supercycle app block and satisfy the "1.5 x own font size" mechanism. That is the app's own calendar markup inheriting line height, with the calendar apparently expanded by default on live. This is an app or environment state difference (dev reaches 219 once the picker is open), not a T5b-specific cause. I verified on dev that the open picker fits cleanly at 375 and 1440.

## Gaps

Theme editor not reached; live probe deferred; terms/refund/shipping policies not present; 320px and 768px were checked only on the policy page (320) in this QA, other pages at 375/1440 only.

## Screenshots

`docs/qa/evidence/t5b-qa/*-375.png`, `*-1440.png`, `pol-*-top.png`, `drawer-*.png`, `menu-375.png`, `rental-picker-*.png`.

Password occurrences in everything written: 0. Dev server stopped.
