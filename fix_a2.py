import json
import random

random.seed(42)

# Load the existing deck
with open("/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/agitated-boyd/src/data/french/a2.json", "r") as f:
    cards = json.load(f)

# Count by node
from collections import Counter
node_counts = Counter(c["grammarNode"] for c in cards)
for node in sorted(node_counts):
    print(f"  {node}: {node_counts[node]} cards")

# Fix 1: Remove the extra card from node-09 (card at ID 1211 which overlaps with node-10)
cards = [c for c in cards if not (c["grammarNode"] == "node-09" and c["id"] == 1211)]

# Fix 2: Remove extra card from node-13 (card at ID 1671 which overlaps with node-14)
cards = [c for c in cards if not (c["grammarNode"] == "node-13" and c["id"] == 1671)]

# Recount
node_counts = Counter(c["grammarNode"] for c in cards)
print("\nAfter removing overlaps:")
for node in sorted(node_counts):
    print(f"  {node}: {node_counts[node]} cards")

# Now we need:
# node-10: 150 - 142 = 8 more cards (IDs 1353-1360)
# node-11: 150 - 144 = 6 more cards (IDs 1505-1510)
# node-15: 200 - 195 = 5 more cards (IDs 1916-1920)

def make_tags():
    extra = []
    if random.random() < 0.52:
        extra.append("travel")
    if random.random() < 0.52:
        extra.append("work")
    if random.random() < 0.52:
        extra.append("family")
    all_extra = ["travel", "work", "family"]
    while len(extra) < 2:
        pick = random.choice(all_extra)
        if pick not in extra:
            extra.append(pick)
    if len(extra) > 3:
        extra = extra[:3]
    return ["general"] + extra

def card(id_num, target, english, node, grammar=None):
    c = {
        "id": id_num,
        "target": target,
        "english": english,
        "audio": f"fr-{id_num}.mp3",
    }
    if grammar:
        c["grammar"] = grammar
    c["tags"] = make_tags()
    c["grammarNode"] = node
    return c

# Additional node-10 cards (IDs 1353-1360)
extra_10 = [
    (1353, "J'ai fait un reve etrange cette nuit.", "I had a strange dream last night."),
    (1354, "Elle a pris la parole pendant la reunion.", "She spoke up during the meeting."),
    (1355, "Nous avons mis nos manteaux avant de sortir.", "We put on our coats before going out."),
    (1356, "Il a vu un spectacle magnifique au theatre.", "He saw a magnificent show at the theater."),
    (1357, "Tu as bu de la tisane avant de dormir ?", "Did you drink herbal tea before sleeping?"),
    (1358, "Ils ont dit au revoir a leurs collegues.", "They said goodbye to their colleagues."),
    (1359, "J'ai ecrit une liste de courses.", "I wrote a shopping list."),
    (1360, "Elle a ouvert les rideaux pour faire entrer la lumiere.", "She opened the curtains to let the light in."),
]

# Additional node-11 cards (IDs 1505-1510)
extra_11 = [
    (1505, "Je preparais le cafe quand tu es arrive.", "I was making coffee when you arrived."),
    (1506, "Il y avait des nuages sombres dans le ciel.", "There were dark clouds in the sky."),
    (1507, "Nous allions souvent a la peche le dimanche.", "We often went fishing on Sundays."),
    (1508, "Elle choisissait toujours les memes vetements.", "She always chose the same clothes."),
    (1509, "Tu pensais vraiment que c'etait possible ?", "Did you really think it was possible?"),
    (1510, "Ils ecoutaient la radio tous les soirs.", "They listened to the radio every evening."),
]

# Additional node-15 cards (IDs 1916-1920)
extra_15 = [
    (1916, "Il me la prete quand j'en ai besoin.", "He lends it to me when I need it."),
    (1917, "Nous les emmenons au cinema ce soir.", "We're taking them to the cinema tonight."),
    (1918, "Elle lui a coupe les cheveux.", "She cut his/her hair."),
    (1919, "J'en ai achete trop.", "I bought too much of it."),
    (1920, "Tu le retrouves apres le travail ?", "Are you meeting him after work?"),
]

# Wait - let me check if these sentences already exist
existing_targets = {c["target"] for c in cards}

# Rewrite extra cards to avoid duplicates
extra_10 = [
    (1353, "J'ai fait un reve vraiment etrange cette nuit.", "I had a really strange dream last night."),
    (1354, "Elle a pris la parole devant tout le monde.", "She spoke up in front of everyone."),
    (1355, "Nous avons mis nos manteaux avant de sortir de la maison.", "We put on our coats before leaving the house."),
    (1356, "Il a vu un spectacle magnifique au grand theatre.", "He saw a magnificent show at the grand theater."),
    (1357, "Tu as bu de la tisane a la camomille ?", "Did you drink chamomile herbal tea?"),
    (1358, "Ils ont dit des choses tres interessantes.", "They said very interesting things."),
    (1359, "J'ai ecrit une longue liste de courses.", "I wrote a long shopping list."),
    (1360, "Elle a ouvert les rideaux pour voir le jardin.", "She opened the curtains to see the garden."),
]

extra_11 = [
    (1505, "Je preparais toujours le cafe a sept heures.", "I always used to make coffee at seven o'clock."),
    (1506, "Il y avait des nuages sombres au-dessus du village.", "There were dark clouds above the village."),
    (1507, "Nous allions souvent a la peche le dimanche matin.", "We often went fishing on Sunday mornings."),
    (1508, "Elle choisissait toujours les memes vetements bleus.", "She always chose the same blue clothes."),
    (1509, "Tu pensais vraiment que c'etait une bonne idee ?", "Did you really think it was a good idea?"),
    (1510, "Ils ecoutaient toujours la radio en voiture.", "They always listened to the radio in the car."),
]

extra_15 = [
    (1916, "Je ne le lui ai jamais reproche.", "I never blamed him/her for it."),
    (1917, "Tu nous les as deja montres.", "You already showed them to us."),
    (1918, "Il en a achete plusieurs au marche.", "He bought several at the market."),
    (1919, "Elle ne m'y a pas accompagnee.", "She didn't go there with me."),
    (1920, "Nous le leur rappellerons demain.", "We'll remind them about it tomorrow."),
]

for id_num, target, english in extra_10:
    cards.append(card(id_num, target, english, "node-10"))

for id_num, target, english in extra_11:
    cards.append(card(id_num, target, english, "node-11"))

for id_num, target, english in extra_15:
    cards.append(card(id_num, target, english, "node-15"))

# Also need to check: the last 5 sentences in node-15 in the original might overlap
# with the extra ones. Let me check node-15 IDs
node15_cards = [c for c in cards if c["grammarNode"] == "node-15"]
node15_ids = sorted([c["id"] for c in node15_cards])
print(f"\nNode-15 IDs range: {node15_ids[0]}-{node15_ids[-1]}, count: {len(node15_ids)}")

# Check for duplicate IDs
all_ids = [c["id"] for c in cards]
id_dupes = [i for i, count in Counter(all_ids).items() if count > 1]
if id_dupes:
    print(f"Duplicate IDs: {id_dupes}")

# Now fix accents throughout all cards
def add_accents(text):
    """Apply French accent corrections to text."""
    # We need to be surgical here - only replace in French target sentences
    # Use word-boundary-aware replacements

    import re

    # Map of words without accents -> with accents
    # We'll apply these as whole-word or context-sensitive replacements

    fixes = [
        # e-acute: most common
        (r'\bmanage\b', 'mangé'),  # past participle, not English "manage"
        (r'\bmange ', 'mangé '),
        (r'\bmange\.', 'mangé.'),
        (r'\barrivee\b', 'arrivée'),
        (r'\barrive\b(?!\s+[ae])', 'arrivé'),  # but not "arrive" present tense
        (r'\betais\b', 'étais'),
        (r'\betait\b', 'était'),
        (r'\betions\b', 'étions'),
        (r'\betiez\b', 'étiez'),
        (r'\betaient\b', 'étaient'),
        (r'\bete\b', 'été'),
        (r'\betes\b', 'êtes'),
        (r'\betre\b', 'être'),
        (r'\bEtre\b', 'Être'),
        (r'\bfete\b', 'fête'),
        (r'\bfetes\b', 'fêtes'),
        (r'\btres\b', 'très'),
        (r'\bapres\b', 'après'),
        (r"apres-midi", "après-midi"),
        (r'\bavant\b', 'avant'),  # no accent needed
        (r'\bderniere\b', 'dernière'),
        (r'\bdernieres\b', 'dernières'),
        (r'\bpremiere\b', 'première'),
        (r'\bpremieres\b', 'premières'),
        (r'\bderriere\b', 'derrière'),
        (r'\briviere\b', 'rivière'),
        (r'\blumiere\b', 'lumière'),
        (r'\blumieres\b', 'lumières'),
        (r'\bmaniere\b', 'manière'),
        (r'\bmatiere\b', 'matière'),
        (r'\bcarriere\b', 'carrière'),
        (r'\bcafetiere\b', 'cafetière'),
        (r'\bbibliotheque\b', 'bibliothèque'),
        (r'\bdeja\b', 'déjà'),
        (r'\bhopital\b', 'hôpital'),
        (r'\bhotel\b', 'hôtel'),
        (r'\bhote\b', 'hôte'),
        (r'\bNoel\b', 'Noël'),
        (r'\bcafe\b', 'café'),
        (r'\bmusee\b', 'musée'),
        (r'\blycee\b', 'lycée'),
        (r'\bmarche\b', 'marché'),
        (r'\bsupermarche\b', 'supermarché'),
        (r'\bmedecin\b', 'médecin'),
        (r'\bmedicament\b', 'médicament'),
        (r'\btelephone\b', 'téléphone'),
        (r'\btelephones\b', 'téléphones'),
        (r'\btelephoner\b', 'téléphoner'),
        (r'\btelephone ', 'téléphone '),
        (r'\btelevision\b', 'télévision'),
        (r'\brepete\b', 'répète'),
        (r'\brepeter\b', 'répéter'),
        (r'\bgeneral\b', 'général'),
        (r'\bgenerale\b', 'générale'),
        (r'\binteressant\b', 'intéressant'),
        (r'\binteressante\b', 'intéressante'),
        (r'\binteressantes\b', 'intéressantes'),
        (r'\bdifferent\b', 'différent'),
        (r'\bdifferente\b', 'différente'),
        (r'\bnecessaire\b', 'nécessaire'),
        (r'\belectrique\b', 'électrique'),
        (r'\belegant\b', 'élégant'),
        (r'\betranger\b', 'étranger'),
        (r'\betrange\b', 'étrange'),
        (r'\becole\b', 'école'),
        (r'\begalement\b', 'également'),
        (r'\bequipe\b', 'équipe'),
        (r'\beverement\b', 'événement'),
        (r'\bevenement\b', 'événement'),
        (r'\beconomise\b', 'économisé'),
        (r'\bepoque\b', 'époque'),
        (r'\becharpe\b', 'écharpe'),
        (r'\betoile\b', 'étoile'),
        (r'\betoiles\b', 'étoiles'),
        (r'\belegante\b', 'élégante'),
        (r'\benergie\b', 'énergie'),
        (r'\benorme\b', 'énorme'),
        (r'\beveille\b', 'éveillé'),
        (r'\beveilles\b', 'éveillés'),
        (r'\becrire\b', 'écrire'),
        (r'\becrit\b', 'écrit'),
        (r'\becrite\b', 'écrite'),
        (r'\becrits\b', 'écrits'),
        (r'\becrites\b', 'écrites'),
        (r'\becouter\b', 'écouter'),
        (r'\becoute\b', 'écouté'),
        (r'\becoutions\b', 'écoutions'),
        (r'\becoutait\b', 'écoutait'),
        (r'\becoutaient\b', 'écoutaient'),
        (r'\becoutons\b', 'écoutons'),
        (r'\becoutais\b', 'écoutais'),
        (r'\betudier\b', 'étudier'),
        (r'\betudie\b', 'étudié'),
        (r'\betudiaient\b', 'étudiaient'),
        (r'\betudions\b', 'étudions'),
        (r'\belu\b', 'élu'),

        # Words with accent grave
        (r'\bla-bas\b', 'là-bas'),
        (r'\bpere\b', 'père'),
        (r'\bmere\b', 'mère'),
        (r'\bfrere\b', 'frère'),
        (r'\bfreres\b', 'frères'),
        (r'\bgrand-mere\b', 'grand-mère'),
        (r'\bgrand-pere\b', 'grand-père'),
        (r'\bgrands-parents\b', 'grands-parents'),
        (r'\bpiece\b', 'pièce'),
        (r'\bpieces\b', 'pièces'),
        (r'\bcolere\b', 'colère'),
        (r'\bmystere\b', 'mystère'),
        (r'\bprobleme\b', 'problème'),
        (r'\bproblemes\b', 'problèmes'),
        (r'\bsysteme\b', 'système'),
        (r'\bcreme\b', 'crème'),

        # Words with cedilla
        (r'\bfrancais\b', 'français'),
        (r'\bfrancaise\b', 'française'),
        (r'\bgarcon\b', 'garçon'),
        (r'\blecon\b', 'leçon'),
        (r'\blecons\b', 'leçons'),
        (r'\bfacon\b', 'façon'),
        (r'\bca\b', 'ça'),
        (r'\bcommence\b', 'commencé'),
        (r'\bcommencait\b', 'commençait'),

        # Past participles ending in -e (from -er verbs)
        (r'\btravaille\b', 'travaillé'),
        (r'\btravaillaient\b', 'travaillaient'),
        (r'\bregarde\b', 'regardé'),
        (r'\bregardaient\b', 'regardaient'),
        (r'\bjoue\b(?=[\s\.])', 'joué'),
        (r'\bjoue au\b', 'joué au'),
        (r'\becoute\b', 'écouté'),
        (r'\bachete\b', 'acheté'),
        (r'\bachetait\b', 'achetait'),
        (r'\bvisite\b', 'visité'),
        (r'\bparle\b', 'parlé'),
        (r'\bprepare\b', 'préparé'),
        (r'\bpreparait\b', 'préparait'),
        (r'\bpreparions\b', 'préparions'),
        (r'\bcherche\b', 'cherché'),
        (r'\bcherchait\b', 'cherchait'),
        (r'\bcherchais\b', 'cherchais'),
        (r'\bcherchaient\b', 'cherchaient'),
        (r'\bcherchions\b', 'cherchions'),
        (r'\bdanse\b', 'dansé'),
        (r'\bdansait\b', 'dansait'),
        (r'\bdansaient\b', 'dansaient'),
        (r'\brentre\b', 'rentré'),
        (r'\brentree\b', 'rentrée'),
        (r'\bchante\b', 'chanté'),
        (r'\bchantait\b', 'chantait'),
        (r'\btermine\b', 'terminé'),
        (r'\btermines\b', 'terminés'),
        (r'\bmontee\b', 'montée'),
        (r'\bnage\b', 'nagé'),
        (r'\bnageais\b', 'nageais'),
        (r'\bnageait\b', 'nageait'),
        (r'\bmarche\b', 'marché'),
        (r'\btrouve\b', 'trouvé'),
        (r'\btrouvee\b', 'trouvée'),
        (r'\btrouvees\b', 'trouvées'),
        (r'\btrouves\b', 'trouvés'),
        (r'\btrouvais\b', 'trouvais'),
        (r'\btrouvait\b', 'trouvait'),
        (r'\bvoyage\b', 'voyagé'),
        (r'\bvoyageait\b', 'voyageait'),
        (r'\bvoyageais\b', 'voyageais'),
        (r'\bvoyageaient\b', 'voyageaient'),
        (r'\bcommence\b', 'commencé'),
        (r'\btombe\b', 'tombé'),
        (r'\btombee\b', 'tombée'),
        (r'\bdejeune\b', 'déjeuné'),
        (r'\bdejeuner\b', 'déjeuner'),
        (r'\bferme\b', 'fermé'),
        (r'\bfermait\b', 'fermait'),
        (r'\bessaye\b', 'essayé'),
        (r'\bessayait\b', 'essayait'),
        (r'\bpasse\b', 'passé'),
        (r'\bpassee\b', 'passée'),
        (r'\bpassaient\b', 'passaient'),
        (r'\bpassions\b', 'passions'),
        (r'\bgagne\b', 'gagné'),
        (r'\bgagnais\b', 'gagnais'),
        (r'\battendu\b', 'attendu'),
        (r'\battendions\b', 'attendions'),
        (r'\battendaient\b', 'attendaient'),
        (r'\bdemande\b', 'demandé'),
        (r'\bdescendu\b', 'descendu'),
        (r'\bdescendue\b', 'descendue'),
        (r'\bdescendues\b', 'descendues'),
        (r'\bdescendais\b', 'descendais'),
        (r'\bpartage\b', 'partagé'),
        (r'\bpartageait\b', 'partageait'),
        (r'\bpartageaient\b', 'partageaient'),
        (r'\brange\b', 'rangé'),
        (r'\brangeait\b', 'rangeait'),
        (r'\brangeais\b', 'rangeais'),
        (r'\brepare\b', 'réparé'),
        (r'\breparais\b', 'réparais'),
        (r'\bentres\b', 'entrés'),
        (r'\bentre\b(?=[\s\.])', 'entré'),
        (r'\bentree\b', 'entrée'),
        (r'\bentrees\b', 'entrées'),
        (r'\boublie\b', 'oublié'),
        (r'\bdonne\b', 'donné'),
        (r'\bdonnee\b', 'donnée'),
        (r'\bdecide\b', 'décidé'),
        (r'\bnettoye\b', 'nettoyé'),
        (r'\bnee\b', 'née'),
        (r'\bnees\b', 'nées'),
        (r'\borganise\b', 'organisé'),
        (r'\borganisaient\b', 'organisaient'),
        (r'\baccepte\b', 'accepté'),
        (r'\bcuisine\b', 'cuisiné'),
        (r'\bcuisinait\b', 'cuisinait'),
        (r'\bsorties\b', 'sorties'),
        (r'\benvoye\b', 'envoyé'),
        (r'\benvoyee\b', 'envoyée'),
        (r'\bporte\b', 'porté'),
        (r'\bportait\b', 'portait'),
        (r'\betudie\b', 'étudié'),
        (r'\bchoisi\b', 'choisi'),
        (r'\bchoisissait\b', 'choisissait'),
        (r'\bchoisissions\b', 'choisissions'),
        (r'\breste\b', 'resté'),
        (r'\brestee\b', 'restée'),
        (r'\brestes\b', 'restés'),
        (r'\brestees\b', 'restées'),
        (r'\brestions\b', 'restions'),
        (r'\breserve\b', 'réservé'),
        (r'\breserve\b', 'réservé'),
        (r'\blave\b', 'lavé'),
        (r'\blavait\b', 'lavait'),
        (r'\bpleure\b', 'pleuré'),
        (r'\bsigne\b', 'signé'),
        (r'\bsignee\b', 'signée'),
        (r'\binvite\b', 'invité'),
        (r'\binvitee\b', 'invitée'),
        (r'\binvites\b', 'invités'),
        (r'\breussi\b', 'réussi'),
        (r'\breussir\b', 'réussir'),
        (r'\bretournee\b', 'retournée'),
        (r'\bretournees\b', 'retournées'),
        (r'\btelephone\b', 'téléphoné'),
        (r'\bdessine\b', 'dessiné'),
        (r'\bdessinait\b', 'dessinait'),
        (r'\bdessinais\b', 'dessinais'),
        (r'\bloue\b', 'loué'),
        (r'\bchange\b', 'changé'),
        (r'\bpense\b', 'pensé'),
        (r'\bpensait\b', 'pensait'),
        (r'\bpensais\b', 'pensais'),
        (r'\bquitte\b', 'quitté'),
        (r'\bappuye\b', 'appuyé'),
        (r'\bverifie\b', 'vérifié'),
        (r'\bverifait\b', 'vérifiait'),
        (r'\badore\b', 'adoré'),
        (r'\badorait\b', 'adorait'),
        (r'\badorions\b', 'adorions'),
        (r'\brempli\b', 'rempli'),
        (r'\bremplissais\b', 'remplissais'),
        (r'\bexplique\b', 'expliqué'),
        (r'\braconte\b', 'raconté'),
        (r'\baime\b', 'aimé'),
        (r'\baimait\b', 'aimait'),
        (r'\baimaient\b', 'aimaient'),
        (r'\bplanifie\b', 'planifié'),
        (r'\bcoupe\b', 'coupé'),
        (r'\bcoupee\b', 'coupée'),
        (r'\brevenue\b', 'revenue'),
        (r'\binstalle\b', 'installé'),
        (r'\binstallee\b', 'installée'),
        (r'\bpropose\b', 'proposé'),
        (r'\bremercie\b', 'remercié'),
        (r'\bdecore\b', 'décoré'),
        (r'\bdecoree\b', 'décorée'),
        (r'\bgare\b', 'garé'),
        (r'\bposte\b', 'posté'),
        (r'\bdiscute\b', 'discuté'),
        (r'\bdiscutions\b', 'discutions'),
        (r'\bdiscutait\b', 'discutait'),
        (r'\bcompte\b', 'compté'),
        (r'\balle\b', 'allé'),
        (r'\ballee\b', 'allée'),
        (r'\balles\b', 'allés'),
        (r'\ballees\b', 'allées'),
        (r'\bpresente\b', 'présenté'),
        (r'\bpousse\b', 'poussé'),
        (r'\bcorrige\b', 'corrigé'),
        (r'\bcorrigee\b', 'corrigée'),
        (r'\bgoute\b', 'goûté'),
        (r'\bgoutait\b', 'goûtait'),
        (r'\bannule\b', 'annulé'),
        (r'\bcompagne\b', 'compagné'),
        (r'\baccompagne\b', 'accompagné'),
        (r'\baccompagnee\b', 'accompagnée'),
        (r'\bconsulte\b', 'consulté'),
        (r'\bdemenage\b', 'déménagé'),
        (r'\bdemenager\b', 'déménager'),
        (r'\bcommande\b', 'commandé'),
        (r'\bcommandee\b', 'commandée'),
        (r'\bimprime\b', 'imprimé'),
        (r'\bimprimee\b', 'imprimée'),

        # Words with circumflex
        (r'\bgateau\b', 'gâteau'),
        (r'\bgateaux\b', 'gâteaux'),
        (r'\bchateaux?\b', 'château'),
        (r'\bpate\b', 'pâté'),
        (r'\bpates\b', 'pâtes'),
        (r'\brale\b', 'râlé'),
        (r'\bcote\b', 'côté'),
        (r'\bcotes\b', 'côtés'),
        (r'\bdrole\b', 'drôle'),
        (r'\brole\b', 'rôle'),
        (r'\bcontrol\b', 'contrôl'),
        (r'\btot\b', 'tôt'),
        (r'\bbientot\b', 'bientôt'),
        (r'\bforet\b', 'forêt'),
        (r'\bpret\b', 'prêt'),
        (r'\bprete\b', 'prêté'),
        (r'\bpretes\b', 'prêtés'),
        (r'\bretee\b', 'prêtée'),
        (r'\barret\b', 'arrêt'),
        (r'\binteret\b', 'intérêt'),
        (r'\bentraine\b', 'entraîne'),
        (r'\bchaine\b', 'chaîne'),
        (r'\bnait\b', 'naît'),
        (r'\bnaitre\b', 'naître'),
        (r'\bconnait\b', 'connaît'),
        (r'\bconnaitre\b', 'connaître'),
        (r'\bconnaissance\b', 'connaissance'),
        (r'\bconnaissait\b', 'connaissait'),
        (r'\bconnaissais\b', 'connaissais'),
        (r'\bapparait\b', 'apparaît'),
        (r'\bile\b', 'île'),

        # troisieme, etc
        (r'\btroisieme\b', 'troisième'),
        (r'\bdeuxieme\b', 'deuxième'),
        (r'\bquatrieme\b', 'quatrième'),

        # Common verbs with accents in stem
        (r'\bprefere\b', 'préféré'),
        (r'\bpreferait\b', 'préférait'),
        (r'\bpreferais\b', 'préférais'),
        (r'\brepond\b', 'répond'),
        (r'\brepondu\b', 'répondu'),
        (r'\breponse\b', 'réponse'),
        (r'\brepete\b', 'répète'),
        (r'\brepeter\b', 'répéter'),
        (r'\breveil\b', 'réveil'),
        (r'\breveillee\b', 'réveillée'),
        (r'\breveille\b', 'réveillé'),
        (r'\breveilles\b', 'réveillés'),
        (r'\brevais\b', 'rêvais'),
        (r'\brevait\b', 'rêvait'),
        (r'\breve\b', 'rêvé'),
        (r'\brevions\b', 'rêvions'),
        (r'\brecemment\b', 'récemment'),
        (r'\brecement\b', 'récemment'),
        (r'\breunion\b', 'réunion'),
        (r'\breunions\b', 'réunions'),
        (r'\bresultat\b', 'résultat'),
        (r'\bresultats\b', 'résultats'),
        (r'\bresolu\b', 'résolu'),
        (r'\brecompense\b', 'récompensé'),
        (r'\brealisateur\b', 'réalisateur'),
        (r'\breserve\b', 'réservé'),
        (r'\breservation\b', 'réservation'),
        (r'\brecette\b', 'recette'),
        (r'\brecettes\b', 'recettes'),
        (r'\brecu\b', 'reçu'),
        (r'\brecue\b', 'reçue'),
        (r'\brechauffee\b', 'réchauffé'),
        (r'\brechauffe\b', 'réchauffé'),
        (r'\breflechir\b', 'réfléchir'),
        (r'\breflechit\b', 'réfléchit'),
        (r'\brevisais\b', 'révisais'),

        # More accent fixes
        (r'\bsoiree\b', 'soirée'),
        (r'\bannee\b', 'année'),
        (r'\bannees\b', 'années'),
        (r'\bjournee\b', 'journée'),
        (r'\bjournees\b', 'journées'),
        (r'\bidee\b', 'idée'),
        (r'\bidees\b', 'idées'),
        (r'\bmatinee\b', 'matinée'),
        (r'\bentree\b', 'entrée'),
        (r'\bentrees\b', 'entrées'),
        (r'\bpensee\b', 'pensée'),
        (r'\bpensees\b', 'pensées'),
        (r'\bmusee\b', 'musée'),
        (r'\bmusees\b', 'musées'),
        (r'\barrivee\b', 'arrivée'),
        (r'\barrivees\b', 'arrivées'),
        (r'\barrives\b', 'arrivés'),
        (r'\barmee\b', 'armée'),

        # cle
        (r'\bcle\b', 'clé'),
        (r'\bcles\b', 'clés'),

        # More common words
        (r'\belegant\b', 'élégant'),
        (r'\bmetro\b', 'métro'),
        (r'\bnumero\b', 'numéro'),
        (r'\bdepartement\b', 'département'),
        (r'\bprecaution\b', 'précaution'),
        (r'\bdesole\b', 'désolé'),
        (r'\boccupe\b', 'occupé'),
        (r'\bsecurite\b', 'sécurité'),
        (r'\bapercu\b', 'aperçu'),
        (r'\baperitif\b', 'apéritif'),
        (r'\bprogres\b', 'progrès'),
        (r'\bsucces\b', 'succès'),
        (r'\bmenage\b', 'ménage'),
        (r'\bprofesseure\b', 'professeure'),
        (r'\bcelebre\b', 'célèbre'),
        (r'\bcelebres\b', 'célèbres'),
        (r'\bcelebre\b', 'célébré'),
        (r'\bverite\b', 'vérité'),
        (r'\bliberte\b', 'liberté'),
        (r'\begalite\b', 'égalité'),
        (r'\bfraternite\b', 'fraternité'),
        (r'\bsociete\b', 'société'),
        (r'\buniversite\b', 'université'),
        (r'\bqualite\b', 'qualité'),
        (r'\bdifficulte\b', 'difficulté'),
        (r'\bverite\b', 'vérité'),
        (r'\bactivite\b', 'activité'),
        (r'\bbeaute\b', 'beauté'),
        (r'\bregle\b', 'règle'),
        (r'\bregles\b', 'règles'),

        # Verb forms
        (r'\bdetestait\b', 'détestait'),
        (r'\bdetester\b', 'détester'),
        (r'\bdeteste\b', 'détesté'),
        (r'\bespere\b', 'espéré'),
        (r'\besperions\b', 'espérions'),
        (r'\bespere\b', 'espéré'),
        (r'\bdeclenche\b', 'déclenché'),
        (r'\bdeclenchee\b', 'déclenchée'),
        (r'\bretenti\b', 'retenti'),
        (r'\brencontre\b', 'rencontré'),
        (r'\brencontree\b', 'rencontrée'),
        (r'\brencontres\b', 'rencontrés'),
        (r'\bdepose\b', 'déposé'),
        (r'\bdeposent\b', 'déposent'),
        (r'\bheritage\b', 'héritage'),
        (r'\bdepeche\b', 'dépêché'),
        (r'\bdepechee\b', 'dépêchée'),
        (r'\bdepechees\b', 'dépêchées'),
        (r'\bdepeches\b', 'dépêches'),
        (r'\binteresse\b', 'intéressé'),
        (r'\binteressee\b', 'intéressée'),
        (r'\bennuye\b', 'ennuyé'),
        (r'\bennuyee\b', 'ennuyée'),
        (r'\binscrit\b', 'inscrit'),
        (r'\binscrite\b', 'inscrite'),
        (r'\binscrites\b', 'inscrites'),
        (r'\bblessee\b', 'blessée'),
        (r'\bblesse\b', 'blessé'),
        (r'\bexcuse\b', 'excusé'),
        (r'\bexcusee\b', 'excusée'),
        (r'\bexcuses\b', 'excusés'),

        # Words with accent on a
        (r'\bla\b(?=[\s,\.])', 'la'),  # no change - article
        (r' a ', ' à '),  # preposition "to/at" - careful!
        (r"^a ", "à "),
        (r" a$", " à"),
        (r'\bdeja\b', 'déjà'),
        (r'\bvoila\b', 'voilà'),

        # Specific phrases
        (r"jusqu'a\b", "jusqu'à"),
        (r"grace a\b", "grâce à"),
        (r"la-bas\b", "là-bas"),
        (r"la-dessus\b", "là-dessus"),

        # crepe
        (r'\bcrepe\b', 'crêpe'),
        (r'\bcrepes\b', 'crêpes'),

        # agee, age
        (r'\bagee\b', 'âgée'),
        (r'\bage\b', 'âge'),

        # legume
        (r'\blegume\b', 'légume'),
        (r'\blegumes\b', 'légumes'),

        # vetement
        (r'\bvetement\b', 'vêtement'),
        (r'\bvetements\b', 'vêtements'),

        # peche
        (r'\bpeche\b', 'pêche'),
        (r'\bpecher\b', 'pêcher'),

        # reve
        (r'\breve\b', 'rêve'),
        (r'\breves\b', 'rêves'),
        (r'\brever\b', 'rêver'),

        # tete
        (r'\btete\b', 'tête'),

        # fenetre
        (r'\bfenetre\b', 'fenêtre'),
        (r'\bfenetres\b', 'fenêtres'),

        # etage
        (r'\betage\b', 'étage'),

        # betise
        (r'\bbetise\b', 'bêtise'),
        (r'\bbetises\b', 'bêtises'),

        # commercant
        (r'\bcommercant\b', 'commerçant'),
        (r'\bcommercants\b', 'commerçants'),

        # canape
        (r'\bcanape\b', 'canapé'),

        # congé
        (r'\bconge\b', 'congé'),
        (r'\bconges\b', 'congés'),

        # coffre-fort
        (r'\bcoffre-fort\b', 'coffre-fort'),

        # cerf
        (r'\bcerf\b', 'cerf'),

        # berceuse
        (r'\bberceuse\b', 'berceuse'),
        (r'\bberceuses\b', 'berceuses'),

        # noel already done
        # soeur
        (r'\bsoeur\b', 'sœur'),
        (r'\bsoeurs\b', 'sœurs'),

        # voeux
        (r'\bvoeux\b', 'vœux'),

        # coeur
        (r'\bcoeur\b', 'cœur'),

        # Specific verb forms with accents
        (r'\bseme\b', 'semé'),
        (r'\bsalue\b', 'salué'),
        (r'\bcasse\b', 'cassé'),
        (r'\bpasse\b', 'passé'),
        (r'\bpasses\b', 'passés'),
        (r'\bpassee\b', 'passée'),
        (r'\bfonde\b', 'fondé'),
        (r'\barrose\b', 'arrosé'),
        (r'\bdistribue\b', 'distribué'),
        (r'\bpese\b', 'pesé'),
        (r'\bfume\b', 'fumé'),
        (r'\bemprunte\b', 'emprunté'),
        (r'\bcreuse\b', 'creusé'),
        (r'\bsouffle\b', 'soufflé'),
        (r'\bnote\b', 'noté'),
        (r'\bcolle\b', 'collé'),
        (r'\bverse\b', 'versé'),
        (r'\bgrille\b', 'grillé'),
        (r'\btaille\b', 'taillé'),
        (r'\bappele\b', 'appelé'),
        (r'\bfilme\b', 'filmé'),
        (r'\bplie\b', 'plié'),
        (r'\bpliee\b', 'pliée'),
        (r'\baccroche\b', 'accroché'),
        (r'\bgarde\b', 'gardé'),
        (r'\bgardait\b', 'gardait'),
        (r'\bconstruit\b', 'construit'),
        (r'\bconstruisaient\b', 'construisaient'),
        (r'\bbrule\b', 'brûlé'),
        (r'\brecette\b', 'recette'),
        (r'\baide\b', 'aidé'),
        (r'\bglisse\b', 'glissé'),
        (r'\bsorti\b', 'sorti'),
        (r'\bsortie\b', 'sortie'),
        (r'\bsortir\b', 'sortir'),
        (r'\bsortaient\b', 'sortaient'),
        (r'\bsortait\b', 'sortait'),

        # profite, celebre
        (r'\bprofite\b', 'profité'),
        (r'\bprofiter\b', 'profiter'),
        (r'\bcelebre\b', 'célébré'),

        # More fixes for common patterns
        (r'\bpeint\b', 'peint'),
        (r'\bpeignait\b', 'peignait'),

        # impressionnee
        (r'\bimpressionnee\b', 'impressionnée'),
        (r'\bimpressionnees\b', 'impressionnées'),
        (r'\bnommee\b', 'nommée'),
        (r'\bsatisfaits\b', 'satisfaits'),

        # repondre, etc already above

        # à la, à le, à l'  - these are very tricky because "a" can be verb or preposition
        # Let me handle this more carefully below
    ]

    for pattern, replacement in fixes:
        text = re.sub(pattern, replacement, text)

    return text

# This regex approach is too error-prone. Let me take a completely different approach.
# I'll just write the final output with proper accents from scratch.

# Actually, the cleanest approach is to just output the JSON and then
# do a careful manual accent pass. But given the volume, let me try
# a simpler approach: fix the most obvious patterns.

# Actually, let me just skip the complex regex and directly fix the JSON
# by replacing specific known unaccented words in the French sentences only.

print(f"\nTotal cards before accent fix: {len(cards)}")

# Sort cards by ID
cards.sort(key=lambda c: c["id"])

# Write without accent fixes first - we'll do a separate accent script
output_path = "/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/agitated-boyd/src/data/french/a2.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(cards, f, ensure_ascii=False, indent=2)

# Verify final counts
node_counts = Counter(c["grammarNode"] for c in cards)
print("\nFinal counts:")
for node in sorted(node_counts):
    print(f"  {node}: {node_counts[node]} cards")
print(f"  Total: {len(cards)}")

# Check ID ranges
for node in sorted(node_counts):
    node_cards = [c for c in cards if c["grammarNode"] == node]
    ids = sorted([c["id"] for c in node_cards])
    print(f"  {node}: IDs {ids[0]}-{ids[-1]}")
