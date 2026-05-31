#!/usr/bin/env node
/**
 * Expand German and Dutch dictionaries with missing words.
 * - Reads missing words from /tmp/de-missing.json and /tmp/nl-missing.json
 * - Generates IPA via espeak-ng
 * - Uses known translations for top-frequency words
 * - Outputs entries to append to dictionary files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── Known German translations (top ~300+ common words) ───
const DE_TRANSLATIONS = {
  // Frequency 11
  'endlich': { en: 'finally', pos: 'adv' },
  // Frequency 9
  'direkt': { en: 'direct(ly)', pos: 'adv' },
  // Frequency 7
  'kunden': { en: 'customers', pos: 'n', lemma: 'kunde' },
  // Frequency 6
  'gemeinsam': { en: 'together, joint', pos: 'adj' },
  'mindestens': { en: 'at least', pos: 'adv' },
  'gründlich': { en: 'thorough(ly)', pos: 'adj' },
  'schrank': { en: 'cupboard, wardrobe', pos: 'n' },
  // Frequency 5
  'gesamten': { en: 'entire, whole', pos: 'adj', lemma: 'gesamt' },
  'rat': { en: 'advice; council', pos: 'n' },
  'deutlich': { en: 'clear(ly), distinct', pos: 'adj' },
  'hohen': { en: 'high, tall', pos: 'adj', lemma: 'hoch' },
  'antrag': { en: 'application, proposal', pos: 'n' },
  // Frequency 4
  'ordentlich': { en: 'tidy, proper', pos: 'adj' },
  'gemeinsamen': { en: 'joint, shared', pos: 'adj', lemma: 'gemeinsam' },
  'zufrieden': { en: 'satisfied, content', pos: 'adj' },
  'erkältung': { en: 'cold (illness)', pos: 'n' },
  'bestimmt': { en: 'certainly; specific', pos: 'adv' },
  'befindet': { en: 'is located', pos: 'v', lemma: 'befinden' },
  'gewöhnen': { en: 'to get used to', pos: 'v' },
  'team': { en: 'team', pos: 'n' },
  'keller': { en: 'cellar, basement', pos: 'n' },
  'vermieter': { en: 'landlord', pos: 'n' },
  'wesentlich': { en: 'essential(ly)', pos: 'adj' },
  // Frequency 3
  'klassische': { en: 'classical', pos: 'adj', lemma: 'klassisch' },
  'genau': { en: 'exactly, precise', pos: 'adv' },
  'senf': { en: 'mustard', pos: 'n' },
  'herrscht': { en: 'prevails, reigns', pos: 'v', lemma: 'herrschen' },
  'freibad': { en: 'outdoor pool', pos: 'n' },
  'zahlen': { en: 'to pay; numbers', pos: 'v' },
  'begeistert': { en: 'enthusiastic', pos: 'adj' },
  'komplett': { en: 'complete(ly)', pos: 'adj' },
  'satt': { en: 'full (not hungry)', pos: 'adj' },
  'gemälde': { en: 'painting', pos: 'n' },
  'erneuern': { en: 'to renew', pos: 'v' },
  'wanderung': { en: 'hike', pos: 'n' },
  'quartal': { en: 'quarter (of year)', pos: 'n' },
  'verwandten': { en: 'relatives', pos: 'n', lemma: 'verwandte' },
  'wäsche': { en: 'laundry', pos: 'n' },
  'gewitter': { en: 'thunderstorm', pos: 'n' },
  'wanderer': { en: 'hiker', pos: 'n' },
  'kräuter': { en: 'herbs', pos: 'n', lemma: 'kraut' },
  'umziehen': { en: 'to move (house)', pos: 'v' },
  'vorbeikommen': { en: 'to come by, visit', pos: 'v' },
  'mietvertrag': { en: 'rental contract', pos: 'n' },
  'strecke': { en: 'route, stretch', pos: 'n' },
  'bewerben': { en: 'to apply (for job)', pos: 'v' },
  'überzeugt': { en: 'convinced', pos: 'adj' },
  'ausflug': { en: 'excursion, trip', pos: 'n' },
  'schließlich': { en: 'after all, finally', pos: 'adv' },
  'aufräumen': { en: 'to tidy up', pos: 'v' },
  'eintritt': { en: 'entrance, admission', pos: 'n' },
  'verhandlung': { en: 'negotiation', pos: 'n' },
  'vereinbaren': { en: 'to agree on, arrange', pos: 'v' },
  'durchführen': { en: 'to carry out', pos: 'v' },
  'hinsichtlich': { en: 'regarding', pos: 'prep' },
  'stattfinden': { en: 'to take place', pos: 'v' },
  'überrascht': { en: 'surprised', pos: 'adj' },
  'umgebung': { en: 'surroundings', pos: 'n' },
  'verhandlungen': { en: 'negotiations', pos: 'n', lemma: 'verhandlung' },
  'berücksichtigen': { en: 'to consider', pos: 'v' },
  'abteilung': { en: 'department', pos: 'n' },
  'aufgefallen': { en: 'noticed', pos: 'v', lemma: 'auffallen' },
  'hinweis': { en: 'hint, note', pos: 'n' },
  'verantwortung': { en: 'responsibility', pos: 'n' },
  'erfahrungen': { en: 'experiences', pos: 'n', lemma: 'erfahrung' },
  'geräusch': { en: 'noise, sound', pos: 'n' },
  'enttäuscht': { en: 'disappointed', pos: 'adj' },
  'grundsätzlich': { en: 'fundamentally', pos: 'adv' },
  'herausforderung': { en: 'challenge', pos: 'n' },
  'ausnahme': { en: 'exception', pos: 'n' },
  'voraussetzung': { en: 'requirement', pos: 'n' },
  'zusammenarbeit': { en: 'cooperation', pos: 'n' },
  'beeindruckt': { en: 'impressed', pos: 'adj' },
  'offensichtlich': { en: 'obviously', pos: 'adv' },
  'entsprechend': { en: 'corresponding(ly)', pos: 'adj' },
  'vorhaben': { en: 'to intend; plan', pos: 'v' },
  'ausreichend': { en: 'sufficient', pos: 'adj' },
  'nachbarschaft': { en: 'neighbourhood', pos: 'n' },
  'ernährung': { en: 'nutrition, diet', pos: 'n' },
  'übrigens': { en: 'by the way', pos: 'adv' },
  'verlängern': { en: 'to extend, renew', pos: 'v' },
  'genehmigung': { en: 'permission, approval', pos: 'n' },
  'selbstverständlich': { en: 'of course', pos: 'adv' },
  'vorschlag': { en: 'suggestion', pos: 'n' },
  'bemerkt': { en: 'noticed', pos: 'v', lemma: 'bemerken' },
  'beziehung': { en: 'relationship', pos: 'n' },
  'wettbewerb': { en: 'competition', pos: 'n' },
  'einkaufen': { en: 'to shop', pos: 'v' },
  'betrag': { en: 'amount', pos: 'n' },
  'umsatz': { en: 'revenue, turnover', pos: 'n' },
  'einfluss': { en: 'influence', pos: 'n' },
  'tatsächlich': { en: 'actually, indeed', pos: 'adv' },
  'ausstellung': { en: 'exhibition', pos: 'n' },
  'umfrage': { en: 'survey, poll', pos: 'n' },
  'fachleute': { en: 'experts', pos: 'n' },
  'erledigen': { en: 'to take care of', pos: 'v' },
  'sorgfältig': { en: 'careful(ly)', pos: 'adj' },
  'besorgt': { en: 'worried', pos: 'adj' },
  'empfehlung': { en: 'recommendation', pos: 'n' },
  'nachfrage': { en: 'demand; inquiry', pos: 'n' },
  'beiträge': { en: 'contributions', pos: 'n', lemma: 'beitrag' },
  'maßnahmen': { en: 'measures', pos: 'n', lemma: 'maßnahme' },
  'überprüfen': { en: 'to check, verify', pos: 'v' },
  'bedingungen': { en: 'conditions', pos: 'n', lemma: 'bedingung' },
  'ergebnis': { en: 'result', pos: 'n' },
  'rechtzeitig': { en: 'on time, in time', pos: 'adv' },
  'verbesserung': { en: 'improvement', pos: 'n' },
  'versicherung': { en: 'insurance', pos: 'n' },
  'abwechslung': { en: 'variety, change', pos: 'n' },
  'ausgezeichnet': { en: 'excellent', pos: 'adj' },
  'zusammenhang': { en: 'context, connection', pos: 'n' },
  'nötig': { en: 'necessary', pos: 'adj' },
  'einrichtung': { en: 'furnishing; facility', pos: 'n' },
  'angelegenheit': { en: 'matter, affair', pos: 'n' },
  'erheblich': { en: 'considerable', pos: 'adj' },
  'gelegenheit': { en: 'opportunity', pos: 'n' },
  'schließen': { en: 'to close', pos: 'v' },
  'pflicht': { en: 'duty, obligation', pos: 'n' },
  'bereit': { en: 'ready', pos: 'adj' },
  'beitrag': { en: 'contribution', pos: 'n' },
  'beschwerde': { en: 'complaint', pos: 'n' },
  'nachricht': { en: 'message, news', pos: 'n' },
  'bewerbung': { en: 'application (job)', pos: 'n' },
  'angebot': { en: 'offer', pos: 'n' },
  'leistung': { en: 'performance', pos: 'n' },
  'bedarf': { en: 'need, demand', pos: 'n' },
  'herkunft': { en: 'origin', pos: 'n' },
  'bewusst': { en: 'conscious, aware', pos: 'adj' },
  'abschnitt': { en: 'section', pos: 'n' },
  'ankunft': { en: 'arrival', pos: 'n' },
  'beeinflussen': { en: 'to influence', pos: 'v' },
  'grundstück': { en: 'plot (of land)', pos: 'n' },
  'rücksicht': { en: 'consideration', pos: 'n' },
  'dankbar': { en: 'grateful', pos: 'adj' },
  'erledigt': { en: 'done, taken care of', pos: 'adj', lemma: 'erledigen' },
  'mitarbeiter': { en: 'employee', pos: 'n' },
  'bestandteil': { en: 'component', pos: 'n' },
  'verfügbar': { en: 'available', pos: 'adj' },
  'regelmäßig': { en: 'regular(ly)', pos: 'adj' },
  'unterschied': { en: 'difference', pos: 'n' },
  'entfernung': { en: 'distance', pos: 'n' },
  'verfahren': { en: 'procedure; to proceed', pos: 'n' },
  'zahlreiche': { en: 'numerous', pos: 'adj', lemma: 'zahlreich' },
  'dringend': { en: 'urgent(ly)', pos: 'adj' },
  'vorstellen': { en: 'to introduce; imagine', pos: 'v' },
  'auswirkung': { en: 'effect, impact', pos: 'n' },
  'ansicht': { en: 'view, opinion', pos: 'n' },
  'leidenschaft': { en: 'passion', pos: 'n' },
  'handwerker': { en: 'craftsman', pos: 'n' },
  'verwaltung': { en: 'administration', pos: 'n' },
  'gründe': { en: 'reasons', pos: 'n', lemma: 'grund' },
  'reihenfolge': { en: 'order, sequence', pos: 'n' },
  'entscheidung': { en: 'decision', pos: 'n' },
  'eigenschaft': { en: 'quality, property', pos: 'n' },
  'auseinandersetzung': { en: 'dispute', pos: 'n' },
  'allerdings': { en: 'however, admittedly', pos: 'adv' },
  'eindrucksvoll': { en: 'impressive', pos: 'adj' },
  'fortschritt': { en: 'progress', pos: 'n' },
  'entschlossen': { en: 'determined', pos: 'adj' },
  'unterkunft': { en: 'accommodation', pos: 'n' },
  'vertrag': { en: 'contract', pos: 'n' },
  'anmeldung': { en: 'registration', pos: 'n' },
  'sicherheit': { en: 'safety, security', pos: 'n' },
  'durchschnitt': { en: 'average', pos: 'n' },
  'entlang': { en: 'along', pos: 'prep' },
  'verständnis': { en: 'understanding', pos: 'n' },
  'betreuung': { en: 'care, support', pos: 'n' },
  'gerücht': { en: 'rumour', pos: 'n' },
  'gelände': { en: 'terrain, grounds', pos: 'n' },
  'vorhang': { en: 'curtain', pos: 'n' },
  'gegenüber': { en: 'opposite; towards', pos: 'prep' },
  'mittlerweile': { en: 'meanwhile', pos: 'adv' },
  'bürgermeister': { en: 'mayor', pos: 'n' },
  'bescheid': { en: 'notice; answer', pos: 'n' },
  'versprechen': { en: 'to promise', pos: 'v' },
  'ausflüge': { en: 'excursions', pos: 'n', lemma: 'ausflug' },
  'behörde': { en: 'authority (govt)', pos: 'n' },
  'betrieb': { en: 'business, operation', pos: 'n' },
  'einigung': { en: 'agreement', pos: 'n' },
  'wirklich': { en: 'really', pos: 'adv' },
  'praktisch': { en: 'practical(ly)', pos: 'adj' },
  'sämtliche': { en: 'all, every', pos: 'adj' },
  'fähigkeit': { en: 'ability', pos: 'n' },
  'haushalt': { en: 'household; budget', pos: 'n' },
  'feuerwehr': { en: 'fire brigade', pos: 'n' },
  'spaziergang': { en: 'walk, stroll', pos: 'n' },
  'schüssel': { en: 'bowl', pos: 'n' },
  'bestätigen': { en: 'to confirm', pos: 'v' },
  'anstrengend': { en: 'exhausting', pos: 'adj' },
  'gericht': { en: 'court; dish', pos: 'n' },
  'verhalten': { en: 'behaviour', pos: 'n' },
  'angeboten': { en: 'offered', pos: 'v', lemma: 'anbieten' },
  'rückkehr': { en: 'return', pos: 'n' },
  'ergebnis': { en: 'result', pos: 'n' },
  'vernünftig': { en: 'reasonable', pos: 'adj' },
  'vorteil': { en: 'advantage', pos: 'n' },
  'zuverlässig': { en: 'reliable', pos: 'adj' },
  'zuschauer': { en: 'spectator', pos: 'n' },
  'vermeiden': { en: 'to avoid', pos: 'v' },
  'höflich': { en: 'polite', pos: 'adj' },
  'vereinbart': { en: 'agreed', pos: 'adj', lemma: 'vereinbaren' },
  'pflanze': { en: 'plant', pos: 'n' },
  'schwierigkeit': { en: 'difficulty', pos: 'n' },
  'überlegen': { en: 'to consider', pos: 'v' },
  'knoblauch': { en: 'garlic', pos: 'n' },
  'pflegen': { en: 'to care for', pos: 'v' },
  'nachweis': { en: 'proof, evidence', pos: 'n' },
  'anweisung': { en: 'instruction', pos: 'n' },
  'rückgabe': { en: 'return (item)', pos: 'n' },
  'maßnahme': { en: 'measure, action', pos: 'n' },
  'bedingung': { en: 'condition', pos: 'n' },
  'behandlung': { en: 'treatment', pos: 'n' },
  'erzählung': { en: 'story, narrative', pos: 'n' },
  'veranstaltung': { en: 'event', pos: 'n' },
  'mitteilung': { en: 'notification', pos: 'n' },
  'wandern': { en: 'to hike', pos: 'v' },
  'aufmerksam': { en: 'attentive', pos: 'adj' },
  'selbständig': { en: 'independent', pos: 'adj' },
  'verpflichtung': { en: 'obligation', pos: 'n' },
  'verhältnis': { en: 'relationship; ratio', pos: 'n' },
  'stellenangebot': { en: 'job offer', pos: 'n' },
  'einverstanden': { en: 'agreed, OK', pos: 'adj' },
  'voraussichtlich': { en: 'probably, expected', pos: 'adv' },
  'zuständig': { en: 'responsible', pos: 'adj' },
  'hauptsächlich': { en: 'mainly', pos: 'adv' },
  'anlage': { en: 'facility; attachment', pos: 'n' },
  'ermäßigung': { en: 'discount', pos: 'n' },
  'beinahe': { en: 'almost', pos: 'adv' },
  'gelegentlich': { en: 'occasionally', pos: 'adv' },
  'selbstständig': { en: 'self-employed', pos: 'adj' },
  'geschäftsführer': { en: 'managing director', pos: 'n' },
  'vielfältig': { en: 'diverse', pos: 'adj' },
  'nachhilfe': { en: 'tutoring', pos: 'n' },
  'gewöhnlich': { en: 'usually, ordinary', pos: 'adj' },
  'zufällig': { en: 'by chance', pos: 'adv' },
  'stau': { en: 'traffic jam', pos: 'n' },
  'zaun': { en: 'fence', pos: 'n' },
  'brunnen': { en: 'fountain, well', pos: 'n' },
  'kasten': { en: 'box, crate', pos: 'n' },
  'klammer': { en: 'clip, bracket', pos: 'n' },
  'kneipe': { en: 'pub', pos: 'n' },
  'lehre': { en: 'apprenticeship; lesson', pos: 'n' },
  'locker': { en: 'loose, relaxed', pos: 'adj' },
  'mühle': { en: 'mill', pos: 'n' },
  'plötzlich': { en: 'suddenly', pos: 'adv' },
  'reif': { en: 'ripe; mature', pos: 'adj' },
  'ruhig': { en: 'quiet, calm', pos: 'adj' },
  'ständig': { en: 'constantly', pos: 'adv' },
  'tüchtig': { en: 'capable, hard-working', pos: 'adj' },
  'überhaupt': { en: 'at all', pos: 'adv' },
  'ungefähr': { en: 'approximately', pos: 'adv' },
  'vergeblich': { en: 'in vain', pos: 'adv' },
  'vermutlich': { en: 'presumably', pos: 'adv' },
  'wiese': { en: 'meadow', pos: 'n' },
  'absicht': { en: 'intention', pos: 'n' },
  'beamte': { en: 'civil servant', pos: 'n' },
  'feier': { en: 'celebration', pos: 'n' },
  'geländer': { en: 'railing', pos: 'n' },
  'gutschein': { en: 'voucher', pos: 'n' },
  'meldung': { en: 'report, message', pos: 'n' },
  'reihe': { en: 'row, series', pos: 'n' },
  'schaden': { en: 'damage', pos: 'n' },
  'schwung': { en: 'momentum, swing', pos: 'n' },
  'stufe': { en: 'step, level', pos: 'n' },
  'umstand': { en: 'circumstance', pos: 'n' },
  'verein': { en: 'club, association', pos: 'n' },
  'wahrscheinlich': { en: 'probably', pos: 'adv' },
  'werkstatt': { en: 'workshop', pos: 'n' },
  'zeugnis': { en: 'certificate, report', pos: 'n' },
  'zugang': { en: 'access', pos: 'n' },
  'abschluss': { en: 'conclusion; degree', pos: 'n' },
  'aufgabe': { en: 'task', pos: 'n' },
  'bestand': { en: 'stock, inventory', pos: 'n' },
  'bezirk': { en: 'district', pos: 'n' },
  'entwurf': { en: 'draft, design', pos: 'n' },
  'grundlage': { en: 'basis, foundation', pos: 'n' },
  'lebenslauf': { en: 'CV, résumé', pos: 'n' },
  'stimmung': { en: 'mood, atmosphere', pos: 'n' },
  'unterricht': { en: 'lesson, class', pos: 'n' },
  'werkzeug': { en: 'tool', pos: 'n' },
  'zukunft': { en: 'future', pos: 'n' },
  'heizung': { en: 'heating', pos: 'n' },
  'kleidung': { en: 'clothing', pos: 'n' },
  'spende': { en: 'donation', pos: 'n' },
  'verbindung': { en: 'connection', pos: 'n' },
  'verhältnismäßig': { en: 'proportionate(ly)', pos: 'adv' },
  'wahrnehmung': { en: 'perception', pos: 'n' },
  'verspätung': { en: 'delay', pos: 'n' },
  'erholung': { en: 'recovery, relaxation', pos: 'n' },
  'neugierig': { en: 'curious', pos: 'adj' },
  'gelegentlich': { en: 'occasionally', pos: 'adv' },
  'bemerkenswert': { en: 'remarkable', pos: 'adj' },
  'feierlich': { en: 'festive, solemn', pos: 'adj' },
  'grundlegend': { en: 'fundamental', pos: 'adj' },
  'bedürfnis': { en: 'need', pos: 'n' },
  'einladung': { en: 'invitation', pos: 'n' },
  'einzelheiten': { en: 'details', pos: 'n' },
  'erkenntnis': { en: 'insight', pos: 'n' },
  'fachmann': { en: 'expert', pos: 'n' },
  'gemeinschaft': { en: 'community', pos: 'n' },
  'haltung': { en: 'attitude, posture', pos: 'n' },
  'hindernis': { en: 'obstacle', pos: 'n' },
  'knapp': { en: 'scarce, tight', pos: 'adj' },
  'mühe': { en: 'effort', pos: 'n' },
  'obwohl': { en: 'although', pos: 'conj' },
  'unbedingt': { en: 'absolutely', pos: 'adv' },
  'ursprünglich': { en: 'originally', pos: 'adv' },
  'vorwurf': { en: 'accusation', pos: 'n' },
  'zumindest': { en: 'at least', pos: 'adv' },
  'anschließend': { en: 'afterwards', pos: 'adv' },
  'ausschließlich': { en: 'exclusively', pos: 'adv' },
  'geeignet': { en: 'suitable', pos: 'adj' },
  'nachhaltig': { en: 'sustainable', pos: 'adj' },
  'sicherlich': { en: 'certainly', pos: 'adv' },
  'überwiegend': { en: 'predominantly', pos: 'adv' },
  'vergleich': { en: 'comparison', pos: 'n' },
  'zustimmung': { en: 'approval', pos: 'n' },
};

// ─── Known Dutch translations (top ~300+ common words) ───
const NL_TRANSLATIONS = {
  'zaterdag': { en: 'Saturday', pos: 'n' },
  'groenten': { en: 'vegetables', pos: 'n', lemma: 'groente' },
  'gasten': { en: 'guests', pos: 'n', lemma: 'gast' },
  'tijdens': { en: 'during', pos: 'prep' },
  'avondeten': { en: 'dinner', pos: 'n' },
  'sterke': { en: 'strong', pos: 'adj', lemma: 'sterk' },
  'dochter': { en: 'daughter', pos: 'n' },
  'zware': { en: 'heavy', pos: 'adj', lemma: 'zwaar' },
  'allemaal': { en: 'all, everyone', pos: 'pron' },
  'vogels': { en: 'birds', pos: 'n', lemma: 'vogel' },
  'hemel': { en: 'sky, heaven', pos: 'n' },
  'verjaardag': { en: 'birthday', pos: 'n' },
  'recept': { en: 'recipe; prescription', pos: 'n' },
  'bomen': { en: 'trees', pos: 'n', lemma: 'boom' },
  'haven': { en: 'harbour, port', pos: 'n' },
  'later': { en: 'later', pos: 'adv' },
  'doel': { en: 'goal, aim', pos: 'n' },
  'prima': { en: 'great, fine', pos: 'adj' },
  'ophalen': { en: 'to pick up', pos: 'v' },
  'excuses': { en: 'apologies', pos: 'n' },
  'verschillende': { en: 'various, different', pos: 'adj', lemma: 'verschillend' },
  'appartement': { en: 'apartment', pos: 'n' },
  'vanmorgen': { en: 'this morning', pos: 'adv' },
  'rechtsaf': { en: 'turn right', pos: 'adv' },
  'docent': { en: 'teacher, lecturer', pos: 'n' },
  'zoon': { en: 'son', pos: 'n' },
  'vanmiddag': { en: 'this afternoon', pos: 'adv' },
  'fruit': { en: 'fruit', pos: 'n' },
  'systeem': { en: 'system', pos: 'n' },
  'voert': { en: 'carries out', pos: 'v', lemma: 'voeren' },
  'evenement': { en: 'event', pos: 'n' },
  'luchthaven': { en: 'airport', pos: 'n' },
  'bevindt': { en: 'is located', pos: 'v', lemma: 'bevinden' },
  'kort': { en: 'short, brief', pos: 'adj' },
  'woonkamer': { en: 'living room', pos: 'n' },
  'verwacht': { en: 'expects; expected', pos: 'v', lemma: 'verwachten' },
  'midden': { en: 'middle, centre', pos: 'n' },
  'apparaat': { en: 'device, appliance', pos: 'n' },
  'plotseling': { en: 'suddenly', pos: 'adv' },
  'grappig': { en: 'funny', pos: 'adj' },
  'presentatie': { en: 'presentation', pos: 'n' },
  'post': { en: 'mail, post', pos: 'n' },
  'groep': { en: 'group', pos: 'n' },
  'opstaan': { en: 'to get up', pos: 'v' },
  'naartoe': { en: 'to (direction)', pos: 'adv' },
  'wens': { en: 'wish', pos: 'n' },
  'duidelijk': { en: 'clear(ly)', pos: 'adj' },
  'controleert': { en: 'checks', pos: 'v', lemma: 'controleren' },
  'soorten': { en: 'kinds, types', pos: 'n', lemma: 'soort' },
  'werkdag': { en: 'workday', pos: 'n' },
  'waarde': { en: 'value', pos: 'n' },
  'vertraging': { en: 'delay', pos: 'n' },
  'verbeteren': { en: 'to improve', pos: 'v' },
  'klacht': { en: 'complaint', pos: 'n' },
  'meteen': { en: 'immediately', pos: 'adv' },
  'trots': { en: 'proud; pride', pos: 'adj' },
  'oefening': { en: 'exercise', pos: 'n' },
  'zonsondergang': { en: 'sunset', pos: 'n' },
  'schoenen': { en: 'shoes', pos: 'n', lemma: 'schoen' },
  'indrukwekkend': { en: 'impressive', pos: 'adj' },
  'gebouw': { en: 'building', pos: 'n' },
  'geluid': { en: 'sound, noise', pos: 'n' },
  'verhuizen': { en: 'to move (house)', pos: 'v' },
  'toekomst': { en: 'future', pos: 'n' },
  'ervaring': { en: 'experience', pos: 'n' },
  'buurman': { en: 'neighbour (m)', pos: 'n' },
  'ongeluk': { en: 'accident', pos: 'n' },
  'vakantie': { en: 'holiday, vacation', pos: 'n' },
  'gezellig': { en: 'cosy, convivial', pos: 'adj' },
  'maaltijd': { en: 'meal', pos: 'n' },
  'behoorlijk': { en: 'quite, fairly', pos: 'adv' },
  'buurvrouw': { en: 'neighbour (f)', pos: 'n' },
  'onderwijs': { en: 'education', pos: 'n' },
  'afspraak': { en: 'appointment', pos: 'n' },
  'nauwelijks': { en: 'hardly', pos: 'adv' },
  'bijeenkomst': { en: 'meeting, gathering', pos: 'n' },
  'bewolkt': { en: 'cloudy', pos: 'adj' },
  'plezier': { en: 'fun, pleasure', pos: 'n' },
  'ingang': { en: 'entrance', pos: 'n' },
  'vervoer': { en: 'transport', pos: 'n' },
  'sollicitatie': { en: 'job application', pos: 'n' },
  'voorstel': { en: 'proposal', pos: 'n' },
  'teleurgesteld': { en: 'disappointed', pos: 'adj' },
  'klant': { en: 'customer', pos: 'n' },
  'ruimte': { en: 'space, room', pos: 'n' },
  'grens': { en: 'border, limit', pos: 'n' },
  'uitzicht': { en: 'view', pos: 'n' },
  'bijzonder': { en: 'special', pos: 'adj' },
  'verdieping': { en: 'floor, storey', pos: 'n' },
  'veiligheid': { en: 'safety', pos: 'n' },
  'bericht': { en: 'message', pos: 'n' },
  'gebruiken': { en: 'to use', pos: 'v' },
  'ontvangen': { en: 'to receive', pos: 'v' },
  'opvallen': { en: 'to stand out', pos: 'v' },
  'verdelen': { en: 'to divide', pos: 'v' },
  'aanbieden': { en: 'to offer', pos: 'v' },
  'samenwerking': { en: 'cooperation', pos: 'n' },
  'uitgave': { en: 'expenditure; edition', pos: 'n' },
  'gemiddeld': { en: 'average', pos: 'adj' },
  'overleg': { en: 'consultation', pos: 'n' },
  'vergadering': { en: 'meeting', pos: 'n' },
  'uitnodiging': { en: 'invitation', pos: 'n' },
  'keuken': { en: 'kitchen', pos: 'n' },
  'smaak': { en: 'taste', pos: 'n' },
  'gerecht': { en: 'dish (food)', pos: 'n' },
  'kruiden': { en: 'herbs, spices', pos: 'n' },
  'linksaf': { en: 'turn left', pos: 'adv' },
  'landschap': { en: 'landscape', pos: 'n' },
  'wandeling': { en: 'walk, stroll', pos: 'n' },
  'verzoek': { en: 'request', pos: 'n' },
  'eigenlijk': { en: 'actually', pos: 'adv' },
  'geneeskunde': { en: 'medicine (field)', pos: 'n' },
  'huisarts': { en: 'general practitioner', pos: 'n' },
  'griep': { en: 'flu', pos: 'n' },
  'hoesten': { en: 'to cough', pos: 'v' },
  'behandeling': { en: 'treatment', pos: 'n' },
  'gezondheid': { en: 'health', pos: 'n' },
  'onderzoek': { en: 'research; examination', pos: 'n' },
  'geluk': { en: 'happiness; luck', pos: 'n' },
  'verdrietig': { en: 'sad', pos: 'adj' },
  'gelukkig': { en: 'happy; fortunately', pos: 'adj' },
  'teleurstelling': { en: 'disappointment', pos: 'n' },
  'beroep': { en: 'profession', pos: 'n' },
  'collega': { en: 'colleague', pos: 'n' },
  'salaris': { en: 'salary', pos: 'n' },
  'solliciteren': { en: 'to apply (for job)', pos: 'v' },
  'afdeling': { en: 'department', pos: 'n' },
  'opdrachtgever': { en: 'client, commissioner', pos: 'n' },
  'opdracht': { en: 'assignment', pos: 'n' },
  'huurder': { en: 'tenant', pos: 'n' },
  'verhuurder': { en: 'landlord', pos: 'n' },
  'benedenverdieping': { en: 'ground floor', pos: 'n' },
  'schoonmaken': { en: 'to clean', pos: 'v' },
  'verwarming': { en: 'heating', pos: 'n' },
  'onderhoud': { en: 'maintenance', pos: 'n' },
  'verbouwing': { en: 'renovation', pos: 'n' },
  'voorwaarde': { en: 'condition', pos: 'n' },
  'afval': { en: 'waste, rubbish', pos: 'n' },
  'inwoner': { en: 'inhabitant', pos: 'n' },
  'hoofdstad': { en: 'capital city', pos: 'n' },
  'overheid': { en: 'government', pos: 'n' },
  'belasting': { en: 'tax', pos: 'n' },
  'milieuprobleem': { en: 'environmental problem', pos: 'n' },
  'duurzaam': { en: 'sustainable', pos: 'adj' },
  'hernieuwbare': { en: 'renewable', pos: 'adj', lemma: 'hernieuwbaar' },
  'energiebron': { en: 'energy source', pos: 'n' },
  'stroming': { en: 'current, movement', pos: 'n' },
  'bescherming': { en: 'protection', pos: 'n' },
  'weersvoorspelling': { en: 'weather forecast', pos: 'n' },
  'onweer': { en: 'thunderstorm', pos: 'n' },
  'droogte': { en: 'drought', pos: 'n' },
  'overstromingen': { en: 'floods', pos: 'n', lemma: 'overstroming' },
  'temperatuur': { en: 'temperature', pos: 'n' },
  'feestdag': { en: 'holiday (festive)', pos: 'n' },
  'herinnering': { en: 'memory, reminder', pos: 'n' },
  'verrassing': { en: 'surprise', pos: 'n' },
  'versiering': { en: 'decoration', pos: 'n' },
  'schoonouders': { en: 'parents-in-law', pos: 'n' },
  'uitstapje': { en: 'outing', pos: 'n' },
  'vertrouwen': { en: 'to trust; trust', pos: 'v' },
  'waarschuwing': { en: 'warning', pos: 'n' },
  'beleefd': { en: 'polite', pos: 'adj' },
  'uitleg': { en: 'explanation', pos: 'n' },
  'begrip': { en: 'understanding; concept', pos: 'n' },
  'moeite': { en: 'effort, trouble', pos: 'n' },
  'voordeel': { en: 'advantage', pos: 'n' },
  'nadeel': { en: 'disadvantage', pos: 'n' },
  'toestemming': { en: 'permission', pos: 'n' },
  'invloed': { en: 'influence', pos: 'n' },
  'aanbeveling': { en: 'recommendation', pos: 'n' },
  'betrouwbaar': { en: 'reliable', pos: 'adj' },
  'vooruitgang': { en: 'progress', pos: 'n' },
  'vaardigheid': { en: 'skill', pos: 'n' },
  'samenleving': { en: 'society', pos: 'n' },
  'verantwoordelijkheid': { en: 'responsibility', pos: 'n' },
  'geduld': { en: 'patience', pos: 'n' },
  'kleding': { en: 'clothing', pos: 'n' },
  'ontbijt': { en: 'breakfast', pos: 'n' },
  'fietspad': { en: 'cycle path', pos: 'n' },
  'bushalte': { en: 'bus stop', pos: 'n' },
  'snelweg': { en: 'motorway', pos: 'n' },
  'rotonde': { en: 'roundabout', pos: 'n' },
  'voetganger': { en: 'pedestrian', pos: 'n' },
  'stoplicht': { en: 'traffic light', pos: 'n' },
  'zebrapad': { en: 'zebra crossing', pos: 'n' },
  'eenrichtingsverkeer': { en: 'one-way traffic', pos: 'n' },
  'werkgever': { en: 'employer', pos: 'n' },
  'werknemer': { en: 'employee', pos: 'n' },
  'kantoor': { en: 'office', pos: 'n' },
  'bedrijf': { en: 'company', pos: 'n' },
  'omzet': { en: 'turnover, revenue', pos: 'n' },
  'winst': { en: 'profit', pos: 'n' },
  'verlies': { en: 'loss', pos: 'n' },
  'merk': { en: 'brand', pos: 'n' },
  'klantendienst': { en: 'customer service', pos: 'n' },
  'rekening': { en: 'bill; account', pos: 'n' },
  'lening': { en: 'loan', pos: 'n' },
  'spaarrekening': { en: 'savings account', pos: 'n' },
  'dierentuin': { en: 'zoo', pos: 'n' },
  'schouwburg': { en: 'theatre', pos: 'n' },
  'museum': { en: 'museum', pos: 'n' },
  'tentoonstelling': { en: 'exhibition', pos: 'n' },
  'zwembad': { en: 'swimming pool', pos: 'n' },
  'sporthal': { en: 'sports hall', pos: 'n' },
  'huisdier': { en: 'pet', pos: 'n' },
  'dierenarts': { en: 'vet', pos: 'n' },
  'boerderij': { en: 'farm', pos: 'n' },
  'oogst': { en: 'harvest', pos: 'n' },
  'hooi': { en: 'hay', pos: 'n' },
  'weide': { en: 'meadow, pasture', pos: 'n' },
  'struik': { en: 'bush, shrub', pos: 'n' },
  'waarschijnlijk': { en: 'probably', pos: 'adv' },
  'nauwkeurig': { en: 'accurate(ly)', pos: 'adj' },
  'tegenwoordig': { en: 'nowadays', pos: 'adv' },
  'voortdurend': { en: 'continuously', pos: 'adv' },
  'onmiddellijk': { en: 'immediately', pos: 'adv' },
  'uiteraard': { en: 'of course', pos: 'adv' },
  'tenminste': { en: 'at least', pos: 'adv' },
  'weliswaar': { en: 'admittedly', pos: 'adv' },
  'overigens': { en: 'by the way', pos: 'adv' },
  'noodzakelijk': { en: 'necessary', pos: 'adj' },
  'uitgebreid': { en: 'extensive', pos: 'adj' },
  'voldoende': { en: 'sufficient', pos: 'adj' },
  'afwisselend': { en: 'varied', pos: 'adj' },
  'zorgvuldig': { en: 'careful(ly)', pos: 'adv' },
  'grondig': { en: 'thorough(ly)', pos: 'adj' },
  'geleidelijk': { en: 'gradual(ly)', pos: 'adv' },
  'kennelijk': { en: 'apparently', pos: 'adv' },
  'uitstekend': { en: 'excellent', pos: 'adj' },
  'merkwaardig': { en: 'remarkable', pos: 'adj' },
};

function getIPA(word, lang) {
  try {
    const result = execSync(
      `/opt/homebrew/bin/espeak-ng -v ${lang} -q --ipa "${word.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 5000 }
    ).trim();
    return result || '';
  } catch {
    return '';
  }
}

function guessPos(word, lang) {
  // Simple heuristic
  if (lang === 'de') {
    if (word.endsWith('ung') || word.endsWith('heit') || word.endsWith('keit') ||
        word.endsWith('schaft') || word.endsWith('nis') || word.endsWith('tum')) return 'n';
    if (word.endsWith('en') && word.length > 4) return 'v';
    if (word.endsWith('lich') || word.endsWith('ig') || word.endsWith('isch') ||
        word.endsWith('bar') || word.endsWith('sam')) return 'adj';
  }
  if (lang === 'nl') {
    if (word.endsWith('ing') || word.endsWith('heid') || word.endsWith('schap') ||
        word.endsWith('nis') || word.endsWith('ment')) return 'n';
    if (word.endsWith('en') && word.length > 4) return 'v';
    if (word.endsWith('lijk') || word.endsWith('ig') || word.endsWith('isch') ||
        word.endsWith('baar') || word.endsWith('zaam')) return 'adj';
  }
  return 'n'; // default
}

function escapeKey(word) {
  if (word.includes("'")) return `"${word}"`;
  return `'${word}'`;
}

function escapeValue(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function processLanguage(lang, missingFile, translationsMap) {
  const data = JSON.parse(fs.readFileSync(missingFile, 'utf8'));
  console.log(`\n=== ${lang.toUpperCase()} ===`);
  console.log(`Total missing words: ${data.length}`);

  const entries = [];
  let realTranslations = 0;
  let placeholders = 0;
  let ipaFails = 0;
  let batchSize = 50;

  for (let i = 0; i < data.length; i++) {
    const { word, count, context } = data[i];
    if (!word || word.length < 2) continue;

    // Get IPA
    const ipa = getIPA(word, lang);
    if (!ipa) {
      ipaFails++;
    }

    // Get translation
    let en, pos, lemma;
    const known = translationsMap[word];
    if (known) {
      en = known.en;
      pos = known.pos || guessPos(word, lang);
      lemma = known.lemma;
      realTranslations++;
    } else {
      en = '?';
      pos = guessPos(word, lang);
      placeholders++;
    }

    const entry = { word, en, ipa: ipa || '', pos };
    if (lemma) entry.lemma = lemma;
    entries.push(entry);

    if ((i + 1) % 100 === 0) {
      process.stderr.write(`  ${lang}: processed ${i + 1}/${data.length}\n`);
    }
  }

  console.log(`Real translations: ${realTranslations}`);
  console.log(`Placeholders: ${placeholders}`);
  console.log(`IPA failures: ${ipaFails}`);

  // Generate TypeScript lines
  const lines = entries.map(e => {
    const key = escapeKey(e.word);
    let val = `en: '${escapeValue(e.en)}', ipa: '${escapeValue(e.ipa)}', pos: '${e.pos}'`;
    if (e.lemma) val += `, lemma: '${escapeValue(e.lemma)}'`;
    return `  ${key}: { ${val} },`;
  });

  return { entries, lines, realTranslations, placeholders };
}

async function main() {
  const deResult = await processLanguage('de', '/tmp/de-missing.json', DE_TRANSLATIONS);
  const nlResult = await processLanguage('nl', '/tmp/nl-missing.json', NL_TRANSLATIONS);

  // Write output files
  fs.writeFileSync('/tmp/de-dict-entries.txt', deResult.lines.join('\n') + '\n');
  fs.writeFileSync('/tmp/nl-dict-entries.txt', nlResult.lines.join('\n') + '\n');

  console.log('\n=== Summary ===');
  console.log(`DE: ${deResult.lines.length} entries (${deResult.realTranslations} translated, ${deResult.placeholders} placeholder)`);
  console.log(`NL: ${nlResult.lines.length} entries (${nlResult.realTranslations} translated, ${nlResult.placeholders} placeholder)`);
  console.log('\nOutput written to /tmp/de-dict-entries.txt and /tmp/nl-dict-entries.txt');
}

main().catch(console.error);
