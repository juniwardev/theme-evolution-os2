// Compares head vs base evidence for A1-A7, A9 (reads docs/qa/evidence/t5bps-*.json).
import { readFileSync } from 'node:fs';
const J = (f) => JSON.parse(readFileSync(`docs/qa/evidence/t5bps-${f}.json`, 'utf8'));
const hp = J('head-policy'), ho = J('head-optout'), bp = J('base-policy'), hd = J('head-deep'), bd = J('base-deep');
const near = (a, b, t = 1) => Math.abs(a - b) <= t;
const rows = [];
for (const p of hp) {
  const o = ho.find((x) => x.w === p.w);
  const exp = p.w < 768 ? 40 : 64;
  rows.push({ w: p.w, theme: p.theme,
    A1: near(p.G_top, exp) && near(p.G_top, o.G_top) && p.PT === exp && p.PB === exp,
    A2: near(p.C_L, o.C_L) && near(p.C_R, o.C_R) && near(p.T_L, p.C_L) && near(p.T_R, p.C_R) && p.contPad === '0px/0px',
    A3: near(p.G_bot, p.PB) && near(p.W_gap, bp.find((x) => x.w === p.w).W_gap),
    A4: near(p.C_w, o.C_w) && (p.w >= 768 || near(p.C_w, p.w - 104)),
    A7: p.X_page === 0, A6h1: p.H1 === 1,
    nums: { G_top: p.G_top, optG_top: o.G_top, C_L: p.C_L, C_R: p.C_R, C_w: p.C_w, T_L: p.T_L, T_R: p.T_R, PB: p.PB, G_bot: p.G_bot, optG_bot: o.G_bot, optPB: o.PB, X: p.X_page } });
}
console.log(JSON.stringify(rows, null, 0).replace(/\},\{/g, '},\n{'));
for (const d of hd) {
  const b = bd.find((x) => x.w === d.w);
  const tcOk = d.TCmb.every((m) => m === '0px');
  let A5 = null;
  if (b) {
    let n = 0, diff = [];
    for (const [k, v] of Object.entries(b.margins)) { if (v.inTC) continue; n++; const h = d.margins[k]; if (!h || h.mb !== v.mb || h.mt !== v.mt) diff.push(k); }
    A5 = { compared: n, diff: diff.length, witnesses: b.witnesses };
  }
  console.log('deep', d.w, 'TCall0', tcOk, 'A5', JSON.stringify(A5), 'ul', d.ul.length, d.ul.every((u) => u.lst === 'disc' && parseFloat(u.pis) > 0), 'a', d.aa.length, d.aa.every((x) => x === 'underline'));
}
