// T4a Coder harness helpers (t4ac-*). Reuses only t0-lib.mjs (login; password read from docs/dev-fixtures.md, never printed).
// Nothing here imports t2c-lib/t3c-lib: their overflowFn skips the drawer unless the host has the `is-open` class.
import { chromium, parseArgs, loginState as t0LoginState } from './t0-lib.mjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export { chromium, parseArgs };

// Shopify rate-limits storefront password POSTs (429 + Turnstile) after a few logins, so the session is cached in
// T4AC_STATE (a scratch path that holds a cookie, not the password) and reused across scripts for up to 50 minutes.
export async function loginState(browser, withTheme) {
  const cache = process.env.T4AC_STATE;
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

// Open state: head = data-state="open" and not [hidden]; base = .is-open class. Accepts either so one script serves both trees.
export async function drawerOpen(page) {
  return page.evaluate(() => {
    const h = document.querySelector('cart-drawer');
    if (!h) return false;
    return (h.getAttribute('data-state') === 'open' && !h.hasAttribute('hidden')) || h.classList.contains('is-open');
  });
}

export async function openDrawer(page) {
  await page.locator('[data-header-cart-icon]').first().click();
  await sleep(400);
}

// Closes with Escape only; never edits classes or attributes.
export async function closeDrawer(page) {
  await page.keyboard.press('Escape');
  await sleep(400);
  if (await drawerOpen(page)) throw new Error('drawer still open after Escape');
}

export const panel = (page) => page.locator('[role="dialog"]').first();

// Runs in the page. Lists displayed elements whose right edge passes the viewport; the drawer is only checked when open.
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

export async function newPage(browser, state, vw, vh = 812) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vh } });
  const page = await ctx.newPage();
  return { ctx, page };
}

// Setup: put items in the cart through the product form (the theme's own /cart/add request). The Ajax .js endpoints
// answer 429 with a Cloudflare challenge to headless fetches, so seeding by fetch('/cart/add.js') is not possible.
// Use a fresh context per state: a new context has no cart cookie, which is the empty-cart state.
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

export async function clearCart() {}

export const PROPS = ['display', 'position', 'visibility', 'opacity', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'width', 'height', 'maxWidth', 'minWidth', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'textAlign', 'textDecorationLine',
  'color', 'backgroundColor', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopColor', 'borderBottomColor', 'borderTopLeftRadius', 'borderTopRightRadius',
  'boxShadow', 'cursor', 'overflow', 'flexDirection', 'justifyContent', 'alignItems', 'columnGap', 'rowGap', 'zIndex', 'animationName'];

// Self-contained in-page function (Playwright serialises its source). Structural finders work on the old (BEM) and the new (utility)
// drawer markup. Rects are rounded to 0.1 px and relative to the panel. Colors are also resolved to sRGB channels over white via a canvas,
// so token colors (oklab/color-mix) and rgba/hex compare by channel (plan section 10, comparison method).
export const measureDrawerFn = (props) => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const q = (s, r = document) => r.querySelector(s);
  const channel = (css) => {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, 1, 1);
    g.fillStyle = css;
    g.fillRect(0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  };
  const E = {};
  const host = q('cart-drawer');
  if (!host) return null;
  E.host = host;
  E.inner = q('#CartDrawer');
  E.overlay = E.inner && E.inner.firstElementChild;
  E.panel = q('[role="dialog"]', host);
  const kids = [...E.panel.children];
  E.header = kids[0];
  E.heading = q('h2', E.header);
  E.close = q('button', E.header);
  if (kids[1] && kids[1].id !== 'CartDrawer-CartItems') E.banner = kids[1];
  E.body = q('#CartDrawer-CartItems');
  const form = q('#CartDrawer-Form');
  if (form) {
    [...form.firstElementChild.children].forEach((it, i) => {
      const p = `item${i}`;
      E[p] = it;
      E[p + '.img'] = q('img', it);
      const d = it.lastElementChild;
      E[p + '.details'] = d;
      E[p + '.title'] = d.children[0];
      E[p + '.price'] = d.children[1];
      E[p + '.label'] = q('label', d);
      E[p + '.qty'] = q('input', d);
      E[p + '.remove'] = d.lastElementChild;
    });
  } else {
    const msg = q('p', E.body);
    if (msg) { E.emptyMsg = msg; E.emptyLink = q('a', E.body); E.emptyWrap = msg.parentElement; }
  }
  const co = q('#CartDrawer-Checkout');
  if (co) {
    E.checkout = co;
    E.footer = co.parentElement.parentElement;
    E.totals = E.footer.children[0];
    E.totalLabel = E.totals.children[0];
    E.totalValue = E.totals.children[1];
  }
  const busy = q('[data-cart-drawer-busy]');
  if (busy) { E.busy = busy; E.busySvg = q('svg', busy); }
  const rb = E.panel.getBoundingClientRect();
  const out = {};
  for (const [name, el] of Object.entries(E)) {
    if (!el) continue;
    const b = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    const o = { x: r1(b.left - rb.left), y: r1(b.top - rb.top), w: r1(b.width), h: r1(b.height), tag: el.tagName.toLowerCase() };
    for (const p of props) o[p] = s[p];
    for (const p of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor']) o[p + 'Ch'] = channel(s[p]);
    // Tailwind v4 shadows are five layers and four are transparent zero shadows; keep the layers that have a size or offset.
    o.shadowLayers = s.boxShadow === 'none' ? [] : s.boxShadow.split(/,(?![^(]*\))/).map((x) => x.trim()).filter((x) => !/(^| )0px 0px 0px 0px( |$)/.test(x));
    out[name] = o;
  }
  return out;
};

export const measureDrawer = (page) => page.evaluate(measureDrawerFn, PROPS);
