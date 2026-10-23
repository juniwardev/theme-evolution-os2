// C4b.29 independent read-only check on LIVE (no preview_theme_id, GET navigation only; one storefront login). Prints findings, never the password.
import { chromium, loginState } from './t0-lib.mjs';
const origin = 'https://theme-evolution-os2.myshopify.com';
const wt = (p) => origin + p;
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, wt);
console.log('loggedIn', loggedIn);
const ctx = await browser.newContext({ storageState: state, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const reqs = [];
page.on('request', (r) => { const u = new URL(r.url()); if (!/theme-evolution-os2\.myshopify\.com$|cdn\.shopify\.com$|shopify\.com$|shopifycloud\.com$/.test(u.hostname)) reqs.push(u.hostname); });
for (const p of ['/', '/products/selling-plans-ski-wax', '/products/the-complete-snowboard', '/products/the-3p-fulfilled-snowboard', '/cart']) {
  await page.goto(wt(p), { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    const ib = [...document.querySelectorAll('[id^="shopify-block-"], [data-block-handle], shopify-app-block, [class*="shopify-app-block"], [id*="app-embed"], [data-app-embed]')].map((e) => e.tagName.toLowerCase() + '#' + e.id.slice(0, 40));
    return {
      themeId: window.Shopify?.theme?.id, role: window.Shopify?.theme?.role, name: window.Shopify?.theme?.name,
      supercycle: /supercycle/i.test(html), appBlocks: ib,
      scripts: [...document.scripts].map((s) => s.src).filter((s) => s && !/cdn\.shopify\.com|shopifycloud/.test(s) && !s.includes(location.hostname)).slice(0, 10),
      scriptsAppish: [...document.scripts].map((s) => s.src).filter((s) => /apps|app-|extensions|block/.test(s)).slice(0, 6),
      shadowHosts: [...document.querySelectorAll('*')].filter((e) => e.shadowRoot).length,
      bodyEmbedClasses: [...document.querySelectorAll('[id*="shopify-"]')].map((e) => e.id).filter((i) => !/^shopify-section|^shopify-features|^shopify-block-/.test(i)).slice(0, 6),
    };
  });
  console.log(p, JSON.stringify(r));
}
console.log('third-party hosts contacted:', JSON.stringify([...new Set(reqs)]));
await ctx.close(); await browser.close();
