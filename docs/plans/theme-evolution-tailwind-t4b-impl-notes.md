# Impl notes: Tailwind phase T4b (content pages)

Plan: `docs/plans/theme-evolution-tailwind-t4b.md` (Rev 2.1, review APPROVE). Base: `main` at `22cc86e`; work committed directly on `main`. Nothing pushed to git, live #138872651872 or staging #187953643616. Dev server only on the private dev theme #187953938528; it was last started from the repo root, so the dev theme matches HEAD (`--color-foreground` read back `#333333`). No server is running.

## Commits

| Step | Commit | Files |
|---|---|---|
| 0 | none (baseline) | evidence under `docs/qa/evidence/t4bc-*`, committed with these notes |
| 1 | `03819e8` | `src/tailwind.css`, `assets/tailwind.css` |
| 2 | `8b3428f` | `src/tailwind.css` (grid-fill), `snippets/pagination.liquid`, `sections/collection.liquid` |
| 3 | `bd87bed` | `sections/collections.liquid` |
| 4 | `617ef8d` | `sections/search.liquid` |
| 5 | `86fa4b0` | `sections/page.liquid` |
| 6 | `a716373` | `sections/blog.liquid` |
| 7 | `d0b24d9` | `sections/article.liquid` |
| 8 | `348224a` | `sections/404.liquid` |
| 9 | `caa2759` | `sections/password.liquid` |
| 10 | `76208e5` | `templates/gift_card.liquid` |
| 11 | `c56eabf` | `sections/main-material-archive.liquid` |
| 12 | `66cca38` | `sections/material-recommendations.liquid`, `locales/en.default.json` |
| 13 | `ecd7034` | `snippets/material-info.liquid`, `sections/material-tooltip.liquid`, `assets/material-api-fetch.js` |
| 14 | `9a82c96` | `src/tailwind.css` (input rule removed, `T4` -> `T4c`) |
| 15 | `212331c` | `CLAUDE.md`, `AGENTS.md` |
| 16 | this commit | notes, `docs/qa/harness/t4bc-*`, `docs/qa/evidence/t4bc-*` |

Every step commit has `assets/tailwind.css` freshly built, `check:css` 0, `check:hidden` 0, `shopify theme check` 0 offenses ("N files inspected": N grows 72 -> 89 only because untracked evidence JSON files are inspected). All ten schema shasums equal Step 0 (`t4bc-step0-schema-shas.txt`; C4b.2 PASS).

## CSS sizes (`wc -c` / `gzip -9 -c < file`, per step)

| After | Minified / gzip (project method: `gzip -9 -c assets/tailwind.css`) | Growth |
|---|---|---|
| Step 0 (T4a) | 44,667 / 9,437 | |
| 1 | 42,860 / 9,137 | -1,807 / -300 |
| 2 | 42,998 / 9,174 | +138 / +37 |
| 3 | 43,038 / 9,189 | +40 / +15 |
| 4 | 43,085 / 9,204 | +47 / +15 |
| 5, 6 | 43,085 / 9,204 | 0 |
| 7 | 43,132 / 9,213 | +47 / +9 |
| 8, 9, 10 | 43,132 / 9,213 | 0 |
| 11 | 43,851 / 9,275 | +719 / +62 |
| 12 | 43,898 / 9,284 | +47 / +9 |
| 13 | 43,898 / 9,284 | 0 |
| 14 | 43,803 / 9,253 | -95 / -31 |
| Final | **43,803 / 9,253** | **-864 / -184 vs Step 0** |

Budget 60,000 / 12,000: 16,197 / 2,747 under. Net growth is negative, inside C4b.23's +1,500 / +350 cap. Step 11 (+719) is in the plan's 350-650 estimate band +69 (slightly above: `max-w-[37.5rem]`, `mb-16`, `md:grid-cols-2`, hover shadow, `border-black/8`, `leading-[1.6]`, `text-[#444]`, `mt-auto`, `hover:-translate-y-1.25`); not material. Step 1's saving (-1,807 / -300) beat the plan's provisional -700..-1,300 / -150..-300.

## Step 0 measurements

- Precondition held (T4a deploy note, tree clean, plan files committed). `N_tc` 0; `S_tw` 44,667 / 9,437.
- **Fixtures** (`t4bc-fixtures.json`): pages `/pages/contact` (blank content), `/pages/data-sharing-opt-out`, `/pages/the-balanced-face-test-page`, `/pages/the-material-archive`; blog `/blogs/news` with **no articles** (no article sitemap); 3 collections, 11 product URLs (gift-card included); **no policy pages** (`/policies/refund-policy` 404); `/account/login` redirects to Shopify's hosted login. So no fixture paginates, none for article/comments/blog preload: C4b.12 and the article parts of C4b.9 are "no fixture" (plan RB2).
- **Base overflow** (`t4bc-facts-base.json`): `/collections/all` 200/145/130/90 at 320/375/390/430; `/search?q=snowboard` 158/103/88/48; others 0. Search offender is one element (the `size=50` input). Base `<h1>` on every Skeleton page: Work Sans 16px 400 x=20 (Dawn heading rules invalid, E4b.2 confirmed). `N_pre` 9 on every page (12 on the 3p product). `N_dawn` 2; bundle `compiled_assets/styles.css` 2,147 bytes with all six stale selectors.
- **Escape probe (PX8, `t4bc-escape.mjs probe`)**: `_html` keys print a variable **raw** (`<i>` element present), plain keys **escape** it, the `blog.article_metadata_html` author prints raw. So: pre-escape for `_html` keys (search terms, blog/article author), not for plain keys (recommendations heading). Used as planned. Observation: **on base, `search.terms` already printed safely** in the `_html` search keys (the base search page showed `&lt;i&gt;` for the C4b.10 terms). The head's `escaped_terms` renders the same literal text, no double escape (C4b.10 PASS), so the plan's R12-style fix is a harmless belt and braces for that variable.
- **Parity sweep** (`t4bc-sweep-base.json`): the only unclassed theme control is the search input (gets a border in Step 4). No unclassed control sits in rich text or app blocks. Unclassed theme `a`/`ul`: footer "Powered by Shopify" and copyright links, product-card/search title links (now classed), and the archive description (no lists or links; contains a stray `<meta charset>` inside the `<p>`). The privacy-policy markup uses `div.rte > div > ul` (for T4c).
- **Scratch budget** (`/budget` scratch, gzip via stdin so numbers are 13 B lower than the project method): base 44,667 / 9,424; (a) exclusions 42,860 / 9,124, **`S_o3` = -1,807 / -300**; (b) plain `prose` 57,258 / 11,069, **`S_prose` = +12,591 minified / +1,645 gzip** on the T4a tree; (c) a+b 55,451 / 10,752 (prose adds +12,591 / +1,628 on top of the exclusions); (d) c + a `prose-tokens` utility with two variables 55,527 / 10,771 (**+76 / +19** per two-variable mapping). `.prose` compiles in `@layer utilities` (the layer statement of the output lists only the known layers). Plugin `@tailwindcss/typography@0.5.20`.
  - **For T4c and the owner:** on the shipped T4b tree plain `prose` projects to about 43,803 + 12,591 = **56,394 minified** (3,606 spare) and 9,253 + ~1,630 = **~10,880 gzip** (~1,120 spare), before T4c's own utilities (+225..+725 / +40..+175 per the plan). Fits both budgets on these figures; `prose-sm md:prose-lg` variants would not (+12 KB).
  - **Exclusion saving for T4c: -1,807 / -300** (already in the T4b figures above).
- **Item 11 archive facts** (`t4bc-archive-base.json`): 6 materials, ratings 3,2,3,5,4,4, all with stories; `page.content` is non-blank but has no lists or links; card bottoms at 1440: 737.6 (row 1), 1237.1 (row 2); hover `matrix(1,0,0,1,0,-5)` and shadow `0 10px 30px` at 5%; grid x 100-1340 at 1440, 44-331 at 375.
- **Item 14**: `btn-secondary` "Search" is 107.2 x 48 px, so the search row wraps while `192 + 12 + 107.2 = 311.2 > W_c` (w < ~415; at 375 and 390 the button sits on its own row, at 430 it doesn't).
- **Item 15**: `.contents,.filter,.transform,.truncate,.capitalize` match 0 elements on every swept page (all five exclusions kept).
- **Items 6, 12, 13**: PX1 base dumps (`t4bc-pagination-base.json`; unpaginated blog: no fixture), PX7 base (`t4bc-px7-base.txt`), 26 base screenshots (gitignored). PX3-PX5, PX6 and PX9 were **not rendered on base**: their criteria compare head to formula values in the plan (and base is expected red for PX6), so a base render adds nothing; deviation 5.
- **Item 16 live probe (C4b.29), run at Step 0, read-only**: fresh non-preview login, `Shopify.theme.id === 138872651872` and `role === 'main'` on `/`, wax, snow and 3p. **No Supercycle embed exists on live**: no `shopify-block-`/app-embed elements, no `supercycle` in the HTML or scripts, no third-party scripts, no shadow hosts (consistent with the 2026-10-22 incident). Evidence: theme id 138872651872 above, wax page controls are only the theme's own `select` and `quantity` (both 1px with their own classes). Control-only run (`t4bc-liveprobe.mjs probe []`): exactly one rule matched by selector and declaration (`input:where(:not([type="checkbox"], [type="radio"], [type="hidden"])), select, textarea { border-width: 1px; }`, in `@layer base`), positive control 1px -> 0px, **OUTCOME VALID-PASS (no embed recorded)**. Step 14 was therefore run. DevOps must re-run it immediately before any live push.

## Gate results (C4b criteria as far as the Coder can run them; evidence under `docs/qa/evidence/t4bc-*`)

| Criterion | Result |
|---|---|
| C4b.0 | PASS: `npm ci && npm run check:css` exit 0 on HEAD, clean tree |
| C4b.1 | PASS: 0 offenses after every step; `check:hidden` 0 |
| C4b.2 | PASS: schema shasums equal Step 0 |
| C4b.3 | PASS (a) `rg` prints only `templates/gift_card.liquid:7`; (b) `t4bc-sweep-head14.json`: 0 unlayered rules under every T4b root at 375 and 1440. Product pages show the same Shopify accelerated-checkout and `<input>` inline-style matches as base (pre-existing, not T4b markup) |
| C4b.4 | PASS: legacy-class intersection is a subset of `{grid, uppercase, overflow-hidden}` on every T4b page; no childless `div` under any root |
| C4b.5 | PASS: `X_page` 0 and no offender at 320/375/390/430/768/1440/1920 on all pages incl. `/collections/all` (base 200/145/130/90) and `/search` (base 158/103/88/48). PX1 and PX5 pages: no overflow |
| C4b.6 | PASS on collection, collections, search, two pages, blog (empty), 404 at all 7 widths: h1 left = `E_L` (52 / 292), right edge = `w - E_L`, padding 40/64, 30/36px Oswald uppercase; `/password` (logged-in session, see deviation 1) at 320-1920 the same; `rg page-shell src/tailwind.css` none |
| C4b.7 | PASS (a) tracks equal §5.4-§5.6 (collection 271 at 375, 660 x 2 at 1440; search 209.3 x 6 at 1440; collections 326.5 x 4) (b) `.grid-fill{` present once, no `grid-cols-[repeat` |
| C4b.8 | PASS (PX3, 6 combinations, `t4bc-px3-head.txt`): compact 8 x 167 (gap 0), 7 x 182.3 (gap 10), 6 x 181 (gap 50); full 4 x 334 / 326.5 / 296.5; 1 x 271 at 375 in all; column-gap equals the setting. Note the file has stale rows from CLI sync lag (the rows were re-read until the gap matched; see deviation 6) |
| C4b.9 | PASS for collection and search (PX1, page size 2, pages 1/4/8): one `nav[data-pagination][aria-label="Pagination"]`, href set equals base's `default_pagination` set, one `aria-current="page"`, no <- on page 1 / no -> on the last, all targets 44 x 44. Observation: the current item's `textContent` is "Page N N" (sr-only label plus the visible number in `aria-hidden`), as the plan's snippet is written. Blog and article comments: no fixture |
| C4b.10 | PASS on the no-results branch (literal `<i>zz</i> & "q"`, no `i` element, no `&lt;` text, input value equals terms). The "snowboard + terms" query also returned no results, so the results branch isn't reachable (PX8 shows `_html` raw/plain behaviour) |
| C4b.11 | PASS (`rg` hits every listed expression) |
| C4b.12 | no fixture (blog has no articles) |
| C4b.13 | PASS: every `<img>` under the roots has width and height, `H1` = 1 on every page, `N_pre` 9 (12 on 3p) unchanged, heading order h1->h2 (archive), h2->h3 (PX5b) |
| C4b.14 | PASS: `rg` none; archive meter `aria-label` "Sustainability rating: N out of 5"; PX5 heading "More items engineered with Ocean-Bound rPET" |
| C4b.15 | PASS: (a) frame identical to base at 375 (44-331), 768/1024/1440 (100-...), 1920 (340-1580); (b) columns 1-4 at 1440: 1240, 604, 392, 286; 900: 2 x 334; 375: 1 x 287; (c) padding 0 -> 0/0, 100 -> 75 (375) / 100 (1440) |
| C4b.16 | PASS: one meter per rated card, 5 `[data-sustainability-bar]`, `data-active` count = rating, animation `sustainabilityFillReveal`, delays 0/150/300/450/600 ms; no `material-archive-card__sustainability` or `fillBarReveal` in the HTML |
| C4b.17 | PASS: row bottoms equal (774.6 / 1285.1), radius 12, border composited 235-ish (`oklab(0 0 0 / .08)` over white), image box 390 x 219 (16:9), hover `translate: 0px -5px` and shadow `0 10px 30px` 5% after 500 ms, no `h-full` |
| C4b.18 | PASS (PX5, PX5b, PX5c): 4 `li` each with `[data-related-card]`, no mini-card/`relational-rec`/`page-width`, Oswald heading, padding 27 / 36 (default), 0 / 0, 75 / 100 |
| C4b.19 | PASS: (a) static, (b) PX9: archive 6 of 6, `material-info` and the tooltip (fetched via `/search?section_id=material-tooltip`) show literal `<b>zz</b> & y` with no `b` element |
| C4b.20 | PASS: (a) exact string absent (0 matches); (b) head14 sweep vs base on 15 pages: same computed `border-top-width` for every control, none 0 (search input 1px, wax/snow select and quantity 1px, p3p quantity 1px). The password input 1px at 44 px. No app-block controls exist |
| C4b.21 | PASS: (a) five selectors gone, `group-aria-busy\/drawer\:visible` and `.inline{` present; (b) 0 matching elements on every page |
| C4b.22 | PASS: per-step selector diffs recorded in the shell log below; net vs T4a: added `basis-48 border-black/8 gap-(--grid-gap) grid-fill hover:-translate-y-1.25 hover:shadow-[...] leading-[1.6] max-w-[37.5rem] mb-16 md:grid-cols-2 min-h-32 min-w-11 mt-auto text-[#444]`, removed `capitalize contents filter flex-grow transform truncate visible`; the last two non-exclusion removals (`flex-grow`, bare `visible`, only compiled from the archive's old CSS text) match 0 elements on 13 pages and appear in no `.js` or Liquid class. `.mb-12` was removed in Step 11 and returned in Step 12 |
| C4b.23 | PASS: 43,803 / 9,253; net -864 / -184 |
| C4b.24 | recorded: `B_head` = `B_doc` 22,525 -> 21,957; `N_dawn` 2 -> 2; `K_bun` 2,147 -> 826 and none of the six stale selectors remain in the bundle (all six were present on base) |
| C4b.25 | PASS (a) static; (b) PX7 base and head identical: `text-align` center, img `display` inline, rect [570,0,300,199.9] |
| C4b.26 | border and geometry PASS (logged-in session); the password submission reached `/` (one attempt, `t4bc-password-submit.txt`; see deviation 1: on this store that form is Shopify's built-in page) |
| C4b.27 | PASS: drawer add/update/remove/Escape at 1440 and 375 (`t4bc-regress-head.txt`). Pixel diff base vs head: `/`, wax, cart, `/password` identical at 1440 and 375; `p3p` 375 14 px and `snow` 1440/375 196/22 px differ, and `snow` 64/22 px also differ head vs head2 (same y ranges as the T4a jitter). **`p3p` 375 (14 px, y 1561-2788) did not reproduce in head vs head2**; QA should eyeball it (Step 13 touched the story escape on that page). C0.13 not run |
| C4b.28 | PASS (PX6): title, collection link and archive description colors follow the palette (`rgb(238, 17, 136)`, description 75% of it); card background `rgb(255,255,255)`, color `rgb(51,51,51)`, story `rgb(68,68,68)` do not change. `--color-foreground` re-read as `#333333` after restoring |
| C4b.29 | VALID-PASS at Step 0 (no embed on live); to be re-run before the live push |

## Deviations and decisions

1. **C4b.26 / `/password` in a fresh context is not the theme's page on this store.** A visitor without the storefront cookie gets Shopify's built-in "ShopifySans" password page; the theme's `templates/password.json` renders only with an authenticated session. So the border, geometry and h1 checks use the logged-in state; the "submit reaches `/`" attempt ran in a fresh context against Shopify's built-in form. Neither checks the theme's password form submit. Owner should look at the theme's page via the editor (owner check 2/3). `t4bc-password.mjs` says so.
2. **Settings and scratch rendering without a separate Step 0 base for PX3-PX6, PX9** (deviation 5 below).
3. **Probe template and PX7 template were placed temporarily in the repo working tree** (untracked, removed within the minute) rather than a scratch copy, for items 5 and PX7 base/head; never staged. PX7 base used the base scratch copy.
4. **Step 11 comment rewrite**: the archive's opening comment was replaced with prose that avoids utility words (as the plan asks); `@example` kept.
5. **Base renders of PX3-PX6/PX9 skipped** (formula-based criteria; plan lists them under Step 0 item 12 as "render PX1, PX3-PX7"). Only PX1 and PX7 were rendered on base.
6. **CLI sync lag**: `shopify theme dev` uploads template JSON 15-40 s after a scratch edit; several PX rows initially read the previous state. Each shipped value was verified against its own setting echo (`--grid-gap`, padding), and the stale reads are in the txt files (flagged above).
7. **`search.terms` raw claim** (plan §1): on base the terms already printed safely; see Step 0. No action beyond the plan.
8. `docs/dev-fixtures.md` gap (§14.3): no article, no policy, no second product sharing a material, blog empty. Not edited (gitignored, operator-maintained).

## Out-of-scope observations

- `product.liquid`'s accelerated-checkout and inline `<input>` `<style>` rules still match product-page elements as unlayered CSS (same on base).
- Archive description contains a stray `<meta charset="utf-8">` inside its `<p>` (merchant content).
- `sustainability-rating` prints its keyframe `<style>` once per card (plan RB13).

## Commands to run locally

```
npm ci && npm run build:css
npm run check:css && npm run check:hidden && shopify theme check
shopify theme dev       # private dev theme; use the printed ?preview_theme_id= URL
export T4BC_STATE=<scratch>/state.json    # cached session cookie, not the password
node docs/qa/harness/t4bc-check.mjs "$U" head "/collections/all,/search?q=snowboard" 375,1440
node docs/qa/harness/t4bc-facts.mjs "$U" head ; t4bc-sweep.mjs ; t4bc-archive.mjs ; t4bc-pagination.mjs ; t4bc-escape.mjs ; t4bc-regress.mjs ; t4bc-shots.mjs
node docs/qa/harness/t4bc-liveprobe.mjs probe <targets.json>   # READ-ONLY, live; re-run before any live push ([] = no embed)
```

PX proxies were run on `git archive` scratch copies served with `shopify theme dev --path` (page sizes 2; `list-collections.json`, `page.materials.json`, `product.json`, `settings_data.json` edits stay in the scratch tree).

## QA focus

- Owner checks: E4b.3 (collection grid and gap), E4b.4 (search form), E4b.12 (password), E4b.16 (archive footer from the PDP rating snippet; archive cards are ~37 px taller).
- Pagination visuals (PX1 on a scratch copy; nothing paginates for real) and the article/comment form (no article exists: only static and theme-check coverage).
- Archive 750-767 px band (E4b.14), hover on touch devices, `p3p` 375 pixel diff.
- The live probe C4b.29 immediately before any live push.

## Bug fix verification approach

Not applicable (feature phase).
