// Step 0 items 4, 5, 10 (and the same record on head): node t6ac-facts.mjs <previewUrl> <label> <outFile>
// Writes grid geometry at C6a.3's widths, fixture image sizes, bytes/LCP at three settings, and other-caller img markup.
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, open, gridFn, fileSizeFn, measureBytes, sleep } from './t6ac-lib.mjs';

const [, , , label, outFile] = process.argv;
const { withTheme, themeId } = parseArgs();
const WIDTHS = [320, 375, 767, 768, 1023, 1024, 1119, 1121, 1279, 1280, 1440, 1920];
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = { label, geometry: {}, callers: {} };

for (const w of WIDTHS) {
  const { ctx, page } = await newPage(browser, state, w);
  await open(page, withTheme, '/collections/all', themeId);
  out.geometry[w] = await page.evaluate(gridFn);
  if (w === 1440) {
    // fixture natural sizes: strip width/height/crop params, load detached
    const urls = out.geometry[w].cards.filter((c) => c.img).map((c) => c.img.src.replace(/&?(width|height|crop)=[^&]*/g, '').replace('?&', '?'));
    out.fixtures = { nProd: out.geometry[w].cards.length, nImg: urls.length, sizes: [] };
    for (const u of urls) out.fixtures.sizes.push(await page.evaluate(fileSizeFn, u.startsWith('//') ? 'https:' + u : u));
    out.fixtures.over1080 = out.fixtures.sizes.filter(([a, b]) => a > 1080 && b > 1080).length;
  }
  await ctx.close();
  await sleep(1200);
}

out.bytes = [];
for (const [vw, dpr] of [[375, 2], [1440, 1], [1440, 2]]) {
  out.bytes.push(await measureBytes(browser, state, withTheme, themeId, '/collections/all', vw, dpr));
  await sleep(1200);
}

const callerFn = () => [...document.querySelectorAll('img')].filter((i) => i.parentElement && i.parentElement.matches('.relative.block.w-full.overflow-hidden')).map((i) => {
  const b = i.parentElement.getBoundingClientRect();
  return { html: i.outerHTML, wrap: [Math.round(b.width), Math.round(b.height)] };
});
for (const w of [375, 1440]) {
  for (const p of ['/search?q=snowboard', '/collections']) {
    const { ctx, page } = await newPage(browser, state, w);
    await open(page, withTheme, p, themeId);
    out.callers[`${p}@${w}`] = await page.evaluate(callerFn);
    await ctx.close(); await sleep(1200);
  }
  const { ctx, page } = await newPage(browser, state, w);
  await open(page, withTheme, '/products/the-complete-snowboard.js'.replace('.js', ''), themeId);
  await page.evaluate(async () => {
    const p = await (await fetch('/products/the-complete-snowboard.js')).json();
    await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: p.variants[0].id, quantity: 1 }] }) });
  });
  await sleep(800);
  await open(page, withTheme, '/cart', themeId);
  out.callers[`/cart@${w}`] = await page.evaluate(callerFn);
  await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
  await ctx.close(); await sleep(1200);
}
await browser.close();
writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log('done', label, Object.keys(out.callers).map((k) => `${k}:${out.callers[k].length}`).join(' '), JSON.stringify(out.fixtures && { nProd: out.fixtures.nProd, nImg: out.fixtures.nImg, over1080: out.fixtures.over1080 }));
