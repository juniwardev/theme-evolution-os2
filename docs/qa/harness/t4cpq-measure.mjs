// T4c page-center QA: geometry of h1, prose box, shell, widget across themes/widths. Password via t0-lib (never printed).
// Usage: node t4cpq-measure.mjs <outJson>
import { writeFileSync } from 'node:fs';
import { chromium, loginState } from './t0-lib.mjs';

const ORIGIN = 'https://theme-evolution-os2.myshopify.com';
const THEMES = { dev: '187953938528', stg: '187953643616' };
const PAGES = {
  optout: '/pages/data-sharing-opt-out',
  balanced: '/pages/the-balanced-face-test-page',
  coll: '/collections/all',
  search: '/search?q=snowboard',
  blog: '/blogs/news',
  p404: '/pages/t4cpq-missing',
};
const WIDTHS = [320, 375, 390, 430, 700, 768, 1024, 1440, 1920];

const measure = () => {
  const r = (n) => Math.round(n * 10) / 10;
  const bx = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: r(b.left), w: r(b.width), r: r(b.right) };
  };
  const main = document.querySelector('main') || document.body;
  const shell = document.querySelector('[data-page-shell]');
  const prose = document.querySelector('[data-page-shell] .prose, main .prose');
  const p = prose && prose.querySelector('p');
  const h1s = document.querySelectorAll('h1');
  const mb = main.getBoundingClientRect();
  const out = {
    themeId: window.Shopify && window.Shopify.theme && window.Shopify.theme.id,
    h1Count: h1s.length,
    h1: bx(h1s[0]),
    main: bx(main),
    shell: bx(shell),
    prose: bx(prose),
    pAlign: p ? getComputedStyle(p).textAlign : null,
    docW: document.documentElement.scrollWidth,
    winW: innerWidth,
    Xpage: Math.max(0, document.documentElement.scrollWidth - innerWidth),
  };
  if (prose) {
    out.gapL = r(prose.getBoundingClientRect().left - mb.left);
    out.gapR = r(mb.right - prose.getBoundingClientRect().right);
  }
  const btn = [...document.querySelectorAll('main button, main a, main input[type=checkbox], main label')].slice(0, 6).map((e) => ({ t: e.tagName + ':' + (e.textContent || '').trim().slice(0, 20), x: r(e.getBoundingClientRect().left) }));
  out.interactive = btn;
  const wrap = [...document.querySelectorAll('.prose *')].find((e) => ['auto', 'scroll'].includes(getComputedStyle(e).overflowX));
  out.scrollBox = wrap ? { tag: wrap.tagName, cls: String(wrap.className).slice(0, 60), sw: wrap.scrollWidth, cw: wrap.clientWidth } : null;
  return out;
};

const browser = await chromium.launch();
const results = {};
for (const [tn, tid] of Object.entries(THEMES)) {
  const withTheme = (path) => `${ORIGIN}${path}${path.includes('?') ? '&' : '?'}preview_theme_id=${tid}`;
  const { state, loggedIn } = await loginState(browser, withTheme);
  if (!loggedIn) throw new Error('login failed ' + tn);
  const ctx = await browser.newContext({ storageState: state });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  for (const [pn, path] of Object.entries(PAGES)) {
    for (const w of WIDTHS) {
      if (!['optout', 'balanced'].includes(pn) && w !== 1440) continue;
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(withTheme(path), { waitUntil: 'load' });
      const m = await page.evaluate(measure);
      m.expectTheme = tid;
      if (String(m.themeId) !== tid) m.THEME_MISMATCH = true;
      results[`${tn}|${pn}|${w}`] = m;
    }
  }
  results[`${tn}|consoleErrors`] = errs;
  await ctx.close();
}
await browser.close();
writeFileSync(process.argv[2], JSON.stringify(results, null, 1));
console.log('done', Object.keys(results).length);
