// QA regression sweep for T6a: node t6aqa-regress.mjs <previewUrl> <outJson> <shotDir>
// Per page and viewport: theme id, h1 count, horizontal overflow, console errors/warnings, failed requests, images missing width/height.
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, open, sleep } from './t6ac-lib.mjs';

const [, , , outFile, shotDir] = process.argv;
const { withTheme, themeId } = parseArgs();
mkdirSync(shotDir, { recursive: true });
const PAGES = [
  '/collections/all', '/collections/all?page=2', '/search?q=snowboard', '/collections', '/cart', '/',
  '/products/the-3p-fulfilled-snowboard', '/products/selling-plans-ski-wax', '/products/the-complete-snowboard',
];
const VPS = [[1440, 900], [375, 667]];
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = [];
for (const [vw, vh] of VPS) {
  for (const p of PAGES) {
    const { ctx, page } = await newPage(browser, state, vw, vh);
    const msgs = [], failed = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) msgs.push(`${m.type()}: ${m.text().slice(0, 160)}`); });
    page.on('pageerror', (e) => msgs.push(`pageerror: ${e.message.slice(0, 160)}`));
    page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url().slice(0, 120)}`); });
    await open(page, withTheme, p, themeId);
    await sleep(1500);
    const info = await page.evaluate(() => ({
      h1: document.querySelectorAll('h1').length,
      overflow: document.documentElement.scrollWidth - innerWidth,
      imgNoDims: [...document.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
      imgs: document.querySelectorAll('img').length,
    }));
    const name = `${p.replace(/[^a-z0-9]+/gi, '_')}-${vw}`;
    await page.screenshot({ path: `${shotDir}/${name}.png`, fullPage: false });
    out.push({ p, vw, ...info, msgs, failed });
    await ctx.close();
    await sleep(1200);
  }
}
await browser.close();
writeFileSync(outFile, JSON.stringify(out, null, 1));
for (const r of out) console.log(r.vw, r.p, `h1=${r.h1} ov=${r.overflow} imgs=${r.imgs} nodims=${r.imgNoDims} msgs=${r.msgs.length} failed=${r.failed.length}`);
