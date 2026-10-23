// T5a Step 0 items 6, 7b and 13 (and Step 9's head capture): per page, width and state, TWO loads (A, B). Each load, in this order (RC-1):
//   settle -> computed-style snapshot + rects (snapFn) -> in-page control (empty div must read display:none) -> base screenshot (ON)
//   -> disable base.css, control must read block -> screenshot (OFF)  [only when base.css is linked]. The load ends there; a toggled load is never reused.
// Outputs under $T5AC_OUT/<label>/ : snap-*.json.gz, on-*.png, and a summary line per load in meta.jsonl (on/off pixel diff: blocks, max channel delta).
// Usage: node t5ac-shots.mjs <previewBase> <label> <pages|all> <widths|sw> [state=S0] [loads=AB]
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, seedCart, settleFn, snapFn, saveGz, PAGES, PW_PAGE, W_SW, EXPECT } from './t5ac-lib.mjs';
const [, label, pagesArg = 'all', widthsArg = 'sw', state = 'S0', loadsArg = 'AB'] = process.argv.slice(2);
const OUT = `${process.env.T5AC_OUT || '/tmp/t5ac-out'}/${label}`;
mkdirSync(OUT, { recursive: true });
const { withTheme } = parseArgs();
const ALL = { ...PAGES, pw: PW_PAGE, ...(process.env.T5AC_EXTRA ? JSON.parse(process.env.T5AC_EXTRA) : {}) };
const keys = pagesArg === 'all' ? [...Object.keys(PAGES), 'pw'] : pagesArg.split(',');
const widths = widthsArg === 'sw' ? W_SW : widthsArg.split(',').map(Number);
const HIDE = '#preview-bar-iframe, #PBarNextFrameWrapper { display: none !important }';
const browser = await chromium.launch();
const { state: ss, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const cmp = await browser.newPage(); await cmp.goto('about:blank');

const ctlFn = () => { const d = document.createElement('div'); d.setAttribute('data-t5-ctl', ''); document.body.append(d); const v = getComputedStyle(d).display; d.remove(); return v; };
const compare = (A, B) => cmp.evaluate(async ([A, B]) => {
  const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
  const [ia, ib] = await Promise.all([load(A), load(B)]);
  const sizes = [ia.width, ia.height, ib.width, ib.height];
  const W = Math.min(ia.width, ib.width), H = Math.min(ia.height, ib.height);
  const get = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, W, H).data; };
  const da = get(ia), db = get(ib);
  const G = 16, cols = Math.ceil(W / G), rows = Math.ceil(H / G), cells = new Int16Array(cols * rows).fill(-1);
  let n = 0, maxD = 0;
  const tileMax = new Uint8Array(cols * rows), tileN = new Int32Array(cols * rows), tx0 = new Int32Array(cols * rows).fill(1e9), ty0 = new Int32Array(cols * rows).fill(1e9), tx1 = new Int32Array(cols * rows).fill(-1), ty1 = new Int32Array(cols * rows).fill(-1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = (y * W + x) * 4;
    const d = Math.max(Math.abs(da[p] - db[p]), Math.abs(da[p + 1] - db[p + 1]), Math.abs(da[p + 2] - db[p + 2]));
    if (d) { n++; if (d > maxD) maxD = d; const t = Math.floor(y / G) * cols + Math.floor(x / G); if (d > tileMax[t]) tileMax[t] = d; tileN[t]++; if (x < tx0[t]) tx0[t] = x; if (x > tx1[t]) tx1[t] = x; if (y < ty0[t]) ty0[t] = y; if (y > ty1[t]) ty1[t] = y; }
  }
  const blocks = []; const seen = new Uint8Array(cols * rows);
  for (let c = 0; c < tileN.length; c++) if (tileN[c] && !seen[c]) {
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, mx = 0, cnt = 0; const st = [c]; seen[c] = 1;
    while (st.length) { const q = st.pop(); const cx = q % cols, cy = Math.floor(q / cols); x0 = Math.min(x0, tx0[q]); y0 = Math.min(y0, ty0[q]); x1 = Math.max(x1, tx1[q]); y1 = Math.max(y1, ty1[q]); mx = Math.max(mx, tileMax[q]); cnt += tileN[q];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue; const k = ny * cols + nx; if (tileN[k] && !seen[k]) { seen[k] = 1; st.push(k); } } }
    blocks.push({ x0, y0, x1, y1, max: mx, n: cnt });
  }
  return { sizes, diffPixels: n, maxDelta: maxD, nBlocks: blocks.length, blocks: blocks.slice(0, 60) };
}, [A, B]);

async function prep(page, st) {
  if (st === 'S1' || st === 'S2') { await page.locator('[data-header-cart-icon]').first().click(); await page.waitForSelector('cart-drawer[data-state="open"]', { timeout: 8000, state: 'attached' }); await sleep(700); }
  else if (st === 'S3') { await page.locator('.theme-evolution-header-menu__toggle').first().click(); await sleep(700); }
  else if (st === 'S4') { await page.locator('#MaterialAccordion summary').click(); await page.waitForSelector('#material-data-container .material-accordion__story', { timeout: 10000 }).catch(() => {}); await sleep(300); }
  else if (st === 'S5') { await page.locator('.eco-tooltip-trigger').first().hover(); await page.waitForSelector('.eco-tooltip.is-visible', { timeout: 5000 }).catch(() => {}); }
}

for (const key of keys) for (const w of widths) for (const L of loadsArg.split('')) {
  const tag = `${key}-${w}-${state}-${L}`;
  const { ctx, page } = await newPage(browser, ss, w, w >= 1000 ? 900 : 812, { reducedMotion: 'reduce' });
  const meta = { key, w, state, L, valid: false };
  try {
    if (key === 'cartseed' || state === 'S2') await seedCart(page, withTheme, ['selling-plans-ski-wax']);
    await page.goto(withTheme(key === 'cartseed' ? '/cart' : ALL[key]), { waitUntil: 'load' });
    if (EXPECT[key] && !(await page.$(EXPECT[key]))) throw new Error('INVALID: proxy marker missing');
    if (state !== 'S0') { await sleep(1500); await prep(page, state); }
    await page.evaluate(settleFn, {});
    await page.addStyleTag({ content: HIDE });
    await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
    const snap = await page.evaluate(snapFn, {});
    saveGz(`${OUT}/snap-${tag}.json.gz`, snap);
    meta.nEls = snap.els.length;
    const c1 = await page.evaluate(ctlFn);
    meta.ctlOn = c1;
    const A = (await page.screenshot({ fullPage: true }));
    writeFileSync(`${OUT}/on-${tag}.png`, A);
    const hasBase = await page.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet]')].some((x) => /\/assets\/base\.css/.test(x.href)));
    meta.hasBase = hasBase;
    meta.logs = page.__logs;
    if (hasBase) {
      await page.evaluate(() => { const l = [...document.querySelectorAll('link[rel=stylesheet]')].find((x) => /\/assets\/base\.css/.test(x.href)); l.sheet.disabled = true; document.getAnimations().filter((a) => a.playState === 'running').forEach((a) => { try { a.finish(); } catch {} }); });
      await page.evaluate(async () => { for (let i = 0; i < 2; i++) await new Promise((r) => requestAnimationFrame(r)); });
      await sleep(300);
      meta.ctlOff = await page.evaluate(ctlFn);
      const B = await page.screenshot({ fullPage: true });
      meta.valid = c1 === 'none' && meta.ctlOff === 'block';
      meta.diff = await compare(A.toString('base64'), B.toString('base64'));
    } else meta.valid = c1 === 'block' || c1 === 'none';
  } catch (e) { meta.error = String(e.message).split('\n')[0].slice(0, 160); }
  appendFileSync(`${OUT}/meta.jsonl`, JSON.stringify(meta) + '\n');
  console.log(tag, meta.error ? 'ERROR ' + meta.error : `valid=${meta.valid} els=${meta.nEls} diffPx=${meta.diff?.diffPixels ?? '-'} blocks=${meta.diff?.nBlocks ?? '-'} max=${meta.diff?.maxDelta ?? '-'}`);
  await ctx.close(); await sleep(400);
}
await browser.close();
