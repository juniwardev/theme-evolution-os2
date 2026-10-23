# Plan review: theme-evolution-tailwind-t3 (Revision 1)

Reviewer: Plan-Reviewer (Claude), 2026-10-22
Plan: `docs/plans/theme-evolution-tailwind-t3.md`, Revision 1 (810 lines, read in full)

Read for this review: `CLAUDE.md` and `AGENTS.md` (rules re-read this pass); umbrella `docs/plans/theme-evolution-tailwind.md` §6, §10, §12, §17.4, §20, and the `P_btn` / C0.x rows; `docs/plans/theme-evolution-tailwind-t2.md` (D2.9, §5.13, §14) and my T2 review; T2 impl notes (step table, C2.x results, deviations); `docs/bugs/mobile-horizontal-overflow.md`; `docs/plans/theme-evolution-homepage-phases.md` (Feature 2, Standing directives); and the source files: `sections/image-banner.liquid`, `sections/hello-world.liquid`, `blocks/text.liquid`, `blocks/group.liquid`, `assets/section-image-banner.css` (all 492 lines), `src/tailwind.css`, `snippets/css-variables.liquid`, `templates/index.json`, `templates/product.landing-page.json`, the two Q10 schema ranges, and the `base.css` ranges named below. I also read `scripts/check-bare-hidden.mjs`, the compiled `assets/tailwind.css` media queries, and the installed Tailwind's breakpoint comparator (`node_modules/tailwindcss/dist/lib.mjs`).

---

## Summary

This is a strong first revision. The mapping is grounded in the actual CSS: I re-derived the §3.4 table line by line and it holds, including the specificity notes. The cascade facts are right too (Dawn `h1`/`h2` rules invalid because `--font-heading-family` isn't defined; `.button[aria-disabled]` is scoped to `.button`, so removing the class removes the 0.5 opacity). The criteria are mostly two-sided, and §9.2's "can the criteria tell the designs apart" list is mostly true.

There are **no blockers**. There is one real compile defect: a class string the plan specifies verbatim sorts the wrong way, and no criterion would catch it (R1). The other required items:

- §8 text that would mislead QA and the owner: the buttons at 554 to 767 px, and the landing page on mobile (R3, R4).
- A distinguishing claim that doesn't hold at the width it names (R3).
- Combination variants that are rendered but never judged (R5).
- The R1 wording, which the orchestrator's push test has now overtaken (R2).
- Three process and text fixes (R6 to R8).

Each is small.

---

## Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**

- **B0** (`templates/index.json:16-56`), including `color_scheme` at 51, image at 43 and order at 87-91.
- **Landing-page settings** (`product.landing-page.json:3-43`; `color_scheme` at 37; no `image_behavior`, no images, `button_label_2` unsaved).
- **Schema defaults.** `button_label_2` defaults to "Button label" (`en.default.schema.json:210`). `PW`/`PM` are 90rem / 20 (`settings_schema.json:48, 58`), and `css-variables.liquid:23-24` prints them.
- **`--content-width`** is defined at `src/tailwind.css:192-195`.
- **The Q10 objects:**
  - `image-banner.liquid:327-332` is a 6-line object between `show_text_box` and the mobile `header`;
  - `material-spotlight.liquid:199-204` is 6 lines;
  - `related-products.liquid:152-158` is 7 lines, with `info`.
- **Ripgrep facts.** `color_scheme` / `color-{{` outside `docs/` appear only in those schemas, `image-banner.liquid:126` and the four template lines. No other markup uses `.text`, `.welcome*` or `.highlight*`, so deleting the three stylesheets from the bundle is safe.
- **Every row of §3.4**, against `section-image-banner.css`: lines 1-7, 37-41, 55-98, 146-150, 161-207, 222-262, 269-281, 331-333, 341-364, 380-396, 398-476.
- **`base.css` ranges:** 146-159 (`.isolate`, `.section + .section` with undefined variables), 252-320, 462, 470-484, 523, 595-618, 881-900 (`.grid` gap variables are undefined anywhere, so the band's `grid` gets no gap), 1109-1135, 1338, 3179-3189, 3240-3276. The `@keyframes` copy is exact.
- **Coincident class names.** Of the utility names T3 uses, `base.css` defines only `.isolate`, `.overflow-hidden`, `.uppercase` and `.section` (searched). The plan avoids `isolate`, and C3.11's allowlist covers the others.
- **`btn-primary` / `btn-secondary`** (`src/tailwind.css:51-113`) match E3.11: `min-height` 3rem, padding-inline 1.5rem, 0.6 opacity on `[aria-disabled="true"]`, `--font-heading--family`, 700, uppercase.
- **The product `<h1>` string** (`sections/product.liquid:38`) and **the T2 `heading_size` map** (T2 §5.13) are reproduced exactly.
- **`check:hidden`.** Its `BARE_HIDDEN` lookbehind skips `max-md:after:hidden`.
- **`en.default.json`.** The insertion point after `material_tooltip` (265-268) exists.
- **Arithmetic:**
  - `CW`, `CL`, `E_L` / `E_R` at 320 / 375 / 1440 / 1920;
  - card widths 445.3 / 424.0 / 285.3;
  - `W_box375` = 287;
  - `X_home0` = 396 − w (76 / 21 / 6), consistent with the bug report's constant 396 button edge;
  - 216 / 268 / 272 for C3.6's red case;
  - every × 0.625 conversion in §5.5.

**Taken on trust (not re-derived):** the T1 header edges (52 / 1388), `S_tw`, the `B_*` figures, T2's harness behavior, `base.css:1205-1308` beyond the lines above, `base.css:2936-3000`, and the claim that T0 Step 6 keeps `@layer` inside `{% stylesheet %}`.

**Manifest gaps the Architect disclosed, and what I did with them:**

- **"Tailwind syntax not built."** I checked the ordering hazard behind one of the strings in the list and found R1. The rest are standard v4 syntax and C3.15 / C3.16 render them.
- **Browser behavior.** The `min()` percentage in a definite container is sound.
- **Shopify push behavior.** The orchestrator has now measured it (R2).

---

## Blocking issues

None.

---

## Required changes

### R1 (REQUIRED, compile defect, invisible to every criterion). `min-[1400px]:` sorts before `md:`, so the boxed 900 px max-width never applies

The boxed text box gets `md:max-w-[44.375rem] min-[1400px]:max-w-[56.25rem]` (§5.5.2, "box" row). Both rules have the same specificity, so the one emitted later wins.

- **Why the order goes wrong.** This project's breakpoints compile in **rem**: `assets/tailwind.css` contains only `@media (min-width:48rem)` and `(min-width:64rem)`. The installed Tailwind comparator (`node_modules/tailwindcss/dist/lib.mjs`, line 12, function `Ee`, used by the `min` variant group) sorts breakpoint values **by unit first, then by number**. Its code is `s=e.replace(/[\d.]+/g,"")` … `s===l?0:s<l?-1:1`. Because `"px" < "rem"`, every `min-[…px]:` rule is emitted **before** every `md:` and `lg:` rule.
- **Effect.** From 1400 px, `md:max-w-[44.375rem]` (710) still wins over `min-[1400px]:max-w-[56.25rem]` (900).
- **Why nothing catches it:**
  - C3.14 checks the max-width only for B0's transparent box (890).
  - C3.15's V5 checks only `background-color` and `padding-left`.
  - C3.12 compares geometry, and a shrink-to-fit box about 520 px wide never reaches either cap.

It ships silently and shows up only when a merchant's boxed content is wider than 710 px on a large screen.

**Change:**

1. Write the variant in the project's unit: `min-[87.5rem]:max-w-[56.25rem]` (1400 / 16). 87.5 > 48, so it sorts after `md:`.
2. Add a §5 convention: "arbitrary breakpoints are written in rem".
3. Do the same in the Q3.6 parity fallback: `min-[1101px]:` becomes `min-[68.8125rem]:`. No property conflicts there today, but it keeps the rule uniform.
4. Add to C3.15's V5 check: computed box `max-width` 710 px at 1024 and 900 px at 1440. The px build goes red at 1440; the rem build is green.
5. Correct R4, which calls `min-[1400px]:` "documented v4 syntax". The syntax is valid, but the ordering is the hazard.
6. As a self-check the Coder can run on the compiled file, add to Step 4: in `assets/tailwind.css`, `min-width:87.5rem` appears after `min-width:48rem`.

### R2 (REQUIRED, text reaching DevOps and the owner, and one gate). Fold in the measured push behavior; "dropped on the next editor save" is unverified

The orchestrator's 2026-10-23 test on #187953938528 shows four things:

- the push succeeds with no warning;
- Shopify keeps the orphaned `"color_scheme"` value in the template;
- the page renders 200;
- there's no Liquid error.

So R1's risk doesn't materialize. "Ignored" is now a measured fact, but "dropped on the next editor save" still isn't. The plan states the second as fact in five places:

- §2: "Shopify drops them on the next editor save";
- §7: "ignored, then dropped on the next editor save";
- R2: "After any editor save of the homepage, live's `index.json` lacks `color_scheme`; that diff is expected";
- owner check 2: "note that saving drops `color_scheme` … (expected, Q10)";
- §1 goal 4, by reference.

**Change:**

1. **R1.** Rewrite it as a resolved fact, citing the test (date, theme ID, the files pushed). Drop the "if rejected, stop and ask … remove the four saved values" fallback. Keep the sentence about Step 5 being its own commit, now justified by the editor warning or a theme-check surprise (item 4), not by a failed push.
2. **"May", not "will".** Change §2, §7 and R2 to "persist after a push; an editor save may drop them (unverified)". Turn owner check 2's "note that saving drops" into "**record** whether the save removed `color_scheme` from that template's JSON". That turns the assumption into a measurement at no cost.
3. **The values persist.** Add to §15's "For information" paragraph: the four saved values persist in the repo, and `-e production` re-uploads them to live, until an owner-approved template edit removes them. Record them with the two unused locale keys.
4. **Theme check.** The shopify.dev reference says `ValidSettingsKey` reads only `presets` and `default`, which supports the §13 prediction. But Step 5's fallback ("fix it in that step's file") would be a forbidden template edit if a newer check flagged template values. Add to R7: "if theme check flags the orphaned template values, don't edit `templates/*.json`: stop and write the coder-questions file." Optionally, measure the prediction early: in Step 0, run `shopify theme check` once on the scratch copy with the three deletions applied.
5. **Umbrella.** Umbrella §10's Q10 paragraph says "drops them on the next editor save". Don't rewrite an owner-decision record. Propose a dated note under it in §14.1 (call it U6): "Verified 2026-10-23: a push keeps the orphaned values and the page renders; whether an editor save drops them is unverified (T3 owner check 2 records it)."

### R3 (REQUIRED, Δ text and a distinguishing claim). Buttons at 554 to 767 px, and a grow check that can't see the min-width

**The Δ text.** E3.11 says "below 768 one per row". On mobile the wrapper is `max-md:flex max-md:w-full` with `max-w-[28.125rem]` (450). Once the content area is at least 450 px, two buttons at 220 px each plus the 10 px gap fit on one line:

- the content area is w − 104;
- so this happens from **w = 554**, and between 554 and 767 the buttons sit side by side at 220 px each `[derived]`.

Today, Dawn puts one button per row at every mobile width (352 + 16 + 352 = 720 is more than the widest mobile box, 749 − 40 − 48 = 661). That is a tablet-portrait change missing from §8. Add it to E3.11.

**The distinguishing claim.** C3.15 says "two centred buttons at 375 (B0): each button's width = its wrapper's width". §9.2 cites this as what separates the chosen design from `min-w-0`. At 375 a build that keeps `max-md:grow` but drops the min-width also passes, because the two labels wrap anyway:

- the content area is 271 px;
- "SHOP ALL" and "BUTTON LABEL" are roughly 130 + 170 px at 16 px Oswald with 24 px padding `[estimate]`;
- 130 + 170 + 10 = 310 > 271.

So the check catches only a build that drops both the grow and the min-width. Add two widths:

- **430.** The content area is 326 < 450. The chosen build gives one button per row, each as wide as the wrapper. A grow-only build puts them side by side, so it goes red.
- **767.** The wrapper is 450. The chosen build gives each button 220 ±1. A grow-only build gives about 200 / 240, so it goes red.

Then reword §9.2's bullet. Step 0 can record the two labels' natural widths so the 430 case is known to discriminate.

### R4 (REQUIRED, Δ text QA compares against). The landing page's mobile banner has no Δ figures, and it probably overflows today

E3.13 lists only desktop figures plus "text below on mobile as today". Dawn's `.banner--mobile-bottom .banner__box { padding: 4rem 3.5rem }` (line 353) applies on mobile, so at 375 today `[derived]`:

- the box is 335 px wide from x = 20, with padding 64 / 56;
- the text starts at x = 76 and is 223 px wide;
- both buttons are `min-width: 352px` (two labels: the second falls back to "Button label");
- the button right edge is 76 + 352 = 428, so `X_page` ≈ 53 at 375 and ≈ 108 at 320.

After T3:

- the content area is inset to 52, and the box padding is `max-md:px-[2.1875rem]`;
- the text starts at x = 87 and is 201 px wide (146 at 320);
- the box padding-block is 40;
- each button is 201 px wide.

C3.12 measures the landing page at 375, so every one of these moves is currently "unlisted".

**Change:**

1. Add the mobile figures to E3.13.
2. Extend E3.19 to the landing page (Step 0 value → 0).
3. Mention the landing page in §14.3's bug note if Step 0 confirms the overflow.

**A tradeoff to surface, not decide.** With `show_text_below`, the text sits at `E_L` + 35 = 87, off the header edge that D3.2 sets for the homepage. On mobile no box background is painted (and `bg-background` would equal the page color anyway), so the 35 px is indentation only. `max-md:px-0` for `is_bottom` too would align it. The current plan keeps Dawn's intent instead. State which, and why.

### R5 (REQUIRED, testability). Combination variants C1 to C4 are rendered but never judged

§10 renders C1 (stacked + bottom), C2 (stacked + adapt), C3 (bottom + adapt), C4 (fixed + two images + stacked) and C5. No criterion names C1 to C4:

- C3.6 checks containment only;
- C3.15 names the V variants;
- C3.13 uses V3;
- C3.12 runs only on `/` and the landing page.

These combinations exercise exactly the four-branch "content, mobile string" and the `order` logic, the intricate part of the Liquid. Two examples:

- Dawn's stacked + bottom puts the text **between** the two images: media 2 gets `order: 1`, and content keeps `order: 0` because Dawn's `order: 2` is `:not(.banner--stacked)`, lines 205-207 and 331-333.
- The `max-md:absolute` / `max-h-full` / `overflow-hidden` set applies only in some branches.

A wrong branch here would pass every written criterion.

**Change:** add a criterion, or extend C3.15. At 375, for C1 to C4 and V6 / V8:

- the y-order of media 1, media 2 and content, and each element's computed `position`, equal base;
- media `height` and content `min-height` equal base × 0.625 ±1, except in adapt cases, where they are ratio-driven: compare `::before` `padding-bottom` with base.

C5 at 1440: box left = L ±1, `text-align` left, `background-color` = `--color-background`.

### R6 (REQUIRED, owner visibility). Give the owner Q3.1 to Q3.3 explicitly before the steps they change

I checked every recommendation against §20 Q1 to Q10 and T2's Q1 / Q2. **None reverses a recorded decision.** One stretches one:

- **Q3.1 extends T2 Q1 beyond its recorded scope.** T2 §14 records the owner adopting × 0.625 for the related-product cards (card, price, unit price, related heading). D2.9's rule text says "Dawn-derived files". Applying it to `image-banner` is in the rule's spirit, but the owner never saw it applied to the homepage hero.
- **Q3.1, Q3.2 and Q3.3 are the largest merchant-visible changes since T1:**
  - the homepage banner goes 1152 → 720 px at 1440 (the page gets 432 px shorter) and 624 → 390 at 375;
  - the banner goes full bleed, so the images re-crop;
  - the landing-page hero gains an opaque box from 768 px, and so does every new banner, because `show_text_box` defaults to true.
- **Q3.4** (Oswald uppercase "HELLO, WORLD!" and banner heading) follows T2 D2.8's precedent.
- **Q3.5 and Q3.6** depart only from plan choices: T2 §2's "wait for T5", and Q4's spirit.
- **Q3.7** is today's behavior.

The plan's only owner touchpoint for these is owner-only check 3, **after** QA and the staging push. A "no" then costs a second QA round. The orchestrator's standing instruction does permit applying them. So:

- record that the owner is shown Q3.2 before Step 3 (it sets hello-world's edge), and Q3.1 and Q3.3 before Step 4, as a one-line confirmation;
- or, if the orchestrator applies them under the standing instruction, say in §15 that a post-QA rejection means a class-string swap plus a QA re-run.

I'm not deciding these for the owner.

### R7 (REQUIRED, gate). State that the owner checks gate the live push

Two acceptance items exist only as owner checks on staging, after DevOps pushes:

- umbrella §10 makes "no color-scheme warning in the editor" a T3 acceptance check (C3.4);
- `CLAUDE.md` `### QA` requires that every converted section's settings be exercised in the editor (owner check 2).

The plan doesn't say they must pass before `shopify theme push -e production`, or what happens if C3.4 fails.

**Change:** add to §10 / §12 that owner checks 1 and 2 pass before the live push. If C3.4 fails, live isn't pushed; the Architect investigates (another trigger, or the orphaned values from R2), and reverting Step 5 is the fallback.

### R8 (REQUIRED, permanent umbrella text). U1's selector doesn't match its noun

U1 says "every button in the image-banner section (`[data-image-banner] a`, T3 C3.5)". That selector also matches links inside the heading and text `inline_richtext`, and C3.6 already uses `[data-banner-buttons] > a`.

**Change:** use `[data-banner-buttons] > a` in U1. Optionally align `X_btn` (§0) the same way: today it is named "banner button overflow" but measures every `a`, which is the conservative direction, so that part is a NIT. Add U6 from R2 to §14.1.

---

## Nits

None blocks. Fold in as convenient.

- **N1.** `placeholder_classes` is used in the placeholder row (§5.5.2) but isn't defined in §5.5.1. Define it: the `none` string for `none` and `ambient`, the single `fixed` string for `fixed` and `zoom-in`. This matches Dawn: `.animate--fixed > svg` is fixed, and ambient targets `> img` / `> .svg-wrapper` only.
- **N2.** §5.3's rationale "`link_to` can't take a class" is incorrect. shopify.dev's `link_to` reference shows `class:` support, and its example output carries `rel="nofollow"`. Explicit `<a>`s are fine, but they likely drop `rel="nofollow"` from the three outbound links. Either keep `link_to` with `class:`, or add `rel="nofollow"` and record it. Step 0 can confirm what today's links carry.
- **N3.** The text block loses Dawn's `.rte a` underline offset and thickness (`base.css:3179-3184`: 0.3rem / 0.1rem, which render 4.8 / 1.6 px today). The heading keeps them scaled through `[&_a]`. Add the same `[&_a]` strings to the text `div`, or add an E-row. The heading's offset moving 4.8 → 3 px isn't in E3.10 either (a Q1 effect).
- **N4.** `zoom-in`: drop the "exempt from the `CLAUDE.md` `### QA` rule" wording. The option does visibly apply (a fixed background, different from `none`), so no exemption from a binding rule is needed. Say "applies as a fixed background; zoom not implemented (Q3.7)".
- **N5.** §14.2 item 4 adds an "item 6" while item 5 (R-T2.3) is still unapplied. Make it conditional ("item 5 or 6, after R-T2.3").
- **N6.** C3.11's allowlist includes `hidden`, but T3 markup has no bare `hidden` token. It's harmless, but it widens the allowlist for no reason.
- **N7.** Step 0 item 2 matches `.welcome{`. Whitespace depends on how Shopify's bundle minifies. Match the selector (`.welcome`), not the brace.
- **N8.** hello-world's schema `"name": "Hello world"` stays literal under the byte-identical rule. Note it for the hero plan, which replaces the section.

---

## Answers to the orchestrator's specific questions

- **R1 and the measured fact.** Covered in R2: the wording needs adjusting, and the Step 5 fallback for a rejected push should go. The revert path stays, for the editor warning or a theme-check surprise.
- **Q3.1 and Q3.3: explicit owner call?** Yes, I'd show both to the owner (R6). Neither reverses a decision. Q3.1 stretches T2 Q1's recorded scope and is the largest homepage change. Q3.3 changes the look of the landing-page hero and the default for new banners. Q3.2 belongs in the same short list.
- **Umbrella edits U1 to U5.**
  - U1 needs the selector fix (R8).
  - U2 to U5 are correct: U3 prevents a false red against §17.4, and U5 is consistent with §17.4, which doesn't list C0.5 as an every-phase criterion.
  - Add U6 (R2).
- **Roadmap (§14.2).** Item 1 is right: R-T2.3 was never applied, and the list has four items. Items 2 and 3 are accurate. Item 4: see N5. The pattern it records is correct only on a full-bleed element, and the text says so.
- **Bug report (§14.3).** It's accurate for `/`. Add the landing page if Step 0 confirms its overflow (R4).
- **Things that bit T2:**
  - **Underscore escaping.** Handled: `[&_a]` uses `_` as a descendant space, and there are no BEM selectors.
  - **Orphaned snippets.** T3 renders and orphans none.
  - **`base.css` collisions:** `.grid` gets `mb-0`, and its gap variables are undefined; `div:empty` is avoided by using pseudo-elements; `.isolate` is avoided; `.uppercase` and `.overflow-hidden` set the same values as the utilities; `.hidden` doesn't apply because only `max-md:after:hidden` is used, on a pseudo-element.
  - **Unlayered CSS.** Removed or layered.
  - **Schema option values.** None renamed.
  - **Theme-check predictions.** Sound, with the template-value branch from R2 item 4.
  - **Gates QA can't run.** Correctly routed to the owner; R7 makes them gating.
  - **The one compile defect is R1.**

---

## Checked and found sound

- **D3.3's mechanism.** At 320 the plain-220 button ends at 272, past the box content edge of 268, while `X_page` stays 0. So C3.6 is the right detector, and the definite-width wrapper resolves the `min()` percentage.
- **The overlay and ratio pseudo-elements.** They map onto Dawn's `.banner::after` / `::before`, including `max-md:after:hidden` for `is_bottom` and the desktop-only root `::before` (Dawn's `!important` hide at 260-262).
- **Fixed and stacked image strings.** They match lines 178-199 and `base.css:3240-3248`.
- **Block spacing.** It follows the precedence order at lines 398-476.
- **C3.23.** It is two-sided: today's build is red on the band text, and a hardcoded heading color is red the other way.
- **Bundle deletions.** Deleting the `text`, `group` and hello-world stylesheets from the global bundle affects no other markup.
- **One `<h1>`.** It's preserved on `/` and on the landing page (the product `<h1>` renders there, and the banner heading stays `<h2>`).
- **Preload.** The literal `preload: true` in its own branch follows the T2 lesson.

---

## Trajectory

Round 1. There are no blockers. There are eight required items. One is a genuine compile defect (R1). Three correct Δ or criterion text that QA and the owner act on (R3, R4, R8), and one gives the combination variants a pass condition (R5). The other three are process and wording (R2, R6, R7). None needs a redesign. With these folded in, I expect the next round to be confirmatory.

---

## Required changes

1. **R1.** Write the 1400 px box step as `min-[87.5rem]:` (and Q3.6's fallback as `min-[68.8125rem]:`). Add the "arbitrary breakpoints in rem" convention. Add V5's computed `max-width` check (710 at 1024, 900 at 1440). Correct R4's wording. Add the compiled-order self-check to Step 4.
2. **R2.** Rewrite R1 as the measured, resolved fact and drop its push-rejection fallback. Change "dropped on the next editor save" to "may be dropped (unverified)" in §2, §7 and R2. Make owner check 2 record whether a save drops the value. Note that the four values persist. Add the "theme check flags template values: don't edit templates, stop" branch to R7. Propose U6.
3. **R3.** Correct E3.11 for 554 to 767 px. Add the 430 and 767 button-width checks to C3.15. Fix §9.2's `min-w-0` bullet.
4. **R4.** Add the landing page's mobile figures to E3.13, and the landing page to E3.19 (and to §14.3 if confirmed). State the `is_bottom` inline-padding choice.
5. **R5.** Give C1 to C4 (and V6 / V8) a base-versus-head pass condition at 375: element order, `position`, and scaled heights. Give C5 its 1440 checks.
6. **R6.** Record when the owner sees Q3.2 (before Step 3) and Q3.1 / Q3.3 (before Step 4). Or state in §15 that a post-QA rejection means a class swap plus a QA re-run.
7. **R7.** State that owner checks 1 and 2 must pass before the live push, and what happens if C3.4 fails.
8. **R8.** Fix U1's selector (`[data-banner-buttons] > a`) and add U6 to §14.1.

APPROVE WITH CHANGES

---

## Round 2

Reviewer: Plan-Reviewer (Claude). Plan: Revision 2 (881 lines). This round I read the changelog, then every section it points to, in full: §0, §2, §4.3-§4.5, §5 conventions, §5.3, §5.5 (all of it), §5.6, §7, §8, §9.1, §9.2, §10, §11, §12, §13, §14, §15 and §16's Revision 2 block. I re-read `CLAUDE.md` and `AGENTS.md` for this pass.

I had no shell this round, so I couldn't run `git diff`. I reviewed the umbrella edits by reading each changed line in `docs/plans/theme-evolution-tailwind.md`: lines 60, 435, 1012, 1014, 1018-1020 and 1660.

### Round 2 summary

All eight round-1 items are **resolved in substance**, not just mentioned. The umbrella edits U1-U6 are applied correctly, and none of them rewrites owner-decision text. The R4 decision (`max-md:px-0` in every case) is carried consistently through §4.4, §5.5.2, E3.9, E3.13, C3.6 and §15 Q3.2.

The revision introduced no contradiction I could find. But re-reading §5.5.2 in full this round turned up one design defect that was already in Revision 1, and I missed it then. The content area's mobile inline padding shrinks the box that the adapt-ratio `::before` measures against. C3.15, as written, would go red on that build. A second item is a C3.27 pass condition that goes red on a correct build. The third is a one-line provenance fix.

### Manifest: what I sampled this round, and what I took on trust

**Sampled and confirmed:**

- **Each changelog row against the body it cites:**
  - R1: `BP_box`, the §5 conventions, the §5.5.2 box row, C3.15 V5, R4, the Step 4 script, Q3.6.
  - R2: §2, §5.6, §7, R1, R2, R7, Step 0 item 10, owner check 2, §15.
  - R3: §4.5, E3.11, C3.15, §9.2, Step 0 item 11.
  - R4: §4.4, the box row, E3.13, E3.19, §14.3, Q3.2.
  - R5: C3.27, §9.2, §10.
  - R6: §15.2, R6, owner check 3.
  - R7: §10 live gate, §12, §13.
  - R8: `X_btn`, U1.
- **The superseded-term sweep**, by my own grep. `min-[1400px]`, `min-[1101px]`, `drops them`, `dropped on the next`, `exempt`, `[data-image-banner] a` and `C3.0-C3.26` now survive only in the changelog, and in the §9.2 / C3.15 text that names the px form as the red case. `md:px-[2.1875rem]` survives only on desktop.
- **The arithmetic:**
  - 554 = 450 + 104.
  - At 767: content area 663, wrapper 450, buttons 220 each.
  - Grow-only at 767 ≈ 200 / 240 (450 − 10 − 300 = 140 shared).
  - The landing page today: text at 76, 223 wide, button edge 428 (so 108 at 320 and 53 at 375). After: 52 / 271 / 216.
  - V5's caps: 44.375rem = 710 and 56.25rem = 900.
- **The Step 4 self-check against the repo's minified form.** `assets/tailwind.css` writes `(min-width:48rem)`, and the script searches `min-width:87.5rem` and `min-width:48rem`, so it matches what `npm run build:css` produces. I also checked that no scanned markup combines `md:` or `lg:` with a later-registered variant (an arbitrary `[&…]`, `print:`, `dark:`, `@…`). So "the first 87.5rem query comes after the last 48rem query" holds on today's markup.
- **The umbrella edits U1-U6**, each in place and verbatim as tabled in §14.1. The Q10 paragraph is unchanged, and U6 sits under it as a separate dated paragraph.

**Taken on trust:**

- the orchestrator's two measurements (the push on 2026-10-23 and the R1 sort order), which they report;
- the event recorded in §15.2 (the owner being shown Q3.1-Q3.3); see R2-3;
- §16's Revision 2 self-check list beyond what I sampled above.

### Round-1 items against Revision 2

| Item | Status | Evidence |
|---|---|---|
| R1 | **Resolved** | `min-[87.5rem]:` in the box row and the conventions. The fallback is `min-[68.8125rem]:`. C3.15 V5 checks `max-width` 710 at 1024 and 900 at 1440, and is red on the px build (confirmed by the orchestrator's build). R4 is reworded. The Step 4 script matches the minified form (see the manifest above) |
| R2 | **Resolved** | R1 is now a measured, resolved row with no push fallback. "May drop (unverified)" appears in §2, §5.6, §7, R2 and §15. Owner check 2 now records whether the value survives a save, with a concrete pull. R7 has the "don't edit templates, stop" branch. Step 0 item 10 runs the prediction early. U6 is added |
| R3 | **Resolved** | E3.11 states the 554-767 band. C3.15 checks 375 / 430 / 767, and both alternatives are red. §9.2 says plainly that 375 alone can't tell them apart. Step 0 item 11 measures the labels and has a fallback width |
| R4 | **Resolved, with a stated decision** | `max-md:px-0` is used for every mobile case, which puts the landing-page text on `E_L`. E3.13 now has mobile current/after figures consistent with that. E3.19 covers the landing page. §14.3 has the conditional note. The cost is listed under Q3.2. I found no row that still assumes 35 px on mobile |
| R5 | **Resolved, with one defect in the new criterion** | C3.27 judges C1-C4, V6, V8 and C5, and its expected C1 order (media 1, content, media 2) is right. But see R2-2 |
| R6 | **Resolved: no approval is claimed** | §15.2 says "**That is not recorded as an approval.**" The checkpoint is owner check 3, and the cost of a later "no" is listed per question, naming the criteria. This is my option (b) from round 1. Provenance: see R2-3 |
| R7 | **Resolved** | Owner checks 1 and 2 gate `-e production`, and they don't gate staging, which is where they run. §10's live gate, §12's Q10 row and §13 agree. The failure path (no live push; Step 5 can be reverted while Steps 1-4 ship) is sound, because Steps 1-4 don't read `color_scheme` |
| R8 | **Resolved** | U1 and `X_btn` both use `[data-banner-buttons] > a` |
| N1-N8 | **Resolved** | `placeholder_classes` is defined. `link_to` keeps `class:`, and C3.18 compares the other attributes. The text `div` gets the `[&_a]` strings, recorded in E3.22. The `zoom-in` wording is fixed. §14.2 item 5/6. The allowlist is narrowed. Step 0 matches selectors. N8 is recorded in §2 |

### New findings in Revision 2

#### R2-1: REQUIRED. Prevents a passing build; fix before Step 4. The mobile adapt ratio is measured against the inset content box, so the banner comes out about 28 % too short at 375

**This was in Revision 1. I missed it in round 1.** The content area carries `px-[calc((100%-var(--content-width))/2+2rem)]` at every width (§5.5.2, the "content" row). On mobile, when `has_ratio` and not `is_bottom`, the content also gets `max-md:before:block max-md:before:pb-(--banner-ratio)` (the "content, mobile string" row).

The `::before` is a flex item of the content, so its percentage `padding-bottom` resolves against the **content's content box**:

- at 375 that box is 375 − 2 × 52 = 271 px (216 at 320);
- in Dawn it is the root's full width, because `.banner__content { padding: 0 }` on mobile (`section-image-banner.css:269-270`) and the `{% style %}` at lines 12-19 targets that box.

In the common adapt case (one image, not stacked, not below), the media is absolute. So the content's `::before` alone sets the banner height:

- head gives 271 / `r1`, where both Dawn's intent and C3.15 expect root width / `r1` = 375 / `r1`;
- that is a factor of 0.72, and the "adapt to image" option visibly crops the image.

C3.15's adapt half ("at 375 (not bottom) content `::before` the same" as root width / `r1`) is correct. **It would go red on the build as specified**, so QA would FAIL in Step 6. In the stacked + adapt case (C2) the same shrinkage applies to the absolute content overlay. It's less visible there, because the media sets the height.

**Change (the Architect's choice; two options that keep R4's alignment):**

- **(a) Move the mobile inline edge from the content to the box.**
  - The content gets `md:px-[calc((100%-var(--content-width))/2+2rem)]`, desktop only, where it positions the shrink-to-fit box.
  - The box gets `max-md:px-[calc((100%-var(--content-width))/2+2rem)]` in place of `max-md:px-0`. With no padding on the content, the box's `100%` and `--content-width` resolve against 375, so its text still sits on `E_L`. Its content box is still 271, so C3.6, the buttons and E3.13 are unchanged.
  - Then the content's `::before` measures 375.
  - Update the content and box rows, and the "inline padding 0" wording in E3.9 and E3.13.
- **(b) Keep the padding and move the mobile ratio box to the root** for the non-stacked, not-below case (`max-md:before:…` on the root). As a zero-width flex item beside the `w-full` content, it stretches the line to 375 / `r1`. Then drop the content's `::before` there. The stacked and below cases keep the media `::before`, as Dawn does.

Either way, add a §5.5.2 note: a percentage on any descendant of the content area resolves against the inset box.

#### R2-2: REQUIRED. A criterion that goes red on a correct build. C3.27(c) compares ratio boxes with base in px, but the banner got wider

For the ratio-driven cases (C2, C3), C3.27(c) requires "the media and content `::before` `padding-bottom` equal base's ±1". Those values are percentages of the element's width. Under Q3.2 the banner widens from 335 to 375 px at 375, so on a **correct** build they differ from base by a factor of about 1.12 (`[derived]` 375 / 335). A deliberately correct build fails.

**Change:** use C3.15's form. Head `::before` `padding-bottom` = the width of the `::before`'s containing box / `r1` ±1, or compare `padding-bottom ÷ that width` with base's ±0.5 %. For C2's media, the containing box is the media; for the content `::before`, after R2-1 it is the content's full width.

#### R2-3: REQUIRED, one line (a permanent register entry). Attribute the owner interaction in §15.2

§15.2 records that "On 2026-10-23, before the review, the orchestrator showed the owner Q3.1 … Q3.3". It correctly claims no approval. But it cites no source, and "before the review" reads as before round 1, which is dated 2026-10-22.

**Change:** name where the interaction is recorded (for example "orchestrator message to the Architect, 2026-10-23"), and say "before review round 2". If it didn't happen as written, strike the paragraph. §10's owner check 3 and the cost list already stand without it. This is for the orchestrator to confirm before committing; it needs no redesign.

#### R2-N1: NIT. The Step 4 self-check is stricter than its purpose

"The first 87.5rem query comes after the last 48rem query" holds on today's markup (manifest above). But a future `md:` utility with a later-registered variant would make it a false red. A narrower check targets only the two rules, for example the index of `max-w-\[56\.25rem\]` is greater than the index of `max-w-\[44\.375rem\]`. Optional.

#### R2-N2: NIT. R2 and §15 differ slightly on who removes the template values

The R2 risk row says a live pull without `color_scheme` "may be committed". §15 says the values persist "until an owner-approved template edit removes them". Committing live's pulled copy is the `CLAUDE.md` Deploy-targets sync, not a T3 edit. Say so in one clause, so the two don't read as conflicting.

### Checked and found sound (Revision 2 additions)

- **The `max-md:px-0` decision against every E and C row.** E3.13 (52 / 271 / 216), E3.9, C3.6's landing case and the C3.15 button widths all assume 0 mobile box padding. No stale 35 px remains on mobile.
- **The live gate's failure path.** Reverting Step 5 alone is safe: Step 4 no longer reads `color_scheme`, and §12's "reverse order" rule is about Step 4 depending on Step 5, not the other way round.
- **Owner check 2's pull.** It targets staging by ID, with `--store`/`--theme`, into the scratchpad, as `CLAUDE.md` DevOps requires when `--path` is used.
- **U6.** It qualifies Q10 without rewriting it. U3 lands in §17.4, and U5's "T0-only" agrees with §17.4's every-phase list.

### Trajectory

| Round | Blockers | Required | Character |
|---|---|---|---|
| 1 | 0 | 8 | one compile defect; Δ text, a coverage gap and process items |
| 2 | 0 | 3 | one design defect that slipped past round 1, which its own criterion would catch at QA; one wrong pass condition; one provenance line |

All three are local edits: a padding move, a formula, and one sentence. The plan is otherwise ready. I expect round 3 to be confirmatory, and I'd approve on these three alone.

### Required changes (round 2)

1. **R2-1.** Fix the mobile adapt ratio box so it measures the root's full width, not the inset content box. Either move the mobile inline edge from the content to the box (option a), or put the mobile ratio `::before` on the root (option b). Update §5.5.2's content and box rows and E3.9 / E3.13's wording to match, and add the percentage-basis note.
2. **R2-2.** Rewrite C3.27(c)'s ratio clause as width-relative (`padding-bottom` = the containing box's width / `r1` ±1, or the ratio compared with base's), not as a px equality with base.
3. **R2-3.** Attribute §15.2's record of the owner being shown Q3.1-Q3.3 to its source, and fix "before the review" (or strike the paragraph if the event isn't confirmed).

APPROVE WITH CHANGES

---

## Round 3

Reviewer: Plan-Reviewer (Claude). Plan: Revision 3.

I read the Revision 3 changelog, then every section it cites, in full: §4.4, §4.5, the whole of §5.5.2 including the new "Percentage basis" note, §8 E3.7-E3.13, §9.1 C3.12-C3.15 and C3.27, §9.2, §11 R2 and R6, §13 Step 4, and §15.2. I re-read `CLAUDE.md` for this pass. The umbrella file wasn't re-reviewed: the orchestrator says it is unchanged since round 2, and the changelog says it wasn't touched.

### Round 3 summary

All three round-2 items are resolved, and so are both nits.

Option (a) is applied consistently:
- the content area carries the inset only from 768 (`md:px-[calc(…)]`);
- the box carries it below 768 (`max-md:px-[calc(…)]`);
- the new §5.5.2 note states the percentage-basis rule that keeps both correct.

I traced the knock-on effects through every place the coordinator listed. They hold, with two exceptions. Both are text, not design:
- **R3-1:** a stale referent. "Content area (w − 104)" now names the wrong element.
- **R3-2:** C3.12 would go red on a correct build, because no §8 row lists the content area's own geometry change. That gap predates this revision.

Each is a one-clause fix. Neither needs another review round.

### Manifest: what I sampled this round, and what I took on trust

**Sampled and confirmed:**

- **The box at 375 after (a).** The content area has no inline padding below 768, so the box's `w-full` is 375. Its padding's `100%`, and the `100%` inside `--content-width`, both resolve against the content area's content box (375). That gives 52 + 52 padding and a 271 px content box (216 at 320, 326 at 430, 663 at 767).
  - The wrapper is `w-full` inside that box, so the button figures still hold: 271 / 326 one per row, and 220 / 220 in the 450 px wrapper at 767.
  - C3.6's containment target (the box content box, 52..323) is unchanged.
- **C2, the stacked overlay** (stacked + adapt, not below).
  - The content is `max-md:absolute`, `w-full` against the root's padding box (375).
  - Its `::before` `padding-bottom` resolves against its own content box, also 375 (it has no inline padding), so it is 375 / `r1`.
  - The two stacked medias each get a `::before` from `--banner-ratio`, which uses image 1's ratio for both, as Dawn does. The root is about 2 × 375 / `r1`, so the content's `max-h-full` caps at the root.
  - The box inside the content area still resolves its inset against 375.
  - C3.27(c)'s width-relative clause matches all three ratio boxes.
- **The desktop `md:` inset.** It's unchanged from Revision 2. At 1440 the content area is 0..1440 with 52 px padding, so a transparent box (`md:px-0`) at `top-left` has its border box and content box both at L. The boxed C5 box's border-box left is L. `max-md:px-[calc…]` and `md:px-*` are disjoint, so nothing conflicts. C3.22 (content `padding-top` 0 at 767, 50 at 768) and C3.14 (content `padding-top` 50) are unaffected.
- **C3.13.** It now measures the box's **content box** (rect left + `padding-left`), so it is green on B0 at 320 and 375 (52) and on V3 at desktop. That's correct, because on mobile the box's border box is full width by design.
- **C3.15's adapt half.** It now expects 375 / `r1` at 375. It is red on the Revision 2 build (271 / `r1`) and green on (a). Two-sided.
- **E3.9 and E3.13.** On mobile, the box's border box is 0..`w` and its content box 52..`w` − 52; the text is at 52, 271 px wide. That's consistent with the box row.
- **The Step 4 order check.** It now compares `max-width:56.25rem` with `max-width:44.375rem` in the minified file. Each value comes from one class in the theme. The check is red on the px build and green on rem.
- **R2-3.** §15.2 names its source (the orchestrator session URL), gives the timing (the turn that launched round 1; the dates are reconciled as UTC versus local) and the owner's later "keep going", and records it as "**no objection, not … an explicit approval**". This matches the orchestrator's account to me. R6's risk row agrees.

**Taken on trust:** the orchestrator's account of the owner exchange (R2-3); the "umbrella unchanged" statement; §16's Revision 3 term sweep beyond the two survivors I found (R3-1).

### Round-2 items against Revision 3

| Item | Status |
|---|---|
| R2-1 | **Resolved** (option a). Knock-on effects checked above |
| R2-2 | **Resolved.** C3.27(c) is width-relative, and its §9.2 row says why a correct build stays green |
| R2-3 | **Resolved.** Sourced, dated and correctly not called an approval |
| R2-N1 | **Resolved.** The check targets the two box rules only |
| R2-N2 | **Resolved.** R2 now calls a committed live pull the Deploy-targets sync |

### New findings in Revision 3

#### R3-1: REQUIRED (Δ text that QA reads; one clause each). "Content area (w − 104)" now names the wrong element

After (a), the element the plan calls the content area (`[data-banner-content]`, §5.5.2's tree) is **w** wide on mobile. **w − 104** is the box's *content box*. Two places still attach w − 104 to the content area:

- §4.5, "Consequence in the 554-767 px band": "the mobile content area is w − 104";
- E3.11: "Below 768 it depends on the content area (w − 104)".

The numbers are right but the referent is wrong. A QA reader who measures `[data-banner-content]` against E3.11 gets 375, not 271.

**Change:** in both places, write "the box's content box (w − 104)". The term sweep missed these because the phrase isn't one of Revision 3's changed terms.

A NIT in the same section: §4.4 opens with "The box has inline padding only where it paints a background", and two sentences later gives it the mobile inset. Make it "has **decorative** inline padding only where it paints a background", or similar.

#### R3-2: REQUIRED (a criterion red on a correct build; predates Revision 3). C3.12 has no §8 row for the content area's own geometry

The §10 measurement dump includes `[data-banner-content]`. C3.12 passes only if every difference beyond ±1 px is a §8 row.

The content area is `w-full` inside the full-bleed root:
- in head it spans 0..`w` at every width;
- in base it sits in column 2: 20..355 at 375, 20..1420 at 1440, 260..1660 at 1920.

E3.7 lists only the root and the media, and E3.9 lists the box. So a correct build shows an unlisted move of 20 px in x and 40 px in width, and C3.12 goes red.

This was true in Revisions 1 and 2 as well. I missed it in both earlier rounds.

**Change:** extend E3.7 to "banner root, media **and content area**: x 0, width `w`, at every width (base: column 2)". The heights are already covered by E3.8.

### Checked and found sound (Revision 3)

- **The "Percentage basis" note.** It names the three elements where a ratio `::before` may sit (root on desktop, media at both widths, content area on mobile), and it ties the box's own `calc` to the content area having no mobile padding. This is the right invariant to write down, and C3.15 and C3.27 enforce it.
- **The cost list for a later "no" (§15.2).** It still names the correct criteria. Q3.2's list includes C3.13 and C3.27 (C5), which (a) touches.

### Trajectory

| Round | Blockers | Required | Character |
|---|---|---|---|
| 1 | 0 | 8 | one compile defect; Δ text, a coverage gap and process items |
| 2 | 0 | 3 | one design defect, one wrong pass condition, one provenance line |
| 3 | 0 | 2 | two text clauses: a stale referent and a missing Δ-row clause; no design change |

The design is settled. Both remaining items are one-clause edits to §4.5, E3.11 and E3.7, which the orchestrator can confirm by grep. **No round 4 is needed.** Once they are in, the Coder can start.

### Required changes (round 3)

1. **R3-1.** In §4.5 ("the mobile content area is w − 104") and in E3.11 ("depends on the content area (w − 104)"), name the box's content box instead of the content area.
2. **R3-2.** Extend E3.7 to the banner content area: x 0, width `w` at every width (base: column 2: 20..355 at 375, 20..1420 at 1440, 260..1660 at 1920), so C3.12 is green on a correct build.

APPROVE WITH CHANGES

---

## Round 3 closeout (Revision 3.1)

I checked this by grep and by reading the changed lines of `docs/plans/theme-evolution-tailwind-t3.md`. The Revision 3.1 note sits at line 14, above `## Revision 3 changelog`.

- **R3-1: resolved.**
  - The §4.5 band sentence (line 266) now reads "the box's content box (`[data-banner-box]` minus its header-edge inset; the content area itself is w wide) is w − 104".
  - E3.11 (line 554) reads "the box's content box (w − 104; the content area itself is w wide)".
  - The Architect also corrected the desktop sentence in §4.5 (line 264), which now reads "the narrowest desktop content area's content box (inside its `md:` inset), 768 − 2 × 52 = 664 px". That is correct.
  - The §4.4 NIT is fixed (line 252). The box gets Dawn's inner padding only where it paints a background, and "apart from that, its only inline padding is the header-edge inset below 768".
  - **Remaining uses of "content area" are correct.** Lines 215, 247 and 254, the C3.13 and C3.15 sweep rows, and E3.9 now all use it for `[data-banner-content]` as itself; no other line pairs it with w − 104.
- **R3-2: resolved.**
  - E3.7 (line 550) is now "banner root, media and content area". Before: column 2, 20..355 at 375, 20..1420 at 1440, 260..1660 at 1920. After: 0..w at every width, with the note that the inset is padding.
  - Those figures match `CL(w)` in §0, so C3.12 has a row for the content area's move and stays green on a correct build.

No new contradiction was introduced. All items from rounds 1-3 are resolved. The plan is ready for the Coder.

APPROVE
