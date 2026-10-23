// Cart page image: attributes, srcset, what is actually downloaded.
import { chromium, parseArgs, loginState, newPage, seed, sleep, H } from './t4aq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const w of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, w, 812);
  await seed(page, withTheme, [H.wax]);
  const reqs = [];
  page.on('response', async (r) => { if (/cdn\/shop\/.*(png|jpg)/.test(r.url())) reqs.push(r.url().split('/files/')[1]?.slice(0, 80) + ' ' + (r.headers()['content-length'] || '')); });
  await page.goto(withTheme('/cart'), { waitUntil: 'load' });
  await sleep(1000);
  console.log(w, await page.evaluate(() => { const i = document.querySelector('[data-cart-page] li img'); return { outer: i.outerHTML.slice(0, 600), nat: [i.naturalWidth, i.naturalHeight], cur: i.currentSrc.slice(-70), dpr: devicePixelRatio }; }));
  console.log(reqs);
  await ctx.close();
}
await browser.close();
