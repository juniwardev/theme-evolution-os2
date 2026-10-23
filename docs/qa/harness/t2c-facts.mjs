// T2 Coder: Step 0 item 7/8 fixture facts. Related cards per product (order, sale, sold out, media count, unit price),
// material-info bars, sustainability aria-valuenow, spotlight heading tag, tooltip triggers, styles.css .group{ presence.
import { chromium, parseArgs, loginState, PRODUCTS, scrollThrough } from './t2c-lib.mjs';
const { withTheme, origin } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
for (const key of ['p3p', 'wax', 'snow']) {
  await page.goto(withTheme(PRODUCTS[key]), { waitUntil: 'load' });
  await scrollThrough(page);
  const info = await page.evaluate(() => ({
    hrefs: [...document.querySelectorAll('product-recommendations li')].map((li) => [...li.querySelectorAll('a[href*="/products/"]')].map((a) => a.getAttribute('href').split('?')[0])[0]),
    triggers: document.querySelectorAll('.eco-tooltip-trigger').length,
    meters: [...document.querySelectorAll('[role=meter]')].map((m) => [m.getAttribute('aria-valuenow'), m.getAttribute('aria-label'), m.closest('.shopify-section').id.replace(/.*__/, '')]),
    spotHeading: (() => { const s = document.querySelector('[id$="__material-spotlight"] h2, [id$="__material-spotlight"] h3, [id$="__material-spotlight"] h4'); return s && s.tagName; })(),
    matInfo: !!document.querySelector('[id*="custom"] h3'),
    matBars: (() => { const h = document.querySelector('[id*="custom"] h3'); if (!h) return null; const card = h.parentElement.parentElement.parentElement; return [...card.querySelectorAll('[class*=sustainability-bar-item]')].map((b) => { const r = b.getBoundingClientRect(); return [getComputedStyle(b).display, Math.round(r.width), Math.round(r.height), b.classList.contains('active')]; }); })(),
    descTriggerText: (document.querySelector('.product__description') || {}).textContent?.trim().slice(0, 60),
  }));
  console.log(key, JSON.stringify(info));
  const seen = new Set();
  for (const h of info.hrefs) {
    if (!h || seen.has(h)) continue; seen.add(h);
    const j = await (await ctx.request.get(origin + h + '.js')).json();
    console.log('   ', h.split('/').pop(), 'price', j.price, 'compare', j.compare_at_price, 'avail', j.available, 'media', j.media.length, 'variants', j.variants.length, 'unit', j.variants.some((v) => v.unit_price_measurement), 'price_varies', j.price_varies, 'cmp_varies', j.compare_at_price_varies);
  }
  await page.waitForTimeout(1200);
}
const css = await (await ctx.request.get(withTheme('/products/the-3p-fulfilled-snowboard'))).text();
const m = css.match(/href="([^"]*compiled_assets\/styles\.css[^"]*)"/);
if (m) { const body = await (await ctx.request.get(m[1].startsWith('http') ? m[1] : origin + m[1])).text(); console.log('styles.css bytes', body.length, 'contains ".group{"', body.includes('.group{'), 'contains ".group {"', body.includes('.group {')); }
await browser.close();
