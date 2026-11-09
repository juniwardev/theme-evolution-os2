// T6b QA C6b.11 and C6b.12 (real seeding adds, paced; the cart state is then shared via the context cookies): /cart line prices, total, quantity field, validation, layout.
// Usage: node t6bqa-cartpage.mjs <previewBase> <label>    Output: docs/qa/evidence/t6bqa-cartpage-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, load, HANDLES } from './t6bqa-lib.mjs';
import { overflowFn2 } from './t6bc-lib.mjs';

const [, label] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = { label, themeId, results: {} };
const rec = (k, v) => { out.results[k] = v; console.log(k, JSON.stringify(v).slice(0, 700)); };
const guard = async (k, fn) => { try { await fn(); } catch (e) { rec(k + ':ERROR', String(e.message).slice(0, 300)); } };

// Seed once with REAL adds (wax, snow), then every check reuses that cart's cookies.
let seeded = null;
async function seed() {
  if (seeded) return seeded;
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  for (const h of [HANDLES.wax, HANDLES.snow]) {
    await load(page, withTheme, '/products/' + h, themeId); await sleep(1200);
    const [r] = await Promise.all([page.waitForResponse((x) => /cart\/add/.test(x.url())), page.locator('button[name="add"]').first().click()]);
    if (!r.ok()) throw new Error('seed add ' + h + ' -> ' + r.status());
    await sleep(900);
  }
  seeded = await ctx.storageState();
  rec('seed', { real: page.__real });
  await ctx.close();
  return seeded;
}
const cartContext = async (b, st, wt, tid, vw, handles, vh) => newPage(b, await seed(), vw, vh);
const norm = (t) => (t || '').replace(/\s+/g, ' ').trim();

await guard('C6b.11', async () => {
  const { ctx, page } = await cartContext(browser, state, withTheme, themeId, 1440, [HANDLES.wax, HANDLES.snow], 900);
  await load(page, withTheme, '/cart', themeId); await sleep(1200);
  const read = () => page.evaluate(() => {
    const t = (e) => (e?.textContent || '').replace(/\s+/g, ' ').trim();
    const lis = [...document.querySelectorAll('li')].filter((li) => li.querySelector('input[name="updates[]"]') && !li.closest('cart-drawer'));
    const drawer = [...document.querySelectorAll('#CartDrawer-CartItems [data-cart-drawer-item]')];
    return {
      lis: lis.length,
      prices: lis.map((li) => ({ n: li.querySelectorAll('[data-cart-line-price]').length, text: t(li.querySelector('[data-cart-line-price]')) })),
      drawerPrices: drawer.map((d) => t(d.querySelector('a + div'))),
      total: t(document.querySelector('[data-cart-total]')),
      drawerTotal: t(document.querySelector('[data-cart-drawer-footer] p')),
    };
  });
  const before = await read();
  const eq1 = before.lis === 2 && before.prices.every((p, i) => p.n === 1 && p.text && p.text === before.drawerPrices[i]) && before.total && before.total === before.drawerTotal;
  const cur = Number(await page.locator('#CartPage-quantity-1').inputValue());
  await page.locator('#CartPage-quantity-1').fill(String(cur + 1));
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.locator('form button.btn-secondary', { hasText: /update/i }).click()]);
  await sleep(1200);
  const after = await read();
  const eq2 = after.prices[0]?.text === after.drawerPrices[0] && after.prices[0]?.text !== before.prices[0]?.text;
  rec('C6b.11', { before, after, pass: !!(eq1 && eq2) });
  await ctx.close();
});

await guard('C6b.12', async () => {
  const { ctx, page } = await cartContext(browser, state, withTheme, themeId, 1440, [HANDLES.wax, HANDLES.snow], 900);
  await load(page, withTheme, '/cart', themeId); await sleep(1200);
  const attrs = await page.evaluate(() => ({
    inputs: [...document.querySelectorAll('input[name="updates[]"][id^="CartPage-quantity"]')].map((i) => ({ type: i.type, inputmode: i.getAttribute('inputmode'), min: i.getAttribute('min') })),
    checkoutNoValidate: document.querySelector('button[name="checkout"][formnovalidate]') !== null,
    h1: document.querySelectorAll('h1').length,
    headingsInCart: document.querySelector('input[name="updates[]"]').closest('form').querySelectorAll('h1,h2,h3,h4,h5,h6').length,
  }));
  const geo = await page.evaluate(() => ['Update', 'Checkout'].map((n) => { const form = document.querySelector('input[name="updates[]"]').closest('form'); const b = [...form.querySelectorAll('button[type=submit]')].find((x) => new RegExp(n, 'i').test(x.textContent)); const r = b.getBoundingClientRect(); return { n, h: Math.round(r.height), right: Math.round(r.right), w: innerWidth }; }));
  // validation
  const posts = [];
  await page.route(/\/cart(\?|$)/, async (route) => {
    const req = route.request();
    if (req.method() === 'POST') { posts.push({ body: (req.postData() || '').slice(0, 200) }); await route.abort(); } else await route.continue();
  });
  await page.locator('#CartPage-quantity-1').fill('-1');
  const urlBefore = page.url();
  await page.locator('form button.btn-secondary', { hasText: /update/i }).click(); await sleep(800);
  const upd = { urlSame: page.url() === urlBefore, posts: posts.length, valid: await page.evaluate(() => document.querySelector('#CartPage-quantity-1').validity.valid) };
  posts.length = 0;
  await page.locator('button[name="checkout"][formnovalidate]').click(); await sleep(800);
  const chk = { posts: posts.length, hasCheckoutField: posts.some((p) => /checkout/.test(p.body)) };
  await ctx.close();
  // overflow at widths
  const ov = {};
  for (const w of [320, 375, 768, 1440, 1920]) {
    const { ctx: c2, page: p2 } = await newPage(browser, state, w, 900);
    await load(p2, withTheme, '/cart', themeId); await sleep(900);
    const o = await p2.evaluate(overflowFn2);
    ov[w] = { diff: o.sw - o.vw, off: o.off.length };
    await c2.close();
  }
  rec('C6b.12', { attrs, upd, chk, geo, ov, pass: attrs.inputs.length === 2 && attrs.inputs.every((i) => i.type === 'number' && i.inputmode === 'numeric' && i.min === '0') && attrs.checkoutNoValidate && !upd.posts && upd.urlSame && !upd.valid && chk.posts === 1 && chk.hasCheckoutField && attrs.h1 === 1 && attrs.headingsInCart === 0 && Object.values(ov).every((x) => x.diff === 0) });
});

await guard('shots', async () => {
  for (const w of [1440, 375]) {
    const { ctx, page } = await newPage(browser, await seed(), w, w === 1440 ? 900 : 667);
    await load(page, withTheme, '/cart', themeId); await sleep(1200);
    await page.screenshot({ path: `docs/qa/screenshots/t6bqa-cart-${w}.png`, fullPage: true });
    await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1200);
    await page.locator('[data-cart-drawer-trigger]').first().click(); await sleep(900);
    await page.screenshot({ path: `docs/qa/screenshots/t6bqa-drawer-${w}.png` });
    rec('shots@' + w, { logs: page.__logs });
    await ctx.close();
  }
});
writeFileSync(`docs/qa/evidence/t6bqa-cartpage-${label}.json`, JSON.stringify(out, null, 1));
await browser.close();
