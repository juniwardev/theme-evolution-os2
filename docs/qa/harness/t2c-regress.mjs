// T2 Coder: C2.26 regression set. Document height, X_page, h1 count and a full-page screenshot per page and width.
// Usage: node t2c-regress.mjs <previewBase> <label>   (label: base for staging, head for the dev theme)
import { chromium, parseArgs, loginState } from './t2c-lib.mjs';
const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const PAGES = { home: '/', coll: '/collections/all', search: '/search?q=snowboard', cart: '/cart', mat: '/pages/the-material-archive', p404: '/pages/tailwind-qa-missing', pw: '/password' };
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const vw of [1440, 375]) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vw >= 1000 ? 900 : 667 } });
  const page = await ctx.newPage();
  for (const [k, p] of Object.entries(PAGES)) {
    const resp = await page.goto(withTheme(p), { waitUntil: 'load' });
    await page.waitForTimeout(1800);
    const m = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, x: document.documentElement.scrollWidth - innerWidth, h1: document.querySelectorAll('h1').length }));
    await page.screenshot({ path: `docs/qa/screenshots/t2c-reg-${label}-${k}-${vw}.png`, fullPage: true });
    console.log(label, k, vw, resp.status(), JSON.stringify(m));
    await page.waitForTimeout(1200);
  }
  await ctx.close();
}
await browser.close();
