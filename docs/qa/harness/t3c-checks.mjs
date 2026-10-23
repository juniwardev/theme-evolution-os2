// T3 Coder: static-ish checks on dumps: C3.17, C3.18, C3.19, C3.20, C3.21 (home half), C3.22 (cards), C3.13 (1920).
// Usage: node t3c-checks.mjs <dumpDir>
import { readFileSync, existsSync } from 'node:fs';
const dir = process.argv[2];
const ld = (l, p, w) => { const f = `${dir}/${l}-${p}-${w}.json`; return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null; };
const px = parseFloat; const near = (a, b, t = 1) => Math.abs(a - b) <= t;
const out = (c, ok, d) => console.log(ok ? 'PASS' : 'FAIL', c.padEnd(8), d);
for (const p of ['home', 'land']) { const d = ld('head', p, 1440); if (!d) continue; out('C3.17', d.m.h1 === 1, `${p}: h1 ${d.m.h1}; headings ${d.m.headings.join(',')}`); }
{ const d = ld('head', 'home', 1440); const hs = d.m.headings; let ok = hs[0] === 'h1'; for (let i = 1; i < hs.length; i++) if (Number(hs[i][1]) - Number(hs[i - 1][1]) > 1) ok = false; out('C3.17', ok && hs.join(',') === 'h1,h2,h2,h2,h2', `home sequence ${hs.join(',')}`); }
{ const h = ld('head', 'home', 1440).m, b = ld('base', 'home', 1440).m;
  out('C3.18', h.helloH1Text === 'Hello, world!' && [0, 1, 2].map((i) => h.named[`hello.card${i}.titleText`]).join('|') === 'Key concepts|Liquid|Best practices', `h1 "${h.helloH1Text}"; titles ${[0, 1, 2].map((i) => h.named[`hello.card${i}.titleText`]).join('|')}`);
  out('C3.18', [0, 1, 2].every((i) => JSON.stringify([...h.named[`hello.card${i}.linkAttrs`]].sort()) === JSON.stringify([...b.named[`hello.card${i}.linkAttrs`]].sort())), `link attrs head ${JSON.stringify(h.named['hello.card0.linkAttrs'])} base ${JSON.stringify(b.named['hello.card0.linkAttrs'])}`);
  out('C3.21', JSON.stringify(h.helloImgAttrs) === JSON.stringify({ alt: '', width: '300', height: '300' }), `hello img ${JSON.stringify(h.helloImgAttrs)}`);
  const i0 = h.named['ban.media0.imgAttrs'], i1 = h.named['ban.media1.imgAttrs'];
  out('C3.21', [i0, i1].every((i) => i.fp === 'auto' && i.w && i.h), `banner imgs ${JSON.stringify([i0, i1])}`); }
for (const [w, a, b] of [[375, 30, 30], [1440, 36, 40]]) {
  const m = ld('head', 'home', w).m; const h1 = m.named['hello.h1'], bh = m.named['ban.block0'];
  out('C3.19', h1.fontFamily.startsWith('Oswald') && h1.fontWeight === '700' && h1.textTransform === 'uppercase' && near(px(h1.fontSize), a, 0.5) && bh.fontFamily.startsWith('Oswald') && near(px(bh.fontSize), b, 0.5), `@${w}: h1 ${h1.fontFamily.split(',')[0]} ${h1.fontWeight} ${h1.textTransform} ${h1.fontSize}; banner heading ${bh.fontFamily.split(',')[0]} ${bh.fontSize}`);
}
{ const m = ld('head', 'home', 1440).m; const b0 = m.named['ban.btn0'], b1 = m.named['ban.btn1'];
  out('C3.20', m.named['ban.btn0.cls'].split(' ').includes('btn-secondary') && b0.backgroundColor === 'rgba(0, 0, 0, 0)' && b0.borderTopWidth === '1px' && m.named['ban.btn1.cls'].split(' ').includes('btn-primary') && b1.backgroundColor === m.accentVar, `btn0 ${m.named['ban.btn0.cls']} bg ${b0.backgroundColor}; btn1 ${m.named['ban.btn1.cls']} bg ${b1.backgroundColor} accent ${m.accentVar}`);
  out('C3.20', [0, 1].every((i) => { const a = m.named[`ban.btn${i}.attrs`]; const e = m.named[`ban.btn${i}`]; return a.includes('role=link') && a.includes('aria-disabled=true') && !a.some((x) => x.startsWith('href')) && e.opacity === '0.6' && e.h >= 48 && e.fontFamily.startsWith('Oswald'); }), `attrs ${JSON.stringify(m.named['ban.btn0.attrs'])}; opacity ${b0.opacity}/${b1.opacity}; h ${b0.h}/${b1.h}`); }
for (const [w, n] of [[1023, 1], [1024, 3]]) { const d = ld('head', 'home', w); if (!d) continue; const c = d.m.named['hello.cards'].gridTemplateColumns.split(' ').length; out('C3.22', c === n, `hello cards @${w}: ${c} columns`); }
{ const d = ld('head', 'home', 1920); if (d) { const m = d.m, n = m.named; out('C3.13', near(n['hello.h1'].x, m.L) && near(n['hello.card0'].x, m.L) && near(n['hello.illus'].right, m.R) && near(n['hello.card2'].right, m.R) && near(n['ban.root'].x, 0, .5) && near(n['ban.root'].right, 1920, .5), `1920: L ${m.L} R ${m.R}; h1 ${n['hello.h1'].x}; card0 ${n['hello.card0'].x}; illus right ${n['hello.illus'].right}; last card right ${n['hello.card2'].right}; banner ${n['ban.root'].x}..${n['ban.root'].right}`); } }
for (const p of ['home', 'land']) for (const w of [320, 375, 390, 430, 767, 768, 1024, 1440, 1920]) { const d = ld('head', p, w); if (!d) continue; const bad = d.xPage !== 0 || d.offs.length || (d.xbtn && (d.xbtn.maxRight > 0 || d.xbtn.minLeft < 0)); out('C3.5', !bad, `${p}@${w}: xPage ${d.xPage}; offs ${d.offs.length}; xbtn ${JSON.stringify(d.xbtn)}`); }
for (const p of ['home', 'land']) for (const w of [320, 375, 390, 430]) { const b = ld('base', p, w); if (b) console.log('  (base xPage', p, w, b.xPage + ')'); }
