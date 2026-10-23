// T3 Coder (from t2c-sweep): C3.10 (no unlayered rule styles T3 markup), C3.11 (Dawn class names), C3.17 (headings), C3.24 probe.
// Usage: node t3c-sweep.mjs <previewBase> [pagesCsv=home,land] [widthsCsv=1440,375]
import { parseArgs, openBrowser, PAGES, scrollThrough } from './t3c-lib.mjs';

const { withTheme } = parseArgs();
const pages = (process.argv[3] || 'home,land').split(',');
const widths = (process.argv[4] || '1440,375').split(',').map(Number);

const sweep = () => {
  const roots = [...document.querySelectorAll('.shopify-section')].filter((s) => s.id.startsWith('shopify-section-template') && (s.querySelector('.welcome, [data-hello-band]') || s.querySelector('[id^="Banner-"]')));
  const els = [];
  for (const r of roots) for (const e of [r, ...r.querySelectorAll('*')]) if (!e.closest('[id^="shopify-block-"]')) els.push(e);
  const matches = {}; const foreign = {};
  const walk = (rules, sheet) => {
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
        (themeOutput ? matches : foreign)[k] = { n: hit.length, sample: hit[0].tagName.toLowerCase() + '.' + String(hit[0].className).split(' ')[0] };
      }
    }
  };
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    if (sheet.href && new URL(sheet.href).origin !== location.origin) continue;
    walk(rules, sheet);
  }
  const dawn = new Set();
  const collect = (rules) => { for (const r of rules) { if (r instanceof CSSStyleRule) for (const m of r.selectorText.matchAll(/\.([A-Za-z_][\w-]*)/g)) dawn.add(m[1]); else if (r.cssRules) collect(r.cssRules); } };
  for (const sheet of document.styleSheets) {
    if (!(sheet.href && sheet.href.includes('base.css'))) continue;
    for (const r of sheet.cssRules) if (r instanceof CSSLayerBlockRule && r.name === 'legacy') collect(r.cssRules);
  }
  const used = new Set();
  for (const e of els) for (const c of e.classList) if (dawn.has(c)) used.add(c);
  const gridMargins = els.filter((e) => e.classList.contains('grid') && getComputedStyle(e).marginBottom !== '0px').length;
  const bareHidden = els.filter((e) => e.classList.contains('hidden')).length;
  const buttonClass = els.filter((e) => e.classList.contains('button')).length;
  const heads = [...document.querySelectorAll('[id^="shopify-section-template"] :is(h1,h2,h3,h4,h5,h6)')].map((h) => h.tagName.toLowerCase());
  const imgs = els.filter((e) => e.tagName === 'IMG').map((i) => [i.getAttribute('width'), i.getAttribute('height'), i.getAttribute('alt')]);
  return { nEls: els.length, matches, foreign, dawnUsed: [...used].sort(), gridMargins, bareHidden, buttonClass, h1: document.querySelectorAll('h1').length, heads, imgs };
};

const { browser, state } = await openBrowser(withTheme);
for (const vw of widths) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: 800 } });
  const page = await ctx.newPage();
  for (const key of pages) {
    await page.goto(withTheme(PAGES[key]), { waitUntil: 'load' });
    await scrollThrough(page, { waitCards: false });
    const r = await page.evaluate(sweep);
    console.log(`=== ${key} ${vw}: els ${r.nEls}, h1 ${r.h1}, gridMargins!=0 ${r.gridMargins}, bare hidden ${r.bareHidden}, .button ${r.buttonClass}, heads ${r.heads.join(',')}, imgs ${JSON.stringify(r.imgs)}`);
    console.log('  unlayered matches:', Object.keys(r.matches).length);
    for (const [k, v] of Object.entries(r.matches)) console.log('   ', k, `x${v.n}`, v.sample);
    if (Object.keys(r.foreign).length) { console.log('  foreign:'); for (const [k, v] of Object.entries(r.foreign)) console.log('   ', k, `x${v.n}`); }
    console.log('  dawn classes used:', r.dawnUsed.join(' '));
  }
  await ctx.close();
}
{
  const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(withTheme(PAGES.p3p), { waitUntil: 'load' });
  const r = await page.evaluate(() => {
    const mk = (cls) => { const d = document.createElement('div'); d.className = cls; d.textContent = 'x'; document.body.appendChild(d); const s = getComputedStyle(d); const o = { overflow: s.overflow, display: s.display }; d.remove(); return o; };
    return { bare: mk('group'), vertical: mk('group group--vertical') };
  });
  console.log('C3.24 probe', JSON.stringify(r));
  await ctx.close();
}
await browser.close();
