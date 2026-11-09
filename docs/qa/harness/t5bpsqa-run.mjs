// QA harness for t5b-policy-spacing (t5bpsqa-*). Independent of the Coder's t5bps-*.
// Usage: node t5bpsqa-run.mjs <previewBase> <label> <mode> [widths]
//   mode: spacing (policy + opt-out + contact, all widths, + screenshots at 375/1440)
//         others (A9 pages at 375/1440) | wrap (policy at 320, long-word report + screenshot)
// Output: JSON on stdout path docs/qa/evidence/t5bpsqa-<label>-<mode>.json. The storefront password is handled by t5bc-lib (never printed).
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, assertTheme, PAGES } from './t5bc-lib.mjs';

const [, label, mode, widthsArg = '320,375,768,1024,1440'] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const widths = widthsArg.split(',').map(Number);
mkdirSync('docs/qa/screenshots', { recursive: true });

const measureFn = () => {
  const sy = window.scrollY;
  const R = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top + sy, b: b.bottom + sy, w: b.width }; };
  const out = { theme: window.Shopify?.theme?.id };
  const headers = [...document.querySelectorAll('.shopify-section-group-header-group')];
  const footer = document.querySelector('.shopify-section-group-footer-group');
  const hb = headers.length ? Math.max(...headers.map((h) => R(h).b)) : null;
  const h1s = [...document.querySelectorAll('h1')];
  const h1 = h1s.find((h) => !h.closest('.shopify-section-group-header-group')) || h1s[0];
  out.H1 = h1s.length;
  out.policyCount = document.querySelectorAll('[data-policy-prose]').length;
  out.X_page = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  out.footerTop = footer ? R(footer).t : null;
  out.G_top = h1 && hb != null ? R(h1).t - hb : null;
  const pol = document.querySelector('[data-policy-prose]');
  const prose = pol || document.querySelector('[data-page-shell] .prose');
  if (!prose) return out;
  const shell = pol ? pol.parentElement : document.querySelector('[data-page-shell]');
  const pr = R(prose);
  out.C_L = pr.l; out.C_R = pr.r; out.C_w = pr.w;
  const cs = getComputedStyle(shell);
  out.PT = parseFloat(cs.paddingTop); out.PB = parseFloat(cs.paddingBottom);
  const texts = [...prose.querySelectorAll('*')].filter((el) => {
    if (['STYLE', 'SCRIPT', 'LINK'].includes(el.tagName)) return false;
    const b = el.getBoundingClientRect(); if (!b.width || !b.height) return false;
    return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  });
  if (texts.length) {
    out.T_L = Math.min(...texts.map((e) => e.getBoundingClientRect().left));
    out.T_R = Math.max(...texts.map((e) => e.getBoundingClientRect().right));
    out.G_bot = out.footerTop - Math.max(...texts.map((e) => e.getBoundingClientRect().bottom + sy));
    // last text element, for the record
    const last = texts.reduce((a, e) => (e.getBoundingClientRect().bottom > a.getBoundingClientRect().bottom ? e : a));
    out.lastTextEl = last.tagName.toLowerCase();
  }
  if (pol) {
    const outer = pol.parentElement.parentElement; // box A
    out.W_gap = out.footerTop - R(outer).b;
    out.boxA = { ch: outer.children.length, cls: outer.className };
    const cont = pol.firstElementChild;
    const cc = getComputedStyle(cont);
    out.container = { cls: cont.className, pl: cc.paddingLeft, pr: cc.paddingRight, mw: cc.maxWidth, w: R(cont).w };
    // trailing chain
    const tc = [];
    const inTC = (el) => { for (let n = el; n && n !== pol; n = n.parentElement) if (n.nextElementSibling) return false; return true; };
    const path = (el) => { const p = []; for (let n = el; n && n !== pol; n = n.parentElement) p.unshift([...n.parentElement.children].indexOf(n)); return p.join('.'); };
    const margins = {};
    for (const el of pol.querySelectorAll('*')) {
      if (['STYLE', 'SCRIPT', 'LINK'].includes(el.tagName)) continue;
      const s = getComputedStyle(el);
      const key = path(el);
      if (inTC(el)) tc.push({ tag: el.tagName.toLowerCase(), mb: s.marginBottom });
      else margins[key] = [s.marginTop, s.marginBottom, el.nextElementSibling ? 0 : 1];
    }
    out.TC = tc; out.margins = margins;
    // witnesses: last-child outside TC with nonzero mb
    out.witnesses = Object.entries(margins).filter(([k, v]) => v[1] !== '0px' && (() => { return true; })()).length;
    const uls = [...pol.querySelectorAll('ul')].map((u) => { const s = getComputedStyle(u); return [s.listStyleType, s.paddingInlineStart]; });
    out.uls = uls.length; out.ulBad = uls.filter((u) => u[0] !== 'disc' || parseFloat(u[1]) <= 0).length;
    const as = [...pol.querySelectorAll('a')].map((a) => getComputedStyle(a).textDecorationLine);
    out.as = as.length; out.aBad = as.filter((d) => !d.includes('underline')).length;
    // widest li word run
    let widest = 0;
    for (const li of pol.querySelectorAll('li')) { const s = li.cloneNode(true); s.style.cssText = 'position:absolute;visibility:hidden;width:min-content;white-space:normal'; li.parentElement.appendChild(s); widest = Math.max(widest, s.getBoundingClientRect().width); s.remove(); }
    out.widestLiMin = widest;
    out.ulPadding = uls[0] && uls[0][1];
    // overflow-wrap on a li
    const li0 = pol.querySelector('li'); if (li0) out.liOW = getComputedStyle(li0).overflowWrap;
  }
  return out;
};

const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const res = {};
const pagesFor = mode === 'spacing' ? ['policy', 'optout', 'contact']
  : mode === 'wrap' ? ['policy']
  : ['contact', 'optout', 'blog', 'collection', 'search', 'cart', 'snow'];
for (const w of widths) {
  const vh = w < 768 ? 667 : 900;
  for (const k of pagesFor) {
    const { ctx, page } = await newPage(browser, state, w, vh);
    try {
      await page.goto(withTheme(PAGES[k]), { waitUntil: 'load', timeout: 60000 });
      await assertTheme(page, themeId);
      await sleep(1500);
      const m = await page.evaluate(measureFn);
      m.status = 'ok';
      res[`${k}|${w}`] = m;
      if (mode !== 'others' && (w === 375 || w === 1440 || (mode === 'wrap' && w === 320)) && (k === 'policy' || k === 'optout')) {
        const base = `docs/qa/screenshots/t5bps-${label}-${k}-${w}`;
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `${base}-top.png` });
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await sleep(400);
        await page.screenshot({ path: `${base}-bottom.png` });
      }
    } catch (e) {
      res[`${k}|${w}`] = { status: 'ERR ' + String(e.message).slice(0, 150) };
    }
    await ctx.close();
    await sleep(1200);
  }
}
await browser.close();
writeFileSync(`docs/qa/evidence/t5bpsqa-${label}-${mode}.json`, JSON.stringify(res, null, 1));
console.log('done', Object.keys(res).length, Object.values(res).filter((r) => r.status !== 'ok').length, 'errors');
