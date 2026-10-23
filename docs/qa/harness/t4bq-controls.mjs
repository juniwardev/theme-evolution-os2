// C4b.20(b): border-top-width of every visible input/select/textarea per page, plus password page checks. Usage: node t4bq-controls.mjs <previewBase> <outJson>
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage } from './t4bq-lib.mjs';
const { withTheme } = parseArgs();
const PAGES = ['/', '/collections/all', '/collections', '/search', '/search?q=snowboard', '/pages/contact', '/pages/data-sharing-opt-out', '/pages/the-balanced-face-test-page', '/pages/the-material-archive', '/blogs/news', '/pages/tailwind-qa-missing', '/products/the-3p-fulfilled-snowboard', '/products/selling-plans-ski-wax', '/products/the-complete-snowboard', '/cart', '/password'];
const out = {};
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const p of PAGES) {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme(p), { waitUntil: 'load' });
  await page.waitForTimeout(600);
  out[p] = await page.evaluate(() => [...document.querySelectorAll('input,select,textarea')].filter((e) => !['hidden', 'checkbox', 'radio'].includes(e.type)).map((e) => {
    const cs = getComputedStyle(e); const b = e.getBoundingClientRect();
    return { k: (e.name || e.id || e.type) + ':' + e.type, shown: b.width > 0 && cs.display !== 'none', bw: cs.borderTopWidth, bs: cs.borderTopStyle, bc: cs.borderTopColor, h: Math.round(b.height * 10) / 10, app: !!e.closest('[id^="shopify-block-"]') };
  }));
  await ctx.close();
}
writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
for (const [p, v] of Object.entries(out)) console.log(p.padEnd(40), v.filter((c) => c.shown).map((c) => `${c.k}=${c.bw}${c.app ? '(app)' : ''}/${c.h}`).join(' '));
await browser.close();
