// usage: T4CQ_STATE=file node t4cq-related.mjs <previewUrl>  -- related-products heading on the fixtures (scratch proxy with an <a> in the heading)
import { chromium, parseArgs, loginState, newPage, sleep } from './t4cq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const w of [1440, 375]) {
  const { ctx, page } = await newPage(browser, state, w, w === 375 ? 812 : 900);
  for (const h of ['the-complete-snowboard', 'selling-plans-ski-wax', 'the-3p-fulfilled-snowboard']) {
    await page.goto(withTheme('/products/' + h), { waitUntil: 'load' });
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await sleep(4000);
    const r = await page.evaluate(() => {
      const pr = document.querySelector('product-recommendations');
      const h2 = pr && pr.querySelector('h2');
      const a = pr && pr.querySelector('h2 a');
      const s = a && getComputedStyle(a);
      return { hasPR: !!pr, h2: h2 && h2.innerHTML.slice(0, 80), a: s && { td: s.textDecorationLine, c: s.color }, cards: pr ? pr.querySelectorAll('a').length : 0 };
    });
    console.log(w, h, JSON.stringify(r));
  }
  await ctx.close();
}
await browser.close();
