// C4b.5 + C4b.13 basics. Usage: node t4bq-overflow.mjs <previewBase> [widths] ; prints one row per page/width.
import { chromium, parseArgs, loginState, newPage, overflowFn } from './t4bq-lib.mjs';
const { withTheme } = parseArgs();
const widths = (process.argv[3] || '320,375,390,430,768,1440,1920').split(',').map(Number);
const PAGES = (process.env.T4BQ_PAGES || '/,/collections/all,/collections,/search,/search?q=snowboard,/search?q=zzzznomatch,/pages/contact,/pages/data-sharing-opt-out,/pages/the-balanced-face-test-page,/pages/the-material-archive,/blogs/news,/pages/tailwind-qa-missing,/products/the-3p-fulfilled-snowboard,/products/selling-plans-ski-wax,/products/the-complete-snowboard,/cart,/password').split(',');
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const p of PAGES) {
  const row = [];
  for (const vw of widths) {
    const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
    const resp = await page.goto(withTheme(p), { waitUntil: 'load' });
    await page.waitForTimeout(700);
    const o = await page.evaluate(overflowFn);
    const extra = await page.evaluate(() => {
      const roots = document.querySelectorAll('[id^="shopify-section-template"][id$="__main"]');
      const imgs = [...document.querySelectorAll('main img, #MainContent img')].filter((i) => !i.width && !i.getAttribute('width'));
      return { h1: document.querySelectorAll('h1').length, noWH: imgs.length, headings: [...document.querySelectorAll('#MainContent h1,#MainContent h2,#MainContent h3')].map((h) => h.tagName[0] + h.tagName[1]).join('') };
    });
    row.push(`${vw}:${resp.status()}/X${o.X}${o.off.length ? '!' + o.off[0] : ''}`);
    if (vw === widths[widths.length - 1] || vw === 375) row.push(`[h1=${extra.h1} noWH=${extra.noWH} ${extra.headings}]`);
    await ctx.close();
  }
  console.log(p.padEnd(48), row.join(' '));
}
await browser.close();
