# Plan review: theme-evolution-tailwind-t5a-spacing (Revision 1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-26. HEAD `fcc1261`. The plan is untracked in the working tree.

**Read:**

- The plan, all 401 lines.
- `CLAUDE.md` and `AGENTS.md` on disk. I grepped the "Rich text" sentence that §5.2 replaces: it occurs once in each file.
- `src/tailwind.css` in full. `assets/tailwind.css` (grep for the compiled `.prose :where(h4)` and `tbody td,tfoot td` rules).
- `node_modules/@tailwindcss/typography/src/styles.js`: the `DEFAULT` table block (`:1596-1630`) and the `base` modifier (`:373-415`), plus a grep for every `thead`/`tbody`/`tfoot`/`h5`/`h6` key.
- `docs/qa/evidence/t5as-owner/zoo.mjs`, and the four 1440 owner screenshots (`zoo-{A,B}-{live,staging}-1440.png`).
- The T5a QA report: Gates, Cross-build parity, and Owner check 3 (list and decisions).
- T5b §5.1 Step 3, §5.2, §5.5, Q5b.3 and the gating line (`:547`); T6a §5.6 (`:511-515`); T6b `ΔS_b` and RR2-2; the T6 index (`:63`).
- `docs/qa/harness/t5ac-lib.mjs:271-272` and `:338-340` (`OWN_SHOP`/`OWN_APP`).
- `sections/product.liquid:20-80`. Every `data-rich-text` line in the scanned folders. Greps for `<h5|h6|th|tbody|tfoot` and `not-prose` in theme markup, and for `richtext`/`inline_richtext` in `sections/`.
- The `docs/reviews/theme-evolution-tailwind-t5a-review.md` structure, for format.

Shopify Dev MCP: `learn_shopify_api` (Liquid) once; one `search_docs_chunks` on `richtext` tags, which was inconclusive (see manifest).

## Summary

The A fix is right, and it is the right size. I checked the diagnosis against the owner's screenshots, not only the derivations. Sample A on live is 676 px tall and on staging 614 px. The 62 px is about 27 px of `h5`→`h6` gap, about 6 px of `h6`→`p` gap and about 28 px of header-row height. The blockquote, `hr` and table-to-`details` gaps match to about 2 px. So D1 (`h5`/`h6`) and D2 (a `th` row inside `tbody`) are the whole of A's spacing defect. The selectors are correct:

- `[data-rich-text]` scope.
- `:where()` to stay below T0's trims.
- `:where(tbody, tfoot) th`, so `thead th` keeps prose's design.
- `@layer base`. Prose sets none of these properties on these elements, and base beats Preflight's `*` reset by specificity.

The byte count (284) recounts exactly. The mechanism tests C-S.4 and C-S.6 are good: each goes red on the specific wrong build it names.

The defects are in what reaches the owner and in two criteria:

- **No BLOCKER.**
- **Five REQUIRED findings:**
  - R1: an owner quote that isn't in the record.
  - R2: Q1 is framed without the evidence the owner needs to answer it.
  - R3: the (b+) budget breach is assigned to the wrong gate, and a hand-off is missing.
  - R4: C-S.10 can go red on a correct build, in two ways.
  - R5: C-S.5's measurands are undefined on one fixture and blind to two declarations.
- Ten nits.

Every fix is a local edit. None changes D1-D2.

## Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**

- `S_A` = 284. I recounted each minified string character by character: 55, 82, 75, 72. Lightning CSS keeps the source's shorthand `padding` and doesn't merge separate margins. The compiled `.prose :where(tbody td,tfoot td)` prints four longhands because the plugin's source has four. So the plan's strings are plausible, and Step 0 measures them anyway.
- §5.3 arithmetic:
  - 58,850 + 284 = 59,134.
  - 59,134 − 515 = 58,619 and 59,134 + 80 = 59,214.
  - 59,214 + 210 + 220 = 59,644; gzip 11,449 + 85 + 70 = 11,604.
  - 59,644 − 80 + 570 = 60,134.
  - 60,000 − 59,624 = 376 and 12,000 − 11,580 = 420.
- T6a ≤ +210 / +85 (T6a `:511-513`) and T6b ≤ +220 / +70 (T6b `:82`, `:563`).
- Plugin values in `styles.js` (`base` modifier):
  - `table` 14/16 em with a 24/14 line height.
  - `tbody td, tfoot td`: 8/14 em on all four sides; first child `padding-inline-start: 0`, last child `padding-inline-end: 0`.
  - `thead th`: no `padding-top`.
  - No key for `h5`, `h6` or a `th` outside `thead`.
  - `DEFAULT`: `tbody td` baseline, `tfoot td` top, `th, td` `text-align: start`.
- The compiled `.prose :where(h4)` (`margin-top:1.5em;margin-bottom:.5em`) and `tbody td` padding `.571429em` in `assets/tailwind.css`.
- Specificity: the T0 trims are (0,1,1), D1 is (0,1,0), D2a (0,1,1), D2b/D2c (0,2,1). Preflight's `*` is (0,0,0) in the same layer.
- `G_56`, `G_6p`, `X_col`, `H_hdr`, `X_tbl` and `PT_th` follow from those values. They also agree with the screenshots (above).
- The six `data-rich-text` wrappers in five files, all `prose prose-tokens`. The Supercycle block is a sibling of the description (`product.liquid:30` vs `:48`). There are no `h5`, `h6`, `th`, `tbody`, `tfoot` or `not-prose` in theme markup.
- §3.2's insertion anchor (`src/tailwind.css:320-324`) and §3.4's (`:301-303`).
- T5b:
  - Step 3 deletes every `.shopify-policy__body`-prefixed rule (`:244`).
  - The wrapper carries `data-rich-text` (`:253`).
  - "Steps 1 and 3 don't depend on Q5b.1" (`:215`).
- `OWN_SHOP`/`OWN_APP` exist where C-S.8 says.

**Sampled and found wrong:**

- §0 "Readings" and §1.1 attribute "otherwise close to live" to the owner (R1).
- The "Builds on" line names `cf1d92f` as HEAD (it is `fcc1261`), and it omits `sections/header-group.json` from the files changed after staging's push (R4).
- §5.3's "T5b's own Step 0 gate stops on the breach" (R3).
- §5.3's "about 60,054" (N6).

**Taken on trust:**

- `S_0` = 58,850 / 11,269. The T5a QA report's "Gates" says it, and I have no shell to re-measure.
- The `richtext`/`inline_richtext` tag lists. My MCP search didn't return the input-settings page, and the claim matches my understanding.
- The 19 `_html` keys.
- Lightning CSS's exact strings and every gzip delta. Step 0 measures these, and no criterion rests on them.

**Not covered by the manifest, so reviewed in full:**

- C-S.10's base build.
- C-S.5's measurands, fixture by fixture.
- Q1's dependence on T5b's gating.
- The T6 projections after this plan.

## Blocking issues

None.

## Required changes

### R1: REQUIRED (owner-facing; doesn't block a build). An owner quote that isn't in the record

§0 "Readings" says "The owner said A is 'otherwise close to live'", and §1.1 says "Everything else in A matches live closely (the owner's words …)". The recorded decision (T5a QA report `:102`) has one sentence from the owner: "The spacing on the staging screenshots looks off, let's fix those." No other file in `docs/` contains "close to live".

The conclusion holds; I measured it from the screenshots (Summary). But it is the plan's reading, not the owner's words. This text goes back to the owner at §7.2, and a misattributed quote is exactly the kind of wrong statement that propagates.

Fix:

1. Drop the quotation marks and the attribution.
2. State the basis instead: the 1440 A pair differs by 62 px, made up of the `h5`/`h6` gap, the `h6`→`p` gap and the header row; the other gaps match within about 2 px.
3. Tell the owner at §7.2 that head will still not equal live, by design:
   - `G_56` 24 against live's about 27;
   - `h6`→`p` 20 against about 27;
   - header row 40 against 52;
   - live's own header column is inset about 14 px from its data, and head aligns them.

The harness measures live too (§6.1 item 1), so put live's figures in the referent table next to staging's and head's.

### R2: REQUIRED (owner-facing question). Q1 lacks the evidence the owner needs, and hides two dependencies of (a)

The plan correctly flags that (a) narrows "fix those" and needs an explicit yes. But B is the screenshot that looks most broken: table cells run together ("Small148 cm45-60 kg"). The owner was also told B stands for "policy bodies, Shopify or app markup" (the zoo's own label). As framed, Q1 asks the owner to accept leaving that screenshot unchanged without telling them what it affects on their store. Three additions:

1. **Measure what B affects today.**
   - Add a read-only Step 0 census of every published store policy body on live: counts of `h5`, `h6`, `table`/`th`/`td`, `hr`, `blockquote`, `details`.
   - Put the result in Q1. If the counts are 0, (a) costs nothing visible today, and the owner should know that. If not, the owner should see that page.
   - The plan's "Not checked: whether Shopify's policy editor can insert tables or `hr` (irrelevant under Q1 (a))" is backwards: it is the evidence Q1 is decided on.
   - Also say that the Shopify and app markup on this store was already compared live vs staging (Supercycle picker, opt-out widget, owner check 3) with no bare-element spacing difference. So B's "Shopify or app markup" label overstates what B shows.
   - Relabel Sample B in `t5as-zoo2.mjs`, for example "SAMPLE B: plain markup (store policy bodies)", so the second round of evidence doesn't repeat the impression.
2. **(a) depends on T5b Q5b.3 (b), which is ⚑ and carries more than spacing.**
   - The plan says Q5b.3 is "not owner-gated". It isn't gated before coding, but T5b reviews every ⚑ item on staging before live (T5b `:547`).
   - Q5b.3 (b) also restyles the policy title: it becomes the one page title not in the heading font (T5b `:543`).
   - If the owner declines that at T5b (Q5b.3 (a)), the policy body stays unspaced, and no plan fixes it. Q1 (a)'s row must say so and name the fallback: Q1 (b)'s interim set, built then.
3. **(a) fixes the order: T5b before T6a/T6b.** §5.4 item 3 makes T5b next, while the project's working order had T6a/T6b next. Choosing (a) is also choosing that order, so say it in Q1's options.

### R3: REQUIRED (budget text that reaches the owner; a missing hand-off). The (b+) breach is assigned to the wrong gate

§5.3's (b+) row says: "if the owner picks it, T5b's own Step 0 gate stops on the breach". It won't. T5b alone fits:

- with the rest of T5b at its recommendations: 59,134 + 570 = 59,704;
- with Q5b.1 (b) and Q5b.2 (a) or (b) alongside (b+): 59,134 + 80 − 396 + 40 + 950 = 59,808.

The breach happens at whichever of T6a and T6b runs second: about 60,134, or up to about 60,238 in the second case. T5b's gate is green and the later plan's gate goes red.

Two consequences:

- **Correct the row:** T5b passes, and the later of T6a/T6b stops.
- **Add hand-offs to §5.5.**
  - The T6 index and T6a §5.6 (`:515`) both project "about 59,922 (78 B spare)" for the (b+) path. After this plan that path is over budget at T6a's and T6b's upper bounds.
  - Whoever asks the owner T5b's (b+) question must now say that (b+) plus T6a and T6b no longer fits unless one of them comes in under its upper bound.
  - This is a real cost of D1-D2's 284 B, so name it in §5.3.

### R4: REQUIRED (a criterion red on a correct build; doesn't block a build, blocks QA). C-S.10 can go red two ways

1. **Wrong base tree.**
   - C-S.10 compares staging #187953643616 (base) with the dev theme at head, and expects 0 differing pixels.
   - Staging was pushed from `905196f`. Since then the repo took live's `config/settings_data.json`, `templates/product.json` (`292c6e7`) and `sections/header-group.json` (`fcc1261`, the white logo swap).
   - `shopify theme dev` syncs the whole working tree, settings included, so head shows the repo's header.
   - Unless the owner made the same edits on staging (not recorded), every page's header differs, and C-S.10 is red on a correct build.
   - The plan's "Builds on" line omits `header-group.json` and names `cf1d92f` as HEAD; HEAD is `fcc1261`.
   - T5a's "0-pixel base-vs-base noise" was measured between two builds of one tree, which isn't the situation here.
   - **Fix:** make the base the same head page with D1-D2 removed in-page through CSSOM (T5a's same-page toggle; the rules are pure CSS, so this is exact), or a dev theme built from the pre-Step-1 commit.
   - Add a base-vs-base noise capture for the open Supercycle picker, which is new to the set and date-dependent.
   - Correct the "Builds on" line.
2. **Displacement too narrow.**
   - The exception allows matched elements and "their following siblings by exactly the listed delta".
   - When a fixture page's real content has a matched `h5`, every later element in document order moves, including the footer, and the ancestors grow.
   - That is T5a review R11 again. Allow every element after a matched one in document order, and its ancestors' heights, by the listed delta.
   - This bites only if R2's census finds real matches, but the census result is `[to be measured]`.

### R5: REQUIRED (two-sided test; a cheap fix). C-S.5 is undefined on ZR and blind to D2c and to D2a's `vertical-align`

- **ZR has no header row.** Every row starts with a `th`, so `X_col(c)` (header-row `th` vs the `td`s of the same column) and `H_hdr` have no referent on it. On staging ZR already has 40 px rows (its `td`s are padded), and its first column is already flush. ZR can therefore go red only through `X_tbl`, and only when D2b is missing. Say which measurands apply to which fixture.
- **No criterion sees D2c or `vertical-align: baseline`.**
  - `X_col` measures left edges. Dropping D2c only adds 8 px of end padding to the last header cell, which a 100 %-wide table absorbs.
  - Single-line cells align the same under `baseline` and `middle`.
  - A build missing either declaration passes C-S.1 to C-S.14.
  - **Fix:** add a computed-style assertion to C-S.5 for each header-row `th` in zoo A and each row-header `th` in ZR: the four paddings (start 0 on the first cell, end 0 on the last, 8 px otherwise) and `vertical-align: baseline`. Or drop D2c with a stated reason.

## Nits (none blocks; each is conservative or a clarity fix)

- **N1.** `CLAUDE.md` "Cascade layers" says new CSS "MUST sit inside `@layer components`", but that rule is about unlayered section and block CSS. The "One source" bullet sanctions base element styles in `@layer base`, and T5a set the precedent. Add one sentence in §3.2: `components` would beat the base-layer T0 trims, so `M_nest` would be 24. Also add "D1 in `@layer components`" to C-S.4's red column. That makes the existing criterion carry the argument, and keeps QA from reading the placement as a rule breach.
- **N2.** `H_hdr`: name the body row (the first). Prose's `tbody tr:last-child` has no bottom border, so comparing against the last row sits on the edge of the ±1 tolerance.
- **N3.** D2a gives `tfoot th` `vertical-align: baseline`, but prose's `tfoot td` is `top`. Either split `vertical-align` to `:where(tbody) th` or record it as accepted (R3 already mentions `tfoot`).
- **N4.** D1-D2 don't honor prose's `not-prose` escape hatch. Nothing in the theme uses it (grep: 0), so it is harmless today. Accept it explicitly.
- **N5.** §5.3's T5b lower bound −515 assumes `S_pol` = 491. HEAD has no policy-body `:empty` rule, so `S_pol` = 396 and T5b's recommended net is −420 to −380. Only the lower bound changes, which is conservative.
- **N6.** "Q1 (b), T5b Q5b.3 (a) keeps the set, then T6a + T6b: about 60,054" is the case where T5b adds nothing. Over T5b's branches the figure is 60,030 to 60,134, over the budget either way.
- **N7.** C-S.12: replace "meets C-S.3/C-S.5's spacing intent" with numbers for zoo P: `G_56` = 24, `X_col` = 0, `H_hdr` = 0, `X_tbl` = 0 (±1).
- **N8.** §3.1 cites `image-banner.liquid:687, :728` and `related-products.liquid:85` under "Where it renders". Those are schema lines.
- **N9.** §5.2's new sentence says the rules cover "what `prose` leaves unstyled (empty elements stay hidden; …)". Prose does style empty headings (that is why the `:empty` rule exists), and D2 covers `tfoot` too. Suggested wording: "carries rules in `src/tailwind.css` for merchant HTML (empty elements stay hidden; `h5`, `h6` and `th` cells outside `thead` get spacing that `prose` doesn't give them);". Keep C-S.9's counts.
- **N10.** In the T5b hand-off, the policy body sits under `.shopify-policy__container`, which is in `OWN_SHOP`. A T5b census that reuses C-S.8's owner classes would therefore class merchant policy content as Shopify-owned and stop on a correct build. Note it in §5.5's T5b row.

## Answers to the orchestrator's specific questions

1. **Can the selectors match theme, Shopify or app markup?**
   - Theme: no. There is no `h5`, `h6`, `th`, `tbody` or `tfoot` in any scanned file, and every `[data-rich-text]` box holds only merchant output.
   - App: Supercycle renders as a sibling of the description box, not inside it, so it can't match.
   - Shopify: the one place Shopify markup sits inside an A box is the opt-out widget in `page.content`. C-S.8's census covers it, with a stop.
   - After T5b, the policy body becomes an A box. That is intended, and the hand-off says so (see N10 for its census).
   - The selectors are sound. What needs work is the framing of where B's breakage lands (R2).
2. **The CSS-cost estimates and the budget arithmetic.** The 284 recounts, and every sum in §5.3 checks except two:
   - the (b+) row's gate is wrong (R3);
   - "60,054" is one branch of a range (N6).

   Against 58,850 / 11,269, this plan leaves 866 B / 731 B. The worst non-(b+) path after T5b, T6a and T6b ends at about 59,644 / 11,604, still inside the budget. This plan is what pushes the (b+) path over, and that needs saying to the owner (R3).
3. **Are the open questions framed fairly?**
   - Q1 correctly asks for an explicit yes, but it lacks the census that would let the owner judge it, and it omits two dependencies: Q5b.3 (b) itself being ⚑, and T5b running before T6 (R2).
   - Q2-Q4 are fair. The screenshots confirm that live shows `h5`/`h6` at body weight. Q3 (b) is correctly priced: a base rule can't out-rank prose's utilities-layer `td:first-child`.
4. **Would the QA criteria catch a wrong build?** Mostly, yes.
   - C-S.3, C-S.4, C-S.6, C-S.7 and C-S.11 each go red on the wrong build they name. I checked each against the cascade.
   - The gaps:
     - C-S.5 can't see D2c or D2a's `vertical-align`, and it is undefined on ZR (R5);
     - C-S.10 goes red on a correct build because its base is a different tree (R4).
   - The plan's discrimination sentence holds for the rejected alternatives it names. Q1 (b) built under (a) is caught by C-S.10 through the policy page (it is in T5a's 18-page set).

## Checked and found sound

- §1.1's root cause: the plugin has no `h5`/`h6` rules and no rule for a `th` outside `thead`, and a `<tr>` of `th` without `<thead>` lands in the implicit `tbody`.
- D1 after `hr`, `h2`, `h3` or `h4`: prose's `hr + *` / `h4 + *` (utilities layer) still zero the top margin, which keeps prose's rhythm.
- `G_6p` = 20 on both builds is a correct guard. The accepted limitation, and the rejection of nesting inside `@utility prose-tokens`, are sound.
- The `thead`/`tbody` split: a `[data-rich-text] th` rule would add `padding-top` to `thead th` (prose doesn't set it), and C-S.6 catches that.
- §5.2 leaves T5b Step 4's two replacement strings intact.
- Q1 (b)'s set is fully deleted by T5b Step 3's prefix rule, and C5b.7(a) checks it.
- Rollback, live sequencing (never ahead of T5a), and DevOps targeting staging #187953643616 with no publish.

## Trajectory

This is round 1. The design is small and correct, and the diagnosis survives an independent check against the owner's own evidence. The findings are about owner-facing text (R1, R2, R3) and two criteria (R4, R5). Each is a local edit. I expect round 2 to be a short confirmation.

## Required changes

1. **R1.** Remove the "otherwise close to live" owner attribution (§0 Readings, §1.1). State the measured basis instead. Add live's `G_56`, `G_6p`, `H_hdr` and `X_col` to the referent table, and tell the owner at §7.2 that head differs from live by design.
2. **R2.** Q1:
   - (i) Add a Step 0 read-only census of live policy bodies' `h5`, `h6`, table, `hr`, `blockquote` and `details` counts, and put the result in Q1. Note the existing live-vs-staging app and widget comparison, and relabel Sample B in `t5as-zoo2.mjs`.
   - (ii) State that (a) depends on T5b Q5b.3 (b), which is ⚑ and restyles the policy title, and name the fallback if the owner declines it.
   - (iii) State that (a) puts T5b before T6a/T6b.
3. **R3.** §5.3: under (b+), T5b's gate passes (about 59,704 to 59,808) and the later of T6a/T6b breaches. Add §5.5 hand-offs to the T6 index and T6a §5.6, whose "about 59,922 (78 B spare)" no longer holds. Name this as a cost of the 284 B.
4. **R4.** C-S.10:
   - Use as the base the head page with D1-D2 removed in-page (or a dev theme from the pre-Step-1 commit), not staging, whose settings and header group predate `292c6e7`/`fcc1261`.
   - Add a noise capture for the open Supercycle picker.
   - Widen the displacement exception to everything after a matched element in document order, plus ancestor heights.
   - Correct the "Builds on" line (HEAD `fcc1261`; `sections/header-group.json` changed).
5. **R5.** C-S.5: state which measurands apply to ZR. Add computed-style assertions for every header-row and row-header `th` (four paddings by position, `vertical-align: baseline`), so a build missing D2c or D2a's `vertical-align` goes red.

APPROVE WITH CHANGES

---

## Round 2 (Revision 1.1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-26. HEAD `fcc1261`.

**Read:**

- The plan, all 455 lines.
- `CLAUDE.md` (in context; no rule this revision touches has changed).
- The T5a QA report `:103`, where the owner's answer is recorded.
- `docs/qa/evidence/t5ac-liveprobe-ref.json`: greps for every element path under the policy container, and the entries at `:3955-3984`.
- `docs/plans/theme-evolution-tailwind-t6.md:61`, `t6a.md:22` and `:515`, `t6b.md:20` (grep for `59,922`).
- `sections/image-banner.liquid` and `sections/related-products.liquid`: the setting output lines.

### Summary

All five round-1 required changes are resolved, and nine of the ten nits are applied. N3 was declined, with a sound reason. The new material is sound:

- the policy-body count `N_pol` and its live re-count with a stop (Step 0 item 2a);
- the same-page base `head-off`, which removes the whole compiled diff `R_new`, not just four named rules;
- C-S.5's per-fixture measurands;
- the §5.5 hand-offs.

Moving the base to `head-off` is better than either fix I suggested. Deleting the whole diff means a rule built by mistake is toggled too, and C-S.11 pins the diff to exactly D1-D2.

One new REQUIRED finding comes out of that rework. C-S.10 is "valid only if `head-off`'s control flips", but the control is defined on zoo measurements, and the 18 sweep pages carry no zoo. As written, C-S.10 can't be valid on a correct build. The fix is one sentence, and it doesn't touch Steps 0-4: QA runs C-S.10. **The Coder can start now.**

### Manifest: what I sampled and what I took on trust (round 2)

**Sampled and confirmed:**

- **The owner's answer.** The T5a report `:103` reads verbatim: "Go with your recommendation for the plan and check 6." It is recorded as Q1-Q4 (a). "Check 6" is item 6 of owner check 3 (E5a.12, the captcha page), not part of this plan, and the plan doesn't read it as one.
- **`N_pol`.** I grepped the reference file myself:
  - No `rel` path anywhere in the file contains an `h5`, `h6`, `table`, `tbody`, `thead`, `tr`, `th`, `td`, `hr`, `blockquote`, `summary` or `details` step.
  - Under `div.shopify-policy__container`, the highest `h2` index is `h2:13` (no `h2:14`). The entries have the shape the plan describes (`rel` `div:2>div:1>div:1>h2:13`, `word-break`).
- **§5.3, recomputed:**
  - 59,134 − 420 = 58,714.
  - 59,134 + 570 = 59,704; 59,134 + 80 − 396 + 40 + 950 = 59,808.
  - Adding 430 gives 60,134 and 60,238.
  - 59,624 − 24 + 430 = 60,030 and 59,624 + 80 + 430 = 60,134.
- **The (b+) citations.** The T6 index `:61` and T6a `:515` carry "about 59,922". My round-1 `:63` was the wrong line, and the plan corrected it.
- **The live figures now in §0.** I re-read them from `zoo-A-live-1440.png`:
  - `X_col`: about +14, +6, +6 (column 1 header text at x ≈ 22 against data at ≈ 8; columns 2-3 about 6 px right).
  - Header row about 52 px against body rows about 41 px.
  - These are consistent with Dawn's `padding: 1em` at 14 px on the header cells, and prose's 8 px winning on the data cells.
- **C-S.5(c)'s values.** 0.571429em × 14 px = 8.000 px. The position pattern is right for both fixtures:
  - header row: first `th` 0/8, middle 8/8, last 8/0;
  - ZR: each row-header `th` is first and not last, so 0/8 with 8 top and bottom.
  - The D2a-missing state is `vertical-align: middle` (the UA `th` inherits it from `tbody`; prose sets `baseline` only on `td`).
- **N8's render lines:** `image-banner.liquid:388`, `:405`; `related-products.liquid:50`.
- **N3's cost.** `[data-rich-text] tfoot th{vertical-align:top}` is 45 characters, so "about +50 B" holds.

**Taken on trust:** `N_pol`'s inference rests on Dawn having had a recorded, valid declaration for every element type listed. That comes from T5a §3.4, which I didn't re-read this round. It is backed by Step 0 item 2a's direct live count, with a stop, so nothing ships on the inference alone.

**Not covered by the manifest, so reviewed in full:**

- `head-off`'s validity rule against every page C-S.10 runs on (R2-1).
- How the displacement exception behaves with more than one match (n1).
- Whether `R_new`'s one-directional diff can include a modified existing rule (n2).

### Status of round-1 items

| Item | Status | Note |
|---|---|---|
| R1 | **closed** | The attribution is removed from §0 and §1.1, and the basis is stated as the Architect's and reviewer's reading. Live values are in §0, and §7.2 tells the owner that head differs from live by design, with the figures |
| R2 | **closed** | (i) `N_pol` = 0 for every listed element, 13 `h2`; Step 0 item 2a re-counts on live and stops before QA on a non-zero count; Sample B is relabelled; the earlier live-vs-staging app and widget comparison is cited. (ii) The Q5b.3 dependency, the ⚑ status, the policy-title cost and the fallback (§3.4, built then) are in Q1's row, §3.3 and the hand-offs. (iii) The order is stated in §5.4 item 3 and §5.5. Recording that the owner's answer stands without re-confirmation is acceptable: the evidence points the same way, the fallback protects the one dependency, and a non-zero live count sends Q1 back (see n4 on the order) |
| R3 | **closed** | Under (b+), T5b's gate passes and the later of T6a/T6b breaches. It is named as a cost of the 284 B, with hand-offs to the T6 index, T6a §5.6 and the (b+) owner question |
| R4 | **closed, with one new gap** | The base is `head-off` (same page, same load, `R_new` deleted). It adds the picker noise capture, widens displacement to document order plus ancestor heights, and corrects "Builds on". The validity rule it introduces has a gap on the sweep pages (R2-1) |
| R5 | **closed** | Measurands are stated per fixture. ZR is limited to `X_tbl`. Computed-style assertions now go red on D2a, D2b or D2c missing and on a missing `vertical-align` |
| N1, N2, N4-N10 | applied | N1's sentence is accurate, and C-S.4's red column names the `components` build. N10's hand-off is right |
| N3 | **declined; acceptable** | The difference shows only for a multi-line `th` inside `tfoot`. The fix costs a fifth rule (about 45 B) and no criterion depends on it. It is conservative, and it is now recorded as accepted in §3.2. I agree |

### Required changes (round 2)

#### R2-1: REQUIRED (validity unreachable on a correct build; doesn't block Steps 0-4, fold in before QA). C-S.10's control exists only on the zoo page

C-S.10 is "Valid only if `head-off`'s control flips (§6.1 item 1)". §6.1 item 1 defines that control as "`G_56` reads 0 and `X_col(2)` reads −8". Those are zoo measurements, on `/pages/contact` with the samples injected. C-S.10 sweeps T5a's 18 pages, the picker page and the opt-out page, none of which carries the zoo. Injecting the zoo there would change the pages under comparison. Read literally, C-S.10 has no valid run on a correct build. QA would have to improvise, and improvised validity rules are what made earlier rounds stall.

**Fix.** Give each sweep page its own control, injected outside both captures:

1. Load the page and capture `head`.
2. Append a probe `<div data-rich-text><h5>a</h5><h6>b</h6></div>` and read the `h6`'s `margin-top` (expect 24 px). Remove the probe.
3. Delete `R_new` (the removal count must equal `|R_new|`) and capture `head-off`.
4. Append the probe again and read the `margin-top` (expect 0). Remove the probe.

Both readings must hold for the page's run to be valid. Alternatively, state that on sweep pages the removal count alone is the validity check, and keep the zoo control for the zoo runs. That is weaker, because it doesn't prove the deletion took effect on layout, but it is acceptable.

### Nits (round 2; none blocks)

- **n1.** C-S.10 (2): if a page has more than one match, elements after the second move by the sum of the deltas. "By exactly that match's listed delta" reads as the single delta. Say "the sum of the listed deltas of every match before it". This only matters if Step 0's census finds real matches, which is expected to be 0.
- **n2.** `R_new` is "every rule head has that the pre-Step-1 file lacks". If Lightning CSS ever merged a D1-D2 declaration block with an adjacent existing rule, `R_new` would include a modified existing rule. Deleting it would also delete that rule's original effect, so `head-off` would no longer equal the pre-Step-1 page. C-S.11 would go red, which is the safe direction. The neighbouring rules here share no declarations, so this is unlikely. Say that a C-S.11 failure of this kind is a stop with a coder question, not a defect in D1-D2.
- **n3.** §9's first-revision line "`G_56`, `G_6p`, … are `[derived]` … not read from the owner's screenshots (their pixel scale is unknown)" now sits beside §0's live values, which were read from those screenshots. Element screenshots at the default device scale factor are 1:1 CSS px. Add "(live values since Revision 1.1: read from the 1440 screenshots, 1:1)" so the manifest doesn't contradict §0.
- **n4.** The owner answered Q1 before Revision 1.1 stated that (a) puts T5b ahead of T6a/T6b. The §5.5 "Project order" hand-off covers it. The orchestrator should mention the order in the next owner message, as information, not as a re-ask.
- **n5.** `t6b.md:20` (the RR2-2 changelog row) and `t6a.md:22` (the N2-1 changelog row) also say "about 59,922". They are historical changelog entries, so they need no edit, but whoever applies the §5.5 hand-off shouldn't treat them as misses.

### Trajectory (round 2)

Round 1 had five REQUIRED findings and ten nits, all about owner-facing text and two criteria. Round 2 has one REQUIRED finding, a validity sentence introduced by the R4 rework, plus five nits. The design hasn't changed since Revision 1 and has held up under two independent checks. Once R2-1 is folded in, no re-review is needed. Steps 0-4 can proceed now, because R2-1 affects only QA's C-S.10.

### Required changes (round 2)

1. **R2-1.** Give C-S.10 a per-page validity control that works without the zoo. Either use a probe injected after each capture (24 px with the rules present, 0 after deleting `R_new`, removed before the next capture), or explicitly make the removal count the sweep pages' validity check.

APPROVE WITH CHANGES

---

## Closeout (Revision 1.1.1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-26. HEAD `fcc1261`.

**Read:** the Revision 1.1.1 changelog (`:11-18`), §6.1 item 1, C-S.10, C-S.11 and §9 (`:446`, `:458-466`). I also grepped `layout/`, `sections/`, `snippets/` and `templates/` for a `<main` element and for the `content_for_layout` line in each layout.

### R2-1: the mechanism is right, but it points at an element the theme doesn't render

The probe design is correct:

- It is appended after each capture and removed before the next, so it never appears in a screenshot.
- It reads 24 px with the rules present and 0 after `R_new` is deleted, and it pairs those readings with the removal count.
- Reading the `h6` is the right choice. The `h5` is the probe's first child, so T0's first-child trim zeroes its top margin either way. The `h6` isn't first, and the last-child trim touches only its bottom margin, so its `margin-top` really does flip 24 → 0.

The target is wrong. §6.1 item 1 says "append `<div data-rich-text>…</div>` **to the end of `main`**". Neither layout renders a `<main>`:

- `layout/theme.liquid:44` prints `{{ content_for_layout }}` straight into `<body>` after the header group.
- `layout/password.liquid:20` does the same.
- The only `<main>` in the theme is `templates/gift_card.liquid:22`.

So on every C-S.10 page (the 18-page set, the picker page, the opt-out page), `document.querySelector('main')` returns `null`. The probe can't be appended, the page has no valid run, and C-S.10 can never be valid on a correct build: the same failure R2-1 was raised to fix. This is the right mechanism attached to the wrong element.

#### RC-1: REQUIRED, one word; affects the harness the Coder writes at Step 0. Append the probe to `body`

- In §6.1 item 1, replace "to the end of `main`" with "to the end of `body`". The probe is removed before every capture, so where it sits doesn't matter. Its computed `margin-top` doesn't depend on its position either: it is 1.5 × its computed font size, which is 16 px when inherited from `body`, since the theme sets no font size there.
- For robustness, the expected value can be written as "1.5 × the probe `h6`'s computed `font-size`". That is optional.

### Nothing else changed

- **The changelog matches the edits.** It lists only R2-1 and n1-n3. C-S.10's validity clause names the probe and the removal count.
- **n1:** the displacement allowance is now the sum of the deltas of every earlier match, and an ancestor's growth is the sum of the deltas of the matches inside it.
- **n2:** a merged rule in `R_new` is a stop with a coder question, stated in §6.1 item 1 and in C-S.11.
- **n3:** §9 `:446` now says the live values were read at 1:1 CSS px.
- **n4 and n5** are left to the orchestrator and to the hand-off reader, which is fine.
- No step, decision, figure, D1-D2 rule or other criterion moved. Steps 1-4 and the budget are as approved in round 2.

### Trajectory

Round 1 had 5 REQUIRED findings, round 2 had 1, and this closeout has one one-word fix. When RC-1 is applied, no further review is needed. A grep showing "end of `body`" (and no remaining "end of `main`") in §6.1 item 1 is enough to record `APPROVE` here.

### Required changes (closeout)

1. **RC-1.** §6.1 item 1: append the C-S.10 probe to the end of `body`, not `main`. Neither layout renders a `<main>`.

APPROVE WITH CHANGES

---

## Closeout confirmation (Revision 1.1.2)

**RC-1 is closed.** Grep evidence:

- §6.1 item 1 (`:338`) now reads "append `<div data-rich-text><h5>a</h5><h6>b</h6></div>` to the end of `body`", and "end of `main`" no longer appears anywhere in the file.
- The three remaining `main` mentions are the changelog row (`:15`) and the git branch (`:312`, `:420`).
- The Revision 1.1.2 changelog lists only RC-1.

No open findings remain.

APPROVE
