// T5a QA feature probes, run once per build (label base|head) and diffed by eye / t5aq-fdiff.mjs.
// Usage: T5AQ_STATE=<scratch>/state.json node t5aq-feat.mjs <previewBase> <label> <outFile> <cardClassFile>
//  cardClassFile: the build's snippets/card-product.liquid (for the vendor-line class string).
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { chromium, loginState, sleep } from './t5ac-lib.mjs';

const [previewBase, label, outFile, cardFile] = process.argv.slice(2);
const origin = new URL(previewBase).origin;
const themeId = new URL(previewBase).searchParams.get('preview_theme_id');
const withTheme = (p) => `${origin}${p}${p.includes('?') ? '&' : '?'}preview_theme_id=${themeId}`;
const browser = await chromium.launch();
const j = JSON.parse(readFileSync(process.env.T5AQ_STATE, 'utf8'));
const state = j.state || j;
const out = { label };
const mk = async (w, h = 812, extra = {}) => { const ctx = await browser.newContext({ storageState: state, viewport: { width: w, height: h }, reducedMotion: 'reduce', ...extra }); return { ctx, page: await ctx.newPage() }; };
const go = async (page, path) => { await page.goto(withTheme(path), { waitUntil: 'load' }); await sleep(900); };

// ---- F1 policy parity incl. hover
out.policy = {};
for (const w of [375, 1440]) {
  const { ctx, page } = await mk(w);
  await go(page, '/policies/privacy-policy');
  const read = () => page.evaluate(() => {
    const body = document.querySelector('.shopify-policy__body');
    const pick = (el, ps) => Object.fromEntries(ps.map((p) => [p, getComputedStyle(el).getPropertyValue(p)]));
    const lists = [...body.querySelectorAll('ul,ol')].map((e) => ({ t: e.tagName, ...pick(e, ['list-style-type', 'list-style-position', 'padding-left']) }));
    const links = [...body.querySelectorAll('a')].map((e) => pick(e, ['text-decoration-line', 'text-underline-offset', 'text-decoration-thickness', 'transition-property', 'transition-duration']));
    const rect = (e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); };
    return { nUl: body.querySelectorAll('ul').length, nOl: body.querySelectorAll('ol').length, nA: links.length, lists: lists.slice(0, 3), links: links.slice(0, 3), bodyRect: rect(body), container: rect(document.querySelector('.shopify-policy__container')), bodyUrl: getComputedStyle(body).fontSize };
  });
  const rest = await read();
  const a = page.locator('.shopify-policy__body a').first();
  await a.scrollIntoViewIfNeeded(); await a.hover(); await sleep(300);
  const hov = await page.evaluate(() => { const e = document.querySelector('.shopify-policy__body a:hover') || document.querySelector('.shopify-policy__body a'); return { hovered: e.matches(':hover'), thick: getComputedStyle(e).textDecorationThickness }; });
  out.policy[w] = { rest, hov };
  await ctx.close();
}

// ---- F2 opt-out widget
out.optout = {};
for (const w of [320, 375, 390, 430, 1440]) {
  const { ctx, page } = await mk(w);
  await go(page, '/pages/data-sharing-opt-out');
  await page.waitForSelector('body > div[aria-hidden="true"] iframe[src*="hcaptcha"]', { state: 'attached', timeout: 10000 }).catch(() => {});
  const o = {};
  o.static = await page.evaluate(() => {
    const cb = document.querySelector('#pc--show-email-field');
    const lab = cb && (cb.closest('label') || document.querySelector(`label[for="${cb.id}"]`));
    const cs = cb && getComputedStyle(cb);
    const msg = document.querySelector('#pc--optOutFormContainer small.form__message, small.form__message');
    const icon = document.querySelector('#pc--optOutFormContainer svg.icon, svg.icon-error');
    const hc = document.querySelector('body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])');
    const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((v) => Math.round(v * 10) / 10); };
    return {
      checkbox: cb ? { mr: cs.marginRight, display: cs.display, width: cs.width, rect: r(cb), labelRect: r(lab) } : null,
      msg: msg ? { lh: getComputedStyle(msg).lineHeight, display: getComputedStyle(msg).display, inline: msg.getAttribute('style') } : null,
      icon: icon ? { fs: getComputedStyle(icon).flexShrink, w: getComputedStyle(icon).width } : null,
      hc: hc ? { n: hc.querySelectorAll('div').length, empties: [...hc.querySelectorAll('div:empty')].map((d) => ({ disp: getComputedStyle(d).display, pe: getComputedStyle(d).pointerEvents, vis: getComputedStyle(d).visibility, op: getComputedStyle(d).opacity, rect: r(d) })) } : null,
      docW: document.documentElement.scrollWidth, innerW: innerWidth,
    };
  });
  // hit tests
  o.hits = await page.evaluate(async () => {
    const res = {};
    const targets = { checkbox: document.querySelector('#pc--optOutFormContainer input[type=checkbox], input[type=checkbox]'), button: document.querySelector('#pc--opt-out-button'), cart: document.querySelector('[data-header-cart-icon]') };
    const hc = document.querySelector('body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])');
    for (const [k, el] of Object.entries(targets)) {
      if (!el) { res[k] = 'absent'; continue; }
      el.scrollIntoView({ block: 'center' }); await new Promise((r) => setTimeout(r, 150));
      const b = el.getBoundingClientRect(); const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      res[k] = { isTarget: hit === el || el.contains(hit) || (hit && hit.closest('label') && hit.closest('label').contains(el)), insideHC: !!(hc && hit && hc.contains(hit)), hit: hit && (hit.tagName + '.' + String(hit.className).slice(0, 40)) };
    }
    return res;
  });
  // keyboard sweep to widget controls
  const stops = [];
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  for (let i = 0; i < 140; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const inW = !!el.closest('#pc--optOutFormContainer, .pc--show-email-field');
      if (!inW) return { widget: false, tag: el.tagName };
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      let box = null; for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(o.overflowX + o.overflowY)) { box = p; break; } }
      let clip = null; if (box) { const b = box.getBoundingClientRect(); const bw = (n) => parseFloat(getComputedStyle(box)[n]) || 0; const pad = { l: b.left + bw('borderLeftWidth'), r: b.right - bw('borderRightWidth'), t: b.top + bw('borderTopWidth'), b: b.bottom - bw('borderBottomWidth') };
        const ring = (parseFloat(cs.outlineWidth) || 0) + (parseFloat(cs.outlineOffset) || 0);
        clip = { box: box.tagName + '.' + String(box.className).slice(0, 30), overflow: getComputedStyle(box).overflowX + '/' + getComputedStyle(box).overflowY, left: Math.max(0, Math.round((pad.l - (r.left - ring)) * 10) / 10), right: Math.max(0, Math.round(((r.right + ring) - pad.r) * 10) / 10), top: Math.max(0, Math.round((pad.t - (r.top - ring)) * 10) / 10), bottom: Math.max(0, Math.round(((r.bottom + ring) - pad.b) * 10) / 10) }; }
      return { widget: true, tag: el.tagName, type: el.type || '', fv: el.matches(':focus-visible'), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`, offset: cs.outlineOffset, shadow: cs.boxShadow.slice(0, 60), rect: [r.x, r.y, r.width, r.height].map(Math.round), clip };
    });
    if (s && s.widget) stops.push(s);
    if (stops.length >= 4) break;
  }
  o.focus = stops;
  out.optout[w] = o;
  await ctx.close();
}

// ---- F2b error state shown (the widget sets display:none inline; emulate its error by clearing that inline style) + F2c real hCaptcha challenge open
out.errorState = {}; out.challenge = {};
for (const w of [375, 1440]) {
  const { ctx, page } = await mk(w);
  const blocked = [];
  await page.route('**/*', (route) => { const rq = route.request(); if (rq.method() !== 'GET' && rq.method() !== 'HEAD' && !/hcaptcha|monorail|analytics|collect|otlp|graphql|error-analytics/.test(rq.url())) { blocked.push(rq.method() + ' ' + rq.url().replace(/\?.*/, '').slice(0, 120)); return route.abort(); } return route.continue(); });
  await go(page, '/pages/data-sharing-opt-out');
  await sleep(2500);
  // error state (emulated)
  out.errorState[w] = await page.evaluate(() => {
    const m = document.querySelector('#pc--opt-out-error'); m.style.display = '';
    const r = m.getBoundingClientRect(); const cs = getComputedStyle(m); const ic = m.querySelector('svg'); const ir = ic.getBoundingClientRect(); const ics = getComputedStyle(ic);
    const res = { disp: cs.display, lh: cs.lineHeight, fs: cs.fontSize, mt: cs.marginTop, ai: cs.alignItems, h: Math.round(r.height * 10) / 10, w: Math.round(r.width * 10) / 10, iconW: Math.round(ir.width * 10) / 10, iconH: Math.round(ir.height * 10) / 10, iconFS: ics.flexShrink, iconMR: ics.marginRight };
    m.style.display = 'none'; return res;
  });
  // real challenge
  await page.evaluate(() => document.querySelector('#pc--opt-out-button').scrollIntoView({ block: 'center' }));
  await page.click('#pc--opt-out-button', { timeout: 5000 }).catch((e) => { out.challenge[w] = { clickErr: String(e.message).slice(0, 120) }; });
  await sleep(4500);
  const ch = await page.evaluate(() => {
    const hc = document.querySelector('body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])') || document.querySelector('body > div:has(iframe[src*="hcaptcha"])');
    const rr = (e) => { const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((v) => Math.round(v)); };
    const vis = [...document.querySelectorAll('iframe[src*="hcaptcha"]')].map((f) => ({ title: f.title, rect: rr(f), vis: getComputedStyle(f).visibility }));
    const parts = hc ? [...hc.querySelectorAll('div')].map((d) => { const c = getComputedStyle(d); return { empty: d.matches(':empty'), disp: c.display, pos: c.position, vis: c.visibility, op: c.opacity, pe: c.pointerEvents, z: c.zIndex, bg: c.backgroundColor, rect: rr(d) }; }) : null;
    const cart = document.querySelector('[data-header-cart-icon]'); let hit = null; if (cart) { const b = cart.getBoundingClientRect(); const e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); hit = { isCart: e === cart || cart.contains(e), insideHC: !!(hc && e && hc.contains(e)), tag: e && e.tagName }; }
    return { hcFound: !!hc, hcStyle: hc && hc.getAttribute('style'), parts, vis, hit, docW: document.documentElement.scrollWidth, innerW: innerWidth };
  });
  out.challenge[w] = { ...(out.challenge[w] || {}), ...ch, blocked: blocked.length };
  writeFileSync(outFile.replace(/\.json$/, `-challenge-${w}.png`), await page.screenshot());
  await page.keyboard.press('Escape'); await sleep(800);
  out.challenge[w].afterEsc = await page.evaluate(() => [...document.querySelectorAll('iframe[src*="hcaptcha"]')].map((f) => f.getBoundingClientRect().height > 0 && getComputedStyle(f).visibility !== 'hidden').join(','));
  await ctx.close();
}

// ---- F3 injected element zoo (computed values), inside the real prose box on /pages/contact and a bare copy
out.zoo = {};
{
  const vendorClasses = (() => { const t = readFileSync(cardFile, 'utf8'); const m = t.match(/<div class="([^"]*)">\{\{ card_product\.vendor \}\}<\/div>/); return m ? m[1] : null; })();
  out.zoo.vendorClasses = vendorClasses;
  for (const w of [375, 1440]) {
    const { ctx, page } = await mk(w);
    await go(page, '/pages/contact');
    const r = await page.evaluate((vc) => {
      const FIX = '<h6 data-z="h6">Heading six</h6><p>x <a data-z="nohref">anchor without href</a></p><blockquote data-z="quote"><p>Quote</p></blockquote><hr data-z="hr"><table data-z="table"><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table><details><summary data-z="summary">Sum</summary><p>B</p></details><div data-z="empty-div"></div><a href="#e" data-z="empty-a"></a><ul data-z="empty-ul"></ul><h3 data-z="empty-h"></h3><div class="flex flex-col gap-4" data-z="gap"><div data-z="g1">One</div><div data-z="g2"></div><div data-z="g3">Two</div></div><div class="flex w-20" data-z="longword"><h2 data-z="lw">Supercalifragilisticexpialidocious12345</h2></div><div class="flex flex-col gap-[0.4375rem]" data-z="vendor"><div data-z="v1">Title</div><div data-z="vendorline" class="' + (vc || '') + '"></div><div data-z="v3">Price</div></div>';
      const host = document.querySelector('[data-rich-text]') || document.querySelector('main');
      const mkBox = (name, rich) => { const d = document.createElement('div'); d.setAttribute('data-zoo', name); if (rich === 'prose') { d.className = 'prose prose-tokens'; d.setAttribute('data-rich-text', ''); } d.innerHTML = FIX; (document.querySelector('main') || document.body).appendChild(d); return d; };
      const props = ['display', 'margin-top', 'margin-bottom', 'margin-left', 'padding-left', 'padding-top', 'font-size', 'font-style', 'border-top-width', 'border-top-style', 'border-top-color', 'border-left-width', 'border-left-style', 'border-bottom-style', 'border-bottom-width', 'height', 'table-layout', 'border-collapse', 'list-style-type', 'cursor', 'word-break', 'position', 'background-color', 'color'];
      const res = {};
      for (const name of ['prose', 'bare']) {
        const box = mkBox(name, name);
        res[name] = {};
        for (const el of box.querySelectorAll('[data-z]')) {
          const cs = getComputedStyle(el); const rc = el.getBoundingClientRect();
          const o = {}; for (const p of props) o[p] = cs.getPropertyValue(p);
          o.rect = [rc.x - box.getBoundingClientRect().x, rc.y - box.getBoundingClientRect().y, rc.width, rc.height].map((v) => Math.round(v * 10) / 10);
          res[name][el.getAttribute('data-z')] = o;
          if (el.tagName === 'TD' || el.tagName === 'TABLE') { const td = box.querySelector('td'); res[name].td = { padding: getComputedStyle(td).padding, bt: getComputedStyle(td).borderTopStyle }; }
        }
        res[name]._h = Math.round(box.getBoundingClientRect().height * 10) / 10;
      }
      return res;
    }, vendorClasses);
    out.zoo[w] = r;
    await ctx.close();
  }
}

// ---- F4 S8 selection (clip shot of a selected paragraph + sampled colours)
{
  const { ctx, page } = await mk(1440);
  await go(page, '/pages/contact');
  await page.evaluate(() => { const p = document.querySelector('[data-rich-text] p') || document.querySelector('main p'); if (p) { p.scrollIntoView({ block: 'center' }); const s = getSelection(); s.removeAllRanges(); const r = document.createRange(); r.selectNodeContents(p); s.addRange(r); } });
  await sleep(300);
  const box = await page.evaluate(() => { const p = document.querySelector('[data-rich-text] p') || document.querySelector('main p'); const b = p && p.getBoundingClientRect(); return b && { x: b.x, y: b.y, width: Math.min(b.width, 700), height: Math.min(b.height, 60) }; });
  out.selection = { box };
  if (box) writeFileSync(outFile.replace(/\.json$/, '-sel.png'), await page.screenshot({ clip: box }));
  await ctx.close();
}
writeFileSync(outFile, JSON.stringify(out, null, 1));
await browser.close();
console.log('wrote', outFile);
