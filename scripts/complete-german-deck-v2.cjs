#!/usr/bin/env node
/**
 * complete-german-deck-v2.cjs
 * Adds remaining cards to German deck for nodes that are under 112.
 * Current state: 3583 cards. Nodes 31-35 need the most (46-63 cards each).
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'german', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const nodeCounts = {};
deck.forEach(c => { nodeCounts[c.grammarNode] = (nodeCounts[c.grammarNode] || 0) + 1; });

let nextId = Math.max(...deck.map(c => c.id)) + 1;

// Track existing sentences to avoid duplicates
const existing = new Set(deck.map(c => c.target));

function addCards(node, cards) {
  const ex = nodeCounts[node] || 0;
  const needed = 112 - ex;
  if (needed <= 0) return 0;
  let added = 0;
  for (const c of cards) {
    if (added >= needed) break;
    if (existing.has(c[0])) continue; // skip duplicates
    deck.push({
      id: nextId,
      target: c[0],
      english: c[1],
      audio: `de-${nextId}.mp3`,
      ...(c[2] ? { grammar: c[2] } : {}),
      tags: c[3] || ['general'],
      grammarNode: node,
    });
    existing.add(c[0]);
    nextId++;
    added++;
  }
  return added;
}

const T = {
  g: ['general'], gt: ['general','travel'], gw: ['general','work'], gf: ['general','family'],
  gtw: ['general','travel','work'], gwf: ['general','work','family'], gtf: ['general','travel','family'],
  gtwf: ['general','travel','work','family']
};

let totalAdded = 0;

// ─── NODE 01: Greetings (need 1) ───────────────────────────
totalAdded += addCards('node-01', [
  ['Herzlich willkommen in unserem kleinen Dorf am See.', 'Welcome to our small village by the lake.', "'Herzlich willkommen' – warmly welcome, more emphatic than just 'willkommen'.", T.gt],
  ['Darf ich mich vorstellen? Mein Name ist Thomas, ich komme aus Hamburg.', 'May I introduce myself? My name is Thomas, I come from Hamburg.', null, T.g],
]);

// ─── NODE 02: Present tense (need 9) ───────────────────────
totalAdded += addCards('node-02', [
  ['Mein Bruder arbeitet als Ingenieur bei einer großen Firma in Stuttgart.', 'My brother works as an engineer at a large company in Stuttgart.', null, T.gw],
  ['Sie lernt jeden Abend zwei Stunden lang für ihre Prüfungen.', 'She studies for two hours every evening for her exams.', null, T.gw],
  ['Wir spielen am Wochenende immer Fußball im Park hinter der Schule.', 'We always play football in the park behind the school on weekends.', null, T.gf],
  ['Er trinkt morgens immer eine große Tasse schwarzen Kaffee.', 'He always drinks a large cup of black coffee in the morning.', null, T.g],
  ['Die Kinder laufen fröhlich über die Wiese und pflücken Blumen.', 'The children run happily across the meadow and pick flowers.', null, T.gf],
  ['Meine Kollegin spricht fließend vier verschiedene Sprachen.', 'My colleague speaks four different languages fluently.', null, T.gw],
  ['Er fährt jeden Morgen mit dem Fahrrad zur Universität.', 'He rides his bicycle to the university every morning.', null, T.gw],
  ['Wir kochen am Sonntagabend immer zusammen ein besonderes Abendessen.', 'We always cook a special dinner together on Sunday evenings.', null, T.gf],
  ['Sie schreibt regelmäßig Briefe an ihre Großeltern auf dem Land.', 'She regularly writes letters to her grandparents in the countryside.', null, T.gf],
  ['Die Nachbarin gießt jeden Morgen sorgfältig ihre Blumen auf dem Balkon.', 'The neighbor carefully waters her flowers on the balcony every morning.', null, T.gf],
]);

// ─── NODE 03: sein/haben (need 13) ─────────────────────────
totalAdded += addCards('node-03', [
  ['Ich bin seit drei Jahren verheiratet und habe zwei kleine Kinder.', 'I have been married for three years and have two small children.', null, T.gf],
  ['Er ist sehr müde, weil er letzte Nacht kaum geschlafen hat.', 'He is very tired because he barely slept last night.', null, T.g],
  ['Wir sind zum ersten Mal in Berlin und haben viel zu entdecken.', 'We are in Berlin for the first time and have a lot to discover.', null, T.gt],
  ['Sie hat eine alte Katze, die schon fünfzehn Jahre alt ist.', 'She has an old cat that is already fifteen years old.', null, T.gf],
  ['Bist du sicher, dass wir genug Zeit für das Museum haben?', 'Are you sure that we have enough time for the museum?', null, T.gt],
  ['Er ist Lehrer von Beruf und hat mehr als zwanzig Jahre Erfahrung.', 'He is a teacher by profession and has more than twenty years of experience.', null, T.gw],
  ['Die Kinder sind aufgeregt, weil sie morgen Geburtstag haben.', 'The children are excited because they have their birthday tomorrow.', null, T.gf],
  ['Ich bin froh, dass wir ein so schönes Hotel gefunden haben.', 'I am glad that we have found such a nice hotel.', null, T.gt],
  ['Habt ihr Hunger? Es gibt noch Kuchen in der Küche.', 'Are you hungry? There is still cake in the kitchen.', null, T.gf],
  ['Sie ist Ärztin am Krankenhaus und hat oft Nachtdienst.', 'She is a doctor at the hospital and often has night shifts.', null, T.gw],
  ['Wir sind stolz auf unsere Tochter, die ihr Studium abgeschlossen hat.', 'We are proud of our daughter who completed her studies.', null, T.gf],
  ['Das Wetter ist heute wunderschön und wir haben den ganzen Tag frei.', 'The weather is beautiful today and we have the whole day off.', null, T.g],
  ['Ich habe großen Respekt vor Menschen, die mehrere Sprachen sprechen.', 'I have great respect for people who speak several languages.', null, T.g],
  ['Er hat Angst vor Spinnen, obwohl sie hier völlig harmlos sind.', 'He is afraid of spiders, even though they are completely harmless here.', null, T.g],
]);

// ─── NODE 04: Gender/articles (need 2) ─────────────────────
totalAdded += addCards('node-04', [
  ['Das Mädchen im roten Kleid wartet an der Bushaltestelle.', 'The girl in the red dress is waiting at the bus stop.', "'Das Mädchen' – neuter, even though it refers to a girl. All -chen diminutives are neuter.", T.g],
  ['Der Schlüssel zur Garage liegt auf dem Tisch neben der Lampe.', 'The key to the garage is on the table next to the lamp.', null, T.gf],
  ['Die Bibliothek hat eine große Sammlung historischer Bücher.', 'The library has a large collection of historical books.', null, T.g],
]);

// ─── NODE 05: V2 word order (need 7) ───────────────────────
totalAdded += addCards('node-05', [
  ['Gestern Abend haben wir einen interessanten Film im Kino gesehen.', 'Last evening we saw an interesting film at the cinema.', "V2: 'haben' is 2nd, after the time phrase 'Gestern Abend'.", T.gt],
  ['Am Wochenende fahren meine Eltern immer zu ihrem Haus auf dem Land.', 'On weekends my parents always drive to their house in the countryside.', null, T.gf],
  ['Nach dem Frühstück räumen die Kinder ihr Zimmer auf.', 'After breakfast the children clean up their room.', null, T.gf],
  ['Leider können wir heute nicht zum Konzert gehen.', 'Unfortunately we cannot go to the concert today.', null, T.gt],
  ['Trotz des Regens gehen wir jeden Morgen im Park spazieren.', 'Despite the rain we go for a walk in the park every morning.', null, T.g],
  ['Besonders gut gefällt mir das kleine Café am Marktplatz.', 'I especially like the small café at the market square.', null, T.gt],
  ['Normalerweise stehe ich um sechs Uhr auf, aber heute habe ich ausgeschlafen.', 'Normally I get up at six, but today I slept in.', null, T.g],
  ['Im Sommer verbringen wir immer zwei Wochen an der Ostsee.', 'In summer we always spend two weeks at the Baltic Sea.', null, T.gtf],
]);

// ─── NODE 06: Accusative case (need 11) ────────────────────
totalAdded += addCards('node-06', [
  ['Ich kaufe einen neuen Laptop für meine Arbeit im Homeoffice.', 'I am buying a new laptop for my work from home.', "'Einen' – accusative masculine. 'Ein' → 'einen' for direct objects.", T.gw],
  ['Hast du den Brief von deiner Schwester schon gelesen?', 'Have you read the letter from your sister yet?', null, T.gf],
  ['Wir suchen eine gemütliche Wohnung mit Balkon in der Innenstadt.', 'We are looking for a cozy apartment with a balcony in the city center.', null, T.gt],
  ['Der Hund jagt die Katze durch den ganzen Garten bis zum Zaun.', 'The dog chases the cat through the entire garden to the fence.', "'Durch' always takes accusative: 'den ganzen Garten'.", T.gf],
  ['Können Sie mir bitte das Salz und den Pfeffer reichen?', 'Can you please pass me the salt and pepper?', null, T.gt],
  ['Sie hat ihren Regenschirm im Restaurant auf dem Stuhl vergessen.', 'She forgot her umbrella on the chair in the restaurant.', null, T.gt],
  ['Ohne einen gültigen Reisepass kann man nicht nach Kanada einreisen.', 'Without a valid passport you cannot enter Canada.', "'Ohne' always takes accusative: 'einen gültigen Reisepass'.", T.gt],
  ['Ich brauche dringend einen Termin beim Hautarzt für nächste Woche.', 'I urgently need an appointment with the dermatologist for next week.', null, T.g],
  ['Er hat seine beste Freundin am Flughafen herzlich abgeholt.', 'He warmly picked up his best friend at the airport.', null, T.gtf],
  ['Wir haben das ganze Wochenende für die schwierige Prüfung gelernt.', 'We studied for the difficult exam the whole weekend.', null, T.gw],
  ['Mein Bruder hat einen alten Volkswagen liebevoll restauriert.', 'My brother lovingly restored an old Volkswagen.', null, T.gf],
  ['Gegen den starken Wind kommen wir nur langsam voran.', 'Against the strong wind we are only making slow progress.', "'Gegen' always takes accusative: 'den starken Wind'.", T.gt],
]);

// ─── NODE 28: Noun compounds (need 1) ──────────────────────
totalAdded += addCards('node-28', [
  ['Das Mehrfamilienhaus am Stadtrand hat eine Tiefgarage und einen Gemeinschaftsgarten.', 'The multi-family house on the outskirts has an underground garage and a shared garden.', "Mehr+Familien+Haus, Tief+Garage, Gemeinschaft+s+Garten.", T.gf],
]);

// ─── NODE 30: Double infinitive & verb chains (need 1) ─────
totalAdded += addCards('node-30', [
  ['Sie hätte den Fehler im Bericht sofort korrigieren lassen sollen.', 'She should have had the error in the report corrected immediately.', "Triple verb chain: 'korrigieren lassen sollen' – infinitive stack.", T.gw],
]);

// ─── NODE 31: Formal writing & register (need 66) ──────────
totalAdded += addCards('node-31', [
  ['Sehr geehrte Frau Professorin, hiermit möchte ich mich für den Studienplatz bewerben.', 'Dear Professor, I would like to apply for the study place herewith.', "'Sehr geehrte' – standard formal salutation in German letters.", T.gw],
  ['Bezugnehmend auf Ihr Schreiben vom fünfzehnten März teile ich Ihnen Folgendes mit.', 'With reference to your letter of March fifteenth, I wish to inform you of the following.', "'Bezugnehmend auf' – formal letter opening.", T.gw],
  ['Die Geschäftsführung bedauert, Ihnen mitteilen zu müssen, dass die Filiale geschlossen wird.', 'The management regrets to inform you that the branch will be closed.', null, T.gw],
  ['Wir bitten Sie höflichst, den beigefügten Fragebogen bis zum Monatsende zurückzusenden.', 'We kindly ask you to return the enclosed questionnaire by the end of the month.', "'Höflichst' – superlative form used in formal requests.", T.gw],
  ['Im Rahmen unserer jährlichen Mitarbeiterbewertung möchte ich Ihre Leistung hervorheben.', 'Within the framework of our annual employee evaluation, I would like to highlight your performance.', null, T.gw],
  ['Für Rückfragen stehe ich Ihnen selbstverständlich jederzeit gerne zur Verfügung.', 'For any questions I am of course at your disposal at any time.', "Standard closing phrase in formal German correspondence.", T.gw],
  ['Die Teilnahme an der Fortbildung ist für alle Abteilungsleiter verpflichtend.', 'Participation in the training is mandatory for all department heads.', null, T.gw],
  ['Anlässlich des Firmenjubiläums laden wir Sie herzlich zu einem Empfang ein.', 'On the occasion of the company anniversary, we cordially invite you to a reception.', "'Anlässlich' + genitive – formal occasion reference.", T.gw],
  ['Die Ergebnisse der Umfrage werden in der nächsten Vorstandssitzung vorgestellt.', 'The survey results will be presented at the next board meeting.', null, T.gw],
  ['Mit freundlichen Grüßen verbleibe ich, Ihr ergebener Mitarbeiter.', 'Yours sincerely, your devoted employee.', "'Mit freundlichen Grüßen' – standard formal closing.", T.gw],
  ['Die Vertragsunterlagen bedürfen noch Ihrer rechtsverbindlichen Unterschrift.', 'The contract documents still require your legally binding signature.', "'Bedürfen' + genitive – formal 'to require'.", T.gw],
  ['Wir erlauben uns, Sie auf die geänderten Geschäftsbedingungen aufmerksam zu machen.', 'We take the liberty of drawing your attention to the changed terms of business.', null, T.gw],
  ['Gemäß den geltenden Bestimmungen ist eine Fristverlängerung leider nicht möglich.', 'In accordance with the applicable regulations, an extension of the deadline is unfortunately not possible.', "'Gemäß' + dative – in accordance with.", T.gw],
  ['Ich beehre mich, Sie über die Ergebnisse der diesjährigen Konferenz zu informieren.', 'I have the honor of informing you about the results of this year\'s conference.', null, T.gw],
  ['Die nachstehenden Ausführungen dienen der Erläuterung des Sachverhalts.', 'The following explanations serve to clarify the matter at hand.', null, T.gw],
  ['Wir möchten Sie darüber in Kenntnis setzen, dass sich unser Büro verlagert hat.', 'We wish to inform you that our office has relocated.', "'In Kenntnis setzen' – formal for 'to inform'.", T.gw],
  ['Die Einladung richtet sich an alle Mitglieder des wissenschaftlichen Beirats.', 'The invitation is directed at all members of the scientific advisory board.', null, T.gw],
  ['Aufgrund der aktuellen Entwicklung sehen wir uns gezwungen, die Preise anzupassen.', 'Due to current developments we find ourselves compelled to adjust prices.', null, T.gw],
  ['Ihre Bewerbung hat uns in jeder Hinsicht überzeugt und wir freuen uns auf die Zusammenarbeit.', 'Your application has convinced us in every respect and we look forward to working together.', null, T.gw],
  ['Namens und im Auftrag der Institutsleitung darf ich Sie willkommen heißen.', 'On behalf of the institute\'s management, I may welcome you.', null, T.gw],
  ['Hiermit bestätige ich den Erhalt Ihres Einschreibens vom dritten dieses Monats.', 'Herewith I confirm receipt of your registered letter of the third of this month.', null, T.gw],
  ['Wir würden es begrüßen, wenn Sie an der geplanten Sitzung teilnehmen könnten.', 'We would welcome it if you could attend the planned meeting.', null, T.gw],
  ['Im Hinblick auf die bevorstehende Fusion bitten wir um Vertraulichkeit.', 'With regard to the upcoming merger, we ask for confidentiality.', null, T.gw],
  ['Die von Ihnen genannten Bedenken werden selbstverständlich berücksichtigt.', 'The concerns you mentioned will of course be taken into account.', null, T.gw],
  ['Der Sachverhalt wurde eingehend geprüft und als unbegründet zurückgewiesen.', 'The matter was thoroughly examined and rejected as unfounded.', null, T.gw],
  ['Ich darf Sie bitten, die erforderlichen Unterlagen schnellstmöglich einzureichen.', 'I may ask you to submit the required documents as soon as possible.', null, T.gw],
  ['Das Gremium hat einstimmig beschlossen, den Antrag in der vorliegenden Form zu genehmigen.', 'The committee unanimously decided to approve the application in its present form.', null, T.gw],
  ['Es ist mir ein persönliches Anliegen, mich bei Ihnen für die langjährige Zusammenarbeit zu bedanken.', 'It is a personal concern of mine to thank you for the many years of cooperation.', null, T.gw],
  ['Die Stellungnahme des Ministeriums liegt mittlerweile in schriftlicher Form vor.', 'The ministry\'s statement is now available in written form.', null, T.gw],
  ['Wir bedauern zutiefst, Ihnen diese Nachricht überbringen zu müssen.', 'We deeply regret having to deliver this news to you.', null, T.gw],
  ['Der Beirat empfiehlt nachdrücklich, die vorgeschlagenen Maßnahmen zeitnah umzusetzen.', 'The advisory board strongly recommends implementing the proposed measures promptly.', null, T.gw],
  ['Im Zuge der Neustrukturierung werden einige Abteilungen zusammengelegt.', 'In the course of restructuring, some departments will be merged.', null, T.gw],
  ['Die Budgetplanung für das kommende Geschäftsjahr muss bis Ende November vorliegen.', 'The budget planning for the coming fiscal year must be available by the end of November.', null, T.gw],
  ['Der Vorstand hat in seiner heutigen Sitzung wichtige Weichenstellungen vorgenommen.', 'The board made important strategic decisions in its meeting today.', null, T.gw],
  ['Gerne stehen wir Ihnen für ein persönliches Gespräch zur Verfügung.', 'We are happy to be available for a personal conversation.', null, T.gw],
  ['Die ordnungsgemäße Durchführung des Verfahrens obliegt der zuständigen Behörde.', 'The proper execution of the procedure is the responsibility of the competent authority.', null, T.gw],
  ['Vorbehaltlich der Zustimmung des Aufsichtsrats wird die Maßnahme zum Quartalsbeginn umgesetzt.', 'Subject to the approval of the supervisory board, the measure will be implemented at the beginning of the quarter.', "'Vorbehaltlich' + genitive – subject to.", T.gw],
  ['Im Einklang mit den Unternehmensrichtlinien wurde eine interne Untersuchung eingeleitet.', 'In accordance with company guidelines, an internal investigation was initiated.', null, T.gw],
  ['Wir nehmen Ihre Anregungen und Verbesserungsvorschläge stets dankbar entgegen.', 'We are always grateful to receive your suggestions and improvement proposals.', null, T.gw],
  ['Die Geschäftsordnung sieht vor, dass Beschlüsse mit Zweidrittelmehrheit gefasst werden.', 'The rules of procedure stipulate that decisions are made with a two-thirds majority.', null, T.gw],
  ['Es obliegt dem Vorsitzenden, die Tagesordnung der nächsten Sitzung festzulegen.', 'It is the chairman\'s responsibility to set the agenda for the next meeting.', null, T.gw],
  ['Abschließend möchte ich allen Beteiligten meinen herzlichsten Dank aussprechen.', 'In conclusion, I would like to express my most heartfelt thanks to all involved.', null, T.gw],
  ['Die unterzeichneten Parteien verpflichten sich zur Einhaltung aller vertraglichen Bestimmungen.', 'The signatory parties commit to compliance with all contractual provisions.', null, T.gw],
  ['Wir weisen darauf hin, dass die genannten Fristen verbindlich einzuhalten sind.', 'We point out that the stated deadlines must be adhered to without fail.', null, T.gw],
  ['Im Namen der gesamten Geschäftsleitung gratuliere ich Ihnen zu diesem Erfolg.', 'On behalf of the entire management, I congratulate you on this success.', null, T.gw],
  ['Die eingereichten Dokumente entsprechen den formalen Anforderungen unserer Institution.', 'The submitted documents meet the formal requirements of our institution.', null, T.gw],
  ['Wie bereits in unserem letzten Schreiben angekündigt, treten die Änderungen am Monatsersten in Kraft.', 'As already announced in our last letter, the changes take effect on the first of the month.', null, T.gw],
  ['Unter Berücksichtigung aller Umstände halten wir die getroffene Entscheidung für angemessen.', 'Taking all circumstances into account, we consider the decision taken to be appropriate.', null, T.gw],
  ['Die Qualitätssicherung hat ergeben, dass sämtliche Standards eingehalten wurden.', 'Quality assurance has determined that all standards were met.', null, T.gw],
  ['Dem Protokoll der letzten Sitzung ist zu entnehmen, dass der Antrag vertagt wurde.', 'The minutes of the last meeting show that the motion was adjourned.', null, T.gw],
  ['Es wäre mir eine Ehre, an der feierlichen Eröffnung des neuen Gebäudes teilzunehmen.', 'It would be an honor for me to attend the ceremonial opening of the new building.', null, T.gtw],
  ['Die Abteilung hat sämtliche Zielvorgaben für das laufende Quartal übertroffen.', 'The department exceeded all targets for the current quarter.', null, T.gw],
  ['Der Beschwerdeführer wird gebeten, seine Einwände schriftlich zu formulieren.', 'The complainant is asked to formulate their objections in writing.', null, T.gw],
  ['In Anbetracht der wirtschaftlichen Lage empfehlen wir eine konservative Investitionsstrategie.', 'In view of the economic situation, we recommend a conservative investment strategy.', null, T.gw],
  ['Die unterfertigte Vereinbarung tritt mit sofortiger Wirkung in Kraft.', 'The signed agreement enters into force with immediate effect.', null, T.gw],
  ['Unbeschadet der vorstehenden Regelungen behalten sich die Vertragspartner weitere Ansprüche vor.', 'Without prejudice to the above provisions, the contracting parties reserve further claims.', null, T.gw],
  ['Hochachtungsvoll überreiche ich Ihnen den Jahresbericht unserer Stiftung.', 'With the highest respect, I present to you the annual report of our foundation.', "'Hochachtungsvoll' – very formal closing, used in official correspondence.", T.gw],
  ['Der Bericht wurde unter strenger Einhaltung wissenschaftlicher Methoden erstellt.', 'The report was prepared in strict compliance with scientific methods.', null, T.gw],
  ['Es bedarf keiner weiteren Erklärung, dass die Vertraulichkeit oberste Priorität genießt.', 'It goes without saying that confidentiality enjoys the highest priority.', "'Es bedarf' + genitive – formal 'it requires'.", T.gw],
  ['Die Revision hat keine wesentlichen Beanstandungen ergeben.', 'The audit did not reveal any significant objections.', null, T.gw],
  ['Zu meinem Bedauern muss ich Sie darüber informieren, dass Ihr Antrag abgelehnt wurde.', 'To my regret, I must inform you that your application has been rejected.', null, T.gw],
  ['Der Verwaltungsrat gibt bekannt, dass die Hauptversammlung am Dreizehnten stattfindet.', 'The administrative board announces that the general meeting will take place on the thirteenth.', null, T.gw],
  ['Unter Wahrung der gebotenen Sorgfalt wurden alle relevanten Akten gesichtet.', 'With due diligence, all relevant files were reviewed.', null, T.gw],
  ['Gestatten Sie mir, meiner Hoffnung auf eine weiterhin fruchtbare Zusammenarbeit Ausdruck zu verleihen.', 'Allow me to express my hope for a continued fruitful cooperation.', null, T.gw],
  ['Die Neufassung der Satzung wurde mit der erforderlichen Mehrheit verabschiedet.', 'The revised version of the statutes was adopted with the required majority.', null, T.gw],
  ['Der ordentliche Geschäftsbericht wird allen Gesellschaftern fristgerecht zugestellt.', 'The ordinary business report will be delivered to all shareholders in due time.', null, T.gw],
  ['Abschließend sei darauf hingewiesen, dass weitere Informationen auf unserer Webseite bereitstehen.', 'In conclusion, it should be noted that further information is available on our website.', null, T.gw],
  ['Die Überprüfung hat zweifelsfrei ergeben, dass alle Auflagen erfüllt worden sind.', 'The review has conclusively determined that all requirements have been met.', null, T.gw],
]);

// ─── NODE 32: Idiomatic expressions (need 58) ──────────────
totalAdded += addCards('node-32', [
  ['Er hat immer eine weiße Weste, niemand kann ihm etwas vorwerfen.', 'He always has a clean slate, nobody can accuse him of anything.', "'Eine weiße Weste haben' – to have a clean record.", T.g],
  ['Das ist nicht mein Bier, darum kümmere ich mich nicht.', "That's not my problem, I'm not going to worry about it.", "'Das ist nicht mein Bier' – that's not my concern/problem.", T.g],
  ['Er hat den Nagel auf den Kopf getroffen mit seiner Analyse.', 'He hit the nail on the head with his analysis.', "'Den Nagel auf den Kopf treffen' – to get something exactly right.", T.gw],
  ['Jetzt mal Butter bei die Fische, wie viel kostet das wirklich?', 'Now let\'s get down to brass tacks, how much does it really cost?', "'Butter bei die Fische' – get to the point (North German).", T.g],
  ['Da liegt der Hund begraben, genau das ist unser Hauptproblem.', "That's where the problem lies, exactly that is our main issue.", "'Da liegt der Hund begraben' – that's the crux of the matter.", T.gw],
  ['Sie hat mir einen Bären aufgebunden, nichts davon war wahr.', 'She pulled my leg, none of it was true.', "'Einen Bären aufbinden' – to deceive someone.", T.g],
  ['Er redet um den heißen Brei herum, ohne je zum Punkt zu kommen.', 'He beats around the bush without ever getting to the point.', "'Um den heißen Brei herumreden' – to beat around the bush.", T.gw],
  ['Du hast wohl Tomaten auf den Augen, das Schild steht direkt vor dir.', 'You must be blind, the sign is right in front of you.', "'Tomaten auf den Augen haben' – to be oblivious to something obvious.", T.g],
  ['Das geht mir auf den Keks, ich kann es nicht mehr ertragen.', 'That really annoys me, I can\'t take it anymore.', "'Auf den Keks gehen' – to get on someone's nerves.", T.gf],
  ['Er hat ins Schwarze getroffen, seine Vermutung war genau richtig.', 'He hit the bullseye, his guess was exactly right.', "'Ins Schwarze treffen' – to be spot on.", T.g],
  ['Ich drücke dir die Daumen für dein Vorstellungsgespräch morgen.', 'I\'ll keep my fingers crossed for your job interview tomorrow.', "'Die Daumen drücken' – German equivalent of crossing fingers.", T.gw],
  ['Da hast du wohl ins Fettnäpfchen getreten mit deinem Kommentar.', 'You really put your foot in it with your comment.', "'Ins Fettnäpfchen treten' – to make an embarrassing blunder.", T.g],
  ['Er macht aus einer Mücke einen Elefanten, so schlimm ist es nicht.', "He's making a mountain out of a molehill, it's not that bad.", "'Aus einer Mücke einen Elefanten machen' – to exaggerate.", T.gf],
  ['Das ist mir Wurst, du kannst entscheiden, wohin wir gehen.', "I don't care, you can decide where we go.", "'Das ist mir Wurst' – I don't care (lit: that's sausage to me).", T.gf],
  ['Sie hat Schwein gehabt, dass sie den letzten Platz bekommen hat.', 'She was lucky to get the last spot.', "'Schwein haben' – to be lucky (colloquial).", T.gt],
  ['Morgenstund hat Gold im Mund, sagt meine Großmutter immer.', 'The early bird catches the worm, my grandmother always says.', "German proverb: 'Morning hours have gold in their mouths.'", T.gf],
  ['Er hat die Katze aus dem Sack gelassen und die Wahrheit gesagt.', 'He let the cat out of the bag and told the truth.', "'Die Katze aus dem Sack lassen' – to reveal the truth.", T.g],
  ['Übung macht den Meister, also übe jeden Tag ein bisschen Deutsch.', 'Practice makes perfect, so practice a little German every day.', "German proverb: 'Practice makes the master.'", T.g],
  ['Sie nimmt kein Blatt vor den Mund und sagt immer, was sie denkt.', "She doesn't mince words and always says what she thinks.", "'Kein Blatt vor den Mund nehmen' – to speak bluntly.", T.g],
  ['Das ist doch kalter Kaffee, das wissen wir schon seit Wochen.', "That's old news, we've known that for weeks.", "'Kalter Kaffee' – old news, nothing new.", T.gw],
  ['Wir sitzen alle im selben Boot und müssen zusammenarbeiten.', 'We are all in the same boat and must work together.', "'Im selben Boot sitzen' – to be in the same situation.", T.gw],
  ['Er hat mir das Wasser abgegraben mit seinem günstigeren Angebot.', 'He stole my thunder with his cheaper offer.', "'Das Wasser abgraben' – to undermine someone.", T.gw],
  ['Da beißt die Maus keinen Faden ab, wir müssen die Deadline einhalten.', "There's no way around it, we have to meet the deadline.", "'Da beißt die Maus keinen Faden ab' – there's no changing it.", T.gw],
  ['Er ist ein alter Hase in diesem Geschäft und kennt jeden Trick.', "He's an old hand in this business and knows every trick.", "'Ein alter Hase' – an experienced person.", T.gw],
  ['Das Kind hat sich die Finger verbrannt, als es allein kochte.', 'The child got burned trying to cook alone.', "'Sich die Finger verbrennen' – to get burned (figuratively or literally).", T.gf],
  ['Sie hat den Braten gerochen und ist rechtzeitig gegangen.', 'She smelled a rat and left in time.', "'Den Braten riechen' – to suspect something is wrong.", T.g],
  ['Er wirft das Geld zum Fenster hinaus, statt es zu sparen.', 'He throws money out the window instead of saving it.', "'Geld zum Fenster hinauswerfen' – to waste money.", T.gf],
  ['Sie steht zwischen zwei Stühlen und kann sich nicht entscheiden.', "She's sitting on the fence and can't decide.", "'Zwischen zwei Stühlen stehen' – to be caught between two options.", T.g],
  ['Das ist nur die Spitze des Eisbergs, es gibt noch viel mehr Probleme.', "That's just the tip of the iceberg, there are many more problems.", null, T.gw],
  ['Er hat den Faden verloren und weiß nicht mehr, was er sagen wollte.', 'He lost his train of thought and no longer knows what he wanted to say.', "'Den Faden verlieren' – to lose one's train of thought.", T.g],
  ['Die ganze Sache ist ein Tropfen auf den heißen Stein.', 'The whole thing is a drop in the ocean.', "'Ein Tropfen auf den heißen Stein' – a drop in the bucket.", T.g],
  ['Er hat das Handtuch geworfen und das Projekt aufgegeben.', 'He threw in the towel and gave up the project.', "'Das Handtuch werfen' – to give up.", T.gw],
  ['Sie hat ihm die Leviten gelesen, weil er schon wieder zu spät kam.', 'She read him the riot act because he was late again.', "'Die Leviten lesen' – to give someone a severe telling-off.", T.gf],
  ['Das ist ein zweischneidiges Schwert, es hat Vor- und Nachteile.', "That's a double-edged sword, it has advantages and disadvantages.", null, T.gw],
  ['Wer im Glashaus sitzt, sollte nicht mit Steinen werfen.', 'People in glass houses shouldn\'t throw stones.', "German proverb with same meaning as the English one.", T.g],
  ['Es ist noch kein Meister vom Himmel gefallen, du lernst das schon.', "Rome wasn't built in a day, you'll learn it.", "Proverb: 'No master has fallen from the sky.'", T.g],
  ['Er hat Haare auf den Zähnen und setzt sich immer durch.', 'He is tough as nails and always gets his way.', "'Haare auf den Zähnen haben' – to be tough/assertive.", T.gw],
  ['Da haben wir den Salat, jetzt ist alles durcheinander.', 'Now we\'re in a fine mess, everything is mixed up.', "'Da haben wir den Salat' – we're in a mess.", T.gf],
  ['Sie hat ein Brett vor dem Kopf und versteht die einfachste Sache nicht.', 'She can\'t see the wood for the trees and doesn\'t understand the simplest thing.', "'Ein Brett vor dem Kopf haben' – to be unable to see the obvious.", T.g],
  ['Er redet wie ein Wasserfall und hört nie auf zu reden.', 'He talks a mile a minute and never stops talking.', "'Reden wie ein Wasserfall' – to talk nonstop.", T.gf],
  ['Aller Anfang ist schwer, aber es wird mit der Zeit einfacher.', 'Every beginning is hard, but it gets easier with time.', "German proverb: 'All beginnings are difficult.'", T.g],
  ['Sie tanzt auf mehreren Hochzeiten gleichzeitig und hat nie Zeit.', "She's juggling too many things at once and never has time.", "'Auf mehreren Hochzeiten tanzen' – to have too many commitments.", T.gw],
  ['Wir müssen die Kuh vom Eis holen, bevor es zu spät ist.', 'We need to solve this problem before it is too late.', "'Die Kuh vom Eis holen' – to resolve a tricky situation.", T.gw],
  ['Ich habe die Nase voll davon, jeden Tag Überstunden zu machen.', "I'm fed up with working overtime every day.", "'Die Nase voll haben' – to be fed up.", T.gw],
  ['Stille Wasser sind tief, er hat mehr drauf, als man denkt.', 'Still waters run deep, he knows more than you\'d think.', "'Stille Wasser sind tief' – quiet people may surprise you.", T.g],
  ['Das war ein Schuss in den Ofen, die ganze Planung war umsonst.', 'That was a total failure, all the planning was for nothing.', "'Ein Schuss in den Ofen' – a complete failure.", T.gw],
  ['Er schwimmt im Geld und kann sich alles leisten, was er will.', "He's swimming in money and can afford whatever he wants.", "'Im Geld schwimmen' – to be very wealthy.", T.g],
  ['Sie hat den Vogel abgeschossen mit ihrem brillanten Vorschlag.', 'She stole the show with her brilliant proposal.', "'Den Vogel abschießen' – to top everything.", T.gw],
  ['Wer den Pfennig nicht ehrt, ist des Talers nicht wert.', 'Take care of the pennies and the pounds will look after themselves.', "German proverb about thrift.", T.g],
  ['Er kommt vom Regen in die Traufe mit seinem neuen Job.', "He jumped from the frying pan into the fire with his new job.", "'Vom Regen in die Traufe' – from bad to worse.", T.gw],
  ['Das hat Hand und Fuß, dein Plan ist wirklich gut durchdacht.', 'That has substance, your plan is really well thought out.', "'Hand und Fuß haben' – to be solid and well-founded.", T.gw],
  ['Der Apfel fällt nicht weit vom Stamm, er ist genauso wie sein Vater.', "The apple doesn't fall far from the tree, he's just like his father.", "German proverb with same meaning as the English one.", T.gf],
  ['Sie hat mir grünes Licht gegeben für das neue Marketingkonzept.', 'She gave me the green light for the new marketing concept.', "'Grünes Licht geben' – to give the go-ahead.", T.gw],
  ['Er fühlt sich wie ein Fisch im Wasser in seinem neuen Büro.', 'He feels like a fish in water in his new office.', "'Wie ein Fisch im Wasser' – completely in one's element.", T.gw],
  ['Sie hat mir einen Strich durch die Rechnung gemacht mit ihrer Absage.', 'She threw a wrench in my plans with her cancellation.', "'Einen Strich durch die Rechnung machen' – to thwart someone's plans.", T.gw],
  ['Jetzt haben wir die Bescherung, die Heizung ist mitten im Winter kaputt.', 'Now we\'re in trouble, the heating broke in the middle of winter.', "'Die Bescherung haben' – to be in an unfortunate situation.", T.gf],
  ['Er hat kalte Füße bekommen und seine Kündigung zurückgezogen.', 'He got cold feet and withdrew his resignation.', "'Kalte Füße bekommen' – to get cold feet.", T.gw],
  ['Wer rastet, der rostet, deshalb bleibe ich auch im Alter aktiv.', 'Use it or lose it, that\'s why I stay active even in old age.', "Proverb: 'Who rests, rusts.'", T.g],
  ['Ende gut, alles gut, die Reise war trotz der Probleme wunderbar.', 'All\'s well that ends well, the trip was wonderful despite the problems.', null, T.gt],
]);

// ─── NODE 33: Advanced subjunctive (need 59) ───────────────
totalAdded += addCards('node-33', [
  ['Er tat so, als ob er von nichts wüsste, aber ich glaube ihm nicht.', 'He acted as if he knew nothing about it, but I don\'t believe him.', "'Als ob' + Konjunktiv II: 'wüsste' (subjunctive of 'wissen').", T.g],
  ['Hätte man mich vorher gefragt, hätte ich sofort abgelehnt.', 'Had someone asked me beforehand, I would have refused immediately.', "Inverted conditional without 'wenn' – literary style.", T.g],
  ['Es wäre wünschenswert gewesen, wenn alle Beteiligten rechtzeitig informiert worden wären.', 'It would have been desirable if all parties had been informed in time.', "Past subjunctive passive: 'informiert worden wären'.", T.gw],
  ['Angenommen, Sie hätten unbegrenzte Mittel, wie würden Sie das Problem lösen?', 'Assuming you had unlimited resources, how would you solve the problem?', "'Angenommen' + Konj. II – hypothetical scenario.", T.gw],
  ['Sie sprach, als hätte sie die ganze Nacht über die Rede geübt.', 'She spoke as if she had practiced the speech all night.', "'Als hätte' – comparison with Konj. II past.", T.gw],
  ['Wäre die Erfindung früher gemacht worden, hätte sie die Welt verändert.', 'Had the invention been made earlier, it would have changed the world.', "Inverted conditional with passive: 'gemacht worden'.", T.g],
  ['Es scheint, als sei der Frühling dieses Jahr besonders früh gekommen.', 'It seems as if spring has come especially early this year.', "'Als sei' – Konjunktiv I in 'als ob' clause.", T.g],
  ['Selbst wenn ich gewollt hätte, hätte ich nichts ändern können.', 'Even if I had wanted to, I could not have changed anything.', "'Hätte ... können' – modal in past subjunctive.", T.g],
  ['Man könnte meinen, die Zeit sei stehen geblieben in diesem Dorf.', 'One could think that time had stood still in this village.', null, T.gt],
  ['Wäre er nicht so stur gewesen, hätten wir das Problem schneller gelöst.', 'Had he not been so stubborn, we would have solved the problem faster.', null, T.gw],
  ['Es hat den Anschein, als würde die Regierung ihre Meinung ändern.', 'It appears as if the government would change its mind.', "'Es hat den Anschein, als' + Konj. II.", T.gw],
  ['Wenn es nach den Experten ginge, müssten wir sofort handeln.', 'If it were up to the experts, we would have to act immediately.', null, T.gw],
  ['Hätte sie den Vertrag gelesen, wäre ihr der Fehler aufgefallen.', 'Had she read the contract, she would have noticed the mistake.', null, T.gw],
  ['Es wäre mir lieber, wenn wir das Treffen auf nächste Woche verschieben könnten.', 'I would prefer it if we could postpone the meeting to next week.', null, T.gw],
  ['Nicht als ob es mich überrascht hätte, aber die Nachricht war trotzdem ein Schock.', "Not that it surprised me, but the news was a shock nonetheless.", "'Nicht als ob' + Konj. II – rhetorical distancing.", T.g],
  ['Gesetzt den Fall, die Verhandlungen scheitern, was wäre unser Plan B?', 'In the event the negotiations fail, what would be our plan B?', "'Gesetzt den Fall' – formal hypothetical.", T.gw],
  ['Wie wäre es, wenn wir stattdessen morgen Abend zusammen essen gingen?', 'How about if we went out to eat together tomorrow evening instead?', "'Wie wäre es, wenn' – polite suggestion.", T.gf],
  ['Hätte ich doch bloß meine Kamera mitgenommen, der Sonnenuntergang war unglaublich.', 'If only I had taken my camera, the sunset was incredible.', "'Hätte ... doch bloß' – strong expression of regret.", T.gt],
  ['Es wäre an der Zeit, dass endlich alle an einem Strang zögen.', 'It would be about time that everyone finally pulled together.', "'Zögen' – Konj. II of 'ziehen'.", T.gw],
  ['Sie benimmt sich, als wäre sie die Wichtigste im ganzen Büro.', 'She behaves as if she were the most important person in the entire office.', null, T.gw],
  ['Wenn man bedenkt, wie schwierig die Lage war, hätte es schlimmer kommen können.', 'Considering how difficult the situation was, it could have been worse.', null, T.g],
  ['Stünde mir mehr Zeit zur Verfügung, würde ich mich ehrenamtlich engagieren.', 'If I had more time available, I would volunteer.', "'Stünde' – literary Konj. II of 'stehen'.", T.g],
  ['Hätten sie rechtzeitig gehandelt, wäre die Krise vermeidbar gewesen.', 'Had they acted in time, the crisis would have been avoidable.', null, T.gw],
  ['Man tut so, als gäbe es das Problem überhaupt nicht.', 'People act as if the problem does not exist at all.', "'Als gäbe es' – Konj. II of 'es gibt'.", T.g],
  ['Es wäre klug gewesen, vor der Investition einen Experten zu Rate zu ziehen.', 'It would have been wise to consult an expert before the investment.', null, T.gw],
  ['Wenn ich König von Deutschland wäre, würde ich den Montag abschaffen.', 'If I were king of Germany, I would abolish Mondays.', "Humorous hypothetical with Konj. II.", T.g],
  ['Anstatt dass wir uns stritten, hätten wir lieber nach einer Lösung suchen sollen.', 'Instead of arguing, we should rather have looked for a solution.', "'Anstatt dass' + Konj. II – alternative suggestion.", T.gf],
  ['Wäre die Brücke nicht gesperrt gewesen, hätten wir eine Stunde gespart.', 'Had the bridge not been closed, we would have saved an hour.', null, T.gt],
  ['Es mag sein, dass ich mich irre, aber mir kommt die Sache verdächtig vor.', 'It may be that I am wrong, but the matter seems suspicious to me.', null, T.g],
  ['Falls es doch so käme, müssten wir unsere gesamte Planung überarbeiten.', 'If it did come to that, we would have to revise all our planning.', "'Käme' – Konj. II of 'kommen'.", T.gw],
  ['Wenn sie wüsste, wie viel Arbeit dahintersteckt, würde sie es besser schätzen.', 'If she knew how much work is behind it, she would appreciate it more.', null, T.gw],
  ['Als ob das nicht schon genug wäre, hat es auch noch angefangen zu regnen.', 'As if that were not enough already, it also started to rain.', null, T.g],
  ['Hätte ich gewusst, dass du kommst, hätte ich einen Kuchen gebacken.', 'Had I known you were coming, I would have baked a cake.', null, T.gf],
  ['Er verhält sich, als gehörte ihm das ganze Unternehmen.', 'He behaves as if the whole company belonged to him.', "'Als gehörte' – Konj. II without 'ob'.", T.gw],
  ['Wenn sich die Gelegenheit böte, würde ich sofort nach Australien reisen.', 'If the opportunity arose, I would travel to Australia immediately.', "'Böte' – Konj. II of 'bieten'.", T.gt],
  ['Es wäre schade, wenn dieses historische Gebäude abgerissen würde.', 'It would be a shame if this historic building were demolished.', null, T.gt],
  ['Hätten wir die Warnung ernst genommen, säßen wir jetzt nicht in der Patsche.', "Had we taken the warning seriously, we wouldn't be in this mess now.", "'Säßen' – Konj. II of 'sitzen'.", T.g],
  ['Ich an seiner Stelle hätte den Job sofort angenommen.', 'In his place I would have taken the job immediately.', "'An seiner Stelle' – in his place.", T.gw],
  ['Wenn es so wäre, wie du sagst, müsste die Rechnung aufgehen.', 'If it were as you say, the numbers should add up.', null, T.gw],
  ['Wäre es möglich, dass wir den Termin um eine Stunde verschieben?', 'Would it be possible for us to postpone the appointment by one hour?', "Polite request with 'wäre es möglich'.", T.gw],
  ['Man müsste eigentlich mal den Keller aufräumen, aber dafür fehlt die Motivation.', 'One really should clean out the basement, but the motivation is lacking.', null, T.gf],
  ['Ohne sein schnelles Eingreifen hätte der Unfall viel schlimmere Folgen gehabt.', 'Without his quick intervention, the accident would have had much worse consequences.', null, T.g],
  ['Wenn ich die Zukunft voraussagen könnte, würde ich im Lotto spielen.', 'If I could predict the future, I would play the lottery.', null, T.g],
  ['Wäre die Welt gerecht, gäbe es weder Armut noch Hunger.', 'If the world were just, there would be neither poverty nor hunger.', null, T.g],
  ['Kaum zu glauben, aber er sprach, als wäre er dort aufgewachsen.', 'Hard to believe, but he spoke as if he had grown up there.', null, T.gt],
  ['Es wäre besser gewesen, wenn wir von Anfang an ehrlich zueinander gewesen wären.', 'It would have been better if we had been honest with each other from the start.', null, T.gf],
  ['Wenn das Geld auf Bäumen wüchse, bräuchte niemand mehr zu arbeiten.', 'If money grew on trees, nobody would need to work anymore.', "'Wüchse' – literary Konj. II of 'wachsen'.", T.g],
  ['Selbst wenn er die Wahrheit sagte, würde ihm niemand glauben.', 'Even if he were telling the truth, nobody would believe him.', null, T.g],
  ['Es hätte nicht viel gefehlt und der ganze Plan wäre gescheitert.', 'It wouldn\'t have taken much and the whole plan would have failed.', "'Es hätte nicht viel gefehlt' – it was a close call.", T.gw],
  ['Falls es zu Komplikationen käme, stünden wir sofort bereit.', 'If complications arose, we would be ready immediately.', "'Stünden' – Konj. II of 'stehen'.", T.gw],
  ['Wenn alle Menschen so dächten, wäre die Welt ein besserer Ort.', 'If all people thought that way, the world would be a better place.', "'Dächten' – Konj. II of 'denken'.", T.g],
  ['Es wäre mir ein Vergnügen, Sie persönlich durch die Ausstellung zu führen.', 'It would be my pleasure to personally guide you through the exhibition.', null, T.gt],
  ['Hätte er den Zug nicht verpasst, wäre er pünktlich zur Konferenz erschienen.', 'Had he not missed the train, he would have arrived at the conference on time.', null, T.gtw],
  ['So gern ich auch käme, mein Terminkalender lässt es leider nicht zu.', 'Much as I would like to come, my schedule unfortunately does not allow it.', null, T.gw],
  ['Es wäre vermessen zu behaupten, dass alles perfekt gelaufen sei.', 'It would be presumptuous to claim that everything went perfectly.', null, T.gw],
  ['Wenn wir damals anders entschieden hätten, sähe die Lage heute ganz anders aus.', 'If we had decided differently back then, the situation would look quite different today.', "'Sähe' – Konj. II of 'sehen'.", T.g],
  ['Wäre ich an Ihrer Stelle, würde ich das Angebot in Ruhe überdenken.', 'If I were in your place, I would think about the offer carefully.', null, T.gw],
  ['Wenn er doch nur ein bisschen geduldiger wäre, käme er besser mit seinen Kollegen aus.', 'If only he were a bit more patient, he would get along better with his colleagues.', null, T.gw],
  ['Als ob die Situation nicht schon kompliziert genug wäre, gibt es jetzt auch noch Personalprobleme.', 'As if the situation were not complicated enough, there are now also staffing problems.', null, T.gw],
  ['Wüsste ich die Antwort, würde ich dir sofort helfen.', 'If I knew the answer, I would help you right away.', "Inversion without 'wenn' – compact conditional.", T.g],
]);

// ─── NODE 34: Academic & professional German (need 60) ──────
totalAdded += addCards('node-34', [
  ['Die vorliegende Studie untersucht den Einfluss sozialer Medien auf das Kaufverhalten.', 'The present study examines the influence of social media on purchasing behavior.', "'Die vorliegende Studie' – standard academic opening.", T.gw],
  ['Im Folgenden werden die wichtigsten Ergebnisse der Untersuchung zusammengefasst.', 'In the following, the most important results of the investigation are summarized.', null, T.gw],
  ['Die Analyse basiert auf einer repräsentativen Stichprobe von zweitausend Teilnehmern.', 'The analysis is based on a representative sample of two thousand participants.', null, T.gw],
  ['Es lässt sich feststellen, dass die Hypothese durch die Daten gestützt wird.', 'It can be determined that the hypothesis is supported by the data.', "'Es lässt sich feststellen' – academic hedging.", T.gw],
  ['Die Ergebnisse deuten darauf hin, dass ein signifikanter Zusammenhang besteht.', 'The results suggest that a significant correlation exists.', null, T.gw],
  ['Aus methodischer Sicht ist anzumerken, dass die Studie gewisse Einschränkungen aufweist.', 'From a methodological standpoint, it should be noted that the study has certain limitations.', null, T.gw],
  ['Der theoretische Rahmen dieser Arbeit stützt sich auf die Erkenntnisse von Weber und Habermas.', 'The theoretical framework of this work is based on the findings of Weber and Habermas.', null, T.gw],
  ['Die empirischen Befunde stehen im Einklang mit früheren Forschungsergebnissen.', 'The empirical findings are consistent with earlier research results.', null, T.gw],
  ['Weiterführende Untersuchungen sind erforderlich, um die Ergebnisse zu validieren.', 'Further investigations are necessary to validate the results.', null, T.gw],
  ['Die statistische Auswertung erfolgte mithilfe einer multivariaten Regressionsanalyse.', 'The statistical analysis was carried out using multivariate regression analysis.', null, T.gw],
  ['Zusammenfassend lässt sich sagen, dass die Forschungsfrage positiv beantwortet werden kann.', 'In summary, it can be said that the research question can be answered positively.', null, T.gw],
  ['Der aktuelle Forschungsstand zeigt, dass in diesem Bereich noch erheblicher Klärungsbedarf besteht.', 'The current state of research shows that there is still considerable need for clarification in this area.', null, T.gw],
  ['Die Datenerhebung erfolgte mittels standardisierter Fragebögen im Zeitraum März bis Juni.', 'Data collection was carried out using standardized questionnaires in the period from March to June.', null, T.gw],
  ['In der Fachliteratur wird dieser Ansatz kontrovers diskutiert.', 'In the specialist literature, this approach is controversially discussed.', null, T.gw],
  ['Die Schlussfolgerungen sind mit Vorbehalt zu betrachten, da die Stichprobe relativ klein war.', 'The conclusions should be viewed with reservation, as the sample was relatively small.', null, T.gw],
  ['Die quantitative Analyse ergab statistisch signifikante Unterschiede zwischen den Gruppen.', 'The quantitative analysis revealed statistically significant differences between the groups.', null, T.gw],
  ['Im Rahmen des Forschungsprojekts wurden über fünfhundert Interviews durchgeführt.', 'Within the research project, over five hundred interviews were conducted.', null, T.gw],
  ['Das Projektmanagement umfasst die Planung, Steuerung und Kontrolle aller Projektphasen.', 'Project management encompasses the planning, direction, and control of all project phases.', null, T.gw],
  ['Die Quartalsberichte zeigen eine kontinuierliche Verbesserung der Geschäftskennzahlen.', 'The quarterly reports show a continuous improvement in business indicators.', null, T.gw],
  ['Auf Grundlage der vorliegenden Daten empfehlen wir eine Neuausrichtung der Strategie.', 'Based on the available data, we recommend a realignment of the strategy.', null, T.gw],
  ['Die Ergebnisprognose für das laufende Geschäftsjahr wurde nach oben korrigiert.', 'The profit forecast for the current fiscal year has been revised upward.', null, T.gw],
  ['Der Return on Investment beträgt voraussichtlich zwölf Prozent innerhalb von drei Jahren.', 'The return on investment is expected to be twelve percent within three years.', null, T.gw],
  ['Die Personalentwicklung setzt verstärkt auf berufsbegleitende Weiterbildungsmaßnahmen.', 'Human resources development increasingly focuses on continuing education measures alongside work.', null, T.gw],
  ['Die Implementierung des neuen Systems erfordert eine sorgfältige Change-Management-Strategie.', 'The implementation of the new system requires a careful change management strategy.', null, T.gw],
  ['Laut interner Evaluierung hat das Qualitätsmanagementsystem die gesetzten Ziele erreicht.', 'According to internal evaluation, the quality management system has achieved its goals.', null, T.gw],
  ['Die Synergieeffekte der Fusion werden sich voraussichtlich ab dem zweiten Quartal bemerkbar machen.', 'The synergy effects of the merger are expected to become noticeable from the second quarter.', null, T.gw],
  ['Der ganzheitliche Ansatz berücksichtigt sowohl ökonomische als auch ökologische Aspekte.', 'The holistic approach takes into account both economic and ecological aspects.', null, T.gw],
  ['Die Benchmark-Analyse zeigt, dass wir in einigen Bereichen Nachholbedarf haben.', 'The benchmark analysis shows that we have some catching up to do in certain areas.', null, T.gw],
  ['Im Zuge der Digitalisierung werden zahlreiche Geschäftsprozesse automatisiert.', 'In the course of digitalization, numerous business processes are being automated.', null, T.gw],
  ['Die Korrelation zwischen Kundenzufriedenheit und Mitarbeitermotivation ist gut dokumentiert.', 'The correlation between customer satisfaction and employee motivation is well documented.', null, T.gw],
  ['Abweichend von der ursprünglichen Planung wurde eine alternative Vorgehensweise gewählt.', 'Deviating from the original planning, an alternative approach was chosen.', null, T.gw],
  ['Das Monitoring der Umweltauswirkungen erfolgt in regelmäßigen Abständen.', 'Monitoring of environmental impacts is carried out at regular intervals.', null, T.gw],
  ['Die Wettbewerbsanalyse hat wesentliche Stärken und Schwächen identifiziert.', 'The competitive analysis identified key strengths and weaknesses.', null, T.gw],
  ['Zur Risikominimierung empfehlen wir eine Diversifizierung des Portfolios.', 'For risk minimization, we recommend diversification of the portfolio.', null, T.gw],
  ['Die vorliegenden Zahlen bestätigen den positiven Trend der vergangenen Quartale.', 'The available figures confirm the positive trend of recent quarters.', null, T.gw],
  ['In Bezug auf die Nachhaltigkeit hat das Unternehmen beachtliche Fortschritte erzielt.', 'Regarding sustainability, the company has achieved considerable progress.', null, T.gw],
  ['Die interdisziplinäre Zusammenarbeit hat sich als besonders fruchtbar erwiesen.', 'Interdisciplinary cooperation has proven to be particularly fruitful.', null, T.gw],
  ['Der wirtschaftliche Abschwung hat die Exportwirtschaft besonders hart getroffen.', 'The economic downturn has hit the export economy particularly hard.', null, T.gw],
  ['Die Prozessoptimierung hat zu einer Reduktion der Durchlaufzeiten um dreißig Prozent geführt.', 'Process optimization has led to a reduction in throughput times by thirty percent.', null, T.gw],
  ['Hinsichtlich der Marktentwicklung sind wir verhalten optimistisch.', 'Regarding market development, we are cautiously optimistic.', null, T.gw],
  ['Der Beitrag untersucht kritisch die methodischen Grundlagen der bisherigen Forschung.', 'The article critically examines the methodological foundations of previous research.', null, T.gw],
  ['Die Infrastrukturinvestitionen sollen zur langfristigen Wettbewerbsfähigkeit beitragen.', 'Infrastructure investments are intended to contribute to long-term competitiveness.', null, T.gw],
  ['Die Ursachen des Phänomens werden in der Literatur unterschiedlich interpretiert.', 'The causes of the phenomenon are interpreted differently in the literature.', null, T.gw],
  ['Eine differenzierte Betrachtung des Problems offenbart zahlreiche Nuancen.', 'A differentiated examination of the problem reveals numerous nuances.', null, T.gw],
  ['Der Diskurs über nachhaltige Entwicklung hat in den letzten Jahrzehnten an Bedeutung gewonnen.', 'The discourse on sustainable development has gained importance in recent decades.', null, T.gw],
  ['In der Gesamtbetrachtung überwiegen die Vorteile des vorgeschlagenen Modells.', 'In the overall assessment, the advantages of the proposed model outweigh the disadvantages.', null, T.gw],
  ['Das Konzept wurde unter Einbeziehung aller relevanten Stakeholder entwickelt.', 'The concept was developed with the involvement of all relevant stakeholders.', null, T.gw],
  ['Die Evaluationsergebnisse legen nahe, dass der gewählte Ansatz wirksam ist.', 'The evaluation results suggest that the chosen approach is effective.', null, T.gw],
  ['Insbesondere im Bereich der erneuerbaren Energien zeichnen sich vielversprechende Trends ab.', 'Particularly in the field of renewable energies, promising trends are emerging.', null, T.gw],
  ['Die Handlungsempfehlungen richten sich an politische Entscheidungsträger auf allen Ebenen.', 'The recommendations for action are directed at political decision-makers at all levels.', null, T.gw],
  ['Eine abschließende Bewertung ist zum gegenwärtigen Zeitpunkt noch nicht möglich.', 'A final assessment is not yet possible at the present time.', null, T.gw],
  ['Der Paradigmenwechsel in der Bildungspolitik erfordert ein Umdenken aller Beteiligten.', 'The paradigm shift in education policy requires a rethinking by all involved.', null, T.gw],
  ['Die Konvergenz von Technologie und Gesellschaft schafft neue Herausforderungen und Chancen.', 'The convergence of technology and society creates new challenges and opportunities.', null, T.gw],
  ['Die Operationalisierung der theoretischen Konstrukte stellte die Forscher vor Herausforderungen.', 'The operationalization of theoretical constructs presented challenges for the researchers.', null, T.gw],
  ['In der Retrospektive hat sich die damalige Entscheidung als weitsichtig erwiesen.', 'In retrospect, the decision made at the time has proven to be far-sighted.', null, T.gw],
  ['Die Transparenz der Entscheidungsprozesse ist für das Vertrauen der Öffentlichkeit unerlässlich.', 'The transparency of decision-making processes is essential for public trust.', null, T.gw],
  ['Angesichts der demografischen Entwicklung muss die Rentenpolitik grundlegend reformiert werden.', 'In view of demographic developments, pension policy must be fundamentally reformed.', null, T.gw],
  ['Die Studie leistet einen wesentlichen Beitrag zur theoretischen Fundierung des Fachgebiets.', 'The study makes a significant contribution to the theoretical foundation of the field.', null, T.gw],
  ['Das Potenzial künstlicher Intelligenz für die medizinische Diagnostik wird zunehmend erkannt.', 'The potential of artificial intelligence for medical diagnostics is increasingly being recognized.', null, T.gw],
  ['Resümierend bleibt festzuhalten, dass weitere Forschung auf diesem Gebiet dringend geboten ist.', 'In summary, it should be noted that further research in this area is urgently needed.', null, T.gw],
  ['Die vergleichende Perspektive ermöglicht tiefere Einblicke in kulturelle Unterschiede.', 'The comparative perspective enables deeper insights into cultural differences.', null, T.gw],
]);

// ─── NODE 35: Modal particles (need 49) ────────────────────
totalAdded += addCards('node-35', [
  ['Das ist ja unglaublich, dass du den Marathon geschafft hast!', "That's incredible that you finished the marathon!", "'Ja' here expresses surprise and emphasis.", T.g],
  ['Komm doch mal vorbei, wir haben uns ewig nicht gesehen.', "Come visit sometime, we haven't seen each other in ages.", "'Doch mal' – friendly, encouraging invitation.", T.gf],
  ['Das ist halt so, daran können wir nichts ändern.', "That's just the way it is, we can't change it.", "'Halt' – resignation/acceptance. Like 'eben' but more casual.", T.g],
  ['Du bist ja schon da, ich dachte, du kommst erst um drei.', "Oh you're already here, I thought you weren't coming until three.", "'Ja' – surprise at an unexpected situation.", T.gf],
  ['Mach dir mal keine Sorgen, das wird schon alles gut.', "Don't worry, everything will work out.", "'Schon' here conveys reassurance and confidence.", T.gf],
  ['Das war eben ein Missverständnis, kann jedem passieren.', 'That was simply a misunderstanding, it can happen to anyone.', "'Eben' – matter-of-fact tone, stating the obvious.", T.g],
  ['Kannst du mir mal kurz helfen, das Regal aufzubauen?', 'Could you quickly help me put up the shelf?', "'Mal' softens the request, making it casual and friendly.", T.gf],
  ['Er ist halt ein bisschen eigenartig, aber im Grunde nett.', "He's just a bit odd, but basically nice.", "'Halt' – accepting something as it is.", T.gf],
  ['Sag doch einfach Bescheid, wenn du Hilfe brauchst.', 'Just let me know if you need help.', "'Doch' adds gentle encouragement.", T.gw],
  ['Das stimmt ja gar nicht, du hast es doch selbst gesehen!', "That's not true at all, you saw it yourself!", "'Ja' (surprise at a claim) + 'doch' (contradicting).", T.g],
  ['Guck mal, der Sonnenuntergang ist heute besonders schön.', 'Look, the sunset is especially beautiful today.', "'Mal' – casual attention-getting.", T.gf],
  ['Das können wir ruhig morgen machen, es eilt ja nicht.', "We can do that tomorrow, there's no rush after all.", "'Ruhig' – permission/reassurance. 'Ja' – shared knowledge.", T.g],
  ['Du weißt doch, dass ich immer für dich da bin.', 'You know that I am always there for you.', "'Doch' – reminding of something the listener already knows.", T.gf],
  ['Es ist eben nicht leicht, eine neue Sprache zu lernen.', "It's simply not easy to learn a new language.", "'Eben' – stating a fact that should be accepted.", T.g],
  ['Nun mach schon, wir kommen sonst zu spät zum Konzert.', "Come on, hurry up, we'll be late for the concert otherwise.", "'Schon' – impatience, urging action.", T.gt],
  ['Das war ja wohl das Letzte, so kann man nicht mit Leuten umgehen.', 'That was absolutely unacceptable, you cannot treat people like that.', "'Ja wohl' – indignation, emphasis on the unacceptable.", T.g],
  ['Ich komme schon noch dazu, hab einfach etwas Geduld.', "I'll get to it, just have a bit of patience.", "'Schon' – reassurance that it will happen.", T.g],
  ['Probier doch mal den Kuchen, der ist wirklich fantastisch.', 'Try the cake, it is really fantastic.', "'Doch mal' – warm encouragement.", T.gf],
  ['Sie ist halt Perfektionistin, da kann man nichts machen.', "She's just a perfectionist, there's nothing you can do about it.", null, T.gw],
  ['Das ist ja gerade das Problem, niemand will die Verantwortung übernehmen.', "That's precisely the problem, nobody wants to take responsibility.", "'Ja gerade' – emphasizing that this is the exact issue.", T.gw],
  ['Frag doch einfach den Kellner, der weiß bestimmt Bescheid.', 'Just ask the waiter, he surely knows.', "'Doch einfach' – suggesting the obvious solution.", T.gt],
  ['Das habe ich dir doch schon dreimal erklärt, hör bitte zu.', "I've already explained that to you three times, please listen.", "'Doch schon' – frustration at having to repeat.", T.gf],
  ['Jetzt reg dich mal nicht so auf, es ist doch nur ein Spiel.', "Don't get so upset, it's only a game after all.", "'Doch' – reminding of perspective.", T.gf],
  ['Er ist ja noch jung, er wird es schon noch lernen.', "He's still young, he'll learn in time.", "'Ja' (stating fact) + 'schon noch' (eventual certainty).", T.gf],
  ['Das war wohl ein Fehler, aber daraus lernen wir bestimmt.', 'That was probably a mistake, but we will certainly learn from it.', "'Wohl' – acknowledging with slight uncertainty.", T.gw],
  ['Na ja, es hätte schlimmer kommen können, oder?', 'Well, it could have been worse, right?', "'Na ja' – relativizing, looking on the bright side.", T.g],
  ['Setz dich doch hin und erzähl mir, was passiert ist.', 'Sit down and tell me what happened.', "'Doch' – warm, inviting tone.", T.gf],
  ['Das ist eben der Unterschied zwischen Theorie und Praxis.', "That's simply the difference between theory and practice.", "'Eben' – stating an accepted truth.", T.gw],
  ['Hast du eigentlich schon von der neuen Regelung gehört?', 'Have you actually heard about the new regulation yet?', "'Eigentlich' – introducing a topic casually, by the way.", T.gw],
  ['Das geht ja gar nicht, wir müssen sofort eine Lösung finden.', "That's absolutely unacceptable, we must find a solution immediately.", "'Ja gar nicht' – emphatic rejection.", T.gw],
  ['Sei mal ehrlich, hast du die Aufgabe wirklich allein gemacht?', 'Be honest, did you really do the task on your own?', "'Mal' – softening a direct question.", T.gf],
  ['Er hätte ruhig etwas freundlicher sein können, finde ich.', 'He could have been a bit friendlier, in my opinion.', "'Ruhig' – suggesting something would have been acceptable.", T.g],
  ['Das wird schon klappen, du hast dich ja gut vorbereitet.', "It'll work out, you prepared well after all.", "'Schon' + 'ja' – double reassurance.", T.gw],
  ['Das muss doch nicht sein, wir können das auch anders regeln.', "That doesn't have to be the case, we can arrange it differently.", "'Doch' – gentle objection.", T.gw],
  ['Wo warst du denn? Wir warten schon seit einer halben Stunde.', "Where have you been? We've been waiting for half an hour already.", "'Denn' – adds urgency/curiosity to questions.", T.gf],
  ['Das ist nun mal so in Deutschland, daran muss man sich gewöhnen.', "That's just how it is in Germany, you have to get used to it.", "'Nun mal' – resigned acceptance of a cultural norm.", T.gt],
  ['Mach dir bloß keine falschen Hoffnungen, es ist noch nichts sicher.', "Don't get your hopes up, nothing is certain yet.", "'Bloß' – strong warning.", T.gw],
  ['Das sieht ja toll aus, du hast die Wohnung wirklich schön eingerichtet.', "That looks great, you've really decorated the apartment beautifully.", "'Ja' – positive surprise.", T.gf],
  ['Wir sollten vielleicht mal darüber reden, findest du nicht?', "Maybe we should talk about it sometime, don't you think?", "'Vielleicht mal' – gentle suggestion.", T.gf],
  ['Bleib doch noch ein bisschen, es ist ja noch früh.', "Stay a little longer, it's still early after all.", "'Doch' + 'ja' – persuasive encouragement.", T.gf],
  ['Er war halt schon immer ein bisschen vergesslich, das kennen wir.', "He's just always been a bit forgetful, we know that.", "'Halt schon immer' – accepting a long-known trait.", T.gf],
  ['Was soll ich denn machen, wenn er nicht auf meine Anrufe reagiert?', 'What am I supposed to do if he does not respond to my calls?', "'Denn' – adds urgency and slight frustration to the question.", T.g],
  ['Es ist ja nicht so, dass wir es nicht versucht hätten.', "It's not as if we didn't try.", "'Ja' – defensive emphasis.", T.gw],
  ['Lass doch den Jungen in Ruhe, er macht das schon richtig.', 'Leave the boy alone, he is doing it right.', "'Doch' + 'schon' – defending and reassuring.", T.gf],
  ['Eigentlich wollte ich heute Sport machen, aber ich bin einfach zu müde.', 'Actually I wanted to exercise today, but I am simply too tired.', "'Eigentlich' – signaling an unfulfilled intention.", T.g],
  ['Das hättest du dir ja denken können, dass es so kommt.', 'You could have guessed that it would turn out this way.', "'Ja' – mild reproach (you should have known).", T.g],
  ['Na gut, dann machen wir es eben so, wie du es vorschlägst.', 'All right then, we will just do it the way you suggest.', "'Eben' – reluctant agreement.", T.g],
  ['Sie hat ja recht, aber sie könnte es freundlicher sagen.', "She's right, but she could say it more kindly.", "'Ja' – conceding a point.", T.gf],
  ['Geh doch mal zum Arzt, wenn du dich schon so lange nicht wohl fühlst.', "Go see a doctor if you haven't been feeling well for so long.", "'Doch mal' – emphatic, caring advice.", T.gf],
  ['Was willst du denn damit sagen? Ich verstehe nicht, worauf du hinauswillst.', "What are you trying to say? I don't understand what you're getting at.", "'Denn' – curiosity and slight confusion in a question.", T.g],
]);

// ── Final stats ─────────────────────────────────────────────
console.log(`Added ${totalAdded} new cards. Total: ${deck.length}`);

const finalCounts = {};
deck.forEach(c => { finalCounts[c.grammarNode] = (finalCounts[c.grammarNode] || 0) + 1; });
for (let i = 1; i <= 35; i++) {
  const node = 'node-' + String(i).padStart(2, '0');
  const cnt = finalCounts[node] || 0;
  const mark = cnt < 112 ? ' ❌' : ' ✅';
  console.log(`  ${node}: ${cnt}${mark}`);
}

// Verify no duplicates
const seen = new Set();
let dupes = 0;
for (const c of deck) {
  if (seen.has(c.target)) dupes++;
  seen.add(c.target);
}
console.log(`\nDuplicates: ${dupes}`);

// Quality stats
const words = new Set();
let totalW = 0;
for (const c of deck) {
  const ws = (c.target || '').split(/\s+/).filter(Boolean);
  totalW += ws.length;
  ws.forEach(w => words.add(w.replace(/[.,!?;:""''()––\-…¿¡«»\[\]{}]/g, '').trim().toLowerCase()));
}
console.log(`Unique words: ${words.size}`);
console.log(`Avg words/sentence: ${(totalW / deck.length).toFixed(1)}`);

const tags = { general: 0, travel: 0, work: 0, family: 0 };
deck.forEach(c => (c.tags || []).forEach(t => { if (t in tags) tags[t]++; }));
console.log('Tags:');
for (const [t, v] of Object.entries(tags)) {
  console.log(`  ${t}: ${v} (${(100 * v / deck.length).toFixed(1)}%)`);
}

const tips = deck.filter(c => c.grammar && c.grammar.trim()).length;
console.log(`Grammar tips: ${tips} (${(100 * tips / deck.length).toFixed(1)}%)`);

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
console.log('\nDeck written to', DECK_PATH);
