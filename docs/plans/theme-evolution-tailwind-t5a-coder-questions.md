# T5a coder questions (Step 0 gate STOPPED, nothing committed)

Plan: `docs/plans/theme-evolution-tailwind-t5a.md` (Revision 2.1, APPROVE). Base: `main`. Theme files are those of `428094b`; HEAD is now `aaa03c8` (docs-only T6 commit by the coordinator, no theme, src, scripts or package change; `git diff --stat 428094b HEAD` lists only `docs/`). Step 0 ran in full for the gate items. **Nothing was committed, nothing was pushed, no theme file, `src/` file or `assets/tailwind.css` was changed in the repo.** The harness and evidence are untracked files under `docs/qa/harness/t5ac-*` and `docs/qa/evidence/t5ac-*` (never `git add`ed, per the stop rule).

The gate (plan section 4.1) stops on two grounds. One toggle-diff group has no allowed classification (Q-C1). The plan's own prediction for the image-banner buttons wrapper is wrong, which makes Step 1's first commit, E5a.9 (wrapper part) and C5a.12(a) contradict parity (Q-C2). Three smaller rulings (Q-C3 to Q-C5) are needed before a clean Step 9. The budget gate and the live probe both passed.

## Gate figures

| Gate item | Result |
|---|---|
| Item 1 preconditions | Pass. Live deploy note names `0783033`; staging note names `65f945f` (same theme files); plan, T5b, index and review committed; `git status --porcelain -- layout sections blocks snippets templates locales assets src config scripts package.json package-lock.json` empty |
| Item 2 baseline | `assets/tailwind.css` **58,366 / 11,104** (`gzip -9 -c`); `assets/base.css` 80,537 bytes; 65 files in `assets/*.css`; `shopify theme check` 0 offenses (106 files); 23 schema shasums in `docs/qa/evidence/t5ac-step0-schema-shas.txt` |
| Item 3 re-run of section 3 | No new hit. 4 `.css` references (3 `tailwind.css`, 1 `base.css`); 6 loaded scripts; the class-mutation sites equal section 3.3 line for line; 40 `.liquid` files; whole-token check finds only `uppercase`, `grid` (header lines 18 and 23 without `mb-0`; the other grids carry `mb-0`), `overflow-hidden`, `section`, `loading__spinner`, `hidden` |
| Item 4 fixtures | Only `/policies/privacy-policy` renders (6 handles 404). `/challenge` is the theme's 404 page (no captcha markup). `/account/login` redirects to the shop's hosted authentication on `shopify.com` (not the theme). Evidence `t5ac-facts-base.json` |
| Item 5 `CEN` | 176 runs (144 theme pages and states at the 8 `W_tog` widths, 32 proxy runs), 0 errors, **0 unparsed selectors**, 44 distinct matched selectors (`t5ac-cen-agg-base.txt`). No match for `.visually-hidden` on a real page (D5a.7 not needed). No empty element in the policy body (the policy twin of D5a.19 is not needed). Theme `div:empty` matches are 4, all in the cart drawer or elsewhere with an explicit display utility, so they produce no `TOG` entry |
| Item 7 `TOG` | 152 real-page runs (18 pages x 8 widths at S0, plus S1 x 2, S2 x 2, S3 x 2, S4 x 2): **all valid** (controls flipped, `D3 = D1`). Proxies (PXZ, PXR, PXE+PXA, PXP): 33 valid, 1 invalid (PXP tooltip at 1440 was not reversible; 375 valid). S6 and S6b: **not offered** (the dev store shows no consent banner). Hover and focus (RA1): see Q-C4 |
| Item 12 gate figure `P_end` | **58,675 minified / 11,219 gzip** (`wc -c`, `gzip -9 -c`) in a `git archive` scratch with every section 5 edit and the recommendations. Budget 60,000 / 12,000: spare 1,325 / 781. Inside the plan's estimate (58,662-58,922 / 11,174-11,369). `check-css-layers` exits 0. `word-break:break-word` compiles unchanged. `.empty\:hidden:empty{display:none}` and the `[data-rich-text] :where(...):empty{display:none}` rule compile as predicted. **PASS** |
| Item 14 live probe | **VALID-PASS** (read-only; one fresh non-preview login; `Shopify.theme.id` 138872651872 and role `main` on all 12 pages; controls flipped on every page). Containers found on live equal the dev theme's: `div.shopify-payment-button` (3 product pages), `#pc--optOutFormContainer` and the hCaptcha popup container (opt-out page), `div.shopify-policy__container`. No app block or embed. Every root-cause difference matched Step 0's `TOG` for the same container and relative path. Evidence `t5ac-liveprobe-step0.txt`, reference `t5ac-liveprobe-ref.json` |
| Items 6, 9, 10, 11, 13 | **Not run**: Step 0 stopped at the gate once the findings below were certain (`NZ`, the base focus sweep, S7, `B_rb`, the full geometry and screenshot matrix) |

## Q-C1 (gate, unexplained entry): empty divs in the hCaptcha popup of Shopify's privacy widget

`/pages/data-sharing-opt-out` only. Shopify's opt-out widget loads hCaptcha, which appends a body-level container (`body > div[aria-hidden="true"]` holding an `iframe[src*="hcaptcha"]`, inline `position: absolute; top: -10000px; opacity: 0; visibility: hidden; pointer-events: auto`). Inside it are three **empty `div`s**. Dawn's `div:empty { display: none }` hides them today; without `base.css` they compute `display: block`:

| Element (path under the container) | On | Off |
|---|---|---|
| `div:2` (the challenge mask) | `display: none` | `display: block`, 1440 x 812 at (0,0) at 1440 (it fills the viewport) |
| `div:3` (the arrow, with two more empty children) | `display: none` family: rects 0 x 0 | 22 x 42, its two empty children 22 x 20 and 22 x 22 |

Same at all 8 widths (24 entries). **No allowed mechanism covers it**: M1 and M2 need a theme element; M3's merchant-HTML rule is scoped to `[data-rich-text]` and the container is a child of `body`; section 8 has no E-row for it, so A is not allowed; N needs unchanged rects. Today it has **no visible effect**, because the container is `opacity: 0; visibility: hidden` (screenshot on/off of the whole page is pixel-equal except the checkbox label gap, E5a.3, and nothing there). It would only matter when hCaptcha actually shows a challenge: then the mask and arrow, which hCaptcha styles inline and which Dawn has been hiding, appear as hCaptcha designed them.

Options (the Architect decides; the Coder does not invent a mechanism):
- **(a) New E-row E5a.18, A allowed (recommended).** Accept: third-party popup parts that Dawn hid by accident show when a challenge opens. 0 B. Owner check 3 adds "trigger the opt-out form's captcha if reproducible".
- (b) New M3 parity rule, for example `body > div[aria-hidden="true"] :where(div):empty { display: none }` (about 60 B), which hides them as today. It is a global rule over third-party DOM, close to the global `:empty` port that D11 and the rejected alternatives refuse.
- (c) Classify N with the invisibility evidence (needs the N rule reworded, since the rects change).

## Q-C2 (plan error): the image-banner buttons wrapper is **not** hidden by Dawn today

Plan section 5.5 first bullet, section 0 "Readings", section 3.4 row 2, E5a.9 (wrapper part), D5a.9, Step 1 and C5a.12(a) all say Dawn's `div:empty` hides the wrapper when both labels are blank (PXE) and that `empty:hidden` restores that. **Measured: it doesn't.** The wrapper's class string carries `inline-flex`; a utility (layer `utilities`) beats Dawn's `div:empty` (layer `legacy`). At base with both labels blank (PXE, `docs/qa/evidence`/`t5ac-tog-groups-basepx.txt`, no entry for it): the wrapper is `:empty` (true), `display: inline-flex`, a 0 x 0 box at (720, 1488) with `margin-top: 20px` (`mt-5`). There is no `TOG` entry for it, so parity (head = base) means **no change**: adding `empty:hidden` would hide it and remove its 20 px margin, a visible change that no E-row allows.

Request: drop the `sections/image-banner.liquid` commit from Step 1; change C5a.12(a) to "head equals base: `inline-flex`, 0 x 0, `margin-top` 20 px, and the next element at base's position"; remove the wrapper from E5a.9. The vendor line is **confirmed**: PXZ's vendor copy is hidden at base and visible without `empty:hidden` (display `none` to `block`), so `snippets/card-product.liquid` Step 1 stays, and the compiled `.empty\:hidden:empty{display:none}` (34 B) is still produced by it. (A phantom 20 px margin on a blank buttons block is a pre-existing quirk; out of scope, noted for T6.)

## Q-C3 (small, A row): bare `a` without `href` in merchant HTML

Dawn's `a:not([href]) { cursor: not-allowed }` goes: a bare anchor computes `cursor: auto` (PXZ bare and `prose` copies). The theme's own `a:not([href])` buttons are covered by `btn-*` (no entry). E5a.6 lists tables, `hr`, `blockquote`, `summary`, `h6` but not this. Recommended: add it to E5a.6 as A (a cursor only, no rendering change). The bare `summary { cursor: pointer }` going to `auto` is already inside E5a.6's "bare summary".

## Q-C4 (N rulings, three groups, recommendation: accept N)

All three have **no pixel difference** where they can be rendered, but the strict N rule is about rects and crops, so I list them for a ruling instead of using it silently.
1. **Light-DOM "Buy it now" button** (`button.shopify-payment-button__button--unbranded`): `position`, resolved insets, generated `::before` and `::after` boxes (`content: ""` to `none`), their `z-index` and transitions. Page screenshot on/off on wax, p3p and snow at 375 and 1440: 0 differing pixels. Hover on and off: 0 differences. **Focus**: outline `none` to `auto` (that is E5a.1, A under Q5a.1 (a)).
2. **The widget's error-state elements** (`small.form__message`, `svg.icon-error`, its `circle` and `path`, in the opt-out widget): `line-height` 16 to 28 px, icon `width` 20.8 px to `auto`, `flex-shrink` 0 to 1. All are 0 x 0 (not rendered) until the form errors, which no fixture produces; they would render differently then. N is the plan's only fitting class; the latent error state is a known gap.
3. **Transitions**: `transition-property` / `-duration` on the widget's button and the checkout button's `::after` (timing only, no static difference).

## Q-C5 (pixel tolerance): one deterministic sub-pixel difference, landing page at 375

`/products/the-complete-snowboard?view=landing-page` at 375: the dotted underline of the "Recycled Polyester" tooltip trigger differs by 13 levels on two pixel rows (148 pixels, `[32,1504,160,16]`), identical on three repeats, with **no computed-style difference** and equal rects. Every other page is pixel-identical on/off at 375 and 1440 apart from the expected policy list rows (D5a.6) and the checkbox label (E5a.3). C5a.10 as written ("pixel-equal") can't pass this on base-vs-head even if T5a were perfect. Request: a tolerance (for example "at most 16 levels per channel on a text-decoration row") or an N ruling for this element.

## Smaller notes (no ruling needed; recorded as deviations)

- **`SZ` widened**: the plan's list (`width`, `height`, `inline-size`, `block-size`, `top`, `right`, `bottom`, `left`, `transform-origin`, `perspective-origin`) misses the logical insets (`inset-block-start/-end`, `inset-inline-start/-end`) and resolved `grid-template-rows/-columns`, which resolve to px whenever `position` or a track size changes. The harness treats them as `SZ` (root-cause grouping applies). Also, the positive controls make `html`/`body` `height` differ on and off by construction (the control `h6`'s margins); those entries are filtered as control artifacts.
- **Owner attribution**: the privacy widget has Shopify markup outside `.pc--show-email-field` (`#pc--optOutFormContainer`, with Dawn-named classes `form__message`, `icon`). The harness adds `#pc--optOutFormContainer` and the hCaptcha popup container (`body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])`) to the Shopify and app selectors. A looser `body > div:has(iframe[src*="hcaptcha"])` first matched the whole main section and was corrected before the final runs.
- **Dev-theme hazards seen**: (1) `shopify theme dev --path <scratch>` did not upload an edited `sections/product.liquid` on its first sync until the file was touched; (2) the dev theme once reverted to the repo state mid-session (cause unknown; the scratch server was still running). Every proxy run now checks a marker (`EXPECT` in `t5ac-lib.mjs`) and is invalid without it.
- The T6 commit changed HEAD to `aaa03c8`; note it in the impl notes once T5a proceeds.

## What would let Step 0 finish

Rulings on Q-C1 and Q-C2 (the gate), then Q-C3 to Q-C5. After that the Coder re-runs Step 0 items 6, 8 (final table), 9 to 11 and 13 on the chosen end state, and proceeds with Steps 1 to 9. The classification table so far is in `docs/plans/theme-evolution-tailwind-t5a-impl-notes.md`.

## Architect rulings (Rev 2.2)

**Amended by Revision 2.2.1** (review round 3, R3-1 to R3-3 and N3-1 to N3-3). The amended points are marked "(2.2.1)" below: Q-C1's fallback trigger, Q-C4's D5a.20 contents, Q-C5's survey and fifth condition, the run list, and the projection. Where this section and the plan differ, the plan wins.

Architect: Claude (for Junior Warner). Date: 2026-10-23. The plan is amended to **Revision 2.2** (`docs/plans/theme-evolution-tailwind-t5a.md`, changelog at the top); the index's T5a row is updated. **Owner:** under the owner's standing instruction these are the Architect's decisions. None reverses a prior owner decision or the Q5a.1-Q5a.5 recommendations, so nothing needs the owner before coding. One new ⚑ row (E5a.18) joins owner check 3. Claims checked against the code and evidence: `sections/image-banner.liquid:443-447` and `:351-363`, `snippets/card-product.liquid:139-143`, `assets/base.css:1824-1847`, `t5ac-tog-groups-base.txt`, `t5ac-pixel-base-l1.json`, and ripgrep `form__message|pc--` over the theme and `src` (0 hits). All of them hold.

### Q-C1: option (a), accept, with a safety precondition and a pre-written fallback

**Ruling.** New ⚑ row **E5a.18** (A allowed) and decision **D5a.21**: the three empty `div`s in hCaptcha's popup container show as hCaptcha styles them. Classify the 24 entries A.

**Reason.**

- The parts are third-party DOM that Dawn hides by accident. No theme or merchant markup is involved, so neither D11's objection to a global `:empty` rule nor Q5a.5's scope is touched.
- While no challenge is open the container is invisible, and the screenshots prove nothing paints.
- Option (b) is the general rule the plan refuses. Option (c) would weaken N for every element.

**One risk the evidence doesn't cover yet.** A now-displayed part, the mask fills the viewport, could catch clicks or widen the page. It isn't hit-testable while it inherits `visibility: hidden`, and hCaptcha's own inline styles are expected to set `pointer-events: none`, but that is `[unverified]`. So:

- **Step 0 item 7a** runs C5a.14(e)'s hit test (widget checkbox, widget button, header cart icon) at 375 and 1440, and the overflow check at every `W_sw` width (2.2.1, N3-2). Each runs in one load, first with `base.css` on as the reference, then with it disabled (2.2.1, R3-3).
- **(2.2.1) The fallback triggers only on hCaptcha's own effect:** with `base.css` off, a point returns an element **inside the hCaptcha container** (clause (ii)), or a new overflow offender appears **inside the container**. Then use D5a.21's fallback rule as written in plan §5.3. It is scoped to hCaptcha's container, about 82 B. The entries become P, and item 12 includes the rule. This needs no new question.
- **(2.2.1) A target that already fails clause (i) with `base.css` on** (a label over the checkbox, a sticky header) is recorded, and the element base returns there becomes its expected element.
- **(2.2.1) Any other change between the two readings** (clause (i) failing only with `base.css` off and outside the container, or a new offender outside it) is an unexplained entry: stop with a coder question.

C5a.21 and §4.2 step 3 name that fallback, so it can't make them red.

### Q-C2: accepted as you state it

**Ruling.**

- Step 1 drops the `sections/image-banner.liquid` commit. Step 1 is now one commit, `snippets/card-product.liquid`.
- C5a.12(a) becomes "head equals base": `inline-flex`, a 0 × 0 box ±`G`, base's `margin-top` (20 px), and the next element at base's position. Its precheck adds `matches(':empty')`.
- The wrapper leaves E5a.9, D5a.9, §0 Readings, §3.4 row 2, §5.5 and §6. It is recorded as no-change row E5a.9b, and owner check 1 now expects today's look.
- The vendor line's `empty:hidden` stays (confirmed by PXZ).

**Reason.** Your measurement is right, and the code agrees: line 444's class string starts with `inline-flex`, and the `utilities` layer outranks `legacy`. Parity means no change.

**CSS.** No change. The `empty:hidden` candidate stays in the scan through the vendor line, so the compiled file is the same with or without the banner edit. The phantom 20 px margin goes to the T6 backlog (plan §14.3).

### Q-C3: yes, added to E5a.6 as A

**Ruling.** A bare `a` without `href` in merchant HTML (both PXZ copies) goes from `cursor: not-allowed` to `auto`. It is A under E5a.6, which is already ⚑ and in owner check 3. §3.4 row 16 is updated.

**Reason.** It is a cursor only, with no rendering change. The theme's own `a:not([href])` buttons keep `btn-*`'s cursor (no entry). Today's `not-allowed` on a named anchor is a Dawn artifact, not a design.

### Q-C4: (1) N, (2) not N but P with a new parity rule, (3) N

**Rulings.** Plan §4.4 now names three cases.

1. **Light-DOM "Buy it now" button: N ("N-pseudo").** A generated box that disappears is N when the host's rect is unchanged and its crop is pixel-equal at rest and under hover and press. You measured exactly that on wax, p3p and snow. E5a.13 is resolved as N. Its focus outline stays E5a.1.
2. **The widget's error-state elements: P, not N.** New **D5a.20** goes in the parity block. (2.2.1, N3-1) It copies **all** of Dawn's valid declarations for the two selectors (`base.css:1824-1830`, `:1841-1847`), not only those `TOG` shows changing:
   - `.form__message { align-items: center; display: flex; font-size: 1.4rem; line-height: 1; margin-top: 1rem }`
   - `.form__message .icon { flex-shrink: 0; height: 1.3rem; margin-right: 0.5rem; width: 1.3rem }`

   `TOG` measured an unrendered element, so a difference in the shown state's `display` couldn't appear. Where Shopify's unlayered CSS already sets a declaration, it still wins, as it beat Dawn's rule. The cost is 175 B (Revision 2.2 had 77 B). New row E5a.19 (not ⚑) and new clause C5a.14(f), which checks the computed values on the unrendered elements.

   **Reason.** A 0 × 0 rect passes N's rect test vacuously. A 16 → 28 px line height and a shrinkable icon are certain to show the first time the error renders. The 28 px is `prose`'s 1.75 inherited from the page's rich-text box `[derived]`. P is the plan's default, and it matches Q5a.3's "keep" for the same widget. The rule is unscoped as Dawn wrote it, because no theme file uses either class.
3. **Transition-only differences: N ("N-timing").** This holds provided every property they would animate has equal values in every state Step 0 measured. The policy link's thickness changes on hover, so its transition stays P (D5a.6).

### Q-C5: a bounded, pre-registered allowance, not a global tolerance

**Ruling.** New referent **`PXN`** (plan §0): pre-registered raster elements.

**Registration** happens only at Step 0. (2.2.1, R3-1) It draws on an on/off survey over **C5a.10's whole extent**: every §4.3 page at every `W_sw` width in S0, and the states at 375 and 1440. The survey runs inside item 13's loads, with an in-page positive control that is removed before each shot. Registration requires all five conditions:

- the difference is identical on 3 repeats;
- the element and its descendants have no `TOG` entry other than N;
- their rects are equal ±`G`;
- the differing pixels lie inside the element's border box, grown by 8 px vertically and 4 px horizontally;
- (2.2.1) the largest channel difference is ≤ 16 levels at every page, width and state where the element differs.

A raster-only difference that fails any condition is unexplained: Step 0 stops.

**Allowance.** C5a.10 allows **at most 16 levels per channel** inside a registered element's grown box, on that page and state, at any width. A larger difference, or any differing pixel elsewhere, stays red. The landing page's "Recycled Polyester" underline (13 levels) qualifies if it meets the four conditions.

**Reason.** This makes C5a.10 passable on a correct build. It also keeps it meaningful: a dotted underline turned solid or recolored exceeds 16 levels, and the allowance can't spread to other elements or be extended during QA.

### Deviations

- **`SZ` widened: accepted.** It now covers the logical insets, plus resolved `grid-template-rows/-columns` when the track count is unchanged. A changed track count is a root cause.
- **`html`/`body` control artifacts: accepted.** They are dropped only when their delta equals the controls' own margin delta ±`G`. Any other delta on them is an ordinary `SZ` entry.
- **Owner selectors: accepted.** `#pc--optOutFormContainer` (Shopify) and your exact hCaptcha container selector are added to plan §4.2 step 9 and §5.11 step 4. The looser `body > div:has(iframe…)` form is forbidden. The hCaptcha container may keep the `app` label your harness gives it: every criterion treats it as non-theme, and C5a.14(e) names it.
- **The `EXPECT` sync marker: accepted.** It is now a validity rule in plan §10.
- **The invalid PXP run at 1440: re-run it** (item 7c). Re-hover the trigger after each toggle. If the run still isn't reversible after 3 attempts, record `TOG` outside the tooltip and leave the tooltip at 1440 to C5a.10's S5 screenshots and C5a.22.
- **HEAD at `aaa03c8`: noted.** The resumption check below covers it.

### What to run before Step 1

Plan §13, "Resuming Step 0 after Revision 2.2", is binding. In short:

0. **Check that nothing outside `docs/` changed since the stop.** `git diff --stat 428094b..HEAD -- . ':(exclude)docs'` must print nothing. If it prints anything, re-run Step 0 from item 1.
1. **Re-run item 1.** The orchestrator must commit Revision 2.2 of the plan, and the index, before you resume. Record HEAD.
2. **Results that stand:** items 2, 3, 4 and 5; item 7's real-page and proxy runs, except PXP at 1440; item 14 (VALID-PASS). The probe's hCaptcha root causes now map to E5a.18 (A), or to P under the fallback, and the probe accepts both.
3. **New item 7a (2.2.1):** on `/pages/data-sharing-opt-out`, the hCaptcha hit test and record at 375 and 1440, and the overflow check at every `W_sw` width. Take each reading with `base.css` on, then off, in one load. This decides D5a.21's branch, on the rule in Q-C1 above.
4. **New item 7b (2.2.1):** `PXN` registration from an on/off survey over C5a.10's whole extent, inside item 13's loads. `t5ac-pixel`'s 32 pairs count toward it. Repeat each registered element's worst page and width three times.
5. **New item 7c:** re-run PXP at 1440 (S5), as above.
6. **Item 8:** the final classification table. Build it after items 7a-7c and item 13 (which carries 7b), and before item 12. It must include: groups 7-9 under Q-C4, with group 7 as P (D5a.20), not N; group 14 as A (E5a.18), or P under the fallback; the bare-anchor cursor as A (E5a.6); PXE with no entry, as expected; and the `PXN` register.
7. **Items 6, 9, 10, 11 and 13**, for the first time.
8. **Re-run item 12.** Build the scratch end state with D5a.20, add D5a.21 only if 7a selected its fallback, and leave out any banner edit. If your earlier scratch had the banner edit, first confirm that removing it alone leaves `assets/tailwind.css` byte-identical (`shasum`). Re-measure `P_end`. (2.2.1) The projection is 58,850 to 58,932 / 11,264 to 11,344 `[provisional]`, against budgets of 60,000 / 12,000. The gate must pass again.

Then go on to Steps 1-9 as written.

---

# Round 2 (Coder, after Revision 2.2.2): Step 0 passed, Steps 1-2 committed, C5a.8 fails on two non-theme-layout pages

Step 0 items 1, 6, 7a-7c, 8, 9-13 and 12 ran in full and the gate **passed** (figures in `docs/plans/theme-evolution-tailwind-t5a-impl-notes.md`). Steps 1 (`430d533`, `snippets/card-product.liquid`) and 2 (`7dfb945`, parity block) are committed. C5a.8 (parity staged as no-ops, base versus head after Step 2, every page, S0 at all 12 `W_sw` widths, S1-S4, PXZ, PXR, PXE+PXA, PXP S0 and S5, PXG) shows **no difference outside NZ on any theme-layout page**, but one rule is not a no-op on the two layouts that never loaded `base.css`.

## Q-C6 (C5a.8, plan error): `h1`-`h5 { word-break: break-word }` changes `/password` and the gift-card page

The parity rules live in `assets/tailwind.css`, which `layout/password.liquid` and `templates/gift_card.liquid` load without `base.css`. There, Dawn's `h1`-`h5` rule never applied, so D5a.5's rule is a **change**, not a no-op: `word-break` goes `normal` to `break-word` on the `h1` of `/password` (3 entries: `h1`, its `::before`, `::after`) and on the `h1` and `h2` of the gift-card page (PXG, 6 entries). It is the only difference. At all 12 widths on both pages the full-page screenshots are **pixel-identical** to base and no element moves (`overflow-wrap: break-word` is already set on these headings in `@layer base`; `word-break` only matters for min-content sizing in flex or grid, which neither page has). Evidence: `docs/qa/evidence/t5ac-cmp-*` is not kept for the failing run; reproduce with `t5ac-cmp.mjs noop` on the `base` and `h2` captures (scratch). The plan's §3.2, D5a.2 and §8 don't mention password or gift-card pages for this rule.

Options (Architect decides):
- **(a) Accept as a new row E5a.20, A allowed (recommended):** "`/password` and the gift-card page gain `word-break: break-word` on `h1`-`h5` (Dawn's rule for the theme layout is now permanent in `@layer base` for every layout); no pixel or geometry change in any fixture". C5a.8 then excludes `word-break` on `/password` and PXG; C5a.9/C5a.10 treat it as A (head value = `break-word`). 0 B.
- (b) Scope the rule to the layouts that had Dawn's rule. This needs a hook the theme doesn't have (a body class or data attribute in `layout/theme.liquid`), which is markup the plan doesn't list, and costs bytes.
- (c) Drop D5a.5 for `h1`-`h5`. Not recommended: C5a.17's long-word heading at 320 would then overflow.

I stopped here: Steps 3-9 are not started. HEAD is `7dfb945` plus the docs commit that carries this file, the notes, the harness and the evidence. The dev server is stopped and the dev theme holds the last scratch sync (a proxy copy of HEAD); the next run re-syncs it.

## Architect ruling on Q-C6 (Rev 2.3)

Architect: Claude (for Junior Warner). Date: 2026-10-23. The plan is amended to **Revision 2.3**.

**Ruling: option (a), accept.** New row **E5a.20**, A allowed, 0 B, not ⚑.

- On `/password` and the gift-card page (PXG), `h1`-`h5` and their pseudo-elements go from `word-break: normal` to `break-word` from Step 2 on.
- C5a.8 is reworded to allow exactly that one property on those two pages, with every rect equal ±`G` and full-page screenshots pixel-equal. Any other difference there, or any `word-break` difference on a theme-layout page, stays red.
- The cross-build "explained" list in plan §4.2 names E5a.20, so C5a.9 treats it as A with head value `break-word`.
- D5a.2 and D5a.5 state the exception.

**Reason.** This is a plan error, not a build defect. The plan assumed every parity rule was a no-op while `base.css` loads, but these two layouts never loaded it.

- The change has no visible effect in any fixture: pixel-identical and nothing moving at all 12 widths.
- Its only possible effect is the one D5a.5 is kept for: long words in headings wrap instead of overflowing.
- Option (b) needs a layout hook the plan doesn't list and adds bytes, to preserve a difference nobody can see.
- Option (c) would turn C5a.17 red.
- No owner decision is touched. T5b's heading questions concern fonts and line height, not `word-break`.

**Owner.** Nothing needs the owner. E5a.20 is listed for sight in owner check 3 (with E5a.19), not flagged, because no fixture shows a pixel change.

**CSS.** No change. Your measured end state of 58,850 / 11,269 is recorded in plan §0 and in the index.

**What to run.** Plan §13, "Resuming at Step 3 after Revision 2.3", is binding.

1. Once this revision is committed, check that `git diff --stat 7dfb945..HEAD -- . ':(exclude)docs'` prints nothing. (Rev 2.3.1, N4-2) Also check that Step 0 item 1's `git status --porcelain` working-tree check on the theme paths prints nothing. If either prints anything, re-run C5a.8 in full.
2. (Rev 2.3.1, R4-1) Before Step 3, keep the evidence for C5a.8:
   - Regenerate the post-Step 2 comparison from the scratch captures with `t5ac-cmp.mjs noop`, which needs no page loads. If the captures are gone, re-run C5a.8 on `7dfb945`.
   - Commit the output and a per-difference summary under `docs/qa/evidence/`, in a docs-only commit.
   - Confirm the only differences outside `NZ` are E5a.20's `word-break` entries on `/password` and PXG. That includes any descendants that inherit `word-break` (N4-1). Rects must be equal and pixels equal. Anything else: stop with a coder question.
3. Then record C5a.8 as a pass in the impl notes, with E5a.20's classification row (A) and the evidence path. Nothing in Step 0 is re-run.
4. Continue with Steps 3-9.
