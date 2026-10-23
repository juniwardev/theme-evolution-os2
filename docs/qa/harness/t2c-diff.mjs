// T2 Coder: A/B diff of the named-element maps written by t2c-dump.mjs (plan C2.10).
// Usage: node t2c-diff.mjs <baseLabel> <headLabel> <dir> [prefixCsv] [pagesCsv] [widthsCsv] [tol=1] [--all]
// Prints every named element whose x, y, w or h moved by more than tol, and every computed-style difference.
import { readFileSync, existsSync } from 'node:fs';
const [baseL, headL, dir, prefArg, pagesArg, widthsArg, tolArg] = process.argv.slice(2);
const prefixes = (prefArg || '').split(',').filter(Boolean);
const pages = (pagesArg || 'p3p,wax,snow,land,home').split(',');
const widths = (widthsArg || '1440,375').split(',');
const tol = Number(tolArg || 1);
// Colors are compared as the sRGB color composited over white (the plan's C_mix), so rgba() and oklab() notations of the same paint compare equal.
const toSrgb = (c) => { const v = Math.max(0, Math.min(1, c)); return 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055); };
const mix = (str) => {
  if (typeof str !== 'string') return null;
  let m = str.match(/^rgba?\(([^)]+)\)$/);
  let rgb, a = 1;
  if (m) { const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); rgb = p.slice(0, 3); if (p.length > 3) a = p[3]; }
  else if ((m = str.match(/^oklab\(([^)]+)\)$/))) {
    const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); const [L, A, B] = p; a = p.length > 3 ? p[3] : 1;
    const l_ = L + 0.3963377774 * A + 0.2158037573 * B, m_ = L - 0.1055613458 * A - 0.0638541728 * B, s_ = L - 0.0894841775 * A - 1.291485548 * B;
    const l = l_ ** 3, mm = m_ ** 3, ss = s_ ** 3;
    rgb = [toSrgb(4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss), toSrgb(-1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss), toSrgb(-0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss)];
  } else return str;
  const out = rgb.map((c) => Math.round(a * c + (1 - a) * 255));
  return out[0] === out[1] && out[1] === out[2] ? `${out[0]}` : out.join(',');
};
const COLORS = new Set(['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor']);
const same = (f, p, q) => (COLORS.has(f) ? (a2 => a2 === mix(q) || (a2 !== null && !isNaN(a2) && !isNaN(mix(q)) && Math.abs(a2 - mix(q)) <= 1))(mix(p)) : p === q);
const ld = (l, p, w) => { const f = `${dir}/${l}-${p}-${w}.json`; return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; };
for (const w of widths) for (const p of pages) {
  const a = ld(baseL, p, w), b = ld(headL, p, w);
  if (!a || !b) continue;
  console.log(`## ${p} ${w}: xPage ${a.overflow.xPage} -> ${b.overflow.xPage}, h1 ${a.h1} -> ${b.h1}`);
  const keys = new Set([...Object.keys(a.named), ...Object.keys(b.named)]);
  for (const k of [...keys].sort()) {
    if (prefixes.length && !prefixes.some((x) => k.startsWith(x))) continue;
    const x = a.named[k], y = b.named[k];
    if (!x || !y) { console.log(`  ${k}: ${x ? 'base only' : 'head only'}`); continue; }
    const geo = ['x', 'y', 'w', 'h'].filter((f) => Math.abs(x[f] - y[f]) > tol).map((f) => `${f} ${x[f]}->${y[f]}`);
    const sty = Object.keys(x).filter((f) => !['x', 'y', 'w', 'h'].includes(f) && !same(f, x[f], y[f])).map((f) => (COLORS.has(f) ? `${f} ${mix(x[f])}->${mix(y[f])}` : `${f} ${x[f]}->${y[f]}`));
    if (geo.length || sty.length) console.log(`  ${k}: ${geo.join(', ')}${geo.length && sty.length ? ' | ' : ''}${sty.join(', ')}`);
  }
}
