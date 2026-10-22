// C1.4 at every width where the toggle shows. Usage: node docs/qa/harness/t1fix-menu.mjs <previewBase>
import { chromium, parseArgs, loginState } from './t0-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const vw of [375, 768, 900, 1023]) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(withTheme('/products/the-3p-fulfilled-snowboard'), { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const st = () => page.evaluate(() => {
    const t = document.querySelector('.theme-evolution-header-menu__toggle');
    const p = document.querySelector('.theme-evolution-header-menu__panel');
    const l = t.querySelector('.sr-only');
    const vis = [...t.querySelectorAll('svg')].map((s) => getComputedStyle(s.parentElement).display !== 'none');
    const b = p.getBoundingClientRect();
    return { exp: t.getAttribute('aria-expanded'), panel: getComputedStyle(p).display, label: l.textContent, icons: vis, focusInPanel: p.contains(document.activeElement), focusToggle: document.activeElement === t, panelBox: [Math.round(b.left), Math.round(b.width)], xPage: document.documentElement.scrollWidth - innerWidth };
  });
  const r = { vw, closed: await st() };
  await page.click('.theme-evolution-header-menu__toggle'); await page.waitForTimeout(400);
  r.open = await st();
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  r.esc = await st();
  await page.click('.theme-evolution-header-menu__toggle'); await page.waitForTimeout(300);
  await page.mouse.click(vw / 2, 500); await page.waitForTimeout(300);
  r.outside = await st();
  console.log(JSON.stringify(r));
  await ctx.close(); await new Promise((s) => setTimeout(s, 900));
}
await browser.close();
