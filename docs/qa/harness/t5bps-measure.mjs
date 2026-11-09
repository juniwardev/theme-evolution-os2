// T5b policy-spacing Coder harness (t5bps-*). Measures the plan's quantities (section 0) on one theme build.
// Usage: node t5bps-measure.mjs <previewBase> <outFile> <mode> [widths]
//   mode: policy | optout | others | deep
// The storefront password is handled by t5bc-lib/t0-lib (read from docs/dev-fixtures.md, never printed). Pages load one at a time (Cloudflare 429).
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, assertTheme, overflowFn2, PAGES } from './t5bc-lib.mjs';

const [, outFile, mode, widthsArg = '320,375,768,1024,1440'] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const widths = widthsArg.split(',').map(Number);

// In-page (self-contained). Box model measurands of plan section 0.
const measureFn = ({ kind }) => {
  const sy = window.scrollY;
  const r = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top + sy, b: b.bottom + sy, w: b.width }; };
  const headers = [...document.querySelectorAll('.shopify-section-group-header-group')];
  const footer = document.querySelector('.shopify-section-group-footer-group');
  const hb = headers.length ? Math.max(...headers.map((h) => r(h).b)) : null;
  const h1s = [...document.querySelectorAll('h1')];
  const h1 = h1s.find((h) => !h.closest('.shopify-section-group-header-group')) || h1s[0];
  const prose = kind === 'policy' ? document.querySelector('[data-policy-prose]') : document.querySelector('[data-page-shell] .prose');
  const shell = kind === 'policy' ? (prose && prose.parentElement) : document.querySelector('[data-page-shell]');
  const out = { theme: window.Shopify && window.Shopify.theme && window.Shopify.theme.id, H1: h1s.length, policyCount: document.querySelectorAll('[data-policy-prose]').length };
  out.X_page = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  out.footerTop = footer ? r(footer).t : null;
  out.headerBottom = hb;
  out.G_top = h1 && hb != null ? r(h1).t - hb : null;
  if (!prose) return out;
  const pr = r(prose);
  out.C_L = pr.l; out.C_R = pr.r; out.C_w = pr.w;
  if (shell) { const cs = getComputedStyle(shell); out.PT = parseFloat(cs.paddingTop); out.PB = parseFloat(cs.paddingBottom); }
  const textEls = [...prose.querySelectorAll('*')].filter((el) => {
    if (['STYLE', 'SCRIPT', 'LINK'].includes(el.tagName)) return false;
    const b = el.getBoundingClientRect(); if (!b.width || !b.height) return false;
    return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  });
  if (textEls.length) {
    out.T_L = Math.min(...textEls.map((e) => e.getBoundingClientRect().left));
    out.T_R = Math.max(...textEls.map((e) => e.getBoundingClientRect().right));
    const lastBottom = Math.max(...textEls.map((e) => e.getBoundingClientRect().bottom + sy));
    out.G_bot = out.footerTop - lastBottom;
  }
  // Outermost box: the ancestor that is a direct child of body.
  let outer = prose; while (outer.parentElement && outer.parentElement !== document.body) outer = outer.parentElement;
  out.W_gap = out.footerTop - r(outer).b;
  const cont = prose.querySelector('.shopify-policy__container');
  if (cont) { const cs = getComputedStyle(cont); out.contPad = cs.paddingLeft + '/' + cs.paddingRight; out.contMaxW = cs.maxWidth; out.contW = cont.getBoundingClientRect().width; }
  return out;
};

// Step 0 / A3 / A5 / A6 extras (policy page only).
const deepFn = () => {
  const prose = document.querySelector('[data-policy-prose]');
  const path = (el) => { const p = []; for (let e = el; e && e !== prose; e = e.parentElement) p.push(e.tagName.toLowerCase() + ':' + [...e.parentElement.children].indexOf(e)); return p.reverse().join('>'); };
  const desc = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
  const all = [...prose.querySelectorAll('*')].filter((e) => !['STYLE', 'SCRIPT', 'LINK'].includes(e.tagName));
  const inTC = (el) => { for (let e = el; e !== prose; e = e.parentElement) if (e !== e.parentElement.lastElementChild) return false; return true; };
  const lastEl = (e) => e === e.parentElement.lastElementChild; // :last-child counts element siblings only (text nodes ignored)
  const TC = all.filter(inTC);
  const margins = {};
  for (const el of all) { const cs = getComputedStyle(el); margins[path(el)] = { mb: cs.marginBottom, mt: cs.marginTop, inTC: inTC(el), tag: el.tagName.toLowerCase() }; }
  const witnesses = all.filter((e) => lastEl(e) && !inTC(e) && parseFloat(getComputedStyle(e).marginBottom) > 0).length;
  const empties = all.filter((e) => !e.textContent.trim() && !e.children.length && e.getBoundingClientRect().height >= 0 && !['BR', 'IMG', 'HR', 'INPUT'].includes(e.tagName)).map((e) => ({ path: path(e), d: desc(e), display: getComputedStyle(e).display, inTC: inTC(e), isLast: lastEl(e) }));
  const liRuns = [];
  for (const li of prose.querySelectorAll('li')) {
    const clone = li.cloneNode(true); clone.style.cssText = 'position:absolute;visibility:hidden;width:min-content;white-space:normal;padding:0;margin:0;list-style:none';
    prose.appendChild(clone); liRuns.push(clone.getBoundingClientRect().width); clone.remove();
  }
  const sheets = [];
  for (const sh of document.styleSheets) {
    let rules = null, err = null;
    try { rules = [...sh.cssRules]; } catch (e) { err = String(e.message).slice(0, 80); }
    const hit = [];
    const walk = (rs, layer) => { for (const ru of rs) { if (ru.cssRules && ru.constructor.name === 'CSSLayerBlockRule') walk([...ru.cssRules], ru.name); else if (ru.cssRules && !ru.selectorText) walk([...ru.cssRules], layer); else if (ru.selectorText && ru.selectorText.includes('shopify-policy')) hit.push({ sel: ru.selectorText, css: ru.style.cssText, layer: layer || null }); } };
    if (rules) walk(rules, null);
    if (hit.length || err) sheets.push({ href: sh.href, err, hit });
  }
  const ul = [...prose.querySelectorAll('ul')].map((u) => { const cs = getComputedStyle(u); return { lst: cs.listStyleType, pis: cs.paddingInlineStart }; });
  const aa = [...prose.querySelectorAll('a')].map((a) => getComputedStyle(a).textDecorationLine);
  const directKids = [...prose.children].map(desc);
  return { TC: TC.map(desc), TCpaths: TC.map(path), TCmb: TC.map((e) => getComputedStyle(e).marginBottom), directKids, margins, witnesses, empties, liRunMax: liRuns.length ? Math.max(...liRuns) : 0, nLi: liRuns.length, sheets, ul, aa, nUl: ul.length };
};

const b = await chromium.launch();
const ss = await loginState(b, withTheme);
const res = [];
const loadOne = async (key, w, fn, arg) => {
  const { ctx, page } = await newPage(b, ss.state, w, w >= 768 ? 900 : 667, { reducedMotion: 'reduce' });
  try {
    const resp = await page.goto(withTheme(PAGES[key]), { waitUntil: 'load' });
    await assertTheme(page, themeId);
    await sleep(800);
    await page.evaluate(() => window.scrollTo(0, 0));
    const out = await page.evaluate(fn, arg);
    out.status = resp ? resp.status() : 'none'; out.url = PAGES[key];
    if (arg && arg.overflow) out.overflowOffenders = await page.evaluate(overflowFn2);
    out.logs = page.__logs.slice(0, 5);
    return out;
  } finally { await ctx.close(); await sleep(600); }
};

if (mode === 'policy') for (const w of widths) res.push({ key: 'policy', w, ...(await loadOne('policy', w, measureFn, { kind: 'policy', overflow: true })) });
if (mode === 'optout') for (const w of widths) res.push({ key: 'optout', w, ...(await loadOne('optout', w, measureFn, { kind: 'optout' })) });
if (mode === 'deep') for (const w of widths) res.push({ key: 'policy', w, ...(await loadOne('policy', w, deepFn, {})) });
if (mode === 'others') {
  for (const key of (process.env.T5BPS_KEYS || 'contact,optout,blog,collection,search,cart,snow').split(',')) for (const w of widths) {
    try { res.push({ key, w, ...(await loadOne(key, w, measureFn, { kind: 'other' })) }); } catch (e) { res.push({ key, w, error: String(e.message).slice(0, 160) }); }
  }
}
await b.close();
writeFileSync(outFile, JSON.stringify(res, null, 1));
console.log('wrote', outFile, res.length);
