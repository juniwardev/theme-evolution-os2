// T4b Step 0 item 3: fixtures from /sitemap.xml and its children; /account/login behavior.
// Usage: node t4bc-fixtures.mjs <previewBase>   Output: docs/qa/evidence/t4bc-fixtures.json
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage } from './t4bc-lib.mjs';

const { origin, withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('storefront login failed');
const { ctx, page } = await newPage(browser, state, 1440, 900);
const get = async (url) => (await ctx.request.get(url)).text();
const root = await get(`${origin}/sitemap.xml`);
const children = [...root.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const out = { children, locs: {} };
for (const c of children) {
  const t = await get(c);
  out.locs[c.replace(/\?.*$/, '').split('/').pop()] = [...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
await page.goto(withTheme('/account/login'), { waitUntil: 'load' });
out.accountLogin = { url: page.url().replace(/\?.*/, ''), h1: await page.locator('h1').allTextContents() };
mkdirSync('docs/qa/evidence', { recursive: true });
writeFileSync('docs/qa/evidence/t4bc-fixtures.json', JSON.stringify(out, null, 1));
for (const [k, v] of Object.entries(out.locs)) console.log(k, v.length, v.slice(0, 12).map((u) => u.replace(origin, '')).join(' '));
console.log('account/login', JSON.stringify(out.accountLogin));
await browser.close();
