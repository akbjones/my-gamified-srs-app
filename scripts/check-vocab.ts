import { lookupWord as luTr } from '../src/data/dictionary/tr';
import { lookupWord as luHi } from '../src/data/dictionary/hi';
import { lookupWord as luRu } from '../src/data/dictionary/ru';

const TR_VOCAB = ['mavi','kırmızı','yeşil','sarı','siyah','beyaz','kahverengi','turuncu',
                  'baş','el','göz','ayak','bacak','kulak','burun',
                  'gömlek','ceket','palto','ayakkabı','elbise',
                  'kalem','peynir','çiçek','güneş','batıyor','ağrıyor'];
const HI_VOCAB = ['सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार','रविवार',
                  'सिर','हाथ','पैर','आँख','कान','टांग',
                  'कमीज़','जैकेट','कोट','जूता','ड्रेस','टोपी',
                  'साढ़े','सवा','पौने','दोपहर','आधी'];
const RU_VOCAB = ['четверть','полдень','полночь','половина','без'];

console.log('=== Turkish base vocab check ===');
for (const w of TR_VOCAB) {
  const r = luTr(w);
  console.log('  ' + w + ': ' + (r ? `OK (${r.en})` : '⚠ MISSING'));
}
console.log('\n=== Hindi base vocab check ===');
for (const w of HI_VOCAB) {
  const r = luHi(w);
  console.log('  ' + w + ': ' + (r ? `OK (${r.en})` : '⚠ MISSING'));
}
console.log('\n=== Russian base vocab check ===');
for (const w of RU_VOCAB) {
  const r = luRu(w);
  console.log('  ' + w + ': ' + (r ? `OK (${r.en})` : '⚠ MISSING'));
}
