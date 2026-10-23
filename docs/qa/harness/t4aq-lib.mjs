// T4a QA (t4aq-*) helpers. Independent of the Coder's t4ac-lib: only t0-lib (login) is reused.
// The storefront password is read inside t0-lib from docs/dev-fixtures.md and never printed.
// T4AQ_STATE (a scratch path) caches the session cookie so the password POST rate limit is not hit.
import { chromium, parseArgs, loginState as t0Login } from './t0-lib.mjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export { chromium, parseArgs };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const H = { wax: 'selling-plans-ski-wax', snow: 'the-complete-snowboard', p3p: 'the-3p-fulfilled-snowboard' };

export async function loginState(browser, withTheme) {
  const cache = process.env.T4AQ_STATE;
  if (cache && existsSync(cache)) {
    const j = JSON.parse(readFileSync(cache, 'utf8'));
    if (Date.now() - j.at < 50 * 60 * 1000) return { state: j.state, loggedIn: true };
  }
  const r = await t0Login(browser, withTheme);
  if (cache && r.loggedIn) writeFileSync(cache, JSON.stringify({ at: Date.now(), state: r.state }), { mode: 0o600 });
  return r;
}

// Fresh context per call = fresh (empty) cart. Console errors, page errors and failed requests are collected on ctx.__log.
export async function newPage(browser, state, vw, vh = 812) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vh } });
  const page = await ctx.newPage();
  const log = { console: [], pageerror: [], reqfail: [], bad: [] };
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) log.console.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => log.pageerror.push(String(e).slice(0, 200)));
  page.on('requestfailed', (r) => log.reqfail.push(`${r.method()} ${r.url().slice(0, 120)} ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) log.bad.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 120)}`); });
  page.__log = log;
  return { ctx, page, log };
}

export async function addFromProduct(page, withTheme, handle) {
  await page.goto(withTheme('/products/' + handle), { waitUntil: 'load' });
  const [resp] = await Promise.all([
    page.waitForResponse((r) => /\/cart\/add/.test(r.url())),
    page.locator('button[name="add"]').first().click(),
  ]);
  return resp.status();
}

// Seeds by the theme's own form on a throwaway page, then returns. No fetch to .js endpoints (Cloudflare 429).
export async function seed(page, withTheme, handles) {
  for (const h of handles) {
    const s = await addFromProduct(page, withTheme, h);
    if (s >= 400) throw new Error(`seed ${h} -> ${s}`);
    await sleep(600);
  }
}

export const hostState = (page) => page.evaluate(() => {
  const h = document.querySelector('cart-drawer');
  if (!h) return null;
  const p = h.querySelector('[role="dialog"]');
  const ov = h.querySelector('#CartDrawer > [data-cart-drawer-close]');
  const bcs = getComputedStyle(document.body);
  const pr = p.getBoundingClientRect();
  const ocs = getComputedStyle(ov);
  return {
    hidden: h.hasAttribute('hidden'), state: h.getAttribute('data-state'), display: getComputedStyle(h).display,
    busy: h.getAttribute('aria-busy'), cls: h.className,
    bodyOverflow: bcs.overflow, bodyStyleAttr: document.body.getAttribute('style'),
    panelL: Math.round(pr.left), panelR: Math.round(pr.right), panelW: Math.round(pr.width), vw: innerWidth,
    ovDisplay: ocs.display, ovOpacity: ocs.opacity,
    active: document.activeElement ? document.activeElement.tagName + '.' + String(document.activeElement.className).slice(0, 30) : null,
  };
});
