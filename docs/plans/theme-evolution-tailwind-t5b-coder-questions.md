# T5b coder questions (Step 0 owner gate)

Plan: `docs/plans/theme-evolution-tailwind-t5b.md` (Revision 2.2.1). Written 2026-11-06 by the Coder at the end of Step 0. Impl notes: `docs/plans/theme-evolution-tailwind-t5b-impl-notes.md`.

## Q5b.1: Line height (owner gate; Step 2 waits for the written answer)

> **Owner answer, 2026-11-06 (verbatim, in chat):** "Go with the tailwind line height of 1.5"
> The owner saw the 10-pair sheet below. The words name the "Proposed: 1.5" panel, which maps to **option (a)**: Preflight's `1.5`, by deleting the D6 `html` rule. Step 2 and Step 4's line-height sentence may proceed.

**Owner sheet:** `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/docs/qa/screenshots/t5b-owner-q5b1/` (10 PNGs, gitignored). Each shows the same page, width and state twice: left **"Today: normal"**, right **"Proposed: 1.5"**, with a caption underneath.

| File | What to look at (the caption) |
|---|---|
| `pair-01-product-1440.png` | Product page, desktop: the material spotlight text and the product text above it. |
| `pair-02-product-375.png` | Product page, phone: button labels and the payment link; is any text cramped or cut off? |
| `pair-03-rental-picker-1440.png` | Rental product, desktop, date picker open: the calendar is the rental app's; the height of the rows and dates. |
| `pair-04-rental-picker-375.png` | Rental product, phone, date picker open: does the calendar still fit, with every date inside its cell? |
| `pair-05-drawer-375.png` | Cart drawer with one item, phone: item name, price and total. |
| `pair-06-collection-1440.png` | Collection page, desktop: product titles and prices under the images. |
| `pair-07-footer-1440.png` | Footer, desktop: footer text and links. |
| `pair-08-header-1440.png` | Header, desktop: menu links, cart count and the bar height. |
| `pair-09-header-375.png` | Header, phone: logo, menu button and cart count. |
| `pair-10-collection-375.png` | Collection page, phone: the page that grows most (about 215 px taller); product titles and prices. |

What is visible: with 1.5 the text rows are a little taller and everything below the first changed line moves down (about 30 to 110 px at desktop, 100 to 250 px on a phone for product and collection pages). Nothing is clipped or overflowing (see impl notes). The rental app's calendar rows also grow, because the app inherits the page's line height. In pair 03/04 the right panel shows a circled "24" that the left lacks; that is the calendar's own today/hover marking, not a line-height effect.

**Options, in words:**
- **"keep today"** = Q5b.1 (b): keep `normal` permanently (0 B, no visible change).
- **"proposed"** = Q5b.1 (a): Preflight's 1.5 (recommended by the Architect; -24 B).
- **"another value: ..."** = Q5b.1 (c): a number you name (for example 1.4); I will render it as a third panel "Your value" before Step 2.

**Please answer in words** ("keep today", "proposed" or "another value: ..."). A letter alone cannot be accepted (plan C5b.4(c)).

Note on the sheet (R14): the page with the largest line-height growth today is the privacy policy page (+2,672 px at 320, +2,242 at 375). With Q5b.3 (b) (already built, below) the policy body takes its line height from the typography plugin (28 px), so its growth under 1.5 falls to 32 px (measured on the new build). I therefore put the largest remaining page, the collection page on a phone, in pair 10 instead of the policy page. The header pairs (08, 09) show no clipping or bar-height change.

More detail: per-load tables in `docs/qa/evidence/t5bc-sets-table.txt` and `docs/qa/evidence/t5bc-sets/*.json`; full-page screenshots `docs/qa/screenshots/t5b-V0-*.png` (today), `t5b-V1-*.png` (1.5), `t5b-V2-*`, `t5b-V2a-*` (heading rule).

## Q5b.2: A heading base rule (needed before live; coding proceeds on the recommendation)

> **Owner answer, 2026-11-06 (verbatim, in chat):** "Go with your recommendation for the heading font. If there is a tailwind default, use that."
> This maps to **option (c), no heading base rule.** Tailwind's own default agrees: Preflight sets no heading `font-family`, so headings inherit the body font, and the theme opts into the heading font per element with `font-heading`. Gate 2 (the owner's own dated answer before live) is satisfied.

Recommended: **(c) no rule** (0 B, nothing changes). Step 1 is therefore "not applicable", no commit. Measured for reference: with the rule, the heading font would also apply to the policy title and its 13 `h2`s (merchant), the logo wrapper, the home cards, product cards, spotlight, tooltip and cart total titles (see `t5bc-sets` `A_hd`; V2 / V2a screenshots). Options in words: (c) no rule; (a) the rule plus `font-sans` on 9 lines (+80 B); (b) the rule with no opt-outs (+80 B); (d) also in rich text (not recommended). **The owner's own dated answer is required before live (gate 2).**

## Q5b.3: Policy pages (built on the recommendation; the owner reviews it on staging)

Done on the recommendation (b), `prose` through a `w-full` layout wrapper: commit `942a661`. Effect on `/policies/privacy-policy`: the title becomes `prose`'s h1 (36 px, 800 weight which renders as the 700 face, body font, not uppercase: the only page title not in the heading font), paragraphs and the 13 section headings get spacing, lists keep disc markers, links stay underlined. Text starts 20 px from the edge at 320 and 375; the pre-existing 5 px overflow at 320 is gone. Budget now 58,743 B.
- **(b+)** (title in the heading font via `prose-h1:` variants) costs 924 B (59,667 B total, still within budget) but conflicts with "use plain `prose` only" and, with T6a and T6b at their upper bounds, ends about 60,100, over the 60,000 B budget. Not recommended.
- **(a)** keep the old scoped rules: the policy body then stays unspaced, which the owner's spacing answer Q1 (a) relied on being fixed by (b); a follow-up of about 490 B would be needed.

## Stops and open points

- No gate stopped Step 0. Open: the owner's Q5b.1 answer (Step 2 and the line-height sentence of Step 4 wait) and Q5b.2's dated answer (before live).

## Q5b.3 owner answer (2026-11-06, on staging)

> **Owner answer, 2026-11-06 (verbatim, in chat):** "I don't want to use any custom css, go with tailwind defaults and the theme font settings."
> This accepts **(b) as built** (commit `942a661`, on staging since 2026-11-06 18:41 UTC): the policy body uses plain `prose` (Tailwind typography defaults) in the theme's body font, and the policy title stays `prose`'s default `h1` in the body font. No (b+) heading-font variants, no theme-editor Custom CSS, no follow-up. Owner check 2 for Q5b.3 is closed.
