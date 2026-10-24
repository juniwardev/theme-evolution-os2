// T5a QA keyboard focus sweeps (header, page, cart drawer, mobile menu) for one build, diffed with t5aq-fdiff.mjs.
// Usage: T5AQ_STATE=<scratch>/state.json node t5aq-kb.mjs <previewBase> <label> <outFile>
import { writeFileSync, readFileSync } from 'node:fs';
import { chromium, sleep } from './t5ac-lib.mjs';

const [previewBase, label, outFile] = process.argv.slice(2);
const origin = new URL(previewBase).origin;
const themeId = new URL(previewBase).searchParams.get('preview_theme_id');
const withTheme = (p) => `${origin}${p}${p.includes('?') ? '&' : '?'}preview_theme_id=${themeId}`;
const browser = await chromium.launch();
const j = JSON.parse(readFileSync(process.env.T5AQ_STATE, 'utf8')); const state = j.state || j;
const out = { label };

const probe = () => {
  const el = document.activeElement; if (!el || el === document.body) return null;
  const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
  const pcs = getComputedStyle(el, '::after');
  return { tag: el.tagName.toLowerCase(), txt: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('href') || '').trim().replace(/\s+/g, ' ').slice(0, 24), fv: el.matches(':focus-visible'), out: `${cs.outlineStyle} ${cs.outlineWidth}`, off: cs.outlineOffset, shadow: cs.boxShadow === 'none' ? 'none' : 'set', afterOut: pcs.outlineStyle === 'none' ? 'none' : `${pcs.outlineStyle} ${pcs.outlineWidth}`, rect: [r.x, r.y, r.width, r.height].map(Math.round) };
};
const sweep = async (page, max, key) => {
  const seq = [];
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(probe);
    if (!s) break;
    if (/preview-bar|iframe/.test(s.tag)) { seq.push({ tag: s.tag }); continue; }
    seq.push(s);
    if (seq.length > 4 && seq.slice(0, -1).some((q) => JSON.stringify(q.rect) === JSON.stringify(s.rect) && q.txt === s.txt && q.tag === s.tag)) break;
  }
  return seq;
};
const pages = { home: '/', wax: '/products/selling-plans-ski-wax', collection: '/collections/all', cart: '/cart', password: '/password' };
out.sweeps = {};
for (const w of [375, 1440]) {
  for (const [k, path] of Object.entries(pages)) {
    const ctx = await browser.newContext({ storageState: state, viewport: { width: w, height: 812 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(withTheme(path), { waitUntil: 'load' }); await sleep(1200);
    out.sweeps[`${k}-${w}`] = await sweep(page, 60, k);
    await ctx.close();
  }
}
// drawer open (375 and 1440), after seeding the cart with wax through the page's own cart API
for (const w of [375, 1440]) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: w, height: 812 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(withTheme('/products/selling-plans-ski-wax'), { waitUntil: 'load' }); await sleep(800);
  await page.evaluate(async () => { const v = document.querySelector('form[action*="/cart/add"] [name=id]'); const fd = new FormData(); fd.append('id', v.value); fd.append('quantity', '1'); await fetch('/cart/add.js', { method: 'POST', body: fd }); });
  await page.goto(withTheme('/'), { waitUntil: 'load' }); await sleep(1000);
  await page.click('[data-header-cart-icon]'); await page.waitForSelector('cart-drawer[data-state="open"]', { timeout: 8000 }).catch(() => {});
  await sleep(600);
  out.sweeps[`drawer-${w}`] = await sweep(page, 25, 'drawer');
  await page.keyboard.press('Escape'); await sleep(500);
  out.sweeps[`drawer-${w}-closed`] = await page.evaluate(() => { const d = document.querySelector('cart-drawer'); return d && d.getAttribute('data-state'); });
  // empty the cart again
  await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
  await ctx.close();
}
// mobile menu (375)
{
  const ctx = await browser.newContext({ storageState: state, viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(withTheme('/'), { waitUntil: 'load' }); await sleep(1000);
  await page.click('.theme-evolution-header-menu__toggle'); await sleep(700);
  out.sweeps['menu-375-open'] = await page.evaluate(() => { const p = document.querySelector('.theme-evolution-header-menu__toggle'); return p.getAttribute('aria-expanded'); });
  out.sweeps['menu-375'] = await sweep(page, 25, 'menu');
  await ctx.close();
}
writeFileSync(outFile, JSON.stringify(out, null, 1));
await browser.close();
console.log('wrote', outFile);
