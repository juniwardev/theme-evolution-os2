// Seed cart via fetch, open drawer, remove the line, read the badge. Usage: node t1fix-remove.mjs <previewBase>
import { chromium, parseArgs, loginState } from './t0-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(withTheme('/products/selling-plans-ski-wax'), { waitUntil: 'load' });
await page.evaluate(async () => { const v = await (await fetch('/products/selling-plans-ski-wax.js')).json(); await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: v.variants[0].id, quantity: 1 }] }) }); });
await page.goto(withTheme('/'), { waitUntil: 'load' });
await page.waitForTimeout(1500);
const badge = () => page.evaluate(() => { const b = document.querySelector('[data-header-cart-icon] [data-count]'); return b && { count: b.dataset.count, hidden: b.hidden }; });
console.log('before', JSON.stringify(await badge()));
await page.click('[data-header-cart-icon]'); await page.waitForTimeout(1500);
const rm = page.locator('cart-drawer a[href*="change"], cart-drawer cart-remove-button, cart-drawer button[name="remove"]').first();
console.log('remove controls', await rm.count());
await rm.click(); await page.waitForTimeout(2500);
console.log('after remove', JSON.stringify(await badge()));
await browser.close();
