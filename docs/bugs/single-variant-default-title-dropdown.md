# Bug: Single-variant products show "Default Title - <price>" dropdown

**Slug:** single-variant-default-title-dropdown
**Reported:** 2026-05-18
**Reported by:** Junior Warner (internal QA)
**Severity:** Medium
**Affected scope:** Product page, all single-variant products, all browsers, all viewports

## Steps to reproduce

1. Navigate to any product that has only one variant (e.g. `https://theme-evolution-os2.myshopify.com/products/selling-plans-ski-wax`).
2. Observe the variant picker area below the product title.

## Expected behavior

No variant selector is shown. When a product has only one variant there is no meaningful choice for the customer to make, so the picker should be hidden entirely.

## Actual behavior

A `<select>` dropdown is rendered with a single option whose text reads `Default Title - $X.XX` (where `$X.XX` is the product price). "Default Title" is Shopify's internal placeholder name for the sole variant on a single-variant product — it is not a merchant-authored label and should never be visible to customers.

## Hypothesis

The `variant_picker` block in `sections/product.liquid` iterates `product.variants` and renders a `<select>` unconditionally. There is no guard that skips rendering when `product.variants.size == 1`. The fix is to wrap the selector in a `{% if product.variants.size > 1 %}` check.

## Suspected files

- `sections/product.liquid` — `variant_picker` block, lines 63–72

## Regression risk areas

(To be filled by Architect during planning)

Key observation from pre-investigation: `sections/product.liquid` line 84 contains a
`<input type="hidden" name="id">` inside the `buy_buttons` block that already submits
the selected variant ID to Shopify. Hiding the `<select>` for single-variant products
must not introduce a second or conflicting hidden input — the existing one is sufficient.
