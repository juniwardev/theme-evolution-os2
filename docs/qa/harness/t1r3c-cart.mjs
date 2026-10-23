// T1 re-run: cart flow and cart-badge look. Real product-form Add click, badge 1, drawer quantity 3, badge 3, remove, badge 0.
// After each step: cart link box, svg box, badge box, badge/bag overlap. Screenshots (3x device) of the icon row.
// Usage: node docs/qa/harness/t1r-cart.mjs <previewBase> [widthsCsv=1440,375]
import { chromium, parseArgs, loginState } from './t0-lib.mjs';

const { withTheme } = parseArgs();
const widths = (process.argv[3] || '1440,375').split(',').map(Number);
const SHOTS = 'docs/qa/screenshots';
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);

const probe = () => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const a = document.querySelector('[data-header-cart-icon]');
  const svg = a && a.querySelector('svg');
  const path = svg && svg.querySelector('path');
  const b = a && a.querySelector('[data-count]');
  const box = (e) => { if (!e) return null; const x = e.getBoundingClientRect(); return [r1(x.width), r1(x.height), r1(x.left), r1(x.top)]; };
  const bag = path && path.getBoundingClientRect();
  const bb = b && !b.hidden && getComputedStyle(b).display !== 'none' ? b.getBoundingClientRect() : null;
  const overlapX = bag && bb ? r1(Math.min(bag.right, bb.right) - Math.max(bag.left, bb.left)) : null;
  const overlapY = bag && bb ? r1(Math.min(bag.bottom, bb.bottom) - Math.max(bag.top, bb.top)) : null;
  return {
    links: document.querySelectorAll('[data-header-cart-icon]').length,
    link: box(a), svg: box(svg), bag: box(path), badge: bb ? box(b) : null, text: b && b.textContent.trim(), count: b && b.dataset.count, hidden: b && b.hidden,
    overlap: [overlapX, overlapY], badgeRightVsViewport: bb ? r1(innerWidth - bb.right) : null, xPage: document.documentElement.scrollWidth - innerWidth,
    attrs: a && [...a.attributes].map((x) => x.name).join(','),
    aria: a && a.getAttribute('aria-label'),
  };
};

for (const vw of widths) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vw >= 1000 ? 900 : 667 } });
  const page = await ctx.newPage();
  const shot = (name) => page.screenshot({ path: `${SHOTS}/t1r3c-${name}-${vw}.png`, clip: { x: Math.max(0, vw - 240), y: 0, width: Math.min(vw, 240), height: 70 }, scale: 'device' });
  await page.goto(withTheme('/products/selling-plans-ski-wax'), { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  console.log(vw, 'empty', JSON.stringify(await page.evaluate(probe)));
  await shot('cart-empty');
  await page.locator('form[action*="/cart/add"] button[type=submit]').first().click();
  await page.waitForTimeout(3000);
  console.log(vw, 'after add (drawer open)', JSON.stringify(await page.evaluate(probe)), 'drawer', await page.evaluate(() => document.querySelector('cart-drawer')?.className));
  const q = page.locator('input.cart-drawer__quantity-input').first();
  if (vw >= 1000 && (await q.count())) {
    await q.fill('3'); await q.dispatchEvent('change'); await page.waitForTimeout(3000);
    console.log(vw, 'qty 3', JSON.stringify(await page.evaluate(probe)));
    await shot('cart-badge3-drawer');
  }
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  if (vw < 1000) { await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(2000); }
  console.log(vw, 'drawer closed', JSON.stringify(await page.evaluate(probe)));
  await shot('cart-badge-after-add');
  if (vw < 1000) {
    await page.evaluate(async () => { const c = await (await fetch('/cart.js')).json(); await fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.items[0].key, quantity: 3 }) }); });
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(2000);
    console.log(vw, 'qty 3 (reload)', JSON.stringify(await page.evaluate(probe)));
    await shot('cart-badge3');
  } else {
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(2000);
    console.log(vw, 'qty 3 (reload)', JSON.stringify(await page.evaluate(probe)));
    await shot('cart-badge3');
  }
  // remove through the drawer, then read the re-rendered header link
  await page.click('[data-header-cart-icon]'); await page.waitForTimeout(1500);
  const rm = page.locator('cart-drawer a[href*="change"], cart-drawer cart-remove-button, cart-drawer button[name="remove"]').first();
  if (await rm.count()) {
    await rm.click(); await page.waitForTimeout(2500);
    console.log(vw, 'after remove', JSON.stringify(await page.evaluate(probe)));
  } else console.log(vw, 'no remove control found');
  await ctx.close();
  await new Promise((s) => setTimeout(s, 1500));
}
await browser.close();
