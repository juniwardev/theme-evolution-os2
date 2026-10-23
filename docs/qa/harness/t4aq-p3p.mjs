// 422 path: does the Add to cart button recover, is any error text shown anywhere, is the drawer intact.
import { chromium, parseArgs, loginState, newPage, sleep, H, hostState } from './t4aq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
const { ctx, page } = await newPage(browser, state, 1440, 900);
await page.goto(withTheme('/products/' + H.p3p), { waitUntil: 'load' });
const before = await page.evaluate(() => document.body.innerText.length);
await Promise.all([page.waitForResponse((x) => /\/cart\/add/.test(x.url())), page.locator('button[name="add"]').first().click()]);
await sleep(1500);
console.log(JSON.stringify(await page.evaluate(() => {
  const b = document.querySelector('button[name="add"]');
  const w = document.querySelector('.product-form__error-message-wrapper');
  return { loadingClass: b.classList.contains('loading'), ariaDisabled: b.getAttribute('aria-disabled'), disabled: b.disabled, errWrapper: w ? { hidden: w.hasAttribute('hidden'), text: w.textContent.trim() } : 'no wrapper element in DOM', spinnerVisible: !!b.querySelector('.loading__spinner:not(.hidden)') && getComputedStyle(b.querySelector('.loading__spinner')).display, drawer: document.querySelector('cart-drawer').getAttribute('data-state') };
})));
await ctx.close(); await browser.close();
