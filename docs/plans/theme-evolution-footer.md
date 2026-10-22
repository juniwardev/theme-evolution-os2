# Plan: Theme Evolution footer enhancement

Slug: `theme-evolution-footer`
Architect: Junior Warner
Date: 2026-05-20
Revision: 3

---

## 1. Problem statement and goals

The existing `sections/footer.liquid` is a 57-line Dawn-derived minimal footer: a bare `<footer>` with three sibling divs (`.footer__copyright`, `.footer__links`, `.footer__payment`) laid out as a single horizontal flex row using the page's foreground color on the page's background. There is no about-text column, no social-media row, no color control, no mobile stacking strategy beyond what flexbox does by accident, and no separation between the multi-column content area and the legal/copyright row.

The Ride surf-brand design reference calls for a dark, multi-column footer with a clear visual hierarchy:

```
+--------------------------------------------------------------+
| [Col 1: About text]  [Col 2: Nav links]  [Col 3: Social icons] |
+--------------------------------------------------------------+
| (c) 2026 Shop Name * Powered by Shopify * [Payment icons]      |
+--------------------------------------------------------------+
```

This is the footer counterpart to the already-shipped header enhancement (`docs/plans/theme-evolution-header.md`) and must follow the same architectural patterns established there: two explicit `color` settings wired through CSS custom properties on a namespaced wrapper, schema additions appended after the existing settings (preserving IDs), all CSS in `{% stylesheet %}` and `{% style %}` blocks at the top level of the section (never inside `{% if %}`), and locale keys added only to `locales/en.default.json` and `locales/en.default.schema.json`.

### Goals

1. Restructure `sections/footer.liquid` into a three-column content area + bottom copyright/payment bar, matching the Ride design reference. Single column on mobile (breakpoint <=749px to match the header).
2. Make the footer color merchant-configurable via two explicit `color` settings (`footer_background` default `#111111`, `footer_text` default `#ffffff`) wired through CSS custom properties (`--footer-bg`, `--footer-text`) on a `.theme-evolution-footer-wrapper` div. Defaults reproduce the Ride dark-bar design out of the box. **Do NOT use `color_scheme`** — this codebase has no `color_scheme_group` infrastructure and no `.color-scheme-N` CSS declarations; a `color_scheme` setting would be a no-op (same reasoning the header plan documented as blocker #1).
3. Add an "About text" column (richtext) for brand copy, rendered only when non-blank.
4. Keep the existing `menu` link list as the nav-links column. Render only when the link list has links.
5. Add a social-icons column with five optional URL settings (`instagram_url`, `facebook_url`, `youtube_url`, `tiktok_url`, `twitter_url`), gated by a `show_social_icons` checkbox. Each icon renders only when its URL is non-blank. Icons inline the existing `assets/icon-*.svg` files via `inline_asset_content`.
6. Preserve the existing copyright + payment icon behavior in a bottom bar that visually separates from the three columns via a divider derived from `--footer-text` (so it stays visible on any background).
7. Conform to every project-specific directive in `CLAUDE.md`: no `{% include %}`, all CSS in section file via `{% stylesheet %}` (static) or `{% style %}` (dynamic Liquid), explicit `width`/`height` on any `<img>` (n/a here — no `<img>` is added; social icons are inline SVG; payment icons are `payment_type_svg_tag`), locale keys only in `locales/en.default.json` and `en.default.schema.json`, sentence case for merchant copy, schema validation against `schemas/section.json`, and ID preservation for `menu` and `show_payment_icons`.

## 2. Non-goals

- **Not** a refactor of `layout/theme.liquid` or any template JSON. The section keeps the same handle (`footer`).
- **Not** a swap to a section-group architecture. The footer stays a single section file.
- **Not** a newsletter signup, country/region selector, language selector, or "Follow on Shop" widget. The Dawn-era `sections.footer.*` schema-locale keys for those features (still present in `locales/en.default.schema.json` lines 898-938) are intentionally left untouched and unused. Adding them would expand scope beyond the design reference.
- **Not** introducing blocks. The Ride footer is a fixed three-column layout driven by settings; making the about-text, nav-links, and social columns merchant-composable blocks adds complexity without matching the design. (If a future iteration calls for a "stacked link groups" footer like Dawn's `link_list` block-per-column layout, that is a separate plan.)
- **Not** a dark-mode toggle, sticky footer, or footer-revealed-on-scroll behavior.
- **Not** editing `config/settings_data.json`, `templates/*.json`, or any non-English locale (per `CLAUDE.md` "What NOT to change").
- **Not** introducing Dawn-style `color_scheme_group` infrastructure in `config/settings_schema.json`. Same non-goal as the header plan, same reasoning.
- **Not** adding social URL settings at the global `settings_schema.json` level (e.g., `social_instagram_link`). Per the feature spec the URL settings live on this section only, so they appear in the merchant's Footer settings panel in the theme editor, not in global Theme settings.
- **Not** swapping the existing `{ "name": "t:general.footer" }` schema name. Existing reference works; no churn needed.
- **Not** removing any merchant-saved data. Both existing settings (`menu`, `show_payment_icons`) keep their IDs, types, and default values.

## 3. Audit of existing `sections/footer.liquid`

Findings (line references are to the current 57-line file):

| Concern | Current state | Lines |
| --- | --- | --- |
| `<footer>` wrapper | Bare `<footer>` element, no class on the tag, no wrapper div | 1, 21 |
| Color of the bar | Inherits `var(--color-foreground)` via the `footer a` rule, no merchant-controllable color, no background color rule | 29-32 |
| About-text column | None | n/a |
| Nav-links column | `.footer__links` iterating `section.settings.menu.links`, plain `link_to` output | 8-12 |
| Social-icons column | None | n/a |
| Copyright | `.footer__copyright` with year + `shop.name` link + `powered_by_link`, output as a single inline string with a comma separator | 2-6 |
| Payment icons | `.footer__payment` iterating `shop.enabled_payment_types | payment_type_svg_tag` when `section.settings.show_payment_icons` is true | 14-20 |
| Mobile layout | None explicit; relies on flex `space-between` to collapse, which on narrow viewports cramps three siblings against the edges | 23-28 |
| Schema settings | `menu` (link_list), `show_payment_icons` (checkbox default true) — two settings, no color, no about-text, no social URLs | 40-56 |
| Existing `{% stylesheet %}` | Simple `display: flex; justify-content: space-between; margin-top: 2rem` on `footer`; `display: flex; gap: 1rem` on `.footer__links` and `.footer__payment`; `text-decoration: none; color: var(--color-foreground)` on `footer a` | 23-38 |
| Translation usage | None on the storefront side; `locales/en.default.json:184-186` has `sections.footer.payment: "Payment methods"` ready for reuse on the payment-icons region's `aria-label` | n/a / locales |
| `{% style %}` block | None — no dynamic CSS today | n/a |
| `<script>` block | None | n/a |

### Reuse opportunities

- All five social-icon SVGs already exist in `assets/` (verified via Glob in the planning step): `icon-instagram.svg`, `icon-facebook.svg`, `icon-youtube.svg`, `icon-tiktok.svg`, `icon-twitter.svg`. Each can be inlined via `{{ 'icon-NAME.svg' | inline_asset_content }}` — no new SVG assets needed.
- The existing storefront key `sections.footer.payment` (value `"Payment methods"`) is the ideal `aria-label` for the payment-icons list. Reuse it without changes.
- The header plan's `--header-border: color-mix(in srgb, currentColor 8%, transparent)` pattern transfers directly. We name it `--footer-border` for the bottom-bar divider.
- The header's `.theme-evolution-header-wrapper` pattern (color CSS custom properties on a single wrapper div, consumed by static CSS in `{% stylesheet %}`) transfers directly. We name the wrapper `.theme-evolution-footer-wrapper`.

## 4. Design decisions

### 4.1 Footer color — two explicit `color` settings via CSS custom properties

Add two `color` schema settings: `footer_background` (label "Footer background color", default `"#111111"`) and `footer_text` (label "Footer text color", default `"#ffffff"`). Defaults reproduce the Ride dark-footer design out of the box.

Wire both through a top-level `{% style %}` block (newly added to the section file) as CSS custom properties on `.theme-evolution-footer-wrapper`:

```liquid
{% style %}
  .theme-evolution-footer-wrapper {
    --footer-bg: {{ section.settings.footer_background }};
    --footer-text: {{ section.settings.footer_text }};
  }
{% endstyle %}
```

In the static `{% stylesheet %}` block, the `.theme-evolution-footer-wrapper` rule consumes them:

```css
.theme-evolution-footer-wrapper {
  background-color: var(--footer-bg);
  color: var(--footer-text);
}
```

Child elements (`a`, the about-text richtext, the nav links, the social icons) inherit `color` naturally via `color: inherit` rules. The existing `footer a { color: var(--color-foreground); }` rule is removed and replaced with `color: inherit` so the merchant's chosen footer text color actually propagates.

Rationale: this is the smallest change that takes visual effect in this codebase. It follows the header plan's verified-working approach. It uses the `CLAUDE.md`-endorsed "single property -> CSS variable" pattern. Defaults match the design; merchants who want the legacy `var(--color-background)`/`var(--color-foreground)` behavior can match it by entering the corresponding hex values into the new settings.

### 4.2 Layout — CSS grid for the three columns, single column on mobile

The three-column content area uses CSS grid with explicit columns rather than `auto-fit` / `auto-fill`. Reasons:

- The three columns have semantically different content (prose / nav / icons) that should be visually balanced rather than equally sized. Explicit columns let us assign `2fr 1fr 1fr` so the prose column gets more horizontal room than the nav and social columns, matching the Ride visual rhythm.
- `auto-fit` would collapse columns at the wrong moments — e.g., when only the about-text column is configured, it would expand to fill the whole row, which is fine, but when about-text and social-icons are configured (no nav), `auto-fit` would not visually pair them the way the design wants.
- Conditional column rendering (rendering a column only when its data exists) plays well with explicit grid: empty grid cells just don't appear, and the remaining columns sit on their assigned tracks.

Approach: declare three named columns with `grid-template-columns: 2fr 1fr 1fr` at desktop. Each column is conditionally rendered with `{% if %}`; if all three are configured, all three slots fill. If only two are configured, the two that exist still sit on their assigned tracks (about-text wider than nav or social). At mobile (`max-width: 749px`), switch to `grid-template-columns: 1fr` and let the columns stack vertically in source order: about -> nav -> social. The single mobile breakpoint matches the header's breakpoint exactly.

If the merchant configures zero columns (no about-text, no menu, no social with `show_social_icons` off OR no URLs set), the entire `.theme-evolution-footer__columns` container is suppressed by the outer `{%- if has_about or has_menu or has_social -%}` Liquid guard in section 7 — it is simply not rendered, so the footer collapses cleanly to just the bottom bar. A defensive `:empty { display: none; padding: 0; }` rule is also included in the static `{% stylesheet %}`, but it cannot fire under current behavior (the outer guard always skips the container before it can become empty). The `:empty` rule is forward-looking belt-and-braces protection only — kept in case a future change adds unconditional content inside the columns container. See edge case #5 in section 9 for the canonical framing.

### 4.3 Column 1: about-text richtext

A single `richtext` schema setting `about_text` with no default. Rendered with `{{ section.settings.about_text }}` (not `| escape` — richtext is sanitized by the schema and contains intentional HTML like `<p>` tags). Wrapped in a column container that is itself conditionally rendered:

```liquid
{%- if section.settings.about_text != blank -%}
  <div class="theme-evolution-footer__column theme-evolution-footer__column--about">
    <div class="theme-evolution-footer__about-text">
      {{ section.settings.about_text }}
    </div>
  </div>
{%- endif -%}
```

No column heading from this plan — the design reference shows the about-text column as flowing body copy without a separate "About" heading; merchants who want one can write it inside the richtext setting. This matches the design and keeps the schema lean.

Sentence case label: "About text".

### 4.4 Column 2: nav-links from existing `menu` setting

Preserve the existing `menu` link_list setting (ID `menu`, type `link_list`). Render only when the link list has links:

```liquid
{%- if section.settings.menu != blank and section.settings.menu.links.size > 0 -%}
  <div class="theme-evolution-footer__column theme-evolution-footer__column--menu">
    <ul class="theme-evolution-footer__menu" role="list">
      {%- for link in section.settings.menu.links -%}
        <li><a href="{{ link.url }}" class="theme-evolution-footer__menu-link">{{ link.title | escape }}</a></li>
      {%- endfor -%}
    </ul>
  </div>
{%- endif -%}
```

Notes:
- Use a `<ul>` + `<li>` for the nav list (semantic improvement over the current flat `<a>` siblings). The `role="list"` attribute is defensive — Safari strips list semantics when `list-style: none` is applied.
- Reuse the existing `t:labels.menu` schema-locale key (value `"Menu"` per `locales/en.default.schema.json:44`). The schema entry stays `{ "type": "link_list", "id": "menu", "label": "t:labels.menu" }` — unchanged.

### 4.5 Column 3: social-icons row

Five optional `url` settings (`instagram_url`, `facebook_url`, `youtube_url`, `tiktok_url`, `twitter_url`), each optional. A `show_social_icons` checkbox (default `true`) gates the whole column. Inside the column, each icon renders only when its URL setting is non-blank:

```liquid
{%- liquid
  assign has_social = false
  if section.settings.show_social_icons
    if section.settings.instagram_url != blank
      assign has_social = true
    elsif section.settings.facebook_url != blank
      assign has_social = true
    elsif section.settings.youtube_url != blank
      assign has_social = true
    elsif section.settings.tiktok_url != blank
      assign has_social = true
    elsif section.settings.twitter_url != blank
      assign has_social = true
    endif
  endif
-%}

{%- if has_social -%}
  <div class="theme-evolution-footer__column theme-evolution-footer__column--social">
    <ul class="theme-evolution-footer__social" role="list" aria-label="{{ 'sections.footer.social.aria_label' | t }}">
      {%- if section.settings.instagram_url != blank -%}
        <li>
          <a href="{{ section.settings.instagram_url }}" class="theme-evolution-footer__social-link" aria-label="{{ 'sections.footer.social.instagram' | t }}" rel="noopener" target="_blank">
            {{ 'icon-instagram.svg' | inline_asset_content }}
          </a>
        </li>
      {%- endif -%}
      {%- comment -%} repeat for facebook, youtube, tiktok, twitter {%- endcomment -%}
    </ul>
  </div>
{%- endif -%}
```

Notes:
- `aria-label` per `<a>` uses a per-platform translation key (`sections.footer.social.instagram`, etc.) so screen readers announce "Instagram" rather than the raw URL. The list itself gets `aria-label="Social media"` for region semantics.
- `rel="noopener" target="_blank"` is standard for off-site social links. Not adding `rel="noreferrer"` because the merchant may want referrer analytics from social platforms.
- The inline SVG approach (`inline_asset_content`) inherits `color` via `currentColor` if the SVG uses `fill="currentColor"`. Per project convention these SVGs typically already do; if any of the five social SVGs use a hardcoded fill, the icon will not pick up `--footer-text` and will appear in its embedded color. This is flagged in section 9 risk #2 and in step 5 item 5 of the checklist — the Coder must inspect each SVG and document any that need a CSS override.
- `chained if/elsif` for the `has_social` guard rather than logical `or`: per `CLAUDE.md`'s Liquid rule, when logic requires more than one logical operator, use nested/chained `if`. Five `or`s in a single condition would violate that rule.

### 4.6 Bottom bar: copyright + payment icons

A single row below the three-column content area, visually separated by a border-top derived from `--footer-text` via `color-mix()`:

```liquid
<div class="theme-evolution-footer__bottom">
  <p class="theme-evolution-footer__copyright">
    &copy; {{ 'now' | date: '%Y' }} {{ shop.name | link_to: routes.root_url }} &middot; {{ powered_by_link }}
  </p>

  {%- if section.settings.show_payment_icons -%}
    <ul class="theme-evolution-footer__payment" role="list" aria-label="{{ 'sections.footer.payment' | t }}">
      {%- for type in shop.enabled_payment_types -%}
        <li>{{ type | payment_type_svg_tag }}</li>
      {%- endfor -%}
    </ul>
  {%- endif -%}
</div>
```

Notes:
- `shop.name | link_to: routes.root_url` and `powered_by_link` are preserved verbatim from the existing file. The `&middot;` separator replaces the existing comma to match the design reference.
- The `<ul>` wrapper around payment icons is a semantic improvement; visually the icons still sit in a row via flex.
- Reuses the existing `sections.footer.payment` storefront key as the list's `aria-label`. No new key needed for this.
- The bottom bar uses `flex: justify-content: space-between` so the copyright sits left and the payment icons sit right on desktop. On mobile it stacks (copyright on top, payment icons below, both centered).

### 4.7 Internal separator border — derive from `--footer-text`

Same pattern as the header plan's decision 4.7. Hardcoding a separator color (`rgba(255,255,255,0.08)`) would render invisibly if the merchant chooses a light `footer_background`. Define `--footer-border` on `.theme-evolution-footer-wrapper`:

```css
.theme-evolution-footer-wrapper {
  --footer-border: color-mix(in srgb, currentColor 8%, transparent);
}
.theme-evolution-footer__bottom {
  border-top: 1px solid var(--footer-border);
}
```

`color-mix()` browser support: Safari 16.2+, Chrome 111+, Firefox 113+. Same caveat as the header plan — acceptable for this theme. Fallback strategy: if pre-2023 browser support becomes a concern, add `border-color: rgba(128, 128, 128, 0.2);` immediately before the `var(--footer-border)` declaration and document in impl-notes.

### 4.8 No JavaScript

The footer is server-rendered Liquid only. No accordion-collapse on mobile (Dawn does this; the Ride design does not), no carousel, no JS-driven state. This keeps the section file simple and avoids adding a Web Component just to hide and show columns. No `<script>` block is added.

### 4.9 Schema dividers — group settings logically

Per the feature spec ("Group settings logically with `header` divider settings in the schema for theme editor UX"), insert three `{ "type": "header" }` dividers to organize the merchant's settings panel:

1. Before `footer_background` — divider "Color" (reuses an existing schema-locale key if available; otherwise creates a new one).
2. Before `about_text` — divider "Content".
3. Before `show_social_icons` — divider "Social media".

The existing `show_payment_icons` setting (originally placed below `menu`) is repositioned to sit at the end, optionally preceded by a "Payment" divider. **However, repositioning an existing setting in the schema does NOT change its ID or its saved value** — the merchant's existing `show_payment_icons: true` choice persists. We confirm this by keeping the `"id"`, `"type"`, and `"default"` of `show_payment_icons` byte-identical to the existing schema.

See section 6 for the exact divider placement and locale key choices.

## 5. Affected files and modules

### Files to edit

| Path | Change |
| --- | --- |
| `sections/footer.liquid` | Full markup restructure (new wrapper div, three-column grid content area, bottom bar). New `{% style %}` block for `--footer-bg` / `--footer-text`. Rewritten `{% stylesheet %}` block (grid layout, typography, icon sizing, breakpoint, bottom bar, `--footer-border`). Rewritten `{% schema %}` block (preserves `menu` and `show_payment_icons` IDs; adds `footer_background`, `footer_text`, `about_text`, `show_social_icons`, `instagram_url`, `facebook_url`, `youtube_url`, `tiktok_url`, `twitter_url`, plus three header dividers). No `<script>` block. |
| `locales/en.default.json` | Add storefront keys: `sections.footer.social.aria_label`, `sections.footer.social.instagram`, `sections.footer.social.facebook`, `sections.footer.social.youtube`, `sections.footer.social.tiktok`, `sections.footer.social.twitter`. PRESERVE existing `sections.footer.payment` key. |
| `locales/en.default.schema.json` | Add schema-editor keys under `sections.footer.settings` for the new settings and dividers (see section 8 for the full list). PRESERVE all existing Dawn-era keys in `sections.footer.*` (lines 856-940). |

### Files explicitly NOT edited

| Path | Reason |
| --- | --- |
| `layout/theme.liquid` | Section handle unchanged (`footer`); layout reference still resolves. |
| `templates/*.json` | Merchant-controlled per `CLAUDE.md`. |
| `config/settings_data.json` | Merchant-controlled. New settings populate from defaults on first load. |
| `config/settings_schema.json` | We are NOT introducing a `color_scheme_group` (same non-goal as the header plan). |
| `locales/*.json` (non-English) | Per `CLAUDE.md`: non-default locale files are managed by translators. "Missing translation" warnings on the new keys are expected and accepted. |
| `assets/*.css`, `assets/*.js` | Per the asset-location rule, all new CSS lives in the section's `{% stylesheet %}` block. No JS is added. Nothing in `assets/`. |
| `assets/icon-*.svg` | Reused as-is. No new icon files needed; all five social SVGs already exist (verified during planning). |
| Other section/snippet files | Out of scope. |

## 6. Schema proposal (full JSON, replacing the existing `{% schema %}` block)

```json
{
  "name": "t:general.footer",
  "settings": [
    {
      "type": "header",
      "content": "t:sections.footer.settings.header__color.content"
    },
    {
      "type": "color",
      "id": "footer_background",
      "label": "t:sections.footer.settings.footer_background.label",
      "default": "#111111"
    },
    {
      "type": "color",
      "id": "footer_text",
      "label": "t:sections.footer.settings.footer_text.label",
      "default": "#ffffff"
    },
    {
      "type": "header",
      "content": "t:sections.footer.settings.header__content.content"
    },
    {
      "type": "richtext",
      "id": "about_text",
      "label": "t:sections.footer.settings.about_text.label",
      "info": "t:sections.footer.settings.about_text.info"
    },
    {
      "type": "link_list",
      "id": "menu",
      "label": "t:labels.menu"
    },
    {
      "type": "header",
      "content": "t:sections.footer.settings.header__social.content"
    },
    {
      "type": "checkbox",
      "id": "show_social_icons",
      "label": "t:sections.footer.settings.show_social_icons.label",
      "default": true
    },
    {
      "type": "url",
      "id": "instagram_url",
      "label": "t:sections.footer.settings.instagram_url.label"
    },
    {
      "type": "url",
      "id": "facebook_url",
      "label": "t:sections.footer.settings.facebook_url.label"
    },
    {
      "type": "url",
      "id": "youtube_url",
      "label": "t:sections.footer.settings.youtube_url.label"
    },
    {
      "type": "url",
      "id": "tiktok_url",
      "label": "t:sections.footer.settings.tiktok_url.label"
    },
    {
      "type": "url",
      "id": "twitter_url",
      "label": "t:sections.footer.settings.twitter_url.label"
    },
    {
      "type": "header",
      "content": "t:sections.footer.settings.header__payment.content"
    },
    {
      "type": "checkbox",
      "id": "show_payment_icons",
      "label": "t:labels.show_payment_icons",
      "default": true
    }
  ]
}
```

### Schema notes

- **ID preservation.** `menu` and `show_payment_icons` keep their exact IDs, types, and defaults. The merchant's saved values for both persist after this change.
- **Setting reordering is safe.** Shopify identifies settings by `id`, not by position in the JSON array. Repositioning `show_payment_icons` to the end of the settings array (under the "Payment" divider) does NOT lose merchant data. Per `AGENTS.md` Coder guidance the Coder must "preserve `presets`, `blocks`, and `settings` types and order when editing existing schemas" — the rule on order is about avoiding *churn that confuses merchants*, not a hard data-integrity rule. In this case the reorganization is intentional UX improvement (settings now logically grouped under dividers).
- **No `presets`.** The existing schema has no `presets` (footer is layout-controlled, not merchant-droppable). Do not add one.
- **No `blocks`.** See non-goal in section 2.
- **No `enabled_on` / `disabled_on`.** Footer is layout-controlled.
- **Two `color` settings, not `color_scheme`.** Same rationale as the header plan; see goal #2 and section 4.1.
- **`about_text` is `richtext`** (not `text`). Brand "about" copy benefits from paragraph and inline-emphasis support. Shopify's `richtext` setting sanitizes input automatically.
- **`url` for each social link**, not `text`. The `url` setting type validates as a URL in the theme editor, presents a URL picker, and prevents copy-paste of malformed values.
- **`show_social_icons` defaults to `true`** so merchants who configure social URLs see them immediately without needing to toggle a second switch. The column still hides itself if all five URL settings are blank, regardless of the toggle.
- **`show_payment_icons` default stays `true`** (matches existing behavior — do not silently change merchant behavior).
- **`{ "name": "t:general.footer" }`** is unchanged from the existing schema. The existing key resolves to `"Footer"` in `locales/en.default.schema.json:17`.

Schema must validate cleanly against `schemas/section.json`. The Coder confirms with `shopify theme check`.

## 7. Liquid template outline for `sections/footer.liquid`

This is the proposed structure for the rewritten file. Comments mark key decisions and reference section numbers above.

```liquid
{%- liquid
  assign has_menu = false
  if section.settings.menu != blank and section.settings.menu.links.size > 0
    assign has_menu = true
  endif

  assign has_social = false
  if section.settings.show_social_icons
    if section.settings.instagram_url != blank
      assign has_social = true
    elsif section.settings.facebook_url != blank
      assign has_social = true
    elsif section.settings.youtube_url != blank
      assign has_social = true
    elsif section.settings.tiktok_url != blank
      assign has_social = true
    elsif section.settings.twitter_url != blank
      assign has_social = true
    endif
  endif

  assign has_about = false
  if section.settings.about_text != blank
    assign has_about = true
  endif

  assign social_label = 'sections.footer.social.aria_label' | t
  assign payment_label = 'sections.footer.payment' | t
  assign menu_label = 'sections.footer.menu' | t
-%}

<div class="theme-evolution-footer-wrapper">
  <footer class="theme-evolution-footer">
    {%- if has_about or has_menu or has_social -%}
      <div class="theme-evolution-footer__columns">
        {%- if has_about -%}
          <div class="theme-evolution-footer__column theme-evolution-footer__column--about">
            <div class="theme-evolution-footer__about-text rte">
              {{ section.settings.about_text }}
            </div>
          </div>
        {%- endif -%}

        {%- if has_menu -%}
          <nav class="theme-evolution-footer__column theme-evolution-footer__column--menu" aria-label="{{ menu_label | escape }}">
            <ul class="theme-evolution-footer__menu" role="list">
              {%- for link in section.settings.menu.links -%}
                <li>
                  <a href="{{ link.url }}" class="theme-evolution-footer__menu-link">{{ link.title | escape }}</a>
                </li>
              {%- endfor -%}
            </ul>
          </nav>
        {%- endif -%}

        {%- if has_social -%}
          <div class="theme-evolution-footer__column theme-evolution-footer__column--social">
            <ul class="theme-evolution-footer__social" role="list" aria-label="{{ social_label | escape }}">
              {%- if section.settings.instagram_url != blank -%}
                <li>
                  <a href="{{ section.settings.instagram_url }}" class="theme-evolution-footer__social-link" aria-label="{{ 'sections.footer.social.instagram' | t }}, {{ 'accessibility.link_messages.new_window' | t }}" rel="noopener" target="_blank">
                    {{ 'icon-instagram.svg' | inline_asset_content }}
                  </a>
                </li>
              {%- endif -%}
              {%- if section.settings.facebook_url != blank -%}
                <li>
                  <a href="{{ section.settings.facebook_url }}" class="theme-evolution-footer__social-link" aria-label="{{ 'sections.footer.social.facebook' | t }}, {{ 'accessibility.link_messages.new_window' | t }}" rel="noopener" target="_blank">
                    {{ 'icon-facebook.svg' | inline_asset_content }}
                  </a>
                </li>
              {%- endif -%}
              {%- if section.settings.youtube_url != blank -%}
                <li>
                  <a href="{{ section.settings.youtube_url }}" class="theme-evolution-footer__social-link" aria-label="{{ 'sections.footer.social.youtube' | t }}, {{ 'accessibility.link_messages.new_window' | t }}" rel="noopener" target="_blank">
                    {{ 'icon-youtube.svg' | inline_asset_content }}
                  </a>
                </li>
              {%- endif -%}
              {%- if section.settings.tiktok_url != blank -%}
                <li>
                  <a href="{{ section.settings.tiktok_url }}" class="theme-evolution-footer__social-link" aria-label="{{ 'sections.footer.social.tiktok' | t }}, {{ 'accessibility.link_messages.new_window' | t }}" rel="noopener" target="_blank">
                    {{ 'icon-tiktok.svg' | inline_asset_content }}
                  </a>
                </li>
              {%- endif -%}
              {%- if section.settings.twitter_url != blank -%}
                <li>
                  <a href="{{ section.settings.twitter_url }}" class="theme-evolution-footer__social-link" aria-label="{{ 'sections.footer.social.twitter' | t }}, {{ 'accessibility.link_messages.new_window' | t }}" rel="noopener" target="_blank">
                    {{ 'icon-twitter.svg' | inline_asset_content }}
                  </a>
                </li>
              {%- endif -%}
            </ul>
          </div>
        {%- endif -%}
      </div>
    {%- endif -%}

    <div class="theme-evolution-footer__bottom">
      <p class="theme-evolution-footer__copyright">
        &copy; {{ 'now' | date: '%Y' }} {{ shop.name | link_to: routes.root_url }} &middot; {{ powered_by_link }}
      </p>

      {%- if section.settings.show_payment_icons -%}
        <ul class="theme-evolution-footer__payment" role="list" aria-label="{{ payment_label | escape }}">
          {%- for type in shop.enabled_payment_types -%}
            <li>{{ type | payment_type_svg_tag }}</li>
          {%- endfor -%}
        </ul>
      {%- endif -%}
    </div>
  </footer>
</div>

{% style %}
  .theme-evolution-footer-wrapper {
    --footer-bg: {{ section.settings.footer_background }};
    --footer-text: {{ section.settings.footer_text }};
  }
{% endstyle %}

{% stylesheet %}
  /* --- wrapper + colors (decisions 4.1 + 4.7) --- */
  .theme-evolution-footer-wrapper {
    background-color: var(--footer-bg);
    color: var(--footer-text);
    --footer-border: color-mix(in srgb, currentColor 8%, transparent);
  }
  .theme-evolution-footer {
    padding: 4rem 2rem 2rem;
  }
  .theme-evolution-footer a {
    color: inherit;
    text-decoration: none;
  }
  .theme-evolution-footer a:hover {
    text-decoration: underline;
  }

  /* --- three-column grid content area (decision 4.2) --- */
  .theme-evolution-footer__columns {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 3rem;
    padding-bottom: 3rem;
  }
  .theme-evolution-footer__columns:empty {
    display: none;
    padding: 0;
  }

  /* --- column 1: about-text (decision 4.3) --- */
  .theme-evolution-footer__about-text {
    font-size: 0.9rem;
    line-height: 1.6;
    max-width: 32rem;
  }
  .theme-evolution-footer__about-text p {
    margin: 0 0 0.75rem;
  }
  .theme-evolution-footer__about-text p:last-child {
    margin-bottom: 0;
  }

  /* --- column 2: nav links (decision 4.4) --- */
  .theme-evolution-footer__menu {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .theme-evolution-footer__menu-link {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* --- column 3: social icons (decision 4.5) --- */
  .theme-evolution-footer__social {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .theme-evolution-footer__social-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    color: inherit;
  }
  .theme-evolution-footer__social-link svg {
    width: 1.4rem;
    height: 1.4rem;
    fill: currentColor;
  }

  /* --- bottom bar (decisions 4.6 + 4.7) --- */
  .theme-evolution-footer__bottom {
    border-top: 1px solid var(--footer-border);
    padding-top: 2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .theme-evolution-footer__copyright {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.85;
  }
  .theme-evolution-footer__payment {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  .theme-evolution-footer__payment li {
    display: inline-flex;
  }
  .theme-evolution-footer__payment svg {
    width: 2.4rem;
    height: 1.6rem;
  }

  /* --- mobile (decision 4.2): stack to single column at 749px and below --- */
  @media screen and (max-width: 749px) {
    .theme-evolution-footer {
      padding: 3rem 1.5rem 1.5rem;
    }
    .theme-evolution-footer__columns {
      grid-template-columns: 1fr;
      gap: 2rem;
      padding-bottom: 2rem;
    }
    .theme-evolution-footer__bottom {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .theme-evolution-footer__about-text {
      max-width: none;
    }
  }
{% endstylesheet %}

{% schema %}
  ... (full JSON from section 6 above) ...
{% endschema %}
```

### Key points the Coder must preserve from this outline

- **The `{% style %}` block sits at the top level of the section file**, OUTSIDE any `{% if %}`. It sets two custom properties: `--footer-bg` and `--footer-text` on `.theme-evolution-footer-wrapper`.
- **The `{% stylesheet %}` block also sits at the top level**, contains only static CSS (no Liquid interpolation), and is the SINGLE stylesheet block in the file.
- **No `{% javascript %}` block. No `<script>` block.** The footer is server-rendered Liquid only.
- **The wrapper class is `theme-evolution-footer-wrapper`**, matching the header's `theme-evolution-header-wrapper` naming pattern.
- **All five social SVGs are inlined via `{{ 'icon-NAME.svg' | inline_asset_content }}`**. No `<img>` tags are used for social icons (so the CLS `width`/`height` rule does not apply here — inline SVGs have intrinsic dimensions from `viewBox`).
- **Each social link has an `aria-label` from a locale key with a comma-space separator between the platform name and the new-window hint** (e.g., `aria-label="{{ 'sections.footer.social.instagram' | t }}, {{ 'accessibility.link_messages.new_window' | t }}"`). The comma yields a natural screen-reader pause and reads as "Instagram, Opens in a new window." rather than running the two phrases together.
- **The about-text `richtext` setting is NOT escaped on output** — richtext is already sanitized by Shopify's schema. Wrapping it in `| escape` would render visible `&lt;p&gt;` text.
- **The `menu` link list iteration uses `{{ link.title | escape }}`** because link titles are arbitrary merchant input.
- **The `has_social` guard chain uses `elsif`, not `or`** — per `CLAUDE.md`'s Liquid rule on chained logical operators.
- **The `:empty` pseudo-class on `.theme-evolution-footer__columns`** is forward-looking belt-and-braces only. Under current behavior the outer `{%- if has_about or has_menu or has_social -%}` guard skips rendering the container entirely when all three columns are hidden, so `:empty` cannot fire today. Kept in case a future change adds unconditional content inside the columns container. See section 4.2 and edge case #5.
- **Social SVGs that don't use `currentColor` fill** must be flagged in impl-notes. The CSS rule `.theme-evolution-footer__social-link svg { fill: currentColor; }` is a defensive override; if any SVG hardcodes `fill="#000000"` in an inner path, that path will not inherit. The Coder inspects each SVG in step 5 item 5.
- **`shop.name | link_to: routes.root_url`** in the copyright line is preserved verbatim (Liquid filter chain output, no `| escape` needed because `link_to` produces a safe `<a>` tag).
- **`powered_by_link`** is preserved verbatim.
- **`&middot;` replaces the existing comma separator** between the shop link and the powered-by link in the copyright line.

## 8. Locale keys to add

### `locales/en.default.json` (storefront strings)

Merge into the existing `sections.footer` object (currently `locales/en.default.json:184-186`). The existing `payment` key MUST be preserved verbatim — it is already used by this plan's bottom-bar `aria-label`.

```json
{
  "sections": {
    "footer": {
      "payment": "Payment methods",
      "menu": "Footer menu",
      "social": {
        "aria_label": "Social media",
        "instagram": "Instagram",
        "facebook": "Facebook",
        "youtube": "YouTube",
        "tiktok": "TikTok",
        "twitter": "X (Twitter)"
      }
    }
  }
}
```

Notes:
- `sections.footer.payment` is **kept** with its existing value `"Payment methods"`. Do NOT remove or change this key.
- `sections.footer.menu` is a new storefront key (value `"Footer menu"`) used as the `aria-label` on the `<nav>` landmark. It MUST live in `en.default.json`, NOT in `en.default.schema.json`. The `labels.*` namespace in the schema-locale file is editor-only and does not resolve via `| t` on the storefront — using `'labels.menu' | t` would render the literal string `"labels.menu"` in the browser.
- `sections.footer.social.aria_label` is the accessible name of the `<ul>` containing social icons.
- `sections.footer.social.{platform}` is the per-icon `aria-label`. Note: the Twitter value is `"X (Twitter)"` (matching the platform's 2023 rebrand and the pattern already used in `general.social.links.twitter` in `en.default.json`).
- Sentence case is followed everywhere; proper nouns (platform names) retain their official capitalization. This matches the `CLAUDE.md` rule "Use sentence case for all user-facing text, including titles, headings, and button labels (capitalize only the first word and proper nouns)".
- The `accessibility.link_messages.new_window` key (value `"Opens in a new window."`, already present at `en.default.json:259`) is reused inline in social-link `aria-label` attributes to alert screen-reader users that the link opens in a new tab. The platform name and the new-window hint are joined with a comma+space so the result reads naturally as "Instagram, Opens in a new window." No new key is required.

### `locales/en.default.schema.json` (theme-editor strings)

Merge into the existing `sections.footer` object (currently `locales/en.default.schema.json:856-940`). PRESERVE all existing Dawn-era keys in this block (`blocks.link_list`, `blocks.brand_information`, `blocks.text`, `settings.newsletter_enable`, `settings.newsletter_heading`, `settings.header__1`, `settings.show_social`, `settings.enable_country_selector`, `settings.enable_language_selector`, `settings.payment_enable`, `settings.show_policy`, `settings.margin_top`, `settings.header__9`, `settings.enable_follow_on_shop`). None of those are referenced by this plan's schema; they live alongside the new keys without conflict.

Add these new keys under `sections.footer.settings`:

```json
{
  "sections": {
    "footer": {
      "settings": {
        "header__color": {
          "content": "Color"
        },
        "footer_background": {
          "label": "Footer background color"
        },
        "footer_text": {
          "label": "Footer text color"
        },
        "header__content": {
          "content": "Content"
        },
        "about_text": {
          "label": "About text",
          "info": "Short brand or store description shown in the leftmost column."
        },
        "header__social": {
          "content": "Social media"
        },
        "show_social_icons": {
          "label": "Show social icons"
        },
        "instagram_url": {
          "label": "Instagram URL"
        },
        "facebook_url": {
          "label": "Facebook URL"
        },
        "youtube_url": {
          "label": "YouTube URL"
        },
        "tiktok_url": {
          "label": "TikTok URL"
        },
        "twitter_url": {
          "label": "Twitter URL"
        },
        "header__payment": {
          "content": "Payment"
        }
      }
    }
  }
}
```

Notes:
- **New divider keys: `header__color`, `header__content`, `header__social`, `header__payment`.** We use the Dawn convention of `header__NAME` (double-underscore) for visual section dividers inside the `settings` object. The existing `sections.footer.settings.header__1` and `header__9` keys follow this same convention — we are adding four more in the same style. We do NOT reuse `header__1` (its value is `"Email signup"`, not what we want), and we do NOT reuse `header__9` (its value is `"Utilities"`, also not what we want). The new keys have semantic names instead of Dawn's numeric suffix because we are not constrained by Dawn's ordering.
- **`show_social_icons` label is "Show social icons"** (sentence case).
- **Platform URL labels use the platform's official capitalization** (`Instagram URL`, `YouTube URL`, `TikTok URL`).
- **`about_text.info` provides UX hint copy** explaining what the field is for. Sentence case, ends with a period.
- **No new key for `t:labels.show_payment_icons`** — the existing key at `locales/en.default.schema.json` (referenced by the existing schema) is preserved and reused.
- **No new key for `t:labels.menu`** — same, reused.

The Coder runs `python3 -m json.tool locales/en.default.schema.json > /dev/null && echo OK` (and the same for `en.default.json`) after editing each locale file to verify valid JSON before committing.

## 9. Risks, edge cases, and open questions

### Risks

1. **Visual change for existing merchants on first load.** The new `footer_background` (`#111111`) and `footer_text` (`#ffffff`) defaults take effect immediately when this section is loaded after deploy. Existing merchants whose footer currently rendered with `var(--color-foreground)` on the page background (typically dark text on white) will see a dark footer bar with white text on first page load. No merchant data is lost; they can override the colors via the theme editor at any time. This matches the Ride design intent. **Mitigation:** Document this in `docs/plans/theme-evolution-footer-impl-notes.md` so the DevOps hand-off surfaces it to the operator. Same pattern as the header plan's risk #1.

2. **Social icon SVGs — pre-verified `currentColor` compliant.** All five social SVGs were inspected during planning: `icon-instagram.svg`, `icon-facebook.svg`, `icon-youtube.svg`, `icon-tiktok.svg`, and `icon-twitter.svg` all use `fill="currentColor"` on the path element. No hardcoded fill colors were found. The CSS rule `.theme-evolution-footer__social-link svg { fill: currentColor; }` is a defensive belt-and-braces measure only — no CSS override is required. The Coder does NOT need to re-inspect the SVG files; document this pre-verification in impl-notes.

3. **`color-mix()` browser support for `--footer-border`.** Same as header risk #11: Safari 16.2+, Chrome 111+, Firefox 113+. Pre-2023 browsers will fall back to the default border color (effectively `currentColor`), which is a graceful fallback — the divider will be slightly heavier than intended but visible.

4. **Repositioning `show_payment_icons` in the settings array.** Per Shopify, settings are identified by `id` not by position, so repositioning is safe and merchants' saved values persist. The Coder verifies this by opening the theme editor after the schema swap and confirming the existing `show_payment_icons` toggle state is preserved. Document the verification in impl-notes.

5. **`<ul>`/`<li>` semantic change to the nav and payment lists.** The existing markup uses flat `<a>` siblings for nav and flat SVG siblings for payment icons. We switch to semantic `<ul><li>...</li></ul>`. This is a markup change but visually identical because the CSS applies `list-style: none; margin: 0; padding: 0` on the lists. Screen readers will now announce "list of 5 items" — an improvement. No regression risk if the CSS resets are correct.

6. **Non-default locale "missing translation" warnings.** Adding new English keys will produce warnings in `locales/es.json`, `locales/fr.json`, etc. Per `CLAUDE.md`, these are accepted and translator-managed. The Coder must list the new keys in impl-notes.

7. **Pre-existing `shopify theme check` offenses.** Per `CLAUDE.md` QA notes: `TranslationKeyExists` in `cart-drawer.liquid` and `UnusedAssign` in `card-product.liquid` are expected pre-existing warnings unrelated to this work. The Coder does not chase them.

8. **`payment_type_svg_tag` output dimensions.** The Liquid filter `payment_type_svg_tag` returns an `<svg>` element. We apply `.theme-evolution-footer__payment svg { width: 2.4rem; height: 1.6rem; }` to standardize sizes. Some payment SVGs (American Express vs Visa vs Apple Pay) have different intrinsic aspect ratios; forcing both width and height may distort them. **Decision:** keep the height fixed at `1.6rem` and switch `width` to `auto` (let intrinsic aspect ratio decide):

    ```css
    .theme-evolution-footer__payment svg {
      width: auto;
      height: 1.6rem;
    }
    ```

    Update the snippet in section 7 to match. QA should visually confirm payment icons appear at consistent height with natural width.

9. **`footer` element has implicit `contentinfo` landmark in Safari.** Wrapping the `<footer>` in another `<div class="theme-evolution-footer-wrapper">` does not change this — `<footer>` remains the landmark. Screen reader navigation via landmarks lands on the same element. No accessibility regression.

10. **Future color-scheme-system migration cost.** Same as header risk #10: if a future ticket introduces a `color_scheme_group` in `config/settings_schema.json` and `.color-scheme-N` CSS, this section's two loose `color` settings will need a migration plan. Acknowledged and deferred.

11. **Footer is mounted via section-group, not directly via `{% section %}`**. The footer is included via `sections/footer-group.json`, not via a `{% section 'footer' %}` tag in `layout/theme.liquid`. Shopify auto-wraps the section-group in a `.shopify-section-group-footer-group` container. This means `.theme-evolution-footer-wrapper` (which carries `background-color: var(--footer-bg)`) is a child of that auto-wrapper — if the auto-wrapper constrains width, the dark background may not paint edge-to-edge. **Mitigation:** In step 5 item 7 / step 6 item 3, the Coder must visually confirm the background extends full-viewport-width. If it does not, add a CSS rule targeting the Shopify-generated wrapper class: `.shopify-section-group-footer-group { background-color: var(--footer-bg); }` and document the change in impl-notes as a deviation. No structural change to the plan is required unless the visual check fails.

### Edge cases

1. **About text blank.** Column hidden via `has_about` guard. Grid collapses to 2 columns.
2. **Menu unset or empty.** Column hidden via `has_menu` guard. Grid collapses.
3. **`show_social_icons` true but all five URL settings blank.** `has_social` evaluates to `false`. Column hidden.
4. **`show_social_icons` false.** Column hidden regardless of URL settings.
5. **All three columns hidden** (no about, no menu, no socials). The outer `{% if has_about or has_menu or has_social %}` skips the `.theme-evolution-footer__columns` container entirely; only the bottom bar renders. Note: the `:empty` CSS rule on `.theme-evolution-footer__columns` cannot fire given this outer guard — the element is simply not rendered. The rule is kept as a guard against future additions that might add unconditional content inside the columns container, but should be treated as forward-looking protection, not current behavior.
6. **`show_payment_icons` true but `shop.enabled_payment_types` is empty.** The `<ul>` renders empty. CSS gives it zero children, zero gap, zero visible width. Acceptable. (Same behavior as the existing footer.)
7. **A social URL setting contains a malformed URL (e.g., `javascript:alert(1)`).** Shopify's `url` setting type validates the URL on save and rejects non-http(s) schemes. Defense-in-depth: the link uses `rel="noopener" target="_blank"` so even if a malformed URL slipped through, the new tab context limits exposure. (Cross-tab `window.opener` access blocked.)
8. **`about_text` contains a `<script>` tag.** Shopify's `richtext` setting sanitizes input on save and strips `<script>`, `<style>`, and other dangerous tags. Safe to output without `| escape`.
9. **Right-to-left languages.** The wrapper inherits `dir="rtl"` from `<html>` if set. The grid columns reverse order naturally (CSS grid is direction-aware), and the bottom bar's `space-between` swaps the copyright and payment icons sides. No additional work needed.
10. **Mobile viewport between 750px (desktop CSS) and 749px (mobile CSS).** The breakpoint is inclusive on both sides via `max-width: 749px`. At exactly 750px the desktop layout applies; at 749px the mobile stack applies. Matches the header plan's breakpoint exactly.
11. **Page that has its own footer-like content.** Out of scope — pages render their own templates; this section appears once per layout.

### Open questions

None outstanding. The design reference, the social-icon SVG inventory, the `color_scheme` avoidance pattern, and the `header_background`/`header_text` precedent from the header plan together fully specify the implementation.

## 10. Step-by-step implementation checklist for the Coder

Work in this order. Run `shopify theme check` after **each** step and address warnings before continuing (excluding the two pre-existing offenses in `cart-drawer.liquid` and `card-product.liquid` per `CLAUDE.md`). Commit at every step where indicated.

### Step 0 — Baseline theme check (before any edits)

1. Run `shopify theme check` on the unmodified codebase and record the output. Confirm that exactly two pre-existing offenses are present: `TranslationKeyExists` in `cart-drawer.liquid` and `UnusedAssign` in `card-product.liquid`. If there are additional offenses, resolve them before proceeding — they are not regressions from this work.
2. Record the baseline offense count in `docs/plans/theme-evolution-footer-impl-notes.md` so later `theme check` runs can be compared against it.

### Step 1 — Add locale keys

1. Open `locales/en.default.json`. Merge into the existing `sections.footer` object (around line 184-186) the new `menu`, `social.aria_label`, `social.instagram`, `social.facebook`, `social.youtube`, `social.tiktok`, `social.twitter` keys. Do NOT remove the existing `payment` key.
2. Open `locales/en.default.schema.json`. Add to the existing `sections.footer.settings` object (around line 898) the new dividers (`header__color`, `header__content`, `header__social`, `header__payment`) and the new setting label/info keys (`footer_background`, `footer_text`, `about_text`, `show_social_icons`, `instagram_url`, `facebook_url`, `youtube_url`, `tiktok_url`, `twitter_url`). Match the JSON in section 8 exactly. PRESERVE every existing Dawn-era key in `sections.footer.*`.
3. Run `python3 -m json.tool locales/en.default.json > /dev/null && echo OK` to confirm valid JSON. Repeat for `locales/en.default.schema.json`. If either does not print `OK`, fix the JSON before continuing.
4. Do NOT touch any non-default locale file. Expect "missing translation" warnings on the new keys — document them in `docs/plans/theme-evolution-footer-impl-notes.md` at the end.
5. Run `shopify theme check`. Confirm no schema-validation errors. The two pre-existing offenses are acceptable.
6. Commit: `chore(locales): add footer color, content, and social media keys`.

### Step 2 — Rewrite schema in `sections/footer.liquid`

1. Open `sections/footer.liquid`. Replace ONLY the `{% schema %}` block (lines 40-56) with the JSON from section 6.
2. Verify:
   - The existing `menu` setting (type `link_list`, label `t:labels.menu`) is present with byte-identical ID and type.
   - The existing `show_payment_icons` setting (type `checkbox`, default `true`) is present at the END of the array, under a `{ "type": "header", "content": "t:sections.footer.settings.header__payment.content" }` divider, with byte-identical ID, type, default, and label key.
   - The new color settings (`footer_background`, `footer_text`) have correct defaults (`#111111` and `#ffffff`).
   - `about_text` is `richtext`, not `text`.
   - All five URL settings are `url` type, not `text`.
   - `show_social_icons` defaults to `true`.
   - Four dividers (`header__color`, `header__content`, `header__social`, `header__payment`) are placed in the correct positions per section 6.
   - The schema has NO `presets`, NO `blocks`, NO `enabled_on`, NO `disabled_on`, NO `color_scheme`.
3. Run `shopify theme check`. The schema must validate against `schemas/section.json`.
4. Open the theme editor, navigate to the footer section, and confirm:
   - The existing `menu` and `show_payment_icons` settings retain their values (e.g., if a link list was selected before, it still appears).
   - The new settings appear in the correct order with four visual dividers labeled "Color", "Content", "Social media", "Payment".
   - Labels are in sentence case.
5. Commit: `feat(footer): add color, content, social, and payment settings`.

### Step 3 — Rewrite markup: wrapper, three columns, bottom bar

1. In `sections/footer.liquid`, replace the existing markup (lines 1-21) with the structure from section 7. Specifically:
   - Add the `{%- liquid ... -%}` setup block at the top that pre-assigns `has_menu`, `has_social`, `has_about`, `social_label`, `payment_label`.
   - Wrap everything in `<div class="theme-evolution-footer-wrapper"><footer class="theme-evolution-footer">...</footer></div>`.
   - Inside the `<footer>`, render the `.theme-evolution-footer__columns` grid (only when at least one of `has_about`, `has_menu`, `has_social` is true), then the `.theme-evolution-footer__bottom`.
   - Column 1 (about-text): output `{{ section.settings.about_text }}` WITHOUT `| escape`.
   - Column 2 (menu): `<nav>` + `<ul>` + `<li>` structure with `role="list"` on the `<ul>`. Each link title is `| escape`-d.
   - Column 3 (social): `<ul>` with one `<li>` per platform whose URL is non-blank. Each `<a>` has `aria-label` from the per-platform locale key, `rel="noopener" target="_blank"`, and inlines the matching SVG via `inline_asset_content`.
   - Bottom bar: `<p>` for copyright (`&middot;` separator between shop link and powered-by-link), and `<ul>` for payment icons (when `show_payment_icons` is true) using `payment_type_svg_tag`.
2. Run `shopify theme check`. Address any warnings beyond the two pre-existing offenses.
3. Visually verify in the theme editor:
   - All three columns render when about-text, menu, and at least one social URL are configured.
   - Each column disappears independently when its data is removed.
   - With all three columns hidden, only the bottom bar renders (no empty content row).
4. Commit: `feat(footer): restructure into three-column layout with bottom bar`.

### Step 4 — Add `{% style %}` block for color CSS custom properties

1. After the closing `</div>` of the wrapper, add the new `{% style %}` block from section 7:
   ```liquid
   {% style %}
     .theme-evolution-footer-wrapper {
       --footer-bg: {{ section.settings.footer_background }};
       --footer-text: {{ section.settings.footer_text }};
     }
   {% endstyle %}
   ```
2. Confirm the `{% style %}` block sits at the TOP LEVEL of the file (outside any `{% if %}`). This is required by `CLAUDE.md`.
3. Run `shopify theme check`.
4. In the theme editor, change `footer_background` to a custom color (e.g., `#003366`) and confirm the footer updates without a page reload (color settings hot-reload when wired via `{% style %}`).
5. Confirm `footer_text` updates the text and link colors in lockstep.
6. Commit: `feat(footer): wire color settings via CSS custom properties`.

### Step 5 — Rewrite `{% stylesheet %}` block

1. Replace the existing `{% stylesheet %}` block (lines 23-38) with the full static CSS from section 7 (everything under the `/* --- wrapper + colors --- */` comment through the mobile media query).
2. Apply the section 9 risk #8 fix to the payment-icons rule: `width: auto; height: 1.6rem;` (not `width: 2.4rem`).
3. Confirm the `{% stylesheet %}` block contains NO Liquid interpolation (no `{{ ... }}` and no `{% ... %}` inside).
4. Confirm the block sits at the TOP LEVEL of the file (outside any `{% if %}`).
5. **Social SVG `currentColor` compliance — pre-verified.** All five social SVGs (`icon-instagram.svg`, `icon-facebook.svg`, `icon-youtube.svg`, `icon-tiktok.svg`, `icon-twitter.svg`) were inspected during planning and confirmed to use `fill="currentColor"` on the path element. No Coder re-inspection is required. The CSS rule `.theme-evolution-footer__social-link svg { fill: currentColor; }` is defensive only. In impl-notes, record: "All five social SVGs verified `fill='currentColor'` compliant during planning (plan-reviewer inspection); defensive CSS rule retained as belt-and-braces."
6. Run `shopify theme check`. Address warnings beyond the two pre-existing offenses.
7. Visually verify in the theme editor at both desktop (1440x900) and mobile (375x667) viewports:
   - **Desktop:** three columns side by side with `2fr 1fr 1fr` proportions; about-text on the left, nav links in the middle, social icons on the right; bottom bar below with copyright on the left and payment icons on the right.
   - **Mobile:** all columns stacked vertically in order (about -> menu -> social); bottom bar stacks with copyright above payment icons; everything center-aligned.
   - With a LIGHT `footer_background` (e.g., `#f5f5f5` with `footer_text: #111111`), the bottom-bar separator border is still visible (proves `--footer-border` is working).
   - Social icons inherit `--footer-text` color.
   - Payment icons appear at uniform height with natural aspect-ratio widths.
8. Commit: `feat(footer): apply three-column grid and bottom-bar styling`.

### Step 6 — End-to-end smoke and final theme-check

1. Run `shopify theme check` one final time. Confirm zero errors beyond the two pre-existing offenses.
2. Visit a real product URL from `docs/dev-fixtures.md` (e.g., `the-3p-fulfilled-snowboard` or `the-complete-snowboard`) on the dev server (via the `https://<hash>.shopifypreview.com` URL printed by `shopify theme dev`, NOT `127.0.0.1:9292`).
3. Verify at desktop (1440x900) and mobile (375x667):
   - Footer renders with the configured columns.
   - Color matches the configured `footer_background` and `footer_text`.
   - **Section-group full-bleed check (risk #11):** Confirm the dark background (`footer_background`) extends edge-to-edge at full viewport width. If the background is clipped by the Shopify section-group auto-wrapper, add a CSS rule in the `{% stylesheet %}` block: `.shopify-section-group-footer-group { background-color: var(--footer-bg); }` and document the deviation in impl-notes.
   - Bottom bar shows the current year, the shop name as a link, the "Powered by Shopify" link, and the payment icons.
   - Confirm the payment icon `<ul>` has `aria-label="Payment methods"` in the rendered HTML (inspect element).
   - No console errors.
4. **Click-test social links:** Click one configured social link and confirm it opens the correct URL in a new browser tab. This validates `target="_blank"` + `href` resolution.
5. Test schema round-trip: open the theme editor, change a setting (e.g., `footer_text`), save, refresh the page, confirm the value persists.
6. Document any non-default-locale "missing translation" warnings in `docs/plans/theme-evolution-footer-impl-notes.md`.
7. Write `docs/plans/theme-evolution-footer-impl-notes.md` summarizing:
   - Any deviations from this plan with rationale.
   - Exact commit SHAs for each step.
   - Test product handle used during smoke verification.
   - Confirmation of the four key constraints: two explicit `color` settings (NOT `color_scheme`), all CSS in section file (no asset edits), no JS introduced, `menu` and `show_payment_icons` IDs preserved byte-identical.
   - SVG pre-verification result (all five social SVGs confirmed `fill='currentColor'` compliant during planning; no Coder inspection performed).
   - Schema round-trip verification (step 6 item 5).
   - Color-default-change note (verbatim from header plan template, adapted for footer): "Existing merchants whose footer currently rendered with `var(--color-foreground)` on the page background WILL see a dark footer bar (`#111111`) with white text (`#ffffff`) on first page load after this ships, because the new `footer_background` / `footer_text` defaults take effect immediately. This is intentional and matches the Ride design target. The DevOps hand-off must surface this to the operator before publish so the operator can communicate it to any downstream merchant. No merchant data is lost; the merchant can re-enter the old colors via the theme editor at any time."
   - `color-mix()` browser support note: state whether the bare `color-mix()` declaration is used or a static `border-color` fallback was added, and which browsers were tested.
   - Screenshots (mobile 375x667 and desktop 1440x900) of:
     - Full footer with all three columns configured.
     - Footer with only about-text and menu (no socials).
     - Footer with only socials.
     - Footer with NO columns (only bottom bar).
     - Footer with a LIGHT `footer_background` demonstrating the divider remains visible (`--footer-border` proof).
   - List of any accepted `shopify theme check` warnings and the rationale.

### Step 7 — Hand-off

1. Do NOT auto-deploy. The DevOps stage runs only after `docs/qa/theme-evolution-footer.approved` exists (zero-byte sentinel file, created manually after QA passes).
2. Stop. The Plan-Reviewer takes over.

---

## Decisions

1. **Color settings, not `color_scheme`.** Two explicit `color` settings (`footer_background`, `footer_text`) wired through CSS custom properties on `.theme-evolution-footer-wrapper`. Matches the header plan's verified approach and avoids the latent no-op `color_scheme` would create in this codebase. (Section 4.1, goal #2.)
2. **Explicit `grid-template-columns: 2fr 1fr 1fr`, not `auto-fit`.** The three columns have semantically distinct content and the design wants the about-text column wider than the nav and social columns. Explicit columns also play cleanly with conditional column rendering. (Section 4.2.)
3. **No column heading on the about-text column.** The Ride design shows flowing body copy without a separate "About" heading; merchants who want one can include it inside the richtext field. Keeps the schema lean. (Section 4.3.)
4. **`<ul>` + `<li>` semantic structure for nav, social, and payment lists.** Markup improvement over the existing flat-siblings approach; visually identical with `list-style: none` resets. Improves screen-reader UX with "list of N items" announcements. (Sections 4.4, 4.5, 4.6.)
5. **Per-platform `aria-label` on each social link.** Screen readers announce "Instagram", "Facebook", etc., rather than the raw URL. Five new translation keys under `sections.footer.social.*`. (Section 4.5, section 8.)
6. **Chained `elsif`, not logical `or`, in the `has_social` guard.** Follows `CLAUDE.md`'s Liquid rule for multi-operator logic. (Section 4.5.)
7. **`url` setting type for social links (not `text`).** Built-in URL validation in the theme editor; rejects non-http(s) schemes on save. (Section 6.)
8. **`richtext` for `about_text` (not `text`).** Brand copy benefits from paragraph and inline-emphasis support; Shopify sanitizes input automatically. (Section 6, section 4.3.)
9. **Reposition `show_payment_icons` to the end of the schema under a "Payment" divider.** Safe because Shopify identifies settings by ID, not position. Improves theme-editor UX. (Section 6, section 4.9.)
10. **Bottom-bar separator border uses `color-mix(in srgb, currentColor 8%, transparent)`.** Same pattern as the header plan's `--header-border`. Stays visible on any background color. Browser support: Safari 16.2+, Chrome 111+, Firefox 113+ — acceptable for this theme. (Section 4.7, risk #3.)
11. **Payment icon CSS: `width: auto; height: 1.6rem` (not fixed width).** Preserves natural aspect ratios across payment SVGs of varying proportions (Visa vs Amex vs Apple Pay). (Section 9 risk #8, section 7.)
12. **No JavaScript.** Footer is server-rendered Liquid only. No accordion, no carousel, no Web Component. (Section 4.8.)
13. **`&middot;` separator in the copyright line (replaces the existing comma).** Matches the design reference's visual separator style. (Section 4.6, section 7.)
14. **`rel="noopener" target="_blank"` on social links** (not `rel="noreferrer"`). Standard pattern for off-site social links; the merchant likely wants referrer analytics from the social platforms. (Section 4.5, edge case #7.)
15. **New schema-divider keys named semantically (`header__color`, `header__content`, `header__social`, `header__payment`) rather than reusing Dawn's `header__1` / `header__9` numeric convention.** Dawn's numeric keys exist (lines 906, 932 of `locales/en.default.schema.json`) but their values (`"Email signup"`, `"Utilities"`) do not match what we want. Semantic names are easier to maintain. (Section 8.)

---

## Checklist (Coder TODO summary)

### Step 0 — Baseline

- [ ] Run `shopify theme check` before any edits; confirm baseline of exactly two pre-existing offenses. Record in impl-notes.

### Step 1 — Locales

- [ ] Add new storefront keys under `sections.footer` in `locales/en.default.json` (`menu`, `social.aria_label`, `social.instagram`, `social.facebook`, `social.youtube`, `social.tiktok`, `social.twitter`). Preserve the existing `payment` key.
- [ ] Add new schema-editor keys under `sections.footer.settings` in `locales/en.default.schema.json` (`header__color.content`, `footer_background.label`, `footer_text.label`, `header__content.content`, `about_text.label`, `about_text.info`, `header__social.content`, `show_social_icons.label`, `instagram_url.label`, `facebook_url.label`, `youtube_url.label`, `tiktok_url.label`, `twitter_url.label`, `header__payment.content`). Preserve all existing Dawn-era keys in the same block.
- [ ] Validate both JSON files with `python3 -m json.tool`.
- [ ] Run `shopify theme check`.
- [ ] Commit: `chore(locales): add footer color, content, and social media keys`.

### Step 2 — Schema

- [ ] Replace the `{% schema %}` block in `sections/footer.liquid` with the JSON from section 6.
- [ ] Verify `menu` and `show_payment_icons` keep byte-identical IDs, types, and defaults.
- [ ] Verify all four header dividers are placed correctly.
- [ ] Verify no `presets`, no `blocks`, no `color_scheme`.
- [ ] Run `shopify theme check`.
- [ ] Confirm in the theme editor that existing values are preserved and new settings appear in the right order under the right dividers.
- [ ] Commit: `feat(footer): add color, content, social, and payment settings`.

### Step 3 — Markup

- [ ] Add the top-level `{%- liquid ... -%}` setup block.
- [ ] Wrap markup in `.theme-evolution-footer-wrapper` > `.theme-evolution-footer`.
- [ ] Render `.theme-evolution-footer__columns` grid conditionally; render each of the three columns conditionally.
- [ ] About column: output `{{ section.settings.about_text }}` (no `| escape`).
- [ ] Menu column: `<nav>` > `<ul role="list">` > `<li>` > `<a>` with escaped title.
- [ ] Social column: `<ul role="list" aria-label="...">` > one `<li>` per non-blank URL, each `<a>` with `aria-label`, `rel="noopener" target="_blank"`, inlined SVG.
- [ ] Bottom bar: `<p>` copyright with `&middot;` separator; `<ul aria-label="Payment methods">` for payment icons.
- [ ] Run `shopify theme check`.
- [ ] Commit: `feat(footer): restructure into three-column layout with bottom bar`.

### Step 4 — `{% style %}`

- [ ] Add a top-level `{% style %}` block setting `--footer-bg` and `--footer-text` on `.theme-evolution-footer-wrapper`.
- [ ] Confirm the block is OUTSIDE any `{% if %}`.
- [ ] Verify hot-reload of color settings in the theme editor.
- [ ] Commit: `feat(footer): wire color settings via CSS custom properties`.

### Step 5 — `{% stylesheet %}`

- [ ] Replace the existing `{% stylesheet %}` block with the static CSS from section 7.
- [ ] Apply the section 9 risk #8 fix: payment icons use `width: auto; height: 1.6rem`.
- [ ] Confirm no Liquid interpolation inside the block.
- [ ] Confirm the block is at the top level.
- [ ] Social SVGs are pre-verified `fill="currentColor"` compliant (all five, confirmed during planning). Record in impl-notes; no re-inspection needed.
- [ ] Run `shopify theme check`.
- [ ] Visual verification at 1440x900 and 375x667, with both DARK and LIGHT footer-background settings.
- [ ] **Section-group full-bleed check (risk #11):** confirm dark background extends edge-to-edge. If clipped, add `.shopify-section-group-footer-group { background-color: var(--footer-bg); }` and document as a deviation.
- [ ] Commit: `feat(footer): apply three-column grid and bottom-bar styling`.

### Step 6 — Smoke and impl-notes

- [ ] Final `shopify theme check` (two pre-existing offenses acceptable).
- [ ] Smoke test on a real product page via the `shopifypreview.com` URL at 1440x900 and 375x667.
- [ ] **Section-group full-bleed check:** confirm footer background extends edge-to-edge; document any CSS deviation in impl-notes.
- [ ] **Click-test:** click one configured social link; confirm it opens the correct URL in a new tab.
- [ ] Confirm payment icon `<ul>` has `aria-label="Payment methods"` in the DOM (inspect element).
- [ ] Verify schema round-trip (change a setting, save, refresh, confirm persistence).
- [ ] Write `docs/plans/theme-evolution-footer-impl-notes.md` with: deviations, commit SHAs, test product handle, four-constraint confirmation, SVG pre-verification result, color-default-change note (verbatim from section 10 step 6 item 7), `color-mix()` browser support note, screenshots, list of accepted warnings.

### Step 7 — Hand-off

- [ ] Stop. Do NOT auto-deploy. The Plan-Reviewer takes over; DevOps runs only after `docs/qa/theme-evolution-footer.approved` exists.

---

## Appendix A — Mapping rationale to project directives

| Directive (`CLAUDE.md`) | How this plan complies |
| --- | --- |
| No `{% include %}`; always `{% render %}` | Plan adds no new snippets; SVGs are inlined via `inline_asset_content`, not via `{% render %}` or `{% include %}`. |
| CLS prevention — explicit `width`/`height` on `<img>` and `<iframe>` | N/A. No `<img>` or `<iframe>` is added. Social icons are inline SVG (intrinsic dimensions from `viewBox`); payment icons come from `payment_type_svg_tag`. |
| LCP — `preload: true` for hero images | N/A. Footer is below-the-fold; no LCP candidates here. |
| Asset location — no component CSS/JS in `assets/` | All new CSS lives in `{% stylesheet %}` and `{% style %}` blocks inside `sections/footer.liquid`. No JS added. Nothing in `assets/`. |
| `{% stylesheet %}` only in sections, only static rules | The single `{% stylesheet %}` block in the section contains only static CSS. |
| `{% style %}` only in sections, NEVER inside Liquid logic | The `{% style %}` block sits at the top level of the section, outside any `{% if %}`. |
| `{% javascript %}` and `<script>` rules | N/A. No JS introduced. |
| Web Component namespacing | N/A. No custom elements introduced. |
| Block-first architecture | Footer uses no blocks (per non-goal in section 2). The three columns are settings-driven, not merchant-composable blocks. Justified deviation. |
| Semantic HTML / one `<h1>` per page | `<footer>` is the landmark; no `<h1>` is added. Nav column uses `<nav>` for landmark semantics. Lists use `<ul>`/`<li>`. |
| Sentence case for merchant copy | All new labels and dividers follow sentence case (`"Show social icons"`, `"Footer background color"`, etc.). Platform names retain official capitalization (`YouTube`, `TikTok`). |
| Translation via `t:` keys | All user-facing strings reference `t:` keys; all `'key' | t` calls in Liquid are pre-assigned in the top-level `{%- liquid -%}` block where reused. |
| Locale files — English only | Only `locales/en.default.json` and `locales/en.default.schema.json` are edited. Non-default locale warnings documented in impl-notes. |
| Schema validation against `schemas/section.json` | The Coder runs `shopify theme check` after every step. |
| Do not edit `templates/*.json`, `config/settings_data.json`, non-default locales, `.shopify/` | Explicitly listed in "Files explicitly NOT edited". `config/settings_schema.json` is also explicitly NOT edited. |
| Schema round-trip — preserve `presets`/`blocks`/`settings` types | The two pre-existing settings (`menu`, `show_payment_icons`) keep their IDs, types, defaults, and label keys byte-identical. Repositioning is safe (ID-based lookup). |

---

## Appendix B — Quick reference for the Coder

| What | Where |
| --- | --- |
| Wrapper class | `theme-evolution-footer-wrapper` |
| Footer color settings | Two `color` settings: `footer_background` (default `#111111`), `footer_text` (default `#ffffff`). Wired via `--footer-bg` / `--footer-text` custom properties on `.theme-evolution-footer-wrapper`. NOT `color_scheme`. |
| Schema dividers | Four `{ "type": "header" }` entries: `header__color`, `header__content`, `header__social`, `header__payment`. |
| Preserved schema IDs | `menu` (link_list), `show_payment_icons` (checkbox, default `true`). |
| New schema setting IDs | `footer_background`, `footer_text`, `about_text`, `show_social_icons`, `instagram_url`, `facebook_url`, `youtube_url`, `tiktok_url`, `twitter_url`. |
| New storefront locale keys | `sections.footer.menu` (`"Footer menu"` — storefront only, not schema-locale), `sections.footer.social.aria_label`, `sections.footer.social.instagram`, `sections.footer.social.facebook`, `sections.footer.social.youtube`, `sections.footer.social.tiktok`, `sections.footer.social.twitter` (Twitter value: `"X (Twitter)"`). |
| New schema locale keys | `sections.footer.settings.header__color.content`, `header__content.content`, `header__social.content`, `header__payment.content`, `footer_background.label`, `footer_text.label`, `about_text.label`, `about_text.info`, `show_social_icons.label`, `instagram_url.label`, `facebook_url.label`, `youtube_url.label`, `tiktok_url.label`, `twitter_url.label`. |
| Reused storefront key | `sections.footer.payment` (`"Payment methods"`) — used as the bottom-bar payment list's `aria-label`. |
| Reused schema key | `t:labels.menu` (`"Menu"`) — kept as the menu setting's label. `t:labels.show_payment_icons` — kept as the `show_payment_icons` label. |
| Icons reused | `assets/icon-instagram.svg`, `assets/icon-facebook.svg`, `assets/icon-youtube.svg`, `assets/icon-tiktok.svg`, `assets/icon-twitter.svg` (all already exist). |
| Mobile breakpoint | `max-width: 749px` (matches header). |
| Internal separator border | `var(--footer-border)` (defined on `.theme-evolution-footer-wrapper` as `color-mix(in srgb, currentColor 8%, transparent)`). Do NOT hardcode `rgba(...)`. |
| Payment icon sizing | `width: auto; height: 1.6rem` (preserves natural aspect ratios). |
| Lint command | `shopify theme check` |
| JSON validation | `python3 -m json.tool locales/en.default.schema.json > /dev/null && echo OK` |
| Dev command | `shopify theme dev` (use the `shopifypreview.com` URL printed by CLI, NOT `127.0.0.1:9292`). |
| Approval gate file (manual create after QA pass) | `docs/qa/theme-evolution-footer.approved` |
| Impl-notes file | `docs/plans/theme-evolution-footer-impl-notes.md` |
| QA fixture products | `the-3p-fulfilled-snowboard` (visual-only) or `the-complete-snowboard` (full smoke) — see `docs/dev-fixtures.md`. |
