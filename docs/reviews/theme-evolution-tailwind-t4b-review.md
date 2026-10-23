# Plan review: theme-evolution-tailwind-t4b (Revision 1)

Reviewer: Plan-Reviewer (Claude), 2026-10-23
Plan: `docs/plans/theme-evolution-tailwind-t4b.md`, Revision 1 (1,547 lines, read in full). HEAD `3770e14`. The plan cites `de08107`; the only commit since adds `docs/qa/` files, so every theme-file citation still applies.

Read for this review:

- **Rules:** `CLAUDE.md` from disk, this pass. Line 68 says no theme-check offense is expected, as the plan says. Lines 199 and `AGENTS.md:194` are the "Complete class names only" bullets that Step 15 edits. `learn_shopify_api` was called once, for Liquid.
- **Plans:**
  - the T4c outline and the T4 index, both in full;
  - umbrella D6 (296-308), the owner-decision table (1765-1782), §6 row T4b, risk 4 and C0.13;
  - T4a Q4a.10 and its Rev 2.1 sweep notes;
  - T4a impl notes deviations 1-7; the T4a QA report (size, theme check, 429 notes); the T4a review, for format.
- **Source, in full:** all ten T4b sections, `templates/gift_card.liquid`, `src/tailwind.css`, `snippets/image.liquid`, `snippets/sustainability-rating.liquid`, `snippets/card-product.liquid`, `snippets/material-info.liquid`, `sections/material-tooltip.liquid`, `layout/password.liquid`, `templates/product.api.liquid`, `templates/page.materials.json`, `templates/list-collections.json`.
- **Source, in part:**
  - `sections/related-products.liquid` 1-100;
  - `assets/material-api-fetch.js` 25-65;
  - `assets/eco-tooltip.js` (fetch URL);
  - `snippets/css-variables.liquid` (`--page-width`, `--page-margin`);
  - `assets/base.css` 76-145, 440-499, 876-905, plus selector greps;
  - `locales/en.default.json` (top-level keys, 2-57, 255-270, 364-369);
  - `docs/qa/harness/t4ac-lib.mjs` (exports).
- **Compiled output:** `assets/tailwind.css` greps for every utility the plan calls "already compiled" or "new", the incidental selectors, the D6 rules' exact minified text, and the drawer variant.

---

## Summary

This is a strong first revision, and the split is right.

- **T4b can't breach the budget.** Even at five times its high estimate (+1,470 / +340), it ends at about 52,000 / 11,100.
- **T4c is gated on a real measurement**, on the tree it will actually ship on. Moving `prose` there doesn't reverse Q7 ("`prose` in T4"): T4c is still a T4 sub-phase.
- **The input rule can go in T4b.** Every theme control now carries `border`, and none of the D6 input rule's work depends on `prose`.
- **The escaping design is sound.** Step 0's probe picks the branch, and C4b.10 is red on either wrong branch. Either branch is XSS-safe once chosen.
- **The `@source not inline` lines are valid Tailwind 4.1+ syntax** (pinned 4.3.3). They sit in their own commit, and C4b.21 tests them statically and on rendered pages.
- **Schemas are untouched.** Every option value and setting id is unchanged, and the collections and archive mappings cover every saved value.

There are **no blockers**. The required changes fall into two groups.

**A true fact on the wrong referent (R1).** The archive's "24 px `page-width` padding" is Dawn's mobile value. From 750 px, `assets/base.css:105-108` sets `padding: 0 5rem`, which is **80 px** at this theme's 16 px root. So the archive's desktop frame moves by 48 px a side, not 8, and its cards grow from 392 to 424, not from 429.3. That is a merchant-visible change the owner isn't shown.

**Mechanisms and criteria that can go wrong:**

- The pagination's current-page test converts only one side of the comparison. The established Dawn pattern implies the conversion breaks it (R2).
- C4b.6's `[data-page-shell] > h1` can't find the article's `<h1>` (R3).
- The live-only Supercycle embed is never checked before the D6 input rule leaves live, and the fallback text assumes Step 14 hasn't run yet (R4).
- The recommendations' two range settings have no criterion (R5).

**Human-facing text that is stale:** the T4 index (R6).

Each fix is small.

---

## Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**

- **§3.1 line counts** for all 13 files, and the cited ranges: `src/tailwind.css` 22, 113, 191-211, 213-241; gift card 7, 13, 18-25, 31, 48, 50-55, 59, 65-70; archive 15-170, 42, 47-93, 97, 172-252, 210, 215, 222, 228, 234-238, 254-293; recommendations 7-19, 21-77, 44, 82-83, 94, 105-138.
- **`base.css`:** 151, 217, 454 (`.center`), 462, 470-484, 705, 881-900, 3130-3197. **One cite is wrong:** the `.page-width` reading (R1). The manifest records 78-102 as read, which stops three lines short of the 750 px media query.
- **Locale keys:**
  - `general.pagination.*` sit under `general` (top-level key at 334);
  - `sections.material_spotlight.*` at 255-258;
  - `search.*_html`;
  - `blog.article_metadata_html`.
- **`S_par`.** The compiled text is `ul:not([class]),ol:not([class]){padding-inline-start:1.5em}` (59), `ul:not([class]){list-style:outside}` (35; Lightning CSS rewrote `disc` as `outside`, which is equivalent), `ol:not([class]){list-style:decimal}` (35), `a:not([class]){text-decoration-line:underline}` (46), and the input rule, 95. So C4b.20(a)'s string matches the file exactly, and the criterion is live, not vacuous.
- **§3.2 item 8 ("already compiled"):** about 60 selectors grepped, all present. These include `border-current`, `hover:underline`, `text-foreground/75`, `max-w-[28.125rem]`, `md:text-[2.5rem]`, `mb-12` and `lg:grid-cols-1`…`4`.
- **The "new" list is really new:** `md:grid-cols-2`, `mt-auto`, `mb-16`, `min-w-11`, `basis-48`, `min-h-32`, `text-[#444]`, `leading-[1.6]` and `border-black/8` are all absent today.
- **The incidental selectors** `.contents{ .filter{ .transform{ .truncate{ .capitalize{ .inline{ .visible{` and `group-aria-busy\/drawer\:visible` are all present.
- **Grid arithmetic:** every row of §5.4, §5.5 and §5.6 recomputed with `N_t`/`T_w`, plus C4b.15's formula. All correct for the after-state.
- **§5.15 and §15.3 sums:** every row recomputed (gross, net, end state, the `S_o3 = 0` row, the size variants, the margins). All correct. The `8,985` in `S_prose` is the deliberate Steps 1-5 survivor from T4a Rev 2.1, so it is correctly scoped.
- **Bar parity:** `h-2`, `gap-1`, `rounded-sm` (4 px in v4), `#eeeeee`, `#2d5a27`, 1 s `cubic-bezier(0.19,1,0.22,1)`, 150 ms stagger, and `mt-3` as the archive's 12 px. All confirmed.
- **The R12 sinks** (`material-info.liquid:36`, `material-tooltip.liquid:32`, `material-api-fetch.js:51-52`, `product.api.liquid:15`), which T4a Q4a.10 already approved as a one-commit addition.
- **Step 0 item 1.** The deploy note exists and names #187953643616. The T4a harness files the plan copies from all exist.

**Taken on trust:**

- these Shopify behaviors: `link_to` and `{% form %}` accepting `class:`; `preload: true` emitting a `Link` header; `?view=` alternate `.liquid` page templates; `article.comments.size` inside `paginate`;
- T4a's measured `S_tw`;
- the parts of §3.2 item 8 I didn't grep (`inline-flex`, `items-center`);
- umbrella §16-§17 beyond risk 4;
- `AGENTS.md` beyond line 194.

**Not in the manifest, and where I found the most:**

- the `.page-width` media query (R1);
- Dawn's `part.title == paginate.current_page` precedent (R2);
- which pages have the Supercycle embed (R4);
- the source of `.contents` (N1).

---

## Blocking issues

None. Every required item below either changes owner-facing text or would turn a criterion red during the build. Each is a sentence or a line of Liquid.

---

## Required changes

### R1: REQUIRED (owner-facing). The archive's "today" frame uses Dawn's mobile padding at every width

**Where:** §5.13 table row "root" and E4b.14 say today's frame is `x = 44 (24 px page-width padding)`. E4b.15 says "at 1440 with N = 3, tracks 424 (was 429.3)".

**What the files say:**

- `assets/base.css:84` sets `.page-width { padding: 0 1.5rem }` (24 px).
- `base.css:105-108` overrides it inside `@media screen and (min-width: 750px)` with `padding: 0 5rem`, which is **80 px** at `R_root` = 16.
- The archive's own unlayered `{% style %}` doesn't touch `.page-width`.

**What changes for the merchant:**

| Width | Today | After |
|---|---|---|
| 375 | x = 44 | x = 52 (the plan's +8 px holds) |
| ≥ 750 | x = 20 + 80 = **100**; at 1440 the grid is 1,240 wide and the three tracks are (1,240 − 64) / 3 = **392** | x = 52; the tracks are 424 |

So on desktop the archive grid widens by 96 px, each card grows by about 8 %, and the frame moves 48 px outward on each side. The header block doesn't move, because it is centered.

**Why it matters:**

- QA compares against Step 0, so the build won't silently pass on a wrong expectation.
- But the row that tells the owner what changes is wrong, and E4b.14 isn't ⚑ or in owner check 3. This is the "true fact, wrong referent" class: 24 px is correct, but it is the 375 px value.

**The alternative the plan didn't weigh.** The recommendations section in this same plan (§5.14) and related products (`related-products.liquid:42`) use `mx-auto w-full max-w-page px-6 md:px-20`. That is 24 / 80 px: Dawn's `page-width`, moved to Tailwind's 768 breakpoint. It costs 0 bytes and keeps the archive at near parity. The plan's `px-8` aligns the archive with the T4a page shell and the header logo (`E_L`) instead.

Both are defensible, and the theme now has two alignment systems: the shell's 52 px edge, and the product-page sections' 24 / 80 px. The choice should be surfaced, not made by a misread.

**Fix, either way:**

1. Correct E4b.14 and E4b.15, and the §5.13 root row: below 750, x 44 → 52; from 750, x 100 → 52, and at 1440 the tracks go from 392 to 424.
2. Then either:
   - keep `px-8`, mark E4b.14 ⚑, and add it to owner check 3, with a fallback to the `px-6 md:px-20` wrapper (C4b.15's 1440 formula becomes `(1240 − (N − 1) × 32) / N`); or
   - adopt the wrapper now and say why.

### R2: REQUIRED. The pagination's current-page test converts only one side, which the Dawn precedent says breaks it

**Where:** §5.2 `assign current_page = paginate.current_page | append: ''`, then `elsif part.title == current_page`; §11 RB3, which rates "`part.title` is a string" **certain**.

**The evidence:**

- shopify.dev's `part` page lists `title` as `string`, and its example JSON shows `"2"`.
- Dawn's `snippets/pagination.liquid`, the most-deployed consumer of this object, tests `part.title == paginate.current_page` directly, a number, and its current-page styling works in production.
- Liquid's `==` is strict (`"2" == 2` is false). So the current part's `title` is in practice the same type as `current_page`, most likely an integer.

If it is, the plan's one-sided string conversion is exactly what breaks it. C4b.9(c) would go red at Step 2, and the fix would be improvised mid-build.

**Fix:** normalize **both** sides, which is right whatever the runtime type:

```liquid
assign current_page_text = paginate.current_page | append: ''
…
{%- assign part_title_text = part.title | append: '' -%}
{%- if part.is_link -%} … {%- elsif part_title_text == current_page_text -%}
```

While there, rename the variable. `current_page` is a Liquid global object (`CLAUDE.md`'s object list), and the `assign` caution in `CLAUDE.md` says not to shadow globals. The snippet's isolated scope makes the shadowing harmless, but the rename is free. Downgrade RB3 from "certain" to "unverified: normalize both sides". C4b.9(c) stays as written.

### R3: REQUIRED. C4b.6's selector can't find the article's `<h1>`

**Where:** C4b.6 measures `[data-page-shell] > h1` "on every shell page". §5.3 says the `<h1>` is the shell's first child.

**The problem:** in §5.9 the article's shell holds the hero image first, then `<div class="flex flex-col gap-3">`, and the `<h1>` sits inside that div. So on `/blogs/*/*` the selector matches nothing. Depending on how the harness handles an empty match, the criterion is either vacuously green or a harness error on a correct build.

**Fix:**

- Use `[data-page-shell] h1` (one per page, C4b.13), or name the article's nesting explicitly.
- Make §5.3 say the `<h1>` is the first **heading**, not the first child.
- On `/password` there is no header (`layout/password.liquid` renders only `content_for_layout`), so state C4b.6's left-edge check as the number `E_L(w)`, not "against the rendered header".

### R4: REQUIRED (operator-facing). The D6 input rule leaves live without anyone checking the one app embed that can depend on it

**Where:** §5.17, C4b.20(b) and RB5.

**What the plan does:**

- App-block and app-embed controls are "listed separately, as a C0.13 review item".
- They don't block Step 14.
- RB5's fallback is "keep the rule (don't run Step 14)".

**Why that isn't enough:**

- The umbrella names one app embed, Supercycle (§16 risk 4, C0.13), and it exists **only on live**. The repo's `config/settings_data.json` has no app embed (I grepped it), and dev and staging both receive that file.
- So the Step 0 sweep, C4b.20(b) and owner checks 1-3 all run on themes that don't render Supercycle. A subscription widget's frequency `<select>`, or a quantity field without its own border, is exactly what D6 was protecting ("unclassed Dawn, Shopify and **merchant** markup").
- The first time anyone sees it is C0.13 on live, after Step 14 has shipped. By then "don't run Step 14" is no longer an option.

**Fix:**

1. **Before the live push, run a read-only probe on live.** The live theme still has T2's `tailwind.css` with the D6 input rule. Open `/products/selling-plans-ski-wax`, or whichever product shows the embed. In the page context only, delete the D6 input rule from the loaded `tailwind.css` `CSSStyleSheet` (`deleteRule`), and compare `border-top-width` on every control inside the embed, before and after. Nothing is written to the theme.
2. **Make a 1 → 0 result a gate:** either keep the rule (revert Step 14 before the live push) or get owner sign-off.
3. **Fix RB5's fallback for the post-deploy case:** "revert Step 14, rebuild, re-push with `-e production`".

### R5: REQUIRED. The recommendations' two range settings have no criterion

**Where:** `CLAUDE.md` QA: "For every converted section … change each `select`, `checkbox`, `range` and `color` setting at least once. Each option must visibly apply."

**The gap:**

- The recommendations section's `padding_top` and `padding_bottom` get a new mapping: the spotlight variables, × 0.75 below 768.
- C4b.15 tests the archive's padding only. C4b.18 tests the recommendations' markup only.
- The owner can't test it in the editor either. The section is in no template, and adding it would edit `templates/*.json`.

**Fix:** add to PX5 (or C4b.18) `padding_top`/`padding_bottom` at 0 and 100. The root's `padding-top` should be 0 / 75 at 375 and 0 / 100 at 1440, as C4b.15 states for the archive.

### R6: REQUIRED (hand-off text). The T4 index still describes the pre-split plan

**Where:** `docs/plans/theme-evolution-tailwind-t4.md`. The plan updated its T4b row (§14.2), but several parts are now wrong:

- **The title and the slug line:** "split into T4a and T4b"; slug family T4a and T4b only.
- **The T4a row:** "Revision 2 (review round 1 addressed)". T4a is approved and on staging.
- **"CSS budget across both".** The table rows say "T4b with plain `prose`", and the bullets say "T4b re-measures … and applies the two-budget rule in its §4". `prose` is now T4c, and the rule is T4b §15.3 and T4c §4.

This is the file a later reader opens first. **Fix:** add a T4c row, re-label the budget rows "T4c (after T4b)" or point them to T4b §15.3, and update the T4a state. One pass, in the same edit as §14.2.

---

## Nits (none blocks; none changes a decision)

- **N1. The source of `.contents` is in the theme.** It is the header comment "The contents of this file are auto-generated" in `sections/header-group.json:3` and `sections/footer-group.json:3`. `@source "../sections"` scans every file in that folder, JSON included.
  - This has two consequences worth one sentence in §3.2 item 9:
    - merchant- and editor-saved section-group JSON **is** scanned, so editor text there can generate utilities (relevant to RB4, though no setting in this theme accepts a class);
    - live's copies of those files may differ from the repo, so C4b.22's set diff should be taken on the repo tree only.
  - The exclusion is still correct.
- **N2. C4b.17's hover check.**
  - Chromium serializes the computed `translate` as `0px -5px`, not `0 -5px`; normalize before comparing.
  - Read the values after the 300 ms transition.
- **N3. C4b.20(b) element pairing.** The article's submit `<input type="submit">`, which had a 1 px border from D6, becomes a `<button>`. Pair base and head elements by `name`/`id`, and exclude submit-type inputs from the "none is 0 where base was 1" clause.
- **N4. The search row.** The input is `h-11` (44 px) and `btn-secondary` is `min-height: 3rem` (48 px). In the same flex row the input sits 4 px short at the top. `h-12` on the input, or `items-center` on the form, evens them. The owner sees E4b.4 anyway.
- **N5. Sibling name sinks.** `material-info.liquid:32` and `material-tooltip.liquid:28` print the metaobject **name** raw. That is the same class of issue as R12, but outside Q4a.10's story-only list. A backlog line is enough; don't widen Step 13.
- **N6. `comment.content` prints raw.** That is visitor input, and goal 4 says "every … visitor-controlled value". Shopify sanitizes comment HTML, and Dawn prints it raw too. Say so in §1, so the omission reads as a decision.
- **N7. The harness copy list.** `t4bc-regress` needs `drawerOpen`, `openDrawer` and `closeDrawer` from `t4ac-lib.mjs`. Add them to the list of helpers `t4bc-lib.mjs` copies.
- **N8. Step 0 item 1** passes only after the orchestrator commits this plan and the index: both are ` M` in the working tree now. Say "after the plan and review are committed".
- **N9. C4b.22 audits only added selectors.** Steps 11 and 12 delete a lot of CSS text, which may be the only thing generating some utility used by unscanned markup (`assets/*.js`, apps). Listing removed selectors too costs one more set diff. This is conservative, so it stays a nit.
- **N10. §15.3 option 5 ("defer T4c").** If the deferral is open-ended, it moves `prose` out of T4, which is Q7's "in T4". It is the owner's option, so nothing is decided silently. Just say it in the same breath as option 4.
- **N11. The recommendations loop** keeps iterating all 50 products after the fourth match. A `{% break %}` is a logic change, so it belongs in §14.3 item 2's backlog entry, not here.

---

## Answers to the orchestrator's specific questions

**The split.** Coherent.

- **The budget:** T4b ends at about 43,900-45,350 / 9,250-9,600 and can't breach.
- **Rich text in T4b:** it is no worse off, with one exception, the archive description losing `.rte` (E4b.14, conditional on content and recorded at Step 0 item 11).
  - Pages, articles, blog excerpts and comments get a classless wrapper that renders like today's grid rows, because Preflight zeroes the margins and the old grid had no gap.
  - The blog excerpt's invalid nested `<p>` is fixed.
- **Removing only the input rule is safe for theme and Shopify markup:**
  - every theme `input`, `select` and `textarea` carries `border` after Steps 4, 7 and 9 (I grepped all of them);
  - policy pages and `default_errors` contain no controls;
  - dynamic-checkout UI is in shadow DOM.
  - The one exposure is the live-only app embed (R4).

**`@source not inline(…)`.**

- **Syntax:** valid for Tailwind 4.1+, so for the pinned 4.3.3.
- **Classes in use:** none of the five names is a class in scanned markup.
  - `transition-transform`, `will-change-transform` and `rotate-45` are separate candidates.
  - In v4 `rotate-*`, `scale-*` and `translate-*` use their own properties, not `.transform`.
- **Merchant entry points:** none can add a class.
  - The theme has no `custom_liquid`-type setting (grepped `sections`, `blocks`, `templates`, `config`).
  - `templates/*.json` isn't scanned.
  - `page.content` classes only ever worked by accident, and C4b.21(b) sweeps rendered pages, app blocks included.
- **Reversible and testable:** yes. One commit, with a static check and a rendered one. Step 0 item 15 drops any name a page actually uses. That is conservative: an app's own `.filter` class would get a harmless Tailwind rule removed, and the name would still be dropped.

**Search escaping.** Correct in both branches.

- The probe's decision rule ("pre-escape a key type exactly when its raw row shows an element") is right for `_html` and plain keys alike.
- Precedent agrees: `sections/material-tooltip.liquid:22, 44` already pre-escapes `search.terms` for an `_html` key.
- `value="{{ search.terms | escape }}"` is unchanged.
- C4b.10 is red on raw output (an `<i>` appears) and on double escaping (`&lt;` text).
- The results-branch caveat (Shopify's phrase syntax on `"q"`) is handled.

**Schema round-trip.** No ids or values change, and C4b.2 shasums the schema text.

- `grid_item_width`: `collections--compact` maps to 10rem; `else` covers `collections--full` and any unknown value.
- `grid_gap` reaches `gap-(--grid-gap)` through an inline custom property, 0-50 step 5.
- `columns_desktop` has a numeric `case` 1/2/4 with `else` → 3, the related-products pattern.
- The padding variables reuse names that already compile.
- The live template saves `columns_desktop` 3 and padding 80 / 80. Both map: 60 below 768.

**The pagination snippet.**

- `OrphanedSnippet` is avoided: the snippet ships in Step 2 with its first caller.
- Both doc params are read, and `{paginate}` is a valid doc type.
- `aria-current="page"`, the `nav` label and the existing `general.pagination.*` keys are fine.
- The 44 × 44 targets and the `.is_link` guards are fine.
- The `#comments` anchor is preserved.
- One fix: R2.

**`CLAUDE.md` rules.** All met:

- complete, single-line class strings;
- `style` attributes set only custom properties;
- no new custom CSS, so nothing to layer; `grid-fill` is an `@utility`;
- no bare `hidden`;
- `mb-0` on every `grid`;
- no always-empty `div`;
- Dawn names removed;
- one `<h1>` per theme page;
- `image_tag` dimensions;
- only the first blog image preloaded;
- no `include`.

The `collections.all.products` metafield loop knowingly stays, unrendered, with a backlog entry (Q4b.4). That is surfaced, not hidden.

**Criteria and harness.** The criteria sweep is honest, and the "chosen vs rejected" list is real:

- C4b.7(b) separates `grid-fill` from arbitrary tracks;
- C4b.16 separates the snippet bars from home-made ones;
- C4b.28 separates the fixed card from tokens;
- C4b.21(a) shows whether the exclusions are applied.

The Cloudflare lessons are applied: cached state, seeding through the product form, one password attempt, never printed. The 17 steps are one commit each, and the rollback table is correct. The theme-check predictions hold.

**Owner-visible changes.** Q4b.1, Q4b.3, Q4b.7 and Q4b.9 are ⚑, recommended, and shown at owner check 3 before live. None reverses Q1-Q8 or Q10.

- **Q4 (breakpoints):** applied (E4b.15).
- **Q7:** kept, in T4c.
- **The gap:** the archive frame, which should join them (R1).

---

## Checked and found sound

- **D4b.17, the gift card.** `display: unset` on an `img` is `inline`, because `display` isn't inherited, and the `inline` utility beats `@layer base { img { display: block } }`.
- **D4b.16.** The D6 input string in C4b.20(a) is the exact compiled text.
- **D4b.10's bar parity**, and the reduced-motion path. With `motion-reduce:after:animate-none`, the `::after` has content and no animation, so the fill shows.
- **The archive card.** `border-black/8` composites to 235 over white, `rounded-xl` is 12 px, `hover:-translate-y-1.25` is −5 px on a valid quarter step, and `transition` covers `translate` and `box-shadow`.
- **§5.14's wrapper** matches `related-products.liquid:42`. `mb-12` is the old 3rem, and `card-product` escapes its title.
- **R12 order.** `truncate: 160 | escape` truncates before escaping. Switching from `innerHTML` to `textContent` loses nothing, because `product.api.liquid:15` sends no `<br>`.
- **The material tooltip's `/search?section_id=material-tooltip` fetch** (`eco-tooltip.js:48`) uses the Section Rendering API, so the search section's conversion can't affect it.
- **Budget arithmetic,** all rows (see the manifest).

---

## Trajectory

This is round 1, with no blockers. Six small required items: one wrong referent, three criteria or mechanisms, one operator gap and one stale hand-off doc. A focused Revision 2 should be approvable without another full pass.

---

## Required changes

1. **R1.** Correct the archive's "today" frame in §5.13, E4b.14 and E4b.15. Dawn's `.page-width` is 24 px below 750 and **80 px** from 750 (`base.css:105-108`), so at 1440 the frame moves from x = 100 to 52 and the tracks grow from 392 to 424. Then either mark E4b.14 ⚑ and add it to owner check 3, with the `mx-auto w-full max-w-page px-6 md:px-20` wrapper as the fallback, or adopt that wrapper for parity. State the choice.
2. **R2.** In `snippets/pagination.liquid`, compare `part.title | append: ''` with `paginate.current_page | append: ''`, normalizing both sides. Rename the `current_page` variable, which shadows a Liquid global. Downgrade RB3 from "certain" to "unverified; both sides normalized".
3. **R3.** Change C4b.6's `[data-page-shell] > h1` to `[data-page-shell] h1`; the article nests its `<h1>`. Make §5.3 say "first heading". On `/password`, state the left-edge check as `E_L(w)`, because that page has no header.
4. **R4.** Before `shopify theme push -e production`, run the read-only live probe on the Supercycle embed's controls: delete the D6 input rule in the page's CSSOM and compare `border-top-width`. A 1 → 0 result means revert Step 14 before the live push, or get owner sign-off. Fix RB5's fallback for the post-deploy case: "revert Step 14, rebuild, re-push".
5. **R5.** Add a recommendations padding check to PX5 / C4b.18: `padding_top`/`padding_bottom` 0 and 100 give a root `padding-top` of 0 / 75 at 375 and 0 / 100 at 1440.
6. **R6.** Update `docs/plans/theme-evolution-tailwind-t4.md`: add the T4c row and update its title, mark T4a as approved and on staging, and re-label or point away the "T4b with plain `prose`" budget rows and the "its §4" sentence (to T4b §15.3 and T4c §4).

APPROVE WITH CHANGES

---

## Round 2 (Revision 2)

Reviewer: Plan-Reviewer (Claude), 2026-10-23.

**What I read this round:**

- **The plan:**
  - the changelog;
  - every changed section: §0 `W_a`, D4b.10, §5.2, §5.3, §5.6, §5.13, §5.17, §8 E4b.14 and E4b.15;
  - §9.1 C4b.6, C4b.15, C4b.17, C4b.18, C4b.20, C4b.22 and C4b.29;
  - the §9.2 rows for those criteria;
  - §10 setup, scripts, map, PX5 and the live gate;
  - §11 RB3 and RB5; §12; §13 Step 0 items 1 and 16, Step 14, Step 16 and the live push gate;
  - §14.2-§14.3; §15.1-§15.3, including Q4b.14.
- **The rewritten index**, `docs/plans/theme-evolution-tailwind-t4.md`, in full.
- **`CLAUDE.md`, re-read:** Deploy targets (live theme `138872651872`), QA, and "Complete class names only".
- **Files, re-checked:**
  - `docs/qa/harness/t0-lib.mjs:12-22` and `t4ac-lib.mjs:1-19` (how the cached session is made);
  - `docs/qa/theme-evolution-tailwind-t4a-deploy.md` (timestamp) and the T4a QA verdict;
  - `assets/tailwind.css` (the `@layer base` block and its `input:where(` rules; `items-center`, `inline-flex`).

### Summary

Revision 2 fixes all six round-1 items, and every nit is handled or deliberately deferred.

- **R1 is fixed by the better of the two options.** Parity at 0 bytes, with the alignment question parked as Q4b.14, an owner decision for later. The new `W_a` referent is right.
- **R2, R3, R5 and R6 are fixed as asked.**

The one new problem is in the new criterion C4b.29. The live probe has two ways to pass without measuring anything, which is the failure class this review attacks hardest:

- it deletes the wrong CSS rule (R2-1);
- it can render the development theme instead of live (R2-2).

Both are a sentence or two of method. Neither changes a design decision. They still matter: C4b.29 gates Step 14 at Step 0 item 16, and gates the live push.

### Status of round-1 required items

| Item | Status | Verified against |
|---|---|---|
| R1 | **Resolved** | See below |
| R2 | **Resolved** | See below |
| R3 | **Resolved** | See below |
| R4 | **Mostly resolved.** The gate, its timing and the post-deploy fallback are right. The probe's method has two holes (R2-1, R2-2) | See below |
| R5 | **Resolved** | See below |
| R6 | **Resolved** | See below |

**R1.** §5.13's root is `mx-auto w-full max-w-page px-6 md:px-20`, byte-identical to `related-products.liquid:42` and §5.14, so it adds no bytes.

- **`W_a`, recomputed:** 375 − 88 = 287; 900 − 200 = 700; 1440 − 200 = 1240; at 1920, 1400 − 160 = 1240.
- **C4b.15(b):** 1240, 604, 392 and 286 at 1440; 2 × 334 at 900. All correct.
- **C4b.15(a) is two-sided.** It is red on Revision 1's `px-8` (x = 52 against 100), and green on the wrapper. 760 is recorded, not compared, because the two frames differ there by design.
- **E4b.14 and E4b.15** now state the 750-767 band. E4b.15 also states the 990-1023 band.
- **The new comment at §5.13 line 760** contains no single-word utility name.

**R2.** Both sides go through `| append: ''`, and the variable is now `current_page_text`. The per-part `assign` is read on the next line, so `UnusedAssign` can't fire. RB3 is now tagged `[unverified]`.

**R3.** C4b.6 uses the descendant selector `[data-page-shell] h1`. On `/password` it checks `E_L(w)` and `w − E_L(w)`. §5.3 now says "first heading", and names the article as the one exception.

**R4.** The pieces are all in place:

- C4b.29 and the `t4bc-liveprobe.mjs` script;
- Step 0 item 16, which can stop Step 14, and Step 14's precondition, which now cites it;
- a live gate in §10 and §13;
- RB5's three fallbacks, and §12's post-deploy row.

**It is read-only.**

- It makes only GETs: page loads, plus an optional fetch of the CSS text.
- It mutates the CSSOM and DOM client-side only.
- It doesn't push, save or edit.

**On the Cloudflare lessons:** one or two page loads per run is far below the burst levels that produced the 429s. But see R2-2 on which session it uses.

**R5.** PX5c and C4b.18's settings clause are in place: 0 / 75 at 375 and 0 / 100 at 1440. The clause is red if the variables are misnamed or the 0.75 factor is lost.

**R6.** The index is correct throughout:

- the title and the slug family;
- T4a approved, with QA PASS WITH NITS. The deploy timestamp matches the deploy note's "2026-10-23 09:50 UTC".
- the T4c row;
- the budget table, which matches T4b §5.15 and §15.3 row for row;
- the starting conditions;
- the Q7 note on options 4 and 5;
- U-b1 to U-b5 marked pending.

**Nits N1-N11:** all applied as described in the changelog. I spot-checked N2, N3, N4 (`items-center` is already compiled), N7, N8, N9 and N10.

**Q4b.14 is sound.**

- It is a deferred, owner-facing choice, with the right numbers (x 100 → 52, cards 392 → 424) and a one-string fallback.
- It isn't ⚑ because nothing changes in T4b.
- It reverses no owner decision.

### Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**

- the `W_a` and C4b.15 arithmetic;
- the wrapper string against `related-products.liquid:42`;
- the §5.2 code;
- C4b.6's text;
- PX5c;
- the index, every line;
- the deploy timestamp and the QA verdict;
- `items-center` and `inline-flex` in the compiled file;
- the RB5 and §12 fallback commands against `CLAUDE.md` Deploy targets.

**Taken on trust:**

- that the §5.15, §15.3 and index budget rows are unchanged since round 1, where I recomputed them. I compared them by eye this round.
- that the unchanged sections (§5.4-§5.12, §5.14 apart from the comment, §5.16) are byte-identical to Revision 1.

**Not in the manifest, where I found both new items:**

- which CSS rules C4b.29's selector-prefix match actually hits;
- which theme the cached session renders.

### Required changes (round 2)

#### R2-1: REQUIRED. The probe deletes Preflight's button rule, not the D6 input rule, and then passes

**Where:** §5.17 step 3 says to delete, "inside the `@layer base` `CSSLayerBlockRule`, the rule whose `selectorText` begins `input:where(`". C4b.29 says to delete "the D6 input rule … inside the `@layer base` block".

**What the compiled file contains.** It has **one** `@layer base{` block, holding **two** rules whose selectors begin `input:where(`. In file order:

1. Preflight's `input:where([type=button],[type=reset],[type=submit]){appearance:button}`;
2. then the D6 rule.

Live's T2 build has the same structure. So "the rule whose `selectorText` begins `input:where(`" is Preflight's rule, and a first-match implementation deletes it.

**Why that is a false green.** Deleting Preflight's rule changes only `appearance` on submit buttons. Every embed control keeps its border, so the result is "no 1 → 0", which is a pass, whether or not the embed depends on D6.

C4b.29 also has no positive control. So a failed deletion, a no-op, or a rule that was never found all pass the same way.

**Fix:**

1. Identify the rule by **both** its selector and its declaration. Its `selectorText` contains `select` and `textarea`, its `style.borderWidth` (or `border-top-width`) is `1px`, and it has no other declaration.
2. Assert that exactly one rule matched.
3. Add a positive control. Before deleting, append a bare `<input type="text">` to the page (client-side only). Require it to read 1px before and 0px after. If it doesn't, the probe is invalid: neither pass nor fail.
4. Do the same in the fallback path. Its exact-string text removal (C4b.20(a)'s string) is already unambiguous; give it the same positive control.

#### R2-2: REQUIRED. The cached session can render the development theme, and "no embed" then passes vacuously

**Where:** §10's `t4bc-liveprobe.mjs` row says the probe "uses the cached session (`T4BC_STATE`)" with "no `preview_theme_id`". C4b.29 says: "If no live page carries the embed, record that; the clause passes vacuously."

**How the session is made.** `T4BC_STATE` comes from `loginState`, which copies `t4ac-lib.mjs`. That calls `t0-lib.mjs`, which logs in at `withTheme('/password')`, i.e. `/password?preview_theme_id=<dev theme>` (`t0-lib.mjs:13, 22`).

**Why that matters.**

- Shopify keeps a storefront in preview by cookie once `preview_theme_id` has been used, so omitting the parameter doesn't guarantee the published theme. I didn't verify the exact cookie name, but the mechanism is standard.
- If the stored state carries that preview, the "live" probe renders development theme #187953938528. That theme has no Supercycle embed (the repo's `settings_data.json` has none) and is about to lose the D6 rule anyway. The probe then finds no embed and records a vacuous pass: the wrong theme measured, the right number recorded.
- Separately, the cache lasts 50 minutes (`t4ac-lib.mjs:14`). The pre-live re-run happens days later, after owner checks, so it will need a fresh login anyway.

**Fix:**

1. **Assert the referent on every probed page.** In the page context, `window.Shopify.theme.id === 138872651872` (`CLAUDE.md` Deploy targets) and `window.Shopify.theme.role === 'main'`. A mismatch makes the run invalid, not a pass.
2. **Get a live session safely.** Either log in once in a fresh context **without** `preview_theme_id` (a single POST, so within the 429 lessons), or drop the preview cookies from the stored state and load the page once with an empty `?preview_theme_id=` to leave preview. Then re-assert (1).
3. **Make "not found" a failure where an embed is expected.** Step 0 item 16 records each embed page's container selector and an HTML excerpt as evidence. At the pre-live run, a page Step 0 recorded as carrying the embed where the container isn't found is a **fail** (re-investigate), not a vacuous pass. "No embed anywhere" passes only if Step 0 found none on a theme-id-verified run.

### Nits (round 2; none blocks)

- **N2-1.** §15.1's closing line ("None is reversed. §15.3's option 4 would reverse Q7") doesn't mention option 5. §15.3 and the index now both flag option 5 as touching Q7, so say "options 4 and 5" there too.
- **N2-2.** In §9.1, a blank line (line 1083) separates the C4b.29 row from the rest of the table. Most Markdown renderers will show it as a stray pipe paragraph, not a table row. Delete the blank line.
- **N2-3.** §13 live-push-gate item 2 says "revert Step 14 and re-run QA's C4b.20". Add "and re-push staging", as RB5 already says, so the operator text matches.

### Trajectory (round 2)

Round 1 had six required items, all fixed. Round 2 has two, both confined to the method of one new pre-live criterion, and both a few sentences. The rest of the plan is ready. After R2-1 and R2-2 are folded in, I expect a closeout check, not another full round.

### Required changes (round 2)

1. **R2-1.** In §5.17 step 3, C4b.29 and the `t4bc-liveprobe` row, identify the D6 input rule by selector **and** declaration: the selector contains `select` and `textarea`, and the only declaration is `border-width: 1px`. Assert exactly one match. Preflight's `input:where([type=button],[type=reset],[type=submit])` rule sits first in the same `@layer base` block. Add a positive control: an injected bare `<input type="text">` must go from 1px to 0. Without it the run is invalid. Apply the same control to the fallback path.
2. **R2-2.** In C4b.29, Step 0 item 16 and the `t4bc-liveprobe` row:
   - require `window.Shopify.theme.id === 138872651872` and `role === 'main'` on every probed page, or the run is invalid;
   - obtain the session without preview: one fresh login without `preview_theme_id`, or preview cookies cleared and an empty `?preview_theme_id=`. The cached `T4BC_STATE` was made in a preview session and expires after 50 minutes.
   - record each embed container's selector and evidence at Step 0, and treat "container not found" on a page Step 0 recorded as carrying it as a fail, not a vacuous pass.

APPROVE WITH CHANGES

---

## Closeout (Revision 2.1)

Reviewer: Plan-Reviewer (Claude), 2026-10-23.

**What I read:**

- the Revision 2.1 changelog (lines 16-26);
- §5.17 in full (steps 1-7 and the fallback);
- the C4b.28 and C4b.29 rows of §9.1, which are now adjacent;
- the C4b.29 row of §9.2;
- the `t4bc-liveprobe.mjs` row and the criterion map in §10;
- §10's live gate;
- §13 Step 0 item 16 and the live push gate;
- §15.1's closing line.

To check the positive control can actually go from 1px to 0, I grepped `assets/base.css` for element-level rules on `input`, `select` and `textarea`. The only one is `input[type='checkbox']` (1811), so nothing else gives a bare text input a border.

| Item | Status | Verified |
|---|---|---|
| R2-1 | **Resolved** | See below |
| R2-2 | **Resolved** | See below |
| N2-1 | **Resolved** | §15.1 now names options 4 and 5 together as touching Q7 |
| N2-2 | **Resolved** | The C4b.28 and C4b.29 rows are now adjacent, so C4b.29 is back in the table |
| N2-3 | **Resolved** | Both live-gate texts (§10 and §13) say: revert Step 14, rebuild, stage, `check:css`, commit, re-push staging, re-run C4b.20; or record the owner's sign-off. An invalid run is re-run, never counted |

**R2-1.** §5.17 step 6 now finds the D6 input rule by two things at once.

- **Its selector** contains `input:where(`, `select` and `textarea`. Preflight's button rule has no `select` or `textarea`, so it is excluded. The other base-layer rules that do name `select` and `textarea` don't contain `input:where(`.
- **Its declaration** is only `border-width: 1px`, which the CSSOM expands into the four `border-*-width` longhands.

Exactly one match is asserted. The positive control is a bare `<input type="text">` appended to `body`. It must go from 1px to 0px, or the run is invalid. The fallback asserts that C4b.20(a)'s exact string occurs once, and uses the same control.

Both false greens from round 2 are now invalid runs: deleting the wrong rule leaves the control at 1px, and a no-op deletion does the same.

**R2-2.** Each run logs in fresh, with no `preview_theme_id`:

- through its own login call, not `t0-lib`'s `withTheme`;
- never with `T4BC_STATE`, and nothing is cached;
- with an empty `?preview_theme_id=` as the escape if a preview persists.

Every probed page must show `Shopify.theme.id === 138872651872` (`CLAUDE.md` Deploy targets) and `role === 'main'`, or the run is invalid. Step 0 item 16 records each embed's URL, container selector and an HTML excerpt of about 300 characters. At the pre-live run, a recorded container that isn't found is a fail. "No embed" passes only after a theme-verified Step 0 run found none, recorded with the theme id. That closes the wrong-theme referent.

**Cost:** one password POST per run, at Step 0 and again before the live push, days apart. That stays well inside the 429 lessons, and the password is still never printed.

**Nothing else regressed.** The changelog says no step, criterion, Δ row, decision or risk was added, removed or renumbered. The sections I read confirm it, and C4b.29 still gates Step 14 (Step 0 item 16) and the live push, in the same places as in Revision 2.

**One observation, conservative, not a finding.** If the Supercycle embed's own CSS ever styles bare `input[type=text]` globally, the positive control would stay at 1px. Every run would then be invalid, and Step 14 would wait. That fails safe, never as a false pass. If it happens, the Coder can move the control into a container the embed's CSS can't match, and record it as a deviation.

**Trajectory.** Round 1 had six required items, round 2 had two, and the closeout has none. The plan is ready for `/implement`, subject to the Step 0 precondition that the orchestrator commits the plan, the T4c outline, the index and this review.

APPROVE
