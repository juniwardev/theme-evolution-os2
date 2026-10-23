// T2 Coder harness helpers (t2c-*). Reuses t0-lib.mjs for login (password read from docs/dev-fixtures.md, never printed).
import { chromium, parseArgs, loginState } from './t0-lib.mjs';

export { chromium, parseArgs, loginState };

export const PRODUCTS = {
  p3p: '/products/the-3p-fulfilled-snowboard',
  wax: '/products/selling-plans-ski-wax',
  snow: '/products/the-complete-snowboard',
  land: '/products/the-complete-snowboard?view=landing-page',
  home: '/',
};

// Scroll in 600px steps, 250ms apart, so product-recommendations (IntersectionObserver) fetches. Method M_css step 3.
export async function scrollThrough(page, { waitCards = true } = {}) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h + 600; y += 600) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(250);
  }
  let cards = 0;
  if (waitCards) {
    const t0 = Date.now();
    while (Date.now() - t0 < 8000) {
      cards = await page.evaluate(() => document.querySelectorAll('product-recommendations li').length);
      if (cards >= 1) break;
      await page.waitForTimeout(300);
    }
  }
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  return cards;
}

// X_page and X_off (deepest first), run in the page.
export const overflowFn = () => {
  const vw = innerWidth;
  const offs = [];
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden]')) continue;
    const drawer = el.closest('cart-drawer');
    if (drawer && !drawer.classList.contains('is-open')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 0.5) {
      let depth = 0;
      for (let p = el; p; p = p.parentElement) depth++;
      offs.push({ depth, tag: el.tagName.toLowerCase(), cls: String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 60), id: el.id || '', right: Math.round(r.right * 10) / 10 });
    }
  }
  offs.sort((a, b) => b.depth - a.depth);
  return { xPage: document.documentElement.scrollWidth - vw, offs: offs.slice(0, 12) };
};
