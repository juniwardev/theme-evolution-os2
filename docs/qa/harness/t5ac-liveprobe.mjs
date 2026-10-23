// T5a C5a.25 / Step 0 item 14: READ-ONLY probe of the LIVE storefront (plan section 5.11). Never pushes, edits or saves anything on the store:
// GET pages, ONE storefront-password login per run (fresh context, bare store domain, no preview_theme_id, nothing cached), in-page CSSOM/DOM changes in
// this browser only. The password is read inside t0-lib.mjs and never printed or written by this file.
// Usage: node t5ac-liveprobe.mjs run <reference.json> [--out file]
//   reference.json: [{cont, rel, prop, on, off, pseudo}] from Step 0's TOG on the dev theme (t5ac-ref.mjs), plus "pages" -> see below
// Outcomes: VALID-PASS, VALID-FAIL, INVALID (re-run INVALID; never counted).
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium, loginState as t0LoginState } from './t0-lib.mjs';

const ORIGIN = 'https://theme-evolution-os2.myshopify.com';
const LIVE_ID = 138872651872;
const PATHS = ['/', '/products/the-3p-fulfilled-snowboard', '/products/selling-plans-ski-wax', '/products/the-complete-snowboard', '/cart', '/collections/all', '/search?q=snowboard', '/pages/data-sharing-opt-out', '/pages/the-material-archive', '/blogs/news', '/policies/privacy-policy', '/pages/tailwind-qa-missing'];
const args = process.argv.slice(2);
const outFile = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const refPath = args.slice(1).find((a) => a.endsWith('.json'));
const ref = refPath ? JSON.parse(readFileSync(refPath, 'utf8')) : { entries: [], containers: [] };
const refKey = (e) => [e.cont, e.rel, e.prop, e.on, e.off, e.pseudo || ''].join('␟');
const refSet = new Set(ref.entries.map(refKey));

const log = [];
const say = (...a) => { const s = a.join(' '); log.push(s); console.log(s); };

const browser = await chromium.launch();
// One fresh login on the bare domain (t0-lib reads the password; no cache, no preview id).
const login = await t0LoginState(browser, (p) => `${ORIGIN}${p}`);
if (!login.loggedIn) { say('INVALID: login did not leave /password'); await browser.close(); process.exit(2); }
const ctx = await browser.newContext({ storageState: login.state, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

async function load(path) {
  await page.goto(`${ORIGIN}${path}`, { waitUntil: 'load' });
  let id = await page.evaluate(() => ({ id: window.Shopify?.theme?.id, role: window.Shopify?.theme?.role }));
  return { ...id, valid: id.id === LIVE_ID && id.role === 'main' };
}

// In-page: settle, controls, snapshot every element of every outermost container, disable base.css, snapshot again, diff.
const probeFn = async () => {
  const sleepP = (ms) => new Promise((r) => setTimeout(r, ms));
  const frames = async (n) => { for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r)); };
  const res = { invalidReason: null, containers: [] };
  try { await document.fonts.ready; } catch {}
  for (const img of document.images) { img.loading = 'eager'; try { await img.decode(); } catch {} }
  const H = Math.max(document.documentElement.scrollHeight, 1), stp = Math.max(innerHeight - 50, 200);
  for (let y = 0; y < H; y += stp) { scrollTo(0, y); await sleepP(60); }
  scrollTo(0, document.documentElement.scrollHeight); await sleepP(60); scrollTo(0, 0);
  const rec = document.querySelector('product-recommendations');
  if (rec) { const t0 = Date.now(); while (Date.now() - t0 < 10000 && !rec.querySelector('li')) await sleepP(200); }
  await sleepP(1000);
  document.getAnimations().forEach((a) => a.pause());
  const c1 = document.createElement('div'); c1.setAttribute('data-t5-ctl', '');
  const c2 = document.createElement('h6'); c2.setAttribute('data-t5-ctl2', ''); c2.textContent = 'x';
  document.body.append(c1, c2);
  const links = [...document.querySelectorAll('link[rel=stylesheet]')].filter((l) => /\/assets\/base\.css/.test(l.href));
  if (links.length !== 1) { res.invalidReason = 'base.css links: ' + links.length; return res; }
  const link = links[0];
  try { link.sheet.cssRules.length; } catch (e) { res.invalidReason = 'sheet unreadable ' + e.name; return res; }
  const OWN = '#pc--optOutFormContainer, .pc--show-email-field, .shopify-payment-button, shopify-accelerated-checkout, shopify-accelerated-checkout-cart, .shopify-policy__container, .shopify-challenge__container, [id^="shopify-pc__"], [class*="shopify-pc__"], [id^="shopify-block-"], [id*="app-embed"], [data-app], [id*="supercycle" i], [class*="supercycle" i], body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])';
  const outermost = [...document.querySelectorAll(OWN)].filter((e) => !e.parentElement?.closest(OWN));
  const csel = (e) => { if (e.matches('body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])')) return 'body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])'; if (e.id) return '#' + CSS.escape(e.id); const c = [...e.classList].slice(0, 2).map((x) => '.' + CSS.escape(x)).join(''); return e.tagName.toLowerCase() + c; };
  const keyOf = (el, stop) => { const parts = []; for (let n = el; n && n.nodeType === 1 && n !== stop; n = n.parentElement) { let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++; parts.unshift(n.tagName.toLowerCase() + ':' + i); } return parts.join('>'); };
  const names = []; const pb = getComputedStyle(document.body);
  for (let i = 0; i < pb.length; i++) if (!pb[i].startsWith('--')) names.push(pb[i]);
  const read = (cs) => names.map((n) => cs.getPropertyValue(n));
  const snap = () => outermost.map((root) => [root, ...root.querySelectorAll('*')].map((el) => {
    const o = { el, p: read(getComputedStyle(el)), b: read(getComputedStyle(el, '::before')), a: read(getComputedStyle(el, '::after')) };
    if (/^shopify-accelerated-checkout/.test(el.tagName.toLowerCase())) { o.cp = {}; const cs = getComputedStyle(el); for (let i = 0; i < cs.length; i++) if (cs[i].startsWith('--shopify-')) o.cp[cs[i]] = cs.getPropertyValue(cs[i]); }
    return o;
  }));
  snap(); await sleepP(300);
  const S1 = snap();
  const c1on = getComputedStyle(c1).display, c2on = parseFloat(getComputedStyle(c2).marginTop), fs = parseFloat(getComputedStyle(c2).fontSize);
  link.sheet.disabled = true;
  document.getAnimations().filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming?.().endTime)).forEach((a) => { try { a.finish(); } catch {} });
  await frames(2);
  const S2 = snap();
  const c1off = getComputedStyle(c1).display, c2off = getComputedStyle(c2).marginTop;
  link.sheet.disabled = false; await frames(2);
  res.controls = { c1on, c1off, c2on, fs, c2off };
  if (c1on !== 'none' || c1off !== 'block' || Math.abs(c2on - 1.67 * fs) > 0.2 || c2off !== '0px') { res.invalidReason = 'positive controls did not flip: ' + JSON.stringify(res.controls); return res; }
  const SZ = new Set(['width', 'height', 'inline-size', 'block-size', 'top', 'right', 'bottom', 'left', 'inset-block-start', 'inset-block-end', 'inset-inline-start', 'inset-inline-end', 'transform-origin', 'perspective-origin', 'grid-template-rows', 'grid-template-columns']);
  outermost.forEach((root, ci) => {
    const ents = [];
    S1[ci].forEach((a, i) => {
      const b = S2[ci][i];
      const rel = a.el === root ? '' : keyOf(a.el, root);
      for (const [pk, ps] of [['p', ''], ['b', '::before'], ['a', '::after']]) for (let j = 0; j < names.length; j++) if (a[pk][j] !== b[pk][j]) ents.push({ rel, tag: a.el.tagName.toLowerCase(), pseudo: ps, prop: names[j], on: a[pk][j], off: b[pk][j], sz: SZ.has(names[j]) });
      if (a.cp) for (const n of Object.keys(a.cp)) if (a.cp[n] !== b.cp?.[n]) ents.push({ rel, tag: a.el.tagName.toLowerCase(), pseudo: '', prop: n, on: a.cp[n], off: b.cp?.[n], sz: false });
    });
    res.containers.push({ cont: csel(root), n: S1[ci].length, excerpt: root.outerHTML.slice(0, 300), entries: ents });
  });
  return res;
};

let invalid = false, fail = false;
const seen = [];
for (const p of PATHS) {
  const id = await load(p);
  say('PAGE', p, JSON.stringify(id));
  if (!id.valid) { invalid = true; say('  INVALID: theme id/role mismatch (re-run)'); continue; }
  const r = await page.evaluate(probeFn);
  if (r.invalidReason) { invalid = true; say('  INVALID:', r.invalidReason); continue; }
  say('  controls', JSON.stringify(r.controls), '| containers', r.containers.length);
  for (const c of r.containers) {
    const root = c.entries.filter((e) => !e.sz), sz = c.entries.filter((e) => e.sz);
    const unmatched = root.filter((e) => !refSet.has(refKey({ cont: c.cont, ...e })));
    const known = ref.containers.includes(c.cont);
    const nMatched = root.length - unmatched.length;
    let verdict = 'ok';
    if (unmatched.length) verdict = 'FAIL';
    else if (sz.length && nMatched === 0) verdict = 'FAIL (size differences with no matched root cause)';
    say(`  container ${c.cont} ${known ? '(recorded)' : '(NEW, not in Step 0)'} els=${c.n} rootDiffs=${root.length} matched=${nMatched} sizeDiffs=${sz.length} -> ${verdict}`);
    if (!known) say('    new container excerpt:', c.excerpt.replace(/\s+/g, ' '));
    if (verdict !== 'ok') { fail = true; for (const u of unmatched.slice(0, 20)) say('    UNMATCHED', JSON.stringify(u)); }
    seen.push(`${p}::${c.cont}`);
  }
}
// Every recorded container must have been found on at least one page.
for (const c of ref.containers) if (!seen.some((s) => s.endsWith('::' + c))) { fail = true; say('FAIL: recorded container never found:', c); }
const outcome = invalid ? 'INVALID' : fail ? 'VALID-FAIL' : 'VALID-PASS';
say('OUTCOME', outcome);
if (outFile) writeFileSync(outFile, log.join('\n') + '\n');
await browser.close();
process.exit(outcome === 'VALID-PASS' ? 0 : outcome === 'VALID-FAIL' ? 1 : 2);
