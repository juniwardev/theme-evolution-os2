# QA Report: theme-evolution-header

Date: 2026-05-20 (re-verification after bug fix)
Tester: QA Agent (Claude Sonnet 4.6)
Plan revision: 3
Dev server URL: https://theme-evolution-os2.myshopify.com/?preview_theme_id=138872651872
Previous verdict: FAIL (blocker: CSS specificity bug on mobile)
This run: full re-verification of all 8 TCs after fix commit `bfc6d1b`

---

## Fix under test

**Bug fixed:** The mobile media-query rule `.header__menu { display: none }` (specificity 0,1,0) was losing to the desktop rule `header .header__menu { display: flex }` (specificity 0,1,1). This caused the inline nav to remain visible on mobile alongside the hamburger toggle.

**Fix applied (commit `bfc6d1b`):** Changed the mobile selector from `.header__menu` to `header .header__menu` (specificity now 0,1,1), matching the desktop rule so `display: none` wins correctly inside the `@media screen and (max-width: 749px)` block.

---

## Test results

| TC | Name | Result | Notes |
|----|------|--------|-------|
| TC1 | Desktop render (1440x900) | PASS | Header sticky (`position: sticky`, `z-index: 3`), dark background (`rgb(17,17,17)`), white text, nav links uppercase + letter-spaced + weight 600, hamburger hidden, cart icon present, no announcement bar. |
| TC2 | Mobile render (375x667) | PASS | Inline nav is hidden (`display: none`), hamburger is visible (`display: flex`), cart icon present, media query active. Bug is resolved. |
| TC3 | Mobile hamburger open/close | PASS | Panel opens below header (panel top = 64px = header bottom), close icon shows, nav links visible, outside-click closes, Escape closes, focus moves to first link (`theme-evolution-header-menu__link`) in panel via rAF. |
| TC4 | Cart badge | PASS | Badge in DOM with `hidden` at count 0 (`display: none`). After add-to-cart on `selling-plans-ski-wax`, badge shows count "1" without `hidden`. |
| TC5 | Announcement bar DOM check | PASS | No `.theme-evolution-announcement-bar` element in DOM (default `show_announcement=false`). |
| TC6 | Color custom properties | PASS | `background-color: rgb(17, 17, 17)`, `color: rgb(255, 255, 255)`, `position: relative`. `--header-bg: #111111`, `--header-text: #ffffff` resolved correctly. |
| TC7 | No console errors | PASS | `ThemeEvolutionHeaderMenu` registers without error. Only one console error: pre-existing Shopify platform 404 (not application code). CSP `frame-ancestors` warnings from Shop Pay are Shopify-platform noise. No application errors. |
| TC8 | Cart drawer regression | PASS | `data-cart-drawer-trigger` attribute present on cart link. Cart drawer (`#CartDrawer`) opens correctly on click. New badge element does not interfere. |

---

## Issues found

None. The previously identified blocker (Issue #1 — CSS specificity bug) is resolved by the fix commit.

---

## Screenshots

| File | Description |
|------|-------------|
| `docs/qa/screenshots/recheck-tc1-desktop.png` | TC1 — Desktop 1440x900: dark header, uppercase nav links, no announcement bar |
| `docs/qa/screenshots/recheck-tc2-mobile.png` | TC2 — Mobile 375x667: inline nav hidden, hamburger visible only (FIXED) |
| `docs/qa/screenshots/recheck-tc3-panel-open.png` | TC3 — Mobile hamburger open: panel drops below header, nav links visible in uppercase, close icon shown |
| `docs/qa/screenshots/recheck-tc3-outside-click.png` | TC3 — Panel closed after outside click |
| `docs/qa/screenshots/recheck-tc3-esc-closed.png` | TC3 — Panel closed after Escape key |
| `docs/qa/screenshots/recheck-tc4-badge-hidden.png` | TC4 — Cart badge hidden (count 0, `hidden` attribute present) |
| `docs/qa/screenshots/recheck-tc4-badge-visible.png` | TC4 — Cart badge visible (count 1 after add-to-cart) |
| `docs/qa/screenshots/recheck-tc8-cart-drawer.png` | TC8 — Cart drawer open after clicking cart icon |

---

## shopify theme check

Output:
```
61 files inspected with 2 total offenses found across 2 files.
1 errors.
1 warnings.
```

Offenses:
1. `TranslationKeyExists` in `sections/cart-drawer.liquid` — `'cart.empty'` — **pre-existing, expected**
2. `UnusedAssign` in `snippets/card-product.liquid` — `page_width` — **pre-existing, expected**

No new offenses introduced by either the original implementation or the bug fix commit. **PASS.**

MCP used: Bash (CLI tool call)

---

## Console errors and warnings

All contexts (desktop homepage, mobile homepage, product page, post-add-to-cart):

- `Failed to load resource: the server responded with a status of 404 ()` — pre-existing Shopify dev preview artifact, unrelated to this feature.
- `Framing 'https://shop.app/' violates the following Content Security Policy directive: "frame-ancestors 'none'"` — Shopify platform noise, pre-existing (Shop Pay CSP header conflict in dev preview).

No application JS errors. `ThemeEvolutionHeaderMenu` custom element registered without `NotSupportedError` or any other error.

---

## Network failures

None attributable to this feature. The 404 error observed is a pre-existing Shopify dev preview artifact.

---

## Accessibility observations

- `.header__menu` `aria-label="{{ 'sections.header.menu' | t }}"` — correct.
- Cart link `aria-label` uses pluralized `cart_count_label` translation — correct.
- Hamburger `aria-expanded` toggles correctly between `"true"` and `"false"`.
- Visually-hidden label swaps between "Open menu" and "Close menu" on state change.
- **Focus management verified:** After opening the panel, `document.activeElement` is the first `.theme-evolution-header-menu__link` element inside the panel (rAF-deferred `.focus()` confirmed working). After outside-click or Escape, panel closes and focus returns to toggle.
- No announcement bar is rendered (toggle off by default) — `role="note"` cannot be observed in this run but was verified in the prior QA run and the Liquid code is unchanged.
- Mobile nav and desktop nav are now mutually exclusive — no redundant navigation landmarks on mobile.

---

## Performance notes

- `.section-header` `position: sticky` confirmed at `z-index: 3`.
- `.theme-evolution-header-wrapper` `position: relative` confirmed — mobile panel absolute positioning anchors correctly.
- Cart badge always in DOM with `hidden` attribute — no layout shift when count transitions 0→1 (badge is absolutely positioned, out of normal flow).
- No `fetchpriority: 'high'` on logo — correct per plan.

---

## Summary verdict

**PASS**

The CSS specificity bug (Issue #1 from the previous run) is resolved. The fix correctly changes the mobile media-query selector from `.header__menu` to `header .header__menu`, matching the desktop rule's specificity (0,1,1), so `display: none` wins inside `@media screen and (max-width: 749px)`.

All 8 test cases pass:

- TC1 (desktop render): PASS
- TC2 (mobile render — previously FAIL): PASS
- TC3 (mobile hamburger open/close — previously PARTIAL PASS): PASS
- TC4 (cart badge): PASS
- TC5 (announcement bar absent): PASS
- TC6 (color custom properties): PASS
- TC7 (no console errors): PASS
- TC8 (cart drawer regression): PASS

`shopify theme check` produces only the two pre-existing offenses. No new violations introduced.

PASS
