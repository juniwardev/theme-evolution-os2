// QA diff of two t6ac-facts.mjs outputs: node t6aqa-diff.mjs <base.json> <head.json>
// C6a.3 (grid tag, tracks, card and img rects at 12 widths) and C6a.9 (other callers' img outerHTML and wrapper rects).
import { readFileSync } from 'node:fs';

const [, , baseFile, headFile] = process.argv;
const b = JSON.parse(readFileSync(baseFile, 'utf8'));
const h = JSON.parse(readFileSync(headFile, 'utf8'));
const fails = [];
let cardsChecked = 0, imgsChecked = 0;
for (const w of Object.keys(b.geometry)) {
  const gb = b.geometry[w], gh = h.geometry[w];
  if (gb.open !== gh.open) fails.push(`${w}: grid tag differs`);
  if (gb.gtc !== gh.gtc) fails.push(`${w}: gridTemplateColumns ${gb.gtc} vs ${gh.gtc}`);
  if (gb.cards.length !== gh.cards.length || gb.cards.length < 1) fails.push(`${w}: card count`);
  gb.cards.forEach((c, i) => {
    const d = gh.cards[i];
    cardsChecked++;
    for (const k of ['x', 'y', 'w', 'h']) if (Math.abs(c[k] - d[k]) > 1) fails.push(`${w} card ${i} ${k}: ${c[k]} vs ${d[k]}`);
    if (!!c.img !== !!d.img) fails.push(`${w} card ${i}: img presence`);
    if (c.img && d.img) {
      imgsChecked++;
      for (const k of ['x', 'y', 'w', 'h']) if (Math.abs(c.img[k] - d.img[k]) > 1) fails.push(`${w} card ${i} img ${k}: ${c.img[k]} vs ${d.img[k]}`);
    }
  });
}
let callers = 0;
for (const k of Object.keys(b.callers)) {
  const cb = b.callers[k], ch = h.callers[k];
  if (cb.length !== ch.length || cb.length < 1) fails.push(`${k}: count ${cb.length} vs ${ch.length}`);
  cb.forEach((c, i) => {
    callers++;
    if (c.html !== ch[i].html) fails.push(`${k}[${i}]: outerHTML differs`);
    if (JSON.stringify(c.wrap) !== JSON.stringify(ch[i].wrap)) fails.push(`${k}[${i}]: wrapper ${c.wrap} vs ${ch[i].wrap}`);
  });
}
console.log(`widths ${Object.keys(b.geometry).length}, cards ${cardsChecked}, imgs ${imgsChecked}, caller imgs ${callers}, fails ${fails.length}`);
console.log(fails.slice(0, 20).join('\n'));
