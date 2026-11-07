// C6a.7 (srcset, N_out, candidates) and C6a.8 (R_pick) on head: node t6ac-sizes.mjs <previewUrl> <baseFactsJson> <outFile>
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, open, gridFn, fileSizeFn, widthParam, sleep } from './t6ac-lib.mjs';

const [, , , baseFacts, outFile] = process.argv;
const { withTheme, themeId } = parseArgs();
const nat = JSON.parse(readFileSync(baseFacts, 'utf8')).fixtures.sizes;
const abs = (u) => (u.startsWith('//') ? 'https:' + u : u);
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = { c7: { cards: [], fails: [] }, c8: [], c8fails: [] };

{
  const { ctx, page } = await newPage(browser, state, 1440);
  await open(page, withTheme, '/collections/all', themeId);
  const g = await page.evaluate(gridFn);
  const imgs = g.cards.map((c) => c.img).filter(Boolean);
  if (imgs.length !== nat.length || imgs.length < 1) throw new Error('img count mismatch vs base facts');
  for (let i = 0; i < imgs.length; i++) {
    const im = imgs[i];
    const [nw, nh] = nat[i];
    const plan = Math.min(1600, nw, nh);
    const nOut = (await page.evaluate(fileSizeFn, abs(im.src)))[0];
    const desc = im.srcset.split(',').map((s) => +s.trim().split(' ')[1].replace('w', ''));
    const want = [...[360, 540, 720, 1080, 1600].filter((x) => x < plan), plan];
    const rec = { i, plan, nOut, attrW: im.width, attrH: im.height, desc };
    out.c7.cards.push(rec);
    if (Math.abs(nOut - plan) > 1) out.c7.fails.push(`card ${i}: N_out ${nOut} vs plan ${plan}`);
    if (+im.width !== nOut || +im.height !== nOut) out.c7.fails.push(`card ${i}: width/height attr ${im.width}x${im.height} vs N_out ${nOut}`);
    if (JSON.stringify(desc) !== JSON.stringify(want)) out.c7.fails.push(`card ${i}: descriptors ${desc} != ${want}`);
    if (plan > 1080 && Math.max(...desc) <= 1080) out.c7.fails.push(`card ${i}: 1600 top missing`);
  }
  out.c7.over1080 = out.c7.cards.filter((c) => c.plan > 1080).length;
  // first card: every candidate loaded detached
  out.c7.candidates = [];
  for (const cand of imgs[0].srcset.split(',').map((s) => s.trim().split(' '))) {
    const [fw, fh] = await page.evaluate(fileSizeFn, abs(cand[0]));
    const dw = +cand[1].replace('w', '');
    out.c7.candidates.push({ desc: dw, fw, fh });
    if (Math.abs(fw - dw) > 1 || Math.abs(fh - fw) > 1) out.c7.fails.push(`candidate ${dw}: file ${fw}x${fh}`);
  }
  await ctx.close();
}

for (const view of ['', '?view=t6a-4-2']) {
  for (const [vw, dpr] of [[375, 1], [375, 2], [375, 3], [1440, 1], [1440, 2]]) {
    const { ctx, page } = await newPage(browser, state, vw, 900, dpr);
    await open(page, withTheme, '/collections/all' + view, themeId);
    await sleep(1500);
    const g = await page.evaluate(gridFn);
    const first4 = g.cards.slice(0, 4).filter((c) => c.img);
    const recs = first4.map((c, i) => {
      const need = Math.min(c.img.w * dpr, +c.img.width);
      const picked = widthParam(c.img.currentSrc);
      return { i, cardW: c.img.w, need: Math.round(need), picked, r: Math.round((picked / need) * 1000) / 1000 };
    });
    out.c8.push({ view: view || 'default', vw, dpr, recs });
    for (const r of recs) if (r.r < 0.75) out.c8fails.push(`${view || 'default'} ${vw}@${dpr} card ${r.i}: R_pick ${r.r}`);
    await ctx.close(); await sleep(1000);
  }
}
await browser.close();
writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log('c7 fails', out.c7.fails.length, 'over1080', out.c7.over1080, 'c8 fails', out.c8fails.length);
console.log([...out.c7.fails, ...out.c8fails].slice(0, 25).join('\n'));
