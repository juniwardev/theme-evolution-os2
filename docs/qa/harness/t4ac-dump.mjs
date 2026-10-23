// T4a Coder: dump (plan section 10 measurement protocol) for the drawer states, /cart, the image wrappers and the Add to cart spinner.
// Usage: node t4ac-dump.mjs <previewBase> <label> [outDir=docs/qa/evidence]
// Output: <outDir>/t4ac-dump-<label>.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, seedCart, clearCart, openDrawer, closeDrawer, measureDrawer, overflowFn, sleep, HANDLES, PROPS } from './t4ac-lib.mjs';

const [, label, outDirArg] = process.argv.slice(2);
const outDir = outDirArg || 'docs/qa/evidence';
const { withTheme } = parseArgs();
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');

const out = { label, drawer: {}, cart: {}, images: {}, spinner: null };

// Cart page structural measurement; works on the table markup and the list markup.
const cartPageFn = (props) => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const root = document.querySelector('[id^="shopify-section-template"][id$="__main"]');
  if (!root) return null;
  const rb = root.getBoundingClientRect();
  const rec = (el) => {
    const b = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    const o = { x: r1(b.left), y: r1(b.top - rb.top), w: r1(b.width), h: r1(b.height), right: r1(b.right) };
    for (const p of props) o[p] = s[p];
    return o;
  };
  const named = {};
  const add = (name, el) => { if (el) named[name] = rec(el); };
  add('root', root);
  const content = root.querySelector('[data-cart-page]') || root.firstElementChild;
  add('content', content);
  add('h1', root.querySelector('h1'));
  add('table', root.querySelector('table'));
  add('ul', root.querySelector('ul'));
  [...root.querySelectorAll('tr, li')].forEach((r, i) => add('row' + i, r));
  [...root.querySelectorAll('img')].forEach((r, i) => { add('img' + i, r); named['img' + i].nat = r.naturalWidth; named['img' + i].attrs = { width: r.getAttribute('width'), height: r.getAttribute('height'), src: r.currentSrc.replace(/^.*\/files\//, '') }; });
  [...root.querySelectorAll('input:not([type=hidden])')].forEach((r, i) => { add('input' + i, r); named['input' + i].type = r.type; named['input' + i].name = r.name; });
  [...root.querySelectorAll('button')].forEach((r, i) => { add('button' + i, r); named['button' + i].text = r.textContent.trim(); });
  [...root.querySelectorAll('a')].forEach((r, i) => { add('a' + i, r); named['a' + i].text = r.textContent.trim(); named['a' + i].cls = String(r.className); });
  [...root.querySelectorAll('td p, li p, p')].forEach((r, i) => add('p' + i, r));
  const logo = document.querySelector('header a[href="/"]');
  const cart = document.querySelector('[data-header-cart-icon]');
  return { named, L: logo ? r1(logo.getBoundingClientRect().left) : null, R: cart ? r1(cart.getBoundingClientRect().right) : null, tableFontSize: root.querySelector('table') ? getComputedStyle(root.querySelector('table')).fontSize : null, tableLayout: root.querySelector('table') ? getComputedStyle(root.querySelector('table')).tableLayout : null };
};

const imgFn = (props) => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const res = [];
  for (const img of document.querySelectorAll('[id^="shopify-section-template"] img')) {
    const w = img.parentElement;
    if (!/(^| )image( |$)|overflow-hidden/.test(String(w.className)) || !/^(A|DIV)$/.test(w.tagName)) continue;
    const row = { wrapperCls: String(w.className), imgCls: String(img.className), tag: w.tagName };
    for (const [n, el] of [['wrap', w], ['img', img]]) {
      const b = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      row[n] = { w: r1(b.width), h: r1(b.height), display: s.display, position: s.position, overflow: s.overflow, width: s.width, height: s.height };
    }
    row.attrs = { width: img.getAttribute('width'), height: img.getAttribute('height') };
    res.push(row);
  }
  return res;
};

// One seeded context per cart state; the viewport is resized between widths so the run stays at a modest request rate
// (Cloudflare answers 429 to bursts of page loads, see the T0 QA report).
const STATES = [['empty', []], ['one', [HANDLES.wax]], ['two', [HANDLES.wax, HANDLES.snow]]];
for (const [stateName, handles] of STATES) {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await seedCart(page, withTheme, handles);
  // Drawer on the wax product page at 375 and 1440 (reload once per width; the drawer is open/closed state sensitive).
  for (const vw of [375, 1440]) {
    await page.setViewportSize({ width: vw, height: vw >= 1000 ? 900 : 812 });
    await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' });
    const key = `${stateName}-${vw}`;
    out.drawer[key] = { closed: await measureDrawer(page) };
    await openDrawer(page);
    out.drawer[key].open = await measureDrawer(page);
    out.drawer[key].overflow = await page.evaluate(overflowFn);
    if (stateName === 'one') {
      // Busy state: hold the drawer's own update request for 1.5 s, change the quantity, measure during the wait.
      let url = null;
      const onReq = (r) => { if (/\/cart\/change/.test(r.url())) url = r.url().replace(/^https?:\/\/[^/]+/, ''); };
      page.on('request', onReq);
      await page.route('**/cart/change*', async (route) => { await sleep(1500); await route.continue().catch(() => {}); });
      const input = page.locator('#CartDrawer-Form input[name="updates[]"]').first();
      await input.fill('3');
      await input.evaluate((e) => e.blur());
      await sleep(300);
      out.drawer[key].busy = await measureDrawer(page);
      out.drawer[key].busyHost = await page.evaluate(() => ({ cls: document.querySelector('cart-drawer').className, ariaBusy: document.querySelector('cart-drawer').getAttribute('aria-busy') }));
      await sleep(2200);
      out.drawer[key].changeUrl = url;
      await page.unroute('**/cart/change*');
      page.off('request', onReq);
      // put the quantity back to 1 so the later widths measure the same cart
      const input2 = page.locator('#CartDrawer-Form input[name="updates[]"]').first();
      await input2.fill('1');
      await input2.evaluate((e) => e.blur());
      await sleep(1500);
    }
    await sleep(500);
  }
  // /cart at the plan's widths: one load, then resize.
  await page.goto(withTheme('/cart'), { waitUntil: 'load' });
  await sleep(300);
  for (const vw of [320, 375, 390, 430, 768, 1440, 1920]) {
    await page.setViewportSize({ width: vw, height: vw >= 1000 ? 900 : 812 });
    await sleep(250);
    const m = await page.evaluate(cartPageFn, PROPS);
    const ov = await page.evaluate(overflowFn);
    const h1 = await page.locator('h1').count();
    out.cart[`${stateName}-${vw}`] = { m, ov, h1 };
  }
  await ctx.close();
}

// Image wrappers (C4a.20).
for (const vw of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
  for (const path of ['/collections/all', '/search?q=snowboard']) {
    await page.goto(withTheme(path), { waitUntil: 'load' });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
    await sleep(300);
    out.images[`${path}-${vw}`] = await page.evaluate(imgFn);
  }
  await ctx.close();
}

// Add to cart spinner while the theme's own request is held (C4a.7 b).
{
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' });
  let addUrl = null;
  page.on('request', (r) => { if (/\/cart\/add/.test(r.url())) addUrl = r.url().replace(/^https?:\/\/[^/]+/, ''); });
  await page.route('**/cart/add*', async (route) => { await sleep(1500); await route.continue().catch(() => {}); });
  const btn = page.locator('button[name="add"]').first();
  await btn.click();
  await sleep(300);
  out.spinner = await page.evaluate(() => {
    const r1 = (n) => Math.round(n * 10) / 10;
    const b = document.querySelector('button[name="add"]');
    const w = b.querySelector('.loading__spinner');
    const svg = w.querySelector('svg');
    const circ = svg.querySelector('circle');
    const rec = (el) => { const x = el.getBoundingClientRect(); const s = getComputedStyle(el); return { x: r1(x.left), y: r1(x.top), w: r1(x.width), h: r1(x.height), display: s.display, position: s.position, animationName: s.animationName, cw: s.width, ch: s.height }; };
    const attrs = (el) => [...el.attributes].filter((a) => a.name !== 'class').map((a) => `${a.name}=${a.value}`).sort();
    return { btn: rec(b), wrapper: rec(w), wrapperCls: w.className, svg: rec(svg), svgCls: [...svg.classList].sort(), svgAttrs: attrs(svg), circleAttrs: attrs(circ), circleCls: String(circ.className.baseVal) };
  });
  out.spinnerAddUrl = addUrl;
  await sleep(2500);
  await ctx.close();
}

await browser.close();
writeFileSync(`${outDir}/t4ac-dump-${label}.json`, JSON.stringify(out));
console.log('wrote', `${outDir}/t4ac-dump-${label}.json`);
