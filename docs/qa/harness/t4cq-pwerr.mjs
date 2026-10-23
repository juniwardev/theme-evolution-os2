// usage: node t4cq-pwerr.mjs <previewUrl>  -- one WRONG-value password submit in a fresh context to render default_errors on /password
import { chromium, parseArgs } from './t4cq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const c = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const p = await c.newPage();
await p.goto(withTheme('/password'), { waitUntil: 'load' });
const f = p.locator('input[type=password]').first();
await f.fill('qa-wrong-value');
const [resp] = await Promise.all([p.waitForResponse((r) => r.request().method() === 'POST').catch(() => null), f.press('Enter')]);
await p.waitForLoadState('load');
await p.waitForTimeout(1500);
console.log('post status', resp && resp.status(), p.url().replace(/preview_theme_id=\d+/, 'ptid'));
console.log(JSON.stringify(await p.evaluate(() => ({
  forms: [...document.querySelectorAll('form')].map((x) => x.className.slice(0, 90)),
  uls: [...document.querySelectorAll('main ul, form ul, .errors ul')].map((u) => ({ cls: u.className, inForm: !!u.closest('form'), lst: getComputedStyle(u).listStyleType, pis: getComputedStyle(u).paddingInlineStart, txt: u.textContent.trim().slice(0, 50) })),
  body: document.body.innerText.slice(0, 300),
}))));
await p.screenshot({ path: 'docs/qa/screenshots/t4cq-password-error.png' });
await browser.close();
