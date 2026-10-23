// T3 Coder: C3.26 regression set. Document height, X_page, h1 count and a full-page screenshot per page and width.
// Usage: node t3c-regress.mjs <previewBase> <label>   (label: base for staging #187953643616 read-only, head for the dev theme)
import { parseArgs, openBrowser } from './t3c-lib.mjs';
const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
export const REG = { p3p: '/products/the-3p-fulfilled-snowboard', wax: '/products/selling-plans-ski-wax', snow: '/products/the-complete-snowboard', coll: '/collections/all', search: '/search?q=snowboard', cart: '/cart', mat: '/pages/the-material-archive', p404: '/pages/tailwind-qa-missing', pw: '/password' };
const { browser, state } = await openBrowser(withTheme);
for (const vw of [1440, 375]) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vw >= 1000 ? 900 : 667 } });
  const page = await ctx.newPage();
  for (const [k, p] of Object.entries(REG)) {
    const resp = await page.goto(withTheme(p), { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    const m = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, x: document.documentElement.scrollWidth - innerWidth, h1: document.querySelectorAll('h1').length }));
    await page.screenshot({ path: `docs/qa/screenshots/t3c-reg-${label}-${k}-${vw}.png`, fullPage: true });
    console.log(label, k, vw, resp.status(), JSON.stringify(m));
    await page.waitForTimeout(1000);
  }
  await ctx.close();
}
await browser.close();
