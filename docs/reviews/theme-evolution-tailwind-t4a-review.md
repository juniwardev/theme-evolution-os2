# Plan review: theme-evolution-tailwind-t4a (Revision 1)

Reviewer: Plan-Reviewer (Claude), 2026-10-22
Plan: `docs/plans/theme-evolution-tailwind-t4a.md`, Revision 1 (1,162 lines, read in full). Also read: the index `docs/plans/theme-evolution-tailwind-t4.md` and the T4b outline `docs/plans/theme-evolution-tailwind-t4b.md` (both in full, for the split only; T4b itself is not under review).

Read for this review:

- **Rules:** `CLAUDE.md` (re-read this pass); a grep of `AGENTS.md`, `.claude/agents/` and `docs/backlog/` for theme-check text.
- **Umbrella:** §11, §12, §20.1.
- **T2 and T3:** T2 plan D2.5; T3 plan §0 and D3.2; the T3 review (format and lessons); the T2 QA report (offenses, nits).
- **Source:** `sections/cart-drawer.liquid` (all 406 lines), `sections/cart.liquid`, `snippets/image.liquid`, `snippets/cart-intelligence-banner.liquid`, `sections/product.liquid` 88-107, `sections/header.liquid` 92-103 and 106-202, `sections/collections.liquid` 8-59, `layout/theme.liquid`, `assets/product-form.js`, `src/tailwind.css` (all), `snippets/css-variables.liquid` 1-30, `templates/product.api.liquid`, `.theme-check.yml`.
- **Partial reads:** `locales/en.default.json` (17-25, 56-100, 135-174, 340-364, top-level keys); `config/settings_schema.json` (the five setting ids the plan uses).
- **`assets/base.css`:** 190-339, 410-489, 1340-1389, 3500-3535, plus selector greps.
- **The QA harness the plan says to reuse:** `docs/qa/harness/t2c-lib.mjs` 25-56, `t1r-cart.mjs` 40-74, and greps over `docs/qa/harness/` for drawer state, cart routes and `page.route`.

---

## Summary

This is a careful first revision. The cart's JavaScript is handled correctly where it matters most:

- **State lives on the host.** The plan sees that `renderContents()` and `updateCart()` replace only `.cart-drawer__inner`'s `innerHTML`, so the `<cart-drawer>` host keeps its attributes through every re-render (§4.3).
- **The script diff is minimal.** Only `open()`, `close()` and the three `is-loading` lines change. The Section Rendering API, the `.join(',')`, `setActiveElement()` and T2's `aria-label` sync stay byte-identical, and C4a.17 checks that both statically and dynamically.
- **The cascade facts are right.** The backdrop really is hidden by `div:empty` today. Preflight's `[hidden]` rule is `!important` in `base`, so it beats the host's `block`. Nothing in `base.css` defines the utility names the drawer uses.
- **Every per-step theme-check prediction holds.** See "Checked and found sound".

There are **no blockers in the design**. The required changes are about criteria and text:

- **Criteria that go red on a correct build:**
  - the overlay click at 375 px (R1);
  - the request-delay route patterns (R3).
- **Harness reuse that goes green on a broken build.** The T1 and T2 scripts key drawer state on the `is-open` class, which T4a deletes (R4). This is the "state moves to attributes but a consumer of the old class remains" case. The consumer is the QA harness, not the theme.
- **A Step 0 precondition that can never be met** on this tree (R5).
- **Owner-facing text that is wrong:**
  - Q4a.2's "no stable parity option" (R2);
  - the minified-budget reading (R6);
  - a rollback row (R7).

Each fix is small.

---

## Manifest: what I sampled and what I took on trust

**Sampled and confirmed:**

- **Drawer line citations.** All the `sections/cart-drawer.liquid` cites in §3.2, §4.3, §5.4 and C4a.17 (2-8, 13-75, 80-223 = 144 lines, 97-107, 111-125, 226-397, 271-284, 286-297, 303-332, 321, 323-327, 335, 340-341, 354, 359, 364-392, 369, 371, 386-388, 395-397, 399, 401-406).
- **`product-form.js`** 17-19, 28-29, 36-43, 65-67, 96, 104-107.
- **`header.liquid`** 92-103 (trigger conditional at 95; `aria-label` at 96 and 102) and 175-197.
- **`base.css`:**
  - 196 (`.hidden !important`); 252-339 (Dawn heading rules, invalid because `--font-heading-family` and `--font-heading-scale` aren't defined in `css-variables.liquid`);
  - 417-430, 462, 470-484, 3504-3534;
  - no `.drawer`, `.is-*`, `.block`, `.flex`, `.invisible`, `.visible`, `.sr-only`, `.image` or `.relative` selectors.
- **`src/tailwind.css`** 51-113 (`btn-*`), 115-242 (base, D6 rules, `--radius-input`).
- **Locale keys.** `cart.title`, `cart.update`, `cart.remove`, `cart.checkout`, `products.product.quantity.label` / `.input_label`, `sections.cart.headings.total`, `general.continue_shopping` all exist. `cart.empty` and `cart.close` don't.
- **Only one storefront locale file exists** (`en.default.json`) and `.theme-check.yml` extends `recommended`. So adding keys can't raise `MatchingTranslations`.
- **Setting ids.** `background_color`, `foreground_color`, `input_corner_radius` (0-10), `accent_color`, `enable_cart_drawer` (default true).
- **Ripgrep facts:**
  - only `constants`, `pubsub`, `global`, `eco-tooltip`, `material-api-fetch` and `product-form` are loaded;
  - nothing loaded reads `is-open`, `is-active` or `is-loading`;
  - `render 'image'` has four callers;
  - the three BEM values have no CSS;
  - `animate-spin` and `<svg` appear in `product.liquid` only at 98.
- **Arithmetic:**
  - `C_mix` at 0.10 / 0.06 / 0.02 / 0.25 (234.6 / 242.8 / 250.9 / 204.0) against 234.6 / 242.25 / 250 / 204;
  - `W_dr` = min(400, w);
  - the cart columns (271 − 80 − 16 = 175; 216 − 96 = 120);
  - every §5.8 sum and the T4a / T4b projection rows.

**Taken on trust:** T3's `S_tw` estimate and `B_*` method; `AGENTS.md:58-66` beyond the grep; the umbrella line cites for D6, §17.4 and §0 `N_tc`; T2 impl notes 500-553; the T2 C2.6 / C2.6b sweep methods.

**Manifest gaps the Architect disclosed, and what I did with them:**

- **"Tailwind syntax not built."** The v4 semantics check out:
  - `aria-busy` is a built-in aria variant (`[aria-busy="true"]`), and the named-group forms resolve against `:where(.group\/drawer)`;
  - `transition-transform` includes `translate`;
  - quarter-step spacing (`3.75`, `1.25`, `w-15`) and bare `z-1000` are valid.

  One measurement consequence is unhandled: computed `box-shadow` and color strings (N2).
- **"Browser behavior assumed."**
  - The overlay is `display: none` today: confirmed by reading the cascade.
  - `visibility: hidden` isn't hit-testable: correct.
  - **The plan's own `W_dr` contradicts its overlay-click test at 375** (R1).
- **"Shopify behavior assumed."**
  - `link_to` with `class:` is fine.
  - `t: product: … | escape` is the same pattern Dawn uses on cart quantity labels.
- **Not in the manifest, and where I found the most:**
  - the request URLs the drawer and the product form actually hit (R3);
  - the reused harness's drawer-state detection (R4);
  - whether `git status` can be clean (R5);
  - whether the item-image `div` is really `:empty` today (N1).

---

## Blocking issues

None in the design. R5 would stop a literal Coder at Step 0 as written, but it is a one-phrase fix, so I grade it REQUIRED.

---

## Required changes

### R1: REQUIRED. The overlay click at 375 px is red on a correct build, and the backdrop text the owner sees omits mobile

C4a.5 runs on wax "at 1440 × 900 and 375 × 812" and includes "**Overlay click** (at x = 10, y = 400): closes the same way."

At 375 the panel is `w-full max-w-[25rem]`, so `W_dr(375)` = 375. That is the plan's own §0 row, and C4a.12 asserts it: "the panel rect is 0..w ±1". The panel covers the overlay completely. The click at (10, 400) lands on the panel, nothing closes, and C4a.5 goes red on exactly the build the plan specifies.

The same geometry matters to the owner. E4a.1, R6 and Q4a.2 (⚑) say opening the drawer "dims the page to 50 % black, and a click beside the panel closes it". That is true only where w > 400:

- at 375 and 390 there is no visible backdrop and no outside click;
- at 430 there is a 30 px strip.

Phones are where most of that merchant-visible change would be judged.

**Change:**

- Run the overlay-click step only where `w − W_dr(w)` > 10. That means 1440, plus 430 if a mobile case is wanted, at x = 10.
- At 375, assert instead that the overlay has `display: block` and `opacity: 1`, and is fully covered: `elementFromPoint(10, 400)` is inside `[role="dialog"]`.
- Add one sentence to E4a.1 and Q4a.2: below 400 px the panel covers the backdrop.

Doesn't block the build; it blocks a valid QA verdict.

### R2: REQUIRED (owner-facing text). Q4a.2 says "There is **no stable parity option**", then lists one

Q4a.2's fallback is "delete the overlay `div`. A click beside the panel would then still do nothing." That *is* a stable parity option: no backdrop and no outside close, before and after T5. Only "omit `block`" is unstable.

Since Q4a.2 is one of the three ⚑ questions shown to the owner, the framing matters. Reword it so the owner sees a real two-way choice:

- restore the backdrop (recommended);
- delete the overlay (parity, permanent).

Keep the note that omitting `block` isn't an option, because T5 would surface the backdrop anyway. No build impact.

### R3: REQUIRED. The request-delay criteria name the wrong URLs, so the delay never applies

The criteria and Step 0 say "with `/cart/change.js` delayed 1.5 s by `page.route`" (C4a.6; Step 0 item 6; §10 table) and "with `/cart/add.js` delayed" (C4a.7(b); Step 0 item 6). Neither request goes to a `.js` URL:

- **The drawer** posts to `window.routes.cart_change_url || '/cart/change.js'` (`cart-drawer.liquid:344`). `window.routes.cart_change_url` is set from `{{ routes.cart_change_url }}` (`layout/theme.liquid:54`), which renders `/cart/change`. The `.js` fallback is never used on a theme-layout page.
- **The product form** posts to `routes.cart_add_url` (`product-form.js:46`), which is `/cart/add`. `docs/qa/fix-single-variant-default-title-dropdown-report.md:90` records exactly that URL, and T2's harness had to route `**/cart/add*` (`docs/qa/harness/t2c-misc.mjs:38`).

A route on `**/cart/change.js` doesn't match. The update completes at network speed, and the "during the delay" assertions race the response:

- `aria-busy="true"`;
- `[data-cart-drawer-busy]` visible;
- the 32 × 32 spinner;
- the product wrapper without `hidden`.

That is red, or flaky, on a correct build. This is a true fact (the Ajax API also answers at `.js`) attached to the wrong referent (the URL these scripts request).

**Change:** use `**/cart/change*` and `**/cart/add*`, or name `routes.cart_change_url` / `routes.cart_add_url`. Have Step 0 item 6 record the URL actually requested. Doesn't block the build.

### R4: REQUIRED. The harness the plan says to reuse detects drawer state by the `is-open` class, so head runs silently skip or no-op

§10 Setup says to reuse T1's `t1-drawer.mjs` and `t1r-cart.mjs` and T2's `t2c-*`. Several of those encode the old class state:

- **`t2c-lib.mjs:43-44` (`overflowFn`, the `X_page` / `X_off` function):** `if (drawer && !drawer.classList.contains('is-open')) continue;`. On head the host never carries `is-open`, so every drawer element is skipped *even when the drawer is open*. C4a.12's `X_off` would report no drawer offender on a build whose panel overflows. That is a false green on the exact case C4a.12's sweep row names ("the panel missing `w-full`").
- **`t2c-overflow.mjs:30-31`** checks `is-open` and "closes" the drawer by removing that class. On head it is a no-op, so the drawer stays open over the page for the rest of the run. C4a.22's T2 C2.9 / C2.14 regressions use this script.
- **`t2c-behavior.mjs:58,68` and `t1-behavior.mjs:82`** report `drawerOpen` from `is-open` and read `.cart-drawer__panel`, which no longer exists on head. They would say "closed" for an open drawer.

**Change:** add one Setup bullet. QA's `t4a-*` copies detect "open" as `cart-drawer[data-state="open"]:not([hidden])`. On base, which still uses the class, they accept either form. They close the drawer with Escape, not by editing classes. Then list which reused scripts were adapted. Doesn't block the build; without it, part of C4a.12 can't fail.

### R5: REQUIRED. The Step 0 precondition "`git status` is clean" can't be met on this tree

`git status` shows dozens of long-lived untracked files: every `docs/qa/harness/t*-*.mjs` since T0, `docs/designs/*.png`, and the T4 plan files themselves. These aren't T3 leftovers. They have stayed untracked through T0-T3 by practice. As written, Step 0 item 1 tells the Coder to stop, and with the owner away the pipeline stalls. Or a Coder that ignores the instruction sets a bad precedent.

**Change:** require no tracked changes instead: `git status --porcelain --untracked-files=no` prints nothing. Optionally also require no untracked files under `layout sections blocks snippets templates locales assets src config`. As written this halts the Coder at Step 0; the fix is one phrase.

### R6: REQUIRED (owner-facing text). §5.8's "Reading" understates the minified budget risk

§5.8 projects "T4b with `prose`" at **56,400-70,900** minified against a 60,000 budget. The midpoint is about 63,650, and the top of the range is 10,900 over. The text says "The minified budget probably holds or breaches slightly". By the plan's own table, a breach is more likely than not, and it can be large.

The index (`theme-evolution-tailwind-t4.md`, "CSS budget across both") mentions only gzip. The T4b outline's decision rule (§4) keys only on "Projected gzip".

This is the risk statement the owner is meant to see before T4b (Q4a.11). **Change:**

- state both budgets' projected overshoot in §5.8 and in the index;
- add to Q4a.11 that T4b's rule must test minified and gzip.

No T4a build impact (T4a's own figure is well inside both budgets).

### R7: REQUIRED (operator text). The Step 4 rollback row is wrong for the likeliest rollback

§12 says reverting Step 4 "removes the two keys, so theme check returns to 1". Step 5's `sections/cart.liquid` also renders `{{ 'cart.empty' | t }}`.

The highest-risk step is the drawer. A drawer-only rollback that keeps the new cart page is the most plausible real case. Reverting the Step 4 commit then does two things:

- it leaves `cart.liquid` with a missing key: theme check **2**, not 1;
- `/cart`'s empty state shows "translation missing".

"Revert several steps in reverse order" covers a full rollback, not this one.

**Change:** for a drawer-only rollback, restore only `sections/cart-drawer.liquid` from the Step 0 commit and keep the locale keys. Or revert Step 5 as well. No build impact.

---

## Nits

None of these blocks the build or changes a decision.

- **N1. §3.3 item 1 and D4a.12 misstate one `div:empty` case.** The drawer's item-image `div` (28-32) wraps a non-trimmed `{% if item.image %}`. With no image it still holds whitespace text, so `:empty` doesn't match: the `div` is displayed (0 wide) and takes a 15 px flex `gap`. After T4a it isn't rendered, so an image-less item's details move 15 px left.
  - The footer case is correct: `{%- if -%}` trims it to truly empty.
  - Fixtures are probably unaffected. Correct the claim and add the Δ for image-less items.
- **N2. Comparing computed values in C4a.8 and E4a.19 will false-red unless the method is stated.**
  - Token borders and backgrounds compute as `oklab(… / a)` or `color-mix` strings, not `rgba(0, 0, 0, a)`.
  - Tailwind v4's `shadow-[…]` computes as five layers, four of them transparent `0 0 0 0`.

  Say that colors are compared as composited channels (`C_mix`) and shadows by their visible layer. T2 used the same wording ("same computed color") and handled this in its harness. Make it explicit here.
- **N3. C4a.6 "change the quantity to 3".** The drawer listens for `change`. Name the method: `fill('3')`, then `dispatchEvent('change')` (`t1r-cart.mjs:45` precedent), or press Enter or Tab.
- **N4. C4a.4(a) on the Add to cart root.** During loading the button gets `loading`, and `base.css` defines `.button.loading` (1353). A sweep taken mid-load would fail the allowlist {`loading__spinner`, `hidden`}. Say "at rest", or add `loading` to the allowlist.
- **N5. The §9.2 distinguishing claim for `btn-primary` vs a parity black button cites C4a.15.** C4a.15 only says the checkout background "must not change", which a fixed black button also satisfies. The real discriminator is C4a.8 on E4a.2. Fix the claim, or make C4a.15 assert `rgb(227, 252, 1)`.
- **N6. D4a.5 says it "follows T2 D2.5".**
  - By D2.5's own table, an element that paints its own `#ffffff` is a **Fixed** surface (hex kept, like `material-info`'s white card). The plan *reclassifies* the panel as a page-colored surface. That is a defensible choice, since today's panel already mixes fixed white with inherited foreground text, so neither D2.5 row fits. Say so plainly instead.
  - Note one cost: the kept `#d32f2f` remove link on the owner's dark test palette (`#112233`) is about 3.2:1, below 4.5:1 for 0.85rem text.
  - Owner check 2 already shows the owner the palette behavior.
- **N7. Step 0 item 7 checks the banner fixture only on the complete snowboard.** Also record wax's `system_handle`. Wax is the one-item drawer state for C4a.3, C4a.5 and C4a.8, and an eco handle there would add the banner to every wax dump.
- **N8. C4a.9 "the drawer badge says 3".** It is the header badge.
- **N9. R1 (the 300 ms race) also leaves the scroll lock stuck.** A close followed by an open within 300 ms leaves `data-state="open"` on a host that the stale timer then hides, so `body` stays `overflow: hidden` with nothing visible. This is the same as today with `is-open` and the inline style, so it's parity. T4a rewrites exactly these two functions, so `clearTimeout` would be about two lines. That's for the orchestrator to fold in or leave for the follow-up; not required.
- **N10. Alternatives not considered:**
  - **For the R3 follow-up:** a native `<dialog>` with `showModal()`. It gives a focus trap, Escape, `inert` background and `::backdrop`, and reuses the existing `html:has(dialog[scroll-lock][open])` lock (`src/tailwind.css:127`). It's out of T4a's scope, but it belongs in `fix-cart-drawer-a11y`.
  - **For T4b:** a `@utility page-shell` instead of repeating the six-class shell string in about ten sections. That needs `src/tailwind.css`, so it's T4b's call.
- **N11. Step 6 cites `CLAUDE.md:68` by line number.** T3's rules text may move it. Anchor by the bullet's text.
- **N12. The busy spinner animates while the drawer is open and idle,** because `visibility: hidden` doesn't stop animations. The cost is negligible.

---

## Answers to the orchestrator's specific questions

**Is the split sound, and can T4b pick up cleanly?** Yes, the split is sound.

- The two halves share no file except the four `image` callers, which T4a only renames and T4b then restyles.
- T4a's markup doesn't depend on the D6 parity rules T4b deletes:
  - every T4a `ul` and `a` carries a class;
  - every T4a input carries `border`;
  - the `input` parity rule is attribute-based, not `:not([class])`, and is redundant there.
- The image snippet's new API (`css_class`, wrapper `w-full`, callers size the parent) is what the T4b outline assumes.

Two things T4b needs from T4a:

- the corrected two-budget reading (R6);
- U1-U5 applied to the umbrella before the T4b plan is written. The orchestrator owns that.

The page shell is a repeated string, not a primitive (N10).

**Owner decisions reversed or stretched.** None reversed.

- **Q4a.10** adds three files to T4b's scope. This is disclosed.
- **Q4a.11 option 4** would reverse Q7. It is correctly not recommended.
- **The umbrella §11 spinner note** ("cart drawer and cart page line updates") is narrowed. This is correct: the cart page has no JS updates, and U2 records it.
- **D4a.5** stretches T2 D2.5's wording (N6), but D2.5 is a plan decision, not an owner decision.

**Owner visibility.** The ⚑ set (Q4a.1, Q4a.2, Q4a.5) is the right set. Q4a.2's text must carry R1's mobile caveat and R2's honest parity option. Q4a.3, Q4a.4 and Q4a.7 are visible but small at the default palette. On a non-default live palette, Q4a.7 re-colors the drawer; owner check 2 covers that.

**The theme-check prediction 1 → 0 at Step 4.** It holds:

- `cart.empty` is the only offense today (`CLAUDE.md:68`, backlog line 5);
- Step 4 adds both new keys in the same commit as their first use;
- every other key T4a renders exists;
- there are no other storefront locale files.

Steps 1-3 predictions hold too:

- the spinner and its first `render` share a commit;
- both doc params are read;
- all four `image` callers move to `css_class` in one commit;
- the replacement `{% doc %}` documents every argument the callers pass (`image`, `url`, `css_class`, `width`, `height`, `crop`).

The table assumes the baseline is exactly that one offense. T3 can't ship with more under the current `CLAUDE.md` QA rule, so that's safe.

**The cart's JS, adversarially.**

- **Old-class consumers.** Nothing loaded reads `is-open`, `is-active` or `is-loading`. `product-form.js:105` tolerates the missing `is-empty`. The only stale consumer is the QA harness (R4).
- **The Section Rendering API contract** is unchanged and tested.
- **Add to cart from the product page:**
  - `renderContents` → `open()` clears `hidden`, then sets `data-state` 10 ms later;
  - the freshly inserted panel slides in;
  - if the drawer is already open, a re-rendered panel lands at `translate-x-0` with no slide, as today.
- **Quantity updates, removes, the empty state and busy:**
  - `aria-busy` lives on the persistent host and is removed before `renderContents`, so the re-rendered busy overlay starts invisible;
  - the empty state re-renders without a footer;
  - the header badge gets `hidden` from the server HTML.
- **The scroll lock** is the same timing as today, from a layered rule. `body` has no utility class that could out-rank it.
- **Escape and outside click:** Escape is unchanged. Outside click works only where the overlay is exposed (R1).
- **The header count and `aria-label`:** untouched lines, and C4a.17 covers them.
- **Drawer disabled:** no host, no `<style>`, no trigger attribute (`header.liquid:95`), and `product-form` navigates to `/cart`. PX1 tests it.

**Can every criterion be run with QA's tools?** Yes, with Playwright on the preview URL, curl, theme check and the scratch-copy proxies.

- **Owner-only:** owner checks 1-3 and C4a.22's live C0.13 clause (DevOps, after the live push). The plan labels both.
- **Runnable only after a fix:**
  - C4a.5 at 375 after R1;
  - C4a.6 and C4a.7(b) after R3;
  - C4a.12's drawer part after R4.

---

## Checked and found sound

- **D4a.2 and D4a.3 match the rules.**
  - State is on `hidden`, `data-state` and `aria-busy`, styled by named-group variants.
  - The `<style>` stays a `<style>` because it sits inside the `{% if %}`, wrapped in `@layer components` with no comments.
  - It selects an element and a state attribute, not a Tailwind class.
  - JS sets no inline style.
  - Hooks (`.cart-drawer__inner`, `__quantity-input`, `__item-remove`, `data-cart-drawer-*`) carry no CSS.
- **`base.css` coexistence:**
  - no bare `hidden` class (the host uses the attribute; the busy overlay uses `invisible`);
  - the overlay gets an explicit `block` against `div:empty`;
  - no `.grid`;
  - Dawn's `button`, `button--primary` and `visually-hidden` are removed;
  - the Dawn `h2` / `h3` rules are inert (undefined variables), so they don't fight the new heading classes and leave nothing for T5.
- **Translations and escaping:** both new keys are sentence case; `item.product.title` is now escaped on `/cart`; the dead `default:` fallbacks are removed.
- **CWV:** the drawer `img` keeps `width` and `height`, and the cart page images come from `image_tag` at 160 px.
- **Merchant files:** no edits to `settings_data.json`, `templates/*.json`, non-default locales or `.shopify/`. Schemas are byte-identical (C4a.2).
- **C4a.15 is two-sided** and red on base for the panel and title.
- **C4a.5 separates the attribute build from the rejected class build.**
- **C4a.10 measures against the rendered header,** not a number.

---

## Trajectory

This is round 1, so there is no trend yet. The design is ready. The changes are criteria and text, and none needs a replan.

## Required changes

1. **R1.** Run C4a.5's overlay click only where the overlay is exposed (`w − W_dr(w)` > 10; 1440, optionally 430). At 375, assert that the panel covers the overlay. Add the "below 400 px the panel covers the backdrop" caveat to E4a.1 and Q4a.2.
2. **R2.** Reword Q4a.2. Deleting the overlay is a stable parity option; only omitting `block` is unstable.
3. **R3.** Replace `/cart/change.js` and `/cart/add.js` in C4a.6, C4a.7(b), Step 0 item 6 and the §10 table with the URLs actually requested (`**/cart/change*`, `**/cart/add*`, i.e. `routes.cart_change_url` / `routes.cart_add_url`). Have Step 0 record the observed URL.
4. **R4.** Add a §10 Setup instruction: adapt reused harness drawer-state detection (`t2c-lib.mjs:44`, `t2c-overflow.mjs:30-31`, `t2c-behavior.mjs`, `t1-behavior.mjs`) to `data-state="open"` and not `hidden` on head, and close by Escape. List the adapted scripts in the QA report.
5. **R5.** Change Step 0 item 1's "`git status` is clean" to "no tracked changes" (`git status --porcelain --untracked-files=no` empty), optionally plus no untracked files in theme directories.
6. **R6.** Correct §5.8's "Reading" and the index to state the projected minified overshoot (up to about 10,900 bytes, a breach more likely than not) as well as gzip. Note in Q4a.11 that T4b's rule must test both budgets.
7. **R7.** Fix §12's Step 4 row. For a drawer-only rollback, restore only `sections/cart-drawer.liquid` and keep the locale keys, which `cart.liquid` uses after Step 5. Otherwise revert Step 5 too.

APPROVE WITH CHANGES

---

## Round 2 (Revision 2)

Reviewer: Plan-Reviewer (Claude), 2026-10-23
Plan: `docs/plans/theme-evolution-tailwind-t4a.md`, Revision 2 (1,284 lines). I read these parts in full: the changelog, §0, §3.3, §4, §5.7-§5.8, §8-§16. I spot-read §5.4 for the N12 sentence.

Also read:

- the T4 index `docs/plans/theme-evolution-tailwind-t4.md` (in full);
- the T4b outline §3-§4;
- the umbrella's changed rows. I couldn't run `git diff`, so I read the changed text in place: §0 `N_tc` (63), the D6 table (303-305), §6 (436-437), §11's new note (1031), §17.4 (1663).
- **Rules:** `CLAUDE.md`, re-read this pass.
- **QA harness**, to check the new `t4ac-*` spec against what it replaces:
  - `t2c-sweep.mjs` 7-13;
  - `t2c-mcss.mjs` 4-15;
  - `t2c-proxy.mjs` (targets);
  - `t2c-lib.mjs` 6-11 and 37-55;
  - `t3c-lib.mjs` 4-6;
  - `t3c-proxy.mjs` 6 and 112-116.
- The orchestrator's `prose` figures and its post-T3 baseline (41,801 / 8,989).

### Summary

Revision 2 is a faithful response. All seven round-1 required items are addressed, and five are fully resolved. The umbrella edits U1-U5 are minimal and correct, and they leave owner-decision text alone. The arithmetic checks out. Q4a.2 is now an honest two-way choice.

Three small things remain, two of them in text the owner and QA will act on:

- **R2-1.** Three places say `prose` size variants "breach both budgets on their own". The orchestrator's own figure says gzip stays under (11,642 < 12,000). The T4b outline has it right.
- **R2-2.** In Q4a.11, the proposed sign-off threshold isn't labelled as a proposal. The owner isn't told that, on the current estimates, the threshold always lands in "ship and ask for sign-off".
- **R2-3.** The new harness spec fixes the three `is-open` scripts. But it declares T2's sweep, mcss and palette scripts and T3's `t3c-*` "reused unchanged (no drawer-state logic)". Those scripts can't reach the T4a roots. Run unchanged, C4a.3 and C4a.4 would pass on the drawer without ever looking at it.

None of these blocks the Coder; all three must be fixed before QA runs or the owner is shown Q4a.11. The trajectory is good: from 7 required items to 3 smaller ones, and no design issue in either round.

### Status of round-1 required items

| Item | Status | Evidence |
|---|---|---|
| R1 (overlay click at 375) | **Resolved** | C4a.5 clicks only where `w − W_dr(w)` > 10, at 1440 (1,040 px strip) and 430 (30 px), and adds the 430 × 812 width. At 375 it asserts `display: block`, `opacity: 1` and `elementFromPoint(10, 400)` inside `[role="dialog"]`, which is two-sided. E4a.1, the new E4a.21, R6 and Q4a.2 carry the mobile caveat |
| R2 (Q4a.2 parity) | **Resolved** | (a) Restore, recommended, with the cost stated for > 400 px and "no change" for 320-390. (b) Delete the overlay: permanent parity, which re-runs C4a.4 and C4a.5 and drops its overlay clauses. Omitting `block` is ruled out with the T5 reason. This is honest and complete for the owner |
| R3 (request URLs) | **Resolved** | `**/cart/change*` and `**/cart/add*` in C4a.6, C4a.7(b), §10 and Step 0. Step 0 item 6 records the observed URLs from `page.on('request')` and says to use those if they differ. The §10 seeding `fetch('/cart/add.js')` is correctly labelled setup |
| R4 (harness `is-open`) | **Partly resolved: see R2-3** | The three named defects are fixed by `t4ac-lib.mjs` (attribute-aware `drawerOpen`, Escape-only `closeDrawer`, an `overflowFn` copy) and its three copies. The "reused unchanged" line that follows is inaccurate |
| R5 (`git status`) | **Resolved** | "Every line starts with `??`", plus `git status --porcelain -- layout sections blocks snippets templates locales assets src config scripts` prints nothing. That is satisfiable on this tree, and it still catches a dirty theme directory |
| R6 (budget reading) | **Resolved in substance; see R2-1 and R2-2 for wording** | Both budgets are projected with the measured `S_prose`, and minified is named the likelier breach. The T4b rule tests both units, and the worse one decides |
| R7 (rollback) | **Resolved** | The drawer-only row restores just the drawer file, keeps the keys and predicts 0, which is correct: the restored drawer's `cart.empty` call now resolves. The full revert takes Steps 6, 5 and 4 in that order |

Nits N1-N8 and N10-N12 are folded in correctly. I checked:

- E4a.20's 15 px;
- the §10 comparison method (composited channels, the shadow's one opaque layer);
- C4a.4 runs at rest;
- C4a.15 asserts `rgb(227, 252, 1)` in both runs;
- Step 0 item 7 now records wax's material handle.

**N9 declined: accepted.** It is parity with today, it is recorded in R1 with the stuck scroll lock named, and §14.3 routes it to the a11y follow-up.

### Manifest: what I sampled and what I took on trust

**Re-derived:**

- **The `S_prose` deltas:** 54,392 − 41,801 = 12,591; 10,636 − 8,985 = 1,651; 66,403 − 41,801 = 24,602; 11,642 − 8,985 = 2,657.
- **Every §5.8 projection row** and its index copy:
  - T4a 43,801-45,801 / 9,385-9,785;
  - T4b without `prose` 46,801-51,801 / 9,985-10,885;
  - plain `prose` 59,392-64,392 / 11,636-12,536;
  - variants 71,403-76,403 / 12,642-13,542.
- **Headroom and overshoot:** 5,608 and 1,364; −608..+4,392 and −364..+536; +11,403..+16,403 and +642..+1,542.
- **Contrast of `#d32f2f`:** 3.24:1 on `#112233`, 4.98:1 on white.
- **The 1,040 px and 30 px strips.**

**Read in place:** every umbrella edit (U1-U5), the index, and T4b §4.

**Taken on trust:** the orchestrator's measurements themselves. The plan tags them `[measured: orchestrator]` and has T4b re-measure, which is the right handling.

**Manifest gap the Architect disclosed:** the harness cites were "taken from the review, not re-read". That is exactly where R2-3 sits.

### Required changes (round 2)

#### R2-1: REQUIRED (owner-facing). "Size variants breach both budgets on their own" is false for gzip

The orchestrator measured `prose prose-sm md:prose-lg max-w-none` at **66,403 / 11,642** on the 41,801 / 8,985 baseline. On their own, the variants:

- **breach minified** (by 6,403);
- leave **gzip under** 12,000, by 358.

Gzip breaches only after T4a's and T4b's own growth (≥ 1,000 gzip) is added. That is the projection row (12,642-13,542), not "on their own".

The wrong wording appears in three places:

- T4a §5.8 Reading, third bullet: "Size variants breach both budgets on their own";
- Q4a.11, third bullet: "breach both budgets on their own";
- the index: "Size variants breach both budgets by themselves".

The T4b outline §4 says it correctly: "Size variants alone push the minified file past 60,000 before T4a's and T4b's own utilities are counted".

This is a true number attached to the wrong extent, in the risk statement written for the owner. **Change** all three to: "size variants alone breach the minified budget; with T4a's and T4b's growth they breach both". The policy conclusion (plain `prose` only, unless the owner signs off) is unaffected.

#### R2-2: REQUIRED (owner-facing). Label the sign-off threshold as a proposal in Q4a.11, and say what it means on today's numbers

The threshold "at most about 5,000 minified and 1,000 gzip over" is tagged `[proposed]` in §5.8 option 1 and in the T4b §4 table. That is correct.

**Q4a.11**, the bullet the orchestrator applies by default, states it untagged as an instruction: "Take option 1 … if the projected overshoot is at most about 5,000 minified and 1,000 gzip". Two consequences the owner should see:

1. **The threshold is the Architect's proposal, not an owner decision.** `CLAUDE.md` (`### Performance & Core Web Vitals`) makes any breach need the owner's sign-off in the plan or QA report. The threshold only decides what is *recommended*; it can't stand in for that sign-off.
2. **On the current estimates, every plain-`prose` projection falls inside the threshold.** The worst case is 4,392 minified and 536 gzip over, against 5,000 and 1,000. So the rule always recommends "ship plain `prose` and ask for sign-off". Options 2 and 3 only come into play if T4b's re-measure is worse than estimated. That is a reasonable recommendation, but it should be stated in those words, not implied by the threshold.

**Change:**

- add `[proposed; not an owner decision]` to the Q4a.11 bullet;
- add one sentence: "on current estimates (at most 4,392 / 536 over) this always selects the sign-off row; the owner signs off the actual figure at T4b".
- Optionally, have T4b try option 3 (`@source not inline`, which keeps Q7 and costs no design) before asking for sign-off, whatever the band. That is a recommendation, not a requirement.

#### R2-3: REQUIRED (QA-facing). The "reused unchanged" scripts can't reach the T4a roots, so C4a.3 and C4a.4 would pass on the drawer without ever sweeping it

§10 Setup now says: "Reused unchanged (no drawer-state logic): `t0-lib.mjs`, T2's mcss, sweep and palette scripts, and T3's `t3c-proxy`/`t3c-lib`". What those scripts actually do:

- **`t2c-sweep.mjs:11-13` (C4a.3 and C4a.4's method).** Its roots are hard-coded:
  - `.shopify-section` elements whose id starts with `shopify-section-template`;
  - its pages are `p3p,wax,snow` (line 7);
  - it never opens the drawer.

  The drawer lives in `#shopify-section-cart-drawer`, which isn't a template section, so it is never under those roots. `/cart` isn't in its page set either.

  Run unchanged, C4a.3 ("no unlayered rule styles T4a markup") and C4a.4(a) ("no Dawn class names") return "no match" for the drawer whether or not the old `<style>` and `button button--primary` survive. That is a false green on the plan's main drawer criteria, the same class of defect as round-1 R4.
- **`t2c-mcss.mjs:7,15`.** Pages come from `PRODUCTS` keys (`p3p,snow,home,wax`), and `t2c-lib.mjs:6-11` has no cart key. C4a.14's `/cart` run can't happen unchanged. It fails loudly, not silently.
- **`t2c-proxy.mjs`** (C2.27's palette run). It measures T2 targets (spotlight, recommendations, card badges), not the drawer elements C4a.15 names.
- **`t3c-lib.mjs:4-6`** re-exports `overflowFn` from `t2c-lib.mjs`, the version with the `is-open` skip. `t3c-proxy.mjs:114` uses it. So "no drawer-state logic" is untrue transitively. Today's `t3c-proxy` never opens the drawer, so nothing breaks yet, but any T4a proxy built on `t3c-lib` would inherit round-1 R4.

There is also no named script for C4a.5 (mechanism), C4a.8 (the §10 dump), C4a.15 (drawer palette) or C4a.18-C4a.21 (proxies). Revision 1's generic "new `t4a-*` scripts" covered these; Revision 2's narrower list doesn't.

**Change:**

- Reduce "reused unchanged" to `t0-lib.mjs`.
- Say the T2 and T3 scripts are reused as **methods**, in new `t4ac-` scripts that import `overflowFn` and `drawerOpen` from `t4ac-lib.mjs`:
  - **`t4ac-sweep.mjs`:** the T4a roots exactly as §9 defines them (the `cart-drawer` subtree, `/cart`'s `__main` wrapper, the Add to cart button) and the §10 drawer states (closed; open with one item, two items, empty; busy);
  - **`t4ac-dump.mjs`:** the §10 element table;
  - **`t4ac-mcss.mjs`:** with a `/cart` page;
  - **`t4ac-proxy.mjs`:** PX1-PX4, drawer palette included.
- Map each C4a criterion to its script, one line each, in the QA report template.

Doesn't block the Coder; it blocks a valid QA verdict on C4a.3, C4a.4, C4a.14 and C4a.15.

### Nits (round 2)

None of these blocks the build or changes a decision.

- **N2-1. Use T3's final baseline.** The orchestrator reports T3's final commit at 41,801 / **8,989**. The plan uses 8,985 (T3 Steps 1-5). That moves the gzip headroom to 1,360 and the overshoot range to −360..+540. "About 540" already matches. Step 0 re-measures; update the figure there, or in T4b.
- **N2-2. §0's `S_prose` row tags "the output doesn't grow with the number of elements" as `[measured: orchestrator]`.** The orchestrator's note didn't include that. It is true by construction, since Tailwind emits a class once, so tag it `[derived]`.
- **N2-3. The umbrella's §0 `N_tc` row says "0 from T4a" before T4a has shipped.** That register text would be wrong after a full revert (§12). "0 once T4a ships" is safer.
- **N2-4. E4a.20 (image-less item, 15 px) has no criterion that exercises it,** and the fixtures all have images. That is acceptable as an observed-if-seen row. Say so, so QA doesn't hunt for a fixture.

### Checked and found sound (round 2)

- **Nothing new contradicts the E and C rows:**
  - E4a.1 and E4a.21 match C4a.5's widths and C4a.12's panel 0..w at 320 and 375;
  - Q4a.2 (b) lists the criteria it changes;
  - the rollback rows agree with §13's theme-check table;
  - the changelog's claims (no step, decision or criterion renumbered) hold.
- **Umbrella U1-U5:**
  - §6 is split into T4a and T4b rows;
  - §11 has a dated note *after* the owner's spinner paragraph, which is untouched;
  - §17.4 and D6 say "T4b";
  - Q7's text is unchanged;
  - nothing else in the umbrella moved.
- **The T4b outline §4 decision rule** tests both units, lets the worse decide, keeps option 4 as the owner's Q7 call, and labels the threshold `[proposed]`.
- **The Step 0 precondition** is satisfiable and still meaningful.

### Trajectory (round 2)

Round 1 had 7 required items and 12 nits. Round 2 has 3 required items, all wording or QA-harness scope, and 4 nits. The design has drawn no finding in either round. Once R2-1 to R2-3 are folded in, this is ready, and a further round should be a quick closeout rather than a re-review.

### Required changes (round 2)

1. **R2-1.** Replace "size variants breach both budgets on their own / by themselves" (T4a §5.8 Reading, Q4a.11, the T4 index) with: alone they breach minified (66,403); with T4a's and T4b's growth they breach both. T4b §4 already says it correctly.
2. **R2-2.** In Q4a.11, tag the 5,000 / 1,000 threshold `[proposed; not an owner decision]`. Restate that any breach still needs the owner's sign-off (`CLAUDE.md`). Add that on current estimates (at most 4,392 / 536 over) the rule always selects "ship plain `prose` and ask for sign-off".
3. **R2-3.** In §10 Setup, reduce "reused unchanged" to `t0-lib.mjs`. Specify `t4ac-sweep` (the §9 T4a roots and drawer states), `t4ac-dump`, `t4ac-mcss` (with `/cart`) and `t4ac-proxy` (PX1-PX4), all importing `overflowFn` and `drawerOpen` from `t4ac-lib.mjs`, never via `t3c-lib`/`t2c-lib`. Map each C4a criterion to its script in the QA report.

APPROVE WITH CHANGES

---

## Round 2 closeout (Revision 2.1)

Reviewer: Plan-Reviewer (Claude), 2026-10-23. Read: the Revision 2.1 changelog, §0 (`S_tw`, `S_prose`), §5.8, §8 E4a.20, §10 Setup, §11 R10, §14.1 U3 and §15.2 Q4a.11. Also the T4 index, T4b outline §4, and the umbrella §0 `N_tc` row. I checked each claim with a grep over all three T4 files and re-derived the changed figures.

| Item | Status | Evidence |
|---|---|---|
| **R2-1** | **Resolved** | Three places now say that size variants "alone breach the minified budget (66,403 measured). With T4a's and T4b's growth they breach both": §5.8 Reading, Q4a.11 and the index. §0 `S_prose` adds "but not gzip (11,642 < 12,000)". This matches T4b §4. A grep finds no "on their own" or "by themselves" outside the changelogs |
| **R2-2** | **Resolved** | §5.8 option 1 and Q4a.11 both tag the threshold `[proposed; not an owner decision]`. Q4a.11 also says three things: the threshold "only decides what this plan *recommends*"; any breach still needs the owner's sign-off under `CLAUDE.md`, and the threshold doesn't replace it; and on current estimates the rule "always lands on 'ship plain `prose` and ask for sign-off'". It then gives the worst case (4,392 / 540) against 5,000 / 1,000. The index carries the same note. Trying option 3 first is recommended in every band |
| **R2-3** | **Resolved** | Only `t0-lib.mjs` is reused unchanged, and the four reasons the others can't be are stated, including `t3c-lib` re-exporting the old `overflowFn`. No `t4ac-` script may import from `t2c-lib` or `t3c-lib`. `t4ac-sweep` uses exactly §9's roots, §10's drawer states (busy included) and `/cart`. The dump, diff, mcss (with `/cart`, `L_style` and preload headers), proxy (drawer and cart targets) and shots scripts are specified. The criterion → script map covers every ID from C4a.0 to C4a.22 (I checked all 23), plus PX1-PX4 and the owner checks |
| N2-1 | Resolved | 8,989 is used throughout. Headroom: 12,000 − 8,989 − 1,651 = 1,360. Plain overshoot −360..+540; variants +646..+1,546. Rows checked: 9,389-9,789 / 11,640-12,540 / 12,646-13,546. The 8,985 survivors are correctly scoped to the Steps 1-5 build |
| N2-2 | Resolved | `[derived]`, with the reason (Tailwind emits each class once) |
| N2-3 | Resolved | Umbrella §0 `N_tc` reads "0 once T4a ships … Once T4a ships, C0.8 means 0 offenses", and §14.1 U3 records it |
| N2-4 | Resolved | E4a.20 says no criterion exercises it, so it is observed only if seen |

**Nothing new contradicts the E or C rows.** Revision 2.1 changes only text, figures and the QA harness spec. No step, criterion, Δ row, decision or risk was renumbered, and I spot-checked that claim. The design has drawn no finding in any round.

**What has been independently confirmed across the rounds:**

- the cart JS analysis and the theme-check predictions (round 1);
- the umbrella edits and every budget figure (rounds 2 and 2.1).

**Taken on trust:** the orchestrator's scratch-build measurements. T4b re-measures them on its own base.

**Still with the owner, not open review items:**

- the ⚑ questions Q4a.1, Q4a.2 and Q4a.5, at owner check 3 on staging;
- the `prose` budget sign-off at T4b.

APPROVE
