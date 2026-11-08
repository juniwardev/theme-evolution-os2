# T6a coder questions and owner answers

The T6a Coder raised no questions (impl notes, commit 7f6745a). This file records the owner's answers to the plan's owner questions (§4.2).

## Q6a.1 owner answer (2026-11-07, after reviewing staging)

> **Owner answer, 2026-11-07 (verbatim, in chat):** "Desktop 4, Mobile 2"

- `columns_desktop` = `4`, `columns_mobile` = `2` for `/collections/all` on live.
- Differs from the plan's recommendation (desktop `3`, mobile `1`); the owner's choice stands.
- With today's 16 products: desktop (1024 px and wider) 4 × 4, full rows; phones (below 768 px) 2 × 8, full rows; tablets (768-1023 px) show 3 columns (D6a.3), so 3 × 5 plus one lone card. Pagination is by 20, so the row fill changes as the catalog changes (plan §4.2 Q6a.1).
- **How the value reaches live: option (a).** Owner, 2026-11-07, choosing between a repo template commit and the live editor: "I set them in live editor". The owner sets 4 and 2 in the live theme editor after T6a is live; no `templates/collection.json` edit in the repo.
- **Consequence (RA3):** live's `templates/collection.json` will then differ from the repo's. Before every later live push, pull that one file and commit it as pulled: `shopify theme pull --store=theme-evolution-os2.myshopify.com --live --only templates/collection.json` from the repo root. Never a full `shopify theme pull --live` (it would also pull `config/settings_data.json`), and never push the repo's `{}` over the owner's choice.
