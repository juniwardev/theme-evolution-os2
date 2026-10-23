# Outline: Tailwind phase T4c, rich text (`prose`) and the D6 list/link removals (not ready for `/implement`)

Slug: `theme-evolution-tailwind-t4c`
Status: **OUTLINE.** The full addendum is written after T4b is on staging, from T4b's measured tree, in the format of `docs/plans/theme-evolution-tailwind-t4b.md`, and goes through `/review-plan` on its own. Don't implement from this file.
Parent: `docs/plans/theme-evolution-tailwind.md` §11 (owner decision Q7). Split decision: `docs/plans/theme-evolution-tailwind-t4b.md` D4b.1. Budget gate and owner questions: T4b §15.3. Index: `docs/plans/theme-evolution-tailwind-t4.md`.
Architect: Claude (for Junior Warner). Date: 2026-10-23.

Tags follow T4b's referent table (§0). Lines are as of HEAD `de08107`; T4b moves some of them, and the full plan re-reads every citation.

---

## 1. Scope

| File | What it needs |
|---|---|
| `package.json`, `package-lock.json` | `@tailwindcss/typography` as an exact devDependency pin: 0.5.20, or a newer patch recorded as a deviation (umbrella D1 rule) |
| `src/tailwind.css` | `@plugin "@tailwindcss/typography";` after `@import "tailwindcss" source(none);`. A `@utility prose-tokens` mapping the plugin's `--tw-prose-*` colors to the surrounding text color (§3). Removal of the D6 **list** and **link** parity rules (planning-time lines 220-232, marked `/* T4c */` by T4b Step 14) |
| `sections/page.liquid`, `sections/article.liquid` (content and comment content), `sections/blog.liquid` (excerpt), `sections/main-material-archive.liquid` (description) | `prose prose-tokens` on the `[data-rich-text]` wrappers T4b adds (T4b D4b.12) |
| `sections/product.liquid` (description block, 47-57) | the description wrapper gets `prose prose-tokens max-w-none`. T2's `eco-tooltip-trigger` spans inside it must keep their color and underline (they are utilities on the span, so they should beat `prose`'s descendant rules; the full plan proves it) |
| Rich text that isn't `prose` | explicit link (and, if needed, list) utilities, so the D6 rules can go: footer `about_text` (`sections/footer.liquid:41`), image-banner heading and text blocks (`sections/image-banner.liquid:385, 402`, `inline_richtext`), the related-products heading (`sections/related-products.liquid:49`, `inline_richtext`), and the `default_errors` lists in `sections/article.liquid` and `sections/password.liquid` |
| Shopify-owned markup | `/policies/*` bodies (Shopify's own markup inside `layout/theme.liquid`), decided from T4b Step 0 item 7's snapshot (Q4c.3) |

Out of T4c: `html { line-height: normal }` (T5) and the cursor rule (permanent).

## 2. Inputs T4b provides (the full plan cites them)

- **Measured budget figures.** T4b's impl notes, section "For T4c and the owner" (T4b §13 Step 0 item 8):
  - `S_prose` on the T4a tree;
  - `S_o3`;
  - the per-variable cost of `prose-tokens`;
  - whether `.prose` compiles into `@layer utilities`.

  These come with T4b's final `S_tw`.
- **The parity sweep.** Every unclassed `a`, `ul`, `ol` and control, per page and container (T4b Step 0 item 7), and the policy-page container snapshot.
- **Escaping behavior** of `_html` and plain keys (T4b Step 0 item 5).

## 3. Proposed direction

- **Plain `prose` only.** No `prose-sm`, `prose-lg`, `prose-invert` or color modifiers, unless the owner signs off (T4b §15.3: size variants alone breach the minified budget).
- **Colors follow the text around them.** `@utility prose-tokens` sets the text-like variables to `currentColor`: body, headings, lead, links, bold, counters, quotes, captions, code. Hairlines and markers (bullets, hr, quote borders, th and td borders) get `color-mix(in oklab, currentColor N%, transparent)`. Rich text then follows the page palette, and the footer's own colors, with no hex (`CLAUDE.md` "Use the theme tokens"; T2 D2.5).
  - The plugin's docs describe custom color themes as a `@utility` that sets these variables `[quoted, exact v4 snippet to be read from the installed package]`.
  - The full plan lists the exact variable set from the installed version, and its Step 0 checks the computed `--tw-prose-body` on a `prose prose-tokens` element.
  - The code-block surface (`pre`) keeps the plugin's fixed dark neutral; it is a neutral detail.
- **Measure.** `prose`'s default `max-width: 65ch` stays on pages and articles. `max-w-none` (already compiled) goes on the product description and the archive description, whose columns are already narrow (Q4c.1).
- **The D6 removals come last**, after every rich-text sink carries `prose` or explicit utilities, and after T4b's sweep shows nothing else depends on them.

## 4. The gate (Step 0, before anything is committed)

1. On T4b's shipped tree, in a scratch copy: install the pinned plugin, apply §1's `src/tailwind.css` changes and one `prose prose-tokens` element, build, and measure `S_tw` minified **and** `gzip -9`.
2. Project the end of T4c: that build, plus T4c's estimated markup utilities, minus the list and link rules (`S_par`, 175 bytes minified).
3. **Two-budget rule** (T4b §15.3; owner question OQ1):
   - **Fits 60,000 minified and 12,000 gzip:** proceed. `CLAUDE.md` asks for sign-off only for a breach.
   - **Breaches either:** stop. Present the measured figures and T4b §15.3's options 1-5 to the owner. Option 4 (a project `@utility` instead of the plugin) reverses owner decision Q7: the squad presents it and never applies it.

T4b's estimate puts the end of T4c at about 56,700-58,700 minified and 10,900-11,450 gzip `[provisional]`. Only the measurement decides.

## 5. Step outline (provisional, one commit each)

0. Baseline and the gate (§4). The parity sweep again on T4b's tree.
1. The plugin pin, `@plugin`, `prose-tokens`, and `sections/page.liquid` (the plugin's first user, so it is never added unused).
2. `sections/article.liquid` (content and comment content).
3. `sections/blog.liquid` (excerpt).
4. `sections/main-material-archive.liquid` (description).
5. `sections/product.liquid` (description), with the tooltip-trigger check.
6. The non-`prose` sinks: footer `about_text`, image-banner, related-products heading, `default_errors`.
7. The policy-page decision (Q4c.3).
8. Remove the D6 list and link rules.
9. Rules text: the umbrella pointers (T4b §14.1 U-b3, U-b4 already name T4c).
10. Verify.

## 6. Open questions (provisional recommendations)

- **Q4c.1** Measure on pages and articles: keep `prose`'s 65ch, or `max-w-none`. **Provisional: keep 65ch** (readability). Product and archive descriptions use `max-w-none`.
- **Q4c.2 ⚑** The product description in `prose`. It changes PDP typography: 16 px / 1.75, paragraph margins, heading sizes. **Provisional: yes**, shown to the owner on staging.
- **Q4c.3** Policy pages. If Shopify wraps the body in Dawn's `.rte`, `base.css` styles it today and the D6 rules supply its markers and underline. Options:
  - (a) keep a parity rule scoped to the policy container in `@layer base`;
  - (b) accept the Δ.

  **Provisional: (a)**, handed to T5, which must map it before deleting `base.css`.
- **Q4c.4** Footer `about_text`: `prose` would enlarge it from 14 px. **Provisional: no `prose`**; add `[&_a]:underline`, plus list utilities only if the `richtext` setting can produce lists `[unverified]`.
- **Q4c.5** `prose-tokens` on `currentColor` vs fixed `--color-foreground` mixes. **Provisional: `currentColor`**, so it also works on the footer's own colors and on any future dark section.

## 7. T5 handoff (to grow in the full plan)

- the policy-page mapping (Q4c.3);
- any parity rule T4c keeps;
- T4b §14.4.
