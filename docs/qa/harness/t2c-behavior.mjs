// T2 Coder: product-page behaviours. C2.11 picker, C2.12 add-to-cart flow + header aria-label, C2.13 422 recovery,
// C2.14 button tokens, C2.15 h1, C2.21 accordion, C2.23 CWV/preload. Usage: node t2c-behavior.mjs <previewBase> [widthsCsv=1440,375]
import { chromium, parseArgs, loginState, PRODUCTS } from './t2c-lib.mjs';
const { withTheme, origin } = parseArgs();
const widths = (process.argv[3] || '1440,375').split(',').map(Number);
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const log = (...a) => console.log(...a);
const hdr = (p) => p.evaluate(() => { const a = document.querySelector('[data-header-cart-icon]'); const b = a && a.querySelector('[data-count]'); return { aria: a && a.getAttribute('aria-label'), badge: b && !b.hidden && getComputedStyle(b).display !== 'none' ? b.textContent.trim() : null }; });
const btn = (p) => p.evaluate(() => { const b = document.querySelector('button[name=add]'); const sp = b.querySelector('.loading__spinner'); return { aria: b.getAttribute('aria-disabled'), spinnerHidden: sp.classList.contains('hidden') }; });
for (const vw of widths) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
  // C2.11 + C2.14 + C2.15 + C2.23 on each product
  for (const key of ['p3p', 'wax', 'snow', 'land']) {
    const resp = await page.goto(withTheme(PRODUCTS[key]), { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    const handle = PRODUCTS[key].split('/products/')[1].split('?')[0];
    const pj = await (await ctx.request.get(origin + '/products/' + handle + '.js')).json();
    const r = await page.evaluate(() => {
      const root = document.querySelector('[id$="__main"]');
      const sel = root.querySelector('select[name="id"]');
      const add = root.querySelector('button[name=add]'); const acs = getComputedStyle(add);
      const share = [...root.querySelectorAll('button')].find((b) => b.name !== 'add' && !b.closest('.shopify-payment-button') && !b.closest('product-form'));
      const ss = share && getComputedStyle(share);
      const rootCs = getComputedStyle(document.documentElement);
      const h1 = document.querySelector('h1'); const h1s = getComputedStyle(h1);
      const imgs = [...root.querySelectorAll('img')].map((i) => [i.getAttribute('loading'), i.getAttribute('fetchpriority'), !!(i.getAttribute('width') && i.getAttribute('height'))]);
      return {
        select: !!sel, opts: sel ? sel.options.length : 0, selectedVal: sel && sel.value, hasDefaultTitle: /Default Title/.test(root.textContent),
        add: { bg: acs.backgroundColor, accent: rootCs.getPropertyValue('--color-accent').trim(), color: acs.color, accFg: rootCs.getPropertyValue('--color-accent-foreground').trim(), font: acs.fontFamily.slice(0, 12), h: add.getBoundingClientRect().height, tt: acs.textTransform },
        share: ss && { bt: ss.borderTopWidth, bg: ss.backgroundColor },
        h1: { n: document.querySelectorAll('h1').length, font: h1s.fontFamily.slice(0, 10), size: h1s.fontSize },
        imgs, imgsAllSized: imgs.every((i) => i[2]),
      };
    });
    const linkHdr = resp.headers()['link'] || '';
    const preloads = (linkHdr.match(/rel="?preload/g) || []).length;
    log(vw, key, 'variants', pj.variants.length, 'selected', pj.variants.find((v) => v.available)?.id, JSON.stringify(r), 'preloadLinks', preloads);
    await page.waitForTimeout(1000);
  }
  // C2.21 accordion on snow
  await page.goto(withTheme(PRODUCTS.snow), { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const apiReq = []; page.on('request', (r) => { if (r.url().includes('view=api')) apiReq.push(r.url().slice(-40)); });
  await page.locator('#MaterialAccordion summary').click();
  await page.waitForTimeout(2000);
  log(vw, 'accordion', JSON.stringify(await page.evaluate(() => { const d = document.querySelector('#MaterialAccordion'); const ic = d.querySelector('summary span'); const th = d.querySelector('.material-accordion__thumbnail'); return { open: d.open, icon: getComputedStyle(ic).rotate + ' / ' + getComputedStyle(ic).transform, thumbMax: th && getComputedStyle(th).maxWidth, thumbW: th && Math.round(th.getBoundingClientRect().width), children: document.querySelector('#material-data-container').children.length, loadingGone: !document.querySelector('#material-data-container').textContent.includes('Loading') }; })), 'api', apiReq.length);
  // C2.13 422 on 3p
  await page.goto(withTheme(PRODUCTS.p3p), { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  const b0 = await hdr(page);
  const resp422 = page.waitForResponse((r) => r.url().includes('/cart/add'), { timeout: 8000 }).catch(() => null);
  await page.locator('button[name=add]').click();
  const rr = await resp422;
  await page.waitForTimeout(3000);
  log(vw, '3p add', rr && rr.status(), 'after', JSON.stringify(await btn(page)), 'badge before/after', JSON.stringify(b0), JSON.stringify(await hdr(page)), 'drawerOpen', await page.evaluate(() => document.querySelector('cart-drawer')?.classList.contains('is-open')), 'pageerrors', errs.length);
  // C2.12 cart flow on wax and snow
  for (const key of ['wax', 'snow']) {
    await page.goto(withTheme(PRODUCTS[key]), { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    log(vw, key, 'start', JSON.stringify(await hdr(page)));
    const add = page.locator('form[action*="/cart/add"] button[name=add]').first();
    const pr = page.waitForResponse((r) => r.url().includes('/cart/add'), { timeout: 8000 }).catch(() => null);
    await add.click();
    const ar = await pr; await page.waitForTimeout(2500);
    log(vw, key, 'add', ar && ar.status(), 'drawerOpen', await page.evaluate(() => document.querySelector('cart-drawer')?.classList.contains('is-open')), JSON.stringify(await hdr(page)), JSON.stringify(await btn(page)));
    const q = page.locator('input.cart-drawer__quantity-input').first();
    if (await q.count() && (await q.isVisible())) {
      await q.fill('3'); await q.dispatchEvent('change'); await page.waitForTimeout(3000);
      log(vw, key, 'qty3', JSON.stringify(await hdr(page)));
      const rm = page.locator('cart-drawer cart-remove-button, cart-drawer a[href*="change"], cart-drawer button[name="remove"]').first();
      if (await rm.count()) { await rm.click(); await page.waitForTimeout(3000); log(vw, key, 'removed', JSON.stringify(await hdr(page)), JSON.stringify(await btn(page))); } else log(vw, key, 'no remove control');
    } else log(vw, key, 'drawer qty input not visible');
    await page.evaluate(async () => { await fetch('/cart/clear.js', { method: 'POST' }); });
    await page.waitForTimeout(1200);
  }
  await ctx.close();
}
await browser.close();
