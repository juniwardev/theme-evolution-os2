// Round 2: menu behavior, sticky, cart badge. Usage: node t1r2-behavior.mjs <previewBase>
import { chromium, parseArgs, loginState } from './t0-lib.mjs';
const { withTheme } = parseArgs();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const w of [375, 900]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 700 }, storageState: state });
  const page = await ctx.newPage();
  await page.goto(withTheme('/'), { waitUntil: 'load' }); await sleep(1000);
  const t = page.locator('theme-evolution-header-menu button');
  const st = async () => page.evaluate(() => ({ exp: document.querySelector('theme-evolution-header-menu button').getAttribute('aria-expanded'), label: document.querySelector('theme-evolution-header-menu button .sr-only').textContent.trim(), panelHidden: document.querySelector('.theme-evolution-header-menu__panel').hidden, focusInPanel: !!document.activeElement.closest('.theme-evolution-header-menu__panel') }));
  console.log(w, 'closed', JSON.stringify(await st()));
  await t.click(); await sleep(400); console.log(w, 'open', JSON.stringify(await st()));
  await page.keyboard.press('Escape'); await sleep(400); console.log(w, 'esc', JSON.stringify(await st()));
  await t.click(); await sleep(400);
  await page.mouse.click(w / 2, 650); await sleep(400); console.log(w, 'outside', JSON.stringify(await st()));
  await page.evaluate(() => window.scrollTo(0, 800)); await sleep(400);
  console.log(w, 'stickyTop', await page.evaluate(() => Math.round(document.querySelector('.theme-evolution-header-wrapper').getBoundingClientRect().top)));
  await ctx.close(); await sleep(700);
}
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: state });
const page = await ctx.newPage();
await page.goto(withTheme('/products/selling-plans-ski-wax'), { waitUntil: 'load' }); await sleep(1200);
const badge = () => page.evaluate(() => document.querySelector('[data-header-cart-icon] [data-count]').textContent.trim());
const before = await badge();
await page.locator('form[action*="/cart/add"] button[type=submit][name=add]').first().click().catch(e => console.log('click err', e.message.slice(0,80)));
await sleep(2500);
console.log('badge', before, '->', await badge(), 'drawerOpen', await page.evaluate(() => !!document.querySelector('cart-drawer.active, cart-drawer[open], .cart-drawer.active')));
await browser.close();
