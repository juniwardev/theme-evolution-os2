// T6b QA eyeballs: E6b.5 (422 message, real add) and E6b.7 (tooltip with focus ring, injected trigger markup as in t6bqa-tooltip.mjs),
// plus the C6b.13 delayed-second-click clause at 375 (retry of the run that hit a Cloudflare 429).
// Usage: T6BQA_STATE=<scratch> node t6bqa-shots.mjs <previewBase> <label>
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, load, HANDLES } from './t6bqa-lib.mjs';

const [, label, whatArg] = process.argv.slice(2);
const what = new Set((whatArg || 'error375,error1440,tooltip').split(','));
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const out = { label, results: {} };
const rec = (k, v) => { out.results[k] = v; console.log(k, JSON.stringify(v).slice(0, 700)); };
const wrap = (page) => page.evaluate(() => { const w = document.querySelector('.product-form__error-message-wrapper'); const cs = getComputedStyle(w); return { hidden: w.hidden, display: cs.display, h: Math.round(w.getBoundingClientRect().height), text: w.textContent.trim() }; });
const CLS = 'eco-tooltip-trigger cursor-help font-medium text-[#00707c] underline decoration-dotted underline-offset-4 transition-colors duration-200 hover:text-[#004c55] hover:decoration-solid';

for (const w of [375, 1440]) if (what.has('error' + w)) {
  try {
    const { ctx, page } = await newPage(browser, state, w, w === 1440 ? 900 : 667);
    await load(page, withTheme, '/products/' + HANDLES.p3p, themeId); await sleep(1200);
    await page.locator('button[name="add"]').click();
    await sleep(1500);
    await page.locator('.product-form__error-message-wrapper').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `docs/qa/screenshots/t6bqa-error-${w}.png` });
    rec('error@' + w, { w1: await wrap(page), real: page.__real, saw429: page.__429 });
    if (w === 375 && what.has('second')) {
      // C6b.13 second click with /cart/add delayed 1 s (only if the first add was a real 422 and no 429 was seen)
      if (!page.__429) {
        await page.route(/\/cart\/add/, async (route) => { await sleep(1000); await route.fallback(); });
        const p2 = page.waitForResponse((r) => /cart\/add/.test(r.url()));
        await page.locator('button[name="add"]').click(); await sleep(400);
        const mid = await wrap(page); const r2 = await p2; await sleep(1000);
        rec('C6b.13-second@375', { mid, status2: r2.status(), after: await wrap(page), real: page.__real });
      }
    }
    await ctx.close();
  } catch (e) { rec('error@' + w + ':ERROR', String(e.message).slice(0, 200)); }
}

for (const w of [1440, 375]) if (what.has('tooltip')) {
  try {
    const { ctx, page } = await newPage(browser, state, w, w === 1440 ? 900 : 667);
    await load(page, withTheme, '/products/' + HANDLES.p3p, themeId); await sleep(1200);
    await page.evaluate((cls) => { const mk = (n, l) => '<span class="' + cls + '" tabindex="0" data-material-handle="' + n + '">' + l + '</span>'; document.querySelector('[data-rich-text]').insertAdjacentHTML('afterbegin', '<p>Made with ' + mk('organic-cotton', 'Organic Cotton') + ' and ' + mk('recycled-polyester', 'Recycled Polyester') + ', sewn by hand.</p>'); }, CLS);
    await page.locator('.eco-tooltip-trigger').first().scrollIntoViewIfNeeded();
    await page.keyboard.press('Tab');
    await page.locator('.eco-tooltip-trigger').first().focus();
    await sleep(1800);
    await page.screenshot({ path: `docs/qa/screenshots/t6bqa-tooltip-${w}.png` });
    rec('tooltip@' + w, { logs: page.__logs.slice(0, 3), active: await page.evaluate(() => document.activeElement.className.slice(0, 30)), visible: await page.evaluate(() => [...document.querySelectorAll('.eco-tooltip.is-visible')].map((t) => t.id)) });
    await ctx.close();
  } catch (e) { rec('tooltip@' + w + ':ERROR', String(e.message).slice(0, 200)); }
}
writeFileSync(`docs/qa/evidence/t6bqa-shots-${label}.json`, JSON.stringify(out, null, 1));
await browser.close();
