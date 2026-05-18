# Claude Squad — Feature Workflow Reference

Comprehensive reference for using the Claude Squad to design and ship net-new features. Companion to the bug-fix workflow (`docs/process/bug-fix-workflow.md`).

---

## How features differ from bug fixes

Three structural differences shape the workflow:

**Features start with intent; bugs start with observation.** For a feature you know what you want to build. The squad's job is to figure out the best way to build it safely. For a bug, you observe that something's wrong and work backwards. Features don't need an investigation phase.

**Features have wider scope.** A bug fix should touch the minimum surface needed. A feature is allowed to touch many files because that's its job — new sections, blocks, snippets, locale keys, schema entries, and JavaScript are all fair game. The risk to manage is over-engineering, not scope creep.

**Feature review asks "is this the right design?" Bug review asks "does this fix the root cause?"** The Plan-Reviewer's adversarial questions are different: for features, the reviewer looks for unnecessary complexity, missing merchant configurability, and schema decisions that will be hard to change. For bugs, the reviewer looks for symptom-fixes that leave the root cause intact.

---

## Prerequisites

Before running the feature workflow, your project must have:

1. **A `## Deploy targets` section in `CLAUDE.md`.** DevOps refuses to deploy without it.
2. **A `docs/dev-fixtures.md` file** with the storefront password and test product URLs. QA reads this for browser-based verification.
3. **The five squad agents tuned for this project.** Architect, Plan-Reviewer, Coder, QA, and DevOps.

---

## The three workflow tiers

Pick the tier based on feature complexity, not optimism.

### Tier 1 — Trivial feature

A configuration change, copy edit, or single-setting addition with no new Liquid logic.

**Examples:** adding a new color option to an existing section's schema, updating footer copy, adding a missing locale key.

**Workflow:**

```
1. /implement <describe the change> — Coder applies directly, no plan needed.
2. /qa <slug>
3. touch docs/qa/<slug>.approved
4. /ship <slug>
```

Total time: 15–30 minutes.

### Tier 2 — Standard feature

New section, block, or snippet. Touches multiple files. Requires schema decisions, locale keys, and QA across at least two viewports.

**Examples:** a new product callout section, a FAQ accordion block, a sticky header enhancement.

**Workflow:**

```
1. Write a brief intent description (one paragraph is enough — no formal doc needed).
2. /plan <slug>
3. /review-plan docs/plans/<slug>.md
4. (Iterate plan if APPROVE WITH CHANGES or REJECT)
5. /implement docs/plans/<slug>.md
6. /qa <slug>
7. (If QA fails, back to /implement with the report as input)
8. touch docs/qa/<slug>.approved
9. /ship <slug>
```

The most common tier. Identical pipeline to Tier 2 bug fixes but with wider permitted scope.

### Tier 3 — Complex feature

Cross-cutting concern, new JavaScript Web Component, Section Rendering API integration, or anything requiring architectural decisions that will be hard to undo.

**Examples:** Ajax cart drawer, variant image swapping, custom storefront filter UI, a full product comparison table.

**Workflow:**

```
1. Write intent description — include the user story, merchant configurability requirements,
   and any constraints (performance budget, accessibility, localization).
2. /plan <slug> — Architect reads the intent doc and writes a detailed plan including
   component architecture, JS namespace, schema structure, and performance approach.
3. /review-plan docs/plans/<slug>.md
4. (Iterate — Tier 3 plans often need 2–3 review passes)
5. /implement docs/plans/<slug>.md
6. /qa <slug> with explicit regression coverage of existing features
7. touch docs/qa/<slug>.approved
8. /ship <slug>
```

For Tier 3 features the adversarial plan review is especially valuable. The "obvious design" for a complex JS feature is often the one that collides with Dawn's existing components or creates namespace conflicts. The reviewer should demand explicit answers on those points before approving.

---

## File layout convention

```
docs/
├── plans/
│   ├── <slug>.md                    ← plan (Architect writes)
│   └── <slug>-impl-notes.md         ← implementation notes (Coder writes)
├── reviews/
│   └── <slug>-review.md             ← review (Plan-Reviewer writes)
├── qa/
│   ├── <slug>-report.md             ← QA report
│   ├── <slug>.approved              ← operator sign-off
│   └── <slug>-deploy.md             ← deploy note (DevOps writes)
```

Feature slugs use plain kebab-case (e.g., `material-spotlight`, `ajax-cart-drawer`). Bug fix slugs use the `fix-` prefix. This distinction makes `git log` self-documenting: `git log --grep "^feat("` shows features; `git log --grep "^fix("` shows bug fixes.

---

## Agent behaviors during feature workflow

### Architect — when planning features

- Reads `CLAUDE.md` in full before writing. The architectural directives (block-first design, no `{% include %}`, Web Components for JS, namespace rules) are non-negotiable constraints on every plan.
- For sections and blocks, always includes a complete `{% schema %}` proposal — merchants can't configure what isn't in the schema.
- Specifies locale keys needed and their paths in `locales/en.default.json`.
- Identifies performance implications (LCP for hero images, CLS for any layout-shifting element, asset placement rules).
- Flags any decision that would be hard to reverse (schema field IDs, template structure) as an explicit open question if uncertain.
- Does NOT write application code — only the plan.

### Plan-Reviewer — when reviewing feature plans

- Asks: does the schema expose everything a merchant would reasonably want to configure?
- Asks: does the JS namespace follow the project convention (`Prefix + ComponentName` — never a generic name)?
- Asks: does the component work in the theme editor preview, not just the storefront?
- Watches for `{% include %}` (forbidden), global CSS injected from sections, inline `style=""` attributes.
- Demands that any Tier 3 JS feature explicitly addresses how it coexists with existing Dawn components.
- Checks that locale keys are added only to `locales/en.default.json` (not other locale files — translators handle those).

### Coder — when implementing features

- Applies only the changes specified in the plan. No drive-by cleanups in unrelated files.
- Runs `shopify theme check` after each meaningful edit. Two pre-existing offenses are expected (see `CLAUDE.md`); any new offense is a blocker.
- Commit message format: `feat(<area>): <description>` (e.g., `feat(product): add material spotlight section`).
- Writes implementation notes to `docs/plans/<slug>-impl-notes.md` including any deviations from the plan and how to verify the feature works.
- Stops and writes a `docs/plans/<slug>-coder-questions.md` file if the plan is ambiguous — does not improvise.

### QA — when verifying features

- Reads the plan to understand what was built, then verifies against it from the storefront's perspective.
- Always tests at both desktop (1440×900) and mobile (375×667) viewports.
- Checks the theme editor preview — the feature must be configurable there, not just visible on the storefront.
- Runs regression coverage on any existing feature that shares code with the new feature.
- Uses the preview URL from `shopify theme dev`, not `http://127.0.0.1:9292`.
- Final verdict: `PASS`, `FAIL`, or `PASS WITH NITS`. Nits are advisory only.

### DevOps — same for features and bug fixes

Reads `docs/qa/<slug>.approved` to confirm operator sign-off. Captures pre-deploy snapshot. Pushes via `shopify theme push --theme=<id> --nodelete --allow-live`. Verifies storefront smoke test. Writes deploy note. Rolls back on failure.

---

## Walkthrough: a hypothetical Tier 2 feature

Suppose you want to add a "Recently Viewed Products" section to the product page.

**Step 1 — Describe the intent (informal, no file needed for Tier 2):**

> Add a "Recently viewed" horizontal scroll section to the product page that shows up to 6 previously visited products. Merchant-configurable: title text, max items (2–6), show/hide. Uses localStorage. Should not render if fewer than 2 products are in history.

**Step 2 — Plan:**

```
/plan recently-viewed-products
```

Architect writes `docs/plans/recently-viewed-products.md` covering: block-first or section design decision, LocalStorage key schema, Web Component namespace (`RecentlyViewedProducts`), `{% schema %}` settings, locale keys, and performance note (lazy-load images, no LCP impact).

**Step 3 — Review:**

```
/review-plan docs/plans/recently-viewed-products.md
```

Plan-Reviewer checks: namespace collision risk with Dawn's existing components? Does the section render gracefully in theme editor where `localStorage` isn't available? Are the schema settings sufficient for merchant needs?

**Step 4 — Implement:**

```
/implement docs/plans/recently-viewed-products.md
```

Coder writes the section file (Liquid + `{% schema %}` + `{% javascript %}` + `{% stylesheet %}`), adds locale keys to `locales/en.default.json`, runs `shopify theme check`, commits as `feat(product): add recently-viewed-products section`.

**Step 5 — QA:**

```
/qa recently-viewed-products
```

QA visits 3+ product pages to populate history, then verifies the section renders on a fourth. Tests at mobile and desktop. Checks theme editor. Verifies it doesn't render with <2 products in history. Checks no console errors, no CLS.

**Step 6 — Approve and ship:**

```bash
touch docs/qa/recently-viewed-products.approved
```

```
/ship recently-viewed-products
```

---

## Quick reference cheat sheet

| Feature Type | Tier | Process |
|---|---|---|
| Config change, copy edit | 1 | /implement → /qa → /ship |
| New section, block, snippet | 2 | /plan → /review-plan → /implement → /qa → /ship |
| JS Web Component, API integration | 3 | Intent doc → /plan → /review-plan (iterate) → /implement → /qa → /ship |

**Slash commands:**

- `/plan <slug>` — write the plan. Invokes Architect.
- `/review-plan docs/plans/<slug>.md` — adversarial review. Invokes Plan-Reviewer.
- `/implement docs/plans/<slug>.md` — apply the plan. Invokes Coder.
- `/qa <slug>` — browser-based verification. Invokes QA.
- `/ship <slug>` — deploy with snapshot rollback. Invokes DevOps.

**Two manual operator actions:**

- `touch docs/qa/<slug>.approved` — operator sign-off gate between QA and DevOps.
- `git push` — share artifacts to remote after ship completes.

---

## Common feature mistakes to avoid

**Schema field IDs are permanent.** Once a merchant saves settings against a schema field ID, changing the ID orphans their data. The Plan-Reviewer should flag any schema that looks like it might need renaming. Get the IDs right in the plan.

**`{% include %}` is forbidden.** Always `{% render %}`. The Coder will be blocked by `shopify theme check` if this slips through, but the plan should catch it first.

**JS in `{% javascript %}` tags cannot use Liquid.** If you need a Liquid variable in JavaScript, emit it as a data attribute in the HTML and read it from the DOM. The plan should specify this pattern explicitly for any JS that needs Liquid values.

**The theme editor and the storefront are different contexts.** A section that uses `localStorage`, `fetch`, or `IntersectionObserver` must handle gracefully the case where those APIs behave differently or aren't available in the editor iframe. Plan-Reviewer should always ask about editor behavior for JS-heavy features.

**Block-first, not section-first.** Sections are containers. The merchant-composable content units should be blocks. If the plan puts merchant-editable content directly in the section rather than in blocks, the Plan-Reviewer should flag it.
