// C6a.4, C6a.6, C6a.10, C6a.14 (and Step 0 item 7) over the PXC or PXW proxy pages.
// node t6ac-grid.mjs <previewUrl> pxc|pxw <outFile>   (run from the repo root; proxies are scratch templates, see the plan section 10)
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, open, gridFn, sizesEvalFn, sleep } from './t6ac-lib.mjs';

const [, , , mode, outFile] = process.argv;
const { withTheme, themeId } = parseArgs();
const PXW = mode === 'pxw';
const WIDTHS = PXW ? [1024, 1200, 1440, 1700, 1759, 1760, 1920] : [320, 375, 767, 768, 1023, 1024, 1119, 1121, 1279, 1280, 1439, 1440, 1920];
const D = PXW ? ['auto', '3', '5'] : ['auto', '2', '3', '4', '5'];
const M_OF = (d) => (PXW ? (d === '5' ? ['2'] : ['1']) : ['1', '2']);
const E = PXW ? 164 : 104, P = PXW ? 1760 : 1440;

const CLS = {
  'auto-1': 'mb-0 grid grid-fill gap-4', 'auto-2': 'mb-0 grid grid-cols-2 xl:grid-fill gap-4',
  '2-1': 'mb-0 grid grid-cols-1 md:grid-cols-2 gap-4', '2-2': 'mb-0 grid grid-cols-2 gap-4',
  '3-1': 'mb-0 grid grid-cols-1 md:grid-cols-3 gap-4', '3-2': 'mb-0 grid grid-cols-2 md:grid-cols-3 gap-4',
  '4-1': 'mb-0 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4', '4-2': 'mb-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
  '5-1': 'mb-0 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4', '5-2': 'mb-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4',
};
// Section 5.3 expected sizes strings (C6a.6(c)).
const SIZES = PXW ? {
  'auto-1': '(min-width: 1760px) 521px, (min-width: 1696px) calc((100vw - 196px) / 3), (min-width: 1180px) calc((100vw - 180px) / 2), calc(100vw - 164px)',
  '3-1': '(min-width: 1760px) 521px, (min-width: 1024px) calc((100vw - 196px) / 3), (min-width: 768px) calc((100vw - 196px) / 3), calc(100vw - 164px)',
  '5-2': '(min-width: 1760px) 306px, (min-width: 1024px) calc((100vw - 228px) / 5), (min-width: 768px) calc((100vw - 196px) / 3), calc((100vw - 180px) / 2)',
} : {
  'auto-1': '(min-width: 1440px) 660px, (min-width: 1120px) calc((100vw - 120px) / 2), calc(100vw - 104px)',
  'auto-2': '(min-width: 1440px) 660px, calc((100vw - 120px) / 2)',
  '2-1': '(min-width: 1440px) 660px, (min-width: 1024px) calc((100vw - 120px) / 2), (min-width: 768px) calc((100vw - 120px) / 2), calc(100vw - 104px)',
  '3-1': '(min-width: 1440px) 434px, (min-width: 1024px) calc((100vw - 136px) / 3), (min-width: 768px) calc((100vw - 136px) / 3), calc(100vw - 104px)',
  '5-2': '(min-width: 1440px) 254px, (min-width: 1024px) calc((100vw - 168px) / 5), (min-width: 768px) calc((100vw - 136px) / 3), calc((100vw - 120px) / 2)',
};

function expectedK(d, m, w, wc) {
  const fit = Math.max(1, Math.floor((wc + 16) / 516));
  if (d === 'auto') return m === '2' && w < 1280 ? 2 : fit;
  if (d === '2') return w >= 768 ? 2 : +m;
  return w >= 1024 ? +d : w >= 768 ? 3 : +m;
}
const nEager = (d) => (d === 'auto' ? Math.floor((P - E + 16) / 516) : +d);

const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = { mode, runs: [], fails: [], sizesStrings: {} };
const fail = (v, w, msg) => out.fails.push(`${v}@${w}: ${msg}`);

const variants = [];
for (const d of D) for (const m of M_OF(d)) variants.push([d, m]);
for (const [d, m] of variants) {
  const key = `${d}-${m}`;
  const { ctx, page } = await newPage(browser, state, WIDTHS[0]);
  await open(page, withTheme, `/collections/all?view=t6a-${d}-${m}`, themeId);
  if (PXW) {
    const pw = await page.evaluate(() => { const s = getComputedStyle(document.querySelector('[data-page-shell]')); return [s.getPropertyValue('--page-width').trim(), s.getPropertyValue('--page-margin').trim()]; });
    out.pxwPre = pw;
    if (pw[0] !== '110rem' || pw[1] !== '50px') { out.invalid = `PXW precheck ${pw}`; break; }
  }
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    await sleep(250);
    const g = await page.evaluate(gridFn);
    const exp = CLS[key];
    if (!g.open.includes(`class="${exp}"`)) { out.invalid = `class mismatch ${key}: ${g.open}`; break; }
    const n = g.cards.length, imgs = g.cards.filter((c) => c.img);
    if (n < 1 || imgs.length < 1) { out.invalid = 'zero cards'; break; }
    const k = expectedK(d, m, w, g.wc);
    if (g.tracks !== k) fail(key, w, `tracks ${g.tracks} != ${k}`);
    const wcard = (g.wc - (k - 1) * 16) / k;
    g.cards.forEach((c, i) => { if (Math.abs(c.w - wcard) > 1) fail(key, w, `card ${i} w ${c.w} != ${wcard.toFixed(1)}`); });
    if (g.sw - g.iw !== 0) fail(key, w, `overflow ${g.sw - g.iw}`);
    if (g.h1 !== 1) fail(key, w, `h1 ${g.h1}`);
    const ev = [];
    for (let i = 0; i < g.cards.length; i++) {
      const c = g.cards[i];
      if (!c.img) continue;
      const s = await page.evaluate(sizesEvalFn, `[data-page-shell] > div[style*="--grid-min"] > :nth-child(${i + 1}) img`);
      ev.push(Math.round(s * 10) / 10);
      if (Math.abs(s - c.img.w) > 2) fail(key, w, `card ${i} S_eval ${s} vs W_r ${c.img.w}`);
    }
    out.runs.push({ key, w, wc: g.wc, tracks: g.tracks, cardW: g.cards[0].w, sEval0: ev[0], sw: g.sw - g.iw });
    if (w === WIDTHS[0]) {
      out.sizesStrings[key] = imgs[0].img.sizes;
      if (SIZES[key] && imgs[0].img.sizes !== SIZES[key]) fail(key, 'sizes', `string differs: ${imgs[0].img.sizes}`);
      const ne = nEager(d);
      let lazyAfter = 0;
      g.cards.forEach((c, i) => {
        if (!c.img) return;
        const want = i + 1 <= ne ? 'eager' : 'lazy';
        if (i + 1 > ne) lazyAfter++;
        if (c.img.loading !== want) fail(key, 'loading', `card ${i + 1} loading ${c.img.loading} want ${want}`);
      });
      if (lazyAfter < 1) out.invalid = `no card after n_eager (${key})`;
    }
  }
  await ctx.close();
  if (out.invalid) break;
  await sleep(1200);
}
await browser.close();
writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log(mode, 'runs', out.runs.length, 'fails', out.fails.length, out.invalid ? 'INVALID ' + out.invalid : '');
console.log(out.fails.slice(0, 25).join('\n'));
