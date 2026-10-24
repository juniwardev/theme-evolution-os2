// T5a QA cross-build comparison over t5aq-cap output.
// Usage: node t5aq-cmp.mjs <capDir> <outTxt> [keysRegex]
// For each page-width: base A vs head A, noise = base A vs base B. Reports grouped computed-style diffs, rect moves (>1px),
// unpaired elements, meta diffs, head-only console errors, css requests, and per-pixel diffs (count, max channel level, bbox).
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { chromium } from './t5ac-lib.mjs';

const [dir, outTxt, keysRe = '.', shiftArg = ''] = process.argv.slice(2);
// shiftArg 'y0base:y0head' compares base rows from y0base with head rows from y0head (PXA: content below the header moves up by the bar's margin).
const shift = shiftArg ? shiftArg.split(':').map(Number) : null;
const load = (f) => JSON.parse(gunzipSync(readFileSync(f)).toString());
const tags = readdirSync(dir).filter((f) => f.startsWith('head-') && f.endsWith('-A.json.gz') && new RegExp(keysRe).test(f)).map((f) => f.replace(/^head-/, '').replace(/-A\.json\.gz$/, ''));
const browser = await chromium.launch(); const pg = await browser.newPage(); await pg.goto('about:blank');
const pix = (A, B, sh) => pg.evaluate(async ([A, B, sh]) => {
  const ld = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
  const [a, b] = await Promise.all([ld(A), ld(B)]);
  if (!sh && (a.width !== b.width || a.height !== b.height)) return { size: [a.width, a.height, b.width, b.height] };
  const g = (i, y0, h) => { const c = document.createElement('canvas'); c.width = i.width; c.height = h; const x = c.getContext('2d'); x.drawImage(i, 0, y0, i.width, h, 0, 0, i.width, h); return x.getImageData(0, 0, i.width, h).data; };
  const H = sh ? Math.min(a.height - sh[0], b.height - sh[1]) : a.height;
  const da = g(a, sh ? sh[0] : 0, H), db = g(b, sh ? sh[1] : 0, H); const W = a.width; let n = 0, mx = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let p = 0; p < da.length; p += 4) { const d = Math.max(Math.abs(da[p] - db[p]), Math.abs(da[p + 1] - db[p + 1]), Math.abs(da[p + 2] - db[p + 2])); if (d) { n++; if (d > mx) mx = d; const i = p / 4, x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  return { n, mx, bbox: n ? [x0, y0, x1, y1] : null, w: a.width, h: a.height };
}, [A, B, sh]);
const b64 = (f) => readFileSync(f).toString('base64');
const diff = (s1, s2) => {
  const m1 = new Map(s1.els.map((e) => [e.k, e])), m2 = new Map(s2.els.map((e) => [e.k, e]));
  const diffs = [], only1 = [], only2 = [];
  for (const [k, e1] of m1) {
    const e2 = m2.get(k); if (!e2) { only1.push(k); continue; }
    for (const p of new Set([...Object.keys(e1.cs), ...Object.keys(e2.cs)])) if (e1.cs[p] !== e2.cs[p]) diffs.push({ k, pseudo: '', p, a: e1.cs[p], b: e2.cs[p] });
    for (const ps of new Set([...Object.keys(e1.ps || {}), ...Object.keys(e2.ps || {})])) {
      const c1 = (e1.ps || {})[ps] || {}, c2 = (e2.ps || {})[ps] || {};
      for (const p of new Set([...Object.keys(c1), ...Object.keys(c2)])) if (c1[p] !== c2[p]) diffs.push({ k, pseudo: ps, p, a: c1[p], b: c2[p] });
    }
    const dr = e1.r.map((v, i) => Math.abs(v - e2.r[i]));
    if (Math.max(...dr) > 1) diffs.push({ k, pseudo: '', p: '__rect', a: e1.r.join(','), b: e2.r.join(',') });
  }
  for (const k of m2.keys()) if (!m1.has(k)) only2.push(k);
  return { diffs, only1, only2, paired: m1.size - only1.length };
};
const lines = []; const log = (s) => { lines.push(s); };
const groups = new Map();
let nUnexplainedMeta = 0;
for (const tag of tags) {
  const bA = load(`${dir}/base-${tag}-A.json.gz`), hA = load(`${dir}/head-${tag}-A.json.gz`);
  const bB = existsSync(`${dir}/base-${tag}-B.json.gz`) ? load(`${dir}/base-${tag}-B.json.gz`) : null;
  const nz = new Set(), nzUn = new Set();
  if (bB) { const d = diff(bA, bB); d.diffs.forEach((x) => nz.add(`${x.k}|${x.pseudo}|${x.p}`)); d.only1.concat(d.only2).forEach((k) => nzUn.add(k)); }
  const d = diff(bA, hA);
  const allUnpaired = d.only1.concat(d.only2).filter((k) => !nzUn.has(k));
  const unpaired = allUnpaired.filter((k) => !k.startsWith('html>head>'));
  const headUnp = allUnpaired.length - unpaired.length;
  log(`## ${tag}  status ${bA.status}/${hA.status}  paired ${d.paired}  unpaired ${unpaired.length} (+${headUnp} in <head>)  noise ${nz.size}`);
  if (unpaired.length) log('  UNPAIRED: ' + unpaired.slice(0, 6).join(' | '));
  // meta
  const mk = ['docW', 'docH', 'innerW', 'h1', 'imgNoDim', 'rootFont', 'rootLH'];
  for (const k of mk) if (bA.meta[k] !== hA.meta[k]) { log(`  META ${k}: ${bA.meta[k]} -> ${hA.meta[k]}`); nUnexplainedMeta++; }
  log(`  sheets base ${bA.meta.sheets.length} head ${hA.meta.sheets.length}; head theme css: ${hA.meta.sheets.filter((s) => /\/assets\//.test(s)).map((s) => s.split('/').pop()).join(',')}; layers head ${JSON.stringify(hA.meta.layers)}`);
  const baseReqs = hA.reqs.filter((r) => /\/assets\//.test(r)).map((r) => r.split('/').pop());
  if (hA.reqs.some((r) => /\/cdn\/shop\/t\/\d+\/assets\/(?!tailwind\.css)[^/]+\.css/.test(r))) log(`  !! head requested a non-tailwind theme css: ${hA.reqs.filter((r) => /\/assets\//.test(r)).join(',')}`);
  const bl = new Set(bA.logs), hl = hA.logs.filter((l) => !bl.has(l));
  if (hl.length) log('  HEAD-ONLY CONSOLE: ' + hl.join(' || '));
  // grouped style diffs
  const rect = [];
  for (const x of d.diffs) {
    if (x.p === '__rect') { if (!nz.has(`${x.k}|${x.pseudo}|__rect`)) rect.push(x); continue; }
    if (nz.has(`${x.k}|${x.pseudo}|${x.p}`)) continue;
    const g = `${x.k.split('>').pop().replace(/:\d+/g, '')}${x.pseudo ? x.pseudo : ''} | ${x.p} | ${x.a} -> ${x.b}`.slice(0, 200);
    const e = groups.get(g) || { n: 0, pages: new Set(), ex: x.k.slice(-70) }; e.n++; e.pages.add(tag); groups.set(g, e);
  }
  if (rect.length) { log(`  RECT MOVES ${rect.length}: ` + rect.slice(0, 4).map((x) => x.k.slice(-40) + ' ' + x.a + ' -> ' + x.b).join(' | ')); }
  // pixels
  const P = await pix(b64(`${dir}/base-${tag}-A.png`), b64(`${dir}/head-${tag}-A.png`), shift);
  const Pn = existsSync(`${dir}/base-${tag}-B.png`) ? await pix(b64(`${dir}/base-${tag}-A.png`), b64(`${dir}/base-${tag}-B.png`), null) : null;
  log(`  PIXELS base-vs-head: ${JSON.stringify(P)}   base-vs-base(noise): ${Pn ? JSON.stringify({ n: Pn.n, mx: Pn.mx, size: Pn.size }) : 'n/a'}`);
}
log('\n# GROUPED STYLE DIFFS (head vs base, noise removed; count, pages)');
for (const [g, e] of [...groups.entries()].sort((a, b) => b[1].n - a[1].n)) log(`${String(e.n).padStart(5)}x [${[...e.pages].slice(0, 5).join(',')}${e.pages.size > 5 ? ',+' + (e.pages.size - 5) : ''}] ${g}`);
writeFileSync(outTxt, lines.join('\n'));
console.log('wrote', outTxt, 'tags', tags.length, 'groups', groups.size, 'metaDiffs', nUnexplainedMeta);
await browser.close();
