// Heading order + h1 count + preloads per page. Usage: node t4bq-headings.mjs <previewBase>
import { chromium, parseArgs, loginState, newPage } from './t4bq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const p of ['/collections/all', '/collections', '/search?q=snowboard', '/search?q=zzzznomatch', '/pages/contact', '/pages/the-material-archive', '/blogs/news', '/pages/tailwind-qa-missing', '/password']) {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme(p), { waitUntil: 'load' });
  const r = await page.evaluate(() => ({ seq: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => !h.closest('cart-drawer')).map((h) => h.tagName[1]).join(''), pre: document.querySelectorAll('link[rel=preload][as=image]').length, imgs: document.querySelectorAll('img').length, lazyless: [...document.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length }));
  console.log(p.padEnd(34), JSON.stringify(r));
  await ctx.close();
}
await browser.close();
