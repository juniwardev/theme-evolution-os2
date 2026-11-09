// T6b screenshots (final tree): /cart with two items, the 422 error, the drawer open. Usage: node t6bc-shots.mjs <previewBase> <outdir>
import { chromium, parseArgs, loginState, sleep, load, cartContext, newPage, HANDLES } from './t6bc-lib.mjs';
const [, outdir] = process.argv.slice(2);
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const w of [1440, 375]) {
  const { ctx, page } = await cartContext(browser, state, withTheme, themeId, w, [HANDLES.wax, HANDLES.snow], w === 1440 ? 900 : 667);
  await load(page, withTheme, '/cart', themeId); await sleep(1200);
  await page.screenshot({ path: `${outdir}/cart-${w}.png`, fullPage: true });
  await load(page, withTheme, '/products/' + HANDLES.wax, themeId); await sleep(1200);
  await page.locator('[data-cart-drawer-trigger]').first().click(); await sleep(900);
  await page.screenshot({ path: `${outdir}/drawer-${w}.png` });
  await ctx.close();
  const { ctx: c2, page: p2 } = await newPage(browser, state, w, w === 1440 ? 900 : 667);
  await load(p2, withTheme, '/products/' + HANDLES.p3p, themeId); await sleep(1200);
  await p2.locator('button[name="add"]').click(); await sleep(1500);
  await p2.locator('.product-form__error-message-wrapper').scrollIntoViewIfNeeded();
  await p2.screenshot({ path: `${outdir}/error-${w}.png` });
  await c2.close();
}
await browser.close();
