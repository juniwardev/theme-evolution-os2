// Flatten two t5aq-feat JSON files and print every leaf that differs (base -> head), plus a few key leaves that match.
import { readFileSync } from 'node:fs';
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, 'utf8')));
const flat = (o, p = '', out = {}) => { if (o !== null && typeof o === 'object') for (const k of Object.keys(o)) flat(o[k], p ? `${p}.${k}` : k, out); else out[p] = o; return out; };
const fa = flat(a), fb = flat(b);
const keys = [...new Set([...Object.keys(fa), ...Object.keys(fb)])].filter((k) => k !== 'label');
let nd = 0, ns = 0;
for (const k of keys) {
  if (JSON.stringify(fa[k]) !== JSON.stringify(fb[k])) { nd++; console.log(`DIFF ${k}: ${JSON.stringify(fa[k])} -> ${JSON.stringify(fb[k])}`); } else ns++;
}
console.log(`\n${ns} equal leaves, ${nd} differing leaves`);
