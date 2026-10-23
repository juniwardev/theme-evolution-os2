// T5a Step 0 item 4: fixtures (sitemap, policy handles), /challenge and /account/login (read-only GETs), plus loaded stylesheets/scripts per page.
// Usage: node t5ac-facts.mjs <previewBase> <label>   Output: docs/qa/evidence/t5ac-facts-<label>.json
import { writeFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep } from './t5ac-lib.mjs';
const [, label] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
const { ctx, page } = await newPage(browser, state, 1440, 900);
const out = { label, policies: {}, special: {} };
const sm = await ctx.request.get(withTheme('/sitemap.xml'));
out.sitemap = { status: sm.status(), locs: ((await sm.text()).match(/<loc>[^<]+<\/loc>/g) || []).map((x) => x.replace(/<\/?loc>/g, '').replace(/^https?:\/\/[^/]+/, '')).slice(0, 20) };
for (const h of ['refund-policy', 'privacy-policy', 'terms-of-service', 'shipping-policy', 'contact-information', 'legal-notice', 'subscription-policy']) {
  const r = await page.goto(withTheme('/policies/' + h), { waitUntil: 'load' });
  out.policies[h] = { status: r.status(), url: page.url().replace(/\?.*/, ''), policyBody: await page.evaluate(() => !!document.querySelector('.shopify-policy__body')) };
  await sleep(500);
}
for (const p of ['/challenge', '/account/login']) {
  const r = await page.goto(withTheme(p), { waitUntil: 'load' });
  await sleep(1000);
  out.special[p] = await page.evaluate(() => ({
    finalUrl: location.origin.replace(/^https?:\/\//, '') + location.pathname,
    pageType: window.ShopifyAnalytics?.meta?.page?.pageType ?? null,
    links: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href.replace(/\?.*/, '').replace(/^.*\/\/[^/]+/, '')),
    tailwind: [...document.querySelectorAll('link[rel=stylesheet]')].some((l) => /tailwind\.css/.test(l.href)),
    base: [...document.querySelectorAll('link[rel=stylesheet]')].some((l) => /base\.css/.test(l.href)),
    challenge: document.querySelector('.shopify-challenge__container')?.outerHTML.slice(0, 1500) ?? null,
    h1: document.querySelectorAll('h1').length, title: document.title,
  }));
  out.special[p].status = r.status();
}
// Loaded scripts and stylesheets on representative pages.
out.assets = {};
for (const p of ['/', '/products/the-3p-fulfilled-snowboard', '/cart', '/policies/privacy-policy']) {
  await page.goto(withTheme(p), { waitUntil: 'load' }); await sleep(1000);
  out.assets[p] = await page.evaluate(() => ({ scripts: [...document.scripts].map((s) => s.src).filter((s) => /\/assets\//.test(s)).map((s) => s.replace(/\?.*/, '').replace(/^.*\/assets\//, '')), css: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href.replace(/\?.*/, '').replace(/^.*\/\/[^/]+/, '')) }));
}
writeFileSync(`docs/qa/evidence/t5ac-facts-${label}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
await browser.close();
