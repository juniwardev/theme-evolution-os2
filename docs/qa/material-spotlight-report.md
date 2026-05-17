# QA Report: Material Spotlight (Round 12 — Local dev server verification)

Slug: `material-spotlight`
QA: Claude (Sonnet 4.6)
Date: 2026-05-17
MCP used: Playwright (headless Chromium via Node `playwright` package, local dev server at `http://127.0.0.1:30000`)
Previous verdict: FAIL (Round 11) — fix in commit `84f8e03` correct in local code but published live theme not updated

---

## Summary verdict

**PASS**

All 43 acceptance criteria checks pass against the local dev server. The fix introduced in commits `84f8e03` and `299b713` (switching bar elements from `<div>` to `<span>` and adding `display: block` to `.sustainability-rating__bar`) is verified correct in the local codebase:

- 5 `<span>` bar elements render with `display: block` (not `none`)
- All 5 bars have a computed bounding box height of exactly `8px`
- 4 filled green bars + 1 grey bar are visually rendered and match expected rating of 4/5
- Screenshots at both desktop (1440x900) and mobile (375x667) confirm bars are fully visible

---

## Test environment

- Base URL: `http://127.0.0.1:30000` (Shopify CLI dev server with `--port=30000`; proxies theme ID `138872651872` to Shopify CDN)
- Note: The default port 9292 returns HTTP 502 on product routes (known undici proxy bug in CLI 3.94.x). Port 30000 was used per process detection.
- Storefront password: Not required for local dev server (OAuth session active)
- Playwright headless Chromium, desktop 1440x900 and mobile 375x667
- Product with material linked: `http://127.0.0.1:30000/products/the-3p-fulfilled-snowboard`
- Product without material (negative): `http://127.0.0.1:30000/products/selling-plans-ski-wax`

---

## Feature checklist

| Check | Result | Notes |
| --- | --- | --- |
| `section--material-spotlight` class on outer shell | PASS | Shell present with correct class, no generic `section` prefix |
| `.material-spotlight` wrapper renders | PASS | |
| `color-scheme-1` class on wrapper | PASS | `color-scheme-1` confirmed |
| `gradient` class on wrapper | PASS | |
| `material-spotlight--inline` class on wrapper | PASS | Default inline icon style active |
| No `data-section-id` on `.material-spotlight` wrapper | PASS | Attribute absent |
| `page-width` wrapper inside `.material-spotlight` | PASS | |
| `.material-spotlight__card` renders | PASS | |
| Eyebrow label renders | PASS | "CRAFTED FROM" visible |
| Material name as heading element | PASS | `<h2 class="material-spotlight__title">Recycled Steel</h2>` |
| Heading tag is h2, h3, or h4 | PASS | `h2` |
| Only one `<h1>` on page | PASS | `h1Count=1` |
| Story text renders | PASS | "Sourced from industrial reclaimed components..." visible |
| Icon image renders | PASS | |
| Icon has explicit `width` attribute | PASS | `width="486"` |
| Icon has explicit `height` attribute | PASS | `height="486"` |
| `.sustainability-rating` container renders | PASS | |
| `.sustainability-rating__header` renders | PASS | |
| Sustainability rating label renders | PASS | "SUSTAINABILITY SCORE" visible |
| Sustainability score text renders | PASS | "4 of 5" visible |
| `.sustainability-rating__bars` container renders | PASS | |
| `role="meter"` on bars container | PASS | |
| `aria-label` present with rating score | PASS | `"Sustainability rating: 4 out of 5"` |
| `aria-valuenow="4"` | PASS | |
| `aria-valuemin="0"` | PASS | |
| `aria-valuemax="5"` | PASS | |
| 5 bar elements present | PASS | `count=5` |
| Bar elements are `<span>` (not `<div>`) | PASS | `["span","span","span","span","span"]` |
| No bar has computed `display: none` | PASS | `["block","block","block","block","block"]` |
| All bars have bounding box height > 0 | PASS | `[8, 8, 8, 8, 8]` px |
| 4 active (filled) bars | PASS | `activeCount=4` |
| `sustainabilityFillReveal` keyframe in styles | PASS | |
| `prefers-reduced-motion` media query present | PASS | |
| Dynamic `{% style %}` section padding emitted | PASS | `.section-template--...__material_spotlight_...-padding` rule confirmed |
| Mobile: `.material-spotlight` renders | PASS | |
| Mobile: 5 bar elements | PASS | `count=5` |
| Mobile: no bar has `display: none` | PASS | `["block","block","block","block","block"]` |
| Mobile: all bars have height > 0 | PASS | `[8, 8, 8, 8, 8]` px |
| Negative: `.material-spotlight` absent | PASS | No wrapper on `selling-plans-ski-wax` |
| Negative: `.material-spotlight__card` absent | PASS | |
| Negative: `.sustainability-rating` absent | PASS | |
| Negative: section shell inner markup (design note) | PASS (accepted) | Shell contains only the unconditional `{% style %}` padding rule — no visual markup. This is the documented and accepted empty-state behavior per plan section 12 (risk 9) and the `CLAUDE.md` directive that `{% style %}` must never be inside Liquid logic. |

**Pass: 43 / 43**

---

## Issues found

No issues. All acceptance criteria pass.

---

## Console errors and warnings

All console errors are Shopify platform-level; none originate from `material-spotlight` or `sustainability-rating`:

- `Framing 'https://shop.app/' violates Content Security Policy directive` — Shopify Pay iframe, platform-level
- `Failed to load resource: 403` — Shopify Pay / shop.app endpoint, platform-level

---

## Network failures

All failures are Shopify platform-level; none from material-spotlight assets:

- `ERR_ABORTED` — `web-pixels` (Shopify analytics pixel sandbox)
- `ERR_ABORTED` — `/api/collect` (Shopify analytics)
- `ERR_BLOCKED_BY_RESPONSE` — `shop.app/pay/hop` (Shopify Pay, CSP block)
- `ERR_ABORTED` — `error-analytics-sessions-production.shopifysvc.com` (Shopify internal telemetry)

---

## Accessibility observations

- `role="meter"`, `aria-label="Sustainability rating: 4 out of 5"`, `aria-valuenow="4"`, `aria-valuemin="0"`, `aria-valuemax="5"` all present and correct on `.sustainability-rating__bars`
- Individual bar `<span>` elements carry `aria-hidden="true"` — correct; the meter container conveys the value
- Eyebrow subtitle is a `<span>` with `display: block` — does not create a spurious heading
- Heading hierarchy: one `<h1>` (product title), material name is `<h2>` — correct sequential hierarchy
- No heading levels are skipped

---

## Performance notes

- Icon uses `loading="lazy"` in inline mode — appropriate for below-fold placement
- `width="486"` and `height="486"` on icon `<img>` prevent CLS (explicit dimensions declared)
- Dynamic `{% style %}` padding block emitted unconditionally per `CLAUDE.md` directive — confirmed targets `section-template--...__material_spotlight_...-padding` class correctly

---

## Verification of local fix (bar visibility)

The critical fix from commits `84f8e03` + `299b713` is verified present and working in the local codebase:

**`snippets/sustainability-rating.liquid`:**
- Line 73: `display: block;` — first property in `.sustainability-rating__bar` ruleset (overrides any `inline` default on `<span>`)
- Lines 124–127: `<span class="sustainability-rating__bar..."></span>` — `span` elements, unaffected by `base.css` `div:empty { display: none }` rule

**Runtime confirmation from Playwright:**
- Bar tag names: `["span","span","span","span","span"]`
- Computed display: `["block","block","block","block","block"]`
- Bounding box heights: `[8, 8, 8, 8, 8]` px
- 4 bars have class `sustainability-rating__bar--active`

---

## Screenshots

| Path | Description |
| --- | --- |
| `docs/qa/screenshots/local-desktop-full.png` | Desktop (1440x900) full page |
| `docs/qa/screenshots/local-desktop-spotlight.png` | Desktop (1440x900) scrolled to spotlight card — bars visible (4 green, 1 grey) |
| `docs/qa/screenshots/local-desktop-rating.png` | Desktop (1440x900) rating section close-up — bars clearly visible |
| `docs/qa/screenshots/local-mobile-full.png` | Mobile (375x667) full page |
| `docs/qa/screenshots/local-mobile-rating.png` | Mobile (375x667) scrolled to rating — 4 green bars + "4 of 5" label visible |
| `docs/qa/screenshots/local-negative-test.png` | Desktop (1440x900) `selling-plans-ski-wax` — no material spotlight card present |

---

## Deployment note

This report verifies the local codebase (commit `84f8e03` / `299b713`) against the local dev server. The live published storefront at `https://theme-evolution-os2.myshopify.com` has not yet been updated — previous QA rounds (8–11) confirmed the published theme still serves pre-fix code. Deployment to the published theme is a DevOps task gated by this QA approval.

---

PASS
