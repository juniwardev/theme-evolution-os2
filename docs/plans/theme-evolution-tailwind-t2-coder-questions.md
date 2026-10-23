# T2 Coder question (non-blocking, work continued)

Slug: `theme-evolution-tailwind-t2`. Raised at Step 9.

After Step 9 `shopify theme check` reports 4 offenses, not the 1 the §13 preamble predicts:
`TranslationKeyExists` (cart-drawer, expected) plus three `OrphanedSnippet` warnings:
`snippets/loading-spinner.liquid`, `snippets/progress-bar.liquid`, `snippets/quantity-input.liquid`.

Cause: the plan (§2, §3.7) removes the only callers (unreachable `card-product` branches) and leaves the three
snippets orphaned for T4/T5 to decide. The plan did not predict that theme check flags orphans.

Options: (a) delete the three snippets now (reversible via git; pre-empts T4's decision whether the cart uses
`quantity-input`/`loading-spinner`); (b) leave them and accept 4 offenses until T4/T5 (the CLAUDE.md "one
offense" text would then be wrong for QA); (c) add a note to the QA bullet.

Coder choice: (b), nothing deleted, because the plan §2 explicitly says not to delete them. Steps 9 to 13 carry
the 3 extra warnings; recorded as a deviation in the impl notes. The owner or architect decides (a) vs (b); (a) is
a one-commit change.
