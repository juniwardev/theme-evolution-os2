// T4b Coder: C4b.27 screenshots and pixel diff, plus the drawer/cart review shots (plan section 10 "Record").
// Capture: node t4ac-shots.mjs <previewBase> <label>        -> docs/qa/screenshots/t4b-<label>-<name>-<w>.png (gitignored)
// Diff:    node t4ac-shots.mjs diff <baseLabel> <headLabel>
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, seedCart, sleep, HANDLES } from './t4bc-lib.mjs';

const DIR = 'docs/qa/screenshots';
mkdirSync(DIR, { recursive: true });
const PAGES = { home: '/', p3p: '/products/' + HANDLES.p3p, wax: '/products/' + HANDLES.wax, snow: '/products/' + HANDLES.snow, coll: '/collections/all', colls: '/collections', search: '/search?q=snowboard', mat: '/pages/the-material-archive', p404: '/pages/tailwind-qa-missing', page: '/pages/contact', blog: '/blogs/news' };
const HIDE = '#preview-bar-iframe, #PBarNextFrameWrapper, iframe[id^="preview-bar"] { display: none !important }';

if (process.argv[2] === 'diff') {
  const [, a, b] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('about:blank');
  for (const k of [...Object.keys(PAGES), 'pw', 'cart-one']) {
    for (const w of [1440, 375]) {
      const A = readFileSync(`${DIR}/t4b-${a}-${k}-${w}.png`).toString('base64');
      const B = readFileSync(`${DIR}/t4b-${b}-${k}-${w}.png`).toString('base64');
      const r = await page.evaluate(async ([A, B]) => {
        const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
        const [ia, ib] = await Promise.all([load(A), load(B)]);
        if (ia.width !== ib.width || ia.height !== ib.height) return { size: [ia.width, ia.height, ib.width, ib.height] };
        const get = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
        const da = get(ia), db = get(ib);
        let n = 0, minY = 1e9, maxY = -1;
        for (let p = 0; p < da.length; p += 4) if (da[p] !== db[p] || da[p + 1] !== db[p + 1] || da[p + 2] !== db[p + 2]) { n++; const y = Math.floor(p / 4 / ia.width); if (y < minY) minY = y; if (y > maxY) maxY = y; }
        return { diffPixels: n, yRange: n ? [minY, maxY] : null };
      }, [A, B]);
      console.log(k.padEnd(7), w, JSON.stringify(r));
    }
  }
  await browser.close();
  process.exit(0);
}

const [previewBase, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
const shot = async (page, name, w) => { await page.addStyleTag({ content: HIDE }); await sleep(250); await page.screenshot({ path: `${DIR}/t4b-${label}-${name}-${w}.png`, fullPage: true }); };
for (const w of [1440, 375]) {
  const { ctx, page } = await newPage(browser, state, w, w >= 1000 ? 900 : 812);
  for (const [k, path] of Object.entries(PAGES)) {
    await page.goto(withTheme(path), { waitUntil: 'load' });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } scrollTo(0, 0); });
    await sleep(300);
    await shot(page, k, w);
  }
  await ctx.close();
  // /password without the session.
  const c2 = await browser.newContext({ viewport: { width: w, height: w >= 1000 ? 900 : 812 } });
  const p2 = await c2.newPage();
  await p2.goto(withTheme('/password'), { waitUntil: 'load' });
  await shot(p2, 'pw', w);
  await c2.close();
  { const { ctx: c3, page: p3 } = await newPage(browser, state, w, w >= 1000 ? 900 : 812);
    await seedCart(p3, withTheme, [HANDLES.wax]);
    await p3.goto(withTheme('/cart'), { waitUntil: 'load' });
    await sleep(300);
    await shot(p3, 'cart-one', w);
    await c3.close(); }
}
await browser.close();
console.log('shots done', label);
