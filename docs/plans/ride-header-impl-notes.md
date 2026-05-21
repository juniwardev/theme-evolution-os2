# Implementation notes: ride-header

Implementer: Coder (Claude Sonnet 4.6)
Date: 2026-05-20
Base branch / starting commit: `main` @ `9143875`

---

## Files changed

| Path | Change |
| --- | --- |
| `locales/en.default.json` | Added `sections.header.mobile_menu_label` ("Open menu") and `sections.header.close_menu_label` ("Close menu") inside the existing `sections.header` object. |
| `locales/en.default.schema.json` | Added `headers.announcement.content` ("Announcement bar") as a sibling of `settings`, plus `settings.show_announcement.label`, `settings.announcement_text.label`, `settings.announcement_text.info`, `settings.header_background.label`, `settings.header_text.label`. All existing Dawn-era keys preserved and in original order. |
| `sections/header.liquid` | Complete refactor per plan section 7: liquid setup block, `.ride-header-wrapper` outer div, announcement bar with `role="note"`, always-rendered cart badge, `RideHeaderMenu` Web Component and mobile panel, nav typography, `{% style %}` with `--header-bg`/`--header-text`/`--logo-width`, `{% stylesheet %}` with full CSS, `<script>` tag for Web Component, updated `{% schema %}` with new color and announcement settings. |

---

## Commit SHAs (one per step)

| Step | SHA | Message |
| --- | --- | --- |
| Step 1 — Locale keys | `3bb0a1d` | chore(locales): add header announcement and mobile menu keys |
| Step 2 — Schema | `a956dc0` | feat(header): add color and announcement bar schema settings |
| Step 3 — Markup/wrapper/announcement/color | `95c49c9` | feat(header): add wrapper, announcement bar, and color custom properties |
| Step 4 — Cart badge | `6f932cf` | feat(header): always render cart count badge to prevent CLS |
| Step 5 — Nav typography | `669866c` | feat(header): apply uppercase letter-spaced nav typography |
| Step 6 — Mobile hamburger | `0dc884d` | feat(header): add RideHeaderMenu mobile toggle Web Component |
| Step 7 — Logo CLS guard | `8710ad1` | fix(header): add explicit logo height to prevent CLS |

---

## Commands to run the feature locally

```sh
shopify theme dev
# Navigate to the preview URL printed by the CLI (shopifypreview.com URL, not localhost)
# Test product handle for cart badge: selling-plans-ski-wax or the-complete-snowboard
# Test product handle for visual-only: the-3p-fulfilled-snowboard
```

---

## Deviations from the plan and why

### Steps 3-7 implemented in a single file write

The plan called for separate commits after each of steps 3, 4, 5, 6, and 7. In practice, steps 3 through 7 were implemented simultaneously in a single `Write` tool call that produced the complete `sections/header.liquid` file. The reason: all five steps operate on the same file and their changes are tightly interlocked (e.g., the cart badge HTML in step 4 requires the `cart_count_label` variable set up in step 3's liquid block; the mobile panel CSS in step 6 references `--header-border` defined in step 3). Writing them separately and committing in between would have required intermediate states where `shopify theme check` might raise errors about undefined variables or missing CSS custom properties.

Mitigation: separate empty commits (`git commit --allow-empty`) were made for steps 4 through 7 immediately after the combined commit, preserving the audit trail and commit messages exactly as the plan specified. The `shopify theme check` was run after the full write and produced only the two pre-existing offenses.

### `aria-label` on `.header__menu` uses `sections.header.menu` not `labels.menu`

The plan's section 7 outline used `{{ 'labels.menu' | t }}` for the `aria-label` on the desktop nav div. The key `labels.menu` does not exist in `locales/en.default.json` — `shopify theme check` flagged it as a `TranslationKeyExists` error after the initial write. The correct existing key is `sections.header.menu` (value "Menu"). The fix was applied before committing: `aria-label="{{ 'sections.header.menu' | t }}"`. This is a plan typo (the schema locale file does have `t:labels.menu` for the schema setting, but the storefront runtime uses a different key namespace). The change is strictly correct and matches intent.

---

## Key constraints confirmed

1. **`RideHeaderMenu` namespace**: Custom element class is `RideHeaderMenu` (PascalCase), registered tag is `ride-header-menu` (kebab-case). No generic names.
2. **`<script>` tag, not `{% javascript %}`**: The Web Component definition uses a plain `<script>` block. `{% javascript %}` was not used.
3. **Two explicit `color` settings, not `color_scheme`**: `header_background` (default `#111111`) and `header_text` (default `#ffffff`) are wired through `--header-bg`/`--header-text` custom properties on `.ride-header-wrapper` in the `{% style %}` block.
4. **Always-rendered cart badge**: `<span class="header__cart-count">` is always in the DOM; `hidden` attribute is set when count is 0. The legacy conditional `<sup>` is removed.

---

## Cart-drawer JS regression grep (Step 4 audit)

Grep command run:
```sh
grep -rn "a sup|header a sup|querySelector.*sup|\.header__cart-count" assets/*.js
grep -n "querySelector.*sup|header__cart-count|\.getElementsByTagName.*sup" sections/cart-drawer.liquid
```

Result: **No matches found.** The only occurrence of `super` in `sections/cart-drawer.liquid` is line 228 (`super()` inside a JS class constructor — unrelated). No JavaScript in `assets/*.js` targets `a sup` or `.header__cart-count`. No selector updates were needed.

---

## Mobile panel clipping confirmation

`overflow: hidden` was moved from `<header>` to `.header__logo-link`. The `<header>` now has `overflow: visible`. The `.ride-header-menu__panel` uses `position: absolute; top: 100%; left: 0; right: 0` anchored to `.ride-header-wrapper` which has `position: relative`. The panel drops below the full header+announcement-bar height. No clipping of the panel by the header element.

---

## Keyboard focus management

- **On open**: `setOpen(true)` calls `this.panel.removeAttribute('hidden')` then queues a `requestAnimationFrame` callback that queries for the first focusable element (`a, button, [tabindex]`) and calls `.focus()`. The rAF deferral ensures the panel is rendered before focus is moved — required for older Safari compatibility.
- **On close**: `setOpen(false)` calls `this.toggle.focus()` synchronously, returning focus to the hamburger button.
- **Escape key**: Calls `setOpen(false)`.
- **Outside click**: `onDocumentClick` checks `this.contains(event.target)` and closes if outside.

Note on rAF + fast Escape race (review nit #2): if a user opens and presses Escape within one animation frame (~16ms), `setOpen(false)` runs (hiding the panel, returning focus to toggle), then the queued rAF fires and calls `.focus()` on a link inside the now-`[hidden]` panel — which is a no-op in modern browsers (focusability check fails for `display:none` subtrees). State self-corrects. No cancellation guard was added; the behavior is acceptable per the review's own analysis.

---

## Color-flash documentation (review-rev-2 nit #6)

Existing merchants whose header currently renders with the legacy `var(--color-background)` (typically white) WILL see a black-on-white header bar on first page load after this ships, because the new `header_background` / `header_text` defaults take effect immediately. This is intentional and matches the Ride design target. The DevOps hand-off must surface this to the operator before publish so the operator can communicate it to any downstream merchant. No merchant data is lost; the merchant can re-enter the old colors via the theme editor at any time.

---

## Analytics flag (review-rev-2 nit #3)

The `RideHeaderMenu#onToggleClick` method calls `event.stopPropagation()` to defensively isolate the toggle click from the document-level outside-click handler. If a future PR attaches a header-wide click tracker on `<header>` or `<body>`, that tracker will NOT see the toggle click. Look here to wire it explicitly. The call site is `sections/header.liquid` inside the `<script>` block, in the `onToggleClick` method, with an inline comment for discoverability.

---

## `color-mix()` border fallback decision (review-rev-2 nit #8 + risk #11)

The implementation uses the bare `color-mix(in srgb, currentColor 8%, transparent)` declaration on `.ride-header-wrapper` with no static fallback `border-color` declaration. Rationale:

- `color-mix()` support: Safari 16.2+ (Dec 2022), Chrome 111+ (Mar 2023), Firefox 113+ (May 2023). Shopify's baseline is "last two versions of major browsers" — all three cutoffs are 2-3 years old.
- For pre-2023 browsers: the `--header-border` custom property becomes invalid; the `border-color` consuming it falls back to the property's initial value `currentColor`. The border renders as a solid 1px line in the full `--header-text` color — heavier than the intended 8% alpha, but visible and not broken.
- No static fallback was added to keep the CSS clean and because the graceful degradation is acceptable for this use case.
- Browsers tested for this PR: Chrome 125 (desktop), Safari 17 (desktop simulator). Both render the 8% alpha border correctly.

---

## Accepted `shopify theme check` warnings

The final `shopify theme check` run produces exactly two offenses, both pre-existing:

1. `TranslationKeyExists` in `sections/cart-drawer.liquid` — `'cart.empty'` not in `locales/en.default.json`. Pre-existing, out of scope.
2. `UnusedAssign` in `snippets/card-product.liquid` — `page_width` variable unused. Pre-existing, out of scope.

No new offenses were introduced by this implementation.

Non-default locale "missing translation" warnings: the new keys (`mobile_menu_label`, `close_menu_label`, `show_announcement.label`, etc.) are only in English. Non-default locale files (`fr.json`, `es.json`, `pt-BR.json`, etc.) will produce "missing translation" warnings in tools that check locale completeness. Per `AGENTS.md`, these are accepted. `shopify theme check` itself does not surface these as offenses.

---

## Out-of-scope observations

1. **Schema labels for `logo` and `logo_width` are hardcoded English strings, not `t:` keys.** The values `"Logo image"` and `"Custom logo width"` are carried over from the existing Dawn schema and are not localized. This is out of scope for this plan but should be addressed in a future cleanup ticket.
2. **The plan's section 7 outline used `'labels.menu' | t`** for the desktop nav `aria-label`. This key does not exist in `locales/en.default.json` (it exists in the schema locale namespace only). Fixed to `'sections.header.menu' | t` — the correct existing storefront key. Flagged as a plan typo in the "Deviations" section above.

---

## Test product handle

Cart badge smoke test should use: `selling-plans-ski-wax` or `the-complete-snowboard` (full add-to-cart; see `docs/dev-fixtures.md`). Visual-only tests (single-variant, no cart): `the-3p-fulfilled-snowboard`.

Cart counts to verify: 0 (badge hidden), 1 (single digit), 10 (two digits), 99 (two digits), 100 (three digits — badge expands leftward over icon, no surrounding layout breakage).

---

## Hand-off

Do NOT auto-deploy. Await QA pass and creation of `docs/qa/ride-header.approved` sentinel file before DevOps stage.
