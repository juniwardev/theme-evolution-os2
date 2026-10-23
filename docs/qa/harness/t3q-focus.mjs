// T3 QA: keyboard focus visibility on hello-world card links. Usage: node t3q-focus.mjs <previewBase>
import { parseArgs, openBrowser } from './t3c-lib.mjs';
const { withTheme } = parseArgs();
const { browser, state } = await openBrowser(withTheme);
const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(withTheme('/'), { waitUntil: 'load' });
for (let i = 0; i < 60; i++) {
  await page.keyboard.press('Tab');
  const r = await page.evaluate(() => { const a = document.activeElement; if (!a || !a.closest('[data-hello-card], .highlight')) return null; const s = getComputedStyle(a); return { sh: s.boxShadow.slice(0,60), txt: a.textContent.trim(), outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor, fv: a.matches(':focus-visible') }; });
  if (r) { console.log(JSON.stringify(r)); break; }
}
await browser.close();
