// T6b QA harness helpers (t6bqa-*). NO replay of /cart/add: every add is a real request, paced to stay under Cloudflare's limit.
// A 429 on any cart request is recorded (page.__429) and makes the flow INVALID rather than being answered from a recording.
// Login (password read inside t0-lib.mjs, never printed) is cached as a cookie state in T6BQA_STATE (scratch, mode 600).
import { chromium, parseArgs, loginState as t0LoginState } from './t0-lib.mjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export { chromium, parseArgs };
export const HANDLES = { wax: 'selling-plans-ski-wax', snow: 'the-complete-snowboard', p3p: 'the-3p-fulfilled-snowboard' };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function loginState(browser, withTheme) {
  const cache = process.env.T6BQA_STATE;
  if (cache && existsSync(cache)) {
    const j = JSON.parse(readFileSync(cache, 'utf8'));
    if (Date.now() - j.at < 5 * 60 * 60 * 1000) return { state: j.state, loggedIn: true };
  }
  const r = await t0LoginState(browser, withTheme);
  if (cache && r.loggedIn) writeFileSync(cache, JSON.stringify({ at: Date.now(), state: r.state }), { mode: 0o600 });
  return r;
}

// Global pacer shared by all processes (timestamp file next to T6BQA_STATE).
export async function pace(kind) {
  const f = (process.env.T6BQA_STATE || '/tmp/t6bqa') + '.pace';
  const gap = kind === 'add' ? Number(process.env.ADD_GAP_MS || 60000) : Number(process.env.CHG_GAP_MS || 20000);
  let last = 0;
  try { last = JSON.parse(readFileSync(f, 'utf8')).at; } catch { /* first call */ }
  const wait = gap - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  writeFileSync(f, JSON.stringify({ at: Date.now() }));
}

export async function newPage(browser, state, vw, vh = 812, extra = {}) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vh }, ...extra });
  const page = await ctx.newPage();
  page.setDefaultTimeout(120000);
  page.__real = { add: 0, change: 0, status: [] };
  page.__429 = false;
  // Pacing only: every request is forwarded unchanged to the server (route.continue()).
  await ctx.route(/\/cart\/(add|change)/, async (route) => {
    const req = route.request();
    if (req.method() === 'POST') await pace(/\/cart\/add/.test(req.url()) ? 'add' : 'change');
    await route.fallback();
  });
  page.on('response', (r) => {
    if (/\/cart\/(add|change)/.test(r.url()) && r.request().method() === 'POST') {
      const k = /\/cart\/add/.test(r.url()) ? 'add' : 'change';
      page.__real[k]++; page.__real.status.push(k + ':' + r.status());
      if (r.status() === 429) page.__429 = true;
    }
  });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error') logs.push('console.error: ' + m.text().replace(/\?[^\s)'"]*/g, '').slice(0, 300)); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + String(e.message).slice(0, 300)));
  page.__logs = logs;
  return { ctx, page };
}

export async function load(page, withTheme, path, themeId) {
  const resp = await page.goto(withTheme(path), { waitUntil: 'load' });
  const id = await page.evaluate(() => window.Shopify?.theme?.id);
  if (Number(id) !== Number(themeId)) throw new Error(`INVALID: Shopify.theme.id ${id}, expected ${themeId} on ${path}`);
  if (resp && resp.status() === 429) throw new Error('INVALID: 429 on ' + path);
  return resp;
}

export const activeFn = () => {
  const el = document.activeElement;
  if (!el) return 'null';
  return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.getAttribute('name') ? '[name=' + el.getAttribute('name') + ']' : ''}${el.hasAttribute('data-cart-drawer-close') ? '[close]' : ''}${el.getAttribute('role') ? '[role=' + el.getAttribute('role') + ']' : ''}${el.hasAttribute('data-cart-drawer-trigger') ? '[trigger]' : ''}${el.classList.contains('theme-evolution-header-menu__toggle') ? '[menu-toggle]' : ''}${el.closest('[role=dialog]') ? ' (in dialog)' : ''}`;
};

export const tabTo = async (page, selector, max = 80) => {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const hit = await page.evaluate((s) => document.activeElement?.matches(s), selector);
    if (hit) return i + 1;
  }
  throw new Error('tabTo: ' + selector + ' not reached');
};

export const waitOpen = async (page) => {
  await page.waitForFunction(() => document.querySelector('cart-drawer')?.dataset.state === 'open', null, { timeout: 60000 });
  await sleep(450);
};
export const idle = async (page) => {
  await page.waitForFunction(() => !document.querySelector('cart-drawer')?.hasAttribute('aria-busy'), null, { timeout: 60000 });
  await sleep(600);
};
