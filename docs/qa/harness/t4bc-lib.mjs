// T4b Coder harness helpers (t4bc-*). Reuses only t0-lib.mjs (login; password read from docs/dev-fixtures.md, never printed).
// Nothing here imports t2c-lib/t3c-lib/t4ac-lib. Copies from t4ac-lib: loginState (T4BC_STATE), newPage, seedCart, the fixed overflowFn.
import { chromium, parseArgs, loginState as t0LoginState } from './t0-lib.mjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export { chromium, parseArgs };

// The session cookie (never the password) is cached in T4BC_STATE for up to 50 minutes (Cloudflare 429 on password POST bursts).
export async function loginState(browser, withTheme) {
  const cache = process.env.T4BC_STATE;
  if (cache && existsSync(cache)) {
    const j = JSON.parse(readFileSync(cache, 'utf8'));
    if (Date.now() - j.at < 50 * 60 * 1000) return { state: j.state, loggedIn: true };
  }
  const r = await t0LoginState(browser, withTheme);
  if (cache && r.loggedIn) writeFileSync(cache, JSON.stringify({ at: Date.now(), state: r.state }), { mode: 0o600 });
  return r;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const HANDLES = { wax: 'selling-plans-ski-wax', snow: 'the-complete-snowboard', p3p: 'the-3p-fulfilled-snowboard' };

export async function newPage(browser, state, vw, vh = 812) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vh } });
  const page = await ctx.newPage();
  return { ctx, page };
}

export async function seedCart(page, withTheme, handles) {
  for (const h of handles) {
    await page.goto(withTheme('/products/' + h), { waitUntil: 'load' });
    const [resp] = await Promise.all([
      page.waitForResponse((r) => /\/cart\/add/.test(r.url())),
      page.locator('button[name="add"]').first().click(),
    ]);
    if (!resp.ok()) throw new Error(`add to cart ${h} -> ${resp.status()}`);
    await sleep(500);
  }
}

export const overflowFn = () => {
  const vw = document.documentElement.clientWidth;
  const host = document.querySelector('cart-drawer');
  const open = !!host && ((host.getAttribute('data-state') === 'open' && !host.hasAttribute('hidden')) || host.classList.contains('is-open'));
  const off = [];
  for (const el of document.querySelectorAll('body *')) {
    if (host && host.contains(el) && !open) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    if (b.right > vw + 1 || b.left < -1) {
      if (el.closest('[id^="shopify-block-"], #preview-bar-iframe, #shopify-section-cart-drawer .cart-drawer__inner') && !(host && host.contains(el))) continue;
      off.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className).slice(0, 40)} l${Math.round(b.left)} r${Math.round(b.right)}`);
    }
  }
  return { vw, sw: document.documentElement.scrollWidth, off: off.slice(0, 12) };
};

// Section 10 page table (paths filled by fixtures where they depend on the store).
export const PAGES = {
  collection: '/collections/all',
  collections: '/collections',
  search: '/search?q=snowboard',
  archive: '/pages/the-material-archive',
  missing: '/pages/tailwind-qa-missing',
  home: '/',
  wax: '/products/' + HANDLES.wax,
  snow: '/products/' + HANDLES.snow,
  p3p: '/products/' + HANDLES.p3p,
  cart: '/cart',
};

// In page: the T4b root of the page (section wrapper ending __main for templates; main for gift cards).
export const rootsFn = () => {
  const r = [...document.querySelectorAll('[id^="shopify-section-template"][id$="__main"]')];
  return r;
};

export const PROPS = ['display', 'position', 'marginTop', 'marginBottom', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'width', 'height', 'fontFamily', 'fontSize', 'fontWeight',
  'lineHeight', 'textTransform', 'textAlign', 'textDecorationLine', 'color', 'backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderTopLeftRadius', 'columnGap', 'rowGap', 'gridTemplateColumns'];

// Geometry and PROPS for every displayed element under the roots, rects relative to the first root, rounded to 0.1 px.
export const dumpFn = (props) => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const roots = [...document.querySelectorAll('[id^="shopify-section-template"][id$="__main"]')];
  const out = [];
  for (const root of roots) {
    const rb = root.getBoundingClientRect();
    for (const el of [root, ...root.querySelectorAll('*')]) {
      if (el.closest('[id^="shopify-block-"]')) continue;
      const s = getComputedStyle(el);
      if (s.display === 'none') continue;
      const b = el.getBoundingClientRect();
      const o = { p: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + '.' + String(el.className).slice(0, 50), x: r1(b.left), y: r1(b.top - rb.top), w: r1(b.width), h: r1(b.height) };
      for (const p of props) o[p] = s[p];
      out.push(o);
    }
  }
  return out;
};
