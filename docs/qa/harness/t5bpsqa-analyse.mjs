// Summarises t5bpsqa-{head,stg}-spacing.json (and others) into a table + A5 diff.
import { readFileSync, existsSync } from 'node:fs';
const ld = (n) => (existsSync(`docs/qa/evidence/${n}.json`) ? JSON.parse(readFileSync(`docs/qa/evidence/${n}.json`, 'utf8')) : null);
const head = ld('t5bpsqa-head-spacing'), stg = ld('t5bpsqa-stg-spacing');
const f = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
for (const w of [320, 375, 768, 1024, 1440]) {
  for (const [lab, d] of [['stg', stg], ['head', head]]) {
    const p = d[`policy|${w}`], o = d[`optout|${w}`], c = d[`contact|${w}`];
    console.log(w, lab, 'theme', p.theme, 'policy', JSON.stringify(['Gtop', f(p.G_top), 'CL', f(p.C_L), 'CR', f(p.C_R), 'Cw', f(p.C_w), 'TL', f(p.T_L), 'TR', f(p.T_R), 'PT', p.PT, 'PB', p.PB, 'Gbot', f(p.G_bot), 'Wgap', f(p.W_gap), 'X', p.X_page, 'H1', p.H1]));
    console.log('      optout', JSON.stringify(['Gtop', f(o.G_top), 'CL', f(o.C_L), 'CR', f(o.C_R), 'Cw', f(o.C_w), 'PB', o.PB, 'Gbot', f(o.G_bot), 'X', o.X_page, 'last', o.lastTextEl]), 'contact Gtop', f(c.G_top), 'H1', c.H1, 'footer', f(c.footerTop));
  }
}
for (const w of [320, 375, 1440]) {
  const h = head[`policy|${w}`];
  console.log(w, 'container', JSON.stringify(h.container), 'TC', JSON.stringify(h.TC), 'uls', h.uls, h.ulBad, 'as', h.as, h.aBad, 'widestLi', f(h.widestLiMin), 'liOW', h.liOW, 'boxA', JSON.stringify(h.boxA));
}
for (const w of [375, 1440]) {
  const a = stg[`policy|${w}`].margins, b = head[`policy|${w}`].margins;
  // TC differs between builds only in margin values; paths outside TC must match
  let n = 0, diff = 0, wit = 0;
  for (const k of Object.keys(a)) { if (!(k in b)) { diff++; continue; } n++; if (a[k][0] !== b[k][0] || a[k][1] !== b[k][1]) diff++; if (a[k][2] && a[k][1] !== '0px') wit++; }
  console.log('A5', w, 'compared', n, 'differences', diff, 'witnesses', wit, 'keysA', Object.keys(a).length, 'keysB', Object.keys(b).length);
}
