// Tiny probe: status of the tooltip section fetch and of /cart.js (is Cloudflare still limiting?). Usage: node t6bqa-probe.mjs <previewBase>
import { chromium, parseArgs, loginState, newPage, load, sleep } from './t6bqa-lib.mjs';
const { withTheme, themeId } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const { ctx, page } = await newPage(browser, state, 1440, 900);
await load(page, withTheme, '/products/the-3p-fulfilled-snowboard', themeId);
const r = await page.evaluate(async () => {
  const a = await fetch('/search?section_id=material-tooltip&q=organic-cotton');
  const t = await a.text();
  const b = await fetch('/cart.js');
  return { search: a.status, searchLen: t.length, searchHead: t.slice(0, 120).replace(/\s+/g, ' '), cart: b.status };
});
console.log(JSON.stringify(r));
await ctx.close(); await browser.close();
