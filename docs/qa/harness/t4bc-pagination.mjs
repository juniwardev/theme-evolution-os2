// T4b Step 0 item 6 / C4b.9 (PX1): pagination markup on collection and search (page size 2) at page 1, a middle page and the last.
// Works on base (default_pagination) and head (snippets/pagination.liquid). Usage: node t4bc-pagination.mjs <previewBase> <label>
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t4bc-lib.mjs';
const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const { ctx, page } = await newPage(browser, state, 1440, 900);
const out = { label, lists: {} };
const norm = (h) => h.replace(/^https?:\/\/[^/]+/, '').replace(/[?&]preview_theme_id=\d*/, '').replace(/\?&/, '?');
const grab = () => page.evaluate(() => {
  const root = document.querySelector('[id^="shopify-section-template"][id$="__main"]');
  const nav = root.querySelector('nav[data-pagination], nav.pagination, .pagination, nav[aria-label="Pagination"], [class*="pagination"]');
  if (!nav) {
    // base: default_pagination prints bare spans (.page, .current, .next, .prev, .deco) directly in the section
    const a = [...root.querySelectorAll('a[href*="page="]')];
    const cur = [...root.querySelectorAll('.page.current, .current')].map((e) => ({ attr: null, text: e.textContent.trim() }));
    if (!a.length && !cur.length) return { present: false, hrefs: [], cur: [], tgt: [], text: '' };
    return { present: true, tag: 'none (spans)', hasHook: false, ariaLabel: null, hrefs: a.map((x) => x.getAttribute('href')), cur, tgt: a.map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; }), html: '', text: [...root.querySelectorAll('.page, .next, .prev, .deco')].map((e) => e.textContent.trim()).join(' ') };
  }
  const hrefs = [...nav.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
  const cur = [...nav.querySelectorAll('[aria-current]')].map((e) => ({ attr: e.getAttribute('aria-current'), text: e.textContent.trim() }));
  const tgt = [...nav.querySelectorAll('a, [aria-current]')].map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; });
  return { present: true, tag: nav.tagName.toLowerCase(), hasHook: nav.hasAttribute('data-pagination'), ariaLabel: nav.getAttribute('aria-label'), hrefs, cur, tgt, html: nav.outerHTML.slice(0, 700), text: nav.textContent.replace(/\s+/g, ' ').trim() };
});
for (const [name, base, pageSize] of [['collection', '/collections/all', 2], ['search', '/search?q=snowboard', 2]]) {
  out.lists[name] = {};
  const sep = base.includes('?') ? '&' : '?';
  await page.goto(withTheme(base), { waitUntil: 'load' });
  const first = await grab();
  out.lists[name][1] = first;
  const last = Math.max(...first.hrefs.map((h) => Number((h.match(/page=(\d+)/) || [0, 1])[1])));
  for (const n of [Math.ceil(last / 2), last]) {
    await page.goto(withTheme(`${base}${sep}page=${n}`), { waitUntil: 'load' });
    out.lists[name][n] = await grab();
  }
  out.lists[name].lastPage = last;
}
writeFileSync(`docs/qa/evidence/t4bc-pagination-${label}.json`, JSON.stringify(out, null, 1));
for (const [name, l] of Object.entries(out.lists)) for (const [n, g] of Object.entries(l)) if (n !== 'lastPage') console.log(name, 'page', n, g.present ? `${g.tag} label=${g.ariaLabel} hook=${g.hasHook} hrefs=${g.hrefs.map(norm).join(' ')} cur=${JSON.stringify(g.cur)} tgt=${JSON.stringify(g.tgt)}` : 'NONE', '| text:', g.text);
await ctx.close(); await browser.close();
