# QA report: theme-evolution-tailwind-t1 (Tokens, header, footer)

Date: 2026-10-22. Under test: local commits `46ac635`, `eeb6857`, `cee44ca` (+ notes `a246b23`, `f55cd43`), unpushed. Baseline for A/B: `8cf1253` (pre-T1 markup and CSS, served from a scratch `git archive` copy through a second `shopify theme dev` run on the same private dev theme #187953938528, so markup and CSS are both pre-T1). Spec: `docs/plans/theme-evolution-tailwind.md` Rev 2 §8, §17, §20; `docs/plans/theme-evolution-footer.md`; `docs/bugs/mobile-horizontal-overflow.md`.

## Summary verdict

**PASS WITH NITS.** Every automatable C1.x and C0.x criterion holds, the footer's behavior survives the conversion, and the header half of the overflow bug is closed at 320/375/390/430. No blocker by the brief's definition (a visible regression that is neither in the plan's Δ list nor already accepted). Two items need an owner decision rather than a code fix to be waved through: the **cart bag glyph is now a ~10x13px speck** (N1) and the **header still overflows at 768 to about 805px** (N2). C1.2 (editor round-trip), C1.7 (editor live updates) and C1.8 (editor display) are **BLOCKED** (no admin login); I covered them with a proxy (settings variants rendered from a scratch copy), which is not a substitute for the editor check.

My judgment on N1: a shopper would notice it, but the plan's Δ row ("SVG 32 -> 24px", owner decision Q2) literally prescribes a 24px SVG on every icon and the cart's SVG is exactly 24px; the smallness comes from the asset's own padding plus the baseline's inflated 70px cart SVG. So I did not call it a blocker. If the owner or orchestrator reads "a shopper would notice" as the test, flip it to FAIL and send it back for a cart-specific glyph size.

Dev servers: all stopped (`pgrep` shows none). Nothing in the repo edited; `git status` shows only the pre-existing untracked files plus `docs/qa/harness/` (my scripts).

## Gates

| Gate | Result |
|---|---|
| `npm ci && npm run check:css` | exit 0 (build, layer gate, tracked, no diff) |
| `npm run check:hidden` | exit 0 |
| `shopify theme check` | 62 files, exactly the 2 baseline offenses (`TranslationKeyExists` cart-drawer, `UnusedAssign` card-product). No new offense |
| `assets/tailwind.css` | 14,617 B minified, 4,143 B gzip -9 (budgets 60,000 / 12,000; matches the Coder's numbers) |
| Schema byte-identity | header and footer `{% schema %}` blocks identical to `8cf1253` (checked with `shasum`); `settings_data.json`, `templates/*`, `*-group.json` have an empty diff |
| `'critical.css'` references | none; `'tailwind.css'` count 1 in `theme.liquid`, `password.liquid`, `gift_card.liquid` |
| `B_rb` (informational) | home and p3p: 5 head stylesheets, all with entries, none 0 B: tailwind.css 3,862 + base.css 10,813 + eco-tooltip 560 + accelerated-checkout 1,598 + styles.css 1,576 = 18,409 B compressed. I did not re-measure `B_rb0` (T0 figure) |

## C1.x results

| ID | Check | Method | Result | Evidence |
|---|---|---|---|---|
| C1.1 | Header fits at 320/375/390/430 on the 3p snowboard, menu closed and open | `t1-final.mjs`, §0 method, both states; A/B with `t1-measure.mjs` | PASS | after `X_hdr` / `X_page`: 320 -8/0, 375 -20/0, 390 -20/0, 430 -20/0, identical closed and open. Baseline: 71.2/71, 38.2/38, 29.2/29, 5.2/5. Matches Coder |
| C1.2 | Schemas round-trip | static: byte compare. Editor save/reload: not possible | static PASS; editor half BLOCKED | See "Blocked". Proxy: variants A, B below |
| C1.3 | Cart hook | `t1-behavior.mjs`, `t1-drawer.mjs` on `selling-plans-ski-wax` and with a seeded cart | PASS | badge 0 hidden -> add -> drawer `is-open` and badge `1` without reload; seeded cart (1) then drawer quantity 3 -> badge `3`, header icon replaced by Section Rendering with all attributes intact (`data-header-cart-icon`, `data-cart-drawer-trigger`), still 44x44 with a 24px SVG |
| C1.4 | Mobile menu | `t1-behavior.mjs`, `t1-outside.mjs` at 375 | PASS | closed: `aria-expanded=false`, panel computed `display:none`, label "Open menu", hamburger visible, close icon `display:none`. Open: `true`, panel `flex` 335x177 at (20,64), label "Close menu", only the close icon visible, focus inside the panel. Escape closes and returns focus to the toggle. Outside click closes (my first attempt landed on a Shopify iframe at (180,600), which never bubbles a click; clicks at (180,300) and (50,400) close it). Same behavior in the baseline |
| C1.5 | No bare `hidden` with responsive display | `npm run check:hidden` | PASS | exit 0 |
| C1.6 | Geometry within +-1px except Δ rows | `t1-diff.py` over 9 pages x 2 widths | PASS, with the unlisted items below | Δ table; every page shows the same ~88-93 header/footer difference lines, i.e. no per-page drift |
| C1.7 | Editor live updates | editor needed | BLOCKED | Proxy only: variants A and C render each color setting into the page (below) |
| C1.8 | New settings default | static | static PASS; editor display BLOCKED | `--color-accent #e3fc01`, `--color-accent-foreground #111111`, `--font-heading--family Oswald, sans-serif`, weight 700 on every page; `settings_data.json` `current: {}` and unchanged; schema diff is +18 lines, appended in the plan's groups, no existing id touched |
| C1.9 | C0.1, C0.8, C0.10, C0.13, C0.14, C0.15 | see C0 table | PASS | |

### Settings proxy (editor BLOCKED): scratch copy of the T1 tree with edited `*-group.json` / `settings_data.json`

The repo was not touched. These prove the setting reaches the markup and the class or variable applies, not that the editor UI, save, persistence or live-update path works.

| Setting (type) | Value tried | Observed |
|---|---|---|
| `logo_width` (range) | 300 -> 100 | logo `<img width=100>`, rendered 100x56; header height stays 64 |
| `header_background` / `header_text` (color) | `#336699` / `#ffee00` | wrapper bg `rgb(51,102,153)`, color `rgb(255,238,0)`; menu, icons and announcement border (`border-current/8` -> oklab 8% of the text color) follow |
| `show_announcement` (checkbox) + text | off -> on | bar renders, 33px tall (16px line + 16px padding + 1px border), text 12px, as the Δ row says |
| logo removed | blank | shop-name fallback: 24px / line-height 32px / uppercase / Oswald; header stays 64px; font-weight computes 400 and the browser uses the only loaded Oswald 700 face |
| `footer_background` / `footer_text` (color) | `#223344` / `#ffcc00` | footer bg and text follow |
| `show_social_icons` (checkbox) | off | social column absent |
| `show_payment_icons` (checkbox) | off | payment list absent |
| `about_text` (richtext) | two paragraphs | both render, `[&_p]:mb-3` spacing |
| social URLs (url) | only Instagram set | exactly one icon, correct aria-label |
| `type_heading_font` (font_picker) | `playfair_display_n7` | `--font-heading--family` becomes `"Playfair Display", serif`, shop-name span uses it, preload swaps to `playfairdisplay_n7`, face loads at 700 |
| `accent_color` / `accent_foreground_color` / `background_color` (color) | `#ff0066` / `#00ff00` / `#eeeeaa` | `:root` vars and body background update. Nothing consumes `bg-accent` yet, so there is no visible accent surface to check |

No `select` setting exists on the header or footer. After the checks the dev theme was re-synced from the repo (verified: no announcement, logo present).

## C0.x criteria that must still hold

| ID | Result | Evidence |
|---|---|---|
| C0.1 | PASS | `npm ci && npm run check:css` exit 0 |
| C0.2 | PASS | `cssRules[0].nameList` = `properties,theme,base,legacy,components,utilities,shims` on `/`, the 3p product, and `/password` (via `127.0.0.1:9292`, which needs no session) |
| C0.7 | PASS | static `rg` result above; `tailwind.css` is requested on `/` and `/password` |
| C0.8 | PASS | theme check = the 2 baseline offenses |
| C0.10 | PASS (budget guard) | 14,617 / 4,143 B vs 60,000 / 12,000; validity: 5 head `<link rel=stylesheet>`, all with resource entries, none zero |
| C0.11 | PASS | password input `border-top-width` 1px |
| C0.13 | PASS (dev theme) | dynamic checkout present on `selling-plans-ski-wax` (2 iframes); cart drawer opens at 400px right edge (panel x 1040). Supercycle embed not on the dev theme: operator check on staging |
| C0.14 | PASS | `H1` = 1 on all 9 pages x 2 widths (and on `/password`) |
| C0.15 | PASS | console messages are Shopify telemetry (`monorail` / `event_observer_reporter` "Failed to fetch") and the expected 404 on `/pages/tailwind-qa-missing`; none from theme code. Counts differ between runs because telemetry is network-timing dependent (home 0, p3p 1 in the settled 7s re-run). No unused-preload warning for the new Oswald preload after 7s |
| C0.17 | PASS | `html` computed line-height `normal` on `/`, product and `/password` |

## T1 Δ table: expected vs actual

Measured with `t1-measure.mjs` on pre-T1 vs T1 at 1440 and 375 (home; the other 8 pages show the same header/footer deltas).

| Row | Plan Δ | Actual | Verdict |
|---|---|---|---|
| icon boxes | 70.4 -> 44 | account, cart, toggle all 44x44 | as planned |
| icon SVG | 32 -> 24 | account 32 -> 24, toggle 32 -> 24, **cart 70.4 -> 24** (baseline cart SVG was 70.4 because of the T0 shim) | as planned for 2 of 3; the cart row understated (N1) |
| cart `margin-right` | gone | -19.2 -> 0 | as planned |
| `<header>` / wrapper height | none | 64 / unchanged; logo box unchanged | as planned |
| icon row vertical position | not in plan | y -3.2 -> 10 (now centred in the 64px bar) | unlisted, benign |
| icon row `padding-right` | not in plan | 12.8 -> 0 (Dawn `.header__icons` rule gone); row width 134.4 -> 88 | unlisted; shifts the centred menu right by ~18px at 1440 (606.7 -> 625.2) |
| desktop menu links | 13.6 -> 14px, lh normal -> 20 | 14px, 20px, letter-spacing 1.36 -> 1.4px | as planned |
| panel (375 open) | +0.4px font, lh 20 | panel 177px tall (was 161) | as planned |
| badge | offset 9.6 -> 10; px 6.4 -> 6 | exactly that; 22.4x22.4 round; `border-radius` computes `3.35544e+07px` (same look, T0 #11 accepted round) | as planned |
| announcement bar | 12.8 -> 12, lh 16 | 12px, bar 33px | as planned (variant A) |
| shop-name fallback | 16 -> 24px uppercase heading font | 24px / 32px / uppercase / Oswald (variant B) | as planned |
| hamburger glyph | 32 -> 24 | svg 32x32 at x 221.2 -> 24x24 at x 212 (375) | as planned; moved 9px left (centred in a 44px box) |
| footer about text | 14.4 -> 14px, lh 1.6 | 14px, 22.4px (1.6); box 46.1 -> 44.8 | as planned |
| footer menu links | 14.4 -> 14px, lh 20 | 14px, 20px, letter-spacing 1.152 -> 1.12; column 50 -> 52 | as planned |
| social svg | 22.4 -> 22 | 22x22 | as planned |
| copyright | 13.6 -> 14px, lh 20 | 14px, 20px; wraps to 2 lines at 375 (32 -> 40px) | as planned |
| payment svg | 25.6 -> 26 | within 1px; positions shift +2 / +8 with the taller columns | as planned |
| footer height | n/a | 1440: 252.6 -> 255 (+2.4); 375: 467.3 -> 476.2 (+8.9) | consequence of the rows above |
| unlisted | | footer `div`/`nav` `list-style-type` disc -> none; bottom bar `text-align` start -> left; at 375 `justify-content` space-between -> normal (column flex, no visible effect); `border-top-color` re-expressed as `oklab(... / .08)` of the same color | no visible effect |

## Footer behavior regression (spec: `docs/plans/theme-evolution-footer.md`)

| Check | Result |
|---|---|
| All 5 social icons from the seeded `footer-group.json` render; URLs come from section settings only | PASS: Instagram, Facebook, YouTube, TikTok, X, with the group's URLs |
| Per-icon URL guard | PASS: variant B with only `instagram_url` renders exactly one icon |
| `show_social_icons` off hides the column; `show_payment_icons` off hides payments | PASS (variant A) |
| `about_text` default renders (group JSON has none); custom text and two paragraphs render | PASS |
| Full-bleed background | PASS: wrapper x 0, w 1440 / 375, `rgb(17,17,17)` |
| `2fr 1fr 1fr` at desktop | PASS: 640 / 320 / 320 at 1440 (children x 32, 720, 1088), unchanged |
| Stacks at mobile | PASS: one 327px column at 375; also 1 column at 749/750/767, 3 columns at 768/769 (switch moved 750 -> 768 as planned) |
| `currentColor` icons | PASS: svg `fill` and link `color` both `rgb(255,255,255)`; follow `footer_text` (`#ffcc00` in variant A) |
| aria-labels with new-window hint | PASS: e.g. "Instagram, Opens in a new window."; `target=_blank`, `rel=noopener` |
| `role="list"` on social, menu, payment `ul` | PASS (social `role=list`, `aria-label="Social media"`; payment `role=list`, 9 items) |
| Bottom bar | PASS: border-top 1px at 8% alpha, centered column at 375, row/space-between at 1440; copyright link underline none, hover underline on footer menu link works (`none` -> `underline`) |

## Overflow table (`X_hdr` / `X_page`, px, menu closed)

The 3p snowboard (C1.1 page) and `/` (banner is T3's job). `base` = pre-T1.

| Width | 3p base | 3p after | `/` base | `/` after | wax after (info) |
|---|---|---|---|---|---|
| 320 | 71.2 / 71 | **-8 / 0** | 71.2 / 76 | -8 / 76 | -8 / 71 |
| 375 | 38.2 / 38 | **-20 / 0** | 38.2 / 38 | -20 / 21 | -20 / 16 |
| 390 | 29.2 / 29 | **-20 / 0** | 29.2 / 29 | -20 / 6 | -20 / 1 |
| 430 | 5.2 / 5 | **-20 / 0** | 5.2 / 5 | -20 / 0 | -20 / 0 |
| 750 | 128.6 / 129 | mobile menu, 0 | 128.6 / 129 | 0 | |
| 768 | 110.6 / 111 | **34.1 / 34** | 110.6 / 111 | 34.1 / 34 | 34.1 / 34 |
| 800 | 78.6 / 79 | **2.1 / 2** | 78.6 / 79 | 2.1 / 2 | 2.1 / 3 |
| 900 | -20 / 0 | -20 / 0 | -20 / 0 | -20 / 0 | |
| 1023, 1024, 1440 | clean | clean | clean | clean | |

Other pages at 375 (not header-driven, identical before and after): collection 145, search 103 (T2/T4 content), cart/material/404 0 after (38 before). `X_page` on `/` at 375/390/430 fell 38 -> 21, 29 -> 6, 5 -> 0, as the Coder reported; the rest is the banner buttons (T3).

## Findings

No BLOCKER.

**N1 (NIT, owner decision, most visible): cart bag glyph is ~10x13px.** At 1440 the baseline cart was a 70.4px box (bag glyph ~31x39) and is now a 44px box with a 24px SVG whose art fills about 43% of its 40x40 viewBox: ~10x13px next to a 22px account glyph. At 375 the cart was off-screen at baseline (the bug) and is visible for the first time, as a speck. With items in the cart the 22px badge (top 10px, right 10px) covers the 10px bag, so it reads as a bare "2" circle. Not a regression against the plan (Q2 and the Δ row prescribe 24px), but it was not previewed in the plan, and the T0 owner acceptance #6 covered only "computed sizes". Suggested fix if the owner wants it: a cart-specific size (the Coder suggested `[&_svg]:size-14!`, about 24px glyph) or a tighter-cropped cart SVG. Method: Playwright + `t1-measure.mjs`, geometry from the path's viewBox (art x 11.8-28.2, y 6.5-28.5 of 40) agrees with the Coder's 10.4x13.4. Screenshots below. MCP used: Playwright library harness (not the MCP server); Chrome DevTools MCP not used.

**N2 (NIT): header still overflows from 768 to about 805px.** At 768 `X_hdr` is 34px: "OUR MATERIALS" wraps to two lines and the cart icon sits partly off-screen (iPad portrait width). At 800 it is 2px; clean at 900. Pre-existing and reduced from 110px (baseline, switch at 750), and C1.1 only tests 320-430, so it is not a T1 failure, but it is the same defect class as the bug T1 set out to close. Options for the owner/Architect: move the desktop switch to `lg:` (1024) for the header, or tighten `gap-6`/`px-8` between 768 and 1023. This is also why the brief's 768-1023 range matters: only the 768-805 part fails. Screenshot `t1-after-home-768.png`.

**N3 (NIT, Coder deviation 2): `!` on icon SVG size utilities.** The sanctioned workaround under CLAUDE.md `### CSS architecture` is the `shims` layer, but `shims` sits below unlayered CSS, so it can't beat `.icon { width: 300px }` in `sections/hello-world.liquid`; `!` is the only in-layer way short of removing the rule. CLAUDE.md doesn't mention `!` either way, so this is a gap in the rules, not a violation. It is the only unlayered global `.icon` in the theme (`rg` over sections/blocks/snippets/templates/layout). Recommend deleting the `.icon` rule (hello-world is being replaced by the Ride hero) and dropping the five `!` utilities in the same commit, then adding one line to CLAUDE.md saying `!` is a last resort with a comment naming the unlayered rule.

**N4 (NIT, Coder deviation 3): bare `group` collides with `blocks/group.liquid`.** `blocks/group.liquid` defines unlayered `.group { width: 100%; overflow: hidden }`; it is the only definition and the header toggle is the only Tailwind `group` user (no other `group` markup in sections/blocks/snippets/templates). `group/menu` is the right workaround. **CLAUDE.md line 208 itself recommends `group-aria-expanded:hidden`** as the safe pattern; that needs a bare `group` parent and would hit the same collision. Suggest the rules say "use a named group (`group/menu`) while `blocks/group.liquid` exists" (Architect/owner; not edited).

**N5 (NIT): Oswald is preloaded on every page but used by nothing yet.** The heading font only reaches the shop-name fallback (hidden when a logo is set). It is one extra `woff2` preload per page until a later phase uses `font-heading`. No console warning at 7s. Fine to accept; note for T2/T3 to start consuming it. Also `font-heading` sets no weight, so the fallback computes `font-weight: 400` and relies on the browser picking the only (700) face.

**N6 (NIT, notes accuracy): impl-notes "visible change 3" is a harness artifact.** The pre-seeded cart "did not render a badge in either build" because `page.request.post('/cart/add.js', {data: {id, quantity}})` returns 400 (`items` missing). With a proper in-page `fetch` JSON add, the badge renders in both builds (`2`, 22.4x22.4 at (1356,20) at 1440 and (302,20) at 375 after; (1362,6)/(381,6) capsule-top before). The "badge with a pre-seeded cart" item is now verified.

**N7 (info): the dark header bar does not reach the screen edges** (20px page margins at 375 and 1440); pre-existing, identical in the baseline, outside T1's plan. Also the "EVOLUTION" logo is dark on the dark header in both builds (pre-existing).

## For owner acceptance

1. **Cart bag glyph shrinks from ~31x39px to ~10x13px at 1440 and appears at ~10x13px at 375** (N1). Accept the 24px SVG as specified in Q2, or ask for a larger cart glyph. Screenshots: `t1-base-home-1440.png` vs `t1-after-home-1440.png` and `t1-after-icons-zoom-1440.png`; `t1-base-home-375.png` vs `t1-after-home-375.png`; with items `t1-after-badge-1440.png`, `t1-after-badge-375.png`.
2. **Header icon row is vertically centred and lost its 12.8px right padding**; the desktop menu moves ~18px right at 1440; hamburger glyph is 22px wide (was ~30) and sits 9px further left at 375.
3. **Footer is 2.4px taller at 1440 and 8.9px taller at 375; the copyright wraps to two lines at 375.**
4. **Header overflows from 768 to ~805px** (N2): accept as a later fix, or ask for a `lg:` switch in T1.
5. **`!` utilities and `group/menu` deviations** (N3, N4): accept, or have the stray `.icon` rule deleted now.
6. **Mobile breakpoint moved 750 -> 768** for header and footer (planned, Q4): iPad-portrait width 768 now gets the desktop header (see 4).
7. Accent `#e3fc01`: confirmed. I sampled five pixels inside the "FIND YOUR BOARD" button of the `-v2` design (1920x5900) in headless Chromium; all read `#e3fc01`. Accent text `#111111`. Oswald loads at weight 700 with a preload (`oswald_n7.*` in the preload list; `Oswald 700` in `document.fonts` once used).

## Console and network

Console: only Shopify telemetry (`MonorailRequestError ... Failed to fetch`, `event_observer_reporter ... Failed to fetch`) and the intentional 404 on the missing-page URL; none from theme code. `/password` on `127.0.0.1:9292` shows localhost-only CSP/CORS noise (`origin_trials`, `shop.app` framing). Network: no 4xx/5xx other than the 404 page. No slow responses noted.

## Accessibility observations

Menu toggle: `aria-expanded`, `aria-controls`, an `sr-only` label that swaps "Open menu"/"Close menu"; focus enters the panel on open and returns to the toggle on Escape. Cart link keeps its `aria-label` with the count. Icon targets are now 44x44 (was 70.4, with the cart's negative margin). Footer lists keep `role="list"` and labelled social/payment lists. Contrast not re-measured (colors unchanged).

## BLOCKED

- **C1.2 second half, C1.7, C1.8 (editor display) and "check the theme editor preview":** no admin login in this environment (same as T0). Operator to run on staging: change `logo_width`, `header_background`, `header_text`, `show_announcement`/`announcement_text`, `footer_background`, `footer_text`, `show_social_icons`, `show_payment_icons`, `about_text`, the five social URLs, and the global `background_color`, `accent_color`, `type_heading_font` once each; save; reload; confirm each persists and the preview updates live. Confirm Oswald Bold shows as the default. My scratch-copy variants prove the render path only.
- Supercycle app embed and gift card page: not on the dev theme / no gift card URL; operator checks after staging push.
- `B_rb0` comparison: not re-run (T1 doesn't change the number of stylesheets).

## Reusable harness (committed path, not committed to git)

`docs/qa/harness/t1-measure.mjs` (A/B geometry dump), `t1-diff.py`, `t1-behavior.mjs`, `t1-drawer.mjs`, `t1-outside.mjs`, `t1-final.mjs`, `t1-vprobe.mjs` and `t1-variant.py` (settings variants against a scratch copy). Password is read from `docs/dev-fixtures.md` by `t0-lib.mjs` and never printed. The `t0*` originals are untouched.

## Screenshot index (`docs/qa/screenshots/`, `t1-` prefix)

- `t1-{base,after}-{home,p3p,wax,snow,coll,cart,search,mat,p404}-{1440,375}.png` (header strip, 140px) and `...-footer.png`
- `t1-after-home-{320,390,430,768,800,900,1023,1024}.png` and `-footer.png` (also p3p and wax at those widths), `t1-base-*` at the same widths
- `t1-after-icons-zoom-1440.png` (3x crop of the icon row), `t1-after-badge-{1440,375}.png`, `t1-after-badge-seeded-1440.png`, `t1-after-badge-qty3-1440.png`, `t1-base-badge-{1440,375}.png`
- `t1-after-menu-open-375.png`, `t1-after-p3p-menu-open-375.png`, `t1-base-menu-open-375.png`
- `t1-after-wax-1440.png`, `t1-after-wax-drawer-1440.png`, `t1-base-wax-*`
- `t1-after-pw-{1440,375}.png` (`/password` via 127.0.0.1:9292)
- `t1-var-{A,B,C}-{1440,375}.png` and `-footer.png` (settings variants, scratch copy)

PASS WITH NITS


## Re-run (after 55081ab)

Date: 2026-10-22. Under test: HEAD `55081ab` (fix commits `a7588d4` N3, `d87b4cd` N1, `bad0f8c` N2). Baselines for A/B: `f55cd43` (the tree the first run tested, plus notes) and `8cf1253` (pre-T1), each served from a scratch `git archive` copy through `shopify theme dev` on the same private dev theme #187953938528, one server at a time. Every server stopped at the end (`pgrep` shows none). No repo code edited; `git status` shows no modified tracked files. Tool used throughout: Playwright library harness (no Chrome DevTools MCP).

### Re-run verdict: PASS WITH NITS

N1, N2, N3 are fixed as the Coder described. The A/B of HEAD against `f55cd43` over 9 pages x 2 widths shows only the intended N1 differences (cart SVG 24 -> 40, badge offset); nothing else moved. No blocker.

### Gates

| Gate | Result |
|---|---|
| `npm ci && npm run check:css` | exit 0 |
| `npm run check:hidden` | exit 0 |
| `shopify theme check` | 62 files, exactly 2 offenses: `TranslationKeyExists` (cart-drawer), `UnusedAssign` (card-product) |
| `assets/tailwind.css` | 14,639 B minified, 4,158 B gzip -9 (matches the Coder) |
| Header and footer `{% schema %}` | `shasum` identical to `8cf1253` (header `8548e6f889aa`, footer `8ba5f58bd57e`) |
| `settings_data.json`, `templates/*`, `*-group.json` | empty diff vs `8cf1253` |
| `!` utilities on header/footer icons | none left (`rg` on `sections/header.liquid` and `sections/footer.liquid` for `!` on size/h/w utilities: no hits) |

### N3: scoped `.icon`, `!` removed: FIXED

Homepage illustration (`.welcome-content .icon` div and its img, identical dimensions for div and img), pre-T1 `8cf1253` = `f55cd43` = HEAD at every width:

| Width | 1440 | 1024 | 768 | 375 |
|---|---|---|---|---|
| illustration | 300 x 292.6 | 251.8 x 245.6 | 181.7 x 177.3 | 74.2 x 72.3 |

Header toggle SVG 24x24, account SVG 24x24 at every width; footer social SVG 22x22 at 1440, 768, 375.

**Footer payment icons (the item the Coder did not re-measure)**: measured all 9 SVGs, the `ul` and `li` boxes, with `t1r-payment.mjs`, which targets `.theme-evolution-footer__payment`:

| | pre-T1 `8cf1253` | `f55cd43` (with `h-6.5!`/`w-auto!`) | HEAD (no `!`) |
|---|---|---|---|
| each SVG, 1440 | 40.5 x 25.6 | 41.2 x 26 | 41.2 x 26 |
| each SVG, 768 | 40.5 x 25.6 | 41.2 x 26 | 41.2 x 26 |
| each SVG, 375 | 40.5 x 25.6 | 41.2 x 26 | 41.2 x 26 |
| `ul` 1440 / 375 | 428.6 x 25.6 / 327 x 59.2 | 434.4 x 26 / 327 x 60 | 434.4 x 26 / 327 x 60 |
| footer height 1440 / 375 | 252.6 / 467.3 | 255 / 476.2 | 255 / 476.2 |

HEAD is identical to `f55cd43` (all 9 icons, positions included) and within 0.7px of pre-T1, which is the plan's "25.6 -> 26" row. Removing `h-6.5!`/`w-auto!` changed nothing, because the payment SVGs carry no `.icon` class, so the scoped rule was never what sized them. Wrap at 375 is 6 + 3 icons, same as before. Screenshots: `t1r-{base,f55,head}-payment-{1440,768,375}.png`.

### N1: cart glyph and badge: FIXED, judged acceptable

Measured at 1440 and 375, all pages: cart link 44x44 (hit area kept, `link` box identical to `f55cd43`), cart SVG 40x40 inside it at (+2, +2), bag art 17.4 x 22.3. Account art is 21.5 x 22.7 (SVG 24).

Optical judgement (4x crops `t1r-zoom-{0,1,3}items-{1440,375}.png`): the two glyphs now read as the same height (22.3 vs 22.7); the bag is about 4px narrower and its outline a touch thinner than the user glyph. Beside the account icon it looks like a matched pair. A shopper would not notice a mismatch. The earlier "10x13 speck" is gone.

Badge: 22.4 x 22.4 round at the corner, top 0 / right -6px: at 1440 box x 1371.6, y 10; at 375 x 317.6, y 10. It overlaps the bag by 3.6px horizontally and 13.9px vertically (box overlap, mostly the bag's handle ring). Readable with 1 and with 3 items at both widths (white "1" and "3" on the dark header colour, high contrast), and the bag outline remains recognisable. `badgeRightVsViewport` 46px at 1440, 35px at 375, so no clip at either width. At 320 the badge right edge is inside the viewport (Coder figure; `X_hdr` -8 confirmed by my probe).
Minor look-and-feel: the badge sits on the bag's handle, so the bag's upper right is hidden. It is a typical corner badge; not worth a nit.

Cart flow on `selling-plans-ski-wax` (real Add click, `t1r-cart.mjs`):

| Step | 1440 | 375 |
|---|---|---|
| empty | badge hidden, link 44x44, svg 40x40 | same |
| Add click | drawer `is-open`, badge `1` without reload | same |
| quantity 3 in the drawer (1440) / change.js + reload (375: the drawer is full-screen, my script reloads) | badge `3` | badge `3` |
| after the drawer re-renders the header icon | link 44x44, svg 40x40, badge still 22.4 round at the same place, `data-header-cart-icon` and `data-cart-drawer-trigger` intact | same |
| remove | badge `0`, hidden, link 44x44, svg 40x40 | same |

Info (pre-existing, not T1): after a drawer change, the cart link's own `aria-label` stays stale ("0 items" while the badge says 3) until reload, because `cart-drawer.liquid` swaps only the link's `innerHTML`. Same structure at `8cf1253`. The inner badge's aria-label does update. Suggest the Architect add it to the cart-drawer follow-up.

### N2: header switch at `lg`: FIXED

`X_hdr` / `X_page` on `the-3p-fulfilled-snowboard` (`t1fix-probe.mjs`):

| Width | 320 | 375 | 390 | 430 | 768 | 790 | 805 | 900 | 1023 | 1024 | 1440 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| X_hdr | -8 | -20 | -20 | -20 | -20 | -20 | -20 | -20 | -20 | -20 | -20 |
| X_page | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

0 page overflow at all 11 widths. `/` shows X_hdr -8/-20 (negative, so the header never overflows) and X_page 76 / 21 / 6 / 0 at 320 / 375 / 390 / 430, 0 from 768 up. I listed every visible element whose right edge exceeds the viewport (`t1r-overflow.mjs`): at 320, 375 and 390 every offender is inside `#shopify-section-template--...__image-banner` (`.banner__buttons--multiple` and its two `.button` links, right edge 396). Nothing from the header, footer or any other section. Banner = T3, as expected.

"OUR MATERIALS": all four nav links 20px high (single line) at 1024 and 1440; nav is `display: none` below 1024, toggle `display: flex`. Screenshots `t1r-head-home-1023.png` (hamburger) and `t1r-head-home-1024.png` (inline nav, fits with room).

C1.4 at 375, 768, 900, 1023 (`t1fix-menu.mjs`, the Coder's script, run by me): each width: closed `aria-expanded=false`, panel `none`, label "Open menu", icons `[hamburger visible, close hidden]`; open `true`, panel `flex`, label "Close menu", icons `[hidden, visible]` (one icon per state), focus inside the panel; Escape closes and focus returns to the toggle; an outside click closes; `xPage` 0 open and closed; panel spans x 20 with width 335 / 728 / 860 / 983. Also (`t1r-resize.mjs`): panel opened at 900 then widened to 1100: toggle and panel both hide, desktop nav shows, no overflow. Note `aria-expanded` stays `true` in the hidden state until the next toggle (harmless, the button is hidden); it is the same as before the fix at 750.

### Regression A/B (`t1r-measure.mjs`, `t1r-diff.py`: HEAD vs `f55cd43`)

Pages: home, p3p, wax, snow, coll, cart, search, mat, 404, at 1440 and 375. Geometry plus computed styles of header and footer, `X_hdr`, `X_page`, H1 count. Every one of the 18 comparisons prints the same 10 lines and nothing else: `badgeCs.top` 10 -> 0, `badgeCs.right` 10px -> -6px, cart SVG and glyph w/h 24 -> 40, x -8, y -8. That is N1 exactly. `X_page` is identical on every page vs `f55cd43`: 1440 all 0; 375 home 21, wax 16, coll 145, search 103, others 0. H1 = 1 everywhere. Footer boxes unchanged vs `f55cd43` (255 at 1440, 476.2 at 375).

Wax at 375: `X_page` goes 16 -> 34 after the first Add click. I traced it (`t1r-wax-overflow.mjs`): the 34 comes from `related-products` cards that render after the drawer interaction; the 16 is `.product-container`. Neither is header, footer or cart-link related. Pre-existing product-page overflow for T2/T3.

Console: home 0 messages at 1440 and 375; product pages show only Shopify telemetry (`MonorailRequestError ... shopify_pay_page_load/2`), identical in `8cf1253`, `f55cd43` and HEAD; the 404 page gives one 404 response as before. No theme-code errors. No other 4xx/5xx.

### Carried forward

- N4 (bare `group` collides with `blocks/group.liquid`; CLAUDE.md line 208 suggests the colliding pattern) and N5 (Oswald preloaded, unused until T2): deferred to the Architect, T2 addendum (as the Coder notes). Unchanged by the fixes.
- N6: corrected in the notes. N7 (header bar does not reach the screen edge; dark-on-dark EVOLUTION logo): out of scope, unchanged. At 1023 and 1440 the hamburger/nav sit inside the same 20px-inset bar.
- N2 and N3 are closed. N1 is closed (judged acceptable).

### Owner-acceptance list, updated

1. ~~Cart glyph ~10x13~~: now the glyph is 17.4 x 22.3 in a 40px SVG inside a 44px hit area, 4px narrower than the account glyph; the badge sits at the top-right corner, covering part of the bag handle. Accept or ask for a different glyph; see `t1r-zoom-*`.
2. Header icon row is vertically centred, lost its 12.8px right padding; desktop menu moves ~18px right at 1440; hamburger glyph is 24px (was ~32), 9px further left at 375.
3. Footer is 2.4px taller at 1440 and 8.9px taller at 375; copyright wraps to two lines at 375.
4. **NEW visible behavior change (N2 fix): widths 768 to 1023 now show the hamburger and the mobile panel instead of the inline nav.** Affected devices: iPad portrait (768, 810, 820), iPad Mini landscape (1024 is still desktop), small laptop windows and split-screen windows under 1024px. The inline nav now starts at exactly 1024. This replaces the previous "header overflows 768 to ~805px" item (the overflow is gone) but moves the breakpoint away from the original 750 and the footer's 768. Footer and its column switch stay at `md` (768), so between 768 and 1023 the header is mobile-style while the footer is desktop-style (3 columns). Owner to accept or ask for tighter spacing at `md` instead.
5. `group/menu` deviation (N4) stays; the `!` deviation (N3) is gone.
6. Mobile breakpoint for the footer moved 750 -> 768 (planned, Q4); the header's is now 1024 (see 4).
7. Accent `#e3fc01`, accent text `#111111`, Oswald Bold: confirmed in the first run, unchanged.

### BLOCKED (unchanged)

- C1.2 editor round-trip, C1.7 live updates, C1.8 editor display, and "check the theme editor preview": no admin login. Operator list from the first run applies (logo_width, header and footer colors, announcement settings, social URLs, `about_text`, `show_social_icons`, `show_payment_icons`, global `background_color` / `accent_color` / `type_heading_font`; confirm Oswald Bold default).
- Supercycle embed and gift card page on the dev theme: operator on staging.
- `B_rb0` comparison: not re-run.

### Re-run harness (docs/qa/harness, new `t1r-` files, originals untouched)

`t1r-measure.mjs` (copy of `t1-measure.mjs`, screenshots `t1r-` prefix), `t1r-diff.py` (label arguments), `t1r-payment.mjs`, `t1r-overflow.mjs`, `t1r-cart.mjs`, `t1r-zoom.mjs`, `t1r-wax-overflow.mjs`, `t1r-resize.mjs`. Also re-ran the Coder's `t1fix-probe.mjs` and `t1fix-menu.mjs`. Password is read from `docs/dev-fixtures.md` by `t0-lib.mjs`, never printed.

### Re-run screenshots (`docs/qa/screenshots/t1r-*`)

`t1r-{base,f55,head}-{home,p3p,wax,snow,coll,cart,search,mat,p404}-{1440,375}[-footer].png`; `t1r-head-{home,p3p}-{768,900,1023,1024}[-footer].png`; `t1r-{base,f55,head}-payment-{1440,768,375}.png`; `t1r-zoom-{0,1,3}items-{1440,375}.png` (4x crops of the icon row); `t1r-cart-empty-{1440,375}.png`, `t1r-cart-badge-after-add-{1440,375}.png`, `t1r-cart-badge3-{1440,375}.png`, `t1r-cart-badge3-drawer-1440.png`.

PASS WITH NITS
