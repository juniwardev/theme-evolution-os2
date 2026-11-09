// T6b C6b.3(a): method bodies of cart-drawer.liquid vs Step 0 (docs/qa/evidence/t6bc-step0-methods.json), by brace matching.
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const src = readFileSync('sections/cart-drawer.liquid', 'utf8');
function body(name) { const i = src.indexOf('      ' + name + '('); if (i < 0) return null; let d = 0, k = src.indexOf('{', i); for (; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}') { d--; if (d === 0) break; } } return src.slice(i, k + 1); }
const base = JSON.parse(readFileSync('docs/qa/evidence/t6bc-step0-methods.json', 'utf8'));
const sha = (t) => createHash('sha1').update(t).digest('hex');
for (const n of ['getSectionsToRender', 'updateLineItem']) console.log(n, sha(body(n)) === base[n] ? 'identical' : 'DIFFERS');
for (const n of ['renderContents', 'updateCart']) console.log(n, body(n).includes('this.keepFocusInside();') ? 'has keepFocusInside' : 'none', 'lines', body(n).split('\n').length);
console.log('join count', (src.match(/\.join\(','\)/g) || []).length);
