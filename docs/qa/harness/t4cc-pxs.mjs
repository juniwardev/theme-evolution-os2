// T4c C4c.11: non-prose sinks on a PXS scratch copy (footer about_text, image-banner heading and text links, related-products heading).
// Usage: node t4cc-pxs.mjs <previewBase> <label>   Output: docs/qa/evidence/t4cc-pxs-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t4cc-lib.mjs';
const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = { label };
const linkFn = (sel) => {
  const a = document.querySelector(sel); if (!a) return null; const s = getComputedStyle(a);
  return { td: s.textDecorationLine, thick: s.textDecorationThickness, offset: s.textUnderlineOffset, color: s.color, tdc: s.textDecorationColor, text: a.textContent.trim() };
};
for (const vw of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
  await page.goto(withTheme('/'), { waitUntil: 'load' }); await sleep(1200);
  const r = {};
  r.footerLink = await page.evaluate(linkFn, '.theme-evolution-footer__about-text a');
  r.footerUl = await page.evaluate(() => { const u = document.querySelector('.theme-evolution-footer__about-text ul'); if (!u) return null; const s = getComputedStyle(u); const w = getComputedStyle(u.parentElement); return { lst: s.listStyleType, lsp: s.listStylePosition, pis: s.paddingInlineStart, wrapperFs: w.fontSize }; });
  r.bannerHeadingLink = await page.evaluate(linkFn, '[id*="image-banner"] h1 a, [id*="image-banner"] h2 a');
  r.bannerTextLink = await page.evaluate(linkFn, '[id*="image-banner"] p a');
  out[`home-${vw}`] = r;
  let rel = null;
  for (const h of ['the-complete-snowboard', 'selling-plans-ski-wax', 'the-3p-fulfilled-snowboard']) {
    await page.goto(withTheme('/products/' + h), { waitUntil: 'load' });
    try { await page.waitForSelector('product-recommendations h2', { timeout: 10000 }); } catch { continue; }
    rel = { handle: h, link: await page.evaluate(linkFn, 'product-recommendations h2 a') };
    break;
  }
  out[`related-${vw}`] = rel;
  await ctx.close();
}
await browser.close();
writeFileSync(`docs/qa/evidence/t4cc-pxs-${label}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
