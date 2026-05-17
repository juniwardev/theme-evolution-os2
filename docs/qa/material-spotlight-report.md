# QA Report: Material Spotlight (Round 13 — Live Shopify storefront verification)

Slug: `material-spotlight`
QA: Claude (Sonnet 4.6)
Date: 2026-05-17
MCP used: Playwright (headless Chromium via `npx playwright` 1.60.0, Shopify live storefront `theme-evolution-os2.myshopify.com`)
Previous verdict: PASS (Round 12) — verified against local dev server at port 30000

---

## Summary verdict

**PASS**

All 41 acceptance criteria checks pass against the live Shopify storefront (published theme). This round supersedes Round 12 which tested only the local dev server. The feature is verified end-to-end against the actual deployed theme:

- 5 `<span>` bar elements render with `display: block` (not `none`)
- All 5 bars have a computed bounding box height of exactly `8px`
- 4 filled green bars + 1 grey bar are visually rendered, matching rating of 4/5
- Screenshots at both desktop (1440x900) and mobile (375x667) confirm bars, labels, icon, and story are fully visible and correctly styled
- Negative test confirms no spotlight markup on a product without a `material_link` metafield

---

## Test environment

- Base URL: `https://theme-evolution-os2.myshopify.com` (live Shopify storefront, password-protected dev store)
- Storefront password: `yeathu` (submitted via password gate at `/password` before product navigation)
- Playwright headless Chromium 1.60.0, desktop 1440x900 and mobile 375x667
- Product with material linked: `https://theme-evolution-os2.myshopify.com/products/the-3p-fulfilled-snowboard`
- Product without material (negative): `https://theme-evolution-os2.myshopify.com/products/selling-plans-ski-wax`
- Note: Dev server not running; tests executed directly against the published Shopify theme via storefront URL

---

## Feature checklist

| Check | Result | Notes |
| --- | --- | --- |
| `section--material-spotlight` class on outer shell | PASS | `shopify-section section--material-spotlight` — no generic `section` prefix |
| `.material-spotlight` wrapper renders | PASS | Full class: `material-spotlight material-spotlight--inline color-scheme-1 gradient section-template--...-padding` |
| Color scheme class on wrapper | PASS | `color-scheme-1` present |
| `gradient` class on wrapper | PASS | Present, matches established pattern from `related-products.liquid` |
| `material-spotlight--inline` class on wrapper | PASS | Default inline icon style active |
| No `data-section-id` on `.material-spotlight` wrapper | PASS | Attribute absent |
| `.material-spotlight__card` renders | PASS | |
| Eyebrow label renders | PASS | "Crafted from" (as configured in `product.json`) |
| Material name as heading element | PASS | `<h2 class="material-spotlight__title">Recycled Steel</h2>` |
| Heading tag is h2/h3/h4 (not h1) | PASS | `H2` |
| Only one `<h1>` on page | PASS | `h1Count=1` |
| Story text renders | PASS | "Sourced from industrial reclaimed components, our high-tensile recycled steel..." |
| Icon image renders | PASS | `IMG` element present |
| Icon has explicit `width` attribute (CLS) | PASS | `width=486` |
| Icon has explicit `height` attribute (CLS) | PASS | `height=486` |
| `.sustainability-rating` container renders | PASS | |
| `.sustainability-rating__header` renders | PASS | |
| Sustainability rating label renders | PASS | "Sustainability score" |
| Sustainability score text renders | PASS | "4 of 5" |
| `.sustainability-rating__bars` container renders | PASS | |
| `role="meter"` on bars container | PASS | |
| `aria-label` with score text on meter | PASS | `"Sustainability rating: 4 out of 5"` |
| `aria-valuenow="4"` | PASS | |
| `aria-valuemin="0"` | PASS | |
| `aria-valuemax="5"` | PASS | |
| 5 bar elements present | PASS | `count=5` |
| Bar elements are `<span>` (not `<div>`) | PASS | `["span","span","span","span","span"]` |
| No bar has computed `display: none` | PASS | `["block","block","block","block","block"]` |
| All bars have bounding box height >= 8px | PASS | `[8, 8, 8, 8, 8]` px |
| 4 active (filled) bars | PASS | `activeCount=4` |
| `sustainabilityFillReveal` keyframe in styles | PASS | Found in `<style>` tag |
| `prefers-reduced-motion` media query present | PASS | Found in `<style>` tag |
| Dynamic `{% style %}` section padding emitted | PASS | `.section-template--...__material-spotlight-padding` rule confirmed |
| Mobile: `.material-spotlight` renders | PASS | |
| Mobile: 5 bar elements | PASS | `count=5` |
| Mobile: no bar has `display: none` | PASS | `["block","block","block","block","block"]` |
| Mobile: all bars have height >= 8px | PASS | `[8, 8, 8, 8, 8]` px |
| Negative: `.material-spotlight` absent | PASS | No wrapper on `selling-plans-ski-wax` |
| Negative: `.material-spotlight__card` absent | PASS | |
| Negative: `.sustainability-rating` absent | PASS | |
| Negative: only one `<h1>` | PASS | `h1Count=1` |

**Pass: 41 / 41**

---

## Issues found

No issues. All acceptance criteria pass against the live storefront.

---

## Console errors and warnings

All console errors are Shopify platform-level; none originate from `material-spotlight` or `sustainability-rating`:

- `Framing 'https://shop.app/' violates Content Security Policy directive` — Shopify Pay iframe, platform-level
- `Failed to load resource: 403` — Shopify Pay / shop.app endpoint, platform-level

No errors from material-spotlight code.

---

## Network failures

All failures are Shopify platform-level; none from material-spotlight assets:

- `ERR_ABORTED` — `/api/collect` (Shopify analytics)
- `ERR_ABORTED` — `/.well-known/shopify/monorail/unstable/produce_batch` (Shopify analytics)
- `ERR_BLOCKED_BY_RESPONSE` — `shop.app/pay/hop` (Shopify Pay, CSP block)
- `ERR_ABORTED` — `monorail-edge.shopifysvc.com/v1/produce` (Shopify internal telemetry)
- `ERR_ABORTED` — `cdn.shopify.com/shopify-marketing_assets/static/ShopifySans--regular.woff` (font, non-critical)

---

## Accessibility observations

- `role="meter"`, `aria-label="Sustainability rating: 4 out of 5"`, `aria-valuenow="4"`, `aria-valuemin="0"`, `aria-valuemax="5"` all present and correct on `.sustainability-rating__bars`
- Individual bar `<span>` elements carry `aria-hidden="true"` — correct; the meter container conveys the value to assistive technology
- Eyebrow subtitle is a `<span>` with `display: block` — does not create a spurious heading in the document outline
- Heading hierarchy: one `<h1>` (product title), material name is `<h2>` — correct sequential hierarchy, no skipped levels

---

## Performance notes

- Icon uses `loading="lazy"` in inline mode — appropriate for below-fold placement
- `width="486"` and `height="486"` on icon `<img>` prevent CLS (explicit dimensions declared per CLS directive)
- Dynamic `{% style %}` padding block emitted unconditionally per `CLAUDE.md` directive — confirmed targets `section-template--...__material-spotlight-padding` class correctly
- `sustainabilityFillReveal` keyframe animation present with staggered `--sustainability-anim-delay` delays (0ms, 150ms, 300ms, 450ms, 600ms) for left-to-right cascade
- `prefers-reduced-motion: reduce` media query disables animation for motion-sensitive users

---

## Visual verification

Screenshots confirm visually correct rendering:

- Desktop spotlight: "CRAFTED FROM" eyebrow in uppercase, "Recycled Steel" in bold h2, steel icon image (60x60), story paragraph, "SUSTAINABILITY SCORE" label, "4 of 5" score, 4 dark-green bars + 1 grey bar
- Mobile rating: bars clearly visible at 375px width with correct green/grey treatment
- Negative test: `selling-plans-ski-wax` product page shows no material spotlight card or rating component

---

## Screenshots

| Path | Description |
| --- | --- |
| `docs/qa/screenshots/final-desktop-full.png` | Desktop (1440x900) full page |
| `docs/qa/screenshots/final-desktop-spotlight.png` | Desktop (1440x900) scrolled to spotlight card — icon, heading, story, bars all visible |
| `docs/qa/screenshots/final-desktop-rating.png` | Desktop (1440x900) rating section close-up — 4 green bars + 1 grey, "4 of 5" label |
| `docs/qa/screenshots/final-mobile-full.png` | Mobile (375x667) full page |
| `docs/qa/screenshots/final-mobile-rating.png` | Mobile (375x667) scrolled to rating — 4 green bars + "4 of 5" label visible |
| `docs/qa/screenshots/final-negative-test.png` | Desktop (1440x900) `selling-plans-ski-wax` — no material spotlight card present |

---

PASS
