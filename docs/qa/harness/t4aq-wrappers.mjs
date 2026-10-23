// Image wrapper geometry on collection/collections/search (C4a.20). usage: node t4aq-wrappers.mjs <previewUrl> <out.json>
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t4aq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = {};
for (const w of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, w, 900);
  for (const [k, path] of [['coll', '/collections/all'], ['colls', '/collections'], ['search', '/search?q=snowboard']]) {
    await page.goto(withTheme(path), { waitUntil: 'load' });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } scrollTo(0, 0); });
    await sleep(400);
    out[`${k}@${w}`] = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => !i.closest('header, footer, cart-drawer, #shopify-section-header, #shopify-section-footer') && i.closest('a, div')).map((i) => {
      const p = i.parentElement; const a = p.getBoundingClientRect(); const b = i.getBoundingClientRect(); const cp = getComputedStyle(p); const ci = getComputedStyle(i);
      return { cls: p.className, tag: p.tagName, p: [a.left, a.top + scrollY, a.width, a.height].map((n) => Math.round(n * 10) / 10), i: [b.left, b.top + scrollY, b.width, b.height].map((n) => Math.round(n * 10) / 10), pd: [cp.display, cp.position, cp.overflow, cp.width, cp.height], id: [ci.display, ci.width, ci.height], attrs: [i.getAttribute('width'), i.getAttribute('height')] };
    }));
    out[`${k}@${w}-overflow`] = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  }
  await ctx.close();
}
writeFileSync(process.argv[3], JSON.stringify(out));
for (const [k, v] of Object.entries(out)) console.log(k, Array.isArray(v) ? v.length + ' imgs; sample class: ' + (v[0] && v[0].cls) : v);
await browser.close();
