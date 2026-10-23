// T4a QA: drawer mechanism + flow, at the given widths. usage: node t4aq-drawer.mjs <previewUrl> [widths comma list]
import { chromium, parseArgs, loginState, newPage, seed, addFromProduct, sleep, H, hostState } from './t4aq-lib.mjs';

const { withTheme } = parseArgs();
const widths = (process.argv[3] || '1440,430,375').split(',').map(Number);
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = (...a) => console.log(...a);

for (const w of widths) {
  out(`\n===== width ${w} =====`);
  const { ctx, page, log } = await newPage(browser, state, w, w === 1440 ? 900 : 812);
  await page.goto(withTheme('/products/' + H.wax), { waitUntil: 'load' });
  out('closed      ', JSON.stringify(await hostState(page)));
  // Closed drawer must not be focusable / tabbable
  out('closed focusable inside drawer:', await page.evaluate(() => { const h = document.querySelector('cart-drawer'); return [...h.querySelectorAll('button,a,input')].filter((e) => e.offsetParent !== null).length; }));
  // Add to cart through the form -> drawer opens with fresh contents
  const [r] = await Promise.all([page.waitForResponse((x) => /\/cart\/add/.test(x.url())), page.locator('button[name="add"]').first().click()]);
  out('add status', r.status(), 'req post data has sections:', /sections/.test(r.request().postData() || ''));
  await sleep(700);
  const s1 = await hostState(page);
  out('after add   ', JSON.stringify(s1));
  out('items:', await page.locator('[data-cart-drawer-item]').count(), 'badge:', await page.locator('[data-header-cart-icon]').first().innerText().then((t) => t.trim()), '| aria-label:', await page.locator('[data-header-cart-icon]').first().getAttribute('aria-label'));
  out('heading levels:', await page.evaluate(() => [...document.querySelectorAll('cart-drawer h1,cart-drawer h2,cart-drawer h3,cart-drawer h4')].map((e) => e.tagName).join(',')), ' H1 count page:', await page.locator('h1').count());
  // Escape
  await page.keyboard.press('Escape'); await sleep(450);
  out('escape      ', JSON.stringify(await hostState(page)));
  // reopen with header icon
  await page.locator('[data-header-cart-icon]').first().click(); await sleep(450);
  const s2 = await hostState(page);
  out('icon open   ', JSON.stringify(s2));
  // outside click
  if (w - s2.panelW > 10) {
    await page.mouse.click(10, 400); await sleep(450);
    out('overlay click', JSON.stringify(await hostState(page)));
    await page.locator('[data-header-cart-icon]').first().click(); await sleep(450);
  } else {
    out('375: elementFromPoint(10,400) inside dialog:', await page.evaluate(() => !!document.elementFromPoint(10, 400).closest('[role="dialog"]')));
  }
  // close button
  await page.locator('button[data-cart-drawer-close]').first().click(); await sleep(450);
  out('close btn   ', JSON.stringify(await hostState(page)));
  // reopen + busy qty change (delay 1.5s)
  await page.locator('[data-header-cart-icon]').first().click(); await sleep(450);
  let reqs = 0;
  await page.route('**/cart/change*', async (route) => { reqs++; await sleep(1500); await route.continue(); });
  const q = page.locator('.cart-drawer__quantity-input').first();
  await q.fill('3'); await q.blur();
  await sleep(500);
  const busy = await page.evaluate(() => {
    const h = document.querySelector('cart-drawer'); const b = h.querySelector('[data-cart-drawer-busy]'); const sv = b.querySelector('svg');
    const p = h.querySelector('[role="dialog"]').getBoundingClientRect(); const r = sv.getBoundingClientRect();
    return { ariaBusy: h.getAttribute('aria-busy'), vis: getComputedStyle(b).visibility, svgW: r.width, svgH: r.height, cx: Math.round(r.left + r.width / 2 - (p.left + p.width / 2)), cy: Math.round(r.top + r.height / 2 - (p.top + p.height / 2)), anim: getComputedStyle(sv).animationName, bgBusy: getComputedStyle(b).backgroundColor };
  });
  out('busy during ', JSON.stringify(busy));
  await sleep(2200);
  const after = await hostState(page);
  out('busy after  ', JSON.stringify(after), 'requests:', reqs);
  out('qty value:', await page.locator('.cart-drawer__quantity-input').first().inputValue(), '| badge:', (await page.locator('[data-header-cart-icon]').first().innerText()).trim(), '| aria-label:', await page.locator('[data-header-cart-icon]').first().getAttribute('aria-label'), '| link aria-label equals badge count?');
  await page.unroute('**/cart/change*');
  // Add from the drawer-open state: add again from product with drawer open (drawer covers button, so close first? keep open: use evaluate click)
  // Remove -> empty
  await page.locator('.cart-drawer__item-remove').first().click(); await sleep(1200);
  out('empty text  :', JSON.stringify(await page.locator('#CartDrawer-CartItems').innerText()));
  out('empty link class:', await page.locator('#CartDrawer-CartItems a').first().getAttribute('class'), '| footer present:', await page.locator('[data-cart-drawer-footer]').count(), '| badge:', JSON.stringify((await page.locator('[data-header-cart-icon]').first().innerText()).trim()), '| aria-label:', await page.locator('[data-header-cart-icon]').first().getAttribute('aria-label'));
  out('empty state ', JSON.stringify(await hostState(page)));
  // Rapid open/close
  await page.keyboard.press('Escape'); await sleep(450);
  const icon = page.locator('[data-header-cart-icon]').first();
  for (let i = 0; i < 5; i++) { await icon.click({ noWaitAfter: true }); await sleep(30); await page.keyboard.press('Escape'); await sleep(30); }
  await sleep(700);
  out('rapid x5 (end closed attempt)', JSON.stringify(await hostState(page)));
  await ctx.close();
  out('LOG', JSON.stringify(log));
}
await browser.close();
