# Plan review: theme-evolution-tailwind-t6a (Revision 1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `1f2a390`. The plan, the T6 index, T6b and the three T5 files are untracked in the working tree.
Read: the plan (all 588 lines), the T6 index, T6b (only the boundary: files touched, preconditions, locale use), `docs/backlog/t6-batch.md`, `CLAUDE.md` on disk (it differs from the in-context copy: `:68` expects no theme check offense, and `:200` adds the "keep single-word utility names out of comments" rule), `.claude/agents/devops.md` (deploy steps 1-4), the T5 index, T5a (preconditions, D5a.16, §5.10 budget, the `mb-0` non-goal, the layer statement) and T5b (line-height scope), the umbrella (owner decisions, D6 rows), T4b (D4b.4, the grid rows), and the T4c review for format. Source files: `sections/collection.liquid`, `snippets/image.liquid` and all four of its callers (`sections/{collection,collections,search,cart}.liquid`), `src/tailwind.css`, `assets/tailwind.css` (selector and media-query search), `snippets/css-variables.liquid`, `config/settings_schema.json:1-80`, `config/settings_data.json`, `templates/collection.json` and the `templates/` listing, `locales/en.default.schema.json` (top-level keys, `labels`, `options`, the `columns_*` and `info` hits). Shopify Dev MCP: `learn_shopify_api` (Liquid) once, plus two `search_docs_chunks` queries on `image_tag` `widths` and `sizes` and on responsive images.

## Summary

The core design holds. I recomputed the class mapping, the track table and all seven `sizes` strings against the CSS, and they are right. The `select` values are strings, compared as strings. Every class string is a complete single-line literal. The default branch clears `mobile_classes`, so two unprefixed `grid-template-columns` utilities never land on one element. `xl:grid-fill` is the right breakpoint for `auto` with mobile `2` (the fit gives two tracks at 1280 for every allowed margin). No arbitrary breakpoint is used, so the project's px-before-rem sort-order trap can't occur: every variant here is `md`, `lg` or `xl`, all in rem. The budget gate is a scratch build of the end state in both units, using the file-argument gzip method, and it stops for the owner on a breach. The image snippet's `else` line is today's line 48 unchanged. No owner decision is reversed. I found no blocker.

Eight findings are REQUIRED:

- **R1:** the T5 precondition names a deploy note that will never exist, now that T5 is split.
- **R2, R3, R4, R8:** owner- or merchant-facing text that is wrong or incomplete:
  - R2: the image weight on Retina desktops;
  - R3: the empty slot that every numeric option still leaves on tablets;
  - R4: the `columns_desktop` info text;
  - R8: the "renders identically" claim.
- **R5, R6:** criteria that can go red on a correct build:
  - R5: density-corrected `naturalWidth`;
  - R6: `R_pick` when an image's output width falls between two candidates.
- **R7:** hand-off text. The DevOps pull command, and the existing durable gate the plan doesn't cite.

R2 and R6 each need one small design choice from the Architect. The rest are local edits.

## Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**

- **Citations.** `sections/collection.liquid` 8, 11, 12, 14, 16-22 and 39 (41 lines). `snippets/image.liquid` 15 and 48 (49 lines). `src/tailwind.css:139-141` and `251-263`. `snippets/css-variables.liquid:23-24`. `config/settings_schema.json:36-48` and `52-58` (margin range 10-100, default 20). `templates/collection.json:14`. `sections/search.liquid:35, 41`. `sections/collections.liquid:9, 19, 23-28, 49-60`. `sections/cart.liquid:25`. `locales/en.default.schema.json` 2, 37, 55 and 79, plus the Dawn nested `columns_*` lines 505, 515, 585, 646, 699, 1542 and 1604. There is no top-level `info` key and no `labels.columns_*` key.
- **Image callers.** Exactly four call `render 'image'`. None passes `widths` or `sizes`.
- **Compiled classes (§3.1).** `.grid-cols-1`, `.grid-cols-2`, `.grid-fill`, `.md\:grid-cols-2` and `.lg\:grid-cols-1` to `-6` are present. There is no `xl:` utility and no `md:grid-fill`. The media blocks are written `@media (min-width:48rem)` and `(min-width:64rem)`, not `width>=` (see N6).
- **`W_c` formula.** `min(P, w) − 2M − 64` follows from `--content-width: min(calc(var(--page-width) - 2M), calc(100% - 2M))` plus `px-8`.
- **§5.3 table.** Every cell of the `3`/`1` row, plus `4`/`1` and `5`/`1` at 1024, `auto`/`2` at 375 and 767, and `auto`/`1` at 1119 and 1121 (1120 is exactly the two-track threshold).
- **`sizes` strings.** All seven: `cap_px`, `k_cap`, `cap_card_px`, `edge_px_n`, `bp2` and `bp3` for the defaults and for PXW (`E` 164, cap 1596, `k_cap` 3, 521, 1696/196, 1180/180, 306/228).
- **Bounds.** `k_cap` ∈ {2, 3} for every allowed setting (cap 1176 to 1676), and `bp2` ≤ 1280.
- **Option counts and defaults (§5.1).** `templates/collection.json` is the only template using `type: collection`.
- **T6b boundary.** T6b doesn't touch `sections/collection.liquid`, `snippets/image.liquid` or `locales/en.default.schema.json`.
- **shopify.dev.** "Four to six widths are usually sufficient" (use-responsive-images). The `widths` list replaces the defaults, and the docs example (image_url 600, `widths: '200, 300, 400'`) adds no 600 candidate.

**Sampled and found wrong or incomplete:**

- the T5 precondition and status line (R1);
- RA10's "safe direction" (N1);
- the 820 px referent in §9.2 (N3);
- the `R_pick` candidate-rule arithmetic (N4, conservative);
- the `sizes="auto"` rejection reason (N5);
- the media-query form in Step 0 item 8 (N6);
- RA9's headroom figure (N7).

**Taken on trust:**

- `S_tw0` 58,366 / 11,104. The T5 index and T5a quote the same figure from the live deploy note.
- T4b's `W_c` table beyond the formula.
- `N_prod` = 15.
- shopify.dev's statement that `select` returns a string. This is standard Liquid behavior, and the plan's string comparisons are right either way.
- Shopify's handling of unknown setting ids in a template after a schema revert (N10).

**Not covered by the manifest, so reviewed in full:**

- T6a's T5 dependencies against what T5a and T5b actually plan (R1, N7);
- the harness's `naturalWidth` semantics (R5);
- image transfer at DPR 2 and the cost of eager loading (R2);
- what happens when an image's output width falls between two candidates (R6);
- tablet and phone row fill with 15 products (R3);
- the info text (R4);
- the DevOps pull mechanics against `.claude/agents/devops.md` (R7);
- classic scrollbars and non-default browser font sizes (N1, N2).

## Blocking issues

None.

## Required changes

### R1: REQUIRED (gate that can't pass). Step 0 waits for a T5 deploy note that won't exist

Step 0 item 1 requires `docs/qa/theme-evolution-tailwind-t5-deploy.md`. T5 is now split: the T5 index has two slugs, `-t5a` and `-t5b`. Under `CLAUDE.md`'s naming (`docs/qa/<slug>-deploy.md`), DevOps will write `theme-evolution-tailwind-t5a-deploy.md` and `-t5b-deploy.md`. As written, Step 0 halts every time. That fails closed, so nothing breaks, but it **prevents a build until fixed**. The plan's status line ("`-t5.md` did not exist") and §3.2's "T5 may…" rows are also stale.

What T5 actually does, against what T6a assumes:

- **T5a deletes `base.css`.** That includes Dawn's `.grid { margin-bottom: 2rem }`, a no-op for this grid because it already has `mb-0`, and T5a keeps `mb-0` (T5a non-goal, line 83).
- **T5a deletes `check:hidden`** (D5a.16, Steps 7-8).
- **T5a changes the layer statement** to `properties, theme, base, components, utilities`. T6a adds no layered CSS, and `xl:grid-fill` sits in `utilities` either way.
- **T5a deletes the Dawn card fallbacks** in `css-variables.liquid` (lines 31-72). The `--page-width` and `--page-margin` anchors (23-24) don't move, and Step 0 re-reads them by string anyway.
- **T5b is owner-gated.** Q5b.1 waits for a written line-height choice, so it may take a while. Its `html` line-height change moves card heights but not widths.

**Fix.** Make the precondition T5a on staging (`docs/qa/theme-evolution-tailwind-t5a-deploy.md` naming #187953643616 and an ancestor SHA). Then state what happens with T5b, and surface it as a tradeoff rather than picking silently:

- (a) T6a also waits for T5b on staging. This is the cleanest baseline, but it is blocked on the owner.
- (b) T6a may run once T5a is on staging, provided no T5b commit is in HEAD past T5a and T5b's Coder isn't active. Both phases rebuild `assets/tailwind.css` (index §3), and C6a.3's base has to stay put from Step 0 to Step 4.

Update the status line and §3.2 to cite T5a and T5b. T6b's item 1 has the same stale filename; flag it to the orchestrator for the index (it's out of this review's scope).

### R2: REQUIRED (⚑ owner text, missing measurement). Q6a.6 understates the image weight on the owner's likely device

Q6a.6 and E6a.1 cite about 720 px at 1440 DPR 1, and 540-1080 px on phones. They omit 1440 at DPR 2, the common Retina desktop. There a default card needs 660 × 2 = 1320 device px. The candidates around it are 1080 and 1600, and Chromium picks 1600: the geometric-mean threshold is √(1080 × 1600) ≈ 1314, and 1320 ≥ 1314.

So every card on the page, 15 today and up to 20 per page, downloads a 1600 × 1600 file, and **all of them load eagerly**. "No lazy-loading change" is a non-goal, and the snippet sets no `loading`. Today each card is a 400 px file. That is roughly a 16× pixel count per image on every collection page view from a Retina desktop. Those first-row images, the likely LCP element, also compete for bandwidth with the off-screen ones. Neither the transfer size nor the LCP is measured: Step 0 item 5 records transfer only at 375 DPR 2 and 1440 DPR 1.

The criteria can't tell `1600` from a list that tops out at `1080` either. At 1440 DPR 2, 1080 / 1320 = 0.82, which passes C6a.8's 0.75. So the top width is an untested bytes-versus-sharpness choice, and the owner should see it, with numbers.

**Fix.**

1. Step 0 item 5 and QA also record 1440 DPR 2: the first four cards' transfer sizes and the page's total image bytes, base against head. A Playwright LCP reading is a cheap addition.
2. Rewrite Q6a.6 with the Retina case and three options:
   - (a) as planned, with a 1600 top;
   - (b) `widths: '360, 540, 720, 1080'` with `image_url` width 1080 (C6a.8 still passes at defaults);
   - (c) as planned plus `loading: 'lazy'` for cards after the first row. This is a scope change, and it matches shopify.dev's grid guidance: "Make sure the first, visible image … loads eagerly … All other non-visible images should use `loading="lazy"`".

   Keep the recommendation, but show the bytes.

### R3: REQUIRED (⚑ owner text). Every numeric option still leaves the empty slot on tablets

The owner's complaint is the lone last card on `/collections/all` with 15 products. Q6a.1 recommends `3` ("five full rows"). Under D6a.3, though, every numeric option shows two columns from 768 to 1023: 15 cards make 7 full rows and 1 orphan. The same holds on phones with mobile `2`. Q6a.5 rejects `md:grid-cols-3` (about +60 B) for its 210 px cards, without saying that it is the option that removes the slot on tablets.

**Fix.** Q6a.1 and Q6a.5 state that with 15 products, any two-column band (tablets always, phones with mobile `2`) keeps one empty slot. Q6a.5 then presents `md:grid-cols-3` for `3`-`5` as the alternative that removes it, at 210 px cards and +60 B. Add one sentence that pagination by 20 and a changing catalog mean no column count guarantees full rows. The owner then chooses knowingly.

### R4: REQUIRED (merchant-facing text). The `columns_desktop` info text is false for Automatic

"From 1024 px wide. Tablets show 2 columns. Automatic fits as many columns of at least 500 px as there is room for."

- **Automatic.** With Automatic and mobile `1`, tablets show **one** column, and so does everything below 1120 at defaults. The second sentence reads as applying to every option.
- **`2`.** For `2` the number applies from 768, not 1024.

**Fix** (wording is the Architect's call). For example: "Automatic: as many columns of at least 500 px as fit. A number: that many columns from 1024 px wide, and 2 columns on tablets." For `columns_mobile`, say where "tablets too" ends. With Automatic desktop columns and mobile `2`, two columns hold up to 1280 px. For example: "Phones. With Automatic desktop columns, also tablets and small laptops." C6a.2(a) then pins the new strings.

### R5: REQUIRED (criterion red on a correct build). `naturalWidth` on a `srcset` image is density-corrected

Step 0 item 6 reads `N_out` "as the loaded `src`'s `naturalWidth`". C6a.7(c) requires each candidate URL, "loaded in the page", to have `naturalWidth` equal to its descriptor.

On a card `img` with `w` descriptors, the browser loads `currentSrc`, not `src`. Its `naturalWidth` is the **density-corrected** width (the file's pixel width ÷ the candidate's density), which equals the applied `sizes` length. A Coder who reads `img.naturalWidth` off the card measures `S_eval` and not the file. C6a.7(c) then goes red on a correct build, and `N_out`, which C6a.7(a) and `R_pick` depend on, gets the wrong value.

**Fix.** State the method. Load each URL (the `src` for `N_out`, each `srcset` URL for C6a.7(c)) in a detached `new Image()` with only `src` set, and read `naturalWidth` and `naturalHeight` after `decode()`. Never read them from the card `img`. Cross-check `N_out` against the `width` attribute `image_tag` prints, which is the output size.

### R6: REQUIRED (criterion red on a correct build, and an under-served case). `R_pick` when `N_out` sits between candidates

C6a.8's denominator is `min(W_card × DPR, N_out)`. The `srcset` holds only `{360, 540, 720, 1080, 1600} ∩ {≤ N_out}`. With `w` descriptors, `src` isn't a candidate (HTML spec: the `src` is added only when no candidate has a width descriptor), and the docs example adds no output-width entry.

Take a fixture original of 1024 px, a common size. Then `N_out` = 1024 and the largest candidate is 720. At 1440 DPR 2, `R_pick` = 720 / 1024 = 0.70, so C6a.8 is red. The same happens for any `N_out` in (960, 1080), or in (480, 540) at 360. That is red on the build the plan specifies. It is also a real design gap: a merchant's 1024 px image is served at 720 when 1024 is available. Step 0 item 5 measures `N_nat` but says nothing about this case.

**Fix.** Choose one and say so:

- (a) **Append the output width to `widths`** when it is below 1600 and not already in the list. Compute it in Liquid from `product.featured_image.width`/`.height` capped at 1600; these are numbers, not class strings. C6a.7(a)'s expected set then gains `N_out`. Step 0 item 6 confirms the platform keeps an entry equal to the output width.
- (b) Keep the list, define the denominator as `min(W_card × DPR, max descriptor)`, and record the under-serve as a known limit.

(a) is the robust design for merchant uploads.

### R7: REQUIRED (hand-off text). The DevOps pull command, and the gate that already exists

RA3 and index §8 say that after the owner saves a value on live, DevOps must "pull it and commit it" before every later push, or the push "silently" reverts it. Two corrections:

- **The revert isn't silent.** `.claude/agents/devops.md` deploy step 2 already diffs live's `templates/` against the repo before every live push. A differing `.json` that the feature's plan doesn't change makes DevOps **stop and report**. The durable mitigation exists for every later phase, not only T6; cite it. The real risk is a blocked push, or someone "resolving" the diff the wrong way.
- **The command needs a scope.** `CLAUDE.md`'s generic `shopify theme pull --live` pulls the whole theme into the repo, including `config/settings_data.json`, which agents must not change unless a plan says so. Name the scoped command: `shopify theme pull --live --only templates/collection.json` from the repo root (or `--store`/`--theme`, never `-e` with `--path`). Then commit that one file, keeping Shopify's header.

Fix RA3's wording ("likely … silently reverts" → "the next live push is blocked by devops.md step 2 until live's template is pulled"), and give the index §8 hand-off the exact command.

### R8: REQUIRED (owner text). "Renders identically" overclaims

Goal 2 says "renders identically". D6a.2 says "`auto` is today's markup". Q6a.1 says "(the brief: saved templates render identically)". After Step 3, a saved `{}` template gets different image markup by design: `src` at width 1600, a new `srcset`, `sizes`, and `width`/`height` 1600. The grid's class attribute also gains a double space. The **layout** is identical (C6a.3 tests exactly that). The bytes and the image files are not.

The orchestrator's brief asked for byte-identical markup. The plan should say plainly that it isn't, and why.

**Fix.** Reword the three places as "same layout (C6a.3); card images change (E6a.1, Q6a.6 ⚑)". If byte-identity of the grid `div` is wanted, assign the whole class string in each branch (`grid_classes = 'mb-0 grid grid-fill gap-4'`, still complete single-line literals). That costs nothing and makes C6a.3(a) a string equality. This part is optional.

## Nits (none blocks; each is conservative or a clarity fix)

- **N1. RA10's direction is wrong in one band.** With classic scrollbars, the `auto` breakpoints `bp2`/`bp3` are media queries on the viewport including the scrollbar, while the track count comes from the layout width excluding it. Take viewports 1120-1136 at defaults: the grid shows one 1004-1016 px track, while `sizes` says `(100vw − 120px) / 2`, about 500. That under-requests by about 2× in a 17 px band. Elsewhere, RA10's over-statement is right. Low impact; correct the sentence.
- **N2. Non-default browser font size.** The CSS is in rem: breakpoints, `--grid-min` 31.25rem, `px-8`, `gap-4` and `--page-width`. The `sizes` constants are px resolved at 16 px. A user with a 20 px default font size gets mismatched bands (for example, `3` at 1100 px: two columns while `sizes` says /3). This is still an improvement on today's 400 px files, so it's conservative. Record it as an RA row. A rem-relative string is the alternative: `(min-width: 64rem)`, `calc((90rem - 40px - 6rem) / 3)`, with the page width printed straight from the setting. It would also remove RA2's numeric-string math. Note it as considered.
- **N3. §9.2 C6a.6 row: "PXW 1920: 660 vs 820" has the wrong referent.** 820 is variant `2` at margin 20, which PXW doesn't test. PXW's tested variants at 1920 render 521 (`auto`/`1`, `3`/`1`) and 306 (`5`/`2`). The baked strings give 660, 434 and 254, so the clause is still red on the rejected approach. The conclusion stands; fix the numbers. The same applies to §4.3's "C6a.6's PXW clause is red on it" for the 820 case.
- **N4. `R_pick` arithmetic.** Chromium's rule uses the geometric mean of neighbouring densities, and at DPR ≤ 1 it never picks below the need. The worst cases are therefore about 0.816 (360/540, 720/1080), 0.866 and 0.822, and the DPR 1 worst is ≥ 1. The 0.75 threshold holds either way. List 360/540 too.
- **N5. The `sizes="auto"` rejection reason.** shopify.dev says Shopify injects a polyfill for browsers without native support. The lazy-only reason stands and is enough.
- **N6. Step 0 item 8 records "a `width>=80rem` media block".** Today's build prints `@media (min-width:64rem)`. C6a.5(b) accepts both forms; make item 8 match.
- **N7. RA9 and §0 headroom are stale.** Use the T5 index's projections. The worst T5b case is 58,748 / 11,304. T6a's end is then ≤ 58,888 / 11,364 (spare ≥ 1,112 / 636), and T6b's +220 / +70 still fits. Provisional; the gate decides.
- **N8. Counts.** C6a.3(c), C6a.6 and C6a.7 assert counts against `N_prod`. A product with no featured image renders a card without an `img`, so record `N_img` separately at Step 0 and assert against it.
- **N9.** The `labels` keys are alphabetical, so `columns_*` belongs between `background` and `foreground`. Cosmetic.
- **N10.** Rollback's "unknown settings, which Shopify ignores" is `[unverified]`; tag it.
- **N11. Alternative not considered.** Once the owner answers Q6a.1, a one-line follow-up commit (plan-authorized) can write the chosen value into `templates/collection.json`. The repo then equals live, and R7's pull step disappears. C6a.3 is unaffected because it runs before that commit.
- **N12.** The proxies' `shopify theme dev --path <scratch>` needs explicit `--store` and `--theme 187953938528`. `-e` doesn't work with `--path` (`CLAUDE.md` DevOps).
- **N13.** Optional: add a `widths`/`sizes` line to `snippets/image.liquid`'s `@example`.

## Answers to the orchestrator's focus questions

- **Default byte-identical for `settings: {}`?** No, by design, and the plan is honest about the grid (token list) but overclaims elsewhere (R8). The layout parity is real and well tested (C6a.3 at 12 widths: tokens, tracks, rects, style). The `else` branch also catches a missing or unknown value.
- **Option values, ids and round-trip.** New ids `columns_desktop` and `columns_mobile`, string values, defaults that are members, `name` unchanged, no `presets` or `blocks` added. C6a.2 pins the schema exactly and checks every other schema's `shasum`. Sound.
- **Complete class strings.** Every assign is a single-line literal, and the grid's class attribute interpolates only two variables. C6a.5 is labelled a guard, with C6a.4 as the real test. The new comments contain no single-word utility names under `CLAUDE.md:200` as far as I can tell, and C6a.11's selector diff checks that empirically.
- **Breakpoints and sort order.** No element carries two breakpoints that compete for the same property except `md` < `lg`, and `xl:grid-fill` only follows an unprefixed `grid-cols-2`. All are rem-named variants, so the px-before-rem arbitrary-variant trap doesn't apply. `xl` (1280) is correct for `auto`/`2`, because `bp2` ≤ 1280 for every margin. C6a.4 distinguishes `md:` and `lg:` from `xl:` at 768 and 1024. Two columns on tablets is the owner-facing gap (R3).
- **Liquid math.** `'90' | times: 16` is standard Liquid string-to-number coercion. `divided_by` with integer operands floors, which `k_cap` needs. `append` stringifies integers. `case … when '2', '3', '4', '5'` is valid inside `{% liquid %}`. Step 0 item 7 compares the rendered strings, as it should.
- **`image_tag` crop.** RA1 stops before Step 3 if any candidate isn't square. That's right, because `h-auto` takes the loaded file's ratio. The measurement method needs R5's fix to be valid.
- **Other callers.** The `else` line is today's line 48 verbatim, and both params are required together. C6a.9 compares `outerHTML` on the three other pages. Sound.
- **Budget on T5's tree.** It is a scratch end-state build, both units, the file-argument gzip method, a stop with owner options, and C6a.12(b) ties the commit to `P_a`. Projected end ≤ 58,888 / 11,364 (N7).
- **Non-vacuity, and chosen against rejected.** There are count asserts, URL-tagged variants and a token precheck. Each rejected design (numeric default, number comparison, baked `sizes`, unchanged images, `md:` for `auto`/`2`) has a criterion that goes red on it. Exceptions: the 1600 against 1080 top width (R2) and the candidate-gap case (R6).
- **DevOps hand-off.** It is covered durably by `devops.md` step 2, which the plan should cite, plus a scoped pull command (R7). N11 offers a way to remove the step.
- **⚑ items.** E6a.1-E6a.3 and Q6a.1/Q6a.6 are flagged. Their texts are incomplete (R2, R3), and the merchant info text is wrong (R4).
- **Owner decisions.** None reversed. The backlog's "keep today's look as the default" holds for layout. Images change, and that is flagged.

## Trajectory

This is the first round. No blocker. R1 is a filename-and-sequencing edit. R3, R4, R7 and R8 are sentences of owner, merchant or hand-off text. R5 is a method sentence. R2 and R6 each need one small, local choice from the Architect: whether to measure and present the 1600/1080/lazy tradeoff, and whether to append the output width. None changes the architecture or the criteria table's shape. A second round should be short.

## Required changes

1. **R1.** Replace the T5 precondition with T5a's deploy note. State the T5b sequencing as an explicit option, (a) wait or (b) run between T5a and T5b with no T5b work in flight. Update the status line and §3.2 to cite T5a and T5b.
2. **R2.** Record transfer sizes and page image bytes (and optionally LCP) at 1440 DPR 2 in Step 0 and QA. Rewrite Q6a.6 ⚑ with the Retina case and options (a) 1600 top, (b) 1080 top, (c) lazy beyond the first row.
3. **R3.** In Q6a.1 and Q6a.5 ⚑, state that tablets (and phones with mobile `2`) keep one empty slot with 15 products. Present `md:grid-cols-3` as the alternative that removes it.
4. **R4.** Rewrite the `columns_desktop` (and `columns_mobile`) info text so that it is true for Automatic and for `2`.
5. **R5.** Specify detached `new Image()` loads for `N_out` and C6a.7(c). Forbid reading `naturalWidth` off the card `img`.
6. **R6.** Choose: append the output width to `widths` when it is below 1600, or redefine C6a.8's denominator against the largest descriptor and record the limit. Update C6a.7(a) to match.
7. **R7.** Cite `.claude/agents/devops.md` deploy step 2 in RA3 and correct "silently". Give the scoped pull command (`--only templates/collection.json`) for the index §8 hand-off.
8. **R8.** Reword Goal 2, D6a.2 and Q6a.1 to "same layout; card images change", and state that the default is not byte-identical.

APPROVE WITH CHANGES

---

## Round 2 (Revision 2)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `1f2a390`. The plan files are still uncommitted.
Read: the plan (all 722 lines), the T6 index (Revision 2: the order section, the budget table and row 44, the owner roll-up, the hand-offs), the T5 index as updated for T5a and T5b Revision 2 (status rows, order, budget table), T5a Revision 2 (changelog rows R2 and N2, the non-goals, D5a.9, D5a.16, D5a.19, the §5.10 rows), and T6b's Step 0 item 1. I also re-checked against the source files already read in round 1. `CLAUDE.md` on disk is unchanged since round 1.

### Summary

Revision 2 addresses all eight round-1 items. The two disclosed scope additions are sound:

- **R3 tablet columns.** The ten class literals are correct and complete. `md:` sorts before `lg:`, and no element carries two unprefixed column utilities. The 768 and 1023 track cells and the four new or changed tablet `sizes` entries recompute exactly.
- **R2 (c) lazy loading.** `n_eager` is the option's widest row, so the first visible row is eager at every width, and the LCP candidate is never lazy.

The per-card `widths` loop compares numbers, not substrings. It never duplicates the output width, and it keeps the worst `R_pick` at about 0.82. The default grid `div` is now byte-identical, and C6a.3(a) tests that. The T5a precondition and the T5b order options match what T5a and T5b actually plan.

One new hidden coupling appears, from running T6a after T5a reaches staging but before it is live (R2-1). Two owner- and merchant-facing sentences have wrong facts (R2-2, R2-3). Everything else is a nit.

### Status of round-1 required items

| Item | Status | Evidence |
|---|---|---|
| R1 | **Closed** (but see R2-1) | Step 0 item 1 requires `t5a-deploy.md` (#187953643616, an ancestor SHA) and `t5a-report.md` ending `PASS`/`PASS WITH NITS`, matching `CLAUDE.md`'s naming. §3.3 (a)/(b) matches the T5 index ("T5b's Step 0 starts after T5a is on staging"; Q5b.1 owner gate). Option (b) is re-checked before Step 4. A T5b commit in HEAD without a T5b deploy note fails both options and stops (fails closed). The index (`:32-33`) and T6b item 1 are fixed |
| R2 | **Closed** | Step 0 items 5-6 add 1440 DPR 2 (transfer, bytes before and after scroll, LCP). Q6a.6 gives three options. C6a.7(d) pins the 1600 top against a 1080 cap, and says honestly when the fixtures can't tell them apart. C6a.14 is new. One wrong pick figure (R2-2) |
| R3 | **Closed** | D6a.3, the Q6a.1/Q6a.5 text, the ten literals, the track table and the `sizes` strings are recomputed (sampled below) |
| R4 | **Mostly closed** | Both strings are rewritten. The `2` and `3`-`5` sentences are now true. One clause is still false for Automatic with mobile `2` (R2-3) |
| R5 | **Closed** | `fileSizeFn` uses a detached `new Image()` read after `decode()`. Reading off the card `img` is forbidden in §0, C6a.7(c) and §10, and `N_out` is cross-checked with the `width` attribute |
| R6 | **Closed** | (a) is chosen: base widths `< out_px`, then `out_px`. C6a.7(a)'s set matches. Step 0 item 6 stops if `N_out` ≠ `out_px` (the square-crop assumption failed) |
| R7 | **Closed** | RA3 and index §8 cite `devops.md` deploy step 2 and give the scoped `--only templates/collection.json` pull with "never a full pull". The wording no longer says "silently" |
| R8 | **Closed** | Goal 2, D6a.2 and Q6a.1 reworded. Per-branch whole class strings make the default's opening tag `<div class="mb-0 grid grid-fill gap-4" style="--grid-min: 31.25rem">`, today's line 12 byte for byte |

All round-1 nits N1-N13 were applied as the changelog says. I checked N1 (RA10), N3, N4, N6, N8, N9, N12 and N13 in the text.

### Manifest: what I sampled and what I took on trust (round 2)

**Sampled and confirmed:**

- **Class map.** All ten literals. `2`/`2` is two columns at every width. `3`/`1` needs no `lg:grid-cols-3`, because `md:grid-cols-3` holds from 768. `4` and `5` are `md:grid-cols-3 lg:grid-cols-N`. `auto`/`2` is `grid-cols-2 xl:grid-fill`.
- **Track cells.** `3`-`5` at 768 are (664 − 32) / 3 = 210.67, and at 1023 they are (919 − 32) / 3 = 295.67.
- **`sizes` strings.** `2`/`1` (desktop and tablet entries both `(100vw - 120px) / 2`); `3`/`1` (136 in both the `lg` and tablet entries); `5`/`2` (168 / 5, 136 / 3, 120 / 2); PXW `3`/`1` (196 / 3 twice, 164) and PXW `5`/`2` (306, 228 / 5, 196 / 3, 180 / 2). Each matches §5.2's grid at every band.
- **Per-card `widths`.** For a 2048 upload: `360, 540, 720, 1080, 1600`. For 1024: `360, 540, 720, 1024`. For 1080: `360, 540, 720, 1080`, with no duplicate because the comparison is strict `<`. Under 360: just `out_px`. `split` gives strings; `plus: 0` converts before `<`; `append` stringifies `out_px`.
- **`forloop`.** It is restored to the outer loop after the inner `for`, so `forloop.index` is the card's position on the page and restarts at 1 on page 2.
- **Worst `R_pick` with the appended width.** It is √(smaller / larger) over adjacent candidates, and the largest gap (just under a base width, for example 1079 against 720) gives about 0.817. At DPR ≤ 1 the browser never picks below the need. So 0.816 holds.
- **The Retina pick.** √(1080 × 1600) ≈ 1314.5 < 1320, so 1600 at default.
- **Budget arithmetic.** 58,748 + 210 = 58,958 and 11,304 + 85 = 11,389 against the T5 figures that were current when the plan was written. `md:grid-cols-3`'s rule is about 63 B.
- **Hand-off.** Index §8's command and the stop-and-pull sequence.
- **The T5b fail-closed case.**

**Sampled and found wrong:**

- the Q6a.6 and E6a.1 pick figures (R2-2);
- the Automatic clause of the info text (R2-3);
- the budget projections, which T5a Revision 2 has since moved (N2-1);
- C6a.14's count referent (N2-2).

**Taken on trust:** Shopify's square-crop output for non-square originals (`[unverified]`; Step 0 item 6 stops on a mismatch); that `loading="eager"` is printed as passed; the T6b rows of the index beyond the order and budget lines.

**Not covered by the manifest, so reviewed in full:** the live-push order across T5a and T6a (R2-1); the LCP effect of the eager/lazy split; the case of a product without an image among the first cards (N2-2).

### Required changes (round 2)

#### R2-1: REQUIRED (hidden coupling, live gate). A T6a live push would carry T5a to live past T5a's own live gate

T6a now starts once T5a is **on staging**, by design (§3.3 (b)). T5a then goes live only after its owner checks and a valid C5a.25 live probe re-run immediately before its push (T5a §10 "Live gate"; T5 index "then live after its read-only live probe").

T6a's live push is `shopify theme push -e production` from the repo root. It uploads the whole tree, including T5a's layout change that unlinks `base.css`. So if T6a's owner checks pass while T5a is still waiting for its live gate, the T6a push ships T5a's removal to live with no C5a.25 run. `devops.md` step 2 doesn't catch it, because it only diffs `templates/` and `sections/` JSON. Neither T6a §10/§13 nor index §8's "Live gate" requires T5a to be live first. T6b has the same exposure.

The coupling doesn't stop a build, but it can bypass a gate.

**Fix.** In index §8 "Live gate", and in T6a's owner-checks or hand-off text, say that T6a, and T6b, go live only after T5a is live. Evidence: T5a's live deploy note exists, or a deploy note records C5a.25's valid pass on the same push. With option (b) the same holds for T5b in reverse: T5b's commits land on top of T6a, so a T5b live push carries T6a, which is fine once T6a's own gate has passed. State that too.

#### R2-2: REQUIRED (⚑ owner text, wrong numbers). Two Retina-pick figures contradict the plan's own rule

Q6a.6 says: "With `3`, the need is 869 and the 1080 file is picked." Under the rule §0 states (above DPR 1, take the smaller neighbour when the need is below the geometric mean), the 720/1080 threshold is √(720 × 1080) ≈ 881.8. A need of 869 is below it, so Chromium picks **720** (`R_pick` 0.83).

Likewise, Q6a.6 and E6a.1 say "at 375 DPR 2-3 a phone card picks 540-1080". At DPR 3 the need is 271 × 3 = 813, which is below 881.8, so the pick is 720 and the range is **540-720**.

Both figures overstate the weight, and the owner chooses between (a), (b) and (c) on these lines. Overstating the recommended `3` case's cost pushes toward the 1080 cap for no reason. Step 0 and QA measure the real bytes, but the text reaches the owner first.

**Fix.** Use "720" for `3` at 1440 DPR 2, and "540-720" on phones at DPR 2-3, in Q6a.6 and E6a.1.

#### R2-3: REQUIRED (merchant text, one clause). The Automatic sentence is false with mobile `2`

`info.columns_desktop` says Automatic gives "1 column below about 1120 px wide". With mobile `2` (`grid-cols-2 xl:grid-fill`), Automatic shows **2** columns below 1280. `columns_mobile`'s text states the override, but this sentence, read on its own in the desktop setting, is wrong for a reachable setting pair.

**Fix.** "…so 1 column below about 1120 px wide with 1 mobile column (more with a wider page margin)." Or end the sentence at "room for" and leave the rest to the mobile text. C6a.2(a) pins whichever is chosen.

### Nits (round 2; none blocks)

- **N2-1. The budget projections are stale since T5a Revision 2** (T5 index now: T5a 58,662-58,922 / 11,174-11,369; T5b every option except (b+) up to 59,002 / 11,419; (b+) up to about 59,492). The new ends:
  - option (b), T5a only: ≤ **59,132 / 11,454**;
  - option (a): ≤ 59,212 / 11,504, or about 59,702 with (b+);
  - after T6b as well: ≤ 59,432 / 11,574, or about 59,922 with (b+), which leaves 78 B.

  Everything still fits, and the measured gate binds, so no decision changes. Refresh §0 `ΔS_a`, §5.6, RA9 and the index's §4 row 44 and §5 table.
- **N2-2. C6a.14 counts the wrong elements.** It says "the first `n_eager` card `img`s" are eager, but §5.2 ties `loading` to the **card's** position (`forloop.index`). If a product among the first `n_eager` has no featured image, the img count shifts and a correct build goes red. Phrase it as "the `img` of each card at position ≤ `n_eager`". (The per-card block also runs for imageless cards; `nil | at_most` yields 0 and is unused, so it's harmless.)
- **N2-3. A wrong row-fill claim in Q6a.1.** "With 20 products … `4`/`5` fill": that's true on desktop, but tablets show 3 columns, so 20 leaves one empty slot there.
- **N2-4. C6a.14's sweep row is muddled.** It describes `forloop.index` read inside the inner loop as "none is lazy past card 5". In fact the last inner iteration's index (5) makes every card lazy when `n_eager` < 5, and none lazy when it is 5. It goes red either way.
- **N2-5. Decision numbering.** D6a.11 sits before D6a.10 in the decisions table. Cosmetic.

### Checked and found sound (round 2)

- **LCP.** The first visible row is always eager: `n_eager` ≥ the columns at every width (phones 1-2, tablets 2-3, desktop `n` or `k_cap`). Cards in a second visible row that are lazy are the same size as the first row's, so they can't replace the LCP entry. Chromium's lazy-load distance threshold also fetches near-viewport cards right away, so the savings are mainly far below the fold, and C6a.14 records them.
- **`snippets/image.liquid`.** The `loading` default via `assign` inside the branch is correct, since filters can't run in a named argument. The `else` line is unchanged, and the `@example` adds no utility words.
- **No incidental utilities.** C6a.11's Step 2 set (`.xl\:grid-fill`, `.md\:grid-cols-3`) is right, and nothing compiled today is left unused. The new comments carry no single-word utility names.
- **The T5a Revision 2 changes T6a sits on.** `empty:hidden` sinks, the scoped merchant-HTML `:empty` rule and `mb-0` kept (T5a non-goal) don't touch the collection card markup. Step 0's anchor re-read covers any drift.
- **The non-goals and Q6a.1 (b).** "No template edits" is now consistent with the follow-up-commit option, because that option needs explicit go-ahead.

### Trajectory (round 2)

Round 1 had 8 REQUIRED and 13 nits. Round 2 has 3 REQUIRED: R2-1 is a live-order sentence in the index and the plan's hand-off, and R2-2 and R2-3 are corrections to one number pair and one clause. There are 5 nits. Both scope additions were recomputed correctly, and no new design risk appeared. After these three edits the plan can close with a closeout entry rather than a full third round.

### Required changes (round 2)

1. **R2-1.** State in index §8 "Live gate" and in T6a's hand-off or owner-checks text that T6a (and T6b) go live only after T5a is live, or on a push whose deploy note records a valid C5a.25 pass. Note the reverse case for a later T5b push.
2. **R2-2.** Correct Q6a.6 and E6a.1: `3` at 1440 DPR 2 picks 720 (not 1080), and phones at DPR 2-3 pick 540-720 (not 540-1080).
3. **R2-3.** Make `info.columns_desktop`'s Automatic clause true with mobile `2` ("with 1 mobile column", or drop the clause).

APPROVE WITH CHANGES

---

## Closeout (Revision 2.1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `1f2a390`.

What I re-read for this closeout:

- in the plan: the closeout table (`:17-28`), §0 `S_T5` and `ΔS_a`, Q6a.1 and Q6a.6, the D6a.10/D6a.11 order, the §5.5 info strings, §5.6's budget paragraph, E6a.1, C6a.14 and its sweep row, §10's "Live order" note and RA9;
- in the index: §3-§5 and §8-§9;
- the source figures in T5a (`:266, 557, 979, 986`: 58,662-58,922 / 11,174-11,369) and T5b (`:49, 302, 565`: 59,002 / 11,419; (b+) 59,492);
- the T5 index's budget table (`:33-36`).

### R2-1: closed

T6a §10 "Live order (R2-1)" and index §8 "Live order with T5a" both say:

- T6a and T6b go live only after T5a is live;
- the evidence is either T5a's live deploy note, or a deploy note for the same push that records a valid C5a.25 pass run immediately before it;
- why `devops.md` step 2 can't catch the gap: it diffs only the template and section JSON;
- the reverse case under order (b): a later T5b push carries T6, which is fine once T6's own gate has passed, and T5b's deploy note records it.

This matches T5a's live gate as T5a and the T5 index describe it.

### R2-2: closed

Q6a.6 now reads 720 for `3` at 1440 DPR 2: the need is 869, under √(720 × 1080) ≈ 881.8, and the line gives `R_pick` 0.83. Phones read 540-720: the need is 542-813, and 813 < 881.8. E6a.1 carries the same figures ("720 with `3`", "540-720 at 375 DPR 2-3"). I recomputed both, and both are right.

### R2-3: closed

`info.columns_desktop` now says "1 column below about 1120 px wide with 1 mobile column (more with a wider page margin)". Each sentence is now true for all ten setting pairs. C6a.2(a) pins the string.

### Round-2 nits: all applied

- **N2-1 (budget).** The plan and the index now use T5a Revision 2. I recomputed every figure:

  | Base | T6a end | After T6b too |
  |---|---|---|
  | T5a only, order (b) | 58,922 + 210 = **59,132**; 11,369 + 85 = **11,454** | 59,352 / 11,524 |
  | T5b, order (a) | 59,002 + 210 = 59,212; 11,419 + 85 = 11,504 | 59,432 / 11,574 |
  | T5b (b+) | 59,492 + 210 = 59,702 | 59,922 (78 B spare) |

  Index line 63's "59,282 / 11,499 with Revision 1's +140 / +60" also checks: 58,922 + 140 + 220 = 59,282 and 11,369 + 60 + 70 = 11,499. §5.6's spare (868 / 546) is right. Everything fits both budgets, and the measured gates stay binding.
- **N2-2.** C6a.14 now counts card positions, skips imageless cards, and its precheck is "at least one card with an image after `n_eager`". This holds on a correct build.
- **N2-3.** Q6a.1 now says that with 20 products, tablets with 3 columns keep one empty slot. Correct (20 = 6 × 3 + 2).
- **N2-4.** C6a.14's sweep row is fixed.
- **N2-5.** The decisions now run in order: D6a.10, then D6a.11.

### Regressions

None in T6a. Every term in the Revision 2.1 sweep (`:28`) is gone from the plan outside its history lines, and the class map, the `sizes` strings, the widths loop and the criteria are unchanged from Revision 2.

**One false claim in the index (hand-off text).** `docs/plans/theme-evolution-tailwind-t6.md:63` says "The T5 index's own budget line (`docs/plans/theme-evolution-tailwind-t5-index.md:34`) still shows T5a Revision 1's figures; flagged to the orchestrator". It doesn't. That line reads "58,662 to 58,922 | 11,174 to 11,369 | … T5a Revision 2 §5.10", the same figures T6 now uses. The sentence would send the orchestrator to fix a line that is already correct. It changes no number or decision in T6a, and the Coder doesn't read it. But it is a wrong fact in hand-off text, which this project grades REQUIRED (T4c review R9 precedent).

**Fix.** Delete that sentence, or replace it with "matches". No re-review is needed: anyone can confirm against `t5-index.md:34`.

### Residual nits (none)

### Trajectory

Round 1 found 8 REQUIRED items and round 2 found 3. This closeout finds one sentence of index text to strike. The T6a plan itself is ready for the Coder as written. The verdict stays APPROVE WITH CHANGES only because the false index sentence is hand-off text. Once it's deleted, treat this as APPROVE without another round.

### Required changes (closeout)

1. Delete or correct the sentence in `docs/plans/theme-evolution-tailwind-t6.md:63` claiming the T5 index's line 34 still shows T5a Revision 1's figures (it shows Revision 2's 58,662-58,922 / 11,174-11,369).

APPROVE WITH CHANGES

---

## Closeout addendum

Verified on 2026-10-23 in `docs/plans/theme-evolution-tailwind-t6.md`. The false sentence is gone: no "still shows", "Revision 1's figures" or "flagged to the orchestrator" text remains. `:63` now holds only the T6b-review correction (59,282 / 11,499 → 59,352 / 11,524), which I recomputed in the closeout. `:44`'s source note now reads "(quoted from the T6a round-2 review, N2-1)", and its figures are unchanged: 58,662-58,922 / 11,174-11,369, 59,002 / 11,419 and about 59,492, matching T5a `:266` and T5b `:49, 302, 565`. The budget table at `:56-61` is unchanged, and nothing else in the index or the T6a plan moved. The one closeout item is closed, and nothing remains open. T6a Revision 2.1, with this index, is ready for the Coder once the plan, the index and this review are committed (Step 0 item 1).

APPROVE
