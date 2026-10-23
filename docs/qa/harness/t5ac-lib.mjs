// T5a Coder harness helpers (t5ac-*). Imports only t0-lib.mjs (login; the storefront password is read there from docs/dev-fixtures.md and never printed).
// Copies (does not import) loginState/newPage/sleep/seedCart/HANDLES/overflowFn2/WIDTHS from t4cc-lib.mjs. New: settleFn, togFn, cenFn, snapFn, diffSnaps, focusSweep.
// The in-page functions (…Fn) are self-contained so Playwright can serialise them.
import { chromium, parseArgs, loginState as t0LoginState } from './t0-lib.mjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync, gunzipSync } from 'node:zlib';

export { chromium, parseArgs };

// The session cookie (never the password) is cached in T5AC_STATE for up to 50 minutes (Cloudflare 429 on password POST bursts).
export async function loginState(browser, withTheme) {
  const cache = process.env.T5AC_STATE;
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
export const W_TOG = [320, 375, 749, 750, 989, 990, 1440, 1920];
export const W_SW = [320, 375, 390, 430, 749, 750, 768, 989, 990, 1024, 1440, 1920];
export const WIDTHS = W_SW;

// Theme-layout pages (TOG and CEN run on these) and the password page (cross-build only). key -> path.
export const PAGES = {
  home: '/',
  p3p: '/products/' + HANDLES.p3p,
  wax: '/products/' + HANDLES.wax,
  snow: '/products/' + HANDLES.snow,
  landing: '/products/' + HANDLES.snow + '?view=landing-page',
  collection: '/collections/all',
  collections: '/collections',
  search: '/search?q=snowboard',
  search0: '/search?q=zzqxv',
  cart: '/cart',
  cartseed: '/cart',
  optout: '/pages/data-sharing-opt-out',
  balanced: '/pages/the-balanced-face-test-page',
  contact: '/pages/contact',
  archive: '/pages/the-material-archive',
  blog: '/blogs/news',
  missing: '/pages/tailwind-qa-missing',
  policy: '/policies/privacy-policy',
};
export const PW_PAGE = '/password';
// A proxy page is valid only if its marker is present (the dev theme was seen reverting to the repo state mid-session; every proxy run checks this).
export const EXPECT = { zoo: '[data-t5-fixture="zoo"]', rt: '[data-t5-fixture="rt"]', pxea: '[role="note"]', pxap: '[data-t5-fixture="pxp"]', gift: '[data-t5-fixture="gift"]' };

export async function newPage(browser, state, vw, vh = 812, extra = {}) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vh }, ...extra });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push('console.error: ' + m.text().replace(/\?[^\s)'"]*/g, '').slice(0, 300)); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + String(e.message).slice(0, 300)));
  page.__logs = logs;
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

export const overflowFn2 = () => {
  const vw = document.documentElement.clientWidth;
  const off = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    if (b.right > vw + 1 || b.left < -1) {
      if (el.closest('[id^="shopify-block-"], #preview-bar-iframe')) continue;
      let clipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        if (getComputedStyle(a).overflowX !== 'visible' && a.getBoundingClientRect().right <= vw + 1) { clipped = true; break; }
      }
      if (clipped) continue;
      off.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className).slice(0, 40)} l${Math.round(b.left)} r${Math.round(b.right)}${el.closest('[data-rich-text]') ? ' [rich]' : ''}`);
    }
  }
  return { vw, sw: document.documentElement.scrollWidth, off: off.slice(0, 12) };
};

// ---------- in-page: settle (plan 4.2 step 1a) ----------
export const settleFn = async (opts) => {
  const sleepP = (ms) => new Promise((r) => setTimeout(r, ms));
  const res = { decodeErrors: 0, recs: null };
  try { await document.fonts.ready; } catch { /* recorded by absence */ }
  for (const img of document.images) {
    img.loading = 'eager';
    try { await img.decode(); } catch { res.decodeErrors++; }
  }
  const h = Math.max(document.documentElement.scrollHeight, 1), step = Math.max(window.innerHeight - 50, 200);
  for (let y = 0; y < h; y += step) { window.scrollTo(0, y); await sleepP(60); }
  window.scrollTo(0, document.documentElement.scrollHeight); await sleepP(60);
  window.scrollTo(0, 0);
  const rec = document.querySelector('product-recommendations');
  if (rec) {
    const t0 = Date.now();
    while (Date.now() - t0 < (opts?.recWait ?? 10000) && !rec.querySelector('li')) await sleepP(200);
    res.recs = !!rec.querySelector('li');
    for (const img of rec.querySelectorAll('img')) { img.loading = 'eager'; try { await img.decode(); } catch { res.decodeErrors++; } }
  }
  await sleepP(1000);
  return res;
};

// ---------- in-page: snapshot (names once, values dictionary) ----------
// Returns { names, vals, els: [{k: key, p: [valueIdx...], r: [l,t,w,h], pseudo: {'::before': [...]}}] }
export const snapFn = (opts) => {
  const names = [];
  const probe = getComputedStyle(document.body);
  for (let i = 0; i < probe.length; i++) if (!probe[i].startsWith('--')) names.push(probe[i]);
  const vals = [], vmap = new Map();
  const vi = (v) => { let i = vmap.get(v); if (i === undefined) { i = vals.length; vals.push(v); vmap.set(v, i); } return i; };
  // Injected, load-dependent nodes (the preview bar, Shopify's pixel sandbox) are excluded and not counted among siblings, so paths pair across loads.
  const SKIP = (n) => n.id === 'PBarNextFrameWrapper' || n.id === 'preview-bar-iframe' || n.id === 'web-pixels-manager-sandbox-container';
  const keyOf = (el) => {
    const parts = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.id && n !== document.documentElement && n !== document.body) { parts.unshift(n.tagName.toLowerCase() + '#' + n.id); break; }
      let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName && !SKIP(s)) i++;
      parts.unshift(n.tagName.toLowerCase() + ':' + i);
    }
    return parts.join('>');
  };
  const read = (cs) => names.map((n) => vi(cs.getPropertyValue(n)));
  const list = [];
  const walk = (root) => { for (const el of root.children) { if (SKIP(el)) continue; if (el.tagName === 'HEAD') continue; list.push(el); walk(el); } };
  walk(document.documentElement); list.unshift(document.documentElement);
  const out = [];
  for (const el of list) {
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    const o = { k: keyOf(el), c: String(el.className?.baseVal ?? el.className).slice(0, 60), t: (el.textContent || '').trim().slice(0, 30), p: read(cs), r: [b.left, b.top + window.scrollY, b.width, b.height].map((x) => Math.round(x * 100) / 100) };
    const tag = el.tagName.toLowerCase();
    const ps = ['::before', '::after'];
    if (tag === 'li' || tag === 'summary') ps.push('::marker');
    if (tag === 'input' || tag === 'textarea') ps.push('::placeholder');
    o.ps = {};
    for (const p of ps) o.ps[p] = read(getComputedStyle(el, p));
    if (tag === 'shopify-accelerated-checkout' || tag === 'shopify-accelerated-checkout-cart') {
      o.cp = {};
      for (let i = 0; i < cs.length; i++) if (cs[i].startsWith('--shopify-')) o.cp[cs[i]] = cs.getPropertyValue(cs[i]);
    }
    out.push(o);
  }
  return { names, vals, els: out };
};

// Compare two snapshots (node side). Returns {paired, only1, only2, diffs:[{k,t,pseudo,prop,a,b,ra,rb}]}.
export function diffSnaps(s1, s2, ignore = null) {
  const m2 = new Map(s2.els.map((e) => [e.k, e]));
  const m1 = new Map(s1.els.map((e) => [e.k, e]));
  const diffs = [];
  let paired = 0;
  const only1 = [], only2 = [];
  for (const e1 of s1.els) {
    const e2 = m2.get(e1.k);
    if (!e2) { only1.push(e1.k); continue; }
    paired++;
    const cmp = (pa, pb, pseudo) => {
      for (let i = 0; i < s1.names.length; i++) {
        const a = s1.vals[pa[i]], b = s2.vals[pb[i]];
        if (a !== b) diffs.push({ k: e1.k, t: e1.t, pseudo, prop: s1.names[i], a, b, ra: e1.r, rb: e2.r });
      }
    };
    cmp(e1.p, e2.p, '');
    for (const ps of Object.keys(e1.ps)) if (e2.ps[ps]) cmp(e1.ps[ps], e2.ps[ps], ps);
    if (e1.cp) for (const [n, v] of Object.entries(e1.cp)) if (e2.cp?.[n] !== v) diffs.push({ k: e1.k, t: e1.t, pseudo: '', prop: n, a: v, b: e2.cp?.[n], ra: e1.r, rb: e2.r });
  }
  for (const e2 of s2.els) if (!m1.has(e2.k)) only2.push(e2.k);
  return { paired, only1, only2, diffs };
}

export const saveGz = (file, obj) => writeFileSync(file, gzipSync(JSON.stringify(obj)));
export const loadGz = (file) => JSON.parse(gunzipSync(readFileSync(file)).toString());

// ---------- in-page: TOG, the toggle diff (plan 4.2 steps 2-9) ----------
// Settles first. Returns { valid, why, nEls, widget, entries: [...] } where each entry has owner/container/rel.
export const togFn = async (opts) => {
  const sleepP = (ms) => new Promise((r) => setTimeout(r, ms));
  const frames = async (n) => { for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r)); };
  const result = { valid: false, why: null, entries: [] };
  // settle
  try { await document.fonts.ready; } catch {}
  for (const img of document.images) { img.loading = 'eager'; try { await img.decode(); } catch {} }
  const H = Math.max(document.documentElement.scrollHeight, 1), stp = Math.max(window.innerHeight - 50, 200);
  for (let y = 0; y < H; y += stp) { window.scrollTo(0, y); await sleepP(60); }
  window.scrollTo(0, document.documentElement.scrollHeight); await sleepP(60); window.scrollTo(0, 0);
  const rec = document.querySelector('product-recommendations');
  if (rec) { const t0 = Date.now(); while (Date.now() - t0 < 10000 && !rec.querySelector('li')) await sleepP(200); result.recs = !!rec.querySelector('li'); for (const img of rec.querySelectorAll('img')) { img.loading = 'eager'; try { await img.decode(); } catch {} } }
  await sleepP(1000);
  document.getAnimations().forEach((a) => a.pause());
  // controls (B1): empty div first, then h6
  document.querySelectorAll('[data-t5-ctl],[data-t5-ctl2]').forEach((e) => e.remove());
  const c1 = document.createElement('div'); c1.setAttribute('data-t5-ctl', '');
  const c2 = document.createElement('h6'); c2.setAttribute('data-t5-ctl2', ''); c2.textContent = 'x';
  document.body.append(c1, c2);
  const links = [...document.querySelectorAll('link[rel=stylesheet]')].filter((l) => /\/assets\/base\.css/.test(l.href));
  if (links.length !== 1) { result.why = 'base.css links: ' + links.length; return result; }
  const link = links[0];
  try { link.sheet.cssRules.length; } catch (e) { result.why = 'sheet unreadable ' + e.name; return result; }
  if (!link.sheet || link.sheet.disabled) { result.why = 'sheet missing/disabled'; return result; }

  const names = [];
  const pb = getComputedStyle(document.body);
  for (let i = 0; i < pb.length; i++) if (!pb[i].startsWith('--')) names.push(pb[i]);
  const snap = () => {
    const list = [];
    const walk = (root) => { for (const el of root.children) { if (el.id === 'preview-bar-iframe' || el.tagName === 'HEAD') continue; list.push(el); walk(el); } };
    walk(document.documentElement); list.unshift(document.documentElement);
    const rows = list.map((el) => {
      const tag = el.tagName.toLowerCase();
      const read = (cs) => { const a = new Array(names.length); for (let i = 0; i < names.length; i++) a[i] = cs.getPropertyValue(names[i]); return a; };
      const b = el.getBoundingClientRect();
      const o = { el, p: read(getComputedStyle(el)), r: [b.left, b.top + window.scrollY, b.width, b.height].map((x) => Math.round(x * 100) / 100), ps: {} };
      const ps = ['::before', '::after'];
      if (tag === 'li' || tag === 'summary') ps.push('::marker');
      if (tag === 'input' || tag === 'textarea') ps.push('::placeholder');
      for (const p of ps) o.ps[p] = read(getComputedStyle(el, p));
      if (tag === 'shopify-accelerated-checkout' || tag === 'shopify-accelerated-checkout-cart') {
        o.cp = {}; const cs = getComputedStyle(el);
        for (let i = 0; i < cs.length; i++) if (cs[i].startsWith('--shopify-')) o.cp[cs[i]] = cs.getPropertyValue(cs[i]);
      }
      return o;
    });
    return rows;
  };
  // 7c: hold a hover-driven state (the tooltip) across each toggle by re-dispatching mouseover on the trigger before reading.
  const rehover = async () => { if (opts?.rehover) { const t = document.querySelector(opts.rehover); if (t) t.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); await sleepP(350); } };
  const finishNew = () => document.getAnimations().filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming?.().endTime)).forEach((a) => { try { a.finish(); } catch {} });
  snap(); await sleepP(400); // warm-up: lazy font faces and closed-subtree layout settle on first read
  const D1 = snap();
  link.sheet.disabled = true; finishNew(); await frames(2); await rehover();
  const D2 = snap();
  // controls under off
  const c1off = getComputedStyle(c1).display, c2off = getComputedStyle(c2).marginTop;
  link.sheet.disabled = false; finishNew(); await frames(2); await rehover();
  const D3 = snap();
  // controls under on (from D1)
  const i1 = D1.findIndex((r) => r.el === c1), i2 = D1.findIndex((r) => r.el === c2);
  const nI = names.indexOf('display'), mI = names.indexOf('margin-top'), fI = names.indexOf('font-size');
  const c1on = D1[i1].p[nI];
  const c2on = parseFloat(D1[i2].p[mI]), fs = parseFloat(D1[i2].p[fI]);
  result.controls = { c1on, c1off, c2on, c2off, fs };
  // reversible?
  let rev = D1.length === D3.length;
  let revBad = 0;
  if (rev) for (let i = 0; i < D1.length; i++) { const a = D1[i].p, b = D3[i].p; for (let j = 0; j < a.length; j++) if (a[j] !== b[j]) { revBad++; if (revBad < 6) (result.revSamples ||= []).push(`${D1[i].el.tagName.toLowerCase()}.${String(D1[i].el.className).slice(0, 30)} ${names[j]}: ${a[j]} -> ${b[j]}`); } }
  result.revBad = revBad;
  if (c1on !== 'none' || c1off !== 'block') { result.why = `control1 ${c1on} -> ${c1off}`; return result; }
  if (Math.abs(c2on - 1.67 * fs) > 0.2 || c2off !== '0px') { result.why = `control2 ${c2on} (fs ${fs}) -> ${c2off}`; return result; }
  if (!rev || revBad) { result.why = 'not reversible: ' + revBad; return result; }
  result.valid = true;
  result.nEls = D1.length;

  // owner / container helpers
  const OWN_SHOP = '#pc--optOutFormContainer, .pc--show-email-field, .shopify-payment-button, shopify-accelerated-checkout, shopify-accelerated-checkout-cart, .shopify-policy__container, .shopify-challenge__container, [id^="shopify-pc__"], [class*="shopify-pc__"]';
  const OWN_APP = '[id^="shopify-block-"], [id*="app-embed"], [data-app], [id*="supercycle" i], [class*="supercycle" i], body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])';
  const keyOf = (el, stop) => { const parts = []; for (let n = el; n && n.nodeType === 1 && n !== stop; n = n.parentElement) { let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++; parts.unshift(n.tagName.toLowerCase() + ':' + i); } return parts.join('>'); };
  const csel = (e) => { if (e.matches('body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])')) return 'body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])'; if (e.id) return '#' + CSS.escape(e.id); const c = [...e.classList].slice(0, 2).map((x) => '.' + CSS.escape(x)).join(''); return e.tagName.toLowerCase() + c; };
  const SZ = new Set(['width', 'height', 'inline-size', 'block-size', 'top', 'right', 'bottom', 'left', 'inset-block-start', 'inset-block-end', 'inset-inline-start', 'inset-inline-end', 'transform-origin', 'perspective-origin', 'grid-template-rows', 'grid-template-columns']);
  const entries = [];
  const wd = document.querySelector('.pc--show-email-field');
  result.widget = wd ? { els: wd.querySelectorAll('*').length + 1, checkboxes: wd.querySelectorAll('input[type=checkbox]').length } : null;
  for (let i = 0; i < D1.length; i++) {
    const a = D1[i], b = D2[i], el = a.el;
    const marks = (el.hasAttribute('data-t5-ctl') || el.hasAttribute('data-t5-ctl2'));
    const diffsFor = (pa, pb, pseudo) => {
      for (let j = 0; j < names.length; j++) if (pa[j] !== pb[j]) entries.push({ el, pseudo, prop: names[j], on: pa[j], off: pb[j], ctl: marks });
    };
    diffsFor(a.p, b.p, '');
    for (const ps of Object.keys(a.ps)) diffsFor(a.ps[ps], b.ps[ps], ps);
    if (a.cp) for (const n of Object.keys(a.cp)) if (a.cp[n] !== b.cp?.[n]) entries.push({ el, pseudo: '', prop: n, on: a.cp[n], off: b.cp?.[n], ctl: false });
  }
  const idx = new Map(D1.map((r, i) => [r.el, i]));
  result.entries = entries.filter((e) => !e.ctl).map((e) => {
    const i = idx.get(e.el);
    const outer = (sel) => { let r = null; for (let a = e.el; a && a.nodeType === 1; a = a.parentElement) if (a.matches(sel)) r = a; return r; };
    const app = outer(OWN_APP), shop = !app && outer(OWN_SHOP);
    const owner = app ? 'app' : shop ? 'shopify' : 'theme';
    const cont = app || shop;
    const o = { path: keyOf(e.el), t: (e.el.textContent || '').trim().slice(0, 30), tag: e.el.tagName.toLowerCase(), cls: String(e.el.className?.baseVal ?? e.el.className).slice(0, 60), pseudo: e.pseudo, prop: e.prop, on: e.on, off: e.off, sz: SZ.has(e.prop), owner, ra: D1[i].r, rb: D2[i].r, rich: !!e.el.closest('[data-rich-text]'), policy: !!e.el.closest('.shopify-policy__body'), prose: !!e.el.closest('.prose') };
    if (cont) { o.cont = csel(cont); o.rel = e.el === cont ? '' : keyOf(e.el, cont); }
    return o;
  });
  // remove controls
  c1.remove(); c2.remove();
  return result;
};

// ---------- in-page: CEN, the census (plan 4.2) ----------
export const cenFn = () => {
  const link = [...document.querySelectorAll('link[rel=stylesheet]')].find((l) => /\/assets\/base\.css/.test(l.href));
  if (!link) return { error: 'no base.css link' };
  let rules; try { rules = link.sheet.cssRules; } catch (e) { return { error: 'unreadable ' + e.name }; }
  const STATE = new Set(['hover', 'focus', 'focus-visible', 'focus-within', 'active', 'visited', 'checked', 'disabled', '-webkit-autofill', 'placeholder-shown']);
  const PSEUDO_EL = /^(before|after|selection|placeholder|marker|first-letter|first-line|-webkit-[\w-]+|-moz-[\w-]+|backdrop)$/;
  const hasState = (s) => { for (const m of s.matchAll(/:([\w-]+)/g)) if (STATE.has(m[1])) return true; return false; };
  const splitTop = (s) => { const out = []; let d = 0, cur = '', q = null; for (const ch of s) { if (q) { cur += ch; if (ch === q) q = null; continue; } if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; } if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  const strip = (sel) => {
    let out = '', i = 0;
    while (i < sel.length) {
      const ch = sel[i];
      if (ch === '[') { const j = sel.indexOf(']', i); out += sel.slice(i, j + 1); i = j + 1; continue; }
      if (ch === ':') {
        let j = i + 1; const dbl = sel[j] === ':'; if (dbl) j++;
        let k = j; while (k < sel.length && /[\w-]/.test(sel[k])) k++;
        const name = sel.slice(j, k);
        let arg = null;
        if (sel[k] === '(') { let d = 0, m = k; for (; m < sel.length; m++) { if (sel[m] === '(') d++; else if (sel[m] === ')') { d--; if (d === 0) break; } } arg = sel.slice(k + 1, m); k = m + 1; }
        if (dbl || PSEUDO_EL.test(name)) { i = k; continue; }
        if (arg === null && STATE.has(name)) { i = k; continue; }
        if (arg !== null && hasState(arg)) { i = k; continue; }
        out += sel.slice(i, k); i = k; continue;
      }
      out += ch; i++;
    }
    out = out.trim();
    if (!out || /[>+~]$/.test(out)) out += '*';
    if (/^[>+~]/.test(out)) out = '*' + out;
    return out;
  };
  const keyOf = (el) => { const parts = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) { let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++; parts.unshift(n.tagName.toLowerCase() + ':' + i); } return parts.join('>'); };
  const OWN_SHOP = '#pc--optOutFormContainer, .pc--show-email-field, .shopify-payment-button, shopify-accelerated-checkout, shopify-accelerated-checkout-cart, .shopify-policy__container, .shopify-challenge__container, [id^="shopify-pc__"], [class*="shopify-pc__"]';
  const OWN_APP = '[id^="shopify-block-"], [id*="app-embed"], [data-app], [id*="supercycle" i], [class*="supercycle" i], body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])';
  const owner = (e) => (e.closest(OWN_APP) ? 'app' : e.closest(OWN_SHOP) ? 'shopify' : e.closest('#preview-bar-iframe') ? 'preview' : 'theme');
  const out = [], unparsed = [];
  let idx = 0, totalSel = 0;
  const walk = (list, media) => {
    for (const r of list) {
      const t = r.constructor.name;
      if (t === 'CSSLayerBlockRule') walk(r.cssRules, media);
      else if (t === 'CSSMediaRule') { if (matchMedia(r.media.mediaText).matches) walk(r.cssRules, r.media.mediaText); else idx += r.cssRules.length; }
      else if (t === 'CSSSupportsRule') { if (CSS.supports(r.conditionText)) walk(r.cssRules, media); else idx += r.cssRules.length; }
      else if (t === 'CSSStyleRule') {
        idx++;
        for (const sel of splitTop(r.selectorText)) {
          totalSel++;
          const s2 = strip(sel);
          let els;
          try { els = [...document.querySelectorAll(s2)].filter((e) => !e.closest('#preview-bar-iframe')); } catch { unparsed.push({ idx, sel, s2 }); continue; }
          if (els.length) out.push({ idx, sel, s2, media: media || '', n: els.length, paths: els.slice(0, 3).map((e) => keyOf(e) + '|' + String(e.className?.baseVal ?? e.className).slice(0, 40)), owners: [...new Set(els.map(owner))], decl: r.style.cssText.slice(0, 160), nTheme: els.filter((e) => owner(e) === 'theme').length });
        }
      }
    }
  };
  walk(rules, '');
  return { matched: out, unparsed, totalSel, nRules: idx };
};

// ---------- focus sweep (plan 4.2) ----------
export async function focusSweep(page, max = 200) {
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  const seen = new Set(), seq = [];
  for (let n = 0; n < max; n++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { body: true };
      const keyOf = (e) => { const p = []; for (let x = e; x && x.nodeType === 1; x = x.parentElement) { let i = 1; for (let s = x.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === x.tagName) i++; p.unshift(x.tagName.toLowerCase() + ':' + i); } return p.join('>'); };
      const cs = getComputedStyle(el), b = el.getBoundingClientRect();
      const OWN_SHOP = '#pc--optOutFormContainer, .pc--show-email-field, .shopify-payment-button, shopify-accelerated-checkout, shopify-accelerated-checkout-cart, .shopify-policy__container, .shopify-challenge__container, [id^="shopify-pc__"], [class*="shopify-pc__"]';
      const owner = el.closest('[id^="shopify-block-"], [id*="app-embed"], [data-app]') ? 'app' : el.closest(OWN_SHOP) ? 'shopify' : 'theme';
      const ow = parseFloat(cs.outlineWidth) || 0, oo = parseFloat(cs.outlineOffset) || 0;
      const reach = (cs.outlineStyle !== 'none' ? ow + Math.max(oo, 0) : 0);
      const clip = { l: 0, t: 0, r: 0, b: 0 };
      for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
        const acs = getComputedStyle(a);
        if (acs.overflowX !== 'visible' || acs.overflowY !== 'visible') {
          const ab = a.getBoundingClientRect();
          const pe = { l: ab.left + (parseFloat(acs.borderLeftWidth) || 0), r: ab.right - (parseFloat(acs.borderRightWidth) || 0), t: ab.top + (parseFloat(acs.borderTopWidth) || 0), b: ab.bottom - (parseFloat(acs.borderBottomWidth) || 0) };
          clip.l = Math.max(clip.l, pe.l - (b.left - reach)); clip.r = Math.max(clip.r, (b.right + reach) - pe.r); clip.t = Math.max(clip.t, pe.t - (b.top - reach)); clip.b = Math.max(clip.b, (b.bottom + reach) - pe.b);
          break;
        }
      }
      return { key: keyOf(el), tag: el.tagName.toLowerCase(), cls: String(el.className?.baseVal ?? el.className).slice(0, 40), text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24), fv: el.matches(':focus-visible'), owner, os: cs.outlineStyle, ow: cs.outlineWidth, oo: cs.outlineOffset, oc: cs.outlineColor, bs: cs.boxShadow === 'none' ? 'none' : cs.boxShadow.slice(0, 60), color: cs.color, r: [b.left, b.top, b.width, b.height].map((x) => Math.round(x)), clip: { l: Math.round(clip.l), t: Math.round(clip.t), r: Math.round(clip.r), b: Math.round(clip.b) } };
    });
    if (r.body) { seq.push(r); if (seq.filter((x) => x.body).length > 3) break; continue; }
    if (seen.has(r.key)) break;
    seen.add(r.key); seq.push(r);
  }
  return seq;
}
