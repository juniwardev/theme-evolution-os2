// Re-run 2: C1.4 with several outside-click points, A/B-able. Usage: node t1r2q-menu.mjs <previewBase> <label>
import { chromium, parseArgs, loginState } from './t0-lib.mjs';
const { withTheme } = parseArgs();
const label = process.argv[3] || 'run';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const { state } = await loginState(browser, withTheme);
for (const path of ['/', '/products/the-3p-fulfilled-snowboard']) {
  for (const vw of [375, 768, 900]) {
    const vh = 800;
    const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vh } });
    const page = await ctx.newPage();
    await page.goto(withTheme(path), { waitUntil: 'load' });
    await sleep(1500);
    const st = () => page.evaluate(() => {
      const t = document.querySelector('.theme-evolution-header-menu__toggle');
      const p = document.querySelector('.theme-evolution-header-menu__panel');
      const lbl = t.querySelector('.sr-only');
      const icons = [...t.querySelectorAll('svg')].map((s) => getComputedStyle(s.parentElement).display !== 'none');
      const b = p.getBoundingClientRect();
      return { exp: t.getAttribute('aria-expanded'), panelDisplay: getComputedStyle(p).display, label: lbl.textContent.trim(), icons, focusInPanel: p.contains(document.activeElement), focusToggle: document.activeElement === t, panelLR: [Math.round(b.left), Math.round(b.right)], panelBottom: Math.round(b.bottom), xPage: document.documentElement.scrollWidth - innerWidth };
    });
    const res = { label, path, vw, closed: await st() };
    await page.click('.theme-evolution-header-menu__toggle'); await sleep(400);
    res.open = await st();
    await page.keyboard.press('Escape'); await sleep(300);
    res.esc = await st();
    const panelBottom = res.open.panelBottom;
    const points = { belowPanel: [vw / 2, panelBottom + 30], body500: [vw / 2, 500], y650: [vw / 2, 650], leftEdge: [5, 400], headerEmpty: [vw / 2 + 40, 32] };
    res.outside = {};
    for (const [name, [x, y]] of Object.entries(points)) {
      await page.click('.theme-evolution-header-menu__toggle'); await sleep(300);
      const hit = await page.evaluate(([px, py]) => { const e = document.elementFromPoint(px, py); return e ? e.tagName + '.' + String(e.className).slice(0, 40) : null; }, [x, y]);
      console.error('probe', path, vw, name, x, y); const url0 = page.url();
      await page.mouse.click(x, y); await sleep(900);
      if (page.url() !== url0) { res.outside[name] = { x: Math.round(x), y: Math.round(y), hit, navigated: true }; await page.goto(withTheme(path), { waitUntil: 'load' }); await sleep(1200); continue; }
      let s; try { s = await st(); } catch (e) { res.outside[name] = { x: Math.round(x), y: Math.round(y), hit, navigated: 'ctx destroyed', url: page.url() }; await sleep(1500); await page.goto(withTheme(path), { waitUntil: 'load' }); await sleep(1200); continue; }
      res.outside[name] = { x: Math.round(x), y: Math.round(y), hit, closedAfter: s.exp === 'false', focusToggle: s.focusToggle };
      if (s.exp === 'true') { await page.keyboard.press('Escape'); await sleep(200); }
    }
    console.log(JSON.stringify(res));
    await ctx.close(); await sleep(900);
  }
}
await browser.close();
