// Screenshot of the long unbreakable URL in the policy list at 320 (A7 evidence).
import { chromium, parseArgs, loginState, newPage, sleep, assertTheme, PAGES } from './t5bc-lib.mjs';
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const { ctx, page } = await newPage(browser, state, 320, 667);
await page.goto(withTheme(PAGES.policy), { waitUntil: 'load', timeout: 60000 });
await assertTheme(page, themeId);
await sleep(1500);
const found = await page.evaluate(() => {
  const w = document.createTreeWalker(document.querySelector('[data-policy-prose]'), NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const i = n.textContent.indexOf('globalprivacycontrol');
    if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 20); const el = n.parentElement; const b = r.getBoundingClientRect(); window.scrollTo(0, window.scrollY + b.top - 300); return { tag: el.tagName, left: b.left, right: b.right, height: b.height }; }
  }
  return null;
});
console.log(JSON.stringify(found));
await sleep(300);
await page.screenshot({ path: 'docs/qa/screenshots/t5bps-qa-policy-320-longword-url.png' });
await ctx.close();
await browser.close();
