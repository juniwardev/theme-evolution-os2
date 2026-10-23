# Pre-existing theme-check offenses (not blocking)

Discovered during Material Spotlight verification, 2026-05-16. CLI 3.94.3.

- `sections/cart-drawer.liquid:18` — TranslationKeyExists: `cart.empty` missing in `locales/en.default.json`. Fix: add the key with merchant-facing text "Your cart is empty."
- `snippets/card-product.liquid:7` — UnusedAssign: `page_width` assigned but not used. Fix: remove the assign or wire it into the snippet's actual output.

Run `shopify theme check` periodically to catch new offenses early.

Resolved: the `card-product.liquid` `UnusedAssign` in Tailwind phase T2; the `cart-drawer.liquid` `TranslationKeyExists` (`cart.empty` added, text "Your cart is empty.") in phase T4a (`docs/plans/theme-evolution-tailwind-t4a.md`). Theme check reports 0 offenses from T4a.
