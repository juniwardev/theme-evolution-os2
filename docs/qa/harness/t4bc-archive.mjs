// T4b Step 0 item 11 / C4b.15-C4b.17: archive facts, grid frame and tracks, card geometry, hover. Works on base and head markup.
// Usage: node t4bc-archive.mjs <previewBase> <label>   Output: docs/qa/evidence/t4bc-archive-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t4bc-lib.mjs';
const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = { label, widths: {} };
const factsFn = () => {
  const root = document.querySelector('[id^="shopify-section-template"][id$="__main"]');
  // the grid is the element with the most direct children that each hold an image or svg
  const grids = [...root.querySelectorAll('*')].filter((e) => getComputedStyle(e).display === 'grid' && e.children.length >= 2);
  const grid = grids.sort((a, b) => b.children.length - a.children.length)[0];
  const gs = getComputedStyle(grid);
  const cards = [...grid.children];
  const rects = cards.map((c) => { const b = c.getBoundingClientRect(); return { x: Math.round(b.left * 10) / 10, y: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10, bottom: Math.round(b.bottom * 10) / 10 }; });
  const g = grid.getBoundingClientRect();
  const h1 = root.querySelector('h1');
  const first = cards[0];
  const cs = getComputedStyle(first);
  const desc = root.querySelector('.rte, [data-rich-text]');
  return {
    nCards: cards.length, cols: gs.gridTemplateColumns, gap: gs.columnGap, gridLeft: Math.round(g.left * 10) / 10, gridRight: Math.round(g.right * 10) / 10, gridW: Math.round(g.width * 10) / 10,
    rects, radius: cs.borderTopLeftRadius, border: cs.borderTopWidth + ' ' + cs.borderTopColor, bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow, transform: cs.transform, translate: cs.translate,
    img: (() => { const i = first.querySelector('img,svg'); if (!i) return null; const b = i.parentElement.getBoundingClientRect(); return { box: [Math.round(b.width), Math.round(b.height)] }; })(),
    padTop: getComputedStyle(root.firstElementChild).paddingTop, padBottom: getComputedStyle(root.firstElementChild).paddingBottom,
    h1: h1 && { text: h1.textContent.trim(), ff: getComputedStyle(h1).fontFamily.slice(0, 20), fs: getComputedStyle(h1).fontSize },
    descHtml: desc ? desc.innerHTML.slice(0, 400) : null, descLists: desc ? desc.querySelectorAll('ul,ol').length : null, descLinks: desc ? desc.querySelectorAll('a').length : null, descColor: desc && getComputedStyle(desc).color,
    meters: cards.map((c) => { const m = c.querySelector('[role=meter]'); return m ? { now: m.getAttribute('aria-valuenow'), label: m.getAttribute('aria-label'), bars: c.querySelectorAll('[data-sustainability-bar]').length } : null; }),
    stories: cards.map((c) => !!c.querySelector('p, div:not(:has(*))')).length,
    html1: first.outerHTML.slice(0, 200),
  };
};
for (const vw of [375, 768, 900, 1024, 1440, 1920]) {
  const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
  await page.goto(withTheme('/pages/the-material-archive'), { waitUntil: 'load' });
  await sleep(1200);
  out.widths[vw] = await page.evaluate(factsFn);
  if (vw === 1440) {
    const card = page.locator('[id^="shopify-section-template"][id$="__main"] ' + (label.startsWith('base') ? '.material-archive-card' : '[data-material-archive] .grid > div')).first();
    await card.hover();
    await sleep(500);
    out.hover = await card.evaluate((c) => { const s = getComputedStyle(c); return { transform: s.transform, translate: s.translate, shadow: s.boxShadow }; });
  }
  await ctx.close();
}
writeFileSync(`docs/qa/evidence/t4bc-archive-${label}.json`, JSON.stringify(out, null, 1));
for (const [vw, w] of Object.entries(out.widths)) console.log(vw, 'cards', w.nCards, 'cols', w.cols, 'gap', w.gap, 'grid', w.gridLeft, w.gridRight, 'pad', w.padTop, w.padBottom, 'h1', JSON.stringify(w.h1));
const w = out.widths[1440];
console.log('1440 bottoms', w.rects.map((r) => r.bottom).join(','), 'radius', w.radius, 'border', w.border, 'bg', w.bg, 'color', w.color, 'img', JSON.stringify(w.img));
console.log('desc lists/links', w.descLists, w.descLinks, 'descHtml', JSON.stringify(w.descHtml), 'descColor', w.descColor);
console.log('meters', JSON.stringify(w.meters), 'hover', JSON.stringify(out.hover));
await browser.close();
