#!/usr/bin/env node
// Test fixture: pass 2+ private *.book.json paths on the command line.
// This script contains NO codebook mappings, keys or signals.
import { readFileSync } from 'node:fs';
import { PelicanCore } from '../lib/pelican-core.mjs';

const fileNames = process.argv.slice(2);
if (fileNames.length < 2) {
  console.error('Usage: node tests/check-independent-codebooks.mjs path/to/table-a.book.json path/to/table-b.book.json [...]');
  process.exit(2);
}
const books = fileNames.map(filename => {
  const book = JSON.parse(readFileSync(filename, 'utf8'));
  PelicanCore.validateBook(book);
  return book;
});
const fields = ['sea', 'object', 'event', 'admiralty'];
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const shift = (a, b) => (alphabet.indexOf(b) - alphabet.indexOf(a) + 26) % 26;
const results = [];
for (let i = 0; i < books.length; i++) {
  for (let j = i + 1; j < books.length; j++) {
    const a = books[i], b = books[j];
    if (a.table_id === b.table_id) throw new Error('Duplicate table ID');
    const pairs = [];
    for (const field of fields) {
      for (const [concept, value] of Object.entries(a.sections[field])) {
        const other = b.sections[field][concept];
        if (!other) throw new Error('Missing concept in ' + b.table_id + ': ' + concept);
        pairs.push([value, other]);
      }
    }
    // A uniform Caesar shift per letter position would trivially derive one table from another.
    const deltas = pairs.map(([x, y]) => [shift(x[0],y[0]),shift(x[1],y[1])]);
    const oneShift = deltas.every(([x,y])=>x===deltas[0][0]&&y===deltas[0][1]);
    // A positional substitution alphabet is more general than a uniform shift.
    const replacements = [new Map(), new Map()];
    let substitutionPossible = true;
    for (const [x,y] of pairs) for (let k=0;k<2;k++) {
      if(replacements[k].has(x[k])&&replacements[k].get(x[k])!==y[k]) substitutionPossible=false;
      replacements[k].set(x[k],y[k]);
    }
    const ndPairs = Object.entries(a.extension.tokens).map(([id,token])=>[token,b.extension.tokens[id]]);
    if (ndPairs.some(([,code])=>typeof code!=='string')) throw new Error('ND token missing');
    const ndDeltas=ndPairs.map(([x,y])=>[shift(x[0],y[0]),shift(x[1],y[1])]);
    const ndShift=ndDeltas.every(([x,y])=>x===ndDeltas[0][0]&&y===ndDeltas[0][1]);
    const result={tables:[a.table_id,b.table_id],mainConcepts:pairs.length,
      identicalConceptCodes:pairs.filter(([x,y])=>x===y).length,
      distinctShiftVectors:new Set(deltas.map(x=>x.join(','))).size,
      caesarDerivable:oneShift,positionSubstitutionDerivable:substitutionPossible,
      ndTokenCount:ndPairs.length,ndCaesarDerivable:ndShift};
    if(oneShift||substitutionPossible||ndShift) throw new Error('Unsafe derivation found: '+JSON.stringify(result));
    results.push(result);
  }
}
console.log(JSON.stringify({outcome:'PASS',comparedPairs:results.length,results,
  warning:'Not an encryption or cryptanalysis security guarantee.'},null,2));
