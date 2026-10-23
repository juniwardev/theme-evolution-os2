// T4b C4b.22 (removed utilities are unused on every page), C4b.16 (archive bars use the snippet), C4b.14 (rendered strings), C4b.4(b).
// Usage: node t4bc-final.mjs <previewBase> <class> [<class>...]    classes: removed utility class names to look for
import { chromium, parseArgs, loginState, newPage, sleep, HANDLES } from './t4bc-lib.mjs';
const [, ...removed] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const { ctx, page } = await newPage(browser, state, 1440, 900);
const PATHS = ['/', '/collections/all', '/collections', '/search?q=snowboard', '/pages/contact', '/pages/the-balanced-face-test-page', '/blogs/news', '/pages/tailwind-qa-missing', '/pages/the-material-archive', '/products/' + HANDLES.wax, '/products/' + HANDLES.snow, '/products/' + HANDLES.p3p, '/cart'];
const sel = removed.map((c) => '.' + c.replace(/([^\w-])/g, '\\$1')).join(',');
let hits = 0;
for (const p of PATHS) {
  await page.goto(withTheme(p), { waitUntil: 'load' });
  await sleep(300);
  const r = await page.evaluate((s) => (s ? [...document.querySelectorAll(s)].map((e) => e.tagName + '.' + String(e.className).slice(0, 50)) : []), sel);
  hits += r.length;
  console.log('C4b.22 removed-class matches', p, r.length, r.slice(0, 3).join(' | '));
}
console.log('total removed-class matches', hits);
// C4b.16 + C4b.14 on the archive
await page.goto(withTheme('/pages/the-material-archive'), { waitUntil: 'load' });
await sleep(1200);
const a = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('[data-material-archive] .grid > div')];
  const html = document.documentElement.outerHTML;
  return {
    html: { oldClass: /material-archive-card__sustainability/.test(html), fillBarReveal: /fillBarReveal/.test(html) },
    cards: cards.map((c) => {
      const m = c.querySelector('[role="meter"]');
      if (!m) return null;
      const bars = [...c.querySelectorAll('[data-sustainability-bar]')];
      const act = bars.filter((b) => b.hasAttribute('data-active'));
      return { now: m.getAttribute('aria-valuenow'), aria: m.getAttribute('aria-label'), n: bars.length, active: act.length, anim: act.map((b) => getComputedStyle(b, '::after').animationName), delays: act.map((b) => b.style.getPropertyValue('--bar-delay') || getComputedStyle(b).getPropertyValue('--bar-delay')), label: c.textContent.includes('Sustainability score') };
    }),
    h1: document.querySelectorAll('h1').length, heads: [...document.querySelectorAll('[data-material-archive] h1,[data-material-archive] h2')].map((h) => h.tagName).join(''),
    imgsNoDims: [...document.querySelectorAll('[data-material-archive] img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
  };
});
console.log('C4b.16', JSON.stringify(a.html), 'h1', a.h1, 'heads', a.heads, 'imgsNoDims', a.imgsNoDims);
for (const c of a.cards) console.log('  card', JSON.stringify(c));
await ctx.close(); await browser.close();
