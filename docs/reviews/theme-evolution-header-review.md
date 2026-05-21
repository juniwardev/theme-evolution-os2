# Plan review: theme-evolution-header (Revision 3)

Reviewer: Plan-Reviewer (adversarial third pass)
Date: 2026-05-20
Plan under review: `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/docs/plans/theme-evolution-header.md` (rev. 3)
Prior review: `/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/docs/reviews/theme-evolution-header-review.md` (rev. 2, verdict APPROVE — overwritten by this file)

## 1. Nit verification (Revision 3 changelog)

Cross-checked each applied nit against the plan text and underlying source files.

1. **Nit #1 — `role="status"` → `role="note"` — CORRECT.**
   - Section 4.2 (lines 119-121) correctly uses `role="note"`, drops `aria-label`, drops the `announcement_label` locale key, and includes a rationale paragraph explaining the live-region mismatch. It also notes that a future client-side dismiss/rotate ticket should re-evaluate.
   - Section 7 outline (line 359) renders `<div class="theme-evolution-announcement-bar" role="note">`. No `aria-label` or `aria-live`.
   - Section 8 storefront-locale block (lines 749-764) does NOT include `announcement_label` — consistent with the dropped key.
   - Section 10 step 3 item 3 (line 960) reiterates "note `role="note"` (NOT `role="status"` and NOT `role="region"`). No `aria-label`."
   - Appendix B (line 1147) restates "role='note' (NOT 'role=status', NOT 'role=region') — no aria-label needed".
   - WAI-ARIA semantics check: `role="note"` is the correct ancillary-content role for a marketing strip. It does not require an accessible name. The plan applies it consistently across all five touch points.

2. **Nit #2 — `requestAnimationFrame` wrapper around `firstFocusable.focus()` — CORRECT, with one caveat noted as a new nit below.**
   - Section 4.3 (line 168) explains the rationale ("older Safari… can no-op a synchronous focus on a just-unhidden element").
   - Section 7 outline (lines 700-705) correctly wraps the call:
     ```js
     var panel = this.panel;
     requestAnimationFrame(function () {
       var firstFocusable = panel.querySelector('a, button, [tabindex]');
       if (firstFocusable) firstFocusable.focus();
     });
     ```
     The `panel` variable is captured in the closure correctly; `this` is not used inside the rAF callback, avoiding the binding pitfall.
   - Step 6 item 7 (line 1031) and step 8 (line 1085) require the Coder to verify focus moves on open.
   - The timing question raised in the review prompt (fast Escape before next frame) is addressed in section 4 below.

3. **Nit #3 — `stopPropagation()` analytics flag documented — CORRECT.**
   - Section 7 outline includes an inline JS comment (lines 670-674) describing the consequence for a future header-wide tracker.
   - Step 8 item 3 (line 1087) requires a verbatim one-line note in impl-notes pointing future analytics PRs at the call site. Clear and actionable.

4. **Nit #4 — Future color-scheme migration cost added as risk #10 — CORRECT.**
   - Section 9 risk #10 (line 899) acknowledges the migration burden, lists three reconciliation paths (honor both APIs / auto-map / explicit migration ticket), and explicitly defers the decision. Honest framing.

5. **Nit #5 — `header` divider added before the two color settings, reusing `header__1.content` — CORRECT.**
   - Independently verified `locales/en.default.schema.json:980-982`: the key `sections.header.settings.header__1.content` exists and has value `"Color"`. The Dawn-era key is reused without modification.
   - Section 6 schema (lines 290-293) includes the divider:
     ```json
     { "type": "header", "content": "t:sections.header.settings.header__1.content" }
     ```
     positioned correctly between `menu` and `header_background`.
   - Section 8 locale block preserves `header__1` verbatim (line 809-811).
   - Step 2 item 2 (line 938) explicitly calls out the divider's content key.
   - Schema JSON is structurally valid (10 settings: `image_picker`, `range`, `link_list`, `header`, `color`, `color`, `header`, `checkbox`, `text` — a `settings` array of 10 mixed-type entries — valid per `schemas/section.json`).

6. **Nit #6 — Existing-store color flash documented in risk #1 — CORRECT.**
   - Section 9 risk #1 (lines 880-889) extends the original schema round-trip risk with the visual-change caveat, lists the rejected mitigation (runtime fallback) with rationale, and prescribes documentation in impl-notes plus DevOps surfacing.
   - Step 8 item 3 (line 1086) requires a verbatim block in impl-notes describing the color flash. The verbatim text is reasonable, accurate, and actionable.
   - Section 6 schema-notes bullet (line 333) cross-references risk #1.

7. **Nit #7 — `--header-border` derived from `currentColor` via `color-mix()` — CORRECT.**
   - Syntax check: `color-mix(in srgb, currentColor 8%, transparent)` is valid CSS Color Module Level 5 syntax. The function signature is `color-mix(<color-interpolation-method>, <color-and-optional-percentage>, <color-and-optional-percentage>)`. `in srgb` is the interpolation method; `currentColor 8%` and `transparent` are the two color stops. Correct.
   - Section 4.7 (lines 220-237) introduces the decision with rationale, lists browser-support floors (Safari 16.2+, Chrome 111+, Firefox 113+), and offers a fallback path.
   - Section 7 outline:
     - Line 472: `.theme-evolution-header-wrapper { --header-border: color-mix(in srgb, currentColor 8%, transparent); }`
     - Line 547: announcement bar uses `border-bottom: 1px solid var(--header-border);`
     - Line 599: mobile panel uses `border-top: 1px solid var(--header-border);`
     No hardcoded `rgba(255, 255, 255, 0.08)` remains.
   - Section 9 risk #11 (line 900) acknowledges the browser-support floor with a graceful-fallback discussion. The plan does NOT specify a static fallback `border-color` declaration as a hard requirement; it is left to Coder discretion ("If a stricter fallback is desired… The Coder documents the chosen approach in impl-notes"). See new issue #1 below — this discretionary fallback is a minor concern.
   - Step 6 item 6 (line 1025) reinforces "MUST use `var(--header-border)`, not a hardcoded `rgba(...)` value".
   - Appendix B (line 1148) restates the rule.

## 2. New issues

### 1. [NIT] `color-mix()` browser-support fallback is discretionary, not required

Section 9 risk #11 (line 900) and section 4.7 (lines 236-237) describe the `color-mix()` fallback path as optional ("If a stricter fallback is desired…"). The plan claims pre-2023 browsers will "fall back to the browser's default `border-color` (effectively `currentColor`)" — which is true: when `color-mix()` fails to parse, the CSS custom property `--header-border` becomes invalid, the `border-color` declaration that consumes it becomes invalid, and the browser falls back to the property's initial value. For `border-color`, the initial value is `currentColor`, so the border renders as solid `--header-text` color instead of an 8%-alpha shade. The border is heavier than intended but visible — graceful enough.

Shopify's documented browser-support baseline is "the last two versions of major browsers" — at time of writing (May 2026) this comfortably includes the `color-mix()` cutoffs (Safari 16.2+ = Dec 2022, Chrome 111+ = Mar 2023, Firefox 113+ = May 2023). All three are 2-3 years old. The risk is real only for users pinned to old browsers (corporate-managed, kiosk, etc.). Acceptable for a Shopify theme.

Not a blocker. A more defensive plan would mandate the fallback declaration rather than leave it to Coder discretion. If the Coder is conservative and adds the fallback, that is fine; if not, the worst case is a slightly heavier border on the long tail of old browsers. Recommend tightening the language in risk #11 ("Coder MUST add a `border-color: rgba(...)` fallback declaration immediately before the `border-color: var(--header-border)` declaration") only if the architect wants a hard guarantee. Otherwise this is acceptable as-is.

### 2. [NIT] `requestAnimationFrame` focus + fast Escape race — defensible but worth a one-line note

The review-prompt asked: if a user opens the menu and presses Escape within a single animation-frame window (~16ms), what happens? Trace:

1. User clicks toggle. `onToggleClick` → `setOpen(true)`. Panel is un-hidden, `aria-expanded="true"`, label updates, and an rAF callback is queued to focus the first link.
2. Within the same frame (before the rAF fires), the user presses Escape. `onKeydown` → `setOpen(false)`. Panel is hidden, `aria-expanded="false"`, `this.toggle.focus()` runs, label updates back.
3. The queued rAF callback fires on the next frame. It calls `panel.querySelector('a, button, [tabindex]')` on the now-hidden panel and calls `.focus()` on the first link inside the (hidden) panel.

A `.focus()` call on an element inside `[hidden]` is a no-op in modern browsers (the focusability check fails for elements in display-none subtrees). So the call is harmless — focus stays where `setOpen(false)` put it, on the toggle. The state machine self-corrects.

However, on older Safari (the exact browser the rAF wrapper was added to defend against), the focusability check is less strict. There is a theoretical window where the rAF callback could pull focus back into the hidden panel after Escape moved it to the toggle. Probability is low — the race window is one frame (~16ms), and Escape-immediately-after-open is uncommon — but the plan should acknowledge it.

Two acceptable defenses (recommendation, not requirement):
- Cancel the queued rAF in `setOpen(false)` by tracking the handle: `this.pendingFocusRaf = requestAnimationFrame(...)`; in `setOpen(false)`, `if (this.pendingFocusRaf) cancelAnimationFrame(this.pendingFocusRaf);`.
- Inside the rAF callback, re-check `this.toggle.getAttribute('aria-expanded') === 'true'` before calling `.focus()`. Single-line guard.

Not a blocker. The state machine self-corrects in modern browsers, and the rAF wrapper itself is a defensive measure against a less-common bug. Document the race in impl-notes if encountered; otherwise accept the minor risk. Could be added as a one-line note to section 9 risk list if the architect wants future-archaeology coverage.

### 3. [NIT] Section 10 step 6 item 6 references `var(--header-border)` but step 3 already adds the custom-property declaration — verify the Coder reads in order

The step-by-step has the `--header-border` declaration created in step 3 item 5 (line 965), then consumed by the announcement-bar `border-bottom` in step 3 item 5 (line 967), then consumed by the mobile-panel `border-top` in step 6 item 6 (line 1025). This ordering is correct — the property is defined before either consumer. However, if the Coder skips step 3 item 5 line 965 (the property declaration) and only completes the announcement-bar border in step 3 item 5 line 967, the bar's border will silently degrade to `currentColor` and the Coder might not notice until step 3 item 6 line 972 ("Change `header_background` to a light color … and confirm the announcement-bar separator is still visible"). The verification gate is in place, so this is self-correcting — but the two "add" instructions in step 3 item 5 are bundled into the same bullet, which is slightly easy to miss on a skim. Cosmetic; not blocking.

### 4. [NIT] No issues with the schema JSON validity after the new divider

Counted the schema settings array: 10 entries (`image_picker` logo, `range` logo_width, `link_list` menu, `header` "Color", `color` header_background, `color` header_text, `header` "Announcement bar", `checkbox` show_announcement, `text` announcement_text). Each entry has the required keys for its type. Two `header` dividers are interspersed without breaking the JSON shape — `schemas/section.json` allows `header` type entries in the `settings` array. Round-trip-safe. No JSON syntactical issues introduced by the divider addition.

## 3. Holistic readiness assessment

The plan is well-structured, internally consistent, and implementation-ready. All seven applied nits are correctly folded into the relevant sections, the cross-references between sections (4.x decisions → 7 outline → 10 checklist → Appendix B) are coherent, the schema JSON is valid, the locale block was independently verified against the source file, and the new `color-mix()` syntax is correct. The step-by-step checklist remains in logical order: locales first (step 1), schema (step 2), then markup/styling in dependency order (steps 3-7), with `shopify theme check` and visual verification at every gate. No contradictions between sections were introduced by the revision-3 changes. Three NIT-level concerns surfaced (a discretionary `color-mix()` fallback, a one-frame Escape race against the queued `requestAnimationFrame` focus, and a slightly bundled instruction in step 3 item 5), none of which rise to required-change or blocker territory. The plan is implementable as-is by a careful Coder; the impl-notes deliverables (color-flash documentation, analytics flag, `color-mix()` fallback decision, browser-test list) are all explicit. This is the third pass and the plan has matured; further revision is not warranted.

APPROVE
