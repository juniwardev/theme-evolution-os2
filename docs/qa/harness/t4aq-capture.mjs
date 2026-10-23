// T4a QA capture: regression screenshots + drawer measurements for one tree.
// usage: node t4aq-capture.mjs <previewUrl> <label> <outDir>
// Drawer measurement reuses the Coder's in-page measureDrawerFn (element finder + property list); comparison (t4aq-diff.mjs) is QA's own.
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, seed, sleep, H } from './t4aq-lib.mjs';
import { measureDrawerFn, PROPS } from './t4ac-lib.mjs';

const label = process.argv[3];
const outDir = process.argv[4];
const { withTheme } = parseArgs();
const SHOT = 'docs/qa/screenshots';
mkdirSync(SHOT, { recursive: true });
const PAGES = { home: '/', p3p: '/products/' + H.p3p, wax: '/products/' + H.wax, snow: '/products/' + H.snow, coll: '/collections/all', colls: '/collections', search: '/search?q=snowboard', mat: '/pages/the-material-archive', p404: '/pages/tailwind-qa-missing' };
const HIDE = '#preview-bar-iframe, #PBarNextFrameWrapper, iframe[id^="preview-bar"] { display: none !important }';
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const result = { drawer: {}, wrappers: {} };

const shot = async (page, name, w, full = true) => { await page.addStyleTag({ content: HIDE }); await sleep(250); await page.screenshot({ path: `${SHOT}/t4aq-${label}-${name}-${w}.png`, fullPage: full }); };

for (const w of [1440, 375]) {
  const vh = w >= 1000 ? 900 : 812;
  const { ctx, page } = await newPage(browser, state, w, vh);
  for (const [k, path] of Object.entries(PAGES)) {
    await page.goto(withTheme(path), { waitUntil: 'load' });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } scrollTo(0, 0); });
    await sleep(300);
    await shot(page, k, w);
    if (k === 'coll' || k === 'search' || k === 'colls') {
      result.wrappers[`${k}@${w}`] = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => i.closest('#MainContent, main')).slice(0, 60).map((i) => {
        const p = i.parentElement; const a = p.getBoundingClientRect(); const b = i.getBoundingClientRect(); const cp = getComputedStyle(p); const ci = getComputedStyle(i);
        return { cls: p.className, p: [a.left, a.top + scrollY, a.width, a.height].map((n) => Math.round(n * 10) / 10), i: [b.left, b.top + scrollY, b.width, b.height].map((n) => Math.round(n * 10) / 10), pd: [cp.display, cp.position, cp.overflow, cp.width, cp.height], id: [ci.display, ci.width, ci.height] };
      }));
    }
  }
  await ctx.close();
  const c2 = await browser.newContext({ viewport: { width: w, height: vh } });
  const p2 = await c2.newPage();
  await p2.goto(withTheme('/password'), { waitUntil: 'load' });
  await shot(p2, 'pw', w);
  await c2.close();

  for (const [st, handles] of [['empty', []], ['one', [H.wax]], ['two', [H.snow, H.wax]]]) {
    const { ctx: c3, page: p3 } = await newPage(browser, state, w, vh);
    if (handles.length) await seed(p3, withTheme, handles);
    await p3.goto(withTheme('/products/' + H.wax), { waitUntil: 'load' });
    await p3.locator('[data-header-cart-icon]').first().click();
    await sleep(700);
    result.drawer[`${st}@${w}`] = await p3.evaluate(measureDrawerFn, PROPS);
    await p3.addStyleTag({ content: HIDE });
    await p3.screenshot({ path: `${SHOT}/t4aq-${label}-drawer-${st}-${w}.png` });
    await p3.goto(withTheme('/cart'), { waitUntil: 'load' });
    await sleep(300);
    await shot(p3, 'cart-' + st, w);
    await c3.close();
  }
}
writeFileSync(`${outDir}/capture-${label}.json`, JSON.stringify(result));
await browser.close();
console.log('capture done', label);
