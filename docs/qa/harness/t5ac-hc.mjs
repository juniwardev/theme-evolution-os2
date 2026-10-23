// T5a Step 0 item 7a / C5a.14(e): hCaptcha popup parts, hit test and overflow, base.css on (reference) then off, in ONE load per width.
// Usage: node t5ac-hc.mjs <previewBase> <label> [widths]   Output: docs/qa/evidence/t5ac-hc-<label>.json (+ verdict lines)
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, settleFn, W_SW } from './t5ac-lib.mjs';
const [, label, widthsArg] = process.argv.slice(2);
const widths = widthsArg ? widthsArg.split(',').map(Number) : W_SW;
const HC = 'body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');

const readFn = async ({ HC, hit }) => {
  const frames = async (n) => { for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r)); };
  const cont = document.querySelector(HC);
  const out = { container: !!cont };
  const desc = (e) => e ? `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${String(e.className?.baseVal ?? e.className).slice(0, 30)}` : null;
  if (cont) out.empties = [...cont.querySelectorAll('div')].filter((d) => d.matches(':empty')).map((d) => { const cs = getComputedStyle(d), r = d.getBoundingClientRect(); return { style: d.getAttribute('style'), display: cs.display, position: cs.position, visibility: cs.visibility, opacity: cs.opacity, pe: cs.pointerEvents, z: cs.zIndex, r: [r.x, r.y, r.width, r.height].map((x) => Math.round(x)) }; });
  if (hit) {
    out.hits = {};
    for (const [name, sel] of [['checkbox', '#pc--show-email-field'], ['button', '#pc--optOutFormContainer button'], ['cart', '[data-header-cart-icon]']]) {
      const t = document.querySelector(sel);
      if (!t) { out.hits[name] = { missing: true }; continue; }
      t.scrollIntoView({ block: 'center' }); await frames(2);
      const r = t.getBoundingClientRect();
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      const e = document.elementFromPoint(x, y);
      out.hits[name] = { point: [Math.round(x), Math.round(y)], got: desc(e), inContainer: !!(cont && e && cont.contains(e)), isTargetOrDesc: !!(e && (t === e || t.contains(e))) };
    }
    window.scrollTo(0, 0);
  }
  const vw = document.documentElement.clientWidth;
  const off = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    if (b.right > vw + 1 || b.left < -1) {
      if (el.closest('[id^="shopify-block-"], #preview-bar-iframe, #PBarNextFrameWrapper')) continue;
      let clipped = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).overflowX !== 'visible' && a.getBoundingClientRect().right <= vw + 1) { clipped = true; break; }
      if (clipped) continue;
      off.push(`${desc(el)}${cont && cont.contains(el) ? ' [HC]' : ''}`);
    }
  }
  out.xPage = document.documentElement.scrollWidth - vw; out.offenders = off.slice(0, 20);
  return out;
};

const res = [];
let fallback = false, stop = false;
for (const w of widths) {
  const { ctx, page } = await newPage(browser, state, w, 812);
  await page.goto(withTheme('/pages/data-sharing-opt-out'), { waitUntil: 'load' });
  await page.waitForSelector(HC, { state: 'attached', timeout: 10000 }).catch(() => {});
  await page.evaluate(settleFn, {});
  const hit = w === 375 || w === 1440;
  const ref = await page.evaluate(readFn, { HC, hit });
  const ctl = await page.evaluate(() => { const d = document.createElement('div'); document.body.append(d); const v = getComputedStyle(d).display; d.remove(); return v; });
  await page.evaluate(() => { const l = [...document.querySelectorAll('link[rel=stylesheet]')].find((x) => /\/assets\/base\.css/.test(x.href)); l.sheet.disabled = true; document.getAnimations().filter((a) => a.playState === 'running').forEach((a) => { try { a.finish(); } catch {} }); });
  await sleep(300);
  const ctl2 = await page.evaluate(() => { const d = document.createElement('div'); document.body.append(d); const v = getComputedStyle(d).display; d.remove(); return v; });
  const off = await page.evaluate(readFn, { HC, hit });
  const v = { w, ctlOn: ctl, ctlOff: ctl2, valid: ctl === 'none' && ctl2 === 'block' && ref.container && (ref.empties?.length || 0) >= 1 && off.container, ref, off, verdict: [] };
  if (hit && v.valid) for (const name of ['checkbox', 'button', 'cart']) {
    const a = ref.hits[name], b = off.hits[name];
    if (a.missing || b.missing) { v.verdict.push(`${name}: missing target`); continue; }
    if (b.inContainer) { v.verdict.push(`${name}: OFF returns an element inside hCaptcha's container (clause ii) -> FALLBACK`); fallback = true; }
    else if (a.got !== b.got) { v.verdict.push(`${name}: reference ${a.got} vs off ${b.got}, outside container -> UNEXPLAINED (stop)`); stop = true; }
    else v.verdict.push(`${name}: same element on and off (${a.got}; base target-or-descendant: ${a.isTargetOrDesc})`);
  }
  const refSet = new Set(ref.offenders);
  const newOff = off.offenders.filter((o) => !refSet.has(o));
  if (newOff.length) { for (const o of newOff) { if (o.includes('[HC]')) { v.verdict.push('new offender inside container: ' + o + ' -> FALLBACK'); fallback = true; } else { v.verdict.push('new offender outside container: ' + o + ' -> UNEXPLAINED (stop)'); stop = true; } } }
  v.verdict.push(`X_page on ${ref.xPage} off ${off.xPage}; offenders on ${ref.offenders.length} off ${off.offenders.length}`);
  res.push(v);
  console.log(w, v.valid ? 'valid' : 'INVALID', JSON.stringify({ ctl, ctl2, verdict: v.verdict }));
  await ctx.close(); await sleep(700);
}
console.log('FALLBACK(D5a.21):', fallback, 'STOP:', stop, 'INVALID RUNS:', res.filter((r) => !r.valid).length);
writeFileSync(`docs/qa/evidence/t5ac-hc-${label}.json`, JSON.stringify({ fallback, stop, res }, null, 1));
await browser.close();
