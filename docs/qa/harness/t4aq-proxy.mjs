// Settings/markup proxy measurements on whichever scratch copy is being served. usage: node t4aq-proxy.mjs <previewUrl> <variant> <label> <outJson>
// variant is only a label here (the scratch copy decides what is rendered): px1 | px2 | px34
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, seed, sleep, H } from './t4aq-lib.mjs';
const { withTheme } = parseArgs();
const [, , , variant, label, outFile] = process.argv;
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const res = { variant, label };

const measure = () => {
  const ch = (css) => { const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 1, 1); g.fillStyle = css; g.fillRect(0, 0, 1, 1); return [...g.getImageData(0, 0, 1, 1).data.slice(0, 3)]; };
  const cs = (e, p) => (e ? getComputedStyle(e)[p] : null);
  const host = document.querySelector('cart-drawer');
  if (!host) return { drawer: false, triggers: document.querySelectorAll('[data-cart-drawer-trigger]').length, cartLinkHref: document.querySelector('[data-header-cart-icon]')?.getAttribute('href') };
  const panel = host.querySelector('[role="dialog"]');
  const header = panel.firstElementChild;
  const title = host.querySelector('.cart-drawer__item-title, [data-cart-drawer-item] a:first-child, .cart-drawer__item a');
  const remove = host.querySelector('.cart-drawer__item-remove');
  const checkout = host.querySelector('#CartDrawer-Checkout');
  const qty = host.querySelector('.cart-drawer__quantity-input');
  const bp = [...panel.querySelectorAll('p')].find((p) => /sustainable/i.test(p.textContent));
  const bd = bp ? bp.parentElement : null;
  return {
    drawer: true, fg: getComputedStyle(document.documentElement).getPropertyValue('--color-foreground').trim(), bg: getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim(),
    panelBg: ch(cs(panel, 'backgroundColor')), title: title && ch(cs(title, 'color')), headerBorder: ch(cs(header, 'borderBottomColor')),
    remove: remove && ch(cs(remove, 'color')), checkoutBg: checkout && ch(cs(checkout, 'backgroundColor')), checkoutColor: checkout && ch(cs(checkout, 'color')),
    banner: bd && { bg: ch(cs(bd, 'backgroundColor')), color: ch(cs(bd, 'color')), pad: [cs(bd, 'paddingTop'), cs(bd, 'paddingLeft')], margin: [cs(bd, 'marginTop'), cs(bd, 'marginRight'), cs(bd, 'marginBottom'), cs(bd, 'marginLeft')], radius: cs(bd, 'borderTopLeftRadius'), bw: cs(bd, 'borderTopWidth'), bcol: ch(cs(bd, 'borderTopColor')), fw: cs(bd, 'fontWeight'), fs: cs(bd, 'fontSize'), lh: cs(bd, 'lineHeight'), ta: cs(bd, 'textAlign'), rect: (() => { const r = bd.getBoundingClientRect(), p = panel.getBoundingClientRect(); return [r.left - p.left, r.top - p.top, r.width, r.height].map((n) => Math.round(n * 10) / 10); })() },
    qtyRadius: qty && cs(qty, 'borderTopLeftRadius'),
  };
};

if (variant === 'px1') {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme('/products/' + H.wax), { waitUntil: 'load' });
  res.m = await page.evaluate(measure);
  res.nav = null;
  await Promise.all([page.waitForURL(/\/cart/, { timeout: 15000 }).catch(() => {}), page.locator('button[name="add"]').first().click()]);
  await sleep(1500);
  res.afterAdd = { url: page.url().split('?')[0], rows: await page.locator('[data-cart-page] ul > li, table tbody tr, .cart-item').count() };
  await page.locator('[data-header-cart-icon]').first().click().catch(() => {});
  await sleep(1000);
  res.afterIconClick = page.url().split('?')[0];
  await ctx.close();
} else {
  for (const w of [1440, 375]) {
    const { ctx, page } = await newPage(browser, state, w, w === 1440 ? 900 : 812);
    await seed(page, withTheme, [H.wax]);
    await page.goto(withTheme('/products/' + H.wax), { waitUntil: 'load' });
    await page.locator('[data-header-cart-icon]').first().click();
    await sleep(700);
    res['drawer@' + w] = await page.evaluate(measure);
    if (variant === 'px2' && w === 1440) await page.screenshot({ path: `docs/qa/screenshots/t4aq-${label}-px2-drawer-1440.png` });
    await page.goto(withTheme('/cart'), { waitUntil: 'load' });
    await sleep(300);
    res['cart@' + w] = await page.evaluate(() => {
      const q = document.querySelector('input[name="updates[]"]'); const m = document.querySelector('[id^="shopify-section-template"][id$="__main"]');
      const hdr = document.querySelector('[data-header-cart-icon]');
      const bp = [...document.querySelectorAll('p')].find((p) => /sustainable/i.test(p.textContent)); const b = bp ? bp.parentElement : null;
      const r = b && b.getBoundingClientRect();
      return { qtyRadius: q && getComputedStyle(q).borderTopLeftRadius, banner: b && { x: r.left, w: r.width, y: Math.round(r.top), cls: b.className.slice(0, 40), bgc: getComputedStyle(b).backgroundColor }, h1x: m && m.querySelector('h1')?.getBoundingClientRect().left };
    });
    await ctx.close();
  }
}
writeFileSync(outFile, JSON.stringify(res, null, 1));
console.log(JSON.stringify(res));
await browser.close();
