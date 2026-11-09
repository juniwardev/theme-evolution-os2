// T6b QA C6b.14: tooltip keyboard behavior. PXP is replicated IN PAGE: two trigger spans with the exact markup/classes of sections/product.liquid:53 (tabindex=0, data-material-handle) are injected into the description wrapper; eco-tooltip.js and the server tooltip fetch are the real ones.
// Usage: node t6bqa-tooltip.mjs <previewBase> <label>
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, load, activeFn, HANDLES } from './t6bqa-lib.mjs';
import { readStyleFn, fiVerdict } from './t6bc-lib.mjs';

const [, label] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const CACHE = new Map();
const stats = { real: 0, cached: 0, realStatus: [] };
const out = { label, themeId, results: {}, stats };
const rec = (k, v) => { out.results[k] = v; console.log(k, JSON.stringify(v).slice(0, 900)); };
const guard = async (k, fn) => { try { await fn(); } catch (e) { rec(k + ':ERROR', String(e.message).slice(0, 300)); } };
const visible = (page) => page.evaluate(() => [...document.querySelectorAll('div.eco-tooltip.is-visible')].map((t) => t.id || '(noid)'));
const SENT = '<span tabindex="0" id="tt-sentinel">sentinel</span>';
const open = async (page, vw, delayTooltip = 0) => {
  // Cloudflare limits /search, so the tooltip section is fetched for real once per handle per run and later pages are answered from that real response (tooltip content only; no cart request is ever replayed).
  await page.route(/section_id=material-tooltip/, async (r) => {
    const q = new URL(r.request().url()).searchParams.get('q');
    if (delayTooltip) await sleep(delayTooltip);
    if (CACHE.has(q)) { stats.cached++; return r.fulfill({ status: 200, contentType: 'text/html', body: CACHE.get(q) }); }
    const resp = await r.fetch(); const body = await resp.text();
    stats.real++; stats.realStatus.push(resp.status());
    if (resp.status() === 200) CACHE.set(q, body);
    return r.fulfill({ response: resp, body });
  });
  await load(page, withTheme, '/products/' + HANDLES.p3p, themeId); await sleep(1500);
  await page.evaluate((h) => document.querySelector('[data-rich-text]').insertAdjacentHTML('beforebegin', h), SENT);
  await page.evaluate((cls) => { const mk = (n, label) => '<span class="' + cls + '" tabindex="0" data-material-handle="' + n + '">' + label + '</span>'; const w = document.querySelector('[data-rich-text]'); w.insertAdjacentHTML('afterbegin', '<p>Made with ' + mk('organic-cotton', 'Organic Cotton') + ' and ' + mk('recycled-polyester', 'Recycled Polyester') + ', sewn by hand.</p>'); }, 'eco-tooltip-trigger cursor-help font-medium text-[#00707c] underline decoration-dotted underline-offset-4 transition-colors duration-200 hover:text-[#004c55] hover:decoration-solid');
};

for (const vw of [1440, 375]) await guard('C6b.14@' + vw, async () => {
  const r = {};
  const { ctx, page } = await newPage(browser, state, vw, 900);
  await open(page, vw);
  const trig = await page.evaluate(() => [...document.querySelectorAll('.eco-tooltip-trigger')].map((t) => ({ tabIndex: t.tabIndex, handle: t.dataset.materialHandle })));
  r.a = { count: trig.length, tabIndexes: trig.map((t) => t.tabIndex), pass: trig.length >= 2 && trig.every((t) => t.tabIndex === 0) };
  await page.evaluate(() => document.getElementById('tt-sentinel').focus());
  const rest = await page.evaluate(readStyleFn, '.eco-tooltip-trigger');
  await page.keyboard.press('Tab'); await sleep(200);
  const onTrig = await page.evaluate(() => document.activeElement.classList.contains('eco-tooltip-trigger') && document.activeElement.dataset.materialHandle);
  const foc = await page.evaluate(readStyleFn, '.eco-tooltip-trigger');
  r.b = { onTrig, ...fiVerdict(rest, foc) }; r.b.pass = !!onTrig && r.b.fi === true;
  await sleep(1600);
  const vis = await visible(page);
  const tt = await page.evaluate(() => { const t = document.querySelector('div.eco-tooltip.is-visible'); const trg = document.activeElement; if (!t) return null; return { role: t.getAttribute('role'), id: t.id, describedby: trg.getAttribute('aria-describedby'), top: t.getBoundingClientRect().top, trigBottom: trg.getBoundingClientRect().bottom }; });
  r.c = { vis, tt, pass: vis.length === 1 && tt?.role === 'tooltip' && tt.id === tt.describedby && tt.top >= tt.trigBottom };
  await page.keyboard.press('Escape'); await sleep(500);
  r.d = { vis: await visible(page), active: await page.evaluate(activeFn), activeIsTrigger: await page.evaluate(() => document.activeElement.classList.contains('eco-tooltip-trigger')) };
  r.d.pass = vw === 1440 ? r.d.vis.length === 0 && r.d.activeIsTrigger : r.d.vis.length === 0;
  await page.keyboard.press('Tab'); await sleep(200);
  // for 375 after Escape the header may have moved focus; refocus trigger 1 first so (e) is comparable
  if (vw !== 1440) { await page.locator('.eco-tooltip-trigger').first().focus(); await page.keyboard.press('Tab'); }
  await sleep(1600);
  const secondOn = await page.evaluate(() => document.activeElement.dataset.materialHandle);
  const e = await visible(page);
  r.e = { secondOn, vis: e, pass: e.length === 1 && e[0] === 'eco-tooltip-' + secondOn };
  await page.keyboard.press('Tab'); await sleep(450);
  r.f = { vis: await visible(page), active: await page.evaluate(activeFn) }; r.f.pass = r.f.vis.length === 0;
  // (g) mouse
  const t1 = page.locator('.eco-tooltip-trigger').first();
  await t1.hover(); await sleep(1500);
  const gv = await visible(page);
  await page.mouse.move(2, 2); await sleep(500);
  const gh = await visible(page);
  r.g = { shown: gv, hidden: gh, pass: gv.length === 1 && gh.length === 0 };
  rec('C6b.14@' + vw, r);
  await ctx.close();
  // (h) stale fetch
  {
    const { ctx: c2, page: p2 } = await newPage(browser, state, vw, 900);
    await open(p2, vw, 800);
    await p2.evaluate(() => document.getElementById('tt-sentinel').focus());
    await p2.keyboard.press('Tab');
    await p2.keyboard.press('Shift+Tab');
    await sleep(1800);
    const created = await p2.evaluate(() => { const t = document.getElementById('eco-tooltip-organic-cotton'); return t ? t.classList.contains('is-visible') : 'not-created'; });
    const vh = await visible(p2);
    rec('C6b.14h@' + vw, { created, vis: vh, pass: created !== true && vh.length === 0 });
    await c2.close();
  }
  // (i) click then leave
  {
    const { ctx: c3, page: p3 } = await newPage(browser, state, vw, 900);
    await open(p3, vw);
    await p3.locator('.eco-tooltip-trigger').first().click(); await sleep(1500);
    const shown = await visible(p3);
    await p3.mouse.move(2, 2); await sleep(600);
    const after = await visible(p3);
    rec('C6b.14i@' + vw, { shown, after, pass: after.length === 0 });
    await c3.close();
  }
});
writeFileSync(`docs/qa/evidence/t6bqa-tooltip-${label}.json`, JSON.stringify(out, null, 1));
await browser.close();
