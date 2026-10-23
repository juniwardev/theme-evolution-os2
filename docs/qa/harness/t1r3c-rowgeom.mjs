// Re-run 2: vertical geometry of the header content row vs the 64px bar, plus screenshots. Usage: node t1r2q-rowgeom.mjs <previewBase> <label>
import { chromium, parseArgs, loginState } from './t0-lib.mjs';
const { withTheme } = parseArgs();
const label = process.argv[3] || 'run';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const SHOTS = 'docs/qa/screenshots';
for (const w of [320, 375, 768, 1023, 1024, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, storageState: state });
  const page = await ctx.newPage();
  await page.goto(withTheme('/products/the-3p-fulfilled-snowboard'), { waitUntil: 'load' });
  await sleep(1500);
  const r = await page.evaluate(() => {
    const bx = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; };
    const wr = document.querySelector('.theme-evolution-header-wrapper');
    const hdr = wr.querySelector('header');
    const inner = hdr.firstElementChild;
    const navLink = [...hdr.querySelectorAll('div[aria-label] a')][0];
    const cs = navLink ? getComputedStyle(navLink) : null;
    const foot = document.querySelector('footer, .theme-evolution-footer, [class*=footer]');
    const fb = foot ? foot.getBoundingClientRect() : null;
    return { bar: bx(wr), header: bx(hdr), inner: bx(inner), logo: bx(hdr.querySelector('h2 a')), cart: bx(hdr.querySelector('[data-header-cart-icon]')), navLink: bx(navLink), navColor: cs && cs.color, navVisible: navLink ? (() => { const b = navLink.getBoundingClientRect(); return b.bottom <= wr.getBoundingClientRect().bottom && b.top >= 0; })() : null, footerLR: fb ? [Math.round(fb.left), Math.round(fb.right)] : null };
  });
  console.log(label, w, JSON.stringify(r));
  await page.screenshot({ path: `${SHOTS}/t1r3c-${label}-top-${w}.png`, clip: { x: 0, y: 0, width: w, height: 200 } });
  if (w === 375 || w === 768) {
    await page.click('.theme-evolution-header-menu__toggle'); await sleep(500);
    await page.screenshot({ path: `${SHOTS}/t1r3c-${label}-panel-${w}.png`, clip: { x: 0, y: 0, width: w, height: 420 } });
  }
  await ctx.close(); await sleep(800);
}
await browser.close();
