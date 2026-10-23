// T5a cross-build comparison (C5a.8 to C5a.10, C5a.18 partly, C5a.26): base capture versus head capture from t5ac-shots (loads A,B for base, A for head).
// Modes: noop (C5a.8: nothing may differ outside NZ) | end (C5a.9/C5a.10: every difference is a Step 0 N or A group, never a P group; real pages keep their geometry and pixels, except PXN).
// Usage: node t5ac-cmp.mjs <mode> <baseDir> <headDir> <tableFile> <pxnFile|-> [state=S0] [keysRegex=.] [out=docs/qa/evidence/t5ac-cmp-<label>.json]
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { chromium, loadGz, diffSnaps } from './t5ac-lib.mjs';
const [mode, baseDir, headDir, tableFile, pxnFile, state = 'S0', keysRe = '.', outArg] = process.argv.slice(2);
const label = headDir.split('/').pop();
const PROXY = new Set(['zoo', 'rt', 'pxea', 'pxap', 'gift']);
// expected-difference table from Step 0: P groups must not differ; N and A groups may.
const cls = new Map();
for (const line of readFileSync(tableFile, 'utf8').split('\n').slice(1)) {
  const m = line.match(/^\d+x \[[^\]]*\] (\w+|) \| (.*?) \| (.*?) \| (\S+)(?: (::\w+))? \| (\S+) \| (.*) -> (.*)$/);
  if (!m) continue;
  const [, c, , , tag, pseudo, prop, on, off] = m;
  cls.set(`${tag}|${pseudo || ''}|${prop}|${on}|${off}`, c);
}
const pxn = pxnFile && pxnFile !== '-' ? JSON.parse(readFileSync(pxnFile, 'utf8')).registered || [] : [];
const normKey = (snap) => { for (const e of snap.els) e.k = e.k.replace(/(#(?:g-recaptcha|h-captcha)-response)-[a-z0-9]+/g, '$1'); return snap; };
const SZ = /^(width|height|inline-size|block-size|top|right|bottom|left|inset-(block|inline)-(start|end)|transform-origin|perspective-origin|grid-template-(rows|columns))$/;
const norm = (s) => String(s).replace(/\?[^\s)'"]*/g, '').slice(0, 200);
const metaOf = (dir) => Object.fromEntries(readFileSync(`${dir}/meta.jsonl`, 'utf8').trim().split('\n').map(JSON.parse).map((m) => [`${m.key}-${m.w}-${m.state}-${m.L}`, m]));
const bm = metaOf(baseDir), hm = metaOf(headDir);
const browser = await chromium.launch(); const page = await browser.newPage(); await page.goto('about:blank');
const pixCmp = (A, B) => page.evaluate(async ([A, B]) => {
  const load = (s) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
  const [a, b] = await Promise.all([load(A), load(B)]);
  if (a.width !== b.width || a.height !== b.height) return { size: [a.width, a.height, b.width, b.height] };
  const g = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
  const da = g(a), db = g(b); const W = a.width; const px = [];
  let n = 0, mx = 0;
  for (let p = 0; p < da.length; p += 4) { const d = Math.max(Math.abs(da[p] - db[p]), Math.abs(da[p + 1] - db[p + 1]), Math.abs(da[p + 2] - db[p + 2])); if (d) { n++; if (d > mx) mx = d; if (px.length < 4000) px.push([(p / 4) % W, Math.floor(p / 4 / W), d]); } }
  return { n, mx, px };
}, [A, B]);
const files = readdirSync(headDir).filter((f) => f.startsWith('snap-') && f.endsWith(`-${state}-A.json.gz`) && new RegExp(keysRe).test(f));
const res = []; let bad = 0;
for (const f of files) {
  const tag = f.replace(/^snap-/, '').replace(/-A\.json\.gz$/, '');
  const [key, w] = tag.split('-');
  if (!existsSync(`${baseDir}/snap-${tag}-A.json.gz`)) { res.push({ tag, error: 'no base snapshot' }); bad++; continue; }
  const bA = normKey(loadGz(`${baseDir}/snap-${tag}-A.json.gz`)), bB = existsSync(`${baseDir}/snap-${tag}-B.json.gz`) ? normKey(loadGz(`${baseDir}/snap-${tag}-B.json.gz`)) : null, hA = normKey(loadGz(`${headDir}/snap-${tag}-A.json.gz`));
  const nz = new Set(); const nzUn = new Set();
  if (bB) { const d = diffSnaps(bA, bB); d.diffs.forEach((x) => nz.add(`${x.k}|${x.pseudo}|${x.prop}`)); d.only1.concat(d.only2).forEach((k) => nzUn.add(k)); }
  const d = diffSnaps(bA, hA);
  const unpaired = d.only1.concat(d.only2).filter((k) => !nzUn.has(k));
  const tagOf = (k) => k.split('>').pop().match(/^[a-z0-9-]+/)[0];
  const out = { tag, paired: d.paired, unpaired, nDiffs: d.diffs.length, bad: [] };
  let rootExplained = 0; const szs = [];
  for (const x of d.diffs) {
    if (nz.has(`${x.k}|${x.pseudo}|${x.prop}`)) continue;
    if (mode === 'noop') { out.bad.push(`${x.k.slice(-50)} ${x.pseudo}${x.prop}: ${x.a} -> ${x.b}`); continue; }
    if (SZ.test(x.prop)) { szs.push(x); continue; }
    const c = cls.get(`${tagOf(x.k)}|${x.pseudo}|${x.prop}|${x.a}|${x.b}`);
    if (c === 'N' || c === 'A') rootExplained++;
    else out.bad.push(`${c === 'P' ? 'P-RULE-MISSING ' : 'UNEXPLAINED '}${x.k.slice(-50)} ${x.pseudo}${x.prop}: ${x.a} -> ${x.b}`);
  }
  if (mode === 'end' && szs.length && rootExplained === 0 && !PROXY.has(key)) out.bad.push(`${szs.length} size-derived differences without a root cause (e.g. ${szs[0].k.slice(-40)} ${szs[0].prop}: ${szs[0].a} -> ${szs[0].b})`);
  // geometry (C5a.10): rects equal +-1 on real pages
  let moved = 0, maxMove = 0;
  const hm2 = new Map(hA.els.map((e) => [e.k, e])), bm2 = bB ? new Map(bB.els.map((e) => [e.k, e])) : new Map();
  for (const e of bA.els) { const o = hm2.get(e.k); if (!o) continue; const dm = Math.max(...e.r.map((v, i) => Math.abs(v - o.r[i]))); if (dm > 1) { const nb = bm2.get(e.k); if (nb && Math.max(...e.r.map((v, i) => Math.abs(v - nb.r[i]))) > 1) continue; /* base-versus-base rect noise (animation) */ moved++; maxMove = Math.max(maxMove, dm); } }
  out.moved = moved; out.maxMove = maxMove;
  if (!PROXY.has(key) && moved) out.bad.push(`${moved} elements moved (max ${maxMove}px)`);
  // pixels
  const bp = `${baseDir}/on-${tag}-A.png`, hp = `${headDir}/on-${tag}-A.png`;
  if (existsSync(bp) && existsSync(hp)) {
    const r = await pixCmp(readFileSync(bp).toString('base64'), readFileSync(hp).toString('base64'));
    out.pixel = r.size ? { size: r.size } : { n: r.n, mx: r.mx };
    if (!PROXY.has(key)) {
      if (r.size) out.bad.push('page size differs ' + r.size.join('x'));
      else if (r.n) {
        const boxes = pxn.filter((p) => p.key === key && p.widths.includes(Number(w))).map((p) => p.boxes[w] || p.box);
        const outside = r.px.filter(([x, y]) => !boxes.some((b) => b && x >= b[0] - 4 && x <= b[2] + 4 && y >= b[1] - 8 && y <= b[3] + 8));
        const over = r.px.filter(([x, y, d]) => d > 16);
        if (outside.length || over.length || r.px.length < r.n) out.bad.push(`pixels differ: ${r.n} px, max ${r.mx}, ${outside.length} outside registered PXN boxes, ${over.length} above 16`);
      }
    }
  }
  // console (C5a.26)
  const bl = new Set([...(bm[`${tag}-A`]?.logs || []), ...(bm[`${tag}-B`]?.logs || [])].map(norm));
  const newErr = (hm[`${tag}-A`]?.logs || []).map(norm).filter((l) => !bl.has(l) && !/Monorail|exporting metrics|shop_events_listener/i.test(l));
  if (newErr.length) out.bad.push('new console errors: ' + newErr.join(' | ').slice(0, 200));
  if (unpaired.length) out.bad.push(`unpaired elements: ${unpaired.slice(0, 3).join(', ')}`);
  if (out.bad.length) bad++;
  res.push(out);
}
writeFileSync(outArg || `docs/qa/evidence/t5ac-cmp-${mode}-${label}-${state}.json`, JSON.stringify(res));
console.log(`${mode} ${label} ${state}: compared ${res.length}, with problems ${bad}`);
for (const r of res.filter((x) => x.bad?.length || x.error).slice(0, 40)) console.log(' ', r.tag, (r.bad || [r.error]).slice(0, 4).join(' || ').slice(0, 330));
await browser.close();
