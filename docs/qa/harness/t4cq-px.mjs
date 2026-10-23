// usage: T4CQ_STATE=file node t4cq-px.mjs <previewUrl> <label>   (against the scratch proxy tree served on the dev theme)
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t4cq-lib.mjs';

const { withTheme } = parseArgs();
const label = process.argv[3];
const VARS = ['body', 'headings', 'lead', 'links', 'bold', 'counters', 'bullets', 'hr', 'quotes', 'quote-borders', 'captions', 'kbd', 'kbd-shadows', 'code', 'pre-code', 'pre-bg', 'th-borders', 'td-borders'];
const rtFn = (VARS) => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const out = {};
  const sty = (el, ...ps) => { const s = getComputedStyle(el); return Object.fromEntries(ps.map((p) => [p, s[p]])); };
  for (const el of document.querySelectorAll('[data-qa]')) {
    const k = el.getAttribute('data-qa');
    const s = getComputedStyle(el); const b = el.getBoundingClientRect();
    const pr = el.parentElement.getBoundingClientRect(); const ps = getComputedStyle(el.parentElement);
    const o = { w: r1(b.width), pw: r1(pr.width - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight)), fs: s.fontSize, lh: s.lineHeight, color: s.color, maxW: s.maxWidth, vars: {} };
    for (const v of VARS) o.vars[v] = s.getPropertyValue('--tw-prose-' + v).replace(/\s+/g, '');
    if (k.startsWith('form')) { const ul = el.querySelector('ul'); o.ul = sty(ul, 'listStyleType', 'paddingInlineStart'); out[k] = o; continue; }
    const q = (sel) => el.querySelector(sel);
    const ps2 = [...el.querySelectorAll('p')];
    o.p = { first: sty(ps2[0], 'marginTop', 'marginBottom', 'color'), mid: ps2[1] ? sty(ps2[1], 'marginTop', 'marginBottom') : null };
    o.h2 = sty(q('h2'), 'fontSize', 'fontWeight', 'marginTop', 'marginBottom', 'color', 'fontFamily');
    o.h3 = sty(q('h3'), 'fontSize', 'color');
    o.a = sty(q('a'), 'color', 'textDecorationLine', 'fontWeight');
    o.strong = sty(q('strong'), 'color', 'fontWeight');
    o.ul = sty(q('ul'), 'listStyleType', 'paddingInlineStart', 'listStylePosition');
    o.ol = sty(q('ol'), 'listStyleType', 'paddingInlineStart', 'listStylePosition');
    o.marker = getComputedStyle(q('ul > li'), '::marker').color;
    o.bq = sty(q('blockquote'), 'borderLeftStyle', 'borderLeftWidth', 'borderInlineStartStyle', 'borderInlineStartWidth', 'color', 'fontStyle');
    o.bq.borderInlineStartColor = getComputedStyle(q('blockquote')).borderInlineStartColor;
    o.hr = sty(q('hr'), 'borderTopStyle', 'borderTopWidth', 'borderTopColor');
    o.pre = sty(q('pre'), 'backgroundColor', 'color');
    o.th = sty(q('th'), 'borderBottomColor', 'borderBottomWidth');
    o.td = sty(q('td'), 'borderBottomColor');
    o.code = sty(q('p code'), 'color');
    out[k] = o;
  }
  return out;
};
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const res = {};
for (const w of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, w, w === 375 ? 812 : 900);
  await page.goto(withTheme('/pages/contact?view=qa-rt'), { waitUntil: 'load' });
  await sleep(1500);
  res[`rt@${w}`] = await page.evaluate(rtFn, VARS);
  await page.screenshot({ path: `docs/qa/screenshots/t4cq-${label}-rt-${w}.png`, fullPage: true });
  // PXP: description fixture + tooltip triggers
  await page.goto(withTheme('/products/the-3p-fulfilled-snowboard'), { waitUntil: 'load' });
  await sleep(1200);
  res[`pxp@${w}`] = await page.evaluate(() => {
    const d = document.querySelector('[data-rich-text]');
    const tr = [...d.querySelectorAll('.eco-tooltip-trigger')].map((t) => { const s = getComputedStyle(t); return { txt: t.textContent, inStrong: !!t.closest('strong'), c: s.color, td: s.textDecorationLine, tds: s.textDecorationStyle, off: s.textUnderlineOffset, fw: s.fontWeight }; });
    const a = d.querySelector('a'); const s = getComputedStyle(a);
    return { w: d.getBoundingClientRect().width, tr, a: { c: s.color, fw: s.fontWeight, td: s.textDecorationLine } };
  });
  if (w === 1440) {
    const t = page.locator('[data-rich-text] .eco-tooltip-trigger').first();
    await t.scrollIntoViewIfNeeded();
    await t.hover(); await sleep(500);
    res.hover = await page.evaluate(() => { const t = document.querySelector('[data-rich-text] .eco-tooltip-trigger'); return { c: getComputedStyle(t).color, tip: !!document.querySelector('div.eco-tooltip.is-visible') }; });
    await page.screenshot({ path: `docs/qa/screenshots/t4cq-${label}-pxp-${w}.png`, fullPage: false });
  }
  // PXS: footer + banner + related
  await page.goto(withTheme('/'), { waitUntil: 'load' });
  await sleep(1500);
  res[`pxs@${w}`] = await page.evaluate(() => {
    const g = (sel) => { const el = document.querySelector(sel); if (!el) return null; const s = getComputedStyle(el); return { c: s.color, td: s.textDecorationLine, tdc: s.textDecorationColor, tdt: s.textDecorationThickness, off: s.textUnderlineOffset, lst: s.listStyleType, pis: s.paddingInlineStart, fs: s.fontSize }; };
    return { footA: g('.theme-evolution-footer__about-text a'), footUl: g('.theme-evolution-footer__about-text ul'), footWrap: g('.theme-evolution-footer__about-text'), bannerH: g('a[href="#b"]'), bannerT: g('a[href="#t"]') };
  });
  await page.goto(withTheme('/products/the-complete-snowboard'), { waitUntil: 'load' });
  try { await page.waitForSelector('product-recommendations h2', { timeout: 15000 }); } catch {}
  await sleep(500);
  res[`related@${w}`] = await page.evaluate(() => { const el = document.querySelector('a[href="#r"]'); if (!el) return null; const s = getComputedStyle(el); return { td: s.textDecorationLine, c: s.color }; });
  await ctx.close();
}
await browser.close();
writeFileSync(process.env.T4CQ_OUT, JSON.stringify(res, null, 1));
console.log('ok');
