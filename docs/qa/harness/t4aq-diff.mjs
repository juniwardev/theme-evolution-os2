// T4a QA diff. usage: node t4aq-diff.mjs shots <labelA> <labelB>   |   node t4aq-diff.mjs geom <captureA.json> <captureB.json>
import { readFileSync, existsSync } from 'node:fs';
import { chromium } from './t0-lib.mjs';
const DIR = 'docs/qa/screenshots';
const mode = process.argv[2];
if (mode === 'shots') {
  const [a, b] = process.argv.slice(3);
  const names = ['home', 'p3p', 'wax', 'snow', 'coll', 'colls', 'search', 'mat', 'p404', 'pw', 'cart-empty', 'cart-one', 'cart-two', 'drawer-empty', 'drawer-one', 'drawer-two'];
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('about:blank');
  for (const k of names) for (const w of [1440, 375]) {
    const fa = `${DIR}/t4aq-${a}-${k}-${w}.png`, fb = `${DIR}/t4aq-${b}-${k}-${w}.png`;
    if (!existsSync(fa) || !existsSync(fb)) continue;
    const r = await page.evaluate(async ([A, B]) => {
      const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
      const [ia, ib] = await Promise.all([load(A), load(B)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { size: [ia.width, ia.height, ib.width, ib.height] };
      const get = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
      const da = get(ia), db = get(ib);
      let n = 0, minY = 1e9, maxY = -1;
      for (let p = 0; p < da.length; p += 4) if (da[p] !== db[p] || da[p + 1] !== db[p + 1] || da[p + 2] !== db[p + 2]) { n++; const y = Math.floor(p / 4 / ia.width); if (y < minY) minY = y; if (y > maxY) maxY = y; }
      return { diffPixels: n, yRange: n ? [minY, maxY] : null };
    }, [readFileSync(fa).toString('base64'), readFileSync(fb).toString('base64')]);
    console.log(k.padEnd(13), w, JSON.stringify(r));
  }
  await browser.close();
} else {
  const A = JSON.parse(readFileSync(process.argv[3], 'utf8'));
  const B = JSON.parse(readFileSync(process.argv[4], 'utf8'));
  const num = (s) => parseFloat(s);
  const chans = (x, y) => x && y && x.every((v, i) => Math.abs(v - y[i]) <= 1);
  for (const st of Object.keys(A.drawer)) {
    console.log(`\n== drawer ${st}`);
    const a = A.drawer[st], b = B.drawer[st];
    if (!a || !b) { console.log('missing'); continue; }
    const names = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    for (const n of names) {
      if (!a[n] || !b[n]) { console.log(`  ${n}: only in ${a[n] ? 'A' : 'B'}`); continue; }
      const d = [];
      for (const k of ['x', 'y', 'w', 'h']) if (Math.abs(a[n][k] - b[n][k]) > 1) d.push(`${k} ${a[n][k]}->${b[n][k]}`);
      for (const k of ['display', 'position', 'fontSize', 'fontWeight', 'lineHeight', 'textTransform', 'textAlign', 'paddingTop', 'paddingLeft', 'paddingBottom', 'paddingRight', 'marginTop', 'marginBottom', 'borderTopWidth', 'borderTopLeftRadius', 'opacity', 'overflow']) {
        if (a[n][k] !== b[n][k] && !(num(a[n][k]) && Math.abs(num(a[n][k]) - num(b[n][k])) <= 1)) d.push(`${k} ${a[n][k]}->${b[n][k]}`);
      }
      if ((a[n].fontFamily || '').split(',')[0] !== (b[n].fontFamily || '').split(',')[0]) d.push(`font ${a[n].fontFamily.split(',')[0]}->${b[n].fontFamily.split(',')[0]}`);
      for (const k of ['colorCh', 'backgroundColorCh', 'borderTopColorCh', 'borderBottomColorCh']) if (!chans(a[n][k], b[n][k])) d.push(`${k} ${a[n][k]}->${b[n][k]}`);
      if (d.length) console.log(`  ${n}: ${d.join('; ')}`);
    }
  }
  for (const k of Object.keys(A.wrappers)) {
    const a = A.wrappers[k], b = B.wrappers[k];
    let diffs = 0;
    if (a.length !== b.length) console.log(`wrappers ${k}: count ${a.length} vs ${b.length}`);
    a.forEach((x, i) => { const y = b[i]; if (!y) return; if (JSON.stringify(x.p) !== JSON.stringify(y.p) || JSON.stringify(x.i) !== JSON.stringify(y.i) || JSON.stringify(x.pd) !== JSON.stringify(y.pd) || JSON.stringify(x.id) !== JSON.stringify(y.id)) diffs++; });
    console.log(`wrappers ${k}: n=${a.length} geometry diffs=${diffs}; head class sample: ${b[0] && b[0].cls}`);
  }
}
