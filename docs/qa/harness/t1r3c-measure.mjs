// T1 re-run (t1r- screenshots prefix). Copy of t1-measure.mjs. T1 QA: geometry/computed-style dump of header and footer, X_hdr / X_page, h1 count, console, screenshots.
// Works on both pre-T1 and T1 markup (selectors are role/href based) so the same script gives the A/B.
// The password is read from docs/dev-fixtures.md by t0-lib.mjs and never printed.
//
// Usage: node t1-measure.mjs <previewBase> <label> <outDir> [pagesCsv] [widthsCsv] [cartSeed=0|1]
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState } from './t0-lib.mjs';

const [, label, outDir, pagesArg, widthsArg, seedArg] = process.argv.slice(2);
const { origin, withTheme } = parseArgs();
mkdirSync(outDir, { recursive: true });
const SHOTS = 'docs/qa/screenshots';
mkdirSync(SHOTS, { recursive: true });

const ALL = {
  home: '/',
  p3p: '/products/the-3p-fulfilled-snowboard',
  wax: '/products/selling-plans-ski-wax',
  snow: '/products/the-complete-snowboard',
  coll: '/collections/all',
  cart: '/cart',
  search: '/search?q=snowboard',
  mat: '/pages/the-material-archive',
  p404: '/pages/tailwind-qa-missing',
};
const pages = (pagesArg || 'home,p3p').split(',');
const widths = (widthsArg || '1440,375').split(',').map(Number);
const seed = seedArg === '1';

const measure = () => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const box = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { w: r1(b.width), h: r1(b.height), x: r1(b.left), y: r1(b.top + scrollY) };
  };
  const cs = (el, props) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    const o = {};
    for (const p of props) o[p] = s[p];
    return o;
  };
  const T = ['fontSize', 'lineHeight', 'letterSpacing', 'fontWeight', 'fontFamily', 'textTransform', 'textDecorationLine', 'color'];
  const wrap = document.querySelector('.theme-evolution-header-wrapper');
  const hdr = wrap && wrap.querySelector('header');
  let maxRight = -Infinity;
  if (wrap) {
    for (const el of [wrap, ...wrap.querySelectorAll('*')]) {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width || r.height) maxRight = Math.max(maxRight, r.right);
    }
  }
  const cart = wrap && wrap.querySelector('a[href$="/cart"]');
  const acct = wrap && wrap.querySelector('a[href*="/account"], a[href*="/customer_authentication"], a[href*="/customers"]');
  const toggle = wrap && wrap.querySelector('.theme-evolution-header-menu__toggle');
  const panel = wrap && wrap.querySelector('.theme-evolution-header-menu__panel');
  const logoA = hdr && hdr.querySelector('h2 a, a[href="/"]');
  const menuLinks = hdr ? [...hdr.querySelectorAll('a')].filter((a) => !a.closest('.theme-evolution-header-menu__panel') && a !== logoA && a !== cart && a !== acct) : [];
  const glyph = (el) => (el ? box(el.querySelector('svg path, svg')) : null);
  const badge = wrap && wrap.querySelector('[data-count]');
  const f = document.querySelector('.theme-evolution-footer-wrapper');
  const foot = f && f.querySelector('footer');
  const fcols = f && f.querySelector('.theme-evolution-footer__columns');
  const fchildren = fcols ? [...fcols.children].map((c) => box(c)) : [];
  const social = f && f.querySelectorAll('.theme-evolution-footer__social-link');
  const pay = f && f.querySelectorAll('.theme-evolution-footer__payment svg');
  return {
    vw: innerWidth,
    xHdr: wrap ? r1(maxRight - innerWidth) : null,
    xPage: document.documentElement.scrollWidth - innerWidth,
    h1: document.querySelectorAll('h1').length,
    wrap: box(wrap),
    header: box(hdr),
    headerCs: cs(hdr, ['display', 'paddingLeft', 'paddingRight', 'height', 'position']),
    logo: box(logoA),
    logoImg: box(logoA && logoA.querySelector('img')),
    menuLinks: menuLinks.map((a) => ({ t: a.textContent.trim().slice(0, 14), vis: getComputedStyle(a).display !== 'none' && !!a.getClientRects().length, box: box(a), cs: cs(a, T) })).slice(0, 5),
    menuWrapDisplay: menuLinks[0] ? getComputedStyle(menuLinks[0].parentElement).display : null,
    iconRow: box(cart && cart.parentElement),
    iconRowCs: cs(cart && cart.parentElement, ['paddingRight', 'paddingLeft', 'alignItems']),
    cart: box(cart), cartSvg: box(cart && cart.querySelector('svg')), cartGlyph: glyph(cart), cartCs: cs(cart, ['marginRight', 'marginLeft', 'width', 'height']),
    acct: box(acct), acctSvg: box(acct && acct.querySelector('svg')), acctGlyph: glyph(acct),
    toggle: box(toggle), toggleDisplay: toggle ? getComputedStyle(toggle.parentElement).display : null,
    toggleSvg: box(toggle && toggle.querySelector('svg')), toggleGlyph: glyph(toggle),
    panelHidden: panel ? panel.hidden : null, panelDisplay: panel ? getComputedStyle(panel).display : null, panelBox: panel && !panel.hidden ? box(panel) : null,
    badge: box(badge), badgeVisible: badge ? getComputedStyle(badge).display !== 'none' : null, badgeText: badge ? badge.textContent.trim() : null,
    badgeCs: cs(badge, ['display', 'borderRadius', 'paddingLeft', 'paddingRight', 'top', 'right', 'backgroundColor', 'color', 'fontSize', 'lineHeight']),
    announce: (() => { const a = wrap && wrap.querySelector('[role="note"]'); return a ? { box: box(a), p: cs(a.querySelector('p'), T) } : null; })(),
    footer: box(f), footerPad: cs(foot, ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']),
    footerBg: f ? getComputedStyle(f).backgroundColor : null,
    cols: fcols ? { cs: cs(fcols, ['display', 'gridTemplateColumns', 'columnGap', 'rowGap', 'marginBottom', 'paddingBottom']), children: fchildren } : null,
    about: (() => { const a = f && f.querySelector('.theme-evolution-footer__about-text'); return a ? { box: box(a), cs: cs(a, T.concat(['maxWidth', 'listStyleType'])) } : null; })(),
    fMenuLinks: f ? [...f.querySelectorAll('.theme-evolution-footer__menu-link')].map((a) => ({ t: a.textContent.trim().slice(0, 12), box: box(a), cs: cs(a, T) })).slice(0, 2) : [],
    fMenu: box(f && f.querySelector('.theme-evolution-footer__menu')),
    social: social ? [...social].map((a) => ({ box: box(a), svg: box(a.querySelector('svg')), aria: a.getAttribute('aria-label'), href: a.getAttribute('href'), target: a.target, rel: a.rel, fill: getComputedStyle(a.querySelector('svg')).fill, color: getComputedStyle(a).color })) : [],
    socialUl: (() => { const u = f && f.querySelector('.theme-evolution-footer__social'); return u ? { role: u.getAttribute('role'), aria: u.getAttribute('aria-label'), box: box(u) } : null; })(),
    copyright: (() => { const c = f && f.querySelector('.theme-evolution-footer__copyright'); return c ? { box: box(c), cs: cs(c, T.concat(['opacity'])), linkDeco: [...c.querySelectorAll('a')].map((a) => getComputedStyle(a).textDecorationLine) } : null; })(),
    bottom: (() => { const b = f && f.querySelector('.theme-evolution-footer__bottom'); return b ? { box: box(b), cs: cs(b, ['display', 'flexDirection', 'justifyContent', 'textAlign', 'borderTopWidth', 'borderTopColor', 'paddingTop', 'columnGap', 'rowGap']) } : null; })(),
    payment: pay ? [...pay].slice(0, 2).map((s) => box(s)) : [],
    paymentUl: (() => { const u = f && f.querySelector('.theme-evolution-footer__payment'); return u ? { role: u.getAttribute('role'), count: u.children.length } : null; })(),
    rootFont: getComputedStyle(document.documentElement).fontSize,
    rootLh: getComputedStyle(document.documentElement).lineHeight,
  };
};

const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const variantId = await (async () => {
  const ctx = await browser.newContext({ storageState: state });
  const j = await (await ctx.request.get(withTheme('/products/selling-plans-ski-wax.js'))).json();
  await ctx.close();
  return j.variants.find((v) => v.available)?.id;
})();

for (const vw of widths) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vw >= 1000 ? 900 : 667 } });
  const page = await ctx.newPage();
  const msgs = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) msgs.push(`${m.type()}: ${m.text()}`.slice(0, 220)); });
  page.on('pageerror', (e) => msgs.push(`pageerror: ${String(e).slice(0, 220)}`));
  const failed = [];
  page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(origin)) failed.push(`${r.status()} ${r.url().replace(origin, '').slice(0, 90)}`); });
  if (seed) { await page.goto(withTheme('/'), { waitUntil: 'load' }); await page.evaluate(async (i) => (await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: i, quantity: 1 }] }) })).status, variantId); }
  for (const key of pages) {
    msgs.length = 0; failed.length = 0;
    const resp = await page.goto(withTheme(ALL[key]), { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    const data = await page.evaluate(measure);
    data.status = resp.status();
    data.console = [...msgs];
    data.failed = [...failed];
    writeFileSync(`${outDir}/${label}-${key}-${vw}.json`, JSON.stringify(data));
    await page.screenshot({ path: `${SHOTS}/t1r3c-${label}-${key}-${vw}.png`, clip: { x: 0, y: 0, width: vw, height: 140 } });
    const foot = page.locator('.theme-evolution-footer-wrapper').first();
    if (await foot.count()) await foot.screenshot({ path: `${SHOTS}/t1r3c-${label}-${key}-${vw}-footer.png` }).catch(() => {});
    console.log(label, key, vw, resp.status(), 'xHdr', data.xHdr, 'xPage', data.xPage, 'h1', data.h1, 'console', data.console.length, 'failed', data.failed.length);
    await page.waitForTimeout(1200);
  }
  await ctx.close();
}
await browser.close();
