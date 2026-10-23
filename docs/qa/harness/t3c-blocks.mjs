// T3 Coder: C3.24 (text and group blocks via the scratch proxy section P). Compares base-P and head-P.
// Usage: node t3c-blocks.mjs <proxyDir>
import { readFileSync } from 'node:fs';
const dir = process.argv[2];
const ld = (l) => JSON.parse(readFileSync(`${dir}/${l}-P.json`, 'utf8'));
const h = ld('head'), b = ld('base');
const out = (ok, id, d) => console.log(ok ? 'PASS' : 'FAIL', 'C3.24', id.padEnd(40), d);
const px = parseFloat;
const texts = (d, k) => d[k].blocks.slice(0, 9).map((x) => x.kids[0]);
const t = texts(h, 'p1440'), tb = texts(b, 'p1440');
const sty = [['text--title', 30, 36], ['text--subtitle', 24, 32], ['text--normal', 16, 24]];
const al = ['left', 'center', 'right'];
t.forEach((e, i) => { const [name, fs, lh] = sty[Math.floor(i / 3)]; const a = al[i % 3];
  out(px(e.fontSize) === fs && px(e.lineHeight) === lh && e.textAlign === a && (name !== 'text--title' || (e.fontFamily.startsWith('Oswald') && e.fontWeight === '700')), `${name}/${a}`, `${e.fontSize} ${e.lineHeight} ${e.fontWeight} ${e.textAlign} ${e.fontFamily.split(',')[0]} (base ${tb[i].fontSize} ${tb[i].lineHeight} ${tb[i].fontFamily.split(',')[0]})`); });
const g = (d) => d.p1440.blocks.slice(9).map((x) => x.kids[0]);
const gh = g(h), gb = g(b);
const exp = [['group--horizontal', { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '100px' }], ['v flex-start/0', { flexDirection: 'column', alignItems: 'flex-start', paddingTop: '0px' }], ['v center/0', { flexDirection: 'column', alignItems: 'center', paddingTop: '0px' }], ['v flex-end/0', { flexDirection: 'column', alignItems: 'flex-end', paddingTop: '0px' }], ['v flex-start/200', { flexDirection: 'column', alignItems: 'flex-start', paddingTop: '200px' }], ['v center/200', { flexDirection: 'column', alignItems: 'center', paddingTop: '200px' }], ['v flex-end/200', { flexDirection: 'column', alignItems: 'flex-end', paddingTop: '200px' }]];
gh.forEach((e, i) => { const [id, want] = exp[i]; const ok = Object.entries(want).every(([k, v]) => e[k] === v) && e.flexWrap === 'nowrap' && e.overflow === 'hidden' && e.w === h.p1440.container;
  const same = ['display', 'flexDirection', 'justifyContent', 'alignItems', 'paddingLeft', 'paddingTop', 'flexWrap', 'overflow'].every((k) => e[k] === gb[i][k]) && e.w === gb[i].w;
  out(ok && same, id, `${e.display} ${e.flexDirection} jc ${e.justifyContent} ai ${e.alignItems} pl ${e.paddingLeft} pt ${e.paddingTop} ${e.flexWrap} ${e.overflow} w ${e.w}; equals base: ${same}`); });
