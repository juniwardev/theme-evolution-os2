# Index: Tailwind phase T4 (commerce and content pages), split into T4a and T4b

Slug family: `theme-evolution-tailwind-t4a` and `theme-evolution-tailwind-t4b`
Parent: `docs/plans/theme-evolution-tailwind.md` §11
Architect: Claude (for Junior Warner). Date: 2026-10-22.

This file holds no implementation detail. It records the split and points to the two plans. Review and implement the sub-phase files, not this one.

| Sub-phase | Plan | State | Scope |
|---|---|---|---|
| **T4a, cart** | `docs/plans/theme-evolution-tailwind-t4a.md` | **Full addendum, Revision 2** (review round 1 addressed) | `sections/cart-drawer.liquid`, `sections/cart.liquid`, `snippets/cart-intelligence-banner.liquid`, `snippets/image.liquid` (and its 3 other callers' argument rename), new `snippets/spinner.liquid` (rendered by `sections/product.liquid`), two keys in `locales/en.default.json`, the `CLAUDE.md` QA bullet. Theme check 1 → 0 |
| **T4b, content** | `docs/plans/theme-evolution-tailwind-t4b.md` | **Outline only**; to be written in full after T4a is on staging | collection, collections, search, a pagination snippet, page, blog, article, 404, password, gift card, the materials archive and recommendations, `@tailwindcss/typography` (`prose`), the D6 parity-rule removals, R12 |

**Why split** (full reasoning in T4a D4a.1):

- **Size.** About 16 files and 1,500 lines, roughly twice T3, which needed three review rounds.
- **Risk profiles.** The cart is a JavaScript state machine with the Section Rendering API, on every page. The content pages are typography with a budget gate.
- **Independent shipping.** Each ships to staging #187953643616 on its own.
- **Order.** T4a first, because it is a dependency (shared snippets) and because it removes the last theme-check offense.

**Starting condition.** T4a's Coder starts only after T3 is on staging (T4a §13 Step 0 item 1). T4b's full plan is written after T4a is on staging, so it builds on measured T4a figures.

**CSS budget across both** (T4a §5.8). The figures are 60,000 bytes minified and 12,000 gzip. The 2026-10-23 measurements are the orchestrator's (`@tailwindcss/typography@0.5.20`); the T4a and T4b growth is estimated.

| After | Minified | Gzip |
|---|---|---|
| T3 (final commit, measured) | 41,801 | 8,989 |
| T4a (estimated) | 43,801-45,801 | 9,389-9,789 |
| T4b with plain `prose` (measured +12,591 / +1,651) | **59,392-64,392** | **11,640-12,540** |
| T4b with `prose prose-sm md:prose-lg` (measured +24,602 / +2,657) | 71,403-76,403 | 12,646-13,546 |

- **Both budgets are at risk.** **Minified is the likelier breach**, at up to about 4,400 over; gzip at up to about 540 over. With plain `prose`, the theme's own T4a and T4b utilities fit only within 5,608 minified and 1,360 gzip bytes.
- **Plain `prose` only.** Size variants alone breach the minified budget (66,403 measured). With T4a's and T4b's growth they breach both. So T4b uses no size modifiers unless the owner signs off.
- **The sign-off threshold is a proposal.** T4a Q4a.11 recommends shipping plain `prose` with owner sign-off when the overshoot is at most about 5,000 minified and 1,000 gzip. That threshold is `[proposed; not an owner decision]`, and any breach still needs the owner's sign-off. On current estimates the rule always selects that row.
- T4b re-measures on its own base and applies the two-budget rule in its §4. A breach needs owner sign-off. Replacing the plugin would reverse owner decision Q7, and only the owner can make that call.

**Umbrella edits:** T4a §14.1 U1-U5, **applied** 2026-10-23 with T4a Revision 2.
