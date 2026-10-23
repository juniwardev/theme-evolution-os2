// T5a Step 0 items 7/8 (and Step 9): TOG per page, width, state. Raw entries go to $T5AC_RAW (scratch); a compact summary to docs/qa/evidence.
// Usage: node t5ac-tog.mjs <previewBase> <label> <pages|all|key,key> <widths|tog|list> [state=S0] [rawDir]
// States: S0 load, S1 drawer empty, S2 drawer one item (home), S3 menu open, S4 accordion open (p3p), S5 tooltip (PXP page), S6 consent overlay (no consent cookies).
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, seedCart, togFn, PAGES, W_TOG, EXPECT } from './t5ac-lib.mjs';

const [, label, pagesArg = 'all', widthsArg = 'tog', state = 'S0'] = process.argv.slice(2);
const rawDir = process.argv[7] || process.env.T5AC_RAW || '/tmp/t5ac-raw';
mkdirSync(rawDir, { recursive: true });
const { withTheme } = parseArgs();
const extraPages = process.env.T5AC_EXTRA ? JSON.parse(process.env.T5AC_EXTRA) : {}; // proxies: {key: path}
const ALL = { ...PAGES, ...extraPages };
const keys = pagesArg === 'all' ? Object.keys(PAGES) : pagesArg.split(',');
const widths = widthsArg === 'tog' ? W_TOG : widthsArg.split(',').map(Number);

const browser = await chromium.launch();
const { state: ss, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');

async function prep(page, st, key) {
  if (st === 'S1' || st === 'S2') {
    await page.locator('[data-header-cart-icon]').first().click();
    await page.waitForSelector('cart-drawer[data-state="open"]', { timeout: 8000, state: 'attached' });
    await sleep(600);
  } else if (st === 'S3') {
    await page.locator('.theme-evolution-header-menu__toggle').first().click();
    await page.waitForFunction(() => document.querySelector('[data-state="open"]:not(cart-drawer)')?.matches('nav, div, ul, [id]'), null, { timeout: 5000 }).catch(() => {});
    await sleep(500);
  } else if (st === 'S4') {
    await page.locator('#MaterialAccordion summary').click();
    await page.waitForSelector('#material-data-container .material-accordion__story', { timeout: 10000 }).catch(() => {});
  } else if (st === 'S5') {
    await page.locator('.eco-tooltip-trigger').first().hover();
    await page.waitForSelector('.eco-tooltip.is-visible', { timeout: 5000 }).catch(() => {});
  }
}

for (const key of keys) {
  const path = ALL[key];
  if (!path) { console.log('unknown page', key); continue; }
  const seedWax = key === 'cartseed' || state === 'S2';
  const ws = state === 'S0' ? widths : widths;
  for (const w of ws) {
    // States need a load per width; S0 loads once and resizes (N8) — but a resize can leave layout state behind, so one load per width keeps entries comparable with the cross-build runs.
    const { ctx, page } = await newPage(browser, ss, w, 812, state === 'S6' ? {} : {});
    if (state === 'S6') { await ctx.clearCookies(); }
    const t0 = Date.now();
    try {
      if (seedWax) await seedCart(page, withTheme, ['selling-plans-ski-wax']);
      const url = key === 'cartseed' ? '/cart' : path;
      await page.goto(withTheme(url), { waitUntil: 'load' });
      if (state === 'S6') await sleep(2000);
      if (state !== 'S0') await sleep(1500); // custom elements must upgrade before a click opens the drawer
      await prep(page, state, key);
      if (EXPECT[key] && !(await page.$(EXPECT[key]))) throw new Error('INVALID: proxy marker missing for ' + key);
      const r = await page.evaluate(togFn, state === 'S5' ? { rehover: '.eco-tooltip-trigger' } : {});
      const out = { label, key, path, w, state, valid: r.valid, why: r.why, controls: r.controls, recs: r.recs, widget: r.widget, nEls: r.nEls, nEntries: r.entries.length, revBad: r.revBad, revSamples: r.revSamples, entries: r.entries, logs: page.__logs };
      writeFileSync(`${rawDir}/tog-${label}-${key}-${w}-${state}.json`, JSON.stringify(out));
      console.log(`${key} ${w} ${state}: ${r.valid ? 'valid' : 'INVALID ' + r.why} els=${r.nEls} entries=${r.entries.length} ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    } catch (e) {
      console.log(`${key} ${w} ${state}: ERROR ${String(e.message).split('\n')[0].slice(0, 160)}`);
    }
    await ctx.close();
    await sleep(800);
  }
}
await browser.close();
