// T6b Coder harness helpers (t6bc-*). Imports only t0-lib.mjs (login; the storefront password is read there and never printed).
// loginState, newPage, sleep, seedCart, overflowFn2 are copied from t5bc-lib.mjs / t4cc-lib.mjs. In-page functions (...Fn) are self-contained for Playwright serialisation.
import { chromium, parseArgs, loginState as t0LoginState } from './t0-lib.mjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export { chromium, parseArgs };
export const DEV_ID = 188245508192;

// Session cookie (never the password) cached in T6BC_STATE for up to 6 hours (a re-login is itself challenged while Cloudflare is cooling down) (Cloudflare 429 on password POST bursts).
export async function loginState(browser, withTheme) {
  const cache = process.env.T6BC_STATE;
  if (cache && existsSync(cache)) {
    const j = JSON.parse(readFileSync(cache, 'utf8'));
    if (Date.now() - j.at < 6 * 60 * 60 * 1000) return { state: j.state, loggedIn: true };
  }
  const r = await t0LoginState(browser, withTheme);
  if (cache && r.loggedIn) writeFileSync(cache, JSON.stringify({ at: Date.now(), state: r.state }), { mode: 0o600 });
  return r;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const HANDLES = { wax: 'selling-plans-ski-wax', snow: 'the-complete-snowboard', p3p: 'the-3p-fulfilled-snowboard' };

// Cloudflare answers bursts of /cart/add (and /cart/change) with a 429 challenge that lasts 20+ minutes, so every such request
// goes through a global pacer shared by all harness processes (timestamp file next to T6BC_STATE).
export async function pace(kind) {
  const f = (process.env.T6BC_STATE || '/tmp/t6bc') + '.pace';
  const gap = kind === 'add' ? 150000 : 60000;
  let last = 0;
  try { last = JSON.parse(readFileSync(f, 'utf8')).at; } catch { /* first call */ }
  const wait = gap - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  writeFileSync(f, JSON.stringify({ at: Date.now() }));
}

export async function newPage(browser, state, vw, vh = 812, extra = {}) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vh }, ...extra });
  await ctx.route(/\/cart\/(add|change)/, async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.fallback();
    if (/\/cart\/add/.test(req.url())) {
      // A variant that already got a real answer in an earlier request is answered from the recorded response (same status and body),
      // so the bucket Cloudflare enforces on /cart/add is spent on real cart state only. Replayed adds don't change the server cart.
      const vid = ((req.postData() || '').match(/name="id"\r?\n\r?\n(\d+)/) || (req.postData() || '').match(/"id":\s*"?(\d+)/) || [])[1];
      const f = (process.env.T6BC_STATE || '/tmp/t6bc') + '.replay';
      let map = {};
      try { map = JSON.parse(readFileSync(f, 'utf8')); } catch { /* none yet */ }
      if (vid && map[vid] && !ctx.__real) { await sleep(150); return route.fulfill({ status: map[vid].status, contentType: 'application/json', body: map[vid].body }); }
      await pace('add');
      const resp = await route.fetch();
      const body = await resp.text();
      if (vid && resp.status() !== 429 && !/<!DOCTYPE/i.test(body)) { map[vid] = { status: resp.status(), body }; writeFileSync(f, JSON.stringify(map)); }
      return route.fulfill({ response: resp, body });
    }
    await pace('change');
    return route.fallback();
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(400000);
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push('console.error: ' + m.text().replace(/\?[^\s)'"]*/g, '').slice(0, 300)); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + String(e.message).slice(0, 300)));
  page.__logs = logs;
  return { ctx, page };
}

// Load a page and assert the preview theme id (preview-cookie trap).
export async function load(page, withTheme, path, themeId, opts = {}) {
  const resp = await page.goto(withTheme(path), { waitUntil: opts.waitUntil || 'load' });
  const id = await page.evaluate(() => window.Shopify?.theme?.id);
  if (Number(id) !== Number(themeId)) throw new Error(`INVALID: Shopify.theme.id ${id}, expected ${themeId} on ${path}`);
  if (resp && resp.status() === 429) throw new Error('INVALID: 429 on ' + path);
  return resp;
}

export async function seedCart(page, withTheme, themeId, handles) {
  page.context().__real = true; // seeding must change the server cart, so these adds are never answered from the replay map
  for (const h of handles) {
    await load(page, withTheme, '/products/' + h, themeId);
    const [resp] = await Promise.all([
      page.waitForResponse((r) => /\/cart\/add/.test(r.url())),
      page.locator('button[name="add"]').first().click(),
    ]);
    if (!resp.ok()) throw new Error(`add to cart ${h} -> ${resp.status()}`);
    await sleep(900);
  }
  page.context().__real = false;
}

export const overflowFn2 = () => {
  const vw = document.documentElement.clientWidth;
  const off = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    if (b.right > vw + 1 || b.left < -1) {
      if (el.closest('[id^="shopify-block-"], #preview-bar-iframe, cart-drawer')) continue;
      let clipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        if (getComputedStyle(a).overflowX !== 'visible' && a.getBoundingClientRect().right <= vw + 1) { clipped = true; break; }
      }
      if (clipped) continue;
      off.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className).slice(0, 40)} l${Math.round(b.left)} r${Math.round(b.right)}`);
    }
  }
  return { vw, sw: document.documentElement.scrollWidth, off: off.slice(0, 12) };
};

// FI(el): focus-caused indicator. Reads outline-style/width and box-shadow at rest (focus on the sentinel)
// and while el is focused by Tab (el must match :focus-visible), then returns the difference.
export const readStyleFn = (sel) => {
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
  const cs = getComputedStyle(el);
  return { os: cs.outlineStyle, ow: cs.outlineWidth, bs: cs.boxShadow, fv: el.matches(':focus-visible'), active: document.activeElement === el };
};
export function fiVerdict(rest, foc) {
  if (!foc.fv || !foc.active) return { valid: false, fi: null, rest, foc };
  const outline = foc.os !== 'none' && parseFloat(foc.ow) >= 1;
  const shadow = foc.bs !== rest.bs;
  return { valid: true, fi: outline || shadow, outline, shadow, rest, foc };
}

export const desc = (el) => el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.getAttribute('name') ? '[name=' + el.getAttribute('name') + ']' : ''}${el.hasAttribute('data-cart-drawer-close') ? '[close]' : ''}${el.getAttribute('role') ? '[role=' + el.getAttribute('role') + ']' : ''}` : 'null';
export const activeFn = () => {
  const el = document.activeElement;
  if (!el) return 'null';
  return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.getAttribute('name') ? '[name=' + el.getAttribute('name') + ']' : ''}${el.hasAttribute('data-cart-drawer-close') ? '[close]' : ''}${el.getAttribute('role') ? '[role=' + el.getAttribute('role') + ']' : ''}${el.classList.contains('cart-drawer__item-remove') ? '[remove]' : ''}${el.hasAttribute('data-cart-drawer-trigger') ? '[trigger]' : ''}${el.classList.contains('theme-evolution-header-menu__toggle') ? '[menu-toggle]' : ''}${el.closest('[role=dialog]') ? ' (in dialog)' : ''}`;
};

export async function focusTrail(page, n, shift = false) {
  const out = [];
  for (let i = 0; i < n; i++) {
    await page.keyboard.press(shift ? 'Shift+Tab' : 'Tab');
    await sleep(120);
    out.push(await page.evaluate(activeFn));
  }
  return out;
}

// document keyup/keydown listener counts through CDP.
export async function docListeners(page) {
  const cdp = await page.context().newCDPSession(page);
  const { result } = await cdp.send('Runtime.evaluate', { expression: 'document' });
  const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
  await cdp.detach();
  const c = {};
  for (const l of listeners) c[l.type] = (c[l.type] || 0) + 1;
  return { keyup: c.keyup || 0, keydown: c.keydown || 0, all: c };
}

export const tabTo = async (page, selector, max = 80, shift = false) => {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(shift ? 'Shift+Tab' : 'Tab');
    const hit = await page.evaluate((s) => document.activeElement?.matches(s), selector);
    if (hit) return i + 1;
  }
  throw new Error('tabTo: ' + selector + ' not reached');
};

// Cloudflare challenges bursts of /cart/add (429, cf-mitigated). Seeded carts are cached as storage states (cookie jar incl. the
// cart token) in scratch files next to T6BC_STATE and reused by later contexts; `mutates` seeds a new cart instead.
export async function cartContext(browser, state, withTheme, themeId, vw, handles, vh = 812, mutates = false) {
  const key = handles.join('+');
  const file = process.env.T6BC_STATE + '.cart.' + key;
  let st = state;
  if (handles.length) {
    if (!mutates && existsSync(file) && Date.now() - JSON.parse(readFileSync(file, 'utf8')).at < 3 * 60 * 60 * 1000) {
      st = JSON.parse(readFileSync(file, 'utf8')).state;
    } else {
      const { ctx, page } = await newPage(browser, state, vw, vh);
      await seedCart(page, withTheme, themeId, handles);
      st = await ctx.storageState();
      if (!mutates) writeFileSync(file, JSON.stringify({ at: Date.now(), state: st }), { mode: 0o600 });
      await ctx.close();
      await sleep(3000);
    }
  }
  return newPage(browser, st, vw, vh);
}
