// T4c rich-text measurements. Modes: pxr (fixture page, Step 0 item 9 and C4c.5/8/9/12c), optout (item 5 end state, C4c.16 mechanism).
// Usage: node t4cc-rich.mjs <previewBase> <mode> <label>   Output: docs/qa/evidence/t4cc-rich-<mode>-<label>.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, overflowFn2 } from './t4cc-lib.mjs';

const [, mode, label = 'x'] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
const out = { mode, label };
const VARS = ['body', 'headings', 'lead', 'links', 'bold', 'counters', 'bullets', 'hr', 'quotes', 'quote-borders', 'captions', 'kbd', 'kbd-shadows', 'code', 'pre-code', 'pre-bg', 'th-borders', 'td-borders'];

const copyFn = (VARS) => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const px = (v) => parseFloat(v);
  const res = {};
  for (const sec of document.querySelectorAll('.shopify-section[data-t4cc-copy]')) {
    const label = sec.getAttribute('data-t4cc-copy');
    const c = sec.querySelector('[data-t4cc-fixture="rt-content"]');
    const cs = getComputedStyle(c);
    const par = c.parentElement; const pcs = getComputedStyle(par);
    const parentContent = par.getBoundingClientRect().width - px(pcs.paddingLeft) - px(pcs.paddingRight) - px(pcs.borderLeftWidth) - px(pcs.borderRightWidth);
    const o = { cls: c.className, w: r1(c.getBoundingClientRect().width), parentContent: r1(parentContent), fs: cs.fontSize, lh: cs.lineHeight, maxWidth: cs.maxWidth, color: cs.color, vars: {} };
    for (const v of VARS) o.vars[v] = cs.getPropertyValue('--tw-prose-' + v).trim();
    const q = (s) => c.querySelector(s);
    const m = (e) => { if (!e) return null; const s = getComputedStyle(e); return { fs: s.fontSize, fw: s.fontWeight, mt: s.marginTop, mb: s.marginBottom, color: s.color, ff: s.fontFamily.slice(0, 14) }; };
    o.h2 = m(q('h2')); o.h3 = m(q('h3')); o.p2 = m(c.querySelectorAll(':scope > p')[1]); o.a = q('a') && { ...m(q('a')), td: getComputedStyle(q('a')).textDecorationLine };
    const ul = q('ul'); const ol = q('ol');
    o.ul = ul && { lst: getComputedStyle(ul).listStyleType, pis: getComputedStyle(ul).paddingInlineStart, lsp: getComputedStyle(ul).listStylePosition, pl: getComputedStyle(ul).paddingLeft, color: getComputedStyle(ul.querySelector('li')).color, marker: getComputedStyle(ul.querySelector('li'), '::marker').color };
    o.ol = ol && { lst: getComputedStyle(ol).listStyleType, pis: getComputedStyle(ol).paddingInlineStart };
    const hr = q('hr'); o.hr = hr && { bts: getComputedStyle(hr).borderTopStyle, btw: getComputedStyle(hr).borderTopWidth, btc: getComputedStyle(hr).borderTopColor };
    const bq = q('blockquote'); o.bq = bq && { bls: getComputedStyle(bq).borderLeftStyle, blw: getComputedStyle(bq).borderLeftWidth, blc: getComputedStyle(bq).borderLeftColor, pis: getComputedStyle(bq).paddingInlineStart, color: getComputedStyle(bq).color };
    const pre = q('pre'); o.pre = pre && { bg: getComputedStyle(pre).backgroundColor, color: getComputedStyle(pre).color };
    const list = c.querySelector('ul'); o.strong = m(q('strong'));
    res[label] = o;
  }
  return res;
};

if (mode === 'pxr') {
  for (const vw of [375, 1440]) {
    const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
    await page.goto(withTheme('/pages/contact?view=tw-rt'), { waitUntil: 'load' });
    await sleep(800);
    out[vw] = { copies: await page.evaluate(copyFn, VARS), xPage: (await page.evaluate(overflowFn2)) };
    if (vw === 1440) {
      // M_ch: 65 zeros in a separate prose box (never in the page's own box).
      out.M_ch = await page.evaluate(() => {
        const root = document.querySelector('[data-t4cc-fixture="rt"]');
        const box = document.createElement('div'); box.className = 'prose'; box.setAttribute('data-t4cc-probe', '1');
        const sp = document.createElement('span'); sp.style.whiteSpace = 'nowrap'; sp.textContent = '0'.repeat(65);
        box.appendChild(sp); root.appendChild(box);
        const w = sp.getBoundingClientRect().width; const mw = getComputedStyle(box).maxWidth; box.remove(); return { span: w, maxWidth: mw };
      });
    }
    await ctx.close();
  }
} else if (mode === 'optout') {
  for (const vw of [320, 375, 390, 430, 768, 1440, 1920]) {
    const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
    await page.goto(withTheme('/pages/data-sharing-opt-out'), { waitUntil: 'load' });
    await sleep(2500);
    out[vw] = await page.evaluate(() => {
      const r1 = (n) => Math.round(n * 10) / 10;
      const box = document.querySelector('[data-rich-text]'); const w = box.querySelector('.pc--show-email-field');
      const bcs = getComputedStyle(box);
      const left = box.getBoundingClientRect().left + parseFloat(bcs.paddingLeft) + parseFloat(bcs.borderLeftWidth);
      const furthest = Math.max(...[w, ...w.querySelectorAll('*')].map((e) => e.getBoundingClientRect().right));
      return { cls: box.className, ox: bcs.overflowX, oy: bcs.overflowY, boxW: r1(box.getBoundingClientRect().width), cw: box.clientWidth, sw: box.scrollWidth, X_in: box.scrollWidth - box.clientWidth, vScroll: box.scrollHeight - box.clientHeight, W_pc: r1(furthest - left), maxWidth: bcs.maxWidth };
    });
    out[vw].page = await page.evaluate(() => ({ xPage: document.documentElement.scrollWidth - innerWidth }));
    out[vw].off = (await page.evaluate(overflowFn2)).off;
    if (vw === 375 || vw === 320) {
      // Focus rings: Tab from the element before the box; record each control as it receives focus.
      const rings = await page.evaluate(async () => {
        const box = document.querySelector('[data-rich-text]');
        const w = box.querySelector('.pc--show-email-field');
        const pre = document.createElement('button'); pre.id = 't4cc-pre'; pre.textContent = '.'; box.parentElement.insertBefore(pre, box); pre.focus();
        return { ok: true };
      });
      const res = [];
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        const r = await page.evaluate(() => {
          const r1 = (n) => Math.round(n * 10) / 10;
          const e = document.activeElement; const box = document.querySelector('[data-rich-text]'); const w = box.querySelector('.pc--show-email-field');
          const inW = !!(w && w.contains(e)); const inBox = box.contains(e);
          const cs = getComputedStyle(e); const b = e.getBoundingClientRect(); const bb = box.getBoundingClientRect();
          const bcs = getComputedStyle(box);
          const pad = { l: bb.left + parseFloat(bcs.borderLeftWidth), r: bb.right - parseFloat(bcs.borderRightWidth), t: bb.top + parseFloat(bcs.borderTopWidth), b: bb.bottom - parseFloat(bcs.borderBottomWidth) };
          const ow = parseFloat(cs.outlineWidth) || 0; const oo = parseFloat(cs.outlineOffset) || 0; const ext = cs.outlineStyle === 'none' ? 0 : ow + oo;
          return { tag: e.tagName.toLowerCase(), type: e.type || '', id: e.id, fv: e.matches(':focus-visible'), inBox, inW, outline: `${cs.outlineStyle} ${cs.outlineWidth} off ${cs.outlineOffset}`, shadow: cs.boxShadow.slice(0, 60), rect: [r1(b.left), r1(b.top), r1(b.right), r1(b.bottom)], clipPx: { l: Math.max(0, r1(pad.l - (b.left - ext))), r: Math.max(0, r1((b.right + ext) - pad.r)), t: Math.max(0, r1(pad.t - (b.top - ext))), b: Math.max(0, r1((b.bottom + ext) - pad.b)) } };
        });
        res.push(r);
        if (!r.inBox && i > 0) break;
      }
      out[vw].focus = res;
    }
    // Widget descendants computed text styles (E4c.8).
    if (vw === 375) out[vw].widgetText = await page.evaluate(() => [...document.querySelectorAll('.pc--show-email-field, .pc--show-email-field *')].slice(0, 30).map((e) => { const s = getComputedStyle(e); return { tag: e.tagName.toLowerCase(), fs: s.fontSize, lh: s.lineHeight, mt: s.marginTop, mb: s.marginBottom, fw: s.fontWeight }; }));
    await ctx.close();
  }
}
await browser.close();
mkdirSync('docs/qa/evidence', { recursive: true });
writeFileSync(`docs/qa/evidence/t4cc-rich-${mode}-${label}.json`, JSON.stringify(out, null, 1));
console.log('wrote', mode, label);
