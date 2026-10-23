// T5a classification of TOG entries (plan 4.4) as code, so Step 0's table, the PXN registration and the cross-build comparison use one rule set.
// classOf(entry) -> [class, row/mechanism] ; class in P (parity rule), A (accepted, with its E-row), N (no visible effect, with its kind), SZ, or 'UNEXPLAINED'.
const BARE_E56 = new Set(['table', 'thead', 'tbody', 'tr', 'td', 'th', 'hr', 'blockquote', 'h6']);
export function classOf(e, opts = {}) {
  const p = e.prop;
  if (e.sz || /^(inset-(block|inline)-(start|end)|grid-template-(rows|columns))$/.test(p)) return ['SZ', 'root-cause grouping'];
  if (e.tag === 'input' && /^margin-(right|inline-end)$/.test(p)) return ['P', 'D5a.8 (checkbox margin)'];
  const hc = e.cont && e.cont.includes('hcaptcha');
  if (hc) return opts.hcFallback ? ['P', 'D5a.21 fallback'] : ['A', 'E5a.18'];
  if (/^outline-(width|style|color|offset)$/.test(p)) return ['A', 'E5a.1 (Q5a.1 a)'];
  if (e.cont === '#pc--optOutFormContainer' || e.cont === '.pc--show-email-field') {
    if (/^margin-(right|inline-end)$/.test(p) && e.tag === 'input') return ['P', 'D5a.8 (checkbox margin)'];
    if (['small', 'svg', 'circle', 'path'].includes(e.tag) && /^(line-height|flex-shrink)$/.test(p)) return ['P', 'D5a.20 (error message)'];
    if (/^transition-/.test(p)) return ['N', 'N-timing'];
    if (p === 'word-break') return ['P', 'D5a.5'];
    if (p === 'list-style-type') return ['N', 'inherited list-style, no list item'];
  }
  if (e.cont && /shopify-payment-button|shopify-accelerated-checkout/.test(e.cont)) {
    if (e.pseudo || /^(position|transition-.*)$/.test(p) || e.tag === 'shopify-accelerated-checkout' || /^--shopify-/.test(p)) return ['N', 'N-pseudo (E5a.13 resolved N)'];
  }
  if (e.cont && /shopify-policy__container/.test(e.cont)) {
    if (e.pseudo === '::after' && e.tag === 'div') return ['N', 'zero-height clearfix (.rte::after)'];
    if (p === 'word-break') return ['P', 'D5a.5'];
    return ['P', 'D5a.6 (policy list/link rules)'];
  }
  if (p === 'word-break') return ['P', 'D5a.5'];
  if (p === 'list-style-type') return ['N', 'inherited from .grid; no list item'];
  if (p === 'flex-wrap') return ['N', '.grid is display:grid'];
  if (p === 'z-index' && /loading__spinner/.test(e.cls)) return ['N', 'E5a.11'];
  if (e.tag === 'summary' && !e.rich && !/^p-/.test('') && /^(position|list-style-position)$/.test(p) && !e.prose && /list-none/.test(e.cls || '')) return ['N', 'E5a.7 (summary)'];
  if (e.tag === 'span' && p === 'list-style-position') return ['N', 'inherited list-style-position, no list item'];
  if (e.pseudo === '::marker' && e.tag === 'summary' && /list-none/.test(e.cls || '')) return ['N', 'E5a.7 (summary marker)'];
  // proxies (zoo, rt, announcement, vendor)
  if (p === 'margin-bottom' || p === 'margin-block-end') { if (/grid/.test(e.cls) && /border-b/.test(e.cls)) return ['A', 'E5a.4 (announcement bar)']; }
  if (p === 'display' && e.on === 'none' && e.off !== 'none') {
    if (e.rich) return ['P', 'D5a.19 (merchant HTML :empty)'];
    if (/opacity-70/.test(e.cls)) return ['P', 'M1 (vendor line empty:hidden)'];
    return ['A', 'E5a.17 (bare empty element)'];
  }
  if (e.rich || e.prose || BARE_E56.has(e.tag) || (e.tag === 'p' && p === 'font-style') || (e.tag === 'tr') || e.tag === 'tbody') return ['A', 'E5a.6'];
  if (e.tag === 'a' && p === 'cursor') return ['A', 'E5a.6 (bare a:not([href]) cursor, Q-C3)'];
  if (e.tag === 'summary' && p === 'cursor') return ['A', 'E5a.6 (bare summary)'];
  if (e.tag === 'summary') return ['A', 'E5a.6 (bare summary marker/position)'];
  if (e.cont && /challenge/.test(e.cont)) return ['A', 'E5a.12 (captcha model)'];
  if (e.tag === 'span' && /^(clip|overflow|position|margin|border|min-|padding|inset)/.test(p)) return ['A', 'zoo model: visually-hidden (synthetic; CEN real pages found none, D5a.7 not needed)'];
  if (e.tag === 'div' && /^(min-|margin-block|margin-top|margin-bottom)/.test(p)) return ['A', 'zoo model/derived from E5a.17 or E5a.12'];
  return ['UNEXPLAINED', ''];
}
