// Group TOG raw entries into the classification table rows (pseudo mirrors collapsed, size-derived entries counted per run).
// Usage: node t5ac-groups.mjs <rawDir> <fileRegex> [--md]
import { readdirSync, readFileSync } from 'node:fs';
const [dir, re = '.'] = process.argv.slice(2);
const g = new Map(); let runs = 0, szRuns = new Map();
for (const f of readdirSync(dir).filter((f) => f.startsWith('tog-') && new RegExp(re).test(f))) {
  const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));
  if (!j.valid) { console.log('INVALID', f); continue; }
  runs++;
  const rootKeys = new Set(j.entries.filter((e) => !e.sz && !e.pseudo).map((e) => `${e.path}|${e.prop}|${e.on}|${e.off}`));
  for (const e of j.entries) {
    if (e.sz) { const k = `${j.key}@${j.w}:${j.state}`; szRuns.set(k, (szRuns.get(k) || 0) + 1); continue; }
    if (e.pseudo && rootKeys.has(`${e.path}|${e.prop}|${e.on}|${e.off}`)) continue; // inherited mirror on a pseudo-element
    const k = [e.owner, e.cont || '', e.tag, e.pseudo, e.prop, e.on, e.off].join(' | ');
    const x = g.get(k) || { n: 0, pages: new Set(), ex: null };
    x.n++; x.pages.add(j.key); x.ex ||= `${e.cls.slice(0, 30)} / ${e.t.replace(/\s+/g, ' ').slice(0, 20)} / ${e.rich ? 'rich ' : ''}${e.policy ? 'policy' : ''}`; g.set(k, x);
  }
}
console.log(`runs=${runs} rows=${g.size}`);
for (const [k, x] of [...g].sort((a, b) => a[0].localeCompare(b[0]))) console.log(`${x.n}x pages[${[...x.pages].join(',')}] ${k}  <${x.ex}>`);
console.log('SZ-only run keys with size entries:', szRuns.size);
