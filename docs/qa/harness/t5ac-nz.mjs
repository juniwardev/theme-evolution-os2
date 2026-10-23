// T5a Step 0 item 6: NZ, the noise set. Base build loaded twice (loads A and B of t5ac-shots) per page, width and state: property differences between the
// two loads and the A-versus-B screenshot difference. Usage: node t5ac-nz.mjs <outDir/label> [state=S0]   Output: docs/qa/evidence/t5ac-nz-<label>.json
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { chromium, loadGz, diffSnaps } from './t5ac-lib.mjs';
const [dir, state = 'S0'] = process.argv.slice(2);
const label = dir.split('/').pop();
const files = readdirSync(dir).filter((f) => f.startsWith('snap-') && f.endsWith(`-${state}-A.json.gz`));
const browser = await chromium.launch(); const page = await browser.newPage(); await page.goto('about:blank');
const out = [];
for (const f of files) {
  const tag = f.replace(/^snap-/, '').replace(/-A\.json\.gz$/, '');
  if (!existsSync(`${dir}/snap-${tag}-B.json.gz`)) continue;
  const d = diffSnaps(loadGz(`${dir}/snap-${tag}-A.json.gz`), loadGz(`${dir}/snap-${tag}-B.json.gz`));
  const A = readFileSync(`${dir}/on-${tag}-A.png`).toString('base64'), B = readFileSync(`${dir}/on-${tag}-B.png`).toString('base64');
  const px = await page.evaluate(async ([A, B]) => {
    const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
    const [a, b] = await Promise.all([load(A), load(B)]);
    if (a.width !== b.width || a.height !== b.height) return { size: [a.width, a.height, b.width, b.height] };
    const g = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
    const da = g(a), db = g(b); let n = 0, mx = 0;
    for (let p = 0; p < da.length; p += 4) { const dd = Math.max(Math.abs(da[p] - db[p]), Math.abs(da[p + 1] - db[p + 1]), Math.abs(da[p + 2] - db[p + 2])); if (dd) { n++; if (dd > mx) mx = dd; } }
    return { diffPixels: n, maxDelta: mx };
  }, [A, B]);
  const props = {}; for (const x of d.diffs) props[x.prop] = (props[x.prop] || 0) + 1;
  out.push({ tag, paired: d.paired, only1: d.only1.length, only2: d.only2.length, nDiffs: d.diffs.length, props, px, sample: d.diffs.slice(0, 4).map((x) => `${x.k.slice(-50)} ${x.pseudo}${x.prop}: ${x.a} -> ${x.b}`) });
}
writeFileSync(`docs/qa/evidence/t5ac-nz-${label}-${state}.json`, JSON.stringify(out));
const noisy = out.filter((o) => o.nDiffs || o.only1 || o.only2 || o.px.diffPixels || o.px.size);
console.log('pairs', out.length, 'noisy', noisy.length);
for (const o of noisy.slice(0, 40)) console.log(o.tag, 'diffs', o.nDiffs, 'unpaired', o.only1 + o.only2, 'px', JSON.stringify(o.px), JSON.stringify(o.props).slice(0, 120));
await browser.close();
