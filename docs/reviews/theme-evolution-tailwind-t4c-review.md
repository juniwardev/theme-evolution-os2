# Plan review: theme-evolution-tailwind-t4c (Revision 1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `e21d0a3`; the plan and the T4 index are uncommitted in the working tree.
Read: the plan (all 913 lines), the T4 index, umbrella §11, §12, §20 and the D6 rows, T4b §15.3, the T4b review (all rounds), T4b impl notes, T4b QA report, `CLAUDE.md` and `AGENTS.md` on disk, and every source file the plan cites (`src/tailwind.css`, `assets/tailwind.css`, `sections/{page,article,blog,password,product,main-material-archive,footer,image-banner,related-products}.liquid`, `layout/theme.liquid`, `snippets/css-variables.liquid`, `assets/base.css` (the cited ranges plus the focus, table and link rules), `assets/eco-tooltip.js`, `templates/*.json`, `sections/footer-group.json`, `config/settings_schema.json`, `.shopifyignore`, `docs/qa/harness/t4bc-{lib,sweep,liveprobe}.mjs`, `t4bq-dso.mjs`, `docs/qa/evidence/t4bc-sweep-base.json` `policy*` keys). Shopify Dev MCP: `learn_shopify_api` (Liquid) once, plus input-settings searches for `richtext` and `inline_richtext`.

## Summary

The plan is sound in its core. It uses the plugin as Q7 decided. The budget gate measures the actual end state, uses the project's gzip method, stops for the owner on a breach of either budget and commits nothing in that case. `prose-tokens` on `currentColor` is the right way to follow live theme-editor colors without `@theme inline`. The D6 removal goes last, behind a sweep and a live probe. Its cascade analysis of the Dawn leaks (`hr`, `blockquote`) holds up against `base.css`. I found no blocker.

Eleven findings are REQUIRED. Four are criteria or proxies that fail on a correct build, or can't run as written: R3 the PXR shell width, R4 C4c.9 on real pages, R5 the missing image-banner text block, and R11 C4c.17 against a non-zero base. Two are gate or sequencing gaps: R1, where Step 12 can run without the policy rule, and R2, where the pre-live probe ignores containers that first appear after Step 0. The other five are owner-facing or hand-off text with wrong facts: R6 Q4c.6's focus-ring cost and its widget-sizing rejection, R7 two merchant-visible rows not flagged ⚑, R8 the T5 heading-font coupling, and R9 and R10 the index claim and the rules-text bullet. All are local edits. None changes the architecture.

## Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**

- `S_par` = 175. I read the compiled D6 text in `assets/tailwind.css`, including the odd `ul:not([class]){list-style:outside}`, and recounted 59 + 35 + 35 + 46.
- `S_pol` 46 + 49 + 55 = 150.
- `S_prose` +12,591 / +1,628, and the 13 B stdin offset: T4b impl notes `:56` (stdin) against `:31-45` (file method; base 9,437 vs 9,424).
- §5.12's sums and end figures: 57,214-57,559 and 11,026-11,226.
- `M_gz` is `CLAUDE.md:70`. `CLAUDE.md:68` now expects no offense, so the in-context copy is stale, as the plan says.
- `CLAUDE.md:197, 199, 211`, `AGENTS.md:192` and `.shopifyignore:35-36`.
- Every §3.1 line citation in page, article, blog, password, product, archive, footer, image-banner (384-389, 401-406) and related-products (49-51).
- `base.css` 353-358, 360-365, 426-430, 536-542, 3165-3169 and 3179-3184; `eco-tooltip.js:70`; `t4bc-sweep.mjs:72` (the cart drawer is skipped).
- The policy chain `div.rte > div > ul` (`t4bc-sweep-base.json` `policy2-375`).
- `C_mix` 102 / 193.8 / 234.6.
- `W_pc` = 431 − 52 = 399 − 20, and it is consistent with QA's 430-wide X of 1.
- `X_in` 163 / 108 / 93 / 53 and the 483 threshold.
- The `R_vars` count: 15 mapped + 3 unmapped = 18.

**Sampled and found wrong or incomplete:** `W_pd` "below `M_ch` at every width" (N1). The §14.2 claim about the index's T4b row (R9).

**Taken on trust:** T4b §0's `W_c` table beyond the `w − 104` formula; the deploy-note line numbers; the plugin README's variable list (Step 0 reads the installed file anyway); `t2c-tooltip.mjs`; T4b QA's raw overflow numbers.

**Not covered by the manifest, so reviewed in full:**

- the PXR and PXS proxy construction against the real templates (R3, R5);
- the live probe's re-run semantics (R2);
- Dawn's focus rules (R6);
- the umbrella T5 step text (R8);
- the Step 11 → Step 12 dependency (R1).

## Blocking issues

None.

## Required changes

### R1: REQUIRED. Step 12 can run without the policy rule

Step 0 item 6 says that if no `shopify-policy__` ancestor exists, "write a coder question; Step 11 waits". But Step 12's run condition (§13) is only "item 7 found nothing uncovered and item 13 gave a valid pass". Item 7 excludes the policy body from its coverage test. So with item 6 unresolved, Step 12 still qualifies to run. It would then remove the D6 rules and ship option (b), no bullets and no link underline on policies, which the plan itself rejects as a WCAG 1.4.1 failure (Q4c.3). §12's rollback table already treats Step 12 as dependent on Steps 7-11. The run condition must say so.

Also, Step 0 item 8 builds `P_end` "with the Step 0 item 6 selector". Say what the gate uses if item 6 hasn't resolved: the placeholder `.shopify-policy__body` (the byte count is within a few bytes either way).

Resolvability itself is fine. `/policies/privacy-policy` renders on this store (sweep evidence), even though T4b's sitemap-based fixture list says "no policy pages". See N2.

**Fix.** Step 12 runs only if Step 11 is committed, or if the owner has chosen Q4c.3 (b) in writing. State the `P_end` fallback.

### R2: REQUIRED (live gate). The pre-push probe only tests containers recorded at Step 0

§5.13 step 7 and C4c.22 pass when "every recorded container is found and nothing in it changes", and "'No embed' passes only if Step 0 item 13's theme-verified run found none". The re-run immediately before the live push does discover again (step 3). But nothing says a container found then, and absent at Step 0, becomes a target. Under the wording, such a container is neither "recorded" nor "missing", so it is never tested. That is a false green.

This is the likely case, not an edge case. The 2026-10-22 incident disabled an app embed on live, and T4b QA records that "the owner's check remains outstanding". The owner re-enabling the Supercycle embed between Step 0 and the live push is exactly the change this gate exists for.

**Fix.** On every run, the union of Step 0's recorded containers and this run's discovered containers is the target set. A container found now but not at Step 0 is probed, and recorded as new. "No embed" requires this run's theme-verified discovery to find none.

### R3: REQUIRED (criterion red on a correct build). PXR's shell copies don't reproduce `W_c`

C4c.8(a) expects the PXR page, article, comment and excerpt copies to be `W_c(375)` = 271 px wide at 375. `W_c` = `w − 104` includes the 20 px page margin that comes from `.shopify-section`'s grid (`src/tailwind.css:212-228`).

PXR is a Liquid template (`templates/page.tw-rt.liquid`). Its markup lands in `content_for_layout` with no section wrapper. The shell string copied from `sections/page.liquid:8` is then a stretched child of the flex `body`, so its content box is 375 − 64 = 311 px. A correct build reads 311 and the criterion goes red.

**Fix.** Either wrap each PXR copy in an element that carries the `.shopify-section` class (scratch only), or state C4c.8(a) for proxies as `min(M_ch, parent content-box width)`, measured as C4c.8(b) already does. The real opt-out page keeps the 271 expectation.

### R4: REQUIRED (criterion can't go green). C4c.9 on real pages hits the non-vacuity rule

C4c.9 runs "on PXR in every `prose` wrapper **and on the real pages**". It checks a middle `p`, `ul`, `ol`, `a`, `h2`, `hr` and `blockquote`. §9's non-vacuity rule makes a zero count an invalid run.

The real fixtures don't contain these elements:

- T4b's sweep found no unclassed `a` or `ul` in the three PDP descriptions.
- The archive content is one `<p>` with no lists or links.
- The opt-out page is mostly Shopify's widget.

So C4c.9 is invalid on every real page, whatever the build.

**Fix.** Run the per-element assertions on PXR only. On real pages, assert the wrapper's `font-size` and `line-height`, plus the elements Step 0 item 3's tag outline recorded, using the outline's counts as the expected counts.

### R5: REQUIRED (proxy can't run as written). `templates/index.json` has no image-banner text block

PXS says: "`templates/index.json`: the first image-banner heading block … and the first text block". `index.json` has only `heading` and `button` blocks (`block_order` `["heading","button"]`). The only image-banner `text` block is in `templates/product.landing-page.json`. So C4c.11's "text link … underline, thickness 1px, offset 3px" finds nothing. The run is invalid, and Step 14 stalls or the Coder improvises.

**Fix.** In the scratch `index.json`, add a `text` block with `"text": "Read <a href=\"#t\">more</a>"` and append its id to `block_order`. Or view `product.landing-page.json` through `?view=landing-page` on a fixture product and set its `text` block. Name the choice. Owner check 1 has the same gap on staging (the owner must add a text block, then discard it). Say so.

### R6: REQUIRED (owner-facing ⚑ text). Q4c.6's costs and its rejection of widget sizing rest on the wrong referents

1. **Focus rings.** §5.2, RC9 and Q4c.6 say "a focus ring drawn outside a link at the very start of a line loses its left 1-2 px; it stays visible on the other three sides". Two things are wrong.
   - The rings the theme draws on rich-text links don't exist today. Dawn's `*:focus-visible { outline: var(--focused-base-outline) }` (`base.css:720-724`) resolves to `0.2rem solid rgba(var(--color-foreground), 0.5)` (`:8`). `--color-foreground` is a hex (`snippets/css-variables.liquid:26`), so the declaration is invalid at computed-value time and the outline is `none` `[derived]`.
   - The rings that can be clipped are the widget's own controls, which Shopify's CSS styles. The widget starts at the box's left content edge. `overflow-x: auto` clips at all four padding edges (`overflow-y` computes to `auto`), not only the left. And Dawn's offset ring would be about 8 px, not 1-2 px.

   Step 0 item 5 should focus each widget control and record its outline and box-shadow extent against the box edges. Q4c.6 should state that measured cost.
2. **Reflow.** At 320-482 px the widget still needs sideways scrolling, inside the box. The fix removes page-level overflow but doesn't make the widget reflow (WCAG 1.4.10). Touch browsers show no scrollbar, so the hidden part (`X_in` 108 px at 375) has no affordance. Say both to the owner.
3. **"Sizing the widget" is rejected for the wrong reason.** §4.3 says the widget's CSS is "probably unlayered, so a layered utility would need `!`". That holds only for a property the widget's own CSS also sets. A layered `max-width: 100%` constrains an unlayered `width: 379px`, because they are different properties and `max-width` wins by definition. `!` is needed only if Shopify sets `max-width` or `min-width`, and the approach fails if a fixed-width descendant (an input) causes the overflow. Item 5 already records exactly this (inline style, matching rules, which properties). "Even then the container fix is kept" pre-decides it.

   **Fix.** Make widget sizing a conditional option in Q4c.6. If item 5 finds no unlayered `max-width`/`min-width` and no fixed-width descendant, present it with its real cost (dependence on Shopify's class name) and its real benefit (the field and button fit on phones). The container fix can stay recommended.

### R7: REQUIRED (owner-facing). Two merchant-visible rows aren't ⚑

- E4c.3: the archive description goes from `line-height: normal` to 1.75, which moves the whole card grid down.
- E4c.8: `prose` margins, line height and link weight apply inside Shopify's privacy widget (RC7: "likely").

Both are visible to merchants. Owner check 3 reviews only the ⚑ rows (E4c.1, E4c.2, E4c.5). Either mark both ⚑ and add them to owner check 3, or say why not.

### R8: REQUIRED (hand-off). Q4c.7 doesn't mention that T5 is set to reverse it

Umbrella §12 Steps ends with "add element-level typography (headings in `font-heading`) to `@layer base`". The plugin sets no `font-family` on headings. So that T5 base rule will turn rich-text headings into Oswald, silently reversing Q4c.7 ("body font"). Today the body font in rich text comes from the plugin not setting a font, and from Dawn's `font-family: var(--font-heading-family)` being invalid (the variable is `--font-heading--family`, `css-variables.liquid:21`).

**Fix.** Add the coupling to Q4c.7's owner text and to §14.4: T5 must either exclude `.prose` descendants from the base heading rule or adopt Oswald deliberately. Consider a U-c5 for umbrella §12.

### R9: REQUIRED (hand-off text). §14.2's claim about the index is false in the working tree

§14.2 says the T4b row "still reads 'Full addendum, Revision 2' … flagged to the orchestrator, not edited". §16 says only the T4c row was written. The working-tree index's T4b row (`docs/plans/theme-evolution-tailwind-t4.md:12`) reads "Revision 2.1, APPROVED … on staging … since 2026-10-23 12:03 UTC". Either the row was edited in this revision, or the claim was never true.

**Fix.** Correct §14.2 and §16 to match what is on disk. The header's "updated 2026-10-23 (T4b Revision 2, review R6)" is also stale.

### R10: REQUIRED (permanent rules text). Step 13's "add `max-w-none` in narrow columns" points the wrong way

In a narrow column `65ch` never binds, so `max-w-none` changes nothing. The plan uses it where the box must fill a column that can be as wide as, or wider than, `65ch`: the archive's centered 600 px header and the product column. That column exceeds `M_ch` with the `wide` page width, see N1.

**Fix.** Reword: "add `max-w-none` where the text must fill its column (product description, centered headers)". Also, "no base rule … restores list markers any more" is untrue while the scoped policy rule exists. Say "outside store policy pages".

### R11: REQUIRED (criterion's failure condition). C4c.17 is absolute, but Step 0 base dumps can be non-zero

C4c.17 requires `X_page` = 0 at seven widths "on every page in §10's table". T4b never measured `/policies/privacy-policy` or the PXS variants for overflow: its QA page list has no policy page. If base is already non-zero there, which is Shopify's markup and outside T4c's control, C4c.17 is red on a correct build.

**Fix.** State the pass as `X_page` = 0, or equal to Step 0 item 4's base value when that is non-zero and every `X_off'` offender lies outside T4c's markup. Record such pages as pre-existing.

## Nits (none blocks; each is conservative or a clarity fix)

- **N1. `W_pd` "below `M_ch` at every width" is setting-dependent.**
  - With the default `max_page_width` 90rem (`settings_schema.json:48`), `W_pd` caps at 494.
  - With the schema's `wide` option (110rem), it is (1720 − 160) × 0.45 − 64 ≈ 638 at 1920, above `M_ch`.

  So `max-w-none` is load-bearing there, and the plan picks it anyway (no decision changes). Fix the sentence in §0 and §5.6. Consider adding 1920 to C4c.8(b): it is the only width at which width can tell `max-w-none` from `65ch` (C4c.5(c) already checks the computed value).
- **N2. Policy fixtures.** Step 0 item 3 re-reads the sitemap, which doesn't list policies (that is why T4b recorded "no policy pages" while `/policies/privacy-policy` renders). Probe the standard handles directly: refund, privacy, terms-of-service, shipping, contact-information, legal-notice, subscription-policy. `selling-plans-ski-wax` has selling plans, so a subscription policy may exist. Feed every rendering one to C4c.15.
- **N3. C4c.15's `ol` clause.** The privacy policy may have no `ol` (the sweep shows only `ul`). Say the `ol` count may be 0, recorded by item 6, so the global non-vacuity rule doesn't invalidate the run.
- **N4. `W_pc` referent.** C4c.16(b) predicts `X_in` from the widget's border box. If a descendant overflows the widget, the box's scroll extent is larger. QA's three widths agree with 379, so the risk is low. Still, define `W_pc` as the furthest right edge in the widget's subtree relative to the box's content-left edge, measured on the end-state scratch. Item 5 currently says base; §0 says end state.
- **N5. The `M_ch` probe.** Insert the 65-zero span in a separate `prose` box, not inside the opt-out page's box during `X_in` or `X_page` runs, or it creates the overflow it measures.
- **N6. PXR construction details.**
  - The regex "class attribute of every `data-rich-text` element" can't capture the archive's outer wrapper, which has no hook. Name how the outer string is taken (the line before).
  - The "494 px box" and any other proxy-only class must either be a compiled class or come from a scratch rebuild. Say which, since a rebuild changes the CSS under test.
- **N7. PXS related-products heading.** It renders only after `product-recommendations` fetches, and only if the product has recommendations. Name the product and wait for the `h2`.
- **N8. Vertical clipping elsewhere.** `overflow-x-auto` makes every page-section rich-text box a scroll container in both axes. Extend C4c.16(b)'s `scrollHeight − clientHeight ≤ 1` (and `scrollWidth − clientWidth` = 0) to the balanced-face page and PXR's page copy. That backs §5.2's "measure and position don't change on any page".
- **N9. Inventory method.** Add `_html` locale keys to the sink inventory. `locales/en.default.json:133` and `:165-171` hold unclassed `<a>` (shipping and tax notes). None is used in theme markup today (I grepped), so nothing changes now, but a future use would silently lose its underline.
- **N10. Step 10 is one commit for two sections** (`article.liquid`, `password.liquid`). `CLAUDE.md:58` says "one section/snippet per commit when possible". Split it, or note why not.
- **N11. Gate breach and N1.** Step 1 doesn't depend on the plugin. On a breach, §4.1 commits nothing. Shipping N1 alone while the owner decides is an option worth listing.
- **N12. Overlays in the sweep.** Shopify's consent banner shows only in a context without consent cookies. Run one C4c.14 pass in a fresh context so any Shopify overlay with unclassed links is compared too.
- **N13. Scope of the container fix.** The rationale "also contains any wide merchant table or embed" applies equally to `article.content`. Keeping it page-only is a fine choice, but say it is a choice (C4c.16(d) enforces it).

## Answers to the orchestrator's specific questions

- **Budget gate (C4c.20).**
  - Sound. The end state is built in scratch, both budgets apply, and a breach stops for the owner with nothing committed.
  - Gzip is consistent: totals use the file method `M_gz`, and T4b's 13 B stdin offset is handled correctly (deltas are unaffected).
  - (b) "final = `P_end`" is a good drift guard.
  - Only R1's item-6 fallback is missing.
  - Plain `prose` only, enforced statically by C4c.4(d). D4c.14 is reasonable.
- **Plugin, layers and `base.css`.**
  - `@plugin` after the import is fine. `.prose` compiles into `@layer utilities` (measured in T4b), and `check-css-layers.mjs` checks only declared layers.
  - Utilities beat `legacy`, so Dawn's heading, `blockquote` and table `font-size: 1.4rem` rules lose wherever the plugin sets a property.
  - Where it doesn't, the plan's leak list is accurate. Dawn's `hr { border: none }` and the invalid `blockquote` `border-left` shorthand both leave the border style `none`, and D4c.11's two lines are the right fix.
  - Dawn's `table:not([class]) { border-style: hidden }` is harmless: the plugin already zeroes the last row's border.
  - On ordering: by Tailwind v4's property sort, `.prose` (lowest property a margin) should precede both `max-w-none` and `prose-tokens` (custom properties only, or border styles). The documented pairings should hold, and the fallback is a belt.
  - `prose-tokens` on `currentColor` updates live in the theme editor: `--color-foreground` is in plain `@theme`, and nothing in the chain is baked.
- **PDP.** The trigger spans set their own color, weight, decoration and offset as utilities, and the plugin has no `span` rule. Labelling C4c.10 a guard is honest. Q4c.2 is surfaced ⚑ with a byte-costed fallback.
- **N1.** `overflow-x-auto` is correct and, unlike `min-w-0` or a smaller inset, actually reaches `X_page` = 0. C4c.16 distinguishes it from every rejected option. It applies to every page rendered by `sections/page.liquid` (`templates/page.json` is the only page template besides `page.materials.json`), with no expected visual change where nothing overflows. The owner text needs R6. N8 adds a cheap check.
- **D6 removal coverage.** I re-ran the inventory:
  - every theme `a`, `ul` and `ol` is classed, except the footer copyright links (already `[&_a]:no-underline`) and the image-only gift-card link;
  - the `richtext` and `inline_richtext` settings are exactly the footer, the two image-banner blocks and the related-products heading;
  - `default_errors` appears only in the comment and password forms;
  - no JS creates unclassed links (`recipient-form.js` does, but nothing loads it);
  - the docs confirm `richtext` has no ordered list.

  The live probe is non-vacuous on the points asked: exact matching of all four rules by selector and declaration, both positive controls, fresh non-preview login, theme id and role on every page. The one gap is R2.
- **Policy selector.** It is resolvable. The privacy policy renders, and Shopify's usual `shopify-policy__body > .rte` chain matches the sweep's `div.rte > div > ul`. If it can't be resolved, the plan stops Step 11 but not Step 12 (R1).
- **Proxies.** Valid as evidence of the class strings' CSS behavior with `base.css` loaded, and generating PXR from the head files is a good anti-drift choice. They are not evidence of real editor output (inline styles, `<iframe>`, `<meta>`), and the plan says so (RC12, §14.3). R3 and R5 are construction defects. No criterion passes vacuously except by labelled design (C4c.10 guard; C4c.22 control-only when nothing is found, subject to R2).
- **Conventions.** Schemas byte-identical (C4c.2 covers the nine files). No option values renamed. Protected files touched only in scratch. Complete class strings. No new `{% stylesheet %}`/`<style>`. No Dawn class names (`base.css` has no `prose`, `lead` or `errors` rules). One `<h1>` is untouched. Theme-check predictions of 0 are plausible. The Step 1 comment's words aren't utility names. Steps are revertible as §12 describes.
- **⚑ and owner decisions.** Q4c.2, Q4c.6 and Q4c.7 are surfaced, not silently decided. Nothing reverses Q1-Q8 or Q10. The two-budget gate is correctly labelled the Architect's recommendation. R7 and R8 widen what the owner sees.

## Checked and found sound

- The referent table's discipline: border box vs ink, document vs inside-box overflow, file bytes vs stdin.
- The archive's nested wrapper (D4c.5). C4c.6's archive clause really separates `currentColor` from a foreground mapping (75 % vs 100 %).
- The footer list padding: `1.5em` at 14 px = 21 px, D6's exact value. Form-level variants avoid `div:empty`.
- §5.12's arithmetic and its consistency with T4b §15.3's range.
- The live-gate ordering, which pulls live's JSON before the push.

## Trajectory

This is the first round of a full addendum, and it starts in better shape than T4b's Revision 1 did. No blocker. Eleven local REQUIRED edits, four of them single sentences of owner-facing or hand-off text. Folding them in needs no new design and no new measurement beyond what Step 0 already does (R6 adds one focus probe to item 5). A second round should be short.

## Required changes

1. **R1.** Make Step 12 conditional on Step 11 being committed (or a written owner choice of Q4c.3 (b)). State which policy selector `P_end` uses if Step 0 item 6 can't resolve one.
2. **R2.** In C4c.22 and §5.13, the target set on every run is Step 0's recorded containers plus this run's discovered ones. A newly found container is probed. "No embed" requires this run's verified discovery to find none.
3. **R3.** Fix PXR's width referent: wrap the copies in a `.shopify-section` element in scratch, or state C4c.8(a) for proxies as `min(M_ch, parent content-box width)`.
4. **R4.** Limit C4c.9's per-element assertions to PXR. On real pages, assert the wrapper metrics plus the elements in Step 0's tag outline, with its counts.
5. **R5.** Give PXS a real image-banner text block: add one and its `block_order` entry to the scratch `index.json`, or use `product.landing-page.json` via `?view=`. Note the same need in owner check 1.
6. **R6.** Rewrite Q4c.6, §5.2 and RC9: the clipped focus rings are the widget's controls on up to four sides, not 1-2 px of theme link rings, which Dawn's invalid outline removes. Measure them in Step 0 item 5. State the remaining reflow limit and the missing touch affordance. Make widget sizing (`max-width`) a conditional option based on item 5's findings, with its correct cascade reasoning.
7. **R7.** Mark E4c.3 and E4c.8 ⚑ and add them to owner check 3, or justify not doing so.
8. **R8.** Add to Q4c.7 and §14.4 that umbrella §12's planned base heading rule (`font-heading`) would turn rich-text headings into Oswald. T5 must exclude `.prose` or adopt Oswald deliberately.
9. **R9.** Correct §14.2 and §16 about the index's T4b row to match the working tree, and refresh the index header date line.
10. **R10.** Reword the Step 13 bullet: `max-w-none` "where the text must fill its column (product description, centered headers)". "No base rule … restores list markers" except on store policy pages.
11. **R11.** Make C4c.17 pass when `X_page` equals a non-zero Step 0 base whose offenders lie outside T4c's markup, recorded as pre-existing.

APPROVE WITH CHANGES

---

## Round 2 (Revision 2)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. Plan Revision 2 (working tree, HEAD `e21d0a3`) and the T4 index.

I re-read the whole plan, the index's header and rows, `CLAUDE.md` on disk (`:58`, `:68`, `:70`, `:195-213`) and `AGENTS.md:192`. I re-verified, against files, the facts Revision 2 now leans on:

- `sections/image-banner.liquid:722-754`: the `text` block has `"limit": 1` and `text_style` values `body`, `subtitle`, `caption-with-letter-spacing`, default `body`;
- `templates/index.json` and `templates/product.landing-page.json` (block lists);
- `config/settings_schema.json:36-48` (`max_page_width` `90rem` default, `110rem` option);
- `assets/base.css:8, 720-724` and the absence of any Dawn `.shopify-section` rule that a scratch wrapper could pick up (`rg` finds only the `shopify-section-group-*` and `-header-*` variants);
- `snippets/css-variables.liquid:21, 26`;
- index lines 5 and 12-13.

### Summary

Revision 2 folds in all eleven required changes correctly. It also folds in all thirteen nits, and N10 is answered with a reason, which is acceptable. Nothing was renumbered, and no decision changed except Q4c.6's option list.

One new defect comes from the R4 fix itself. C4c.9(b) now asserts `prose` values for every element in a page's tag outline. On the opt-out page that outline is mostly Shopify's widget, whose unlayered CSS wins by design (E4c.8). That makes it a criterion that fails on a correct build. It is a one-clause fix. Everything else is a nit.

### Status of round-1 required items

| Item | Verdict | Where verified |
|---|---|---|
| R1 | **Closed.** Step 12 runs only if Steps 7-11 are committed, or Q4c.3 (b) is chosen in writing. Otherwise it waits, C4c.13 is "not run (gated)", and the D6 rules stay. Item 6 says Steps 11 **and** 12 wait. Items 6 and 8 and §4.1 put the placeholder `.shopify-policy__body` in the gate build | §13 Step 12, Step 0 items 6 and 8, §4.1 step 4 |
| R2 | **Closed.** Discovery runs on every run. The target set is the recorded containers plus everything discovered. A new container is probed and recorded. "No embed" means this run found none. The plan cites the re-enabled-embed case | §5.13 steps 3 and 7, C4c.22, §9.2, Step 0 item 13 |
| R3 | **Closed.** Each PXR copy sits in a scratch `<div class="shopify-section">`. The base-layer grid (`src/tailwind.css:212-228`) then gives 375 − 40 − 64 = 271. The parent-width precheck makes a wrong wrapper an invalid run, not a false red | §10 PXR, C4c.8(a) |
| R4 | **Closed, with a new defect: R2-1 below.** (a) covers PXR only; (b) covers real pages, driven by the outline | C4c.9, Step 0 item 3 |
| R5 | **Closed.** `t4cc_text` is added to `image-banner.blocks` and to `block_order` after `heading`. It is valid against the schema (`limit: 1`, and `body` is an option value). It lives **only in the scratch copy**: the PXS row is under "Proxies. Scratch copies outside the repo …", whose paragraph says "the repo's `config/settings_data.json`, `templates/*.json` and `sections/*-group.json` are never edited". Owner check 1 now tells the owner to add a text block and discard it | §10 PXS, owner check 1 |
| R6 | **Closed.** §5.2's costs, RC9 and Q4c.6 now say that theme link rings don't exist (Dawn's outline is invalid) and that the widget's controls can be clipped on up to four sides, measured by Step 0 item 5. Reflow (WCAG 1.4.10) and the missing touch affordance are stated. Option C (`max-width`) is conditional on item 5's findings, with the correct cascade reasoning (different property) and an honest cost (Shopify's class name, about 60 B). A remains recommended, and the plan doesn't apply C without instruction. **One survivor, N2-1** | §4.3, §5.2, RC9, Q4c.6, Step 0 item 5 |
| R7 | **Closed.** E4c.3 and E4c.8 are ⚑ and listed in owner check 3 | §8, §10 owner check 3 |
| R8 | **Closed.** Q4c.7's text, §14.4 and the new U-c5 (with a concrete `:not(.prose *)` exclusion) state the T5 coupling | Q4c.7, §14.1, §14.4 |
| R9 | **Closed.** §14.2 and §16 correct the claim. The index header (line 5) names T4c Revision 2, and the T4c row (line 13) says Revision 2 is addressing round 1 | §14.2, §16, index :5, :13 |
| R10 | **Closed.** The bullet reads "where the text must fill its column (the product description, centered headers)" and "outside store policy pages …". It also adds the `_html` translation keys (N9) | §13 Step 13 |
| R11 | **Closed.** C4c.17 passes at a non-zero Step 0 base ±1 when every offender lies outside an enumerated list of T4c markup. It is red above base or on an offender inside T4c markup. Both sides are stated | C4c.17, §9.2 |

All 13 nits are applied as the changelog says. I spot-checked these against the text:

- N1: the PXW arithmetic, min(1760 − 40, 1920 − 40) = 1720, then (1720 − 160) × 0.45 − 64 = 638, is confirmed.
- N2 and N3 (C4c.15);
- N5 (§0 `M_ch`, item 9);
- N6 (PXR never rebuilt, its `shasum` must equal head's);
- N7 (PXS waits for `product-recommendations h2`);
- N8 (C4c.16(b));
- N11 (§4.1);
- N12 (C4c.14);
- N13 (§5.2).

### Manifest: what I sampled and what I took on trust (round 2)

- **Sampled:** the Revision 2 changelog against each section it names; the "Facts re-verified" list in §16 (image-banner `text_style` values, `base.css:8`, `css-variables.liquid:21, 26`, `settings_schema.json:36-48`, the index's line 12); the PXW arithmetic; the R3 width arithmetic; the superseded-term sweep. The sweep missed one survivor (N2-1), because "can't override unlayered CSS without `!`" wasn't among its terms.
- **Taken on trust:** `locales/en.default.json:133, 165-171` and the zero hits for those keys (I confirmed both in round 1); the `templates/product.json:83` cite.

### Required changes (round 2)

#### R2-1: REQUIRED (criterion red on a correct build). C4c.9(b) asserts `prose` values inside Shopify's widget

Step 0 item 3's outline counts "element names and counts inside the rich-text wrapper". On `/pages/data-sharing-opt-out` the wrapper holds Shopify's privacy widget. C4c.9(b) then requires each outlined element type to "match its `R_prose` values". But the widget's CSS is unlayered (§3.2 item 1), so it beats `prose` wherever it sets a property. E4c.8 itself expects `prose` to apply only "where the widget's own CSS doesn't set them", and RC7 calls the change "likely". So any `p`, `a` or heading inside the widget that Shopify styles will differ from `R_prose`, and C4c.9(b) goes red on a correct build.

**Fix (one clause).** In C4c.9(b) and Step 0 item 3, exclude the subtree of Step 0 item 5's widget selector from the outline and the assertions. Those elements are recorded under E4c.8, before and after, not judged. If the opt-out page then has nothing outside the widget, only its wrapper metrics are asserted.

### Nits (round 2; none blocks)

- **N2-1. R6 survivor in §3.2 item 7.** It still says "A layered utility can't override unlayered CSS without `!` … So the fix has to change the **container**, not the widget". That contradicts §4.3's corrected reasoning and Q4c.6 option C. Reword it to "can't override the same property set by unlayered CSS without `!`; the container fix works whatever sets the width" and point to option C.
- **N2-2. N4 is half applied.** §0's `W_pc` row keeps "**border box**, not ink" in its Extent column, and "Readings that are easy to confuse" still says "`W_pc` is the widget's **border box**". Yet the measured referent is now the subtree's furthest right edge. Align both to the new definition.
- **N2-3. PXW precheck.** C4c.8(b)'s PXW clause tells `max-w-none` from `65ch` only if the parent width (≈ 638) exceeds Step 0's measured `M_ch`. `M_ch` is "about 600", but Work Sans could put it closer to 638. Make the clause invalid, not green, if the parent width is ≤ `M_ch` + 2. Name the PDP used (for example `the-complete-snowboard`).
- **N2-4. The focus probe in item 5.** "`focus()` plus a Tab key press" moves focus to the **next** control, so the recorded ring belongs to a different element. Instead, Tab from the element just before the box and record each control as it receives focus (`document.activeElement` with `:focus-visible` matching).
- **N2-5. `RT_FIX`'s wrapper `div`.** `RT_FIX` is wrapped in `<div data-t4cc-fixture="rt-content">`, so the plugin's `> :first-child` / `> :last-child` margin resets and `> ul > li` rules hit that `div`, not the content. PXR's first heading therefore keeps its 2em top margin, unlike real content. This doesn't break any criterion as written (C4c.9(a) checks a middle `p`). Put the marker on the copy's container instead of an extra `div`, or note the difference for owner check 3's screenshots.

### Trajectory (round 2)

Round 1 had 11 REQUIRED and 13 nits. Round 2 has 1 REQUIRED, a one-clause scoping fix to a criterion, and 5 nits. Severity and count are falling, no new design risk appeared, and nothing else in Revision 2 broke. After R2-1, this can close with a closeout entry rather than a full third round.

### Required changes (round 2)

1. **R2-1.** In C4c.9(b) and Step 0 item 3, exclude the subtree of Step 0 item 5's widget selector from the tag outline and the `R_prose` assertions. Record those elements under E4c.8.

APPROVE WITH CHANGES

---

## Closeout (Revision 2.1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. Plan Revision 2.1 (working tree, HEAD `e21d0a3`) and the T4 index's header and T4c row.

I read the Revision 2.1 changelog, then every passage it names in full: §0 `W_pc` and "Readings", §3.2 item 7, C4c.8, C4c.9, E4c.8, §10 PXR, PXP and PXW, `RT_FIX`, and Step 0 items 3 and 5. I also read the surrounding criteria (C4c.5-C4c.9) and the §9.2 rows for C4c.8 and C4c.9 for regressions. `CLAUDE.md` was re-read in round 2, and nothing in this revision touches a rule it governs.

### R2-1: closed

- **C4c.9(b)** now excludes "the subtree of Step 0 item 5's widget selector … from the outline and from these assertions". The widget's elements are "recorded under E4c.8, before and after, not judged". "If the opt-out page has nothing outside the widget, only its wrapper metrics are asserted."
- **Step 0 item 3** builds the outline "excluding the subtree of item 5's widget selector", and says "on the opt-out page, item 5 runs first so the selector is known". That closes the ordering dependency, since item 5 is numbered after item 3.
- **E4c.8** states the exclusion as well.

The criterion is now red on its named failures (plugin not loaded, wrong values on theme-reachable content) and green on a correct build where Shopify's unlayered widget CSS wins.

### Round-2 nits: all applied

| Nit | Verified |
|---|---|
| N2-1 | §3.2 item 7 now says "can't override the **same property** … though it can constrain a different one (a layered `max-width` limits an unlayered `width`)", and points to option C. It no longer contradicts §4.3 or Q4c.6 |
| N2-2 | §0's `W_pc` row (Extent: "the furthest right box edge … of any element in the widget's subtree, minus the rich-text box's content-left edge") and "Readings" (line 106) both use the subtree definition. Readings notes that it equals the border box only if nothing sticks out |
| N2-3 | C4c.8(b) and PXW name `/products/the-complete-snowboard` at 1920. The precheck "parent content width must exceed Step 0's measured `M_ch` + 2, or the clause is **invalid** … not green" is present in both places |
| N2-4 | Step 0 item 5 tabs from the element before the box, records each control "as it receives focus" with `matches(':focus-visible')` true (otherwise that reading is invalid), and stops when focus leaves the widget |
| N2-5 | `RT_FIX` has no wrapper `div`. It starts with `<h2 data-t4cc-fixture="rt-first">`. PXR's copies carry `data-t4cc-fixture="rt-content"` on the `prose` wrapper and hold `RT_FIX` directly. The root marker `rt` stays. In PXP, `rt-first` is the only marker. An attribute doesn't change `:first-child`, so the plugin's resets now hit the content as on real pages |

### Regressions

None found:

- No criterion, step, Δ row or decision was added or renumbered (still C4c.0-C4c.22, Step 0 + Steps 1-14).
- The non-vacuity rule still holds for PXR (root `rt` plus `rt-content`) and PXP (`rt-first`).
- C4c.12(c)'s injected error list and C4c.5(c)'s `max-w-none` wrappers are unaffected.
- The R1-R11 fixes from Revision 2 are intact where I re-read them: Step 12's gate, the probe's target set, the `.shopify-section` scratch wrapper with its 271 px precheck, and C4c.17's base allowance.

### Residual nits (cosmetic; no re-review needed)

- PXR's sentence "Each copy's `prose` wrapper (or, for the forms, the `<form>`) … holds `RT_FIX` directly" reads as if the forms also hold `RT_FIX`. Per the bullet above it, they hold only the injected error list. Either reading passes C4c.12(c), because `RT_FIX`'s lists would also get `disc` / 24 px. The Coder can follow the bullet.
- The index header (line 5) still names "T4c Revision 2". The T4c row (line 13) correctly says Revision 2.1.

### Trajectory

Required changes went from 11 to 1 to 0 across three passes, and severity fell each round. Nothing remaining affects a build, a gate or an owner decision. The plan is ready for the Coder once it and this review are committed (Step 0 item 1).

APPROVE
