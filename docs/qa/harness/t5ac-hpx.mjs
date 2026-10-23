// T5a head assertions on the proxies: C5a.12(b),(c) empty sinks, C5a.16 announcement bar, C5a.17 long-word heading, C5a.9 hr/blockquote borders in prose (Step 5).
// Usage: node t5ac-hpx.mjs <previewBase> <baseOutDir>   (baseOutDir = t5ac-shots output of the base proxies, for C5a.16's base positions)
import { chromium, parseArgs, loginState, newPage, sleep, settleFn, loadGz } from './t5ac-lib.mjs';
const [, baseDir] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
let fails = 0;
const ok = (id, c, d = '') => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'} ${id} ${d}`); };
for (const w of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, w, 812);
  await page.goto(withTheme('/pages/contact?view=t5-zoo'), { waitUntil: 'load' }); await sleep(1200); await page.evaluate(settleFn, {});
  const z = await page.evaluate(() => {
    const v = document.querySelector('[data-t5-zoo="vendor"]'); const kids = [...v.children]; const r = (e) => e.getBoundingClientRect();
    const pe = ['p-empty-div', 'p-empty-a', 'p-empty-ul', 'p-empty-h'].map((n) => { const e = document.querySelector(`[data-t5-zoo="${n}"]`); return [n, e && getComputedStyle(e).display]; });
    const gap = document.querySelector('[data-t5-zoo="gap"]'); const gk = [...gap.children];
    return { vendorDisplay: getComputedStyle(kids[1]).display, vendorGap: Math.round((r(kids[2]).top - r(kids[0]).bottom) * 10) / 10, proseEmpties: pe, bareEmpty: ['empty-div', 'empty-a', 'empty-ul', 'empty-h'].map((n) => getComputedStyle(document.querySelector(`[data-t5-zoo="${n}"]`)).display), gapRows: Math.round((r(gk[2]).top - r(gk[0]).bottom) * 10) / 10 };
  });
  ok(`C5a.12(b) ${w} vendor copy hidden, one 7px gap`, z.vendorDisplay === 'none' && Math.abs(z.vendorGap - 7) <= 1, JSON.stringify([z.vendorDisplay, z.vendorGap]));
  ok(`C5a.12(c) ${w} merchant-HTML empties hidden (4 found)`, z.proseEmpties.length === 4 && z.proseEmpties.every(([, d]) => d === 'none'), JSON.stringify(z.proseEmpties));
  ok(`E5a.17 ${w} bare empties visible (accepted)`, z.bareEmpty.every((d) => d !== 'none'), JSON.stringify(z.bareEmpty));
  await ctx.close();
}
{
  const { ctx, page } = await newPage(browser, state, 320, 812);
  await page.goto(withTheme('/pages/contact?view=t5-zoo'), { waitUntil: 'load' }); await sleep(1200);
  const r = await page.evaluate(() => { const p = document.querySelector('[data-t5-zoo="longword"]'), h = p.querySelector('h2'); return { wb: getComputedStyle(h).wordBreak, hr: h.getBoundingClientRect().right, pr: p.getBoundingClientRect().right }; });
  ok('C5a.17 long-word heading at 320', r.wb === 'break-word' && r.hr <= r.pr + 1, JSON.stringify(r));
  await ctx.close();
}
for (const [view, sel] of [['t5-zoo', '[data-t5-fixture="zoo-prose"]'], ['t5-rt', '[data-t5-fixture="rt-content"]']]) {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme('/pages/contact?view=' + view), { waitUntil: 'load' }); await sleep(1200);
  const r = await page.evaluate((s) => { const boxes = [...document.querySelectorAll(s)]; return { n: boxes.length, hr: boxes.flatMap((b) => [...b.querySelectorAll('hr')]).map((e) => getComputedStyle(e).borderTopStyle), bq: boxes.flatMap((b) => [...b.querySelectorAll('blockquote')]).map((e) => getComputedStyle(e).borderInlineStartStyle) }; }, sel);
  ok(`C5a.9/Step 5 ${view} prose hr and blockquote borders stay solid`, r.n >= 1 && r.hr.length >= 1 && r.bq.length >= 1 && r.hr.every((x) => x === 'solid') && r.bq.every((x) => x === 'solid'), JSON.stringify(r));
  await ctx.close();
}
for (const w of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, w, 812);
  await page.goto(withTheme('/'), { waitUntil: 'load' }); await sleep(1200); await page.evaluate(settleFn, {});
  const h = await page.evaluate(() => { const n = document.querySelector('[role="note"]'), hd = document.querySelector('header'); return { note: !!n, mb: n && getComputedStyle(n).marginBottom, headerTop: Math.round((hd.getBoundingClientRect().top + scrollY) * 100) / 100 }; });
  let baseTop = null; try { const s = loadGz(`${baseDir}/snap-pxea-${w}-S0-A.json.gz`); const e = s.els.find((x) => /header:1$/.test(x.k) && x.k.includes('header')); baseTop = e && e.r[1]; } catch {}
  ok(`C5a.16 ${w} announcement bar margin 0 and header 32px higher than base`, h.note && h.mb === '0px' && baseTop !== null && Math.abs(baseTop - h.headerTop - 32) <= 1, JSON.stringify({ ...h, baseTop }));
  await ctx.close();
}
await browser.close();
console.log(fails ? `FAILURES ${fails}` : 'ALL PASS');
