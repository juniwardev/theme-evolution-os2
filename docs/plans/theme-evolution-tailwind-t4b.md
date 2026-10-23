# Outline: Tailwind phase T4b, content pages (not ready for `/implement`)

Slug: `theme-evolution-tailwind-t4b`
Status: **OUTLINE.** The full addendum is written after T4a is on staging. It follows the format of `docs/plans/theme-evolution-tailwind-t4a.md` and goes through `/review-plan` on its own. Don't implement from this file.
Parent: `docs/plans/theme-evolution-tailwind.md` §11. Split decision: `docs/plans/theme-evolution-tailwind-t4a.md` D4a.1 (index: `docs/plans/theme-evolution-tailwind-t4.md`).
Architect: Claude (for Junior Warner). Date: 2026-10-22.

Tags are as in the T4a referent table. Everything below is `[measured]` from files read on 2026-10-22, or marked otherwise. The full plan re-reads every citation, because T4a and any roadmap work may move lines.

---

## 1. Scope

| File | Lines | What it needs |
|---|---|---|
| `sections/collection.liquid` | 47 | Grid and cards in utilities; delete the `{% stylesheet %}` (35-40); pagination |
| `sections/collections.liquid` | 87 | Map `grid_item_width` (`collections--compact`, `collections--full`) to complete class strings, never renaming the values. `grid_gap` (range 0-50, step 5) becomes an inline custom property, replacing the `section.id`-keyed `<style>` (10-14). Delete the `{% stylesheet %}` (41-58) |
| `sections/search.liquid` | 70 | Form, results grid, pagination; delete the `{% stylesheet %}` (53-63); escaping (§2) |
| new `snippets/pagination.liquid` | | Replaces `default_pagination` in collection, search, blog and article comments (Q4b.2) |
| `sections/page.liquid` | 17 | `prose` around `page.content` (10) |
| `sections/blog.liquid` | 35 | Cards, `prose` excerpt, preload only the first image |
| `sections/article.liquid` | 68 | Hero, `prose` content, comments, comment form |
| `sections/404.liquid` | 23 | Heading, text, link |
| `sections/password.liquid` | 35 | Form (this layout has no `base.css`) |
| `templates/gift_card.liquid` | 76 | Utilities; delete the template `{% style %}` (18-25) |
| `sections/main-material-archive.liquid` | 293 | Full conversion; R12 at 215 |
| `sections/material-recommendations.liquid` | 138 | Full conversion; it is in no template, so it is checked through a proxy |
| `src/tailwind.css` | | `@plugin "@tailwindcss/typography"` (pinned), `prose` colors mapped to tokens, and removal of the D6 list, link and input parity rules (222-236) |
| `package.json`, `package-lock.json` | | `@tailwindcss/typography`, exact pin (umbrella Q7) |
| Rich-text outputs outside these files | | Product description (`sections/product.liquid`, the description block; T2 §2 left it for T4's `prose`). An audit of `richtext` settings, e.g. footer's Dawn `.rte` (umbrella §4.4, `sections/footer.liquid`). The full plan decides each one and lists it in its file table |

Out of T4b: `templates/product.api.liquid` (JSON, no markup; T4a §3.5).

## 2. Facts already found (inputs for the full plan)

- **`/collections/all` overflows at 375.** The grid is `repeat(auto-fill, minmax(500px, 1fr))` (`collection.liquid:38`). Column 2 is 335 px wide from x = 20, so the right edge is 520: `X_page` 145 `[derived]`. That matches T2 QA C2.26's recorded 145 `[quoted]`.
- **`/search` overflows at 375.** T2 QA C2.26 recorded `X_page` 103 `[quoted]`. Suspect: `<input size="50">` (`search.liquid:13`) `[provisional]`. Step 0 measures `X_off`.
- **Search escaping.** `search.no_results_html` and `search.results_for_html` interpolate `search.terms` unescaped (`search.liquid:23, 25`). The full plan escapes the terms before interpolation (`assign escaped_terms = search.terms | escape`), as T2 did for the tooltip's `material_handle`. It also checks Shopify's documented behavior for variables in `_html` keys `[unverified]`. `result.title` (38) and `collection.title` (`collections.liquid:31`, `collection.liquid:8`) also print unescaped.
- **`blog.liquid:14` preloads every article image** (up to 5 per page). `CLAUDE.md` preloads only above-the-fold hero imagery, and Shopify caps preload Link headers at 10 (umbrella D12). Preload only `forloop.first`.
- **Archive.** It has:
  - a `{% style %}` (15-170) with `!important` throughout (47-88);
  - a per-iteration `<style>` inside the bar loop (234-238);
  - `height: 100%` on grid items (97), which T1 B1 and T2 §3.4 item 6 ban;
  - Dawn classes `page-width` (173), `center` and `h1` (174-175), `rte` (177), `placeholder-svg` (204);
  - the coincident utility `mb-12` (174);
  - literals "Sustainability" (222) and the meter `aria-label` (228);
  - an unescaped `material.name.value | capitalize` (210);
  - R12 at 215;
  - `columns_desktop` interpolated into CSS (42), which has to become a `case` map to `lg:grid-cols-1` … `lg:grid-cols-4`;
  - padding × 0.75 below 750 (17-18), which becomes two inline custom properties.

  Breakpoints: 750 → `md`, 990 → `lg` (umbrella D10).
- **Recommendations.** It has:
  - an invalid `group: hover;` (44);
  - a literal heading "More items engineered with …" (83) with a Dawn `h1` class on an `<h2>`;
  - an unescaped `other_product.title` (94);
  - a loop over `collections.all.products` (87), against the `CLAUDE.md` loop rule. It sees only the first 50 products. Rewriting it is a logic change (Q4b.4).

  No template renders it (T4a §3.5).
- **Gift card.** `main { text-align: center }` and `main img { display: unset }` (19-24) become utilities on `<main>` and the images. There may be no gift card fixture (umbrella §17.1), so the checks are static unless a URL is available.
- **Password.** `layout/password.liquid` loads no `base.css`. The form input relies on the D6 input-border parity rule today (umbrella C0.11), so the input gets explicit utilities before that rule is removed.
- **`default_pagination` emits spans and links that can't take classes.** Today only `search.liquid:58-62` styles them, through unlayered `.prev`/`.page`/`.next`. `base.css` defines none of those names `[measured]`. The locale keys `general.pagination.label/page/next/previous` exist (`locales/en.default.json:362-367`).

## 3. Proposed direction

- **Page shell.** Every content section uses T4a's page shell, `flex flex-col gap-8 px-8 py-10 md:py-16` (T4a D4a.10, Q4a.4), and the heading conventions of T2 D2.8 and T3 Q3.4. The full plan weighs a `@utility page-shell` in `src/tailwind.css` against repeating the string in about ten sections (T4a review N10). A shared utility also emits fewer bytes, which matters given the budget (§4).
- **Card grids** (collection, collections, search, blog, archive) use Tailwind grids with `minmax(0, 1fr)` tracks, so a long title wraps (T2 D2.4). Each grid gets `mb-0` (Dawn `.grid` margin). No `h-full` on grid items.
- **Images** go through `snippets/image.liquid` (converted in T4a) with explicit `width`. Callers size the parent, never `css_class` width (T4a §11 R5).
- **Pagination** is one snippet built from the `paginate` object (`parts`, `previous`, `next`), with the existing `general.pagination.*` keys and `aria-current="page"` (Q4b.2).

## 4. The `prose` gate (umbrella Q7, T4a Q4a.11)

**Already measured** (orchestrator, 2026-10-23, `[measured: orchestrator]`). This used a scratch copy of HEAD with T3 Steps 1-5 and `@tailwindcss/typography@0.5.20` (the latest, published 2026-06-08), added through `@plugin` after the `tailwindcss` import.

| Build | Minified | Gzip -9 |
|---|---|---|
| Baseline | 41,801 | 8,985 |
| One element with `prose` | 54,392 (+12,591) | 10,636 (+1,651) |
| `prose prose-sm md:prose-lg max-w-none` | 66,403 (+24,602) | 11,642 (+2,657) |

**Plain `prose` only.** No `prose-sm`, `prose-lg`, other size or color modifiers, or `prose-invert`, unless the owner signs off. Size variants alone push the minified file past 60,000 before T4a's and T4b's own utilities are counted.

**Step 0, before anything is committed.** Re-measure on T4b's real base, which includes T4a, because gzip isn't additive. In a scratch copy:

1. Install the pinned version (0.5.20, or a newer patch recorded as a deviation).
2. Add `@plugin "@tailwindcss/typography";` and one `class="prose"` element.
3. Build, and measure `S_prose` = `S_tw`(with) − `S_tw`(without), minified **and** `gzip -9`.
4. Confirm `.prose` compiles into `@layer utilities`, so `scripts/check-css-layers.mjs` passes and legacy `base.css` heading and list rules lose to it.
5. Project the end-of-T4b `S_tw` in both units: T4a's measured `S_tw` + `S_prose` + T4b's estimated own utilities.

**Decision rule** (T4a §5.8). It tests **both** budgets, 60,000 minified and 12,000 gzip; the worse of the two decides.

| Projected overshoot at the end of T4b | Action |
|---|---|
| none in either unit | ship plain `prose` as decided |
| at most about 5,000 minified **and** at most about 1,000 gzip `[proposed]` | ship plain `prose` and ask the owner to sign off the breach (D12) |
| more than that in either unit | try T4a §5.8 option 2 (plugin options), then option 3 (`@source not inline(…)` for incidental utilities), and re-project. Option 4, a project `@utility` instead of the plugin, **reverses owner decision Q7** and is presented to the owner, not applied |

With the measured cost, the theme's own T4a and T4b utilities fit within 60,000 only if they add at most 5,608 minified bytes, and within 12,000 only if they add at most 1,360 gzip bytes (on T3's final 8,989-byte gzip baseline; the table's 8,985 is the Steps 1-5 tree the build used). So **a minified breach is more likely than not**, and gzip is about even (T4a §5.8). The full plan keeps T4b's own utilities to the minimum.

**`prose` colors.** The plugin's defaults are fixed grays. Map `--tw-prose-body`, `--tw-prose-headings`, `--tw-prose-links`, `--tw-prose-bold`, `--tw-prose-bullets`, `--tw-prose-hr`, `--tw-prose-quotes` and `--tw-prose-counters` (the full plan lists the exact set from the installed version) to `var(--color-foreground)` and its `/N` mixes. Rich text then follows the palette (`CLAUDE.md` "Use the theme tokens"; T2 D2.5 transparent surfaces). The full plan tests this with T2 C2.27's palette run.

## 5. Removing the D6 parity rules

The list, link and input parity rules (`src/tailwind.css:220-237`) go in T4b's last code step, once every theme-rendered rich text sits in `prose` and every theme input carries utilities. The cursor rule stays (permanent). `html { line-height: normal }` stays for T5. Step 0 must establish:

1. A rendered sweep of every T4b page and every T4a/T3/T2 page, listing `a:not([class])`, `ul:not([class])`, `ol:not([class])` and unclassed `input`/`select`/`textarea` outside a `.prose` container. Each one gets a class, is accepted as an expected Δ, or keeps its rule.
2. **Policy pages.** `/policies/*` render Shopify's own markup inside `layout/theme.liquid` `[provisional: inspect one]`. If that markup is wrapped in Dawn's `.rte`, `base.css`'s `.rte` rules (legacy layer) style it today. The parity rules may not matter there, but **T5 must then map Shopify's policy `.rte` to `prose`-equivalent styles** before deleting `base.css`. That goes in the T5 handoff.
3. **App embeds and app blocks** (C0.13 review gate).

## 6. Step outline (provisional, one commit each)

0. Baseline, the `prose` gate (§4), the parity sweep (§5), and per-page `X_page`/`X_off`.
1. `snippets/pagination.liquid` together with its first caller (collection), so it is never orphaned (`OrphanedSnippet`).
2. collection.
3. collections.
4. search (escaping included).
5. typography plugin, token mapping, `page.liquid`.
6. article.
7. blog.
8. 404.
9. password.
10. gift card.
11. product description `prose`, plus the richtext-setting decisions.
12. main-material-archive (R12 line 215: `truncate: 160 | escape`).
13. material-recommendations.
14. R12 sweep of the three other sinks, as one revertible commit (T4a Q4a.10; a disclosed scope addition).
15. Remove the D6 list, link and input parity rules.
16. Rules text and umbrella pointers.
17. Verify.

**Possible T4c.** If T4b's review finds the plan too big, split Steps 12-14 (the materials archive, recommendations and R12) into `theme-evolution-tailwind-t4c`. They share no file with Steps 1-11.

**Theme-check prediction.** 0 after every step (T4a's baseline). Each step's risks: `OrphanedSnippet` (Step 1), `UnusedDocParam` and `UnrecognizedRenderSnippetArguments` (the pagination snippet's doc), `TranslationKeyExists` (the archive's new keys), `UnusedAssign` (the archive's `rating_val` loop).

## 7. Open questions for the full plan (provisional recommendations)

- **Q4b.1** `prose` budget path. §4's two-budget rule, plain `prose` only.
- **Q4b.2** Pagination: a snippet built from the `paginate` object, or styling `default_pagination` through a scoped `@layer components` rule. **Provisional: the snippet.** It gives complete class strings, translations and `aria-current`.
- **Q4b.3** The archive bars: render `snippets/sustainability-rating.liquid` (converted in T2), or convert the archive's own bars. **Provisional: reuse the snippet.** That makes one bar implementation and drops a duplicate `@keyframes`. Cost: the archive's bar size and timing match the PDP's.
- **Q4b.4** Recommendations loop over `collections.all.products`. **Provisional: keep the logic, convert the styling, and file a follow-up**, since it is unrendered today. Rewriting it is a logic change.
- **Q4b.5** `prose` colors mapped to tokens (§4). **Provisional: yes.**
- **Q4b.6** Split into T4c (§6). **Provisional: no, unless review asks.**

## 8. T5 handoff (to grow in the full plan)

- the policy-page `.rte` mapping (§5 item 2);
- any parity rule that §5's sweep keeps;
- T4a §14.4's items.
