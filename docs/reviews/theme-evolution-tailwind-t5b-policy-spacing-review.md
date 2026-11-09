# Review: theme-evolution-tailwind-t5b-policy-spacing (Revision 2)

Reviewer: Plan-Reviewer, 2026-11-08. Plan: `docs/plans/theme-evolution-tailwind-t5b-policy-spacing.md`, Revision 2 (2026-11-07). First review round for this slug.

Re-read for this pass: `CLAUDE.md`, `AGENTS.md`, `.claude/agents/devops.md`, `layout/theme.liquid`, `sections/page.liquid`, `src/tailwind.css` (whole file), `snippets/css-variables.liquid`, `config/settings_schema.json` (page width and margin settings), T5b plan §5.2 and C5b.7, the compiled `assets/tailwind.css` (targeted greps), `docs/qa/t4cpq/measure.json`, `docs/qa/evidence/t5bc-v3-final.json`, `docs/qa/evidence/t4cc-overflow-base.json`, the T5b and T6a QA reports, and the reflog for commit order.

## Summary

The design is sound. Three boxes copy a page section: the side column, the shell and the `prose` box. Shopify's 20 px container padding is zeroed with an `!` utility the project rules allow, and one arbitrary variant clears the trailing chain of bottom margins. This meets all three owner asks (top, phone sides, bottom), and the geometry matches the opt-out page at every test width. I recomputed it from the settings and the compiled rules and found no error. Most criteria are two-sided, and the most important ones can tell the chosen design from the rejected alternatives.

The remaining defects are small:
- the inline comment breaks a `CLAUDE.md` comment rule;
- the live cherry-pick procedure (R7) has a vague base commit, and it would trip DevOps's own gates;
- the orchestrator's answer on the smoke test has to be added as a step.

None of these blocks the Coder's work on `main`. Required change 1 is needed before the commit. Changes 2 and 3 are needed before the live push.

## Point-by-point on the orchestrator's six questions

### 1. The bottom-margin variant `[&_:last-child:not([data-rich-text]_:not(:last-child)_*)]:mb-0`

**Does Tailwind 4.3.3 compile it?** Very likely, but no one has confirmed it. A8 is the gate, with a stop condition, which is the right way to handle it.
- How v4 parses an arbitrary variant: it decodes `_` to a space and accepts any bracket-balanced selector that contains `&`.
- Nested `[...]` and `(...)` inside an arbitrary variant are standard v4 usage, for example `[&>[data-slot=icon]]:` and `[&:not(:first-child)]:`.
- This repo has no precedent for nested brackets. Its compiled `&_` variants (`.\[\&_a\]\:underline a{…}`) do confirm the expected output shape: `.<escaped> :last-child:not([data-rich-text] :not(:last-child) *){margin-bottom:0}`, as §3 predicts.

**Does it select exactly the trailing chain?** Yes.
- An element E matches when two things hold:
  - E is a `:last-child` descendant of the `prose` box;
  - E has no ancestor X that is not a last child and that sits under a `[data-rich-text]` element.
- The `prose` box is the only `[data-rich-text]` element on the page (only `layout/theme.liquid:46` carries it in this branch), so X ranges over exactly the elements strictly between E and the `prose` box. That is `TC` as §0 defines it.
- The `[data-rich-text]` anchor is necessary, not decoration. Without it, X could be box A, which is not a last child: `{% section 'cart-drawer' %}` follows it in `body`. Every element would then be excluded, and the rule would silently do nothing.
- Inline members of the chain (an `a` or `strong` at the end of the last paragraph) also match. A bottom margin has no effect on an inline box, so this is harmless.

**Does it beat `prose`?** Yes.
- `prose` is in `@layer utilities` in the compiled file. I measured this: `@layer utilities{` is followed by `.prose{…}`, then `.prose :where(p):not(:where([class~=not-prose],[class~=not-prose] *)){margin-top:1.25em;margin-bottom:1.25em}`.
- Its rules are (0,1,0). The variant is (0,4,0) in the same layer, so the plan's specificity arithmetic is right.
- The base-layer `:is(p,…):last-child{margin-block-end:0}` loses to `prose` because it is in a lower layer. That is why the trailing `p` keeps its 20 px today, which confirms root cause 3.
- One case the variant can't win: an **unlayered** Shopify rule that sets `margin-bottom` on a member of `TC`, such as `.shopify-policy__body`. A3 would catch it ("every member of `TC` computes `margin-bottom: 0`"). See NIT N3.

**Is there a simpler, more readable Tailwind-only form that is equally correct?** I found none that is both generic and shorter:
- `[&_:last-child]:mb-0` is too broad. A5 catches it: the policy has 5 `ul`s (`nUl` 5 in `t5bc-v3-final.json`), so mid-body last `li`s are witnesses.
- `[&>*>:last-child]:mb-0` stops at `.shopify-policy__body`. A3 catches it.
- Depth-fixed chains such as `[&>:last-child>:last-child>…]` need one class per depth and break when merchant HTML nests differently.
- `@custom-variant` in `src/tailwind.css` is excluded by the non-goals and the owner's no-custom-CSS rule.
- A self-anchored `[&_:last-child:not(&_:not(:last-child)_*)]:mb-0` would drop the `[data-rich-text]` coupling. It depends on whether a nested `&` is substituted inside `:not()`, which I haven't verified. It's an option only if A8 shows the planned form failing, not a requirement.

So the one-liner is justified. Its readability depends on the comment, and the comment needs one fix (R-1) and would benefit from one rewording (N1).

### 2. `*:px-0!` against Shopify's `.shopify-policy__container { padding: 0 20px; max-width: 65ch }`

- **Is `!` justified under `CLAUDE.md`?** Yes. The colliding rule is Shopify-hosted, so it "can't be changed". The Liquid comment names it by selector and says it is unlayered.
- **Is the mechanism correct?** Yes. A normal unlayered declaration beats every layered normal declaration, and any layered `!important` declaration beats it. `padding-inline` and the shorthand's left/right longhands resolve through the cascade, so the important logical declaration wins.
- **What if the rule is layered?** R1's Step 0 check and its fallback (drop `!` if the rule is layered) keep the `!` honest.
- **`max-width: 65ch`.** Correctly left alone. The container inherits the `prose` box's font (1rem, body family), so its 65ch is the same 646.875 px as the `prose` box's own 65ch cap. B's `calc(65ch + 4rem)` resolves in the same body font. With the padding at 0, the border-box cap equals the `prose` width at the cap and is inactive below it.
- **The claimed 606.9 → 646.9 desktop column holds:** 646.875 − 2 × 20 today, 646.875 after. It is sourced from `t5bc-v3-final.json`, which records the container's computed `maxWidth` "646.88px" and `padding` "0px 20px".
- **The trade-off:** the `!` also hits any `<style>`, `<link>` or `<script>` Shopify prints as a direct child. That is harmless.

### 3. Three nested boxes

**Correct at 320-1440.** I recomputed with pm = 20 and 65ch = 646.875:

| vw | B width @ x | `prose` x / width | Opt-out measured (`measure.json`, shell / `prose`) |
|---|---|---|---|
| 320 | 280 @ 20 | 52 / 216 | 20 w280 / 52 w216 |
| 375 | 335 @ 20 | 52 / 271 | 20 w335 / 52 w271 |
| 768 | 710.875 @ 28.56 | 60.56 / 646.875 | 28.6 w710.9 / 60.6 w646.9 |
| 1024 | 710.875 @ 156.56 | 188.56 / 646.875 | 156.6 w710.9 / 188.6 w646.9 |
| 1440 | 710.875 @ 364.56 | 396.56 / 646.875 | 364.6 w710.9 / 396.6 w646.9 |

**Robust to the settings.**
- `max_page_width` options are 90rem and 110rem, and both exceed 710.9 + 2pm.
- `min_page_margin` ranges 10-100 and feeds A and the section grid identically.
- A is a stretched flex item, and cross-axis stretch ignores min-content. A long word therefore overflows visibly (A7) rather than widening A.

**Is it the simplest structure?** Effectively yes.
- A and B can't merge: B needs auto margins to center, and A's padding stands in for the grid's side column.
- B and `prose` can't merge: `prose`'s border-box `max-width: 65ch` would then include B's 64 px of padding. The manifest's A4 row already identifies that failure.
- Wrapping in a real `shopify-section` class would reuse the grid directly, but it puts a Shopify class in markup that Shopify's and apps' scripts query. The plan is right not to.
- `w-full` on B is redundant, because B is a block in a block. It mirrors `page.liquid:9` and costs 0 B. Not worth changing.

### 4. Criteria A1-A10 and stop conditions

The criteria tell success from failure and can be run on dev theme 188245508192. Two-sided check:
- **A2 and A4** separate the chosen design from both rejected forms. Without the `!`, `T_L` = `C_L` + 20. Keeping Shopify's 20 px and compensating on phones leaves the desktop column at 606.9 instead of 646.9.
- **A3** separates the variant from `[&>*>:last-child]` whenever the body ends in a block with a margin. Step 0 records which element that is.
- **A5** separates it from the broad `[&_:last-child]`. That works on this store's content because it has mid-body lists. See N2: record the witness.
- **A8** is the compile gate.

The stop conditions are clear: R1 (no rule found), R2 / A7 (overflow), R3 (the deepest member of `TC` isn't the last visible text block), and A8 (an extra selector, or the variant doesn't compile).

### 5. The T5b amendment and the rule files

- **C5b.7(a):** correct, read against §3's block.
- **C5b.7(c):** the new width clause, `min(65ch, vw − 2pm − 64)`, describes `[data-policy-prose]` correctly: 216 at 320, 646.875 at the cap. The "left edge ≥ `--page-margin`" clause holds (52 ≥ 20).
- **`CLAUDE.md` / `AGENTS.md`:** no edit needed. I checked the "Rich text" bullet, which says policy pages get `prose` and `data-rich-text` from a wrapper in `layout/theme.liquid`. That stays true, and neither file quotes the wrapper's classes.
- **Other coupling:** nothing else selects the wrapper. A search for `policy` across `assets/*.js`, `layout/`, `sections/`, `snippets/` and `blocks/` finds only `layout/theme.liquid:44-46`.

### 6. The live cherry-pick (R7) and the smoke test

The rebuild-on-conflict steps are right: take either side, `npm ci && npm run build:css`, `git add`, `--continue`, then `check:css`. Three gaps, all in text that reaches DevOps, so they are REQUIRED (R-2 and R-3 below):
- **The base commit is ambiguous.**
  - From the reflog, T5b's code commits are `942a661` (Step 3) and `2e0d855` (Step 2), so "T5b's last code commit" is `2e0d855`.
  - But `5f76df4` (T5b Step 4's `CLAUDE.md` rule sentences) and the T5b docs come after it, and the last commit before T6a is `7b8221b`.
  - Both have the same theme files if no code commit falls between them, which the reflog suggests. The plan should still name one SHA and give a check.
- **DevOps's gates would fail on that branch.**
  - `.claude/agents/devops.md` gates 1-2 need `docs/qa/<slug>.approved` and `docs/qa/<slug>-report.md` in the working tree. This fix's approval and report are committed on `main` only and don't exist on a branch cut from `7b8221b`/`2e0d855`.
  - DevOps's audit-trail commit would also land on the side branch.
  - The procedure needs to say where the gates are read from, which slugs the live deploy covers, and where the deploy note is committed.
- **The orchestrator's decision isn't in the plan yet.** The T5b-plus-fix tree gets an unpublished smoke test on dev theme 188245508192 before the live push.

## Findings

### Required (non-blocking unless stated)

**R-1 (REQUIRED, blocks the commit, not the start of work). The inline comment contains the single-word utility name `prose`.**
- §3's comment ends "…; prose clears its direct last child only."
- `CLAUDE.md` ("Complete class names only"): "keep single-word utility names out of comments".
- T5b review R6 required exactly this word out of this same layout comment, and T5b §5.2 rewrote it as "the typography plugin".
- It costs 0 B, because `.prose` is compiled anyway. But the Coder will copy the comment verbatim, and QA checks `CLAUDE.md` rules.
- Fix: "…; the typography plugin clears only its direct last child."

**R-2 (REQUIRED, blocks the live push only). Make R7 runnable by DevOps as written.**
1. Name the base SHA. I recommend `7b8221b`, the last commit before T6a's `67b6839`. Add a check that `git diff --stat 2e0d855 7b8221b -- layout sections blocks snippets templates assets config locales src` is empty.
2. Build in a `git worktree` (`git worktree add <path> -b t5b-live 7b8221b`) rather than `git switch`. `main`'s checkout and its many untracked `docs/` files then stay untouched, and `main`'s docs stay readable.
3. State how DevOps's gates apply:
   - gates 1-2 are read from `main` for both `theme-evolution-tailwind-t5b` and this slug;
   - gates 3 and 5 run in the worktree (clean tree, then `npm ci && npm run check:css`);
   - `.claude/agents/devops.md`'s full live procedure applies unchanged: backups, the template and section-group JSON diff, the push from the worktree's root, and the post-push `settings_data.json` check;
   - the deploy note and audit commit go on `main` and record the worktree's SHA.
4. Before cherry-picking, confirm that `layout/theme.liquid` is unchanged between the base and the fix's parent (`git diff --stat 7b8221b <fix>^ -- layout/theme.liquid`). The plan's current evidence is a search of the T6a *plan* text, not of the commits.

**R-3 (REQUIRED, blocks the live push only). Add the orchestrator's answer as a step and close §9.**
- Before the live push, push the worktree's committed tree to dev theme 188245508192, using `shopify theme dev` or `shopify theme push --development` from the worktree.
- Assert `Shopify.theme.id` = 188245508192, and check:
  - A1, A2, A3 and A7 on `/policies/privacy-policy` at 375 and 1440 (A7 also at 320);
  - T5b's own markers: `[data-policy-prose]` count 1 on the policy page and 0 on `/` and `/products/the-complete-snowboard`; T5b Step 2's line-height outcome;
  - that one T6a marker is **absent**, which proves the right tree is on the theme;
  - no console errors on the home page, a product page and `/collections/all` at 375 and 1440;
  - `shopify theme check` reports 0 offenses in the worktree, and the worktree's `S_css` is recorded.
- Record the results in the deploy note.
- Note that this overwrites the agents' dev theme with a tree that has no T6a. The next dev session from `main` re-syncs it.
- Remove the question from §9.

### NITs (none blocks)

- **N1.** Comment readability: "(the last element and its last ancestors)" is easy to misread. Suggest: "zeroes the bottom margin of the last element at every depth, skipping any element with a wrapper above it, inside this box, that has a later sibling. Keep `data-rich-text` on this box; the variant is anchored to it." The second sentence documents the hidden coupling noted under question 1.
- **N2.** A5: record how many non-`TC` `:last-child` elements have a non-zero base `margin-bottom` (expected ≥ 1, the last `li` of each mid-body list), and require at least 1. Then A5 can't pass vacuously if the content changes. Also say that "paired by DOM path" means the path relative to `[data-policy-prose]`, since the ancestors above it change.
- **N3.** In R1's Step 0 item, record every declaration of Shopify's policy stylesheet, not only the container's padding. An unlayered margin on `.shopify-policy__body` or the title would beat the variant (A3 red), and the Coder should see it before editing. If the sheet is cross-origin and `cssRules` throws, fetch its `href` text instead of treating it as "no rule found". As written, that case would trigger R1's stop.
- **N4.** R2 / A7: the phone `li` text width at 320 drops from 254 to 190 px. Step 0 could record the widest unbreakable run inside any `li` (min-content) at base, to predict A7. If A7 turns red, pre-authorizing `wrap-break-word` on the `prose` box (about +42 B, within budget) would save a question round. Stopping, as the plan does now, is the conservative choice.
- **N5.** R3's stated cause is `display: none`. A visible empty trailing block is the same hazard, because its top margin collapses through it. R3's stop condition ("deepest member isn't the last visible text block") already covers it, so only the explanation is narrow. `t5bc-v3-final.json` records one visible empty element (`nEmptyEls` 1, `emptyHidden` 0), so Step 0 should say where it sits.
- **N6.** A9: name the contact page's URL; Step 0 can record it.
- **N7.** §3's fallback for a stray `container` rule ("write 'Shopify's policy wrapper rule' instead") would stop the comment naming the rule's selector. Some weak comfort: `sections/material-spotlight.liquid:8` already has a bare "container," in a scanned comment and no `.container` rule is compiled. If the fallback is needed, keep the selector in the plan and impl notes.

## Manifest: what I sampled and what I took on trust

**Independently confirmed:**
- `S_css` 58,904 / 11,238 (`theme-evolution-tailwind-t6a-report.md:33`).
- Opt-out geometry at 320, 375, 768, 1024 and 1440 (`measure.json`: shell x and w, `prose` x and w).
- The policy container's computed `padding`, `max-width` and `margin`, and `T_L` 20, at 320, 375 and 768 (`t5bc-v3-final.json`).
- Compiled: `.mb-0{margin-bottom:0}`, `.max-w-\[calc\(65ch\+4rem\)\]`, `.px-8`. The only `px-0` hit is `.md\:px-0`, so unprefixed `px-0` is absent. `prose` is in `@layer utilities` with (0,1,0) `:where` rules.
- `src/tailwind.css`: `body` flex at :172-177, `.shopify-section` grid at :243-259, no `policy` text.
- `layout/theme.liquid:44-49`; `page.liquid:9`.
- Settings defaults and ranges; T5b C5b.7's wording.
- The §3 geometry, recomputed.

**Taken on trust:**
- The nine `py-10 md:py-16` shell lines.
- That `.md\:py-16` sits inside `@media (min-width:48rem)`.
- That every `page-margin` hit in the compiled file is inside `.shopify-section`.
- The T6a plan files not mentioning `layout/theme.liquid` (R-2.4 asks for a git check instead).
- The ±30 B byte estimate. A8 measures it.

**Not checked by either of us (open until Step 0 / A8):**
- whether the variant compiles;
- Shopify's stylesheet origin and layer;
- the policy body's real trailing chain;
- the opt-out page's `G_bot`.

## For the owner

There is nothing to decide. Two visible consequences should appear in QA's owner screenshots, and the plan already plans screenshots at 375 and 1440:
- On phones, the policy text column narrows from 280 to 216 px at 320 (52 px insets, like other pages).
- On desktop, it widens from 606.9 to 646.9 px and moves 20 px outward on each side. The owner didn't ask for the desktop change, but it follows from "match the page shells", and keeping desktop as it is was the alternative the plan rejected.

## Required changes

1. R-1: replace "prose" in §3's Liquid comment with "the typography plugin", per the `CLAUDE.md` rule on single-word utility names in comments and T5b review R6.
2. R-2: rewrite R7 so DevOps can run it:
   - name the base SHA (`7b8221b`) with the `git diff --stat` check;
   - build in a `git worktree`;
   - say how DevOps gates 1-5 and the full live procedure in `.claude/agents/devops.md` apply, with gates 1-2 read from `main` for both slugs, and the deploy note and audit commit on `main`;
   - verify `layout/theme.liquid` is unchanged between the base and the fix's parent with git, not by searching plan text.
3. R-3: add the orchestrator's answer as a required step before the live push. Smoke the worktree's tree on dev theme 188245508192 with `Shopify.theme.id` asserted:
   - policy A1, A2, A3 and A7;
   - T5b's markers present, and one T6a marker absent;
   - no console errors on home, product and collection pages at 375 and 1440;
   - theme check 0, and the worktree's `S_css` recorded;
   - results in the deploy note.

   Then close §9.

APPROVE WITH CHANGES

---

## Closeout pass: Revision 2.1 (2026-11-08)

The round-1 review above is kept verbatim. This pass re-read the whole Revision 2.1 plan, `CLAUDE.md` and `.claude/agents/devops.md`. The orchestrator ran the git checks in a shell, and I took its results as given:
- `2e0d855` is T5b Step 2, `7b8221b` is the last commit before T6a, and `67b6839` is T6a Step 1;
- `git diff --stat 2e0d855 7b8221b -- <theme dirs>` prints nothing;
- `git diff --stat 7b8221b HEAD -- layout/theme.liquid` prints nothing.

### Required changes

| # | Status | Evidence |
|---|---|---|
| R-1 (the word `prose` in the comment) | **Resolved** | §3's comment now reads "the typography plugin clears only its direct last child". I re-read the comment word by word for single-word utility names: none. "content", "box", "wrapper" and "depth" aren't utilities, and "content" was already in T5b's accepted comment. `.shopify-policy__container` keeps its accepted A8 safeguard. The new last two sentences also take N1: the plain-English gloss and the `data-rich-text` coupling. The gloss is accurate. The Coder can copy the comment as written. |
| R-2 (R7 runnable by DevOps) | **Resolved** | §7.1 now has five parts. (1) It names both base SHAs. (2) It runs three git checks before building, including the new and useful `git diff --name-only <fix>^ <fix>` must equal exactly the two files. (3) It builds in a `git worktree` at `7b8221b`, with the rebuild-on-conflict steps and "any other conflict means stop". (4) It reads gates 1-2 from `main` for both slugs and runs gates 3 and 5 in the worktree, and step 6 runs `devops.md`'s full live procedure from `$WT`'s root, so its `diff -rq "$BACKUP/$d" "$d"` compares the right tree. (5) Records go on `main`, never on `t5b-live`. The orchestrator's shell results confirm both git diffs that the procedure relies on. |
| R-3 (smoke test before live) | **Resolved** | §7.1 step 5 is required, and any failure means no live push. Its checks: `Shopify.theme.id` asserted; A1, A2, A3 and A7; T5b's markers present; T6a's marker absent; no console errors on three pages at 375 and 1440. §9 is "None". The plan also gives a CLI fallback (`--development`, with the printed ID asserted) in case the CLI rejects `--theme=<dev id>`. |

### Spot checks of the new text

- **T6a marker.** `sections/collection.liquid:11` reads `case section.settings.columns_desktop`, so "absent on the dev theme" does separate the T5b tree from `main`'s. Pulling the file back from the theme (explicit `--store`/`--theme`/`--only`) proves what is actually on the theme, not what is in the worktree, which is the right measurand.
- **T5b Step 2 marker.** `main`'s compiled file has no `html{…line-height…}` rule (ripgrep). Preflight's rule uses the selector `html,:host`, so the plan's check for the string `html{line-height:` can't false-match on it. A computed `24px` is Preflight's 1.5 at the default 16 px root, as `CLAUDE.md` states.
- **Smoke push.** `shopify theme push` to the dev theme without `--nodelete` also deletes T6a-only files there. That is wanted: it makes the "T6a absent" check meaningful. The push carries the worktree's `config/settings_data.json`, which is harmless on a development theme and is never the live path.
- **Pre-authorized `wrap-break-word`** (N4). It is limited to one attempt and then a stop, A8 allows exactly that one fourth rule, and the budget absorbs about +42 B. `overflow-wrap` is inherited, so it reaches the `li` text. This is sound.
- **A5 witness.** Requiring at least 1 witness, and treating 0 as red, now makes A5 two-sided whatever the content. Paths are relative to `[data-policy-prose]`.

### New findings (none blocks)

- **C1 (NIT, operator text).** §7.1 defines `WT` as `~/Projects/Shopify/theme-evolution-os2-t5b-live`, and the commands quote it (`"$WT"`). If an operator writes `WT="~/Projects/…"`, the tilde isn't expanded, and `git worktree add` creates a directory literally named `~` inside the repo. Writing `WT="$HOME/Projects/Shopify/theme-evolution-os2-t5b-live"` removes that trap. It stays a NIT because the failure is loud: later steps would visibly use the wrong path, gate 3 would show an untracked `~/` and refuse, and nothing would reach live.
- **C2 (NIT, record only).** §7.1's opening and §8's "Not checked" list still describe the SHAs as unverified, coming only from the reviewer's reading of the reflog. The orchestrator has since confirmed them and both diffs in a shell. §7.1 step 2 re-runs the checks at deploy time anyway, so this changes no decision.

### Trajectory

Round 1 found 3 required changes and 7 NITs, with no blockers. Revision 2.1 resolves all three required changes, takes every NIT, and adds no new decision risk. What remains is either gated by A8 or Step 0 (does the variant compile; how is Shopify's sheet layered; what does the trailing chain really contain), each with an explicit stop condition, or one of the two NITs above. The plan is ready for the Coder, and §7.1 is ready for DevOps once the operator gives the live go.

APPROVE
