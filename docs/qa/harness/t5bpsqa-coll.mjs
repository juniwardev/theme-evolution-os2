// A9 follow-up: why /collections/all footer top differs between dev (188245508192) and staging (187953643616): grid columns + product count.
import { chromium, parseArgs, loginState, newPage, sleep, assertTheme, PAGES } from './t5bc-lib.mjs';
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const w of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, w, 800);
  await page.goto(withTheme(PAGES.collection), { waitUntil: 'load', timeout: 60000 });
  await assertTheme(page, themeId);
  await sleep(1500);
  const r = await page.evaluate(() => {
    const grids = [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).display === 'grid' && e.children.length > 8);
    const g = grids[0];
    return { themeId: Shopify.theme.id, n: grids.length, cols: g && getComputedStyle(g).gridTemplateColumns.split(' ').length, kids: g && g.children.length, cls: g && g.className.slice(0, 120) };
  });
  console.log(themeId, w, JSON.stringify(r));
  await ctx.close();
  await sleep(1200);
}
await browser.close();
