// usage: T4CQ_STATE=file node t4cq-sweep.mjs <previewUrl> <outfile>
// Parity sweep: every displayed ul/ol/a (and li marker owners) with list-style and underline values, tagged by location.
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, PAGES, sleep } from './t4cq-lib.mjs';

const { withTheme } = parseArgs();
const out = process.argv[3];
const sweepFn = () => {
  const rows = [];
  const where = (el) => {
    if (el.closest('[data-rich-text]')) return 'rich';
    if (el.closest('.shopify-policy__body')) return 'policy';
    if (el.closest('[id^="shopify-block-"]')) return 'app';
    if (el.closest('footer')) return el.closest('.theme-evolution-footer__about-text') ? 'footer-about' : 'footer';
    if (el.closest('cart-drawer')) return 'drawer';
    if (el.closest('header')) return 'header';
    return 'other';
  };
  for (const el of document.querySelectorAll('ul, ol, a')) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || !el.getClientRects().length) continue;
    rows.push({
      t: el.tagName.toLowerCase(), cls: el.classList.length ? 'c' : 'u', w: where(el), txt: (el.textContent || '').trim().slice(0, 24),
      lst: s.listStyleType, lsp: s.listStylePosition, pis: s.paddingInlineStart, pl: s.paddingLeft, td: s.textDecorationLine, tdt: s.textDecorationThickness, col: s.color,
    });
  }
  return rows;
};
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const res = {};
const fresh = { ...state, cookies: state.cookies.filter((c) => /storefront_digest|_shopify_essential|_cmp_a|secure_customer_sig/.test(c.name) || /password|digest/i.test(c.name)) };
for (const [mode, st] of [['full', state], ['fresh', fresh]]) {
  for (const w of mode === 'full' ? [375, 1440] : [375]) {
    const { ctx, page } = await newPage(browser, st, w);
    for (const [k, p] of Object.entries(PAGES)) {
      await page.goto(withTheme(p), { waitUntil: 'load' });
      await sleep(800);
      res[`${mode}:${k}@${w}`] = await page.evaluate(sweepFn);
    }
    if (mode === 'full') {
      await page.goto(withTheme(PAGES.wax), { waitUntil: 'load' });
      await Promise.all([page.waitForResponse((r) => /\/cart\/add/.test(r.url())), page.locator('button[name="add"]').first().click()]);
      await sleep(800);
      await page.goto(withTheme('/'), { waitUntil: 'load' });
      await sleep(500);
      const ic = page.locator('[data-header-cart-icon]').first();
      if (await ic.count()) { await ic.click().catch(() => {}); await sleep(900); }
      res[`${mode}:homedrawer@${w}`] = await page.evaluate(sweepFn);
    }
    await ctx.close();
  }
}
await browser.close();
writeFileSync(out, JSON.stringify(res));
console.log('pages', Object.keys(res).length, 'rows', Object.values(res).reduce((a, b) => a + b.length, 0));
