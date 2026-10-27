// T5a spacing follow-up, C-S.10: same-page sweep, head vs head-off (R_new removed from the CSSOM, same load).
// Usage: node t5as-sweep.mjs <outdir> <preview_theme_id> <pre-step-1 tailwind.css>
// Each page/width: load, (rental: open picker), probe check, full-page screenshot + rect map for head,
// delete R_new, probe check, screenshot + rect map for head-off. Byte-equal PNGs = 0 differing pixels.
// Never prints the storefront password (loginState reads it from docs/dev-fixtures.md).
import { chromium, loginState, PAGES, sleep } from './t5ac-lib.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const [OUT, theme, preCssPath] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const origin = 'https://theme-evolution-os2.myshopify.com';
const withTheme = (p) => `${origin}${p}${p.includes('?') ? '&' : '?'}preview_theme_id=${theme}`;
const PROBE = '<div data-rich-text data-probe><h5>a</h5><h6>b</h6></div>';
const preText = readFileSync(preCssPath, 'utf8');
const headText = readFileSync(new URL('../../../assets/tailwind.css', import.meta.url), 'utf8');

const diffFn = ([a, b]) => {
  const flat = (text) => { const s = new CSSStyleSheet(); s.replaceSync(text); const out = []; const walk = (rules) => { for (const r of rules) { if (r.cssRules && r.cssRules.length && !r.selectorText) { walk(r.cssRules); continue; } out.push(r.cssText); } }; walk(s.cssRules); return out; };
  const pre = new Set(flat(a));
  return flat(b).filter((t) => !pre.has(t));
};
const deleteFn = (newRules) => {
  const sels = new Set(newRules.map((t) => t.slice(0, t.indexOf('{')).trim()));
  const sheet = [...document.styleSheets].find((s) => s.href && s.href.includes('tailwind.css'));
  let n = 0;
  const walk = (c) => { for (let i = c.cssRules.length - 1; i >= 0; i--) { const r = c.cssRules[i]; if (r.selectorText !== undefined) { if (sels.has(r.selectorText)) { c.deleteRule(i); n++; } } else if (r.cssRules) walk(r); } };
  walk(sheet);
  return n;
};
const probeFn = (html) => {
  const d = document.createElement('div'); d.innerHTML = html; const el = d.firstElementChild; document.body.append(el);
  const mt = getComputedStyle(el.querySelector('h6')).marginTop; el.remove();
  return mt;
};
const rectsFn = () => {
  const out = [];
  let i = 0;
  for (const e of document.body.querySelectorAll('*')) {
    const r = e.getBoundingClientRect();
    out.push([i++, e.tagName, Math.round(r.left * 10) / 10, Math.round((r.top + scrollY) * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10]);
  }
  return out;
};
const allPages = { ...PAGES, rental: '/products/the-rental-snowboard' };
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
const pages = Object.fromEntries(Object.entries(allPages).filter(([k]) => !only || only.includes(k)));
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, (p) => withTheme(p));
if (!loggedIn) throw new Error('login failed');
const md5 = (b) => createHash('md5').update(b).digest('hex');
const results = [];
for (const [name, path] of Object.entries(pages)) {
  for (const vw of [375, 1440]) {
    const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vw === 375 ? 667 : 900 } });
    const page = await ctx.newPage();
    try {
      if (name === 'cartseed') {
        await page.goto(withTheme('/products/selling-plans-ski-wax'), { waitUntil: 'load' });
        await Promise.all([page.waitForResponse((r) => /\/cart\/add/.test(r.url())), page.locator('button[name="add"]').first().click()]);
        await sleep(600);
      }
      const gr = await page.goto(withTheme(path), { waitUntil: 'load' });
      if (!gr || gr.status() >= 400) console.log('goto status', name, vw, gr && gr.status());
      await sleep(1500);
      if (name === 'rental') {
        const inp = page.locator('[id^="shopify-block-"] input, [id*="supercycle" i] input, [class*="supercycle" i] input').first();
        if (await inp.count()) { await inp.click({ timeout: 3000 }).catch(() => {}); await sleep(1500); }
      }
      await page.evaluate(() => document.fonts.ready);
      const shot = async () => page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
      const probeHead = await page.evaluate(probeFn, PROBE);
      const rectsA = await page.evaluate(rectsFn); const shotA = await shot();
      const rules = await page.evaluate(diffFn, [preText, headText]);
      const removed = await page.evaluate(deleteFn, rules);
      await sleep(300);
      const probeOff = await page.evaluate(probeFn, PROBE);
      const rectsB = await page.evaluate(rectsFn); const shotB = await shot();
      let noise = null;
      if (name === 'rental') { const shotC = await shot(); noise = md5(shotB) === md5(shotC) ? 'identical' : 'DIFFERS'; }
      let rectDiffs = 0;
      if (rectsA.length !== rectsB.length) rectDiffs = -1;
      else for (let i = 0; i < rectsA.length; i++) for (let k = 2; k < 6; k++) if (Math.abs(rectsA[i][k] - rectsB[i][k]) > 1) { rectDiffs++; break; }
      const valid = rules.length === 4 && removed === 4 && probeHead === '24px' && probeOff === '0px';
      const same = md5(shotA) === md5(shotB);
      const rec = { name, vw, valid, probeHead, probeOff, rules: rules.length, removed, pngEqual: same, rectElems: rectsA.length, rectDiffs, noise, size: [shotA.length, shotB.length] };
      if (!same) { writeFileSync(`${OUT}/sweep-${name}-${vw}-head.png`, shotA); writeFileSync(`${OUT}/sweep-${name}-${vw}-off.png`, shotB); }
      results.push(rec); console.log(JSON.stringify(rec));
    } catch (e) { console.log(JSON.stringify({ name, vw, error: String(e.message).slice(0, 200) })); }
    if (name === 'cartseed') await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' })).catch(() => {});
    await ctx.close();
  }
}
writeFileSync(`${OUT}/sweep-results${only ? '-' + only.join('_') : ''}.json`, JSON.stringify(results, null, 1));
await browser.close();
