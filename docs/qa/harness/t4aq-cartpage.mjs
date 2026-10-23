// T4a QA: /cart page. usage: node t4aq-cartpage.mjs <previewUrl> <label>
import { chromium, parseArgs, loginState, newPage, seed, sleep, H } from './t4aq-lib.mjs';
const { withTheme } = parseArgs();
const label = process.argv[3] || 'head';
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = (...a) => console.log(...a);
const WIDTHS = (process.argv[4] || "320,375,390,430,768,1440,1920").split(",").map(Number);

const probe = () => {
  const vw = document.documentElement.clientWidth;
  const off = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (el.closest('cart-drawer, #preview-bar-iframe, [id^="shopify-block-"]')) continue;
    const b = el.getBoundingClientRect();
    if (!b.width || !b.height) continue;
    if (b.right > vw + 1 || b.left < -1) off.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)} l${Math.round(b.left)} r${Math.round(b.right)}`);
  }
  const main = document.querySelector('[id^="shopify-section-template"][id$="__main"]');
  const q = (s) => main && main.querySelector(s);
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return [Math.round(b.left * 10) / 10, Math.round(b.top * 10) / 10, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10]; };
  const h1 = q('h1');
  const h1cs = h1 && getComputedStyle(h1);
  return {
    overflowPx: document.documentElement.scrollWidth - vw, off: off.slice(0, 6),
    table: document.querySelectorAll('table').length, h1Count: document.querySelectorAll('h1').length,
    h1: h1 && { r: r(h1), fs: h1cs.fontSize, ff: h1cs.fontFamily.slice(0, 12), tt: h1cs.textTransform, text: h1.textContent.trim() },
    rootPad: main && getComputedStyle(main.firstElementChild || main).paddingTop,
    mainPadTop: main && [...main.querySelectorAll('[data-cart-page]')].map((e) => getComputedStyle(e).paddingTop + '/' + getComputedStyle(e).paddingBottom),
    liCount: main ? main.querySelectorAll('[data-cart-page] ul > li').length : null,
    ul: r(q('ul')), li0: r(q('li')),
    img: r(q('li img')), imgAttrs: q('li img') && [q('li img').getAttribute('width'), q('li img').getAttribute('height'), q('li img').naturalWidth, q('li img').currentSrc.slice(-60)],
    qty: r(q('li input[name="updates[]"]')), qtyRadius: q('li input[name="updates[]"]') && getComputedStyle(q('li input[name="updates[]"]')).borderTopLeftRadius,
    qtyLabel: q('li label') && [q('li label').textContent.trim(), getComputedStyle(q('li label')).position],
    removes: main ? main.querySelectorAll('li a[href*="change"]').length : 0,
    submits: main ? [...main.querySelectorAll('button[type=submit], input[type=submit]')].map((b) => ({ name: b.name, cls: b.className.slice(0, 40), h: Math.round(b.getBoundingClientRect().height), r: r(b), bg: getComputedStyle(b).backgroundColor, text: (b.textContent || b.value).trim() })) : [],
    forms: main ? [...main.querySelectorAll('form')].map((f) => ({ action: f.getAttribute('action'), method: f.method })) : [],
    emptyText: main && main.innerText.replace(/\s+/g, ' ').slice(0, 160),
    emptyLink: main && q('a.btn-primary') && [q('a.btn-primary').getAttribute('href'), q('a.btn-primary').textContent.trim()],
    imgsNoDims: main ? [...main.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length : 0,
    headerR: r(document.querySelector('[data-header-cart-icon]')),
  };
};

const states = { empty: [], one: [H.wax], two: [H.wax, H.snow] };
for (const [name, handles] of Object.entries(states)) {
  for (const w of WIDTHS) {
    const { ctx, page, log } = await newPage(browser, state, w, 812);
    if (handles.length) await seed(page, withTheme, handles);
    await page.goto(withTheme('/cart'), { waitUntil: 'load' });
    await sleep(300);
    const p = await page.evaluate(probe);
    out(`\n[${label}] ${name} @${w} overflow=${p.overflowPx} off=${JSON.stringify(p.off)}`);
    if (w === 375 || w === 1440 || (name === 'one' && (w === 320 || w === 768 || w === 1920))) out(JSON.stringify(p));
    if (['empty', 'one', 'two'].includes(name) && w === 375) await page.screenshot({ path: `docs/qa/screenshots/t4aq-${label}-cart-${name}-375.png`, fullPage: true });
    if (w === 1440) await page.screenshot({ path: `docs/qa/screenshots/t4aq-${label}-cart-${name}-1440.png`, fullPage: true });
    const bad = [...log.console.filter((x) => !/monorail/i.test(x)), ...log.pageerror, ...log.bad];
    if (bad.length) out('LOG', JSON.stringify(bad));
    await ctx.close();
  }
}

// Behavior: two items, change qty on item 1 -> Update; remove item 2
if (label === 'head') {
  const { ctx, page, log } = await newPage(browser, state, 1440, 900);
  await seed(page, withTheme, [H.wax, H.snow]);
  await page.goto(withTheme('/cart'), { waitUntil: 'load' });
  const badge = async () => (await page.locator('[data-header-cart-icon]').first().innerText()).trim();
  out('\nbehavior: badge before', await badge());
  const q1 = page.locator('[data-cart-page] li input[name="updates[]"]').first();
  await q1.fill('2');
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.locator('button[type=submit]', { hasText: /update/i }).first().click()]);
  out('after Update: url', page.url().split('?')[0], 'qty1', await page.locator('[data-cart-page] li input[name="updates[]"]').first().inputValue(), 'badge', await badge(), 'rows', await page.locator('[data-cart-page] ul > li').count());
  const rm = page.locator('[data-cart-page] li a[href*="change"]').nth(1);
  out('remove href:', await rm.getAttribute('href'));
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), rm.click()]);
  out('after remove: rows', await page.locator('[data-cart-page] ul > li').count(), 'badge', await badge());
  out('LOG', JSON.stringify([...log.console.filter((x) => !/monorail/i.test(x)), ...log.pageerror, ...log.bad]));
  await ctx.close();
}
await browser.close();
