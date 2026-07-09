import { applyMeN } from '../../src/data/conjugation/id';
// verify each new root's meN- form matches the surface form used in cards
const pairs: [string, string][] = [
  ['alir','mengalir'], ['banding','membanding'], ['cicil','mencicil'],
  ['gabung','menggabung'], ['hindar','menghindar'], ['kocok','mengocok'],
  ['kontrak','mengontrak'], ['lunas','melunas'], ['sesal','menyesal'],
  ['sisih','menyisih'], ['tunggak','menunggak'],
];
let ok = true;
for (const [root, expect] of pairs) {
  const got = applyMeN(root);
  if (got !== expect) { ok = false; console.log(`MISMATCH ${root}: engine=${got} expected=${expect}`); }
}
console.log(ok ? 'ALL meN- FORMS MATCH ENGINE' : 'mismatches above');
