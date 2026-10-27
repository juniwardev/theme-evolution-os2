import { chromium, loginState } from '/Users/juniorwarner/Projects/Shopify/theme-evolution-os2/docs/qa/harness/t0-lib.mjs';
const OUT = process.argv[2];
const origin = 'https://theme-evolution-os2.myshopify.com';
const FIX = `<h5>A level-five heading</h5><h6>A level-six heading</h6><p>Text before the quote, with a <a>link that has no address</a>.</p>
<blockquote><p>A quoted sentence from a customer review.</p></blockquote><p>Text before the divider.</p><hr><p>Text after the divider.</p>
<table><tr><th>Size</th><th>Length</th><th>Rider weight</th></tr><tr><td>Small</td><td>148 cm</td><td>45-60 kg</td></tr><tr><td>Large</td><td>158 cm</td><td>65-85 kg</td></tr></table>
<details><summary>Shipping and returns (click to expand)</summary><p>Hidden answer text.</p></details><p>End of sample.</p>`;
const browser = await chromium.launch();
for (const [name, id] of Object.entries({ live: null, staging: '187953643616' })) {
  const withTheme = (p) => id ? `${origin}${p}?preview_theme_id=${id}` : `${origin}${p}`;
  const { state } = await loginState(browser, withTheme);
  for (const vp of [{ width: 1440, height: 900 }, { width: 375, height: 667 }]) {
    const ctx = await browser.newContext({ storageState: state, viewport: vp });
    const page = await ctx.newPage();
    await page.goto(withTheme('/pages/contact'), { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    const ok = await page.evaluate((FIX) => {
      document.querySelectorAll('[id*="PBar" i], [id*="preview-bar" i], iframe').forEach((e) => { if (getComputedStyle(e).position === 'fixed' || e.closest('[id*="PBar" i]') || /preview/i.test(e.id)) e.remove(); });
      const rich = document.querySelector('[id^="shopify-section-template"][id$="__main"]');
      if (!rich) return false;
      const mk = (label, cls) => { const w = document.createElement('div'); w.setAttribute('data-zoo', label); w.style.cssText = 'outline:2px dashed #e33;margin:24px auto;padding:8px;max-width:760px'; const h = document.createElement('p'); h.textContent = label; h.style.cssText = 'font:600 12px system-ui;color:#e33;margin:0 0 8px'; const b = document.createElement('div'); if (cls) { b.className = cls; b.setAttribute('data-rich-text', ''); } b.innerHTML = FIX; w.append(h, b); return w; };
      rich.replaceChildren(mk('SAMPLE A: inside a page or blog post (rich text)', 'prose prose-tokens max-w-none'), mk('SAMPLE B: plain (policy bodies, Shopify or app markup)', ''));
      return true;
    }, FIX);
    for (const z of ['SAMPLE A', 'SAMPLE B']) {
      const el = page.locator(`[data-zoo^="${z}"]`);
      await el.screenshot({ path: `${OUT}/zoo-${z.slice(-1)}-${name}-${vp.width}.png` });
    }
    console.log(name, vp.width, 'injected', ok);
    await ctx.close();
  }
}
await browser.close();
