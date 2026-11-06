// T5b QA detail: policy pages at 320/375, drawer, menu, accordion, rental picker.
import { chromium, parseArgs, loginState, newPage, PAGES, assertTheme, sleep } from './t5bc-lib.mjs';
import { mkdirSync } from 'node:fs';
const { themeId, withTheme } = parseArgs();
const out = process.argv[3];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);

const polProbe = () => {
  const w = document.querySelector('[data-policy-prose]');
  if (!w) return { wrap: false };
  const cs = getComputedStyle(w);
  const ul = w.querySelector('ul');
  const a = w.querySelector('a');
  const h1 = w.querySelector('h1');
  const first = w.querySelector('p');
  return { wrap: true, cls: w.className, wrapW: Math.round(w.getBoundingClientRect().width), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    ulStyle: ul ? getComputedStyle(ul).listStyleType : null, ulPad: ul ? getComputedStyle(ul).paddingLeft : null,
    aDeco: a ? getComputedStyle(a).textDecorationLine : null, h1n: document.querySelectorAll('h1').length,
    h1fs: h1 && getComputedStyle(h1).fontSize, h1ff: h1 && getComputedStyle(h1).fontFamily.slice(0, 20),
    pLeft: first && Math.round(first.getBoundingClientRect().left), pLH: first && getComputedStyle(first).lineHeight, fs: first && getComputedStyle(first).fontSize };
};
for (const [slug, vw] of [['privacy-policy', 320], ['privacy-policy', 375], ['terms-of-service', 375], ['refund-policy', 375], ['shipping-policy', 375], ['contact-information', 375]]) {
  const { ctx, page } = await newPage(browser, state, vw, 667);
  const r = await page.goto(withTheme('/policies/' + slug), { waitUntil: 'load' });
  await sleep(1500);
  await assertTheme(page, themeId, 'development');
  console.log('POLICY', slug, vw, r.status(), JSON.stringify(await page.evaluate(polProbe)));
  if (slug === 'privacy-policy' || slug === 'terms-of-service') await page.screenshot({ path: `${out}/pol-${slug}-${vw}-top.png` });
  await ctx.close(); await sleep(2500);
}

// Drawer, menu, accordion at 375 and 1440
for (const vw of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, vw, vw === 375 ? 667 : 900);
  await page.goto(withTheme('/products/selling-plans-ski-wax'), { waitUntil: 'load' });
  await sleep(1500);
  await assertTheme(page, themeId, 'development');
  const hdrBefore = await page.evaluate(() => Math.round(document.querySelector('header')?.getBoundingClientRect().height));
  const [resp] = await Promise.all([page.waitForResponse((x) => /\/cart\/add/.test(x.url())).catch(() => null), page.locator('button[name="add"]').first().click()]);
  console.log('ADD', vw, resp && resp.status());
  await sleep(2000);
  const dlg = await page.evaluate(() => { const d = document.querySelector('cart-drawer, [id*=cart-drawer], dialog[open]'); return d ? { id: d.id, vis: d.getBoundingClientRect().width } : null; });
  console.log('DRAWER', vw, JSON.stringify(dlg), 'hdr', hdrBefore);
  await page.screenshot({ path: `${out}/drawer-${vw}.png` });
  await page.keyboard.press('Escape'); await sleep(800);
  const after = await page.evaluate(() => { const d = document.querySelector('dialog[open], cart-drawer[open], [aria-modal=true]'); return d ? 'still-open' : 'closed'; });
  console.log('DRAWER after Esc', after);
  if (vw === 375) {
    const mb = page.locator('button[aria-label*="enu" i], header-drawer summary, button[aria-controls*="menu" i]').first();
    if (await mb.count()) { await mb.click(); await sleep(800); await page.screenshot({ path: `${out}/menu-375.png` }); console.log('MENU clicked', await mb.getAttribute('aria-expanded')); }
    else console.log('MENU button not found');
  }
  const acc = page.locator('summary, button[aria-expanded]').filter({ hasText: /specs/i }).first();
  if (await acc.count()) { await acc.click(); await sleep(500); console.log('ACC', vw, await acc.getAttribute('aria-expanded')); }
  await ctx.close(); await sleep(2500);
}

// rental picker
for (const vw of [375, 1440]) {
  const { ctx, page } = await newPage(browser, state, vw, vw === 375 ? 667 : 900);
  await page.goto(withTheme('/products/the-rental-snowboard'), { waitUntil: 'load' });
  await sleep(4000);
  await assertTheme(page, themeId, 'development');
  const blk = page.locator('[id^="shopify-block-"]').first();
  console.log('RENTAL block', vw, await blk.count());
  const trig = page.locator('[id^="shopify-block-"] input, [id^="shopify-block-"] button, [id^="shopify-block-"] [role=button]').first();
  if (await trig.count()) { await trig.click({ timeout: 5000 }).catch((e) => console.log('click fail', e.message.slice(0, 80))); await sleep(5000); }
  console.log('RENTAL overflow', await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]), 'tables', await page.locator('table').count());
  await page.screenshot({ path: `${out}/rental-picker-${vw}.png` });
  await ctx.close(); await sleep(2500);
}
await browser.close();
