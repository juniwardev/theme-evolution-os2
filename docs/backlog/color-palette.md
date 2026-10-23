# Adopt Shopify's `color_palette` setting (post-T5 candidate)

Added 2026-10-22 at the owner's request. Not planned yet; needs its own plan (`/plan`) and an owner decision.

## Why

Shopify added a `color_palette` setting type on 2026-06-17 and recommends it for new themes; future development goes to palettes, not color schemes. Horizon 4.0.0 uses it throughout. Color schemes still work and aren't deprecated.

- A theme defines one palette of 2-20 named hex colors in `config/settings_schema.json`; merchants edit it as one grid in the theme editor.
- `color` and `color_background` settings can default to a palette entry (`"default": "{{ settings.colors.accent }}"`), and merchants can still override a color per section or block.
- Liquid reads entries as `settings.<id>.<key>` (e.g. `settings.colors.primary`). Deleting an entry in the editor asks for a replacement and keeps references working.

This fits the theme's existing model (owner decision Q5: per-section color settings, no color schemes). The global colors would come from the palette instead of separate settings, and section color settings would default to palette entries, so changing "accent" once updates every section that hasn't been overridden.

## Current state

- Global colors are four separate `color` settings in `config/settings_schema.json`: `background_color`, `foreground_color`, `accent_color`, `accent_foreground_color`. `snippets/css-variables.liquid` prints them as custom properties, and `src/tailwind.css` maps them to the plain-`@theme` tokens (`bg-background`, `text-foreground`, `bg-accent`, `text-accent-foreground`).
- `sections/header.liquid`, `sections/footer.liquid` and `sections/custom-section.liquid` have their own `color` settings with hardcoded hex defaults. Other converted sections use fixed colors in their markup (e.g. the material-info card's green), which the plan may want to expose as palette-backed settings.
- No `color_scheme_group`. T3 removes the last no-op `color_scheme` settings (owner decision Q10, `docs/plans/theme-evolution-tailwind.md` §10).

## Questions for the plan

- **Migration of saved values:** moving the four global settings into a palette changes their setting IDs. The plan must carry live's saved values (from live's `config/settings_data.json`, not the repo's copy) into the palette's defaults or data, without overwriting merchant settings on push (`shopify theme push -e production` skips `settings_data.json`).
- **Keep the token names:** `css-variables.liquid` should keep printing the same variable names (`--color-background` etc.) so no Tailwind token or utility changes.
- **Which colors follow the palette:** section color defaults that should follow the palette vs. ones that stay fixed (e.g. the material-info card's green, the sustainability bars).
- **Live editor updates:** confirm palette edits update the preview live through the plain-`@theme` mapping.
- **Timing:** after T5 (all sections converted, `base.css` retired), so the change touches Tailwind markup only.

## Sources

- https://shopify.dev/changelog/posts/color-palettes
- https://shopify.dev/docs/storefronts/themes/architecture/settings/input-settings (`color_palette`, `color`, `color_background`)
