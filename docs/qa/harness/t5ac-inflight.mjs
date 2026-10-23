// T5a C5a.13(a) / Step 0 item 10: S7, add to cart in flight on wax. The request is held 2,000 ms; at 500 ms the spinner, button and label are read.
// Valid only if the route handler was hit. Usage: node t5ac-inflight.mjs <previewBase> <label>   Output: docs/qa/evidence/t5ac-inflight-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, settleFn } from './t5ac-lib.mjs';
const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = [];
for (const w of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, w, 812);
  let hits = 0;
  await page.route(/\/cart\/add(\.js)?(\?|$)/, async (route) => { hits++; await sleep(2000); await route.continue(); });
  await page.goto(withTheme('/products/selling-plans-ski-wax'), { waitUntil: 'load' }); await sleep(1200);
  await page.evaluate(settleFn, { recWait: 3000 });
  const read = () => page.evaluate(() => {
    const b = document.querySelector('button[name="add"]'), sp = b.querySelector('.loading__spinner') || document.querySelector('.loading__spinner'), lab = b.querySelector('span');
    const r = (e) => { const x = e.getBoundingClientRect(); return [x.x, x.y, x.width, x.height].map((v) => Math.round(v * 10) / 10); };
    const svg = sp.querySelector('svg');
    return { btn: r(b), spinner: r(sp), spDisplay: getComputedStyle(sp).display, spZ: getComputedStyle(sp).zIndex, svgVis: svg ? getComputedStyle(svg).visibility : null, svgRect: svg ? r(svg) : null, label: getComputedStyle(lab).visibility, cls: b.className.slice(0, 40), loading: b.classList.contains('loading') };
  });
  const before = await read();
  await page.locator('button[name="add"]').first().click();
  await sleep(500);
  const during = await read();
  await sleep(2600);
  const after = await read();
  out.push({ w, hits, valid: hits >= 1, before, during, after });
  console.log(w, 'hits', hits, 'during spinner', during.spDisplay, 'label', during.label, 'after', after.spDisplay);
  await ctx.close();
}
writeFileSync(`docs/qa/evidence/t5ac-inflight-${label}.json`, JSON.stringify(out, null, 1));
await browser.close();
