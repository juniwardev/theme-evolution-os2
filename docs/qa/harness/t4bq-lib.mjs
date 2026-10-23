// T4b QA (t4bq-*) helpers. Imports only t0-lib.mjs. Session cookie cached in T4BQ_STATE (never the password).
import { chromium, parseArgs, loginState as t0LoginState } from './t0-lib.mjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export { chromium, parseArgs };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function loginState(browser, withTheme) {
  const cache = process.env.T4BQ_STATE;
  if (cache && existsSync(cache)) {
    const j = JSON.parse(readFileSync(cache, 'utf8'));
    if (Date.now() - j.at < 50 * 60 * 1000) return { state: j.state, loggedIn: true };
  }
  const r = await t0LoginState(browser, withTheme);
  if (cache && r.loggedIn) writeFileSync(cache, JSON.stringify({ at: Date.now(), state: r.state }), { mode: 0o600 });
  return r;
}

export async function newPage(browser, state, vw, vh = 812, opts = {}) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vh }, ...opts });
  const page = await ctx.newPage();
  return { ctx, page };
}

// Overflow: document scroll width vs client width, plus offending elements (preview bar and app blocks skipped).
export const overflowFn = () => {
  const vw = document.documentElement.clientWidth;
  const host = document.querySelector('cart-drawer');
  const open = !!host && (host.getAttribute('data-state') === 'open' || host.classList.contains('is-open'));
  const off = [];
  for (const el of document.querySelectorAll('body *')) {
    if (host && host.contains(el) && !open) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    if (b.right > vw + 1 || b.left < -1) {
      if (el.closest('#preview-bar-iframe, [id^="shopify-block-"]')) continue;
      off.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className).slice(0, 40)} l${Math.round(b.left)} r${Math.round(b.right)}`);
    }
  }
  return { vw, sw: document.documentElement.scrollWidth, X: Math.max(0, document.documentElement.scrollWidth - vw), off: off.slice(0, 6) };
};
