// T4c parity sweep (Step 0 item 7, C4c.14, C4c.15). Every displayed ul, ol and a, classed or not, with list-style-type, padding-inline-start,
// text-decoration-line and where it sits. `sweep` writes JSON; `diff` compares two labels.
// Usage: node t4cc-sweep.mjs <previewBase> sweep <label>     Output: docs/qa/evidence/t4cc-sweep-<label>.json
//        node t4cc-sweep.mjs - diff <baseLabel> <headLabel>
import { writeFileSync, readFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t4cc-lib.mjs';

const mode = process.argv[3];
const PAGES = [['optout', '/pages/data-sharing-opt-out'], ['page2', '/pages/the-balanced-face-test-page'], ['contact', '/pages/contact'], ['archive', '/pages/the-material-archive'],
  ['p3p', '/products/the-3p-fulfilled-snowboard'], ['wax', '/products/selling-plans-ski-wax'], ['snow', '/products/the-complete-snowboard'], ['policy', '/policies/privacy-policy'],
  ['home', '/'], ['cart', '/cart'], ['collection', '/collections/all'], ['collections', '/collections'], ['search', '/search?q=snowboard'], ['blog', '/blogs/news'], ['404', '/pages/tailwind-qa-missing']];

const listFn = () => {
  const where = (e) => {
    if (e.closest('#preview-bar-iframe')) return 'preview';
    if (e.closest('[id^="shopify-block-"]')) return 'app-block';
    if (e.closest('[data-rich-text]')) return 'rich-text';
    if (e.closest('.shopify-policy__body')) return 'policy';
    if (e.closest('.theme-evolution-footer__about-text')) return 'footer-about';
    if (e.closest('cart-drawer')) return 'drawer';
    if (e.closest('form') && e.closest('ul') && e.closest('.errors')) return 'form-errors';
    if (e.closest('[id^="shopify-section-footer"], footer')) return 'footer';
    if (e.closest('[id^="shopify-section-header"], header')) return 'header';
    return 'theme';
  };
  const out = [];
  for (const e of document.querySelectorAll('ul, ol, a')) {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const w = where(e);
    if (w === 'preview') continue;
    // drawer elements count only while the drawer is open
    out.push({ tag: e.tagName.toLowerCase(), classed: e.hasAttribute('class') && e.getAttribute('class').trim() !== '', text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30), where: w, lst: cs.listStyleType, pis: cs.paddingInlineStart, pl: cs.paddingLeft, lsp: cs.listStylePosition, td: cs.textDecorationLine, w: Math.round(e.getBoundingClientRect().width) });
  }
  return out;
};

if (mode === 'diff') {
  const [, , , a, b] = process.argv.slice(2).concat([]);
  const [base, head] = [process.argv[4], process.argv[5]].map((l) => JSON.parse(readFileSync(`docs/qa/evidence/t4cc-sweep-${l}.json`, 'utf8')));
  let bad = 0; let compared = 0;
  const skipWhere = new Set(['rich-text', 'policy']);
  for (const key of Object.keys(base)) {
    const x = base[key].filter((e) => !skipWhere.has(e.where)); const y = (head[key] || []).filter((e) => !skipWhere.has(e.where));
    if (x.length !== y.length) { console.log('COUNT', key, x.length, y.length); bad++; }
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
      compared++;
      const p = x[i], q = y[i];
      if (p.tag !== q.tag || p.text !== q.text) { console.log('PAIR', key, i, p.tag, p.text, '|', q.tag, q.text); bad++; continue; }
      if (p.lst !== q.lst || Math.abs(parseFloat(p.pis) - parseFloat(q.pis)) > 1 || p.td !== q.td) { console.log('DIFF', key, p.where, p.tag, JSON.stringify(p.text), p.lst, p.pis, p.td, '->', q.lst, q.pis, q.td); bad++; }
    }
  }
  console.log(`compared ${compared} elements; ${bad} problems`);
  process.exit(bad ? 1 : 0);
}

const { withTheme } = parseArgs();
const label = process.argv[4];
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
const results = {};
for (const vw of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
  for (const [name, path] of PAGES) {
    await page.goto(withTheme(path), { waitUntil: 'load' });
    await sleep(name === 'optout' ? 2500 : 500);
    results[`${name}-${vw}`] = await page.evaluate(listFn);
  }
  // Cart drawer open on `/`: seed a cart through the product form, then open the drawer from the header.
  await page.goto(withTheme('/products/selling-plans-ski-wax'), { waitUntil: 'load' });
  await Promise.all([page.waitForResponse((r) => /\/cart\/add/.test(r.url())), page.locator('button[name="add"]').first().click()]);
  await sleep(1200);
  await page.goto(withTheme('/'), { waitUntil: 'load' });
  await sleep(500);
  await page.locator('[data-header-cart-icon]').first().click().catch(() => {});
  await sleep(1000);
  const open = await page.evaluate(() => document.querySelector('cart-drawer')?.getAttribute('data-state'));
  results[`drawer-${vw}`] = open === 'open' ? await page.evaluate(listFn) : [];
  results[`drawer-${vw}`].meta = open;
  console.log(vw, 'drawer state', open, 'elements', results[`drawer-${vw}`].length);
  // Fresh context without consent cookies (review N12) happens once at 375 below.
  await ctx.close();
}
{
  const ctx = await browser.newContext({ storageState: state, viewport: { width: 375, height: 812 } });
  await ctx.clearCookies({ name: /cookie|consent|_tracking_consent|_cmp/i });
  const page = await ctx.newPage();
  await page.goto(withTheme('/'), { waitUntil: 'load' });
  await sleep(1500);
  results['fresh-375'] = await page.evaluate(listFn);
  await ctx.close();
}
await browser.close();
writeFileSync(`docs/qa/evidence/t4cc-sweep-${label}.json`, JSON.stringify(results, null, 1));
const un = {};
for (const [k, v] of Object.entries(results)) for (const e of v) if (!e.classed && !['rich-text', 'policy'].includes(e.where)) un[`${e.where}|${e.tag}|${e.text}`] = (un[`${e.where}|${e.tag}|${e.text}`] || 0) + 1;
console.log('UNCLASSED outside rich text and policy body (where|tag|text: pages):');
for (const [k, n] of Object.entries(un)) console.log('  ', k, n);
