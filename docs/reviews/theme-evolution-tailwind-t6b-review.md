# Plan review: theme-evolution-tailwind-t6b (Revision 1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `1f2a390`. Nothing was built or run. Every finding below comes from reading the plan, the T6 index, T6a (boundary only), `docs/backlog/t6-batch.md`, `CLAUDE.md` on disk, the T5 index, T5a and T5b, the T4a plan and QA report, the T2 and T3 QA reports, the T4c review (for format and recurring defect classes), and the source files listed under "Manifest".

## Summary

The plan is careful and mostly correct. The drawer timer fix, the once-only listener, the SRA contract, the `keyup` ordering against the header's Escape handler, the 422 hooks, the cart-page Liquid and the tooltip stale-fetch guard all match the real code. Each step is one commit and can be reverted, no owner decision is reversed, and the budget is not at risk (T5a's own range plus T6a plus T6b's worst case comes to about 58,990 / 11,385).

The defects sit where this project's defects usually sit:

- **One decision instrument is vacuous.** `FI` counts any non-`none` `box-shadow` as a focus indicator. The hello-world links carry a permanent inset `shadow-[…]`, so Step 0 item 4(a) and C6b.16 read true on any build, including base (BLOCKER B1).
- **Several criteria fail on correct code, or can't fail on the build they name** (R3, R4, R5, R6, R7).
- **One real design defect:** a stale `activeElement` left behind by a failed add (R2).
- **A wrong precondition referent:** T5 shipped as T5a and T5b, so `t5-deploy.md` will never exist (R1).

None needs a rewrite. All are local edits.

## Manifest: what I sampled and what I took on trust

**Sampled and confirmed against the files:**

- **`sections/cart-drawer.liquid`:** every line the plan cites (2, 4, 5, 8, 19, 34, 36, 42-46, 52, 66-67, 70, 77, 84-90, the method ranges 100-135 / 132-134 / 137-142 / 144-149 / 151-162 / 164-166 / 168-197 / 195-196 / 199-227 / 205 / 229-257 / 237-238). `T_o` = 10 and `T_c` = 300 are correct.
- **`N_f`** = 5 / 8 / 2. I recounted from the markup. `snippets/cart-intelligence-banner.liquid` has no focusable content, so it adds nothing.
- **`sections/cart.liquid`** 19-40 and **`sections/product.liquid`** 49-55, 53, 92-105, 117-145.
- **`assets/product-form.js`** 8, 25, 29, 42, 49-64, 103-107, 113-126. The class hooks, the unhide-then-fill order, the early `return` at 59 (no `.sold-out-message` in markup) and the `finally` that clears `aria-disabled` all hold.
- **`assets/eco-tooltip.js`**, the whole file.
- **`sections/image-banner.liquid`** 10, 16, 24-27, 75-78, 259-340.
- **`sections/hello-world.liquid`** 26, 38, 50.
- **`sections/header.liquid`** 57-71 and 121-202. The toggle is `lg:hidden`, and `setOpen(false)` focuses it on every Escape.
- **`layout/theme.liquid`** 27-47, `assets/base.css` 2 (`@layer legacy {`) and 715-724, `assets/section-main-product.css:153`, `locales/en.default.json:173-176`.
- **Compiled classes**, checked with grep in `assets/tailwind.css`. `focus-visible:outline-none`, `mb-3`, `text-sm`, `text-[#d32f2f]`, `gap-3`, `justify-between`, `items-center`, `font-semibold`, `font-bold` and `text-[1.25rem]` are present. Only the `focus-visible:after:` forms of `outline-offset-2` and `outline-current` exist, so the plain `focus-visible:` utilities are new, as the plan says.
- **Item-map sources:** T3 QA F1 / F2 (`:62-80`), T4a QA nits 1-5 and 9 (`:88-96`), T4a R1-R3 (`:979-981`), §14.3, Q4a.6 and Q4a.9, T2 QA nit 1 (`:77`).

**Taken on trust:**

- `locales/en.default.json:17-27`.
- The T4c impl-notes claim that PXP renders a visible tooltip.
- Dev-theme ID #187953938528.
- The shopify.dev quotations. I re-checked two through the docs search: the 10-preload cap with images sorted last, and the `imagesrcset`/`imagesizes` match.

**The manifest's own "Not checked" list:** I did not re-derive any figure from it either. The rows that hide real defects are the "Not checked" items: Step 0's experiment design (R5) and the T5 dependency (R1).

## Blocking issue

### B1: BLOCKER (the decision instrument and C6b.16 can't go red). `FI` counts the hello-world links' resting box-shadow

`FI` (§0) is "true if `outline-style` isn't `none` and `outline-width` ≥ 1px, **or `box-shadow` isn't `none`**".

All three hello-world links carry `shadow-[inset_0_-3px_0_0_rgb(0_0_0/0.2),inset_0_2px_0_0_rgb(255_255_255/0.9)]` all the time (`sections/hello-world.liquid:26, 38, 50`). Their computed `box-shadow` is never `none`, focused or not.

This already holds on base. `base.css` sits inside `@layer legacy` (`assets/base.css:2`), so its `*:focus { box-shadow: none }` loses to the utility. That is why T3 QA F2 saw only `outline-style: none`.

Consequences:

- Step 0 item 4(a) always reads true, so **S7 is always "verified and dropped"**, whatever T5 ships.
- C6b.16 is green on a build with no ring at all.
- The §9.2 row for C6b.16 ("red on: T5 provides no ring and Step 7 is skipped") can't be reached.

This is the plan's own "can the criteria tell the decision apart" test, failing on the one conditional step.

**Fix.** Define `FI(el)` as a **difference** between the focused state and the resting state of the same element. Read `outline-style`, `outline-width` and `box-shadow` once while blurred (focus the sentinel) and once while `:focus-visible` matches. `FI` is true if the focused outline is visible (`outline-style` not `none` and width ≥ 1px), or if `box-shadow` differs from the resting value. Apply this to item 4(a), item 4(b), C6b.14(b) and C6b.16.

This doesn't prevent a correct outcome if T5a ships Q5a.1 (a): the UA ring would make the corrected `FI` true anyway. But the plan must not depend on that coincidence. **Blocks the build until the definition is fixed.**

## Required changes

### R1: REQUIRED (precondition can't be satisfied as written). T5 shipped as T5a and T5b

Step 0 item 1, the status line and §3.2 name `docs/qa/theme-evolution-tailwind-t5-deploy.md` and `docs/plans/theme-evolution-tailwind-t5.md`. Neither will exist. The T5 index splits the work into `-t5a` and `-t5b`. By `CLAUDE.md`'s naming, the deploy notes will be `docs/qa/theme-evolution-tailwind-t5a-deploy.md` and `-t5b-deploy.md`. So a literal Coder stops at Step 0 forever, and a "helpful" one guesses.

The plan also doesn't say **which** sub-phase it needs:

- What T6b actually depends on is T5a: `base.css` deleted, Q5a.1 decided, `check:hidden` removed, the layer statement changed.
- T5b changes the root line height and is owner-gated (T5 index: "**yes, before T5b Step 2**"), so it may sit for a while.

**Fix.**

- Require `docs/qa/theme-evolution-tailwind-t5a-deploy.md` naming #187953643616 and a SHA that is an ancestor of HEAD.
- Require T5a's QA verdict PASS or PASS WITH NITS.
- Record the Q5a.1 option that shipped.
- State T5b's position. Recommended: T5b is **not** required. If T5b's commits are in HEAD, Step 0 re-baselines on them. If T5b lands after T6b, T5b's own Step 0 absorbs T6b. This mirrors how the plan already treats T6a.
- Replace the reference to `-t5.md` with `-t5-index.md` / `-t5a.md`.

The T6 index (`:8`, `:32`) has the same stale path. Flag it to the Architect; it is outside this review's file.

### R2: REQUIRED (design defect). A failed add leaves a stale `activeElement`, so the next header-icon open returns focus to the wrong control

`product-form.js:42` calls `this.cart.setActiveElement(document.activeElement)` **before** the fetch. On a 422 (`:49-64`), or a network error (`:100-102`), `renderContents()` never runs, so the value is never consumed.

D6b.4's `open()` prefers `this.activeElement`. The next time the user opens the drawer from the header icon, `returnFocusTo` becomes the old Add to cart button, which is still connected. Escape then sends focus to the button, not to the icon.

This happens on `F_3p`, the very fixture S4 uses. No criterion covers it. C6b.8(b) doesn't say which page, and C6b.10 runs the 422 with the drawer closed.

**Fix (pick one and record why):**

- **(a)** In `bindEvents()`'s trigger click handler, call `this.setActiveElement(newTrigger)` before `this.open()`. This is one line, and it also gives Safari mouse users a defined return target.
- **(b)** In `open()`, consume `this.activeElement` only when it is still connected and `document.activeElement` is `body` or the same element.

If you choose (a), C6b.3(a) needs no change (it doesn't pin `bindEvents()`).

**Add a criterion:** on `F_3p`, press Add to cart (422), then open the drawer from the header icon by keyboard and press Escape. `activeElement` must match `[data-cart-drawer-trigger]`. Base is red only in the sense that there is no return at all; a D6b.4-as-written build is red.

### R3: REQUIRED (criterion can't go red at the final state). C6b.5 is masked by Step 2's own guard

C6b.5 counts `close()` calls after three re-renders and one Escape. That is valid at Step 1. After Step 2, `onDocumentKeyup` closes only `if (this.isOpen())`. The first call sets `data-state="closed"`, so any duplicate listeners that were left in or re-added to `bindEvents()` are silently skipped. The counter reads 1 on the very regression §9.2 names ("the `keyup` listener left in `bindEvents()`").

Step 8 re-runs C6b.0-C6b.20, so the final verification of goal 1's second half is vacuous. Nothing at all catches Step 2's new `keydown` listener being added per render.

**Fix.** Count listeners, not calls. Through CDP (`DOMDebugger.getEventListeners` on `document`), record the number of `keyup` and `keydown` listeners before and after three `updateCart()` re-renders. They must be equal. Keep the call counter as a Step 1 check. C6b.5's base-red claim (4 vs 1) still holds for the call counter at Step 1.

### R4: REQUIRED (sweep claim false; the fallback is never exercised). C6b.8(b) doesn't reach the detached-trigger case

§9.2 says "Return to the live trigger vs the stored node: C6b.8(b)". But in C6b.8(b) the drawer is opened from the header icon and closed with no re-render in between. Clicking the icon calls `open()` only; it doesn't call `bindEvents()`. So the stored node is still connected, and a build without the `isConnected` fallback passes.

The only path that detaches the icon is a re-render while open: `renderContents()` and `updateCart()` call `bindEvents()`, which replaces every `[data-cart-drawer-trigger]` with a clone (`:101-105`).

**Fix.** In C6b.8(b), after opening from the icon, change the quantity once (one `/cart/change`, inside the 429 budget), wait for `aria-busy` to clear, then press Escape. `activeElement` must match `[data-cart-drawer-trigger]` and `isConnected` must be true. A build that returns to the stored node leaves focus on `body`, so it is red.

### R5: REQUIRED (decision rule can be vacuous). The S6 margin test adds a width that `image_tag` may filter out

The margin rule picks `W5` "only if `W5` plus one more width also keeps the entry", tested as "`W5` plus `3840`" and "the ambient equivalents".

- Both preload branches call `image_url: width: 3840` (`:272`, `:316`), so candidates wider than `min(3840, natural width)` are dropped (shopify.dev, quoted in T6a §5.4). If either banner file (`templates/index.json:43-44`) is narrower than 3840, then "`W5` + 3840" emits exactly `W5`'s candidates. The margin test passes with **zero** margin.
- The ambient equivalent of 3840 is 7680 (`W9a`'s last value), which the 3840 cap **always** filters. For the ambient lists the margin test is vacuous on every image.

Item 8 records natural widths and surviving candidates, but the rule doesn't use them.

**Fix.** The extra width must be one that survives: for example 1780 (or 550) for the default list and 2136 (or 660) for ambient, both below every plausible natural width. The rule is valid only if the emitted `imagesrcset` has `|W5| + 1` candidates. A run with fewer candidates is invalid, not a pass.

Also state that PXB has **two** images (`image_2` is set, `stack_images_on_mobile` false, so `sizes` = `50vw`). Two `Link` entries are therefore measured together, so item 8's `L_len` covers the two-entry case.

### R6: REQUIRED (criterion red on a correct build). C6b.14(h)'s "Tab away" lands on the second trigger

PXP's description is "Organic Cotton and **Recycled Polyester**": two adjacent triggers. In (h), "focus a trigger by Tab" reaches Organic Cotton from the sentinel, and "Tab away" moves focus to **Recycled Polyester**. A correct build then (rightly) fetches and shows that trigger's tooltip about 800 ms later, so "at 1.5 s no tooltip is visible" is red on correct code.

**Fix.** Either Shift+Tab back to the sentinel, or assert specifically that `#eco-tooltip-organic-cotton` doesn't have `is-visible` (and allow the second trigger's tooltip). A build without the guard stays red under either wording.

### R7: REQUIRED (criterion red on a correct build below 1024 px; unlisted behavior). C6b.14(d) ignores the header's Escape handler

C6b.14 names no viewport. Below `lg` (1024), the header menu is displayed, and its document `keydown` handler focuses the menu toggle on **every** Escape (`sections/header.liquid:163-167, 194-195`; the plan's own RB1).

At 375 or 768, Escape on a focused trigger therefore moves focus to the hamburger. The trigger's `focusout` hides the tooltip, and "(d) `activeElement` is still the trigger" is red on a correct T6b build. The QA bullet in `CLAUDE.md` asks for 375 and 1440 on viewport-sensitive UI, so QA will run it.

**Fix.**

- Pin C6b.14 to 1440, or keep 375 with (d)'s focus clause replaced by "no `.eco-tooltip.is-visible`" plus a recorded `activeElement`.
- Add an E-row: at < 1024 px, Escape on a tooltip trigger moves focus to the menu toggle. This is a pre-existing header bug (index §6 item 7), and it now also affects tooltip users. Extend RB1's text accordingly.

### R8: REQUIRED (merchant/customer-visible change missing from §8). A mouse click now makes the tooltip stick

`tabindex="0"` makes the span click-focusable in Chromium and Firefox. The new `handleMouseOut` returns early when `document.activeElement === trigger`. So a mouse user who clicks a material name (a natural thing to do with underlined text) and moves away keeps the tooltip on screen until focus moves elsewhere. Today it hides on `mouseout`. Nothing in §8 lists this. C6b.14(g) uses `hover()` without a click, so it can't see it.

**Fix (pick one):**

- **(a)** Keep the tooltip on mouse-out only while `trigger.matches(':focus-visible')`. Keyboard users keep it; a mouse click doesn't. This is recommended: one condition, and it leaves today's mouse behavior unchanged.
- **(b)** Accept the behavior and add it as a ⚑ E-row with an owner check.

Either way, add a C6b.14 clause: click a trigger, move the mouse away, wait 300 ms, and the tooltip is hidden (option a) or shown (option b).

## Nits (none blocks; each is conservative or a wording fix)

- **N1. `L_n`'s quoted value has the wrong referent.** T3 QA F1's "9 entries" counts all `Link` entries, including preconnects and UCP (`t3-report.md:64`). §0 labels it "`rel=preload` entries", and its own note says preconnects don't count. The real preload count was lower, which gives more headroom, so this is conservative. Relabel it "9 `Link` entries (preconnects included)".
- **N2. Base-red claims understate.** C6b.4(b) is also red on base: the open timer fires at 10 ms after the close at 5 ms, leaving `data-state="open"` with `hidden`. C6b.8(c) is also red on base: the toggle keeps focus. Neither changes a decision.
- **N3. Two §9.2 discrimination claims can't be shown in Chromium.**
  - "`keyup` ordering vs `keydown`: C6b.8(c)". The header's listener is registered first (its script runs earlier in the DOM), so a drawer `keydown` handler would also run after it and pass (c). `keyup` is still the right choice; the claim just isn't tested.
  - C6b.6's "focus moved synchronously … no-op in some engines". Chromium focuses a just-unhidden element synchronously, so that red is unreachable with the harness. Reword both as "not distinguished".
- **N4. "As in the drawer".** D6b.7 and §5.3 say the drawer's quantity field has `inputmode`; it doesn't (`:42-50` has `type="number" min="0"` only). Say "type and `min` as in the drawer; `inputmode` added".
- **N5. `type="number"` adds constraint validation.** A value such as `1.5` or `-1` now blocks **both** Update and Checkout with a browser bubble; today a text field posts anything. That is arguably better, but it is visible. Add it to E6b.4's "After" text, which is already ⚑.
- **N6. Re-render focus for controls without an `id`.** `lastFocusedId` records only `id`s. In the common keyboard flow (edit a quantity, Tab to "Remove"; `change` fires on blur, then the re-render), focus lands on the panel, not on the remove link. Goal 2 is still met. Recording `data-index` plus a role-like key would restore position. Optional.
- **N7. Detached instances.** Document listeners added in a constructor outlive the element. If the theme editor ever re-renders `cart-drawer` while it is open, the old instance's Tab trap sees `isOpen()` true, gets zero focusables (detached elements have no rects) and calls `preventDefault()` on every Tab, page-wide. This is unlikely: the section has no settings. One guard line (`if (!this.isConnected) return;` in both document handlers), or `connectedCallback`/`disconnectedCallback` as the header menu does, removes it. Add one theme-editor preview pass to §10 (drawer opens, Tab cycles; tooltip on PXP not applicable). `CLAUDE.md`'s QA bullet asks for the editor context.
- **N8. Real `/` clause in C6b.15.** "Its `srcset` still has `W9`'s candidates" should read "`W9` filtered by the natural widths item 8 recorded", or it is red on a correct build if either file is narrower than 3840.
- **N9. `D_422` with no fallback.** If item 7 finds `description` empty or null, `handleErrorMessage(undefined)` hides the wrapper and S4 shows nothing. Add a stop rule (coder question) for that reading; Shopify normally returns a description, but `product-form.js` is unchanged by design.
- **N10. Trigger role.** T4a Q4a.9 called for "a `tabindex` and role" on the trigger. T6b adds only `tabindex`. A focusable generic `span` is acceptable for a tooltip-only trigger, but say so in D6b.9, so the omission is a decision rather than a gap.
- **N11. `S_T5`** in E6b.10 isn't defined in §0. Use `S_tw` from Step 0 item 2.
- **N12. Cart-page totals and T4a Q4a.6.** T4a recommended a separate `theme-evolution-cart-page` feature plan for prices and a total. T6b's narrower version (line price and "Total" only, with the taxes note as option (b)) isn't a reversal: the owner put the item in the T6 batch. Citing Q4a.6 under Q6b.4 would close the loop for the owner.

## Answers to the orchestrator's specific questions

- **Drawer race (both timers, Escape once).**
  - Correct. With the two timers cleared, both orders converge on the last call, and C6b.4 (a) and (b) tell apart builds that clear only one of them.
  - The Escape listener moves to the constructor correctly. Its final-state verification is vacuous until R3 is fixed.
- **Focus trap and return across SRA re-renders.**
  - The trap logic is right, including Shift+Tab from the panel.
  - `keepFocusInside()` works because the host and its `focusin` listener survive the `.cart-drawer__inner` swap. Note that the panel itself is replaced on every render; the plan handles this by re-querying `this.panel`.
  - The `isConnected` fallback is right but untested (R4).
  - The stale opener after a 422 is a real defect (R2).
  - The `keyup`-after-header-`keydown` ordering is correct, and C6b.8(c) is a valid test of the end state.
- **422 markup vs `product-form.js`.** It matches.
  - `this.querySelector` is scoped to `<product-form>`, and the wrapper sits inside it.
  - `toggleAttribute('hidden', …)` works on the attribute, which Preflight hides.
  - `.textContent` goes on the inner `.product-form__error-message`.
  - No `.sold-out-message` exists, so `aria-disabled` is cleared in `finally`. C6b.13's "no `aria-disabled`" and its second-click clause are therefore reachable.
  - `this.form = this.querySelector('form')` is unaffected by a `<p>` placed before the form.
- **Cart page money, total and number input.** The Liquid is correct (`final_line_price | money`, `total_price | money_with_currency`, existing key `sections.cart.headings.total`), and it adds no heading. `type="number"` doesn't change the `updates[]` POST. It adds constraint validation (N5) and desktop spin buttons (already ⚑ in E6b.4). The 48 px buttons are fixed by `min-height: 3rem` (`src/tailwind.css:75, 107`), so T5b's line height can't move C6b.12's absolute geometry.
- **Tooltip.**
  - `tabindex`, `role="tooltip"`, the `id` from `handleize`, and `aria-describedby` set before showing are fine. The `id` is unique per handle, and the `Map` holds one element per handle.
  - The Escape handler is fine.
  - The stale-fetch guard is correct, and it also fixes the mouse case (pointer leaves during the fetch).
  - Criteria issues: R6 and R7. Unlisted behavior: R8.
- **Preload widths and Shopify's limits.**
  - The 10-preload cap is not the cause (T3 F1). Images sort last, so two banner preloads need two free slots, and T5a frees one.
  - The length hypothesis is properly marked `[unverified]`.
  - The margin rule needs R5 to be meaningful.
  - C6b.15(b)/(d) correctly guard against a `srcset` mismatch and a double download.
- **T5 dependencies.**
  - **Q5a.1.** T5a's Q5a.1 (a) (browser default) makes S5's ring utilities and S7 redundant: correctly conditional, once B1 makes the measurement real. It doesn't conflict, under either option. The panel's `focus-visible:outline-none` is still needed: a programmatic focus after Enter matches `:focus-visible`, so under (a) the UA ring would surround the panel, and under (b) T5a's `@layer base` ring would. The utility layer beats both.
  - **`check:hidden`.** Its removal is handled: C6b.1 uses `npm run check` as T5a leaves it.
  - **Budget.** Fine: worst case about 58,990 / 11,385 after T5a's high end, T6a and T6b.
  - **Precondition.** Wrong (R1).
- **⚑ items.** E6b.1, .3, .4, .5, .7 and .9 are correctly ⚑. Missing: R8's sticky tooltip, R7's E-row, and N5's validation bubble (fold it into E6b.4).
- **Commits and reverts.** One step, one commit. Step 5 is correctly one commit. The Step 2-before-Step 1 revert order is stated.
- **Owner decisions.** None reversed: Q4a.1, Q4a.2, Q4a.7, Q5 and T5a Q5a.1 are untouched. N12 is a citation gap only.
- **CLAUDE.md JS rules.**
  - SRA methods and `.join(',')` are kept and pinned by C6b.3.
  - State lives in attributes (`data-state`, `hidden`, `aria-busy`, `aria-describedby`).
  - JS hooks are `data-` attributes or the existing namespaced classes, and JS toggles no utility.
  - `EcoTooltip` stays a non-custom-element class against the "always Web Components" rule. Q6b.6 surfaces that, with a recommendation, which is the right handling for a pre-existing script.

## Alternatives the plan didn't consider (none required)

- **S1:** a state-guarded timer (`if (this.dataset.state === 'closed') this.hidden = true;`) plus clearing only the open timer. Equivalent, slightly less bookkeeping. The plan's version is fine.
- **S2:** `inert` on the theme-owned page wrappers only (header group, `main`, footer group), not on every `body` child. That avoids the preview-bar and app-embed objection in §4.3 and gives screen readers a real modal. It is worth a line in Q6b.2 as a middle option.
- **S5:** the `:focus-visible` test in `handleMouseOut` (R8 (a)).

## Trajectory

Round 1. One blocker and eight required items, all local: three criterion rewordings, one criterion addition, one rule tightening, one one-line code change and two E-rows. The design itself is sound. A Revision 2 that folds these in should need only a light confirmation pass.

## Required changes

1. **B1:** redefine `FI` as a focused-vs-resting difference (outline visible, or `box-shadow` changed) and apply it in Step 0 item 4(a)/(b), C6b.14(b) and C6b.16.
2. **R1:** replace the T5 precondition with T5a's deploy note (`docs/qa/theme-evolution-tailwind-t5a-deploy.md`), its QA verdict and the recorded Q5a.1 option. State that T5b isn't required and how either order re-baselines. Fix the `-t5.md` references.
3. **R2:** stop a failed add's `activeElement` from hijacking a later header-icon open (recommended: `setActiveElement(newTrigger)` in the trigger handler), and add the `F_3p` 422-then-icon-then-Escape criterion.
4. **R3:** make C6b.5 count document `keyup`/`keydown` listeners (CDP) before and after re-renders; keep the call counter as a Step 1 check only.
5. **R4:** add a quantity re-render between the icon open and Escape in C6b.8(b), and assert that the focused trigger `isConnected`.
6. **R5:** make the S6 margin width one that survives the `image_tag` filter (for example 1780 / 2136), and invalidate any run whose `imagesrcset` doesn't have `|W5| + 1` candidates. Note PXB's two images.
7. **R6:** in C6b.14(h), Shift+Tab back to the sentinel, or assert only the first trigger's tooltip is hidden.
8. **R7:** pin C6b.14 to ≥ 1024 px (or drop (d)'s focus clause below it), and add the header-Escape E-row for tooltip triggers.
9. **R8:** keep the tooltip on mouse-out only while the trigger matches `:focus-visible` (or list the sticky-on-click behavior as ⚑ with an owner check), and add the click-then-leave clause to C6b.14.

APPROVE WITH CHANGES

---

## Round 2 (Revision 2)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. HEAD `1f2a390`; theme files unchanged since round 1.

I re-read:

- `CLAUDE.md` (JS rules, QA bullet, budget).
- The whole plan (Revision 2) and the T6 index (Revision 2).
- The T5 index and T5a Revision 2: Q5a.1 / D5a.10, D5a.19, §5.10's budget, the deploy and report naming.
- The real files: `sections/cart-drawer.liquid`, `sections/cart.liquid`, `sections/product.liquid`, `assets/product-form.js`, `assets/eco-tooltip.js`, `sections/image-banner.liquid`, `sections/hello-world.liquid`, `sections/header.liquid`, `templates/index.json`, `assets/base.css:2, 715-724`.

### Summary

Revision 2 closes the blocker and all eight required items correctly.

- The corrected `FI` now has a negative control on the pre-T5a tree.
- C6b.5 counts listeners.
- C6b.8(b) forces the clone.
- C6b.21 pins the R2 line.
- The margin width survives the 3840 filter, and runs with too few candidates are invalid.
- C6b.14 is pinned to 1440, with a relaxed (d) at 375.
- The mouse-out rule uses `:focus-visible`.

The `formnovalidate` choice is sound (below). Two small items remain. Both are in text that reaches a person, and neither touches code or blocks the build:

- the theme-editor pass claims to test a stale instance it never creates;
- the index's budget projection quotes T5a Revision 1.

### Status of round-1 items

| Item | Status | Evidence |
|---|---|---|
| B1 | **Closed.** | `FI` (§0) is now a focused-vs-resting difference, with the `:focus-visible` precondition (a reading where it doesn't match is invalid). It is used in Step 0 item 4(a)/(b), C6b.14(b) and C6b.16. **Instrument check verified by hand:** on `0783033`, `base.css` is inside `@layer legacy` (`assets/base.css:2`). The links' outline comes from legacy `*:focus { outline: 0 }`, and `*:focus-visible`'s `var(...)` outline is invalid, so it falls back to `none`. The utility `shadow-[inset…]` beats legacy's `box-shadow: none`, so the shadow is the same at rest and focused. `FI` therefore reads **false** there, as the check requires, and the instrument can't be stuck at true. Under T5a Q5a.1 (a) (still recommended, D5a.10) the UA `auto` outline makes it true, and under (b) the theme ring does. Either way S7 is "verified and dropped" on real evidence |
| R1 | **Closed.** | Step 0 item 1 requires `docs/qa/theme-evolution-tailwind-t5a-deploy.md` and `-t5a-report.md`. These follow `CLAUDE.md`'s `<slug>-deploy.md` / `<slug>-report.md` naming and the T4c precedent. It also requires an ancestor SHA, `base.css` gone, and the Q5a.1 option recorded. §3.3 settles T5b: not required, either order re-baselines, never in flight at the same time, re-checked at Step 8. The index (`:32-33`) is fixed |
| R2 | **Closed.** | `this.setActiveElement(newTrigger)` sits before `this.open()` in the clone's handler (`:106-109`). `open()` consumes it, so the stale value from `product-form.js:42` after a 422 is overwritten. C6b.21 has two sides: without the line, `returnFocusTo` is the still-connected Add to cart button (red); with it, it is the icon. C6b.3(d)'s word-diff covers the extra line |
| R3 | **Closed.** | C6b.5 counts `document` `keyup`/`keydown` listeners through CDP before and after three `updateCart()` calls. On base, `keyup` grows by 3. A per-render `keydown` would also show. The close counter is now a Step 1-only check |
| R4 | **Closed.** | C6b.8(b): icon open, then one `/cart/change` (the `bindEvents()` clone, `:101-105`), then Escape, then `[data-cart-drawer-trigger]` with `isConnected`. A build without the fallback calls `.focus()` on a detached node and leaves focus elsewhere, which is red. One change stays within the per-context budget of three |
| R5 | **Closed.** | `W6` = `W5` + 1780 and `W6a` = `W5a` + 2136 both lie inside `W5`'s range, so they survive whenever `W5`'s own top value does. A run counts only with 6 candidates (and 5 for `W5`). If the files are narrower than 3000 / 3600, a character test with inert `sizes` padding takes over. PXB's two entries (`templates/index.json:43-44`, `stack_images_on_mobile` false at `:52`, so `50vw`) are re-confirmed |
| R6 | **Closed.** | (h) now Shift+Tabs back to the sentinel, so the second trigger is never focused. "(if created)" correctly allows for the element being appended before the guard returns (`showTooltip` creates the tooltip at `:67-70`, ahead of the guarded show) |
| R7 | **Closed.** | C6b.14 runs at 1440, where `<theme-evolution-header-menu class="flex lg:hidden">` (`sections/header.liquid:57`) is `display: none`, so the header's `toggle.focus()` does nothing. At 375, (d) asserts only that the tooltip is hidden. E6b.11 and RB1 record the hamburger behavior |
| R8 | **Closed.** | `handleMouseOut` keeps the tooltip only if the trigger is focused **and** matches `:focus-visible`. Chromium's heuristic is that focus moved by a pointer onto an element that takes no text input doesn't match `:focus-visible`. So `click()` and then moving away hides it (C6b.14(i)), and a Tab-focused trigger keeps it. E6b.7 states the click behavior |
| N1-N12 | **Applied.** | Spot-checked N4 (drawer `:42-50` has no `inputmode`; the text is now accurate), N6 (`removeIndex` through the existing `.cart-drawer__item-remove` hook), N7 (both document handlers guarded; see RR2-1 for the test), N8, N9 (stop rule at item 7) and N12 |

### `formnovalidate` on Checkout (orchestrator's question)

- **Does `name="checkout"` still work?** Yes. `formnovalidate` only skips constraint validation for that submitter. The form data set still includes the submitter's `name` (`checkout`) and every `updates[]`, so Shopify's `/cart` POST updates the cart and redirects to checkout exactly as it does today.
  - Implicit submission (Enter in a quantity field) uses the form's default button, which is the first submit button in tree order: Update (`sections/cart.liquid:38`). That path still validates.
  - `formnovalidate` is a standard attribute, and theme check has no rule against it.
- **Is it acceptable that an invalid quantity can't block checkout?** Yes. It is **parity**: today's `type="text"` field posts anything to both buttons, and Shopify resolves quantities server-side, with checkout re-validating stock.
  - In Firefox, letters typed in a number field give `badInput` and post an empty value, the same as a cleared field posts today (NIT RN3).
  - Blocking checkout on a client-side quantity error would be a new failure mode on the revenue path. The plan's choice (Update shows the browser's message; Checkout always posts) is the conservative one, and it is ⚑ in E6b.4 and owner check 3.
  - C6b.12 tests both sides: no POST on Update with `-1`; on Checkout, a POST with `checkout`, aborted by route so nothing reaches checkout.

### Remaining findings

#### RR2-1: REQUIRED (owner/QA-facing instruction that can't do what it says; doesn't block the build). The theme-editor pass doesn't create a stale instance

§10 asks QA, and owner check 1 repeats it, to "select and deselect the cart-drawer section once and repeat (a re-rendered section must not leave a stale instance swallowing Tab)". Selecting a section in the editor fires `shopify:section:select`. It doesn't re-render the section, and `cart-drawer` has `"settings": []` (`:266-271`), so nothing in the editor reloads it. The pass would always be green and would record a guarantee nobody tested. RB13 and N7 rely on it.

**Fix.** Keep the editor pass for what it does test (open, Tab cycles, Escape returns focus in the editor preview). Replace the stale-instance clause with an in-page test, for example in C6b.10:

1. Open the drawer.
2. Remove the element with `document.querySelector('cart-drawer').remove()`. It keeps `data-state="open"`.
3. Press Tab twice from a page control.

`document.activeElement` must change on each press, with no `pageerror`. The test has two sides. Without the `isConnected` guards, `focusables()` returns `[]` (detached nodes have no rects), so `onDocumentKeydown` calls `preventDefault()` and Tab is swallowed: red. With them, green.

#### RR2-2: REQUIRED (budget figure in the index reaches the owner; doesn't block the build). The worst-case projection quotes T5a Revision 1

The T6 index (`:44`, `:57`) projects T5a at 58,429-58,628 / 11,114-11,254, and the worst case after T6 at "about 59,178 / 11,459". Those are T5a **Revision 1**'s figures, carried in the T5 index (`:34`), which wasn't updated. T5a **Revision 2** §5.10 projects `P_end` = 58,662-58,922 / 11,174-11,369 (`-t5a.md:249`). The worst case after T6a's high end (+140 / +60) and T6b's (+220 / +70) is therefore about **59,282 / 11,499**. That is still inside 60,000 / 12,000, with about 718 / 501 to spare.

**Fix.** Cite T5a Revision 2 §5.10 directly and restate the worst case. The stale T5 index line is the T5 Architect's to fix; flag it to the orchestrator. T6b's own text quotes no T5a range, and its Step 0 gate measures, so no decision changes.

#### Nits (none blocks)

- **RN1. Injected spans need text.** Step 0 item 4(b) injects "a `<span tabindex="0">` with the trigger literal's exact classes into the description". Give it text, for example "Organic Cotton", so it has a real inline box (an empty span's outline has zero width, even when its computed style reads true). This also keeps it clear of T5a D5a.19's new `[data-rich-text]` empty-element rule. Dawn's `:empty` list doesn't include `span`, so the rule probably doesn't match it, but text removes the question. Do the same for any sentinel injected inside `[data-rich-text]`.
- **RN2. Positive control for `FI`.** The pre-T5a check proves the instrument can read false. Add one element that must read true on both trees, for example `button[name="add"]` (`btn-primary` has its own `&:focus-visible` rule, `src/tailwind.css:91`). Then a broken instrument stuck at false (which would add 220 B of unneeded utilities) is also caught.
- **RN3. Firefox `badInput`.** Add to E6b.4: in Firefox a non-numeric entry posts an empty `updates[]` value through Checkout, which is the same as a cleared field posts today.
- **RN4. `W4` margin count.** Step 0 item 8 tests "`W4` + 1780" "under the same rule", but the validity sentence names only \|W5\| + 1 = 6. Say "\|list\| + 1 candidates" so the `W4` run's threshold (5) is explicit.
- **RN5. CDP baseline noise.** C6b.5 requires both counts "unchanged". If a Shopify script adds a document listener lazily during the three re-renders, a correct build reads red. Take the "before" count after the page settles (for example after `networkidle`), and record any non-theme listener by its `scriptId` before calling a run red.

### Manifest: what I sampled and what I took on trust (round 2)

**Sampled:**

- Every changed code block against the real files: the `:106-109` handler and the `product-form.js:42` ordering (R2); `:101-105` clone (R4); `eco-tooltip.js:67-77` ordering (R6); `header.liquid:57, 163-167, 194-195` (R7); `image-banner.liquid:272, 316` (R5); `hello-world.liquid:26, 38, 50` with `base.css:2, 715-724` (B1's instrument check, derived by hand); `templates/index.json:43-44, 47, 52`; `cart.liquid:37-40` (`formnovalidate`).
- T5a Revision 2 lines 8, 249, 338, 347, 452, 540; the T5 index `:34`; the T6 index `:32-33, 44, 57`.

**Taken on trust:**

- The Revision 2 sweep's "no survivor" claim (spot-checked: no `t5-deploy.md` or "box-shadow isn't none" left in the body).
- T5a's file naming for its deploy note and QA report: by convention, since neither file exists yet.

### Trajectory (round 2)

Round 1 had one blocker and eight required items. Round 2 has two small required text fixes, one in the QA checklist and one in the index, plus five nits. Nothing in the design or code changes. Once RR2-1 and RR2-2 are folded in, no further review round is needed. A closeout note in the plan's changelog is enough.

### Required changes (round 2)

1. **RR2-1:** replace §10's "select and deselect the cart-drawer section" stale-instance claim (and the owner-check echo) with an in-page detach test (open, `remove()`, Tab twice, focus moves, no `pageerror`), for example as a C6b.10 clause. Keep the editor pass for open, trap and return.
2. **RR2-2:** in the T6 index, cite T5a Revision 2 §5.10 (58,662-58,922 / 11,174-11,369), restate the worst case after T6 as about 59,282 / 11,499, and flag the T5 index's stale `:34` to the orchestrator.

APPROVE WITH CHANGES

---

## Closeout (Revision 2.1)

Reviewer: Plan-Reviewer (Claude). Date: 2026-10-23. Scope: the Revision 2.1 closeout table (`docs/plans/theme-evolution-tailwind-t6b.md:13-27`), every row it maps, and the T6 index Revision 2.1 (§4 and §5). `CLAUDE.md` was re-read. Theme files are unchanged.

### RR2-1: closed

- **Old claim removed.** The "select and deselect" clause is gone from §10 (`:700`) and from owner check 1 (`:713`). The editor pass now covers only open, Tab cycling and Escape return, and it says plainly why the editor can't create a detached instance.
- **New C6b.10 detach clause (`:635`) is sound and can fail.** I traced it against the code:
  - After `remove()`, the element keeps `data-state="open"`, and `this.panel` still resolves inside the detached subtree.
  - Without the `isConnected` guard in `onDocumentKeydown`, `focusables()` filters everything out: detached nodes have no client rects. The handler then takes the `items.length === 0` branch, calls `preventDefault()`, and the `panel.focus()` on a detached node does nothing. Tab from `button[name="add"]` doesn't move: **red**.
  - With the guard, the browser's own Tab order applies: green.
  - Removing the element also drops the `body:has(cart-drawer[data-state='open'])` scroll lock, so nothing else interferes.
  - The page has focusables after the button (accordion `summary`, Share, and dynamic checkout when enabled), so "changes on each press" is reachable.
- **Cross-references hold.** RB13 (`:739`) and the §9.2 row (`:662`) point to the clause, and the sweep marks it as a test.

### RR2-2: closed

The index's §4 (`:44`) and §5 (`:57-63`) cite T5a Revision 2 §5.10. I re-derived the worst cases:

| Path | Minified | Gzip |
|---|---|---|
| T5a + T6a + T6b | 58,922 + 210 + 220 = **59,352** | 11,369 + 85 + 70 = **11,524** |
| T5b (any option except (b+)) | 59,002 + 430 = **59,432** | 11,419 + 155 = **11,574** |
| T5b (b+) | 59,492 + 430 ≈ **59,922** | |

The (b+) path leaves the ~78 B margin the index states. All figures are correct.

The note that T6b's optional ring-utility step could be the one that breaches under (b+) is right, and the plan already handles it: Step 0 item 10 builds the end state in scratch and stops with a coder question offering sign-off or a lighter ring. It is also unlikely to arise. Under either Q5a.1 option the corrected `FI` should read true, so T6b would add no CSS.

The T5 index's stale `:34` is flagged, not edited, which is correct.

### Nits

- **RN1: applied.** Every sentinel is `<span tabindex="0">sentinel</span>`, and the trigger probe is `<span …>Organic Cotton</span>` (Step 0 item 4, C6b.14(b), C6b.16).
- **RN2: applied, and valid on both trees.** The control is `btn-primary`'s `&:focus-visible { outline: 2px solid currentColor }` (`src/tailwind.css:91-94`). It is a utility, so it beats legacy `*:focus { outline: 0 }` on `0783033` and reads true there as well. The instrument check now requires (a) false **and** the control true on the pre-T5a copy.
- **RN3: applied** in E6b.4.
- **RN4: applied.** §5.6 and Step 0 item 8 both say "|list| + 1 candidates": 6/5 for `W5`, 5/4 for `W4`.
- **RN5: applied** in C6b.5: `networkidle` plus 1 s, listeners recorded by `scriptId`, non-theme listeners recorded and excluded before calling a run red.

### Regressions

None. The closeout touches only criterion, QA, owner-check and index text, as it says. Code blocks, steps, decisions, criterion numbering and the §5.8 budget are unchanged. The §9.2 rows still have both sides.

One residual nit, not blocking: index `:44` says the T5b figures are "quoted from the T6a and T6b round-2 reviews". T6b's round-2 review gave no T5b figure; they come from T6a's N2-1, as `:58` correctly says.

### Manifest (closeout)

**Sampled:** plan `:13-27`, `:548`, `:630`, `:635`, `:639`, `:641`, `:662`, `:700`, `:711-713`, `:739`, `:771`, `:775`; index `:44`, `:57-65`; `src/tailwind.css:70-97`; and the detach trace against `sections/cart-drawer.liquid`.

**Taken on trust:** T6a Revision 2's +160 to +210 / +45 to +85 (from T6a §5.6) and T5b's 59,002 / 59,492 (from T6a's round-2 review N2-1). I checked the arithmetic, not those source figures.

### Trajectory

| Round | Findings |
|---|---|
| 1 | 1 blocker, 8 required |
| 2 | 2 required text items |
| Closeout | all closed; one attribution nit |

Ready for the Coder.

APPROVE
