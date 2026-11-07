// Screenshots for owner check 2: node t6ac-shots.mjs <previewUrl> <prefix> <path> <label> [widths...]
import { chromium, parseArgs, loginState, newPage, open, sleep } from './t6ac-lib.mjs';
const [, , , prefix, path, label, ...ws] = process.argv;
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const w of (ws.length ? ws : ['375', '768', '1440']).map(Number)) {
  const { ctx, page } = await newPage(browser, state, w);
  await open(page, withTheme, path, themeId);
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); } scrollTo(0, 0); });
  await sleep(1500);
  await page.screenshot({ path: `docs/qa/screenshots/${prefix}-${label}-${w}.png`, fullPage: true });
  await ctx.close(); await sleep(1000);
}
await browser.close();
