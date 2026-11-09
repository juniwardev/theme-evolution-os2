// T6b C6b.13: visible add-to-cart error (F_3p 422) and no wrapper noise on F_wax.
// Usage: node t6bc-error.mjs <previewBase> <label>
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, load, HANDLES } from './t6bc-lib.mjs';

const [, label] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = { label, themeId, results: {} };
const rec = (k, v) => { out.results[k] = v; console.log(k, JSON.stringify(v).slice(0, 700)); };
const guard = async (k, fn) => { try { await fn(); } catch (e) { rec(k + ':ERROR', String(e.message).slice(0, 300)); } };
const wrap = (page) => page.evaluate(() => { const w = document.querySelector('.product-form__error-message-wrapper'); if (!w) return null; const cs = getComputedStyle(w); const r = w.getBoundingClientRect(); return { hidden: w.hidden, display: cs.display, h: Math.round(r.height), role: w.getAttribute('role'), text: w.textContent.replace(/\s+/g, ' ').trim(), color: cs.color }; });

for (const vw of [1440, 375]) await guard('C6b.13@' + vw, async () => {
  const { ctx, page } = await newPage(browser, state, vw, 812);
  await load(page, withTheme, '/products/' + HANDLES.p3p, themeId); await sleep(1500);
  const [resp] = await Promise.all([page.waitForResponse((r) => /cart\/add/.test(r.url())), page.locator('button[name="add"]').click()]);
  const json = await resp.json();
  await sleep(1200);
  const w1 = await wrap(page);
  const extra = await page.evaluate(() => ({ drawer: document.querySelector('cart-drawer')?.dataset.state, aria: document.querySelector('button[name="add"]').getAttribute('aria-disabled') }));
  // second click with /cart/add delayed
  await page.route(/\/cart\/add/, async (route) => { await sleep(1000); await route.fallback(); });
  const p2 = page.waitForResponse((r) => /cart\/add/.test(r.url()));
  await page.locator('button[name="add"]').click();
  await sleep(400);
  const mid = await wrap(page);
  await p2; await sleep(1000);
  const w2 = await wrap(page);
  const pass = !!w1 && !w1.hidden && w1.display !== 'none' && w1.h > 0 && w1.role === 'alert' && w1.text === String(json.description).trim() && w1.color === 'rgb(211, 47, 47)' && extra.drawer === 'closed' && !extra.aria && mid?.hidden === true && w2 && !w2.hidden;
  rec('C6b.13@' + vw, { status: resp.status(), desc: json.description, w1, extra, mid, w2, pass });
  await ctx.close();
});
await guard('C6b.13:wax', async () => {
  const { ctx, page } = await newPage(browser, state, 1440, 812);
  await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1500);
  const before = await wrap(page);
  const [resp] = await Promise.all([page.waitForResponse((r) => /cart\/add/.test(r.url())), page.locator('button[name="add"]').click()]);
  await sleep(300); const during = await wrap(page); await sleep(1500); const after = await wrap(page);
  rec('C6b.13:wax', { status: resp.status(), before, during, after, pass: !!before && before.hidden && !!after && after.hidden && !!during && during.hidden });
  await ctx.close();
});
writeFileSync(`docs/qa/evidence/t6bc-error-${label}.json`, JSON.stringify(out, null, 1));
await browser.close();
