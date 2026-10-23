// T4c C4c.5(c), C4c.7(b), C4c.8(b), C4c.9(b) on real pages: every [data-rich-text] wrapper's classes, width vs parent content width, font-size/line-height, max-width.
// Usage: node t4cc-real.mjs <previewBase> <label>   Output: docs/qa/evidence/t4cc-real-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t4cc-lib.mjs';
const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = { label };
const fn = () => [...document.querySelectorAll('[data-rich-text]')].map((c) => {
  const cs = getComputedStyle(c); const par = c.parentElement; const p = getComputedStyle(par); const px = parseFloat;
  const pc = par.getBoundingClientRect().width - px(p.paddingLeft) - px(p.paddingRight);
  const r = (n) => Math.round(n * 10) / 10;
  const mid = c.querySelectorAll(':scope > p')[1] || c.querySelector(':scope > p');
  return { cls: c.className, w: r(c.getBoundingClientRect().width), parentContent: r(pc), fs: cs.fontSize, lh: cs.lineHeight, maxWidth: cs.maxWidth, bodyVar: cs.getPropertyValue('--tw-prose-body').trim(), color: cs.color, text: c.textContent.trim().length, p: mid && { mt: getComputedStyle(mid).marginTop, color: getComputedStyle(mid).color } };
});
for (const p of ['/pages/the-material-archive', '/products/the-3p-fulfilled-snowboard', '/products/selling-plans-ski-wax', '/products/the-complete-snowboard', '/pages/data-sharing-opt-out', '/pages/the-balanced-face-test-page', '/pages/contact']) {
  for (const vw of [375, 1440]) {
    const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
    await page.goto(withTheme(p), { waitUntil: 'load' }); await sleep(p.includes('opt-out') ? 2500 : 700);
    out[`${p}@${vw}`] = await page.evaluate(fn);
    await ctx.close();
  }
}
await browser.close();
writeFileSync(`docs/qa/evidence/t4cc-real-${label}.json`, JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out)) if (k !== 'label') console.log(k.padEnd(50), JSON.stringify(v.map((x) => ({ c: x.cls.replace('prose prose-tokens', 'PT'), w: x.w, pc: x.parentContent, fs: x.fs, lh: x.lh, mw: x.maxWidth, t: x.text }))));
