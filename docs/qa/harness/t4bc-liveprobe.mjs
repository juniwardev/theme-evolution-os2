// T4b C4b.29 / Step 0 item 16: READ-ONLY probe of the LIVE storefront (plan section 5.17, steps 1-7).
// Never pushes, edits or saves anything: GET pages, one storefront-password login, in-page CSSOM/DOM changes in this browser only.
// A fresh context logs in once at /password on the bare store domain (no preview_theme_id); nothing is cached. The password is read
// from docs/dev-fixtures.md inside this file and is never printed or written.
// Usage:
//   node t4bc-liveprobe.mjs discover <path>...            list candidate app-embed containers on each page (Step 0 item 16)
//   node t4bc-liveprobe.mjs probe <targets.json> [--fallback]   targets: [{ "path": "...", "selector": "..." }] or [] for "no embed"
// Outcomes: VALID-PASS, VALID-FAIL or INVALID (re-run). Exit code 0 only for VALID-PASS.
import { readFileSync } from 'node:fs';
import { chromium } from './t0-lib.mjs';

const ORIGIN = 'https://theme-evolution-os2.myshopify.com';
const LIVE_ID = 138872651872;
const D6_EXACT = 'input:where(:not([type=checkbox],[type=radio],[type=hidden])),select,textarea{border-width:1px}';
const [mode, ...rest] = process.argv.slice(2);

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
    // preview persisted by cookie: leave it once with an empty preview_theme_id
    await page.goto(`${ORIGIN}${path}${path.includes('?') ? '&' : '?'}preview_theme_id=`, { waitUntil: 'load' });
    id = await page.evaluate(() => ({ id: window.Shopify?.theme?.id, role: window.Shopify?.theme?.role }));
  }
  return { ...id, valid: id.id === LIVE_ID && id.role === 'main' };
}

// In page: cssPath of an element, short.
const discoverFn = () => {
  const sel = (e) => { if (e.id) return '#' + CSS.escape(e.id); const c = [...e.classList].slice(0, 2).map((x) => '.' + CSS.escape(x)).join(''); return e.tagName.toLowerCase() + c; };
  const path = (e) => { const p = []; for (let n = e; n && n !== document.body && p.length < 4; n = n.parentElement) p.unshift(sel(n)); return p.join(' > '); };
  const controls = [...document.querySelectorAll('input, select, textarea')].filter((e) => !['hidden', 'checkbox', 'radio'].includes(e.type));
  const cands = new Map();
  const add = (e, why) => { if (!cands.has(e)) cands.set(e, why); };
  for (const e of document.querySelectorAll('[id^="shopify-block-"], [id*="supercycle" i], [class*="supercycle" i], [data-app], [class*="shopify-app-block"]')) add(e, 'id/class');
  for (const c of controls) { const host = c.closest('[id^="shopify-block-"], [id*="supercycle" i], [class*="supercycle" i], [class*="shopify-app-block"]'); if (host) add(host, 'control host'); }
  const scripts = [...document.querySelectorAll('script[src]')].map((s) => s.src).filter((s) => /supercycle|appsolve|app-embed|extensions/i.test(s)).map((s) => s.replace(/\?.*$/, '').slice(0, 120));
  return {
    scripts,
    candidates: [...cands].map(([e, why]) => ({ why, selector: path(e), id: e.id, excerpt: e.outerHTML.slice(0, 300), controls: [...e.querySelectorAll('input, select, textarea')].filter((x) => !['hidden', 'checkbox', 'radio'].includes(x.type)).length })),
    controls: controls.map((c) => ({ tag: c.tagName.toLowerCase(), type: c.type, name: c.name || null, bw: getComputedStyle(c).borderTopWidth, where: path(c.parentElement) })),
  };
};

// In page: C4b.29 steps 4-7. target.selector is the recorded embed container; null selector = no-embed run (control only).
const probeFn = async ({ selector, fallback, d6Exact }) => {
  const res = { selector, containerFound: null, control: {}, embed: [], match: null, invalidReason: null };
  const container = selector ? document.querySelector(selector) : null;
  res.containerFound = selector ? !!container : null;
  const ctl = document.createElement('input');
  ctl.type = 'text';
  ctl.setAttribute('data-liveprobe-control', '');
  document.body.appendChild(ctl);
  const embedControls = () => (container ? [...container.querySelectorAll('input, select, textarea')].filter((x) => !['hidden', 'checkbox', 'radio'].includes(x.type)) : []);
  const widths = () => ({ control: getComputedStyle(ctl).borderTopWidth, embed: embedControls().map((x) => ({ tag: x.tagName.toLowerCase(), type: x.type, name: x.name || null, bw: getComputedStyle(x).borderTopWidth })) });
  const before = widths();
  const link = [...document.querySelectorAll('link[rel=stylesheet]')].find((l) => /tailwind\.css/.test(l.href));
  if (!link) { res.invalidReason = 'no tailwind.css link'; return res; }
  const walkFind = (rules, out, layer) => {
    for (const r of rules) {
      const t = r.constructor.name;
      if (t === 'CSSLayerBlockRule') walkFind(r.cssRules, out, [...layer, r.name]);
      else if (t === 'CSSStyleRule' && layer.join('.') === 'base') out.push(r);
      else if (r.cssRules && t !== 'CSSStyleRule') walkFind(r.cssRules, out, layer);
    }
  };
  let method = 'cssom';
  if (!fallback) {
    let rules;
    try { rules = link.sheet.cssRules; } catch (e) { res.invalidReason = 'cssRules unreadable: ' + e.name; return res; }
    const baseRules = [];
    walkFind(rules, baseRules, []);
    const matches = baseRules.filter((r) => {
      const s = r.selectorText;
      if (!(s.includes('input:where(') && s.includes('select') && s.includes('textarea'))) return false;
      const props = [...r.style];
      return props.length > 0 && props.every((p) => /^border-(top|right|bottom|left)-width$/.test(p)) && r.style.getPropertyValue('border-top-width') === '1px';
    });
    res.match = { count: matches.length, selectorText: matches[0]?.selectorText || null, cssText: matches[0]?.cssText || null };
    if (matches.length !== 1) { res.invalidReason = `matched ${matches.length} rules`; return res; }
    // delete it from its parent (the base layer block)
    let parent = null;
    const findParent = (rs, layer) => { for (const r of rs) { const t = r.constructor.name; if (t === 'CSSLayerBlockRule') { if (findParent(r.cssRules, [...layer, r.name])) return true; } else if (r === matches[0]) { parent = rs.__owner; return true; } } return false; };
    // CSSRuleList has no owner link: locate the layer block holding the rule
    const holder = (rs, layer) => { for (const r of rs) { if (r.constructor.name === 'CSSLayerBlockRule') { if ([...r.cssRules].includes(matches[0])) return r; const h = holder(r.cssRules, layer); if (h) return h; } } return null; };
    const h = holder(rules, []);
    if (!h) { res.invalidReason = 'rule holder not found'; return res; }
    h.deleteRule([...h.cssRules].indexOf(matches[0]));
  } else {
    method = 'fallback';
    const text = await (await fetch(link.href)).text();
    const count = text.split(d6Exact).length - 1;
    res.match = { count, exact: true };
    if (count !== 1) { res.invalidReason = `exact string occurs ${count} times`; return res; }
    const style = document.createElement('style');
    style.textContent = text.replace(d6Exact, '');
    link.after(style);
    link.disabled = true;
  }
  await new Promise((r) => setTimeout(r, 100));
  const after = widths();
  res.method = method;
  res.before = before;
  res.after = after;
  res.controlWentTo0 = before.control === '1px' && after.control === '0px';
  if (!res.controlWentTo0) res.invalidReason = `positive control ${before.control} -> ${after.control}`;
  return res;
};

let exit = 0;
if (!(await login())) { console.log('INVALID: login did not leave /password'); await browser.close(); process.exit(2); }

if (mode === 'discover') {
  for (const path of rest) {
    const id = await load(path);
    console.log('PAGE', path, JSON.stringify(id));
    if (!id.valid) { console.log('  INVALID: theme id/role mismatch'); exit = 2; continue; }
    await page.waitForTimeout(1500);
    console.log('  ', JSON.stringify(await page.evaluate(discoverFn)));
  }
} else if (mode === 'probe') {
  const targets = JSON.parse(readFileSync(rest[0], 'utf8'));
  const fallback = rest.includes('--fallback');
  const noEmbed = targets.length === 0;
  const list = noEmbed ? [{ path: '/products/selling-plans-ski-wax', selector: null }] : targets;
  let validPass = true, anyInvalid = false;
  for (const t of list) {
    const id = await load(t.path);
    if (!id.valid) { console.log('INVALID', t.path, 'theme', JSON.stringify(id)); anyInvalid = true; continue; }
    await page.waitForTimeout(1500);
    const r = await page.evaluate(probeFn, { selector: t.selector, fallback, d6Exact: D6_EXACT });
    console.log('RESULT', t.path, JSON.stringify(r));
    if (r.invalidReason) { anyInvalid = true; continue; }
    if (t.selector && !r.containerFound) { validPass = false; console.log('  FAIL: recorded container not found'); }
    const drops = (r.before.embed || []).filter((b, i) => b.bw !== '0px' && parseFloat(b.bw) >= 1 && r.after.embed[i]?.bw === '0px');
    if (drops.length) { validPass = false; console.log('  FAIL: embed controls 1 -> 0:', JSON.stringify(drops)); }
  }
  const outcome = anyInvalid ? 'INVALID' : validPass ? 'VALID-PASS' : 'VALID-FAIL';
  console.log('OUTCOME', outcome, noEmbed ? '(no embed recorded; control-only run)' : '');
  exit = outcome === 'VALID-PASS' ? 0 : outcome === 'VALID-FAIL' ? 1 : 2;
}
await browser.close();
process.exit(exit);
