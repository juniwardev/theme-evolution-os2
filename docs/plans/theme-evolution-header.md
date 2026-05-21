# Plan: Theme Evolution header enhancement

Slug: `theme-evolution-header`
Architect: Junior Warner
Date: 2026-05-20
Revision: 3 (folds review-rev-2 nits #1, #2, #3, #4, #5/#7, #6, #8 into the plan; nit #9 consciously skipped — see "Revision 3 changelog" below)

---

## Revision 3 changelog

Nits applied from `docs/reviews/theme-evolution-header-review.md` (Revision 2, verdict APPROVE):

- **Nit #1 (role="status" → role="note") — APPLIED.** Section 4.2, section 7 Liquid outline, section 8 storefront locale notes, section 10 step 3, and Appendix B updated. A static, server-rendered marketing strip should not be a live region; `role="note"` is the correct ancillary-information semantic.
- **Nit #2 (`requestAnimationFrame` wrapper around `firstFocusable.focus()`) — APPLIED.** Section 4.3 and section 7 `<script>` outline updated. Defensive against older Safari quirks where `focus()` on a freshly-unhidden element can no-op.
- **Nit #3 (`stopPropagation()` analytics flag) — APPLIED.** Section 10 step 8 impl-notes checklist now requires the Coder to flag the `event.stopPropagation()` call so any future header-wide click-tracking PR knows where to look.
- **Nit #4 (future color-scheme-system migration cost) — APPLIED.** Section 9 risks gains a new entry #10 acknowledging that the two loose `color` settings will need migration if a Dawn-style `color_scheme_group` is introduced later.
- **Nit #5 (Color header divider between menu and color settings) + Nit #7 (reuse existing `header__1.content` key) — APPLIED TOGETHER.** Section 6 schema gains a `{ "type": "header", "content": "t:sections.header.settings.header__1.content" }` divider before `header_background`. Section 8's merged locale block already includes `header__1.content` ("Color"); no new locale key needed. Section 10 step 2 updated.
- **Nit #6 (color flash for existing stores on first open) — APPLIED.** Section 9 risk #1 expanded to call out the visual change for merchants who had the old `var(--color-background)` (typically white) header. Section 10 step 8 impl-notes checklist now requires the Coder to document this in impl-notes so the DevOps hand-off can surface it to the operator. The plan does NOT change the defaults (still `#111111` / `#ffffff`) — the Ride dark-bar design is the intent, and a runtime Liquid fallback to `settings.background_color` would defeat that intent.
- **Nit #8 (hardcoded `rgba(255,255,255,0.08)` borders assume dark bg) — APPLIED.** Section 7 `{% stylesheet %}` updated to switch both `.theme-evolution-announcement-bar` border and `.theme-evolution-header-menu__panel` border from `rgba(255, 255, 255, 0.08)` to a `--header-border` CSS custom property derived from `currentColor` (which inherits from `--header-text`). This keeps the separator visible regardless of the merchant's color choice.

Nit consciously skipped:

- **Nit #9 (`disconnectedCallback` belt-and-braces) — SKIPPED.** The reviewer concluded the existing code is already correct ("removing a non-attached listener is a no-op per the DOM spec. Fine."). No action requested. Including a no-op refactor would expand scope without benefit.

---

## 1. Problem statement and goals

The existing `sections/header.liquid` is a minimalist Dawn-derived nav: a flex row containing the logo, a `link_list`-driven menu, and the cart/account icons. Its color is hardcoded (`background-color: var(--color-background)`) so merchants cannot adjust the bar's tone from the theme editor, there is no mobile hamburger menu, and the cart count badge only exists when there is at least one item in the cart. None of this matches the Ride design's dark sticky nav with an announcement strip above it and uppercase, letter-spaced link typography.

Per the Ride homepage roadmap (`docs/plans/theme-evolution-homepage-phases.md` § Feature 1), this is a Tier 2 enhancement that **extends** `sections/header.liquid` rather than introducing a new section file. The section is referenced by the layout (`layout/theme.liquid`) and merchant-saved settings in `config/settings_data.json`, so introducing a new section file would force merchants to re-add and re-configure the header — unacceptable.

### Goals

1. Make the header bar color merchant-configurable via two explicit `color` schema settings (`header_background` and `header_text`) wired through CSS custom properties on `.theme-evolution-header-wrapper`. Defaults (`#111111` background, `#ffffff` text) match the Ride dark-bar design out of the box. This approach is verified-working against this codebase, which lacks the Dawn per-scheme CSS infrastructure that a `color_scheme` setting would require (see plan-review blocker #1 and section 9 risk #2).
2. Add an optional announcement bar that renders above the header when enabled. The bar is text-only (single string) and inherits the header's color tokens via the same CSS custom properties.
3. Add a mobile hamburger toggle. The toggle is a Web Component named `ThemeEvolutionHeaderMenu`. It is rendered only at mobile breakpoints (CSS-gated) and toggles a `data-menu-open` attribute that swaps the nav between a slide-down panel and a hidden state. The component uses a standard `<script>` tag because the toggle is conditionally active only when the hamburger is in the DOM, and `{% javascript %}` cannot be gated inside Liquid logic.
4. Improve nav link typography to match the Ride design: uppercase, letter-spaced, slightly heavier weight.
5. Always render the cart count badge element so the layout is stable on the first item add. The badge starts hidden (no number) and surfaces the count via the `data-count` attribute and the existing `sections.header.cart_count` translation strings (which already use pluralized one/other forms — see `locales/en.default.json:142-148`).
6. Conform to every project-specific directive in `CLAUDE.md` / `AGENTS.md`: no `{% include %}`, namespaced Web Component (`ThemeEvolutionHeaderMenu`), static CSS in `{% stylesheet %}`, dynamic Liquid-driven CSS in a top-level `{% style %}` block (never inside `{% if %}`), explicit `width`/`height` on the logo `<img>`, sentence case for merchant copy, locale keys only in `locales/en.default.json` and `en.default.schema.json`, and schema validation against `schemas/section.json`.

## 2. Non-goals

- **Not** a refactor of `layout/theme.liquid` or any template JSON. The section keeps the same handle (`header`), so the layout's `{% sections 'header-group' %}` or `{% section 'header' %}` reference (whichever the layout uses) is unaffected.
- **Not** a swap to a section-groups architecture for the header. The roadmap calls for in-place enhancement of `sections/header.liquid`; section-group migration is out of scope.
- **Not** a re-design of the cart drawer. The cart link continues to honor `settings.enable_cart_drawer` and emit `data-cart-drawer-trigger` exactly as it does today.
- **Not** a mega-menu or drawer-navigation implementation. The mobile menu is a simple toggle that shows/hides the existing `link_list` items in a panel. Multi-level menus, nested `links` traversal, and search inside the drawer are explicitly out of scope.
- **Not** a sticky-on-scroll, sticky-on-scroll-up, or "shrink on scroll" behavior. The header is already `position: sticky; top: 0`; no JS-driven sticky logic is added.
- **Not** introducing blocks. The roadmap is explicit: the header does not need blocks — the nav is driven by a `link_list` setting, not by merchant-composable blocks. (See `docs/plans/theme-evolution-homepage-phases.md` line 79.)
- **Not** editing `config/settings_data.json` or `templates/*.json` (merchant-controlled per `CLAUDE.md`).
- **Not** editing any non-default locale file (`locales/fr.json`, `locales/es.json`, etc., per `AGENTS.md`).
- **Not** adding a logo `loading` setting or a sticky-style select. The schema gains only the four settings listed in section 6 (plus a header divider); everything else stays as it is today.
- **Not** introducing Dawn-style per-scheme infrastructure (`color_scheme_group` in `config/settings_schema.json`, `.color-scheme-N { --color-background: ... }` blocks in `snippets/css-variables.liquid` or new always-loaded CSS). That is a separate, larger-scope ticket and is intentionally deferred.

## 3. Audit of existing `sections/header.liquid`

The file is 147 lines. Findings (line references are to the current `sections/header.liquid`):

| Concern | Current state | Lines |
| --- | --- | --- |
| Color of the nav bar | Hardcoded `background-color: var(--color-background)` | 55 |
| Cart badge | `<sup>{{ cart.item_count }}</sup>` rendered only inside `{% if cart.item_count > 0 %}` — no element exists when cart is empty, so adding the first item causes a layout shift | 33-35 |
| Mobile hamburger | None | n/a |
| Announcement bar | None | n/a |
| Menu typography | Plain `link_to` output, no uppercase / letter-spacing | 20-23 |
| Logo `<img>` dimensions | Pass `width: section.settings.logo_width` to `image_tag` but **no `height`** — relies on the browser to compute aspect ratio from the source image, which can flash CLS before the responsive `srcset` lands | 6-12 |
| Schema settings | `logo` (image_picker), `logo_width` (range), `menu` (link_list) — three settings, no color settings, no announcement strings | 124-145 |
| Dynamic CSS | `{% style %}` block sets `--logo-width` from `section.settings.logo_width` (already top-level, not inside Liquid logic — good) | 42-46 |
| Static CSS | `{% stylesheet %}` block sets sticky positioning, flex layout, icon sizes | 48-118 |
| Account icon | Renders only when `shop.customer_accounts_enabled` — keep as-is | 26-30 |
| Cart link | Renders `data-cart-drawer-trigger` when `settings.enable_cart_drawer` — keep as-is | 32 |
| Translation usage | Section is mostly icon-driven; the existing `sections.header.cart_count.one`/`other` pluralization in `locales/en.default.json` is not currently used by the file but exists for reuse | n/a / locales:142-148 |

### Reuse opportunities

- `assets/icon-hamburger.svg` already exists. The Web Component button can render it via `{{ 'icon-hamburger.svg' | inline_asset_content }}` exactly as the cart and account icons do today (lines 28, 37). No new SVG asset is needed.
- `assets/icon-close.svg` exists for the "close menu" state.
- The plan-review confirmed no `color_scheme_group` exists in `config/settings_schema.json` and no `.color-scheme-N { ... }` blocks redefine `--color-background` anywhere in the codebase. The `sections/related-products.liquid:140` `color_scheme` setting in this theme is a latent no-op for the same reason. We therefore do **not** copy that pattern. Instead we use two explicit `color` settings wired through CSS custom properties — see section 4.1.
- The existing Dawn-era schema-locale key `sections.header.settings.header__1.content` (value `"Color"`) is reused as the divider label between the menu setting and the new color settings — see section 6 and section 8.

## 4. Design decisions

### 4.1 Header color — two explicit `color` settings via CSS custom properties

Add two `color` schema settings: `header_background` (label "Header background color", default `"#111111"`) and `header_text` (label "Header text color", default `"#ffffff"`). The defaults reproduce the Ride dark-bar design out of the box.

Wire both through the top-level `{% style %}` block as CSS custom properties on `.theme-evolution-header-wrapper`:

```liquid
{% style %}
  .section-header {
    --logo-width: {{ section.settings.logo_width }}px;
  }
  .theme-evolution-header-wrapper {
    --header-bg: {{ section.settings.header_background }};
    --header-text: {{ section.settings.header_text }};
  }
{% endstyle %}
```

Then in the static `{% stylesheet %}` block, the `.theme-evolution-header-wrapper` rule consumes them:

```css
.theme-evolution-header-wrapper {
  background-color: var(--header-bg);
  color: var(--header-text);
}
```

Child elements (`.header__menu a`, `.theme-evolution-header-menu__link`, etc.) inherit `color` naturally. The legacy `var(--color-background)` / `var(--color-foreground)` references on child elements (icon hover states, etc.) are kept intact — we only change the wrapper rule. This change is therefore additive on the wrapper and non-destructive on children.

Rationale: this is the smallest change that actually works in this codebase (plan-review blocker #1). It does not depend on Dawn's scheme infrastructure, which is absent. It uses the `CLAUDE.md`-endorsed "single property -> CSS variable" pattern. Merchants who previously relied on the hardcoded `--color-background` behavior can still match it by entering their global background color into the new setting; no merchant data is silently lost.

### 4.2 Announcement bar

A single text setting (`announcement_text`) plus a toggle (`show_announcement`). When the toggle is on AND the text is non-blank, render a `<div class="theme-evolution-announcement-bar">` above the `<header>` element. The bar inherits the header's color tokens via `var(--header-bg)` / `var(--header-text)` — no separate color settings. Text is HTML-escaped on output. The bar is server-rendered Liquid only; no JS, no carousel, no dismiss-and-remember. Future expansion (multiple announcements, auto-rotate) would be a separate plan or a migration to the existing `sections/announcement-bar.liquid` Dawn section.

The bar uses `role="note"` — the WAI-ARIA semantic for ancillary, supplementary information. We deliberately do NOT use `role="status"` (a live region intended for dynamic, polite announcements such as "5 items added to cart"). The announcement strip is server-rendered once at page load and never updates client-side, so a live-region semantic would be misleading and could cause some screen readers to announce content on initial focus or region-traversal that is otherwise visually static (review-rev-2 nit #1). The `announcement_label` storefront locale key proposed in revision 1 remains dropped; `role="note"` does not require an accessible name.

If a future iteration introduces client-side dismiss-and-remember or auto-rotation, that ticket should re-evaluate the role (and likely promote it to `role="status"` or wrap the dynamic portion in its own live region).

The bar is part of the header section's render output (not a separate section) so that the existing sticky positioning encompasses both the announcement and the nav bar as a single sticky unit. This avoids the announcement scrolling away while the nav stays — a UX inconsistency the Ride design does not show.

### 4.3 Mobile hamburger menu — Web Component

The toggle is a Web Component, namespaced **`ThemeEvolutionHeaderMenu`** per `CLAUDE.md`'s namespace-collision rule (never `HeaderMenu`, `MobileMenu`, etc.).

**Panel-clipping fix (plan-review required change #4):** the current `sections/header.liquid` sets `header { overflow: hidden; }` (line 62) so any absolutely-positioned panel rendered as a descendant of `<header>` would be clipped. We resolve this by **moving `overflow: hidden` off `<header>` and onto `.header__logo-link` only** — the original comment on the existing rule said its purpose was "Ensures any overflowing image gets clipped", which only ever applied to the logo. `<header>` becomes `overflow: visible`. With that change, the `<theme-evolution-header-menu>` element can stay inside `.header__icons` (preserving the simple `aria-controls` wiring) and its `position: absolute; top: 100%; left: 0; right: 0;` panel can drop below the bar without clipping.

Markup (panel anchored relative to `.theme-evolution-header-wrapper`, which becomes `position: relative` in `{% stylesheet %}`):

```html
<theme-evolution-header-menu>
  <button
    type="button"
    class="theme-evolution-header-menu__toggle header__icon"
    aria-expanded="false"
    aria-controls="theme-evolution-header-menu-panel-{{ section.id }}"
  >
    <span class="visually-hidden" data-label-open="..." data-label-close="...">{{ mobile_menu_label }}</span>
    <span class="theme-evolution-header-menu__icon theme-evolution-header-menu__icon--open">{{ 'icon-hamburger.svg' | inline_asset_content }}</span>
    <span class="theme-evolution-header-menu__icon theme-evolution-header-menu__icon--close">{{ 'icon-close.svg' | inline_asset_content }}</span>
  </button>
  <div
    id="theme-evolution-header-menu-panel-{{ section.id }}"
    class="theme-evolution-header-menu__panel"
    data-state="closed"
    hidden
  >
    {%- for link in section.settings.menu.links -%}
      <a href="{{ link.url }}" class="theme-evolution-header-menu__link">{{ link.title | escape }}</a>
    {%- endfor -%}
  </div>
</theme-evolution-header-menu>
```

Behavior on click:

- Call `event.stopPropagation()` so the toggle click does not immediately bubble to the document-level outside-click handler.
- Toggle `aria-expanded` on the button (`true` / `false`).
- Toggle the `hidden` attribute and the `data-state` value on the panel (`open` / `closed`).
- Close on `Escape` keypress and when the user clicks outside the component.
- Update the button's accessible label between `mobile_menu_label` and `close_menu_label` so the icon swap (hamburger → close) is announced (the icon swap itself is CSS-driven via the `[aria-expanded="true"]` selector).

**Keyboard focus management (plan-review required change #5):**

- On open: after removing `hidden` from the panel, find the first focusable child (`this.panel.querySelector('a, button, [tabindex]')`) and call `.focus()` on it so keyboard users land inside the menu immediately. **Wrap the `.focus()` call in `requestAnimationFrame(...)`** (review-rev-2 nit #2). When `hidden` is just removed, some browsers (notably older Safari) treat the element as not yet laid out, so a synchronous `.focus()` can no-op. Deferring the call by one animation frame guarantees the element is rendered and focusable.
- On close: call `this.toggle.focus()` so focus returns to the trigger, matching standard disclosure-widget keyboard contract.

Use a standard `<script>` tag at the bottom of the section file. Per `CLAUDE.md`'s JS directive: *"If you need to output JS dynamically inside an `if` block, or you are experiencing bundler failures where the JS is not propagating, use standard inline `<script>` tags to guarantee execution in the DOM."* The hamburger is only rendered in markup when a `link_list` is configured (we guard with `{% if section.settings.menu != blank %}` so empty menus do not produce an empty drawer), so the JS is conditionally relevant. Using `{% javascript %}` would also work for a custom-element definition (since the definition is idempotent and harmless even when no instance exists), but the project standard above explicitly prefers `<script>` for the conditional case. Define the class with a guard:

```js
if (!customElements.get('theme-evolution-header-menu')) {
  customElements.define('theme-evolution-header-menu', class extends HTMLElement { /* ... */ });
}
```

The guard prevents `NotSupportedError` if the section is rendered twice on a page (defensive — the header should appear only once, but theme-editor preview re-renders can double-execute the script).

CSS gates the toggle button to mobile breakpoints (`display: none` at `min-width: 750px`, the same breakpoint other sections in this theme use). On desktop the regular inline nav is visible; on mobile the toggle replaces it.

### 4.4 Nav typography

Apply uppercase + letter-spacing to `.header__menu a` (and to the mobile panel's `.theme-evolution-header-menu__link`). Use CSS only — no schema setting for typography. The design calls for a single typographic treatment; making it merchant-configurable adds knobs without value.

```css
.header__menu a,
.theme-evolution-header-menu__link {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
  font-size: 0.85rem;
}
```

### 4.5 Cart badge — always render, and a deliberate repositioning

Replace the conditional `<sup>` with an always-rendered element. Set `hidden` when the count is zero so it occupies no visual space but is present in the DOM for any future JS that updates it (e.g., cart-drawer Ajax updates). Use the existing `sections.header.cart_count` plural keys for the accessible label:

```liquid
<span
  class="header__cart-count"
  data-count="{{ cart.item_count }}"
  {% if cart.item_count == 0 %}hidden{% endif %}
  aria-label="{{ cart_count_label | escape }}"
>{{ cart.item_count }}</span>
```

**This is a deliberate visual redesign matching the Ride design, not just a selector rename** (plan-review required change #3). The existing `header a sup` rule places the badge to the *right* of the cart link (`left: 100%`). The new `.header__cart-count` rule repositions the badge as an overlay on the icon (`top: 0.6rem; right: 0.6rem`). These are two different visual positions. The old `header a sup` rule is removed; the new `.header__cart-count` rule replaces it.

The "no layout shift" claim depends on the new positioning being absolute (taking the badge out of normal flow) and the badge element being present in the DOM at all times. Both conditions hold with this implementation.

Edge case: three-digit counts. The badge has `min-width: 1.4rem; padding: 0 0.4rem`. At cart count 100 it expands leftward over the icon (since it is anchored at `right: 0.6rem`). QA must visually verify counts 0, 1, 10, 99, 100 — see step 4 in section 10.

### 4.6 Sticky behavior

Already in place (`position: sticky; top: 0; z-index: 10` on `.section-header`). No change needed. The announcement bar lives inside the section wrapper, so it stays stuck to the top of the viewport with the rest of the header — desired.

### 4.7 Internal separator borders — derive from `--header-text`

The announcement bar's `border-bottom` and the mobile panel's `border-top` are subtle dividers. Hardcoding them as `rgba(255, 255, 255, 0.08)` would render invisibly on a light `header_background` (review-rev-2 nit #8). We define a `--header-border` custom property on `.theme-evolution-header-wrapper` that derives from `currentColor` (which inherits from `--header-text`), then both rules consume it:

```css
.theme-evolution-header-wrapper {
  /* --header-border: derived from text color so it remains visible on any background */
  --header-border: color-mix(in srgb, currentColor 8%, transparent);
}
.theme-evolution-announcement-bar {
  border-bottom: 1px solid var(--header-border);
}
.theme-evolution-header-menu__panel {
  border-top: 1px solid var(--header-border);
}
```

`color-mix()` has broad modern-browser support (Safari 16.2+, Chrome 111+, Firefox 113+). Acceptable for this theme. If a Coder concern about `color-mix()` support surfaces, a fallback declaration of `border-color: rgba(128, 128, 128, 0.2)` immediately before the `var(--header-border)` declaration is acceptable as a graceful-degradation path — document the decision in impl-notes.

## 5. Affected files and modules

### Files to edit

| Path | Change |
| --- | --- |
| `sections/header.liquid` | Extend Liquid markup (add announcement bar with `role="note"`, hamburger Web Component, always-present cart badge), `{% stylesheet %}` block (typography, hamburger, panel, badge, move `overflow: hidden` from `<header>` to `.header__logo-link`, replace wrapper background rule with `var(--header-bg)`/`var(--header-text)`, define `--header-border` and consume it in announcement-bar / panel borders), `{% style %}` block (add `--header-bg` and `--header-text` custom properties on `.theme-evolution-header-wrapper`), and `{% schema %}` block (new `header_background`, `header_text`, `announcement_text`, `show_announcement` settings + reused `header__1` Color divider). Append a top-level `<script>` block for the `ThemeEvolutionHeaderMenu` custom element. |
| `locales/en.default.json` | Add `sections.header.mobile_menu_label`, `sections.header.close_menu_label`. (No `announcement_label` — see section 4.2.) |
| `locales/en.default.schema.json` | Add `sections.header.headers.announcement.content`, `sections.header.settings.show_announcement.label`, `sections.header.settings.announcement_text.label`, `sections.header.settings.announcement_text.info`, `sections.header.settings.header_background.label`, `sections.header.settings.header_text.label`. All existing Dawn-era keys preserved (including `header__1.content` which is reused as the Color-section divider label). See section 8 for the complete merged JSON. |

### Files explicitly NOT edited

| Path | Reason |
| --- | --- |
| `layout/theme.liquid` | Section handle is unchanged (`header`); the layout's reference still resolves. |
| `templates/*.json` | Merchant-controlled per `CLAUDE.md`. |
| `config/settings_data.json` | Merchant-controlled. New settings (`header_background`, `header_text`, `show_announcement`, `announcement_text`) populate with their defaults the first time the merchant opens the header in the theme editor; no manual data file edit is needed. |
| `config/settings_schema.json` | We are NOT adding a `color_scheme_group` — see section 4.1 and the explicit non-goal at the bottom of section 2. |
| `snippets/css-variables.liquid` | We are NOT extending it to emit per-scheme `.color-scheme-N { ... }` blocks — same non-goal. |
| `locales/*.json` (non-English) | Per `AGENTS.md`: non-default locale files are managed by translators. The Coder must accept any "missing translation" warnings from `shopify theme check` for the new keys and list them in the impl-notes. |
| `assets/*.css` / `assets/*.js` | Per the asset-location rule, all new CSS lives in the section's `{% stylesheet %}` block and all new JS lives in a `<script>` block in the section file. Nothing is added to `assets/`. |
| `sections/announcement-bar.liquid` | The Dawn-provided announcement bar is a separate section with blocks, carousel, country selector, etc. We are intentionally NOT migrating to or modifying it — the Ride design only needs a single-line static strip, and embedding it in the header section (rather than as its own section above the header) keeps it inside the sticky region. |
| `snippets/icon-*.svg` references | Continue inlining via `{{ 'icon-NAME.svg' | inline_asset_content }}` — the existing pattern. No new icon files needed (`icon-hamburger.svg` and `icon-close.svg` are already in `assets/`). |

## 6. Schema proposal (full JSON, replacing the existing `{% schema %}` block)

```json
{
  "name": "t:general.header",
  "class": "section-header",
  "settings": [
    {
      "type": "image_picker",
      "id": "logo",
      "label": "Logo image"
    },
    {
      "type": "range",
      "id": "logo_width",
      "min": 50,
      "max": 300,
      "step": 10,
      "default": 150,
      "unit": "px",
      "label": "Custom logo width"
    },
    {
      "type": "link_list",
      "id": "menu",
      "label": "t:labels.menu"
    },
    {
      "type": "header",
      "content": "t:sections.header.settings.header__1.content"
    },
    {
      "type": "color",
      "id": "header_background",
      "label": "t:sections.header.settings.header_background.label",
      "default": "#111111"
    },
    {
      "type": "color",
      "id": "header_text",
      "label": "t:sections.header.settings.header_text.label",
      "default": "#ffffff"
    },
    {
      "type": "header",
      "content": "t:sections.header.headers.announcement.content"
    },
    {
      "type": "checkbox",
      "id": "show_announcement",
      "label": "t:sections.header.settings.show_announcement.label",
      "default": false
    },
    {
      "type": "text",
      "id": "announcement_text",
      "label": "t:sections.header.settings.announcement_text.label",
      "info": "t:sections.header.settings.announcement_text.info"
    }
  ]
}
```

### Schema notes

- **Setting order preservation.** The existing three settings (`logo`, `logo_width`, `menu`) keep their position and types. Per `AGENTS.md` Coder guidance: *"Section and block schema JSON must round-trip cleanly through the theme editor — preserve `presets`, `blocks`, and `settings` types and order when editing existing schemas."* New settings (and the two header dividers) are appended.
- **No `presets`.** The existing schema has no `presets` array because the header section is not merchant-droppable — it lives in the layout. Do not add a `presets` array.
- **No `enabled_on` / `disabled_on`.** Same reason — the section is layout-controlled, not template-controlled.
- **Two `color` settings, not `color_scheme`.** Per plan-review blocker #1 — see section 4.1 for full rationale.
- **Color section divider reuses existing `header__1.content` Dawn key.** Its value is the string `"Color"` (review-rev-2 nits #5 and #7). No new locale key is created for this divider; the key has been present in `locales/en.default.schema.json` since the original Dawn theme.
- **`header_background` default `"#111111"` and `header_text` default `"#ffffff"`.** Reproduces the Ride dark-bar design on first load. Note: existing merchants who had the old `var(--color-background)` (typically white) header will see a black bar on first page load after deploy — see section 9 risk #1.
- **No `blocks` array.** Confirmed by the roadmap (line 79): the nav is driven by `link_list`, not blocks.
- **`announcement_text` is plain `text`, not `richtext`.** A single line of plain text is sufficient for the announcement strip in the Ride design. Allowing rich text would invite merchants to paste paragraph-length content, which would break the thin-strip layout.
- **`show_announcement` defaults to `false`.** Merchants opt in; existing stores see no visual change in the announcement strip area (but see section 9 risk #1 re color defaults).

Schema must validate cleanly against `schemas/section.json`. The Coder confirms with `shopify theme check`.

## 7. Liquid template outline for `sections/header.liquid`

This is the proposed structure. Comments mark key decisions and reference section numbers above. The file remains in `sections/header.liquid` (no new file).

```liquid
{%- liquid
  assign show_announcement = section.settings.show_announcement
  assign announcement_text = section.settings.announcement_text
  assign has_menu = false
  if section.settings.menu != blank and section.settings.menu.links.size > 0
    assign has_menu = true
  endif
  assign cart_count_label = 'sections.header.cart_count' | t: count: cart.item_count
  assign mobile_menu_label = 'sections.header.mobile_menu_label' | t
  assign close_menu_label = 'sections.header.close_menu_label' | t
-%}

<div class="theme-evolution-header-wrapper">
  {%- if show_announcement and announcement_text != blank -%}
    <div class="theme-evolution-announcement-bar" role="note">
      <p class="theme-evolution-announcement-bar__text">{{ announcement_text | escape }}</p>
    </div>
  {%- endif -%}

  <header>
    <h2 class="header__title">
      <a href="{{ routes.root_url }}" class="header__logo-link">
        {%- if section.settings.logo != blank -%}
          {%- assign logo_alt = section.settings.logo.alt | default: shop.name | escape -%}
          {%- assign logo_height = section.settings.logo_width | times: section.settings.logo.height | divided_by: section.settings.logo.width -%}
          {{
            section.settings.logo
            | image_url: width: section.settings.logo_width
            | image_tag:
                class: 'header__logo',
                widths: '50, 100, 150, 200, 250, 300, 400, 500',
                width: section.settings.logo_width,
                height: logo_height,
                alt: logo_alt,
                loading: 'eager'
          }}
        {%- else -%}
          <span class="h2">{{ shop.name }}</span>
        {%- endif -%}
      </a>
    </h2>

    {%- if has_menu -%}
      <div class="header__menu" aria-label="{{ 'labels.menu' | t }}">
        {%- for link in section.settings.menu.links -%}
          <a href="{{ link.url }}">{{ link.title | escape }}</a>
        {%- endfor -%}
      </div>
    {%- endif -%}

    <div class="header__icons">
      {%- if has_menu -%}
        <theme-evolution-header-menu class="header__mobile-toggle">
          <button
            type="button"
            class="theme-evolution-header-menu__toggle header__icon"
            aria-expanded="false"
            aria-controls="theme-evolution-header-menu-panel-{{ section.id }}"
          >
            <span
              class="visually-hidden"
              data-label-open="{{ mobile_menu_label | escape }}"
              data-label-close="{{ close_menu_label | escape }}"
            >{{ mobile_menu_label | escape }}</span>
            <span class="theme-evolution-header-menu__icon theme-evolution-header-menu__icon--open">{{ 'icon-hamburger.svg' | inline_asset_content }}</span>
            <span class="theme-evolution-header-menu__icon theme-evolution-header-menu__icon--close">{{ 'icon-close.svg' | inline_asset_content }}</span>
          </button>
          <div
            id="theme-evolution-header-menu-panel-{{ section.id }}"
            class="theme-evolution-header-menu__panel"
            data-state="closed"
            hidden
          >
            {%- for link in section.settings.menu.links -%}
              <a href="{{ link.url }}" class="theme-evolution-header-menu__link">{{ link.title | escape }}</a>
            {%- endfor -%}
          </div>
        </theme-evolution-header-menu>
      {%- endif -%}

      {% if shop.customer_accounts_enabled %}
        <a href="{{ routes.account_url }}" class="header__icon header__icon--account">
          {{ 'icon-account.svg' | inline_asset_content }}
        </a>
      {% endif %}

      <a
        href="{{ routes.cart_url }}"
        class="header__icon header__icon--cart"
        {% if settings.enable_cart_drawer %}data-cart-drawer-trigger{% endif %}
        aria-label="{{ cart_count_label | escape }}"
      >
        <span
          class="header__cart-count"
          data-count="{{ cart.item_count }}"
          {% if cart.item_count == 0 %}hidden{% endif %}
          aria-label="{{ cart_count_label | escape }}"
        >{{ cart.item_count }}</span>
        {{ 'icon-cart.svg' | inline_asset_content }}
      </a>
    </div>
  </header>
</div>

{% style %}
  .section-header {
    --logo-width: {{ section.settings.logo_width }}px;
  }
  .theme-evolution-header-wrapper {
    --header-bg: {{ section.settings.header_background }};
    --header-text: {{ section.settings.header_text }};
  }
{% endstyle %}

{% stylesheet %}
  /* --- sticky + wrapper colors (decision 4.1 + 4.6 + 4.7) --- */
  .section-header {
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .theme-evolution-header-wrapper {
    position: relative; /* containing block for the absolutely-positioned mobile panel */
    background-color: var(--header-bg);
    color: var(--header-text);
    /* Decision 4.7: derive internal separator color from currentColor (which inherits --header-text)
       so dividers remain visible regardless of the merchant's chosen header_background. */
    --header-border: color-mix(in srgb, currentColor 8%, transparent);
  }

  /* --- header bar layout (overflow moved off of <header> per decision 4.3) --- */
  header {
    height: 4rem;
    max-height: 4rem;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    overflow: visible; /* was: hidden; moved to .header__logo-link below */
  }
  header a {
    position: relative;
    text-decoration: none;
    color: inherit;
  }
  header svg {
    width: 2rem;
    height: 2rem;
  }
  .header__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.4rem;
    height: 4.4rem;
    color: inherit;
  }
  header .header__menu,
  header .header__icons {
    display: flex;
    align-items: center;
  }
  .header__icons {
    gap: 0;
  }
  .header__menu {
    gap: 1.5rem;
  }
  .header__title {
    margin: 0;
    line-height: 1;
  }
  .header__logo-link {
    display: flex;
    align-items: center;
    text-decoration: none;
    width: var(--logo-width, 150px);
    max-width: 40vw;
    height: 100%;
    overflow: hidden; /* clips overflowing logo image (was on <header>) */
  }
  .header__logo {
    display: block;
    height: 100%;
    width: 100%;
    object-fit: contain;
    object-position: left;
  }

  /* --- nav typography (decision 4.4) --- */
  .header__menu a,
  .theme-evolution-header-menu__link {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 600;
    font-size: 0.85rem;
  }

  /* --- announcement bar (decisions 4.2 + 4.7) --- */
  .theme-evolution-announcement-bar {
    padding: 0.5rem 2rem;
    text-align: center;
    border-bottom: 1px solid var(--header-border);
  }
  .theme-evolution-announcement-bar__text {
    margin: 0;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
  }

  /* --- cart count badge (decision 4.5) --- */
  .header__cart-count {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    min-width: 1.4rem;
    height: 1.4rem;
    padding: 0 0.4rem;
    border-radius: 999px;
    background-color: var(--header-text);
    color: var(--header-bg);
    font-size: 0.7rem;
    line-height: 1.4rem;
    font-weight: 700;
    text-align: center;
  }
  .header__cart-count[hidden] {
    display: none;
  }

  /* --- mobile menu toggle and panel (decisions 4.3 + 4.7) --- */
  .header__mobile-toggle {
    display: none;
  }
  .theme-evolution-header-menu__icon--close {
    display: none;
  }
  .theme-evolution-header-menu__toggle[aria-expanded="true"] .theme-evolution-header-menu__icon--open {
    display: none;
  }
  .theme-evolution-header-menu__toggle[aria-expanded="true"] .theme-evolution-header-menu__icon--close {
    display: inline-flex;
  }
  .theme-evolution-header-menu__panel {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--header-bg);
    color: var(--header-text);
    padding: 1.5rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    border-top: 1px solid var(--header-border);
  }
  .theme-evolution-header-menu__panel[hidden] {
    display: none;
  }
  .theme-evolution-header-menu__link {
    color: inherit;
    text-decoration: none;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* --- breakpoint gate: show inline menu desktop, hamburger mobile --- */
  @media screen and (max-width: 749px) {
    .header__menu {
      display: none;
    }
    .header__mobile-toggle {
      display: flex;
    }
  }
  @media screen and (min-width: 750px) {
    /* defensive: a panel left open on mobile must not leak onto desktop */
    .theme-evolution-header-menu__panel {
      display: none;
    }
  }
{% endstylesheet %}

<script>
  (function () {
    if (customElements.get('theme-evolution-header-menu')) return;

    class ThemeEvolutionHeaderMenu extends HTMLElement {
      constructor() {
        super();
        this.toggle = null;
        this.panel = null;
        this.label = null;
        this.onToggleClick = this.onToggleClick.bind(this);
        this.onKeydown = this.onKeydown.bind(this);
        this.onDocumentClick = this.onDocumentClick.bind(this);
      }

      connectedCallback() {
        this.toggle = this.querySelector('.theme-evolution-header-menu__toggle');
        this.panel = this.querySelector('.theme-evolution-header-menu__panel');
        this.label = this.querySelector('[data-label-open]');
        if (!this.toggle || !this.panel) return;
        this.toggle.addEventListener('click', this.onToggleClick);
        document.addEventListener('keydown', this.onKeydown);
        document.addEventListener('click', this.onDocumentClick);
      }

      disconnectedCallback() {
        if (this.toggle) this.toggle.removeEventListener('click', this.onToggleClick);
        document.removeEventListener('keydown', this.onKeydown);
        document.removeEventListener('click', this.onDocumentClick);
      }

      onToggleClick(event) {
        event.preventDefault();
        // Defensive: don't bubble to onDocumentClick. If a future header-wide click
        // tracker is attached to <header> or <body>, this stopPropagation() will
        // also prevent that tracker from seeing the toggle click. Document this
        // in impl-notes so the analytics PR knows where to look. (review-rev-2 nit #3)
        event.stopPropagation();
        var isOpen = this.toggle.getAttribute('aria-expanded') === 'true';
        this.setOpen(!isOpen);
      }

      onKeydown(event) {
        if (event.key === 'Escape') {
          this.setOpen(false);
        }
      }

      onDocumentClick(event) {
        if (this.toggle.getAttribute('aria-expanded') !== 'true') return;
        if (this.contains(event.target)) return;
        this.setOpen(false);
      }

      setOpen(open) {
        this.toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          this.panel.removeAttribute('hidden');
          this.panel.setAttribute('data-state', 'open');
          if (this.label) this.label.textContent = this.label.getAttribute('data-label-close');
          // Focus management (plan-review required change #5 + review-rev-2 nit #2):
          // Move focus into the panel. Defer one frame so the freshly-unhidden
          // panel is laid out before `.focus()` runs — older Safari can no-op
          // a synchronous focus on a just-unhidden element.
          var panel = this.panel;
          requestAnimationFrame(function () {
            var firstFocusable = panel.querySelector('a, button, [tabindex]');
            if (firstFocusable) firstFocusable.focus();
          });
        } else {
          this.panel.setAttribute('hidden', '');
          this.panel.setAttribute('data-state', 'closed');
          if (this.label) this.label.textContent = this.label.getAttribute('data-label-open');
          // Focus management: return focus to the trigger.
          if (this.toggle) this.toggle.focus();
        }
      }
    }

    customElements.define('theme-evolution-header-menu', ThemeEvolutionHeaderMenu);
  })();
</script>

{% schema %}
  ... (full JSON from section 6 above) ...
{% endschema %}
```

### Key points the Coder must preserve from this outline

- **The `{% style %}` block stays at the top level**, unchanged in its placement. It now sets two custom-property groups: `--logo-width` on `.section-header` and `--header-bg` / `--header-text` on `.theme-evolution-header-wrapper`. No Liquid logic wraps the `{% style %}` tag.
- **The `<script>` tag sits at the end of the section**, after `{% stylesheet %}` and before (or after) `{% schema %}`. It is plain HTML `<script>`, NOT `{% javascript %}`.
- **The custom-element class is named `ThemeEvolutionHeaderMenu`** (PascalCase) and registered as `theme-evolution-header-menu` (kebab-case). This satisfies the namespace-collision rule.
- **The `customElements.define` call is guarded by `if (customElements.get('theme-evolution-header-menu')) return;`** to prevent duplicate-definition errors in theme-editor preview.
- **`event.stopPropagation()` runs in `onToggleClick`** to defensively isolate the toggle click from the document handler.
- **`setOpen(true)` moves focus to the first focusable element in the panel via `requestAnimationFrame(...)`; `setOpen(false)` returns focus to the toggle.** The `requestAnimationFrame` wrapper guarantees the freshly-unhidden panel is laid out before `.focus()` runs.
- **The cart link uses `aria-label="{{ cart_count_label | escape }}"`** with the existing pluralized `sections.header.cart_count` translation. The badge `<span>` also gets `aria-label="{{ cart_count_label | escape }}"` for consistency. All `cart_count_label` interpolations are `| escape`-d (plan-review nit #9).
- **The logo `<img>` now passes an explicit `height`** computed from the source image's aspect ratio (`logo_width * source_height / source_width`). This satisfies the CLS directive in `CLAUDE.md`. `loading: 'eager'` is preserved.
- **`fetchpriority: 'high'` is NOT used on the logo** (plan-review required change #7). `fetchpriority: 'high'` is reserved for the true LCP element on each template (typically the hero image in another section). Promoting the logo's priority across all templates risks demoting the real LCP element.
- **All translated strings are pre-assigned via `{%- liquid ... -%}` and `assign ... | t`** before being interpolated. No inline `'key' | t` inside attribute values where it would be repeated.
- **`section.settings.menu.links.size > 0`** is the guard for "menu present". A blank `link_list` setting returns an object whose `links` array has size 0; checking both `!= blank` and `links.size > 0` covers both the unset-link-list and the empty-link-list cases.
- **The panel id is namespaced with `section.id`** so multiple instances on a page (theme-editor preview edge case) don't collide. The `aria-controls` attribute matches.
- **`overflow: hidden` is on `.header__logo-link`, NOT on `<header>`.** This frees the absolutely-positioned mobile panel to drop below the header bar without being clipped.
- **The announcement bar uses `role="note"`, NOT `role="status"`.** A static, server-rendered marketing strip is not a live region. (review-rev-2 nit #1)
- **`--header-border` is defined on `.theme-evolution-header-wrapper` via `color-mix(in srgb, currentColor 8%, transparent)`** and consumed by `.theme-evolution-announcement-bar` and `.theme-evolution-header-menu__panel`. This keeps separator borders visible on any header background. (review-rev-2 nit #8)

## 8. Locale keys to add

### `locales/en.default.json` (storefront strings)

Merge into the existing `sections.header` object (currently lines 142-149):

```json
{
  "sections": {
    "header": {
      "announcement": "Announcement",
      "menu": "Menu",
      "cart_count": {
        "one": "{{ count }} item",
        "other": "{{ count }} items"
      },
      "mobile_menu_label": "Open menu",
      "close_menu_label": "Close menu"
    }
  }
}
```

- `mobile_menu_label` is the accessible name of the toggle button when closed.
- `close_menu_label` is the accessible name when open (swapped via JS).
- No `announcement_label` key — the announcement bar uses `role="note"` which does not require an accessible name (plan-review required change #6 + review-rev-2 nit #1).

Sentence case throughout, per `CLAUDE.md`.

### `locales/en.default.schema.json` (theme-editor strings)

The existing `sections.header` block starts at line 941 and contains Dawn-era keys that may still be referenced by the theme editor or by `sections/header-drawer.liquid` etc. The Coder MUST NOT remove any of them. The full merged `sections.header` object after this change reads:

```json
{
  "sections": {
    "header": {
      "name": "Header",
      "headers": {
        "announcement": {
          "content": "Announcement bar"
        }
      },
      "settings": {
        "logo_help": {
          "content": "Edit your logo in [theme settings](/editor?context=theme&category=logo)"
        },
        "logo_position": {
          "label": "Logo position",
          "options__1": { "label": "Middle left" },
          "options__2": { "label": "Top left" },
          "options__3": { "label": "Top center" },
          "options__4": { "label": "Middle center" }
        },
        "menu": {
          "label": "Menu"
        },
        "menu_type_desktop": {
          "label": "Menu type",
          "options__1": { "label": "Dropdown" },
          "options__2": { "label": "Mega menu" },
          "options__3": { "label": "Drawer" }
        },
        "show_line_separator": {
          "label": "Separator line"
        },
        "header__1": {
          "content": "Color"
        },
        "menu_color_scheme": {
          "label": "Menu color scheme"
        },
        "sticky_header_type": {
          "label": "Sticky header",
          "options__1": { "label": "None" },
          "options__2": { "label": "On scroll up" },
          "options__3": { "label": "Always" },
          "options__4": { "label": "Always, reduce logo size" }
        },
        "header__utilities": {
          "content": "Utilities"
        },
        "enable_country_selector": {
          "label": "Country/region selector",
          "info": "[Manage countries/regions](/admin/settings/markets)"
        },
        "enable_language_selector": {
          "label": "Language selector",
          "info": "[Manage languages](/admin/settings/languages)"
        },
        "margin_bottom": {
          "label": "Bottom margin"
        },
        "mobile_logo_position": {
          "label": "Mobile logo position",
          "options__1": { "label": "Center" },
          "options__2": { "label": "Left" }
        },
        "enable_customer_avatar": {
          "label": "Customer account avatar",
          "info": "Only visible when customers are signed in with Shop. [Manage customer accounts](/admin/settings/customer_accounts)"
        },
        "show_announcement": {
          "label": "Show announcement bar"
        },
        "announcement_text": {
          "label": "Announcement text",
          "info": "Shown as a thin strip above the navigation. Leave blank to hide even when the toggle is on."
        },
        "header_background": {
          "label": "Header background color"
        },
        "header_text": {
          "label": "Header text color"
        }
      }
    }
  }
}
```

Structural notes:

- `headers.announcement` is a **sibling** of `settings`, not nested inside it. The `t:` lookup path `sections.header.headers.announcement.content` resolves correctly with this layout. The existing Dawn-era flat keys `header__1` and `header__utilities` (Dawn's hack convention for visual dividers) live inside `settings` and are left untouched — two different "header" conventions coexist in the same object, which is structurally fine.
- All existing Dawn-era keys (`logo_help`, `logo_position`, `menu`, `menu_type_desktop`, `show_line_separator`, `header__1`, `menu_color_scheme`, `sticky_header_type`, `header__utilities`, `enable_country_selector`, `enable_language_selector`, `margin_bottom`, `mobile_logo_position`, `enable_customer_avatar`) are preserved in their original order with their original values. The `header__1.content` key (value `"Color"`) is **reused** as the schema-divider label between the menu setting and the new color settings (review-rev-2 nits #5 + #7). No new locale key is created for this divider.
- The four new schema-locale keys (`show_announcement.label`, `announcement_text.label`, `announcement_text.info`, `header_background.label`, `header_text.label`) are appended.
- The new schema does NOT reuse `t:sections.all.colors.label` (revision 1 used that for the dropped `color_scheme` setting). The new `header_background` and `header_text` settings each get their own distinct labels.
- Sentence case throughout.

**Note on locale key depth.** This addition reaches 4 levels (`sections.header.settings.announcement_text.label`). This follows the established Shopify Online Store schema convention (group > setting > sub-property > attribute) and matches how `locales/en.default.schema.json` already structures keys for many other sections.

## 9. Risks, edge cases, and open questions

### Risks

1. **Schema round-trip with existing merchant settings AND first-open color flash for existing stores.** The header is currently configured in `config/settings_data.json` (merchant-controlled, not edited by us). The new settings (`header_background`, `header_text`, `show_announcement`, `announcement_text`) populate from their defaults on first load and persist when the merchant saves. The existing three settings (`logo`, `logo_width`, `menu`) are kept in their current positions and types, so existing data round-trips cleanly.

    **Visual-change caveat (review-rev-2 nit #6).** Existing merchants whose stores currently render the header with the hardcoded `var(--color-background)` (typically white per `snippets/css-variables.liquid:21`) will see a **black header bar (`#111111`) with white text (`#ffffff`) on first page load after this ships**, because the new `header_background` / `header_text` defaults take effect immediately. No merchant setting is lost, but the visual change is unannounced from the merchant's point of view.

    Why we accept this rather than mitigate via a runtime fallback to `settings.background_color`:
    - The Ride dark-bar design IS the intent of this work.
    - The dev store this ships to first is a Shopify development store with no real traffic and an explicit "Ride dark" target.
    - A runtime `default` fallback in `{% style %}` would defeat the intent and lock the merchant into the legacy color until they discover the new setting.

    Mitigations required:
    - The Coder must verify in the theme editor that existing logo/menu values are preserved after the schema change.
    - The Coder must document this color change in `docs/plans/theme-evolution-header-impl-notes.md` (section 10 step 8) so the DevOps hand-off surfaces it to the operator. Any future ticket that adopts this section in a real-merchant theme must communicate the color change to that merchant before deploy.

2. **Color settings approach does not depend on Dawn's scheme infrastructure.** Revision 1 of this plan proposed a `color_scheme` setting plus a `color-{{ scheme }}` wrapper class, claiming the merchant's chosen scheme would cascade through `--color-background` / `--color-foreground`. The plan-review (blocker #1) verified that this cascade does not exist in this codebase: `config/settings_schema.json` has no `color_scheme_group`, and no `.color-scheme-N { --color-background: ... }` blocks are emitted anywhere. We therefore use two explicit `color` settings wired through CSS custom properties (`--header-bg`, `--header-text`) on `.theme-evolution-header-wrapper`. This approach is verified to actually take visual effect, has no dependency on absent Dawn infrastructure, and degrades gracefully (defaults match the Ride design).
3. **JS double-registration in theme-editor preview.** The `customElements.get('theme-evolution-header-menu')` guard prevents `NotSupportedError` if the section script runs twice (theme editor re-renders sections after merchant edits without a full page reload). Without the guard, the second registration would throw and the menu would stop working until the merchant refreshed the page.
4. **Cart badge repositioning + overflow at three-digit counts.** The badge is a deliberate redesign (not just a selector rename): old position was to the right of the icon (`left: 100%`), new position is overlaid on the icon (`top: 0.6rem; right: 0.6rem`). Three-digit counts will expand the badge leftward over the icon since it is anchored at `right: 0.6rem`. QA must verify counts 0 (hidden), 1, 10, 99, 100 — see section 10 step 4. The "no layout shift" claim still holds because the badge is absolutely positioned (out of normal flow) and is always present in the DOM with `hidden` when zero.
5. **Non-default locale "missing translation" warnings.** Adding new English keys will produce warnings in non-default locales. Per `AGENTS.md`, these are accepted. The Coder must list them in `docs/plans/theme-evolution-header-impl-notes.md`.
6. **Existing pre-existing theme-check offenses.** Per the `CLAUDE.md` QA notes: `TranslationKeyExists` in `cart-drawer.liquid` and `UnusedAssign` in `card-product.liquid` are expected pre-existing warnings unrelated to this work. The Coder should not chase them.
7. **Sticky stacking context.** Adding the announcement bar inside `.theme-evolution-header-wrapper` does not affect the existing sticky behavior (the wrapper inherits the `position: sticky` from `.section-header` which is on the outer Shopify section wrapper). The announcement scrolls with the nav as a single sticky unit — desired. Verify during QA on both desktop and mobile.
8. **Hamburger and inline menu mutual exclusivity.** Both are rendered in the markup; CSS hides one or the other based on viewport width. The mobile panel uses `hidden` when closed, so it is removed from the accessibility tree on mobile when closed — fine. On desktop, the panel is unconditionally `display: none` via the `@media (min-width: 750px)` rule, so the open-state-leak edge case is defended.
9. **`fetchpriority` discipline.** `fetchpriority: 'high'` is reserved for the LCP element on each template (typically the hero image in another section). It is intentionally NOT applied to the logo here. Promoting the logo's priority across all templates would risk demoting the real LCP element by one network tier (50-200ms LCP regression). `loading: 'eager'` is sufficient and correct for an above-the-fold logo.
10. **Future migration cost if a Dawn-style color-scheme system is introduced later (review-rev-2 nit #4).** The two loose `color` settings here are deliberately unstructured. If a future ticket introduces a `color_scheme_group` in `config/settings_schema.json` and emits `.color-scheme-N { ... }` blocks in `snippets/css-variables.liquid`, this section will need to be reconciled with that system: either (a) the new system honors both APIs, (b) merchants who customized `header_background` / `header_text` get auto-mapped to the closest scheme, or (c) a follow-up ticket explicitly migrates the section to consume `color_scheme`. We are not solving this today — by the time the global system is introduced, the migration can be planned and tested in that ticket. Flagging here so the future architect does not rediscover the cost.
11. **`color-mix()` browser support for `--header-border` (decision 4.7).** `color-mix()` is supported in Safari 16.2+, Chrome 111+, Firefox 113+. For pre-2023 browsers the border will fall back to the browser's default `border-color` (effectively `currentColor`), which is a graceful fallback — the divider will be slightly heavier than intended but will not disappear. If a stricter fallback is desired, declare a static `border-color` rule immediately before the `var(--header-border)` rule. The Coder documents the chosen approach in impl-notes.

### Edge cases

1. **Logo unset.** The `<span class="h2">{{ shop.name }}</span>` fallback renders, exactly as today. No change in behavior.
2. **Menu unset / empty.** The `has_menu` guard suppresses both the inline menu and the hamburger toggle. The header still renders with logo and icons.
3. **`announcement_text` blank with `show_announcement` true.** The `if show_announcement and announcement_text != blank` guard renders nothing — preventing an empty strip with just border styling.
4. **Cart count 0.** Badge present in DOM with `hidden` attribute. Adding the first item removes `hidden` and reveals the badge. The `aria-label` on the cart link is always `{{ 'sections.header.cart_count' | t: count: cart.item_count }}` which uses the plural rules (`0 items`, `1 item`, `5 items`).
5. **Cart count 100+.** The `min-width: 1.4rem` + `padding: 0 0.4rem` lets the badge grow to fit three-digit counts, expanding leftward over the icon. Verify visually during QA at 100 (see section 10 step 4).
6. **Theme-editor open with multiple cart-drawer triggers.** The cart link already has `data-cart-drawer-trigger`. The new badge does not interact with the drawer. No change.
7. **Mobile menu open when viewport resizes to desktop.** The CSS hides the toggle at `min-width: 750px`, and the additional `@media (min-width: 750px) { .theme-evolution-header-menu__panel { display: none; } }` rule ensures an open panel state cannot leak across breakpoints.
8. **JavaScript disabled.** With JS off, the hamburger button does nothing. The inline menu is also `display: none` at mobile widths. **Resolved:** accept the JS dependency (matches the rest of this theme's conventions — cart drawer, etc., all require JS). Document the JS dependency in impl-notes.
9. **Announcement text containing apostrophes or other punctuation.** Output via `| escape` ensures HTML safety. The text setting is single-line plain text, not richtext, so HTML tags are stripped by Shopify's schema validation.
10. **Customer accounts disabled.** Account icon already conditionally renders. No change.
11. **Right-to-left languages.** The wrapper inherits `dir="rtl"` from `<html>` if set; existing flex layout (`justify-content: space-between`) reverses naturally. The hamburger panel's `left: 0; right: 0;` positioning is symmetric. No additional work needed.

### Open questions

1. None outstanding. The two open questions from revision 1 (no-JS fallback for the mobile hamburger; logo `fetchpriority`) were resolved in plan review and are reflected in the design above (accept JS dependency; remove `fetchpriority`).

## 10. Step-by-step implementation checklist for the Coder

Work in this order. Run `shopify theme check` after **each** step and address warnings before continuing (excluding the two pre-existing offenses in `cart-drawer.liquid` and `card-product.liquid` per the QA guidance in `CLAUDE.md`). Commit at every step where indicated.

### Step 1 — Add locale keys

1. Open `locales/en.default.json`. Merge into the existing `sections.header` object (around line 142-149) the two new keys from section 8: `mobile_menu_label` and `close_menu_label`. Do NOT remove the existing `announcement`, `menu`, or `cart_count` keys.
2. Open `locales/en.default.schema.json`. Add to the existing `sections.header` object (around line 941) the new `headers.announcement.content`, `settings.show_announcement.label`, `settings.announcement_text.label`, `settings.announcement_text.info`, `settings.header_background.label`, and `settings.header_text.label` keys. Match the complete merged JSON in section 8 exactly. Do NOT remove or reorder any existing Dawn-era key. **In particular, the existing `settings.header__1.content` key (value `"Color"`) MUST be preserved** — the new schema reuses it as the Color-section divider label.
3. After editing `locales/en.default.schema.json`, run `python3 -m json.tool locales/en.default.schema.json > /dev/null && echo OK` to confirm valid JSON before committing. Do the same for `locales/en.default.json`. If the command does not print `OK`, fix the JSON before continuing.
4. **Do NOT touch any non-default locale file.** Expect "missing translation" warnings — document them in `docs/plans/theme-evolution-header-impl-notes.md` at the end.
5. Run `shopify theme check`. Confirm no schema-validation errors.
6. Commit: `chore(locales): add header announcement and mobile menu keys`.

### Step 2 — Update schema in `sections/header.liquid`

1. Open `sections/header.liquid`. Replace ONLY the `{% schema %}` block (lines 120-147) with the JSON from section 6.
2. Verify:
   - The three pre-existing settings (`logo`, `logo_width`, `menu`) appear FIRST in their original order and types (preservation rule from `AGENTS.md`).
   - A `header` divider (`"type": "header"`) sits between `menu` and `header_background`, with `"content": "t:sections.header.settings.header__1.content"` (reusing the existing Dawn-era "Color" key — review-rev-2 nits #5 + #7).
   - The new `header_background` and `header_text` settings each use `"type": "color"` and reference `t:sections.header.settings.header_background.label` / `t:sections.header.settings.header_text.label`. Defaults are `"#111111"` and `"#ffffff"`.
   - A second `header` divider sits between `header_text` and `show_announcement`, with `"content": "t:sections.header.headers.announcement.content"`.
   - `show_announcement` defaults to `false`.
   - `announcement_text` has no `default` value (merchants enter their own text).
   - The schema has NO `presets`, NO `blocks`, NO `enabled_on`, NO `disabled_on`, NO `color_scheme` setting.
3. Run `shopify theme check`. The schema must validate against `schemas/section.json`.
4. Open the theme editor, navigate to the header section, and confirm the new settings appear in the correct order, with **two visual section dividers** ("Color" between menu and color settings; "Announcement bar" between color settings and announcement settings). Labels are in sentence case. Change `header_background` to a custom color and confirm the bar updates without a page reload (color settings hot-reload in the theme editor when wired via `{% style %}`).
5. Commit: `feat(header): add color settings and announcement bar settings`.

### Step 3 — Refactor markup: wrapper, announcement bar, color custom properties

1. In `sections/header.liquid`, wrap the existing `<header>...</header>` block in `<div class="theme-evolution-header-wrapper">...</div>` (no `color-{{ scheme }}` class — the color now flows via CSS custom properties).
2. Add the `{%- liquid ... -%}` setup block at the top of the file (per section 7 outline) that pre-assigns `show_announcement`, `announcement_text`, `has_menu`, `cart_count_label`, `mobile_menu_label`, `close_menu_label`.
3. Inside the wrapper, BEFORE the `<header>` element, render the announcement bar conditionally:
   ```liquid
   {%- if show_announcement and announcement_text != blank -%}
     <div class="theme-evolution-announcement-bar" role="note">
       <p class="theme-evolution-announcement-bar__text">{{ announcement_text | escape }}</p>
     </div>
   {%- endif -%}
   ```
   Note `role="note"` (NOT `role="status"` and NOT `role="region"`). No `aria-label`. (review-rev-2 nit #1)
4. In the existing `{% style %}` block (currently lines 42-46), add the `.theme-evolution-header-wrapper` rule that sets `--header-bg` and `--header-text` from the new color settings — see the snippet in section 4.1. Confirm the `{% style %}` block stays at the top level of the file, OUTSIDE any `{% if %}` (existing placement is correct; do not move it).
5. In `{% stylesheet %}`:
   - Replace the existing `header { background-color: var(--color-background); color: var(--color-foreground); ... }` rule. The `background-color` / `color` declarations move to a new `.theme-evolution-header-wrapper { ... }` rule that uses `var(--header-bg)` and `var(--header-text)`. Keep all other `header { ... }` layout rules (height, padding, flex) intact.
   - Add `position: relative` to `.theme-evolution-header-wrapper` so the mobile panel's `position: absolute; top: 100%` anchors correctly.
   - Add the `--header-border: color-mix(in srgb, currentColor 8%, transparent);` declaration to the `.theme-evolution-header-wrapper` rule (review-rev-2 nit #8 — decision 4.7). This custom property is consumed by the announcement-bar `border-bottom` and the mobile-panel `border-top` rules (added in step 6).
   - Change `header { overflow: hidden; }` to `header { overflow: visible; }` (or remove the rule). Add `overflow: hidden` to the `.header__logo-link` rule. This preserves the original logo-clipping intent while freeing the mobile panel from being clipped at the `<header>` boundary.
   - Add the `.theme-evolution-announcement-bar` rule using `border-bottom: 1px solid var(--header-border);` (NOT the hardcoded `rgba(255, 255, 255, 0.08)`).
6. Run `shopify theme check`. Visually verify in the theme editor:
   - With `show_announcement` on and text set, the bar appears above the nav.
   - With `show_announcement` off, no bar.
   - With the text blank, no bar even if the toggle is on.
   - Change `header_background` to a light color (e.g., `#ffffff`) and confirm the announcement-bar separator is still visible (it should appear as a thin near-black line, derived from `--header-text` via `currentColor`).
   - Change `header_background` back to a dark color and confirm the announcement bar and nav update in lockstep.
7. Commit: `feat(header): add wrapper, announcement bar, color custom properties`.

### Step 4 — Always-render cart count badge

1. Replace the existing cart icon block (lines 32-38 of the current file):
   ```liquid
   <a href="{{ routes.cart_url }}" class="header__icon header__icon--cart" {% if settings.enable_cart_drawer %}data-cart-drawer-trigger{% endif %}>
     {% if cart.item_count > 0 %}
       <sup>{{ cart.item_count }}</sup>
     {% endif %}
     {{ 'icon-cart.svg' | inline_asset_content }}
   </a>
   ```
   with the version from section 7 that always renders the `<span class="header__cart-count">` and uses the pre-assigned `cart_count_label` for the link's `aria-label`. Both the link and the badge `<span>` interpolate `cart_count_label` with `| escape`.
2. In `{% stylesheet %}`, **remove** the legacy `header a sup { ... }` rule (currently lines 69-74). Add the new `.header__cart-count { ... }` rule from section 7 in its place. Note: this is a deliberate visual redesign — old badge was at `left: 100%` (right of icon); new badge is at `top: 0.6rem; right: 0.6rem` (overlaid on icon). Not just a selector rename.
3. Add the `.header__cart-count[hidden] { display: none; }` rule (HTML5 honors the `hidden` attribute by default, but this is defensive against any global CSS that may have set `display` on `[hidden]` elements).
4. **Regression check (plan-review required change #11 + #8).** Before committing, grep `assets/*.js` and `sections/cart-drawer.liquid` for any selectors targeting `sup` (e.g., `a sup`, `header a sup`) or `.header__cart-count`. If any JS targets `a sup` to update the cart count via Ajax (Section Rendering API response), the Coder MUST update that selector to `.header__cart-count` in the same commit. Document the finding (selector found / not found, and what was changed) in `docs/plans/theme-evolution-header-impl-notes.md`.
5. Run `shopify theme check`.
6. **Cart-count visual QA at multiple values.** Visually verify in the storefront:
   - Cart count = 0: badge hidden, no visual artifact, surrounding layout unchanged.
   - Cart count = 1: badge visible, single digit centered.
   - Cart count = 10: badge visible, two digits fit without breaking the icon.
   - Cart count = 99: badge visible, two digits fit.
   - Cart count = 100: badge visible, three digits expand the badge leftward over the icon. Confirm no layout breakage of surrounding elements.
   Use a multi-variant test product from `docs/dev-fixtures.md` (e.g., `selling-plans-ski-wax`) to drive the cart count up. Document the cart counts tested in impl-notes.
7. Confirm no layout shift in surrounding elements (use Lighthouse or DevTools Performance > Rendering > Layout Shift Regions) when transitioning from count 0 → count 1.
8. Commit: `feat(header): always render cart count badge to prevent CLS`.

### Step 5 — Improve nav typography

1. In `{% stylesheet %}`, append the rules from section 7's "nav typography" block:
   ```css
   .header__menu a,
   .theme-evolution-header-menu__link {
     text-transform: uppercase;
     letter-spacing: 0.1em;
     font-weight: 600;
     font-size: 0.85rem;
   }
   ```
2. Run `shopify theme check`.
3. Verify in the theme editor that nav links render in uppercase with visible letter spacing. Confirm on a real product page (not just the theme editor) that the cascade actually applies — sometimes editor previews differ.
4. Commit: `feat(header): apply uppercase letter-spaced nav typography`.

### Step 6 — Mobile hamburger Web Component

1. In `sections/header.liquid`, inside the `.header__icons` div, BEFORE the account and cart icons, add the `<theme-evolution-header-menu>` block from section 7. Guard with `{%- if has_menu -%}` so an unset link list does not produce an empty drawer.
2. Pre-assign localized strings (`mobile_menu_label`, `close_menu_label`) in the top-level `{%- liquid -%}` block. Pass them into the `<span data-label-open="..." data-label-close="...">` attributes (both `| escape`-d) so the JS can swap the visually-hidden text.
3. Use unique panel id `theme-evolution-header-menu-panel-{{ section.id }}` and matching `aria-controls`.
4. Inline both hamburger and close icons via `{{ 'icon-hamburger.svg' | inline_asset_content }}` and `{{ 'icon-close.svg' | inline_asset_content }}`. Wrap each in a span with the appropriate `theme-evolution-header-menu__icon--open` / `theme-evolution-header-menu__icon--close` class for CSS-driven swap.
5. **Verify SVG `viewBox` (plan-review nit #10).** Open `assets/icon-hamburger.svg` and `assets/icon-close.svg` and confirm each has a `viewBox` attribute on the root `<svg>` element. Without `viewBox`, the SVG will not scale to the `2rem × 2rem` size set by `header svg { width: 2rem; height: 2rem; }`. If either is missing `viewBox`, stop and ask in `docs/plans/theme-evolution-header-coder-questions.md` before proceeding.
6. In `{% stylesheet %}`, append the mobile menu rules from section 7 (toggle hidden on desktop, panel positioning, icon swap via `[aria-expanded="true"]`, `.visually-hidden` utility class, breakpoint gate at `max-width: 749px`, defensive desktop rule at `min-width: 750px`). The `.theme-evolution-header-menu__panel` `border-top` MUST use `var(--header-border)`, not a hardcoded `rgba(...)` value (review-rev-2 nit #8 — decision 4.7).
7. At the END of the section file (after `{% stylesheet %}`, before or after `{% schema %}`), add the `<script>` block from section 7. Confirm:
   - The tag is a standard `<script>` (NOT `{% javascript %}`) per `CLAUDE.md`'s JS directive and the roadmap's instruction.
   - The class is named `ThemeEvolutionHeaderMenu` (PascalCase). Registered tag is `theme-evolution-header-menu` (kebab-case).
   - The `customElements.define` call is guarded by `if (customElements.get('theme-evolution-header-menu')) return;`.
   - `onToggleClick` calls `event.stopPropagation()` (defensive isolation from the document handler).
   - `setOpen(true)` moves focus to the first focusable element in the panel **wrapped in `requestAnimationFrame(...)`** (review-rev-2 nit #2); `setOpen(false)` calls `this.toggle.focus()` to return focus to the trigger.
   - Event listeners are added in `connectedCallback` and removed in `disconnectedCallback`.
   - The Escape key and outside clicks close the menu.
   - The toggle button's `aria-expanded` attribute is the source of truth for open/closed state. CSS keys off it.
   - The visually-hidden label swaps between open and close strings via `data-label-open`/`data-label-close` attributes set in Liquid.
8. Run `shopify theme check`.
9. Test on mobile viewport (375×667 in DevTools or via Playwright):
   - The hamburger button is visible; the inline `.header__menu` is hidden.
   - **Confirm the mobile menu panel drops below the header bar and is not clipped.** This is the test for the `overflow: hidden` → `overflow: visible` change on `<header>`.
   - Click the hamburger: panel slides down with the link list, hamburger icon swaps to close icon, `aria-expanded` becomes `true`, visually-hidden label updates to "Close menu", and focus moves to the first link in the panel.
   - Click outside the panel: closes; focus returns to the toggle.
   - Press Escape: closes; focus returns to the toggle.
   - Click the close icon: closes; focus returns to the toggle.
   - Tab from the toggle when closed: focus advances past the menu element to the next icon (account / cart).
10. Test on desktop viewport (1440×900):
    - The hamburger button is hidden.
    - The inline `.header__menu` is visible.
    - The panel is also hidden (defensive `min-width: 750px` rule).
11. Test theme-editor double-render scenario by editing a header setting and saving — the section re-renders. Verify no `NotSupportedError` in the console (the guard handles this).
12. Commit: `feat(header): add ThemeEvolutionHeaderMenu mobile toggle Web Component`.

### Step 7 — Logo CLS guard

1. In the logo `image_tag` call, compute and pass an explicit `height`:
   ```liquid
   {%- assign logo_height = section.settings.logo_width | times: section.settings.logo.height | divided_by: section.settings.logo.width -%}
   {{
     section.settings.logo
     | image_url: width: section.settings.logo_width
     | image_tag:
         class: 'header__logo',
         widths: '50, 100, 150, 200, 250, 300, 400, 500',
         width: section.settings.logo_width,
         height: logo_height,
         alt: logo_alt,
         loading: 'eager'
   }}
   ```
   Note: `fetchpriority: 'high'` is NOT included. `loading: 'eager'` is sufficient. See section 9 risk #9 for rationale.
2. Confirm both `width` and `height` attributes appear on the rendered `<img>` (inspect via DevTools).
3. Run `shopify theme check`. Confirm no `ImgWidthAndHeight` warnings for this element.
4. Commit: `fix(header): add explicit logo height to prevent CLS`.

### Step 8 — Final theme-check and impl-notes

1. Run `shopify theme check` one final time. Confirm zero errors. The expected pre-existing offenses (`TranslationKeyExists` in `cart-drawer.liquid`, `UnusedAssign` in `card-product.liquid`) are acceptable per `CLAUDE.md`.
2. Document any non-default-locale "missing translation" warnings as accepted in `docs/plans/theme-evolution-header-impl-notes.md`.
3. Write `docs/plans/theme-evolution-header-impl-notes.md` summarizing:
   - Any deviations from this plan with rationale.
   - Exact commit SHAs for each step.
   - Test product handle used during smoke verification.
   - Confirmation of the four key constraints: `ThemeEvolutionHeaderMenu` namespace, `<script>` tag (not `{% javascript %}`), two explicit `color` settings wired via CSS custom properties (NOT `color_scheme`), always-rendered cart badge.
   - Outcome of the cart-drawer JS regression grep (step 4 item 4): selectors found, selectors updated.
   - Confirmation that the mobile panel renders below the header bar without clipping (step 6 item 9).
   - Confirmation that keyboard focus moves into the panel on open (deferred by `requestAnimationFrame`) and returns to the toggle on close.
   - **Color-flash documentation (review-rev-2 nit #6).** A one-paragraph note stating: "Existing merchants whose header currently renders with the legacy `var(--color-background)` (typically white) WILL see a black-on-white header bar on first page load after this ships, because the new `header_background` / `header_text` defaults take effect immediately. This is intentional and matches the Ride design target. The DevOps hand-off must surface this to the operator before publish so the operator can communicate it to any downstream merchant. No merchant data is lost; the merchant can re-enter the old colors via the theme editor at any time." Include this verbatim block in the impl-notes.
   - **Analytics flag (review-rev-2 nit #3).** A one-line note: "The `ThemeEvolutionHeaderMenu#onToggleClick` method calls `event.stopPropagation()` to defensively isolate the toggle click from the document-level outside-click handler. If a future PR attaches a header-wide click tracker on `<header>` or `<body>`, that tracker will NOT see the toggle click. Look here to wire it explicitly."
   - **`color-mix()` border fallback decision (review-rev-2 nit #8 + risk #11).** Note whether the Coder kept the bare `color-mix(in srgb, currentColor 8%, transparent)` declaration or added a static `border-color` fallback. State which browsers were tested.
   - Screenshots (mobile 375×667 and desktop 1440×900) of:
     - Header with announcement bar on.
     - Header with announcement bar off.
     - Mobile hamburger closed.
     - Mobile hamburger open (with focus visibly in the panel).
     - Cart badge visible (with at least 1 item) and hidden (empty cart).
     - Cart badge at count 100 (three-digit expansion).
     - Header with a LIGHT `header_background` (e.g., `#ffffff` / `#111111`) demonstrating that the announcement-bar separator border remains visible (`--header-border` proof).
   - List of any accepted `shopify theme check` warnings and the rationale.
   - Note the pre-existing offense: the schema labels for `logo` (`"Logo image"`) and `logo_width` (`"Custom logo width"`) are hardcoded English strings, not `t:` keys. This carries over from the existing schema and is out of scope for this plan; flag it for a future cleanup ticket.
4. Hand off to the Plan-Reviewer.

### Step 9 — Hand-off

1. Do NOT auto-deploy. The DevOps stage runs only after `docs/qa/theme-evolution-header.approved` exists (zero-byte sentinel file, created manually after QA passes).
2. Stop. The Plan-Reviewer takes over.

---

## Appendix A — Mapping rationale to project directives

| Directive (`CLAUDE.md` / `AGENTS.md`) | How this plan complies |
| --- | --- |
| No `{% include %}`; always `{% render %}` for snippets | Plan adds no new snippets; existing `inline_asset_content` SVG inlining is unchanged. |
| CLS prevention — explicit `width` and `height` on `<img>` | Step 7 adds explicit `height` to the logo `<img>` via a Liquid-computed aspect-ratio expression. |
| LCP — `preload: true` / `eager` on above-the-fold images | Logo retains `loading: 'eager'`. `fetchpriority: 'high'` is intentionally NOT used on the logo because that priority is reserved for the true LCP element on each template (typically the hero image in another section). See section 9 risk #9. |
| Asset location — no component CSS/JS in `assets/` | All CSS in `{% stylesheet %}` inside the section. All JS in a single `<script>` block inside the section. Nothing added to `assets/`. |
| `{% stylesheet %}` only in sections, only static rules | The single `{% stylesheet %}` block in `sections/header.liquid` contains only static rules (no Liquid interpolation). |
| `{% style %}` only in sections, NEVER inside Liquid logic | The `{% style %}` block sets `--logo-width`, `--header-bg`, and `--header-text` at the top level of the section, outside any `{% if %}`. |
| `{% javascript %}` vs `<script>` — `<script>` for conditional JS | The custom-element definition uses a standard `<script>` tag because the hamburger is conditionally rendered (`{% if has_menu %}`). |
| Web Component namespacing | Class name `ThemeEvolutionHeaderMenu`, tag name `theme-evolution-header-menu`. Never `HeaderMenu`, `MobileMenu`, etc. |
| `customElements.define` collision protection | `if (customElements.get('theme-evolution-header-menu')) return;` guard at the top of the IIFE. |
| Block-first architecture | Header section uses no blocks (per roadmap line 79). The nav is driven by a `link_list` setting, not blocks. Justified deviation. |
| Semantic HTML / one `<h1>` per page | The `<h2>` wrapper around the logo is unchanged. The page's `<h1>` lives elsewhere (e.g., product title, page title). |
| Sentence case for merchant copy | "Show announcement bar", "Announcement text", "Announcement bar", "Header background color", "Header text color" — all sentence case. |
| Translation via `t:` keys | All user-facing strings reference `t:` keys in schema; all `'key' | t` calls in Liquid are pre-assigned in a top-level `{%- liquid -%}` block. |
| Locale files — English only | Only `locales/en.default.json` and `locales/en.default.schema.json` are edited. Non-default locale warnings are documented in impl-notes. |
| Schema validation against `schemas/section.json` | The Coder runs `shopify theme check` after every step. |
| Do not edit `templates/*.json`, `config/settings_data.json`, non-default locales, `.shopify/` | Explicitly listed in "Files explicitly NOT edited". `config/settings_schema.json` is also explicitly NOT edited (we are not introducing a `color_scheme_group`). |
| Schema round-trip — preserve `presets`/`blocks`/`settings` types and order | The three pre-existing settings keep their position and types. New settings are appended. No `presets` or `blocks` exist on this schema and none are added. |

---

## Appendix B — Quick reference for the Coder

| What | Where |
| --- | --- |
| Custom element class name | `ThemeEvolutionHeaderMenu` |
| Custom element tag name | `theme-evolution-header-menu` |
| JS tag type | `<script>` (NOT `{% javascript %}`) |
| Header color settings | Two `color` settings: `header_background` (default `#111111`), `header_text` (default `#ffffff`). Wired via `--header-bg` / `--header-text` custom properties on `.theme-evolution-header-wrapper` in the `{% style %}` block. NOT `color_scheme`. |
| Schema dividers | Two `{ "type": "header" }` entries: one before `header_background` reusing `t:sections.header.settings.header__1.content` ("Color"); one before `show_announcement` using `t:sections.header.headers.announcement.content` ("Announcement bar"). |
| Existing translation reuse | `sections.header.cart_count.one`/`other` (`locales/en.default.json:142-148`), `sections.header.settings.header__1.content` (`locales/en.default.schema.json` — value `"Color"`, reused as the Color-divider label). |
| New storefront locale keys | `sections.header.mobile_menu_label`, `sections.header.close_menu_label` |
| New schema locale keys | `sections.header.headers.announcement.content`, `sections.header.settings.show_announcement.label`, `sections.header.settings.announcement_text.label`, `sections.header.settings.announcement_text.info`, `sections.header.settings.header_background.label`, `sections.header.settings.header_text.label` |
| Icons reused | `assets/icon-hamburger.svg`, `assets/icon-close.svg`, `assets/icon-cart.svg`, `assets/icon-account.svg` (all already exist; verify `viewBox` is present on hamburger and close per step 6) |
| Mobile breakpoint | `max-width: 749px` (mobile) / `min-width: 750px` (desktop) — matches existing theme convention |
| Overflow strategy | `<header>` is `overflow: visible`; `.header__logo-link` is `overflow: hidden` (preserves logo clipping while freeing the mobile panel from clipping) |
| Announcement role | `role="note"` (NOT `role="status"`, NOT `role="region"`) — no `aria-label` needed |
| Internal separator borders | Use `var(--header-border)` (defined on `.theme-evolution-header-wrapper` as `color-mix(in srgb, currentColor 8%, transparent)`). Do NOT hardcode `rgba(255,255,255,0.08)`. |
| Focus-into-panel pattern | Wrap `firstFocusable.focus()` in `requestAnimationFrame(...)` so the panel is laid out before focus is moved. |
| Lint command | `shopify theme check` |
| JSON validation | `python3 -m json.tool locales/en.default.schema.json > /dev/null && echo OK` |
| Dev command | `shopify theme dev` (preview URL printed; use the `shopifypreview.com` URL not `127.0.0.1:9292` for Playwright) |
| Approval gate file (manual create after QA pass) | `docs/qa/theme-evolution-header.approved` |
| Impl-notes file | `docs/plans/theme-evolution-header-impl-notes.md` |
| QA fixture products | `the-3p-fulfilled-snowboard` (visual-only), `selling-plans-ski-wax` or `the-complete-snowboard` (full add-to-cart smoke for the badge update including counts 0/1/10/99/100) — see `docs/dev-fixtures.md` |
