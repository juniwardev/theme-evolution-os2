// Regression on T1-T4a surfaces: header/footer facts, PDP shots, drawer add/update/remove. Usage: node t4bq-regress.mjs <previewBase> <tag>
import { chromium, parseArgs, loginState, newPage, sleep } from './t4bq-lib.mjs';
const { withTheme } = parseArgs();
const tag = process.argv[3] || 'head';
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
let fails = 0;
const ok = (id, c, d = '') => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'} ${id} ${d}`); };
const drawer = (page) => page.evaluate(() => { const h = document.querySelector('cart-drawer'); return { state: h?.getAttribute('data-state'), hidden: h?.hasAttribute('hidden'), busy: h?.getAttribute('aria-busy'), qty: document.querySelector('#CartDrawer-Form input[name="updates[]"]')?.value }; });
for (const [vw, vh] of [[1440, 900], [375, 667]]) {
  const { ctx, page } = await newPage(browser, state, vw, vh);
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 120)));
  for (const [name, path] of [['home', '/'], ['wax', '/products/selling-plans-ski-wax'], ['snow', '/products/the-complete-snowboard'], ['p3p', '/products/the-3p-fulfilled-snowboard'], ['cart', '/cart']]) {
    await page.goto(withTheme(path), { waitUntil: 'load' });
    await sleep(1200);
    const f = await page.evaluate(() => ({ header: Math.round(document.querySelector('header')?.getBoundingClientRect().height || 0), footer: Math.round(document.querySelector('footer')?.getBoundingClientRect().height || 0), nav: document.querySelectorAll('header a').length, h1: document.querySelectorAll('h1').length }));
    console.log(vw, name, JSON.stringify(f));
    await page.screenshot({ path: `docs/qa/screenshots/t4bq-${tag}-${name}-${vw}.png`, fullPage: true });
  }
  await page.goto(withTheme('/products/selling-plans-ski-wax'), { waitUntil: 'load' });
  const [resp] = await Promise.all([page.waitForResponse((r) => /\/cart\/add/.test(r.url())), page.locator('button[name="add"]').first().click()]);
  await sleep(1500);
  let s = await drawer(page);
  ok(`${vw} add ${resp.status()} drawer open`, resp.ok() && s.state === 'open' && !s.hidden, JSON.stringify(s));
  const input = page.locator('#CartDrawer-Form input[name="updates[]"]').first();
  await input.fill('3'); await input.evaluate((e) => e.blur()); await sleep(2500);
  s = await drawer(page);
  ok(`${vw} update to 3`, s.qty === '3' && s.busy === null, JSON.stringify(s));
  await page.screenshot({ path: `docs/qa/screenshots/t4bq-${tag}-drawer-${vw}.png` });
  await page.locator('.cart-drawer__item-remove').first().click(); await sleep(2000);
  const emp = await page.evaluate(() => document.querySelector('#CartDrawer-CartItems p')?.textContent.trim());
  ok(`${vw} remove -> empty`, emp === 'Your cart is empty.', emp);
  await page.keyboard.press('Escape'); await sleep(500);
  s = await drawer(page);
  ok(`${vw} Escape closes`, s.state !== 'open' || s.hidden, JSON.stringify(s));
  console.log(vw, 'console errors:', errs.length ? errs.join(' | ') : 'none');
  await ctx.close();
}
await browser.close();
console.log(fails ? 'FAILURES ' + fails : 'ALL PASS');
