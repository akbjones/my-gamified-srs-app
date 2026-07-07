#!/usr/bin/env node
// Backfill missing RU + TR dictionary entries, alphabetically placed.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RU_PATH = path.join(ROOT, 'src/data/dictionary/ru.ts');
const TR_PATH = path.join(ROOT, 'src/data/dictionary/tr.ts');

// entry: [tokenAsInText, en, ipa, pos, lemmaCandidates?]
const RU_ENTRIES = [
  ['запечатывали', 'they sealed', 'zɐpʲɪˈt͡ɕatɨvəlʲɪ', 'v', ['запечатывать']],
  ['студию', 'studio (acc.)', 'ˈstudʲɪju', 'n', ['студия']],
  ['Сидя', 'while sitting', 'ˈsʲidʲə', 'adv', ['сидеть']],
  ['мастерской', 'workshop (prep.)', 'məstʲɪrˈskoj', 'n', ['мастерская']],
  ['представляю', 'I imagine; I introduce', 'prʲɪtstɐˈvlʲæju', 'v', ['представлять']],
  ['компанию', 'company (acc.)', 'kɐmˈpanʲɪju', 'n', ['компания']],
  ['Мастерица', 'craftswoman; skilled woman', 'məstʲɪˈrʲit͡sə', 'n'],
  ['вышивала', 'she embroidered', 'vɨʂɨˈvalə', 'v', ['вышивать']],
  ['ароматное', 'fragrant', 'ɐrɐˈmatnəjə', 'adj', ['ароматный']],
  ['лавандой', 'lavender (instr.)', 'lɐˈvandəj', 'n', ['лаванда']],
  ['клоун', 'clown', 'ˈkɫoun', 'n'],
  ['Крепкий', 'strong; sturdy', 'ˈkrʲepkʲɪj', 'adj'],
  ['улыбнулась', 'she smiled', 'ʊɫɨbˈnuɫəsʲ', 'v', ['улыбнуться']],
  ['обещает', 'promises', 'ɐbʲɪˈɕæjɪt', 'v', ['обещать']],
  ['благодарен', 'grateful', 'bɫəɡɐˈdarʲɪn', 'adj', ['благодарный']],
  ['учебник', 'textbook', 'ʊˈt͡ɕebnʲɪk', 'n'],
  ['запечатывала', 'she sealed', 'zɐpʲɪˈt͡ɕatɨvəɫə', 'v', ['запечатывать']],
  ['разбирались', 'they figured out; sorted out', 'rəzbʲɪˈralʲɪsʲ', 'v', ['разбираться']],
  ['постирает', 'will wash (laundry)', 'pəsʲtʲɪˈrajɪt', 'v', ['постирать', 'стирать']],
  ['нужную', 'necessary (acc.)', 'ˈnuʐnuju', 'adj', ['нужный']],
  ['больным', 'sick; to the sick (dat. pl.)', 'bɐlʲˈnɨm', 'adj', ['больной']],
  ['клинике', 'clinic (prep.)', 'ˈklʲinʲɪkʲɪ', 'n', ['клиника']],
  ['коня', 'horse (acc.)', 'kɐˈnʲa', 'n', ['конь']],
  ['козу', 'goat (acc.)', 'kɐˈzu', 'n', ['коза']],
  ['мыть', 'to wash', 'mɨtʲ', 'v'],
  ['уговаривала', 'she was persuading', 'ʊɡɐˈvarʲɪvəɫə', 'v', ['уговаривать']],
];

const TR_ENTRIES = [
  ['ciddiyetle', 'with seriousness; seriously', 'dʒiddijetle', 'adv', ['ciddiyet']],
  ['yapardı', 'he used to do', 'jɑpɑɾdɯ', 'v', ['yapmak']],
  ['yatırdı', 'he deposited; he laid down', 'jɑtɯɾdɯ', 'v', ['yatırmak']],
  ['klinikte', 'at the clinic', 'klinikte', 'n', ['klinik']],
  ['kliniği', 'clinic (acc.)', 'kliniːi', 'n', ['klinik']],
  ['meyvedir', 'is a fruit', 'mejvediɾ', 'n', ['meyve']],
  ['aletle', 'with the tool', 'ɑletle', 'n', ['alet']],
  ['ateşini', 'his fever (acc.)', 'ɑteʃini', 'n', ['ateş']],
  ['öğrencilerle', 'with the students', 'øːɾendʒileɾle', 'n', ['öğrenci']],
  ['kalıntı', 'remnant; ruin', 'kɑlɯntɯ', 'n'],
  ['çeviriyor', 'is translating; is turning', 'tʃeviɾijoɾ', 'v', ['çevirmek']],
  ['kliniğini', 'his clinic (acc.)', 'kliniːini', 'n', ['klinik']],
  ['ailesiyle', 'with his family', 'ɑilesijle', 'n', ['aile']],
  ['müşterisinin', 'of his customer', 'myʃteɾisinin', 'n', ['müşteri']],
  ['bozulan', 'broken; that broke down', 'bozulɑn', 'adj', ['bozulmak']],
  ['kamerayla', 'with the camera', 'kɑmeɾɑjlɑ', 'n', ['kamera']],
  ['çorbacı', 'soup vendor', 'tʃoɾbɑdʒɯ', 'n', ['çorba']],
  ['motosikletini', 'his motorcycle (acc.)', 'motosikletini', 'n', ['motosiklet']],
  ['cemaatle', 'with the congregation', 'dʒemɑːtle', 'n', ['cemaat']],
  ['kıldı', 'he performed (a prayer)', 'kɯldɯ', 'v', ['kılmak']],
  ['kravatını', 'his tie (acc.)', 'kɾɑvɑtɯnɯ', 'n', ['kravat']],
  ['çitini', 'his fence (acc.)', 'tʃitini', 'n', ['çit']],
  ['arkadaşına', 'to his friend', 'ɑɾkɑdɑʃɯnɑ', 'n', ['arkadaş']],
  ['halletti', 'he sorted it out', 'hɑlletti', 'v', ['halletmek']],
  ['ağlarını', 'their nets (acc.)', 'ɑːlɑɾɯnɯ', 'n', ['ağ']],
  ['incecik', 'very thin; slender', 'indʒedʒik', 'adj', ['ince']],
  ['arıza', 'breakdown; malfunction', 'ɑɾɯzɑ', 'n'],
  ['ediliyor', 'is being done', 'edilijoɾ', 'v', ['edilmek', 'etmek']],
  ['düzeltilecek', 'will be fixed', 'dyzeltiledʒek', 'v', ['düzeltilmek', 'düzeltmek']],
  ['varacaksınız', 'you will arrive', 'vɑɾɑdʒɑksɯnɯz', 'v', ['varmak']],
  ['temizlerdi', 'used to clean', 'temizleɾdi', 'v', ['temizlemek']],
  ['boyardı', 'used to paint', 'bojɑɾdɯ', 'v', ['boyamak']],
  ['pompayı', 'the pump (acc.)', 'pompɑjɯ', 'n', ['pompa']],
  ['tezgâhta', 'at the counter', 'tezɟɑːhtɑ', 'n', ['tezgâh']],
  ['kurs', 'course', 'kuɾs', 'n'],
  ['çek', 'cheque; check', 'tʃek', 'n'],
  ['sesle', 'with the voice; aloud', 'sesle', 'n', ['ses']],
  ['eldivenlerini', 'his gloves (acc.)', 'eldivenleɾini', 'n', ['eldiven']],
  ['tabletiyle', 'with his tablet', 'tɑbletijle', 'n', ['tablet']],
  ['alışamadı', 'could not get used to', 'ɑlɯʃɑmɑdɯ', 'v', ['alışmak']],
  ['güvertede', 'on the deck', 'ɟyveɾtede', 'n', ['güverte']],
  ['bekleyecek', 'will wait', 'beklejedʒek', 'v', ['beklemek']],
  ['tezgâhını', 'his counter (acc.)', 'tezɟɑːhɯnɯ', 'n', ['tezgâh']],
  ['eğleniyoruz', 'we are having fun', 'eːlenijoɾuz', 'v', ['eğlenmek']],
  ['check-in', 'check-in', 'tʃekin', 'n'],
  ['zekâlarını', 'their intelligence (acc.)', 'zecɑːlɑɾɯnɯ', 'n', ['zekâ']],
  ['İngiliz', 'English person; English', 'inɟiliz', 'n'],
  ['yıkardım', 'I used to wash', 'jɯkɑɾdɯm', 'v', ['yıkamak']],
  ['uyurdum', 'I used to sleep', 'ujuɾdum', 'v', ['uyumak']],
  ['içtenlikle', 'sincerely; with sincerity', 'itʃtenlikle', 'adv', ['içtenlik']],
  ['maddeyi', 'the substance; the item (acc.)', 'mɑddeji', 'n', ['madde']],
  ['derinliklerinde', 'in its depths', 'deɾinlikleɾinde', 'n', ['derinlik']],
  ['dolaşıyordu', 'was wandering around', 'dolɑʃɯjoɾdu', 'v', ['dolaşmak']],
  ['yolladı', 'he sent', 'jollɑdɯ', 'v', ['yollamak']],
  ['montunu', 'his coat (acc.)', 'montunu', 'n', ['mont']],
  ['Kasaptaki', 'the one at the butcher shop', 'kɑsɑptɑki', 'adj', ['kasap']],
  ['Havalimanındaki', 'the one at the airport', 'hɑvɑlimɑnɯndɑki', 'adj', ['havalimanı']],
  ['Mahkemedeki', 'the one at the courthouse', 'mɑhkemedeki', 'adj', ['mahkeme']],
  ['dosyanın', 'of the file', 'dosjɑnɯn', 'n', ['dosya']],
  ['İstasyondaki', 'the one at the station', 'istɑsjondɑki', 'adj', ['istasyon']],
  ['arızanın', 'of the breakdown', 'ɑɾɯzɑnɯn', 'n', ['arıza']],
  ['tesisatın', 'of the plumbing', 'tesisɑtɯn', 'n', ['tesisat']],
  ['yöntem', 'method', 'jøntem', 'n'],
  ['varacak', 'will arrive', 'vɑɾɑdʒɑk', 'v', ['varmak']],
  ['hızlandırıyor', 'is speeding up', 'hɯzlɑndɯɾɯjoɾ', 'v', ['hızlandırmak']],
  ['eğlenirdi', 'used to have fun', 'eːleniɾdi', 'v', ['eğlenmek']],
  ['izlerdi', 'used to watch', 'izleɾdi', 'v', ['izlemek']],
  ['muayenesine', 'to his examination', 'muɑjenesine', 'n', ['muayene']],
  ['kaybettiği', 'that he lost', 'kɑjbettiːi', 'v', ['kaybetmek']],
  ['kahkahayla', 'with laughter', 'kɑhkɑhɑjlɑ', 'adv', ['kahkaha']],
  ['içerdi', 'used to drink', 'itʃeɾdi', 'v', ['içmek']],
  ['çizerdi', 'used to draw', 'tʃizeɾdi', 'v', ['çizmek']],
  ['yıkardı', 'used to wash', 'jɯkɑɾdɯ', 'v', ['yıkamak']],
  ['türlü', 'various; all sorts of', 'tyɾly', 'adj'],
  ['bitiremez', 'cannot finish', 'bitiɾemez', 'v', ['bitirmek']],
  ['söylerdi', 'used to say', 'søjleɾdi', 'v', ['söylemek']],
  ['sıkılırdı', 'used to get bored', 'sɯkɯlɯɾdɯ', 'v', ['sıkılmak']],
  ['uyurdu', 'used to sleep', 'ujuɾdu', 'v', ['uyumak']],
  ['çizerdik', 'we used to draw', 'tʃizeɾdik', 'v', ['çizmek']],
  ['bırakırdık', 'we used to leave', 'bɯɾɑkɯɾdɯk', 'v', ['bırakmak']],
  ['üretiliyor', 'is being produced', 'yɾetilijoɾ', 'v', ['üretilmek', 'üretmek']],
  ['okusaydım', 'if only I had read', 'okusɑjdɯm', 'v', ['okumak']],
  ['Gözlemevimizde', 'at our observatory', 'ɟøzlemevimizde', 'n', ['gözlemevi']],
  ['teleskopla', 'with the telescope', 'teleskoplɑ', 'n', ['teleskop']],
  ['bitireceğine', 'that he will finish', 'bitiɾedʒeːine', 'v', ['bitirmek']],
  ['dalları', 'its branches; branches (acc.)', 'dɑllɑɾɯ', 'n', ['dal']],
  ['uçuyordu', 'was flying', 'utʃujoɾdu', 'v', ['uçmak']],
  ['baldırını', 'his calf (acc.)', 'bɑldɯɾɯnɯ', 'n', ['baldır']],
  ['Müzakereler', 'negotiations', 'myzɑːkeɾeleɾ', 'n', ['müzakere']],
  ['bekleniyor', 'is expected; is awaited', 'beklenijoɾ', 'v', ['beklenmek', 'beklemek']],
];

const KEY_RE = /^\s{2}['"](.+?)['"]:\s*\{/;

function backfill(filePath, entries, locale) {
  const src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split('\n');
  const collator = new Intl.Collator(locale);

  // Map existing keys -> line index (first dictionary object only: stop at first '};')
  const keyLines = []; // { key, idx }
  const existing = new Set();
  let endIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^\};/.test(lines[i])) { endIdx = i; break; }
    const m = lines[i].match(KEY_RE);
    if (m) { keyLines.push({ key: m[1], idx: i }); existing.add(m[1]); }
  }
  if (endIdx === -1 || keyLines.length === 0) throw new Error('Could not parse ' + filePath);

  const lower = (s) => (locale === 'tr' ? s.toLocaleLowerCase('tr') : s.toLowerCase());

  // Build new entries, skipping keys already present
  const newKeys = new Set(entries.map(([tok]) => lower(tok)));
  const toInsert = [];
  let skipped = 0;
  const seen = new Set();
  for (const [tok, en, ipa, pos, lemmas] of entries) {
    const key = lower(tok);
    if (existing.has(key) || seen.has(key)) { skipped++; continue; }
    seen.add(key);
    let lemmaPart = '';
    if (lemmas) {
      const lemma = lemmas.find((l) => existing.has(l) || (newKeys.has(l) && l !== key));
      if (lemma) lemmaPart = `, lemma: '${lemma}'`;
    }
    const quotedKey = key.includes("'") ? `"${key}"` : `'${key}'`;
    const line = `  ${quotedKey}: { en: '${en.replace(/'/g, "\\'")}', ipa: '${ipa}', pos: '${pos}'${lemmaPart} },`;
    toInsert.push({ key, line });
  }

  // For each new key, find insertion line: before the first existing key that sorts after it
  const inserts = new Map(); // lineIdx -> [lines]
  for (const { key, line } of toInsert) {
    let target = endIdx; // default: just before closing brace
    for (const kl of keyLines) {
      if (collator.compare(kl.key, key) > 0) { target = kl.idx; break; }
    }
    if (!inserts.has(target)) inserts.set(target, []);
    inserts.get(target).push({ key, line });
  }

  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (inserts.has(i)) {
      const group = inserts.get(i).sort((a, b) => collator.compare(a.key, b.key));
      for (const g of group) out.push(g.line);
    }
    out.push(lines[i]);
  }
  fs.writeFileSync(filePath, out.join('\n'));
  return { inserted: toInsert.length, skipped };
}

const ru = backfill(RU_PATH, RU_ENTRIES, 'ru');
const tr = backfill(TR_PATH, TR_ENTRIES, 'tr');
console.log(`RU: inserted ${ru.inserted}, skipped (already present) ${ru.skipped}`);
console.log(`TR: inserted ${tr.inserted}, skipped (already present) ${tr.skipped}`);
