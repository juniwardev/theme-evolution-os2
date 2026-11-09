// T6b QA regression pages (no cart writes): home, collection, policy, product, cart page overflow + H1 + console errors; header menu at 375.
// Usage: T6BQA_STATE=<scratch> node t6bqa-pages.mjs <previewBase> <label>    Output: docs/qa/evidence/t6bqa-pages-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, load, HANDLES } from './t6bqa-lib.mjs';
import { overflowFn2 } from './t6bc-lib.mjs';

const [, label] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = { label, themeId, rows: [] };
const pages = [['home', '/'], ['collection', '/collections/all'], ['policy', '/policies/privacy-policy'], ['wax', '/products/' + HANDLES.wax], ['snow', '/products/' + HANDLES.snow], ['p3p', '/products/' + HANDLES.p3p], ['cart', '/cart']];
for (const [name, path] of pages) for (const w of [375, 1440]) {
  try {
    const { ctx, page } = await newPage(browser, state, w, w === 1440 ? 900 : 667);
    const resp = await load(page, withTheme, path, themeId); await sleep(1200);
    const o = await page.evaluate(overflowFn2);
    const h1 = await page.evaluate(() => document.querySelectorAll('h1').length);
    const row = { name, w, status: resp.status(), diff: o.sw - o.vw, off: o.off.slice(0, 3), h1, logs: page.__logs };
    if (name === 'home' || name === 'collection') await page.screenshot({ path: `docs/qa/screenshots/t6bqa-${name}-${w}.png` });
    out.rows.push(row); console.log(JSON.stringify(row).slice(0, 500));
    await ctx.close(); await sleep(1500);
  } catch (e) { console.log(name, w, 'ERROR', String(e.message).slice(0, 200)); out.rows.push({ name, w, error: String(e.message).slice(0, 200) }); }
}
// header menu at 375: toggle opens, Escape closes and focus is on the toggle (known RB1), no console errors
try {
  const { ctx, page } = await newPage(browser, state, 375, 667);
  await load(page, withTheme, '/', themeId); await sleep(1200);
  const tg = page.locator('.theme-evolution-header-menu__toggle');
  await tg.click(); await sleep(500);
  const exp1 = await tg.getAttribute('aria-expanded');
  await page.screenshot({ path: 'docs/qa/screenshots/t6bqa-header-menu-375.png' });
  await page.keyboard.press('Escape'); await sleep(500);
  const exp2 = await tg.getAttribute('aria-expanded');
  out.header = { exp1, exp2, logs: page.__logs };
  console.log('header', JSON.stringify(out.header));
  await ctx.close();
} catch (e) { console.log('header ERROR', String(e.message).slice(0, 200)); out.header = { error: String(e.message) }; }
writeFileSync(`docs/qa/evidence/t6bqa-pages-${label}.json`, JSON.stringify(out, null, 1));
await browser.close();
