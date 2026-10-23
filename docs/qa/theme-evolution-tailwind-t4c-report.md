# QA report: theme-evolution-tailwind-t4c

HEAD a81620d, base c3a5fa3. Plan Rev 2.1. Tooling: Playwright (node scripts `docs/qa/harness/t4cq-*.mjs`, `t4cq-mkpx.py`; no Chrome DevTools MCP needed). Dev theme #187953938528 only (base, head, three scratch proxy trees, then the repo HEAD again at the end; all servers stopped). Nothing pushed, committed or created in the admin. Password read only inside `t0-lib.mjs`.

## Summary verdict: PASS WITH NITS

No blockers. Every focus item re-measured independently on base vs head agrees with the Coder's claims. Nits and unverifiable items are listed below.

## Gates (re-run on HEAD)

| Check | Result |
|---|---|
| `npm ci && npm run check:css` | exit 0, 0 |
| `check:hidden` | 0 |
| `shopify theme check` | 104 files, no offenses |
| CSS size | 58,308 B min / 11,082 B gzip -9 (budget 60,000 / 12,000) |
| Plugin pin | `"@tailwindcss/typography": "0.5.20"` exact |
| Protected paths | `git diff c3a5fa3 --stat` shows no `config/`, `templates/`, group JSON or `locales/` change |
| Repo tree after QA | clean apart from untracked harness files |

## Results by focus item

**Overflow / N1 (C4c.16, C4c.17).** 15 pages x 7 widths (320/375/390/430/768/1440/1920), scroll-aware offenders. Head: `X_page` 0 everywhere except `/policies/privacy-policy` at 320 = 5 (offender `div.shopify-policy__container`, Shopify markup). Base has the identical 5 (so pre-existing, confirmed). Base opt-out: 111/56/41/1 at 320/375/390/430 (reproduced); head 0 at all seven widths. Box `overflow-x: auto`; at 320/375/430 scrollWidth 379 vs clientWidth 216/271/326 (widget scrolls inside the box), scrollHeight == clientHeight, no scroll range at 768+. Evidence: `ov-base.json`/`ov-head.json` in the scratchpad (not kept in repo); harness `t4cq-overflow.mjs`.

**Keyboard (N1).** Tab order from just before the box: checkbox, then "Opt out" button, then leaves the widget. Both controls are `:focus-visible` and remain inside the box's visible area at every width; no auto-scroll needed. Both have `outline: none` computed, so there is no ring to clip (but also no visible focus indicator from the widget itself; Shopify's CSS, not T4c). Text inside the widget: label is 16px/28px, margin 0.

**`prose prose-tokens` (C4c.5-C4c.9), scratch PXR (`templates/page.qa-rt.liquid`, class strings regex-extracted from head files; CSS identical to head by `cmp`).** Wrapper 16px/28px; max-width 646.88 px on page/article/comment/excerpt (width 646.9 at 1440, 271 at 375 = parent); archive and PDP wrappers `max-width: none`; 15 mapped variables equal plan values, `kbd-shadows`/`pre-*` stay plugin defaults; p margins 20px, h2 24px/700 body font, ul/ol 26px disc/decimal, links 500 + underline, strong 600, blockquote solid 4px, hr solid 1px. Leak lines do their job: a bare `prose` gives `hr`/`blockquote` border style `none` (Dawn leak), `prose prose-tokens` gives `solid` (measured in-page). Forms: `ul` disc, 24px.

**Palette proxy (#ee1188 on #112233, plain settings in scratch).** page/article/comment/excerpt: p, h2, a, strong, blockquote all `rgb(238,17,136)`; marker alpha 0.3, hr/blockquote border alpha 0.1; `pre` background unchanged `oklch(0.278 ...)`. Archive: all text 0.75 alpha, so markers 0.225 and hairlines 0.075 (alphas compound with the outer 75 %; harmless, the real archive has one paragraph). Footer link color follows the `footer_text` setting. `currentColor` semantics confirmed.

**Real pages, head vs base.** Opt-out box 646.9 wide at 1440, 271 at 375, 16px/28px. Archive description 600 = 600 and 287 = 287; description height 28 vs 19 (1440) and 84 vs 57 (375); card grid top 296 -> 305 (1440, +9 px) and 344 -> 371 (375, +27 px); document height 1620 -> 1629 and 3835 -> 3862 (E4c.3 measured). PDP description wrappers `prose prose-tokens max-w-none`, width = parent (494 at 1440, 287 at 375) on all three fixtures; wax description is empty (0 height).

**PDP layout and tooltip (C4c.10).** Screenshots at 1440/375 for all three PDPs (`docs/qa/screenshots/t4cq-{base,head}-{p3p,wax,snow}-{1440,375}.png`): layout intact, description has 1.75 line height and paragraph spacing (E4c.2, intended). On the PXP fixture (3p snowboard): trigger spans `rgb(0,112,124)`, dotted underline, offset 4px, weight 500, also inside `strong`; hover gives `rgb(0,76,85)` and `div.eco-tooltip.is-visible`. Unchanged.

**D6 removal parity (C4c.14, C4c.15).** Base vs head, every displayed `ul`/`ol`/`a` on 15 pages at 375 and 1440 plus a fresh reduced-cookie context at 375 plus the home page with the cart drawer open (wax seeded): 1,036 elements per side, same count, same text pairing, **0 differences** in `list-style-type`, `list-style-position`, `padding-inline-start`, `padding-left`, `text-decoration-line`, `text-decoration-thickness` (header 205, footer 564, other 236, policy 27, drawer 4). Policy page: `ul` disc/32px/inside, links underline, identical to base. **Footer copyright links** ("theme-evolution-os2", "Powered by Shopify"): `text-decoration-line: none` on both base and head (the existing `[&_a]:no-underline` already beat D6), so not a regression. The default dev store has no footer `about_text`, banner link or error list, so those sinks are covered by the proxy below.

**Non-prose sinks (PXS scratch, C4c.11).** Footer about: link underline, `ul` disc, padding 21px at 14px wrapper; banner heading link and added text-block link: underline 1px / offset 3px; related-products heading link underline at 1440 (all three fixtures) and at 375 (wax; the other two fixtures' recommendations did not load at 375 within 4 s after scrolling). Scratch `footer_text` palette run: values follow settings.

**Error lists (C4c.12).** `/password` (logged-in theme page): form `classList` contains `[&_ul]:list-disc [&_ul]:ps-[1.5em]` (the `&` survives the `{% form %}` tag). PXR form copies: `ul` disc, 24px. A real error list cannot be rendered: a wrong-password submit in an unauthenticated context renders Shopify's built-in password page, not the theme's `password.liquid` (one wrong-value POST made, status 200).

**C4c.8 PXW** (`max_page_width` 110rem, 1920): description 638 = parent 638, `max-width: none`, but `M_ch` 646.89 > 638, so the clause cannot tell `max-w-none` from `65ch`: **inconclusive**, as the Coder said. `max-w-none` is computed `none` on all PDPs (C4c.5c ok).

**C4c.18.** `<h1>` = 1 on all 15 pages (1440). Heading order head == base on every page (the header's own h2 precedes the h1 on both; unchanged, T4c does not touch it). No `main/header/footer` `<img>` missing width/height on any page.

**C4c.21 regression.** Cart drawer on wax at 1440 and 375: add (200, opens), update to 3 via `fill()`+`blur()`, remove to the empty state, Escape closes: all PASS. Header/footer render in all screenshots. Collection, search, pagination links: covered by the zero-difference sweep.

**C4c.22.** Not re-run (optional). The Coder's Step 0 VALID-PASS stands; it must be re-run immediately before any live push.

## Issues / nits

1. **Nit (usability, accepted cost).** On phones the opt-out widget's checkbox label is cut off inside the box ("Don't share data from my acco...") and there is no scroll affordance on touch (screenshot `t4cq-head-optout-375.png`). This is the plan's disclosed Q4c.6 option A cost. Option C (size the widget) remains unverified as viable.
2. **Nit.** The widget's controls have `outline: none`, so there is no visible keyboard focus indicator inside the widget (Shopify's CSS; pre-existing).
3. **Nit.** Archive description centered: a list in it would show markers at the far left with centered text (observed in the palette proxy screenshot `t4cq-pal-rt-1440.png`, last block). The real archive has a single paragraph, so no visible effect today. Archive markers/hairlines alpha compound (0.225/0.075).
4. **Nit (carried).** Policy page 5 px overflow at 320: pre-existing, identical on base.
5. **Info.** Opt-out page and archive become taller (opt-out 1680 -> 2156 px at 375; 900 -> 1265 px at 1440): intended E4c.1/E4c.3, flagged for owner check.

## Console / network

Not exhaustively captured; no failures observed during the scripted runs (all pages loaded, cart add returned 200).

## Could not verify

- Rendered `default_errors` list on the password and comment forms (no reachable error state; no article/comment fixtures).
- PXW discrimination (`65ch` vs `max-w-none` at 1920/110rem): inconclusive by geometry.
- Related-products clause at 375 on the complete-snowboard and 3p fixtures (recommendations did not load); valid on wax at 375 and on all three at 1440.
- Theme editor live-update/select-setting checks (owner check 1), editor preview.
- C4c.22 live probe re-run; C4c.19 selector set diff (relied on Coder's evidence plus unchanged byte sizes).
- Full pixel diff of base vs head screenshots (visual spot checks only).

## Screenshots

`docs/qa/screenshots/t4cq-{base,head}-{optout,balanced,archive,p3p,wax,snow,policy,blog,home}-{375,1440}.png`, `t4cq-{default,pal}-rt-{375,1440}.png`, `t4cq-default-pxp-1440.png`, `t4cq-password-error.png` (all gitignored).

## Verdict

PASS WITH NITS
