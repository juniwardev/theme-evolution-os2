// T3 Coder: confirms the dev theme matches the repo (banner section id is the repo's key, --color-foreground default, no proxy section).
// Usage: node t3c-sync.mjs <previewBase>
import { parseArgs, openBrowser } from './t3c-lib.mjs';
const { withTheme } = parseArgs();
const { browser, state } = await openBrowser(withTheme);
const ctx = await browser.newContext({ storageState: state });
const page = await ctx.newPage();
for (let i = 0; i < 10; i++) {
  await page.goto(withTheme('/'), { waitUntil: 'load' });
  const r = await page.evaluate(() => ({ banner: (document.querySelector('[id^="Banner-"]') || {}).id, fg: getComputedStyle(document.documentElement).getPropertyValue('--color-foreground').trim(), proxy: !!document.querySelector('[data-t3-proxy]') }));
  console.log(JSON.stringify(r));
  if (r.banner && r.banner.endsWith('__image-banner') && r.fg === '#333333' && !r.proxy) { console.log('dev theme matches repo'); break; }
  await new Promise((s) => setTimeout(s, 6000));
}
await browser.close();
