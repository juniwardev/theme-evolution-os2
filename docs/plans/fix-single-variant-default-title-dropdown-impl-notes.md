# Implementation Notes: fix-single-variant-default-title-dropdown

**Slug:** fix-single-variant-default-title-dropdown
**Implemented:** 2026-05-18
**Coder:** Claude (claude-sonnet-4-6)
**Base branch / commit before change:** 8e3d02a (main)
**Commit:** 2b63c88

---

## Files changed

| File | Reason |
|---|---|
| `sections/product.liquid` | Wrapped the `variant_picker` block body (lines 63–72) in a `{%- if product.variants.size > 1 -%}` / `{%- endif -%}` guard as specified in the plan. No other edits. |

---

## Exact line range edited

Lines 63–72 in the pre-change file were replaced. After the edit, the guard adds 2 lines and increases the indentation of the inner block, so the `variant_picker` case now spans lines 63–74 in the post-change file. The net diff is +2 lines (+11 insertions, -9 deletions per git).

The change in full:

```liquid
{%- when 'variant_picker' -%}
  {%- if product.variants.size > 1 -%}
    <div class="product__variant-picker" {{ block.shopify_attributes }}>
      <select name="id">
        {% for variant in product.variants %}
          <option value="{{ variant.id }}" {% if variant == product.selected_or_first_available_variant %}selected="selected"{% endif %}>
            {{ variant.title }} - {{ variant.price | money }}
          </option>
        {% endfor %}
      </select>
    </div>
  {%- endif -%}
```

---

## shopify theme check result

**Clean with respect to this change.** The tool reported 2 total offenses across 2 files — both are pre-existing issues that existed before this edit:

- `sections/cart-drawer.liquid` — `TranslationKeyExists` error: `'cart.empty'` missing from `locales/en.default.json` (pre-existing)
- `snippets/card-product.liquid` — `UnusedAssign` warning: variable `page_width` assigned but not used (pre-existing)

Verified pre-existing by stashing the fix, re-running `shopify theme check` on the original code, and confirming identical output. The fix introduced zero new warnings or errors.

---

## Commands to run the feature locally

```bash
cd /Users/juniorwarner/Projects/Shopify/theme-evolution-os2
shopify theme dev
```

Then navigate to:
- A single-variant product (e.g. `http://127.0.0.1:9292/products/selling-plans-ski-wax`) — confirm no variant picker dropdown is rendered.
- A multi-variant product — confirm the `<select>` dropdown still renders.

---

## Deviations from the plan

None. The change is byte-for-byte identical to what the plan specified in section 2.

---

## Bug fix verification approach

Reference: the bug was reproduced by navigating to a single-variant product and observing a `<select>` with one option reading "Default Title - $X.XX" (see `docs/bugs/single-variant-default-title-dropdown.md`, Steps to reproduce).

### Before-fix confirmation (regression baseline)

To confirm the bug existed before this fix, checkout the commit prior to `2b63c88` (i.e. `8e3d02a`) and follow the steps to reproduce from the bug report:

1. Run `git checkout 8e3d02a -- sections/product.liquid` to restore the pre-fix file.
2. Start a local dev server with `shopify theme dev`.
3. Navigate to `http://127.0.0.1:9292/products/selling-plans-ski-wax` (or any single-variant product).
4. Confirm a `<select>` dropdown is rendered below the product title with a single option whose text matches `Default Title - $X.XX`.
5. Confirm via browser DevTools: `document.querySelector('.product__variant-picker')` returns a non-null element.

Restore the fix afterward: `git checkout 2b63c88 -- sections/product.liquid`.

### After-fix verification (QA test cases)

**Test 1 — Single-variant product: picker hidden**

1. Start local dev server: `shopify theme dev`.
2. Navigate to a single-variant product, e.g. `http://127.0.0.1:9292/products/selling-plans-ski-wax`.
3. Inspect the page below the product title.
4. Expected: No `<select>` element is rendered. No text matching `Default Title` appears anywhere on the page.
5. Verify via DevTools console: `document.querySelector('.product__variant-picker')` returns `null`.

**Test 2 — Multi-variant product: picker still renders**

1. Navigate to any product with more than one variant (check `docs/dev-fixtures.md` for product URLs, or pick any product with size/color options in the dev store).
2. Inspect the page below the product title.
3. Expected: A `<select>` is present and lists all variants. The `selected_or_first_available_variant` is preselected.
4. Verify via DevTools: `document.querySelector('.product__variant-picker select')` returns a non-null `<select>` element with multiple `<option>` children.

**Test 3 — Add-to-cart works on single-variant product**

1. On a single-variant product (no picker visible), click "Add to cart".
2. Expected: The item is added to cart successfully.
3. Verify via Network tab: the POST to `/cart/add` includes `id=<variant_id>` where `<variant_id>` matches `product.selected_or_first_available_variant.id` for that product.
4. Confirm the cart count increments and/or the cart drawer/page shows the correct product.

**Test 4 — Add-to-cart works on multi-variant product**

1. On a multi-variant product, click "Add to cart" without changing the picker selection.
2. Expected: The item is added to cart with the `selected_or_first_available_variant`.
3. Note: changing the `<select>` value does NOT currently update the hidden input — this is a pre-existing limitation (Open question 2 in the plan) and must not be marked as a failure for this fix.

**Test 5 — Theme editor**

1. Open the Shopify theme editor for the product template.
2. Confirm the `variant_picker` block appears in the block list/sidebar.
3. For a single-variant product in the editor canvas: the picker renders nothing on the canvas, but the block is still reachable and selectable via the sidebar block tree.
4. For a multi-variant product: the picker renders as before.

**Test 6 — shopify theme check**

Run `shopify theme check` from the project root and confirm the 2 pre-existing offenses (cart-drawer translation key and card-product unused assign) are the only issues. No new warnings or errors should be present.

### Pass criteria

All six tests above pass. No console errors on either single-variant or multi-variant product pages. `shopify theme check` introduces no new offenses compared to the pre-fix baseline.

---

## Out-of-scope observations

- `sections/cart-drawer.liquid` line 18 references `'cart.empty'` which has no entry in `locales/en.default.json`. This is a pre-existing `TranslationKeyExists` error unrelated to this fix.
- `snippets/card-product.liquid` line 7 assigns `page_width` which is never used. This is a pre-existing `UnusedAssign` warning unrelated to this fix.
- The `variant_picker` block's `picker_type` schema setting (`dropdown` / `button`) is dead code — the render logic always emits a `<select>` regardless of the setting value. This is explicitly called out as out-of-scope in plan section 8 (Open question 2 / separate bug).
