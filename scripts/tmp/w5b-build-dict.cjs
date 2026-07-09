const fs = require('fs');
const src = fs.readFileSync('src/data/dictionary/id.ts', 'utf8');

// parse single-line entries from id.ts
const existing = {};
const re = /^\s{2}(['"])(.+?)\1:\s*\{\s*(.+?)\s*\},?\s*$/gm;
let m;
while ((m = re.exec(src))) {
  const key = m[2];
  const body = m[3];
  const entry = {};
  const fre = /(en|ipa|pos|lemma):\s*'((?:[^'\\]|\\.)*)'/g;
  let f;
  while ((f = fre.exec(body))) entry[f[1]] = f[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  if (entry.en) existing[key] = entry;
}
console.log('parsed existing entries:', Object.keys(existing).length);

const newEntries = {
  "apalagi": { "en": "especially, let alone", "ipa": "apaˈlagi", "pos": "adv" },
  "bahkan": { "en": "even, in fact", "ipa": "ˈbahkan", "pos": "adv" },
  "bendera": { "en": "flag", "ipa": "bənˈdera", "pos": "n" },
  "bercanda": { "en": "to joke, to kid", "ipa": "bərˈtʃanda", "pos": "v", "lemma": "canda" },
  "bertanggung": { "en": "to bear (bertanggung jawab = to be responsible)", "ipa": "bərˈtaŋgʊŋ", "pos": "v", "lemma": "tanggung" },
  "buktikan": { "en": "prove (it)", "ipa": "bukˈtikan", "pos": "v", "lemma": "bukti" },
  "buku-buku": { "en": "books", "ipa": "ˈbuku ˈbuku", "pos": "n", "lemma": "buku" },
  "celengan": { "en": "piggy bank", "ipa": "tʃəˈleŋan", "pos": "n" },
  "cuma": { "en": "only, just (everyday spoken)", "ipa": "ˈtʃuma", "pos": "adv" },
  "diantar": { "en": "to be delivered, be taken (somewhere)", "ipa": "diˈantar", "pos": "v", "lemma": "antar" },
  "dibujuk": { "en": "to be coaxed, be persuaded", "ipa": "diˈbudʒʊʔ", "pos": "v", "lemma": "bujuk" },
  "dijelaskan": { "en": "to be explained", "ipa": "didʒəˈlaskan", "pos": "v", "lemma": "jelas" },
  "dipikir-pikir": { "en": "come to think of it, on reflection", "ipa": "diˈpikir ˈpikir", "pos": "v", "lemma": "pikir" },
  "ditahan": { "en": "to be held (back)", "ipa": "diˈtahan", "pos": "v", "lemma": "tahan" },
  "ekonomi": { "en": "economy; economy-class", "ipa": "ekoˈnomi", "pos": "n" },
  "fokus": { "en": "focused; focus", "ipa": "ˈfokʊs", "pos": "adj" },
  "hafal": { "en": "to know by heart", "ipa": "ˈhafal", "pos": "v" },
  "ingat": { "en": "to remember (root)", "ipa": "ˈiŋat", "pos": "v" },
  "isinya": { "en": "its contents, what it says", "ipa": "ˈisiɲa", "pos": "n", "lemma": "isi" },
  "jajan": { "en": "to snack (uang jajan = pocket money)", "ipa": "ˈdʒadʒan", "pos": "v" },
  "jangankan": { "en": "let alone, never mind", "ipa": "dʒaˈŋankan", "pos": "conj" },
  "juara": { "en": "champion", "ipa": "dʒuˈara", "pos": "n" },
  "juaranya": { "en": "the champion (of it)", "ipa": "dʒuˈaraɲa", "pos": "n", "lemma": "juara" },
  "juni": { "en": "June", "ipa": "ˈdʒuni", "pos": "n" },
  "kecilkan": { "en": "turn (it) down, make smaller", "ipa": "kəˈtʃilkan", "pos": "v", "lemma": "kecil" },
  "kelompok": { "en": "group", "ipa": "kəˈlompoʔ", "pos": "n" },
  "koki": { "en": "chef, cook", "ipa": "ˈkoki", "pos": "n" },
  "krim": { "en": "cream (es krim = ice cream)", "ipa": "krim", "pos": "n" },
  "ledeng": { "en": "plumbing (tukang ledeng = plumber)", "ipa": "ˈledɛŋ", "pos": "n" },
  "ledengnya": { "en": "the plumbing (tukang ledengnya = the plumber)", "ipa": "ˈledɛŋɲa", "pos": "n", "lemma": "ledeng" },
  "lembar": { "en": "sheet; bill (counting word for flat things)", "ipa": "ˈlembar", "pos": "n" },
  "masalahnya": { "en": "the problem (is)", "ipa": "maˈsalahɲa", "pos": "n", "lemma": "masalah" },
  "memastikan": { "en": "to make sure, to confirm", "ipa": "məmasˈtikan", "pos": "v", "lemma": "pasti" },
  "membangun": { "en": "to build", "ipa": "məmˈbaŋʊn", "pos": "v", "lemma": "bangun" },
  "memilihnya": { "en": "to choose it, choose among them", "ipa": "məˈmilihɲa", "pos": "v", "lemma": "pilih" },
  "mengejutkan": { "en": "shocking; to shock", "ipa": "məŋəˈdʒʊtkan", "pos": "v", "lemma": "kejut" },
  "mengeluh": { "en": "to complain", "ipa": "məŋəˈlʊh", "pos": "v", "lemma": "keluh" },
  "menyangka": { "en": "to expect, to suspect", "ipa": "məˈɲaŋka", "pos": "v", "lemma": "sangka" },
  "menyumbang": { "en": "to donate, to contribute", "ipa": "məˈɲumbaŋ", "pos": "v", "lemma": "sumbang" },
  "menyusul": { "en": "to follow later, to catch up", "ipa": "məˈɲusʊl", "pos": "v", "lemma": "susul" },
  "mi": { "en": "noodles (mi goreng = fried noodles)", "ipa": "mi", "pos": "n" },
  "minumannya": { "en": "the drink(s)", "ipa": "miˈnumanɲa", "pos": "n", "lemma": "minum" },
  "pajak": { "en": "tax", "ipa": "ˈpadʒaʔ", "pos": "n" },
  "panggung": { "en": "stage (for performing)", "ipa": "ˈpaŋgʊŋ", "pos": "n" },
  "pelan": { "en": "slow, gentle (pelan tapi pasti = slowly but surely)", "ipa": "pəˈlan", "pos": "adj" },
  "pemandangannya": { "en": "the view, the scenery", "ipa": "pəmanˈdaŋanɲa", "pos": "n", "lemma": "pandang" },
  "penghasilan": { "en": "income, earnings", "ipa": "pəŋhaˈsilan", "pos": "n", "lemma": "hasil" },
  "perjanjian": { "en": "agreement, contract", "ipa": "pərdʒanˈdʒian", "pos": "n", "lemma": "janji" },
  "pintar": { "en": "clever; good at", "ipa": "ˈpintar", "pos": "adj" },
  "pula": { "en": "as well, what is more (bookish juga)", "ipa": "ˈpula", "pos": "part" },
  "rugi": { "en": "to lose out; loss (tidak pernah rugi = never a loss)", "ipa": "ˈrugi", "pos": "v" },
  "selera": { "en": "taste, appetite", "ipa": "səˈlera", "pos": "n" },
  "serial": { "en": "series (TV show)", "ipa": "ˈserial", "pos": "n" },
  "sesuai": { "en": "in line with, according to", "ipa": "səsuˈai", "pos": "prep" },
  "sih": { "en": "casual spoken particle (bagus sih = it is good, I admit)", "ipa": "sih", "pos": "part" },
  "sma": { "en": "high school (SMA = sekolah menengah atas)", "ipa": "ɛs ɛm ˈa", "pos": "n" },
  "stoknya": { "en": "the stock", "ipa": "ˈstokɲa", "pos": "n", "lemma": "stok" },
  "sumbangannya": { "en": "the donation", "ipa": "sumbaˈŋanɲa", "pos": "n", "lemma": "sumbang" },
  "sumber": { "en": "source", "ipa": "ˈsumbər", "pos": "n" },
  "sumbernya": { "en": "its source", "ipa": "ˈsumbərɲa", "pos": "n", "lemma": "sumber" },
  "sumur": { "en": "well (for water)", "ipa": "ˈsumʊr", "pos": "n" },
  "sungguhan": { "en": "real, the real thing", "ipa": "sʊŋˈguhan", "pos": "adj" },
  "tampil": { "en": "to perform, to appear (on stage)", "ipa": "ˈtampil", "pos": "v" },
  "televisinya": { "en": "the television", "ipa": "teləˈvisiɲa", "pos": "n", "lemma": "televisi" },
  "terbatas": { "en": "limited", "ipa": "tərˈbatas", "pos": "adj", "lemma": "batas" },
  "terbuka": { "en": "open (to)", "ipa": "tərˈbuka", "pos": "adj", "lemma": "buka" },
  "tesnya": { "en": "the test", "ipa": "ˈtɛsɲa", "pos": "n", "lemma": "tes" },
  "undian": { "en": "prize draw, raffle", "ipa": "unˈdian", "pos": "n" },
  "upacara": { "en": "ceremony", "ipa": "upaˈtʃara", "pos": "n" },
  "warungnya": { "en": "her/his food stall", "ipa": "waˈruŋɲa", "pos": "n", "lemma": "warung" }
};

const toks = fs.readFileSync('scripts/tmp/w5b-tokens-all.txt', 'utf8').trim().split('\n');
const out = {};
const uncovered = [];
for (const t of toks) {
  if (newEntries[t]) out[t] = newEntries[t];
  else if (existing[t]) out[t] = existing[t];
  else uncovered.push(t);
}
// support entries (lemma targets not used as tokens)
for (const k of ['juara', 'sumber', 'ledeng']) if (!out[k]) out[k] = newEntries[k];

if (uncovered.length) { console.log('UNCOVERED:', uncovered.join(' ')); process.exit(1); }
const sorted = {};
for (const k of Object.keys(out).sort()) sorted[k] = out[k];
fs.writeFileSync('scripts/tmp/wave5-dict-B.json', JSON.stringify(sorted, null, 1) + '\n');
console.log('wrote wave5-dict-B.json with', Object.keys(sorted).length, 'entries (all', toks.length, 'tokens covered)');

const roots = ['batas','bujuk','bukti','canda','hafal','keluh','pasti','rugi','sangka','susul','tampil','tanggung'];
fs.writeFileSync('scripts/tmp/wave5-roots-B.json', JSON.stringify(roots, null, 1) + '\n');
console.log('wrote wave5-roots-B.json with', roots.length, 'roots');
