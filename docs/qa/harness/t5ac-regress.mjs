// T5a C5a.22: regression set. Drawer flow on wax at 1440 and 375 (add, update to 3, remove, Escape), header menu at 375 (open, Escape, outside click),
// the material accordion's API content on p3p (S4), the header count after add, and the tooltip on PXP when the proxy page is served (arg 2 = "px").
// Usage: node t5ac-regress.mjs <previewBase> [px]
import { chromium, parseArgs, loginState, newPage, sleep, HANDLES } from './t5ac-lib.mjs';
const { withTheme } = parseArgs();
const px = process.argv[3] === 'px';
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
let fails = 0;
const ok = (id, c, d = '') => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'} ${id} ${d}`); };
const st = (page) => page.evaluate(() => { const h = document.querySelector('cart-drawer'); return { state: h.getAttribute('data-state'), hidden: h.hasAttribute('hidden'), busy: h.getAttribute('aria-busy'), badge: document.querySelector('[data-header-cart-icon]')?.getAttribute('aria-label') }; });
if (!px) {
  for (const vw of [1440, 375]) {
    const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
    await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' }); await sleep(1200);
    const [resp] = await Promise.all([page.waitForResponse((r) => /\/cart\/add/.test(r.url())), page.locator('button[name="add"]').first().click()]);
    await sleep(1200);
    let s = await st(page);
    ok(`C5a.22 ${vw} add ${resp.status()} drawer opens, header count`, resp.ok() && s.state === 'open' && !s.hidden && /1/.test(s.badge || ''), JSON.stringify(s));
    const input = page.locator('#CartDrawer-Form input[name="updates[]"]').first();
    await input.fill('3'); await input.evaluate((e) => e.blur()); await sleep(2500);
    s = await st(page);
    ok(`C5a.22 ${vw} update to 3`, /3/.test(s.badge || '') && s.busy === null && s.state === 'open', JSON.stringify(s));
    await page.locator('.cart-drawer__item-remove').first().click(); await sleep(2000);
    const emp = await page.evaluate(() => ({ text: document.querySelector('#CartDrawer-CartItems p')?.textContent.trim(), cta: document.querySelector('#CartDrawer-CartItems a.btn-primary')?.getAttribute('href') }));
    ok(`C5a.22 ${vw} remove to empty`, emp.text === 'Your cart is empty.' && /collections\/all/.test(emp.cta || ''), JSON.stringify(emp));
    await page.keyboard.press('Escape'); await sleep(500);
    s = await st(page);
    ok(`C5a.22 ${vw} Escape closes`, s.state !== 'open' || s.hidden, JSON.stringify(s));
    await ctx.close();
  }
  { // header menu at 375
    const { ctx, page } = await newPage(browser, state, 375, 812);
    await page.goto(withTheme('/'), { waitUntil: 'load' }); await sleep(1500);
    const toggle = page.locator('.theme-evolution-header-menu__toggle').first();
    const panel = () => page.evaluate(() => { const t = document.querySelector('.theme-evolution-header-menu__toggle'); return { exp: t.getAttribute('aria-expanded'), open: !!document.querySelector('theme-evolution-header-menu [data-state="open"]') }; });
    await toggle.click(); await sleep(500); let s = await panel();
    ok('C5a.22 menu opens', s.exp === 'true' && s.open, JSON.stringify(s));
    await page.keyboard.press('Escape'); await sleep(500); s = await panel();
    ok('C5a.22 menu Escape closes', s.exp === 'false' && !s.open, JSON.stringify(s));
    await toggle.click(); await sleep(500);
    // a point outside <theme-evolution-header-menu> that isn't a link: scan the header row for the page background or the header's own box
    const pt = await page.evaluate(() => { const m = document.querySelector('theme-evolution-header-menu'); for (let y = 8; y < 60; y += 8) for (let x = 5; x < 360; x += 5) { const e = document.elementFromPoint(x, y); if (e && !m.contains(e) && !e.closest('a, button')) return [x, y, e.tagName]; } return null; });
    if (pt) await page.mouse.click(pt[0], pt[1]);
    await sleep(500); s = await panel();
    ok('C5a.22 menu outside click closes', s.exp === 'false' && !s.open, JSON.stringify(s));
    await ctx.close();
  }
  { // accordion API content (S4)
    const { ctx, page } = await newPage(browser, state, 1440, 900);
    await page.goto(withTheme('/products/' + HANDLES.p3p), { waitUntil: 'load' }); await sleep(1200);
    await page.locator('#MaterialAccordion summary').click();
    const got = await page.waitForSelector('#material-data-container .material-accordion__story', { timeout: 10000 }).then(() => true).catch(() => false);
    ok('C5a.22 accordion opens and API content renders', got);
    await ctx.close();
  }
} else {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme('/products/' + HANDLES.p3p), { waitUntil: 'load' }); await sleep(1200);
  await page.locator('.eco-tooltip-trigger').first().hover();
  const got = await page.waitForSelector('.eco-tooltip.is-visible', { timeout: 6000 }).then(() => true).catch(() => false);
  ok('C5a.22 tooltip shows on hover (PXP)', got);
  await ctx.close();
}
await browser.close();
console.log(fails ? `FAILURES ${fails}` : 'ALL PASS');
