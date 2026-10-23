// T2 QA: after the palette proxy run, confirm the dev theme reads the default --color-foreground again, and re-run a
// quick overflow check. Usage: node t2q-restore.mjs <previewBase>
import { chromium, parseArgs, loginState, PRODUCTS } from './t2c-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const ctx = await browser.newContext({ storageState: state, viewport: { width: 375, height: 800 } });
const page = await ctx.newPage();
for (let i = 0; i < 6; i++) {
  await page.goto(withTheme(PRODUCTS.wax), { waitUntil: 'load' });
  const r = await page.evaluate(() => ({ fg: getComputedStyle(document.documentElement).getPropertyValue('--color-foreground').trim(), x: document.documentElement.scrollWidth - innerWidth, spot: document.querySelectorAll('[data-material-spotlight]').length }));
  console.log(JSON.stringify(r));
  if (r.fg === '#333333') break;
  await page.waitForTimeout(8000);
}
await browser.close();
