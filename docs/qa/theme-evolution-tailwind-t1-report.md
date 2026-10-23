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

## Re-run 2 (after 9524e61)

Tools: Playwright (Node harness, `docs/qa/harness/t1r2q-*`), Chromium. Dev theme 187953938528 (HEAD) vs staging 187953643616 (4ffecbc). Dev server stopped afterwards. Chrome DevTools MCP not used.

### Verdict: FAIL (one blocker, B1)

The bar is now full width, and the horizontal positions of the content are unchanged. But the commit broke the **vertical** layout of the header content. At 768 and wider the logo, nav, account icon and cart icon sit below the dark bar, and the white nav links are drawn on the light page background, so they cannot be seen.

### B1 (BLOCKER): header content row is 168px tall inside a 64px bar

Repro:
1. Open `/` or `/products/the-3p-fulfilled-snowboard` on the dev theme at 1440x900 (any width of 750 or more shows the worst case).
2. Compare the top of the page with staging (4ffecbc): staging has the logo, four nav links and two icons centred in the dark bar. The dev theme has an empty dark bar, and the content row starts below it.

Screenshots: `docs/qa/screenshots/t1r2-head-top-1440.png` (broken) against `t1r2-base-top-1440.png` (4ffecbc), and `t1r2-head-home-1440.png` against `t1r2-base-home-1440.png`. At 375 the effect is smaller: `t1r2-head-panel-375.png`, `t1r2-head-p3p-375.png`.

Numbers (`t1r2q-rowgeom.mjs`, the 3p snowboard; bar = wrapper and `<header>` = y 0 to 64 in every case):

| Width | inner div y (head) | cart icon y (head) | cart icon y (base) | nav link y (head / base) | nav link inside bar? |
|---|---|---|---|---|---|
| 320 | 0-72 | 14-58 | 10-54 | n/a (hamburger) | n/a |
| 375 | 0-84 | 20-64 | 10-54 | n/a | n/a |
| 768 | 0-168 | 62-106 | 10-54 | n/a | n/a |
| 1023 | 0-168 | 62-106 | 10-54 | n/a | n/a |
| 1024 | 0-168 | 62-106 | 10-54 | 74-94 / 22-42 | NO (bottom 94 > bar 64) |
| 1440 | 0-168 | 62-106 | 10-54 | 74-94 / 22-42 | NO |

The same offset appears on every page I measured (home, p3p, wax, snow, coll, cart, search, mat, 404) at 1440 (+52px for every item) and 375 (+10px). The `t1r-diff.py` output is identical on all of them: `logo.y -52 -> 0`, `cart.y 10 -> 62`, `menuLinks[n].box.y 22 -> 74`, `toggle.y 10 -> 20`.

Suspected cause: `<header class="grid h-16 grid-cols-(--content-grid)">` has an implicit `auto` row. The inner `col-start-2 flex h-full items-center` div has `h-full`, which resolves against an auto-height grid area, so it computes to auto and takes the logo's height. The logo anchor is `h-full w-(--logo-width) max-w-[40vw]` and the image keeps its aspect ratio (300x168 at 1440, 150x84 at 375). The row therefore becomes 168px (84 at 375) and overflows the 64px header, and `items-center` centres everything at y=84. Before the change `<header>` itself was the flex container with a definite height of 64px, so `h-full` and `items-center` resolved against 64px (the logo overflowed symmetrically, hidden behind nothing). The Coder only compared left and right values, which are unaffected, so this was not caught.

Suggested fix (Coder to decide): give the grid a definite row, e.g. `grid-rows-[100%]` or `grid-rows-[minmax(0,1fr)]` on `<header>`, or put `h-16` on the inner div, or `min-h-0` and `max-h-full` on the logo link, then re-run the A/B on y as well as x. After the fix, `logo.y`, `cart.y` and `menuLinks.y` must equal base (-52, 10, 22 at 1440; -10, 10 at 375).

Severity: BLOCKER. It affects every page at every width of 320 and above (worst from 750), and makes the nav and the cart and account icons effectively invisible on desktop.

### Item results

1. **Full-bleed bar**: PASS. `left 0`, `right = viewport` at 320, 375, 768, 900, 1023, 1024 and 1440 on both `/` and the 3p snowboard (base was 20 to viewport-20). Background rgb(17,17,17). Footer is x 0 to 1440 at 1440, so the edges now match. (`t1r2-header-fullbleed.mjs` run by me, A/B against staging.)
2. **Inner content, horizontal**: PASS. 0 differences beyond 0.5px (max delta 0) for the logo, first nav link, toggle and cart at the 7 widths on both pages. A/B with my own `cmp` of the Coder's script output. **Vertical: FAIL, see B1.** I did not check the account icon and every nav link x separately in this script, but the `t1r2q-measure.mjs` diff for 1440 and 375 lists no x differences for `acct`, `cart`, `menuLinks[0..3]`, `toggle` or `logo`, only y.
3. **Mobile panel and behavior at 375, 768, 900**: panel left/right is 0 to viewport on both pages (e.g. 0-375, 0-768, 0-900), link x unchanged (52-323 at 375, 52-716 at 768, 52-848 at 900, identical to base). Toggle, `aria-expanded` false/true, label "Open menu"/"Close menu", one icon per state (`[true,false]` closed, `[false,true]` open), focus into the panel, Escape closes and returns focus to the toggle: all PASS at all three widths on both pages (`t1r2q-menu.mjs`). Panel renders from y=64 (`t1r2-head-panel-375.png`); but its toggle button is at y 20-64 at 375 (B1).
   - **Outside click: PASS, no regression.** I clicked five outside points per width (just below the panel, y=500, y=650, x=5 at y=400, and the empty header area). All closed the menu at 375, 768 and 900 on both pages, on HEAD and on 4ffecbc (the one "navigated" at 375 is a click on the Shop Pay button on the product page, a test artifact). Focus returns to the toggle.
   - **Resolution of the contradiction**: the Coder's probe (`t1r2-behavior.mjs`) uses a 700px-high viewport and clicks y=650. I reproduced the failure and logged document click events: `elementFromPoint(187, 650)` at 375x700 returns the **Shopify preview-bar IFRAME** (the bar overlays the bottom of the viewport). Clicks into that iframe never reach the page, so no click event fires at all (log empty). At 800px height, y=650 is page content and the menu closes. So this was a test artifact, not a theme bug. The same Coder probe on 4ffecbc also fails, which matches their claim; my earlier re-run used an 800px viewport and y=500. The outside-click handler (`this.contains(event.target)` where `this` is `theme-evolution-header-menu`, holding both toggle and panel) is unchanged and works with the full-width panel.
4. **Overflow**: PASS. `X_page` 0 on the 3p snowboard at 320, 375, 768, 900, 1023, 1024 and 1440, open and closed. `/`: 76 at 320, 21 at 375, 0 from 768 up, the same as base (image-banner buttons, T3). `xHdr` is now 0 (was -20); no header overflow. `X_page` has no difference between HEAD and base on any of the 9 pages at 1440 and 375.
5. **Sticky and cart**: sticky PASS (Coder's `t1r2-behavior.mjs`, rerun by me: wrapper top 0 after scrolling 800 at 375 and 900). Cart flow on `selling-plans-ski-wax` at 1440 (`t1r2q-cart.mjs`): badge hidden, add gives 1, quantity 3 gives 3, remove gives 0 and hidden, `xPage` 0 throughout. Functionally PASS, but the cart icon is at y 62-106, below the bar (B1).
6. **Regression**:
   - `npm ci`, `npm run check:css` (exit 0, `assets/tailwind.css` unchanged by the rebuild), `npm run check:hidden` (exit 0): PASS.
   - `shopify theme check`: 62 files, 2 offenses (1 error, 1 warning), the baseline pair: PASS.
   - CSS size 14,864 B minified, 4,226 B gzip (budget 60,000 / 12,000): PASS.
   - Header `{% schema %}` unchanged (`git diff 4ffecbc HEAD -- sections/header.liquid` has no schema lines): PASS.
   - A/B of 9 pages x {1440, 375} (`t1r2q-measure.mjs`, `t1r-diff.py`): every difference is in header wrapper, header, header children (the y offsets of B1, `headerCs` display flex to grid, padding moved to the inner div) or `xHdr`. Nothing in the footer, page body, `X_page`, H1 count or status.
   - Console: head 0 messages on home at both widths and 0-1 on the other pages (base 1-2; Shopify telemetry), so no theme errors. One expected 404 on the missing page.
7. **Homepage / banner / hello-world band**: T3, not assessed.

### N7

N7 (bar not full width): the bar fix itself is verified, but N7 stays **open** until B1 is fixed, because the same change broke the content row.

### Owner-acceptance list (updated, pending B1)

1. Cart glyph 17.4 x 22.3 in a 40px SVG inside a 44px hit area; badge at the top-right corner covering part of the handle.
2. Header icon row vertically centred, lost its 12.8px right padding; desktop menu about 18px further right at 1440; hamburger glyph 24px (was about 32), 9px further left at 375.
3. Footer 2.4px taller at 1440 and 8.9px taller at 375; copyright wraps to two lines at 375.
4. Header switches to the hamburger and mobile panel at widths under 1024 (iPad portrait and split windows get the mobile header while the footer stays desktop-style from 768).
5. `group/menu` deviation (N4) stays.
6. Footer mobile breakpoint 750 to 768 (planned); header 1024 (see 4).
7. Accent `#e3fc01`, accent text `#111111`, Oswald Bold: unchanged.
8. **NEW: full-bleed header bar** (dark bar now spans the viewport, as in the v2 design; content column unchanged). Accept after B1 is fixed.
9. **NEW: full-width mobile panel** (below 1024, spans the viewport edge to edge with links at the same x). Accept after B1 is fixed.

### BLOCKED (unchanged)

- C1.2 editor round-trip, C1.7 live updates, C1.8 editor display, and the theme editor preview check: no admin login. Operator list from the first run applies (logo_width, header and footer colors, announcement settings, social URLs, `about_text`, `show_social_icons`, `show_payment_icons`, global `background_color` / `accent_color` / `type_heading_font`; confirm Oswald Bold default).
- The announcement bar full-bleed variant is not rendered in the test data, so it is unverified (and its row may be affected by the same grid sizing; check once enabled).
- Supercycle embed and gift card page on the dev theme: operator on staging.
- `B_rb0` comparison: not re-run.

### Harness added (`docs/qa/harness/`, originals untouched)

`t1r2q-menu.mjs` (multi-point outside click, A/B), `t1r2q-outside-probe.mjs` (click-event log proving the preview-bar iframe cause), `t1r2q-rowgeom.mjs` (vertical geometry and screenshots), `t1r2q-measure.mjs` and `t1r2q-cart.mjs` (copies with the `t1r2-` screenshot prefix). Screenshots: `docs/qa/screenshots/t1r2-{base,head}-*`.

FAIL

## Re-run 3 (after c4d49aa)

Tools: Playwright (Node harness, `docs/qa/harness/t1r3q-*`), Chromium. Dev theme 187953938528 (HEAD c4d49aa) vs staging 187953643616 (same header as 4ffecbc). Dev server stopped afterwards. Chrome DevTools MCP not used.

### Verdict: PASS (no blocker; B1 resolved)

### B1: RESOLVED

`<header>` now has `grid-rows-[minmax(0,1fr)]`; the inner div is y 0-64 at all 7 widths and the content sits inside the dark bar.

- **y / w / h vs base (`t1r3q-measure.mjs` + `t1r3q-cmp.py`)**, `/` and `the-3p-fulfilled-snowboard` at 320, 375, 768, 900, 1023, 1024, 1440, seeded cart (1 item): logo link, logo image, every visible nav link, icon row, cart (+svg), account (+svg), toggle (+svg), badge. **Max delta 0.0 on y, w and h.** x max delta 0.0 for everything except wrapper and `<header>` (and panel), which are intentionally full bleed (width +40, or +4 at 320 where base was inset 20/2).
- Inner div (`t1r3q-rowgeom.mjs`, p3p): y 0-64 at all 7 widths. Cart icon y 10-54 everywhere (base 10-54). Nav links y 22-42 at 1024 and 1440 (base 22-42), colour rgb(255,255,255), inside the bar. Logo y -52 to 116 at 768-1440 (-10 to 74 at 375, -4 to 68 at 320), the same as base: the 168px-tall logo overflowing the 64px bar is pre-existing, not a regression.
- Badge with 1 item: 22.4 x 22.4 at y 10, identical to base at every width.
- Full bleed: wrapper and header left 0, right = viewport (320, 375, 768, 900, 1023, 1024, 1440), height 64, `xHdr` 0 (base -20).

### C1.4 (375, 768, 900 at viewport height 800, `t1r3q-menu.mjs`, both pages): PASS

Toggle `aria-expanded` false/true/false, label Open menu/Close menu, one icon per state, focus into the panel, Escape closes and returns focus to the toggle, outside click closes at 5 points (below panel, y500, y650, x5, empty header area), focus back on the toggle. One "ctx destroyed" at 375/y500 on the product page is the Shop Pay button (test artifact, as in re-run 2). Panel (`t1r3q-panel.mjs`) head vs base: top y 64 both, height 177 both, links identical (x 52, y 89/125/161/197, w 271 at 375 or 796 at 900, h 20); panel x/width 0 to viewport vs 20 to vw-20 by design. Sticky: wrapper top 0 after scrolling 800 at 375 and 900.

### Visual

Viewed `docs/qa/screenshots/t1r3-head-vis-1440-closed.png` (logo, HOME/CATALOG/CONTACT/OUR MATERIALS in white, account and cart icons, all inside the dark bar), `t1r3-head-vis-375-closed.png` (logo, hamburger, account, cart in the bar) and `t1r3-head-vis-375-open.png` (X icon, full-width panel from y 64 with the four links visible). Desktop has no panel state.

### Regression

- `npm ci`, `npm run check:css` (exit 0, `assets/tailwind.css` unchanged by rebuild), `npm run check:hidden` (exit 0): PASS.
- `shopify theme check`: 62 files, 2 offenses (1 error, 1 warning), the baseline pair: PASS.
- CSS 14,929 B minified / 4,247 B gzip (budget 60,000 / 12,000): PASS.
- Header `{% schema %}` unchanged (no schema lines in `git diff 4ffecbc HEAD -- sections/header.liquid`): PASS.
- `X_page` on the 3p snowboard: 0 at all 7 widths. On `/`: 76 at 320, 21 at 375 (T3 banner), 0 from 768. No HEAD vs base difference on any of the 9 pages.
- A/B of 9 pages x {1440, 375} (`t1r-diff.py`): only difference is `headerCs` display flex to grid and padding 32px to 0 (intended structure change), plus wrapper/header x/width. Nothing in footer, body, H1 count, status.
- Cart drawer on `selling-plans-ski-wax` (`t1r3q-cart.mjs`, 1440 and 375): badge hidden, add gives 1, qty 3 gives 3 (also after reload), remove gives hidden. PASS. (One transient `ERR_TIMED_OUT` on the 375 page load, passed on retry.)
- Console: 0 on most pages; the p3p/snow pages log the Shopify monorail telemetry "Failed to fetch" (also on base); the intentional 404 page logs one 404. No theme errors.

### N7: RESOLVED

Bar is full bleed and the content row is correct.

### Owner-acceptance list (updated)

1. Cart glyph 17.4 x 22.3 in a 40px SVG inside a 44px hit area; badge at the top-right corner covering part of the handle.
2. Header icon row vertically centred, lost its 12.8px right padding; desktop menu about 18px further right at 1440; hamburger glyph 24px (was about 32), 9px further left at 375.
3. Footer 2.4px taller at 1440 and 8.9px taller at 375; copyright wraps to two lines at 375.
4. Header switches to the hamburger and mobile panel under 1024 (iPad portrait and split windows get the mobile header while the footer stays desktop-style from 768).
5. `group/menu` deviation (N4) stays.
6. Footer mobile breakpoint 750 to 768 (planned); header 1024 (see 4).
7. Accent `#e3fc01`, accent text `#111111`, Oswald Bold unchanged.
8. Full-bleed header bar (content column unchanged): verified, ready to accept.
9. Full-width mobile panel (links at the same x): verified, ready to accept.

### Info (carried forward)

- `X_page` on `selling-plans-ski-wax` at 375 grows 16 to 34 after the add (page, not header; not a regression of this commit).
- Cart link `aria-label` can be stale ("0 items") after an add; pre-existing, not part of T1.
- The logo overflows the 64px bar (168px tall at 768+); identical to base.

### BLOCKED (unchanged)

- C1.2 editor round-trip, C1.7 live updates, C1.8 editor display, and the theme editor preview check: no admin login (operator list from the first run applies).
- Announcement bar full-bleed variant not rendered in the test data; unverified (check once enabled, same grid-row sizing may apply).
- Supercycle embed and gift card page on the dev theme: operator on staging.

### Harness added

`docs/qa/harness/t1r3q-{measure,menu,cart,rowgeom,panel,shots}.mjs`, `t1r3q-cmp.py`. Screenshots `docs/qa/screenshots/t1r3-*`.


## Owner decision (2026-10-23)

After reviewing T1 on staging (#187953643616, staging push 2 from `a7e2994`), the owner (Junior Warner) instructed: "Push to production and let's move on to the next phase." This is recorded as approval of the live push and acceptance of owner-acceptance items 1–9 from Re-run 3 as shipped. The owner did not comment on them item by item.

Still open after the live push (operator checks, not blockers): theme editor checks C1.2/C1.7/C1.8, the announcement-bar full-bleed variant once enabled, and setting the dark Ride colors in the editor.

PASS
