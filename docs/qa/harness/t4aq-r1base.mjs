// R1 baseline: programmatic close then open 50 ms later; reports class/attribute state and body overflow. Works on base and head.
import { chromium, parseArgs, loginState, newPage, sleep } from './t4aq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const { ctx, page } = await newPage(browser, state, 1440, 900);
await page.goto(withTheme('/'), { waitUntil: 'load' });
await page.locator('[data-header-cart-icon]').first().click(); await sleep(500);
await page.evaluate(() => { const d = document.querySelector('cart-drawer'); d.close(); setTimeout(() => d.open(), 50); });
await sleep(900);
console.log(JSON.stringify(await page.evaluate(() => { const d = document.querySelector('cart-drawer'); const p = d.querySelector('[role="dialog"]').getBoundingClientRect(); return { cls: d.className, hiddenAttr: d.hasAttribute('hidden'), state: d.getAttribute('data-state'), display: getComputedStyle(d).display, bodyOverflow: getComputedStyle(document.body).overflow, bodyStyle: document.body.getAttribute('style'), panelW: p.width }; })));
await ctx.close(); await browser.close();
