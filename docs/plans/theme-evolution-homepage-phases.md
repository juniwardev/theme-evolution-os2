# Theme Evolution Homepage — Phased Feature Roadmap

Reference design: `docs/designs/ride-theme-ecommerce-website-homepage-template-v2.png`  
Author: Junior Warner  
Date: 2026-05-20

---

## Visual map (top → bottom)

```
┌──────────────────────────────────────────────────────────┐
│  HEADER NAV                        [feature-1]           │
│  dark sticky bar · logo · links · cart                   │
├─────────────────────────┬────────────────────────────────┤
│  HERO — text panel      │  HERO — full-height image      │
│  eyebrow · headline     │                                │  [feature-2]
│  body · CTA button      │                                │
├─────────────────────────┴────────────────────────────────┤
│  FEATURED PRODUCTS STRIP                  [feature-3]    │
│  4 product cards · name · price                          │
├──────────────────────────────────────────────────────────┤
│  EDITORIAL FEATURE              [feature-4]              │
│  large image ◀ · · · ▶ headline + body text             │
├──────────────────────────────────────────────────────────┤
│  SPLIT CONTENT ("Punchy Beach Breaks")    [feature-5]    │
│  headline + body + CTA ◀ · · · ▶ image stack            │
├──────────────────────────────────────────────────────────┤
│  PRODUCT FEATURE HIGHLIGHT        [feature-6]            │
│  [dark: headline + spec bullets] [accent: product image] │
├──────────────────────────────────────────────────────────┤
│  CTA BANNER ("Ride With Us")      [feature-7]            │
│  full-width · headline · button                          │
├──────────────────────────────────────────────────────────┤
│  FOOTER                           [feature-8]            │
│  about text · nav links · social icons                   │
└──────────────────────────────────────────────────────────┘
```

---

## Phase 1 — Page frame

These two features set the persistent chrome that wraps every page. Build them first so the homepage has the correct top and bottom context while you work on inner sections.

---

### Feature 1 · Header Enhancement

| | |
|---|---|
| **Slug** | `theme-evolution-header` |
| **Tier** | 2 — Standard feature |
| **Workflow** | `/plan theme-evolution-header` → `/review-plan` → `/implement` → `/qa` → `/ship` |

**What it looks like in the design**  
Dark sticky nav bar spanning full width. Logo wordmark on the left. Navigation links centered or right-aligned (Home · About · Ride · Contact). Cart icon on the far right with item count badge.

**What changes**  
Extend `sections/header.liquid` (do not create a new section file):
- Add `color_scheme` setting so the bar color is merchant-configurable (currently hardcoded to `--color-background`).
- Add mobile hamburger menu toggle — Web Component, namespaced `ThemeEvolutionHeaderMenu`.
- Replace the current gap-only nav layout with proper typographic treatment (uppercase, letter-spacing matching Ride design).
- Wire the cart icon count badge to always show (currently only shows when `cart.item_count > 0` but no badge element exists).
- Add an `announcement_bar` text setting for the thin dark strip visible above the header in the design.

**Files**

| Path | Action |
|---|---|
| `sections/header.liquid` | Extend (Liquid markup, CSS, schema) |
| `locales/en.default.json` | Add `sections.header.mobile_menu_label`, `sections.header.close_menu_label` |
| `locales/en.default.schema.json` | Add schema strings for new settings |

**Schema additions**
- `color_scheme` (color_scheme type)
- `announcement_text` (text, optional)
- `show_announcement` (checkbox, default false)
- Mobile menu is JS-driven; no new schema setting needed — it's always present on small viewports.

**Performance notes**  
Header is above-the-fold. The logo image already uses `loading: 'eager'`. No new LCP risk. The Web Component must not block rendering — use a `<script>` tag at the bottom of the section, not `{% javascript %}` (because the toggle behavior must be conditionally active only when the hamburger is in the DOM, and `{% javascript %}` cannot be gated).

---

### Feature 8 · Footer Enhancement

| | |
|---|---|
| **Slug** | `theme-evolution-footer` |
| **Tier** | 2 — Standard feature |
| **Workflow** | `/plan theme-evolution-footer` → `/review-plan` → `/implement` → `/qa` → `/ship` |

**What it looks like in the design**  
Multi-column dark footer. Column 1: "About Ride" brand copy. Column 2: navigation links. Column 3: social media icon links (Instagram etc.). Bottom bar: copyright line.

**What changes**  
Extend `sections/footer.liquid` (the current footer is 57 lines and very barebones — copyright + links + payment icons, single flex row):
- Add a `color_scheme` setting.
- Add an `about_text` richtext setting for the brand copy column.
- Add social icon links: Instagram, Facebook, YouTube, TikTok (four `url` settings, each optional — hide the icon when blank).
- Add a `show_social_icons` checkbox.
- Replace the single-row layout with a responsive three-column grid on desktop, stacked on mobile.
- Move `show_payment_icons` lower; keep it (it's already there).

**Files**

| Path | Action |
|---|---|
| `sections/footer.liquid` | Extend |
| `locales/en.default.json` | Add `sections.footer.social.*` aria labels |
| `locales/en.default.schema.json` | Add schema strings for new settings |

**Schema additions**
- `color_scheme`
- `about_text` (richtext)
- `instagram_url`, `facebook_url`, `youtube_url`, `tiktok_url` (url, optional each)
- `show_social_icons` (checkbox, default true)

---

## Phase 2 — Hero & primary commercial sections

These three sections form the above-fold and primary commercial real estate on the homepage. Build the hero first so you can see the full above-fold experience, then the products strip.

---

### Feature 2 · Ride Hero (Split Banner)

| | |
|---|---|
| **Slug** | `theme-evolution-hero` |
| **Tier** | 2 — Standard feature |
| **Workflow** | `/plan theme-evolution-hero` → `/review-plan` → `/implement` → `/qa` → `/ship` |

**What it looks like in the design**  
50/50 horizontal split. Left panel: dark background with eyebrow text, large bold headline ("FREEDOM TO ESCAPE"), short body copy, yellow CTA button. Right panel: full-viewport-height hero image (surfer on wave), no overlay.

**Why not extend `image-banner.liquid`**  
The existing `image-banner.liquid` is Dawn's banner section — it references `'section-image-banner.css' | asset_url | stylesheet_tag`, which violates the project's asset-location rule (component CSS must live inside the section file, not in `assets/`). Extending it would require either carrying that violation forward or doing a larger refactor. A new `theme-evolution-hero.liquid` section following project conventions is the correct call. Dawn's banner remains available for other use cases.

**Block-first design**  
The left text panel is a block container. Merchant-composable blocks:
- `eyebrow` — small uppercase label above the headline
- `heading` — the main `<h1>` (one per page; enforce in block schema)
- `text` — optional body paragraph
- `button` — CTA link + label; accent color merchant-configurable

**Files**

| Path | Action |
|---|---|
| `sections/theme-evolution-hero.liquid` | Create |
| `blocks/eyebrow.liquid` | Create (or reuse pattern from `blocks/text.liquid`) |
| `blocks/button.liquid` | Create (generic reusable CTA button block) |
| `locales/en.default.json` | Add `sections.ride_hero.*` storefront strings |
| `locales/en.default.schema.json` | Add schema strings |

**Schema settings (section level)**
- `image` (image_picker) — the right-panel hero image
- `image_position` (select: top / center / bottom, default center)
- `color_scheme` — left panel background
- `min_height` (range: 400–900px, default 600) — total section height
- `padding_top`, `padding_bottom` (range)

**Performance notes**  
This section is likely the LCP element. When `section.index == 1`, render the hero image with `preload: true`, `loading: 'eager'`, `fetchpriority: 'high'`. Explicit `width`/`height` on the `<img>` to prevent CLS.

---

### Feature 3 · Featured Products Strip

| | |
|---|---|
| **Slug** | `theme-evolution-featured-products` |
| **Tier** | 2 — Standard feature |
| **Workflow** | `/plan theme-evolution-featured-products` → `/review-plan` → `/implement` → `/qa` → `/ship` |

**What it looks like in the design**  
A horizontal row of 4 product cards. Each card: product image (top-down view of surfboard on dark background), product name below, price below that. Dark section background. Cards evenly spaced. On mobile: horizontal scroll.

**Design approach**  
New `sections/theme-evolution-featured-products.liquid`. Uses a `collection` setting (merchant picks a collection) or up to 8 hand-picked products via `product_list`. Render cards using a lightweight inline template (avoid coupling to `snippets/card-product.liquid` which may have Dawn-specific markup — audit during `/plan`).

**Files**

| Path | Action |
|---|---|
| `sections/theme-evolution-featured-products.liquid` | Create |
| `locales/en.default.json` | Add `sections.ride_featured_products.*` |
| `locales/en.default.schema.json` | Add schema strings |

**Schema settings**
- `title` (text, optional section heading)
- `collection` (collection) — source collection
- `products_to_show` (range: 2–8, default 4)
- `color_scheme`
- `padding_top`, `padding_bottom` (range)

**Performance notes**  
Product images in this strip are likely below the fold — use `loading: 'lazy'`. Explicit `width`/`height` on each card image to prevent CLS during lazy load.

---

## Phase 3 — Editorial & promotional sections

These sections tell the brand story and drive campaign clicks. They share a two-column layout pattern — plan `theme-evolution-editorial` first and assess whether `theme-evolution-split-content` can be a schema variant of the same section before opening a separate plan.

---

### Feature 4 · Editorial Feature

| | |
|---|---|
| **Slug** | `theme-evolution-editorial` |
| **Tier** | 2 — Standard feature |
| **Workflow** | `/plan theme-evolution-editorial` → `/review-plan` → `/implement` → `/qa` → `/ship` |

**What it looks like in the design**  
Two-column editorial section. Large portrait or landscape image on the left half. Right half: eyebrow text, bold headline ("NATHAN FLORENCE JOINS THE RIDE TEAM"), short body paragraph. Dark background. No CTA button in this instance.

**Block-first design**  
Right text column is a block container (same block types as `theme-evolution-hero` — `eyebrow`, `heading`, `text`). This reuses the same block files if they are built generically.

**Files**

| Path | Action |
|---|---|
| `sections/theme-evolution-editorial.liquid` | Create |
| `locales/en.default.json` | Add `sections.ride_editorial.*` |
| `locales/en.default.schema.json` | Add schema strings |

**Schema settings**
- `image` (image_picker)
- `image_side` (select: left / right, default left) — swap the column order
- `color_scheme`
- `padding_top`, `padding_bottom` (range)

---

### Feature 5 · Split Content Section

| | |
|---|---|
| **Slug** | `theme-evolution-split-content` |
| **Tier** | 2 — Standard feature |
| **Workflow** | `/plan theme-evolution-split-content` → `/review-plan` → `/implement` → `/qa` → `/ship` |

**What it looks like in the design**  
Two-column promotional section. Left half: dark background, bold headline ("PUNCHY BEACH BREAKS"), body paragraph, lime/yellow CTA button. Right half: a vertical stack of two product images (not a single hero image).

**Relationship to `theme-evolution-editorial`**  
Assessed before planning: the right column is an *image stack* (two separate images, stacked vertically), not a single image. This is different enough from `theme-evolution-editorial`'s single image that it warrants its own section rather than a variant setting. However, the `eyebrow`/`heading`/`text`/`button` block types are shared.

**Files**

| Path | Action |
|---|---|
| `sections/theme-evolution-split-content.liquid` | Create |
| `locales/en.default.json` | Add `sections.ride_split_content.*` |
| `locales/en.default.schema.json` | Add schema strings |

**Schema settings**
- `image_top` (image_picker) — top image in the stack
- `image_bottom` (image_picker) — bottom image in the stack
- `content_side` (select: left / right, default left) — which side has the text
- `color_scheme`
- `padding_top`, `padding_bottom` (range)

---

### Feature 7 · CTA Banner

| | |
|---|---|
| **Slug** | `theme-evolution-cta-banner` |
| **Tier** | 1 — Trivial/standard boundary |
| **Workflow** | `/implement theme-evolution-cta-banner` (Tier 1) → `/qa` → `/ship` |

**What it looks like in the design**  
Full-width dark strip. Large centred headline ("RIDE WITH US"). Optional CTA button below. Possibly a subtle texture or solid color background.

**Why Tier 1 boundary**  
No new Liquid logic, no blocks, no JS. A simple section with text settings and a CTA link. If the Architect judges that the background-image option requires more work, upgrade to Tier 2 and run `/plan`.

**Files**

| Path | Action |
|---|---|
| `sections/theme-evolution-cta-banner.liquid` | Create |
| `locales/en.default.json` | Add `sections.ride_cta_banner.*` |
| `locales/en.default.schema.json` | Add schema strings |

**Schema settings**
- `heading` (text)
- `button_label` (text)
- `button_url` (url)
- `background_image` (image_picker, optional)
- `overlay_opacity` (range: 0–80, default 30 — only visible when `background_image` is set)
- `color_scheme`
- `padding_top`, `padding_bottom` (range)

---

## Phase 4 — Product feature highlight

The most unique section in the design — two strongly contrasted panels. Plan it last so you can reference how the block patterns settled in earlier phases.

---

### Feature 6 · Product Feature Highlight

| | |
|---|---|
| **Slug** | `theme-evolution-product-highlight` |
| **Tier** | 2 — Standard feature (no JS required) |
| **Workflow** | `/plan theme-evolution-product-highlight` → `/review-plan` → `/implement` → `/qa` → `/ship` |

**What it looks like in the design**  
Two equal panels side by side. Left panel: dark background, product name headline ("MEET THE NEOGLASS ECO FIN"), optional body copy, a vertical list of spec/feature bullet points. Right panel: bright accent color (yellow/lime green), large product image centered.

**Block-first design**  
Spec/feature items in the left panel are merchant-composable blocks. The existing `snippets/specs-table.liquid` is a snippet (not a block) — check during `/plan` whether its data model fits. If it doesn't, create a simple `blocks/feature-item.liquid` with a single `text` setting.

**Files**

| Path | Action |
|---|---|
| `sections/theme-evolution-product-highlight.liquid` | Create |
| `blocks/feature-item.liquid` | Create (if specs-table.liquid doesn't fit) |
| `locales/en.default.json` | Add `sections.ride_product_highlight.*` |
| `locales/en.default.schema.json` | Add schema strings |

**Schema settings**
- `product` (product) — links to a Shopify product for the image and name
- `custom_heading` (text, optional override for the product title)
- `body_text` (richtext, optional)
- `left_color_scheme` (color_scheme) — the dark panel
- `right_color_scheme` (color_scheme) — the accent panel
- `padding_top`, `padding_bottom` (range)

**Note on two `color_scheme` settings**  
This is the only section in the design that uses two independent panel colors. Per the project's CSS pattern, each panel gets its own `color-{{ setting }}` class rather than inheriting from a single scheme.

---

## Sequencing summary

| Phase | Feature | Slug | Tier | Extends existing? |
|---|---|---|---|---|
| 1 | Header enhancement | `theme-evolution-header` | 2 | Yes — `header.liquid` |
| 1 | Footer enhancement | `theme-evolution-footer` | 2 | Yes — `footer.liquid` |
| 2 | Ride hero (split banner) | `theme-evolution-hero` | 2 | No — new section |
| 2 | Featured products strip | `theme-evolution-featured-products` | 2 | No — new section |
| 3 | Editorial feature | `theme-evolution-editorial` | 2 | No — new section |
| 3 | Split content | `theme-evolution-split-content` | 2 | No — new section |
| 3 | CTA banner | `theme-evolution-cta-banner` | 1/2 | No — new section |
| 4 | Product feature highlight | `theme-evolution-product-highlight` | 2 | No — new section |

**Shared block files** (created during Phase 2, reused across Phase 3):
- `blocks/eyebrow.liquid`
- `blocks/button.liquid`

These should be designed generically when first created so later sections can use them without modification.

---

## Standing Coder directives

These rules apply to **every feature in this roadmap** and must be applied without being asked each time.

---

### Social media URL settings

When a section or block exposes `url` type settings for social platforms (Instagram, Facebook, YouTube, TikTok, X/Twitter, Pinterest, etc.), social icons must render on a fresh install **and** each icon must stay individually hideable by the merchant:

1. **Read URLs from the section or block setting only** — e.g. `section.settings.instagram_url`. No Liquid fallbacks to global settings or hardcoded platform URLs; a hardcoded fallback makes it impossible for a merchant to remove a single platform by clearing its URL.
2. **Guard each icon on its own setting** — render an icon only when its URL is non-blank, and suppress the whole social group when none are set.
3. **Seed placeholder URLs in the JSON data file** (see below) so the icons appear on a fresh install.

Liquid example:
```liquid
{%- if section.settings.instagram_url != blank -%}
  <a href="{{ section.settings.instagram_url }}">...</a>
{%- endif -%}
```

Decided 2026-10-22 during the `theme-evolution-footer` QA-fix round, replacing an earlier three-tier fallback rule.

**Important:** Shopify's `url` schema setting type rejects external URL strings as `"default"` values in the JSON schema — do not add `"default": "https://..."` to a `url` setting. Instead, pre-populate the section's JSON data file (e.g. `sections/footer-group.json`, or the relevant template JSON) with the placeholder URLs so they are present on a fresh theme install. The plan must call this edit out explicitly, because these files are otherwise merchant-controlled — pushing them overwrites any settings a merchant has already saved:

```json
"settings": {
  "instagram_url": "https://www.instagram.com/",
  "facebook_url": "https://www.facebook.com/",
  "youtube_url": "https://www.youtube.com/",
  "tiktok_url": "https://www.tiktok.com/",
  "twitter_url": "https://x.com/"
}
```

---

### Text and richtext settings

Every `text`, `richtext`, or `textarea` setting that a merchant must fill in before the section renders meaningful content **must include a `"default"` value** in the schema JSON. Sections must render useful placeholder content on a fresh install — a blank section that shows nothing until the merchant types something is never acceptable.

Good defaults are short, on-brand stand-ins that communicate the field's purpose:

| Setting type | Example default |
|---|---|
| `text` (heading) | `"Ride with us"` |
| `text` (label/button) | `"Shop now"` |
| `richtext` (about/body) | `"<p>Tell your brand story here. Share your values and what makes your store special.</p>"` |
| `textarea` | `"Add a short description here."` |

The `richtext` default must be a valid HTML string (paragraph tags required). The `text` default is a plain string.

---

## Kicking off a feature

Each feature follows the workflow from `docs/process/feature-workflow.md`. Standard command sequence for Tier 2:

```
/plan <slug>          ← Architect writes docs/plans/<slug>.md
/review-plan docs/plans/<slug>.md
/implement docs/plans/<slug>.md
/qa <slug>
touch docs/qa/<slug>.approved
/ship <slug>
```

Tier 1 shortcut (CTA banner if staying simple):

```
/implement theme-evolution-cta-banner    ← describe the change inline
/qa theme-evolution-cta-banner
touch docs/qa/theme-evolution-cta-banner.approved
/ship theme-evolution-cta-banner
```

Start with `/plan theme-evolution-header` or `/plan theme-evolution-footer` — either is safe as a first run since they touch no shared files.
