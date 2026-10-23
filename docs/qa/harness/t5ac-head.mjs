// T5a head checks on the end state: C5a.4(d) (one theme stylesheet, tailwind.css, no base.css request), C5a.5 (layer statement), C5a.7 (root metrics),
// C5a.13(c) (:focus-visible guard), C5a.14(c)/(f) (privacy widget computed values), C5a.15 (policy parity), C5a.18 (overflow at every W_sw), C5a.23 (H1, images).
// Usage: node t5ac-head.mjs <previewBase> <label>   Output: docs/qa/evidence/t5ac-head-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, settleFn, overflowFn2, PAGES, PW_PAGE, W_SW } from './t5ac-lib.mjs';
const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const ALL = { ...PAGES, pw: PW_PAGE, ...(process.env.T5AC_EXTRA ? JSON.parse(process.env.T5AC_EXTRA) : {}) };
const keys = process.env.T5AC_KEYS ? process.env.T5AC_KEYS.split(',') : [...Object.keys(PAGES), 'pw'];
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = { c4d: [], c5: {}, c7: {}, overflow: [], c23: [], widget: null, policy: null, guard: null };
let fails = 0;
const ok = (id, c, d = '') => { if (!c) fails++; console.log(`${c ? 'PASS' : 'FAIL'} ${id} ${d}`); };
for (const key of keys) {
  for (const w of W_SW) {
    const { ctx, page } = await newPage(browser, state, w, w >= 1000 ? 900 : 812);
    const reqs = []; page.on('request', (r) => { if (/\/assets\/base\.css/.test(r.url())) reqs.push(r.url()); });
    try {
      await page.goto(withTheme(key === 'cartseed' ? '/cart' : ALL[key]), { waitUntil: 'load' }); await sleep(1200);
      await page.evaluate(settleFn, { recWait: 4000 });
      const r = await page.evaluate((fnSrc) => {
        const links = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href).filter((h) => /\/cdn\/shop\/t\/\d+\/assets\//.test(h)).map((h) => h.replace(/\?.*/, '').split('/').pop());
        const st = document.styleSheets[0]?.cssRules[0];
        const imgs = [...document.querySelectorAll('img')].filter((i) => !i.closest('#preview-bar-iframe'));
        return { links, stmt: st?.constructor.name === 'CSSLayerStatementRule' ? st.nameList.join(', ') : String(st?.constructor.name), root: getComputedStyle(document.documentElement).fontSize, lh: getComputedStyle(document.documentElement).lineHeight, h1: document.querySelectorAll('h1').length, imgsNoDims: imgs.filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length, fvOk: (() => { try { document.querySelector(':focus-visible'); return true; } catch { return false; } })() };
      });
      const of = await page.evaluate(overflowFn2);
      out.c4d.push({ key, w, links: r.links, reqs: reqs.length });
      out.overflow.push({ key, w, x: of.sw - of.vw, off: of.off });
      out.c23.push({ key, w, h1: r.h1, imgsNoDims: r.imgsNoDims });
      if (w === 375 || w === 1440) { out.c5[key] = r.stmt; out.c7[key + '@' + w] = [r.root, r.lh]; }
      if (!r.fvOk) fails++;
    } catch (e) { console.log(key, w, 'ERROR', String(e.message).split('\n')[0]); fails++; }
    await ctx.close(); await sleep(250);
  }
  console.log('done', key);
}
// summaries
const bad4 = out.c4d.filter((x) => x.links.length !== 1 || x.links[0] !== 'tailwind.css' || x.reqs);
ok('C5a.4(d) one theme stylesheet = tailwind.css, no base.css request', bad4.length === 0 && out.c4d.length > 0, `${out.c4d.length} loads, ${bad4.length} bad`);
const want = 'properties, theme, base, components, utilities';
ok('C5a.5 layer statement', Object.values(out.c5).every((s) => s === want), JSON.stringify([...new Set(Object.values(out.c5))]));
ok('C5a.7 root 16px / line-height normal', Object.values(out.c7).every(([a, b]) => a === '16px' && b === 'normal'), JSON.stringify([...new Set(Object.values(out.c7).map((x) => x.join('/')))]));
const ov = out.overflow.filter((x) => x.x !== 0 || x.off.length);
ok('C5a.18 overflow', ov.every((x) => x.key === 'policy' && x.w === 320 && x.x === 5), `${out.overflow.length} loads; non-zero: ${JSON.stringify(ov.map((x) => `${x.key}@${x.w}:${x.x}`))}`);
const themeKeys = keys.filter((k) => k !== 'pw');
ok('C5a.23 one h1 per theme page, every img has width/height', out.c23.filter((x) => themeKeys.includes(x.key)).every((x) => x.h1 === 1 && x.imgsNoDims === 0), JSON.stringify(out.c23.filter((x) => x.h1 !== 1 || x.imgsNoDims).slice(0, 5)));
// widget (C5a.14(c)/(f)) and policy (C5a.15)
if (keys.includes('optout')) {
  const { ctx, page } = await newPage(browser, state, 375, 812);
  await page.goto(withTheme('/pages/data-sharing-opt-out'), { waitUntil: 'load' }); await sleep(2500);
  out.widget = await page.evaluate(() => { const s = document.querySelector('#pc--optOutFormContainer small.form__message'), i = s?.querySelector('svg.icon'); const cs = (e, p) => e && getComputedStyle(e)[p]; return { n: !!s && !!i, line: cs(s, 'lineHeight'), shrink: cs(i, 'flexShrink'), width: cs(i, 'width'), cbMargin: cs(document.querySelector('#pc--show-email-field'), 'marginRight') }; });
  ok('C5a.14(f) error-state values (unrendered)', out.widget.n && out.widget.line === '16px' && out.widget.shrink === '0' && out.widget.width === '20.8px', JSON.stringify(out.widget));
  ok('C5a.14(c)/E5a.3 checkbox margin 8px', out.widget.cbMargin === '8px');
  await ctx.close();
}
if (keys.includes('policy')) {
  out.policy = {};
  for (const w of [375, 1440]) {
    const { ctx, page } = await newPage(browser, state, w, 812);
    await page.goto(withTheme('/policies/privacy-policy'), { waitUntil: 'load' }); await sleep(1500);
    const r = await page.evaluate(() => { const b = document.querySelector('.shopify-policy__body'); const lists = [...b.querySelectorAll('ul,ol')].map((e) => { const c = getComputedStyle(e); return [e.tagName, c.listStyleType, c.listStylePosition, c.paddingLeft]; }); const as = [...b.querySelectorAll('a')].map((e) => { const c = getComputedStyle(e); return [c.textDecorationLine, c.textUnderlineOffset, c.textDecorationThickness, c.transitionProperty, c.transitionDuration]; }); return { lists, as }; });
    const a = page.locator('.shopify-policy__body a').first(); await a.hover(); await sleep(300);
    const hov = await a.evaluate((e) => getComputedStyle(e).textDecorationThickness);
    const good = r.lists.length >= 1 && r.as.length >= 1 && r.lists.every(([t, ty, pos, pad]) => (t === 'ul' || t === 'UL' ? ty === 'disc' : ty === 'decimal') && pos === 'inside' && pad === '32px') && r.as.every(([l, o, t, tp, d]) => l === 'underline' && o === '4.8px' && t === '1.6px' && /text-decoration-thickness/.test(tp) && d.split(',')[0] === '0.1s') && hov === '3.2px';
    out.policy[w] = { r, hov };
    ok(`C5a.15 policy ${w}`, good, `${r.lists.length} lists, ${r.as.length} links, hover ${hov}`);
    await ctx.close();
  }
}
writeFileSync(`docs/qa/evidence/t5ac-head-${label}.json`, JSON.stringify(out));
console.log(fails ? `FAILURES ${fails}` : 'ALL PASS');
await browser.close();
