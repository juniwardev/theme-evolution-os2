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
3. (Corrected, QA N6.) The "pre-seeded cart renders no badge in either build" finding was a harness artifact: my seed used `page.request.post('/cart/add.js')` with a malformed body (400). With a proper in-page JSON `fetch` add the badge renders in both builds, and in T1 it is 22.4x22.4 at (1356,20) at 1440 and (302,20) at 375 (QA's figures). The Section Rendering flow also works (C1.3).
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
- `.bg-accent` and `.text-accent-foreground` are not in the compiled CSS until a file uses them (expected); `.font-heading` is (the shop-name fallback uses it).

## QA-fix round 1 (N1-N3)

Commits (local, nothing pushed): `a7588d4` N3, `d87b4cd` N1, `bad0f8c` N2. N4, N5 go to the Architect (T2 addendum); N7 out of scope; N6 corrected above.

### Files changed
| Path | Reason |
|---|---|
| `sections/hello-world.liquid` | `.icon` -> `.welcome-content .icon` (width 300px), with a why-comment |
| `sections/header.liquid` | `!` removed from the 3 `[&_svg]:size-6`; cart link `[&_svg]:size-10`; badge `top-0 -right-1.5`; `md` -> `lg` on the nav (`max-lg:hidden`), toggle wrapper and panel (`lg:hidden`). Schema untouched |
| `sections/footer.liquid` | `!` removed from `size-5.5`, `h-6.5`, `w-auto` |
| `assets/tailwind.css` | rebuilt each commit |
| `docs/qa/harness/t1fix-*.mjs` | new probe, menu and remove scripts (QA originals untouched) |

### N3: scoped `.icon`
The rule sized the section's own `<div class="icon">` (the homepage illustration), so it was kept and scoped under `.welcome-content`. hello-world not converted (T3). With the scope in place the five `!` modifiers were removed and the icons still size correctly: header toggle 24, account 24, footer social 22x22 (probe, 1440 and 375). `shopify theme check` unchanged.
Illustration, before (HEAD) vs after, `.welcome-content .icon` div and img, identical at every width: 1440 300x292.6 -> 300x292.6; 375 74.2x72.3 -> 74.2x72.3 (also 768 181.7x177.3, 1024 251.8x245.6 unchanged in the later runs). **Illustration unchanged.**

### N1: cart glyph
`icon-cart.svg` is only inlined by the header (grep of sections, snippets, blocks, layout, templates, assets), but the asset was not edited; the change is a size on the cart link only.

| | Before (T1) | After |
|---|---|---|
| cart link box | 44x44 | 44x44 (hit area kept) |
| cart svg | 24x24 | 40x40 (inside the 44 box, no overflow) |
| cart bag art | 10.4x13.4 | 17.4x22.3 |
| account art (unchanged) | 21.5x22.7 | 21.5x22.7 |
| badge (22.4 round) | top 10 / right 10: x 1372 at 1440, covered the bag | top 0 / right -6px: x 1371.6, y 10 at 1440 (10 after the offset is the box top, y 10 = top of the 44 box); sits at the top-right corner, about 3.6px horizontal corner overlap with the bag, bag readable (screenshot `docs/qa/screenshots/t1fix-n1-p3p-1440.png`, `-375.png`) |

Badge right edge at 320: 318 (viewport 320), so no overflow; `X_hdr` at 320 is -2 on the product page.

### N2: breakpoint decision
Moved the header's desktop nav / mobile toggle switch from `md` (768) to `lg` (1024), a default Tailwind breakpoint (Q4). Why not tighten spacing at md: the overflow at 768 was 34px and the 4-link nav plus two 44px icons plus a 150px logo needs about 805px; trimming `gap-6`/`px-8` enough to fit 768 (about 36px) would squeeze the nav to cramped spacing, and arbitrary breakpoints are excluded. `lg` is a one-token change in three places and leaves all widths below 1024 on the existing, verified mobile panel. Cost: 768-1023 (iPad portrait and small landscape) now gets the hamburger instead of the inline nav. Footer switch stays at `md` (768).

`X_hdr / X_page` after (p3p; `/` identical for X_hdr):
| Width | 320 | 375 | 390 | 430 | 768 | 790 | 805 | 900 | 1023 | 1024 | 1440 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| p3p X_hdr | -8 | -20 | -20 | -20 | -20 | -20 | -20 | -20 | -20 | -20 | -20 |
| p3p X_page | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `/` X_page | 76 | 21 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
Before at 768/790/805: X_hdr 34.1 / 12.1 / -2.9, X_page 34 / 12 / 0, "OUR MATERIALS" wrapped (link height 40). After: nav not shown below 1024, at 1024 and 1440 all links 20px high. The `/` remainder at 320/375/390 (76/21/6) is the hero banner, T3, not fixed.

C1.4 (`t1fix-menu.mjs`) at 375, 768, 900, 1023: aria-expanded toggles, panel `none` <-> `flex`, label "Open menu" <-> "Close menu", exactly one icon visible per state, focus into the panel on open, Escape closes and returns focus to the toggle, outside click closes; `xPage` 0 open and closed.

### Cart flow (`selling-plans-ski-wax`, 1440)
Add to cart: badge 0 hidden -> 1, drawer opens (`is-open`); seeded cart quantity 3 -> badge 3 (`t1-drawer.mjs`); drawer remove -> badge 0 hidden (`t1fix-remove.mjs`). Header cart link keeps all attributes after Section Rendering and its svg stays 40x40 in a 44x44 link.

### Gates
`npm run build:css` -> stage -> `npm run check:css` exit 0 before each commit; `npm run check:hidden` exit 0; `shopify theme check` 62 files, exactly the 2 baseline offenses; `assets/tailwind.css` 14,639 B / 4,158 B gzip (budget 25,000 / 12,000 per T1 notes); header and footer `{% schema %}` blocks shasum-identical to `8cf1253`; `settings_data.json`, `templates/*.json`, `*-group.json` untouched. Dev server stopped.

### Not verified
Theme editor behaviour (still no admin session); badge at the corner was judged visually at 1440 and 375 only; footer payment icon size not re-measured after removing `h-6.5!`/`w-auto!` (social icons 22x22 re-measured; payment selector in my probe hit a social icon).
