# Plan review: theme-evolution-tailwind-t5a (Revision 1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `1f2a390`. The plan, T5b and the T5 index are untracked in the working tree.

**Read:**

- The plan, all 896 lines. The T5 index. T5b, only for the split boundary (its §2, its Step 3 deletion list and its `theme.liquid` line reference).
- Umbrella §12 (T5 spec), §17.2 (C0.x), §17.4, and the D6/D11 rows by reference.
- The T4c review (all rounds) and T4c impl notes `:30-49`.
- `CLAUDE.md` and `AGENTS.md` on disk.
- Source files: `layout/theme.liquid`, `layout/password.liquid` and `templates/gift_card.liquid` (grep for statement and comment lines); `src/tailwind.css` and `scripts/check-css-layers.mjs` (in full); `scripts/check-bare-hidden.mjs`; `package.json`; `snippets/css-variables.liquid`; `snippets/card-product.liquid:100-160`; `snippets/spinner.liquid`; `sections/product.liquid:1-160`; `sections/header.liquid` (all); `sections/page.liquid`; `sections/image-banner.liquid:375-477`.
- `assets/base.css`: `:1-919`, `:1180-1389`, `:1800-1829`, `:2308-2352`, `:3098-3207` and `:3498-3517`, plus greps for element selectors, pseudo-elements and `shopify-` selectors.
- `assets/product-form.js:15-114` and `assets/eco-tooltip.js` (all); `assets/global.js:128-187` and `:1128-1287`; a class-mutation grep over all six loaded scripts.
- Greps: every `asset_url`/`stylesheet_tag`/`.css` reference; every `grid` token; every element whose only content is one output tag; the card-fallback variable consumers; every `check:hidden`/`base.css` mention outside `docs/`; the compiled `.hidden{display:none}`, `.w-20`, the `@layer` statements.

Shopify Dev MCP: `learn_shopify_api` (Liquid) once.

## Summary

The architecture is right. It keeps parity in a separate phase from the typography decisions, measures what `base.css` still does instead of reading it, stages the parity edits before the switch as no-ops, switches the statement and the link in one commit with a per-commit check (C5a.6(d)), and gates the budget in both units on a scratch end state. The three preconditions hold up against the files. I re-ran each one and found no missed CSS reference, no unconverted file and no JS-toggled class without a disposition. The cascade reasoning (legacy above base, specificity inside `@layer base`, how `!important` behaves in a lower layer) is correct. The focus-ring analysis is right and honest: today `*:focus { outline: 0 }` wins and Dawn's own ring is invalid, Preflight v4 removes no outline, so option (a) really does give the UA ring, and E5a.1 is ⚑.

The defects are in the **measurement apparatus and its criteria**, which is where this project's failures usually sit:

- **One BLOCKER** (B1). Both positive controls that use `class="hidden"` can never flip, because Tailwind's own `.hidden{display:none}` is compiled. So every `TOG` run and every live probe run is invalid by the plan's own rule, and Step 0 can't finish.
- **Fourteen REQUIRED findings.**
  - Several make Step 0 stop predictably on a correct build: R1, the plan's own PXZ fixture produces entries nothing can classify; R3, `TOG` can't be valid on pages that don't load `base.css`; R4, the entry volume and settle conditions; R6, policy hover.
  - Several are criteria that go red, or can't go red, on the wrong build: R7 C5a.17, R8 C5a.4(c), R9 C5a.11 on PXZ, R10 the owner attribution, R11 C5a.10 displacement, R12 the live probe's path matching.
  - The rest are a missed `:empty` sink (R2), a silent-drop path in `CEN` (R5), the umbrella's console criterion (R13) and owner-facing ⚑ rows (R14).

Every fix is a local edit. None changes the plan's design.

## Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**

- `N_css` = 65 (Glob), and the §3.1 deletion list matches the Glob listing name for name (63 files).
- The 40 Liquid files: 36 in `sections/`, `blocks/` and `snippets/`, plus 2 layouts and 2 templates.
- Precondition 1: the only `.css` references are the three `'tailwind.css'` lines and `layout/theme.liquid:29`. No `.css` string appears in the six loaded scripts. Nothing outside `docs/` (agents, ignore files, scripts, no CI) names a Dawn stylesheet.
- Precondition 3: every class-mutation site in §3.3, re-ground across all six scripts. That includes the `:59` early return in `product-form.js`, `global.js:136-140` (`focusVisiblePolyfill`) and `global.js:1168`.
- Line citations:
  - `layout/theme.liquid:5, 27, 29, 34-37`; `check-css-layers.mjs:7-8`; `package.json:13-14`.
  - `src/tailwind.css:9, 165-172, 231-233, 273-287, 293-295`.
  - `css-variables.liquid:25-26, 29-73`.
  - `CLAUDE.md:12, 60, 103, 179, 202, 203, 209-214` and `AGENTS.md:12, 56, 98, 174, 197, 198, 204-209`.
- `base.css` rule ranges: `:196-198`, `:200-210`, `:252-270`, `:353-371`, `:417-430`, `:470-484`, `:523-525`, `:536-548`, `:653-668`, `:715-724`, `:881-900`, `:1190-1332`, `:1811-1815`, `:2315-2342`, `:3130-3197` and `:3504-3513`. The 15 `!important` lines. The `@media` lines 105, 129, 432, 438 and 444.
- The `grid` audit: 11 elements carry `mb-0`, plus the two header elements. The announcement bar also needs `announcement_text != blank` (`header.liquid:17`), which PXA supplies.
- §5.10 arithmetic: +63 / +262 and +10 / +150; ends 58,429 / 58,628 and 11,114 / 11,254. `S_leak` 48 and 65. `S_tw` 58,366 / 11,104 matches the live deploy note `:13`. The compiled `@layer legacy,components;` and `@layer shims;`.

**Sampled and found wrong:**

- The §3.1 breakdown "40 `component-*` + 16 `section-*` + 2 `template-*` + 5 others". The real split is 38 + 14 + 2 + 9. The total of 63 is right, and the manifest's "Arithmetic" entry checked only the sum (N1).
- §7's "40 Dawn card fallback variables". There are 37 (10 + 10 + 8 + 8 + 1) (N1).
- §0's reading that only the image-banner buttons wrapper can match `:empty` (R2).
- The positive control (B1). It rests on a fact the plan itself records as `[measured]` in §3.2: Tailwind's `.hidden` is compiled.

**Taken on trust:** the T0 `B_rb0` components; the T4c QA figures quoted in §0; Lightning CSS's output forms; the Chromium behaviors the plan marks `[unverified]`; the ranges of `base.css` that neither the plan nor I read line by line (`:1418-1800`, `:1834-2308`, `:2352-3098`). For those, `CEN` is the real proof, which is why R5 matters.

**Not covered by the manifest, so reviewed in full:** the positive controls, the TOG validity conditions against the page list, the classification rule against PXZ's own content, the owner-attribution rule, the C5a.10/C5a.11/C5a.17/C5a.4(c) failure conditions, the live probe's matching rule, and the Dawn `.rte` hover and transition declarations.

## Blocking issues

### B1: BLOCKER (prevents Step 0 from completing). Both `class="hidden"` positive controls can never flip

§4.2 step 3 injects `<div data-t5-ctl class="hidden">x</div>`, and step 8 makes the run **valid only if** that control computes `display: block` with `base.css` disabled. §5.11 steps 5 and 7 do the same on live with `<div class="hidden" data-t5-ctl="1">`.

Tailwind's `.hidden{display:none}` is in `assets/tailwind.css` (grep: 1 hit). It is generated by the `hidden` token at `sections/product.liquid:97`, and the plan records it as compiled in §3.2 and §3.3. With `base.css` disabled, Tailwind's utility still hides the control, so it stays `display: none`.

The result:

- Every `TOG` run is invalid, so Step 0 item 7 ("Every run must be valid") can't finish.
- Every live probe is invalid, so the gate's item 14 and C5a.25 can never pass.

This is a positive control pointed at the wrong referent: it tests "is the element hidden", when the question is "is `base.css`'s rule acting".

**Fix.** Use a control that only `base.css` styles. Options:

- `<div data-t5-ctl></div>`, which is empty. Dawn's `div:empty` gives `none`, and with `base.css` off it computes `block`. Tailwind has no such rule; C5a.21 already guarantees the compiled base has only `p:empty`.
- `<span class="visually-hidden" data-t5-ctl>x</span>`, whose `position` goes from `absolute` to `static`. This one breaks if D5a.7 later adds `.visually-hidden` to `src`, so prefer the empty div.

Keep the `<h6>` control: `margin-top` goes from `1.67em` to `0`, which is correct. Insert the empty div before the `h6` so that `@layer base`'s `:empty:last-child` sibling rules can't touch the `h6`. Apply the same change to §5.11 steps 5 and 7 and to C5a.25's validity text.

## Required changes

### R1: REQUIRED (Step 0 stops on a correct build; owner-facing). PXZ produces entries the classification rule can't close

§4.4 allows class A only for "an E-row in §8 **marked as acceptable**". No E-row carries such a mark; §8 has no column for it. PXZ's bare copy (`ZOO_FIX`) deliberately contains elements whose `TOG` entries fall under no E-row and fail the N test, because their rects change:

- `div`, `a` and `ul` that are `:empty` (`empty-div`, `empty-a`, `empty-ul`) go from `display: none` to visible. The `data-t5-zoo="gap"` test, whose middle `<div></div>` adds a 16 px gap, was built to show exactly this.
- The bare `summary` loses Dawn's `list-style: none`, so its marker reappears (`base.css:653-657`).
- `table:not([class])` loses `font-size: 1.4rem` (22.4 px at the 16 px root) and `table-layout: fixed` outside `prose` (`:417-424`). §3.4 row 13 lists both, but E5a.6 names only the cell padding and `border-style`.

Under §4.4 each of these is "unexplained", so Step 0 stops on the plan's own fixture.

These are also real merchant-visible changes. Empty elements in `page.content`, `article.content` or a policy body start rendering, including empty headings. Inside `prose` the plugin's heading margins apply to an empty `h2`.

The plan rejected a *global* `:empty` port because of umbrella D11. It didn't consider a rule scoped to merchant HTML, such as `[data-rich-text] :where(div, a, ul, dl, section, article, h1, h2, h3, h4, h5, h6):empty { display: none }` in `@layer base` (about 100 B). D11's argument (intentionally empty theme bars and spacers) doesn't apply to merchant HTML.

**Fix.**

- Define "acceptable": add an "A allowed" column to §8.
- Widen E5a.6 to cover table `font-size`/`table-layout` and the bare `summary` marker.
- Add a ⚑ row for `:empty` in merchant and Shopify HTML. Pair it with an owner question: accept, or the scoped rule, with its bytes counted in §5.10.
- Cursor-only entries (`a:not([href])`, `summary { cursor }`) and `summary { position: relative }` stay N, as the plan says.

### R2: REQUIRED. A theme `:empty` sink that no fixture renders

§0's "Readings" bullet, §5.5 and §16's correction all conclude that only the image-banner buttons wrapper can match `:empty`. But `snippets/card-product.liquid:142` is

```liquid
<div class="text-[0.625rem] tracking-[0.08125rem] uppercase opacity-70">{{ card_product.vendor }}</div>
```

It has no whitespace, sits inside a `flex flex-col gap-[0.4375rem]` (`:139`), and is guarded only by `show_vendor`, not by `vendor != blank`. With `show_vendor` on (a `related-products` setting, default `false`) and a product with a blank vendor, Dawn's `div:empty` hides it today. After T5a it adds a 7 px gap.

No fixture turns `show_vendor` on (`templates/product.json:94` is `false`), so `TOG` and `CEN` can't find it, and C5a.9 and C5a.10 can't catch it. I checked the other no-whitespace single-output elements (grep `>{{…}}</tag>`). Each is a `p` (still covered by `p:empty`), is guarded by `!= blank` (`page.liquid:12`, `article.liquid:21`, `blog.liquid:27`, `main-material-archive.liquid:36, 64`, `material-info.liquid:35`), or prints a translation or a title that can't be blank.

**Fix.** Add `empty:hidden` to `card-product.liquid:142` as a predicted M1 item. It costs 0 B once Step 1's banner commit compiles the utility. Alternatively, list the gap as a ⚑ E-row. Correct the §0 and §16 text either way.

### R3: REQUIRED (Step 0 can't finish). `TOG` can't be valid on pages without `base.css`

§4.3 puts `/password` in the page list ("password layout: no `base.css` today") and PXG (`{% layout none %}`) in it too, and says "`TOG` runs S0 on every page". §4.2 step 4 makes a run **invalid** unless exactly one `base.css` link exists. Step 0 item 7 requires every run to be valid.

**Fix.** Run `TOG` and `CEN` only on theme-layout pages. Keep `/password` and PXG in the cross-build sweep and in C5a.5 and C5a.7, where they belong.

### R4: REQUIRED (testability). `TOG` entry volume and settle conditions

**Custom properties.** Chromium's computed-style iteration includes custom properties; Firefox's doesn't. Confirm this in Step 0. `base.css` defines about 19 inherited `:root` custom properties (`:3-11`, `:581-593`: `--alpha-*`, `--focused-base-*`, `--duration-*`, `--ease-out-slow`, `--animation-*`). Toggling the sheet therefore changes about 19 properties on **every element**: thousands of entries per page. Each would need P, A or N, and N demands per-element rect and screenshot-crop evidence.

**Derived values.** `getComputedStyle` returns resolved used values for `width`, `height`, `inline-size`, `block-size`, `perspective-origin`, `transform-origin` and others. One margin change produces derived entries on every ancestor and on the following content. The rule "each entry gets exactly one class" gives no way to group them under their cause.

**Settle.** `D3 = D1` is exact. A lazy image or a font swap between the snapshots, or `product-recommendations` loading because the toggle moved it into its IntersectionObserver margin (`global.js:1141-1148`), makes the run invalid every time on some pages. §4.2 has no settle step beyond `load`, the recommendations `li` and 1 s.

**Fix.**

- (a) Class N by static evidence for any custom property that only `base.css` defines and that nothing outside `base.css` consumes. §3.4 row 20's ripgrep already proves this; record it once per property, not per element.
- (b) Classify derived resolved-value entries under the root-cause entry that explains them.
- (c) Before `D1`: `await document.fonts.ready`, set every `img` to `loading="eager"` and `await img.decode()`, scroll to the bottom and back, then wait.

### R5: REQUIRED (vacuous census). `CEN` silently drops selectors it can't parse after stripping

§4.2 strips state pseudo-classes "then `document.querySelectorAll()` inside a `try`". Stripping inside a functional pseudo-class produces an invalid selector. For example, `.button:focus:not(:focus-visible):not(.focused)` (`base.css:1290-1291`) becomes `.button:not():not(.focused)`, which throws. The plan doesn't say what a throw records, so the natural implementation logs nothing, and the rule drops out of the census. That is a vacuous pass for exactly the rules `CEN` exists to see: hover and focus states that `TOG` can't.

**Fix.** Replace each stripped state pseudo-class with `:is(*)`, or strip only outside functional pseudos. Record every selector that still throws as "unparsed" with its rule index, for manual classification. Assert the unparsed count in the evidence, and never count one as zero matches.

### R6: REQUIRED (Step 0 stops; the parity claim is false). Policy-link hover and transition

D5a.6 says the policy pages will "look exactly as today". Dawn's `.rte` also has:

- `.rte a:hover { text-decoration-thickness: 0.2rem }` (`:3186-3189`). The color is invalid but the thickness is valid: 3.2 px on hover.
- `.rte a { transition: text-decoration-thickness var(--duration-short) ease }` (`:3183`). This is valid, because `base.css` defines `--duration-short: 100ms` at `:582`.

RA1's hover pass will find the 3.2 → 1.6 px change on the policy links. No M3 rule covers it, so Step 0 stops. The transition itself has no static effect, so it is N.

**Fix.** Either add `.shopify-policy__body a:hover { text-decoration-thickness: 0.2rem; }` to §5.3's M3 block (about +50 B; update §5.10) or make it an A row with an owner answer. **Coupling:** T5b's Step 3 deletion list (`t5b.md:184`) names the policy rules to delete under Q5b.3 (b), so a new hover rule has to be added there too.

### R7: REQUIRED (criterion can't go red). C5a.17's fixture doesn't test min-content

PXZ's fixture is `<div class="flex"><h2 class="w-20">Supercalifragilisticexpialidocious12345</h2></div>`. With `w-20` the `h2` has a definite 80 px width. Its flex `min-width: auto` is at most that specified size, so the box never grows past 80 px. `overflow-wrap: break-word`, already in `@layer base` at `:221-229`, breaks the word inside its line box anyway. So the heading's right edge is always within its parent, and C5a.17 is green on a build **without** D5a.5. The criterion can't tell the build with the rule from the build without it.

**Fix.** Use `<div class="flex w-20" data-t5-zoo="longword"><h2>…</h2></div>`, with no width on the `h2`. Without D5a.5 the `h2`'s min-content equals the word's width and its border box overflows the 80 px parent (red). With `word-break: break-word`, which acts as `overflow-wrap: anywhere` for min-content, it fits (green). Both classes are already compiled.

### R8: REQUIRED (criterion red on a correct build). C5a.4(c) greps `src` for `base.css`, and §5.3's own comment contains it

The parity block that §5.3 specifies opens with "What assets/base.css gave markup …". C5a.4(c) runs `rg -n 'base\.css' … src …` and expects no output. The rest of the end state does pass: Step 5 removes `:166`, and the replacement policy comment names `.rte`, not `base.css`.

**Fix.** Reword the comment ("What Dawn's stylesheet gave …") or exclude that line from C5a.4(c).

### R9: REQUIRED (criterion can't be valid on a correct build). C5a.11's sequence check on PXZ

C5a.11 runs "on every page in §4.3", which includes PXZ. It is invalid unless head's focus sequence has base's length. PXZ's `<a href="#e" data-t5-zoo="empty-a"></a>` is `display: none` at base (Dawn's `a:empty`), so it isn't focusable there. At head it is focusable. The sequences differ on every correct build.

**Fix.** Exclude PXZ from the focus sweep, or compare the sequences after removing elements whose `TOG` entry is classified A with a display change.

### R10: REQUIRED (criterion red on a correct build). Owner attribution needs a precedence order

§4.2 step 9 calls an element **theme**-owned if it is "inside a `shopify-section-*` wrapper", and lists the privacy widget and the payment button as **Shopify**-owned. Both sit inside section wrappers:

- The widget is inside the page section's `[data-rich-text]` (T4c impl notes `:36`).
- The payment button and `shopify-accelerated-checkout` are inside the product section.

Read literally, they are theme-owned, so C5a.11(a) judges them. T4c measured `outline: none` on the widget's controls, cause unknown (impl notes `:44`). If Shopify's own unlayered CSS sets it, a correct build goes red. The accelerated-checkout host is similar: focus lives in its shadow tree, and `document.activeElement` is the host, whose own `outline-style` is `none`.

**Fix.** The Shopify and app selectors take precedence over the wrapper rule. Name them: the `.pc--show-email-field` subtree, `.shopify-payment-button` and `shopify-accelerated-checkout` (host and descendants), `.shopify-policy__container`, the consent banner root, `[id^="shopify-block-"]` and the app-embed containers. Use the same order in C5a.14 and C5a.25.

### R11: REQUIRED (criterion red on a correct build). C5a.10 doesn't allow downstream displacement

C5a.10 allows only "elements under an A row that says they move (and only by the amount the row states)".

- Under Q5a.2's **recommendation**, E5a.4 shortens the header by 32 px on PXA, so every element below it moves up 32 px. Those elements aren't "under" E5a.4.
- After R1, PXZ's newly visible `:empty` elements shift their following siblings too.

**Fix.** Allow elements after an A-row element, in document order and in the same flow, to be displaced by exactly that row's stated delta (±`G`). Align the screenshot comparison per region accordingly.

### R12: REQUIRED (live gate red on a correct build). The live probe matches by absolute path, against the wrong run

§5.11 step 8 passes only if every difference matches one that Step 0's `TOG` recorded "for the same container **on staging** (same selector path …)". There are two problems:

- `TOG` runs on the private **development** theme (#187953938528, §10), not on staging.
- Paths are `tag:nth-of-type` chains from `html` (§4.2). Live's DOM differs from dev's: there is no preview bar, app embeds and their scripts are injected, and the consent state differs. Absolute indices shift, so every difference inside a container becomes "any other difference" and the probe fails a correct build.

**Fix.** Express paths relative to the container root, plus the container's own selector. Name the reference run correctly: "Step 0's `TOG` on the dev theme". Keep the rule that the property and both values must match.

### R13: REQUIRED (umbrella criterion missing). No console-error criterion

Umbrella §17.4 applies C0.15 ("No new console errors") in every phase. T5a has no criterion for it. T5a deletes 64 assets and changes the head of every page, so add one: the Playwright console log at head against base, on the §4.3 pages at 375 and 1440, with new errors red. It is cheap, and `t5ac-facts` or `t5ac-cmp` can record it.

### R14: REQUIRED (owner-facing ⚑). Two merchant-visible rows aren't ⚑

This is the same failure class as T4c review R7.

- **E5a.6** changes merchant content, and the row understates the change outside `prose`. A bare `hr` today is a transparent 1.6 px bar (`background-color` is invalid, so `unset`) with 80 px or 112 px margins (`:536-548`). After T5a it is a visible 1 px rule with no margins. Bare tables go from 22.4 px to 16 px text (R1). Policy bodies and Shopify markup are where unclassed elements appear.
- **E5a.5.** Dawn's `::selection { background-color: … }` is invalid, so it computes to `unset`, which is the initial `transparent` for a non-inherited property. Today's highlight may well be invisible, and the browser default would replace it.

**Fix.** Mark E5a.6 ⚑, and mark E5a.5 ⚑ if S8 shows a pixel difference. Add both to owner check 3, with the PXZ and S8 crops.

## Nits (none blocks; each is conservative or a clarity fix)

- **N1. Counts.** In §3.1 the split is 38 `component-*` + 14 `section-*` + 2 `template-*` + 9 others; the total of 63 and the file list are right. In §7 there are 37 fallback variables, not 40. D5a.15 says lines 31-72 while §5.7 says 30-72 (30 is the blank line). Fix the text so these numbers don't carry into the impl notes or the QA report. No criterion depends on them.
- **N2.** `.empty\:hidden:empty` has specificity (0,2,0) against `.inline-flex` at (0,1,0), so it wins whatever the source order. The §5.5 `[unverified]` and its stop condition are conservative; you can drop them.
- **N3.** The `B_rb` projection applies T0's 0.91 wire-to-gzip ratio, measured on a 2.8 KB file, to an 11 KB one: a ratio from one artifact applied to another. It is conservative here: even at a ratio of 1.0 the total is about 14,374, under 15,910. No decision rests on it.
- **N4.** `TOG` and the live probe walk `document` only, not open shadow roots. That is acceptable for `shopify-accelerated-checkout`: page CSS reaches a shadow tree only through inherited and custom properties on the host, so a diff on the host is enough. That holds only if custom properties stay in the snapshot (R4 (a) classifies them; it doesn't remove them). State the argument in §3.4 row 17.
- **N5.** C5a.9's validity clause ("at least one entry on `/pages/data-sharing-opt-out` (the checkbox)") is met by the page `h1`'s `word-break` entry alone. Require an entry inside the widget, or an asserted count of widget elements of at least 1.
- **N6.** The consent banner's "Manage preferences" panel, with its checkboxes and headings, isn't one of the states. Add S6b at 375 if the banner offers the panel.
- **N7.** Two stale comments. §5.3 says theme markup keeps `sr-only` per "`CLAUDE.md` Rules text", but Step 8 T7 deletes that text (`CLAUDE.md:211, 214`). Keep one sentence ("use `sr-only`; `.visually-hidden` exists only for Shopify markup") or drop the citation. Also, `src/tailwind.css:64-66` ("Named btn-* because Dawn's .button rules still match") goes stale after T5a; `src` isn't scanned, so updating it costs 0 B.
- **N8.** The matrix runs to well over a thousand page loads. Run `TOG` per width by resizing within one load where the state allows, and pace requests (RA8).
- **N9.** §12 says Steps 6-8 are independent. Reverting Step 3 while Steps 6 and 7 are in is also benign, because the fallback variables are read only by Dawn classes that no markup uses. Say so in the rollback table.

## Answers to the orchestrator's specific questions

- **Preconditions.**
  - The six loaded scripts are exactly the four in `layout/theme.liquid:34-37` and the two in `sections/product.liquid:8-9`. The password and gift layouts load none.
  - Every `classList`, `className`, `innerHTML` and `createElement` site is dispositioned. The `innerHTML` sites insert server-rendered HTML from scanned Liquid (the `material-tooltip` section, related products) or fixed class names.
  - All 64 deleted files are unreferenced by `asset_url`, `stylesheet_tag` or `.css` strings in any Liquid, JSON or JS file, agent file, ignore file or script. There is no CI.
  - The `{% render %}` paths are covered, because every snippet is in `snippets/`, which the grep covered.
  - The only finding is R2, an `:empty` sink that §0 missed.
- **Step 0 method.** The same-page toggle, the reversibility check, a noise set used only for cross-build comparisons, and widths on both sides of 750 and 990 px are the right design. As written:
  - it can't pass at all (B1, R3);
  - it can stall (R4);
  - its census can silently drop rules (R5).
  - Hover is covered by RA1 and focus by the cross-build sweep. `:empty` is covered by computed style. Pseudo-elements are covered for `::before`, `::after`, `::marker` and `::placeholder`; `::selection` only by screenshot (fine). `::-webkit-details-marker` is reached through `summary`'s own `list-style`.
- **Atomic switch and `EXPECTED_LAYERS`.** Correct. C5a.6 (b) and (c) both go red as stated: (b) because the tag no longer matches, (c) because the compiled CSS declares `legacy`. (d) catches a split commit. The rollback order (Step 4 before Step 3, Step 5 before Step 3) is right.
- **Parity rules.**
  - Layer and specificity are right: (0,1,1) beats Preflight's (0,0,1) and (0,0,0) inside `@layer base`.
  - No selector names a Tailwind class.
  - `.visually-hidden`'s `!important` in `base` is CSS `!important`, not Tailwind's `!` modifier. It stays above unlayered CSS exactly as Dawn's did.
  - The `:empty` approach for theme markup is right.
  - The gaps are the policy hover (R6) and the merchant-HTML `:empty` question (R1).
- **Focus rings.** The analysis is correct. Preflight v4 removes no outline, so the UA's `:focus-visible` ring returns. Text inputs also show it on click. The plan says all this, and E5a.1 is ⚑. What remains is attribution (R10) and PXZ in the sweep (R9).
- **`check:hidden` and the rules text.** The removal matches umbrella §12. `check:hidden` has no consumer beyond `package.json`, `CLAUDE.md` and `AGENTS.md`. The card fallbacks have no consumer outside the deleted CSS (grep outside `docs/` and `assets/*.css`: only `css-variables.liquid`). C5a.24(c)'s case-insensitive grep catches T4's "Legacy Dawn CSS files".
- **Budget gate.** Both units, the project's method, measured on the scratch end state, a stop on breach, and the committed file equal to `P_end`: sound. The headroom (about 1,370 / 745 at the high estimate) is real.
- **Live probe, fixtures, owner decisions.**
  - The probe's discovery-on-every-run rule and fresh non-preview session are right. Its controls (B1) and path matching (R12) are not.
  - The proxies never touch the repo's templates, section groups or `settings_data.json`, and the requirement that a proxy copy is never rebuilt and has a byte-identical CSS file is right.
  - I found no reversed owner decision: Q4c.3 (a), Q4c.6 (A), Q4c.7, Q4c.8, Q4 and Q7 are all continued as recorded. The ⚑ list needs E5a.5 and E5a.6 (R14).

## Checked and found sound

- The split boundary. T5b assumes `theme.liquid`'s `content_for_layout` moves from `:45` to `:44` after T5a, which matches §5.1. T5b doesn't reopen Q5a.1. T5a hands over the D6 `html` rule untouched.
- D5a.2's no-op claims for each §5.3 rule while `legacy` loads.
- The spinner: `.loading__spinner hidden absolute inset-0 size-full` has no competing display utility, `size-full` beats Dawn's `width: 1.8rem`, and the paint order without `z-index` holds.
- The `.section-header` stacking (components beats legacy, whatever the specificity), and `.section + .section` resolving to 0.
- D5a.5's reasoning: `word-break: break-word` affects min-content, and `overflow-wrap: break-word` doesn't. Only its fixture is wrong (R7).
- The S7 route pattern matches `routes.cart_add_url`.

## Trajectory

This is round 1. The design is mature. The defects cluster in measurement mechanics that the Architect couldn't run while planning, and each fix is local and small. Once B1 and R1-R14 are folded in, I expect round 2 to be a short confirmation pass.

## Required changes

1. **B1.** Replace both `class="hidden"` positive controls (§4.2 step 3 and 8, §5.11 steps 5 and 7, C5a.25) with an element only `base.css` styles, such as an empty `<div data-t5-ctl></div>`. Keep the `h6` control.
2. **R1.** Add an "A allowed" column to §8. Widen E5a.6 (table `font-size`/`table-layout`, the bare `summary` marker). Add a ⚑ row and an owner question for `:empty` in merchant and Shopify HTML, with the scoped `[data-rich-text] … :empty` alternative and its bytes.
3. **R2.** Add `empty:hidden` to `snippets/card-product.liquid:142`, or a ⚑ E-row for it. Correct §0 "Readings", §5.5 and §16.
4. **R3.** Restrict `TOG` and `CEN` to theme-layout pages. `/password` and PXG stay in the cross-build checks.
5. **R4.** Class N by static evidence for `base.css`-only custom properties with no outside consumer. Group derived resolved-value entries under their root cause. Add a pre-`D1` settle step (fonts, eager-decoded images, scroll pass).
6. **R5.** `CEN`: replace stripped pseudo-classes with `:is(*)`, or strip only outside functional pseudos. Record and count selectors that throw as "unparsed", never as zero matches.
7. **R6.** Add `.shopify-policy__body a:hover { text-decoration-thickness: 0.2rem }` to M3, or make it an A row. Update §5.10 and T5b's Step 3 deletion list.
8. **R7.** Change C5a.17's fixture to `<div class="flex w-20"><h2>…</h2></div>`.
9. **R8.** Reword §5.3's parity-block comment so C5a.4(c) can pass, or exclude it.
10. **R9.** Exclude PXZ from C5a.11's sweep, or compare the sequences without the A-row elements.
11. **R10.** Give the Shopify and app selector list precedence over the section-wrapper rule in owner attribution (`TOG`, C5a.11, C5a.14, C5a.25).
12. **R11.** C5a.10: allow downstream elements to be displaced by an A row's stated delta.
13. **R12.** Live probe: match by container-relative path, and name the reference run "Step 0's `TOG` on the dev theme".
14. **R13.** Add a console-error criterion (umbrella C0.15).
15. **R14.** Mark E5a.6 ⚑ (and E5a.5 if S8 differs). Add both to owner check 3.

APPROVE WITH CHANGES

---

## Round 2 (Revision 2)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `1f2a390`; the plan, T5b and the index are still untracked.

**Read this round:**

- The plan, all 975 lines. The index (Revision 2 rows, budget table, Q5a.5 row). T5b's changelog rows for R6's coupling and its policy-wrapper notes (`:32`, `:37`, `:210`).
- `CLAUDE.md:191-224` on disk.
- Greps for `data-rich-text|richText|rich-text|rich_text` across the repo outside `docs/`, and for `dataset`, `[data-` and `getAttribute` across every `.js` and `.liquid` file.
- A grep of compiled `:empty` selectors in `assets/tailwind.css`; the T4c plan's `data-rich-text` mentions; `base.css` custom-property declarations against theme token names.

### Summary

Revision 2 closes B1 and every round-1 REQUIRED item, R1-R14. Each fix is the one asked for, or a sound equivalent, and I found no regression in the parts the revision didn't touch.

Three REQUIRED items remain, all small:

- **R2-1** is a new defect in the R4 fix. The derived-entry grouping rule doesn't let a size change on an ancestor be explained by a root cause in a descendant, so PXA's header wrapper stops Step 0.
- **R2-2** is a defect that was already in Revision 1 and that I missed in round 1. C5a.21 forbids `:empty` selectors in `@layer base`, but two existing margin rules there contain `:empty`.
- **R2-3** is a validity clause from my N5 that may be unreachable as written.

I also checked the new merchant-HTML `:empty` rule against `CLAUDE.md`. It is consistent with the rules, and the claim that no script reads `data-rich-text` holds. The new budget range is arithmetically right.

### Manifest: what I sampled and what I took on trust (round 2)

**Sampled and confirmed:**

- **§5.10 rule lengths.**
  - Link extension: 28 + 32 = 60.
  - Transition: 1 + 11 + 25 + 4 + 5 = 46.
  - Hover rule: 21 + 8 + 1 + 25 + 1 + 5 + 1 = 62.
  - `[data-rich-text]` rule: 16 + 1 + 7 + 45 + 1 + 6 + 14 = 90; its policy-body twin is 95.
- **§5.10 sums and spare.**
  - Minified: 447 − 151 = +296 and 682 − 126 = +556, ending at 58,662 and 58,922.
  - Gzip: 130 − 60 = +70 and 300 − 35 = +265, ending at 11,174 and 11,369.
  - Spare: 1,078 / 631.
  - `B_rb` at a ratio of 1.0: 11,370 + 1,598 + 1,576 = 14,544.
- **Index budget rows.** T5b: 58,147 / 58,542, 11,004 / 11,269 and 59,002 / 11,419, each consistent with T5a's new range and the deltas T5b states. I didn't re-derive T5b's own deltas.
- **The B1 controls.** No compiled rule other than Dawn's `div:empty` can hide a classless empty `div` that is a direct child of `body` and isn't its last child. The `h6` control still flips.
- **R2 (round 1).** The `card-product.liquid:142` edit, `show_vendor`'s default and its saved value.
- **N1.** 38 + 14 + 2 + 9 = 63, and 37 variables.
- **R8.** The new comment is free of `base.css`, and so are the Step 5 replacements.
- **R4 exclusion safety.** `base.css` declares no custom property named like a theme or Tailwind token (grep: only `--text-alignment`, on Dawn card classes). So excluding custom properties from the snapshots hides nothing observable: any effect would show in a real property, and the shadow-host case is kept.

**Taken on trust:** T5b's own Revision 2 figures; Chromium's enumeration of custom properties (the plan's exclusion makes the result the same either way).

### Status of round-1 items

| Item | Status | Note |
|---|---|---|
| B1 | **closed** | An empty `div` followed by an `h6`, in `TOG` and in the live probe; the order is stated and correct |
| R1 | **closed** | "A allowed?" column; E5a.6 widened; E5a.16 and E5a.17; Q5a.5 with the scoped rule |
| R2 | **closed** | `empty:hidden` on the vendor line; the PXZ copy reads the class string from the build under test, and C5a.12(b) has a precheck |
| R3 | **closed** | Theme-layout pages only, for `TOG` and `CEN` |
| R4 | **closed, with a new defect in the fix** | Custom-property exclusion and settle step: correct. The `SZ` grouping rule is too narrow (R2-1) |
| R5 | **closed** | A functional pseudo-class holding a state pseudo-class is removed whole (widening, so safe); "unparsed" is counted |
| R6 | **closed** | Hover and transition (written as the literal `100ms`); C5a.15 tests the hover; T5b's Step 3 follows |
| R7 | **closed** | The width is on the parent; both directions now hold |
| R8 | **closed** | |
| R9 | **closed** | PXZ excluded; A-row display changes dropped from both sequences |
| R10 | **closed** | Precedence order stated and applied to `TOG`, C5a.11, C5a.14 and C5a.25 |
| R11 | **closed** | Downstream displacement by the measured delta |
| R12 | **closed** | Container-relative paths; the reference run is named correctly (N2-2 is a recording detail) |
| R13 | **closed** | C5a.26, with base errors subtracted |
| R14 | **closed** | E5a.6 ⚑, E5a.5 ⚑ if S8 differs; both in owner check 3 |
| N1-N9 | **applied** | N5 as written can be unreachable (R2-3) |

### The `data-rich-text` question

The coordinator asked whether making `data-rich-text` a styling attribute is consistent with `CLAUDE.md`.

**The claim holds.**

- `data-rich-text` is on exactly six wrappers: `page.liquid:14`, `article.liquid:22` and `:36`, `blog.liquid:28`, `main-material-archive.liquid:38` and `product.liquid:48`.
- No `.js` file, loaded or not, and no inline script reads it. There is no `richText` dataset access, no `[data-rich-text]` selector and no `getAttribute('data-rich-text')`. The only `rich-text` hits elsewhere are Dawn's unused `section-rich-text.css` class names and a schema locale key.

**It is consistent with `CLAUDE.md`.**

- `:203` allows custom CSS scoped to "a dedicated `data-` attribute that isn't a JS hook". `data-rich-text` is not a JS hook.
- `:224` (JS hooks carry no CSS) constrains *JS* selection. No theme JS selects this attribute, so nothing is violated.
- The QA harnesses read the attribute, but they are test code, not theme behavior.
- The rule styles only the descendants of the wrapper, which is merchant and Shopify markup that the theme doesn't author. It names no Tailwind class.
- At (0,2,0) in `@layer base`, it loses to utilities, components and unlayered CSS exactly as Dawn's `legacy` rule did. That includes Shopify's own CSS on the privacy widget, which sits inside the page's `[data-rich-text]`, so parity holds there too.

The one weak spot is durability. T4b and T4c called the attribute a "hook (no CSS)" (`t4c.md:251`, `:548`), and only plan text records that it now carries CSS. See N2-1.

### Required changes (round 2)

#### R2-1: REQUIRED (Step 0 stops on a correct build). The `SZ` grouping rule misses causes in descendants

§4.2 says an `SZ` entry is explained only if a root-cause entry exists "on the same element, an ancestor, an earlier sibling, or an earlier sibling's descendant". A box's resolved `height` changes most often because of a change *inside* it. Two concrete cases:

- **PXA, under Q5a.2's recommendation.** The root cause is the announcement bar's `margin-bottom` (32 px → 0). The bar's parent, `div.theme-evolution-header-wrapper`, shrinks by 32 px; so do the section wrapper, `body` and `html`. Each of those `height` entries has its cause in a *descendant*, so none qualifies. They are unexplained, Step 0 stops, and C5a.9(c) would be red too.
- **PXZ.** The `data-t5-zoo="gap"` container grows when its empty child is revealed. In flex rows, a revealed later sibling also resizes *earlier* siblings, which the rule doesn't cover either.

The same rule feeds the cross-build comparison (§4.2) and, implicitly, the live probe: §5.11 step 9 matches "the same two values" for every difference. Resolved sizes there depend on live's own fonts and settings, which the dev theme doesn't share.

**Fix.** The simplest correct rule: an `SZ` entry carries no class of its own. It is explained if the same (page, state, width) has at least one root-cause entry, and head geometry is judged by C5a.10, which already allows A-row displacement. An `SZ` entry on a page with no root-cause entry stays unexplained. Apply the same grouping in §5.11 step 9: only root-cause properties must match, and an `SZ` difference inside a target passes if that target has a matched root cause. If you prefer to keep a locality test, add "a descendant" and "any sibling, in either order, with its descendants".

#### R2-2: REQUIRED (criterion red on a correct build; also present in Revision 1, missed in round 1). C5a.21's `:empty` clause

C5a.21 says "The compiled `@layer base` has no `:empty` selector other than `p:empty` and D5a.19's rule …". The compiled file already has two other `@layer base` selectors containing `:empty`: `src/tailwind.css:235-243`, compiled as

- `:empty:first-child+:where(p,h1,…)`
- `:where(p,h1,…)+:has(+:empty:last-child)`

These are the T0 margin-trim rules (grep on `assets/tailwind.css`). As written, C5a.21 is red on every build, including a correct one.

**Fix.** Name these two as exceptions, or restate the clause: no `@layer base` rule whose subject is `:empty` sets `display`, other than `p:empty` and D5a.19's rule (and its twin). That form still goes red on a global `div:empty` port, which is what the clause exists to catch. Also add the two selectors to §4.2 step 3's list of "other `:empty` rules". They don't match the control, so this is wording only.

#### R2-3: REQUIRED (validity can be unreachable on a correct build). C5a.9's widget clause

Following my N5, C5a.9 now requires "at least one entry **inside the privacy widget's subtree**". Whether any Dawn rule changes a computed value inside the widget is exactly what is unknown. The widget's stylesheet is cross-origin and unreadable, and T4c found Dawn's `width: auto` on the checkbox (the UA default anyway) to be the only readable rule matching it (T4c impl notes `:44`). If Shopify's CSS already sets the checkbox margin, the widget has no entry, and C5a.9 is *invalid forever* on a correct build.

My round-1 wording offered the alternative ("or an asserted count of widget elements of at least 1"), and that alternative is the safe one.

**Fix.** Make validity "the widget subtree was snapshotted: element count ≥ 1, including one `input[type=checkbox]`". Record whether `TOG` found entries inside it. Q5a.3's recommendation becomes moot if it found none, so say so in E5a.3.

### Nits (round 2; none blocks)

- **N2-1.** Make `data-rich-text`'s new role durable. Add a clause to the "Rich text" bullet in `CLAUDE.md` and `AGENTS.md` (`:198` / `:193`, Step 8), for example: "`data-rich-text` marks merchant HTML and carries the empty-element rule in `src/tailwind.css`; don't use it as a JS hook." Otherwise a future agent reading T4b's "hook" wording may hang JS on it. This is a permanent rules-text edit, so it is the owner's call, but it costs one sentence.
- **N2-2.** §5.11 matches by container-relative path, but §4.2 records only absolute paths in `TOG`. Have `TOG` also record the owning container's selector and the relative path for every Shopify- or app-owned entry, so the probe doesn't have to re-derive them.
- **N2-3.** State where the PXZ vendor copy sits: at the root, **outside** the `prose` / `[data-rich-text]` copy. Inside it, D5a.19 would hide it and C5a.12(b) would pass without `empty:hidden`.
- **N2-4.** A coupling for T5b's reviewer, not a T5a defect. T5b's Step 3 deletes every `.shopify-policy__body` rule, including the conditional `:empty` twin, but T5b's policy wrapper carries no `data-rich-text` (`t5b.md:210`). If the twin was ever added, T5b would silently drop that parity.
- **N2-5.** D5a.19 covers `[data-rich-text]` boxes only. Merchant `richtext` settings rendered elsewhere (`blocks/text.liquid`, the image banner's text) lose Dawn's `:empty` hiding too. They produce `p` almost exclusively, and `p:empty` still covers that, so the risk is negligible. Add a sentence to E5a.16 so the boundary is explicit.

### Trajectory (round 2)

Round 1 had 1 blocker and 14 REQUIRED items; round 2 has 0 blockers and 3 REQUIRED, each fixable in a sentence or two, plus 5 nits. The method is now sound and its criteria pass the two-sided test, apart from R2-1 to R2-3. Once these three are folded in, a closeout check against them is enough; another full round isn't needed.

### Required changes (round 2)

1. **R2-1.** Widen the `SZ` grouping. Simplest: an `SZ` entry is explained if its (page, state, width) has any root-cause entry, with geometry judged by C5a.10. Apply the same grouping in the live probe's matching (§5.11 step 9).
2. **R2-2.** Fix C5a.21's `:empty` clause so the two existing margin-trim selectors in `@layer base` don't make it red. Name them in §4.2 step 3's list too.
3. **R2-3.** Change C5a.9's widget validity to "widget subtree snapshotted (≥ 1 element, one checkbox)". Record `TOG` entries inside the widget rather than requiring them.

APPROVE WITH CHANGES

---

## Closeout (Revision 2.1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `1f2a390`.

**Read for this closeout:**

- The Revision 2.1 changelog.
- The changed text in the plan: §4.2 steps 3 and 9, the "Grouping derived entries" paragraph, §4.4, §5.3's merchant-HTML bullet, §5.9 row T8, §5.11 steps 8-9, E5a.3, E5a.16, C5a.9, C5a.21, C5a.24 and the §10 PXZ row.
- The index (Revision 2.1 markers, criteria count, budget rows).
- T5b's policy wrapper (`t5b.md:251`), to check the N2-4 coupling.
- The compiled `:empty` selectors in `assets/tailwind.css`, re-grepped.

### R2-1: closed

An `SZ` entry carries no class of its own. It is explained if its (page, state, width) has any root-cause entry, and C5a.10 judges the geometry. An `SZ` entry with no root cause stays unexplained, so the rule can still go red. The plan states why no locality test applies, and cites PXA's header wrapper and PXZ's flex row. §5.11 step 9 now matches root-cause properties value for value. An `SZ` difference there passes only if its target has a matched root cause, and fails otherwise. This answers the dev-versus-live font and settings concern.

### R2-2: closed

C5a.21 now reads: "No `@layer base` rule whose subject is `:empty` sets `display`, other than `p:empty` and D5a.19's rule (and its twin)". It names both T0 margin-trim selectors as margin-only, which matches the compiled file (`p:empty{`, `…,:empty:first-child+:where(…)`, `…,:where(…)+:has(+:empty:last-child)`). The two-sided test now holds: a correct build is green, and a global `div:empty{display:none}` port in `@layer base` is red. §4.2 step 3's list of other `:empty` rules names both selectors, and none of them can hide the control `div`.

### R2-3: closed

C5a.9's validity is now "the widget subtree was snapshotted: at least 1 element, including one `input[type=checkbox]`", and entries inside the widget are recorded, not required. E5a.3 adds the matching consequence: with no widget entry, Q5a.3 is moot and D5a.8's rule isn't added. That also keeps the end state free of a rule with no measured effect.

### Nits: all applied

- **N2-1.** Row T8 adds the `data-rich-text` sentence to the "Rich text" bullet in both files, only under Q5a.5's recommendation. C5a.24(c) requires it to appear exactly once in each, with identical text.
- **N2-2.** §4.2 step 9 records the container selector and the container-relative path for every Shopify- or app-owned entry.
- **N2-3.** The vendor copy sits at the zoo root, outside both `ZOO_FIX` copies and outside any `[data-rich-text]` box.
- **N2-4.** §5.3 states the coupling. T5b's wrapper (`t5b.md:251`) carries `data-rich-text`, so the `[data-rich-text]` rule takes over the policy body once T5b deletes the `.shopify-policy__body` twin. The attribute now has a seventh carrier, which is consistent with T8's wording and with `CLAUDE.md:203`. T5b's own `data-policy-prose` attribute belongs to T5b's review.
- **N2-5.** E5a.16 states the boundary: `richtext` settings outside `[data-rich-text]` produce `p` almost exclusively, and `p:empty` still covers that.

### Regressions

None found. Revision 2.1 adds no CSS (T8 is rules text), so §5.10's range of 58,662 to 58,922 / 11,174 to 11,369 still stands. The index's T5a row reads Revision 2.1 with C5a.0-C5a.26 (27 criteria).

### Residual nit (no re-review needed)

- **N3-1.** §6's `CLAUDE.md`, `AGENTS.md` row (`:593`) and Step 8 (`:887`) still say "T1-T7". Under Q5a.5's recommendation the edits are T1-T8. This direction is conservative: C5a.24(c) goes red if the T8 sentence is missing, so the gap can't ship unnoticed. Fix it when convenient.

### Trajectory

Round 1 found 1 blocker and 14 required changes. Round 2 found 3 required changes, all small. This closeout finds none, plus one cosmetic nit that a criterion already guards. The measurement method, the gates and the criteria now pass the two-sided test, and the remaining risk is low and owned by Step 0's own stop rules. Ready for the Coder.

APPROVE
