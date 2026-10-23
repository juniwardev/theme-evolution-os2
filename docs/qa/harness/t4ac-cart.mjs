// T4a Coder: cart page checks. C4a.9 (structure and behavior), C4a.10 (geometry/alignment), C4a.12 (cart overflow), C4a.16 (cart), C4a.21 (cart half, when radius proxy)
// Right edge: E_R = w - L (T3 deviation 3): the header's cart icon box overflows E_R at 320/375/390 on every build, so its rendered right edge is reported (R) but not asserted.
// Usage: node t4ac-cart.mjs <previewBase>
import { chromium, parseArgs, loginState, newPage, seedCart, overflowFn, sleep, HANDLES } from './t4ac-lib.mjs';

const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
let fails = 0;
const ok = (id, cond, detail = '') => { if (!cond) fails++; console.log(`${cond ? 'PASS' : 'FAIL'} ${id} ${detail}`); };
const ROOT = '[id^="shopify-section-template"][id$="__main"]';

// C4a.9 on two items
{
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await seedCart(page, withTheme, [HANDLES.wax, HANDLES.snow]);
  await page.goto(withTheme('/cart'), { waitUntil: 'load' });
  const s = await page.evaluate((ROOT) => {
    const r = document.querySelector(ROOT);
    const subs = [...r.querySelectorAll('form button[type=submit], form input[type=submit]')];
    const f = r.querySelector('form');
    return { tables: r.querySelectorAll('table').length, rows: r.querySelectorAll('[data-cart-page] ul > li').length, subs: subs.map((x) => (x.getAttribute('name') || '') + ':' + x.tagName), action: f.getAttribute('action'), method: f.method, h1: document.querySelectorAll('h1').length, labels: [...r.querySelectorAll('input[name="updates[]"]')].map((i) => document.querySelector(`label[for="${i.id}"]`)?.textContent.trim()), titles: [...r.querySelectorAll('li p')].map((p) => p.textContent.trim()) };
  }, ROOT);
  ok('C4a.9 structure', s.tables === 0 && s.rows === 2 && s.subs.length === 2 && s.subs[1].startsWith('checkout') && s.action === '/cart' && s.method === 'post' && s.h1 === 1 && s.labels.every((l) => /^Quantity for /.test(l)), JSON.stringify(s));
  await page.locator(`${ROOT} input[name="updates[]"]`).first().fill('2');
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.locator(`${ROOT} button.btn-secondary`).click()]);
  const q = await page.evaluate((ROOT) => ({ qty: [...document.querySelectorAll(ROOT + ' input[name="updates[]"]')].map((i) => i.value), badge: document.querySelector('[data-header-cart-icon]')?.textContent.trim(), aria: document.querySelector('[data-header-cart-icon]')?.getAttribute('aria-label') }), ROOT);
  ok('C4a.9 update posts quantities', q.qty[0] === '2' && /3/.test(q.badge || ''), JSON.stringify(q));
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.locator(`${ROOT} li a`).filter({ hasText: 'Remove' }).nth(1).click()]);
  const rows = await page.locator(`${ROOT} li`).count();
  ok('C4a.9 remove link', rows === 1, 'rows ' + rows);
  await ctx.close();
}
// empty
{
  const { ctx, page } = await newPage(browser, state, 375, 812);
  await page.goto(withTheme('/cart'), { waitUntil: 'load' });
  const e = await page.evaluate((ROOT) => { const r = document.querySelector(ROOT); return { forms: r.querySelectorAll('form').length, text: r.querySelector('p')?.textContent.trim(), cta: r.querySelector('a.btn-primary')?.getAttribute('href'), h1: document.querySelectorAll('h1').length }; }, ROOT);
  ok('C4a.9 empty', e.forms === 0 && e.text === 'Your cart is empty.' && /\/collections\/all$/.test(e.cta || '') && e.h1 === 1, JSON.stringify(e));
  await ctx.close();
}
// C4a.10 and C4a.12 with one item
{
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await seedCart(page, withTheme, [HANDLES.wax]);
  await page.goto(withTheme('/cart'), { waitUntil: 'load' });
  await sleep(300);
  for (const vw of [320, 375, 390, 430, 768, 1440, 1920]) {
    await page.setViewportSize({ width: vw, height: vw >= 1000 ? 900 : 812 });
    await sleep(300);
    const g = await page.evaluate((ROOT) => {
      const r1 = (n) => Math.round(n * 10) / 10;
      const r = document.querySelector(ROOT);
      const rc = (el) => el.getBoundingClientRect();
      const logo = document.querySelector('header a[href="/"]');
      const cart = document.querySelector('[data-header-cart-icon]');
      const h1 = r.querySelector('h1'), li = r.querySelector('li'), ul = r.querySelector('ul');
      const btns = [...r.querySelectorAll('form button')];
      const row = btns[0].parentElement;
      const img = li.querySelector('img');
      const input = r.querySelector('input[name="updates[]"]');
      const cs = getComputedStyle(h1);
      const content = r.querySelector('[data-cart-page]');
      return { L: r1(rc(logo).left), R: r1(rc(cart).right), h1L: r1(rc(h1).left), liL: r1(rc(li).left), ulR: r1(rc(ul).right), rowR: r1(rc(row).right), imgCol: r1(rc(img.parentElement.parentElement.classList.contains('w-20') ? img.parentElement.parentElement : img.parentElement).width), input: [r1(rc(input).width), r1(rc(input).height)], btnH: btns.map((b) => r1(rc(b).height)), btnW: btns.map((b) => r1(rc(b).width)), sameRow: Math.abs(rc(btns[0]).top - rc(btns[1]).top) < 2, fs: cs.fontSize, ff: cs.fontFamily.split(',')[0], tt: cs.textTransform, pt: getComputedStyle(content).paddingTop, imgAttrs: [img.getAttribute('width'), img.getAttribute('height')], nat: img.naturalWidth, imgWidthReq: /width=(\d+)/.exec(img.currentSrc)?.[1] };
    }, ROOT);
    const ov = await page.evaluate(overflowFn);
    const exp = { fs: vw < 768 ? '30px' : '36px', pt: vw < 768 ? '40px' : '64px' };
    const pass = Math.abs(g.h1L - g.L) <= 1 && Math.abs(g.liL - g.L) <= 1 && Math.abs(g.ulR - (vw - g.L)) <= 1 && Math.abs(g.rowR - (vw - g.L)) <= 1 && Math.abs(g.imgCol - 80) <= 1 && Math.abs(g.input[0] - 80) <= 1 && Math.abs(g.input[1] - 44) <= 1 && g.btnH.every((h) => h >= 48) && g.fs === exp.fs && g.ff === 'Oswald' && g.tt === 'uppercase' && g.pt === exp.pt;
    ok(`C4a.10 ${vw}`, pass, JSON.stringify(g));
    ok(`C4a.12 cart one ${vw}`, ov.sw - ov.vw <= 0 && ov.off.length === 0, JSON.stringify(ov));
  }
  await ctx.close();
}
await browser.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS');
