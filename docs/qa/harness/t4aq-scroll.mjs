// Scroll lock actually blocks page scroll while open, and releases after close.
import { chromium, parseArgs, loginState, newPage, sleep } from './t4aq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const w of [1440, 375]) {
  const { ctx, page } = await newPage(browser, state, w, 812);
  await page.goto(withTheme('/collections/all'), { waitUntil: 'load' });
  await page.mouse.move(100, 400);
  await page.mouse.wheel(0, 600); await sleep(400);
  const before = await page.evaluate(() => scrollY);
  await page.locator('[data-header-cart-icon]').first().click(); await sleep(500);
  await page.mouse.move(w === 1440 ? 100 : 100, 400);
  await page.mouse.wheel(0, 800); await sleep(400);
  const during = await page.evaluate(() => scrollY);
  await page.keyboard.press('Escape'); await sleep(500);
  await page.mouse.wheel(0, 500); await sleep(400);
  const after = await page.evaluate(() => scrollY);
  console.log(w, { before, during, after, lockedWhileOpen: before === during, releasedAfter: after > during });
  await ctx.close();
}
await browser.close();
