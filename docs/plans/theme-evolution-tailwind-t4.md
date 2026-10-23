# Index: Tailwind phase T4 (commerce and content pages), split into T4a, T4b and T4c

Slug family: `theme-evolution-tailwind-t4a`, `theme-evolution-tailwind-t4b` and `theme-evolution-tailwind-t4c`
Parent: `docs/plans/theme-evolution-tailwind.md` §11
Architect: Claude (for Junior Warner). Date: 2026-10-22; updated 2026-10-23 (T4b Revision 2, review R6; T4c Revision 2.1, APPROVED).

This file holds no implementation detail. It records the splits and points to the three plans. Review and implement the sub-phase files, not this one.

| Sub-phase | Plan | State | Scope |
|---|---|---|---|
| **T4a, cart** | `docs/plans/theme-evolution-tailwind-t4a.md` | **Approved** (Revision 2.1). QA PASS WITH NITS (`docs/qa/theme-evolution-tailwind-t4a-report.md`). **On staging #187953643616** since 2026-10-23 09:50 UTC (deploy note `docs/qa/theme-evolution-tailwind-t4a-deploy.md`). Not yet live | `sections/cart-drawer.liquid`, `sections/cart.liquid`, `snippets/cart-intelligence-banner.liquid`, `snippets/image.liquid` (and its 3 other callers' argument rename), new `snippets/spinner.liquid` (rendered by `sections/product.liquid`), two keys in `locales/en.default.json`, the `CLAUDE.md` QA bullet. Theme check 1 → 0 |
| **T4b, content** | `docs/plans/theme-evolution-tailwind-t4b.md` | **Revision 2.1, APPROVED** (`docs/reviews/theme-evolution-tailwind-t4b-review.md`); QA PASS WITH NITS; on staging #187953643616 since 2026-10-23 12:03 UTC (`docs/qa/theme-evolution-tailwind-t4b-deploy.md`) | collection, collections, search, a pagination snippet, page, blog, article, 404, password, gift card, the materials archive and recommendations, R12, unused-utility exclusions, the D6 input-rule removal. No `prose`. Ships without owner sign-off: it can't breach the CSS budget (T4b §5.15) |
| **T4c, rich text** | `docs/plans/theme-evolution-tailwind-t4c.md` | **Full addendum, Revision 2.1** (2026-10-23), addressing review rounds 1 and 2 (both APPROVE WITH CHANGES, `docs/reviews/theme-evolution-tailwind-t4c-review.md`). 14 steps after Step 0, criteria C4c.0-C4c.22 | `@tailwindcss/typography` 0.5.20 (`prose prose-tokens`) on page, article, comment, blog-excerpt, archive and product-description rich text; link and list utilities for the footer, image-banner, related-products and form-error sinks; a scoped policy-page rule; the D6 list and link removals; T4b QA N1 (`/pages/data-sharing-opt-out` overflow). **Gated:** Step 0 builds the end state in scratch and proceeds only if it fits both budgets (estimate ≈ 57,200-57,600 / 11,000-11,250 `[provisional]`); otherwise it stops for the owner (T4c §4.1, T4b §15.3) |

**Why split** (full reasoning in T4a D4a.1 and T4b D4b.1):

- **T4a / rest of T4: size.** About 16 files and 1,500 lines, roughly twice T3, which needed three review rounds.
- **Risk profiles.**
  - The cart is a JavaScript state machine with the Section Rendering API, on every page.
  - The content pages are conversions at parity.
  - `prose` is the one budget-heavy and typography-heavy change.
- **Independent shipping.** Each ships to staging #187953643616 on its own.
- **Order.** T4a first (shared snippets; the last theme-check offense), then T4b, then T4c on T4b's measured tree.

**Starting conditions.**

- T4b's Coder starts only after T4a is on staging, which it now is, **and after T4b's plan, review and this index are committed** (T4b §13 Step 0 item 1).
- T4c's full plan is written after T4b is on staging.

**CSS budget** (60,000 bytes minified, 12,000 gzip `-9`; `CLAUDE.md` `### Performance & Core Web Vitals`). The authoritative figures and the decision rule are in **T4b §15.3** (owner questions) and **T4c §4** (the gate). This table only summarizes them.

| After | Minified | Gzip | Source |
|---|---|---|---|
| T3 (final commit) | 41,801 | 8,989 | measured (orchestrator) |
| T4a (final commit) | 44,667 | 9,437 | measured (T4a impl notes, QA C4a.13) |
| T4b (shipped) | 43,803 | 9,253 | measured, T4b impl notes |
| T4c with plain `prose` (projected, after T4b) | ≈ 56,700-58,700 | ≈ 10,900-11,450 | provisional, T4b §15.3; T4c Step 0 re-measures |
| T4c with `prose prose-sm md:prose-lg` instead | ≈ 68,700-71,400 | ≈ 11,900-12,600 | derived, T4b §15.3; not recommended |

- **Plain `prose` measured** +12,591 / +1,651 (orchestrator, `@tailwindcss/typography@0.5.20`, T3 tree). T4b Step 0 re-measures it on the T4a tree; T4c re-measures it on T4b's tree.
- **Plain `prose` only.** The size variants breach minified by themselves, so they need owner sign-off.
- **The sign-off threshold (at most about 5,000 minified and 1,000 gzip over) is `[proposed; not an owner decision]`.** Any breach of either budget needs the owner's sign-off.
- **Two options are the owner's call only:** replacing the plugin with a project `@utility`, and deferring T4c indefinitely. Both reverse or stretch owner decision Q7 (T4b §15.3, options 4 and 5).

**Umbrella edits:**

- T4a §14.1 U1-U5, **applied** 2026-10-23 with T4a Revision 2.
- T4b §14.1 U-b1 to U-b5: applied by the orchestrator in 22cc86e after T4b's approval.
