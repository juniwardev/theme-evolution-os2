// C-S.10 follow-up: base-vs-base noise and rect-diff attribution for one page/width.
// Usage: node t5as-noise.mjs <theme> <pageKey> <vw> <pre.css>
// Takes 3 head shots with no change (noise), then deletes R_new and takes 2 head-off shots; prints md5s,
// pixel-diff counts (decoded in-page via canvas) and the elements whose rect moved > 1px.
import { chromium, loginState, PAGES, sleep } from './t5ac-lib.mjs';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const [theme, key, vwS, preCss] = process.argv.slice(2);
const vw = +vwS;
const origin = 'https://theme-evolution-os2.myshopify.com';
const withTheme = (p) => `${origin}${p}${p.includes('?') ? '&' : '?'}preview_theme_id=${theme}`;
const all = { ...PAGES, rental: '/products/the-rental-snowboard' };
const preText = readFileSync(preCss, 'utf8');
const headText = readFileSync(new URL('../../../assets/tailwind.css', import.meta.url), 'utf8');
const md5 = (b) => createHash('md5').update(b).digest('hex').slice(0, 8);
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vw === 375 ? 667 : 900 } });
const page = await ctx.newPage();
await page.goto(withTheme(all[key]), { waitUntil: 'load' }); await sleep(1500);
if (key === 'rental') { const inp = page.locator('[id^="shopify-block-"] input, [id*="supercycle" i] input').first(); if (await inp.count()) { await inp.click({ timeout: 3000 }).catch(() => {}); await sleep(1500); } }
await page.evaluate(() => document.fonts.ready);
const shot = () => page.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' });
const rects = () => page.evaluate(() => [...document.body.querySelectorAll('*')].map((e, i) => { const r = e.getBoundingClientRect(); return [i, e.tagName + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''), r.left, r.top + scrollY, r.width, r.height]; }));
const pixdiff = async (a, b) => {
  const pg = await ctx.newPage();
  const n = await pg.evaluate(async ([x, y]) => {
    const load = (b64) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + b64; });
    const [A, B] = await Promise.all([load(x), load(y)]);
    if (A.width !== B.width || A.height !== B.height) return 'size ' + A.width + 'x' + A.height + ' vs ' + B.width + 'x' + B.height;
    const px = (I) => { const c = document.createElement('canvas'); c.width = I.width; c.height = I.height; const g = c.getContext('2d'); g.drawImage(I, 0, 0); return g.getImageData(0, 0, I.width, I.height).data; };
    const da = px(A), db = px(B); let n = 0; let minY = 1e9, maxY = -1;
    for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2]) { n++; const y = Math.floor(i / 4 / A.width); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    return n + ' px, y ' + minY + '-' + maxY;
  }, [a.toString('base64'), b.toString('base64')]);
  await pg.close(); return n;
};
const s1 = await shot(), s2 = await shot(), s3 = await shot();
const rA = await rects();
await sleep(2500);
const rA2 = await rects();
console.log('rect drift with NO change (2.5 s apart):', JSON.stringify(rA.filter((a, i) => [2, 3, 4, 5].some((k) => Math.abs(a[k] - rA2[i][k]) > 1)).map((a) => a[1])).slice(0, 200));
console.log('head x3 md5', md5(s1), md5(s2), md5(s3), '| diff 1v2:', await pixdiff(s1, s2), '| 1v3:', await pixdiff(s1, s3));
const rules = await page.evaluate(([a, b]) => { const flat = (t) => { const s = new CSSStyleSheet(); s.replaceSync(t); const o = []; const w = (rs) => { for (const r of rs) { if (r.cssRules && r.cssRules.length && !r.selectorText) { w(r.cssRules); continue; } o.push(r.cssText); } }; w(s.cssRules); return o; }; const p = new Set(flat(a)); return flat(b).filter((t) => !p.has(t)); }, [preText, headText]);
await page.evaluate((nr) => { const sels = new Set(nr.map((t) => t.slice(0, t.indexOf('{')).trim())); const sh = [...document.styleSheets].find((s) => s.href && s.href.includes('tailwind.css')); const w = (c) => { for (let i = c.cssRules.length - 1; i >= 0; i--) { const r = c.cssRules[i]; if (r.selectorText !== undefined) { if (sels.has(r.selectorText)) c.deleteRule(i); } else if (r.cssRules) w(r); } }; w(sh); }, rules);
await sleep(300);
const o1 = await shot(), o2 = await shot();
const rB = await rects();
console.log('off x2 md5', md5(o1), md5(o2), '| head1 v off1:', await pixdiff(s1, o1), '| off1 v off2:', await pixdiff(o1, o2), '| head3 v off1:', await pixdiff(s3, o1));
const moved = rA.filter((a, i) => rB[i] && [2, 3, 4, 5].some((k) => Math.abs(a[k] - rB[i][k]) > 1)).map((a) => [a[1], a.slice(2).map((v) => Math.round(v * 10) / 10), rB[a[0]].slice(2).map((v) => Math.round(v * 10) / 10)]);
console.log('moved', JSON.stringify(moved).slice(0, 600));
await browser.close();
