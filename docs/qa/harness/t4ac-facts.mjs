// T4a Coder: facts + M_css + behavior probes (plan section 13 Step 0 items 2-9, 12; reused at head).
// Usage: node t4ac-facts.mjs <previewBase> <label>   Output: docs/qa/evidence/t4ac-facts-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, seedCart, openDrawer, closeDrawer, drawerOpen, sleep, HANDLES } from './t4ac-lib.mjs';

const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
const out = { label };

// Stylesheet transfer per page (M_css): compressed bytes from content-length, else the body length; head vs body from the DOM.
async function mcss(page, path) {
  const sheets = [];
  const onResp = async (r) => {
    if (r.request().resourceType() !== 'stylesheet') return;
    const h = await r.allHeaders();
    let n = Number(h['content-length'] || 0);
    if (!n) { try { n = (await r.body()).length; } catch { n = 0; } }
    sheets.push({ url: r.url().replace(/\?.*$/, '').replace(/^https?:\/\/[^/]+/, ''), n, enc: h['content-encoding'] || '' });
  };
  page.on('response', onResp);
  const resp = await page.goto(withTheme(path), { waitUntil: 'load' });
  await sleep(700);
  page.off('response', onResp);
  const dom = await page.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => ({ href: l.getAttribute('href').replace(/\?.*$/, ''), inHead: !!l.closest('head') })));
  const headers = resp.headers();
  const lstyle = await page.evaluate(() => [...document.querySelectorAll('#shopify-section-cart-drawer style')].reduce((a, s) => a + s.textContent.length, 0));
  const dawn = dom.filter((d) => !/tailwind\.css|base\.css/.test(d.href));
  const themeSheets = sheets.filter((x) => !/preview-bar/.test(x.url));
  const sum = (arr) => arr.reduce((a, x) => a + x.n, 0);
  const headHrefs = dom.filter((d) => d.inHead).map((d) => d.href.split('/').pop());
  const B_head = sum(themeSheets.filter((x) => headHrefs.includes(x.url.split('/').pop())));
  return { B_head, B_body: sum(themeSheets) - B_head, B_doc: sum(themeSheets), sheets: themeSheets, dom, link: (headers.link || '').split(',').length, lstyle, nDawn: dawn.length, dawn: dawn.map((d) => d.href.split('/').pop()) };
}

{
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  out.mcss = {};
  for (const path of ['/', '/products/' + HANDLES.wax]) out.mcss[path] = await mcss(page, path);
  // compiled_assets/styles.css (item 3)
  out.compiled = await page.evaluate(async () => {
    const link = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href).find((h) => /compiled_assets\/styles\.css/.test(h));
    if (!link) return { found: false };
    const t = await (await fetch(link)).text();
    return { found: true, size: t.length, hasImageRule: /(^|[},])\.image(\{|,|\s)/.test(t) || /\.image>img/.test(t), hasDrawerRule: /cart-drawer/.test(t) };
  });
  // Banner fixtures (item 7): the api view renders JSON in the body.
  out.banner = {};
  for (const h of [HANDLES.snow, HANDLES.wax]) {
    await page.goto(withTheme(`/products/${h}?view=api`), { waitUntil: 'load' });
    out.banner[h] = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 400);
  }
  // Natural widths of Update / Checkout buttons (item 12). Needs btn-* utilities, which any theme page has.
  await page.goto(withTheme('/cart'), { waitUntil: 'load' });
  out.btnWidths = await page.evaluate(() => {
    const m = (cls, text) => { const b = document.createElement('button'); b.className = cls; b.textContent = text; b.style.position = 'absolute'; b.style.left = '0'; b.style.top = '0'; document.body.appendChild(b); const w = b.getBoundingClientRect().width; b.remove(); return Math.round(w * 10) / 10; };
    const u = m('btn-secondary', 'Update'); const c = m('btn-primary', 'Checkout');
    return { update: u, checkout: c, sharesRowAt375: u + c + 12 <= 271 };
  });
  await ctx.close();
}

// /cart one-item M_css.
{
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await seedCart(page, withTheme, [HANDLES.wax]);
  out.mcss['/cart'] = await mcss(page, '/cart');
  // Drawer facts (item 4): host classes/attrs and body style while open, and the outside click.
  await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' });
  const hostInfo = () => page.evaluate(() => { const h = document.querySelector('cart-drawer'); return { cls: h.className, attrs: [...h.attributes].map((a) => a.name + '=' + a.value).filter((x) => !/^class=/.test(x)), bodyStyle: document.body.getAttribute('style'), bodyOverflow: getComputedStyle(document.body).overflow }; });
  out.closedHost = await hostInfo();
  await openDrawer(page);
  out.openHost = await hostInfo();
  out.overlayDisplay = await page.evaluate(() => getComputedStyle(document.querySelector('#CartDrawer').firstElementChild).display);
  out.elementAt10_400 = await page.evaluate(() => { const e = document.elementFromPoint(10, 400); return e ? (e.tagName + '.' + String(e.className).slice(0, 60) + (e.closest('[role=dialog]') ? ' (in dialog)' : '')) : null; });
  await page.mouse.click(10, 400);
  await sleep(450);
  out.stillOpenAfterOutsideClick1440 = await drawerOpen(page);
  if (await drawerOpen(page)) await closeDrawer(page);
  out.afterCloseHost = await hostInfo();
  await ctx.close();
}

// Empty drawer (item 5).
{
  const { ctx, page } = await newPage(browser, state, 375, 812);
  await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' });
  await openDrawer(page);
  out.empty = await page.evaluate(() => {
    const p = document.querySelector('#CartDrawer-CartItems p');
    const a = document.querySelector('#CartDrawer-CartItems a');
    const s = a && getComputedStyle(a);
    return { text: p && p.textContent.trim(), linkText: a && a.textContent.trim(), linkPadding: s && s.padding, linkFont: s && s.fontSize, linkDisplay: s && s.display, closeLabel: document.querySelector('[role=dialog] button')?.getAttribute('aria-label') };
  });
  await ctx.close();
}

await browser.close();
writeFileSync(`docs/qa/evidence/t4ac-facts-${label}.json`, JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out.mcss)) console.log('mcss', k, 'B_head', v.B_head, 'B_body', v.B_body, 'B_doc', v.B_doc, 'N_dawn', v.nDawn, v.dawn.join('|'), 'L_style', v.lstyle, 'linkHdrs', v.link);
for (const k of ['compiled', 'banner', 'btnWidths', 'closedHost', 'openHost', 'overlayDisplay', 'elementAt10_400', 'stillOpenAfterOutsideClick1440', 'afterCloseHost', 'empty']) console.log(k, JSON.stringify(out[k]));
