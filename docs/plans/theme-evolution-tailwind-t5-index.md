# Index: Tailwind phase T5 (retire `base.css`), split into T5a and T5b

Slug family: `theme-evolution-tailwind-t5a` and `theme-evolution-tailwind-t5b`
Parent: `docs/plans/theme-evolution-tailwind.md` §12 (Phase T5), §17.4
Architect: Claude (for Junior Warner). Date: 2026-10-23; updated 2026-10-23 (T5a Revision 2.2.1, T5b Revision 2.1).

This file holds no implementation detail. It records the split, the order, the budget picture and the umbrella edits, and points to the two plans. Review and implement the sub-phase files, not this one.

| Sub-phase | Plan | State | Scope |
|---|---|---|---|
| **T5a, retire `base.css` at parity** | `docs/plans/theme-evolution-tailwind-t5a.md` | **Revision 2.2.1** (2026-10-23): round 3 of the review (R3-1 to R3-3, N3-1 to N3-3) applied to Revision 2.2, the Architect's rulings on the Coder's Step 0 gate stop (`docs/plans/theme-evolution-tailwind-t5a-coder-questions.md`, Q-C1 to Q-C5; no owner question added). Revision 2.1 addressed rounds 1 and 2 of `docs/reviews/theme-evolution-tailwind-t5a-review.md` (both APPROVE WITH CHANGES: B1, R1-R14 and N1-N9, then R2-1 to R2-3 and N2-1 to N2-5; closeout APPROVE). Step 0 + Steps 1-9; criteria C5a.0-C5a.26 (27) | Unlink and delete `assets/base.css` and the 63 unreferenced Dawn stylesheets; parity for what pages still rely on (a measured toggle diff decides); the layer statement `properties, theme, base, components, utilities` in five places; delete the `prose-tokens` leak lines, the Dawn card fallbacks, `check:hidden` and the coexistence rules text. **Gated:** Step 0 re-runs the preconditions, classifies every toggle-diff entry and builds the end state in scratch within both budgets (T5a §4.1) |
| **T5b, typography decisions** | `docs/plans/theme-evolution-tailwind-t5b.md` | **Revision 2.1** (2026-10-23), addressing rounds 1 and 2 of `docs/reviews/theme-evolution-tailwind-t5b-review.md` (both APPROVE WITH CHANGES: R1-R9 and N1-N10, then R10, R11 and n1-n5). Step 0 + Steps 1-5; criteria C5b.0-C5b.14 (15) | Line height (`normal` vs Preflight's `1.5`), a heading-font base rule (recommended: none), policy-page typography (recommended: `prose` through a `w-full` layout wrapper). **Owner-gated:** the line-height step waits for the owner's written choice on full-site screenshots, open states included (umbrella §12); the live push waits for the owner's own answer on the heading rule |

**Preconditions (umbrella §12), run by reading in T5a §3:** all three **pass**. (1) The only CSS assets referenced are `tailwind.css` (three files) and `base.css` (`layout/theme.liquid:29`). (2) All 40 Liquid files were converted in T0-T4b or carry no styled markup; the class tokens `base.css` can still style are three hooks with recorded dispositions. (3) Every class the six loaded scripts toggle has a disposition (replacement rule, script not instantiated, or code path unreachable). T5a Step 0 item 3 re-runs all three with ripgrep.

**Why split:**

- **Diff legibility.** T5a's correctness test is "nothing changes except the listed rows". Changing the root line height moves every text line on every page, which would swamp that comparison; umbrella D6 kept line height at parity in T0 for the same reason.
- **Different kinds of correctness.** T5a is a removal verified by measurement (a same-page toggle diff and a full-site cross-build comparison). T5b is three design choices the owner judges on screenshots.
- **Independent rollback.** Rejecting a T5b choice never means re-linking `base.css`; reverting T5a never loses an owner's typography decision.
- **Independent shipping.** T5a can go live while the owner reviews T5b's screenshots.

**Order and starting conditions.**

- T5a's Coder starts only after the T5a plan, its review and this index are committed (T5a §13 Step 0 item 1).
- T5a ships to staging #187953643616, then the owner's checks, then live after its read-only live probe (C5a.25).
- T5b's Step 0 starts after T5a is on staging and its owner check 3 is recorded (T5b §13 Step 0 item 1). T5b goes live only after T5a is live.

**CSS budget** (60,000 minified, 12,000 gzip `-9`; `CLAUDE.md:105`). The authoritative figures and gates are T5a §4.1, §5.10 and T5b §4.1, §5.5; this table only summarizes them.

| After | Minified | Gzip | Source |
|---|---|---|---|
| T4c + page-center (live and staging today) | 58,366 | 11,104 | `[quoted]` live deploy note `:13` |
| T5a (recommended options) | **58,850 to 58,932** | **11,264 to 11,344** | `[provisional]` T5a Revision 2.2.1 §5.10's projection from the measurement: Step 0 measured Revision 2.1's end state at **58,675 / 11,219**, plus D5a.20 (175 B) and D5a.21's conditional fallback (82 B). §5.10's estimate table, built from per-rule estimates, gives 58,837 to 59,179 / 11,219 to 11,494. Step 0 item 12 re-measures. (Revision 2's 58,662 to 58,922 / 11,174 to 11,369 is superseded) |
| T5b (recommended options) | 58,335 to 58,552 | 11,094 to 11,244 | `[provisional]` **basis: T5a's measured-anchor row above** + T5b Revision 2 §5.5's −515 to −380 / −170 to −100. On §5.10's table range instead: 58,322 to 58,799 / 11,049 to 11,394 |
| T5b (every option except (b+)) | 58,335 to 59,012 | 11,094 to 11,394 | `[provisional]` same basis + T5b's −515 to +80 / −170 to +50 (58,932 + 80 = 59,012). On §5.10's table range: 58,322 to 59,259 / 11,049 to 11,544. History: the T5b review's R7 put Revision 1's upper bound at 58,708, and T5a Revision 2's range gave 59,002 |
| T5b with (b+) (owner's choice only) | up to about 59,502 | measured | `[provisional]` T5b §5.5's at most +570 on the same basis (58,932 + 570); about 59,749 on §5.10's table high end. T5b §5.5 itself still quotes 59,492 on T5a Revision 2's high end |

Neither sub-phase is expected to come near a budget. Each still builds its end state in scratch and stops on a breach.

**Owner questions** (each with a recommendation in its plan; ⚑ = merchant-visible, reviewed on staging):

| Q | Plan | Recommendation | Needs the owner before coding? |
|---|---|---|---|
| ⚑ Q5a.1 focus rings | T5a §15.2 | browser default | no |
| ⚑ Q5a.2 announcement bar gap | T5a §15.2 | accept its removal | no |
| ⚑ Q5a.3 privacy-widget checkbox spacing | T5a §15.2 | keep (parity rule) | no |
| ⚑ Q5a.4 captcha page button | T5a §15.2 | accept | no |
| ⚑ Q5a.5 empty elements in merchant HTML | T5a §15.2 | keep them hidden with a rule scoped to `[data-rich-text]` | no |
| ⚑ Q5b.1 line height | T5b §15.2 | Preflight's `1.5` | **yes, before T5b Step 2** |
| ⚑ Q5b.2 heading base rule | T5b §15.2 | none (deviates from umbrella §12's planned rule; U-t5-5). The 11 headings without a font class are body font for parity since T2, not by design | **yes, before T5b's live push** (not before coding) |
| ⚑ Q5b.3 policy typography | T5b §15.2 | `prose` through a `w-full` layout wrapper (T4c's recommendation for T5); the title would then be the only page title in the body font. (b+) with `prose-h1:` variants is offered, not recommended | no |

**Umbrella edits** (`docs/plans/theme-evolution-tailwind.md`). **Applied 2026-10-23** by the Architect on the orchestrator's instruction after both plans were approved, as with U-b and U-c. Each old string matched exactly once before it was replaced, and none rewrites owner-decision text. U-t5-10's row was added before §19's "Abandoning Tailwind after T0" row.

| # | Where | Change | Why |
|---|---|---|---|
| U-t5-1 | §6, the T5 row's last cell ("**Yes** (Revision 2; review F11 and the reviewer's Q6 caveat), plus the strict precondition in §12") | append "; split into T5a and T5b (`docs/plans/theme-evolution-tailwind-t5-index.md`)" | the split |
| U-t5-2 | §12, first sentence ("`docs/plans/theme-evolution-tailwind-t5.md`, reviewed like T2 to T4; §6") | "`docs/plans/theme-evolution-tailwind-t5.md`" → "`docs/plans/theme-evolution-tailwind-t5a.md` and `-t5b.md`, index `-t5-index.md`" | the addendum's real paths |
| U-t5-3 | §12 Steps, "`snippets/css-variables.liquid` (25-66)" | "(25-66)" → "(31-72 at `0783033`)" | stale citation `[measured]` |
| U-t5-4 | §12 Steps, "delete the `shims` block;" | → "remove `shims` from the statement (T2 already deleted the block);" | `src/tailwind.css` has no `@layer shims` block `[measured]` |
| U-t5-5 | §12 Steps, the clause starting "add element-level typography (headings in `font-heading`) to `@layer base`" | append "(T5b recommends no base heading rule, D5b.2 and Q5b.2: every converted heading declares its font, and 11 heading lines are in the body font; the owner decides)" | records the deviation instead of silently dropping the step |
| U-t5-6 | §12 Steps, "with T5's full-site screenshot review deciding the final line-height" | append "(T5b Q5b.1, an owner gate)" | where the decision now sits |
| U-t5-7 | §17.4, "C1.5 (T1 to T4c), C0.17 (T1 to T4c)" and "T5: `B_rb` < `B_rb0`" and "no `<link>` to any CSS except `tailwind.css`" | → "C1.5 (T1 to T5a Step 6), C0.17 (T1 to T5a; T5b replaces it with C5b.4)"; "T5a: `B_rb` < `B_rb0` (15,910, `docs/plans/theme-evolution-tailwind-t0-impl-notes.md:37`)"; "no theme-asset stylesheet except `tailwind.css` (Shopify-injected stylesheets are listed, T5a C5a.4(d))" | the guards' real end points; the baseline figure; Shopify injects stylesheets the theme can't remove |
| U-t5-8 | D6 table, the `html { line-height: normal }` row, "Removed in" cell ("T5, when `base.css` goes …") | → "T5b (owner decision Q5b.1 on full-site screenshots; T5a keeps the rule)" | the phase that decides |
| U-t5-9 | D11 heading "(T0 to T4)"; §16 risk 2 and risk 16, Mitigation cells | "(T0 to T4)" → "(T0 to T5a)"; append "Ends with T5a." to both mitigations | the coexistence period ends with T5a |
| U-t5-10 | §19 Rollback table | add a row: "T5a \| revert Step 4 (the deletions) before Step 3 (the switch), or the layout links a deleted `base.css`; `docs/plans/theme-evolution-tailwind-t5a.md` §12" | the one ordering trap |

**Earlier umbrella edits:** U1-U5 (T4a), U-b1 to U-b5 (T4b) and U-c1 to U-c5 (T4c) are already in the umbrella (§6 rows, §11 notes, §12 Steps `[measured]`).
