// T4b C4b.26: /password in a fresh context (no storefront cookie). Usage: node t4bc-password.mjs <previewBase> check|submit
// check: measures the page (no submission). submit: ONE login attempt (Cloudflare 429), run once, last. The password is read from
// docs/dev-fixtures.md and never printed.
import { readFileSync } from 'node:fs';
import { chromium, parseArgs, loginState } from './t4bc-lib.mjs';
const [, mode] = process.argv.slice(2);
const { withTheme } = parseArgs();
const browser = await chromium.launch();
if (mode === 'check') {
  // On this dev store a visitor without the storefront cookie gets Shopify's built-in password page, not the theme's template, so the
  // theme's /password is only reachable from a logged-in session (deviation recorded in the impl notes).
  const { state } = await loginState(browser, withTheme);
  for (const vw of [320, 375, 768, 1440, 1920]) {
    const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vw >= 1000 ? 900 : 812 } });
    const page = await ctx.newPage();
    await page.goto(withTheme('/password'), { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const r1 = (n) => Math.round(n * 10) / 10;
      const shell = document.querySelector('[data-page-shell]');
      const h1 = shell.querySelector('h1');
      const i = document.querySelector('input[type=password]');
      const sb = shell.getBoundingClientRect();
      const si = getComputedStyle(i);
      return { h1x: r1(h1.getBoundingClientRect().left), h1: [getComputedStyle(h1).fontFamily.slice(0, 8), getComputedStyle(h1).fontSize], shellL: r1(sb.left), kidsMaxR: Math.max(...[...shell.children].map((c) => r1(c.getBoundingClientRect().right))), pad: getComputedStyle(shell).paddingTop, inputBorder: si.borderTopWidth, inputH: r1(i.getBoundingClientRect().height), formW: r1(document.querySelector('form').getBoundingClientRect().width), vw: innerWidth, sw: document.documentElement.scrollWidth, h1Count: document.querySelectorAll('h1').length };
    });
    console.log(vw, JSON.stringify(r));
    await ctx.close();
  }
} else if (mode === 'submit') {
  const password = (readFileSync('docs/dev-fixtures.md', 'utf8').match(/^- Password:\s*(.+)$/m) || [])[1]?.trim();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(withTheme('/password'), { waitUntil: 'load' });
  const field = page.locator('form[action*="password"] input[name="password"]').first();
  await field.fill(password);
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}), field.press('Enter')]);
  console.log('submit reached', new URL(page.url()).pathname, 'left /password:', !page.url().includes('/password'));
  await ctx.close();
}
await browser.close();
