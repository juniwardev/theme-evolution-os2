// T6a Coder harness helpers (t6ac-*). Imports only t0-lib.mjs (login; password read there, never printed).
// The session cookie (never the password) is cached in T6AC_STATE for up to 50 minutes (Cloudflare 429 on password POST bursts).
import { chromium, parseArgs, loginState as t0LoginState } from './t0-lib.mjs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

export { chromium, parseArgs };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function loginState(browser, withTheme) {
  const cache = process.env.T6AC_STATE;
  if (cache && existsSync(cache)) {
    const j = JSON.parse(readFileSync(cache, 'utf8'));
    if (Date.now() - j.at < 50 * 60 * 1000) return { state: j.state, loggedIn: true };
  }
  const r = await t0LoginState(browser, withTheme);
  if (cache && r.loggedIn) writeFileSync(cache, JSON.stringify({ at: Date.now(), state: r.state }), { mode: 0o600 });
  return r;
}

export async function newPage(browser, state, vw, vh = 900, dpr = 1) {
  const ctx = await browser.newContext({ storageState: state, viewport: { width: vw, height: vh }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  return { ctx, page };
}

// Load a page and assert the preview theme id (a context that opened ?preview_theme_id= keeps being served that theme).
export async function open(page, withTheme, path, themeId) {
  await page.goto(withTheme(path), { waitUntil: 'load' });
  const id = await page.evaluate(() => String(window.Shopify && window.Shopify.theme && window.Shopify.theme.id));
  if (id !== String(themeId)) throw new Error(`theme id ${id} != ${themeId} on ${path}`);
}

// In page: shell content box, the product grid's opening tag, tracks, card and img rects and img attributes.
export const gridFn = () => {
  const r1 = (n) => Math.round(n * 10) / 10;
  const shell = document.querySelector('[data-page-shell]');
  const sb = shell.getBoundingClientRect();
  const sc = getComputedStyle(shell);
  const wc = sb.width - parseFloat(sc.paddingLeft) - parseFloat(sc.paddingRight);
  const grid = shell.querySelector(':scope > div[style*="--grid-min"]');
  const gs = getComputedStyle(grid);
  const open = grid.outerHTML.slice(0, grid.outerHTML.indexOf('>') + 1);
  const cards = [...grid.children].map((c) => {
    const b = c.getBoundingClientRect();
    const img = c.querySelector('img');
    const ib = img ? img.getBoundingClientRect() : null;
    return {
      x: r1(b.left), y: r1(b.top + scrollY), w: r1(b.width), h: r1(b.height),
      img: img ? {
        x: r1(ib.left), y: r1(ib.top + scrollY), w: r1(ib.width), h: r1(ib.height),
        srcset: img.getAttribute('srcset'), sizes: img.getAttribute('sizes'), loading: img.getAttribute('loading'),
        width: img.getAttribute('width'), height: img.getAttribute('height'), src: img.getAttribute('src'), currentSrc: img.currentSrc,
      } : null,
    };
  });
  return {
    iw: innerWidth, sw: document.documentElement.scrollWidth, wc: r1(wc), open, gtc: gs.gridTemplateColumns,
    tracks: gs.gridTemplateColumns.split(' ').length, h1: document.querySelectorAll('h1').length, cards,
    themeId: String(Shopify.theme.id),
  };
};

// In page: the browser's applied sizes length for an img (first matching entry; media query resolved by matchMedia).
export const sizesEvalFn = (sel) => {
  const img = document.querySelector(sel);
  const parts = []; let depth = 0, cur = '';
  for (const ch of img.sizes) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch; }
  parts.push(cur.trim());
  for (const p of parts) {
    let media = null, len = p;
    if (p.startsWith('(')) { let d = 0, i = 0; for (; i < p.length; i++) { if (p[i] === '(') d++; if (p[i] === ')') { d--; if (d === 0) break; } } media = p.slice(0, i + 1); len = p.slice(i + 1).trim(); }
    if (media && !matchMedia(media).matches) continue;
    const probe = document.createElement('div');
    probe.style.cssText = `position:fixed;left:0;top:0;height:0;visibility:hidden;width:${len}`;
    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    return w;
  }
  return null;
};

// In page (R5): a detached image with only src reports the file's pixels; never read naturalWidth off a card img.
export const fileSizeFn = async (url) => {
  const i = new Image(); i.src = url; await i.decode(); return [i.naturalWidth, i.naturalHeight];
};

export const widthParam = (u) => { const m = /[?&]width=(\d+)/.exec(u || ''); return m ? +m[1] : null; };

export const overflowFn = () => ({ iw: innerWidth, sw: document.documentElement.scrollWidth });

// Fresh context at (vw, dpr): image bytes (response bodies from the Shopify CDN), first four card images, LCP; before and after scrolling to the bottom.
export async function measureBytes(browser, state, withTheme, themeId, path, vw, dpr) {
  const { ctx, page } = await newPage(browser, state, vw, 900, dpr);
  const sizes = new Map();
  page.on('response', async (resp) => {
    const u = resp.url();
    if (!/\/cdn\/shop\/.*\.(jpg|jpeg|png|webp|avif)$/i.test(u.split('?')[0])) return;
    try { sizes.set(u, (await resp.body()).length); } catch { /* aborted */ }
  });
  await page.addInitScript(() => {
    window.__lcp = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await open(page, withTheme, path, themeId);
  await sleep(2500);
  const card = await page.evaluate(() => [...document.querySelectorAll('[data-page-shell] > div[style*="--grid-min"] img')].map((i) => i.currentSrc));
  const sum = (urls) => urls.reduce((a, u) => a + (sizes.get(u) || 0), 0);
  const cardUrls = new Set(card);
  const before = [...sizes.keys()].filter((u) => cardUrls.has(u));
  const first4 = card.slice(0, 4).map((u) => sizes.get(u) ?? null);
  const lcp = await page.evaluate(() => Math.round(window.__lcp));
  const beforeBytes = sum(before);
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 300) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)); } scrollTo(0, document.body.scrollHeight); });
  await sleep(3000);
  const cardAfter = await page.evaluate(() => [...document.querySelectorAll('[data-page-shell] > div[style*="--grid-min"] img')].map((i) => i.currentSrc).filter(Boolean));
  const afterBytes = sum([...new Set(cardAfter)]);
  const res = { vw, dpr, cards: card.length, loadedBeforeScroll: before.length, first4, beforeBytes, afterBytes, afterLoaded: new Set(cardAfter).size, lcp };
  await ctx.close();
  return res;
}
