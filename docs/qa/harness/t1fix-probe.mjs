// T1 QA-fix round 1 probe: overflow (X_hdr/X_page), glyph/badge/illustration geometry, nav wrap.
// Usage: node docs/qa/harness/t1fix-probe.mjs <previewBase> <label> [widthsCsv] [pagesCsv] [seed=0|1]
// Run from the repo root. Password is read by t0-lib.mjs and never printed.
import { chromium, parseArgs, loginState } from './t0-lib.mjs';

const [, label, widthsArg, pagesArg, seedArg] = process.argv.slice(2);
const { withTheme } = parseArgs();
const widths = (widthsArg || '320,375,390,430,768,790,805,900,1023,1024,1440').split(',').map(Number);
const PAGES = { home: '/', p3p: '/products/the-3p-fulfilled-snowboard' };
const pages = (pagesArg || 'home,p3p').split(',');
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);

for (const key of pages) {
  for (const vw of widths) {
    const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: 900 } });
    const page = await ctx.newPage();
    if (seedArg === '1') {
      await page.goto(withTheme('/cart.json'), { waitUntil: 'load' });
    }
    await page.goto(withTheme(PAGES[key]), { waitUntil: 'load' });
    if (seedArg === '1') {
      await page.evaluate(async () => {
        const v = await (await fetch('/products/selling-plans-ski-wax.js')).json();
        await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: v.variants[0].id, quantity: 2 }] }) });
      });
      await page.goto(withTheme(PAGES[key]), { waitUntil: 'load' });
    }
    await page.waitForTimeout(1500);
    const m = await page.evaluate(() => {
      const r1 = (n) => Math.round(n * 10) / 10;
      const w = document.querySelector('.theme-evolution-header-wrapper');
      let max = -Infinity;
      for (const el of [w, ...w.querySelectorAll('*')]) {
        const s = getComputedStyle(el);
        if (s.display === 'none' || s.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width || r.height) max = Math.max(max, r.right);
      }
      const glyph = (a) => {
        const svg = a && a.querySelector('svg');
        const p = svg && svg.querySelector('path');
        if (!p) return null;
        const b = p.getBoundingClientRect();
        const sb = svg.getBoundingClientRect();
        return { svg: [r1(sb.width), r1(sb.height)], art: [r1(b.width), r1(b.height)], artX: r1(b.left), artY: r1(b.top) };
      };
      const cart = w.querySelector('[data-header-cart-icon]');
      const acct = w.querySelector('a[href*="/account"], a[href*="/customer_authentication"], a[href*="/customers"]');
      const badge = cart && cart.querySelector('[data-count]');
      const bb = badge && !badge.hidden ? badge.getBoundingClientRect() : null;
      const cb = cart && cart.getBoundingClientRect();
      const nav = w.querySelector('div[aria-label]');
      const links = nav ? [...nav.querySelectorAll('a')].map((a) => r1(a.getBoundingClientRect().height)) : null;
      const ill = document.querySelector('.welcome-content .icon, .welcome .icon');
      const ib = ill && ill.getBoundingClientRect();
      const iimg = ill && ill.querySelector('img');
      const imb = iimg && iimg.getBoundingClientRect();
      const fs = document.querySelector('.theme-evolution-footer__social-link svg'); const fp = document.querySelector('footer li svg[class*="icon-"], footer li svg');
      const sz = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [r1(b.width), r1(b.height)]; };
      return {
        footSocial: sz(fs), footPay: sz(fp), tgl: sz(w.querySelector('.theme-evolution-header-menu__toggle svg')),
        xHdr: r1(max - innerWidth), xPage: document.documentElement.scrollWidth - innerWidth,
        cartBox: cb && [r1(cb.width), r1(cb.height), r1(cb.left), r1(cb.top)],
        cart: glyph(cart), acct: glyph(acct),
        badge: bb && { w: r1(bb.width), h: r1(bb.height), x: r1(bb.left), y: r1(bb.top), right: r1(bb.right) },
        navDisplay: nav ? getComputedStyle(nav).display : null, linkHeights: links,
        toggleDisplay: (() => { const t = w.querySelector('theme-evolution-header-menu'); return t ? getComputedStyle(t).display : null; })(),
        illDiv: ib && [r1(ib.width), r1(ib.height)], illImg: imb && [r1(imb.width), r1(imb.height)],
      };
    });
    console.log(`${label} ${key} ${vw}`, JSON.stringify(m));
    if (process.env.SHOT) await page.screenshot({ path: `docs/qa/screenshots/${process.env.SHOT}-${key}-${vw}.png`, clip: { x: Math.max(0, vw - 420), y: 0, width: Math.min(vw, 420), height: 90 }, scale: 'device' });
    await ctx.close();
    await new Promise((s) => setTimeout(s, 900));
  }
}
await browser.close();
