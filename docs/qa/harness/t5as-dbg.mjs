// Debug helper for t5as-sweep.mjs: what does a page serve when the sweep cannot find tailwind.css?
import { chromium, loginState, PAGES, sleep } from './t5ac-lib.mjs';
const [theme, name] = process.argv.slice(2);
const origin = 'https://theme-evolution-os2.myshopify.com';
const withTheme = (p) => `${origin}${p}${p.includes('?') ? '&' : '?'}preview_theme_id=${theme}`;
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const r = await page.goto(withTheme(PAGES[name]), { waitUntil: 'load' });
await sleep(1500);
console.log(r.status(), page.url().replace(/\?.*/, ''));
console.log(await page.evaluate(() => JSON.stringify([...document.styleSheets].map((s) => [s.href, (() => { try { return s.cssRules.length; } catch (e) { return 'err'; } })()]))));
await browser.close();
