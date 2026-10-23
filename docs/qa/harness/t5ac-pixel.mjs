// T5a Step 0 item 8 (N class) evidence: full-page screenshot with base.css on, then off (same load), compared pixel by pixel in the page.
// Reports the changed pixel count and coarse diff blocks (rects), to be matched against TOG entries' rects.
// Usage: node t5ac-pixel.mjs <previewBase> <label> <pages|all|key,key> <widths>
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, settleFn, PAGES, EXPECT } from './t5ac-lib.mjs';
const [, label, pagesArg = 'all', widthsArg = '375,1440'] = process.argv.slice(2);
const { withTheme } = parseArgs();
const ALL = { ...PAGES, ...(process.env.T5AC_EXTRA ? JSON.parse(process.env.T5AC_EXTRA) : {}) };
const keys = pagesArg === 'all' ? Object.keys(PAGES) : pagesArg.split(',');
const widths = widthsArg.split(',').map(Number);
const HIDE = '#preview-bar-iframe, #PBarNextFrameWrapper { display: none !important }';
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const cmp = browser.newPage ? await browser.newPage() : null;
await cmp.goto('about:blank');
const out = [];
for (const key of keys) for (const w of widths) {
  const { ctx, page } = await newPage(browser, state, w, w >= 1000 ? 900 : 812, { reducedMotion: 'reduce' });
  try {
    await page.goto(withTheme(ALL[key]), { waitUntil: 'load' });
    if (EXPECT[key] && !(await page.$(EXPECT[key]))) throw new Error('proxy marker missing');
    await page.evaluate(settleFn, {});
    await page.addStyleTag({ content: HIDE });
    await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
    const A = (await page.screenshot({ fullPage: true })).toString('base64');
    await page.evaluate(() => { const l = [...document.querySelectorAll('link[rel=stylesheet]')].find((x) => /\/assets\/base\.css/.test(x.href)); l.sheet.disabled = true; document.getAnimations().filter((a) => a.playState === 'running').forEach((a) => { try { a.finish(); } catch {} }); });
    await sleep(500);
    const B = (await page.screenshot({ fullPage: true })).toString('base64');
    const r = await cmp.evaluate(async ([A, B]) => {
      const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
      const [ia, ib] = await Promise.all([load(A), load(B)]);
      const sizes = [ia.width, ia.height, ib.width, ib.height];
      const W = Math.min(ia.width, ib.width), H = Math.min(ia.height, ib.height);
      const get = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, W, H).data; };
      const da = get(ia), db = get(ib);
      const G = 16, cols = Math.ceil(W / G), rows = Math.ceil(H / G), cells = new Uint8Array(cols * rows);
      let n = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = (y * W + x) * 4; if (da[p] !== db[p] || da[p + 1] !== db[p + 1] || da[p + 2] !== db[p + 2]) { n++; cells[Math.floor(y / G) * cols + Math.floor(x / G)] = 1; } }
      // merge cells into blocks (4-neighbour flood fill)
      const blocks = []; const seen = new Uint8Array(cells.length);
      for (let c = 0; c < cells.length; c++) if (cells[c] && !seen[c]) {
        let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; const st = [c]; seen[c] = 1;
        while (st.length) { const q = st.pop(); const cx = q % cols, cy = Math.floor(q / cols); x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy);
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue; const k = ny * cols + nx; if (cells[k] && !seen[k]) { seen[k] = 1; st.push(k); } } }
        blocks.push([x0 * G, y0 * G, (x1 - x0 + 1) * G, (y1 - y0 + 1) * G]);
      }
      return { sizes, diffPixels: n, blocks: blocks.slice(0, 40), nBlocks: blocks.length };
    }, [A, B]);
    out.push({ key, w, ...r });
    console.log(key, w, JSON.stringify({ sizes: r.sizes, diffPixels: r.diffPixels, nBlocks: r.nBlocks, blocks: r.blocks.slice(0, 6) }));
  } catch (e) { console.log(key, w, 'ERROR', String(e.message).split('\n')[0].slice(0, 120)); }
  await ctx.close(); await sleep(600);
}
mkdirSync('docs/qa/evidence', { recursive: true });
writeFileSync(`docs/qa/evidence/t5ac-pixel-${label}.json`, JSON.stringify(out));
await browser.close();
