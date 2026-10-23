# Plan review: theme-evolution-tailwind-t5b (Revision 1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `1f2a390`. The plan, the T5 index and T5a are untracked in the working tree.
Read: the plan (all 483 lines); the T5 index; T5a (§3, §4.2-§4.3, §5.3, §5.9-§5.10, §9, §13-§15); umbrella §12 and the Q table; T4c (D4c.9, Q4c.3, Q4c.7, §14.1 U-c5, §14.4); the T4c page-center follow-up; T4c impl notes; the T4c review (for format and rigor); T2 D2.8; `CLAUDE.md` and `AGENTS.md` on disk (`:191-214` / `:186-209`); `src/tailwind.css` (all); `assets/tailwind.css` (the D6, policy, Preflight `html`, `.font-sans`, `.mx-auto`, `.w-full` rules); `assets/base.css:243-270`; `layout/theme.liquid` (all); `templates/gift_card.liquid` (all); `snippets/css-variables.liquid` (all); `sections/page.liquid`; every heading tag in scanned Liquid (ripgrep, plus multi-line and `heading_tag` forms); every `prose` wrapper; `docs/qa/evidence/t4cc-overflow-base.json` and `t4cc-facts-base.json` (policy keys). Shopify Dev MCP: `learn_shopify_api` (Liquid) once; `search_docs_chunks` for `request.page_type`.

## Summary

The plan is sound in its core, and its decision structure is right. The line-height gate is real: Step 2 has no path to commit without a dated, written owner answer (§13 Step 0 item 6, Step 2, C5b.4(c)), and Steps 1 and 3 are independent of it. The heading rule, if chosen, excludes `.prose` descendants exactly as U-c5 requires, and option (d) is reserved to the owner. The policy condition `request.page_type == 'policy'` compares two strings, and `policy` is a documented value (confirmed through the MCP). Deleting the T4c and T5a policy rules goes in the same commit as the wrapper. The criterion that checks it (C5b.7(a)) matches on the selector, so it holds whatever shape T5a's extension takes. No recorded owner decision is reversed. I found no blocker.

Nine findings are REQUIRED:

- **Owner-facing rationale.** R1: the recommendation against a heading rule rests on a wrong reason. The nine headings are in the body font **for parity, with the decision explicitly handed to T5**, not by design. R8: Q5b.3 doesn't tell the owner that its recommendation makes the policy title the only page title that isn't set in the heading font.
- **Design.** R2: the policy wrapper repeats the page-center follow-up's documented first-attempt defect (no `w-full`). At 320 px this makes the theme's own wrapper the overflow offender, and the plan's padding branch would then make C5b.7(c) and C5b.8 impossible to satisfy together.
- **Criteria and evidence.** R3: C5b.5 fails on a correct build, because its allowance sets come only from state S0 while it compares the full state matrix. R4: the owner's screenshots never show two of the merchant-visible changes the plan names (the cart total, the tooltip title), nor any open state.
- **Process.** R5: the budget figure and the re-QA path when Step 2 lands late are undefined.
- **Rules and text.** R6: the layout comment breaks a `CLAUDE.md` rule that the plan claims it keeps. R7: the CSS budget table's upper bound, quoted in the index, is computed wrongly. R9: the convention that makes "no heading rule" safe isn't written anywhere an agent reads.

All of them are local edits. None changes the architecture or the recommendations.

## Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**

- `H_plain`. The ripgrep `<h[1-6][ >]` finds 29 lines (27 in `layout/sections/blocks/snippets`, 2 in `templates/gift_card.liquid`). The spotlight's `<{{ heading_tag }}` makes 30. 18 lines carry `font-heading` and 12 lack it (gift card 2, card-product 1, material-info 1, header 1, archive 1, tooltip 1, cart drawer 1, hello-world 3, spotlight 1). 18 + 12 = 30. With `image-banner.liquid:384-385`, whose tag and class are on separate lines, 19 headings use `font-heading`. Taking out the logo wrapper leaves 11 lines in 8 files. The opt-outs come to 9 lines in 7 files. There are no other dynamic heading tags (`<{{ heading_tag }}>` appears only in the spotlight).
- `S_lh` = 24 and `S_hd` = 80 (25 + 14 + 41), both recounted. The compiled `html{line-height:normal}` is a standalone rule, so §4.2's "exactly one" match is achievable. Preflight's `html,:host{…line-height:1.5…}` is present.
- T4c's part of `S_pol`: the compiled `.shopify-policy__body ul{…}` (46), `ol{…}` (49) and `a{…}` (55) rules add up to 150. Of T5a's figures, the 78 is right. The link extension `;text-underline-offset:.3rem;text-decoration-thickness:.1rem` is 60 characters, not 59 (N2).
- `CLAUDE.md:193`, `:197` and `:198`, and `AGENTS.md:188`, `:192` and `:193`, are at the cited lines, with the exact text §5.4 replaces. T5a §5.9 doesn't touch these lines.
- The `src/tailwind.css` line citations (`:180-185`, `:245-249`, `:273-287`, `:289-299`), `layout/theme.liquid:45`, and `snippets/css-variables.liquid:15`, `:21` and `:24`.
- `M_ch` = 646.88 px (T4c impl notes `:10`). It is the right referent: `prose`'s `65ch` resolved in the same 16 px body font that the policy wrapper would use.
- The policy chain and counts (T4c impl notes `:37`). The 5 px overflow at 320 px, whose offender is `div.shopify-policy__container l0 r325` (`t4cc-overflow-base.json:221-226`).
- `request.page_type` can return `policy` (shopify.dev `objects/request`, through the MCP).
- The index's T5b minified and gzip ranges, recomputed from T5a's range plus §5.5's net. The recommended-options rows match. The "any option" upper bound inherits R7.

**Sampled and found wrong:**

- §5.5's "range over all options" upper bound, +120 (R7).
- The §5.2 claim that the comment contains no single-word utility name (R6).
- The §9.2 claim that C5b.4(a) and C5b.3 tell a `body` rule apart from deleting the `html` rule (N1).
- The "body font by design" framing of the nine headings (R1). The manifest doesn't list this one; I sampled it because the recommendation rests on it.

**Taken on trust:** T5a §5.10's projections; every gzip delta; the Selectors 4 specificity and CSS Fonts 4 matching quotes (my own reading agrees with both); T5a's `W_sw` widths and harness names.

**Not covered by the manifest, so reviewed in full:** how the wrapper sizes as an auto-margined flex item (R2); the states the allowance sets and the screenshots cover (R3, R4); the history of the body-font headings (R1); the rules text under the recommended options (R9); the late-Step-2 path (R5).

## Blocking issues

None.

## Required changes

### R1: REQUIRED (owner-facing). The nine `H_plain` headings are in the body font for parity, handed to T5, not "by design"

§1 item 2, D5b.2, §3.2 and Q5b.2 (c) all say the nine are "body-font headings by design". The record says the opposite:

- T2 D2.8 (`docs/plans/theme-evolution-tailwind-t2.md:328`): "Spotlight, material-info and card titles keep the body font (**parity**). Element-level heading typography for the whole site is **T5's job** (umbrella §12)."
- The parity being preserved was itself an accident. Dawn's `h1`-`h5` rule asks for `font-family: var(--font-heading-family)` (`assets/base.css:252-263`), but the theme prints `--font-heading--family`, with a double hyphen (`snippets/css-variables.liquid:21`). The declaration is therefore invalid at computed-value time, and the headings inherit the body font (T4b §3.2 item 3; T4c §14.4).

Nobody ever chose the body font for the card titles, the cart total, the spotlight, the tooltip or the home cards. Each conversion kept it so the diff stayed clean, and T2 explicitly passed the choice to this phase. The recommendation, option (c), may still be the right one. But the reason given to the owner is false, and it is the reason most likely to decide the question.

There is a second problem. Under (c), staging shows nothing (E5b.2 and E5b.3 don't change), so owner check 2 offers nothing to judge. The question can close without anyone answering it, which is the "silently decided" outcome U-c5 and the index's U-t5-5 exist to prevent.

**Fix.**

- Reword §1 item 2, D5b.2, §3.2 and Q5b.2 (c): the headings are in the body font "for parity since T2 (D2.8), because Dawn's heading-font variable never resolved; T2 left the choice to T5". Keep the recommendation if the Architect still holds it, on its real merits: zero bytes, and no restyling of Shopify or app headings.
- Make Q5b.2 require an **explicit** owner answer before the live push (at owner check 1, on V2 and V2a, or at owner check 2). Record it in the impl notes with its date, as for Q5b.1. Coding can still proceed on the recommendation.

### R2: REQUIRED. The policy wrapper needs `w-full`; without it, 320 px fails C5b.8, and the padding branch fights the overflow criterion

§5.2's wrapper is `prose prose-tokens mx-auto`, a direct child of the flex-column `body` (`src/tailwind.css:180-185`). An auto-margined flex item isn't stretched. It is sized to fit its content. This project already learned that on this very shell: `docs/plans/theme-evolution-tailwind-t4c-page-center.md:18` says "`w-full` is required … an auto-margined flex item shrinks to its content: a first attempt (`mx-auto box-content max-w-prose`, no `w-full`) … grew the opt-out page to the widget's 379 px on phones", and `sections/page.liquid:8` keeps the lesson in a comment. Consequences:

1. §5.2's "At phone widths the wrapper is the full body width" doesn't follow. The width is `min(max-content, max(min-content, available))`, capped by `65ch`.
2. At 320 px the policy container is already 325 px wide (`l0 r325`). That is consistent with the same shrink-to-fit sizing on Shopify's own container, with a min-content of 325 px. The wrapper inherits that min-content, so it becomes 325 px wide and **becomes the overflow offender**. It is theme markup, and C5b.8 applies C5a.18's rule ("every offender lies outside theme markup"), so C5b.8 goes red at 320 even though `X_page` stays at 5. The fault is in the plan's design, not in the build.
3. §5.2's padding branch (add `px-(--page-margin)` if the text's left edge is under 15 px at 320 or 375) widens that min-content box by about 30 px at 320. That raises `X_page` above base, which C5b.8 marks red. In that case C5b.7(c) (left edge ≥ `--page-margin`) and C5b.8 can't both pass, and the plan doesn't say which one wins.

**Fix.**

- Add `w-full` to the wrapper. It is already compiled, so it costs 0 B. Use the same markup in §5.6's live probe.
- Step 0 item 5 records on V3, and on base, the container's computed `margin`, `padding`, `max-width` and `width`, and the text node or element behind the 325 px min-content.
- State the order of precedence. If the padding branch raises `X_page` at 320 above base (5 ± 1), or creates a theme-markup offender, the Coder stops with a coder question. Don't ship either criterion red. A fix may be offered for the owner to approve, for example `wrap-break-word` on the wrapper, which with a definite width would also remove the pre-existing 5 px. C5b.7(c)'s width clause then becomes exactly `min(M_ch, body width)` ±1 at every width, including 320.

### R3: REQUIRED. C5b.5 fails on a correct build: its allowance sets are S0-only, but it compares the full state matrix

C5b.5 compares HEAD against base "on T5a's §4.3 matrix at 375 and 1440". That matrix includes states S1-S7 (T5a §4.3: the drawer open, empty and with an item; the mobile menu; the accordion with its API content; the tooltip; the consent overlay; add-to-cart in flight). C5b.5 accepts a `line-height` or `font-family` difference only on an element of Step 0's `A_lh` or `A_hd`. Step 0 measures those sets only on page loads at S0 (§13 Step 0 items 3-4, §4.2). Elements that exist only in other states are absent from the sets:

- the accordion story, which loads from the API in S4;
- the tooltip, fetched on hover through the Section Rendering API in S5 (`assets/eco-tooltip.js:48`, `section_id=material-tooltip`), including heading #7;
- Shopify's consent banner, in S6 (the cached-session contexts carry consent cookies);
- the drawer's line items and the cart total, heading #8, in S2 on `/`.

Under Q5b.1 (a), every one of these inherits `1.5`, as intended, and C5b.5 reports each as unexplained. Under Q5b.2 (a) or (b), the same happens to #7 and #8 for `font-family`. Two smaller gaps:

- `NZ`, which C5b.5 and §9.2 depend on, has no Step 0 item. T5a's `NZ` was measured on a different base, so it can't be reused.
- "Other than rect, position and size" is open-ended. Under (a), box heights change, so properties resolved from box size, such as `height`, `block-size`, `transform-origin` and `perspective-origin`, also differ on many elements.

**Fix.** Measure `A_lh` and `A_hd` on the same (page, state, width) matrix C5b.5 compares. Alternatively, replace the set allowance with a mechanism allowance. For line height: the base value is `normal` and the head value is 1.5 × the element's own font size ±0.01 px, on an element with no author `line-height` declaration of its own. For headings: the element matches the rule, the base family is the body font and the head family is the heading font. Add an `NZ` item to Step 0: base loaded twice on T5a's final tree, over the same matrix. List the size-derived properties C5b.5 ignores.

### R4: REQUIRED (the owner gate's evidence). The screenshots don't show what the owner is asked to judge

§4.2's screenshot set is full pages at S0 only. For Q5b.1, the owner never sees the line-height change on the surfaces most likely to break: the drawer with items (quantity input, prices, the total), the open mobile menu, the tooltip, the accordion and Shopify's consent banner (RB2's "fixed-height component" risk lives there). For Q5b.2, E5b.3 lists "spotlight, tooltip, cart total" as visible changes under (b), but the tooltip title (#7) appears only in S5 and the cart total (#8) only in S2. Neither appears in any V2 or V2a screenshot. Q5b.1 (c) ("another value the owner names, after seeing V1") has no variant at all, so the owner would commit to a value nobody has rendered.

**Fix.**

- Add T5a's states S1-S6 at 375 and 1440 to the V0, V1, V2 and V2a screenshot sets.
- If the owner names a value under (c), render it as a new variant, V1c, at the same pages, states and widths, and show it before Step 2. The alternative is to say plainly that the owner first sees it on staging, and that Step 2 is then provisional until owner check 2.
- Optionally, limit V3 to the policy page plus one control page. It changes nothing elsewhere, and this cuts RB8's request load by about a fifth.

### R5: REQUIRED (process). The budget figure and the late-Step-2 path are undefined

§4.1 builds `P_endb` "for the options chosen (the owner's, or the recommendations)", and C5b.9(b) requires the final file to equal it. RB1 lets T5b go to QA without Step 2. If `P_endb` was built with the recommended option (a), C5b.9(b) is red on a build that correctly left the D6 rule in place. The plan also never says what happens when the owner answers Q5b.1 after QA or after staging. It doesn't name the criteria to re-run (C5b.4, C5b.5's line-height clause, C5b.8-C5b.10, C5b.13), and it doesn't say that staging must be re-pushed, owner check 2 repeated, or that the live gate applies again. As written, a late Step 2 could reach live through a T5b QA verdict that never tested it.

**Fix.** Build `P_endb` for exactly the steps that will be committed before QA, and rebuild it if Step 2 is added. Add a "late Step 2" paragraph to §13: Step 2 alone, then those criteria re-run, a staging re-push, owner check 2 for E5b.1, and a fresh C5b.13 before live.

### R6: REQUIRED (`CLAUDE.md` rule). The layout comment contains a single-word utility name, which the plan says it doesn't

§5.2's comment `{% # Shopify renders store policies without theme classes; prose styles them like page content. %}` contains `prose`. `layout/` is scanned, and `CLAUDE.md:200` says "keep single-word utility names out of comments". §5.2 states "The comment contains no single-word utility name". The comment adds no bytes today, because `.prose` is already compiled, but the claim is false and the rule is a hard rule.

**Fix.** Reword the comment, for example "Shopify renders store policies without theme classes; the typography plugin styles them like page content." Keep the claim only once it is true.

### R7: REQUIRED (a figure reaching the index). §5.5's upper bound is mis-added

The "range over all options" maximum of +120 adds the wrapper padding's +40 to the heading rule's +80. But the +40 exists only under Q5b.3 (b), which also deletes `S_pol` (−287). The manifest says it directly: "range up to +80 + 0 + 40 = +120". The true maximum is +80, with Q5b.2 (a) or (b), Q5b.1 (b) and Q5b.3 (a). The index repeats the error ("T5b (any option) 58,118 to 58,748"; it should be 58,708). The error is in the conservative direction and changes no decision. It is REQUIRED only because the figure is published in the index and in this plan's §5.5. **Fix:** +80 in §5.5 and the manifest, 58,708 in the index.

### R8: REQUIRED (owner-facing). Q5b.3 hides that the policy title would become the only page title not set in the heading font, and misses a cheap alternative

Under (b), Shopify's policy `<h1>` takes `prose`'s `h1` style: 2.25em, weight 800, body font. The plan treats keeping it out of a heading rule as following Q4c.7 (§5.2, last bullet). But Q4c.7 is about **rich-text headings inside content**. The policy title is the page's title, the counterpart of the `font-heading text-3xl leading-tight font-bold uppercase md:text-4xl` string that all 12 other theme `<h1>` lines use (search, product, collections, cart, blog, 404, page, home, archive, password, article and collection). After (b), `/policies/*` would be the one template whose title is in the body font. The owner should know that before choosing.

Two smaller points. E5b.4's "weight 800" renders with the 700 face, because the body font loads only its 400 and 700 faces (`css-variables.liquid:10-13`); the same applies to `prose`'s weight-500 links, which render at 400. And the alternative the plan doesn't consider: element modifiers on the wrapper only, such as `prose-h1:font-heading prose-h1:font-bold prose-h1:uppercase prose-h1:text-3xl md:prose-h1:text-4xl prose-h1:leading-tight`. These give the title the template string and leave body headings in the body font. They are element variants, not the size, invert or color modifiers `CLAUDE.md:198` prices in kilobytes. Expect a few hundred bytes; Step 0 measures it.

**Fix.** State the title inconsistency in Q5b.3 (b)'s "Cost" and in E5b.4. Offer the `prose-h1:` variant, or simply note it as rejected with the reason, and either way show the title in V3's screenshots. Say "renders with the 700 face" next to "weight 800".

### R9: REQUIRED (rules text). Under the recommended (c), the convention it relies on is written nowhere an agent reads

Q5b.2 (c) argues "New headings keep declaring their font, which is the existing convention." Neither `CLAUDE.md` nor `AGENTS.md` says so. `:197` lists `font-heading` as a token, and the Text block example happens to use it. A Dawn-trained or Tailwind-trained agent will expect a bare `<h2>` to pick up the heading font, as Dawn's rule tried to do. §5.4 adds rules text only for (a) and (b). The same gap exists under Q5b.1 (b) and (c): nothing would tell an agent that Preflight's `1.5` is overridden on purpose.

**Fix.** Under Q5b.2 (c), append to the "Use the theme tokens" bullet: "Headings have no base font rule: give every heading `font-heading`, or `font-sans` for body-font headings." Under Q5b.1 (b) or (c), add one sentence to the intro paragraph naming the root line height and where it is set. Extend C5b.14 to check them.

## NITs (none blocks a build)

- **N1.** §9.2 claims C5b.4(a) and C5b.3 distinguish "deleting the rule" from the rejected "line height on `body`". They don't. A build that deletes the `html` rule and adds `body { line-height: 1.5 }` passes both, and C5b.5 too. The alternative is near-equivalent, so nothing breaks. Add to C5b.4(a): "and no compiled rule other than Preflight's sets `line-height` on `html`, `:root` or `body`".
- **N2.** In `S_pol`, T5a's 59 is 60. The difference is too small to matter.
- **N3.** Step 1 under (a): commit the `font-sans` opt-outs **before** the rule. `.font-sans{font-family:var(--font-primary--family)}` is a no-op without the rule. With this order, no intermediate commit restyles nine headings, and reverting the rule commit alone is a clean rollback. §12's "Step 1: … Independent" is really eight commits under (a).
- **N4.** An alternative to the two dangling-`div` `if`s: `{%- if request.page_type == 'policy' -%}<div …>{{ content_for_layout }}</div>{%- else -%}{{ content_for_layout }}{%- endif -%}`. It creates no dangling element for the parser or for `UnclosedHTMLElement`, and it reads in one place. The output is the same.
- **N5.** §5.6's Q5b.3 control ("the wrapper's own presence") proves the insertion, not that `prose` applies on live. Use the wrapper's computed `max-width` (646.88 px ±1) as the control.
- **N6.** C5b.7(c)'s "policy text's left edge" should name its measurand, for example the minimum `left` of the rects of the text-bearing descendants of `.shopify-policy__body` and the title.
- **N7.** Under (a) or (b), `:not(.prose *)` selects a Tailwind (plugin) class name, which reads against `CLAUDE.md:203`. It is the right referent: `data-rich-text` is a hook that carries no CSS, and the policy wrapper doesn't carry it. Say so in the rule's comment, so a later reviewer doesn't "fix" it.
- **N8.** The letters move between plans. Q5b.3 (b) is T4c's Q4c.3 (c), while T4c's (b) was the WCAG-failing "accept the Δ". In the coder-questions file, write each option's words next to its letter, so a relayed "b" can't be misread.
- **N9.** The owner's written answers (Q5b.1, and Q5b.2 per R1) should be the owner's words, quoted verbatim, either relayed by the orchestrator or written by the owner. A recommendation repeated by an agent doesn't count. C5b.4(c) already says "quote". Say "verbatim".
- **N10.** Under (a) or (b), #5 (the logo wrapper `h2`, `leading-none`) may still move its `font-heading` span by a pixel through the strut's baseline. That is why it was "[derived]"; `A_hd` and the screenshots will show it.

## Approach check (the decisions themselves)

- **The Q5b.1 gate is real.** No step applies the line-height change without the owner's written choice (header gate 1, §13 Step 0 item 6, Step 2, C5b.4(c)). After R4 and R5, the owner will also see the evidence the umbrella asks for, and a late answer can't reach live untested.
- **Departing from umbrella §12 is surfaced as an owner question** (Q5b.2, U-t5-5, §15.1). It isn't silently decided, but R1 is needed so the owner decides on accurate facts, and so the question can't close without an answer.
- **Rich-text headings stay in the body font** under every option except (d), which belongs to the owner alone. C5b.6 tells exclusion from inclusion on PXR (at least 2 headings found), and it is two-sided.
- **Policies:** the Liquid is correct. C5b.7(a) and (b) are two-sided (one on the policy page, none elsewhere, and a 0 on the policy page is red). Deleting the scoped rules in the same commit leaves nothing styled twice. R2 is the one design defect.
- **Commits and rollback:** one commit per step, each revertible (Step 3's wrapper and rule deletion revert together). All E-rows that change pixels are ⚑. Both budget units are gated (C5b.9(a)), and R5 fixes C5b.9(b)'s referent.

## Required changes (numbered)

1. R1: correct the "body font by design" framing to "parity since T2 D2.8, decision handed to T5" in §1, D5b.2, §3.2 and Q5b.2, and require an explicit, dated owner answer to Q5b.2 before the live push.
2. R2: add `w-full` to the policy wrapper (§5.2 and §5.6). Step 0 item 5 records the container's computed margin, padding, max-width and width and the cause of its 325 px min-content. State that a padding branch which raises `X_page` at 320 above base, or creates a theme-markup offender, stops with a coder question.
3. R3: measure `A_lh` and `A_hd` on the same (page, state, width) matrix C5b.5 compares, or replace them with the mechanism allowance. Add an `NZ` item to Step 0. List the size-derived properties C5b.5 ignores.
4. R4: add states S1-S6 at 375 and 1440 to the V0, V1, V2 and V2a screenshot sets. Render a V1c variant before Step 2 if the owner names another value, or declare Step 2 provisional until owner check 2.
5. R5: build `P_endb` for exactly the steps that will be committed before QA. Add the late-Step-2 path (criteria re-run, staging re-push, owner check 2, C5b.13).
6. R6: remove `prose` from the layout comment and correct §5.2's claim.
7. R7: the §5.5 and manifest upper bound becomes +80; the index's "any option" figure becomes 58,708.
8. R8: in Q5b.3 (b) and E5b.4, state that the policy title would be the only page title in the body font. Offer or reject the `prose-h1:` variant. Note the 700 face.
9. R9: add the rules-text sentence for Q5b.2 (c), and for Q5b.1 (b) or (c), with C5b.14 extended to check them.

APPROVE WITH CHANGES

---

## Round 2 (Revision 2)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `1f2a390`; plans untracked.
Read: T5b Revision 2 (all 568 lines); the T5 index (updated); T5a Revision 2 (changelog, §4.1, §5.3 Step 2 parity block, §5.10, D5a.19, Q5a.5, manifest); T4c §2 (non-goals) and C4c.4; `CLAUDE.md` on disk `:191-214`, re-read for this pass.

### Summary

Revision 2 deals with every round-1 finding properly, and none was declined. R1-R9 and N1-N10 are each fixed in the plan's text, not just mapped in the changelog (verification below). The findings are getting smaller: 9 REQUIRED in round 1, 2 REQUIRED here. Both are one-line fixes:

- R10 comes from T5a Revision 2, written in the same round: T5b's Step 3 now deletes a T5a rule without replacing what it did.
- R11 came in with the N1 fix: the new clause in C5b.4(a) goes red on a correct build under Q5b.1 (b) or (c).

Neither changes a decision or a recommendation. Once both are in, the plan is ready for the Coder. A third round only needs to check those two edits.

### Verification of round-1 items

| Item | Verified in | Result |
|---|---|---|
| R1 | §1 item 2, §3.2, D5b.2, Q5b.2 "What is being decided" (quotes T2 D2.8 `:328` and the `--font-heading-family` / `--font-heading--family` mismatch); gate 2; C5b.6(d); §10 owner check 1; §13 Step 0 item 6 and the live gate; index line 51 | **Closed.** I swept for "by design": it no longer appears anywhere in reference to the headings. Q5b.2 can't close without the owner's answer, quoted verbatim and dated |
| R2 | §5.2 block (`prose prose-tokens mx-auto w-full`), its `w-full`, 320 px and precedence bullets; §5.6; C5b.7(c) (320 included, plus the stop-and-ask clause); Step 0 item 5; RB3 | **Closed.** I re-derived the sizing: with `width: 100%` the cross-axis size is definite, so the wrapper is 320 px wide at 320 whatever the content's min-content. The `wrap-break-word` figure `.wrap-break-word{overflow-wrap:break-word}` = 16 + 26 = 42 checks. It is a Tailwind v4.1+ utility, and the project pins 4.3.x. See n4 |
| R3 | §0 (`A_lh(p,s,w)`, `A_hd(p,s,w)`, `NZ_b`, `SZ`); §4.2 (full matrix, mechanism allowance); C5b.5; Step 0 items 3, 4, 4a; RB9 | **Closed.** The mechanism allowance goes red where it should: an element with its own line height doesn't read `normal` at base, and opted-out headings carry `font-sans`. See n5 for one gap in `SZ` |
| R4 | §4.2 screenshot list (S1-S6 at 375 and 1440; V1c; V3 and V3h limited); §10 owner checks 1-2 | **Closed** |
| R5 | §4.1; C5b.9(b); C5b.4 "not run (gated)"; §13 "Late Step 2" (5 steps, plus "A T5b QA verdict reached without Step 2 never covers a later Step 2"); RB1 | **Closed** |
| R6 | §5.2 comment | **Closed.** I checked every word: none is a single-word utility, and `w-full` appears exactly as in the class string beside it, already compiled |
| R7 | §5.5, §16, index rows 35-37 | **Closed, and the arithmetic checks:** `S_pol` = 150 + 78 + 60 + 62 + 46 = 396, or 491 with T5a's conditional 95 (all five figures match T5a §5.10:528 and Q5a.5); recommended net = −24 − 491 = −515 and −24 − 396 + 40 = −380; maximum over every option except (b+) = +80, with Q5b.3 (a). Index: 58,662 − 515 = 58,147; 58,922 − 380 = 58,542; **58,922 + 80 = 59,002** ✓; gzip 11,174 − 170 = 11,004, 11,369 − 100 = 11,269, 11,369 + 50 = 11,419 ✓. (b+): −24 − 396 + 40 + 950 = +570, giving 59,492 ✓ |
| R8 | §4.4, §5.2 (title and (b+) bullets), E5b.4, Q5b.3 (b) and (b+), C5b.7(d), §5.4 (b+) rules exception, V3h | **Closed.** Not recommending (b+) is well founded: T4c's non-goal names "element modifiers (`prose-headings:…`)" explicitly (`docs/plans/theme-evolution-tailwind-t4c.md:135`), and C4c.4 guards it. The faces (700 for 800, 400 for 500) match `css-variables.liquid:10-13` |
| R9 | §5.4 (line-height sentence on all three branches, heading sentence on (c) and on (a)/(b), policy and (b+) exceptions); C5b.14 | **Closed** |
| N1-N10 | changelog rows; C5b.4(a), §9.2's last paragraph, §5.3/§12/§13 Step 1 order, the §5.2 `if`/`else`, §5.6 control, C5b.7(c) measurand, §5.1 comment, Step 0 item 6, C5b.4(c)/C5b.6(d), §3.2 #5 | **All closed**, except that N1's new clause introduces R11 |

### Manifest: sampled and taken on trust

**Sampled and confirmed:**

- The `S_pol` components against T5a's own text.
- Every §5.5 and index sum, in both units.
- The 42 B `wrap-break-word` figure.
- The T4c non-goal and the `CLAUDE.md:198` wording that (b+) depends on.
- The body-font faces in `css-variables.liquid:10-13`.
- That the superseded terms are gone: "by design" for the headings, "+120", "287" and a wrapper string without `w-full`.

**Taken on trust:** `S_ph` ≈ 750-950 (Step 0 measures it); every gzip delta; the claim that `prose-h1:` variants outrank the plugin's `h1` rule (V3h checks it, and Tailwind normally orders variant utilities after the plugin's base rules).

**Not in the manifest, reviewed in full:** the interaction between T5a Revision 2's new rules and T5b's Step 3 deletion list (R10); the branch coverage of the new C5b.4(a) clause (R11).

### Required changes (round 2)

#### R10: REQUIRED. Step 3 deletes T5a's policy-body `:empty` rule and puts nothing in its place

T5a Revision 2 adds D5a.19 (Q5a.5, ⚑, recommended (a)): empty elements in merchant HTML stay hidden. The rule is `[data-rich-text] :where(div, a, ul, dl, section, article, h1, h2, h3, h4, h5, h6):empty { display: none }`. If T5a's Step 0 finds an empty element in the policy body, T5a also adds a twin with `.shopify-policy__body` in place of `[data-rich-text]` (T5a §5.3:433). T5b Step 3 deletes "every rule whose selector starts with `.shopify-policy__body`", so the twin goes too.

The new wrapper carries `data-policy-prose` but not `data-rich-text`, so the surviving `[data-rich-text]` rule doesn't reach the policy body. Under `prose`, an empty heading then takes the plugin's heading margins: the visible gap Q5a.5 exists to prevent. Nothing would catch it. C5b.5 allows every difference inside `[data-policy-prose]`, C5b.7 doesn't look at empty elements, and §8 has no row for it. The effect is conditional (only if the twin was committed) and small, but it silently undoes what Q5a.5 provides, on the one page T5a found it needed.

**Fix (pick one, then record it):**

- (a) Put `data-rich-text` on the policy wrapper as well. The existing `[data-rich-text]` rule then covers the policy body at 0 B. It is consistent, because policy bodies are merchant HTML. Update §5.1's heading-rule comment ("the policy wrapper hasn't it"), and note that QA harnesses which count `[data-rich-text]` boxes now find one on the policy page.
- (b) Accept the change: add an ⚑ E-row and a clause in Q5b.3 (b) saying empty policy-body elements become visible, conditional on T5a having committed the twin.

Either way, C5b.7(c) gains a check: when T5a committed the twin, every `:empty` element in the policy body (from Step 0's list) computes `display: none` under (a), or is listed under (b).

#### R11: REQUIRED (a criterion that fails on a correct build). C5b.4(a)'s new clause fails under Q5b.1 (b) and (c)

N1's addition reads: "and no compiled rule other than Preflight's `html,:host{…}` sets `line-height` on `html`, `:root` or `body`". Under (b) the same criterion **requires** `html{line-height:normal}`, and under (c) `html{line-height:<value>}`. Each is a compiled rule, other than Preflight's, that sets `line-height` on `html`. So C5b.4(a) is red on a correct (b) or (c) build. Only (a), the recommendation, passes. The owner may well choose (b), and QA would then be red on correct code.

**Fix:** "… other than Preflight's `html,:host{…}` and, under (b) or (c), the one D6 `html` rule …". Make the §9.2 row's "Green on a correct build?" say so.

### NITs (round 2; none blocks a build)

- **n1.** The flowchart's Step 3 node, the §3.1 `layout/theme.liquid` row and the §5.2 heading still say "(only if Q5b.3 = b)" without "(b+)". Elsewhere (§5.1 Step 3, §6, C5b.7) they include it. This does no harm, because (b+) contains (b).
- **n2.** The header (line 8) says T5a is "not edited in this round" and that the 60-character figure is "flagged for T5a's own review instead". T5a Revision 2 was written in the same round and already carries 60 (T5a §5.10:528, "review N2 of T5b"). The changelog's R7 row describes it correctly. Correct line 8.
- **n3.** §9.2's C5b.7 row says a missing `w-full` is "red at 1440 on a short policy". This store has no short policy: the privacy policy is long, so its fit-content width at 1440 is already 646.88. On this store the discriminating width is 320 only. That is still enough to discriminate.
- **n4.** §5.2's 320 px bullet says "the offender is still Shopify's container". With `w-full`, the container becomes a block child of a 320 px wrapper and fills it, so any remaining offender is a Shopify descendant (the long word), or there is none. C5a.18's "outside theme markup" condition holds either way, and `X_page` at 0 is also green.
- **n5.** `SZ` covers widths and insets but not the resolved `margin-left`/`margin-right` of auto-margined elements. If a short page (404, empty cart, search with no results) grows past the viewport height under 1.5 and a classic scrollbar appears in the harness's browser, the body narrows by the scrollbar's width, and those resolved margins change. Either add `margin-*` (for auto margins) to `SZ`, or record the scrollbar mode in the harness so a shift caused by a scrollbar can be recognized.

### Required changes (numbered, round 2)

1. R10: when T5a committed the policy-body `:empty` twin, keep empty policy-body elements hidden after Step 3 (`data-rich-text` on the wrapper, recommended), or record their reappearance as an ⚑ E-row and a cost of Q5b.3 (b). Add the matching C5b.7(c) check.
2. R11: exempt the D6 `html` rule under Q5b.1 (b) or (c) from C5b.4(a)'s "no other compiled rule" clause, and update §9.2.

APPROVE WITH CHANGES

---

## Closeout (Revision 2.1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `1f2a390`; plans untracked.
Read: the Revision 2.1 changelog and every section it names (§0 `SZ`, §5 flowchart, §3.1, §5.1 Step 1 comment, §5.2 block and bullets, §5.6, C5b.4, C5b.7, §9.2 rows C5b.4/C5b.7/C5b.8, §10 setup, §16 Revision 2.1 checks); T5a Revision 2.1 (header, changelog N2-4, §5.3:448, §5.9 T8).

### Verification

| Item | Where | Result |
|---|---|---|
| R10 | §5.2: the block is `<div class="prose prose-tokens mx-auto w-full" data-rich-text data-policy-prose>`, plus the new `data-rich-text` bullet; §5.6: the live-probe wrapper also carries `data-rich-text`; §5.1: the heading-rule comment is rewritten (it no longer says the policy wrapper lacks the attribute, and the reason now given, ".prose is what makes a box one of them", is true); C5b.7(c): the new "Empty elements" clause, with "at least 1" when T5a committed its twin and "not applicable" otherwise; §9.2's C5b.7 row is red when `data-rich-text` is missing while the twin exists | **Closed.** The mechanism holds. T5a's `[data-rich-text] :where(…):empty` is a descendant selector with specificity (0,2,0) in `base`. `prose` sets no `display`, so the policy body's empty elements stay hidden after Step 3 deletes the twin. The clause is two-sided and can't pass vacuously. The live probe is consistent: it disables every `.shopify-policy__body` rule, and the wrapper's attribute brings in live's compiled `[data-rich-text]` rule. 0 B, so `S_pol`, §5.5 and the index are unchanged |
| R11 | C5b.4(a): "other than Preflight's `html,:host{…}` and, under (b) or (c), the one D6 `html` rule required above"; §9.2's C5b.4 row: "yes on every branch" | **Closed.** It is green on (a), (b) and (c), and still red on an added `body { line-height }` rule |
| n1 | flowchart "(only if Q5b.3 = b or b+)"; §3.1; §5.2's heading | Closed |
| n2 | header line 8 | Closed |
| n3 | §9.2's C5b.7 row (320 is the width that discriminates) | Closed |
| n4 | §5.2's 320 px bullet | Closed in §5.2, but see c1 |
| n5 | `SZ` adds the resolved `margin-left`/`margin-right` of auto-margined elements and the scrollbar mode; §10 setup records it on every load | Closed |

**T5a coupling.** It is consistent. T5a Revision 2.1 §5.3:448 states the hand-over (N2-4). T5a §5.9's T8 appends a `data-rich-text` sentence to the end of the "Rich text" bullet. T5b's §5.4 replaces a phrase earlier in that same bullet, and finds it by its text, so the two edits don't collide. T5a's "only the six wrappers carry it `[measured]`" was true when T5a measured it. T5b's §5.2 bullet records the seventh wrapper, and the harness counts that change with it.

**Regressions.** I found none. No step, criterion, decision or recommendation changed. The budget figures are unchanged and still check (Round 2's arithmetic). Every Round 1 and Round 2 fix I verified is still in place.

### Remaining note (does not block a build)

- **c1.** §9.2's C5b.8 row still says "the pre-existing offender stays Shopify's container". §5.2 now says, correctly (n4), that the container fills the 320 px wrapper, so any remaining offender is a Shopify descendant, or there is none. The sweep missed the variant wording "stays". This changes no decision, and C5a.18's "outside theme markup" condition holds either way. The Architect can fix it in passing; it doesn't need another round.

### Verdict

Over three rounds the findings went from 9 REQUIRED, to 2 REQUIRED, to one cosmetic note. Every gate, criterion and owner-facing text I flagged now holds on the build it names. The plan is ready for the Coder, on the preconditions in its own §13 Step 0 item 1: T5a on staging, T5a's owner check 3 recorded, and this plan, the index and this review committed.

APPROVE
