// T6b C6b.4-C6b.10 and C6b.21: drawer race, listeners, focus, regression, detach clause.
// Usage: node t6bc-drawer.mjs <previewBase> <label> [tests]   tests = comma list of 4,5,6,7,8,9,10,21 (default all)
// Output: docs/qa/evidence/t6bc-drawer-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, load, tabTo, activeFn, docListeners, cartContext, HANDLES } from './t6bc-lib.mjs';

const [, label, testsArg] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const want = new Set((testsArg || '4,5,6,7,8,9,10,21').split(','));
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = { label, themeId, results: {} };
const rec = (k, v) => { out.results[k] = v; console.log(k, JSON.stringify(v).slice(0, 600)); };

const openState = (page) => page.evaluate(() => { const d = document.querySelector('cart-drawer'); return { hidden: d.hidden, state: d.dataset.state, overflow: getComputedStyle(document.body).overflow, right: Math.round(document.querySelector('cart-drawer [role=dialog]').getBoundingClientRect().right), vw: document.documentElement.clientWidth }; });
const waitOpen = async (page, ms = 400000) => { await page.waitForFunction(() => document.querySelector('cart-drawer')?.dataset.state === 'open', null, { timeout: ms }); await sleep(450); };
const idle = async (page) => { await page.waitForFunction(() => !document.querySelector('cart-drawer')?.hasAttribute('aria-busy'), null, { timeout: 400000 }); await sleep(600); };
const fresh = (vw, handles, vh = 812, mutates = false) => cartContext(browser, state, withTheme, themeId, vw, handles, vh, mutates);
const guard = async (k, fn) => { try { await fn(); } catch (e) { rec(k + ':ERROR', String(e.message).slice(0, 300)); } };

// ---- C6b.4 race (needs one item in cart) ----
if (want.has('4')) for (const vw of [1440, 375]) await guard('C6b.4@' + vw, async () => {
  const { ctx, page } = await fresh(vw, [HANDLES.wax]);
  await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1500);
  const a = await page.evaluate(async () => { const d = document.querySelector('cart-drawer'); const w = (ms) => new Promise((r) => setTimeout(r, ms)); d.open(); await w(400); d.close(); setTimeout(() => d.open(), 50); await w(800); return true; });
  const ra = await openState(page);
  await page.evaluate(async () => { const d = document.querySelector('cart-drawer'); d.close(); await new Promise((r) => setTimeout(r, 700)); });
  const b = await page.evaluate(async () => { const d = document.querySelector('cart-drawer'); const w = (ms) => new Promise((r) => setTimeout(r, ms)); d.open(); setTimeout(() => d.close(), 5); await w(800); return true; });
  const rb = await openState(page);
  const okA = !ra.hidden && ra.state === 'open' && ra.overflow === 'hidden' && Math.abs(ra.right - ra.vw) <= 1;
  const okB = rb.hidden === true && rb.state === 'closed' && rb.overflow === 'visible';
  rec('C6b.4@' + vw, { a: ra, okA, b: rb, okB });
  await ctx.close();
});

// ---- C6b.5 listeners once ----
if (want.has('5')) await guard('C6b.5', async () => {
  const { ctx, page } = await fresh(1440, [HANDLES.wax]);
  await load(page, withTheme, '/products/' + HANDLES.wax, themeId, { waitUntil: 'networkidle' }); await sleep(1000);
  await page.evaluate(() => { window.__closeCalls = 0; const d = document.querySelector('cart-drawer'); const o = d.close.bind(d); d.close = () => { window.__closeCalls++; o(); }; });
  const before = await docListeners(page);
  for (let i = 0; i < 3; i++) {
    await Promise.all([page.waitForResponse((r) => /section_id=cart-drawer/.test(r.url())), page.evaluate(() => document.querySelector('cart-drawer').updateCart())]);
    await sleep(900);
  }
  const after = await docListeners(page);
  await page.keyboard.press('Escape'); await sleep(500);
  const closeCalls = await page.evaluate(() => window.__closeCalls);
  rec('C6b.5', { before: { keyup: before.keyup, keydown: before.keydown }, after: { keyup: after.keyup, keydown: after.keydown }, unchanged: before.keyup === after.keyup && before.keydown === after.keydown, closeCallsAfterOneEscape: closeCalls });
  await ctx.close();
});

// ---- C6b.6 initial focus, C6b.8(a)/(c) focus return (add button flow) ----
if (want.has('6') || want.has('8')) for (const vw of [1440, 375]) await guard('C6b.6/8a@' + vw, async () => {
  const { ctx, page } = await fresh(vw, []);
  await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1500);
  const hops = await tabTo(page, 'button[name="add"]');
  const onAdd = await page.evaluate(activeFn);
  await page.keyboard.press('Enter');
  await waitOpen(page);
  const afterOpen = await page.evaluate(activeFn);
  const r6 = { hops, onAdd, afterOpen, pass: afterOpen.startsWith('div[role=dialog]') };
  if (want.has('6')) rec('C6b.6a@' + vw, r6);
  if (want.has('8')) {
    const trail = {};
    await page.keyboard.press('Escape'); await sleep(700);
    trail.escape = await page.evaluate(activeFn);
    // reopen with Enter on the add button (it still has focus on a correct build)
    // Reopen the way product-form does (focus on the add button, then open()) without a second /cart/add.
    await page.locator('button[name="add"]').focus();
    await page.evaluate(() => document.querySelector('cart-drawer').open()); await waitOpen(page);
    await page.locator('cart-drawer button[data-cart-drawer-close]').focus();
    await page.keyboard.press('Enter'); await sleep(700);
    trail.closeButton = await page.evaluate(activeFn);
    if (vw === 1440) {
      await page.locator('button[name="add"]').focus(); await page.evaluate(() => document.querySelector('cart-drawer').open()); await waitOpen(page);
      await page.mouse.click(10, 400); await sleep(700);
      trail.overlay = await page.evaluate(activeFn);
    }
    const want_ = 'button[name=add]';
    const ok = Object.values(trail).every((v) => v === want_);
    rec('C6b.8a@' + vw, { trail, ok, notMenuToggle: !String(trail.escape).includes('menu-toggle') });
  }
  await ctx.close();
});

// ---- C6b.6(b) header icon; C6b.8(b) icon + quantity change + Escape ----
if (want.has('6') || want.has('8')) await guard('C6b.6b/8b', async () => {
  const { ctx, page } = await fresh(1440, [HANDLES.wax]);
  await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1500);
  await tabTo(page, '[data-cart-drawer-trigger]');
  await page.keyboard.press('Enter'); await waitOpen(page);
  const afterOpen = await page.evaluate(activeFn);
  if (want.has('6')) rec('C6b.6b', { afterOpen, pass: afterOpen.startsWith('div[role=dialog]') });
  if (want.has('8')) {
    await Promise.all([page.waitForResponse((r) => /cart\/change/.test(r.url())), page.evaluate(() => { const i = document.querySelector('#Drawer-quantity-1'); i.value = '2'; i.dispatchEvent(new Event('change', { bubbles: true })); })]);
    await idle(page);
    await page.keyboard.press('Escape'); await sleep(700);
    const r = await page.evaluate(() => ({ matches: document.activeElement?.matches('[data-cart-drawer-trigger]'), connected: document.activeElement?.isConnected, d: document.activeElement?.tagName }));
    rec('C6b.8b', { ...r, pass: r.matches && r.connected });
  }
  await ctx.close();
});

// ---- C6b.7 trap ----
if (want.has('7')) for (const [name, handles] of [['one', [HANDLES.wax]], ['two', [HANDLES.wax, HANDLES.snow]], ['empty', []]]) await guard('C6b.7:' + name, async () => {
  const { ctx, page } = await fresh(1440, handles);
  await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1500);
  await tabTo(page, '[data-cart-drawer-trigger]');
  await page.keyboard.press('Enter'); await waitOpen(page);
  const nf = await page.evaluate(() => {
    const sel = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return [...document.querySelector('cart-drawer [role=dialog]').querySelectorAll(sel)].filter((e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden').map((e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''));
  });
  const N = nf.length;
  const fw = [];
  for (let i = 0; i < N + 1; i++) { await page.keyboard.press('Tab'); await sleep(120); fw.push(await page.evaluate(() => ({ d: document.activeElement.tagName.toLowerCase() + (document.activeElement.id ? '#' + document.activeElement.id : '') + '.' + String(document.activeElement.className).split(' ')[0], inside: !!document.activeElement.closest('cart-drawer [role=dialog]') }))); }
  await page.keyboard.press('Shift+Tab'); await sleep(120);
  const back = await page.evaluate(() => document.activeElement.tagName.toLowerCase() + (document.activeElement.id ? '#' + document.activeElement.id : '') + '.' + String(document.activeElement.className).split(' ')[0]);
  const allInside = fw.every((x) => x.inside);
  const distinct = new Set(fw.slice(0, N).map((x) => x.d)).size === N;
  const wraps = fw[N] && fw[0] && fw[N].d === fw[0].d;
  const backOk = back === fw[N - 1]?.d;
  rec('C6b.7:' + name, { N_f: N, items: nf, readings: fw.map((x) => x.d), allInside, distinct, wraps, backOk, pass: N >= 2 && allInside && distinct && wraps && backOk });
  await ctx.close();
});

// ---- C6b.9 re-render keeps focus ----
if (want.has('9')) await guard('C6b.9', async () => {
  const { ctx, page } = await fresh(1440, [HANDLES.wax], 812, true);
  await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1500);
  await tabTo(page, '[data-cart-drawer-trigger]');
  await page.keyboard.press('Enter'); await waitOpen(page);
  let reached = true;
  try { await tabTo(page, '#Drawer-quantity-1', 10); } catch { reached = false; await page.locator('#Drawer-quantity-1').focus(); }
  await Promise.all([page.waitForResponse((r) => /cart\/change/.test(r.url())), page.evaluate(() => { const i = document.querySelector('#Drawer-quantity-1'); i.value = '2'; i.dispatchEvent(new Event('change', { bubbles: true })); })]);
  await idle(page);
  const a = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
  let reachedRemove = true;
  try { await tabTo(page, '.cart-drawer__item-remove', 10); } catch { reachedRemove = false; await page.locator('.cart-drawer__item-remove').focus(); }
  await Promise.all([page.waitForResponse((r) => /cart\/change/.test(r.url())), page.keyboard.press('Enter')]);
  await idle(page);
  const b = await page.evaluate(() => ({ inside: !!document.activeElement?.closest('[role=dialog]'), d: document.activeElement?.tagName }));
  rec('C6b.9', { reached, a, aPass: a === 'Drawer-quantity-1', reachedRemove, b, bPass: b.inside });
  await ctx.close();
});

// ---- C6b.10 regression + detach clause ----
if (want.has('10')) {
  for (const vw of [1440, 430]) await guard('C6b.10:flow@' + vw, async () => {
    const { ctx, page } = await fresh(vw, [HANDLES.wax], 812, true);
    await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1500);
    const st = async () => page.evaluate(() => { const d = document.querySelector('cart-drawer'); return { hidden: d.hidden, state: d.dataset.state }; });
    const r = { closedInitial: await st() };
    await page.locator('button[name="add"]').click(); await waitOpen(page);
    r.afterAdd = await st();
    r.panelOutline = await page.evaluate(() => { const p = document.querySelector('cart-drawer [role=dialog]'); p.focus(); return getComputedStyle(p).outlineStyle; });
    await page.keyboard.press('Escape'); await sleep(600); r.afterEsc = await st();
    await page.locator('[data-cart-drawer-trigger]').first().click(); await waitOpen(page); r.afterIcon = await st();
    if (vw === 1440) { await page.mouse.click(10, 400); await sleep(600); r.afterOverlay = await st(); } else { await page.keyboard.press('Escape'); await sleep(600); r.afterOverlay = await st(); }
    await page.locator('[data-cart-drawer-trigger]').first().click(); await waitOpen(page);
    await page.locator('cart-drawer button[data-cart-drawer-close]').click(); await sleep(600); r.afterCloseBtn = await st();
    await page.locator('[data-cart-drawer-trigger]').first().click(); await waitOpen(page);
    const totalBefore = await page.locator('cart-drawer [data-cart-drawer-footer] p').first().innerText();
    const busy = page.evaluate(() => new Promise((res) => { const d = document.querySelector('cart-drawer'); const i = new MutationObserver(() => { if (d.hasAttribute('aria-busy')) { const b = d.querySelector('[data-cart-drawer-busy]'); res(getComputedStyle(b).visibility); i.disconnect(); } }); i.observe(d, { attributes: true, attributeFilter: ['aria-busy'] }); setTimeout(() => res('timeout'), 6000); }));
    await Promise.all([page.waitForResponse((x) => /cart\/change/.test(x.url())), page.evaluate(() => { const i = document.querySelector('#Drawer-quantity-1'); i.value = '2'; i.dispatchEvent(new Event('change', { bubbles: true })); })]);
    r.busyVisibility = await busy; await idle(page);
    r.totalChanged = totalBefore !== await page.locator('cart-drawer [data-cart-drawer-footer] p').first().innerText();
    await Promise.all([page.waitForResponse((x) => /cart\/change/.test(x.url())), page.locator('.cart-drawer__item-remove').click()]); await idle(page);
    r.emptyText = await page.locator('cart-drawer #CartDrawer-CartItems p').first().innerText();
    r.pass = r.closedInitial.hidden && r.closedInitial.state === 'closed' && !r.afterAdd.hidden && r.afterAdd.state === 'open' && r.panelOutline === 'none' && r.afterEsc.state === 'closed' && r.afterIcon.state === 'open' && r.afterOverlay.state === 'closed' && r.afterCloseBtn.state === 'closed' && r.busyVisibility === 'visible' && r.totalChanged && /empty/i.test(r.emptyText);
    r.logs = page.__logs;
    rec('C6b.10:flow@' + vw, r);
    await ctx.close();
  });
  await guard('C6b.10:422', async () => {
    const { ctx, page } = await fresh(1440, []);
    await load(page, withTheme, '/products/' + HANDLES.p3p, themeId); await sleep(1500);
    const [resp] = await Promise.all([page.waitForResponse((r) => /cart\/add/.test(r.url())), page.locator('button[name="add"]').click()]);
    await sleep(900);
    const s = await page.evaluate(() => ({ state: document.querySelector('cart-drawer').dataset.state, hidden: document.querySelector('cart-drawer').hidden }));
    rec('C6b.10:422', { status: resp.status(), ...s, pass: resp.status() === 422 && s.state === 'closed' });
    await ctx.close();
  });
  await guard('C6b.10:detach', async () => {
    const { ctx, page } = await fresh(1440, [HANDLES.wax]);
    await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1500);
    await page.locator('[data-cart-drawer-trigger]').first().click(); await waitOpen(page);
    await page.evaluate(() => document.querySelector('cart-drawer').remove());
    await page.locator('button[name="add"]').focus();
    const seen = [];
    for (let i = 0; i < 2; i++) { await page.keyboard.press('Tab'); await sleep(150); seen.push(await page.evaluate(activeFn)); }
    const errs = page.__logs.filter((l) => l.startsWith('pageerror'));
    rec('C6b.10:detach', { seen, changed: seen[0] !== 'button[name=add]' && seen[0] !== seen[1], pageerrors: errs.length, pass: seen[0] !== 'button[name=add]' && seen[0] !== seen[1] && errs.length === 0 });
    await ctx.close();
  });
}

// ---- C6b.21 return after failed add ----
if (want.has('21')) await guard('C6b.21', async () => {
  const { ctx, page } = await fresh(1440, []);
  await load(page, withTheme, '/products/' + HANDLES.p3p, themeId); await sleep(1500);
  await tabTo(page, 'button[name="add"]');
  const [resp] = await Promise.all([page.waitForResponse((r) => /cart\/add/.test(r.url())), page.keyboard.press('Enter')]);
  await sleep(900);
  await page.locator('[data-cart-drawer-trigger]').first().focus();
  await page.keyboard.press('Enter'); await waitOpen(page);
  await page.keyboard.press('Escape'); await sleep(700);
  const r = await page.evaluate(() => ({ trig: document.activeElement?.matches('[data-cart-drawer-trigger]'), a: document.activeElement?.tagName }));
  rec('C6b.21', { status: resp.status(), ...r, pass: resp.status() === 422 && r.trig });
  await ctx.close();
});

out.logs = 'see per-test';
writeFileSync(`docs/qa/evidence/t6bc-drawer-${label}.json`, JSON.stringify(out, null, 1));
await browser.close();
