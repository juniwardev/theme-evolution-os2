// T4b: Step 0 item 5 probe page (PX8) and C4b.10 (search escaping).
// Usage: node t4bc-escape.mjs <previewBase> probe|search
import { chromium, parseArgs, loginState, newPage } from './t4bc-lib.mjs';
const [, mode] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const { page } = await newPage(browser, state, 1440, 900);
const TERMS = '<i>zz</i> & "q"';
if (mode === 'probe') {
  await page.goto(withTheme('/pages/contact?view=tw-probe'), { waitUntil: 'load' });
  const rows = await page.evaluate(() => [...document.querySelectorAll('[data-probe]')].map((p) => ({ k: p.dataset.probe, hasI: !!p.querySelector('i'), hasTime: !!p.querySelector('time'), text: p.textContent, html: p.innerHTML })));
  for (const r of rows) console.log(JSON.stringify(r));
} else {
  for (const q of [TERMS, 'snowboard ' + TERMS]) {
    await page.goto(withTheme('/search?q=' + encodeURIComponent(q)), { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const s = document.querySelector('[data-search-summary]') || document.querySelector('#MainContent, main') || document.body;
      const sel = [...document.querySelectorAll('p')].find((p) => /zz/.test(p.textContent));
      return { hasSummaryHook: !!document.querySelector('[data-search-summary]'), hasI: !!(sel && sel.querySelector('i')), text: sel && sel.textContent.trim(), html: sel && sel.innerHTML, input: document.querySelector('input[name=q]')?.value };
    });
    console.log(JSON.stringify({ q, ...r }));
  }
}
await browser.close();
