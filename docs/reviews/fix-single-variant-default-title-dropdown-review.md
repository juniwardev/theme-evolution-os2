# Review: fix-single-variant-default-title-dropdown

**Plan:** `docs/plans/fix-single-variant-default-title-dropdown.md`
**Bug:** `docs/bugs/single-variant-default-title-dropdown.md`
**Reviewer:** Plan-Reviewer (adversarial)
**Date:** 2026-05-18

---

## 1. Summary

The plan proposes a single-file, one-condition guard in `sections/product.liquid`: wrap the `variant_picker` block body (lines 63-72) in `{%- if product.variants.size > 1 -%}` so that products with a single variant no longer render the offending `<select>` that prints "Default Title - $X.XX". The plan argues the change is safe because the actual variant ID is submitted by an entirely separate hidden input inside the `buy_buttons` form (line 84), and `product-form.js` only reads from that form-scoped input. No JS, CSS, schema, locale, or template edits are proposed.

---

## 2. Verified claims

I independently verified each load-bearing claim by reading the referenced files.

| # | Claim | Verified? | Notes |
|---|---|---|---|
| 1 | `variant_picker` block lives at `sections/product.liquid` lines 63-72 | YES | Exact line range matches the file content. The proposed replacement code is byte-for-byte identical to the original except for the added `{%- if %}` / `{%- endif %}` wrapper. |
| 2 | The `<select name="id">` is outside the `<form>` | YES | The `<select>` is at lines 65-71 inside `<div class="product__variant-picker">`. The `<form>` is at lines 83-96 inside the `buy_buttons` block. The `<select>` has no `form="..."` attribute, so it is not implicitly associated either. |
| 3 | Hidden input at line 84 is inside the form | YES | Line 84 reads `<input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">` and sits between `{% form 'product', product %}` (line 83) and `{% endform %}` (line 96). |
| 4 | `product-form.js` reads `[name=id]` via `this.form.querySelector('[name=id]')` | YES | `assets/product-form.js` line 138-140: `get variantIdInput() { return this.form.querySelector('[name=id]'); }`. `this.form` is set in the constructor (line 8) to `this.querySelector('form')`, scoping it strictly to the form inside the `<product-form>` custom element. |
| 5 | `assets/product-info.js` reference to `input[name="id"]` is in a different context | YES | Line 218 scopes its query to `#product-form-${this.dataset.section}` and `#product-form-installment-${this.dataset.section}`. The form in `sections/product.liquid` has no `id` attribute, so this code path is not reachable on this theme's product page. |
| 6 | `card-product.liquid` has its own self-contained variant handling | YES | Lines 368-376 render a standalone hidden `name="id"` input inside its own `{% form 'product', card_product %}`. No code-sharing with the `variant_picker` block. |
| 7 | `templates/product.json` references the `variant_picker` block | YES | `templates/product.json` lines 29-34 add the block with `picker_type: "button"`. The plan does not propose to modify `templates/product.json` (which is correct — that file is merchant-controlled per CLAUDE.md). |
| 8 | Schema for `variant_picker` is at lines 251-273 | YES | Verified. The plan correctly leaves it untouched. |
| 9 | `product.variants.size > 1` is a valid guard | YES | This is standard Shopify Liquid. `product.variants` is always at least size 1, so `> 1` correctly identifies the "more than one variant" case. |

All verified claims hold. The plan's factual basis is sound.

---

## 3. Issues found

### 3.1 Advisory: consider `product.has_only_default_variant` (semantic precision)

The bug is specifically about the "Default Title" placeholder string surfacing to customers. Shopify exposes a more semantically precise property `product.has_only_default_variant` that is true if-and-only-if the product has a single variant with the literal placeholder title `Default Title`. The plan's chosen condition `product.variants.size > 1` is broader: it also hides the picker for theoretical single-variant products that have a real option name (e.g., a product with one option `Color: Red`).

In practice the broader guard is the right behavior (no choice to make = no picker), so the plan's choice is defensible. But the rationale for the choice is not stated, and a reviewer reading the code six months from now will wonder why the more specific Shopify-native check was not used. **Advisory only:** consider a code comment on the guard line explaining the reasoning, or use `has_only_default_variant` if the intent is strictly "suppress the placeholder label and nothing else."

### 3.2 Advisory: `picker_type` setting is dead code that is now even more obviously dead

The schema (lines 251-273) lets merchants choose `dropdown` or `button`. The rendering code ignores this setting and always emits a `<select>`. After this fix, the dead setting is still there. The plan correctly puts this out of scope, but a `disabled: true` or schema cleanup tracking ticket would be appropriate follow-up. **Not blocking.**

### 3.3 Advisory: "no risk" claims around form behavior are technically correct but oversold

The "Regression risk areas" table marks every row "No risk." The strongest qualification is in row 3 (multi-variant add-to-cart), which mentions a pre-existing limitation. The reviewer agrees these are all low risk given the verified facts, but the table reads as if no testing is required. The verification approach (section 9) does specify six test cases, so this is not a practical gap — just a tonal one. **Not blocking.**

### 3.4 Minor: verification approach test case 1 lacks an explicit "before-fix" reproduction step

CLAUDE.md and the bug-fix workflow expect "how to confirm the bug existed" alongside "how to confirm it is gone." Test case 1 only describes the post-fix expected state. There is no explicit "before applying the fix, navigate to <URL>, confirm the `<select>` with text matching `/Default Title - \$/` is present." Adding a one-line "before:" check would tighten the verification loop. **Advisory.**

### 3.5 Minor: theme-editor regression risk is not fully tested

Test case 5 covers theme editor preview but only checks that the block is "selectable in the block tree." It does not specify what happens when a merchant tries to click on the area where the picker would render. For a single-variant product in the editor, clicking that spot will click through to whatever is behind it. This is what the plan calls an "acceptable tradeoff" and Open question 1 — but QA should at least record what they observed, not just confirm the block is reachable via the sidebar. **Advisory.**

### 3.6 Minor: no explicit regression test against the same single-variant product after a variant is added

The plan's edge cases section says "Product becoming multi-variant later: No issue — the guard re-evaluates on each render." This is true, but no test case in section 9 exercises this. If QA can add a variant to `selling-plans-ski-wax` (or another low-stakes dev-store product) and reload, that's a 60-second sanity check. **Advisory — nice to have, not required.**

### 3.7 Minor: cosmetic — the plan says "Whitespace trim (`{%- ... -%}`) is used"

Verified the proposed code uses `{%- if -%}` and `{%- endif -%}`. Good. No issue.

---

## 4. Scope assessment

The plan touches exactly one file, with a five-line edit. Scope is appropriately minimal for a Tier 2 cosmetic bug.

**Files explicitly NOT touched and correctly so:**

- `templates/product.json` — merchant-controlled per CLAUDE.md. Correctly untouched.
- `assets/product-form.js` — not affected; verified by reading the file.
- `snippets/card-product.liquid` — self-contained, not affected.
- `assets/product-info.js` — scoped to a form ID that does not exist in this theme; not affected.

**No scope creep detected.** The plan resists the temptation to also fix the `picker_type` dead-setting issue or to wire the multi-variant `<select>` into the form. Both are correctly deferred.

**No under-scoping detected.** The fix is sufficient. No additional file needs to change for this bug.

---

## 5. Open questions assessment

The plan has two open questions:

**Open question 1** ("stub placeholder in theme editor for single-variant products"): The plan recommends shipping the simpler version first. This is acceptable. The block remains visible in the block tree sidebar (Shopify renders block lists from the schema, not the DOM), so merchants can still configure or remove it. **Truly post-ship.**

**Open question 2** ("wire the multi-variant `<select>` into the form"): This is a separate, pre-existing bug that does not block the current fix. The current bug is purely cosmetic (the "Default Title" label leaking), and the proposed fix resolves it without making the multi-variant bug worse. **Truly post-ship.** A separate bug should be filed when this is pursued.

Neither open question blocks implementation.

---

## 6. Root-cause vs symptom assessment

The proposed fix is a **render-time guard**, not a deeper architectural change. A purist might argue the root cause is "the variant_picker block renders dead UI for single-variant products *and* is not wired to the form for any product" — the proposed fix addresses only the first half (the visible symptom). However:

- The visible symptom (Default Title text leaking) is the actual bug as reported.
- The non-wiring issue is a separate, pre-existing limitation explicitly tracked as Open question 2.
- Fixing both at once would expand scope significantly (JS event listener, form association, possibly the unused `picker_type` setting), inflating regression surface area for a Medium-severity cosmetic bug.

The decision to scope down is appropriate for a Tier 2 bug. **The fix addresses the root cause of the *reported* bug.**

---

## 7. Verdict

The plan correctly identifies the bug, makes a minimal targeted change, accurately characterizes the regression surface, and defers genuinely separate issues to follow-up bugs. All factual claims about file structure and JS behavior verify against the source. The advisory items in section 3 are tone/test-case nits, not blockers.

Recommended changes before implementation (advisory, not blocking):

1. Add a one-line "before-fix" reproduction confirmation step to test case 1 in section 9 ("Before applying the fix, confirm the `<select>` containing `Default Title - $X.XX` is rendered at the URL.").
2. Tighten the language in the "Regression risk areas" table to acknowledge that "No risk" still warrants the QA test cases that are listed.
3. Optionally consider a one-line code comment on the new guard explaining the choice of `> 1` over `has_only_default_variant`.

None of the above blocks shipping.

APPROVE
