// T5a spacing follow-up zoo harness (plan §6.1). Usage:
//   node t5as-zoo2.mjs <outdir> <build> <preview_theme_id|live> [pre-step-1 tailwind.css path]
// build = live | staging | head. For head, also captures head-off (R_new removed from the CSSOM,
// same page, same load) and writes the removal count. Never prints the storefront password.
import { chromium, loginState, sleep } from './t5ac-lib.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const [OUT, build, theme, preCssPath] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const origin = 'https://theme-evolution-os2.myshopify.com';
const withTheme = (p) => theme === 'live' ? `${origin}${p}` : `${origin}${p}?preview_theme_id=${theme}`;
const FIX = `<h5>A level-five heading</h5><h6>A level-six heading</h6><p>Text before the quote, with a <a>link that has no address</a>.</p>
<blockquote><p>A quoted sentence from a customer review.</p></blockquote><p>Text before the divider.</p><hr><p>Text after the divider.</p>
<table id="zt-main"><tr><th>Size</th><th>Length</th><th>Rider weight</th></tr><tr><td>Small</td><td>148 cm</td><td>45-60 kg</td></tr><tr><td>Large</td><td>158 cm</td><td>65-85 kg</td></tr></table>
<details><summary>Shipping and returns (click to expand)</summary><p>Hidden answer text.</p></details><p>End of sample.</p>
<table id="zt-zt"><thead><tr><th>Name</th><th>Value</th><th>Unit</th></tr></thead><tbody><tr><td>a</td><td>b</td><td>c</td></tr></tbody></table>
<table id="zt-zr"><tr><th>Small</th><td>148 cm</td><td>45-60 kg</td></tr><tr><th>Large</th><td>158 cm</td><td>65-85 kg</td></tr></table>
<div id="zt-zn"><h5>Nested five</h5><p>x</p><h6>Nested six</h6></div>`;
const PROBE = '<div data-rich-text data-probe><h5>a</h5><h6>b</h6></div>';

// R_new = rules of the head file that the pre-Step-1 file lacks. Both files are parsed the same way
// (constructed sheets), so serialization differences against the served sheet cannot create false diffs.
const diffFn = ([preText, headText]) => {
  const flat = (text) => { const s = new CSSStyleSheet(); s.replaceSync(text); const out = []; const walk = (rules) => { for (const r of rules) { if (r.cssRules && r.cssRules.length && !r.selectorText) { walk(r.cssRules); continue; } out.push(r.cssText); } }; walk(s.cssRules); return out; };
  const pre = new Set(flat(preText));
  return flat(headText).filter((t) => !pre.has(t));
};
// Delete from the live (served) sheet every style rule whose selector matches an R_new rule's selector.
const deleteNewFn = (newRules) => {
  const sels = new Set(newRules.map((t) => t.slice(0, t.indexOf('{')).trim()));
  const sheet = [...document.styleSheets].find((s) => s.href && s.href.includes('tailwind.css'));
  let n = 0;
  const walk = (container) => { for (let i = container.cssRules.length - 1; i >= 0; i--) { const r = container.cssRules[i]; if (r.selectorText !== undefined) { if (sels.has(r.selectorText)) { container.deleteRule(i); n++; } } else if (r.cssRules) walk(r); } };
  walk(sheet);
  return n;
};
const measureFn = () => {
  const A = document.querySelector('[data-zoo^="SAMPLE A"]'), B = document.querySelector('[data-zoo^="SAMPLE B"]');
  const r = (e) => e.getBoundingClientRect();
  const cl = (e) => r(e).left + parseFloat(getComputedStyle(e).paddingLeft);
  const thInfo = (th) => { const s = getComputedStyle(th); return { pt: s.paddingTop, pr: s.paddingRight, pb: s.paddingBottom, pl: s.paddingLeft, va: s.verticalAlign }; };
  const out = {};
  const h5 = A.querySelector('h5'), h6 = A.querySelector('h6'), p6 = h6.nextElementSibling;
  out.G_56 = r(h6).top - r(h5).bottom; out.G_6p = r(p6).top - r(h6).bottom;
  const t = A.querySelector('#zt-main'), rows = t.querySelectorAll('tr');
  out.X_col = [...rows[0].children].map((th, i) => cl(th) - cl(rows[1].children[i]));
  out.H_hdr = r(rows[0]).height - r(rows[1]).height;
  out.X_tbl = cl(rows[0].children[0]) - r(t).left;
  out.hdr_th = [...rows[0].children].map(thInfo);
  const zr = A.querySelector('#zt-zr');
  out.X_tbl_ZR = [...zr.rows].map((row) => cl(row.children[0]) - r(zr).left);
  out.zr_th = [...zr.rows].map((row) => thInfo(row.children[0]));
  const zt = A.querySelector('#zt-zt');
  out.PT_th = [...zt.querySelectorAll('thead th')].map((th) => getComputedStyle(th).paddingTop);
  out.zt_th_all = [...zt.querySelectorAll('thead th')].map(thInfo);
  const zn = A.querySelector('#zt-zn');
  out.M_nest = [getComputedStyle(zn.querySelector('h5')).marginTop, getComputedStyle(zn.querySelector('h6')).marginBottom];
  // Sample B computed-style snapshot, no custom properties, ::marker and ::before/::after included
  const snap = [];
  for (const e of B.querySelectorAll('*')) {
    for (const ps of ['', '::marker', '::before', '::after']) {
      const s = getComputedStyle(e, ps || null); const o = {};
      for (let i = 0; i < s.length; i++) { const k = s[i]; if (!k.startsWith('--')) o[k] = s.getPropertyValue(k); }
      snap.push([e.tagName + ps, o]);
    }
  }
  out.B_snap = snap;
  return out;
};
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const preText = preCssPath ? readFileSync(preCssPath, 'utf8') : null;
const headText = readFileSync(new URL('../../../assets/tailwind.css', import.meta.url), 'utf8');
const results = {};
for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 667 }]) {
  const ctx = await browser.newContext({ storageState: state, viewport: vp });
  const page = await ctx.newPage();
  await page.goto(withTheme('/pages/contact'), { waitUntil: 'load' });
  await sleep(1500);
  const ok = await page.evaluate((FIX) => {
    document.querySelectorAll('[id*="PBar" i], [id*="preview-bar" i], iframe').forEach((e) => { if (getComputedStyle(e).position === 'fixed' || e.closest('[id*="PBar" i]') || /preview/i.test(e.id)) e.remove(); });
    const st = document.createElement('style'); st.textContent = '[id^="shopify-section-sections--"][id$="__header"], .shopify-section-group-header-group, header { position: static !important }'; document.head.append(st);
    const rich = document.querySelector('[id^="shopify-section-template"][id$="__main"]');
    if (!rich) return false;
    const mk = (label, cls) => { const w = document.createElement('div'); w.setAttribute('data-zoo', label); w.style.cssText = 'outline:2px dashed #e33;margin:24px auto;padding:8px;max-width:760px'; const h = document.createElement('p'); h.textContent = label; h.style.cssText = 'font:600 12px system-ui;color:#e33;margin:0 0 8px'; const b = document.createElement('div'); if (cls) { b.className = cls; b.setAttribute('data-rich-text', ''); } b.innerHTML = FIX; w.append(h, b); return w; };
    rich.replaceChildren(mk('SAMPLE A: inside a page or blog post (rich text)', 'prose prose-tokens max-w-none'), mk('SAMPLE B: plain markup (store policy bodies today)', ''));
    return true;
  }, FIX);
  if (!ok) throw new Error('injection failed on ' + build);
  const shoot = async (tag) => { for (const z of ['A', 'B']) await page.locator(`[data-zoo^="SAMPLE ${z}"]`).screenshot({ path: `${OUT}/zoo-${z}-${tag}-${vp.width}.png` }); };
  await page.evaluate(() => document.fonts.ready); await sleep(500);
  const tags = {};
  tags[build] = await page.evaluate(measureFn); await shoot(build);
  if (build === 'head') {
    const newRules = await page.evaluate(diffFn, [preText, headText]);
    const removed = await page.evaluate(deleteNewFn, newRules);
    tags.R_new = { count: newRules.length, removed, rules: newRules };
    tags['head-off'] = await page.evaluate(measureFn); await shoot('head-off');
  }
  for (const [k, v] of Object.entries(tags)) {
    if (v && v.B_snap) { writeFileSync(`${OUT}/bsnap-${k}-${vp.width}.json`, JSON.stringify(v.B_snap)); delete v.B_snap; }
    if (k !== 'R_new') writeFileSync(`${OUT}/measure-${k}-${vp.width}.json`, JSON.stringify(v, null, 1)); else writeFileSync(`${OUT}/rnew-${vp.width}.json`, JSON.stringify(v, null, 1));
  }
  results[vp.width] = tags;
  await ctx.close();
}
console.log(JSON.stringify(Object.fromEntries(Object.entries(results).map(([w, t]) => [w, Object.fromEntries(Object.entries(t).map(([k, v]) => [k, k === 'R_new' ? { count: v.count, removed: v.removed } : { G_56: v.G_56, G_6p: v.G_6p, X_col: v.X_col, H_hdr: v.H_hdr, X_tbl: v.X_tbl, X_tbl_ZR: v.X_tbl_ZR, PT_th: v.PT_th, M_nest: v.M_nest }]))])), null, 1));
await browser.close();
