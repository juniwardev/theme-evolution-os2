// T4a Coder: C4a.12 (page overflow on /cart states and the open drawer at 320/375) and C4a.22 regression overflow on the other pages.
// Usage: node t4ac-overflow.mjs <previewBase>
import { chromium, parseArgs, loginState, newPage, seedCart, openDrawer, overflowFn, panel, sleep, HANDLES } from './t4ac-lib.mjs';

const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
let fails = 0;
const ok = (id, cond, detail = '') => { if (!cond) fails++; console.log(`${cond ? 'PASS' : 'FAIL'} ${id} ${detail}`); };

for (const [st, handles] of [['empty', []], ['one', [HANDLES.wax]], ['two', [HANDLES.wax, HANDLES.snow]]]) {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await seedCart(page, withTheme, handles);
  await page.goto(withTheme('/cart'), { waitUntil: 'load' });
  for (const vw of [320, 375, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width: vw, height: vw >= 1000 ? 900 : 812 });
    await sleep(250);
    const o = await page.evaluate(overflowFn);
    ok(`C4a.12 /cart ${st} ${vw}`, o.sw <= o.vw && o.off.length === 0, JSON.stringify(o));
  }
  for (const vw of [320, 375]) {
    await page.setViewportSize({ width: vw, height: 812 });
    await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' });
    await openDrawer(page);
    const r = await panel(page).evaluate((e) => { const b = e.getBoundingClientRect(); return [b.left, b.right]; });
    const o = await page.evaluate(overflowFn);
    ok(`C4a.12 drawer open ${st} ${vw}`, Math.abs(r[0]) <= 1 && Math.abs(r[1] - vw) <= 1 && o.sw <= o.vw && o.off.length === 0, JSON.stringify({ r, o }));
  }
  await ctx.close();
}
{
  const { ctx, page } = await newPage(browser, state, 375, 812);
  for (const path of ['/', '/products/' + HANDLES.p3p, '/products/' + HANDLES.wax, '/products/' + HANDLES.snow, '/collections/all', '/collections', '/search?q=snowboard', '/pages/the-material-archive', '/pages/tailwind-qa-missing']) {
    for (const vw of [375, 1440]) {
      await page.setViewportSize({ width: vw, height: vw >= 1000 ? 900 : 812 });
      await page.goto(withTheme(path), { waitUntil: 'load' });
      await sleep(250);
      const o = await page.evaluate(overflowFn);
      console.log(`INFO regress overflow ${path} ${vw}: sw-vw=${o.sw - o.vw} offs=${o.off.length}`);
    }
  }
  await ctx.close();
}
await browser.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS');
