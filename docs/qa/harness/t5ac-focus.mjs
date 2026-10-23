// T5a C5a.11 / Step 0 item 9: focus sweep (Tab) per page at 375 and 1440, plus drawer-open and menu-open states.
// Usage: node t5ac-focus.mjs <previewBase> <label> [pages|all]   Output: docs/qa/evidence/t5ac-focus-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, seedCart, settleFn, focusSweep, PAGES } from './t5ac-lib.mjs';
const [, label, pagesArg = 'all'] = process.argv.slice(2);
const { withTheme } = parseArgs();
const ALL = { ...PAGES, ...(process.env.T5AC_EXTRA ? JSON.parse(process.env.T5AC_EXTRA) : {}) };
const keys = pagesArg === 'all' ? Object.keys(PAGES) : pagesArg.split(',');
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = {};
const summ = (seq) => ({ n: seq.filter((x) => !x.body).length, noOutline: seq.filter((x) => !x.body && x.owner === 'theme' && x.os === 'none' && x.bs === 'none').length, seq: seq.map((x) => x.body ? { body: true } : { k: x.key.slice(-60), tag: x.tag, cls: x.cls, text: x.text, own: x.owner, fv: x.fv, os: x.os, ow: x.ow, oo: x.oo, bs: x.bs, clip: x.clip }) });
for (const key of keys) for (const w of [375, 1440]) {
  for (const st of key === 'home' ? ['S0', 'drawer', 'menu'] : ['S0']) {
    if (st === 'menu' && w > 989) continue;
    const { ctx, page } = await newPage(browser, state, w, 812);
    try {
      if (key === 'cartseed') await seedCart(page, withTheme, ['selling-plans-ski-wax']);
      await page.goto(withTheme(key === 'cartseed' ? '/cart' : ALL[key]), { waitUntil: 'load' });
      await sleep(1500); await page.evaluate(settleFn, { recWait: 4000 });
      if (st === 'drawer') { await page.locator('[data-header-cart-icon]').first().click(); await page.waitForSelector('cart-drawer[data-state="open"]', { state: 'attached', timeout: 8000 }); await sleep(700); }
      if (st === 'menu') { await page.locator('.theme-evolution-header-menu__toggle').first().click(); await sleep(700); }
      const seq = await focusSweep(page, 120);
      out[`${key}@${w}:${st}`] = summ(seq);
      console.log(key, w, st, 'focusables', out[`${key}@${w}:${st}`].n, 'theme-without-outline', out[`${key}@${w}:${st}`].noOutline);
    } catch (e) { console.log(key, w, st, 'ERROR', String(e.message).split('\n')[0].slice(0, 100)); }
    await ctx.close(); await sleep(400);
  }
}
// The privacy widget's controls at 320, 375, 390, 430 (C5a.11(c)): outline, box-shadow and clipping per side.
out.widget = {};
for (const w of [320, 375, 390, 430]) {
  const { ctx, page } = await newPage(browser, state, w, 812);
  await page.goto(withTheme('/pages/data-sharing-opt-out'), { waitUntil: 'load' }); await sleep(2000);
  const seq = await focusSweep(page, 40);
  out.widget[w] = summ(seq).seq.filter((x) => x.own === 'shopify');
  await ctx.close(); await sleep(400);
}
writeFileSync(`docs/qa/evidence/t5ac-focus-${label}.json`, JSON.stringify(out));
await browser.close();
