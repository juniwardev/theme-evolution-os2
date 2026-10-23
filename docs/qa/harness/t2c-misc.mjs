// T2 Coder: C2.19 (card behaviour), C2.22 (JSON-LD), C2.24 (breakpoints), E2.12 (spinner visible while loading).
// Usage: node t2c-misc.mjs <previewBase>
import { chromium, parseArgs, loginState, PRODUCTS, scrollThrough } from './t2c-lib.mjs';
const { withTheme, origin } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(withTheme(PRODUCTS.snow), { waitUntil: 'load' });
await scrollThrough(page);
console.log('C2.22 jsonld', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => [!!s.closest('head'), JSON.parse(s.textContent)['@type']]))));
// C2.19
const info = await page.evaluate(() => {
  const pr = document.querySelector('product-recommendations');
  const cards = [...pr.querySelectorAll('[data-related-card]')];
  return { cards: cards.length, styleInPr: pr.querySelectorAll('style').length, prices: cards.map((c) => ({ compareAt: c.querySelectorAll('[data-compare-at]').length, directSpans: [...c.querySelector('[data-price]').children].filter((e) => e.tagName === 'SPAN' && !e.classList.contains('sr-only')).length, srOnly: c.querySelectorAll('[data-price] .sr-only').length })) };
});
console.log('C2.19 cards/price', JSON.stringify(info));
const hits = [];
for (let i = 0; i < info.cards; i++) {
  const r = await page.evaluate((i) => { const c = document.querySelectorAll('[data-related-card]')[i]; c.scrollIntoView({ block: 'center' }); const img = c.querySelector('img'); const b = img.getBoundingClientRect(); const el = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); const a = el && el.closest('a'); return { ok: !!a && c.contains(a), href: a && a.getAttribute('href') }; }, i);
  hits.push(r);
}
console.log('elementFromPoint at image centre ->', JSON.stringify(hits));
await page.evaluate(() => document.querySelectorAll('[data-related-card]')[0].scrollIntoView({ block: 'center' }));
const href = hits[0].href;
await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.mouse.click(await page.evaluate(() => { const b = document.querySelector('[data-related-card] img').getBoundingClientRect(); return b.left + b.width / 2; }), await page.evaluate(() => { const b = document.querySelector('[data-related-card] img').getBoundingClientRect(); return b.top + b.height / 2; }))]);
console.log('click navigated to', page.url().replace(origin, '').split('?')[0], 'expected', href);
// C2.24 breakpoints
for (const w of [767, 768]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(withTheme(PRODUCTS.snow), { waitUntil: 'load' });
  console.log('C2.24', w, await page.evaluate(() => getComputedStyle(document.querySelector('[id$="__main"] > div')).flexDirection));
}
// spinner visible while loading (delay the cart/add response)
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(withTheme(PRODUCTS.wax), { waitUntil: 'load' });
await page.route('**/cart/add*', async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
const clickP = page.locator('form[action*="/cart/add"] button[name=add]').first().click();
await page.waitForTimeout(900);
console.log('spinner while loading', JSON.stringify(await page.evaluate(() => { const b = document.querySelector('button[name=add]'); const sp = b.querySelector('.loading__spinner'); const bb = b.getBoundingClientRect(); const sb = sp.getBoundingClientRect(); const svg = sp.querySelector('svg').getBoundingClientRect(); return { btnLoading: b.classList.contains('loading'), spinnerHidden: sp.classList.contains('hidden'), spinnerDisplay: getComputedStyle(sp).display, spanVisibility: getComputedStyle(b.querySelector('span')).visibility, svgCenterDx: Math.round((svg.left + svg.width / 2) - (bb.left + bb.width / 2)), svgCenterDy: Math.round((svg.top + svg.height / 2) - (bb.top + bb.height / 2)), svgSize: [svg.width, svg.height], anim: getComputedStyle(sp.querySelector('svg')).animationName }; })));
await page.locator('button[name=add]').first().screenshot({ path: 'docs/qa/screenshots/t2c-spinner-loading.png' });
await clickP.catch(() => {});
await page.waitForTimeout(3500);
console.log('after', JSON.stringify(await page.evaluate(() => { const b = document.querySelector('button[name=add]'); return { aria: b.getAttribute('aria-disabled'), spinnerHidden: b.querySelector('.loading__spinner').classList.contains('hidden') }; })));
await page.evaluate(async () => { await fetch('/cart/clear.js', { method: 'POST' }); });
await browser.close();
