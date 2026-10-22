# QA Report: theme-evolution-footer (Re-run after bug fix)

QA agent: Claude Sonnet 4.6
Date: 2026-05-21
Plan: `docs/plans/theme-evolution-footer.md` (revision 3)
Impl-notes: `docs/plans/theme-evolution-footer-impl-notes.md`
Test product: `the-complete-snowboard` (multi-variant, standard fulfillment)
Prior report verdict: FAIL (Issue 1 — full-bleed gap, commit ab239d6 prescribed as fix)
This report: Re-run after fix commit ab239d6
MCP used: Playwright (all tests)

---

## Summary verdict

**FAIL**

Two issues found:

1. **Issue 1 (RESOLVED from prior report):** Full-bleed background fix confirmed working. `grid-column: 1 / -1` (commit `ab239d6`) resolves the 20px white-gap problem. Footer wrapper now measures `left=0, right=1440, width=1440` on a 1440px viewport — confirmed edge-to-edge.

2. **Issue 2 (NEW BLOCKER):** Uncommitted changes to `sections/footer.liquid` add `"default"` values to all five `url` type settings (instagram, facebook, youtube, tiktok, twitter) and to the `richtext` `about_text` setting. Shopify rejects `url` type settings with external URL string defaults, causing the Shopify CLI dev server to report "Failed to Upload Theme Files" with the error: `Invalid schema: setting with id="instagram_url" default must be a string or datasource access path`. The `url` defaults are rejected; the social column never renders because all five url settings remain blank. Additionally, these working-tree changes are uncommitted — they are not part of any commit in the git log.

---

## Prior report issues — status update

| Issue (prior report) | Prior verdict | Current status |
|---|---|---|
| Issue 1 (BLOCKER): Footer background does not extend edge-to-edge | BLOCKER | **RESOLVED** — `grid-column: 1 / -1` fix confirmed. `wrapper.left=0, wrapper.right=1440` on 1440px viewport. |
| Issue 2 (NIT): Social column not testable — no social URLs configured | NIT | **UNCHANGED** — social column still absent, but now for a different reason: the url defaults were added to the working tree but Shopify rejects them, so social URLs remain blank. Underlying code for social rendering is correct per static analysis. |
| Issue 3 (NIT): About-text column not testable | NIT | **PARTIALLY RESOLVED** — about text now renders with a default value from the `richtext` schema default. However, this default was NOT in the plan (plan section 4.3 specifies `about_text` has no default). The deviation is acceptable cosmetically but should be noted. |

---

## Issues found (this re-run)

### Issue 1 (BLOCKER): Uncommitted working-tree changes with invalid `url` schema defaults

**What happened:** After the prior QA FAIL, the Coder added `"default"` values to the schema to populate test content:
- `about_text` (richtext) got `"default": "<p>We're passionate about..."` — NOT in plan
- All five url settings got external URL defaults (e.g., `"default": "https://www.instagram.com/"`) — NOT in plan, invalid for `url` type

**Schema upload error (from dev server `http://127.0.0.1:9292/hot-reload/app-state` endpoint):**
```
Invalid schema: setting with id="instagram_url" default must be a string or datasource access path
```

**Consequence:** The `url` defaults are never applied. All five social url settings remain blank. `has_social` evaluates to `false`. Social column does not render. Social icons, their aria-labels, SVG color inheritance, and click-through behavior cannot be verified dynamically.

**Additional concern:** These working-tree changes are uncommitted. `git status` shows `sections/footer.liquid` as "modified" (not staged, not committed).

**Plan alignment:** Plan section 4.5 states `url` settings for each platform are "optional" with no `"default"` key. Plan section 6 shows the schema without any `default` on url settings. The Coder's deviation from the plan introduced the invalid defaults.

**Fix required:**
Remove all five `"default": "https://..."` lines from the `url` type settings in `sections/footer.liquid`. The `url` type does not support external URL string defaults in Shopify's schema validation. To test social icons, social URLs should be configured via `sections/footer-group.json` or via the Shopify theme editor.

The `richtext` `about_text` default is technically valid (Shopify accepts richtext defaults), but it also deviates from the plan (plan says no default for `about_text`). Whether to keep it is the Coder's call, but the url defaults MUST be removed.

**Severity:** Blocker — the working-tree changes cannot be deployed, and the dev server is in a broken upload state.

**MCP used:** Playwright (error observed in dev server app-state response)

---

### Issue 2 (CONFIRMED RESOLVED): Full-bleed background fix

**Confirmed fixed.** From `docs/plans/theme-evolution-footer-impl-notes.md` (post-QA deviation section):

> The fix was to add `grid-column: 1 / -1;` to the `.theme-evolution-footer-wrapper` rule in the `{% stylesheet %}` block of `sections/footer.liquid`.

**Measured geometry (1440px viewport):**
- `.theme-evolution-footer-wrapper`: `left=0, right=1440, width=1440`
- Parent `.shopify-section-group-footer-group`: `left=0, right=1440, width=1440`
- No gap on either side

**Evidence:**
- `docs/qa/screenshots/v2-footer-left-edge.png` — dark background starts at x=0
- `docs/qa/screenshots/v2-footer-right-edge.png` — dark background extends to right edge
- `docs/qa/screenshots/v2-desktop-footer-final.png` — full-width dark footer visible

**Severity:** Resolved.

---

## Tests results checklist

| Test | Expected | Actual | Result |
|---|---|---|---|
| Footer wrapper `div.theme-evolution-footer-wrapper` present | Yes | Yes | PASS |
| Background color `rgb(17, 17, 17)` (#111111) | `rgb(17, 17, 17)` | `rgb(17, 17, 17)` | PASS |
| Text color `rgb(255, 255, 255)` (#ffffff) | `rgb(255, 255, 255)` | `rgb(255, 255, 255)` | PASS |
| CSS custom property `--footer-bg: #111111` | `#111111` | `#111111` | PASS |
| CSS custom property `--footer-text: #ffffff` | `#ffffff` | `#ffffff` | PASS |
| CSS custom property `--footer-border` uses `color-mix()` | `color-mix(in srgb, currentColor 8%, transparent)` | `color-mix(in srgb, currentColor 8%, transparent)` | PASS |
| Full-bleed background desktop (1440px viewport) | `left=0, width=1440` | `left=0, right=1440, width=1440` | PASS |
| Full-bleed background mobile (375px viewport) | `left=0, width=375` | `left=0, width=375` | PASS |
| Desktop 2-column grid (about + menu columns present) | Columns grid | `640px 320px` (2fr 1fr) | PASS |
| About-text column renders | Yes (due to richtext default) | Yes | PASS (via default, plan deviation) |
| About-text content | Default placeholder | "We're passionate about..." | PASS |
| About-text font-size 0.9rem | ~14.4px | `14.4px` | PASS |
| About-text line-height 1.6 | ~23.04px | `23.04px` | PASS |
| Nav/menu column renders | Yes | Yes (footer menu link list configured) | PASS |
| Nav `<nav>` has `aria-label="Footer menu"` | "Footer menu" | "Footer menu" | PASS |
| Menu `<ul>` has `role="list"` | "list" | "list" | PASS |
| Menu links uppercase text-transform | uppercase | `uppercase` | PASS |
| Menu link color inherits white | `rgb(255,255,255)` | `rgb(255, 255, 255)` | PASS |
| Menu link text-decoration none (default) | none | none | PASS |
| Social column renders | Yes (with social URLs) | No (url defaults rejected) | BLOCKED |
| Social `<ul>` aria-label="Social media" | "Social media" | N/A | BLOCKED |
| Social link has per-platform aria-label | "Instagram, Opens in a new window." pattern | N/A | BLOCKED |
| Social link has `rel="noopener" target="_blank"` | Yes | N/A | BLOCKED (code review confirms correct) |
| Social SVG inherits `fill: currentColor` | White | N/A | BLOCKED |
| Bottom bar present | Yes | Yes | PASS |
| Bottom bar `border-top: 1px solid` | Yes | `borderTopWidth: 1px, borderTopStyle: solid` | PASS |
| Bottom bar border color from `color-mix()` | `color(srgb 1 1 1 / 0.08)` | `color(srgb 1 1 1 / 0.08)` | PASS |
| Copyright text format "© 2026 ... · Powered by Shopify" | `© 2026 theme-evolution-os2 · Powered by Shopify` | matches | PASS |
| Copyright middot separator | `·` | `·` | PASS |
| Copyright link count | 2 (shop name + powered by) | 2 | PASS |
| Payment `<ul>` `role="list"` | "list" | "list" | PASS |
| Payment `<ul>` `aria-label="Payment methods"` | "Payment methods" | "Payment methods" | PASS |
| Mobile single-column grid | `1fr` | `327px` (single column) | PASS |
| Mobile bottom bar `flex-direction: column` | column | column | PASS |
| Mobile bottom bar `text-align: center` | center | center | PASS |
| Mobile footer extends full 375px width | 375px | 375px | PASS |
| `<footer>` element is semantic `contentinfo` landmark | Yes | Yes (FOOTER tag confirmed) | PASS |
| No JS introduced | No JS block | No `<script>` or `{% javascript %}` | PASS |
| Theme check: exactly 2 pre-existing offenses | 2 | 2 | PASS |

---

## Console errors and warnings

| Error | Source | Assessment |
|---|---|---|
| `Failed to load resource: the server responded with a status of 404 ()` | Shopify analytics/beacon endpoint | Pre-existing Shopify platform error; not theme-related |
| `Framing 'https://shop.app/' violates the following Content Security Policy directive: "frame-ancestors 'none'"` | Shop Pay iframe blocked by Shopify's CSP | Pre-existing Shopify platform behavior |
| `Failed to load resource: the server responded with a status of 503 ()` | Shopify platform resource | Pre-existing |
| Warning: preloaded resource not used within load event (critical.css, font woff2) | Shopify Early Hints optimization | Pre-existing Shopify behavior |

No footer-specific console errors detected.

---

## Network failures

All observed failures are Shopify platform-level (monorail analytics, Shop Pay iframe, API collect). No footer asset load failures. CSS loaded correctly.

---

## Accessibility observations

| Check | Expected | Actual | Result |
|---|---|---|---|
| `<footer>` is `contentinfo` landmark | implicit from `<footer>` | `FOOTER` tag present | PASS |
| `<nav>` with `aria-label="Footer menu"` | "Footer menu" | "Footer menu" | PASS |
| Menu `<ul>` `role="list"` | "list" | "list" | PASS |
| Payment `<ul>` `role="list"` | "list" | "list" | PASS |
| Payment `<ul>` `aria-label="Payment methods"` | "Payment methods" | "Payment methods" | PASS |
| Social `<ul>` `aria-label="Social media"` | "Social media" | N/A (no social) | BLOCKED |
| Social link per-platform aria-labels | "Instagram, Opens in a new window." | N/A | BLOCKED (code confirms correct format) |

---

## Theme check result

```
61 files inspected with 2 total offenses found across 2 files.
1 errors. 1 warnings.
```

- `[error] TranslationKeyExists` — `sections/cart-drawer.liquid` line 18 (pre-existing)
- `[warning] UnusedAssign` — `snippets/card-product.liquid` line 7 (pre-existing)

Zero new offenses from the footer feature. Note: `shopify theme check` does NOT catch the `url` setting default issue; only the Shopify CLI dev server's runtime schema validation catches it.

---

## Visual — desktop (1440×900)

- Footer background `#111111` extends edge-to-edge: PASS
- Two columns visible (about-text left, nav right): PASS
- Grid proportions `640px : 320px` = `2fr : 1fr` correct: PASS
- Bottom bar with copyright left, no payment icons (none configured on dev store): PASS
- `·` middot separator in copyright: PASS
- No social column (url defaults rejected): BLOCKED

Screenshots:
- `docs/qa/screenshots/v2-desktop-footer-final.png` — full-width dark footer at 1440x900
- `docs/qa/screenshots/v2-desktop-footer-viewport.png` — footer with page context
- `docs/qa/screenshots/v2-footer-left-edge.png` — left edge: dark background from x=0
- `docs/qa/screenshots/v2-footer-right-edge.png` — right edge: dark background to x=1440
- `docs/qa/screenshots/v2-desktop-footer-3p.png` — footer on 3p-fulfilled-snowboard page

---

## Visual — mobile (375×667)

- Footer wrapper `width=375`, `left=0`: PASS (full-bleed)
- Single-column grid (`327px`): PASS
- About text stacks above nav links: PASS (2 column children)
- Bottom bar `flex-direction: column`: PASS
- Bottom bar `text-align: center`: PASS

Screenshots:
- `docs/qa/screenshots/v2-mobile-footer-final.png` — footer at 375x667
- `docs/qa/screenshots/v2-mobile-footer-viewport.png` — footer with page context

---

## Schema deviation summary

| Setting | Plan spec | Actual (working tree) | Status |
|---|---|---|---|
| `about_text` (richtext) | No `"default"` key | Has `"default": "<p>We're passionate...</p>"` | Deviation — plan violation; technically valid Shopify schema; cosmetically beneficial |
| `instagram_url` (url) | No `"default"` key | Has `"default": "https://www.instagram.com/"` | **Blocker deviation** — Shopify rejects this; causes upload failure |
| `facebook_url` (url) | No `"default"` key | Has `"default": "https://www.facebook.com/"` | **Blocker deviation** |
| `youtube_url` (url) | No `"default"` key | Has `"default": "https://www.youtube.com/"` | **Blocker deviation** |
| `tiktok_url` (url) | No `"default"` key | Has `"default": "https://www.tiktok.com/"` | **Blocker deviation** |
| `twitter_url` (url) | No `"default"` key | Has `"default": "https://x.com/"` | **Blocker deviation** |

All deviations are in uncommitted working-tree changes (not staged, not committed).

---

## Performance notes

No JavaScript added. No new asset requests. Footer is server-rendered Liquid only. No LCP or CLS concerns. No performance regressions observed.

---

## Nits (non-blocking)

1. **Social and about-text columns cannot be fully tested dynamically.** The url defaults need to be removed and social URLs configured via `sections/footer-group.json` or the theme editor. After the fix and proper configuration, re-test social icon rendering, aria-labels, and SVG color inheritance.

2. **`color-mix()` value for `--footer-border` has no static fallback.** Accepted trade-off per plan risk #3 and impl-notes. Pre-2023 browsers fall back to `currentColor` which remains visible.

3. **Two-column layout only (not three-column) verifiable.** The social column cannot be tested until the url defaults are removed and proper URLs are configured. Three-column 2fr 1fr 1fr grid proportion verification (all three present simultaneously) remains BLOCKED.

---

## Screenshots reference

| File | Description | New in this run |
|---|---|---|
| `v2-desktop-footer-final.png` | Desktop 1440x900 — footer edge-to-edge, 2 columns | Yes |
| `v2-desktop-footer-viewport.png` | Desktop 1440x900 — viewport at footer | Yes |
| `v2-desktop-footer-3p.png` | Desktop 1440x900 — footer on 3p-fulfilled-snowboard | Yes |
| `v2-footer-left-edge.png` | Left edge crop — dark from x=0 (no white gap) | Yes |
| `v2-footer-right-edge.png` | Right edge crop — dark at x=1440 (no white gap) | Yes |
| `v2-mobile-footer-final.png` | Mobile 375x667 — single-column footer | Yes |
| `v2-mobile-footer-viewport.png` | Mobile 375x667 — footer with page context | Yes |
| `desktop-footer-outlined.png` | Prior run: blue=parent, red=wrapper (20px gap — now fixed) | Prior run |
| `footer-left-edge.png` | Prior run: 20px white gap at left edge — now fixed | Prior run |

---

FAIL
