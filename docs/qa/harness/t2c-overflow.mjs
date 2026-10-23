// T2 Coder: C2.9. X_page and X_off at 320..1440 on the three products, in three states: after load;
// after scrolling related cards into view; (wax, snow) after one add to cart with the drawer closed again.
// Usage: node t2c-overflow.mjs <previewBase> [widthsCsv] [pagesCsv]
import { chromium, parseArgs, loginState, PRODUCTS, scrollThrough, overflowFn } from './t2c-lib.mjs';

const { withTheme } = parseArgs();
const widths = (process.argv[3] || '320,375,390,430,768,1024,1440').split(',').map(Number);
const pages = (process.argv[4] || 'p3p,wax,snow').split(',');
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const fmt = (o) => `xPage ${o.xPage}${o.offs.length ? ' offs ' + JSON.stringify(o.offs.slice(0, 3).map((e) => `${e.tag}.${e.cls.split(' ')[0]}#${e.right}`)) : ''}`;
for (const vw of widths) {
  for (const key of pages) {
    const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(withTheme(PRODUCTS[key]), { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const a = await page.evaluate(overflowFn);
    const cards = await scrollThrough(page);
    const b = await page.evaluate(overflowFn);
    let c = null;
    if (key !== 'p3p') {
      const btn = page.locator('form[action*="/cart/add"] button[type=submit]').first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await page.waitForTimeout(3000);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
      // narrow viewports: Escape may not close; click the overlay/close if still open
      const open = await page.evaluate(() => document.querySelector('cart-drawer')?.classList.contains('is-open'));
      if (open) { await page.evaluate(() => document.querySelector('cart-drawer')?.classList.remove('is-open')); await page.waitForTimeout(500); }
      c = await page.evaluate(overflowFn);
    }
    console.log(String(vw).padStart(4), key.padEnd(4), 'cards', cards, '| load:', fmt(a), '| scroll:', fmt(b), c ? '| after add: ' + fmt(c) : '');
    await ctx.close();
    await new Promise((r) => setTimeout(r, 1200));
  }
}
await browser.close();
