// T2 Coder: C2.6 (no unlayered rule styles T2 markup), C2.6b (Dawn class names on T2 markup), plus structural checks
// C2.15 (h1), C2.17 (bars, grid children contained), C2.18/C2.24 (related columns), C2.7 probe.
// Usage: node t2c-sweep.mjs <previewBase> [pagesCsv=p3p,wax,snow] [widthsCsv=1440,375]
import { chromium, parseArgs, loginState, PRODUCTS, scrollThrough } from './t2c-lib.mjs';

const { withTheme } = parseArgs();
const pages = (process.argv[3] || 'p3p,wax,snow').split(',');
const widths = (process.argv[4] || '1440,375').split(',').map(Number);

const sweep = () => {
  const roots = [...document.querySelectorAll('.shopify-section')].filter((s) => s.id.startsWith('shopify-section-template'));
  const els = [];
  for (const r of roots) for (const e of [r, ...r.querySelectorAll('*')]) if (!e.closest('.shopify-payment-button, [id^="shopify-block-"]')) els.push(e);
  const matches = {}; const foreign = {};
  const walk = (rules, sheet, inLayer) => {
    for (const rule of rules) {
      if (rule instanceof CSSLayerBlockRule) continue;
      if (rule instanceof CSSMediaRule) { if (matchMedia(rule.conditionText).matches) walk(rule.cssRules, sheet); continue; }
      if (rule instanceof CSSSupportsRule) { if (CSS.supports(rule.conditionText)) walk(rule.cssRules, sheet); continue; }
      if (rule instanceof CSSStyleRule) {
        const sel = rule.selectorText.replace(/::?(before|after|first-line|first-letter|placeholder|marker|selection|backdrop|-webkit-[\w-]+|-moz-[\w-]+)/g, '');
        let hit = [];
        try { hit = els.filter((e) => e.matches(sel)); } catch { continue; }
        if (!hit.length) continue;
        const owner = sheet.ownerNode;
        const where = sheet.href ? new URL(sheet.href).pathname.split('/').pop() : (owner && owner.tagName === 'STYLE' ? 'inline<style>' : 'inline');
        const themeOutput = sheet.href ? true : !!(owner && owner.closest && (owner.closest('.shopify-section') || owner.closest('body, head')));
        const k = `${where} :: ${rule.selectorText.slice(0, 90)}`;
        const bucket = themeOutput ? matches : foreign;
        bucket[k] = { n: hit.length, sample: hit[0].tagName.toLowerCase() + '.' + String(hit[0].className).split(' ')[0] };
      }
    }
  };
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    if (sheet.href && new URL(sheet.href).origin !== location.origin) continue;
    walk(rules, sheet);
  }
  // C2.6b: class names used as selectors in base.css legacy layer
  const dawn = new Set();
  const collect = (rules) => { for (const r of rules) { if (r instanceof CSSStyleRule) for (const m of r.selectorText.matchAll(/\.([A-Za-z_][\w-]*)/g)) dawn.add(m[1]); else if (r.cssRules) collect(r.cssRules); } };
  for (const sheet of document.styleSheets) {
    if (!(sheet.href && sheet.href.includes('base.css'))) continue;
    for (const r of sheet.cssRules) if (r instanceof CSSLayerBlockRule && r.name === 'legacy') collect(r.cssRules);
  }
  const used = new Set();
  for (const e of els) for (const c of e.classList) if (dawn.has(c)) used.add(c);
  const gridMargins = els.filter((e) => e.classList.contains('grid') && getComputedStyle(e).marginBottom !== '0px').length;
  // C2.17 grid containment
  const gridBad = [];
  for (const g of els) {
    if (!/grid/.test(getComputedStyle(g).display)) continue;
    const gb = g.getBoundingClientRect();
    for (const c of g.children) {
      if (getComputedStyle(c).display === 'none') continue;
      const cb = c.getBoundingClientRect();
      if (cb.left < gb.left - 0.5 || cb.right > gb.right + 0.5 || cb.top < gb.top - 0.5 || cb.bottom > gb.bottom + 0.5) gridBad.push(`${g.tagName.toLowerCase()}.${String(g.className).split(' ')[0]} > ${c.tagName.toLowerCase()}`);
    }
  }
  const bars = [...document.querySelectorAll('[data-sustainability-bar]')].map((b) => ({ d: getComputedStyle(b).display, h: b.getBoundingClientRect().height, w: Math.round(b.getBoundingClientRect().width), active: b.hasAttribute('data-active'), afterBg: getComputedStyle(b, '::after').backgroundColor, anim: getComputedStyle(b, '::after').animationName }));
  const ul = document.querySelector('product-recommendations ul');
  const rowTops = {};
  if (ul) for (const li of ul.children) { const t = Math.round(li.getBoundingClientRect().top); rowTops[t] = (rowTops[t] || []).concat(Math.round(li.getBoundingClientRect().width * 10) / 10); }
  return { nEls: els.length, matches, foreign, dawnUsed: [...used].sort(), gridMargins, gridBad, h1: document.querySelectorAll('h1').length, bars, rows: Object.values(rowTops), productGridClass: document.querySelectorAll('.product-grid, .grid__item').length };
};

const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const vw of widths) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: 800 } });
  const page = await ctx.newPage();
  for (const key of pages) {
    await page.goto(withTheme(PRODUCTS[key]), { waitUntil: 'load' });
    await scrollThrough(page);
    const r = await page.evaluate(sweep);
    console.log(`=== ${key} ${vw}: els ${r.nEls}, h1 ${r.h1}, gridMargins!=0 ${r.gridMargins}, product-grid|grid__item ${r.productGridClass}`);
    console.log('  unlayered matches:', Object.keys(r.matches).length);
    for (const [k, v] of Object.entries(r.matches)) console.log('   ', k, `x${v.n}`, v.sample);
    if (Object.keys(r.foreign).length) { console.log('  foreign (not theme output):'); for (const [k, v] of Object.entries(r.foreign)) console.log('   ', k, `x${v.n}`); }
    console.log('  dawn classes used:', r.dawnUsed.join(' '));
    console.log('  grid children outside container:', r.gridBad.length ? r.gridBad.join('; ') : 'none');
    console.log('  related rows (widths):', JSON.stringify(r.rows));
    if (r.bars.length) console.log('  bars:', JSON.stringify(r.bars));
    await page.waitForTimeout(1200);
  }
  await ctx.close();
}
// C2.7 probe
{
  const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(withTheme(PRODUCTS.p3p), { waitUntil: 'load' });
  const r = await page.evaluate(() => {
    const mk = (cls) => { const d = document.createElement('div'); d.className = cls; d.textContent = 'x'; document.body.appendChild(d); const s = getComputedStyle(d); const o = { overflow: s.overflow, display: s.display }; d.remove(); return o; };
    return { bare: mk('group'), vertical: mk('group group--vertical') };
  });
  console.log('C2.7 probe', JSON.stringify(r));
  await ctx.close();
}
await browser.close();
