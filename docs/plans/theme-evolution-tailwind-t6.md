# Index: Tailwind phase T6 (after T5), split into T6a and T6b

Slug family: `theme-evolution-tailwind-t6a`, `theme-evolution-tailwind-t6b`
Input: `docs/backlog/t6-batch.md` (added 2026-10-23 at the owner's request)
Parent: `docs/plans/theme-evolution-tailwind.md`. Format model: `docs/plans/theme-evolution-tailwind-t4.md` (index) and `-t4c.md` (Revision 2.1).
Architect: Claude (for Junior Warner). Date: 2026-10-23. Revision: 2.1 (updated with T6a and T6b Revision 2.1, closing both round-2 reviews; T5's split into T5a and T5b).

**Status: written before T5a landed; re-validate at Step 0.** Planned on HEAD `1f2a390` (T0-T4c live on #138872651872 since 2026-10-23). T5 is split: `docs/plans/theme-evolution-tailwind-t5-index.md`, `-t5a.md` (retire `base.css` at parity) and `-t5b.md` (typography; its line-height step is owner-gated). They were under revision while T6 was written; T6 reads them only for scope and budget and never edits them. Each sub-plan's Step 0 re-baselines on the tree it starts from and stops if an anchor moved.

This file holds no implementation detail. Review and implement the sub-phase files.

| Sub-phase | Plan | State | Scope |
|---|---|---|---|
| **T6a, collection grid columns** | `docs/plans/theme-evolution-tailwind-t6a.md` | **Revision 2.1**, closing round 2 of `docs/reviews/theme-evolution-tailwind-t6a-review.md` (APPROVE WITH CHANGES: R2-1 to R2-3, N2-1 to N2-5; the review says a closeout entry is enough); Revision 2 addressed round 1 (R1-R8, N1-N13). 3 steps after Step 0, criteria C6a.0-C6a.14 | Owner request: `columns_desktop` (Automatic, 2-5) and `columns_mobile` (1, 2) on `sections/collection.liquid`; the default keeps today's layout and grid `div` byte for byte, while card images change; three tablet columns for `3`-`5`; card images with per-card `widths` up to the output width, a `sizes` computed from the page-width settings, lazy after the first row; three optional params on `snippets/image.liquid`; five schema-locale keys. About +160 to +210 B CSS `[provisional]` |
| **T6b, QA follow-ups** | `docs/plans/theme-evolution-tailwind-t6b.md` | **Revision 2.1**, closing round 2 of `docs/reviews/theme-evolution-tailwind-t6b-review.md` (APPROVE WITH CHANGES: RR2-1, RR2-2, RN1-RN5; the review says no further round is needed); Revision 2 addressed round 1 (B1, R1-R8, N1-N12). 7 steps after Step 0 (Step 7 conditional), criteria C6b.0-C6b.21 | Cart drawer timer race and once-only listener (T4a nit 2); drawer focus in, trap, return (including after a failed add) and re-render (T4a nit 3); `/cart` line prices, total, numeric quantity with Checkout exempt from validation (T4a nit 5); visible 422 error (T4a nit 4); tooltip keyboard access, sticky only under `:focus-visible` (T2 QA nit 1, T4a Q4a.9); image-banner preload header (T3 QA F1); hello-world focus ring (T3 QA F2, likely fixed by T5a: verified and dropped at Step 0 if a focused-vs-resting difference is measured). 0 to +220 B CSS `[provisional]` |

---

## 1. Why split

- **Size.** One plan would carry about 35 criteria across five pages and two scripts. T4c, with 23, needed three review rounds; review cost grows with the criteria table, and a split lets each table be swept whole.
- **Different risk profiles.** T6a is a merchant-visible schema change with owner decisions (default, options, search), tested through theme-editor proxies. T6b is behavior and accessibility fixes with no schema change, tested with keyboard flows and response headers.
- **Independent shipping.** No file overlaps (T6a: `sections/collection.liquid`, `snippets/image.liquid`, `locales/en.default.schema.json`; T6b: `sections/cart-drawer.liquid`, `sections/cart.liquid`, `sections/product.liquid`, `assets/eco-tooltip.js`, `sections/image-banner.liquid`, `sections/hello-world.liquid`). Either can go to staging #187953643616 on its own.
- **Why the owner request stands alone.** It is the only item the owner asked for directly, and it blocks on owner answers (Q6a.1); the follow-ups shouldn't wait for them.

## 2. Harness naming

The brief named `docs/qa/harness/t6c-*.mjs`. With the split, the Coder prefixes follow T4's precedent (`t4ac-`, `t4bc-`, `t4cc-`): **`t6ac-*`** and **`t6bc-*`**. Each `-lib.mjs` imports only `t0-lib.mjs` and copies the helpers it needs from `t4cc-lib.mjs`; no `t6*` script imports another phase's library.

## 3. Order and starting conditions

- **Both wait for T5a on staging**: `docs/qa/theme-evolution-tailwind-t5a-deploy.md` naming #187953643616 and an ancestor SHA, and T5a's QA verdict `PASS` or `PASS WITH NITS`. Neither is started while T5a is being implemented, so T6 can't hinder T5: until then T6 has written only `docs/plans/theme-evolution-tailwind-t6*.md`.
- **T5b is not required.** It waits on the owner's line-height choice (T5 index, Q5b.1). T6a §3.3 and T6b §3.3 give the options: (a) wait for T5b, or (b) run between T5a and T5b with no T5b commit in HEAD and no T5b Coder active during the sub-phase (recommended). If T5b's commits are already in HEAD, Step 0 baselines on them; if T5b lands later, T5b's own Step 0 absorbs T6. T6 and T5b are never implemented at the same time: both rebuild `assets/tailwind.css`.
- **Recommended order: T6a, then T6b.** Either order works; the second re-baselines on the first's tree at its Step 0 (budget and anchors). They shouldn't be implemented at the same time: both rebuild `assets/tailwind.css`.
- Each Coder starts only after its plan, this index and the plan's review are committed.

## 4. Dependency on T5 (summary)

Full tables: T6a §3.2 and T6b §3.2.

| What T5a / T5b change | T6 items affected | How T6 handles it |
|---|---|---|
| **T5a** removes `assets/base.css` (Dawn focus rules, `.hidden !important`, `.grid` margin, `div:empty`, `visually-hidden`, form styles) and decides focus rings (Q5a.1: browser default recommended, or a theme ring) | T6b S7 and S5's focus ring; S2's panel ring; S4's hidden wrapper | T6b Step 0 records the Q5a.1 option that shipped and measures focus indicators as a focused-vs-resting **difference** (T6b Revision 2, B1): **S7 is verified and dropped** if a ring is already there; S5 adds ring utilities only if needed; the panel gets `focus-visible:outline-none` either way; S4 uses the `hidden` attribute, which Preflight hides independently |
| The CSS budget headroom: at `1f2a390` 58,366 / 11,104 `[quoted]`; **T5a Revision 2 §5.10** projects 58,662-58,922 / 11,174-11,369; T5b, every option but (b+), up to 59,002 / 11,419, and (b+) up to about 59,492 `[provisional]` (quoted from the T6a round-2 review, N2-1) | both | each Step 0 builds its end state in scratch and **stops for the owner on a breach** (binding gate). Worst projected end after T5a + T6a + T6b: **≤ 59,352 / 11,524**; with T5b (not (b+)) ≤ 59,432 / 11,574; with T5b (b+) about 59,922, leaving about 78 B (§5) |
| **T5b**: `html { line-height: normal }` vs `1.5`; **T5a**: the layer statement `properties, theme, base, components, utilities` | T6a heights, T6b layouts | criteria compare with Step 0's measurements, never with planning-time figures; T6a reads `W_c` from each run; neither sub-phase overlaps T5b's implementation |
| **T5a** deletes `check:hidden` (D5a.16) | both | the per-commit gate is `npm run check` as T5a leaves it |
| One fewer stylesheet in the `Link` header | T6b S6 | `L_n` re-measured |
| Anchors in shared files | both | each Step 0 re-reads every cited anchor by string and stops on a miss |

Nothing is asked of T5. If T5's plan turns out to touch a T6 file, T6's Step 0 absorbs it.

## 5. CSS budget

| After | Minified | Gzip | Source |
|---|---|---|---|
| T4c + page-center (`1f2a390`) | 58,366 | 11,104 | `[quoted]` orchestrator brief |
| T5a (Revision 2 §5.10) | 58,662 to 58,922 | 11,174 to 11,369 | `[provisional]` `docs/plans/theme-evolution-tailwind-t5a.md` §5.10 (via the T6 round-2 reviews); T5a deploy note; T6a/T6b Step 0 measure |
| T5b (if it ships before T6) | up to 59,002 (every option but (b+)); about 59,492 with (b+) | up to 11,419 | `[provisional]` T6a round-2 review N2-1 |
| T6a, order (b) (on T5a only) | + 160 to 210 (end **≤ 59,132**) | + 45 to 85 (end **≤ 11,454**) | `[provisional]` T6a §5.6 |
| T6a, order (a) (on T5b) | end ≤ 59,212, or about 59,702 with (b+) | end ≤ 11,504 | `[derived]` |
| T6b after T6a | + 0 to 220 (end **≤ 59,352** on T5a only; ≤ 59,432 on T5b; about 59,922 with (b+)) | + 0 to 70 (end ≤ 11,524 on T5a; ≤ 11,574 on T5b) | `[provisional]` T6b §5.8 |

T6b's round-2 review gave 59,282 / 11,499 for the worst case after T6; that used T6a Revision 1's +140 / +60. With T6a Revision 2's +210 / +85 it is 59,352 / 11,524 `[derived]`.

The `CLAUDE.md` rule applies: a breach needs the owner's sign-off. Each sub-plan's gate stops before any commit if its scratch end state doesn't fit both budgets. With T5b (b+) the margin is about 78 B, so a T6b ring-utility step could be the one that breaches; its gate catches that.

## 6. Out of scope: separate future plans (not planned here)

From the backlog's "Roadmap and backlog":

1. Homepage roadmap phases 2-4 (`docs/plans/theme-evolution-homepage-phases.md`), Tailwind-native; update that plan first for owner decision Q5 (no `color_scheme` / `color-{{ setting }}` classes; umbrella D14, review N8).
2. `color_palette` adoption (`docs/backlog/color-palette.md`).
3. Deleting the live orphans left by `--nodelete` (admin code editor; owner's choice).
4. The Supercycle app embed (owner decision deferred).
5. `docs/backlog/theme-check-cleanups.md` is stale; delete or rewrite it.

Found while planning T6 (each would be its own small plan or backlog line):

6. `sections/material-spotlight.liquid` `preload_icon` header not observable (T2 QA C2.16; possibly T6b S6's cause).
7. The header menu's Escape handler focuses its toggle on every Escape, menu open or not (`sections/header.liquid:163-167, 194-195`).
8. Tooltip hover persistence (WCAG 1.4.13 "hoverable") and the description loop replacing material names inside attribute values (`sections/product.liquid:49-55`).
9. A columns setting on `sections/search.liquid` (if the owner chooses Q6a.3 (b), it can be added to T6a instead).
10. A native `<dialog>` drawer (T4a review N10; T6b Q6b.2).
11. A token-relative error color for dark palettes (T4a QA nit 1; T6b Q6b.5).

## 7. Owner questions (roll-up)

T6a: **Q6a.1** ⚑ default stays Automatic (same layout; card images change); the value for live (recommended desktop 3, mobile 1 for 15 products; any two-column band keeps one empty slot) and how it reaches live (live editor plus a scoped pull, or a plan-authorized template commit); **Q6a.2** options 2-5; **Q6a.3** search setting (recommended no); **Q6a.4** collections list unchanged; **Q6a.5** ⚑ three tablet columns for `3`-`5` (recommended, removes the tablet empty slot); **Q6a.6** ⚑ 1600 px tops, lazy after the first row (recommended) vs all eager vs a 1080 top, judged on measured Retina bytes.

T6b: **Q6b.1** initial focus on the panel; **Q6b.2** no native `<dialog>`; **Q6b.3** ⚑ number field on `/cart`; **Q6b.4** ⚑ "Total" only, no taxes line; **Q6b.5** ⚑ red error above the button; **Q6b.6** extend `EcoTooltip` in place; **Q6b.7** five (or four) preload widths.

Each plan proceeds on its recommendation unless the owner answers otherwise; none blocks Step 1.

## 8. Handoffs

- **DevOps (after T6a is live, Q6a.1 option (a)):** once the owner saves a columns value on live in the theme editor, live's `templates/collection.json` differs from the repo's `"settings": {}`, and `.claude/agents/devops.md` deploy step 2 stops the next live push (it diffs live's `templates/` against the repo). Don't resolve it by pushing the repo's copy. From the repo root run `shopify theme pull --store=theme-evolution-os2.myshopify.com --live --only templates/collection.json`, commit that one file as pulled (keep Shopify's header), then continue. Never a full `shopify theme pull --live`: it would also bring in `config/settings_data.json` (T6a RA3). Under Q6a.1 option (b) the repo already holds the value and the step doesn't arise.
- **Staging:** both sub-phases push to the long-lived staging theme #187953643616 (`CLAUDE.md` DevOps; never publish it).
- **Live gate:** owner checks pass (T6a §10, T6b §10); the cart-drawer flows of T6b run once more on staging before the live push.
- **Live order with T5a (T6a review R2-1).** T6a and T6b start once T5a is **on staging**, but `shopify theme push -e production` uploads the whole tree, including T5a's `base.css` unlink. So **T6a and T6b go live only after T5a is live**: evidence is T5a's live deploy note, or a deploy note for the same push that records a valid T5a C5a.25 live-probe pass run immediately before it. Otherwise a T6 push would ship T5a past its own live gate (`devops.md` step 2 diffs only `templates/` and `sections/` JSON, so it wouldn't notice). **The reverse case:** under order (b), T5b's commits land on top of T6, so a later T5b live push carries T6; that is fine once T6's own live gate has passed, and T5b's deploy note records it.

## 9. Self-check

- Files written: this index, `-t6a.md`, `-t6b.md`; nothing else. Revision 1: no `-t5*` file existed. Revision 2: the T5 index, T5a and T5b were read for scope and budget only; none was edited.
- Revision 2.1 (closing both round-2 reviews): §4 and §5 budget figures from T5a Revision 2 (RR2-2, T6a N2-1); the live-order bullet in §8 (T6a R2-1); the sub-phase rows below name Revision 2.1. Swept for `58,429`, `58,628`, `59,178`, `11,459`, `58,958`, `11,389`: no survivor outside this line.
- Revision 2 sweep of this file: `t5-deploy.md`, `-t5.md` as a plan path, "T5 on staging", "+100", "1,634 / 896", "tablets show 2 columns", "Pull it and commit it". Survivors only in this line.
- Scope check against the brief: owner request → T6a; the seven QA follow-ups → T6b S1-S7; the four out-of-scope items → §6 items 1-4.
- Not checked: anything rendered or built; every figure tagged `[provisional]` waits for Step 0.
