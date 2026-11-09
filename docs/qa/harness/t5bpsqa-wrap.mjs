// A7: at 320 on the policy page, X_page with and without wrap-break-word; which li words break; screenshot of the longest-word li.
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, assertTheme, PAGES } from './t5bc-lib.mjs';
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = {};
for (const w of [320, 360]) {
  const { ctx, page } = await newPage(browser, state, w, 667);
  await page.goto(withTheme(PAGES.policy), { waitUntil: 'load', timeout: 60000 });
  await assertTheme(page, themeId);
  await sleep(1500);
  out[w] = await page.evaluate(() => {
    const pol = document.querySelector('[data-policy-prose]');
    const X = () => document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const r = { cls: pol.className, withFix: X() };
    const longest = [];
    for (const li of pol.querySelectorAll('li')) {
      for (const word of li.textContent.split(/\s+/)) if (word.length > 25) longest.push(word.slice(0, 60) + ' (' + word.length + ')');
    }
    r.longWords = [...new Set(longest)];
    const lis = [...pol.querySelectorAll('li')].filter((l) => l.textContent.split(/\s+/).some((x) => x.length > 25));
    r.liCount = lis.length;
    if (lis[0]) { lis[0].scrollIntoView({ block: 'center' }); lis[0].setAttribute('data-qa-long', ''); r.liH = lis[0].getBoundingClientRect().height; r.liRight = lis[0].getBoundingClientRect().right; }
    pol.classList.remove('wrap-break-word');
    r.withoutFix = X();
    pol.classList.add('wrap-break-word');
    r.restored = X();
    return r;
  });
  if (w === 320) {
    await page.evaluate(() => document.querySelector('[data-qa-long]')?.scrollIntoView({ block: 'center' }));
    await sleep(300);
    await page.screenshot({ path: 'docs/qa/screenshots/t5bps-qa-policy-320-longword-list.png' });
  }
  await ctx.close();
  await sleep(1200);
}
writeFileSync('docs/qa/evidence/t5bpsqa-wrap.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
