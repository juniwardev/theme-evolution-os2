// usage: T4CQ_STATE=file node t4cq-overflow.mjs <previewUrl> <outfile>
// X_page, X_off', h1 count, heading order and img width/height per page and width.
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, PAGES, overflowFn, sleep } from './t4cq-lib.mjs';

const { withTheme } = parseArgs();
const out = process.argv[3];
const widths = [320, 375, 390, 430, 768, 1440, 1920];
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const res = {};
for (const w of widths) {
  const { ctx, page } = await newPage(browser, state, w);
  for (const [k, p] of Object.entries(PAGES)) {
    await page.goto(withTheme(p), { waitUntil: 'load' });
    await sleep(700);
    res[`${k}@${w}`] = await page.evaluate(overflowFn);
  }
  await ctx.close();
}
await browser.close();
writeFileSync(out, JSON.stringify(res, null, 1));
const bad = Object.entries(res).filter(([, v]) => v.X !== 0 || v.off.length || v.h1 !== 1 && !/missing|cart/.test(''));
for (const [k, v] of Object.entries(res)) if (v.X !== 0 || v.off.length) console.log('OVERFLOW', k, v.X, v.off.join(' | '));
for (const [k, v] of Object.entries(res)) if (v.h1 !== 1 && /@1440/.test(k)) console.log('H1', k, v.h1);
for (const [k, v] of Object.entries(res)) if (v.imgsNoWH.length && /@1440/.test(k)) console.log('IMG', k, v.imgsNoWH.join(','));
console.log('done', Object.keys(res).length);
