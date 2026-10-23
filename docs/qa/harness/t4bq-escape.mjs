// C4b.10 independent probe. Payloads use console.log (never alert) so any execution shows in the console list.
// Usage: node t4bq-escape.mjs <previewBase>
import { chromium, parseArgs, loginState, newPage } from './t4bq-lib.mjs';
const { withTheme } = parseArgs();
const terms = [
  '<i>zz</i> & "q"',
  'snowboard <i>zz</i> & "q"',
  '<b>x</b>',
  '"><img src=x onerror=console.log("XSS-FIRED")>',
  '</script><script>console.log("XSS-FIRED2")</script>',
  '&amp; &lt;b&gt;',
  "snowboard '><svg onload=console.log('XSS3')>",
];
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const t of terms) {
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ':' + m.text().slice(0, 80)));
  page.on('pageerror', (e) => logs.push('pageerror:' + e.message.slice(0, 80)));
  await page.goto(withTheme('/search?q=' + encodeURIComponent(t)), { waitUntil: 'load' });
  await page.waitForTimeout(600);
  const r = await page.evaluate((t) => {
    const s = document.querySelector('[data-search-summary]');
    const inp = document.querySelector('#MainContent input[name="q"], input[name="q"][type="search"], [id^="shopify-section-template"] input[name="q"]');
    const main = document.querySelector('[id^="shopify-section-template"][id$="__main"]');
    const inj = main ? main.querySelectorAll('img[src="x"], svg[onload], b, i, script').length : -1;
    const headInj = [...document.querySelectorAll('img[onerror], svg[onload]')].length;
    return {
      summaryText: s ? s.textContent.trim().replace(/\s+/g, ' ') : null,
      summaryKids: s ? [...s.querySelectorAll('*')].map((e) => e.tagName.toLowerCase()).join(',') : null,
      hasLiteral: s ? s.textContent.includes(t) : null,
      dblEsc: s ? /&lt;|&amp;|&gt;|&quot;/.test(s.textContent) && !t.includes('&amp;') && !t.includes('&lt;') : null,
      inputVal: inp ? inp.value === t : null,
      injectedEls: inj, onerrorEls: headInj,
      resultCount: document.querySelectorAll('[id^="shopify-section-template"][id$="__main"] li').length,
      title: document.title.slice(0, 80),
    };
  }, t);
  console.log(JSON.stringify(t), JSON.stringify(r), logs.length ? 'CONSOLE:' + logs.join('|') : 'console clean');
  await ctx.close();
}
await browser.close();
