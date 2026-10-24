// T5a QA (independent of t5ac-* measurement code; only login/context helpers are shared).
// Capture one build (label base|head): full computed styles + rects + screenshot + console + css requests, per page and width.
// Usage: T5AQ_STATE=<scratch>/state.json node t5aq-cap.mjs <previewBase> <label> <outDir> <pagesCsv|all> <widthsCsv> [loadTag=A]
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { chromium, loginState, sleep } from './t5ac-lib.mjs';

const [previewBase, label, outDir, pagesArg, widthsArg, loadTag = 'A'] = process.argv.slice(2);
const origin = new URL(previewBase).origin;
const themeId = new URL(previewBase).searchParams.get('preview_theme_id');
const withTheme = (p) => `${origin}${p}${p.includes('?') ? '&' : '?'}preview_theme_id=${themeId}`;

export const PAGES = {
  home: '/', p3p: '/products/the-3p-fulfilled-snowboard', wax: '/products/selling-plans-ski-wax',
  snow: '/products/the-complete-snowboard', landing: '/products/the-complete-snowboard?view=landing-page',
  collection: '/collections/all', collections: '/collections', search: '/search?q=snowboard', search0: '/search?q=zzqxv',
  cart: '/cart', optout: '/pages/data-sharing-opt-out', balanced: '/pages/the-balanced-face-test-page',
  contact: '/pages/contact', archive: '/pages/the-material-archive', blog: '/blogs/news',
  missing: '/pages/tailwind-qa-missing', policy: '/policies/privacy-policy', password: '/password',
};
const pages = pagesArg === 'all' ? Object.keys(PAGES) : pagesArg.split(',');
const widths = widthsArg.split(',').map(Number);

const STATE = process.env.T5AQ_STATE;
const browser = await chromium.launch();
let state;
if (STATE && existsSync(STATE)) { const j = JSON.parse(readFileSync(STATE, 'utf8')); state = j.state || j; }
else {
  const r = await loginState(browser, withTheme);
  if (!r.loggedIn) throw new Error('login failed');
  state = r.state;
}
mkdirSync(outDir, { recursive: true });

// In-page snapshot: every element's rect and full computed style (no custom properties), plus ::before/::after.
const snap = () => {
  const out = [];
  const skip = (el) => el.id === 'preview-bar-iframe' || el.closest('#preview-bar-iframe');
  const pathOf = (el) => {
    const parts = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.id && !/^\d|[a-f0-9]{8,}/.test(n.id) && !/response|captcha/i.test(n.id)) { parts.unshift(n.tagName.toLowerCase() + '#' + n.id); break; }
      const sib = n.parentElement ? [...n.parentElement.children].filter((c) => c.tagName === n.tagName) : [n];
      parts.unshift(n.tagName.toLowerCase() + (sib.length > 1 ? ':' + (sib.indexOf(n) + 1) : ''));
    }
    return parts.join('>');
  };
  const props = (cs) => { const o = {}; for (let i = 0; i < cs.length; i++) { const p = cs[i]; if (!p.startsWith('--')) o[p] = cs.getPropertyValue(p); } return o; };
  for (const el of document.querySelectorAll('*')) {
    if (skip(el)) continue;
    const r = el.getBoundingClientRect();
    const rec = { k: pathOf(el), r: [r.x, r.y, r.width, r.height].map((v) => Math.round(v * 100) / 100), cs: props(getComputedStyle(el)) };
    for (const ps of ['::before', '::after']) { const c = getComputedStyle(el, ps); if (c.content && c.content !== 'none' && c.content !== 'normal') (rec.ps ||= {})[ps] = props(c); }
    out.push(rec);
  }
  return out;
};

for (const key of pages) {
  for (const w of widths) {
    // SKIP_EXISTING: resume after a network stall without re-capturing finished page-widths
    if (existsSync(`${outDir}/${label}-${key}-${w}-${loadTag}.json.gz`)) continue;
    const ctx = await browser.newContext({ storageState: state, viewport: { width: w, height: 812 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const logs = []; const reqs = [];
    page.on('console', (m) => { if (m.type() === 'error') logs.push('console.error: ' + m.text().replace(/\?[^\s)'"]*/g, '').slice(0, 300)); });
    page.on('pageerror', (e) => logs.push('pageerror: ' + String(e.message).slice(0, 300)));
    page.on('request', (rq) => { if (/\.css(\?|$)/.test(rq.url()) || rq.resourceType() === 'stylesheet') reqs.push(rq.url().replace(/\?.*/, '')); });
    const resp = await page.goto(withTheme(PAGES[key]), { waitUntil: 'load' });
    await sleep(800);
    if (key === 'optout') await page.waitForSelector('body > div[aria-hidden="true"] iframe[src*="hcaptcha"]', { state: 'attached', timeout: 10000 }).catch(() => {});
    if (/products\//.test(PAGES[key])) await page.waitForFunction(() => { const p = document.querySelector('product-recommendations'); return !p || p.querySelector('li'); }, null, { timeout: 10000 }).catch(() => {});
    await page.evaluate(async () => {
      await document.fonts.ready;
      document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; });
      await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
      const H = document.documentElement.scrollHeight;
      for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
      document.getAnimations().forEach((a) => a.pause());
      const pb = document.getElementById('preview-bar-iframe'); if (pb) pb.style.display = 'none';
    });
    await sleep(1000);
    const meta = await page.evaluate(() => ({
      url: location.pathname + location.search, title: document.title,
      sheets: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href.replace(/\?.*/, '')),
      layers: (() => { const r = document.styleSheets[0] && document.styleSheets[0].cssRules[0]; return r && r.nameList ? [...r.nameList] : null; })(),
      h1: document.querySelectorAll('h1').length,
      docW: document.documentElement.scrollWidth, innerW: window.innerWidth, docH: document.documentElement.scrollHeight,
      rootFont: getComputedStyle(document.documentElement).fontSize, rootLH: getComputedStyle(document.documentElement).lineHeight,
      imgNoDim: [...document.images].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
      sheetCount: document.styleSheets.length,
    }));
    const els = await page.evaluate(snap);
    const tag = `${key}-${w}-${loadTag}`;
    const shot = await page.screenshot({ fullPage: true, animations: 'disabled' });
    writeFileSync(`${outDir}/${label}-${tag}.png`, shot);
    writeFileSync(`${outDir}/${label}-${tag}.json.gz`, gzipSync(JSON.stringify({ meta, els, logs, reqs, status: resp && resp.status() })));
    console.log(label, tag, resp && resp.status(), 'els', els.length, 'docW', meta.docW, 'inner', meta.innerW, 'sheets', meta.sheets.length, 'logs', logs.length);
    await ctx.close();
    await sleep(500);
  }
}
await browser.close();
