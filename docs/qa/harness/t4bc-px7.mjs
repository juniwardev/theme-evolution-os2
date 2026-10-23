import { chromium, parseArgs, loginState, newPage } from './t4bc-lib.mjs';
const { withTheme } = parseArgs();
const b = await chromium.launch(); const { state } = await loginState(b, withTheme); const { page } = await newPage(b, state, 1440, 900);
const r = await page.goto(withTheme('/pages/contact?view=tw-giftcard'), { waitUntil: 'load' });
console.log(r.status(), JSON.stringify(await page.evaluate(() => { const m = document.querySelector('main'); if (!m) return 'no main'; const rc = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map((n) => Math.round(n * 10) / 10); }; return { ta: getComputedStyle(m).textAlign, imgs: [...m.querySelectorAll('img')].map((i) => ({ d: getComputedStyle(i).display, rect: rc(i) })), h2: m.querySelector("h2")?.textContent }; })));
await b.close();
