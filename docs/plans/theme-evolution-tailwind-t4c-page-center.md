# Follow-up: center the page section's reading column (T4c owner check)

Slug: `theme-evolution-tailwind-t4c-page-center`
Parent: `docs/plans/theme-evolution-tailwind-t4c.md` (owner check 3, Q4c.1). Date: 2026-10-23.
Status: owner request, decided by the owner on 2026-10-23 ("Center the column"). Small enough that this file is the plan; no separate review.

## Why

At staging review the owner reported that `/pages/data-sharing-opt-out` reads as left-aligned. Measured on staging at 1440 (`[measured]`): the title and the `prose` column (646.88 px, `prose`'s 65ch measure) start at x = 52 and the right ~740 px of the page is empty. Live is also left-aligned (unstyled full-width text at x = 20), so this is a layout choice T4c made visible, not a regression.

Owner decision: center the title and the text column on the page; paragraphs stay left-aligned inside the column.

## Change

`sections/page.liquid` only. The shell keeps its padding and gap and gains `mx-auto w-full max-w-[calc(65ch+4rem)]`:

- The cap is 65ch plus the shell's 2rem side padding on each side, so the content column is exactly `prose`'s 65ch measure (both resolve `ch` against the same 16 px body font).
- `w-full` is required. The shell's parent lays it out as a flex item, and an auto-margined flex item shrinks to its content: a first attempt (`mx-auto box-content max-w-prose`, no `w-full`) made short pages narrow (457 px at 1440) and grew the opt-out page to the widget's 379 px on phones (`X_page` 139/84/69/29 at 320/375/390/430). Measured on the dev theme, 2026-10-23.

Below about 711 px (65ch + 64 px padding) the column is narrower than its maximum, so phones are unchanged.

Other sections that use the same shell (404, collection, collections, search, blog, article, password) are out of scope. The owner chose this for the default page template; the article page is the closest candidate for the same treatment later.

## Acceptance

1. `check:css`, `check:hidden` exit 0; theme check 0 offenses; CSS stays within 60,000 / 12,000 (expected growth under 100 bytes, for the one arbitrary `max-w-[…]` utility).
2. On `/pages/data-sharing-opt-out` and `/pages/the-balanced-face-test-page` at 1440 and 1920: the h1's left edge equals the `prose` box's left edge, and the column is centered in the main content area (left and right gaps equal within 1 px). The `prose` box is still 646.88 px wide (±1).
3. At 320, 375, 390 and 430: h1 and `prose` box geometry equal staging before this change; `X_page` = 0.
4. Paragraph `text-align` stays `start`; the opt-out widget still scrolls inside its box on phones.
5. No other page's geometry changes (spot-check `/collections/all`, `/search?q=snowboard`, `/blogs/news`, a 404 at 1440).
