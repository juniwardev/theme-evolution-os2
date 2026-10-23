// usage: T4CQ_STATE=file node t4cq-rich.mjs <previewUrl> <label>
// Rich-text wrappers on real pages: computed metrics, element styles, doc height, screenshots.
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, PAGES, sleep } from './t4cq-lib.mjs';

const { withTheme } = parseArgs();
const label = process.argv[3];
mkdirSync('docs/qa/screenshots', { recursive: true });
const fn = () => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const pick = (el) => { const s = getComputedStyle(el); return { fs: s.fontSize, lh: s.lineHeight, c: s.color, mt: s.marginTop, mb: s.marginBottom, fw: s.fontWeight, ff: s.fontFamily.slice(0, 22), td: s.textDecorationLine, lst: s.listStyleType, pis: s.paddingInlineStart, bts: s.borderTopStyle, btw: s.borderTopWidth, bls: s.borderLeftStyle, blw: s.borderLeftWidth, ta: s.textAlign }; };
  const boxes = [...document.querySelectorAll('[data-rich-text]')].map((el) => {
    const s = getComputedStyle(el); const b = el.getBoundingClientRect();
    const pb = el.parentElement.getBoundingClientRect(); const ps = getComputedStyle(el.parentElement);
    const pcw = pb.width - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight);
    const o = { cls: el.className, w: r1(b.width), h: r1(b.height), parentContentW: r1(pcw), ml: r1(b.left), maxW: s.maxWidth, ovx: s.overflowX, wrapper: pick(el), tags: {} };
    for (const t of ['p', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'strong', 'blockquote', 'hr', 'table', 'span']) {
      const els = [...el.querySelectorAll(t)].filter((x) => !x.closest('.pc--show-email-field'));
      if (els.length) o.tags[t] = { n: els.length, first: pick(els[0]) };
    }
    o.widgetN = el.querySelectorAll('.pc--show-email-field').length;
    return o;
  });
  const trig = [...document.querySelectorAll('.eco-tooltip-trigger')].map((t) => { const s = getComputedStyle(t); return { c: s.color, td: s.textDecorationLine, tds: s.textDecorationStyle, off: s.textUnderlineOffset, fw: s.fontWeight, txt: t.textContent.slice(0, 20) }; });
  const grid = document.querySelector('[id*="main"] .grid, [id*="main"] [class*="grid-cols"]');
  return { boxes, trig, docH: document.documentElement.scrollHeight, gridTop: grid ? r1(grid.getBoundingClientRect().top + scrollY) : null };
};
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const res = {};
for (const w of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, w, w === 375 ? 812 : 900);
  for (const k of ['optout', 'balanced', 'archive', 'p3p', 'wax', 'snow', 'policy', 'blog', 'home']) {
    await page.goto(withTheme(PAGES[k]), { waitUntil: 'load' });
    await sleep(1200);
    res[`${k}@${w}`] = await page.evaluate(fn);
    await page.screenshot({ path: `docs/qa/screenshots/t4cq-${label}-${k}-${w}.png`, fullPage: true });
  }
  await ctx.close();
}
await browser.close();
writeFileSync(process.env.T4CQ_OUT || `/dev/stdout`, JSON.stringify(res, null, 1));
