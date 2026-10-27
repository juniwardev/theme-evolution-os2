// T5a spacing follow-up, Step 0 items 2a and 3: policy-body census on live (read-only) and the N_sel census
// of D1-D2's selectors on a theme build. Usage: node t5as-census.mjs <policy|sel> <preview_theme_id|live>
// Reads the storefront password only through loginState; never prints it.
import { chromium, loginState, newPage, PAGES, sleep } from './t5ac-lib.mjs';
const [mode, theme] = process.argv.slice(2);
const origin = 'https://theme-evolution-os2.myshopify.com';
const withTheme = (p) => theme === 'live' ? `${origin}${p}` : `${origin}${p}${p.includes('?') ? '&' : '?'}preview_theme_id=${theme}`;
const browser = await chromium.launch();
const { state, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
if (mode === 'policy') {
  const handles = ['privacy-policy', 'refund-policy', 'terms-of-service', 'shipping-policy', 'contact-information', 'legal-notice', 'subscription-policy'];
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  for (const h of handles) {
    const r = await page.goto(withTheme('/policies/' + h), { waitUntil: 'load' });
    const status = r.status();
    if (status !== 200) { console.log(h, status); continue; }
    const c = await page.evaluate(() => {
      const b = document.querySelector('.shopify-policy__body');
      if (!b) return { body: false };
      const o = { body: true };
      for (const t of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'th', 'td', 'hr', 'blockquote', 'details', 'summary']) o[t] = b.querySelectorAll(t).length;
      return o;
    });
    console.log(h, status, JSON.stringify(c));
  }
  await ctx.close();
} else {
  const pages = { ...PAGES, rental: '/products/the-rental-snowboard' };
  const SEL = '[data-rich-text] :where(h5, h6), [data-rich-text] :where(tbody, tfoot) th';
  const OWN_SHOP = '#pc--optOutFormContainer, .pc--show-email-field, .shopify-payment-button, shopify-accelerated-checkout, shopify-accelerated-checkout-cart, .shopify-policy__container, .shopify-challenge__container, [id^="shopify-pc__"], [class*="shopify-pc__"]';
  const OWN_APP = '[id^="shopify-block-"], [id*="app-embed"], [data-app], [id*="supercycle" i], [class*="supercycle" i], body > div[aria-hidden="true"]:has(> div > iframe[src*="hcaptcha"])';
  for (const [name, path] of Object.entries(pages)) {
    for (const vw of [375, 1440]) {
      const { ctx, page } = await newPage(browser, state, vw, vw === 375 ? 667 : 900);
      await page.goto(withTheme(path), { waitUntil: 'load' }).catch(() => {});
      await sleep(1200);
      const run = () => page.evaluate(([SEL, OWN_SHOP, OWN_APP]) => {
        const own = (e) => e.closest(OWN_APP) ? 'app' : e.closest(OWN_SHOP) ? 'shopify' : 'theme';
        const m = [...document.querySelectorAll(SEL)].map((e) => `${own(e)}:${e.tagName.toLowerCase()}`);
        const any = [...document.querySelectorAll('h5, h6, tbody th, tfoot th')].filter((e) => !e.closest('[data-rich-text]')).map((e) => `${own(e)}:${e.tagName.toLowerCase()}`);
        return { matched: m, outsideRichText: any };
      }, [SEL, OWN_SHOP, OWN_APP]);
      let r = await run();
      let extra = '';
      if (name === 'rental') {
        // open the Supercycle picker: click the first control inside the app block that looks like a date field
        const btn = page.locator('[id^="shopify-block-"] input, [id*="supercycle" i] input, [class*="supercycle" i] input').first();
        if (await btn.count()) { await btn.click({ timeout: 3000 }).catch(() => {}); await sleep(1200); }
        r = await run();
        extra = await page.evaluate(() => {
          const c = document.querySelector('[id*="supercycle" i], [class*="supercycle" i], [id^="shopify-block-"]');
          if (!c) return 'no container';
          const o = {}; for (const t of ['table', 'th', 'td', 'hr', 'blockquote', 'h5', 'h6', 'details', 'summary']) o[t] = c.querySelectorAll(t).length;
          return JSON.stringify({ ...o, shadow: [...c.querySelectorAll('*')].some((e) => e.shadowRoot) });
        });
      }
      console.log(name, vw, 'matched=' + JSON.stringify(r.matched), 'outside=' + JSON.stringify(r.outsideRichText), extra);
      await ctx.close();
    }
  }
}
await browser.close();
