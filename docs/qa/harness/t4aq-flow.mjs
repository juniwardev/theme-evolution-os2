// T4a QA: second flow set. 3p 422, snow add, rapid open-close-open (R1), add-with-drawer-open, spinner on Add to cart, svg css size.
import { chromium, parseArgs, loginState, newPage, seed, sleep, H, hostState } from './t4aq-lib.mjs';

const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = (...a) => console.log(...a);

for (const w of [1440, 375]) {
  out(`\n===== width ${w} =====`);
  // A: snowboard add -> drawer + fresh contents, then wax added while drawer open? (button is behind panel at 375; use dispatch via form submit)
  let { ctx, page, log } = await newPage(browser, state, w, w === 1440 ? 900 : 812);
  await page.goto(withTheme('/products/' + H.snow), { waitUntil: 'load' });
  // spinner state during add (delay add 1.5s)
  await page.route('**/cart/add*', async (r) => { await sleep(1500); await r.continue(); });
  const btn = page.locator('button[name="add"]').first();
  const resP = page.waitForResponse((x) => /\/cart\/add/.test(x.url()));
  await btn.click(); await sleep(500);
  out('add loading:', JSON.stringify(await page.evaluate(() => {
    const b = document.querySelector('button[name="add"]'); const sv = b.querySelector('svg'); const wrap = sv && sv.parentElement;
    const br = b.getBoundingClientRect(); const r = sv && sv.getBoundingClientRect();
    return { wrapperClass: wrap && wrap.className, wrapDisplay: wrap && getComputedStyle(wrap).display, svgClass: sv && sv.getAttribute('class'), w: r && r.width, h: r && r.height, cx: r && Math.round(r.left + r.width / 2 - (br.left + br.width / 2)), cy: r && Math.round(r.top + r.height / 2 - (br.top + br.height / 2)), btnDisabled: b.disabled, ariaDisabled: b.getAttribute('aria-disabled'), cls: b.className.slice(0, 200) };
  })));
  const rr = await resP; out('snow add status', rr.status());
  await page.unroute('**/cart/add*');
  await sleep(900);
  out('after add', JSON.stringify(await hostState(page)));
  out('items', await page.locator('[data-cart-drawer-item]').count(), 'title:', await page.locator('[data-cart-drawer-item] a').first().innerText());
  // spinner svg offsetWidth
  out('busy svg css size:', await page.evaluate(() => { const s = document.querySelector('[data-cart-drawer-busy] svg'); const cs = getComputedStyle(s); return `${cs.width}x${cs.height}`; }));
  // Add 2nd product while drawer open: submit the form behind the drawer via requestSubmit
  await page.keyboard.press('Escape'); await sleep(450);
  await page.goto(withTheme('/products/' + H.wax), { waitUntil: 'load' });
  await page.locator('button[name="add"]').first().click(); await sleep(1200);
  out('after wax add: items', await page.locator('[data-cart-drawer-item]').count(), 'badge', (await page.locator('[data-header-cart-icon]').first().innerText()).trim(), await page.locator('[data-header-cart-icon]').first().getAttribute('aria-label'), 'total:', (await page.locator('[data-cart-drawer-footer]').innerText()).replace(/\s+/g, ' '));
  // checkout button style
  out('checkout:', JSON.stringify(await page.evaluate(() => { const c = document.querySelector('#CartDrawer-Checkout'); const s = getComputedStyle(c); const r = c.getBoundingClientRect(); return { bg: s.backgroundColor, color: s.color, ff: s.fontFamily.slice(0, 20), fw: s.fontWeight, tt: s.textTransform, h: r.height, w: r.width, br: s.borderTopLeftRadius }; })));
  // add while open: use requestSubmit on product form via evaluate (drawer open and covering)
  const st = await hostState(page);
  out('drawer open?', st.state);
  // remove all items one by one with quantity=0 via qty input
  await ctx.close();

  // B: rapid open-close-open sequences ending open
  ({ ctx, page, log } = await newPage(browser, state, w, w === 1440 ? 900 : 812));
  await page.goto(withTheme('/'), { waitUntil: 'load' });
  const icon = page.locator('[data-header-cart-icon]').first();
  await icon.click(); await sleep(450);
  await page.keyboard.press('Escape'); await sleep(100);
  await icon.click({ force: true }).catch(() => {}); await sleep(900);
  out('R1 close->reopen @100ms:', JSON.stringify(await hostState(page)));
  // open via script quick toggle
  await page.evaluate(() => { const d = document.querySelector('cart-drawer'); d.close(); setTimeout(() => d.open(), 50); });
  await sleep(900);
  out('R1 programmatic close,open@50ms:', JSON.stringify(await hostState(page)));
  await ctx.close();

  // C: 3p 422
  ({ ctx, page, log } = await newPage(browser, state, w, w === 1440 ? 900 : 812));
  await page.goto(withTheme('/products/' + H.p3p), { waitUntil: 'load' });
  const [r3] = await Promise.all([page.waitForResponse((x) => /\/cart\/add/.test(x.url())), page.locator('button[name="add"]').first().click()]);
  await sleep(900);
  out('3p add status', r3.status(), '| drawer:', JSON.stringify(await hostState(page)));
  out('3p error text:', JSON.stringify(await page.evaluate(() => { const e = document.querySelector('.product-form__error-message-wrapper, [id^="Product-Form-Error"], .product-form__error-message'); return e ? { hidden: e.hasAttribute('hidden'), text: e.textContent.trim().slice(0, 120) } : null; })));
  out('3p button state:', JSON.stringify(await page.evaluate(() => { const b = document.querySelector('button[name="add"]'); return { disabled: b.disabled, ariaDisabled: b.getAttribute('aria-disabled'), cls: /loading/.test(b.className) }; })));
  // drawer must still open from icon and show an empty cart
  await page.locator('[data-header-cart-icon]').first().click(); await sleep(500);
  out('open after 422:', JSON.stringify(await hostState(page)));
  out('empty text', JSON.stringify(await page.locator('#CartDrawer-CartItems').innerText()));
  await ctx.close();
  out('LOGS (non-beacon):', JSON.stringify([...log.console, ...log.pageerror, ...log.bad]));
}
await browser.close();
