// T4a Coder: C4a.3 (no unlayered rule styles T4a markup) and C4a.4 (no Dawn class names; no div that relies on div:empty).
// Method from T2 C2.6/C2.6b: every same-origin sheet including inline ones, skip layered rules, only matching media/supports,
// el.matches() on every element under the T4a roots. Roots: the cart-drawer subtree, /cart's __main wrapper, the Add to cart button subtree.
// Usage: node t4ac-sweep.mjs <previewBase> <label>   Output: docs/qa/evidence/t4ac-sweep-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, seedCart, openDrawer, sleep, HANDLES } from './t4ac-lib.mjs';

const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');

// In-page. rootSel: CSS selector list for the roots. Returns {unlayered: [{sel, owner, el}], legacyHits: [...], emptyDivs: [...]}.
const sweepFn = (rootSel) => {
  const roots = [...document.querySelectorAll(rootSel)];
  const els = [];
  for (const r of roots) { els.push(r, ...r.querySelectorAll('*')); }
  const unlayered = [];
  const legacyNames = new Set();
  const skipped = [];
  const ownerOf = (sheet) => (sheet.ownerNode && sheet.ownerNode.tagName === 'STYLE' ? 'inline<style>#' + (sheet.ownerNode.closest('[id]')?.id || 'head') : (sheet.href || 'unknown').replace(/\?.*$/, '').split('/').pop());
  const walk = (rules, sheet, layerPath) => {
    for (const rule of rules) {
      const t = rule.constructor.name;
      if (t === 'CSSLayerBlockRule') {
        const path = [...layerPath, rule.name];
        if (rule.name === 'legacy' || path[0] === 'legacy') {
          // collect class names in the legacy layer
          const names = (r) => { for (const x of r.cssRules || []) { if (x.selectorText) for (const m of x.selectorText.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) legacyNames.add(m[1]); if (x.cssRules) names(x); } };
          names(rule);
        }
        continue;
      }
      if (t === 'CSSMediaRule') { if (matchMedia(rule.conditionText || rule.media.mediaText).matches) walk(rule.cssRules, sheet, layerPath); continue; }
      if (t === 'CSSSupportsRule') { if (CSS.supports(rule.conditionText)) walk(rule.cssRules, sheet, layerPath); continue; }
      if (t === 'CSSStyleRule' && layerPath.length === 0) {
        let sel = rule.selectorText;
        // strip pseudo-elements/states so :hover rules still count as matching the element
        const base = sel.split(',').map((s) => s.trim().replace(/::?(before|after|hover|focus|focus-visible|active|disabled|placeholder|-webkit-[\w-]+)/g, '')).filter(Boolean);
        for (const b of base) {
          let hit = [];
          try { hit = els.filter((e) => e.matches(b)); } catch { continue; }
          if (hit.length) unlayered.push({ sel: b.slice(0, 80), owner: ownerOf(sheet), n: hit.length, first: hit[0].tagName.toLowerCase() + '.' + String(hit[0].className).slice(0, 40) });
        }
      }
    }
  };
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { skipped.push(sheet.href || 'inline'); continue; }
    const own = ownerOf(sheet);
    if (/preview-bar|accelerated-checkout/.test(sheet.href || '')) { skipped.push(own); continue; }
    walk(rules, sheet, []);
  }
  const classes = new Set();
  for (const e of els) for (const c of e.classList) classes.add(c);
  const legacyHits = [...classes].filter((c) => legacyNames.has(c));
  const emptyDivs = els.filter((e) => e.tagName === 'DIV' && e.childNodes.length === 0).map((e) => ({ cls: String(e.className).slice(0, 60), display: getComputedStyle(e).display, hasCloseHook: e.hasAttribute('data-cart-drawer-close') }));
  return { unlayered, legacyHits, emptyDivs, skipped, nEls: els.length };
};

const results = {};
const run = async (name, page, rootSel) => {
  results[name] = await page.evaluate(sweepFn, rootSel);
  const r = results[name];
  const owners = [...new Set(r.unlayered.map((u) => u.owner))];
  console.log(name.padEnd(34), 'els', r.nEls, 'unlayered', r.unlayered.length, owners.join(','), '| legacy classes', r.legacyHits.join(',') || '-', '| empty divs', r.emptyDivs.map((d) => d.display + (d.hasCloseHook ? '*' : '')).join(',') || '-');
};

for (const vw of [375, 1440]) {
  for (const [stateName, handles] of [['empty', []], ['one', [HANDLES.wax]], ['two', [HANDLES.wax, HANDLES.snow]]]) {
    const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
    await seedCart(page, withTheme, handles);
    await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' });
    await sleep(300);
    await run(`drawer-closed-${stateName}-${vw}`, page, 'cart-drawer');
    await openDrawer(page);
    await run(`drawer-open-${stateName}-${vw}`, page, 'cart-drawer');
    if (stateName === 'one') {
      await run(`addtocart-rest-${vw}`, page, 'button[name="add"]');
      await page.route('**/cart/change*', async (route) => { await sleep(1500); await route.continue().catch(() => {}); });
      const input = page.locator('#CartDrawer-Form input[name="updates[]"]').first();
      await input.fill('2');
      await input.evaluate((e) => e.blur());
      await sleep(300);
      await run(`drawer-busy-${vw}`, page, 'cart-drawer');
      await sleep(2200);
      await page.unroute('**/cart/change*');
    }
    await page.goto(withTheme('/cart'), { waitUntil: 'load' });
    await sleep(300);
    await run(`cart-${stateName}-${vw}`, page, '[id^="shopify-section-template"][id$="__main"]');
    await ctx.close();
  }
}
await browser.close();
writeFileSync(`docs/qa/evidence/t4ac-sweep-${label}.json`, JSON.stringify(results, null, 1));
