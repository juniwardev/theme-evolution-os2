// T6b QA: C6b.6, 8, 10, 13, 21 with REAL /cart/add and /cart/change requests (paced, never replayed).
// Usage: T6BQA_STATE=<scratch> node t6bqa-drawer.mjs <previewBase> <label> [sessions]   sessions = comma list of wax1440,wax375,flow1440,flow375,p3p1440,p3p375
// Output: docs/qa/evidence/t6bqa-drawer-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, load, tabTo, activeFn, waitOpen, idle, HANDLES } from './t6bqa-lib.mjs';

const [, label, sessArg] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const want = new Set((sessArg || 'wax1440,wax375,flow1440,flow375,p3p1440,p3p375').split(','));
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = { label, themeId, results: {} };
const rec = (k, v) => { out.results[k] = v; console.log(k, JSON.stringify(v).slice(0, 700)); };
const guard = async (k, fn) => { try { await fn(); } catch (e) { rec(k + ':ERROR', String(e.message).slice(0, 300)); } };
const st = (page) => page.evaluate(() => { const d = document.querySelector('cart-drawer'); return { hidden: d.hidden, state: d.dataset.state }; });
const wrap = (page) => page.evaluate(() => { const w = document.querySelector('.product-form__error-message-wrapper'); if (!w) return null; const cs = getComputedStyle(w); const r = w.getBoundingClientRect(); return { hidden: w.hidden, display: cs.display, h: Math.round(r.height), role: w.getAttribute('role'), text: w.textContent.replace(/\s+/g, ' ').trim(), color: cs.color }; });
const real = (page) => ({ adds: page.__real.add, changes: page.__real.change, status: page.__real.status, saw429: page.__429 });

// ---- wax sessions: C6b.6(a), 8(a), 6(b), 8(b), detach clause ----
for (const vw of [1440, 375]) if (want.has('wax' + vw)) await guard('wax@' + vw, async () => {
  const { ctx, page } = await newPage(browser, state, vw);
  await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1500);
  const hops = await tabTo(page, 'button[name="add"]');
  const onAdd = await page.evaluate(activeFn);
  const t0 = Date.now();
  await page.keyboard.press('Enter');
  await waitOpen(page);
  const afterOpen = await page.evaluate(activeFn);
  rec('C6b.6a@' + vw, { hops, onAdd, afterOpen, pass: afterOpen.startsWith('div[role=dialog]'), real: real(page) });
  const trail = {};
  await page.keyboard.press('Escape'); await sleep(700); trail.escape = await page.evaluate(activeFn);
  await page.locator('button[name="add"]').focus();
  await page.evaluate(() => document.querySelector('cart-drawer').open()); await waitOpen(page);
  await page.locator('cart-drawer button[data-cart-drawer-close]').focus();
  await page.keyboard.press('Enter'); await sleep(700); trail.closeButton = await page.evaluate(activeFn);
  if (vw === 1440) {
    await page.locator('button[name="add"]').focus(); await page.evaluate(() => document.querySelector('cart-drawer').open()); await waitOpen(page);
    await page.mouse.click(10, 400); await sleep(700); trail.overlay = await page.evaluate(activeFn);
  }
  rec('C6b.8a@' + vw, { trail, pass: Object.values(trail).every((v) => v === 'button[name=add]'), notMenuToggle: !String(trail.escape).includes('menu-toggle') });
  // (b) header icon
  await guard('C6b.6b/8b@' + vw, async () => {
    await page.locator('button[name="add"]').focus(); await page.evaluate(() => document.activeElement.blur());
    const hopsT = await tabTo(page, '[data-cart-drawer-trigger]', 120);
    await page.keyboard.press('Enter'); await waitOpen(page);
    const a6 = await page.evaluate(activeFn);
    rec('C6b.6b@' + vw, { hopsT, afterOpen: a6, pass: a6.startsWith('div[role=dialog]') });
    await Promise.all([page.waitForResponse((r) => /cart\/change/.test(r.url())), page.evaluate(() => { const i = document.querySelector('#Drawer-quantity-1'); i.value = '2'; i.dispatchEvent(new Event('change', { bubbles: true })); })]);
    await idle(page);
    await page.keyboard.press('Escape'); await sleep(700);
    const r = await page.evaluate(() => ({ matches: document.activeElement?.matches('[data-cart-drawer-trigger]'), connected: document.activeElement?.isConnected }));
    rec('C6b.8b@' + vw, { ...r, pass: r.matches && r.connected, real: real(page) });
  });
  if (vw === 1440) await guard('C6b.10:detach', async () => {
    await page.locator('[data-cart-drawer-trigger]').first().click(); await waitOpen(page);
    await page.evaluate(() => document.querySelector('cart-drawer').remove());
    await page.locator('button[name="add"]').focus();
    const seen = [];
    for (let i = 0; i < 2; i++) { await page.keyboard.press('Tab'); await sleep(150); seen.push(await page.evaluate(activeFn)); }
    const errs = page.__logs.filter((l) => l.startsWith('pageerror'));
    rec('C6b.10:detach', { seen, pageerrors: errs.length, pass: seen[0] !== 'button[name=add]' && seen[0] !== seen[1] && errs.length === 0 });
  });
  rec('wax@' + vw + ':logs', page.__logs);
  await ctx.close();
});

// ---- flow sessions: C6b.10 regression flow + C6b.13 wax (wrapper stays hidden) ----
for (const vw of [1440, 375]) if (want.has('flow' + vw)) await guard('flow@' + vw, async () => {
  const { ctx, page } = await newPage(browser, state, vw);
  await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1500);
  const r = { closedInitial: await st(page) };
  const before = await wrap(page);
  await page.locator('button[name="add"]').click();
  await sleep(300); const during = await wrap(page);
  await waitOpen(page); r.afterAdd = await st(page);
  await sleep(800); const after = await wrap(page);
  rec('C6b.13:wax@' + vw, { before, during, after, pass: !!before && before.hidden && !!during && during.hidden && !!after && after.hidden });
  r.panelOutline = await page.evaluate(() => { const p = document.querySelector('cart-drawer [role=dialog]'); p.focus(); return getComputedStyle(p).outlineStyle; });
  await page.keyboard.press('Escape'); await sleep(600); r.afterEsc = await st(page);
  await page.locator('[data-cart-drawer-trigger]').first().click(); await waitOpen(page); r.afterIcon = await st(page);
  if (vw === 1440) { await page.mouse.click(10, 400); await sleep(600); r.afterOverlay = await st(page); } else { await page.keyboard.press('Escape'); await sleep(600); r.afterOverlay = await st(page); }
  await page.locator('[data-cart-drawer-trigger]').first().click(); await waitOpen(page);
  await page.locator('cart-drawer button[data-cart-drawer-close]').click(); await sleep(600); r.afterCloseBtn = await st(page);
  await page.locator('[data-cart-drawer-trigger]').first().click(); await waitOpen(page);
  const totalBefore = await page.locator('cart-drawer [data-cart-drawer-footer] p').first().innerText();
  const busy = page.evaluate(() => new Promise((res) => { const d = document.querySelector('cart-drawer'); const i = new MutationObserver(() => { if (d.hasAttribute('aria-busy')) { const b = d.querySelector('[data-cart-drawer-busy]'); res(getComputedStyle(b).visibility); i.disconnect(); } }); i.observe(d, { attributes: true, attributeFilter: ['aria-busy'] }); setTimeout(() => res('timeout'), 30000); }));
  await Promise.all([page.waitForResponse((x) => /cart\/change/.test(x.url())), page.evaluate(() => { const i = document.querySelector('#Drawer-quantity-1'); i.value = '2'; i.dispatchEvent(new Event('change', { bubbles: true })); })]);
  r.busyVisibility = await busy; await idle(page);
  r.totalChanged = totalBefore !== await page.locator('cart-drawer [data-cart-drawer-footer] p').first().innerText();
  await Promise.all([page.waitForResponse((x) => /cart\/change/.test(x.url())), page.locator('.cart-drawer__item-remove').click()]); await idle(page);
  r.emptyText = await page.locator('cart-drawer #CartDrawer-CartItems p').first().innerText();
  r.pass = r.closedInitial.hidden && r.closedInitial.state === 'closed' && !r.afterAdd.hidden && r.afterAdd.state === 'open' && r.panelOutline === 'none' && r.afterEsc.state === 'closed' && r.afterIcon.state === 'open' && r.afterOverlay.state === 'closed' && r.afterCloseBtn.state === 'closed' && r.busyVisibility === 'visible' && r.totalChanged && /empty/i.test(r.emptyText);
  r.logs = page.__logs; r.real = real(page);
  rec('C6b.10:flow@' + vw, r);
  await ctx.close();
});

// ---- p3p 1440: C6b.10:422, C6b.13, C6b.21 (keyboard add) ----
if (want.has('p3p1440')) await guard('p3p@1440', async () => {
  const { ctx, page } = await newPage(browser, state, 1440);
  await load(page, withTheme, '/products/' + HANDLES.p3p, themeId); await sleep(1500);
  await tabTo(page, 'button[name="add"]');
  const [resp] = await Promise.all([page.waitForResponse((r) => /cart\/add/.test(r.url())), page.keyboard.press('Enter')]);
  const json = await resp.json();
  await sleep(1200);
  const w1 = await wrap(page);
  const extra = await page.evaluate(() => ({ drawer: document.querySelector('cart-drawer')?.dataset.state, hidden: document.querySelector('cart-drawer').hidden, aria: document.querySelector('button[name="add"]').getAttribute('aria-disabled') }));
  rec('C6b.10:422', { status: resp.status(), ...extra, pass: resp.status() === 422 && extra.drawer === 'closed' });
  await page.route(/\/cart\/add/, async (route) => { await sleep(1000); await route.fallback(); });
  const p2 = page.waitForResponse((r) => /cart\/add/.test(r.url()));
  await page.locator('button[name="add"]').click();
  await sleep(400); const mid = await wrap(page);
  await p2; await sleep(1000); const w2 = await wrap(page);
  await page.unroute(/\/cart\/add/);
  rec('C6b.13@1440', { status: resp.status(), desc: json.description, w1, extra, mid, w2, pass: !!w1 && !w1.hidden && w1.display !== 'none' && w1.h > 0 && w1.role === 'alert' && w1.text === String(json.description).trim() && w1.color === 'rgb(211, 47, 47)' && extra.drawer === 'closed' && !extra.aria && mid?.hidden === true && !!w2 && !w2.hidden });
  await page.locator('[data-cart-drawer-trigger]').first().focus();
  await page.keyboard.press('Enter'); await waitOpen(page);
  await page.keyboard.press('Escape'); await sleep(700);
  const r = await page.evaluate(() => ({ trig: document.activeElement?.matches('[data-cart-drawer-trigger]'), a: document.activeElement?.tagName }));
  rec('C6b.21', { ...r, pass: r.trig, real: real(page) });
  rec('p3p@1440:logs', page.__logs);
  await ctx.close();
});

if (want.has('p3p375')) await guard('p3p@375', async () => {
  const { ctx, page } = await newPage(browser, state, 375);
  await load(page, withTheme, '/products/' + HANDLES.p3p, themeId); await sleep(1500);
  const [resp] = await Promise.all([page.waitForResponse((r) => /cart\/add/.test(r.url())), page.locator('button[name="add"]').click()]);
  const json = await resp.json();
  await sleep(1200);
  const w1 = await wrap(page);
  const extra = await page.evaluate(() => ({ drawer: document.querySelector('cart-drawer')?.dataset.state, aria: document.querySelector('button[name="add"]').getAttribute('aria-disabled') }));
  await page.route(/\/cart\/add/, async (route) => { await sleep(1000); await route.fallback(); });
  const p2 = page.waitForResponse((r) => /cart\/add/.test(r.url()));
  await page.locator('button[name="add"]').click();
  await sleep(400); const mid = await wrap(page);
  await p2; await sleep(1000); const w2 = await wrap(page);
  rec('C6b.13@375', { status: resp.status(), desc: json.description, w1, extra, mid, w2, pass: !!w1 && !w1.hidden && w1.display !== 'none' && w1.h > 0 && w1.role === 'alert' && w1.text === String(json.description).trim() && w1.color === 'rgb(211, 47, 47)' && extra.drawer === 'closed' && !extra.aria && mid?.hidden === true && !!w2 && !w2.hidden, real: real(page) });
  await ctx.close();
});

writeFileSync(`docs/qa/evidence/t6bqa-drawer-${label}.json`, JSON.stringify(out, null, 1));
await browser.close();
