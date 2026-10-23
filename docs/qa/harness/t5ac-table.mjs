// T5a Step 0 item 8: the classification table. Applies t5ac-class.mjs to every TOG raw file in the given dirs and prints rows grouped by (class, mechanism, property).
// Usage: node t5ac-table.mjs <outfile> <dir>:<regex> [<dir>:<regex> ...]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { classOf } from './t5ac-class.mjs';
const [outFile, ...specs] = process.argv.slice(2);
const g = new Map(); let runs = 0, invalid = 0, entries = 0;
for (const spec of specs) {
  const [dir, re] = spec.split(':');
  for (const f of readdirSync(dir).filter((f) => f.startsWith('tog-') && new RegExp(re).test(f))) {
    const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
    if (!j.valid) { invalid++; continue; }
    runs++;
    const rootKeys = new Set(j.entries.filter((e) => !e.pseudo).map((e) => `${e.path}|${e.prop}|${e.on}|${e.off}`));
    for (const e of j.entries) {
      entries++;
      if (e.pseudo && rootKeys.has(`${e.path}|${e.prop}|${e.on}|${e.off}`)) continue; // inherited mirror
      const [c, r] = classOf(e);
      const k = `${c} | ${r} | ${e.owner}${e.cont ? ' ' + e.cont.slice(0, 40) : ''} | ${e.tag}${e.pseudo ? ' ' + e.pseudo : ''} | ${e.prop} | ${e.on} -> ${e.off}`;
      const x = g.get(k) || { n: 0, pages: new Set(), states: new Set() }; x.n++; x.pages.add(j.key); x.states.add(j.state); g.set(k, x);
    }
  }
}
const rows = [...g].sort((a, b) => a[0].localeCompare(b[0]));
const un = rows.filter(([k]) => k.startsWith('UNEXPLAINED'));
const lines = [`runs ${runs}, invalid ${invalid}, entries ${entries}, groups ${rows.length}, UNEXPLAINED groups ${un.length}`];
for (const [k, x] of rows) lines.push(`${x.n}x [${[...x.pages].join(',')}; ${[...x.states].join(',')}] ${k}`);
writeFileSync(outFile, lines.join('\n') + '\n');
console.log(lines[0]);
for (const [k, x] of un) console.log('UNEXPLAINED', k, x.n);
