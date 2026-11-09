// T6b C6b.19 / C6b.20: overflow and headings on touched pages. Usage: node t6bc-regress.mjs <previewBase> <label> [pxpPath]
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, load, overflowFn2, HANDLES } from './t6bc-lib.mjs';

const [, label] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = { label, themeId, rows: [] };
for (const [name, path, act] of [['p3p+error', '/products/' + HANDLES.p3p, 'error'], ['wax', '/products/' + HANDLES.wax, null], ['p3p+tooltip', '/products/' + HANDLES.p3p, 'tooltip'], ['home', '/', null]]) {
  for (const w of [320, 375, 768, 1440]) {
    const { ctx, page } = await newPage(browser, state, w, 900);
    await load(page, withTheme, path, themeId); await sleep(1200);
    if (act === 'error') { await page.locator('button[name="add"]').click(); await sleep(1500); }
    if (act === 'tooltip') { const t = page.locator('.eco-tooltip-trigger').first(); if (await t.count()) { await t.focus(); await sleep(1600); } }
    const o = await page.evaluate(overflowFn2);
    const h1 = await page.evaluate(() => document.querySelectorAll('h1').length);
    const row = { name, w, diff: o.sw - o.vw, off: o.off.slice(0, 3), h1, logs: page.__logs.filter((l) => !/422/.test(l)) };
    out.rows.push(row); console.log(JSON.stringify(row));
    await ctx.close(); await sleep(300);
  }
}
writeFileSync(`docs/qa/evidence/t6bc-regress-${label}.json`, JSON.stringify(out, null, 1));
await browser.close();
