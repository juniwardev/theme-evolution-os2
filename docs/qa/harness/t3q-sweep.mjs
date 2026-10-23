// T3 QA (independent): overflow, buttons-in-box, headings, alt/width/height, console errors, alignment, typography.
// Usage: node t3q-sweep.mjs <previewBase> <label> [pagesCsv=home,land] [shots=1]
import { mkdirSync } from 'node:fs';
import { parseArgs, openBrowser, scrollThrough } from './t3c-lib.mjs';

const [, label, pagesArg, shotsArg] = process.argv.slice(2);
const { withTheme } = parseArgs();
const PG = { home: '/', land: '/products/the-complete-snowboard?view=landing-page' };
const pages = (pagesArg || 'home,land').split(',');
const widths = [320, 375, 390, 430, 767, 768, 1023, 1024, 1440, 1920];
mkdirSync('docs/qa/screenshots', { recursive: true });
const { browser, state } = await openBrowser(withTheme);

const probe = () => {
  const vw = innerWidth;
  const r = (n) => Math.round(n * 10) / 10;
  const doc = document.documentElement;
  const xPage = Math.max(doc.scrollWidth, document.body.scrollWidth) - vw;
  const out = { vw, xPage };
  const btns = [...document.querySelectorAll('[data-banner-buttons] > a')];
  out.btns = btns.map((a) => {
    const b = a.getBoundingClientRect();
    const box = a.closest('[data-banner-box]');
    let inBox = null;
    if (box) {
      const bb = box.getBoundingClientRect(); const cs = getComputedStyle(box);
      const cl = bb.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
      const cr = bb.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
      inBox = b.left >= cl - 0.5 && b.right <= cr + 0.5;
    }
    return { l: r(b.left), r: r(b.right), inVp: b.left >= 0 && b.right <= vw, inBox, label: a.textContent.trim(), cls: a.className.split(' ').filter((c) => c.startsWith('btn'))[0], h: r(b.height) };
  });
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => h.getClientRects().length);
  out.h1 = document.querySelectorAll('h1').length;
  out.headings = hs.map((h) => h.tagName + ':' + h.textContent.trim().slice(0, 20));
  out.imgs = [...document.querySelectorAll('[id^="shopify-section-template"] img')].map((i) => ({ w: i.getAttribute('width'), h: i.getAttribute('height'), alt: i.getAttribute('alt'), fp: i.getAttribute('fetchpriority'), ld: i.getAttribute('loading') })).filter((i) => !i.w || !i.h);
  out.unnamed = [...document.querySelectorAll('a,button')].filter((e) => e.getClientRects().length && !(e.textContent.trim() || e.getAttribute('aria-label') || e.querySelector('img[alt]:not([alt=""])') || e.getAttribute('title'))).map((e) => e.outerHTML.slice(0, 80));
  const q = (s) => document.querySelector(s);
  const logo = q('header a[href="/"]'); const L = logo ? r(logo.getBoundingClientRect().left) : null;
  const band = q('[data-hello-band]'); const ban = q('[data-image-banner]');
  out.L = L;
  out.band = band && { x: r(band.getBoundingClientRect().left), r: r(band.getBoundingClientRect().right) };
  out.banner = ban && { x: r(ban.getBoundingClientRect().left), r: r(ban.getBoundingClientRect().right) };
  const h1 = q('[data-hello-band] h1');
  if (h1) { const s = getComputedStyle(h1); out.h1ff = s.fontFamily.slice(0, 12); out.h1fw = s.fontWeight; out.h1tt = s.textTransform; out.h1fs = s.fontSize; out.h1x = r(h1.getBoundingClientRect().left); out.h1color = s.color; }
  const card = q('[data-hello-card]'); if (card) out.cardx = r(card.getBoundingClientRect().left);
  const cards = [...document.querySelectorAll('[data-hello-card]')]; out.cardTops = cards.map((c) => r(c.getBoundingClientRect().top)).join(',');
  const bh = q('[data-image-banner] h1, [data-image-banner] h2, [data-image-banner] [data-banner-box] > div');
  const bhd = q('[data-banner-box] .inline-richtext, [data-banner-box] h1, [data-banner-box] h2'); if (bhd) { const s = getComputedStyle(bhd); out.bhff = s.fontFamily.slice(0, 12); out.bhfs = s.fontSize; out.bhfw = s.fontWeight; }
  if (ban) { out.banH = r(ban.getBoundingClientRect().height); }
  const root = q('.shopify-section [data-image-banner]');
  return out;
};

for (const key of pages) {
  for (const vw of widths) {
    const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vw >= 1000 ? 900 : 800 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text().slice(0, 140)); });
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message.slice(0, 140)));
    const resp = await page.goto(withTheme(PG[key]), { waitUntil: 'load' });
    await scrollThrough(page, { waitCards: false });
    await page.evaluate(() => window.scrollTo(0, 0));
    const o = await page.evaluate(probe);
    o.status = resp.status(); o.errs = errs;
    console.log(label, key, vw, JSON.stringify(o));
    if (shotsArg !== '0' && (vw === 375 || vw === 1440)) await page.screenshot({ path: `docs/qa/screenshots/t3q-${label}-${key}-${vw}.png`, fullPage: true });
    await ctx.close();
  }
}
await browser.close();
