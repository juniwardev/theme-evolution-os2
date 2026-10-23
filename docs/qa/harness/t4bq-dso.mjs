// Inspect the overflowing element on /pages/data-sharing-opt-out. Usage: node t4bq-dso.mjs <previewBase>
import { chromium, parseArgs, loginState, newPage } from './t4bq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const { ctx, page } = await newPage(browser, state, 375, 812);
await page.goto(withTheme('/pages/data-sharing-opt-out'), { waitUntil: 'load' });
await page.waitForTimeout(800);
console.log(JSON.stringify(await page.evaluate(() => {
  const el = document.querySelector('.pc--show-email-field');
  const chain = []; for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); const b = e.getBoundingClientRect(); chain.push(`${e.tagName.toLowerCase()}#${e.id.slice(0, 30)}.${String(e.className).slice(0, 40)} l${Math.round(b.left)} w${Math.round(b.width)} ov=${cs.overflowX} wd=${cs.width}`); }
  const cs = getComputedStyle(el);
  return { chain, own: { width: cs.width, minW: cs.minWidth, display: cs.display, inShell: !!el.closest('[data-page-shell]'), inRich: !!el.closest('[data-rich-text]'), inAppBlock: !!el.closest('[id^="shopify-block-"]') }, sw: document.documentElement.scrollWidth };
}), null, 1));
await ctx.close(); await browser.close();
