// Why: CSS cascade-layer order is fixed by the first declaration. Any layer that
// assets/tailwind.css declares but the inline <style> statement doesn't name is
// appended last, i.e. it becomes the strongest layer. See
// docs/plans/theme-evolution-tailwind.md D4.
import { readFileSync } from 'node:fs';

// Keep in step with the inline <style> in the files below. Phase T5 removes legacy and shims.
const EXPECTED_LAYERS = ['properties', 'theme', 'base', 'legacy', 'components', 'utilities', 'shims'];
const FILES_WITH_LAYER_STATEMENT = [
  'layout/theme.liquid',
  'layout/password.liquid',
  'templates/gift_card.liquid',
];

function declaredLayerNames(css) {
  const names = new Set();
  for (const match of css.matchAll(/@layer\s+([^;{]+)[;{]/g)) {
    for (const name of match[1].split(',')) {
      names.add(name.trim());
    }
  }
  return names;
}

const problems = [];

for (const name of declaredLayerNames(readFileSync('assets/tailwind.css', 'utf8'))) {
  if (!EXPECTED_LAYERS.includes(name)) {
    problems.push(`assets/tailwind.css declares layer "${name}", which the inline statement does not list.`);
  }
}

const expectedTag = `<style>@layer ${EXPECTED_LAYERS.join(', ')};</style>`;
for (const file of FILES_WITH_LAYER_STATEMENT) {
  if (!readFileSync(file, 'utf8').includes(expectedTag)) {
    problems.push(`${file} does not contain ${expectedTag}`);
  }
}

for (const problem of problems) {
  console.error(problem);
}
process.exit(problems.length > 0 ? 1 : 0);
