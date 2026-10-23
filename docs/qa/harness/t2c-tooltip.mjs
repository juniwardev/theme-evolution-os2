// T2 Coder: C2.20 tooltip. No request for eco-tooltip.css; hover a trigger (injected exactly as product.liquid builds it
// when the description has none); computed styles of div.eco-tooltip; mouse out returns opacity 0; endpoint markup.
// Usage: node t2c-tooltip.mjs <previewBase> [pagesCsv=snow,p3p]
import { chromium, parseArgs, loginState, PRODUCTS } from './t2c-lib.mjs';
const { withTheme } = parseArgs();
const pages = (process.argv[3] || 'snow,p3p').split(',');
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const key of pages) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', (r) => { if (/eco-tooltip\.css/.test(r.url())) reqs.push(r.url()); });
  await page.goto(withTheme(PRODUCTS[key]), { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const had = await page.evaluate(() => document.querySelectorAll('.eco-tooltip-trigger').length);
  if (!had) {
    // exactly the span product.liquid:45 builds
    await page.evaluate(() => {
      const d = document.querySelector('.product__description') || document.querySelector('[id$="__main"] p') && document.querySelector('[id$="__main"] p').parentElement || document.body;
      const sp = document.createElement('span');
      sp.className = 'eco-tooltip-trigger cursor-help font-medium text-[#00707c] underline decoration-dotted underline-offset-4 transition-colors duration-200 hover:text-[#004c55] hover:decoration-solid';
      sp.dataset.materialHandle = 'organic-cotton'; sp.textContent = 'Organic Cotton'; d.appendChild(sp);
    });
  }
  const trig = page.locator('.eco-tooltip-trigger').first();
  const tcs = await trig.evaluate((e) => { const s = getComputedStyle(e); return { color: s.color, cursor: s.cursor, deco: s.textDecorationLine + ' ' + s.textDecorationStyle, weight: s.fontWeight, offset: s.textUnderlineOffset }; });
  await trig.hover();
  await page.waitForTimeout(1500);
  const shown = await page.evaluate(() => { const t = document.querySelector('div.eco-tooltip'); if (!t) return null; const s = getComputedStyle(t); const h = t.querySelector('h3'); const inner = t.querySelector('.font-sans') || t.firstElementChild; const is = getComputedStyle(inner); return { opacity: s.opacity, visibility: s.visibility, position: s.position, z: s.zIndex, bg: s.backgroundColor, w: Math.round(t.getBoundingClientRect().width), title: h && h.textContent.trim(), titleColor: h && getComputedStyle(h).color, titleSize: h && getComputedStyle(h).fontSize, font: is.fontFamily.slice(0, 40), fontSize: is.fontSize, lh: is.lineHeight, color: is.color }; });
  const hover = await trig.evaluate((e) => getComputedStyle(e).color);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(1000);
  const after = await page.evaluate(() => { const t = document.querySelector('div.eco-tooltip'); return t && getComputedStyle(t).opacity; });
  console.log(key, 'hadTrigger', had, 'trigger', JSON.stringify(tcs), 'hoverColor', hover, '\n  tooltip', JSON.stringify(shown), '\n  afterMouseOut opacity', after, 'eco-tooltip.css requests', reqs.length);
  await ctx.close();
}
const ctx = await browser.newContext({ storageState: state });
const r = await ctx.request.get(withTheme('/search?section_id=material-tooltip&q=organic-cotton'));
const t = await r.text();
console.log('endpoint', r.status(), t.length, 'classes:', [...new Set([...t.matchAll(/class="([^"]*)"/g)].map((m) => m[1]))].join(' || ').slice(0, 400));
await browser.close();
