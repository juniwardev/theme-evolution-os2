// PX proxies on a scratch head copy with alternate templates (?view=). Usage: node t4bq-proxy.mjs <previewBase> pag|px3|px4|px5
import { chromium, parseArgs, loginState, newPage, sleep } from './t4bq-lib.mjs';
const { withTheme } = parseArgs();
const mode = process.argv[3];
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const r1 = (n) => Math.round(n * 10) / 10;
async function open(vw, path) {
  const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
  const resp = await page.goto(withTheme(path), { waitUntil: 'load' });
  await sleep(700);
  return { ctx, page, status: resp.status() };
}
if (mode === 'pag') {
  for (const base of ['/collections/all', '/search?q=snowboard']) {
    const sep = base.includes('?') ? '&' : '?';
    for (const pg of [1, 2, 4, 8, 99]) {
      const { ctx, page, status } = await open(1440, base + sep + 'page=' + pg);
      const info = await page.evaluate(() => {
        const navs = document.querySelectorAll('nav[data-pagination][aria-label="Pagination"]');
        const nav = navs[0];
        const root = document.querySelector('[id^="shopify-section-template"][id$="__main"]');
        const defaultPag = [...root.querySelectorAll('a[href*="page="]')].filter((a) => !nav || !nav.contains(a)).length;
        if (!nav) return { navs: 0, defaultPag };
        const cur = nav.querySelectorAll('[aria-current="page"]');
        const items = [...nav.querySelectorAll('li > *')].map((e) => { const b = e.getBoundingClientRect(); return { t: e.textContent.trim().replace(/\s+/g, ' '), a: e.getAttribute('aria-label'), href: e.getAttribute('href'), w: Math.round(b.width), h: Math.round(b.height), tag: e.tagName.toLowerCase() }; });
        const nb = nav.getBoundingClientRect(); const gb = (root.querySelector('.grid-fill') || root).getBoundingClientRect();
        return { navs: navs.length, curN: cur.length, curText: cur[0]?.textContent.trim().replace(/\s+/g, ' '), hasPrev: !!nav.querySelector('[aria-label="Previous page"],[aria-label*="revious"]'), hasNext: !!nav.querySelector('[aria-label*="ext"]'), items, below: nb.top >= gb.bottom - 1, centered: Math.round(nb.left + nb.width / 2), vw: innerWidth, small: items.filter((i) => i.w < 44 || i.h < 44).length };
      });
      console.log(base, 'page', pg, status, JSON.stringify(info));
      await ctx.close();
    }
  }
}
if (mode === 'px3') {
  for (const vw of [1440, 375]) for (const w of ['compact', 'full']) for (const g of [0, 10, 50]) {
    const { ctx, page, status } = await open(vw, `/pages/contact?view=px3-${w}-${g}`);
    const r = await page.evaluate(() => { const gr = document.querySelector('.grid-fill'); if (!gr) return null; const cs = getComputedStyle(gr); const tr = cs.gridTemplateColumns.split(' '); return { n: tr.length, w: tr[0], gap: cs.columnGap, setGap: gr.style.getPropertyValue('--grid-gap'), min: gr.style.getPropertyValue('--grid-min'), sx: document.documentElement.scrollWidth - innerWidth }; });
    console.log(vw, w, g, status, JSON.stringify(r));
    await ctx.close();
  }
}
if (mode === 'px4') {
  for (const [vw, views] of [[1440, ['c1', 'c2', 'c3', 'c4', 'p0', 'p100']], [900, ['c1', 'c2', 'c3', 'c4']], [375, ['c4', 'p0', 'p100']]]) for (const v of views) {
    const { ctx, page, status } = await open(vw, `/pages/the-material-archive?view=px4-${v}`);
    const r = await page.evaluate(() => { const root = document.querySelector('[data-material-archive]'); const g = root.querySelector('.grid'); const tr = getComputedStyle(g).gridTemplateColumns.split(' '); const cs = getComputedStyle(root); return { n: tr.length, w: tr[0], padT: cs.paddingTop, padB: cs.paddingBottom, sx: document.documentElement.scrollWidth - innerWidth }; });
    console.log(vw, v, status, JSON.stringify(r));
    await ctx.close();
  }
}
if (mode === 'px5') {
  for (const vw of [1440, 375]) for (const v of ['rec', 'rec0', 'rec100']) {
    const { ctx, page, status } = await open(vw, `/products/the-3p-fulfilled-snowboard?view=${v}`);
    const r = await page.evaluate(() => { const root = document.querySelector('[data-material-recommendations]'); if (!root) return null; const cs = getComputedStyle(root); const h = root.querySelector('h2'); const hs = getComputedStyle(h); const lis = root.querySelectorAll('li'); return { padT: cs.paddingTop, padB: cs.paddingBottom, heading: h.textContent.trim(), font: hs.fontFamily.slice(0, 8), tt: hs.textTransform, size: hs.fontSize, li: lis.length, cards: root.querySelectorAll('[data-related-card]').length, legacy: root.querySelectorAll('.product-mini-card,[class*="relational-rec"],.page-width').length, imgNoWH: [...root.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length, sx: document.documentElement.scrollWidth - innerWidth, h1: document.querySelectorAll('h1').length, cols: getComputedStyle(root.querySelector('ul')).gridTemplateColumns.split(' ').length }; });
    console.log(vw, v, status, JSON.stringify(r));
    if (v === 'rec') await page.locator('[data-material-recommendations]').screenshot({ path: `docs/qa/screenshots/t4bq-px5-${vw}.png` }).catch(() => {});
    await ctx.close();
  }
}
await browser.close();
