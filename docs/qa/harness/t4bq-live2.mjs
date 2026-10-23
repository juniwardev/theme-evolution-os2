// Follow-up read-only probe on live: which URLs hit extensions.shopifycdn.com / shopify-assets, and the shadow host tag.
import { chromium, loginState } from './t0-lib.mjs';
const origin = 'https://theme-evolution-os2.myshopify.com';
const browser = await chromium.launch();
const { state } = await loginState(browser, (p) => origin + p);
const ctx = await browser.newContext({ storageState: state });
const page = await ctx.newPage();
const urls = [];
page.on('request', (r) => { if (/extensions\.shopifycdn|shopifycdn\.com/.test(r.url())) urls.push(r.url().slice(0, 160)); });
await page.goto(origin + '/products/selling-plans-ski-wax', { waitUntil: 'load' });
await page.waitForTimeout(2500);
console.log(urls.join('\n'));
console.log(await page.evaluate(() => [...document.querySelectorAll('*')].filter((e) => e.shadowRoot).map((e) => e.tagName + '#' + e.id + '.' + e.className).join(',')));
await ctx.close(); await browser.close();
