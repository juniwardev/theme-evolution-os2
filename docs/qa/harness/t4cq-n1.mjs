// usage: T4CQ_STATE=file node t4cq-n1.mjs <previewUrl>  -- N1 widget behavior, keyboard, leak lines, /password form
import { chromium, parseArgs, loginState, newPage, sleep } from './t4cq-lib.mjs';
const { withTheme } = parseArgs();
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const w of [320, 375, 430, 768, 1440]) {
  const { ctx, page } = await newPage(browser, state, w, 812);
  await page.goto(withTheme('/pages/data-sharing-opt-out'), { waitUntil: 'load' });
  await sleep(2000);
  const r = await page.evaluate(() => {
    const box = document.querySelector('[data-rich-text]');
    const wd = box.querySelector('.pc--show-email-field');
    const ctr = [...wd.querySelectorAll('input,button,a,select,textarea')].map((e) => ({ t: e.tagName.toLowerCase() + (e.type ? ':' + e.type : ''), x: Math.round(e.getBoundingClientRect().left), r: Math.round(e.getBoundingClientRect().right), tab: e.tabIndex }));
    const wp = [...wd.querySelectorAll('p,label,span')].slice(0, 3).map((e) => { const s = getComputedStyle(e); return { t: e.tagName, fs: s.fontSize, lh: s.lineHeight, mb: s.marginBottom }; });
    return { sw: box.scrollWidth, cw: box.clientWidth, sh: box.scrollHeight, ch: box.clientHeight, X: document.documentElement.scrollWidth - innerWidth, ctr, wp };
  });
  // keyboard: focus before the box and Tab until focus leaves the widget
  const seq = [];
  await page.evaluate(() => { const b = document.querySelector('[data-rich-text]'); const t = document.createElement('span'); t.tabIndex = 0; t.id = 'qa-before'; b.parentElement.insertBefore(t, b); t.focus(); });
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => { const a = document.activeElement; const b = document.querySelector('[data-rich-text]'); const rr = a.getBoundingClientRect(); const br = b.getBoundingClientRect(); const s = getComputedStyle(a); return { t: a.tagName.toLowerCase() + (a.type ? ':' + a.type : ''), inBox: b.contains(a), inView: rr.left >= br.left - 1 && rr.right <= br.right + 1, fv: a.matches(':focus-visible'), outline: s.outlineStyle + ' ' + s.outlineWidth, shadow: s.boxShadow.slice(0, 30), scrollLeft: b.scrollLeft }; });
    seq.push(f);
    if (!f.inBox) break;
  }
  console.log(w, JSON.stringify(r), '\n   tab:', JSON.stringify(seq));
  await ctx.close();
}
// leak lines: prose without prose-tokens vs with
{
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme('/pages/contact'), { waitUntil: 'load' });
  console.log('leak', JSON.stringify(await page.evaluate(() => {
    const mk = (cls) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = '<hr><blockquote><p>q</p></blockquote>'; document.body.appendChild(d); const o = { hr: getComputedStyle(d.querySelector('hr')).borderTopStyle, bq: getComputedStyle(d.querySelector('blockquote')).borderLeftStyle }; d.remove(); return o; };
    return { proseOnly: mk('prose'), withTokens: mk('prose prose-tokens') };
  })));
  await ctx.close();
}
// /password theme page in the logged-in session, then one wrong-password submit in a fresh context (error list)
{
  const { ctx, page } = await newPage(browser, state, 1440, 900);
  await page.goto(withTheme('/password'), { waitUntil: 'load' });
  console.log('password page url', page.url().replace(/preview_theme_id=\d+/, 'ptid'), JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('form')].map((f) => f.className))));
  await ctx.close();
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await c2.newPage();
  await p2.goto(withTheme('/password'), { waitUntil: 'load' });
  const f = p2.locator('input[type=password]').first();
  await f.fill('qa-wrong-value');
  await Promise.all([p2.waitForNavigation({ waitUntil: 'load' }).catch(() => {}), f.press('Enter')]);
  await sleep(1000);
  console.log('wrong-pw', JSON.stringify(await p2.evaluate(() => {
    const form = [...document.querySelectorAll('form')].find((x) => x.className.includes('list-disc'));
    const ul = form && form.querySelector('ul');
    return { formClass: form && form.className, ul: ul && { lst: getComputedStyle(ul).listStyleType, pis: getComputedStyle(ul).paddingInlineStart, txt: ul.textContent.trim().slice(0, 40) } };
  })));
  await c2.close();
}
await browser.close();
