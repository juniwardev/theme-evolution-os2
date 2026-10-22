# theme-evolution-tailwind-t1: implementation notes

Base: `main` at `8cf1253`. No feature branch. Commits are local only, nothing pushed (git or Shopify). Review verdict: APPROVE (`docs/reviews/theme-evolution-tailwind-review.md`).

| Commit | Subject |
|---|---|
| `46ac635` | feat(tokens): add heading font and accent color settings and Tailwind tokens |
| `eeb6857` | feat(header): convert header to Tailwind utilities, 44px icons, drop icon shims |
| `cee44ca` | feat(footer): convert footer to Tailwind utilities |

## Files changed

| Path | Reason |
|---|---|
| `config/settings_schema.json` | `type_heading_font` (after `type_primary_font`); `accent_color`, `accent_foreground_color` (after `input_corner_radius`). Nothing else touched |
| `locales/en.default.schema.json` | `general.heading_font`, `labels.accent`, `labels.accent_foreground` (confirmed absent before) |
| `snippets/css-variables.liquid` | heading `font_face`, `--font-heading--family/--weight`, `--color-accent`, `--color-accent-foreground` |
| `layout/theme.liquid` | preload of the heading font (skipped when `.system?`) |
| `src/tailwind.css` | `--color-accent`, `--color-accent-foreground` in `@theme`; `--font-heading` in `@theme inline`; **both QA-fix `!important` header shims deleted** (`.product-grid.grid` shim stays, T2) |
| `assets/tailwind.css` | rebuilt, committed with each commit |
| `sections/header.liquid` | converted per §8.3 (see deviations 1 and 2) |
| `sections/cart-drawer.liquid` | three selectors `.header__icon--cart` -> `[data-header-cart-icon]` |
| `sections/footer.liquid` | converted per §8.4 (see deviation 1) |

Not touched: `config/settings_data.json`, `templates/*.json`, `sections/*-group.json` (`git diff 8cf1253` on them is empty), `sections/hello-world.liquid`.

## Run locally

`shopify theme dev` (private development theme; this run used #187953938528 at `https://theme-evolution-os2.myshopify.com/?preview_theme_id=187953938528`), or `npm run dev`. `npm run build:css` -> `git add assets/tailwind.css src/tailwind.css` -> `npm run check:css`. The dev server was stopped. Measurement scripts are in the session scratchpad, not committed (`t1-dump.mjs` reused QA's `docs/qa/harness/t0-lib.mjs` for login; the password was never printed).

## Accent sampling

Sampled the fill of the "FIND YOUR BOARD" button in `docs/designs/ride-theme-ecommerce-website-homepage-template-v2.png` (the `-v2` file, 1920x5900) by drawing the PNG to a canvas in headless Chromium and reading six opaque pixels inside the button (original coordinates around x 220-430, y 830-870; button center is about 324,852). All six read **`#e3fc01`**. The same hex is used in the schema default, the `css-variables` fallback and `src/tailwind.css`. Accent text `#111111` per Q8.

## Font handle

`oswald_n7` confirmed: `shopify theme check` passes with it, and on the dev theme `--font-heading--family` = `Oswald, sans-serif`, `--font-heading--weight` = 700, `document.fonts` reports `Oswald 700 loaded`, and the preload `<link>` for `oswald/oswald_n7.*.woff2` is present. Not checked in the theme editor UI (see "Not verified").

Note for later phases: `font-heading` sets the family only. Weight comes from a utility (`font-bold`), or from `--font-heading--weight` if a later plan wants it.

## Baseline and after: `X_hdr` / `X_page`

Method: §0 (`X_hdr` = max right edge of the header wrapper and its visible descendants minus `innerWidth`; `X_page` = `scrollWidth - innerWidth`). Dev theme, with the T0 shims present for the baseline.

| Page / width | Before `X_hdr` / `X_page` (menu closed = open) | After `X_hdr` / `X_page` (closed = open) |
|---|---|---|
| 3p snowboard 320 | 71.2 / 71 | **-8** / 0 |
| 3p snowboard 375 | 38.2 / 38 | **-20** / 0 |
| 3p snowboard 390 | 29.2 / 29 | **-20** / 0 |
| 3p snowboard 430 | 5.2 / 5 | **-20** / 0 |
| `/` 320 | 71.2 / 76 | -8 / 76 |
| `/` 375 | 38.2 / 38 | -20 / 21 |
| `/` 390 | 29.2 / 29 | -20 / 6 |
| `/` 430 | 5.2 / 5 | -20 / 0 |

C1.1: header fits at all four widths on the 3p product, menu closed and open. The remaining `/` `X_page` (76, 21, 6, 0) is the banner buttons (T3); `/` `X_page` also changed at 375/390/430 (38 -> 21, 29 -> 6, 5 -> 0) because the header no longer adds width. The header half of `docs/bugs/mobile-horizontal-overflow.md` is resolved; the bug file itself was not edited in T1 (the plan does not call for it).

## T1 Δ table, actual values (computed styles, dev theme, before vs after)

Header, 1440 and 375, all inside the plan's Δ list unless flagged:

| Row | Plan Δ | Actual |
|---|---|---|
| icon boxes | 70.4 -> 44px | 44x44 (account, cart, hamburger) |
| icon SVG | 32 -> 24px | 24x24 (account/hamburger; cart svg was 70.4 box at baseline because of the T0 shim, now 24) |
| cart negative margin | gone | `margin-right` -19.2 -> 0 |
| `<header>` / wrapper height | none | unchanged (64px bar); icon row now vertically centered (box top y -3.2 -> 10) |
| icons group `padding-right` | not in plan | 12.8 -> 0 (Dawn `.header__icons` rule no longer applies) |
| menu links | 13.6 -> 14px, lh `normal` -> 20px | 14px, 20px, letter-spacing 1.36 -> 1.4px; desktop menu width 424 -> 402px |
| panel links (375 open) | +0.4px, lh 20 | 14px, 20px; panel height 161 -> 177px |
| badge | offset 9.6 -> 10; px 6.4 -> 6 | padding 6.4 -> 6px; `border-radius` computed `999px` -> `3.35544e+07px` (same look) |
| announcement bar | 12.8 -> 12px, lh 16 | not exercised (setting off on the dev theme) |
| shop-name fallback | 16 -> 24px uppercase heading font | not exercised (dev theme has a logo) |

Footer, 1440 and 375: about-text 14.4 -> 14px (lh 23.04 -> 22.4); menu links 14.4 -> 14px / lh `normal` -> 20px (li 19 -> 20px, column 50 -> 52px); social svg 22.4 -> 22px; copyright 13.6 -> 14px / lh 20px; payment svg 25.6 -> 26px height (width 40.5 -> 41.2); footer total height 252.6 -> 255px at 1440 and 467.3 -> 476.2px at 375. Grid at 1440 stays 640/320/320 (`2fr 1fr 1fr`), stacks to one column at 375; full-bleed background unchanged (`col-span-full`).

Unlisted but real: `list-style-type` `disc` -> `none` on footer `div`/`nav` (computed on non-list elements, no visible effect); `text-align` `start` -> `left` on the bottom bar (no visible effect); at 375 the copyright paragraph now wraps to two lines (32 -> 40px) because of the larger font/line-height, consistent with the plan's Δ.

## Visible changes versus the plan's expected list

All Δ rows above were observed. Things the plan did not say or understated, for QA and the owner:

1. **The cart bag glyph is much smaller than at baseline.** At baseline (after the T0 shim) the bag glyph was 30.6x39.2px inside a 70.4px box. With the plan's 24px SVG it is **10.4x13.4px** (the bag art only fills about 43% of its 40x40 viewBox), against 21.5x22.7px for the account glyph. The plan lists "SVG 32 -> 24px", which understates the cart (it was 70px). Screenshot: scratchpad `out/hdr-home-375-one-top.png`. At 375 the cart was off-screen at baseline, so this is the first time it is visible there. Recommendation: give the cart link a larger SVG (for example `[&_svg]:size-14!`), but that departs from the plan, so it was not done.
2. The hamburger glyph moved: 29.7x26.7 at x 222 -> 22.3x20 at x 212.7 (24px SVG, 44px box).
3. The cart count badge could not be seen in the "one item" screenshots: the pre-seeded cart (`/cart/add.js` before load) did not render a badge in either build. The Section Rendering flow does (C1.3 below).
4. `!important` on icon sizes, see deviation 2.

## Shim deletion

Both header-icon `!important` rules were deleted from `@layer shims` in `src/tailwind.css` in the header commit (QA nit N6). Verified with `grep`: only the `.product-grid.grid` shim remains. Their root cause, `header svg { 2rem }`, is gone with the header's old stylesheet. The other cause, `.icon { width: 300px }` in `sections/hello-world.liquid`, is still there and affects the new markup; see deviation 2.

## Schema changes and round-trip proof

- Header and footer `{% schema %}` blocks are byte-identical to `HEAD` (scripted comparison: `True` for both; `git diff` has no hunk inside `{% schema %}`).
- `config/settings_schema.json`: the diff is 18 added lines. Existing IDs, types, order unchanged; the new settings are appended in the plan's groups. `en.default.schema.json` parses.
- `config/settings_data.json` unchanged (C1.8).
- Not done: the editor save/reload persistence check (C1.2 second half) and editor live updates (C1.7); no editor session was available.

## Gate results (final tree)

| Gate | Result |
|---|---|
| `npm run build:css`, stage, `npm run check:css` | exit 0 before each of the three commits |
| `npm run check:hidden` | exit 0 |
| `shopify theme check` | 62 files, exactly the 2 baseline offenses (`TranslationKeyExists` cart-drawer, `UnusedAssign` card-product) |
| `assets/tailwind.css` | 14,617 B minified, 4,143 B gzip (budget 25,000 / 12,000) |
| `rg -n "'critical.css'" layout sections snippets blocks templates` | no output (the footer comment mentioning it was removed with the footer's stylesheet) |
| `border-current/8` | compiles to `color-mix(in oklab, currentcolor 8%, transparent)` under `@supports`; no fallback needed |
| `text-xs` / `text-sm` / `text-2xl` line-heights | 1/0.75 (16px), 1.25/0.875 (20px), 2/1.5 (32px) confirmed in `node_modules/tailwindcss/theme.css`; `--breakpoint-md` 48rem |

## Acceptance criteria run

| ID | Result |
|---|---|
| C1.1 | PASS (table above) |
| C1.2 | Static half PASS; editor round-trip not run |
| C1.3 | PASS on `selling-plans-ski-wax` (1440): badge 0 hidden -> add to cart -> drawer opens, badge `1` without reload; drawer quantity 3 -> badge `3`; remove -> `0` |
| C1.4 | PASS at 375: toggle sets `aria-expanded`, panel shown/hidden, label `Open menu` <-> `Close menu`, only one icon visible in each state (close icon `display: none` closed), focus moves to the first panel link, Escape closes and returns focus to the toggle, an outside click closes |
| C1.5 | PASS |
| C1.6 | PASS apart from the Δ rows and the unlisted items above; geometry dumps compared against the baseline |
| C1.7 | Not run (editor). Static check: the colors are consumed through `bg-(--header-bg)` etc., and the heading font / accent tokens resolve from `css-variables` on the page |
| C1.8 | New settings present with defaults at the page level (`--color-accent` `#e3fc01`, accent-foreground `#111111`, Oswald 700); `settings_data.json` unchanged. Editor display not viewed |
| C1.9 | C0.1 and C0.8 hold; budget well inside; H1/console/C0.13 not re-run |

## Deviations

1. **`group` marker renamed `group/menu`** (header toggle). `blocks/group.liquid` defines an unlayered `.group { width: 100%; overflow: hidden; }` in a section stylesheet; the plain Tailwind `group` class picked it up and the toggle button became 100% wide with hidden overflow, which re-broke the header layout. Named group avoids the collision: classes are `group-aria-expanded/menu:hidden` and `group-aria-[expanded=false]/menu:hidden`. Behaviour is as the plan intends. Any later section that uses a bare `group` variant has the same problem while that block exists.
2. **`!` (important) on the icon SVG size utilities:** `[&_svg]:size-6!` on the three header icon links, and `[&_svg]:size-5.5!`, `[&_svg]:h-6.5!`, `[&_svg]:w-auto!` in the footer. Without it, the unlayered `.icon { width: 300px }` in `sections/hello-world.liquid` beats the layered utility (every icon SVG carries `class="icon"`), the SVG grows to the flex box width, and the flex row squeezes the icons to about 14px wide. The plan's mapping assumed plain utilities and described this rule as out of scope. Fix at the source later: remove that stray rule (the hello-world section is replaced by the Ride hero), then the `!` can be dropped. If the owner prefers, delete the rule now instead; one line, but it is not in T1's plan.
3. The wrapper/footer BEM hooks (`theme-evolution-footer*`, `theme-evolution-header-wrapper`, `theme-evolution-header-menu__toggle/__panel`) are kept as classes with no CSS on them, so earlier QA selectors still work. The plan says to keep the JS hooks; it did not say to drop the footer's.
4. Header `<header>` and `h2`/link carry utility classes directly; `data-header-cart-icon` placed on the cart link, which is also where the plan puts it. No other deviation from §8.3/§8.4 tables.

## Not verified

- Theme editor behaviour (C1.2 persistence, C1.7 live updates, C1.8 editor display of the three settings and of Oswald Bold as default).
- Announcement bar and shop-name fallback rendering (not enabled on the dev theme).
- Header at 768-1023px (`md:` switch moves from 750 to 768) was not screenshotted; only 320 to 430 and 1440.
- Collection, cart, search, 404, password, material page and product pages beyond the 3p snowboard (X measure) and ski wax (cart flow); C0.13 dynamic checkout and Supercycle embed; C0.15 console comparison.
- Dev-theme only; nothing pushed to staging or live.
- Cart badge with a pre-seeded cart (see visible change 3).

## Out-of-scope observations

- `sections/hello-world.liquid` `.icon { width: 300px }` is global and hits every inline icon (cause of deviation 2).
- `blocks/group.liquid` defines a global `.group` class (cause of deviation 1).
- The header sits inside the `.shopify-section` content column (20px margins at 375), so the dark header bar does not reach the screen edges; pre-existing and visible in the baseline screenshots.
- `.bg-accent`, `.text-accent-foreground` and `.font-heading` utilities are not in the compiled CSS until a file uses them (expected; the shop-name fallback uses `font-heading`).
