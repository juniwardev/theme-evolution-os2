// T4b C4b.27: T4a cart-flow subset after T4b (drawer open on add to cart, update to 3, remove to the empty state) on wax at 1440 and 375,
// plus the drawer mechanism (Escape closes). Selectors from t4ac-behavior. Quantity change uses fill() then blur() (T4a deviation 4).
// Usage: node t4bc-regress.mjs <previewBase>
import { chromium, parseArgs, loginState, newPage, sleep, HANDLES } from './t4bc-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
let fails = 0;
const ok = (id, c, d = '') => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'} ${id} ${d}`); };
const st = (page) => page.evaluate(() => { const h = document.querySelector('cart-drawer'); return { state: h.getAttribute('data-state'), hidden: h.hasAttribute('hidden'), busy: h.getAttribute('aria-busy'), badge: document.querySelector('[data-header-cart-icon]')?.textContent.trim() }; });
for (const vw of [1440, 375]) {
  const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
  await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' });
  const [resp] = await Promise.all([page.waitForResponse((r) => /\/cart\/add/.test(r.url())), page.locator('button[name="add"]').first().click()]);
  await sleep(1200);
  let s = await st(page);
  ok(`C4b.27 ${vw} add ${resp.status()} drawer opens`, resp.ok() && s.state === 'open' && !s.hidden, JSON.stringify(s));
  const input = page.locator('#CartDrawer-Form input[name="updates[]"]').first();
  await input.fill('3');
  await input.evaluate((e) => e.blur());
  await sleep(2500);
  s = await st(page);
  ok(`C4b.27 ${vw} update to 3`, /3/.test(s.badge || '') && s.busy === null && s.state === 'open', JSON.stringify(s));
  await page.locator('.cart-drawer__item-remove').first().click();
  await sleep(2000);
  const emp = await page.evaluate(() => ({ text: document.querySelector('#CartDrawer-CartItems p')?.textContent.trim(), cta: document.querySelector('#CartDrawer-CartItems a.btn-primary')?.getAttribute('href') }));
  ok(`C4b.27 ${vw} remove to empty`, emp.text === 'Your cart is empty.' && /collections\/all/.test(emp.cta || ''), JSON.stringify(emp));
  await page.keyboard.press('Escape');
  await sleep(500);
  s = await st(page);
  ok(`C4b.27 ${vw} Escape closes`, s.state !== 'open' || s.hidden, JSON.stringify(s));
  await ctx.close();
}
await browser.close();
console.log(fails ? `FAILURES ${fails}` : 'ALL PASS');
