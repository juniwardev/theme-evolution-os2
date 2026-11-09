// T6b Step 0 items 4-7: focus indicators (FI), header Escape, 422 description.
// Usage: node t6bc-facts.mjs <previewBase> <label>   Output: docs/qa/evidence/t6bc-facts-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, load, readStyleFn, fiVerdict, tabTo, activeFn, DEV_ID } from './t6bc-lib.mjs';

const [, label] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const out = { label, themeId };
const SENT = '<span tabindex="0" id="fi-sentinel">sentinel</span>';

async function fiRun(page, sentinelHtml, where, targetSel, name) {
  // inject sentinel; focus it; read resting; tab to target; read focused
  await page.evaluate(({ html, where }) => {
    const ref = document.querySelector(where);
    ref.insertAdjacentHTML('beforebegin', html);
  }, { html: SENT, where: where });
  await page.evaluate(() => document.getElementById('fi-sentinel').focus());
  const rest = await page.evaluate(readStyleFn, targetSel);
  const hits = await tabTo(page, targetSel);
  const foc = await page.evaluate(readStyleFn, targetSel);
  return { name, hits, ...fiVerdict(rest, foc) };
}

// (a) home hello-world links
{
  const { page } = await newPage(browser, state, 1440, 900);
  await load(page, withTheme, '/', themeId);
  await sleep(1200);
  const n = await page.locator('a[href*="shopify.dev"]').count();
  out.hello_count = n;
  out.hello = [];
  const hrefs = await page.$$eval('a[href*="shopify.dev"]', (as) => as.map((a) => a.getAttribute('href')));
  // sentinel before the first link's section
  await page.evaluate((html) => {
    const a = document.querySelector('a[href*="shopify.dev"]');
    const sec = a.closest('section, .shopify-section') || a.parentElement;
    sec.insertAdjacentHTML('beforebegin', html);
  }, SENT);
  await page.evaluate(() => document.getElementById('fi-sentinel').focus());
  const rests = [];
  for (const h of hrefs) rests.push(await page.evaluate(readStyleFn, `a[href="${h}"]`));
  for (let i = 0; i < hrefs.length; i++) {
    await tabTo(page, `a[href="${hrefs[i]}"]`, 40);
    const foc = await page.evaluate(readStyleFn, `a[href="${hrefs[i]}"]`);
    out.hello.push({ href: hrefs[i], ...fiVerdict(rests[i], foc) });
  }
  await page.context().close();
}

// (b) F_3p: sentinel + trigger span + add button positive control
{
  const { page } = await newPage(browser, state, 1440, 900);
  await load(page, withTheme, '/products/the-3p-fulfilled-snowboard', themeId);
  await sleep(1200);
  const info = await page.evaluate(() => {
    const d = document.querySelector('[data-rich-text]') || document.querySelector('.product__description') ;
    return { found: !!d, cls: d?.className };
  });
  out.desc_wrapper = info;
  // inject sentinel + trigger span before the add button area? use before description wrapper if present, else before add button
  await page.evaluate(() => {
    const cls = 'eco-tooltip-trigger cursor-help font-medium text-[#00707c] underline decoration-dotted underline-offset-4 transition-colors duration-200 hover:text-[#004c55] hover:decoration-solid';
    const d = document.querySelector('[data-rich-text]') || document.querySelector('button[name="add"]').closest('form');
    d.insertAdjacentHTML('beforebegin', '<span tabindex="0" id="fi-sentinel">sentinel</span> <span tabindex="0" id="fi-trigger" data-probe class="' + cls + '">Organic Cotton</span>');
  });
  await page.evaluate(() => document.getElementById('fi-sentinel').focus());
  const restT = await page.evaluate(readStyleFn, '#fi-trigger');
  const restA = await page.evaluate(readStyleFn, 'button[name="add"]');
  await tabTo(page, '#fi-trigger', 5);
  out.trigger = fiVerdict(restT, await page.evaluate(readStyleFn, '#fi-trigger'));
  await page.evaluate(() => document.getElementById('fi-sentinel').focus());
  const before = await page.evaluate(() => { const a = document.querySelector('button[name="add"]'); const t = document.getElementById('fi-trigger'); return !!(a.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING) === false ? 'button-after-trigger' : 'button-before-trigger'; });
  out.addbtn_order = before;
  await tabTo(page, 'button[name="add"]', 60, before === 'button-before-trigger');
  out.addbtn_control = fiVerdict(restA, await page.evaluate(readStyleFn, 'button[name="add"]'));
  await page.context().close();
}

// item 5 header Escape
out.headerEscape = {};
for (const w of [375, 1440]) {
  const { page } = await newPage(browser, state, w, 900);
  await load(page, withTheme, '/', themeId);
  await sleep(1000);
  await page.evaluate(() => document.body.focus());
  await page.keyboard.press('Escape');
  await sleep(500);
  out.headerEscape[w] = await page.evaluate(activeFn);
  await page.context().close();
}

// item 7: 422
{
  const { page } = await newPage(browser, state, 1440, 900);
  await load(page, withTheme, '/products/the-3p-fulfilled-snowboard', themeId);
  await sleep(1200);
  const [resp] = await Promise.all([
    page.waitForResponse((r) => /\/cart\/add/.test(r.url())),
    page.locator('button[name="add"]').first().click(),
  ]);
  out.d422 = { status: resp.status(), body: await resp.json().catch(() => null) };
  await page.context().close();
}
writeFileSync(`docs/qa/evidence/t6bc-facts-${label}.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
await browser.close();
