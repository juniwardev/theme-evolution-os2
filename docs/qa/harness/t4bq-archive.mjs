// Archive geometry (C4b.15a, C4b.16, C4b.17, E4b.14/15/16). Usage: node t4bq-archive.mjs <previewBase> <outJson>
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage } from './t4bq-lib.mjs';
const { withTheme } = parseArgs();
const out = {};
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const vw of [375, 749, 750, 760, 767, 768, 900, 989, 990, 1023, 1024, 1440, 1920]) {
  const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
  await page.goto(withTheme('/pages/the-material-archive'), { waitUntil: 'load' });
  await page.waitForTimeout(900);
  out[vw] = await page.evaluate(() => {
    const r1 = (n) => Math.round(n * 10) / 10;
    const root = document.querySelector('[id^="shopify-section-template"][id$="__main"]');
    const grid = root.querySelector('.material-grid') || root.querySelector('[data-material-archive] > div:last-child');
    const gs = getComputedStyle(grid);
    const gb = grid.getBoundingClientRect();
    const cards = [...grid.children].filter((c) => c.getBoundingClientRect().height > 0);
    const h1 = root.querySelector('h1');
    const hs = getComputedStyle(h1);
    return {
      gridL: r1(gb.left), gridR: r1(gb.right), cols: gs.gridTemplateColumns, gap: gs.columnGap + '/' + gs.rowGap,
      padTop: getComputedStyle(root.firstElementChild || root).paddingTop,
      h1: { font: hs.fontFamily.slice(0, 12), size: hs.fontSize, weight: hs.fontWeight, tt: hs.textTransform, y: r1(h1.getBoundingClientRect().top) },
      cards: cards.map((c) => { const b = c.getBoundingClientRect(); const cs = getComputedStyle(c); return { x: r1(b.left), y: r1(b.top + scrollY), w: r1(b.width), h: r1(b.height), bottom: r1(b.bottom + scrollY), radius: cs.borderTopLeftRadius, border: cs.borderTopWidth + ' ' + cs.borderTopColor, bg: cs.backgroundColor, color: cs.color }; }),
      nImgNoWH: [...root.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
      meters: [...root.querySelectorAll('[role=meter]')].length,
      bars: root.querySelectorAll('[data-sustainability-bar]').length,
      active: root.querySelectorAll('[data-sustainability-bar][data-active]').length,
      oldClasses: /material-archive-card__sustainability|fillBarReveal/.test(document.documentElement.outerHTML),
      footer: (() => { const m = root.querySelector('[role=meter]'); if (!m) return null; const f = m.closest('div'); const labels = [...(m.parentElement.parentElement.querySelectorAll('span,p'))].slice(0, 3).map((s) => s.textContent.trim() + '|' + getComputedStyle(s).fontSize + '|' + getComputedStyle(s).color); return { aria: m.getAttribute('aria-label'), now: m.getAttribute('aria-valuenow'), labels }; })(),
      h1Count: document.querySelectorAll('h1').length,
      sx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  if (vw === 1440) {
    const card = page.locator('.material-grid > div, [data-material-archive] .grid > div').first();
    await card.scrollIntoViewIfNeeded();
    const before = await card.evaluate((c) => { const s = getComputedStyle(c); return { t: s.translate, tr: s.transform, sh: s.boxShadow }; });
    await card.hover();
    await page.waitForTimeout(600);
    const after = await card.evaluate((c) => { const s = getComputedStyle(c); return { t: s.translate, tr: s.transform, sh: s.boxShadow }; });
    const anim = await page.evaluate(() => { const b = document.querySelector('[data-sustainability-bar][data-active]'); if (!b) return null; const cs = getComputedStyle(b, '::after'); return { an: cs.animationName, delays: [...document.querySelectorAll('[data-sustainability-bar]')].slice(0, 5).map((e) => getComputedStyle(e).getPropertyValue('--bar-delay').trim()) }; });
    out.hover = { before, after, anim };
    await page.screenshot({ path: process.env.SHOT || 'docs/qa/screenshots/t4bq-archive-1440.png', fullPage: true });
  }
  if (vw === 375) await page.screenshot({ path: (process.env.SHOT || 'docs/qa/screenshots/t4bq-archive').replace(/\.png$/, '') + '-375.png', fullPage: true });
  await ctx.close();
}
writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log('wrote', process.argv[3]);
await browser.close();
