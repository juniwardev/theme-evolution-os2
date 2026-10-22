# Plan review: theme-evolution-tailwind (Revision 1)

Reviewer: Plan-Reviewer
Date: 2026-10-22
Plan under review: `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/docs/plans/theme-evolution-tailwind.md`
Revision: 1 (first review round)

Rules re-read this pass: `CLAUDE.md`, `AGENTS.md`, `.claude/agents/devops.md`. `learn_shopify_api` (liquid) was called once, as `CLAUDE.md` requires.

Cross-references read:
- `layout/theme.liquid`, `layout/password.liquid`, `templates/gift_card.liquid`, `assets/critical.css`
- `assets/base.css` (lines 1-500, 705-765, 870-910, 1180-1240, 2300-2350, 2510-2570, plus targeted searches for element rules, `!important`, `line-height`, `shopify-section`, `:where(`/`*` rules, utility-named classes)
- `assets/section-image-banner.css`, `assets/component-card.css`, `assets/section-main-product.css` (targeted)
- `sections/header.liquid` (whole file), `sections/footer.liquid` (1-265), `sections/cart-drawer.liquid` (80-100, 284-388), `sections/image-banner.liquid` (whole), `sections/related-products.liquid` (1-40), `sections/password.liquid`, `blocks/text.liquid`
- `snippets/css-variables.liquid`, `config/settings_schema.json` (targeted)
- `shopify.theme.toml`, `.shopifyignore`, `.gitignore`
- `docs/bugs/mobile-horizontal-overflow.md`, `docs/plans/theme-evolution-homepage-phases.md` (Standing Coder directives and sequencing), `docs/qa/theme-evolution-footer-deploy.md` (staging theme ID)
- Shopify Dev MCP docs: `{% stylesheet %}` bundling, early hints and preload budget, `font_picker`

I had no shell, web or Context7 access in this session. Byte counts and theme check numbers below come from the orchestrator. Tailwind facts are from my own knowledge (cutoff June 2026) and are labelled that way.

---

## Summary

This is a strong umbrella plan. The core mechanism is sound: the `base` < `legacy` < `components` < `utilities` < `shims` order, the inline layer statement placed first, `base.css` wrapped in place, and `critical.css` folded into `@layer base`. The criteria sweep is the best I've seen on this project. It explicitly pairs C0.4, C0.5, C0.9 and C0.1 with the rejected alternatives they rule out, and I confirmed each of those is red on the build it names and green on a correct one. The settings-to-token design (same-name override for colors, `@theme inline` for renamed vars) keeps theme-editor live updates working. The deploy story leaves `-e production` alone and adds no theme ID to the default environment.

I found **one blocker**. `templates/gift_card.liquid` also loads `critical.css`, which T0 deletes, and the plan never mentions that file. Correct T0 code would then fail the plan's own Step 4 check and, very likely, C0.8. The rest are REQUIRED fixes, mostly in the evidence and rules text: a `check:css` script that can't pass at the point R3 tells the Coder to run it; a `B_rb` filter that selects no resources; an expected-diff list that leaves out Preflight's site-wide line-height and link changes; a rules example that renames option values against the plan's own rule; and a `hidden` guard that misses the class-string pattern the rules prescribe. None of them requires redesign. Verdict: **APPROVE WITH CHANGES**.

---

## Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**
- `layout/theme.liquid` 5, 13-18, 20-23, 33; `layout/password.liquid:8`.
- `assets/base.css` 79-83, 144-147, 194-196, 215-217, 250-268, 296-306, 460-462, 468-482, 879-898, 1218, 2313-2315, 2519-2524, 2555-2565. All match.
- `sections/header.liquid`: every cited line (21, 38, 54-66, 89, 105-113, 115-291, 117-121, 150-157, 154, 235-243, 277-290, 293-374, 376-435).
- `sections/footer.liquid` 38, 116-121, 123-259, 132, 241, 261. `sections/cart-drawer.liquid` 80, 93, 294, 377, 378. `sections/related-products.liquid` 1-3, 6, 25, 35. `sections/image-banner.liquid` 8, 11, 33, 142.
- `config/settings_schema.json` 19, 30, 46, 61, 67, 73, 88. `shopify.theme.toml` 14-19, `.shopifyignore` 18-24, `.gitignore:10`. `.claude/agents/devops.md` 16-21, 25, 56-58, 136-140.
- All 12 `CLAUDE.md` anchors and all 12 `AGENTS.md` anchors in §13 (including `## Examples per kind of asset` at 1289 and 1284).
- The undefined-variable claim: re-searched; none of the six are defined. (`--ease-out-slow` and `--duration-*` are defined, in `base.css:579-590`.)
- `max-md:hidden` appears in no Liquid file (C0.9 precondition).
- The cart hook has exactly three consumers. `assets/*.js` doesn't use `.header__icon--cart`.
- `K_base` = 80 KB is consistent with the orchestrator's 80,382 bytes. `N_tc` = 2 is consistent with the orchestrator's run.

**Sampled and found wrong:**
- §4.1 and §4.2 ("ripgrep for `stylesheet`, `style`, `<style`, `stylesheet_tag`") miss `templates/gift_card.liquid`, which has both a `stylesheet_tag` (line 10) and a `{% style %}` (15-22). See F1.

**Taken on trust (not re-read):**
- The §4.2 snippet line numbers (`sustainability-rating:46`, `cart-intelligence-banner:21`, `card-product:66,200,610`, `collections.liquid:10`, `main-material-archive:234`, `trust-badge:5`, `specs-table:1`).
- `material-spotlight.liquid` line numbers.
- `oswald_n7` existing in the font library. The MCP search didn't return the font list; the Coder should confirm it when adding the setting.

**Gaps the manifest itself lists, reviewed in full:** Preflight's real rules (F5), the `{% stylesheet %}` + `@layer` spike (F8), the `B_rb` and size budgets (F6), and the Liquid examples in R10/R11 (F7).

---

## Findings

Each finding is graded **BLOCKER** (the build can't pass correctly as specified), **REQUIRED** (fold in before `/implement`; doesn't by itself stop a build) or **NIT**.

### Correctness

**F1 — BLOCKER. T0 deletes `critical.css`, but `templates/gift_card.liquid:10` still loads it.**
Evidence: `templates/gift_card.liquid` uses `{% layout none %}` and has its own `<head>`. Line 10 is `{{ 'critical.css' | asset_url | stylesheet_tag: preload: true }}`. The file isn't in §4.1, §4.2, §7.1, §7.5 or §17.1. T4 lists it, but T0 breaks it first. Consequences of correct T0 code:
- Step 4's `rg -n "critical.css" …` "must print nothing" prints this line, so the step fails.
- Theme check's `MissingAsset` check will very likely add an offense, so C0.8 fails.
- On staging, or any fresh install (a push without `nodelete`), the gift card page loses its stylesheet.
- On live, `nodelete` keeps the orphaned `critical.css`. The live gift card page keeps running pre-Tailwind CSS with no layer statement, so staging and live silently disagree.

Required change: add `templates/gift_card.liquid` to §7.1 and §7.5 with the same two edits as the layouts (layer `<style>` first in `<head>`, `critical.css` replaced by `tailwind.css`). Add it to the E-list: like E5, its `<h1>` loses the browser's 2em bold, and its unlayered `main img { display: unset }` still beats Preflight. Extend C0.7 to cover it, or add a static check (`rg -n "'critical.css'" layout sections snippets blocks templates` prints nothing) if QA can't get a gift card URL on the dev store.

**F2 — REQUIRED. Step 4's `critical.css` grep is also red on a comment.**
`sections/footer.liquid:130` contains "critical.css forces .shopify-section" inside a CSS comment. T0 doesn't touch that file; T1 deletes the comment. As written, a correct T0 fails Step 4, and the Coder will be tempted to edit `footer.liquid` (scope creep). Fix: match the asset reference, not the word, e.g. `rg -n "'critical.css'"`. That's the quoted form §12 already uses for T5.

**F3 — REQUIRED. `check:css` can't pass at the point R3 tells the Coder to run it.**
`check:css` is `build && git ls-files --error-unmatch … && git diff --exit-code HEAD -- assets/tailwind.css`. That compares the working tree with **HEAD**. So before a commit, any change that alters the CSS makes it fail by design, and on T0's first commit the file isn't in HEAD at all. R3 says "run `npm run check:css` before each commit" (that text goes permanently into `CLAUDE.md`/`AGENTS.md`), and Step 9 says it "passes at every commit". Separately, the claim that watch output is byte-identical to `build:css` is shaky. Tailwind's watch mode (v3 certainly, and I believe v4) keeps candidates it saw earlier until a restart, so a watch-produced file can carry stale rules.
Fix: diff against the **index**: `git ls-files --error-unmatch assets/tailwind.css && git diff --exit-code -- assets/tailwind.css`. That passes after `build:css` + `git add` before a commit, and behaves exactly like today's version on a clean tree, which is what QA and DevOps run on. Change R3 to: "run `npm run build:css`, stage `assets/tailwind.css`, then `npm run check:css`". Drop the byte-identical-watch claim from §7.2.

**F4 — REQUIRED. The inline layer statement must name every layer the compiled output declares.**
Layer order is fixed by first appearance, and any layer name not in the inline statement is appended **after `shims`**, i.e. at the highest priority. From memory, unverified: Tailwind v4.1+ builds begin with `@layer properties;` before `@layer theme, base, components, utilities;`, and end with an `@supports`-guarded `@layer properties { *, ::before, ::after, ::backdrop { --tw-…: … } }` fallback. If so, the plan's statement turns that layer into the strongest one. Its `@supports` guard probably targets engines below `BF`, so in-floor impact is likely nil, but the principle stands, and C0.2 as written would pass anyway. Fix: make Step 3 a gate. Read every `@layer` statement and block name in the compiled `assets/tailwind.css`, and put any layer not in the six-name list into the inline statement at the position Tailwind gives it (e.g. `@layer properties, theme, base, legacy, components, utilities, shims;`). Then update C0.2's expected `nameList`, the §7.3 comment and R8 to match.

**F5 — REQUIRED. The expected-diff list leaves out Preflight's most visible effects, and the evidence used to check it can't see them.**
- `html { line-height: 1.5 }` (Preflight, high confidence) changes every page. `base.css` sets no valid `html`/`body` line-height: every body-level `line-height` it declares is `calc(… var(--font-body-scale))`, which is invalid. Today text inherits the browser's `normal`; after T0, everything without a valid line-height becomes 1.5. That's site-wide, not E6-rare.
- E4 is scoped to merchant rich text, but Preflight's `a { color: inherit; text-decoration: inherit }` applies to **every** link. Any link without a valid class-level `color` stops showing the browser's blue/purple. Any **classed** link without a text-decoration rule loses its underline; D6 only restores unclassed ones. That's the right fact attached to the wrong scope.
- Not listed anywhere:
  - `border-radius: 0` and a transparent background on every `input`/`button`/`textarea`
  - `display: block` on `iframe`, `embed`, `object` and `audio` (`critical.css` only covered img/picture/video/canvas/svg); this affects embeds in product descriptions
  - `border-collapse: collapse` on all tables (the `specs-table` snippet)
  - `::placeholder` color
  - `h6` size and weight
- The Step 0/7 computed-style dump records `display, position, z-index, margin, padding, width, height, font-size, font-weight, color, background-color, border-width`. It can't see `text-decoration-line`, `line-height`, `list-style-type`, `border-radius`, `border-style`, `box-shadow`, `opacity`, `vertical-align`, `font-family`, `letter-spacing`, `text-transform`, `cursor` or `::marker`, so C0.12 can't distinguish "every diff is expected" from "the diff wasn't measured". Screenshots at two widths on ten pages only partly make up for that.

Fix:
1. Add those properties, plus `::before`/`::after` `content`/`display`, to the dump.
2. For each of the Preflight changes above, either list it as a new expected diff (E7 onward) or add a D6 parity rule. For line-height, `html { line-height: normal }` with a "T5" marker is the obvious candidate if T0 really means "no deliberate visual change".
3. The Architect picks; the owner signs off on whichever ones become expected diffs.

**F6 — REQUIRED. The `B_rb` method selects zero resources, so C0.10's render-blocking half can't go red.**
`B_rb` counts "every resource whose URL ends in `.css`". Shopify's `asset_url` appends `?v=<timestamp>`, and the compiled `{% stylesheet %}` file is also query-stringed, so a literal `endsWith('.css')` matches nothing. Then `0 ≤ 1.15 × 0` always passes. Fix: `initiatorType === 'link' && new URL(name).pathname.endsWith('.css')`. Also, `encodedBodySize` measures **compressed** bytes. On `/`, `B_rb0` is roughly `base.css` compressed plus small files. My rough, unmeasured estimate is that T0's net addition could land close to +15% there on a correct build. State what a breach means (owner sign-off, as R6 already says for `S_tw`) so a correct T0 isn't failed on a proposed number, or set the ratio after Step 0 measures `B_rb0`.

**F7 — REQUIRED. The R11 Text-block example renames option values, contradicting the plan's own rule.**
The plan says in D8, R8 and R10, and for T3 in §10, never to rename option values. R11's Text example changes `text--title`/`text--subtitle`/`text--normal` to `title`/`subtitle`/`normal`. The real `blocks/text.liquid:44-48` uses the `text--*` values, and `templates/product.json` / `product.landing-page.json` contain `text` blocks. In T3, a Coder who copies the `CLAUDE.md` example orphans saved values, and a later template push could be rejected for an invalid select value. This text reaches every future agent. Fix: keep `text--title`, `text--subtitle`, `text--normal` (and the default `text--title`) in the example and map them in the `case`, as the Group example already does.

**F8 — REQUIRED. R8 codifies `{% stylesheet %}` + `@layer components` before Step 6 has tested it, and its "MUST wrap" covers unconverted files.**
The Shopify docs I checked say `{% stylesheet %}` content is concatenated into one `styles.css` (subset per page) and linked from `content_for_header`. Nothing documents what happens to `@layer`, so the Step 6 spike is the right test, and the `<style>` fallback is adequate for the one T1 sticky-header rule. But Step 8 writes R8 after Step 6 without tying the text to the result. If the spike shows the block stripped, `CLAUDE.md` would mandate a pattern that doesn't work. Separately, R8's "any custom CSS outside `src/tailwind.css` MUST sit inside `@layer components`", read literally, makes anyone touching `cart-drawer.liquid`'s `<style>` or `card-product.liquid` wrap them. That moves them below every remaining unlayered rule (Dawn component files, other sections' CSS), which flips the cascade. Fix: Step 8 writes the `{% stylesheet %}` bullet according to Step 6's result (give the alternative text, e.g. "use `<style>@layer components{…}</style>`"). Scope the MUST to "new CSS and CSS in a file being converted under a T-phase or roadmap plan".

**F9 — REQUIRED. The bare-`hidden` guard misses the pattern R10 tells the Coder to use, so C1.5 can pass a broken build.**
The R3 regex only inspects `class="…"`. R10 tells Coders to build class strings with `assign x = '…'` and output `class="{{ x }}"`. A `hidden md:flex` written that way, or in single quotes, `image_tag: class: '…'`, or a `capture`, isn't seen, so C1.5 stays green on exactly the build it exists to catch. It also skips `templates/`, and it misses arbitrary variants (`[&.open]:flex`) and `flow-root`/`list-item`. Fix: run the two lookaheads over any single- or double-quoted string, not just `class="…"`, and include `templates`. Also add to R8's ban list the other Dawn classes that set `display: none !important` (`small-hide`, `medium-hide`, `large-up-hide`, at `base.css:430-446`), and `visually-hidden`'s `position: absolute !important`. They're the same trap as bare `hidden`.

### Missing edge cases and failure modes

**F10 — REQUIRED (doesn't block T0; fix before T1). Δ-column errors in the T1 mapping tables.**
These rows are exempt from C1.6, so they won't cause a false red. But the Δ column is what QA and the owner read as the intended change, and some of its numbers are wrong:
- Footer copyright: 0.85rem → `text-sm` is 13.6 → 14px, i.e. **+0.4px**, not −0.2px.
- `text-xs`/`text-sm` in v4 set **line-height as well** (16px/20px). The announcement bar, menu links, footer menu links and copyright change box height, not just font size, and the rows say "font-size only".
- The shop-name fallback `span.h2` renders at 16px today, because Dawn's `.h2` size uses the undefined `--font-heading-scale` and inherits. `font-heading text-2xl uppercase` makes it 24px and uppercase. The Δ says only "new heading font".
- The cart badge `px-1.5` is 6.4 → 6px and isn't listed.

**F11 — REQUIRED (T5 scope; doesn't block T0/T1). T5's mechanical precondition ignores classes that Dawn JS toggles.**
`assets/*.js` adds and removes classes that only `base.css` defines: `hidden` relying on `!important` (product-form, facets, quick-add, quick-order-list, share, search-form, localization-form…), `overflow-hidden-mobile`, `overflow-hidden-tablet`, `focused`, `scroll-trigger--offscreen` and others. Deleting `base.css` silently removes those styles. Two examples: the localization panel's mobile scroll lock, and JS-hidden elements whose `{% stylesheet %}`/`<style>` display rule is unlayered or in `components`. The §12 grep only covers CSS file references. Fix: add "every class name that `assets/*.js` adds, removes or toggles and that `base.css` defines has a replacement, or its JS is gone" to the T5 precondition, or give T5 an addendum. Its blast radius (60 files, every page) arguably warrants one anyway.

**F12 — REQUIRED (small). The bug report goes stale after T0, and the owner's "don't fix yet" deserves an explicit acknowledgement.**
E1 changes the measured numbers in `docs/bugs/mobile-horizontal-overflow.md`. The close icon hides, so the toggle loses about 32px. The plan routes the re-measurements only to the T0 QA report (Risk 17). That bug file is a permanent register that the eventual investigator will read. Fix: after the T0 deploy, append a dated note under "Actual behavior" pointing to the re-measured table. Also reword Q2 so the owner explicitly accepts E1. As written, Q2 only informs them that T0 will hide the icon, which partly does what they said to hold off on. It's unavoidable (only a deliberate shim could preserve the bug), but it should be accepted, not just disclosed.

### Scaling, performance, security

**N1 — NIT. `stylesheet_tag: preload: true` is redundant, and R6 shouldn't codify it.** Shopify's docs say it already sends Early Hints for render-blocking `<head>` stylesheets, advise *not* to preload them, and cap preload Link headers at 10, with image preloads dropped first. Keeping it for parity with `critical.css` is harmless today: T1's heading-font preload brings the count to about 3 hints, plus the roadmap hero's image preload. But R6 turns it into a permanent rule. Suggest dropping the `preload: true` requirement from R6 (and optionally from the layouts), and correcting D12's "keeps the early-hint behavior" rationale.

**N2 — NIT. Layer precedence is reversed for `!important`.** D4's "every unlayered rule beats it [legacy]" holds for normal declarations only. For `!important`, `legacy` now beats unlayered. I searched every `!important` in `assets/`, `sections/` and `snippets/` and found no pair where an unlayered `!important` fights a `base.css` `!important` on the same element and property (`section-main-product.css` isn't loaded), so I expect no behavior change. It's a text fix. D11's `.hidden` reasoning is correct.

**N3 — NIT. No prefix plus plain-text scanning generates utilities from incidental words.** `container` (e.g. the `material-spotlight.liquid:8` comment), `fixed` (a schema option value in `image-banner`), `table`, `border` and similar will be generated and will apply to app-embed and merchant `custom_liquid` markup that happens to use those classes. C0.13 is the right gate. Optionally, `@source not inline("container")` for utilities the theme will never use.

**N4 — NIT. Supply chain and portability.** The pins and lockfile are good. `@tailwindcss/oxide` and `lightningcss` rely on platform-specific optional dependencies, and npm lockfiles made on one OS have a history of `npm ci` failing on another. All agents run on this Mac, so the risk is low; record it in the impl notes. `npm ci --ignore-scripts` is worth trying, since neither package should need install scripts.

### Testability and observability

The criteria are well built. Covered above: F5 (the dump can't see what Preflight changes), F6 (`B_rb` can't go red), F9 (C1.5 can't see assigned class strings). One more:

**N5 — NIT.** On `/password`, E3 plus E5 turn the submit button into bare text (transparent, no border, no padding). It still works and C0.11 passes, but QA uses that page daily. Either add a parity rule or name it in E5.

### Hidden coupling and breaking changes

- **Cart hook (§8.3):** confirmed complete. Three selectors in `cart-drawer.liquid`; `renderContents`/`updateCart` replace the link's `innerHTML`, so the badge's `hidden` attribute plus Preflight's `[hidden]` rule keeps working. C1.3 covers it.
- **E1/E2 mechanics:** confirmed. `.header__icon span` (0,1,1, legacy) loses to the unlayered `.theme-evolution-header-menu__icon--close`. `.section-header.shopify-section-group-header-group { z-index: 3 }` loses to the unlayered `z-index: 10`. Nothing on the site uses a z-index between 3 and 10 that it would newly cover: `eco-tooltip.css` is 9999 and the cart drawer is 1000.
- **Moving `critical.css` into `base`:** it now loses to every conflicting `base.css` rule regardless of specificity. I found only one rule that flips (`base.css:351-356`, `h6` margins beating `:is(…):first-child`), which is negligible. The plan doesn't mention this class of flip; worth one sentence in D4.
- **N6 — NIT.** D13 should say the long-lived staging theme is **never published**. It carries the repo's `settings_data.json`, so publishing it would repeat the 2026-10-22 settings overwrite. `CLAUDE.md`'s DevOps "Publish… the unpublished theme" bullet makes that path look legitimate.
- **N7 — NIT.** `R8` and `R11` name `bg-accent`, `text-accent-foreground` and `font-heading`, which don't exist until T1. Mark them "(added in T1)" so nothing written between T0 and T1 relies on them.
- **N8 — NIT.** `docs/plans/theme-evolution-homepage-phases.md:343` still prescribes `color-{{ setting }}` classes, and the roadmap lists `color_scheme` settings. Both conflict with R8 and Q5. D14 puts the "Tailwind-native" requirement only in this plan. Add a one-line pointer under the roadmap's Standing Coder directives, so the hero Architect sees it where they start. The existing directives (social URL seeding, `text`/`richtext` defaults) are compatible with this plan. The sequencing (T0 → T1 → hero and featured products in parallel with T2, deploys serialized) works.
- **N9 — NIT.** In T2, `snippets/card-product.liquid` also renders on collection and search pages, so T2's "Product" scope understates the pages to QA. The addendum should include them.
- **N10 — NIT.** Worth one line in R8: never put a merchant-controlled token in `@theme inline`. Inlining would bake the literal default into utilities and break editor live updates. The plan does this correctly for colors (plain `@theme`); a future editor might not.
- **N11 — NIT, pre-existing, out of scope.** The `shopify.theme.toml:4` comment ("live pushes must name the theme explicitly (`--theme=<id> --allow-live`)") contradicts `CLAUDE.md:21`. The plan leaves the file alone, so that's fine here; flag it for a separate cleanup.

### Alternatives the Architect didn't consider

- **For F9:** instead of relying on the guard alone, a T0 shim could neutralize the `hidden` collision structurally. One option is narrowing Dawn's selector in place (`.hidden:not([class*=":"])`) during the same two-line `base.css` edit. That's hacky, and the plan's "no other change" to `base.css` is defensible. The ban plus a corrected guard is acceptable; I mention this so the trade-off is on record.
- **For F5:** wrapping Preflight in `:where(…)` scoping isn't an option under the owner's "Preflight on" decision. That leaves parity rules or expected diffs, as stated.
- The `@import … layer()` and bundle-`base.css` alternatives were rightly rejected. Browsers don't support a `layer` attribute on `<link>`, so the in-place wrap is the only workable option for a Shopify asset. C0.3 checks the file as served, which also covers any Shopify CDN minification.

---

## Open questions (§20)

| Q | Blocks | Recommendation sound? |
|---|---|---|
| Q1 Staging theme | **T0.** §14's `devops.md` text, applied in T0 Step 8, hard-codes #187953643616, and T0's own deploy needs a target | Agree, plus N6 (never publish it). The role check in §14 is a good guard |
| Q2 44px icons | T1 (the mapping). Not T0 | Agree. Reword to also ask for explicit acceptance of E1 (F12) |
| Q3 `image-banner` in place | Can wait (T3) | Agree. Note its schema already has a `color_scheme` setting with no scheme group (`image-banner.liquid:328`); keep it as a documented no-op, like material spotlight's |
| Q4 Breakpoints | T1. It also determines one sentence of R8 written in T0 Step 8 | Agree with the defaults: the 18px mismatch band ends at T5, and changing the breakpoint later would touch every converted file. Answer before T0 to avoid editing `CLAUDE.md` twice |
| Q5 Color schemes | Can wait for T-phases; blocks roadmap Phase 2 planning | Agree. Adding a scheme group would require seeding `settings_data.json` |
| Q6 Addenda | Can wait (T2 planning) | Agree. Consider one for T5 as well (F11) |
| Q7 Typography plugin | Can wait (T4) | Agree. Check `prose` output against the 60,000/12,000 budget in the T4 addendum |
| Q8 New global settings | T1. Also determines the token list in R8 (N7) | Agree. No `settings_data.json` seeding is needed: Shopify falls back to the schema default for keys missing from `current`, and `font_picker` requires a `default`, which the plan gives |

---

## Verified facts versus unverified claims

| Claim | Status | How |
|---|---|---|
| Unlayered beats layered for normal declarations regardless of specificity | **Verified** (CSS Cascade 5) | Spec knowledge. For `!important` the order reverses (N2) |
| An unresolved `var()` declaration still wins the cascade and computes as `unset` | **Verified** | Spec; consistent with the `h1` analysis in D11 and with the measured bug |
| Proposed layer order and inline statement placement | **Sound**, subject to F4 | Mechanism review; C0.2-C0.5 are two-sided |
| `base.css` can be wrapped in place | **Verified** | No `@charset`/`@import`; keyframes and media queries are legal inside `@layer`; C0.3 checks the served file |
| `{% stylesheet %}` concatenated into `styles.css`, linked from `content_for_header`, subset per render tree; allowed in sections, blocks and snippets | **Verified** | Shopify Dev MCP docs |
| `{% stylesheet %}` keeps `@layer` | **Unverified anywhere** | Undocumented; the T0 Step 6 spike is right, but R8 must follow its result (F8) |
| Shopify auto-preloads render-blocking `<head>` stylesheets; at most 10 preload Link headers | **Verified** | Shopify Dev MCP docs (N1) |
| `font_picker` requires `default` | **Verified** | Shopify Dev MCP docs |
| `oswald_n7` exists | Unverified by me | The MCP search didn't return the list |
| Color settings in `{% style %}` update live; section settings re-render | Verified (`CLAUDE.md`'s quoted Shopify text) | — |
| New global settings need no `settings_data.json` seeding | **Verified** (platform behavior) | Schema defaults apply to missing keys |
| Tailwind 4.3.3 latest (2026-07-16); Tailwind joins Shopify (2026-09-09) | **Unverified**, after my cutoff | Step 1's `npm view` is the right check |
| `@tailwindcss/cli`, CSS-first config, `source(none)`, `@source`/`@source not`/`inline()`, `bg-(--x)`, `--watch=always` | Consistent with my knowledge, unverified this session | Steps 1-2 confirm locally |
| `.liquid` files scanned as plain text, including schema JSON | Consistent with my knowledge | C0.4's precondition (the `.grid` utility being generated from `related-products.liquid`) proves it at build time |
| Browser floor Chrome 111 / Safari 16.4 / Firefox 128 | Consistent with my knowledge | — |
| Preflight details | Mostly consistent; **`html { line-height: 1.5 }` and the global `a` reset are missing from the plan's analysis** (F5) | Step 2 reads `preflight.css` |
| v4 output declares only `theme, base, components, utilities` | **Doubtful** (possible `properties` layer, F4) | Step 3 must check |
| Live push stays `-e production`; no theme ID added to the default environment; no `--theme=<live-id>` push | **Verified** | §5, §13, §14 read in full. The only `--theme=` pushes are to unpublished #187953643616 (role-checked) and the pre-existing file-level rollback exception |
| `.shopifyignore`/`.gitignore` consistency | **Verified** | `node_modules/` git-ignored; `src/`, `package*.json` added to `.shopifyignore`; `assets/tailwind.css` tracked and uploaded |

---

## Trajectory

This is round 1, so there's no trajectory yet. The design is right, and the defects are concentrated in evidence instruments (F5, F6, F9), one inventory miss (F1) and rules text (F3, F7, F8). If Revision 2 folds in the changes below, I expect the next round to be short.

## Required changes

1. **(F1, BLOCKER)** Add `templates/gift_card.liquid` to §4.1, §4.2, §7.1 and §7.5 (layer `<style>` first in `<head>`; `critical.css` replaced by `tailwind.css` with the same tag). Add it to the expected-diff list, and give it a test: extend C0.7, or add a static `rg` check if no gift card URL is available.
2. **(F2)** Change Step 4's check to match the asset reference (`rg -n "'critical.css'" layout sections snippets blocks templates`), so the comment at `footer.liquid:130` doesn't fail it.
3. **(F3)** Change `check:css` to compare against the index (`git ls-files --error-unmatch assets/tailwind.css && git diff --exit-code -- assets/tailwind.css`). Rewrite R3 as "`npm run build:css`, stage, then `npm run check:css`". Remove the byte-identical-watch-output claim.
4. **(F4)** Make Step 3 a gate: every layer name the compiled CSS declares must appear in the inline statement in Tailwind's order. Update C0.2's expected list, the §7.3 comment and R8 accordingly.
5. **(F5)** Add the missing Preflight effects to the expected-diff list (site-wide line-height 1.5, site-wide link color and decoration, form-control radius and background, iframe/embed block, table collapse, placeholder, `h6`) or add D6 parity rules for them, and widen the Step 0/7 computed-style dump to the properties listed in F5.
6. **(F6)** Fix the `B_rb` filter (`initiatorType === 'link'` and the URL pathname ending in `.css`), and state what a budget breach means (owner sign-off), or derive the ratio after Step 0.
7. **(F7)** In R11's Text example, keep the existing `text--title`/`text--subtitle`/`text--normal` values and default, and map them in the `case`.
8. **(F8)** Make R8's `{% stylesheet %}` bullet depend on the Step 6 result (give the `<style>@layer components{…}</style>` alternative), and limit "MUST sit inside `@layer components`" to new CSS and files being converted.
9. **(F9)** Widen the R3 guard to any single- or double-quoted string and to `templates/`. Add `small-hide`, `medium-hide`, `large-up-hide` and `visually-hidden` to R8's list of Dawn classes not to put on Tailwind markup.
10. **(F10)** Correct the T1 Δ rows: copyright +0.4px; `text-xs`/`text-sm` line-height changes; shop-name fallback 16 → 24px and uppercase; badge `px-1.5`.
11. **(F11)** Add a JS-toggled-class audit to T5's precondition, or require a T5 addendum.
12. **(F12)** Have T0 append a dated pointer to `docs/bugs/mobile-horizontal-overflow.md` after deploy. Reword Q2 so the owner explicitly accepts E1.
13. **(Q1)** Mark Q1 as blocking T0, and Q4/Q8 as affecting the R8 text written in T0 Step 8.

APPROVE WITH CHANGES

---

## Round 2

Reviewer: Plan-Reviewer
Date: 2026-10-22
Revision under review: 2

Rules re-read this pass: `CLAUDE.md` (whole of lines 1-100 plus heading anchors), `AGENTS.md` (anchors and lines 14-77), `.claude/agents/devops.md` (whole), `shopify.theme.toml`, `.shopifyignore`, `.theme-check.yml`. `learn_shopify_api` (liquid) was called once. I had no shell this session, so I didn't execute either script; I traced both by hand against the C0.18 and C0.19 probes. The owner's 2026-10-22 decisions are treated as final and not re-opened.

### Summary

Revision 2 resolves every round-1 item. The F1 blocker is fixed throughout: inventory, edits, expected diff, a static check, and the new layer gate, which also fails `check:css` if the gift card statement is missing. Both substituted mechanisms (F6, F9) are better than what I suggested. F6 has one scope narrowing, which only starts to matter in T2. The new material (layer-gate script, line-height parity, E7-E14 with fallbacks, the conditional R8 bullets, the single T0 commit, the T5 addendum, the staging rename, Q9) adds no correctness or safety problem for T0 or T1. I found one carry-forward for the T2 addendum and seven nits. None of them needs a Revision 3.

### Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**
- `templates/gift_card.liquid` 1, 5-25, 6, 7, 9-10, 15-22, 19-21, 24, 56 and 61 match §4.1, §7.5 and E14.
- `layout/password.liquid` 7-8.
- A `stylesheet_tag` sweep of `layout`, `sections`, `blocks`, `snippets` and `templates` returns exactly the three `critical.css` tags, `base.css`/`eco-tooltip.css` at `theme.liquid:22-23`, and the section/snippet tags listed in §4.2.
- `<table|iframe|h6>` in theme Liquid: only `sections/cart.liquid:13`, which confirms E11, E12 and E13. This settles the F5 table referent in the Architect's favour; my round-1 citation of `specs-table` was wrong.
- The C0.19 green-half precondition: I re-ran my own search for any line that has both `hidden` and a `x:display` token in the five scanned folders. No matches.
- No `scripts/` directory exists yet. `templates/` holds only `gift_card.liquid` and `product.api.liquid`.
- All §13 anchors in `CLAUDE.md` (5, 21, 30, 54, 59, 67, 77-82, 95, 166, 181, 190, 220, 299) and `AGENTS.md` (5, 21, 50, 55, 62, 70-77, 90, 161, 176, 185, 215, 294, 1284).
- `devops.md` 16-25, 56-60, 112 and 136-140.
- The four F10 rows.

**Taken on trust (not re-read this round):** the other T1 Δ arithmetic in §8.3/§8.4, `base.css` 198-208 and 430-446, `blocks/text.liquid:44-48` (sampled in round 1), `image-banner.liquid` 126/328-329, `related-products.liquid:140`, the E3 claim about the menu toggle's background, and all orchestrator measurements (Tailwind 4.3.3 layer output, Preflight rules, CLI 4.8.5 `theme rename` flags).

**Not covered by the manifest, reviewed in full:**
- Both scripts in §7.2a. I traced the regexes against Tailwind's minified layer forms and against the four probe lines.
- The specificity of every E7-E13 fallback against the Preflight rule it has to beat.
- Who executes Step 10.

### Round-1 items: status

| Item | Status | Evidence |
|---|---|---|
| F1 (BLOCKER) gift card | **Resolved** | Gift card is now in §4.1, §4.2, D5, §7.1 and §7.5 (statement before line 6; lines 9-10 replaced), with E14 and C0.7(b). E14 is right: the template's `main img { display: unset }` comes from an unlayered `{% style %}`, so it beats Preflight's `img { display: block }`. `FILES_WITH_LAYER_STATEMENT` lists the file, so forgetting the statement fails `check:css` even without a gift card URL |
| F2 comment grep | **Resolved** | Step 4 and C0.7(b) both use the quoted `'critical.css'` form, which matches only the three tags |
| F3 `check:css` vs HEAD | **Resolved** | §7.2 diffs against the index. R1, R3, R5, §14 gate 5 and C0.1 are consistent with it. The watcher claim is replaced by "never commit watcher output" (D2, R3) |
| F4 layer list | **Resolved, better than suggested** | The statement is identical in D4, §7.3, §7.5, `EXPECTED_LAYERS`, R8, C0.2 and (shortened) §12. A permanent gate is stronger than a one-off Step 3 reading. The regex `/@layer\s+([^;{]+)[;{]/g` handles `@layer properties;`, `@layer theme,base,components,utilities;` and `@layer properties{@supports…`. All four C0.18 runs are two-sided, and the gate separates the Revision 2 statement from the Revision 1 one |
| F5 Preflight effects | **Resolved** | Line-height uses a parity rule with C0.17. That's two-sided: the `html` rule has the same specificity as Preflight's `html` match and comes later in the same layer, so it wins, and a missing rule computes `24px`. E7-E13 each have a fallback. The Step 0 dump now covers every property I listed. One fallback is defective (R2-N3) |
| F6 `B_rb` filter | **Resolved by a variant; mechanism is better** | Matching DOM `href`s copes with Early Hints. The no-entry and zero-size validity rules make the method two-sided, and a breach means owner sign-off, as asked. The scope narrowed from "all stylesheet links" to `<head>` only, which matters from T2 (CF1) |
| F7 R11 Text values | **Resolved** | `text--title`/`text--subtitle`/`text--normal`, default `text--title`, mapped in the `case` |
| F8 R8 before spike | **Resolved** | Two pre-written bullets, with Step 8 writing only one. §8.3 has both forms. The MUST is scoped to new CSS and files being converted, and the D11 row agrees |
| F9 hidden guard | **Resolved by a variant; better** | Traced: probe lines 1-3 each give one quoted string that matches both `BARE_HIDDEN` and `VARIANT_DISPLAY`. Line 4's `hidden` is preceded by `:`, so it's excluded. That's exactly 3 findings, as C0.19 states. `templates` is scanned. The ban list now includes `small-hide`, `medium-hide`, `large-up-hide` and `visually-hidden`. `capture` is banned. Residual gap: multi-line strings (R2-N4) |
| F10 Δ rows | **Resolved** | Copyright +0.4px; `text-xs`/`text-sm` line-heights stated per row; shop name 16 → 24px and uppercase; badge 6.4 → 6px |
| F11 T5 JS classes | **Resolved** | §12 adds precondition 3, and T5 now needs an addendum (§6) |
| F12 bug register | **Resolved** (two nits on the Step 10 note: R2-N1, R2-N2) | Step 10 and D9 cover the register; Q2 records explicit acceptance |
| RC13 Q1/Q4/Q8 | **Resolved** | All eight questions were answered before T0 (§20.1) |

The N1-N11 dispositions are acceptable. N8 (not editing the roadmap plan) and N11 (the toml comment) are legitimately out of this plan's brief and were flagged to the operator.

### New in Revision 2: findings

**CF1 — REQUIRED in the T2 addendum (carry-forward). Doesn't block T0 or T1; no Revision 3 needed.** `B_rb` measures the wrong set from T2 onward.

§0 and C0.10 count only `link[rel="stylesheet"]` in `<head>`. The changelog's F6 row says "in the DOM", which is an internal mismatch. The Dawn files that conversions remove are section-level `stylesheet_tag`s, and those render in the **body**:
- `sections/related-products.liquid` 1-3 and 6
- `sections/image-banner.liquid:8`
- `snippets/card-product.liquid` 33-38 (confirmed by grep)

So D12's "each conversion removes the Dawn files it used, so `B_rb` falls phase by phase" is false under the §0 definition. Head-only `B_rb` can only grow through T1-T4: `tailwind.css` grows, and only `eco-tooltip.css` leaves the head, in T2. Every correct phase is then likely to breach 1.15× and go to sign-off. Worse, a conversion that forgets to delete a Dawn `stylesheet_tag` is invisible to C0.10.

This has no effect in T0 or T1, because neither phase adds or removes a body-level stylesheet (the header and footer have none). The fix belongs in the T2 addendum, or can be made opportunistically now. Either:
- count every `link[rel="stylesheet"]` in the document and adjust C0.10's validity count; or
- keep head-only, delete the D12 sentence, and add a per-addendum check that no converted file still renders a Dawn `stylesheet_tag`.

**R2-N1 — NIT, but apply it when Step 10 runs: it goes into a permanent register.** The Step 10 note says "The header half is resolved in T1, the banner half in T3". It's appended after T0, before T1 exists, so a later reader can take it as already done. Write "will be resolved in T1 … in T3 (`docs/plans/theme-evolution-tailwind.md` D9)". This needs no plan revision; whoever writes the note makes the change.

**R2-N2 — NIT. Step 10 has no owner in the DevOps agent's instructions, and §14 step 3 contradicts the exception.**
- Step 10 sits in the Coder checklist (§18) and says "DevOps, or the operator". §14 adds nothing about it to `devops.md`, and `devops.md`'s audit-trail list (line 112) derives `docs/bugs/<base-slug>.md`, i.e. `theme-evolution-tailwind-t0.md`, not `mobile-horizontal-overflow.md`. Add one line to §14 item 2 ("T0 only: append the Step 10 note to `docs/bugs/mobile-horizontal-overflow.md` and include it in the audit commit"), or have the orchestrator do it.
- §14 item 3 says "the commands themselves don't change", but item 2's exception replaces the staging command for these slugs. Add "(for `theme-evolution-tailwind-*`, use the command in Choose the target)" to step 3 so the two can't be read against each other.

**R2-N3 — NIT. E11's fallback can't win.** `:where(iframe, embed, object, audio) { display: inline; }` has zero specificity. Preflight's `img, svg, video, canvas, audio, iframe, embed, object { display: block; … }` has (0,0,1) and sits in the same `base` layer, so Preflight still wins. Separately, `audio` set to inline would override the UA's `audio:not([controls]) { display: none }`. Use `iframe, embed, object { display: inline; }`. This only bites if the owner rejects E11, and the Step 7 re-run would show the diff persisting. I checked the other fallbacks and they all win:
- E7's `a:not([class])` is (0,1,1).
- E8, E9, E10, E12 and E13 match Preflight's specificity and come later in the same layer.

**R2-N4 — NIT. The hidden guard is single-line; R8 doesn't say so.** `QUOTED_STRING` excludes `\n`, so a `class="…"` attribute wrapped across lines isn't checked. §7.2a's limits note says this, but R8's bullet only says "one quoted string". Make it "one quoted string on one line" so the rule matches what C1.5 can see.

**R2-N5 — NIT. Cross-origin `<head>` stylesheets make C0.10 permanently "invalid".** An app-embed stylesheet in `<head>` served from `cdn.shopify.com` without `Timing-Allow-Origin` reports `encodedBodySize === 0`. Under the current rule, the whole measurement then becomes unevaluable on every run. Suggest excluding cross-origin entries from the sum and listing them, and calling the measurement invalid only when a same-origin theme asset is missing or zero. This sits inside a step that already has a defined outcome (report it), so it's low priority.

**R2-N6 — NIT. Step 6 should record where the bundle came from.** The spike runs under `shopify theme dev`. Record in the impl notes that the inspected CSS was Shopify's served `compiled_assets/styles.css` on a fresh load, not a CLI hot-reload injection. If result A is wrongly recorded, the T1 sticky rule lands unlayered and still works; only R8's text would be wrong.

**R2-N7 — NIT, stale but conservative.** §21 still lists `shopify theme rename` as "from memory". The orchestrator confirmed it in CLI 4.8.5 (`-t`/`-n`/`-e`/`-s`), which matches §14's flags. R1 says "Node 20+" while `engines` says `>=20.1`. That's harmless, because every scanned folder is flat, so even a Node that ignores `recursive` finds every file.

### New material checked and found sound

- **`check-css-layers.mjs`:** the expected tag is byte-identical to the §7.5 statement. It reads working-tree files, which equal the index on the clean trees where QA and DevOps run it.
- **Step 3 / Step 4 ordering:** the documented "fails until Step 4" ordering is honest.
- **Single T0 commit:** the justification is true (a tooling-only commit can't pass the gate), and `CLAUDE.md`'s "one section per commit *when possible*" allows it.
- **Line-height parity:** the T5 removal is wired through §12, and §17.4 limits C0.17 to T1-T4.
- **T5 steps:** they update all five places the layer list lives, delete `check:hidden` and its `check` entry, and require the addendum.
- **Staging:**
  - The rename flags match the CLI.
  - The name `theme-evolution-tailwind-staging` collides with no phase's `<slug>-staging`. It does equal the umbrella slug's, where the default `devops.md` rule would stop, which is the safe direction.
  - "Never publish" appears in both R5 and §14, next to the `CLAUDE.md` Publish bullet it carves out.
  - No theme ID is added to `[environments.default]`, and live stays `-e production`.
- **Ignore files:** `.shopifyignore`/`.theme-check.yml` additions don't conflict with the existing entries or with the `[ignore]` block in `shopify.theme.toml`.
- **Q9:** correctly non-blocking, with a no-replan path for each rejection.
- **Two-sided criteria:**
  - C0.17 separates parity from accepting Preflight's 1.5.
  - C0.18 separates the Revision 2 statement from the Revision 1 statement.
  - C0.19 separates the script from the Revision 1 `class="…"`-only regex.

  So the new criteria test the decisions they were added for.

### Trajectory

Round 1: 1 blocker, 12 required, 11 nits. Round 2: 0 blockers, 0 required plan changes, 1 carry-forward bound to the T2 addendum (no effect on T0/T1), 7 nits, all cheap. The remaining risk for T0 and T1 is low, and what's left is delegated to T0 measurement steps that have defined outcomes. This plan is ready for `/implement` of T0. Fold CF1 into the T2 addendum, and apply R2-N1 when Step 10 runs.

APPROVE
