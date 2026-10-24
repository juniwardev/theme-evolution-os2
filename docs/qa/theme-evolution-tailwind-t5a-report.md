# QA report: theme-evolution-tailwind-t5a (retire assets/base.css at parity)

HEAD `b1d2824`, base `96a8898`. Plan Revision 2.3.1. Tools: Playwright (Node scripts, Chromium) throughout; Chrome DevTools MCP not used. Harness: `docs/qa/harness/t5aq-{cap,cmp,feat,fdiff,kb}.mjs` (my own measurement code; only login/context helpers come from `t5ac-lib.mjs`). Evidence: `docs/qa/evidence/t5aq-*`, `docs/qa/screenshots/t5aq-*`.

## Summary verdict

**PASS WITH NITS.** Parity is confirmed independently: 68 page-width pairs are pixel-identical base vs head, and the only computed-style differences are the plan's N/A groups. Several items could not be fully re-measured (see "Gaps"); none showed a failure.

## Process note

While looking up the fixture format I printed the storefront password into my own tool output once (a sed redaction missed it). It was not written to the report, evidence, scratch files or any commit. The owner may want to rotate it.

## Gates

- `npm ci && npm run check`: exit 0. `check:css` passes; theme check: 146 files, 0 offenses.
- `assets/tailwind.css`: 58,850 bytes, 11,269 gzip -9. Budget 60,000 / 12,000. Passes, equal to the plan's `P_end`.
- C5a.2: no file under `sections/` or `blocks/` is in the diff 96a8898..HEAD, so the 23 schemas are unchanged by construction.
- C5a.3/4/24 (static): `ls assets/*.css` is only `tailwind.css`; the three `'tailwind.css'` link lines remain; 0 hits for `base.css` in layout, sections, blocks, snippets, templates, src, scripts, package.json, CLAUDE.md and AGENTS.md; 0 hits for the Dawn card variables outside `docs/`; `scripts/` holds only `check-css-layers.mjs`; `package.json` `check` = `check:css && shopify theme check`; neither `S_leak` string is in the CSS; the new layer statement occurs once in each rules file; the T8 sentence is present in both.
- Step 8: the coexistence rules are removed accurately. The only remaining "Dawn" mention is the generic namespace-collision advice.

## Cross-build parity (base vs head, noise from a second base load)

- 18 pages x 375 and 1440, plus 8 key pages (home, p3p, collection, optout, policy, cart, password, contact) at 320, 430, 750 and 990. 68 pairs, `/password` and the 404 included.
- Pixels: all 68 pairs have 0 differing pixels (full-page). That includes `landing-375`, the PXN underline: build to build it is identical.
- Geometry: no rect moves outside the opt-out page's hCaptcha parts. Document width and height, h1 count, root font size (16px), line-height (`normal`) and images without dimensions: no differences.
- Stylesheets: head has one fewer sheet on every page. Layer statement at head is `properties, theme, base, components, utilities`. No request for `base.css` or any Dawn stylesheet on any head page. The only theme CSS requested is `tailwind.css`.
- Computed-style groups (head vs base) are all the plan's classes:
  - N: `list-style-type` none to disc inherited from Dawn's `.grid`; `flex-wrap`; accordion `summary` position; spinner `z-index`; light-DOM "Buy it now" `position`; policy `::after` clearfix; widget button transition.
  - A: `word-break: break-word` on the `/password` h1 (E5a.20); hCaptcha parts `none` to `block` (E5a.18).
  - No P-class property differs.
- Console: the only head-only errors are `ERR_NETWORK_CHANGED` and bugsnag session failures from local network flakiness during the run (they occurred mid-run, at random pages and widths). No theme-related errors. One unpaired element, `shop-cart-sync` on home-320, is Shopify-injected timing. The console clean-up is by inspection, not a clean re-run.

## PXA (announcement bar on, scratch copies of base and HEAD with the setting enabled)

Bar `margin-bottom` goes 32px to 0. The header wrapper is 32px shorter. Every element below moves up exactly 32px (histogram: 0,-32,0,0 or unchanged, nothing else). This is E5a.4 as predicted. Pixel comparison with the shift applied showed differences that I did not run down (no base-vs-base noise capture for this set), so PXA pixels are unverified beyond geometry.

## Opt-out page (`/pages/data-sharing-opt-out`)

- Checkbox `margin-right` 8px, display and width: equal base vs head (E5a.3 kept).
- Focus rings: base `outline: none`; head browser default (`auto`). Ring clipped by the scroll box: checkbox 3px on the left at head, button 1px each side, at 320, 375, 390, 430 and 1440. Recorded, not judged (C5a.11(c), E5a.2).
- Error-state message (emulated by clearing the widget's inline `display: none`): line-height, font-size, icon size and flex-shrink identical base vs head (E5a.19 confirmed in the shown state).
- hCaptcha challenge: it can be triggered by clicking "Opt out" with no data entered (nothing is submitted; non-analytics POSTs were blocked). **Observed difference with the challenge open:** at head hCaptcha's mask now shows as a roughly 50% grey dim over the whole viewport, including the header, and an `elementFromPoint` on the header cart icon returns the mask (not the cart). At base the mask is hidden by Dawn's `div:empty` and the page stays undimmed and clickable. This is E5a.18 working as the plan describes, but the plan called it "a faint wash". It is a clear modal dim. See `docs/qa/screenshots/t5aq-{base,head}-optout-challenge-375.png`. When no challenge is open, hit tests on the checkbox, button and cart icon are unaffected and nothing paints.
- Escape behaviour after the challenge: same on both builds.

## Policy page

At 375 and 1440, lists compute `disc`, `inside`, 32px padding; links compute underline, 4.8px offset, 1.6px thickness, 0.1s transition on thickness; hovered thickness 3.2px. All equal to base (zero diff in the feature diff). Policy-page pixels are identical.

## Injected zoo (merchant-HTML elements in the real `prose` box and a bare copy on `/pages/contact`)

Differences are exactly the E5a.6 / E5a.17 set: h6 margins, bare table (22.4px to 16px, fixed to auto layout, cell padding), bare hr (80/112px margins to a visible 1px rule), bare blockquote (italic and left padding gone), bare summary marker back, bare anchor cursor, bare empty elements visible. Inside `[data-rich-text]` the empty `div`, `a`, `ul`, `h3` and flex-gap child stay `display: none`. The vendor line with blank content stays `display: none` at head (built from each build's own class string; head carries `empty:hidden`).

## Coder deviations, ruled

1. **C5a.21 / Step 5 leak lines: correct parity.** The two removed `prose-tokens` selectors do match `hr` and `blockquote` in `prose`, so a literal reading ("match 0 elements") is red. The intent is no loss of effect, and I measured it: in `prose`, `hr` and `blockquote` `border-top-style`, `border-top-width`, `border-top-color`, `border-left-width`, `border-left-style` and `border-left-color`-related values are identical base vs head, with one exception that is invisible: head `border-left/bottom-style` on `hr` and the table styles compute `solid` where base had `none/hidden`, all with 0 border width. I accept the Coder's reading. The plan wording should be amended to "no computed change", and I note that the Coder's note says the clause is "read as accidental loss", which is the right call but is a plan-wording fix, not a build defect.
2. **One run at final HEAD instead of after Step 3: accepted.** Steps 4 to 8 change no rendering except Step 5 and 6, and I measured the end state directly. The Step 3 intermediate state was not re-created by me.
3. **Harness changes: accepted with a caveat.** The outside-click test point is a test fix. The `end` mode accepting a key shared across classes when an N or A class exists is looser than the plan, but my own comparison, which classifies by property rather than by that table, reached the same result. Proxy pages skipping the cmp geometry/pixel checks is fair, since A rows move content; I covered PXA by shift analysis.

## Findings

| # | Severity | Finding |
|---|---|---|
| 1 | Nit (owner) | E5a.18 is a visible grey dim and click-blocking mask while a challenge is open, not "faint". Likely an improvement, but needs the owner's explicit look. |
| 2 | Nit | A bare `summary` in merchant HTML also loses `cursor: pointer` (Dawn rule), not only its marker. E5a.6 lists the marker but not the cursor; same class as the anchor cursor added by Q-C3. |
| 3 | Nit | C5a.21's literal wording is red on Step 5 by design; fix the wording in the plan. |
| 4 | Info | My console check was disturbed by `ERR_NETWORK_CHANGED` noise on the machine's network. |

No blockers.

## Gaps (stated plainly)

- **Keyboard focus through header, cart drawer and mobile menu:** my harness (`t5aq-kb.mjs`) was written and run once at head but the product-page load timed out repeatedly on the network, so I have no independent base/head sequence comparison. Only the opt-out widget's focus was measured by me. Rely on the Coder's evidence (`t5ac-focus-*`) for the rest, and have the owner tab through the header and drawer on staging.
- **S8 text-selection screenshots:** not obtained (the selection clip came back empty). E5a.5 remains unverified. Owner check 3 item stays open.
- **Regression flows (C5a.22), B_rb (C5a.19), product-page S7 spinner, `/cart` with an item, gift card (PXG):** not re-run by me. The empty `/cart` page was captured and is identical.
- **Theme editor:** not reachable (needs Shopify admin login). No settings-by-settings check was done. T5a changes no schema, so risk is low, but the spot-check the plan asks for is not done.
- **PXA pixels** beyond geometry, and **PXE** (blank banner buttons): PXE is trivially unchanged since `sections/image-banner.liquid` is not in the diff.
- **C5a.25 live probe:** out of scope, re-run before the live push.

## Owner check 3 list, as I would present it

1. E5a.1/E5a.2: browser-default focus rings everywhere; privacy widget rings are clipped 3px (checkbox) and 1px (button) at 320 to 430.
2. E5a.3: checkbox spacing kept (8px).
3. E5a.4: the announcement bar loses its 32px gap below it when turned on.
4. E5a.5: selection highlight, **not verified by QA**; please select text on a page.
5. E5a.6: bare tables, hr, blockquote, summary (marker back, pointer cursor lost), h6 margins, anchor-without-href cursor in merchant HTML.
6. E5a.12: Shopify captcha page unstyled (model only, no fixture).
7. E5a.16: empty elements in merchant HTML stay hidden (verified).
8. E5a.18: while the opt-out hCaptcha challenge is open, the page gets a grey dim and cannot be clicked behind it; click "Opt out" on staging to see it.
9. For sight: E5a.19 (error-state sizing, verified identical), E5a.20 (`/password` and gift-card headings gain `word-break: break-word`, pixel-identical on `/password`; gift card not viewed).

Dev theme #187953938528 was left synced to HEAD from the repo root; all dev servers are stopped. Live and staging untouched; nothing pushed or committed.

PASS WITH NITS
