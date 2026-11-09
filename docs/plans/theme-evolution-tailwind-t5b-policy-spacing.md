# T5b follow-up: policy page spacing (top, sides, bottom)

Slug: `theme-evolution-tailwind-t5b-policy-spacing`. **Revision 2.1** (2026-11-08). Parent: `docs/plans/theme-evolution-tailwind-t5b.md` (§5.2, Step 3, C5b.7). Size: the policy branch of `layout/theme.liquid` (one wrapper becomes three nested boxes) plus about 250 B of compiled CSS. Target: staging #187953643616 (never published). Live is a separate owner go, after this, in the order T5b (carrying this fix), then T6a.

**Changelog.** Rev 1: top gap only (`py-10 md:py-16` on the wrapper, 0 B). Rev 2: the owner widened the scope to the phone side margins ("include the phone side margins in this fix too") and the space above the footer ("include the bottom spacing above the footer too"). Former observations O1 and O2 are now goals. The design changes to copy the page section's box structure, zero Shopify's container padding, and clear the trailing bottom margins. The CSS delta is no longer 0, and the cherry-pick note now covers rebuilding the CSS. Rev 2.1 (review `docs/reviews/theme-evolution-tailwind-t5b-policy-spacing-review.md`, APPROVE WITH CHANGES):
- R-1: no utility name left in the comment.
- R-2: R7 rewritten as the runnable worktree procedure in §7.1.
- R-3: an unpublished smoke test on the dev theme is now a required step before the live push, and §9 is closed.
- NITs N1-N7 taken (§10).

## 0. Quantities (each defined once; every figure below cites a row)

| Symbol | What it measures | Units | Artifact | Extent | Method |
|---|---|---|---|---|---|
| `G_top` | header bottom to page title top | px | rendered page, scrolled to top | bottom of the last `.shopify-section-group-header-group` rect to the top of the page's one `h1` rect (box edges, not ink) | `getBoundingClientRect`, fresh context, `Shopify.theme.id` asserted |
| `PT`, `PB` | shell padding | px | policy: `[data-policy-prose]`'s parent (box B, §3); opt-out: `[data-page-shell]` | computed `padding-top` / `padding-bottom` | `getComputedStyle` |
| `C_L`, `C_R`, `C_w` | text column edges and width | px | policy: `[data-policy-prose]` rect; opt-out: `[data-page-shell] .prose` rect | box edges of the `prose` box | rects (same measurand as `docs/qa/t4cpq/measure.json`'s `prose`) |
| `T_L`, `T_R` | ink-free text edges | px | policy page | min `left` / max `right` of the rects of elements under `[data-policy-prose]` that have a non-whitespace text node of their own (T5b review N6's measurand) | rects |
| `G_bot` | last text to footer | px | either page | top of the first `.shopify-section-group-footer-group` rect minus the max `bottom` of the rects of the text-bearing elements (as `T_L`) under the page's `prose` box | rects |
| `W_gap` | outer box to footer | px | policy page | footer-group top minus the bottom of the policy's outermost box (A, §3; before the change, the old wrapper) | rects |
| `TC` | trailing chain | list | policy page | the elements under `[data-policy-prose]` that are `:last-child` and whose every ancestor up to `[data-policy-prose]` (exclusive) is `:last-child` | DOM |
| `X_page` | horizontal overflow | px | any page | `documentElement.scrollWidth - clientWidth` | as T5a C5a.18 |
| `H1` | page titles | count | any page | `querySelectorAll('h1').length` | DOM |
| `S_css` | compiled CSS size | bytes | `assets/tailwind.css` | whole file | `wc -c`; `gzip -9 -c … \| wc -c` |
| `W` | test widths | px | viewport | 320, 375, 768, 1024, 1440 (height 667 below 768, 900 from 768) | Playwright |

Values used in this plan:

- **`G_top` today:** the policy page is **0** at 1440 and 375. Contact, `/pages/data-sharing-opt-out`, `/blogs/news`, `/collections/all` and `/search` are **64** at 1440 and **40** at 375 `[quoted]` (orchestrator, staging, 2026-11-07).
- **Opt-out page shell** (`docs/qa/t4cpq/measure.json`, keys `dev|optout|<w>`, dev theme 187953938528) `[quoted]`:
  - shell left edge 20 at 320/375, which is `--page-margin`, so the setting is 20 here;
  - `C_L` 52 at 320 and 375, 60.6 at 768, 188.6 at 1024, 396.6 at 1440;
  - `C_w` 216 / 271 at 320 / 375, and 646.9 from 768;
  - `gapL` = `gapR` at every width.
- **Policy page after T5b** (`docs/qa/evidence/t5bc-v3-final.json`) `[quoted]`:
  - Shopify's `.shopify-policy__container` computes `padding: 0px 20px`, `max-width: 646.88px` (65ch) and `margin: 0px` at 320, 375, 768 and 1440;
  - `T_L` 20 at 320/375, 80.56 at 768 and 416.56 at 1440;
  - the wrapper is 320 / 375 / 646.875 wide;
  - so the text column is **606.9** at 768 and 1440 `[derived]`: 646.875 − 2 × 20.
- **`S_css` at HEAD:** **58,904 / 11,238** `[quoted]` (`docs/qa/theme-evolution-tailwind-t6a-report.md:33`). Not re-measured (no shell); Step 0 re-measures.
- **Expected `PT` = `PB`:** **40** below 768 and **64** from 768 `[derived]`. `--spacing` is `.25rem` and `md` is `@media (min-width:48rem)`, both `[measured]` in the compiled file.

## 1. Problem and goals

Owner, 2026-11-07, on staging (verbatim): "The spacing on staging looks at lot better, except the header, it's to close to the header." Then: "yes, take it through the full cycle." Then: "include the phone side margins in this fix too" and "include the bottom spacing above the footer too".

**Root causes.**

1. **Top.** Page shells carry `py-10 md:py-16` (`sections/page.liquid:9`, `blog.liquid:8`, `collection.liquid:93`, `search.liquid:12`, `collections.liquid:16`, `404.liquid:8`, `cart.liquid:8`, `article.liquid:9`, `password.liquid:8`). The policy wrapper (`layout/theme.liquid:46`, `<div class="prose prose-tokens mx-auto w-full" data-rich-text data-policy-prose>`, T5b commit `942a661`) has none. `prose` gives `h1` no top margin, and the wrapper is a flex item of the column `body` (`src/tailwind.css:172-177`), so no margin crosses it: `G_top` = 0.
2. **Sides.** Page shells get their inset from two boxes:
   - the section grid's side column, `minmax(var(--page-margin), 1fr)` (`src/tailwind.css` `.shopify-section`, `:243-259`), which puts the shell's edge at `--page-margin`;
   - the shell's own `px-8`.

   At 320 that is 20 + 32 = 52 (measured `C_L` 52). The policy wrapper isn't in a section. Its whole 20 px inset comes from **Shopify's policy stylesheet**: `.shopify-policy__container { padding: 0 20px; max-width: 65ch; margin: 0 auto }` as measured. `src/tailwind.css` has no policy rule left (ripgrep `policy`: no match; T5b Step 3 deleted them). The same container rule also caps the desktop text column at 65ch − 40 = 606.9, which is 40 px narrower than the shells' 646.9.
3. **Bottom.** `prose` clears the bottom margin of its direct last child only (`.prose > :last-child`). Here that child is Shopify's container, so the body's last element keeps its `prose` margin (1.25em for a `p` or a list `[derived]`). The margin collapses up through the container to the wrapper, which as a flex item contains it. So `G_bot` = `PB` + that margin, where a shell whose `prose` ends with a paragraph shows `PB` alone.

**Should Shopify's 20 px be kept beside new padding?** No. Keeping it means the theme compensates by 20 px on phones (pm + 12) and still can't reach the shells' desktop column, because the container's own `max-width: 65ch` (border-box) holds the text at 606.9 whatever the theme box is. Zeroing it lets the theme's boxes alone set the inset, exactly as on pages.

**Goals** (each at every `W`, against `/pages/data-sharing-opt-out` in the same run):
- `G_top` equal (40 / 64);
- `C_L`, `C_R` and `C_w` equal, so the side inset and the desktop column (646.9) match;
- `G_bot` = `PB` (40 / 64);
- no horizontal overflow at 320;
- nothing changes on any other page.

## 2. Non-goals

- The policy title's font, size, weight or alignment (Q5b.3 closed 2026-11-06: plain `prose` `h1` in the body font; `docs/plans/theme-evolution-tailwind-t5b-coder-questions.md`, "Q5b.3 owner answer").
- Spacing *inside* the policy body (paragraph, heading and list margins), except the trailing bottom margins.
- Any rule in `src/tailwind.css`, theme-editor Custom CSS, `{% stylesheet %}`/`<style>`, or `prose` modifier. Everything is utility classes in the markup.
- Any page other than `/policies/*`.

## 3. Design

Rebuild the policy branch as the same boxes a page uses:
- **A** stands in for the section grid's side column;
- **B** is the page shell's box, with `page.liquid:9`'s compiled sizing classes;
- the `prose` box sits inside, as on a page.

Two utilities then handle Shopify's markup inside `prose`. In `layout/theme.liquid`, lines 45-46 (the comment and the wrapper) become the block below. The `{%- if request.page_type == 'policy' -%}` / `{%- else -%}` lines around them are untouched.

```liquid
      {% comment %}
        Shopify renders store policies without theme classes; the typography plugin styles them like page content.
        The two outer boxes copy a page section: its side margin and the page shell in sections/page.liquid, so policy text lines up with other pages.
        The ! modifier is needed: Shopify's storefront policy stylesheet gives .shopify-policy__container 20px side padding in an unlayered rule, which outranks any utility.
        The last-child variant zeroes the bottom margin of the last element at every depth, skipping any element with a wrapper above it, inside this box, that has a later sibling; the typography plugin clears only its direct last child.
        Keep data-rich-text on this box: the variant is anchored to it.
      {% endcomment %}
      <div class="px-(--page-margin)">
        <div class="mx-auto w-full max-w-[calc(65ch+4rem)] px-8 py-10 md:py-16">
          <div class="prose prose-tokens *:px-0! [&_:last-child:not([data-rich-text]_:not(:last-child)_*)]:mb-0" data-rich-text data-policy-prose>{{ content_for_layout }}</div>
        </div>
      </div>
```

**Geometry** `[derived]`, pm = `--page-margin` = 20:
- A is a flex item of the column `body` with no auto margins, so it stretches to the viewport. Its content box is `vw − 2pm`, the same as the section grid's middle column whenever `vw` ≤ `--page-width` (90rem default, `config/settings_schema.json`). Above that, both center a 710.9 px box anyway.
- B: `min(65ch + 4rem, vw − 2pm)`, centered, with 32 px padding inside. This is the shell's box:
  - at 320, B is 280 at x 20 and the `prose` box is 216 at x 52;
  - at 768, B is 710.9 at x 28.55 and `prose` is at x 60.55, width 646.9;
  - at 1440, `prose` is at x 396.55.

  These match the opt-out page's measured values.
- `prose` (65ch max-width) fills B's content box: at the cap that box is exactly 65ch in the same 16 px body font, below the cap it is narrower. So `mx-auto w-full` are no longer needed on it: it is now a block child, not a flex item, so it can't shrink to its content (the reason T5b added `w-full`).
- **`*:px-0!`** sets `padding-inline: 0 !important` on `prose`'s direct children, which are Shopify's container and any `<style>`/`<link>` it prints (no effect on those). An important declaration in `@layer utilities` beats a normal unlayered one, which a plain utility can't (`CLAUDE.md`, "Cascade layers"). The container's own `max-width: 65ch` then equals `prose`'s width, so it needs no override. This follows `CLAUDE.md`'s rule for `!`: the colliding rule is Shopify's and can't be changed, and the Liquid comment names it. No Shopify class name appears in a class string.
- **The trailing-margin variant** compiles to `<prose box> :last-child:not([data-rich-text] :not(:last-child) *) { margin-bottom: 0 }`. It matches an element that is a last child *and* has no ancestor inside the `prose` box that isn't a last child: exactly `TC`.
  - On this page that is the container, `.shopify-policy__body`, any inner wrapper, the last block, and inside that block its last child (for a list, the last `li`).
  - Zeroing all of them removes every margin that collapses to the bottom, whatever the depth or the last element's type (`p`, list, heading).
  - An element with a later sibling at any level is excluded, so no other margin on the page changes. The class exists only in the policy branch, so no other page gets the rule.
  - Specificity: (0,1,0) class + (0,1,0) `:last-child` + (0,2,0) from `:not(…)` = (0,4,0), above `prose`'s `:where`-wrapped (0,1,0) rules in the same layer.
  - Why not the suggested `[&>*>:last-child]:mb-0`: it reaches only the container's last child (`.shopify-policy__body`). The `p` that carries the margin sits deeper, and its margin would still collapse through.
  - `[data-rich-text]` is a styling attribute, not a JS hook (`CLAUDE.md`, "Rich text"). `data-policy-prose` stays a QA hook with no CSS.
- **Inline comment words.** No single-word utility name appears in the comment (Rev 2.1, review R-1: the former "prose" became "the typography plugin", as in T5b review R6). The one risk is the selector `.shopify-policy__container`, if the extractor also yielded `container`. A8 catches any extra compiled rule. There is a precedent that it doesn't: `sections/material-spotlight.liquid:8` has a bare "container," in a scanned comment, and no `.container` rule is compiled (review N7, `[quoted]`). If it does appear, write "Shopify's policy wrapper rule" in the comment, and record the exact selector in the impl notes instead (N7).

**New CSS** (none of these is compiled today `[measured]`: no `px-\(--page-margin\)`, `px-0` or `*:` rule; `.mx-auto`, `.max-w-\[calc\(65ch\+4rem\)\]`, `.px-8`, `.py-10`, `.md\:py-16` and `.mb-0{margin-bottom:0}` exist):

| Rule (expected minified form) | Bytes `[derived estimate]` |
|---|---|
| `.px-\(--page-margin\){padding-inline:var(--page-margin)}` | 56 (T5b's `S_pm`, same figure) |
| `:is(.\*\:px-0\!>*){padding-inline:0!important}` | ≈ 46 |
| `.\[\&_\:last-child\:not\(\[data-rich-text\]_\:not\(\:last-child\)_\*\)\]\:mb-0 :last-child:not([data-rich-text] :not(:last-child) *){margin-bottom:0}` | ≈ 149 |
| **Total** | **≈ 251 minified (±30); gzip -9 ≈ +100 to +130** |

Expected `S_css` ≈ 59,155 / ≈ 11,350, within the 60,000 / 12,000 budget. A8 records the exact figures.

## 4. Affected files

| File | Change |
|---|---|
| `layout/theme.liquid` | the policy branch's comment and wrapper, as §3 |
| `assets/tailwind.css` | rebuilt: the three rules above, nothing else |
| `docs/plans/theme-evolution-tailwind-t5b-policy-spacing-impl-notes.md` | new (Coder) |

`src/tailwind.css` is **not** edited.

**What this amends in T5b.** T5b plan §5.2's code block is replaced by §3's. The rest of the T5b plan, its review and its QA report are not edited (they record what was approved). The T5b criteria change as follows:
- **C5b.7(a)** ("contains the §5.2 block once") is read against §3's block.
- **C5b.7(c)'s width clause** ("the wrapper's width is `min(M_ch, body width)`") becomes `min(65ch, vw − 2pm − 64)`. Its other clauses are unaffected: lists keep markers, links keep their underline (A6), and the left edge ≥ `--page-margin` holds (52 ≥ 20).
- **C5b.8** is unchanged and is repeated as A7.

`CLAUDE.md`/`AGENTS.md` need no change. Their "Rich text" bullet says policy pages get `prose` and `data-rich-text` from a wrapper in `layout/theme.liquid`, which stays true, and neither file quotes the wrapper's classes.

## 5. Data model and API changes

None.

## 6. Risks and edge cases

- **R1 Shopify's rule is assumed unlayered.** This is `[derived]` from its being a Shopify-hosted storefront stylesheet (`/cdn/shopifycloud/shopify/assets/storefront/policy-<hash>.css` on other stores `[quoted]`, web search). Step 0 reads it from `document.styleSheets` and records **every** rule in that stylesheet whose selector names `shopify-policy`, with all their declarations, the `href`, and whether each rule sits in a layer (N3). An unlayered `margin-bottom` on `.shopify-policy__body` or the title would beat the trailing variant. If it exists, A3 goes red; stop with a coder question before editing. If `cssRules` throws because the sheet is cross-origin, fetch the sheet's `href` as text and read the rules there. That case is not "no rule found".
  - If it is layered (below `utilities`), drop the `!`: `*:px-0`.
  - If no stylesheet rule sets that padding (an inline `style` attribute, for example), stop with a coder question.
- **R2 Narrower phone column.** The text column at 320 shrinks from 280 to 216, the same as pages. A long unbreakable string in a list item could overflow, because the base `overflow-wrap: break-word` covers only `p` and `h1`-`h6`. Inside a list item the text width at 320 drops from 254 to 190 px `[quoted]` (review N4). A7 tests `X_page` = 0. Step 0 also records the widest unbreakable run inside any `li` at base (its min-content), which predicts A7.
- **Pre-authorized fix (N4).** If A7 is red at any `W`, append `wrap-break-word` to the `prose` box's class string. It is not compiled today `[quoted]` (T5b §5.2: `.wrap-break-word{overflow-wrap:break-word}`, about +42 B, within budget). Rebuild and rerun A1-A10, and record the delta. A8 then allows this fourth rule. If A7 is still red after that, stop with a coder question.
- **R3 Empty trailing elements.** Two cases have the same effect:
  - `:last-child` counts `display: none` elements, so an empty element hidden by the theme's `:empty` rules can sit at the end;
  - a *visible* empty trailing block lets its own margins collapse through it (N5).

  Either way the last text block isn't in `TC` and keeps its margin, and A3 goes red. `t5bc-v3-final.json` records one visible empty element in the policy body (`nEmptyEls` 1, `emptyHidden` 0) `[quoted]`; Step 0 records where it sits. Step 0 records `TC`; if its deepest member isn't the last visible text block, stop with a coder question.
- **R4 Desktop change.** The desktop text column widens from 606.9 to 646.9, and the text moves 20 px outward on each side. That is the shells' measure (goal), but it is a visible change; QA's screenshots show it.
- **R5 Opt-out reference for `G_bot`.** The opt-out page's `prose` box ends with Shopify's privacy widget, whose inner margins or padding may add to its `G_bot`. So A3 judges the policy's `G_bot` against `PB`, the shells' padding, and records the opt-out's `G_bot` with its cause beside it. If the opt-out's `G_bot` equals its `PB` ±1, the two pages also match.
- **R6 Budget headroom.** It drops from 1,096 B to about 845 B before T6b. T6b's plan should re-baseline.
- **R7 Deploy order and the CSS rebuild.** This fix lands on `main` after T6a, but live must take T5b with this fix before T6a. So the live tree is built in a separate `git worktree` from the last commit before T6a, with this fix cherry-picked in. `assets/tailwind.css` is one minified line, so the cherry-pick **will conflict** in that file (T6a changed it). The conflict is resolved by rebuilding, never by hand-merging. The full, runnable procedure, including an unpublished smoke test before live, is §7.1 (review R-2, R-3). The later T6a live push comes from `main`, which already contains the fix.
- **R8 Theme editor.** Policy pages have no template or settings, so the editor has nothing to change. The storefront checks cover it.

## 7. Implementation checklist (Coder)

Checks run on the dev theme **188245508192** (`shopify theme dev`; assert `Shopify.theme.id` on every load). Never live #138872651872; never publish staging.

0. **Base.** `npm ci && npm run check:css` exits 0 on the clean tree. Record HEAD, `S_css`, and the `shopify theme check` offense count (expected 0). On the dev theme with the **unmodified** tree, record:
   - On `/policies/privacy-policy` at every `W`: `G_top`, `G_bot`, `W_gap`, `T_L`, `T_R`, `X_page`.
   - The policy page's `TC` (tags and classes), the wrapper's direct children, and the computed `margin-bottom` of every element under `[data-policy-prose]` at 375 and 1440.
   - Shopify's policy stylesheet (R1, N3): every `shopify-policy` rule with all its declarations, the `href`, and its layer, read via `cssRules` or, if that throws, from the fetched `href` text.
   - Where the visible empty element sits in the policy body, and whether it is in or after `TC` (R3, N5).
   - The widest unbreakable run inside any `li` on the policy page (its min-content width), to predict A7 (R2, N4).
   - The number of elements under `[data-policy-prose]` that are `:last-child`, are **not** in `TC`, and have a non-zero `margin-bottom`. These are A5's witnesses, expected ≥ 1: the last `li` of each mid-body list (N2).
   - On `/pages/data-sharing-opt-out` at every `W`: `G_top`, `C_L`, `C_R`, `C_w`, `PB`, `G_bot` and the element that ends its `prose` box.
   - The contact page's URL: `/pages/contact` `[provisional]`, the orchestrator's measured page. Confirm that it returns 200 with one `h1`, and record the URL actually used (N6). If no such page exists, use `/pages/data-sharing-opt-out` alone and say so.
   - On the A9 pages at 375 and 1440: `G_top` and the footer-group's document top.
1. **Edit** `layout/theme.liquid` as §3. Nothing else.
2. **Build.** `npm run build:css` (a fresh build, not the watcher's output). Check A8 with `git diff -- assets/tailwind.css`, then `npm run check` and `shopify theme check`.
3. **Verify.** Run A1-A10 on the dev theme and write the results to the impl notes.
4. **Commit** `layout/theme.liquid` and `assets/tailwind.css` together in one commit, so §7.1 can cherry-pick it. The impl notes go in a separate docs commit and record the code commit's SHA (§7.1 needs it). Don't push: DevOps does that after QA and `docs/qa/theme-evolution-tailwind-t5b-policy-spacing.approved`.

### Acceptance criteria

All rendered checks are at every `W` unless stated, against `/pages/data-sharing-opt-out` measured in the same run.

| # | Criterion | Kind |
|---|---|---|
| A1 | **Top gap.** Policy `G_top` = 40 ±1 at 320 and 375, 64 ±1 at 768, 1024 and 1440, and equal to the opt-out page's `G_top` ±1. Policy `PT` = 40 / 64 | test |
| A2 | **Side inset.** Policy `C_L` and `C_R` (`[data-policy-prose]` rect) equal the opt-out page's `C_L` and `C_R` ±1, about 52 at 320/375, 60.6 at 768, 188.6 at 1024 and 396.6 at 1440. **And** policy `T_L` = its `C_L` ±1 and `T_R` = `C_R` ±1, which shows Shopify's 20 px is gone. The container computes `padding-left` = `padding-right` = 0 | test |
| A3 | **Bottom.** Policy `PB` = 40 / 64 ±1, and `G_bot` = `PB` ±1. Every member of `TC` computes `margin-bottom: 0`. `W_gap` equals base ±1. Record the opt-out page's `G_bot` and `PB` beside the policy's, with the cause of any difference (R5) | test; record |
| A4 | **Desktop column.** Policy `C_w` = the opt-out page's `C_w` ±1 at 768, 1024 and 1440 (646.9 expected; base 606.9 recorded), and `C_w` = `vw − 104` ±1 at 320 and 375 | test |
| A5 | **Margins elsewhere untouched.** At 375 and 1440, every element under `[data-policy-prose]` that is **not** in `TC` has the same computed `margin-bottom` and `margin-top` as at base. Elements are paired by their DOM path **relative to `[data-policy-prose]`**, since the boxes above it change. At least 1 witness is required: a `:last-child` outside `TC` with a non-zero base `margin-bottom`, counted in Step 0. With 0 witnesses A5 is red as vacuous (N2) | test |
| A6 | **Policy content intact.** At 320, 375 and 1440: every `ul` computes `list-style-type: disc` and non-zero `padding-inline-start` (at least 1), and every `a` computes `text-decoration-line: underline` (at least 1). That is T5b C5b.7(c), repeated because `*:px-0!` changes the box that holds them. `H1` = 1 | test; `H1` is a guard |
| A7 | **No overflow.** Policy `X_page` = 0 at every `W`, 320 included. If red, apply R2's pre-authorized `wrap-break-word` once and rerun everything; if still red, stop | test |
| A8 | **CSS.** The diff of `assets/tailwind.css` adds exactly the three rules in §3's table, plus `.wrap-break-word` only if R2's fix was applied (by selector; the bytes may differ from the estimate), and removes nothing. Record the exact `S_css` delta (minified, gzip -9). New totals ≤ 60,000 / 12,000. `src/tailwind.css` unchanged. If another selector appears, or the trailing variant doesn't compile, stop with a coder question | test |
| A9 | **No change elsewhere.** On the contact page (the URL Step 0 recorded), `/pages/data-sharing-opt-out`, `/blogs/news`, `/collections/all`, `/search`, `/cart` and `/products/the-complete-snowboard` at 375 and 1440: `[data-policy-prose]` count 0, and `G_top` (where an `h1` exists) and the footer-group's document top equal base ±1. A difference traced to app-owned markup is recorded, not red. Statically, the `{%- else -%}` branch still prints a bare `{{ content_for_layout }}`, and the §3 block occurs once | test |
| A10 | **Gates.** `npm run check` exits 0; `shopify theme check` reports 0 offenses | test |

**QA** repeats A1-A10 independently in a fresh Playwright context. Base: staging #187953643616, which serves the pre-fix build, or the Coder's Step 0 values. Head: the dev theme or the build under test. `Shopify.theme.id` is asserted on every load. QA attaches screenshots of the policy page top and bottom, and the opt-out page beside it, at 375 and 1440 for the owner.

### 7.1 Live build: T5b plus this fix, without T6a (DevOps, only on the operator's explicit live go)

The live deploy covers **two slugs**, `theme-evolution-tailwind-t5b` and this one. It goes out from a separate worktree, so `main`'s checkout and its untracked `docs/` files are never touched. Here `<fix>` is the code commit's SHA from the impl notes, and `WT` is `~/Projects/Shopify/theme-evolution-os2-t5b-live`. The base SHAs are taken from the review's reading of the reflog: `7b8221b` is the last commit before T6a's `67b6839`, and `2e0d855` is T5b's last code commit.

1. **Gates 1-2, read from `main`, for both slugs.** `docs/qa/theme-evolution-tailwind-t5b.approved` and `docs/qa/theme-evolution-tailwind-t5b-policy-spacing.approved` exist. Each slug's `-report.md` ends with `PASS` or `PASS WITH NITS`. Gate 4 (read `CLAUDE.md`) as usual.
2. **Base checks, from `main`'s repo; on any unexpected output, stop and report:**
   - `git diff --stat 2e0d855 7b8221b -- layout sections blocks snippets templates assets config locales src` prints nothing (no theme change between T5b's last code commit and the base);
   - `git diff --stat 7b8221b <fix>^ -- layout/theme.liquid` prints nothing (T6a didn't touch the file the fix edits);
   - `git diff --name-only <fix>^ <fix>` prints exactly `assets/tailwind.css` and `layout/theme.liquid`.
3. **Build the worktree:**
   1. `git worktree add "$WT" -b t5b-live 7b8221b`, then `cd "$WT"`.
   2. `git cherry-pick <fix>`.
   3. On the expected conflict in `assets/tailwind.css`, never hand-merge: `git checkout --theirs assets/tailwind.css` (either side), `npm ci && npm run build:css`, `git add assets/tailwind.css`, `git cherry-pick --continue` (`CLAUDE.md`, Coder bullet on `tailwind.css` conflicts).
   4. Any conflict in another file means stop.
4. **Gates 3 and 5, in the worktree.**
   - `git status --porcelain` is clean (gate 3's rules on untracked files apply).
   - `npm ci && npm run check:css` exits 0, and `shopify theme check` reports 0 offenses.
   - Record the worktree's HEAD SHA and its `S_css` (`wc -c`, `gzip -9 -c … | wc -c`).
   - Confirm `shopify.theme.toml` exists in `$WT`, since `-e production` reads it from there.
5. **Required unpublished smoke test (orchestrator's decision, review R-3).**
   1. From `$WT`, push its committed tree to dev theme **188245508192**: `shopify theme push --store=theme-evolution-os2.myshopify.com --theme=188245508192`. Never `--allow-live`, never `-e production` for this step.
   2. In fresh Playwright contexts with `Shopify.theme.id` = 188245508192 asserted on every load, check that:
      - **A1, A2, A3** pass on `/policies/privacy-policy` at 375 and 1440, and **A7** at 320, 375 and 1440;
      - **T5b's markers are present:** `[data-policy-prose]` count is 1 on the policy page and 0 on `/` and `/products/the-complete-snowboard`; `getComputedStyle(document.documentElement).lineHeight` is `24px` (Step 2's outcome: no `html{line-height:` rule, so Preflight's 1.5 applies); the worktree's compiled file has no `html{line-height:` rule;
      - **T6a's marker is absent:** pull `sections/collection.liquid` from theme 188245508192 into a scratch directory (explicit `--store`/`--theme`/`--only`) and confirm it does not contain `columns_desktop` (`main`'s copy has it at `:11`);
      - there are **no console errors** on `/`, `/products/the-complete-snowboard` and `/collections/all` at 375 and 1440.
   3. Any failure means stop: no live push.
   4. This leaves the agents' dev theme **without T6a**. The next `shopify theme dev` session from `main` re-syncs it; say so in the deploy note.
6. **Live, by `.claude/agents/devops.md` unchanged, run from `$WT`'s root:**
   - resolve the live ID (`--role=live`);
   - both backups (`<slug>` = `theme-evolution-tailwind-t5b-policy-spacing`, noting that the push also carries T5b);
   - the template and section-group JSON diff against `$WT`'s `templates`/`sections`. Neither slug changes any JSON, so any non-header difference means stop;
   - `shopify theme push -e production`, confirming the CLI box shows `ignore: config/settings_data.json` and `live: true`;
   - the post-push `settings_data.json` comparison;
   - the verification procedure.
7. **Records go on `main`.**
   - Write `docs/qa/theme-evolution-tailwind-t5b-policy-spacing-deploy.md` with the step 5 results, the worktree's SHA, its `S_css`, and the backup names, and note that it also deployed T5b.
   - Make the audit commit on `main`, never on `t5b-live`.
   - Keep the `t5b-live` branch until T6a is live (it names the live tree for a rollback reference), then `git worktree remove "$WT"`.

The later T6a live push comes from `main`, which contains both T5b and this fix.

## 8. Self-check manifest

**Criteria sweep (red on the broken build, green on §3's build; reachable?).**

| # | Broken build that turns it red | Reachable? | Caught earlier? |
|---|---|---|---|
| A1 | no vertical padding; `py-10` without `md:py-16` (40 at 768+) | yes | no |
| A2 | `*:px-0` **without** `!` (loses to Shopify's unlayered rule: `T_L` = `C_L` + 20); no box A (`C_L` 32 at phones); `px-8` straight on the old wrapper (`T_L` 52 at phones but 449 at 1440) | yes | no. This tells the `!` mechanism apart from its rejected form |
| A3 | no trailing variant (`G_bot` = `PB` + 20 for a final `p`); the suggested `[&>*>:last-child]:mb-0` (doesn't reach the `p`) | yes | no |
| A4 | Shopify padding kept with phone compensation (column 606.9); `prose` box given B's padding instead of B (the column shrinks by 64) | yes | A2 partly |
| A5 | a broad `[&_:last-child]:mb-0` (also zeroes the last `li` of mid-body lists and every last-child `p` in list items). If content changes leave no witness, A5 is red rather than passing with nothing to compare (N2) | yes (5 `ul`s today, `nUl` 5 `[quoted]`) | no. This tells the exact-chain selector apart from the broad one |
| A6 | `*:` applied to a deeper level (`[&_*]:px-0!` would strip list indents) | yes | A5 doesn't check padding |
| A7 | a long unbreakable string in an `li` at 216 px (R2) | possible, content-dependent | no |
| A8 | an extra utility generated by a comment word; the variant failing to compile | yes | no |
| A9 | boxes put outside the `if` branch | yes | A9 static half |
| A10 | unclosed `div` in the nested block | yes | no |

§3's build passes A1-A6 `[derived]` from the geometry above and the measured compiled rules. A7 is `[provisional]` (R2), and A8's byte figures are estimates.

**Verified this session (read or ripgrep):**
- **Theme files:** `layout/theme.liquid` lines 42-52; `sections/page.liquid` in full (shell at :9); the nine page-shell lines (ripgrep `py-10 md:py-16`); `src/tailwind.css:167-303` (`body` flex at :172-177, `.shopify-section` grid at :243-259); ripgrep `policy` in `src/tailwind.css` gives no match; `snippets/css-variables.liquid:23-24`; `config/settings_schema.json` (`max_page_width` default `90rem`, `min_page_margin` default 20) and no saved value in `settings_data.json`.
- **Compiled CSS:** `--spacing:.25rem`; `.py-10`, `.md\:py-16` inside `@media (min-width:48rem)`, `.px-8`, `.mx-auto`, `.max-w-\[calc\(65ch\+4rem\)\]`, `.mb-0{margin-bottom:0}` are present; `px-(--page-margin)`, `px-0` and `*:` rules are absent (the only `page-margin` hits are inside `.shopify-section`'s variables).
- **Evidence:** the policy container's computed values and `T_L` in `docs/qa/evidence/t5bc-v3-final.json` (320, 375, 768, 1440); the opt-out geometry in `docs/qa/t4cpq/measure.json` (320, 375, 768, 1024, 1440 read; 390 and 430 seen); `S_css` in the T6a QA report.
- **Plans:** T5b §5.2 and C5b.7; the Q5b.3 answer.
- **Cross-file checks:** the old wrapper string appears only in `layout/theme.liquid` and three T5b docs; no `layout/theme.liquid` mention in the T6a plan files.
- **Rev 2.1 checks:**
  - **Review:** the review file read in full.
  - **DevOps rules:** `.claude/agents/devops.md` gates 1-5 (:16-22) and its deploy procedure steps 1-4 (:40-66).
  - **T6a marker:** `sections/collection.liquid:11` reads `section.settings.columns_desktop`, and the T6a plan §3.1 lists that file as T6a's.
  - **T5b Step 2 marker:** the compiled file on `main` has no `html{line-height:` rule (ripgrep), and the T5b QA report gives the line height as "1.5 x own font size".
  - **Comment words:** no single-word utility name left in §3's comment (read word by word).
  - **Contact page:** `templates/page.json` and `templates/page.materials.json` are the only page templates, so the contact page uses `page.json`; its URL is not verified, hence N6's Step 0 item.

**Not checked:**
- `S_css` and the theme-check baseline weren't re-measured (no shell).
- The three rules' exact compiled form and bytes (A8 decides). Whether Tailwind v4 accepts the nested `:not(...)` arbitrary variant as written (A8; coder question if not).
- Shopify's stylesheet origin and layering (R1, Step 0).
- The policy body's actual DOM depth and last element (R3, Step 0).
- The opt-out page's `G_bot` (R5).
- Whether `.shopify-policy__container` in a comment makes the extractor yield `container` (A8).
- The opt-out geometry was measured on another dev theme (187953938528) at T4c; Step 0 re-measures it.
- **The SHAs in §7.1** (`7b8221b`, `2e0d855`, `67b6839`) are the reviewer's, read from the reflog. I have no shell, so §7.1 step 2's `git diff` checks are the verification.
- The 254 → 190 px list-item width figure at 320 is the reviewer's (N4).
- Whether `shopify theme push --theme=188245508192` is accepted for a development-role theme. If the CLI refuses, use `shopify theme push --development` from `$WT` and assert that the ID it prints is 188245508192.

## 9. Open questions

None. The orchestrator's answer on the smoke test (an unpublished smoke on dev theme 188245508192 before live) is now required step 5 of §7.1 (review R-3).

## 10. Review NITs (Rev 2.1)

| NIT | Taken? | Where |
|---|---|---|
| N1 comment wording, and the `data-rich-text` coupling stated | taken | §3 comment |
| N2 A5 witness count, and paths relative to `[data-policy-prose]` | taken | Step 0, A5, §8 |
| N3 record all of Shopify's policy declarations; fall back to fetching a cross-origin sheet | taken | R1, Step 0 |
| N4 record the widest unbreakable run; pre-authorize `wrap-break-word` | taken (one attempt, then stop) | R2, Step 0, A7, A8 |
| N5 visible empty trailing block | taken (explanation only; the stop condition already covered it) | R3, Step 0 |
| N6 contact URL | taken as a Step 0 record (I can't verify the URL without a browser) | Step 0, A9 |
| N7 keep the selector if the comment fallback is used | taken | §3 comment-words bullet |
