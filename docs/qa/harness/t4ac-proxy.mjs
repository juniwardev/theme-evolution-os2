// T4a Coder: settings proxies PX1-PX4 (plan section 10). The tree under test is a scratch copy served by `shopify theme dev --path` on the
// private development theme; this script only reads the rendered storefront.
// Usage: node t4ac-proxy.mjs <previewBase> <variant> <label>     variant: px34 | px1 | px2   Output: docs/qa/evidence/t4ac-proxy-<variant>-<label>.json
//   px34: scratch has the banner forced on (PX3) and input_corner_radius 10 (PX4)    -> C4a.19, C4a.21
//   px1:  enable_cart_drawer false                                                    -> C4a.18
//   px2:  foreground #ee1188, background #112233 and the PX3 banner                   -> C4a.15
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, seedCart, openDrawer, sleep, HANDLES } from './t4ac-lib.mjs';

const [, variant, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
const out = { variant, label };

const bannerFn = () => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const channel = (css) => { const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 1, 1); g.fillStyle = css; g.fillRect(0, 0, 1, 1); const d = g.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; };
  const p = [...document.querySelectorAll('p')].find((x) => /sustainable item/.test(x.textContent));
  if (!p) return null;
  const el = p.parentElement;
  const s = getComputedStyle(el);
  const b = el.getBoundingClientRect();
  const o = { x: r1(b.left), w: r1(b.width), h: r1(b.height) };
  for (const k of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderTopLeftRadius', 'fontWeight', 'fontSize', 'lineHeight', 'textAlign']) o[k] = s[k];
  for (const k of ['backgroundColor', 'color', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor']) o[k + 'Ch'] = channel(s[k]);
  return o;
};

const qtyFn = (sel) => { const e = document.querySelector(sel); if (!e) return null; const s = getComputedStyle(e); return { tl: s.borderTopLeftRadius, bl: s.borderBottomLeftRadius, tr: s.borderTopRightRadius }; };

if (variant === 'px34') {
  for (const vw of [375, 1440]) {
    const { ctx, page } = await newPage(browser, state, vw, vw >= 1000 ? 900 : 812);
    await seedCart(page, withTheme, [HANDLES.wax]);
    await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' });
    await openDrawer(page);
    out[`drawer-${vw}`] = { banner: await page.evaluate(bannerFn), qty: await page.evaluate(qtyFn, '#CartDrawer-CartItems input[name="updates[]"]') };
    await page.goto(withTheme('/cart'), { waitUntil: 'load' });
    await sleep(300);
    out[`cart-${vw}`] = { banner: await page.evaluate(bannerFn), qty: await page.evaluate(qtyFn, 'input[name="updates[]"]'), L: await page.evaluate(() => document.querySelector('header a[href="/"]').getBoundingClientRect().left) };
    await ctx.close();
  }
}

if (variant === 'px1') {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' });
  out.drawerEl = await page.evaluate(() => !!document.querySelector('cart-drawer'));
  out.trigger = await page.evaluate(() => document.querySelectorAll('[data-cart-drawer-trigger]').length);
  out.cartLink = await page.evaluate(() => document.querySelector('[data-header-cart-icon]')?.getAttribute('href') || document.querySelector('a[href="/cart"]')?.getAttribute('href'));
  await Promise.all([page.waitForURL(/\/cart/), page.locator('button[name="add"]').first().click()]);
  await sleep(500);
  out.afterAddUrl = page.url().replace(/\?.*$/, '').replace(/^https?:\/\/[^/]+/, '');
  out.rowsOnCart = await page.locator('[id^="shopify-section-template"][id$="__main"] input[name="updates[]"]').count();
  await ctx.close();
}

if (variant === 'px2') {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await seedCart(page, withTheme, [HANDLES.wax]);
  await page.goto(withTheme('/products/' + HANDLES.wax), { waitUntil: 'load' });
  out.fgVar = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-foreground').trim());
  out.bgVar = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim());
  await openDrawer(page);
  out.drawer = await page.evaluate(() => {
    const css = (e, k) => (e ? getComputedStyle(e)[k] : null);
    const panel = document.querySelector('[role="dialog"]');
    const header = panel.firstElementChild;
    const title = document.querySelector('#CartDrawer-Form [data-cart-drawer-item] a, #CartDrawer-Form .cart-drawer__item a');
    const remove = document.querySelector('.cart-drawer__item-remove');
    const co = document.querySelector('#CartDrawer-Checkout');
    return { panelBg: css(panel, 'backgroundColor'), headerBorderBottom: css(header, 'borderBottomColor'), titleColor: css(title, 'color'), removeColor: css(remove, 'color'), checkoutBg: css(co, 'backgroundColor') };
  });
  out.banner = await page.evaluate(bannerFn);
  await ctx.close();
}

await browser.close();
writeFileSync(`docs/qa/evidence/t4ac-proxy-${variant}-${label}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out));
