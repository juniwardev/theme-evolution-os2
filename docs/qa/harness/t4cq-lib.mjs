// T4c QA helpers (t4cq-*). Imports only t0-lib.mjs (login; the password is read there and never printed).
import { chromium, parseArgs, loginState as t0LoginState } from './t0-lib.mjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export { chromium, parseArgs };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Session cookie cached in T4CQ_STATE (never the password) to avoid Cloudflare 429s.
export async function loginState(browser, withTheme) {
  const cache = process.env.T4CQ_STATE;
  if (cache && existsSync(cache)) {
    const j = JSON.parse(readFileSync(cache, 'utf8'));
    if (Date.now() - j.at < 50 * 60 * 1000) return { state: j.state, loggedIn: true };
  }
  const r = await t0LoginState(browser, withTheme);
  if (cache && r.loggedIn) writeFileSync(cache, JSON.stringify({ at: Date.now(), state: r.state }), { mode: 0o600 });
  return r;
}

export async function newPage(browser, state, vw, vh = 900) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vh } });
  return { ctx, page: await ctx.newPage() };
}

export const PAGES = {
  home: '/',
  optout: '/pages/data-sharing-opt-out',
  balanced: '/pages/the-balanced-face-test-page',
  contact: '/pages/contact',
  archive: '/pages/the-material-archive',
  p3p: '/products/the-3p-fulfilled-snowboard',
  wax: '/products/selling-plans-ski-wax',
  snow: '/products/the-complete-snowboard',
  policy: '/policies/privacy-policy',
  collection: '/collections/all',
  collections: '/collections',
  search: '/search?q=snowboard',
  blog: '/blogs/news',
  missing: '/pages/tailwind-qa-missing',
  cart: '/cart',
};

// In-page: X_page, scroll-aware offenders, h1 count, imgs lacking width/height.
export const overflowFn = () => {
  const vw = document.documentElement.clientWidth;
  const off = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    if (b.right > vw + 1 || b.left < -1) {
      if (el.closest('[id^="shopify-block-"], #preview-bar-iframe, cart-drawer:not([data-state=open])')) continue;
      let clipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        if (getComputedStyle(a).overflowX !== 'visible' && a.getBoundingClientRect().right <= vw + 1) { clipped = true; break; }
      }
      if (clipped) continue;
      off.push(el.tagName.toLowerCase() + '.' + String(el.className).slice(0, 50) + ' l' + Math.round(b.left) + ' r' + Math.round(b.right));
    }
  }
  const imgs = [...document.querySelectorAll('main img, footer img, header img')].filter((i) => !i.hasAttribute('width') || !i.hasAttribute('height')).map((i) => i.currentSrc.slice(-40));
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => h.getClientRects().length).map((h) => h.tagName[1]).join('');
  return { X: document.documentElement.scrollWidth - innerWidth, off: off.slice(0, 8), h1: document.querySelectorAll('h1').length, heads, imgsNoWH: imgs };
};
