// T4a Coder: drawer mechanism and flow checks. C4a.5 (state attributes, CSS scroll lock, backdrop), C4a.6 (cart flow incl. busy overlay),
// C4a.11 (rendered strings), C4a.16 (headings, img attrs, h1 count), C4a.17(b) (section render), the 3p 422 case (T2 C2.13).
// Usage: node t4ac-behavior.mjs <previewBase> [tree=head|base]   Prints PASS/FAIL lines.
import { chromium, parseArgs, loginState, newPage, seedCart, openDrawer, closeDrawer, drawerOpen, panel, sleep, HANDLES } from './t4ac-lib.mjs';

const tree = process.argv[3] || 'head';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
let fails = 0;
const ok = (id, cond, detail = '') => { if (!cond) fails++; console.log(`${cond ? 'PASS' : 'FAIL'} ${id} ${detail}`); };
const hostInfo = (page) => page.evaluate(() => { const h = document.querySelector('cart-drawer'); return { hidden: h.hasAttribute('hidden'), state: h.getAttribute('data-state'), busy: h.getAttribute('aria-busy'), cls: h.className, display: getComputedStyle(h).display, bodyOverflow: getComputedStyle(document.body).overflow, bodyStyle: document.body.getAttribute('style') }; });
const OLD = ['is-active', 'is-open', 'is-loading', 'is-empty'];

// C4a.5
for (const vw of [1440, 430, 375]) {
  const { ctx, page } = await newPage(browser, state, vw, 812);
  await seedCart(page, withTheme, [HANDLES.wax]);
  await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' });
  const W = Math.min(400, vw);
  let h = await hostInfo(page);
  ok(`C4a.5 closed ${vw}`, h.hidden && h.state === 'closed' && h.display === 'none' && !OLD.some((c) => h.cls.split(' ').includes(c)), JSON.stringify(h));
  const baseBodyOverflow = h.bodyOverflow;
  await openDrawer(page);
  h = await hostInfo(page);
  const pr = await panel(page).evaluate((e) => { const b = e.getBoundingClientRect(); return { r: b.right, w: b.width }; });
  const ov = await page.evaluate(() => { const o = document.querySelector('#CartDrawer').firstElementChild; const s = getComputedStyle(o); return { d: s.display, op: s.opacity }; });
  ok(`C4a.5 open ${vw}`, !h.hidden && h.state === 'open' && Math.abs(pr.r - vw) <= 1 && Math.abs(pr.w - W) <= 1 && ov.d === 'block' && ov.op === '1' && h.bodyOverflow === 'hidden' && (h.bodyStyle === null || !/overflow/.test(h.bodyStyle)), JSON.stringify({ h, pr, ov }));
  await page.keyboard.press('Escape'); await sleep(400);
  h = await hostInfo(page);
  ok(`C4a.5 escape ${vw}`, h.hidden && h.state === 'closed' && h.bodyOverflow === baseBodyOverflow, JSON.stringify(h));
  await openDrawer(page);
  if (vw - W > 10) {
    await page.mouse.click(10, 400); await sleep(450);
    ok(`C4a.5 overlay click closes ${vw}`, !(await drawerOpen(page)) && (await hostInfo(page)).hidden);
  } else {
    const inside = await page.evaluate(() => { const e = document.elementFromPoint(10, 400); return !!e && !!e.closest('[role="dialog"]'); });
    ok(`C4a.5 panel covers overlay ${vw}`, inside && ov.d === 'block' && ov.op === '1');
    await closeDrawer(page);
  }
  await openDrawer(page);
  await page.locator('button[data-cart-drawer-close]').click(); await sleep(450);
  h = await hostInfo(page);
  ok(`C4a.5 close button ${vw}`, h.hidden && h.state === 'closed' && h.bodyOverflow === baseBodyOverflow);
  await ctx.close();
}

// C4a.6 / C4a.11 / C4a.16 / C4a.17(b) on wax and the complete snowboard
for (const [name, handle] of [['wax', HANDLES.wax], ['snow', HANDLES.snow]]) {
  for (const vw of [1440, 375]) {
    const { ctx, page } = await newPage(browser, state, vw, 812);
    await page.goto(withTheme('/products/' + handle), { waitUntil: 'load' });
    const h1n = await page.locator('h1').count();
    await page.locator('button[name="add"]').first().click();
    await page.waitForResponse((r) => /\/cart\/add/.test(r.url()));
    await sleep(900);
    ok(`C4a.6 ${name} ${vw} add opens drawer`, await drawerOpen(page));
    const lab = await page.evaluate(() => ({ badge: document.querySelector('[data-header-cart-icon]')?.textContent.trim(), aria: document.querySelector('[data-header-cart-icon]')?.getAttribute('aria-label'), link: document.querySelector('a[data-cart-drawer-trigger]')?.getAttribute('aria-label') }));
    ok(`C4a.6 ${name} ${vw} badge`, /1/.test(lab.badge || '') && /1/.test(lab.aria || ''), JSON.stringify(lab));
    // strings (C4a.11 rendered half) and headings (C4a.16)
    const str = await page.evaluate(() => ({ close: document.querySelector('button[data-cart-drawer-close]')?.getAttribute('aria-label'), total: document.querySelector('[data-cart-drawer-footer] h3')?.textContent.trim(), label: document.querySelector('#CartDrawer-CartItems label')?.textContent.trim(), qaria: document.querySelector('#CartDrawer-CartItems input')?.getAttribute('aria-label'), heads: [...document.querySelectorAll('cart-drawer h1,cart-drawer h2,cart-drawer h3,cart-drawer h4')].map((e) => e.tagName), imgs: [...document.querySelectorAll('cart-drawer img')].map((i) => [i.getAttribute('width'), i.getAttribute('height')]), h1: document.querySelectorAll('h1').length }));
    ok(`C4a.11 ${name} ${vw} strings`, str.close === 'Close cart' && str.total === 'Total' && str.label === 'Quantity' && /^Quantity for /.test(str.qaria || ''), JSON.stringify(str));
    ok(`C4a.16 ${name} ${vw} headings/imgs/h1`, str.heads.join() === 'H2,H3' && str.imgs.every((i) => i[0] && i[1]) && str.h1 === 1 && h1n === 1, JSON.stringify(str));
    // busy overlay during a held /cart/change
    await page.route('**/cart/change*', async (route) => { await sleep(1500); await route.continue().catch(() => {}); });
    const input = page.locator('#CartDrawer-Form input[name="updates[]"]').first();
    // fill() leaves the field focused and dirty; blur() commits it with one native change event. A bare dispatchEvent('change') would
    // leave a second pending change that Chromium fires when the re-render removes the focused field, so the drawer would post twice.
    await input.fill('3'); await input.evaluate((e) => e.blur()); await sleep(350);
    const during = await page.evaluate(() => { const b = document.querySelector('[data-cart-drawer-busy]'); const s = b.querySelector('svg'); const bs = getComputedStyle(b); const sr = s.getBoundingClientRect(); const pr = document.querySelector('[role=dialog]').getBoundingClientRect(); const cs = getComputedStyle(s); return { busy: document.querySelector('cart-drawer').getAttribute('aria-busy'), vis: bs.visibility, w: cs.width, h: cs.height, anim: cs.animationName, cx: Math.abs(sr.left + sr.width / 2 - (pr.left + pr.width / 2)), cy: Math.abs(sr.top + sr.height / 2 - (pr.top + pr.height / 2)) }; });
    ok(`C4a.6 ${name} ${vw} busy during`, during.busy === 'true' && during.vis === 'visible' && during.w === '32px' && during.h === '32px' && during.anim === 'spin' && during.cx <= 1.5 && during.cy <= 1.5, JSON.stringify(during));
    await sleep(2200);
    await page.unroute('**/cart/change*');
    const after = await page.evaluate(() => ({ busy: document.querySelector('cart-drawer').getAttribute('aria-busy'), vis: getComputedStyle(document.querySelector('[data-cart-drawer-busy]')).visibility, badge: document.querySelector('[data-header-cart-icon]')?.textContent.trim(), aria: document.querySelector('[data-header-cart-icon]')?.getAttribute('aria-label'), open: document.querySelector('cart-drawer').getAttribute('data-state') }));
    ok(`C4a.6 ${name} ${vw} after`, after.busy === null && after.vis === 'hidden' && /3/.test(after.badge || '') && /3/.test(after.aria || '') && after.open === 'open', JSON.stringify(after));
    if (name === 'wax') {
      // remove -> empty state
      await page.locator('.cart-drawer__item-remove').first().click(); await sleep(1500);
      const emp = await page.evaluate(() => ({ text: document.querySelector('#CartDrawer-CartItems p')?.textContent.trim(), cta: document.querySelector('#CartDrawer-CartItems a.btn-primary')?.getAttribute('href'), badgeShown: (() => { const b = document.querySelector('[data-header-cart-icon] [class*="badge"], [data-header-cart-icon] span'); return b ? getComputedStyle(b).display : 'none'; })() }));
      ok(`C4a.6 ${name} ${vw} empty after remove`, emp.text === 'Your cart is empty.' && /collections\/all/.test(emp.cta || ''), JSON.stringify(emp));
      // C4a.17(b)
      const sec = await page.evaluate(async () => { const t = await (await fetch('/?section_id=cart-drawer')).text(); const d = new DOMParser().parseFromString(t, 'text/html'); return d.querySelectorAll('.cart-drawer__inner').length; });
      ok(`C4a.17b ${name} ${vw} section render`, sec === 1, 'inner count ' + sec);
    }
    await ctx.close();
  }
}

// 3p: 422 leaves the drawer closed and the button recovers (T2 C2.13)
{
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme('/products/' + HANDLES.p3p), { waitUntil: 'load' });
  const btn = page.locator('button[name="add"]').first();
  await btn.click();
  await page.waitForResponse((r) => /\/cart\/add/.test(r.url()));
  await sleep(900);
  const r = await page.evaluate(() => ({ loading: document.querySelector('button[name="add"]').classList.contains('loading'), spinHidden: document.querySelector('.loading__spinner').classList.contains('hidden') }));
  ok('C4a.6 3p 422 drawer closed, button recovered', !(await drawerOpen(page)) && !r.loading && r.spinHidden, JSON.stringify(r));
  await ctx.close();
}
await browser.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS');
