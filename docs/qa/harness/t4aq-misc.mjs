// Misc: add while drawer open (keyboard), tab order with drawer open, overflow across regression pages.
import { chromium, parseArgs, loginState, newPage, seed, sleep, H, hostState } from './t4aq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);

{
  const { ctx, page, log } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme('/products/' + H.wax), { waitUntil: 'load' });
  const btn = page.locator('button[name="add"]').first();
  await btn.click(); await sleep(1200);
  console.log('after 1st add focus on ATC?', await page.evaluate(() => document.activeElement.name), 'drawer', (await hostState(page)).state);
  await page.keyboard.press('Enter'); await sleep(1500);
  console.log('after Enter (add with drawer open): qty', await page.locator('.cart-drawer__quantity-input').first().inputValue(), '| badge', (await page.locator('[data-header-cart-icon]').first().innerText()).trim(), '| state', (await hostState(page)).state, '| items', await page.locator('[data-cart-drawer-item]').count());
  const tabs = [];
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); tabs.push(await page.evaluate(() => { const e = document.activeElement; return (e.closest('cart-drawer') ? 'IN-DRAWER ' : 'PAGE ') + e.tagName + ' ' + (e.getAttribute('aria-label') || e.textContent.trim().slice(0, 18)); })); }
  console.log('tab sequence from ATC with drawer open:', JSON.stringify(tabs));
  // Escape with focus in qty input
  await page.locator('.cart-drawer__quantity-input').first().focus();
  await page.keyboard.press('Escape'); await sleep(500);
  console.log('Escape from qty input ->', (await hostState(page)).state, 'hidden', (await hostState(page)).hidden);
  console.log('console (non-analytics):', JSON.stringify([...log.console.filter((x) => !/monorail|Failed to fetch/.test(x)), ...log.pageerror]));
  await ctx.close();
}

const pages = ['/', '/products/' + H.p3p, '/products/' + H.wax, '/products/' + H.snow, '/collections/all', '/collections', '/search?q=snowboard', '/pages/the-material-archive', '/pages/tailwind-qa-missing', '/cart'];
const widths = [320, 375, 390, 430, 768, 1440];
const rows = [];
for (const w of widths) {
  const { ctx, page } = await newPage(browser, state, w, 812);
  const r = {};
  for (const p of pages) { await page.goto(withTheme(p), { waitUntil: 'load' }); r[p] = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); }
  rows.push([w, r]);
  await ctx.close();
}
console.log('horizontal overflow px (scrollWidth - clientWidth), head:');
for (const [w, r] of rows) console.log(String(w).padEnd(5), Object.entries(r).filter(([, v]) => v !== 0).map(([k, v]) => `${k}=${v}`).join('  ') || 'all 0');
await browser.close();
