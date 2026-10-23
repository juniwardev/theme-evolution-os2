// T3 Coder (from t2q-pixdiff): pixel diff of t3c-regress screenshots (base vs head) using a browser canvas. No password involved.
// Usage: node t2q-pixdiff.mjs <dir> <baseLabel> <headLabel>
import { chromium } from './t3c-lib.mjs';
import { readFileSync } from 'node:fs';

const [dir, a, b] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('about:blank');
for (const k of ['p3p', 'wax', 'snow', 'coll', 'search', 'cart', 'mat', 'p404', 'pw']) {
  for (const w of [1440, 375]) {
    const A = readFileSync(`${dir}/t3c-reg-${a}-${k}-${w}.png`).toString('base64');
    const B = readFileSync(`${dir}/t3c-reg-${b}-${k}-${w}.png`).toString('base64');
    const r = await page.evaluate(async ([A, B]) => {
      const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
      const [ia, ib] = await Promise.all([load(A), load(B)]);
      if (ia.width !== ib.width || ia.height !== ib.height) return { size: [ia.width, ia.height, ib.width, ib.height] };
      const get = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
      const da = get(ia), db = get(ib);
      let n = 0, minY = 1e9, maxY = -1, minX = 1e9, maxX = -1;
      for (let p = 0; p < da.length; p += 4) {
        if (da[p] !== db[p] || da[p + 1] !== db[p + 1] || da[p + 2] !== db[p + 2]) {
          n++; const idx = p / 4; const y = Math.floor(idx / ia.width), x = idx % ia.width;
          if (y < minY) minY = y; if (y > maxY) maxY = y; if (x < minX) minX = x; if (x > maxX) maxX = x;
        }
      }
      return { diffPixels: n, bbox: n ? [minX, minY, maxX, maxY] : null };
    }, [A, B]);
    console.log(k, w, JSON.stringify(r));
  }
}
await browser.close();
