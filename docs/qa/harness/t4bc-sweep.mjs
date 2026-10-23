// T4b sweeps: C4b.3(b) (no unlayered rule styles T4b markup), C4b.4 (no Dawn class names, no div:empty reliance), C4b.20(b) control borders,
// C4b.21(b) (no .contents/.filter/.transform/.truncate/.capitalize elements, app blocks included) and Step 0 item 7's parity sweep
// (unclassed a/ul/ol/controls outside rich text and app blocks). Method from t4ac-sweep / T2 C2.6.
// Usage: node t4bc-sweep.mjs <previewBase> <label>   Output: docs/qa/evidence/t4bc-sweep-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t4bc-lib.mjs';

const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');

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

const parityFn = () => {
  const where = (e) => {
    if (e.closest('[id^="shopify-block-"]')) return 'app-block';
    if (e.closest('[data-rich-text]')) return 'rich-text';
    return 'theme';
  };
  const sel = (e) => { const p = []; for (let n = e; n && n !== document.body && p.length < 3; n = n.parentElement) p.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id.slice(0, 40) : '') + (n.classList[0] ? '.' + n.classList[0] : '')); return p.join(' > '); };
  const shown = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden'; };
  const out = [];
  for (const e of document.querySelectorAll('a:not([class]), ul:not([class]), ol:not([class]), input:not([class]), select:not([class]), textarea:not([class])')) {
    if (!shown(e) || e.closest('#preview-bar-iframe, #shopify-section-cart-drawer')) continue;
    if (e.tagName === 'INPUT' && ['hidden', 'checkbox', 'radio', 'submit'].includes(e.type)) continue;
    out.push({ tag: e.tagName.toLowerCase(), type: e.type || null, where: where(e), at: sel(e), text: (e.textContent || '').trim().slice(0, 30) });
  }
  return out;
};
const controlsFn = () => [...document.querySelectorAll('input, select, textarea')].filter((e) => !['hidden', 'checkbox', 'radio', 'submit'].includes(e.type) && getComputedStyle(e).display !== 'none' && !e.closest('#preview-bar-iframe'))
  .map((e) => ({ tag: e.tagName.toLowerCase(), type: e.type, key: e.name || e.id || null, bw: getComputedStyle(e).borderTopWidth, app: !!e.closest('[id^="shopify-block-"]') }));
const incidentalFn = () => document.querySelectorAll('.contents,.filter,.transform,.truncate,.capitalize').length;

const PAGES = [['collection', '/collections/all'], ['collections', '/collections'], ['search', '/search?q=snowboard'], ['page', '/pages/contact'], ['page2', '/pages/the-balanced-face-test-page'],
  ['blog', '/blogs/news'], ['404', '/pages/tailwind-qa-missing'], ['archive', '/pages/the-material-archive'], ['home', '/'], ['wax', '/products/selling-plans-ski-wax'], ['snow', '/products/the-complete-snowboard'], ['p3p', '/products/the-3p-fulfilled-snowboard'], ['cart', '/cart'], ['policy', '/policies/refund-policy'], ['policy2', '/policies/privacy-policy']];
const results = {};
for (const vw of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
  for (const [name, path] of PAGES) {
    await page.goto(withTheme(path), { waitUntil: 'load' });
    await sleep(300);
    const key = `${name}-${vw}`;
    const root = '[id^="shopify-section-template"][id$="__main"]';
    const r = await page.evaluate(sweepFn, root);
    results[key] = { ...r, parity: await page.evaluate(parityFn), controls: await page.evaluate(controlsFn), incidental: await page.evaluate(incidentalFn) };
    const owners = [...new Set(r.unlayered.map((u) => u.owner))];
    console.log(key.padEnd(18), 'els', r.nEls, 'unlayered', r.unlayered.length, owners.join(','), '| legacy', r.legacyHits.join(',') || '-', '| emptyDivs', r.emptyDivs.length, '| incidental', results[key].incidental, '| unclassed theme', results[key].parity.filter((p) => p.where === 'theme').length, 'rich', results[key].parity.filter((p) => p.where === 'rich-text').length, 'app', results[key].parity.filter((p) => p.where === 'app-block').length);
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`docs/qa/evidence/t4bc-sweep-${label}.json`, JSON.stringify(results, null, 1));
