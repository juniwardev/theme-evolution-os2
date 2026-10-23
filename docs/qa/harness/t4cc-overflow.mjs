// T4c Step 0 item 4 / C4c.16 / C4c.17: X_page and X_off' at the seven widths on every page in the plan's table.
// Usage: node t4cc-overflow.mjs <previewBase> <label> [extraPaths]   Output: docs/qa/evidence/t4cc-overflow-<label>.json, one row per page
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, overflowFn2, WIDTHS } from './t4cc-lib.mjs';

const label = process.argv[3];
const extra = (process.argv[4] || '').split(',').filter(Boolean);
const { withTheme } = parseArgs();
const PATHS = ['/pages/data-sharing-opt-out', '/pages/the-balanced-face-test-page', '/pages/contact', '/pages/the-material-archive', '/products/the-3p-fulfilled-snowboard', '/products/selling-plans-ski-wax', '/products/the-complete-snowboard',
  '/policies/privacy-policy', '/', '/cart', '/collections/all', '/collections', '/search?q=snowboard', '/blogs/news', '/pages/tailwind-qa-missing', '/password', ...extra];
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
const out = {};
for (const p of PATHS) {
  out[p] = {};
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme(p), { waitUntil: 'load' });
  await sleep(p.includes('opt-out') ? 2500 : 600);
  for (const vw of WIDTHS) {
    await page.setViewportSize({ width: vw, height: vw >= 1000 ? 900 : 812 });
    await sleep(250);
    const o = await page.evaluate(overflowFn2);
    out[p][vw] = { x: o.sw - o.vw, off: o.off.slice(0, 4) };
  }
  await ctx.close();
  console.log(p.padEnd(44), WIDTHS.map((w) => `${w}:${out[p][w].x}${out[p][w].off.length ? '!' + out[p][w].off[0].slice(0, 40) : ''}`).join(' '));
}
await browser.close();
writeFileSync(`docs/qa/evidence/t4cc-overflow-${label}.json`, JSON.stringify(out, null, 1));
