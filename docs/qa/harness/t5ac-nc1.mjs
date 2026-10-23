// T5a NC-1 (Step 0 item 8 record): what hides the privacy widget's small.form__message today, base.css on. Usage: node t5ac-nc1.mjs <previewBase>
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t5ac-lib.mjs';
const { withTheme } = parseArgs();
const b = await chromium.launch(); const { state } = await loginState(b, withTheme);
const { page } = await newPage(b, state, 1440, 900);
await page.goto(withTheme('/pages/data-sharing-opt-out'), { waitUntil: 'load' }); await sleep(2500);
const r = await page.evaluate(() => {
  const s = document.querySelector('small.form__message'); if (!s) return { found: false };
  const cs = getComputedStyle(s);
  const chain = []; for (let e = s; e && e !== document.documentElement; e = e.parentElement) { const c = getComputedStyle(e); chain.push({ tag: e.tagName.toLowerCase(), id: e.id, cls: String(e.className).slice(0, 50), hiddenAttr: e.hasAttribute('hidden'), style: e.getAttribute('style'), display: c.display, visibility: c.visibility }); }
  // matching rules from every readable sheet, naming the sheet and the declarations that set display or visibility
  const rules = [];
  for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch { rules.push({ sheet: (sh.href || 'inline').replace(/\?.*/, '').slice(-60), unreadable: true }); continue; }
    const walk = (list, layer) => { for (const r of list) { if (r.cssRules && r.constructor.name !== 'CSSStyleRule') walk(r.cssRules, r.name || layer); else if (r.selectorText) { try { if (s.matches(r.selectorText) && (r.style.display || r.style.visibility || r.style.getPropertyValue('--x'))) rules.push({ sheet: (sh.href || 'inline').replace(/\?.*/, '').slice(-60), layer, sel: r.selectorText.slice(0, 80), display: r.style.display, visibility: r.style.visibility }); } catch {} } } };
    walk(rs, ''); }
  return { found: true, display: cs.display, visibility: cs.visibility, hiddenAttr: s.hasAttribute('hidden'), html: s.outerHTML.slice(0, 400), parentChain: chain.slice(0, 6), rules };
});
writeFileSync('docs/qa/evidence/t5ac-nc1-base.json', JSON.stringify(r, null, 1));
console.log(JSON.stringify(r, null, 1).slice(0, 3500));
await b.close();
