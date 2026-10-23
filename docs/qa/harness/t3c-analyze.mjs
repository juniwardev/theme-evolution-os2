// T3 Coder: evaluates the proxy-matrix criteria from base-*.json and head-*.json (written by t3c-proxy.mjs).
// Usage: node t3c-analyze.mjs <proxyDir> [criteriaCsv=all]
import { readFileSync, existsSync } from 'node:fs';

const dir = process.argv[2];
const only = (process.argv[3] || 'all').split(',');
const want = (c) => only.includes('all') || only.includes(c);
const load = (label, id) => { const p = `${dir}/${label}-${id}.json`; return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null; };
const px = (v) => parseFloat(v);
const near = (a, b, t = 1) => Math.abs(a - b) <= t;
const rows = [];
const rec = (c, id, ok, detail) => { rows.push({ c, id, ok, detail }); };
const N = (d, w, k) => d && d.widths[w] && d.widths[w].m.named[k];
const M = (d, w) => d.widths[w].m;

const VARS = ['B0', 'V1-adapt', 'V1-small', 'V1-medium', 'V1-large-single', 'V2-ambient', 'V2-fixed', 'V2-zoom-in', 'V3-top-left', 'V3-top-center', 'V3-top-right', 'V3-middle-left', 'V3-middle-center', 'V3-middle-right', 'V3-bottom-left', 'V3-bottom-center', 'V3-bottom-right',
  'V4-left', 'V4-right', 'V5', 'V6', 'V7-left', 'V7-right', 'V8', 'V9-50', 'V9-100', 'V10-h2', 'V10-h0', 'V10-hxl', 'V10-hxxl', 'V11-body', 'V11-subtitle', 'V11-caption-with-letter-spacing', 'V12-swap', 'V12-links', 'V12-label2blank', 'V13-img2only', 'V13-noimg', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'P'];
const H = {}; const B = {};
for (const v of VARS) { H[v] = load('head', v); B[v] = load('base', v); }
const r1 = 1.5; // 4096 / 2731

// C3.5: overflow
if (want('C3.5')) {
  const bad = [];
  for (const v of VARS) { const d = H[v]; if (!d) continue; for (const w of Object.keys(d.widths)) { const x = d.widths[w]; const bl = M(d, w).btnLefts || []; const mr = bl.length ? Math.max(...bl.map((b) => b[1])) - Number(w) : -1; const ml = bl.length ? Math.min(...bl.map((b) => b[0])) : 0; /* the ambient image is transformed (scale 1.2, orbit) and clipped by its media's overflow-hidden; base reports the same img */ const offs = v === 'V2-ambient' ? x.offs.filter((o) => o.tag !== 'img') : x.offs; if (x.xPage !== 0 || offs.length || mr > 0 || ml < 0) bad.push(`${v}@${w}: xPage ${x.xPage} offs ${x.offs.length} btnRight ${mr} btnLeft ${ml}`); } }
  rec('C3.5(proxy)', 'all variants x 320..1440', bad.length === 0, bad.slice(0, 8).join('; ') || 'xPage 0, no offenders, buttons inside viewport');
}
// C3.6: buttons inside box content box
if (want('C3.6')) {
  const bad = []; let n = 0;
  for (const v of VARS) { const d = H[v]; if (!d) continue; for (const w of [320, 375, 768, 1440]) { const m = M(d, w); const box = m.named['ban.box']; if (!box) continue; const l = box.x + px(box.paddingLeft), r = box.right - px(box.paddingRight); for (const k of ['ban.btn0', 'ban.btn1']) { const b = m.named[k]; if (!b) continue; n++; if (b.x < l - 0.5 || b.right > r + 0.5) bad.push(`${v}@${w} ${k} [${b.x},${b.right}] vs box content [${l},${r}]`); } } }
  rec('C3.6', `${n} buttons`, bad.length === 0, bad.slice(0, 8).join('; ') || 'all within box content box +-0.5');
}
// C3.13
if (want('C3.13')) {
  const out = [];
  for (const [v, ws] of [['B0', [320, 375, 767, 768, 1024, 1440]]]) {
    const d = H[v]; for (const w of ws) {
      const m = M(d, w); const L = m.L, R = m.vw - m.L; const n = m.named; /* R: E_R = w - E_L; the rendered cart icon right is recorded in the detail (header overflows E_R at <= 390, pre-existing) */
      const chk = { h1: n['hello.h1'].x, p0: n['hello.p0'].x, card0: n['hello.card0'].x, illusR: n['hello.illus'].right, lastCardR: n['hello.card2'].right, bandL: n['hello.band'].x, bandR: n['hello.band'].right, banL: n['ban.root'].x, banR: n['ban.root'].right };
      const ok = near(chk.h1, L) && near(chk.p0, L) && near(chk.card0, L) && near(chk.illusR, R) && near(chk.lastCardR, R) && near(chk.bandL, 0, 0.5) && near(chk.bandR, w, 0.5) && near(chk.banL, 0, 0.5) && near(chk.banR, w, 0.5);
      out.push([`B0@${w}`, ok, `L ${L} E_R ${R} (header cart right ${m.R}) ${JSON.stringify(chk)}`]);
      if (w <= 375) { const bc = d.widths[w].m.boxContent; out.push([`B0@${w} box content`, near(bc.left, L) && near(bc.right, R), `box content [${bc.left},${bc.right}] vs [${L},${R}]`]); }
    }
  }
  for (const [v, side] of [['V3-top-left', 'left'], ['V3-bottom-right', 'right']]) for (const w of [768, 1024, 1440]) { const d = H[v]; const m = M(d, w); const bc = m.boxContent; out.push([`${v}@${w}`, side === 'left' ? near(bc.left, m.L) : near(bc.right, m.R), `box content [${bc.left},${bc.right}] L ${m.L} R ${m.R}`]); }
  for (const o of out) rec('C3.13', o[0], o[1], o[2]);
}
// C3.14: K_q1
if (want('C3.14')) {
  const ratio = (a, b, k) => `${a}->${b}`;
  const chk = [];
  for (const [v, k] of [['V1-small', 'minHeight'], ['V1-medium', 'minHeight'], ['B0', 'minHeight']]) { const b = px(N(B[v], 1440, 'ban.root')[k]), h = px(N(H[v], 1440, 'ban.root')[k]); chk.push([`${v} root min-height@1440`, near(h, b * 0.625, 0.5), `${b} -> ${h}`]); }
  { const b = N(B['V1-adapt'], 1440, 'ban.root').minHeight, h = N(H['V1-adapt'], 1440, 'ban.root').minHeight; chk.push(['V1-adapt root min-height@1440', b === h, `${b} -> ${h}`]); }
  for (const v of ['V1-small', 'V1-medium', 'B0']) { const b = px(N(B[v], 375, 'ban.content').minHeight), h = px(N(H[v], 375, 'ban.content').minHeight); chk.push([`${v} content min-height@375`, near(h, b * 0.625, 0.5), `${b} -> ${h}`]); }
  { const b = px(N(B['V8'], 375, 'ban.media0').height), h = px(N(H['V8'], 375, 'ban.media0').height); chk.push(['V8 media height@375', near(h, b * 0.625, 0.5), `${b} -> ${h}`]); }
  const g = (d, k) => N(d, 1440, k);
  chk.push(['B0 content padding-top@1440 (80->50)', px(g(B.B0, 'ban.content').paddingTop) === 80 && px(g(H.B0, 'ban.content').paddingTop) === 50, `${g(B.B0, 'ban.content').paddingTop} -> ${g(H.B0, 'ban.content').paddingTop}`]);
  chk.push(['B0 box padding-top (64->40)', px(g(B.B0, 'ban.box').paddingTop) === 64 && px(g(H.B0, 'ban.box').paddingTop) === 40, `${g(B.B0, 'ban.box').paddingTop} -> ${g(H.B0, 'ban.box').paddingTop}`]);
  chk.push(['B0 buttons column-gap (16->10)', px(g(B.B0, 'ban.block1.buttons').columnGap) === 16 && px(g(H.B0, 'ban.block1.buttons').columnGap) === 10, `${g(B.B0, 'ban.block1.buttons').columnGap} -> ${g(H.B0, 'ban.block1.buttons').columnGap}`]);
  chk.push(['B0 box min-width (720->450)', px(g(B.B0, 'ban.box').minWidth) === 720 && px(g(H.B0, 'ban.box').minWidth) === 450, `${g(B.B0, 'ban.box').minWidth} -> ${g(H.B0, 'ban.box').minWidth}`]);
  chk.push(['B0 box max-width (1424->890)', px(g(B.B0, 'ban.box').maxWidth) === 1424 && px(g(H.B0, 'ban.box').maxWidth) === 890, `${g(B.B0, 'ban.box').maxWidth} -> ${g(H.B0, 'ban.box').maxWidth}`]);
  for (const c of chk) rec('C3.14', c[0], c[1], c[2]);
}

// C3.15: every option applies (head only)
if (want('C3.15')) {
  const C = (id, ok, detail) => rec('C3.15', id, ok, detail);
  const named = (v, w, k) => N(H[v], w, k);
  // adapt
  { const root = named('V1-adapt', 1440, 'ban.root'); const pb = px(root['::before'].paddingBottom); C('adapt root ::before@1440', near(pb, root.w / r1, 1), `padding-bottom ${pb} vs ${Math.round(root.w / r1 * 10) / 10}`);
    const root375 = named('V1-adapt', 375, 'ban.root'); const cn = named('V1-adapt', 375, 'ban.content'); const cpb = px(cn['::before'].paddingBottom); C('adapt content ::before@375', near(cpb, root375.w / r1, 1) && root375.h >= cpb - 1, `content ::before ${cpb} vs ${Math.round(root375.w / r1 * 10) / 10}; root h ${root375.h}`); }
  // positions
  { const POS = ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];
    for (const p of POS) { const v = p === 'bottom-center' ? 'B0' : 'V3-' + p; const d = H[v]; const m = M(d, 1440); const box = m.named['ban.box'], cn = m.named['ban.content'];
      const [vert, horiz] = p.split('-'); let vok;
      if (vert === 'top') vok = near(box.y, cn.y + 50); else if (vert === 'middle') vok = near(box.y + box.h / 2, cn.y + cn.h / 2); else vok = near(box.y + box.h, cn.y + cn.h - 50);
      let hok; if (horiz === 'left') hok = near(box.x, m.L); else if (horiz === 'right') hok = near(box.right, m.R); else hok = near(box.x + box.w / 2, 720);
      C('position ' + p, vok && hok, `box y ${box.y} h ${box.h} content y ${cn.y} h ${cn.h}; box x ${box.x}..${box.right} L ${m.L} R ${m.R}`); } }
  for (const [v, a] of [['V4-left', 'left'], ['V4-right', 'right'], ['B0', 'center']]) { const t = named(v, 1440, 'ban.box').textAlign; C('desktop alignment ' + a, t === a, t); }
  for (const [v, a] of [['V7-left', 'left'], ['V7-right', 'right'], ['B0', 'center']]) { const t = named(v, 375, 'ban.box').textAlign; const jc = named(v, 375, 'ban.block1.buttons').justifyContent; C('mobile alignment ' + a, t === a && (a !== 'right' || jc === 'flex-end'), `text-align ${t}; buttons justify ${jc}`); }
  // show_text_box
  { const m = M(H.V5, 1440); const box = m.named['ban.box']; C('V5 box bg@1440', box.backgroundColor === m.bgVar && px(box.paddingLeft) === 35, `bg ${box.backgroundColor} vs ${m.bgVar}; padding-left ${box.paddingLeft}`);
    const m1024 = M(H.V5, 1024); C('V5 max-width@1024/1440', m1024.named['ban.box'].maxWidth === '710px' && box.maxWidth === '900px', `${m1024.named['ban.box'].maxWidth} / ${box.maxWidth}`);
    const b0 = M(H.B0, 1440).named['ban.box']; C('B0 box transparent/0', b0.backgroundColor === 'rgba(0, 0, 0, 0)' && px(b0.paddingLeft) === 0, `${b0.backgroundColor}; padding-left ${b0.paddingLeft}`); }
  // stack
  { const m = M(H.V6, 375); const a = m.named['ban.media0'], b = m.named['ban.media1'], r = m.named['ban.root']; C('V6 stacked@375', b.y >= a.y + a.h - 1 && near(a.w, r.w, 0.5) && near(b.w, r.w, 0.5), `media0 y ${a.y} h ${a.h} w ${a.w}; media1 y ${b.y} w ${b.w}; root w ${r.w}`);
    const m0 = M(H.B0, 1440); C('B0 two images half', near(m0.named['ban.media1'].x, m0.named['ban.root'].w / 2, 1), `media1 x ${m0.named['ban.media1'].x}`); }
  // below
  { const m = M(H.V8, 375); const md = m.named['ban.media0'], cn = m.named['ban.content'], r = m.named['ban.root']; C('V8 below@375', cn.y >= md.y + md.h - 1 && r['::after'].display === 'none', `content y ${cn.y}; media bottom ${md.y + md.h}; root ::after ${r['::after'].display}`); }
  // overlay
  for (const [v, o] of [['B0', 0], ['V9-50', 0.5], ['V9-100', 1]]) { const op = parseFloat(N(H[v], 1440, 'ban.root')['::after'].opacity); C('overlay ' + o, near(op, o, 0.001), String(op)); }
  // heading sizes
  for (const [v, a, b] of [['V10-h2', 20, 24], ['B0', 30, 40], ['V10-h0', 40, 52], ['V10-hxl', 50, 62], ['V10-hxxl', 56, 72]]) { const f1 = px(N(H[v], 375, 'ban.block0').fontSize), f2 = px(N(H[v], 1440, 'ban.block0').fontSize); C('heading_size ' + v, near(f1, a, 0.5) && near(f2, b, 0.5), `${f1}/${f2} expect ${a}/${b}`); }
  // text styles
  for (const [v, fs, ls, up] of [['V11-body', 16, 0, false], ['V11-subtitle', 18, 0.6, false], ['V11-caption-with-letter-spacing', 10, 1.3, true]]) { const t = N(H[v], 1440, 'ban.block1'); C('text_style ' + v, near(px(t.fontSize), fs, 0.1) && near(px(t.letterSpacing) || 0, ls, 0.05) && (t.textTransform === 'uppercase') === up, `${t.fontSize} ls ${t.letterSpacing} tt ${t.textTransform}`); }
  // button styles
  { const m = M(H.B0, 1440); const b0 = m.named['ban.btn0'], b1 = m.named['ban.btn1']; C('B0 buttons', b0.cls === undefined, ''); rows.pop();
    C('B0 btn0 secondary, btn1 primary', m.named['ban.btn0.cls'].includes('btn-secondary') && b0.backgroundColor === 'rgba(0, 0, 0, 0)' && b0.borderTopWidth === '1px' && m.named['ban.btn1.cls'].includes('btn-primary') && b1.backgroundColor === m.accentVar, `btn0 ${m.named['ban.btn0.cls']} bg ${b0.backgroundColor}; btn1 ${m.named['ban.btn1.cls']} bg ${b1.backgroundColor} accent ${m.accentVar}`);
    const s = M(H['V12-swap'], 1440); C('V12 swap', s.named['ban.btn0.cls'].includes('btn-primary') && s.named['ban.btn1.cls'].includes('btn-secondary') && s.named['ban.btn0'].backgroundColor === s.accentVar && s.named['ban.btn1'].backgroundColor === 'rgba(0, 0, 0, 0)', `${s.named['ban.btn0.cls']} / ${s.named['ban.btn1.cls']}`);
    const l = M(H['V12-links'], 1440); const at = [l.named['ban.btn0.attrs'], l.named['ban.btn1.attrs']]; C('V12 links', at.every((a) => a.some((x) => x.startsWith('href=')) && !a.some((x) => x.startsWith('aria-disabled'))) && l.named['ban.btn0'].opacity === '1', JSON.stringify(at) + ` opacity ${l.named['ban.btn0'].opacity}`);
    const e = M(H['V12-label2blank'], 1440); C('V12 label2 blank', !!e.named['ban.btn0'] && !e.named['ban.btn1'], `btn0 ${!!e.named['ban.btn0']} btn1 ${!!e.named['ban.btn1']}`); }
  // two centred buttons
  for (const [w, mode] of [[375, 'column'], [430, 'column'], [767, 'row']]) { const m = M(H.B0, w); const a = m.named['ban.btn0'], b = m.named['ban.btn1'], wr = m.named['ban.block1.buttons'];
    if (mode === 'column') C(`two buttons@${w}`, b.y >= a.y + a.h - 0.5 && near(a.w, wr.w, 1) && near(b.w, wr.w, 1), `btn0 w ${a.w} btn1 w ${b.w} wrapper w ${wr.w}; btn1.y ${b.y} btn0 bottom ${a.y + a.h}`);
    else C(`two buttons@${w}`, near(a.y, b.y, 0.5) && near(a.w, 220, 1) && near(b.w, 220, 1), `btn widths ${a.w}/${b.w}; y ${a.y}/${b.y}`); }
  // images
  { const m = M(H['V13-img2only'], 1440); const md = m.named['ban.media0'], r = m.named['ban.root']; C('V13 image_2 only', !m.named['ban.media1'] && near(md.w, r.w, 1) && md.tag === 'div', `media0 w ${md.w} root w ${r.w}; media1 ${!!m.named['ban.media1']}`);
    const n = M(H['V13-noimg'], 1440); const mi = n.named['ban.media0.img'], mm = n.named['ban.media0']; C('V13 placeholder', mi && mi.tag === 'svg' && near(mi.w, mm.w, 1) && near(mi.h, mm.h, 1), `svg ${mi && mi.w}x${mi && mi.h} media ${mm.w}x${mm.h}`); }
}
// C3.16: image behaviours
if (want('C3.16')) {
  const C = (id, ok, detail) => rec('C3.16', id, ok, detail);
  for (const v of ['B0', 'V2-ambient', 'V2-fixed', 'V2-zoom-in']) { const d = H[v]; const m = M(d, 1440); const i0 = m.named['ban.media0.img'], i1 = m.named['ban.media1.img']; const rd = d.reduce1440.named['ban.media0.img'];
    if (v === 'B0' || v === 'V2-ambient') C(v, i0.position === 'absolute' && (v === 'B0' ? i0.animationName === 'none' : i0.animationName === 'theme-banner-ambient' && rd.animationName === 'none'), `position ${i0.position}; anim ${i0.animationName}; reduced ${rd.animationName}`);
    else C(v, i0.position === 'fixed' && near(i0.h, 900, 1) && M(d, 1440).named['ban.media0'].clipPath === 'inset(0px)' && near(i1.x, 720, 1), `position ${i0.position}; h ${i0.h}; clip ${m.named['ban.media0'].clipPath}; img2 x ${i1.x}`); }
}
// C3.22: breakpoint mapping
if (want('C3.22')) {
  const C = (id, ok, detail) => rec('C3.22', id, ok, detail);
  C('V6 root flex-direction 767/768', N(H.V6, 767, 'ban.root').flexDirection === 'column' && N(H.V6, 768, 'ban.root').flexDirection === 'row', `${N(H.V6, 767, 'ban.root').flexDirection} / ${N(H.V6, 768, 'ban.root').flexDirection}`);
  C('B0 content padding-top 767/768', px(N(H.B0, 767, 'ban.content').paddingTop) === 0 && px(N(H.B0, 768, 'ban.content').paddingTop) === 50, `${N(H.B0, 767, 'ban.content').paddingTop} / ${N(H.B0, 768, 'ban.content').paddingTop}`);
}
// C3.27: combination variants
if (want('C3.27')) {
  const C = (id, ok, detail) => rec('C3.27', id, ok, detail);
  const els = (d) => ['ban.media0', 'ban.media1', 'ban.content'].map((k) => [k, N(d, 375, k)]).filter((e) => e[1]);
  for (const v of ['C1', 'C2', 'C3', 'C4', 'V6', 'V8']) {
    const b = B[v], h = H[v]; const bo = els(b).sort((x, y) => x[1].y - y[1].y || x[0].localeCompare(y[0])).map((e) => e[0]).join('>'), ho = els(h).sort((x, y) => x[1].y - y[1].y || x[0].localeCompare(y[0])).map((e) => e[0]).join('>');
    C(`${v} order`, bo === ho, `base ${bo} | head ${ho}`);
    const pos = (d) => els(d).map((e) => e[1].position).join(','); const pi = (d) => ['ban.media0.img', 'ban.media1.img'].map((k) => N(d, 375, k)).filter(Boolean).map((e) => e.position).join(',');
    C(`${v} position`, pos(b) === pos(h) && (v !== 'C4' || pi(b) === pi(h)), `base ${pos(b)} [${pi(b)}] | head ${pos(h)} [${pi(h)}]`);
    const root = N(h, 375, 'ban.root'); const ratioDriven = v === 'C2' || v === 'C3';
    if (!ratioDriven) {
      const hb = N(h, 375, 'ban.media0'), bb = N(b, 375, 'ban.media0'), hc = N(h, 375, 'ban.content'), bc = N(b, 375, 'ban.content');
      const parts = []; let ok = true;
      for (const [nm, bv, hv] of [['media0 h', bb.h, hb.h], ['content minH', px(bc.minHeight) || 0, px(hc.minHeight) || 0]]) { const e = near(hv, bv * 0.625, 1) || (bv === 0 && hv === 0); parts.push(`${nm} ${bv}->${hv}${e ? '' : ' X'}`); ok = ok && e; }
      C(`${v} heights`, ok, parts.join('; '));
    } else {
      const parts = []; let ok = true;
      for (const k of ['ban.media0', 'ban.media1']) { const e = N(h, 375, k); if (!e) continue; const pb = px(e['::before'].paddingBottom); const t = e.w / r1; const g = near(pb, t, 1); parts.push(`${k} ::before ${pb} vs ${Math.round(t * 10) / 10}${g ? '' : ' X'}`); ok = ok && g; }
      const cn = N(h, 375, 'ban.content'); if (v === 'C2') { const pb = px(cn['::before'].paddingBottom); const t = root.w / r1; const g = near(pb, t, 1); parts.push(`content ::before ${pb} vs ${Math.round(t * 10) / 10}${g ? '' : ' X'}`); ok = ok && g; }
      C(`${v} ratio boxes`, ok, parts.join('; '));
    }
  }
  { const m = M(H.C5, 1440); const box = m.named['ban.box']; C('C5@1440', near(box.x, m.L) && box.textAlign === 'left' && box.backgroundColor === m.bgVar, `box x ${box.x} L ${m.L}; ${box.textAlign}; bg ${box.backgroundColor} vs ${m.bgVar}`); }
}

export { rows, H, B, N, M, near, px, rec, want, r1 };
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const r of rows) console.log(r.ok ? 'PASS' : 'FAIL', r.c.padEnd(12), r.id.padEnd(44), r.detail);
}
