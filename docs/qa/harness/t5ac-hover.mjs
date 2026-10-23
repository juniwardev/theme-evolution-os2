// T5a Step 0 item 7 (RA1): hover/focus differences caused by base.css, measured by hovering (or focusing) an element with base.css on, then off.
// Usage: node t5ac-hover.mjs <previewBase> <label>   Output: docs/qa/evidence/t5ac-hover-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, settleFn, snapFn, diffSnaps } from './t5ac-lib.mjs';
const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const CASES = [
  { name: 'policy link hover (.rte a:hover)', path: '/policies/privacy-policy', sel: '.shopify-policy__body a', mode: 'hover' },
  { name: 'payment button hover', path: '/products/selling-plans-ski-wax', sel: '.shopify-payment-button__button--unbranded', mode: 'hover' },
  { name: 'payment button focus', path: '/products/selling-plans-ski-wax', sel: '.shopify-payment-button__button--unbranded', mode: 'focus' },
  { name: 'header link hover', path: '/', sel: 'header a', mode: 'hover' },
  { name: 'footer link hover', path: '/', sel: 'footer a', mode: 'hover' },
  { name: 'product card hover', path: '/collections/all', sel: 'ul li a', mode: 'hover' },
  { name: 'add to cart hover', path: '/products/selling-plans-ski-wax', sel: 'button[name="add"]', mode: 'hover' },
  { name: 'opt-out button hover', path: '/pages/data-sharing-opt-out', sel: '.pc--opt-out-form-button', mode: 'hover' },
];
const out = [];
for (const c of CASES) {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  try {
    await page.goto(withTheme(c.path), { waitUntil: 'load' });
    await page.evaluate(settleFn, {});
    const loc = page.locator(c.sel).first();
    if (!(await loc.count())) throw new Error('no element for ' + c.sel);
    await loc.scrollIntoViewIfNeeded();
    const toggle = async (off) => page.evaluate((off2) => { const l = [...document.querySelectorAll('link[rel=stylesheet]')].find((x) => /\/assets\/base\.css/.test(x.href)); l.sheet.disabled = off2; document.getAnimations().filter((a) => a.playState === 'running').forEach((a) => { try { a.finish(); } catch {} }); }, off);
    await page.mouse.move(0, 0); await page.evaluate(() => document.activeElement?.blur?.()); await sleep(300);
    await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
    const u1 = await page.evaluate(snapFn, {}); await toggle(true); await sleep(300); const u2 = await page.evaluate(snapFn, {}); await toggle(false); await sleep(300);
    if (c.mode === 'hover') await loc.hover(); else await loc.focus();
    await sleep(600);
    await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
    const h1 = await page.evaluate(snapFn, {}); await toggle(true); await sleep(300); const h2 = await page.evaluate(snapFn, {});
    const dStatic = diffSnaps(u1, u2), dHover = diffSnaps(h1, h2);
    const sk = new Set(dStatic.diffs.map((x) => `${x.k}|${x.pseudo}|${x.prop}|${x.a}|${x.b}`));
    const d = { paired: dHover.paired, diffs: dHover.diffs.filter((x) => !sk.has(`${x.k}|${x.pseudo}|${x.prop}|${x.a}|${x.b}`) && !/^(width|height|inline-size|block-size|top|right|bottom|left|inset-.*|transform-origin|perspective-origin)$/.test(x.prop)) };
    const props = new Map();
    for (const x of d.diffs) { const k = `${x.pseudo}|${x.prop}|${x.a}|${x.b}|${x.k.slice(-40)}`; props.set(k, (props.get(k) || 0) + 1); }
    out.push({ case: c.name, paired: d.paired, nDiffs: d.diffs.length, groups: [...props].map(([k, n]) => `${n}x ${k}`).slice(0, 60) });
    console.log(c.name, 'diffs', d.diffs.length);
  } catch (e) { out.push({ case: c.name, error: String(e.message).split('\n')[0] }); console.log(c.name, 'ERROR', String(e.message).split('\n')[0]); }
  await ctx.close(); await sleep(600);
}
writeFileSync(`docs/qa/evidence/t5ac-hover-${label}.json`, JSON.stringify(out, null, 1));
await browser.close();
