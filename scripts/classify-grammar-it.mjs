/**
 * Grammar Node Classifier for Italian Deck (v1)
 *
 * Assigns each card to one of 26 CEFR grammar nodes (A1->C2) based on
 * sentence structure analysis and grammar tip keywords.
 *
 * Key design: Two text representations
 * - `t` = accent-stripped lowercase -> for \b word boundary regex (JS \b only works with ASCII)
 * - `r` = lowercase WITH accents -> for accent-critical patterns (using Italian-aware boundaries)
 *
 * Italian word boundary helper:
 *   Instead of \b (broken for accented chars like à/è/é/ì/ò/ù), we use:
 *   (?<![a-zàèéìòù]) for word-start
 *   (?![a-zàèéìòù])  for word-end
 */

import { readFileSync, writeFileSync } from 'fs';

const deckPath = new URL('../src/data/italian/deck.json', import.meta.url).pathname;
const deck = JSON.parse(readFileSync(deckPath, 'utf8'));

// Strip accents for regex matching (JS \w doesn't match accented chars)
function norm(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Lowercase but KEEP accents -- for accent-critical patterns
function lower(s) {
  return s.toLowerCase();
}

// Italian-aware word boundaries (lookbehind/lookahead for accented chars)
const E = '(?![a-zàèéìòù])';  // word-end for accented text
const S = '(?<![a-zàèéìòù])'; // word-start for accented text

// --- Classification --------------------------------------------------------

function classify(card) {
  const raw = card.target || '';
  const t = norm(raw);           // accent-stripped for \b regex
  const r = lower(raw);          // lowercase WITH accents for pattern detection
  const g = norm(card.grammar || '');
  const words = raw.split(/\s+/).length;
  const isQuestion = raw.includes('?');

  const scores = new Array(26).fill(0);
  const cheCount = (t.match(/\bche\b/g) || []).length;

  // == Node 17: Periodo ipotetico (Complex conditionals) ==
  // "se" + imperfect subjunctive + conditional
  if (/\bse\s+\w+(assi|asse|assimo|assero|essi|esse|essimo|essero|issi|isse|issimo|issero)\b/.test(t)) scores[16] += 12;
  if (/\bse\b/.test(t) && /\w+(erei|erebbe|eremmo|erebbero)\b/.test(t)) scores[16] += 10;
  if (/\bse\s+(fossi|fosse|fossimo|fossero|avessi|avesse|avessimo|avessero|potessi|potesse|volessi|volesse)\b/.test(t)) scores[16] += 12;
  if (/if clause|conditional.*se|se.*conditional|periodo ipotetico|ipotetico/.test(g)) scores[16] += 14;
  if (/\bse avessi\b/.test(t) && /\bavrei\b/.test(t)) scores[16] += 10;
  if (/\bse fossi\b/.test(t) && /\bsarei\b/.test(t)) scores[16] += 10;

  // == Node 16: Congiuntivo imperfetto (Imperfect subjunctive) ==
  const impfSubjMatch = t.match(/\w+(assi|asse|assimo|assero|essi|esse|essimo|essero|issi|isse|issimo|issero)\b/g);
  const hasImpfSubj = impfSubjMatch && impfSubjMatch.length > 0;
  if (hasImpfSubj && !(/\bse\s/.test(t))) scores[15] += 8;
  if (/\b(fossi|fosse|fossimo|fossero|avessi|avesse|avessimo|avessero|potessi|potesse|volessi|volesse|dovessi|dovesse|sapessi|sapesse|facessi|facesse|stessi|stesse|dessi|desse|dicessi|dicesse|andassi|andasse)\b/.test(t) && !(/\bse\s/.test(t))) scores[15] += 7;
  if (/imperfect subjunctive|congiuntivo imperfetto|subjunctive past|congiuntivo passato/.test(g)) scores[15] += 14;
  if (hasImpfSubj && /\bche\b|\bcome se\b|\bmagari\b/.test(t)) scores[15] += 5;
  if (/\bmagari\b/.test(t) && hasImpfSubj) scores[15] += 6;

  // == Node 11: Congiuntivo presente (Present subjunctive) ==
  const subjTriggerWords = /\b(penso che|credo che|spero che|e necessario che|voglio che|bisogna che|e possibile che|sembra che|dubito che|non credo che|e importante che|prima che|affinche|a meno che|benche|sebbene|e meglio che|preferisco che|suggerisco che|e probabile che|e fondamentale che|e essenziale che|non penso che|puo darsi che|pare che|basta che|conviene che|occorre che|e ora che|e giusto che|mi auguro che|desidero che|temo che|e strano che|e bello che|e brutto che|e assurdo che|e incredibile che|e logico che|e naturale che|e inutile che|e indispensabile che|ho paura che|mi dispiace che|sono contento che|sono felice che)\b/;
  if (subjTriggerWords.test(t) && !hasImpfSubj) scores[10] += 9;
  if (/\bmagari\b/.test(t) && !hasImpfSubj) scores[10] += 8;
  if (/subjunctive|congiuntivo/.test(g) && !/imperfect|imperfetto|passato/.test(g)) scores[10] += 12;
  if (/\bprima che\b|\baffinche\b|\ba meno che\b|\bbenche\b|\bsebbene\b/.test(t) && !hasImpfSubj) scores[10] += 6;
  if (subjTriggerWords.test(t)) scores[10] += 4;
  // "nonostante" + subjunctive context
  if (/\bnonostante\b/.test(t) && words >= 5) scores[10] += 4;

  // == Node 13: Condizionale ==
  // -erei/-eresti/-erebbe/-eremmo/-ereste/-erebbero
  if (/\w+(erei|eresti|erebbe|eremmo|ereste|erebbero)\b/.test(t) && !(/\bse\s/.test(t))) scores[12] += 7;
  // Common conditional verbs (accent-stripped)
  if (/\b(vorrei|potrei|dovrei|sarei|avrei|farei|direi|andrei|verrei|saprei|vedrei|darei|starei|terrei|berrei|vivrei|preferirei|comprerei|mangierei|prenderei|mi piacerebbe|ci piacerebbe|vorrebbe|potrebbe|dovrebbe|sarebbe|avrebbe|farebbe|direbbe|andrebbe)\b/.test(t)) scores[12] += 8;
  if (/conditional|condizionale/.test(g) && !/if clause|periodo ipotetico|ipotetico/.test(g)) scores[12] += 12;
  if (/\bmi piacerebbe\b/.test(t)) scores[12] += 6;
  if (/\bvorrei\b/.test(t)) scores[12] += 5;

  // == Node 14: Futuro e passato (Future & perfect tenses) ==
  // Future: accent-stripped endings
  if (/\b(saro|sarai|sara|saremo|sarete|saranno|avro|avrai|avra|avremo|avrete|avranno|faro|farai|fara|faremo|farete|faranno|andro|andrai|andra|andremo|andrete|andranno|verro|verrai|verra|verremo|verrete|verranno|potro|potrai|potra|potremo|potrete|potranno|dovro|dovrai|dovra|dovremo|dovrete|dovranno|vedro|vedrai|vedra|vedremo|vedrete|vedranno|sapro|saprai|sapra|sapremo|saprete|sapranno|vorro|vorrai|vorra|vorremo|vorrete|vorranno|terro|terrai|terra|terremo|terrete|terranno|berro|berrai|berra|berremo|berrete|berranno|daro|darai|dara|daremo|darete|daranno|staro|starai|stara|staremo|starete|staranno)\b/.test(t)) scores[13] += 8;
  // Regular future: accent-aware detection
  if (new RegExp(`[a-zàèéìòù]+(erò|erai|erà|eremo|erete|eranno)${E}`).test(r)) scores[13] += 7;
  // Perfect tenses: avere + past participle
  if (/\b(ho|hai|ha|abbiamo|avete|hanno)\s+\w+(ato|uto|ito|to|so|sto|tto)\b/.test(t)) scores[13] += 5;
  // Pluperfect: avevo/ero + participle
  if (/\b(avevo|avevi|aveva|avevamo|avevate|avevano)\s+\w+(ato|uto|ito|to|so|sto|tto)\b/.test(t)) scores[13] += 9;
  if (/\b(ero|eri|era|eravamo|eravate|erano)\s+\w+(ato|uto|ito|to|so|sto|tto)\b/.test(t)) scores[13] += 9;
  if (/future|futuro|perfect|perfetto|trapassato/.test(g)) scores[13] += 12;

  // == Node 6: Passato prossimo ==
  // ho/hai/ha/abbiamo/avete/hanno + past participle (-ato/-uto/-ito)
  if (/\b(ho|hai|ha|abbiamo|avete|hanno)\s+\w+(ato|uto|ito)\b/.test(t)) scores[5] += 9;
  // essere auxiliary: sono/sei/e/siamo/siete/sono + past participle
  if (/\b(sono|sei|siamo|siete)\s+\w+(ato|ata|ati|ate|uto|uta|uti|ute|ito|ita|iti|ite)\b/.test(t)) scores[5] += 8;
  // Accent-aware: e + participle (e with accent)
  if (new RegExp(`${S}è\\s+[a-zàèéìòù]+(ato|ata|uto|uta|ito|ita)${E}`).test(r)) scores[5] += 8;
  // Irregular past participles with avere
  if (/\b(ho|hai|ha|abbiamo|avete|hanno)\s+(fatto|detto|scritto|letto|visto|preso|messo|chiuso|aperto|rotto|corso|morso|scelto|spento|acceso|speso|perso|reso|sceso|offerto|sofferto|coperto|scoperto|risposto|chiesto|rimasto|vissuto|successo|mosso|deciso|ucciso|diviso|incluso|escluso|concluso|prodotto|ridotto|tradotto|condotto|distrutto|corretto|protetto|dipinto|distinto|convinto|vinto|aggiunto|raggiunto|pianto|risolto|raccolto|tolto|volto|sepolto|sciolto|assunto|interrotto)\b/.test(t)) scores[5] += 9;
  // Irregular past participles with essere
  if (/\b(sono|sei|siamo|siete)\s+(andato|andata|andati|andate|venuto|venuta|venuti|venute|stato|stata|stati|state|nato|nata|nati|nate|morto|morta|morti|morte|partito|partita|partiti|partite|uscito|uscita|usciti|uscite|entrato|entrata|entrati|entrate|tornato|tornata|tornati|tornate|rimasto|rimasta|rimasti|rimaste|salito|salita|saliti|salite|sceso|scesa|scesi|scese|caduto|caduta|caduti|cadute|arrivato|arrivata|arrivati|arrivate|cresciuto|cresciuta|cresciuti|cresciute|diventato|diventata|diventati|diventate|successo|successa)\b/.test(t)) scores[5] += 9;
  // Time markers
  if (/\b(ieri|l'anno scorso|la settimana scorsa|stamattina|poco fa|un'ora fa|due giorni fa|il mese scorso|l'altra sera|ieri sera|ieri mattina|stasera|prima|prima di|tempo fa)\b/.test(t)) scores[5] += 7;
  if (/passato prossimo|past tense|perfect/.test(g) && !/trapassato|pluperfect/.test(g)) scores[5] += 12;

  // == Node 7: Imperfetto ==
  if (/\b(sempre|ogni giorno|tutti i giorni|ogni volta|a volte|spesso|di solito|da piccolo|da bambino|quando ero|mentre|normalmente|generalmente|abitualmente|in quell'epoca|a quei tempi|una volta|allora)\b/.test(t)) scores[6] += 7;
  // Known imperfect forms
  if (/\b(ero|eri|era|eravamo|eravate|erano|avevo|avevi|aveva|avevamo|avevate|avevano|facevo|facevi|faceva|facevamo|facevate|facevano|dicevo|dicevi|diceva|dicevamo|dicevate|dicevano|stavo|stavi|stava|stavamo|stavate|stavano|andavo|andavi|andava|andavamo|andavate|andavano|potevo|potevi|poteva|potevamo|potevate|potevano|volevo|volevi|voleva|volevamo|volevate|volevano|dovevo|dovevi|doveva|dovevamo|dovevate|dovevano|sapevo|sapevi|sapeva|sapevamo|sapevate|sapevano|venivo|venivi|veniva|venivamo|venivate|venivano)\b/.test(t)) scores[6] += 6;
  // -avo/-avi/-ava/-avamo/-avate/-avano (imperfect -are)
  if (/\w{3,}(avo|avi|ava|avamo|avate|avano)\b/.test(t)) scores[6] += 6;
  // -evo/-evi/-eva/-evamo/-evate/-evano (imperfect -ere)
  if (/\w{3,}(evo|evi|eva|evamo|evate|evano)\b/.test(t)) scores[6] += 6;
  // -ivo/-ivi/-iva/-ivamo/-ivate/-ivano (imperfect -ire)
  if (/\w{3,}(ivo|ivi|iva|ivamo|ivate|ivano)\b/.test(t)) scores[6] += 6;
  if (/imperfect|imperfetto/.test(g) && !/subjunctive|congiuntivo/.test(g)) scores[6] += 12;

  // == Node 8: Verbi riflessivi ==
  // mi/ti/si/ci/vi + common reflexive verbs
  if (/\b(mi|ti|si|ci|vi)\s+(sveglio|svegli|sveglia|svegliamo|svegliate|svegliano|alzo|alzi|alza|alziamo|alzate|alzano|lavo|lavi|lava|laviamo|lavate|lavano|vesto|vesti|veste|vestiamo|vestite|vestono|siedo|siedi|siede|sediamo|sedete|siedono|sento|senti|sente|sentiamo|sentite|sentono|chiamo|chiami|chiama|chiamiamo|chiamate|chiamano|preparo|prepari|prepara|prepariamo|preparate|preparano|addormento|addormenti|addormenta|addormentiamo|addormentate|addormentano|diverto|diverti|diverte|divertiamo|divertite|divertono|annoio|annoi|annoia|annoiamo|annoiate|annoiano|preoccupo|preoccupi|preoccupa|preoccupiamo|preoccupate|preoccupano|rilasso|rilassi|rilassa|rilassiamo|rilassate|rilassano|trucco|trucchi|trucca|trucchiamo|truccate|truccano|pettino|pettini|pettina|pettiniamo|pettinate|pettinano|arrabbio|arrabbi|arrabbia|arrabbiamo|arrabbiate|arrabbiano|vergogno|vergogni|vergogna|vergogniamo|vergognate|vergognano|ricordo|ricordi|ricorda|ricordiamo|ricordate|ricordano|lamento|lamenti|lamenta|lamentiamo|lamentate|lamentano|metto|metti|mette|mettiamo|mettete|mettono|trovo|trovi|trova|troviamo|trovate|trovano|trasferisco|trasferisci|trasferisce|trasferiamo|trasferite|trasferiscono|iscrivo|iscrivi|iscrive|iscriviamo|iscrivete|iscrivono|fermo|fermi|ferma|fermiamo|fermate|fermano|sposto|sposti|sposta|spostiamo|spostate|spostano)\b/.test(t)) scores[7] += 9;
  // -arsi/-ersi/-irsi infinitives
  if (/\w+(arsi|ersi|irsi)\b/.test(t)) scores[7] += 6;
  if (/reflexive|riflessivo|riflessivi|pronominal|pronominale/.test(g)) scores[7] += 12;
  // mi/ti/si/ci/vi + any verb-like pattern (broader catch)
  if (/\b(mi|ti|si|ci|vi)\s+\w{3,}(o|i|a|iamo|ono|ano)\b/.test(t)) scores[7] += 3;

  // == Node 12: Imperativo ==
  // Common imperative forms (tu)
  if (/\b(parla|mangia|prendi|vieni|vai|fai|dimmi|fammi|dammi|tieni|guarda|ascolta|aspetta|apri|chiudi|scrivi|leggi|corri|sali|scendi|entra|esci|fermati|siediti|alzati|svegliati|sbrigati|calmati|mettiti|vestiti|lavati|togliti|divertiti|ricordati|avvicinati)\b/.test(t)) scores[11] += 8;
  // Negative commands: non + infinitive (for tu)
  if (/\bnon\s+(fare|dire|andare|mangiare|parlare|prendere|venire|uscire|preoccuparti|dimenticare|toccare|gridare|correre|aprire|chiudere|muoverti|fermarti|arrabbiarti|lamentarti)\b/.test(t)) scores[11] += 8;
  // Formal Lei imperatives
  if (/\b(parli|prenda|venga|faccia|dica|vada|tenga|stia|dia|sappia|scusi|mi dica|mi scusi|si accomodi|si sieda|prego)\b/.test(t)) scores[11] += 7;
  if (/command|imperative|imperativo/.test(g)) scores[11] += 12;
  // Sentence starts with verb in imperative form
  const imperativeStart = /^(non\s+)?(parla|mangia|prendi|vieni|vai|fai|guarda|ascolta|aspetta|apri|chiudi|scrivi|leggi|corri|sali|scendi|entra|esci|metti|porta|prova|cerca|compra|chiama|passa|torna|gira|segui|scegli|usa|immagina|pensa|prepara|pulisci|lava|cucina|taglia|mescola|aggiungi|servi|accendi|spegni|controlla|verifica|conferma|invia|rispondi|chiedi|aiuta|studia|lavora|gioca|canta|balla|cammina|dormi|manda|bevi|finisci|inizia|comincia|smetti|continua|ricorda|dimentica|ripeti|prendi)(\s|$|,|\.)/;
  if (imperativeStart.test(t)) scores[11] += 8;
  // "per favore" / "per piacere" in short sentence
  if (/\b(per favore|per piacere|per cortesia)\b/.test(t) && words <= 12) scores[11] += 3;

  // == Node 2: Essere vs stare ==
  // Both essere and stare forms in same sentence
  if (/\b(sono|sei|siamo|siete)\b/.test(t) && /\b(sto|stai|sta|stiamo|state|stanno)\b/.test(t)) scores[1] += 14;
  if (new RegExp(`${S}è${E}`).test(r) && /\b(sto|stai|sta|stiamo|state|stanno)\b/.test(t)) scores[1] += 14;
  if (/\bessere\b.*\bstare\b|\bstare\b.*\bessere\b|essere vs|stare vs/.test(g)) scores[1] += 14;
  if (/\b(essere|stare)\b/.test(g) && /\b(identity|origin|location|state|progressive|condition|temporary|permanent)\b/.test(g)) scores[1] += 10;
  // Essere for identity/description in short sentences
  if (words <= 7 && /\b(sono|sei|siamo|siete)\b/.test(t) && /\b(un|una|il|la|di|molto|abbastanza)\b/.test(t)) scores[1] += 4;
  // Stare for states/progressive
  if (words <= 7 && /\b(sto|stai|sta|stiamo|state|stanno)\b/.test(t) && /\b(bene|male|attento|zitto|fermo|tranquillo|calmo)\b/.test(t)) scores[1] += 5;
  // Stare + gerund (progressive)
  if (/\b(sto|stai|sta|stiamo|state|stanno)\s+\w+(ando|endo)\b/.test(t)) scores[1] += 6;
  // Short sentences with essere/stare as main verb
  if (words <= 6 && /\b(sono|sei|siamo|siete|sto|stai|sta|stiamo|state|stanno)\b/.test(t)) scores[1] += 3;
  // Accent-aware: e (with accent)
  if (words <= 6 && new RegExp(`${S}è${E}`).test(r)) scores[1] += 3;

  // == Node 5: Piacere e simili ==
  if (/\b(mi|ti|gli|le|ci|vi)\s+(piace|piacciono|piaccio|piaci|piacciamo|piacete|interessa|interessano|sembra|sembrano|serve|servono|manca|mancano|basta|bastano|conviene|convengono|capita|capitano|succede|succedono|importa|importano|dispiace|dispiacere)\b/.test(t)) scores[4] += 10;
  // Accent-aware piace/piacciono patterns
  if (new RegExp(`${S}(mi|ti|gli|le|ci|vi)\\s+(piace|piacciono)${E}`).test(r)) scores[4] += 5;
  if (/piacere|sembrare|servire|mancare|bastare|interessare|dispiacere|convenire/.test(g)) scores[4] += 12;

  // == Node 9: Per vs da ==
  if (/\bper\b/.test(t) && /\bda\b/.test(t)) scores[8] += 12;
  if (/\bper\b.*\bda\b|\bda\b.*\bper\b|per vs|da vs/.test(g)) scores[8] += 14;
  if (/\b(per|da)\b/.test(g) && /\b(purpose|duration|origin|agent|since|cause|goal|recipient|reason)\b/.test(g)) scores[8] += 8;
  // "per" with context clues
  if (/\bper\s+(questo|esempio|favore|fortuna|caso|sempre|ora|piacere|conto mio|lo meno|lo piu|quanto riguarda|niente|nulla|colpa)\b/.test(t)) scores[8] += 5;
  if (/\bper\s+(la prima volta|l'ultima volta|la strada|il centro|il parco)\b/.test(t)) scores[8] += 5;
  // "da" with origin/agent/since
  if (/\bda\s+(solo|sola|soli|sole|parte|quando|dove|qui|li|allora|sempre|tempo|piccolo|bambino|molto|poco|tanto|troppo|anni|mesi|giorni|settimane)\b/.test(t)) scores[8] += 5;
  if (/\bda\s+(me|te|lui|lei|noi|voi|loro)\b/.test(t)) scores[8] += 4;

  // == Node 10: Pronomi oggetto ==
  // Double object pronouns -- very strong
  if (/\b(me lo|me la|me li|me le|te lo|te la|te li|te le|glielo|gliela|glieli|gliele|ce lo|ce la|ce li|ce le|ve lo|ve la|ve li|ve le|se lo|se la|se li|se le)\b/.test(t)) scores[9] += 12;
  if (/object pronoun|pronome|direct object|indirect object|complemento oggetto|complemento diretto|complemento indiretto/.test(g)) scores[9] += 12;
  // Single pronoun before verb
  if (/\b(lo|la|li|le|gli|ne|ci)\s+(dico|do|compro|porto|mando|invio|presto|regalo|racconto|spiego|chiedo|prometto|offro|mostro|insegno|presento|consegno|restituisco|tolgo|chiedo|rispondo|diamo|danno|detto|dato|portato|mandato|prestato|regalato|raccontato|spiegato|chiesto|promesso|offerto|mostrato)\b/.test(t)) scores[9] += 8;
  // Pronoun attached to infinitive or gerund
  if (/\w+(arlo|arla|arli|arle|erlo|erla|erli|erle|irlo|irla|irli|irle|andolo|andola|andoli|andole|endolo|endola|endoli|endole)\b/.test(t)) scores[9] += 7;
  // lo/la/li/le/gli/ne before conjugated verb pattern
  if (/\b(lo|la|li|le|gli|ne)\s+\w{3,}(o|i|a|iamo|ono|ano|ete)\b/.test(t) && words >= 4) scores[9] += 4;
  // "ne" partitive pronoun
  if (/\bne\s+(ho|hai|ha|abbiamo|avete|hanno|voglio|vuoi|vuole|prendo|compro|mangio|bevo)\b/.test(t)) scores[9] += 6;

  // == Node 18: Passivo e impersonale ==
  // "si" impersonale
  if (/\bsi\s+(dice|puo|deve|mangia|beve|parla|vede|vive|lavora|studia|gioca|dorme|va|viene|fa|sa|usa|compra|vende|vendono|affitta|affittano|cerca|cercano|trova|trovano|offre|offrono|accetta|accettano|permette|permettono|consiglia|consigliano|produce|producono|pratica|praticano|celebra|celebrano|crede|credono|conosce|conoscono|considera|considerano|racconta|raccontano)\b/.test(t)) scores[17] += 9;
  // Passive with essere + past participle
  if (/\b(e stato|e stata|e stati|e state|sono stato|sono stata|sono stati|sono state|fu|furono)\s+\w+(ato|ata|ati|ate|uto|uta|uti|ute|ito|ita|iti|ite|tto|tta|tti|tte|so|sa|si|se|sto|sta|sti|ste)\b/.test(t)) scores[17] += 9;
  // Accent-aware: e stato/stata
  if (new RegExp(`${S}è\\s+(stato|stata|stati|state)\\s+[a-zàèéìòù]+(ato|ata|uto|uta|ito|ita|tto|tta|so|sa)${E}`).test(r)) scores[17] += 9;
  // "venire" + past participle (passive)
  if (/\b(viene|vengono|veniva|venivano)\s+\w+(ato|ata|ati|ate|uto|uta|uti|ute|ito|ita|iti|ite|tto|tta|tti|tte)\b/.test(t)) scores[17] += 9;
  if (/passive|passivo|passiva|impersonal|impersonale|si\s+(passive|impersonale)/.test(g)) scores[17] += 12;
  // "si" + 3rd person verb at start (impersonal)
  if (/^si\s+\w{3,}(a|e|ano|ono)\b/.test(t) && !/^si\s+(mi|ti|ci)\b/.test(t)) scores[17] += 5;

  // == Node 15: Proposizioni relative ==
  if (/\b(il quale|la quale|i quali|le quali|in cui|per cui|di cui|a cui|con cui|su cui|tra cui|fra cui|del quale|della quale|dei quali|delle quali|al quale|alla quale|ai quali|alle quali|dal quale|dalla quale|dai quali|dalle quali|nel quale|nella quale|nei quali|nelle quali)\b/.test(t)) scores[14] += 9;
  if (/relative clause|relativo|relative pronoun|proposizione relativa|frase relativa/.test(g)) scores[14] += 12;
  // Descriptive "che" after nouns
  if (/\b(persona|cosa|luogo|posto|momento|giorno|volta|modo|maniera|ragione|motivo|libro|film|canzone|citta|paese|casa|lavoro|problema|idea|progetto)\s+che\b/.test(t)) scores[14] += 5;
  if (/\bdove\b/.test(t) && !isQuestion && words >= 5) scores[14] += 4;
  // "quello che" / "cio che" / "tutto quello che"
  if (/\b(quello che|cio che|tutto quello che|tutto cio che|chi)\b/.test(t) && words >= 5) scores[14] += 5;

  // == Node 19: Connettivi avanzati ==
  if (/\b(tuttavia|pertanto|nonostante|sebbene|malgrado|in quanto|dal momento che|a condizione che|purche|per quanto|di conseguenza|in effetti|ciononostante|nondimeno|benche|eppure|anziche|piuttosto che|comunque|peraltro|d'altronde|d'altra parte|in primo luogo|in conclusione|in sintesi|per di piu|oltre a cio|a proposito|del resto|viceversa|al contrario|per contro|dato che|visto che|giacche|siccome|a meno che non|a patto che|nell'eventualita che|qualora)\b/.test(t)) scores[18] += 10;
  if (/connector|connettivo|linking|discourse|marcatore/.test(g)) scores[18] += 12;

  // == Node 3: Domande comuni ==
  if (isQuestion) scores[2] += 5;
  if (isQuestion && /\b(come|quando|dove|che|chi|quale|quali|quanto|quanti|quante|perche|a che)\b/.test(t)) scores[2] += 5;
  if (/question|interrogative|domanda|interrogativo/.test(g)) scores[2] += 10;
  if (isQuestion && words <= 8) scores[2] += 3;

  // == Node 4: Articoli e genere ==
  if (/article|articolo|gender|genere|masculine|feminine|maschile|femminile|il\/la|un\/una|concordanza/.test(g)) scores[3] += 12;
  if (/\b(questo|questa|questi|queste|quello|quella|quelli|quelle|quel|quell')\s+\w+\b/.test(t)) scores[3] += 3;
  if (words <= 6 && /\b(il|lo|la|l'|i|gli|le|un|uno|una|un')\s+\w+\b/.test(t)) scores[3] += 3;
  // Partitive articles
  if (/\b(del|dello|della|dell'|dei|degli|delle)\s+\w+\b/.test(t)) scores[3] += 3;

  // == Node 20: Misto avanzato (B2 capstone) ==
  const b2Signals = [
    hasImpfSubj,
    /\bse\s+\w+(assi|asse|assimo|assero|essi|esse|essimo|essero|issi|isse|issimo|issero)\b/.test(t),
    /\bsi\s+\w+(a|e|ano|ono)\b/.test(t) && words >= 8,
    /\b(tuttavia|nonostante|ciononostante|malgrado|non solo.*ma anche)\b/.test(t),
    /\b(e stato|e stata|viene|vengono)\s+\w+(ato|ata|uto|uta|ito|ita)\b/.test(t),
    cheCount >= 2 && words >= 12,
    /\b(sebbene|per quanto|benche|malgrado)\b/.test(t),
    /\b(avrebbe|avrebbero|sarebbe|sarebbero)\b/.test(t),
    /\b(indispensabile|fondamentale|imprescindibile)\s+che\b/.test(t),
    /\b(non solo|malgrado|a meno che|dal momento che|visto che)\b/.test(t),
    words >= 16 && /\b(che|cui|dove|quale)\b/.test(t) && /\b(fu|era|sarebbe|avrebbe|abbia)\b/.test(t),
  ].filter(Boolean).length;
  if (b2Signals >= 2) scores[19] += 10;
  if (b2Signals >= 3) scores[19] += 5;
  if (words >= 15 && b2Signals >= 1) scores[19] += 5;
  if (words >= 18 && b2Signals >= 1) scores[19] += 4;

  // == Node 21: Subjunctive nuances (C1) ==
  if (/\bcome se\b/.test(t) && hasImpfSubj) scores[20] += 12;
  if (/\bil fatto che\b/.test(t)) scores[20] += 12;
  if (new RegExp(`${S}sia come sia${E}`).test(r)) scores[20] += 12;
  if (/\bper quanto\b/.test(t) && words >= 6) scores[20] += 10;
  if (/\bnon e che\b/.test(t)) scores[20] += 10;
  if (new RegExp(`${S}non è che${E}`).test(r)) scores[20] += 10;
  if (/\bche io sappia\b|\bche io ricordi\b/.test(t)) scores[20] += 10;
  if (/\bchiunque\b|\bdovunque\b|\bcomunque\b|\bqualunque\b|\bqualsivoglia\b/.test(t)) scores[20] += 10;
  if (/\bfaccia quel che faccia\b|\bvada come vada\b|\bsucceda quel che succeda\b|\bsia quel che sia\b|\bcosti quel che costi\b/.test(t)) scores[20] += 12;
  if (/\bper poco che\b/.test(t)) scores[20] += 10;
  if (/\bsenza che\b/.test(t) && words >= 8) scores[20] += 5;
  if (/\bnonostante che\b|\bmalgrado che\b/.test(t) && hasImpfSubj) scores[20] += 6;
  if (/subjunctive nuance|mood contrast|indicativo vs congiuntivo|congiuntivo.*avanzato/.test(g)) scores[20] += 14;

  // == Node 22: Verb Periphrasis (C1) ==
  // stare per + infinitive (about to)
  if (/\b(sto|stai|sta|stiamo|state|stanno)\s+per\s+\w+(are|ere|ire)\b/.test(t)) scores[21] += 12;
  // stare + gerund (progressive)
  if (/\b(sto|stai|sta|stiamo|state|stanno)\s+\w+(ando|endo)\b/.test(t)) scores[21] += 8;
  // andare + gerund (progressive nuance)
  if (/\b(vado|vai|va|andiamo|andate|vanno|andavo|andavi|andava|andavamo|andavate|andavano)\s+\w+(ando|endo)\b/.test(t)) scores[21] += 10;
  // finire di/per + infinitive
  if (/\b(finisco|finisci|finisce|finiamo|finite|finiscono|finii|fini|finimmo|finirono)\s+(di|per)\s+\w+(are|ere|ire)\b/.test(t)) scores[21] += 10;
  // smettere di + infinitive
  if (/\b(smetto|smetti|smette|smettiamo|smettete|smettono)\s+di\s+\w+(are|ere|ire)\b/.test(t)) scores[21] += 10;
  // mettersi a + infinitive
  if (/\b(mi metto|ti metti|si mette|ci mettiamo|vi mettete|si mettono)\s+a\s+\w+(are|ere|ire)\b/.test(t)) scores[21] += 10;
  // continuare a + infinitive
  if (/\bcontinua(re|o|i|no|te|va|vano)?\s+a\s+\w+(are|ere|ire)\b/.test(t)) scores[21] += 8;
  // tornare a + infinitive
  if (/\btorn(o|i|a|iamo|ate|ano|avo|avi|ava|avamo|avate|avano)\s+a\s+\w+(are|ere|ire)\b/.test(t)) scores[21] += 10;
  // venire + gerund (C1 periphrasis)
  if (/\b(vengo|vieni|viene|veniamo|venite|vengono|venivo|venivi|veniva|venivamo|venivate|venivano)\s+\w+(ando|endo)\b/.test(t)) scores[21] += 10;
  if (/periphrastic|perifrasi|verb phrase|stare per|mettersi a|finire di|smettere di|continuare a|tornare a/.test(g)) scores[21] += 14;

  // == Node 23: Reported Speech / Discorso indiretto (C1) ==
  if (/\b(disse|dissero|racconto|raccontarono|commento|commentarono|spiego|spiegarono|assicuro|assicurarono|affermo|affermarono|confesso|confessarono|riconobbe|riconobbero|menziono|menzionarono|giuro|giurarono|nego|negarono)\s+che\b/.test(t)) scores[22] += 10;
  // Accent-aware reported speech verbs
  if (new RegExp(`(disse|raccontò|commentò|spiegò|assicurò|affermò|confessò|riconobbe|menzionò|rispose|informò|avvertì|suggerì|ricordò|negò|giurò)\\s+che`, 'i').test(r)) scores[22] += 8;
  if (/\b(chiese|chiesero)\s+(se|che|perche|come|quando|dove|quanto)\b/.test(t)) scores[22] += 10;
  if (/\b(mi|gli|le|ci)\s+(chiese|chiesero|disse|dissero|racconto|raccontarono)\s+(di|che|se)\b/.test(t)) scores[22] += 10;
  if (/\b(secondo lui|secondo lei|secondo me|secondo noi|secondo loro|a suo dire|a detta di|a quanto pare|a quanto sembra|stando a)\b/.test(t)) scores[22] += 10;
  if (/\b(mi|gli|le|ci)\s+(avverti|avvertirono|suggeri|suggerirono|raccomando|raccomandarono|informo|informarono|comunico|comunicarono|avviso|avvisarono|ricordo|ricordarono|rimprovero|rimproverarono)\b/.test(t)) scores[22] += 9;
  if (/reported speech|discorso indiretto|indirect speech|tense.*shift|concordanza dei tempi/.test(g)) scores[22] += 14;
  if (/\bil giorno dopo\b|\bquella settimana\b|\bquella volta\b/.test(t)) scores[22] += 5;

  // == Node 24: Register & Style (C2) ==
  if (/\boccorre\s+(sottolineare|ricordare|precisare|evidenziare|aggiungere|menzionare)\b/.test(t)) scores[23] += 12;
  if (/\bdi aver\s+\w+(ato|uto|ito|to|so|sto|tto)\b/.test(t)) scores[23] += 10;
  if (/\bdi non\s+(aver|essere|sapere)\b/.test(t)) scores[23] += 10;
  if (/\bin virtu di\b|\bin nome di\b|\ba norma di\b|\bin conformita\b|\bgiova ricordare\b|\bin seguito a\b|\bin merito a\b|\bper quanto concerne\b|\bper quel che riguarda\b|\ba titolo di\b|\ba rigor di\b/.test(t)) scores[23] += 14;
  if (/\b(ebbe|ebbero)\s+\w+(ato|uto|ito|to|so|sto|tto)\b/.test(t)) scores[23] += 12;
  if (/\bcio detto\b|\bcio premesso\b|\bfatto sta\b|\bsta di fatto\b/.test(t)) scores[23] += 8;
  // Future of probability
  if (new RegExp(`(sarà|avrà|starà|saranno|avranno)\\s+(circa|forse|probabilmente|all'incirca|suppergiù|più o meno)`, 'i').test(r)) scores[23] += 10;
  if (new RegExp(`(sarebbe|avrebbe|starebbe)\\s+(circa|forse|probabilmente)`, 'i').test(r)) scores[23] += 10;
  if (/\ba mio avviso\b|\ba mio parere\b|\balla luce di\b|\bin definitiva\b|\bconviene\s+(ricordare|sottolineare|precisare)\b/.test(t)) scores[23] += 8;
  if (/register|formal.*style|literary|passato remoto.*letterario|stile formale|academic.*discourse|registro/.test(g)) scores[23] += 14;

  // == Node 25: Idiomatic Fluency (C2) ==
  if (/idiom|idiomatic|modo di dire|expression|espressione|slang|colloquial|proverbio|detto|colloquiale/.test(g)) scores[24] += 14;
  if (/\b(costare un occhio|piovere a catinelle|fare una figuraccia|dare una mano|un gioco da ragazzi|restare di stucco|restare a bocca aperta|avere il vento in poppa|gatta ci cova|tutta un'altra storia|prendere in giro|andare al sodo|gettare la spugna|mordersi la lingua|passare il segno|dare un colpo al cerchio|perdere la testa|avere.*asso nella manica|tra l'incudine e il martello|acqua in bocca|non avere peli sulla lingua)\b/.test(t)) scores[24] += 14;
  // Proverb patterns
  if (/\b(chi dorme non piglia pesci|tra il dire e il fare|l'abito non fa il monaco|chi la fa l'aspetti|non e tutto oro|chi trova un amico|meglio tardi che mai|ogni medaglia ha due facce|il mattino ha l'oro in bocca|sbagliando si impara|l'appetito vien mangiando|l'unione fa la forza|chi tace acconsente|a caval donato|occhio non vede)\b/.test(t)) scores[24] += 14;
  // Colloquial expressions
  if (/\b(mi sono divertito un sacco|non ne posso piu|ne ho le scatole piene|non ci siamo|ma figurati|macche|figuriamoci|che barba|che noia|che palle|una pacchia|che figata|roba da matti|in bocca al lupo|crepi il lupo)\b/.test(t)) scores[24] += 12;

  // == Node 26: Complex Syntax (C2) ==
  // Absolute participial clauses at start
  if (/^(terminata|terminato|risolti|risolto|aperta|aperto|viste|visto|fatte|fatto|compiuti|compiuto|esaurite|esaurito|analizzata|analizzato|conclusa|concluso|seduti|seduto|arrivati|arrivato|detto|premesso)\s/i.test(t)) scores[25] += 14;
  // Nominalized infinitives
  if (/\bil\s+(vivere|sapere|non sapere|lavorare|ascoltare|mangiare|dormire|viaggiare|leggere|scrivere|pensare|essere|avere)\b/.test(t) && words >= 8) scores[25] += 10;
  // Cleft sentences
  if (/\be\s+(proprio|solo|mediante|per questo)\s+(che|come|quando)\b/.test(t)) scores[25] += 12;
  if (/\bnon e altro che\b/.test(t)) scores[25] += 12;
  // Multiple subordination (3+ "che")
  if (cheCount >= 3 && words >= 15) scores[25] += 8;
  // Complex comparative correlations
  if (/\bpiu\b.*\b(piu|meglio|maggiore|minore|peggio)\b/.test(t) && words >= 10) scores[25] += 6;
  if (/\b(quanto piu|quanto prima|tanto piu|tanto meno|tanto meglio|tanto peggio)\b/.test(t)) scores[25] += 8;
  // Long formal sentences
  if (words >= 20 && /\b(bensi|non solo|la verita e|il paradosso|cio che realmente)\b/.test(t)) scores[25] += 6;
  if (/participial|nominalizzazione|complex syntax|subordination|subordinazione|cleft|frase scissa/.test(g)) scores[25] += 14;

  // -- A1/A2 dampening: if any B1+ node scores >= 5, reduce A1/A2 --
  const maxB1Plus = Math.max(...scores.slice(10)); // nodes 11-26 (indices 10-25)
  if (maxB1Plus >= 5) {
    for (let i = 0; i < 10; i++) scores[i] = Math.round(scores[i] * 0.6);
  }

  // == Node 1: Presente indicativo ==
  if (/present tense|presente|indicative|indicativo/.test(g) && !/subjunctive|congiuntivo/.test(g)) scores[0] += 10;
  // Only boost present if no other node has meaningful score AND sentence is short
  const maxOther = Math.max(...scores.slice(1));
  if (maxOther < 5 && words <= 8) {
    if (/\b(sono|sei|siamo|siete|ho|hai|ha|abbiamo|hanno|faccio|fai|fa|facciamo|fanno|vado|vai|va|andiamo|vanno|sto|stai|sta|stiamo|stanno|posso|puoi|puo|possiamo|possono|devo|devi|deve|dobbiamo|devono|voglio|vuoi|vuole|vogliamo|vogliono|vengo|vieni|viene|veniamo|vengono|dico|dici|dice|diciamo|dicono|so|sai|sa|sappiamo|sanno|parlo|parli|parla|parliamo|parlano|mangio|mangi|mangia|mangiamo|mangiano|scrivo|scrivi|scrive|scriviamo|scrivono|leggo|leggi|legge|leggiamo|leggono|lavoro|lavori|lavora|lavoriamo|lavorano|studio|studi|studia|studiamo|studiano|gioco|giochi|gioca|giochiamo|giocano|dormo|dormi|dorme|dormiamo|dormono|vivo|vivi|vive|viviamo|vivono|prendo|prendi|prende|prendiamo|prendono|capisco|capisci|capisce|capiamo|capiscono|conosco|conosci|conosce|conosciamo|conoscono|metto|metti|mette|mettiamo|mettono|apro|apri|apre|apriamo|aprono|chiudo|chiudi|chiude|chiudiamo|chiudono)\b/.test(t)) {
      scores[0] += 4;
    }
  }
  // Accent-aware: e (with accent) in short present-tense sentences
  if (maxOther < 5 && words <= 6 && new RegExp(`${S}è${E}`).test(r)) scores[0] += 3;

  // -- Find winner --
  const maxScore = Math.max(...scores);

  if (maxScore === 0) {
    return assignByFeatures(raw, r, t, words, isQuestion);
  }

  return scores.indexOf(maxScore) + 1;
}

/**
 * Smarter fallback when no grammar pattern scored.
 * Spreads cards across nodes based on sentence features
 * instead of dumping everything to node-01.
 *
 * Key principle: node-01 should ONLY get very basic 1-3 word phrases.
 * Everything else goes to a more specific node based on content clues.
 */
function assignByFeatures(raw, r, t, words, isQuestion) {
  // Questions -> node 3
  if (isQuestion) return 3;

  // Very short (1-2 words) -> node 1 (these are genuinely beginner)
  if (words <= 2) return 1;

  // Check for accent patterns we might have missed
  // Accent-aware: e (with grave accent) as copula
  if (new RegExp(`[a-zàèéìòù]{2,}ò(?![a-zàèéìòù])`).test(r)) return 6;

  // Essere/stare sentences (short) -> node 2
  if (/\b(sono|sei|siamo|siete|sto|stai|sta|stiamo|stanno)\b/.test(t) && words <= 6) return 2;
  if (new RegExp(`(?<![a-zàèéìòù])è(?![a-zàèéìòù])`).test(r) && words <= 6) return 2;

  // Sentences with per/da -> node 9
  if (/\b(per|da)\b/.test(t) && words >= 5) return 9;

  // Reflexive pronouns -> node 8
  if (/\b(mi|ti|si|ci|vi)\s+\w{3,}(o|i|a|iamo|ono|ano)\b/.test(t) && words >= 4) return 8;

  // Sentences with "che" connecting clauses (relative) -> node 15
  if (/\w+\s+che\s+\w+/.test(t) && words >= 8 && !isQuestion) return 15;

  // Short with articles/demonstratives -> node 4
  if (words <= 5 && /\b(il|lo|la|i|gli|le|un|uno|una|questo|questa|quello|quella)\b/.test(t)) return 4;

  // Short declarative (3-4 words) -> node 2 (basic description)
  if (words <= 4) return 2;

  // 5-6 words -> node 4 (articles & gender / short descriptions)
  if (words <= 6) return 4;

  // 7-8 words -> spread: object pronouns if lo/la/le present, else node-10
  if (words <= 8) {
    if (/\b(lo|la|li|le|gli|ne)\s+\w{3,}/.test(t)) return 10;
    return 10;
  }

  // 9-11 words -> node 14 (future & perfect -- medium complexity)
  if (words <= 11) return 14;

  // 12-15 words -> node 15 (relative clauses -- complex sentences)
  if (words <= 15) return 15;

  // 16-18 words -> node 18 (passive & impersonal)
  if (words <= 18) return 18;

  // 19-22 words -> node 19 (advanced connectors)
  if (words <= 22) return 19;

  // 23+ words -> C1/C2
  if (words <= 25) return 22; // C1 verb phrases
  return 24; // C2 register & style
}

// --- Run -------------------------------------------------------------------

console.log('Classifying', deck.length, 'cards...\n');

const nodeCounts = new Array(26).fill(0);

for (const card of deck) {
  const node = classify(card);
  card.grammarNode = `node-${String(node).padStart(2, '0')}`;
  nodeCounts[node - 1]++;
}

// --- Post-classification: Capacity-based overflow redistribution -----------
// Some nodes have strong grammar signals that correctly classify many cards.
// But when a node is too large relative to others, it creates a bad user
// experience (too many cards before progression).
//
// Solution: cap each node and redistribute overflow to the same-tier or
// adjacent-tier node with the lowest count.

// Soft caps: target max per node (total unique cards, not per goal)
const NODE_CAPS = [
  /* 01 */ 470, /* 02 */ 470, /* 03 */ 470, /* 04 */ 470, /* 05 */ 300,
  /* 06 */ 500, /* 07 */ 500, /* 08 */ 300, /* 09 */ 250, /* 10 */ 500,
  /* 11 */ 430, /* 12 */ 300, /* 13 */ 300, /* 14 */ 500, /* 15 */ 400,
  /* 16 */ 300, /* 17 */ 250, /* 18 */ 250, /* 19 */ 250, /* 20 */ 200,
  /* 21 */ 100, /* 22 */ 150, /* 23 */ 100, /* 24 */ 100, /* 25 */ 100, /* 26 */ 100,
];

// Neighbours: same tier first, then adjacent tiers (broader redistribution)
const NODE_NEIGHBOURS = [
  /* 01 */ [1,2,3,4],            /* 02 */ [0,2,3,4],            /* 03 */ [0,1,3,4],            /* 04 */ [0,2,3,4],   /* 05 */ [0,3,7,8],
  /* 06 */ [6,7,8,9,10,11,12],   /* 07 */ [5,8,9,6,10,11],      /* 08 */ [5,6,7,9],            /* 09 */ [5,7,8,6],   /* 10 */ [6,7,8,9,11,12,13],
  /* 11 */ [12,13,14,10,15],     /* 12 */ [10,11,13,14],        /* 13 */ [10,11,12,14],        /* 14 */ [10,12,13,11,15], /* 15 */ [10,13,14,11],
  /* 16 */ [17,18,19,14],        /* 17 */ [15,16,18,19],        /* 18 */ [15,16,17,19],        /* 19 */ [15,17,18,16], /* 20 */ [15,17,18,19],
  /* 21 */ [22,20,19,23],        /* 22 */ [20,21,23,19],        /* 23 */ [20,21,22,19],
  /* 24 */ [25,22,23,21],        /* 25 */ [23,24,22,21],        /* 26 */ [23,24,25,22],
];

// Run multiple passes so overflow cascades through tiers
let totalRedistributed = 0;
const MAX_PASSES = 5;

for (let pass = 0; pass < MAX_PASSES; pass++) {
  let passRedistributed = 0;

  for (let nodeIdx = 0; nodeIdx < 26; nodeIdx++) {
    const cap = NODE_CAPS[nodeIdx];
    if (nodeCounts[nodeIdx] <= cap) continue;

    const nodeId = `node-${String(nodeIdx + 1).padStart(2, '0')}`;
    const nodeCards = deck.filter(c => c.grammarNode === nodeId);
    const overflow = nodeCounts[nodeIdx] - cap;

    // Sort by "weakest match" -- cards without grammar tips, longest first
    const candidates = nodeCards
      .map(card => ({
        card,
        hasGrammar: !!card.grammar,
        words: card.target.split(/\s+/).length,
      }))
      .sort((a, b) => {
        if (a.hasGrammar !== b.hasGrammar) return a.hasGrammar ? 1 : -1;
        return b.words - a.words;
      });

    let moved = 0;
    for (const { card } of candidates) {
      if (moved >= overflow) break;

      // Find best neighbour (lowest count, under cap)
      const neighbours = NODE_NEIGHBOURS[nodeIdx] || [];
      let bestNeighbour = -1;
      let bestCount = Infinity;
      for (const n of neighbours) {
        if (nodeCounts[n] < NODE_CAPS[n] && nodeCounts[n] < bestCount) {
          bestCount = nodeCounts[n];
          bestNeighbour = n;
        }
      }

      if (bestNeighbour >= 0) {
        const newNodeId = `node-${String(bestNeighbour + 1).padStart(2, '0')}`;
        card.grammarNode = newNodeId;
        nodeCounts[nodeIdx]--;
        nodeCounts[bestNeighbour]++;
        moved++;
      }
    }

    if (moved > 0) {
      passRedistributed += moved;
      if (pass === 0) {
        console.log(`  Redistributed ${moved} cards from ${nodeId} (was ${nodeCounts[nodeIdx] + moved}, now ${nodeCounts[nodeIdx]})`);
      }
    }
  }

  totalRedistributed += passRedistributed;
  if (passRedistributed === 0) break; // no more moves possible
  if (pass > 0) console.log(`  Pass ${pass + 1}: moved ${passRedistributed} more cards`);
}

if (totalRedistributed > 0) {
  console.log(`Total redistributed: ${totalRedistributed}\n`);
}

const nodeNames = [
  'Presente indicativo', 'Essere vs stare', 'Domande comuni', 'Articoli e genere',
  'Piacere e simili', 'Passato prossimo', 'Imperfetto', 'Verbi riflessivi',
  'Per vs da', 'Pronomi oggetto', 'Congiuntivo presente', 'Imperativo',
  'Condizionale', 'Futuro e passato', 'Proposizioni relative', 'Congiuntivo imperfetto',
  'Periodo ipotetico', 'Passivo e impersonale', 'Connettivi avanzati', 'Misto avanzato',
  'Sfumature congiuntivo', 'Perifrasi verbali', 'Discorso indiretto',
  'Registro e stile', 'Fluenza idiomatica', 'Sintassi complessa'
];

const tierLabels = ['A1','A1','A1','A1','A1','A2','A2','A2','A2','A2','B1','B1','B1','B1','B1','B2','B2','B2','B2','B2','C1','C1','C1','C2','C2','C2'];

console.log('Node distribution (all cards):');
for (let i = 0; i < 26; i++) {
  const pct = ((nodeCounts[i] / deck.length) * 100).toFixed(1);
  console.log(`  node-${String(i+1).padStart(2,'0')} ${tierLabels[i]} ${nodeNames[i].padEnd(24)} ${String(nodeCounts[i]).padStart(5)}  (${pct}%)`);
}
console.log(`  ${'TOTAL'.padEnd(34)} ${deck.length}`);

// Per-goal
console.log('\nPer-goal node counts:');
for (const goal of ['general', 'travel', 'work', 'family']) {
  const gc = deck.filter(c => (c.tags || []).includes(goal));
  const gn = new Array(26).fill(0);
  gc.forEach(c => gn[parseInt(c.grammarNode.replace('node-', '')) - 1]++);
  const line = gn.map(n => String(n).padStart(5)).join('');
  console.log(`  ${goal.padEnd(8)} (${String(gc.length).padStart(4)}): ${line}`);
}

// Samples -- check classification of key cards
console.log('\nSample cards:');
for (const id of [1, 14, 100, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000]) {
  const c = deck.find(d => d.id === id);
  if (c) {
    const nn = parseInt(c.grammarNode.replace('node-', '')) - 1;
    console.log(`  #${String(c.id).padStart(5)} -> ${c.grammarNode} ${tierLabels[nn]} (${nodeNames[nn].padEnd(24)}) "${c.target.substring(0, 60)}"`);
  }
}

// Per-tier summary
console.log('\nPer-tier summary (general goal):');
const generalCards = deck.filter(c => (c.tags || []).includes('general'));
const tierCounts = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
generalCards.forEach(c => {
  const nn = parseInt(c.grammarNode.replace('node-', '')) - 1;
  tierCounts[tierLabels[nn]]++;
});
for (const [tier, count] of Object.entries(tierCounts)) {
  console.log(`  ${tier}: ${count} cards`);
}
console.log(`  Total: ${generalCards.length}`);

writeFileSync(deckPath, JSON.stringify(deck, null, 2));
console.log('\nDone - Updated deck.json');
