// T4a Coder: compares two t4ac-dump outputs with the plan's comparison method (section 10): colors as composited sRGB channels (+-1),
// shadows by their non-zero layers, lengths rounded to 0.1 px with +-1 px tolerance on rects.
// Usage: node t4ac-diff.mjs <baseLabel> <headLabel> [images|drawer|cart|spinner|all=all]
import { readFileSync } from 'node:fs';

const [a, b, only = 'all'] = process.argv.slice(2);
const load = (l) => JSON.parse(readFileSync(`docs/qa/evidence/t4ac-dump-${l}.json`, 'utf8'));
const A = load(a), B = load(b);
const num = (v) => (typeof v === 'string' && /^-?[\d.]+px$/.test(v) ? parseFloat(v) : null);
const SKIP = new Set(['x', 'y', 'w', 'h', 'tag', 'right', 'boxShadow', 'shadowLayers']);

function cmpEl(path, ea, eb, out) {
  if (!ea || !eb) { out.push(`${path}: ${ea ? 'only in base' : 'only in head'}`); return; }
  for (const k of ['x', 'y', 'w', 'h']) if (Math.abs((ea[k] ?? 0) - (eb[k] ?? 0)) > 1) out.push(`${path}.${k}: ${ea[k]} -> ${eb[k]}`);
  for (const k of Object.keys(ea)) {
    if (SKIP.has(k) || /Ch$/.test(k) === false && /Color$/.test(k)) continue;
    // A border color is invisible while its width is 0; currentcolor vs a token border color is not a difference.
    const bm = /^border(Top|Bottom)ColorCh$/.exec(k);
    if (bm && ea[`border${bm[1]}Width`] === '0px' && eb[`border${bm[1]}Width`] === '0px') continue;
    if (k === 'minWidth' && ['0px', 'auto'].includes(ea[k]) && ['0px', 'auto'].includes(eb[k])) continue;
    if (/Ch$/.test(k)) { if (ea[k].some((v, i) => Math.abs(v - eb[k][i]) > 1)) out.push(`${path}.${k}: ${ea[k]} -> ${eb[k]}`); continue; }
    const na = num(ea[k]), nb = num(eb[k]);
    if (na !== null && nb !== null) { if (Math.abs(na - nb) > 0.6) out.push(`${path}.${k}: ${ea[k]} -> ${eb[k]}`); continue; }
    if (ea[k] !== eb[k]) out.push(`${path}.${k}: ${ea[k]} -> ${eb[k]}`);
  }
  if (JSON.stringify(ea.shadowLayers) !== JSON.stringify(eb.shadowLayers)) out.push(`${path}.shadow: ${JSON.stringify(ea.shadowLayers)} -> ${JSON.stringify(eb.shadowLayers)}`);
}

if (only === 'all' || only === 'images') {
  const out = [];
  for (const key of Object.keys(A.images)) {
    const ia = A.images[key], ib = B.images[key];
    if (ia.length !== ib.length) out.push(`${key}: count ${ia.length} -> ${ib.length}`);
    ia.forEach((r, i) => {
      const s = ib[i];
      if (!s) return;
      for (const el of ['wrap', 'img']) for (const p of Object.keys(r[el])) if (r[el][p] !== s[el][p]) out.push(`${key}[${i}].${el}.${p}: ${r[el][p]} -> ${s[el][p]}`);
      if (JSON.stringify(r.attrs) !== JSON.stringify(s.attrs)) out.push(`${key}[${i}].attrs ${JSON.stringify(r.attrs)} -> ${JSON.stringify(s.attrs)}`);
    });
    const cls = [...new Set(ib.map((r) => r.wrapperCls))];
    console.log(`images ${key}: ${ia.length} wrappers; head wrapper classes: ${cls.join(' || ')}`);
  }
  console.log('IMAGES DIFFS', out.length); out.slice(0, 30).forEach((l) => console.log('  ' + l));
}

if (only === 'all' || only === 'drawer') {
  for (const key of Object.keys(A.drawer)) for (const st of ['closed', 'open', 'busy']) {
    if (!A.drawer[key][st] || !B.drawer[key][st]) continue;
    const out = [];
    for (const name of new Set([...Object.keys(A.drawer[key][st]), ...Object.keys(B.drawer[key][st])])) cmpEl(name, A.drawer[key][st][name], B.drawer[key][st][name], out);
    console.log(`DRAWER ${key} ${st}: ${out.length} diffs`); out.forEach((l) => console.log('  ' + l));
  }
}

if (only === 'all' || only === 'cart') {
  for (const key of Object.keys(A.cart)) {
    const ma = A.cart[key].m, mb = B.cart[key].m;
    console.log(`CART ${key}: L ${ma.L}->${mb.L} R ${ma.R}->${mb.R} overflow ${A.cart[key].ov.sw - A.cart[key].ov.vw}->${B.cart[key].ov.sw - B.cart[key].ov.vw} offs ${B.cart[key].ov.off.length} h1 ${A.cart[key].h1}->${B.cart[key].h1}`);
  }
}

if (only === 'all' || only === 'spinner') {
  const sa = A.spinner, sb = B.spinner;
  const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  console.log('SPINNER', { classSet: eq(sa.svgCls, sb.svgCls), svgAttrs: eq(sa.svgAttrs, sb.svgAttrs), circleAttrs: eq(sa.circleAttrs, sb.circleAttrs), wrapperCls: sa.wrapperCls === sb.wrapperCls, size: [sa.svg.cw, sb.svg.cw], anim: sb.svg.animationName, posDelta: [Math.abs(sa.svg.x - sb.svg.x), Math.abs(sa.svg.y - sb.svg.y)] });
}
