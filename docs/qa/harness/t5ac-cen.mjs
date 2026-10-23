// T5a Step 0 item 5: CEN census (base build) per page, width and state. Raw per run to $T5AC_RAW; aggregate with `node t5ac-cen.mjs agg <rawDir>`.
// Usage: node t5ac-cen.mjs <previewBase> <label> <pages|all|key,key> <widths|tog|list> [state=S0]
import { writeFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { chromium, parseArgs, loginState, newPage, sleep, seedCart, cenFn, settleFn, PAGES, W_TOG, EXPECT } from './t5ac-lib.mjs';

if (process.argv[2] === 'agg') {
  const dir = process.argv[3];
  const agg = new Map(); const unp = new Map(); let runs = 0, bad = 0;
  for (const f of readdirSync(dir).filter((f) => f.startsWith('cen-'))) {
    const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); runs++;
    if (j.error) { bad++; console.log('ERR', f, j.error); continue; }
    for (const m of j.matched) {
      const k = `${m.sel}  @${m.media}`;
      const x = agg.get(k) || { sel: m.sel, media: m.media, decl: m.decl, owners: new Set(), runs: new Set(), max: 0, ex: m.paths[0], nTheme: 0 };
      m.owners.forEach((o) => x.owners.add(o)); x.runs.add(`${j.key}@${j.w}:${j.state}`); x.max = Math.max(x.max, m.n); x.nTheme = Math.max(x.nTheme, m.nTheme); agg.set(k, x);
    }
    for (const u of j.unparsed) unp.set(u.sel, (unp.get(u.sel) || 0) + 1);
  }
  console.log(`runs=${runs} errors=${bad} distinct matched selectors=${agg.size} unparsed distinct=${unp.size}`);
  for (const x of [...agg.values()].sort((a, b) => a.sel.localeCompare(b.sel))) console.log(`${x.sel}${x.media ? ' @' + x.media : ''} | max ${x.max} theme ${x.nTheme} | ${[...x.owners].join(',')} | runs ${x.runs.size} | ${x.decl.slice(0, 90)} | ${x.ex.slice(-70)}`);
  console.log('UNPARSED:', JSON.stringify([...unp]));
  process.exit(0);
}

const [, label, pagesArg = 'all', widthsArg = 'tog', state = 'S0'] = process.argv.slice(2);
const rawDir = process.env.T5AC_RAW || '/tmp/t5ac-raw';
mkdirSync(rawDir, { recursive: true });
const { withTheme } = parseArgs();
const ALL = { ...PAGES, ...(process.env.T5AC_EXTRA ? JSON.parse(process.env.T5AC_EXTRA) : {}) };
const keys = pagesArg === 'all' ? Object.keys(PAGES) : pagesArg.split(',');
const widths = widthsArg === 'tog' ? W_TOG : widthsArg.split(',').map(Number);
const browser = await chromium.launch();
const { state: ss, loggedIn } = await loginState(browser, withTheme);
if (!loggedIn) throw new Error('login failed');
for (const key of keys) {
  const { ctx, page } = await newPage(browser, ss, widths[0], 812);
  try {
    if (key === 'cartseed' || state === 'S2') await seedCart(page, withTheme, ['selling-plans-ski-wax']);
    await page.goto(withTheme(key === 'cartseed' ? '/cart' : ALL[key]), { waitUntil: 'load' });
    if (EXPECT[key] && !(await page.$(EXPECT[key]))) throw new Error('INVALID: proxy marker missing for ' + key);
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 812 });
      if (state !== 'S0') await sleep(1500);
      if (state === 'S1' || state === 'S2') { await page.locator('[data-header-cart-icon]').first().click(); await page.waitForSelector('cart-drawer[data-state="open"]', { timeout: 8000, state: 'attached' }); }
      if (state === 'S3') { await page.locator('.theme-evolution-header-menu__toggle').first().click(); await sleep(500); }
      if (state === 'S4') { await page.locator('#MaterialAccordion summary').click(); await page.waitForSelector('#material-data-container .material-accordion__story', { timeout: 10000 }).catch(() => {}); }
      if (state === 'S5') { await page.locator('.eco-tooltip-trigger').first().hover(); await sleep(500); }
      await page.evaluate(settleFn, {});
      const r = await page.evaluate(cenFn);
      writeFileSync(`${rawDir}/cen-${label}-${key}-${w}-${state}.json`, JSON.stringify({ key, w, state, ...r }));
      console.log(`${key} ${w} ${state}: ${r.error || `matched=${r.matched.length} unparsed=${r.unparsed.length} sel=${r.totalSel}`}`);
      await sleep(300);
    }
  } catch (e) { console.log(key, 'ERROR', String(e.message).split('\n')[0].slice(0, 160)); }
  await ctx.close();
  await sleep(800);
}
await browser.close();
