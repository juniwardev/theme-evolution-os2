# T6 batch (after T5)

Added 2026-10-23 at the owner's request. Not planned yet: each item needs a plan (`/plan`) and review before code. Order and grouping are open.

## Owner requests

- **Collection grid columns setting.** `sections/collection.liquid` uses `grid-fill` with `--grid-min: 31.25rem`, so desktop fits two cards (about 660 px each at 1440) and an odd product count leaves an empty slot that reads like a missing image (owner, 2026-10-23, on `/collections/all` with 15 products). Add a merchant setting for desktop columns (and probably mobile columns), mapped to complete class strings per `CLAUDE.md` "Mobile layouts"; keep today's look as the default so saved templates don't change. Consider the same setting for `sections/search.liquid` and `sections/collections.liquid`. Watch the CSS budget (T5 decides the headroom).

## Follow-ups from QA reports

- Eco tooltip trigger isn't keyboard-accessible (T2 QA; T4a Q4a.9 deferred it to a separate fix plan).
- Cart drawer: no focus management or focus trap when it opens (T4a QA nit 3).
- Cart drawer: rapid close-then-reopen race leaves `data-state="open"` with `hidden` and a stuck scroll lock (T4a QA nit 2, pre-existing).
- Cart page shows no line prices or total; quantity input is `type="text"` with no `inputmode` (T4a QA nit 5).
- Product with a 422 add-to-cart shows no visible error (T4a QA nit 4).
- Image-banner preload `Link` header is dropped when `widths` and `sizes` are both set (T3 QA F1).
- Hello-world card links have `outline: none` on `:focus-visible` (T3 QA F2).

## Roadmap and backlog

- Homepage roadmap phases 2-4 (`docs/plans/theme-evolution-homepage-phases.md`), built Tailwind-native. That plan still prescribes `color_scheme` settings and `color-{{ setting }}` classes, which conflict with owner decision Q5; update it first (umbrella D14, review N8).
- `docs/backlog/color-palette.md`: adopt Shopify's `color_palette` setting.
- `docs/backlog/theme-check-cleanups.md` is stale (its UnusedAssign item was fixed in T2; theme check reports 0 offenses since T4a); delete or rewrite it.
- Orphaned files on live left by `--nodelete` (`assets/critical.css`, `assets/eco-tooltip.css`, `assets/section-image-banner.css`, `assets/loading-spinner.svg`, `snippets/progress-bar.liquid`, `snippets/loading-spinner.liquid`, `snippets/quantity-input.liquid`): harmless; remove through the admin code editor only if the owner wants a tidy theme.
- Supercycle app embed: owner decision deferred (2026-10-23); live shows no embed.
