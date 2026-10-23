// QA-fix round 3: mobile panel top edge + link geometry (x,y,w,h), sticky check. Usage: node t1r3c-panel.mjs <previewBase> <label>
import { chromium, parseArgs, loginState } from './t0-lib.mjs';
const { withTheme } = parseArgs();
const label = process.argv[3] || 'run';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const vw of [375, 900]) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(withTheme('/products/the-3p-fulfilled-snowboard'), { waitUntil: 'load' });
  await sleep(1500);
  await page.click('.theme-evolution-header-menu__toggle'); await sleep(400);
  const r = await page.evaluate(() => {
    const b = (e) => { const x = e.getBoundingClientRect(); return [x.left, x.top, x.width, x.height].map((n) => Math.round(n * 10) / 10); };
    const p = document.querySelector('.theme-evolution-header-menu__panel');
    return { panel: b(p), links: [...p.querySelectorAll('a')].map(b) };
  });
  console.log(label, vw, JSON.stringify(r));
  await page.screenshot({ path: `docs/qa/screenshots/t1r3c-${label}-panel-${vw}.png`, clip: { x: 0, y: 0, width: vw, height: 300 } });
  await page.keyboard.press('Escape');
  await page.mouse.wheel(0, 800); await sleep(500);
  console.log(label, vw, 'sticky wrapper top', await page.evaluate(() => Math.round(document.querySelector('.theme-evolution-header-wrapper').getBoundingClientRect().top)));
  await ctx.close(); await sleep(800);
}
await browser.close();
