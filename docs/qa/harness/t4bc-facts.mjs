// T4b Step 0 items 4, 9 (and re-run at head): X_page/X_off per width, h1 computed style, grid tracks, N_pre, M_css, bundle selectors.
// Usage: node t4bc-facts.mjs <previewBase> <label>   Output: docs/qa/evidence/t4bc-facts-<label>.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, overflowFn, sleep } from './t4bc-lib.mjs';

const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
const PATHS = ['/collections/all', '/collections', '/search?q=snowboard', '/pages/contact', '/pages/the-balanced-face-test-page', '/blogs/news', '/pages/tailwind-qa-missing', '/pages/the-material-archive', '/policies/refund-policy', '/products/the-3p-fulfilled-snowboard'];
const WIDTHS = [320, 375, 390, 430, 768, 1440, 1920];
const out = { label, pages: {}, mcss: {} };

const gridFn = () => [...document.querySelectorAll('[id^="shopify-section-template"][id$="__main"] *')]
  .filter((e) => getComputedStyle(e).display === 'grid' && e.children.length > 1 && !e.matches('.shopify-section'))
  .slice(0, 3).map((e) => ({ cls: String(e.className).slice(0, 60), cols: getComputedStyle(e).gridTemplateColumns, gap: getComputedStyle(e).columnGap, n: e.children.length }));
const h1Fn = () => [...document.querySelectorAll('h1')].map((h) => { const s = getComputedStyle(h); return { text: h.textContent.trim().slice(0, 40), ff: s.fontFamily.slice(0, 30), fs: s.fontSize, fw: s.fontWeight, tt: s.textTransform, x: Math.round(h.getBoundingClientRect().left) }; });

for (const path of PATHS) {
  out.pages[path] = {};
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  const resp = await page.goto(withTheme(path), { waitUntil: 'load' });
  const hdr = resp.headers();
  out.pages[path].status = resp.status();
  out.pages[path].nPre = (hdr.link || '').split(',').filter((x) => x.trim()).length;
  for (const vw of WIDTHS) {
    await page.setViewportSize({ width: vw, height: vw >= 1000 ? 900 : 812 });
    await sleep(250);
    const o = await page.evaluate(overflowFn);
    out.pages[path][vw] = { xPage: o.sw - o.vw, off: o.off.length, offs: o.off.slice(0, 4), h1: await page.evaluate(h1Fn), grids: await page.evaluate(gridFn) };
  }
  await ctx.close();
}

// M_css: stylesheet transfer per page.
async function mcss(page, path) {
  const sheets = [];
  const onResp = async (r) => {
    if (r.request().resourceType() !== 'stylesheet') return;
    const h = await r.allHeaders();
    let n = Number(h['content-length'] || 0);
    if (!n) { try { n = (await r.body()).length; } catch { n = 0; } }
    sheets.push({ url: r.url().replace(/\?.*$/, '').replace(/^https?:\/\/[^/]+/, ''), n });
  };
  page.on('response', onResp);
  await page.goto(withTheme(path), { waitUntil: 'load' });
  await sleep(700);
  page.off('response', onResp);
  const dom = await page.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => ({ href: l.getAttribute('href').replace(/\?.*$/, ''), inHead: !!l.closest('head') })));
  const themeSheets = sheets.filter((x) => !/preview-bar/.test(x.url));
  const sum = (a) => a.reduce((s, x) => s + x.n, 0);
  const headHrefs = dom.filter((d) => d.inHead).map((d) => d.href.split('/').pop());
  const B_head = sum(themeSheets.filter((x) => headHrefs.includes(x.url.split('/').pop())));
  const dawn = dom.filter((d) => !/tailwind\.css|base\.css/.test(d.href));
  const bundle = await page.evaluate(async () => {
    const link = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href).find((h) => /compiled_assets\/styles\.css/.test(h));
    if (!link) return null;
    const t = await (await fetch(link)).text();
    return { size: t.length, selectors: [...new Set((t.match(/\.[a-zA-Z_][\w-]*/g) || []))].sort() };
  });
  return { B_head, B_doc: sum(themeSheets), nDawn: dawn.length, bundleSize: bundle && bundle.size, bundleSelectors: bundle && bundle.selectors };
}
{
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  for (const p of ['/collections/all', '/search?q=snowboard', '/pages/the-material-archive', '/']) out.mcss[p] = await mcss(page, p);
  await ctx.close();
}
await browser.close();
mkdirSync('docs/qa/evidence', { recursive: true });
writeFileSync(`docs/qa/evidence/t4bc-facts-${label}.json`, JSON.stringify(out, null, 1));
for (const [p, d] of Object.entries(out.pages)) {
  console.log(p, 'status', d.status, 'nPre', d.nPre);
  for (const vw of WIDTHS) console.log('  ', vw, 'xPage', d[vw].xPage, 'off', d[vw].off, 'h1', JSON.stringify(d[vw].h1.map((h) => `${h.ff}|${h.fs}|${h.fw}|x${h.x}`)));
}
for (const [p, d] of Object.entries(out.mcss)) console.log('mcss', p, 'B_head', d.B_head, 'B_doc', d.B_doc, 'nDawn', d.nDawn, 'bundle', d.bundleSize);
