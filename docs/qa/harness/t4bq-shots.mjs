// Screenshots + pixel diff. Capture: node t4bq-shots.mjs <previewBase> <label> [names]   Diff: node t4bq-shots.mjs diff <a> <b> [names]
import { readFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t4bq-lib.mjs';
const DIR = 'docs/qa/screenshots';
const PAGES = { home: '/', p3p: '/products/the-3p-fulfilled-snowboard', wax: '/products/selling-plans-ski-wax', snow: '/products/the-complete-snowboard', cart: '/cart', coll: '/collections/all', colls: '/collections', search: '/search?q=snowboard', nores: '/search?q=zzzznomatch', mat: '/pages/the-material-archive', p404: '/pages/tailwind-qa-missing', page: '/pages/the-balanced-face-test-page', blog: '/blogs/news', pw: '/password' };
const HIDE = '#preview-bar-iframe, #PBarNextFrameWrapper, iframe[id^="preview-bar"] { display: none !important }';
const WIDTHS = (process.env.W || '1440,375').split(',').map(Number);
if (process.argv[2] === 'diff') {
  const [, a, b, names] = process.argv.slice(2);
  const browser = await chromium.launch(); const page = await browser.newPage(); await page.goto('about:blank');
  for (const k of (names ? names.split(',') : Object.keys(PAGES))) for (const w of WIDTHS) {
    const A = readFileSync(`${DIR}/t4bq-${a}-${k}-${w}.png`).toString('base64'), B = readFileSync(`${DIR}/t4bq-${b}-${k}-${w}.png`).toString('base64');
    const r = await page.evaluate(async ([A, B]) => {
      const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
      const [ia, ib] = await Promise.all([load(A), load(B)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { size: [ia.width, ia.height, ib.width, ib.height] };
      const get = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
      const da = get(ia), db = get(ib); let n = 0, minY = 1e9, maxY = -1, minX = 1e9, maxX = -1;
      for (let p = 0; p < da.length; p += 4) if (da[p] !== db[p] || da[p + 1] !== db[p + 1] || da[p + 2] !== db[p + 2]) { n++; const y = Math.floor(p / 4 / ia.width), x = (p / 4) % ia.width; minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
      return { diffPixels: n, yRange: n ? [minY, maxY] : null, xRange: n ? [minX, maxX] : null };
    }, [A, B]);
    console.log(k.padEnd(7), w, JSON.stringify(r));
  }
  await browser.close(); process.exit(0);
}
const [, label, names] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const w of WIDTHS) {
  const { ctx, page } = await newPage(browser, state, w, w >= 1000 ? 900 : 812);
  for (const k of (names ? names.split(',') : Object.keys(PAGES))) {
    await page.goto(withTheme(PAGES[k]), { waitUntil: 'load' });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } scrollTo(0, 0); });
    await sleep(500);
    await page.addStyleTag({ content: HIDE }); await sleep(250);
    await page.screenshot({ path: `${DIR}/t4bq-${label}-${k}-${w}.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
console.log('shots done', label);
