// T4c C4c.22 / Step 0 item 13: READ-ONLY probe of the LIVE storefront (plan section 5.13). Never pushes, edits or saves anything:
// GET pages, ONE storefront-password login per run, in-page CSSOM/DOM changes in this browser only. A fresh context logs in once at /password on
// the bare store domain (no preview_theme_id); nothing is cached. The password is read from docs/dev-fixtures.md inside this file and is never
// printed or written.
// Usage: node t4cc-liveprobe.mjs run [recorded.json] [--fallback] [--out file]
//   recorded.json: [{ "path": "...", "selector": "..." }] (Step 0's recorded containers; [] or omitted = none recorded)
// Every run discovers containers itself on the page set below and probes recorded + discovered. Outcomes: VALID-PASS, VALID-FAIL, INVALID.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from './t0-lib.mjs';

const ORIGIN = 'https://theme-evolution-os2.myshopify.com';
const LIVE_ID = 138872651872;
const PATHS = ['/', '/products/the-3p-fulfilled-snowboard', '/products/selling-plans-ski-wax', '/products/the-complete-snowboard', '/cart', '/pages/data-sharing-opt-out', '/policies/privacy-policy'];
const args = process.argv.slice(2);
const fallback = args.includes('--fallback');
const outFile = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const recPath = args.slice(1).find((a) => a.endsWith('.json') && a !== outFile);
const recorded = recPath ? JSON.parse(readFileSync(recPath, 'utf8')) : [];

const password = (readFileSync('docs/dev-fixtures.md', 'utf8').match(/^- Password:\s*(.+)$/m) || [])[1]?.trim();
if (!password) throw new Error('no password line in fixtures');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

async function login() {
  await page.goto(`${ORIGIN}/password`, { waitUntil: 'load' });
  const field = page.locator('form[action*="password"] input[name="password"]').first();
  await field.fill(password);
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}), field.press('Enter')]);
  return !page.url().includes('/password');
}
async function load(path) {
  await page.goto(`${ORIGIN}${path}`, { waitUntil: 'load' });
  let id = await page.evaluate(() => ({ id: window.Shopify?.theme?.id, role: window.Shopify?.theme?.role }));
  if (id.id !== LIVE_ID || id.role !== 'main') {
    await page.goto(`${ORIGIN}${path}${path.includes('?') ? '&' : '?'}preview_theme_id=`, { waitUntil: 'load' });
    id = await page.evaluate(() => ({ id: window.Shopify?.theme?.id, role: window.Shopify?.theme?.role }));
  }
  return { ...id, valid: id.id === LIVE_ID && id.role === 'main' };
}

const discoverFn = () => {
  const sel = (e) => { if (e.id) return '#' + CSS.escape(e.id); const c = [...e.classList].slice(0, 2).map((x) => '.' + CSS.escape(x)).join(''); return e.tagName.toLowerCase() + c; };
  const path = (e) => { const p = []; for (let n = e; n && n !== document.body && p.length < 4; n = n.parentElement) p.unshift(sel(n)); return p.join(' > '); };
  const cands = new Map();
  for (const e of document.querySelectorAll('[id^="shopify-block-"], [id*="supercycle" i], [class*="supercycle" i], [data-app], [class*="shopify-app-block"]')) cands.set(e, 'id/class');
  const scripts = [...document.querySelectorAll('script[src]')].map((s) => s.src).filter((s) => /supercycle|appsolve|app-embed|extensions/i.test(s)).map((s) => s.replace(/\?.*$/, '').slice(0, 120));
  const shadows = [...document.querySelectorAll('body *')].filter((e) => e.shadowRoot).length;
  return { scripts, shadows, candidates: [...cands].map(([e, why]) => ({ why, selector: e.id ? '#' + CSS.escape(e.id) : path(e), excerpt: e.outerHTML.slice(0, 300), lists: e.querySelectorAll('ul,ol,a').length })) };
};

const probeFn = async ({ selectors, fallback }) => {
  const res = { containers: {}, control: {}, rules: null, invalidReason: null };
  const els = (sel) => [...document.querySelectorAll(sel)];
  const snap = (root) => [...root.querySelectorAll('ul, ol, a')].map((e) => ({ tag: e.tagName.toLowerCase(), text: (e.textContent || '').trim().slice(0, 20), lst: getComputedStyle(e).listStyleType, pis: getComputedStyle(e).paddingInlineStart, td: getComputedStyle(e).textDecorationLine }));
  // Positive controls in body.
  const wrap = document.createElement('div');
  wrap.setAttribute('data-liveprobe-control', '');
  wrap.innerHTML = '<ul><li>x</li></ul><a href="#">x</a>';
  document.body.appendChild(wrap);
  const cul = wrap.querySelector('ul'), ca = wrap.querySelector('a');
  const ctl = () => ({ ul: { lst: getComputedStyle(cul).listStyleType, pis: getComputedStyle(cul).paddingInlineStart }, a: getComputedStyle(ca).textDecorationLine });
  const before = {}; for (const s of selectors) before[s] = els(s).flatMap((r) => snap(r));
  res.control.before = ctl();
  const link = [...document.querySelectorAll('link[rel=stylesheet]')].find((l) => /tailwind\.css/.test(l.href));
  if (!link) { res.invalidReason = 'no tailwind.css link'; return res; }
  const norm = (s) => s.replace(/\s*,\s*/g, ',');
  const base = [];
  const holderOf = new Map();
  const walk = (rules, layer, holder) => { for (const r of rules) { const t = r.constructor.name; if (t === 'CSSLayerBlockRule') walk(r.cssRules, [...layer, r.name], r); else if (t === 'CSSStyleRule' && layer.join('.') === 'base') { base.push(r); holderOf.set(r, holder); } } };
  const props = (r) => [...r.style];
  const pick = {
    pad: (r) => norm(r.selectorText) === 'ul:not([class]),ol:not([class])' && props(r).length === 1 && r.style.getPropertyValue('padding-inline-start') === '1.5em',
    ul: (r) => norm(r.selectorText) === 'ul:not([class])' && props(r).length > 0 && props(r).every((p) => p.startsWith('list-style')) && /list-style: (outside|disc|disc outside|outside disc);/.test(r.cssText),
    ol: (r) => norm(r.selectorText) === 'ol:not([class])' && props(r).length > 0 && props(r).every((p) => p.startsWith('list-style')) && r.style.getPropertyValue('list-style-type') === 'decimal',
    a: (r) => norm(r.selectorText) === 'a:not([class])' && props(r).length === 1 && r.style.getPropertyValue('text-decoration-line') === 'underline',
  };
  if (!fallback) {
    let rules;
    try { rules = link.sheet.cssRules; } catch (e) { res.invalidReason = 'cssRules unreadable: ' + e.name; return res; }
    walk(rules, [], null);
    const found = {}; for (const k of Object.keys(pick)) found[k] = base.filter(pick[k]);
    res.rules = Object.fromEntries(Object.entries(found).map(([k, v]) => [k, { count: v.length, text: v[0]?.cssText || null }]));
    if (Object.values(found).some((v) => v.length !== 1)) { res.invalidReason = 'not exactly one match per rule'; return res; }
    for (const k of Object.keys(found)) { const r = found[k][0]; const h = holderOf.get(r); h.deleteRule([...h.cssRules].indexOf(r)); }
  } else {
    const text = await (await fetch(link.href)).text();
    const strs = ['ul:not([class]),ol:not([class]){padding-inline-start:1.5em}', 'ul:not([class]){list-style:disc}', 'ol:not([class]){list-style:decimal}', 'a:not([class]){text-decoration-line:underline}'];
    const counts = strs.map((s) => text.split(s).length - 1);
    res.rules = { fallback: true, counts };
    if (counts.some((c) => c !== 1)) { res.invalidReason = 'fallback strings not exactly once each'; return res; }
    let t = text; for (const s of strs) t = t.replace(s, '');
    const st = document.createElement('style'); st.textContent = t; link.after(st); link.disabled = true;
  }
  await new Promise((r) => setTimeout(r, 100));
  res.control.after = ctl();
  res.controlFlipped = res.control.before.ul.lst === 'disc' && res.control.before.ul.pis === '24px' && res.control.after.ul.lst === 'none' && res.control.after.ul.pis === '0px' && res.control.before.a === 'underline' && res.control.after.a === 'none';
  if (!res.controlFlipped) res.invalidReason = 'positive controls did not flip: ' + JSON.stringify(res.control);
  for (const s of selectors) {
    const after = els(s).flatMap((r) => snap(r));
    res.containers[s] = { found: els(s).length, nBefore: before[s].length, nAfter: after.length, changed: before[s].map((b, i) => (after[i] && (b.lst !== after[i].lst || b.td !== after[i].td) ? { ...b, after: { lst: after[i].lst, td: after[i].td } } : null)).filter(Boolean) };
  }
  return res;
};

const log = [];
const say = (...a) => { const s = a.join(' '); log.push(s); console.log(s); };
let exit = 2;
if (!(await login())) { say('INVALID: login did not leave /password'); await browser.close(); process.exit(2); }

// Step 3: discover on every run.
const discovered = {};
let invalid = false;
for (const p of PATHS) {
  const id = await load(p);
  say('PAGE', p, JSON.stringify(id));
  if (!id.valid) { invalid = true; say('  INVALID: theme id/role mismatch'); continue; }
  await page.waitForTimeout(1500);
  const d = await page.evaluate(discoverFn);
  discovered[p] = d;
  say('  discover:', d.candidates.length ? JSON.stringify(d.candidates) : 'none', '| scripts', d.scripts.length, '| shadow hosts', d.shadows);
}
const newlyFound = [];
const targets = recorded.map((t) => ({ ...t, recorded: true }));
for (const [p, d] of Object.entries(discovered)) for (const c of d.candidates) {
  if (!targets.some((t) => t.path === p && t.selector === c.selector)) { targets.push({ path: p, selector: c.selector, recorded: false }); newlyFound.push({ path: p, selector: c.selector, excerpt: c.excerpt }); }
}
if (newlyFound.length) say('NEW containers (not recorded at Step 0):', JSON.stringify(newlyFound));
// Step 4-7: probe. Control-only on the wax page when there are no targets.
const probes = targets.length ? targets : [{ path: '/products/selling-plans-ski-wax', selector: null, recorded: false }];
let fail = false;
const byPath = {};
for (const t of probes) (byPath[t.path] ||= []).push(t);
for (const [p, ts] of Object.entries(byPath)) {
  const id = await load(p);
  if (!id.valid) { invalid = true; say('INVALID', p, JSON.stringify(id)); continue; }
  await page.waitForTimeout(1500);
  const r = await page.evaluate(probeFn, { selectors: ts.map((t) => t.selector).filter(Boolean), fallback });
  say('RESULT', p, JSON.stringify(r));
  if (r.invalidReason) { invalid = true; continue; }
  for (const t of ts.filter((x) => x.selector)) {
    const c = r.containers[t.selector];
    if (!c || c.found === 0) { if (t.recorded) { fail = true; say('  FAIL: recorded container missing', t.selector); } else { invalid = true; } continue; }
    if (c.changed.length) { fail = true; say('  FAIL: changed inside', t.selector, JSON.stringify(c.changed)); }
  }
}
const outcome = invalid ? 'INVALID' : fail ? 'VALID-FAIL' : 'VALID-PASS';
say('OUTCOME', outcome, targets.length ? `(${targets.length} target containers)` : '(no embed found by this run\'s theme-verified discovery; control-only probe)');
if (outFile) writeFileSync(outFile, log.join('\n') + '\n');
await browser.close();
process.exit(outcome === 'VALID-PASS' ? 0 : outcome === 'VALID-FAIL' ? 1 : 2);
