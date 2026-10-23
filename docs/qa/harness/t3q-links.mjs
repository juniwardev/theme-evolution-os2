// T3 QA: hello-world card link attributes (deviation 2). Usage: node t3q-links.mjs <previewBase>
import { parseArgs, openBrowser } from './t3c-lib.mjs';
const { withTheme } = parseArgs();
const { browser, state } = await openBrowser(withTheme);
const ctx = await browser.newContext({ storageState: state });
const page = await ctx.newPage();
await page.goto(withTheme('/'), { waitUntil: 'load' });
const out = await page.evaluate(() => [...document.querySelectorAll('[data-hello-card] a')].map((a) => [...a.attributes].map((t) => t.name + '=' + (t.name === 'class' ? '(class)' : t.value)).sort().join(' | ')));
console.log(JSON.stringify(out, null, 1));
await browser.close();
