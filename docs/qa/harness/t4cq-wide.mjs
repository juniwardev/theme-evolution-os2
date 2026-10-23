// usage: T4CQ_STATE=file node t4cq-wide.mjs <previewUrl>  -- PXW: PDP description width at 1920 with max_page_width 110rem
import { chromium, parseArgs, loginState, newPage, sleep } from './t4cq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const { ctx, page } = await newPage(browser, state, 1920, 1000);
for (const h of ['the-complete-snowboard', 'the-3p-fulfilled-snowboard']) {
  await page.goto(withTheme('/products/' + h), { waitUntil: 'load' });
  await sleep(1500);
  console.log(h, JSON.stringify(await page.evaluate(() => {
    const el = document.querySelector('[data-rich-text]'); const p = el.parentElement; const ps = getComputedStyle(p);
    const probe = document.createElement('div'); probe.className = 'prose'; probe.style.position = 'absolute'; probe.innerHTML = '<span style="white-space:nowrap">' + '0'.repeat(65) + '</span>';
    el.parentElement.appendChild(probe); const m = probe.firstChild.getBoundingClientRect().width; probe.remove();
    return { w: el.getBoundingClientRect().width, parent: p.getBoundingClientRect().width - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight), maxW: getComputedStyle(el).maxWidth, M_ch: m, pageMax: getComputedStyle(document.querySelector('[data-rich-text]')).fontSize };
  })));
}
await browser.close();
