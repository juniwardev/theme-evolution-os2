// Build the live-probe reference from Step 0's TOG raw files (dev theme): unique root-cause tuples for Shopify- and app-owned containers.
// Usage: node t5ac-ref.mjs <rawDir> <out.json> [regex]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const [dir, out, re = '^tog-base-'] = process.argv.slice(2);
const entries = new Map(), containers = new Set();
for (const f of readdirSync(dir).filter((f) => new RegExp(re).test(f))) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  if (!j.valid) continue;
  for (const e of j.entries) if (e.cont) {
    containers.add(e.cont);
    if (e.sz) continue;
    const t = { cont: e.cont, rel: e.rel, prop: e.prop, on: e.on, off: e.off, pseudo: e.pseudo || '' };
    entries.set(JSON.stringify(t), t);
  }
}
writeFileSync(out, JSON.stringify({ containers: [...containers], entries: [...entries.values()] }, null, 1));
console.log('containers', [...containers].join(' | '), 'entries', entries.size);
