// T2 QA: independent PDP checks. Console errors/warnings and failed requests per page, heading order, button names,
// keyboard focus visibility on Add to cart / Share, tooltip keyboard access, card geometry (title-to-price gap), screenshots.
// Usage: node t2q-pdp.mjs <previewBase> <label>
import { chromium, parseArgs, loginState, PRODUCTS, scrollThrough } from './t2c-lib.mjs';

const { withTheme } = parseArgs();
const label = process.argv[3] || 'head';
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = (...a) => console.log(...a);

for (const vw of [1440, 375]) {
  for (const key of ['p3p', 'wax', 'snow', 'land', 'home']) {
    const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vw > 800 ? 900 : 800 } });
    const page = await ctx.newPage();
    const msgs = [];
    const fails = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) msgs.push(`${m.type()}: ${m.text().slice(0, 160)}`); });
    page.on('pageerror', (e) => msgs.push('pageerror: ' + String(e).slice(0, 160)));
    page.on('requestfailed', (r) => fails.push(`FAILED ${r.url().slice(0, 100)}`));
    page.on('response', (r) => { if (r.status() >= 400) fails.push(`${r.status()} ${r.url().slice(0, 100)}`); });
    await page.goto(withTheme(PRODUCTS[key]), { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const cards = await scrollThrough(page);
    const a = await page.evaluate(() => {
      const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => h.offsetParent !== null || getComputedStyle(h).position === 'fixed').map((h) => +h.tagName[1]);
      let skips = 0;
      for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) skips++;
      const unnamed = [...document.querySelectorAll('main button, main a, button')].filter((b) => {
        if (b.closest('[hidden]') || b.closest('.shopify-payment-button') || b.closest('shopify-accelerated-checkout')) return false;
        const n = (b.getAttribute('aria-label') || b.textContent || b.getAttribute('title') || '').trim();
        return !n && !b.querySelector('img[alt]:not([alt=""])');
      }).map((b) => b.outerHTML.slice(0, 100));
      const imgsNoAlt = [...document.querySelectorAll('main img')].filter((i) => !i.hasAttribute('alt')).length;
      return { heads: hs.join(''), skips, unnamed: unnamed.slice(0, 5), imgsNoAlt };
    });
    out(`[${label}] ${vw} ${key} cards=${cards} h=${a.heads} skips=${a.skips} unnamed=${JSON.stringify(a.unnamed)} imgNoAlt=${a.imgsNoAlt}`);
    out(`   console: ${msgs.length ? JSON.stringify([...new Set(msgs)]) : 'none'}`);
    out(`   net>=400/failed: ${fails.length ? JSON.stringify([...new Set(fails)].slice(0, 8)) : 'none'}`);
    if (['p3p', 'wax', 'snow'].includes(key)) {
      await page.screenshot({ path: `docs/qa/screenshots/t2q-${label}-${key}-${vw}.png`, fullPage: true });
    }
    if (['wax', 'snow'].includes(key)) {
      // Keyboard focus ring on Add to cart and Share.
      await page.evaluate(() => window.scrollTo(0, 0));
      const focus = {};
      for (const sel of ['button[name=add]', 'main button:not([name=add]):not(.shopify-payment-button__button)']) {
        const f = await page.evaluate((s) => {
          const root = document.querySelector('[id$="__main"]');
          const el = s.startsWith('main') ? [...root.querySelectorAll('button')].find((b) => b.name !== 'add' && !b.closest('.shopify-payment-button') && !b.closest('product-form') && !b.closest('summary')) : root.querySelector(s);
          if (!el) return null;
          el.focus({ focusVisible: true });
          const cs = getComputedStyle(el);
          return { text: el.textContent.trim().slice(0, 20), focusVisible: el.matches(':focus-visible'), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, shadow: cs.boxShadow.slice(0, 60) };
        }, sel);
        focus[sel.slice(0, 18)] = f;
      }
      out('   focus:', JSON.stringify(focus));
      // Hover and disabled colors of btn-primary
      const hv = await page.evaluate(() => { const b = document.querySelector('button[name=add]'); return getComputedStyle(b).backgroundColor; });
      await page.hover('button[name=add]');
      const hv2 = await page.evaluate(() => getComputedStyle(document.querySelector('button[name=add]')).backgroundColor);
      out(`   add bg rest=${hv} hover=${hv2}`);
    }
    if (key === 'snow' && vw === 1440) {
      // Tooltip keyboard access: tab to the trigger.
      const t = await page.evaluate(() => { const tr = document.querySelector('.eco-tooltip-trigger'); return tr ? { tabindex: tr.getAttribute('tabindex'), role: tr.getAttribute('role'), tag: tr.tagName } : null; });
      out('   tooltip trigger attrs:', JSON.stringify(t));
      let shown = null;
      if (t) {
        await page.evaluate(() => { const tr = document.querySelector('.eco-tooltip-trigger'); tr.scrollIntoView({ block: 'center' }); tr.focus(); });
        await page.waitForTimeout(1200);
        shown = await page.evaluate(() => { const e = document.querySelector('.eco-tooltip'); return e ? getComputedStyle(e).opacity : 'no tooltip element'; });
      }
      out('   tooltip after focus:', shown);
      // Card geometry: title-to-price gap.
      const g = await page.evaluate(() => {
        const li = document.querySelector('product-recommendations li');
        const title = li.querySelector('h3'); const price = li.querySelector('[data-price]');
        const tr = title.getBoundingClientRect(); const pr = price.getBoundingClientRect();
        return { titleBottom: tr.bottom, priceTop: pr.top, gap: Math.round((pr.top - tr.bottom) * 10) / 10, titleFont: getComputedStyle(title).fontSize, priceFont: getComputedStyle(price).fontSize };
      });
      out('   card gap:', JSON.stringify(g));
    }
    await ctx.close();
  }
}
await browser.close();
