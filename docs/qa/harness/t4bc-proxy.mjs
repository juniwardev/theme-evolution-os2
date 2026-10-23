// T4b settings and content proxies (plan section 10 PX1-PX9) measured on a scratch copy served with `shopify theme dev --path` on the private
// development theme. Each mode prints one JSON line; the driver edits the scratch tree between runs.
// Usage: node t4bc-proxy.mjs <previewBase> <mode> [label]
//   px3        /collections grid tracks and column-gap at 1440 and 375            (C4b.8)
//   px4        archive tracks, frame and root padding at 375/900/1440             (C4b.15)
//   px5        product page recommendations: cards, heading, padding at 375/1440  (C4b.18)
//   px6        palette: colors that must / must not follow the tokens              (C4b.28)
//   px9        story markup in the archive, spotlight info and tooltip            (C4b.19b)
import { chromium, parseArgs, loginState, newPage, sleep, HANDLES } from './t4bc-lib.mjs';
const [, mode, label = ''] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = { mode, label };
const root = '[id^="shopify-section-template"][id$="__main"]';

if (mode === 'px3') {
  for (const vw of [1440, 375]) {
    const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
    await page.goto(withTheme('/collections'), { waitUntil: 'load' });
    out[vw] = await page.evaluate(() => { const g = [...document.querySelectorAll('.grid-fill, [data-page-shell] .grid')][0]; const s = getComputedStyle(g); return { cols: s.gridTemplateColumns.split(' '), cg: s.columnGap, min: g.style.getPropertyValue('--grid-min'), gap: g.style.getPropertyValue('--grid-gap') }; });
    await ctx.close();
  }
} else if (mode === 'px4') {
  for (const vw of [375, 900, 1440]) {
    const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
    await page.goto(withTheme('/pages/the-material-archive'), { waitUntil: 'load' });
    await sleep(500);
    out[vw] = await page.evaluate(() => { const a = document.querySelector('[data-material-archive]'); const g = a.querySelector('.grid'); const s = getComputedStyle(g); const as = getComputedStyle(a); return { cols: s.gridTemplateColumns.split(' ').length, tw: s.gridTemplateColumns.split(' ')[0], padTop: as.paddingTop, padBottom: as.paddingBottom }; });
    await ctx.close();
  }
} else if (mode === 'px5') {
  for (const vw of [375, 1440]) {
    const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
    await page.goto(withTheme('/products/' + HANDLES.snow), { waitUntil: 'load' });
    await sleep(500);
    out[vw] = await page.evaluate(() => {
      const r = document.querySelector('[data-material-recommendations]');
      if (!r) return { present: false };
      const s = getComputedStyle(r); const h = r.querySelector('h2');
      return { present: true, padTop: s.paddingTop, padBottom: s.paddingBottom, lis: r.querySelectorAll('li').length, cards: r.querySelectorAll('[data-related-card]').length, h2: h && { text: h.textContent.trim(), ff: getComputedStyle(h).fontFamily.slice(0, 8), fs: getComputedStyle(h).fontSize },
        legacy: !!r.querySelector('.product-mini-card, [class*="relational-rec"], .page-width') || r.classList.contains('page-width'), headings: [...r.querySelectorAll('h1,h2,h3,h4')].map((x) => x.tagName.toLowerCase()).slice(0, 5).join(''), x: Math.round(r.getBoundingClientRect().left), w: Math.round(r.getBoundingClientRect().width) };
    });
    await ctx.close();
  }
} else if (mode === 'px6') {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  const get = async (path, fn) => { await page.goto(withTheme(path), { waitUntil: 'load' }); await sleep(500); return page.evaluate(fn); };
  out.token = await get('/', () => getComputedStyle(document.documentElement).getPropertyValue('--color-foreground').trim());
  out.collH1 = await get('/collections/all', () => getComputedStyle(document.querySelector('[data-page-shell] h1')).color);
  out.collLink = await get('/collections/all', () => getComputedStyle(document.querySelector('[data-page-shell] p a')).color);
  out.archive = await get('/pages/the-material-archive', () => { const c = document.querySelector('[data-material-archive] .grid > div'); const d = document.querySelector('[data-material-archive] [data-rich-text]'); const st = c.querySelector('.text-\\[\\#444\\]'); return { cardBg: getComputedStyle(c).backgroundColor, cardColor: getComputedStyle(c).color, story: st && getComputedStyle(st).color, desc: d && getComputedStyle(d).color, h1: getComputedStyle(document.querySelector('[data-material-archive] h1')).color }; });
  await ctx.close();
} else if (mode === 'px9') {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme('/pages/the-material-archive'), { waitUntil: 'load' });
  out.archive = await page.evaluate(() => { const els = [...document.querySelectorAll('[data-material-archive] .grid > div .text-\\[\\#444\\]')]; return { n: els.length, hasB: els.filter((e) => e.querySelector('b')).length, text: els[0] && els[0].textContent.trim() }; });
  await page.goto(withTheme('/products/' + HANDLES.p3p), { waitUntil: 'load' });
  await sleep(1500);
  out.info = await page.evaluate(() => { const els = [...document.querySelectorAll('.text-\\[\\#3d3d3d\\]')]; return { n: els.length, hasB: els.filter((e) => e.querySelector('b')).length, text: els[0] && els[0].textContent.trim() }; });
  out.tooltipSrc = 'static (tooltip loaded on hover)';
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out));
