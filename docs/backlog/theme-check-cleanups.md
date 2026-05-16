# Pre-existing theme-check offenses (not blocking)

Discovered during Material Spotlight verification, 2026-05-16. CLI 3.94.3.

- `sections/cart-drawer.liquid:18` — TranslationKeyExists: `cart.empty` missing in `locales/en.default.json`. Fix: add the key with merchant-facing text "Your cart is empty."
- `snippets/card-product.liquid:7` — UnusedAssign: `page_width` assigned but not used. Fix: remove the assign or wire it into the snippet's actual output.

Run `shopify theme check` periodically to catch new offenses early.
