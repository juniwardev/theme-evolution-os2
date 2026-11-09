// Which URLs answer 429 / are blocked during a plain page load? Usage: node t6bqa-429.mjs <previewBase> <path>
import { chromium, parseArgs, loginState, newPage, load, sleep } from './t6bqa-lib.mjs';
const { withTheme, themeId } = parseArgs();
const path = process.argv[3] || '/';
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const { ctx, page } = await newPage(browser, state, 1440, 900);
const bad = [];
page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + new URL(r.url()).origin + new URL(r.url()).pathname.slice(0, 70)); });
page.on('requestfailed', (r) => bad.push('FAILED ' + r.failure()?.errorText + ' ' + new URL(r.url()).origin + new URL(r.url()).pathname.slice(0, 70)));
await load(page, withTheme, path, themeId); await sleep(3000);
console.log(JSON.stringify(bad, null, 1));
await ctx.close(); await browser.close();
