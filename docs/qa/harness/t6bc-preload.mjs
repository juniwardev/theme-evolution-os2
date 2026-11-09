// T6b Step 0 item 8 (experiments on PXB-exp) and C6b.15 (preload header).
// Usage: node t6bc-preload.mjs <previewBase> <label> exp <views,comma>   -- reads /?view=<v> and reports Link entries
//        node t6bc-preload.mjs <previewBase> <label> real                -- real / (banner at index 2) + views given by VIEWS env
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, load } from './t6bc-lib.mjs';

const [, label, mode, viewsArg] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');

export function parseLink(headerArr) {
  const entries = [];
  for (const h of headerArr) {
    // Split on commas that start a new <url> entry.
    for (const part of h.split(/,\s*(?=<)/)) entries.push(part.trim());
  }
  return entries.map((e) => {
    const url = (e.match(/^<([^>]*)>/) || [])[1] || '';
    const attr = (n) => { const m = e.match(new RegExp(';\\s*' + n + '="([^"]*)"')) || e.match(new RegExp(';\\s*' + n + '=([^;\\s]+)')); return m ? m[1] : null; };
    return { url, rel: attr('rel'), as: attr('as'), imagesrcset: attr('imagesrcset'), imagesizes: attr('imagesizes'), raw: e };
  });
}
const cands = (set) => (set || '').split(/,\s+(?=\S+\s+\d+w|https?:|\/\/)/).map((x) => x.trim()).filter(Boolean);
const norm = (set) => cands(set).map((c) => c.replace(/^https?:/, '').replace(/&amp;/g, '&')).sort();

async function probe(path, vw, dpr = 1) {
  const { page, ctx } = await newPage(browser, state, vw, 812, { deviceScaleFactor: dpr });
  const resp = await page.goto(withTheme(path), { waitUntil: 'load' });
  const id = await page.evaluate(() => window.Shopify?.theme?.id);
  if (Number(id) !== Number(themeId)) throw new Error('INVALID theme ' + id);
  if (resp.status() === 429) throw new Error('INVALID 429');
  const hdrs = (await resp.headersArray()).filter((h) => h.name.toLowerCase() === 'link').map((h) => h.value);
  const entries = parseLink(hdrs);
  const preloads = entries.filter((e) => /preload/.test(e.rel || ''));
  const imgEntries = preloads.filter((e) => e.as === 'image');
  const imgs = await page.evaluate(() => [...document.querySelectorAll('[data-banner-media] img')].map((i) => ({ srcset: i.getAttribute('srcset'), sizes: i.getAttribute('sizes'), width: i.getAttribute('width'), src: i.currentSrc, fp: i.getAttribute('fetchpriority') })));
  const res = await page.evaluate(() => performance.getEntriesByType('resource').filter((r) => r.initiatorType === 'img' || r.initiatorType === 'other' || r.initiatorType === 'link').map((r) => r.name.replace(/\?.*/, '')));
  await ctx.close();
  return { path, vw, dpr, status: resp.status(), entriesTotal: entries.length, L_n: preloads.length, imgEntries: imgEntries.map((e) => ({ L_len: e.raw.length, n_cand: cands(e.imagesrcset).length, imagesizes: e.imagesizes, set: norm(e.imagesrcset) })), imgs: imgs.map((i) => ({ n_cand: cands(i.srcset).length, sizes: i.sizes, width: i.width, set: norm(i.srcset), fp: i.fp })), res };
}

const out = { label, mode, runs: [] };
const views = (viewsArg || '').split(',').filter(Boolean);
if (mode === 'exp') {
  for (const v of views) {
    out.runs.push({ view: v, ...(await probe('/?view=' + v, 1440)) });
    await sleep(2500);
  }
} else if (mode === 'real') {
  for (const vw of [1440, 375]) {
    out.runs.push({ view: 'real', ...(await probe('/', vw)) });
    await sleep(2500);
  }
} else if (mode === 'final') {
  // C6b.15: PXB (view=pxb) and PXB-amb (view=pxbamb) at 1440 and 375, then real / (banner at index 2)
  for (const v of ['pxb', 'pxbamb']) for (const vw of [1440, 375]) {
    out.runs.push({ view: v, ...(await probe('/?view=' + v, vw)) });
    await sleep(2500);
  }
  for (const vw of [1440, 375]) {
    out.runs.push({ view: 'real', ...(await probe('/', vw)) });
    await sleep(2500);
  }
}
writeFileSync(`docs/qa/evidence/t6bc-preload-${label}.json`, JSON.stringify(out, null, 1));
for (const r of out.runs) console.log(r.view, r.vw, 'status', r.status, 'entries', r.entriesTotal, 'L_n', r.L_n, 'imgEntries', JSON.stringify(r.imgEntries.map((e) => [e.L_len, e.n_cand, e.imagesizes])), 'imgs', JSON.stringify(r.imgs.map((i) => [i.n_cand, i.sizes, i.width])));
await browser.close();
