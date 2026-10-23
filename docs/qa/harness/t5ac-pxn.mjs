// T5a Step 0 item 7b: PXN registration from t5ac-shots' on/off pairs (base build). For every load whose on/off screenshots differ, each diff block is attributed to
// the elements whose border box (grown 8 px vertically, 4 px horizontally) contains it. A block is EXPLAINED if one of those elements (or an ancestor chain element
// below body) has a non-N, non-SZ TOG entry on that page (matched by tag, class prefix and text prefix); otherwise it is RASTER-ONLY and its deepest element is a
// registration candidate. Checks conditions 2-5 (condition 1, repeats, is run separately with loads A,B,C). Output: docs/qa/evidence/t5ac-pxn-<label>.json
// Usage: node t5ac-pxn.mjs <outDir> <togRawDir> [togLabelRegex=^tog-base-] [state=S0]
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { loadGz } from './t5ac-lib.mjs';
import { classOf } from './t5ac-class.mjs';
const [dir, togDir, togRe = '^tog-base-', state = 'S0'] = process.argv.slice(2);
const label = dir.split('/').pop();
// non-N TOG signatures per page key
const sig = new Map(), nOnly = new Map();
for (const f of readdirSync(togDir).filter((f) => new RegExp(togRe).test(f))) {
  const j = JSON.parse(readFileSync(`${togDir}/${f}`, 'utf8')); if (!j.valid) continue;
  const S = sig.get(j.key) || new Set(); sig.set(j.key, S);
  for (const e of j.entries) { const [c] = classOf(e); if (c === 'P' || c === 'A' || c === 'UNEXPLAINED') S.add(`${e.tag}|${e.cls.slice(0, 60)}|${e.t.slice(0, 20)}`); }
}
const metas = readFileSync(`${dir}/meta.jsonl`, 'utf8').trim().split('\n').map(JSON.parse).filter((m) => m.state === state && m.diff && m.diff.diffPixels > 0);
const cands = new Map(); const explained = [], stop = [];
const displaced = [];
for (const m of metas) {
  if (m.diff.sizes[1] !== m.diff.sizes[3]) { displaced.push(`${m.key}@${m.w}:${m.L}`); continue; } // page height changes on/off: layout displacement under an A or P row, judged by C5a.10's offsets, not PXN
  const snap = loadGz(`${dir}/snap-${m.key}-${m.w}-${m.state}-${m.L}.json.gz`);
  const S = sig.get(m.key) || new Set();
  const flagged = (e) => S.has(`${e.k.split('>').pop().match(/^[a-z0-9-]+/)[0]}|${e.c}|${e.t.slice(0, 20)}`);
  for (const b of m.diff.blocks) {
    const hits = snap.els.filter((e) => { const [x, y, ww, hh] = e.r; return ww > 0 && hh > 0 && !/^html:1$|^html:1>body:1$/.test(e.k) && b.x0 >= x - 4 && b.x1 <= x + ww + 4 && b.y0 >= y - 8 && b.y1 <= y + hh + 8; });
    if (!hits.length) { stop.push({ key: m.key, w: m.w, L: m.L, block: b, why: 'no element contains the block' }); continue; }
    hits.sort((a, c) => a.r[2] * a.r[3] - c.r[2] * c.r[3]);
    const deepest = hits[0];
    if (hits.some(flagged)) { explained.push({ key: m.key, w: m.w, L: m.L, max: b.max, by: hits.find(flagged).k.slice(-60) }); continue; }
    // condition 2 (descendants too)
    const [dx, dy, dw, dh] = deepest.r;
    const desc = snap.els.filter((e) => e !== deepest && e.r[2] > 0 && e.r[0] >= dx - 1 && e.r[1] >= dy - 1 && e.r[0] + e.r[2] <= dx + dw + 1 && e.r[1] + e.r[3] <= dy + dh + 1);
    const c2 = !flagged(deepest) && !desc.some(flagged);
    if (!c2) { explained.push({ key: m.key, w: m.w, L: m.L, max: b.max, by: 'descendant with a P/A entry' }); continue; }
    const id = `${m.key}|${deepest.k}`;
    const c = cands.get(id) || { key: m.key, path: deepest.k, cls: deepest.c, text: deepest.t, cond2: c2, where: [], maxAll: 0, repeats: {} };
    c.where.push({ w: m.w, L: m.L, box: [b.x0, b.y0, b.x1, b.y1], max: b.max, n: b.n, rect: deepest.r });
    c.maxAll = Math.max(c.maxAll, b.max); c.repeats[m.w] = (c.repeats[m.w] || 0) + 1;
    cands.set(id, c);
  }
}
const out = { displacedLoads: displaced.length, explainedCount: explained.length, explainedKeys: [...new Set(explained.map((e) => e.key))], stop, candidates: [...cands.values()].map((c) => ({ ...c, cond4: c.where.every((x) => { const [rx, ry, rw, rh] = x.rect; return x.box[0] >= rx - 4 && x.box[2] <= rx + rw + 4 && x.box[1] >= ry - 8 && x.box[3] <= ry + rh + 8; }), cond5: c.maxAll <= 16 })) };
writeFileSync(`docs/qa/evidence/t5ac-pxn-${label}-${state}.json`, JSON.stringify(out, null, 1));
console.log('explained blocks', out.explainedCount, 'on pages', out.explainedKeys.join(','), '| unattributed', stop.length);
for (const c of out.candidates) console.log('CANDIDATE', c.key, c.path.slice(-70), 'cond2', c.cond2, 'cond4', c.cond4, 'cond5(max', c.maxAll + ')', c.cond5, 'widths', Object.keys(c.repeats).join(','));
