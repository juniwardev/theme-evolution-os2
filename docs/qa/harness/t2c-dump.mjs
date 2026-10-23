// T2 Coder: generic dump (plan Step 0 item 3). For every element under the T2 roots record the section-relative
// border box and the listed computed properties. Output: <outDir>/<label>-<page>-<w>.json
// Usage: node t2c-dump.mjs <previewBase> <label> <outDir> [pagesCsv] [widthsCsv]
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, PRODUCTS, scrollThrough, overflowFn } from './t2c-lib.mjs';

const [, label, outDir, pagesArg, widthsArg] = process.argv.slice(2);
const { withTheme } = parseArgs();
mkdirSync(outDir, { recursive: true });
const pages = (pagesArg || 'p3p,wax,snow,home').split(',');
const widths = (widthsArg || '1440,375').split(',').map(Number);
const SHOTS = 'docs/qa/screenshots';
mkdirSync(SHOTS, { recursive: true });

const dump = () => {
  const P = ['display', 'position', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'color', 'backgroundColor',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'borderTopLeftRadius', 'boxShadow', 'opacity', 'clipPath'];
  const r1 = (n) => Math.round(n * 10) / 10;
  const roots = [...document.querySelectorAll('.shopify-section')].filter((s) => s.id.startsWith('shopify-section-template'));
  const out = [];
  for (const root of roots) {
    const rb = root.getBoundingClientRect();
    const els = [root, ...root.querySelectorAll('*')];
    const sig = (el) => {
      const parts = [];
      for (let e = el; e && e !== root; e = e.parentElement) {
        const sib = [...e.parentElement.children].filter((c) => c.tagName === e.tagName);
        parts.unshift(e.tagName.toLowerCase() + (sib.length > 1 ? `[${sib.indexOf(e)}]` : ''));
      }
      return parts.join('>') || 'ROOT';
    };
    for (const el of els) {
      if (el.closest('.shopify-payment-button, [id^="shopify-block-"]')) continue;
      if (['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName)) continue;
      const b = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      const o = {};
      for (const p of P) o[p] = s[p];
      out.push({ root: root.id.replace(/^shopify-section-template--\d+__/, ''), key: sig(el), tag: el.tagName.toLowerCase(), cls: String(el.className && el.className.baseVal !== undefined ? el.className.baseVal : el.className).slice(0, 80), txt: (el.children.length === 0 ? el.textContent.trim().slice(0, 30) : ''), x: r1(b.left), y: r1(b.top - rb.top), w: r1(b.width), h: r1(b.height), cs: o });
    }
  }
  return out;
};


// Semantic finders that work on both pre-T2 and T2 markup, so the same script gives the A/B (plan C2.10).
const named = () => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const NP = ['display', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'paddingLeft', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'color', 'backgroundColor', 'borderTopWidth', 'borderTopColor', 'borderBottomColor', 'borderTopLeftRadius', 'opacity'];
  const out = {};
  const rec = (name, el, root) => {
    if (!el) return;
    const b = el.getBoundingClientRect();
    const rb = root.getBoundingClientRect();
    const s = getComputedStyle(el);
    const o = { x: r1(b.left), y: r1(b.top - rb.top), w: r1(b.width), h: r1(b.height) };
    for (const p of NP) o[p] = s[p];
    out[name] = o;
  };
  const sec = (suffix) => [...document.querySelectorAll('.shopify-section')].find((s) => s.id.startsWith('shopify-section-template') && s.id.includes(suffix));
  const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const main = sec('__main');
  if (main) {
    const c = main.querySelector(':scope > div');
    const info = c && c.children[1];
    rec('main.container', c, main); rec('main.media', c && c.children[0], main); rec('main.info', info, main);
    rec('main.img1', main.querySelector('img'), main);
    if (info) {
      const h1 = info.querySelector('h1');
      rec('main.vendor', info.firstElementChild, main); rec('main.h1', h1, main); rec('main.price', h1 && h1.nextElementSibling, main);
      const sel = info.querySelector('select'); rec('main.select', sel, main); rec('main.pickerWrap', sel && sel.parentElement, main);
      const q = info.querySelector('input[type=number]'); rec('main.qty', q, main); rec('main.qtyWrap', q && q.parentElement, main); rec('main.qtyLabel', q && q.parentElement.querySelector('label'), main);
      const add = info.querySelector('button[name=add]'); rec('main.add', add, main); rec('main.addSpan', add && add.querySelector('span'), main); rec('main.buy', add && add.closest('product-form').parentElement, main);
      const det = info.querySelector('details'); rec('main.details', det, main); rec('main.summary', det && det.querySelector('summary'), main); rec('main.summaryIcon', det && det.querySelector('summary span'), main); rec('main.accContent', det && det.querySelector('#material-data-container'), main);
      rec('main.accLoading', det && det.querySelector('#material-data-container > div'), main);
      const desc = [...info.children].find((e) => e.tagName === 'DIV' && e.querySelector('p')); rec('main.desc', desc, main);
      const share = [...info.querySelectorAll('button')].find((b) => b.name !== 'add' && !b.closest('.shopify-payment-button') && !b.closest('product-form')); rec('main.share', share, main);
    }
  }
  const sp = sec('__material-spotlight');
  if (sp) {
    const w = sp.querySelector(':scope > div');
    rec('sp.root', sp, sp);
    if (w) {
      const inner = w.firstElementChild; const card = inner && inner.firstElementChild;
      rec('sp.wrap', w, sp); rec('sp.inner', inner, sp); rec('sp.card', card, sp);
      const hd = card && card.children[0]; rec('sp.header', hd, sp);
      const img = card && card.querySelector('img'); rec('sp.iconWrap', img && img.parentElement, sp); rec('sp.icon', img, sp);
      const t = card && card.querySelector('h2,h3,h4'); rec('sp.title', t, sp); rec('sp.headingGroup', t && t.parentElement, sp);
      rec('sp.subtitle', t && t.parentElement.querySelector('span'), sp);
      const m = card && card.querySelector('[role=meter]'); rec('sp.rating', m && m.parentElement, sp);
      const story = card && [...card.children].find((e) => e !== hd && !e.contains(m)); rec('sp.story', story, sp);
      const lab = m && m.parentElement.firstElementChild; rec('sp.ratingHeader', lab, sp);
      rec('sp.ratingLabel', lab && lab.children[0], sp); rec('sp.ratingScore', lab && lab.children[1], sp); rec('sp.ratingBars', m, sp);
      const bars = m ? [...m.children] : []; bars.forEach((b, i) => rec('sp.bar' + i, b, sp));
    }
  }
  const rp = sec('__related-products');
  if (rp) {
    const pr = rp.querySelector('product-recommendations');
    rec('rp.pr', pr, rp); rec('rp.h2', pr && pr.querySelector('h2'), rp);
    const ul = pr && pr.querySelector('ul'); rec('rp.ul', ul, rp);
    const lis = ul ? [...ul.children] : [];
    lis.forEach((li, i) => {
      rec(`rp.li${i}`, li, rp);
      const img = li.querySelector('img'); const media = img && img.closest('.card__inner, [data-card-media]');
      rec(`rp.li${i}.media`, media, rp); rec(`rp.li${i}.img`, img, rp);
      rec(`rp.li${i}.info`, media && media.nextElementSibling, rp);
      const t = [...li.querySelectorAll('h3,h5')].find(vis); rec(`rp.li${i}.title`, t, rp);
      const pr2 = li.querySelector('.price, [data-price]'); rec(`rp.li${i}.price`, pr2, rp);
      const badge = [...li.querySelectorAll('.card__badge, [data-card-badge]')].find(vis); rec(`rp.li${i}.badge`, badge, rp);
    });
  }
  const cs = [...document.querySelectorAll('.shopify-section')].find((s) => s.id.startsWith('shopify-section-template') && s.id.includes('custom'));
  if (cs) {
    rec('cs.root', cs, cs);
    const tb = cs.querySelector('[id^="TrustBadge"]'); rec('cs.trust', tb, cs);
    const mt = cs.querySelector('h3');
    if (mt) { const card = mt.parentElement.parentElement.parentElement; rec('cs.mat', card, cs); rec('cs.matHeader', card.firstElementChild, cs); rec('cs.matTitle', mt, cs); rec('cs.matSubtitle', mt.previousElementSibling, cs); const mi = card.querySelector('img'); rec('cs.matIconWrap', mi && mi.parentElement, cs); const mm = card.querySelector('[role=meter]'); rec('cs.matRating', mm && mm.parentElement, cs); }
  }
  return out;
};

const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
for (const vw of widths) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vw >= 1000 ? 900 : 800 } });
  await ctx.addInitScript(() => performance.setResourceTimingBufferSize(1000));
  const page = await ctx.newPage();
  for (const key of pages) {
    const resp = await page.goto(withTheme(PRODUCTS[key]), { waitUntil: 'load' });
    const cards = await scrollThrough(page, { waitCards: key !== 'home' });
    const data = { status: resp.status(), vw, cards, elements: await page.evaluate(dump), named: await page.evaluate(named), extra: await page.evaluate(() => { const sp = [...document.querySelectorAll('.shopify-section')].find((s) => s.id.includes('__material-spotlight')); return { spotlightChildren: sp ? sp.children.length : null, spotlightHtmlLen: sp ? sp.innerHTML.trim().length : null, dataSpot: !!document.querySelector('[data-material-spotlight]'), spotImgs: [...document.querySelectorAll('[data-material-spotlight] img')].map((i) => [i.getAttribute('width'), i.getAttribute('height'), i.getAttribute('loading'), i.getAttribute('fetchpriority')]), heading: (document.querySelector('[data-material-spotlight] h2,[data-material-spotlight] h3,[data-material-spotlight] h4') || {}).tagName }; }), overflow: await page.evaluate(overflowFn), h1: await page.evaluate(() => document.querySelectorAll('h1').length) };
    writeFileSync(`${outDir}/${label}-${key}-${vw}.json`, JSON.stringify(data));
    await page.screenshot({ path: `${SHOTS}/t2c-${label}-${key}-${vw}.png`, fullPage: true });
    console.log(label, key, vw, resp.status(), 'cards', cards, 'els', data.elements.length, 'xPage', data.overflow.xPage, 'h1', data.h1);
    await page.waitForTimeout(1500);
  }
  await ctx.close();
}
await browser.close();
