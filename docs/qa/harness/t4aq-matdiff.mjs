// Locates the base-vs-head pixel difference on /pages/the-material-archive at 1440 (x range) and names the element under it.
import { readFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t4aq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const pg = await browser.newPage(); await pg.goto('about:blank');
const D = 'docs/qa/screenshots';
const r = await pg.evaluate(async ([A, B]) => {
  const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
  const [ia, ib] = await Promise.all([load(A), load(B)]);
  const get = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
  const da = get(ia), db = get(ib); let minX = 1e9, maxX = -1; const cols = new Set();
  for (let y = 1200; y < 1215; y++) for (let x = 0; x < ia.width; x++) { const p = (y * ia.width + x) * 4; if (da[p] !== db[p] || da[p + 1] !== db[p + 1] || da[p + 2] !== db[p + 2]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); cols.add(`${da[p]},${da[p+1]},${da[p+2]}>${db[p]},${db[p+1]},${db[p+2]}`); } }
  return { minX, maxX, sample: [...cols].slice(0, 4) };
}, [readFileSync(`${D}/t4aq-base-mat-1440.png`).toString('base64'), readFileSync(`${D}/t4aq-head-mat-1440.png`).toString('base64')]);
console.log(JSON.stringify(r));
const { state } = await loginState(browser, withTheme);
const { ctx, page } = await newPage(browser, state, 1440, 900);
await page.goto(withTheme('/pages/the-material-archive'), { waitUntil: 'load' });
await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); } scrollTo(0, 0); });
console.log(await page.evaluate(([x, y]) => { scrollTo(0, y - 300); const e = document.elementsFromPoint(x, 300).slice(0, 4).map((e) => e.tagName + '.' + String(e.className).slice(0, 50)); return e; }, [Math.round((r.minX + r.maxX) / 2), 1207]));
await ctx.close(); await browser.close();
