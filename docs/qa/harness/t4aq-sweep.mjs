// C4a.3 / C4a.4 / C4a.16 / C4a.17b independent sweep on the served tree (head).
import { chromium, parseArgs, loginState, newPage, seed, sleep, H } from './t4aq-lib.mjs';
const { withTheme, origin } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);

const sweep = (rootSel) => {
  const roots = rootSel === 'ATC' ? [...document.querySelectorAll('button[name="add"]')] : rootSel === 'CARTMAIN' ? [...document.querySelectorAll('[id^="shopify-section-template"][id$="__main"]')] : [...document.querySelectorAll('cart-drawer')];
  const els = roots.flatMap((r) => [r, ...r.querySelectorAll('*')]).filter((e) => !e.closest('[id^="shopify-block-"]'));
  const unlayered = []; const legacyClasses = new Set();
  const visit = (rules, inLayer, owner) => {
    for (const r of rules) {
      const t = r.constructor.name;
      if (t === 'CSSLayerBlockRule') { if (/legacy/.test(r.name)) collect(r.cssRules); continue; }
      if (t === 'CSSMediaRule') { if (matchMedia(r.conditionText || r.media.mediaText).matches) visit(r.cssRules, inLayer, owner); continue; }
      if (t === 'CSSSupportsRule') { if (CSS.supports(r.conditionText)) visit(r.cssRules, inLayer, owner); continue; }
      if (t === 'CSSStyleRule') { let n = 0; try { n = els.filter((e) => e.matches(r.selectorText)).length; } catch (e) {} if (n) unlayered.push(`${owner}: ${r.selectorText.slice(0, 80)} x${n}`); }
    }
  };
  const collect = (rules) => { for (const r of rules) { if (r.cssRules && r.constructor.name !== 'CSSStyleRule') collect(r.cssRules); if (r.selectorText) for (const m of r.selectorText.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) legacyClasses.add(m[1]); } };
  for (const sh of document.styleSheets) {
    let rules; try { rules = sh.cssRules; } catch (e) { continue; }
    visit(rules, false, sh.href ? sh.href.split('/').pop().split('?')[0] : 'inline');
  }
  const used = new Set(); els.forEach((e) => e.classList && e.classList.forEach((c) => used.add(c)));
  const inter = [...used].filter((c) => legacyClasses.has(c));
  const empties = els.filter((e) => e.tagName === 'DIV' && e.childNodes.length === 0).map((e) => e.outerHTML.slice(0, 80) + ' display=' + getComputedStyle(e).display);
  const imgs = els.filter((e) => e.tagName === 'IMG');
  return { roots: roots.length, elements: els.length, unlayered: unlayered.slice(0, 8), legacyIntersection: inter, emptyDivs: empties, imgsNoDims: imgs.filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length, imgs: imgs.length, headings: els.filter((e) => /^H[1-6]$/.test(e.tagName)).map((e) => e.tagName).join(',') };
};

for (const w of [375, 1440]) {
  const vh = w === 1440 ? 900 : 812;
  console.log(`\n===== ${w} =====`);
  // /cart empty, one
  for (const [name, handles] of [['cart-empty', []], ['cart-one', [H.wax]]]) {
    const { ctx, page } = await newPage(browser, state, w, vh);
    if (handles.length) await seed(page, withTheme, handles);
    const resp = await page.goto(withTheme('/cart'), { waitUntil: 'load' });
    const link = resp.headers()['link'] || '';
    console.log(name, 'Link preload count', (link.match(/rel="preload"/g) || []).length, '| h1', await page.locator('h1').count());
    console.log(' main:', JSON.stringify(await page.evaluate(sweep, 'CARTMAIN')));
    console.log(' drawer closed:', JSON.stringify(await page.evaluate(sweep, 'DRAWER')));
    await ctx.close();
  }
  // wax with drawer open: one, busy, empty
  const { ctx, page } = await newPage(browser, state, w, vh);
  await page.goto(withTheme('/products/' + H.wax), { waitUntil: 'load' });
  console.log('wax ATC at rest:', JSON.stringify(await page.evaluate(sweep, 'ATC')));
  await page.locator('button[name="add"]').first().click(); await sleep(1200);
  console.log('drawer open one:', JSON.stringify(await page.evaluate(sweep, 'DRAWER')), '| h1 on page', await page.locator('h1').count());
  await page.route('**/cart/change*', async (r) => { await sleep(1500); await r.continue(); });
  const q = page.locator('.cart-drawer__quantity-input').first(); await q.fill('2'); await q.blur(); await sleep(400);
  console.log('drawer busy:', JSON.stringify(await page.evaluate(sweep, 'DRAWER')));
  await sleep(2000); await page.unroute('**/cart/change*');
  await page.locator('.cart-drawer__item-remove').first().click(); await sleep(1200);
  console.log('drawer empty:', JSON.stringify(await page.evaluate(sweep, 'DRAWER')));
  const sec = await page.evaluate(async () => { const h = await (await fetch('/?section_id=cart-drawer')).text(); const d = new DOMParser().parseFromString(h, 'text/html'); return { inner: d.querySelectorAll('.cart-drawer__inner').length }; });
  console.log('section api:', JSON.stringify(sec));
  await ctx.close();
}
await browser.close();
