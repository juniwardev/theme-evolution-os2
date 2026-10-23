// Round 2: header full-bleed geometry. Usage: node t1r2-header-fullbleed.mjs <previewBase> <label>
import { chromium, parseArgs, loginState } from './t0-lib.mjs';
const { withTheme } = parseArgs();
const label = process.argv[3] || 'run';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = {};
for (const path of ['/', '/products/the-3p-fulfilled-snowboard']) {
  for (const w of [320, 375, 768, 900, 1023, 1024, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, storageState: state });
    const page = await ctx.newPage();
    await page.goto(withTheme(path), { waitUntil: 'load' });
    await sleep(1200);
    out[`${path}@${w}`] = await page.evaluate(() => {
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [+b.left.toFixed(1), +b.right.toFixed(1)]; };
      const wr = document.querySelector('.theme-evolution-header-wrapper');
      const hdr = wr.querySelector('header');
      const toggle = wr.querySelector('theme-evolution-header-menu button');
      return {
        bar: r(wr), logo: r(hdr.querySelector('h2 a')),
        nav: r(hdr.querySelector('a[href]:not(h2 a):not([data-header-cart-icon])')),
        navLinks: [...hdr.querySelectorAll('div[aria-label] a')].slice(0,1).map(r)[0] || null,
        toggle: r(toggle), cart: r(hdr.querySelector('[data-header-cart-icon]')),
        bg: getComputedStyle(wr).backgroundColor,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        sticky: getComputedStyle(wr.closest('.shopify-section')).position,
      };
    });
    if (w < 1024) {
      const t = page.locator('theme-evolution-header-menu button');
      if (await t.count()) {
        await t.click(); await sleep(300);
        out[`${path}@${w}`].panel = await page.evaluate(() => {
          const p = document.querySelector('.theme-evolution-header-menu__panel');
          const b = p.getBoundingClientRect(); const a = p.querySelector('a').getBoundingClientRect();
          return { panel: [+b.left.toFixed(1), +b.right.toFixed(1)], link: [+a.left.toFixed(1), +a.right.toFixed(1)], expanded: document.querySelector('theme-evolution-header-menu button').getAttribute('aria-expanded'), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
      }
    }
    await ctx.close(); await sleep(700);
  }
}
const fs = await import('node:fs');
fs.writeFileSync(`/private/tmp/claude-501/-Users-juniorwarner-Projects-Shopify-theme-evolution-os2/76455d1b-9386-41d3-9111-196e50ac6844/scratchpad/${label}.json`, JSON.stringify(out, null, 1));
console.log('done', label);
await browser.close();
